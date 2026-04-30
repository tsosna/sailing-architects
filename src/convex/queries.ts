import { query } from './_generated/server'
import { v } from 'convex/values'

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

		const now = Date.now()
		return berths
			.filter((b) => {
				if (b.status === 'available') return false
				if (b.status !== 'held') return true
				return typeof b.holdExpiresAt === 'number' && b.holdExpiresAt > now
			})
			.map((b) => ({ berthId: b.berthId, status: b.status }))
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
		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.order('desc')
			.first()
		if (!booking) return null

		const segment = await ctx.db.get(booking.segmentId)
		const berthDocs = await Promise.all(
			booking.berthIds.map((id) => ctx.db.get(id))
		)
		const participants = await ctx.db
			.query('bookingParticipants')
			.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
			.collect()
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
			.collect()
		const berths = berthDocs.filter(
			(b): b is NonNullable<typeof b> => b !== null
		)
		return {
			...booking,
			segment,
			berths,
			participants,
			payments: payments.sort((a, b) => a.sortOrder - b.sortOrder)
		}
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

/** Booking confirmation payload for PDF generation. */
export const bookingConfirmationByRef = query({
	args: { bookingRef: v.string(), userId: v.string() },
	handler: async (ctx, { bookingRef, userId }) => {
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
		const berths = berthDocs.filter(
			(b): b is NonNullable<typeof b> => b !== null
		)

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
