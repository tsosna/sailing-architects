import { internalQuery, query, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { isBookingClosed } from './_lib/bookingClosed'
import { isBerthFree } from './_lib/berthFree'

/** All voyage segments — for landing segment picker and booking page. */
export const listSegments = query({
	args: {},
	handler: async (ctx) => {
		return ctx.db.query('voyageSegments').collect()
	}
})

/**
 * Status of all non-available berths for a segment (by slug).
 * Returns { berthId, status }[] — cabins-section converts to Map for BoatPlan.
 */
export const berthStatusesBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first()
		if (!segment) return []

		const berths = await ctx.db
			.query('berths')
			.withIndex('by_segment', (q) => q.eq('segmentId', segment._id))
			.collect()

		const identity = await ctx.auth.getUserIdentity()
		let myHoldIntents = new Set<string | undefined>()

		if (identity) {
			const bookings = await ctx.db
				.query('bookings')
				.withIndex('by_user', (q) => q.eq('userId', identity.subject))
				.collect()

			myHoldIntents = new Set(
				bookings
					.filter((b) => b.status === 'pending')
					.map((b) => b.stripePaymentIntentId)
			)
		}

		const now = Date.now()
		return berths
			.filter((b) => !isBerthFree(b, now))
			.map((b) => ({
				berthId: b.berthId,
				status: b.status,
				heldByMe:
					b.holdPaymentIntentId !== undefined &&
					myHoldIntents.has(b.holdPaymentIntentId)
			}))
	}
})

/**
 * All berths for a segment with full details (for admin panel).
 */
export const allBerthsBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first()
		if (!segment) return []

		return ctx.db
			.query('berths')
			.withIndex('by_segment', (q) => q.eq('segmentId', segment._id))
			.collect()
	}
})

export const listBerthAvailability = query({
	args: {},
	handler: async (ctx) => {
		const now = Date.now()

		const segments = await ctx.db.query('voyageSegments').collect()

		const result = []

		for (const segment of segments) {
			const berths = await ctx.db
				.query('berths')
				.withIndex('by_segment', (q) => q.eq('segmentId', segment._id))
				.collect()

			const free = berths.filter((b) => isBerthFree(b, now)).length

			result.push({ slug: segment.slug, free })
		}

		return result
	}
})

/** Active payment plan for a segment, with plan items sorted for admin/checkout. */
export const activePaymentPlanBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first()
		if (!segment) return null

		const plan = await ctx.db
			.query('paymentPlans')
			.withIndex('by_segment_and_is_active', (q) =>
				q.eq('segmentId', segment._id).eq('isActive', true)
			)
			.first()
		if (!plan) return null

		const items = await ctx.db
			.query('paymentPlanItems')
			.withIndex('by_plan', (q) => q.eq('planId', plan._id))
			.collect()

		return { ...plan, items: items.sort((a, b) => a.sortOrder - b.sortOrder) }
	}
})

/**
 * Latest booking for a user, enriched with segment data and resolved berths.
 * Used on the dashboard.
 */
export const bookingByUser = query({
	args: { userId: v.string() },
	handler: async (ctx, { userId }) => {
		const bookings = await ctx.db
			.query('bookings')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.order('desc')
			.collect()

		const confirmed = bookings.filter((b) => b.status === 'confirmed')

		return Promise.all(
			confirmed.map(async (booking) => {
				const segment = await ctx.db.get(booking.segmentId)
				const berthDocs = await Promise.all(
					booking.berthIds.map((id) => ctx.db.get(id))
				)
				const [participants, payments] = await Promise.all([
					ctx.db
						.query('bookingParticipants')
						.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
						.collect(),
					ctx.db
						.query('bookingPayments')
						.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
						.collect()
				])
				const berths = berthDocs.filter(
					(b): b is NonNullable<typeof b> => b !== null
				)
				return {
					...booking,
					segment,
					berths,
					participants,
					payments: payments.sort((a, b) => a.sortOrder - b.sortOrder),
					closed: isBookingClosed(booking, berths)
				}
			})
		)
	}
})

/** Payment schedule assigned to a booking. */
export const bookingPaymentsByBooking = query({
	args: { userId: v.string(), bookingId: v.id('bookings') },
	handler: async (ctx, { userId, bookingId }) => {
		const booking = await ctx.db.get(bookingId)
		const buyerUserId = booking?.buyerUserId ?? booking?.userId
		if (!booking || buyerUserId !== userId) return []

		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_booking', (q) => q.eq('bookingId', bookingId))
			.collect()

		return payments.sort((a, b) => a.sortOrder - b.sortOrder)
	}
})

/**
 * Participants assigned to a booking.
 * The buyer/account owner can edit these records from the dashboard.
 */
export const bookingParticipantsByBooking = query({
	args: { userId: v.string(), bookingId: v.id('bookings') },
	handler: async (ctx, { userId, bookingId }) => {
		const booking = await ctx.db.get(bookingId)
		const buyerUserId = booking?.buyerUserId ?? booking?.userId
		if (!booking || buyerUserId !== userId) return []

		return ctx.db
			.query('bookingParticipants')
			.withIndex('by_booking', (q) => q.eq('bookingId', bookingId))
			.collect()
	}
})

async function loadBookingConfirmation(
	ctx: QueryCtx,
	bookingRef: string,
	userId: string
) {
	const booking = await ctx.db
		.query('bookings')
		.withIndex('by_booking_ref', (q) => q.eq('bookingRef', bookingRef))
		.first()
	if (!booking || booking.userId !== userId) return null

	const [segment, profile] = await Promise.all([
		ctx.db.get(booking.segmentId),
		ctx.db
			.query('crewProfiles')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.first()
	])
	const berthDocs = await Promise.all(
		booking.berthIds.map((id) => ctx.db.get(id))
	)
	const berths = berthDocs.filter((b): b is NonNullable<typeof b> => b !== null)

	const payments = await ctx.db
		.query('bookingPayments')
		.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
		.collect()

	return {
		booking,
		segment,
		profile,
		berths,
		payments: payments.sort((a, b) => a.sortOrder - b.sortOrder)
	}
}

export const bookingConfirmationByRefInternal = internalQuery({
	args: { bookingRef: v.string(), userId: v.string() },
	handler: async (ctx, { bookingRef, userId }) => {
		return await loadBookingConfirmation(ctx, bookingRef, userId)
	}
})

/** Booking confirmation payload for PDF generation. */
export const bookingConfirmationByRef = query({
	args: { bookingRef: v.string() },
	handler: async (ctx, { bookingRef }) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error('Unauthorized: brak sesji')
		}
		return await loadBookingConfirmation(ctx, bookingRef, identity.subject)
	}
})

/**
 * Crew profile for a user.
 * Used on the dashboard + Step 2 prefill.
 */
export const crewProfileByUser = query({
	args: { userId: v.string() },
	handler: async (ctx, { userId }) => {
		return ctx.db
			.query('crewProfiles')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.first()
	}
})
