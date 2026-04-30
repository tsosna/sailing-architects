import { mutation } from './_generated/server'
import { v } from 'convex/values'

/** Save or update crew profile for a user (booking Step 2). */
export const upsertCrewProfile = mutation({
	args: {
		userId: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		dateOfBirth: v.string(),
		nationality: v.string(),
		phone: v.string(),
		docType: v.union(v.literal('passport'), v.literal('id')),
		docNumber: v.string(),
		emergencyContactName: v.string(),
		emergencyContactPhone: v.string(),
		swimmingAbility: v.string(),
		sailingExperience: v.string(),
		dietaryRequirements: v.optional(v.string()),
		medicalNotes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('crewProfiles')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.first()

		if (existing) {
			await ctx.db.patch(existing._id, args)
			return existing._id
		}
		return ctx.db.insert('crewProfiles', args)
	}
})

/**
 * Create a pending booking and immediately mark all berths as taken.
 * Called server-side from /api/stripe/create-intent after the PaymentIntent is created.
 * Throws if any berth is already taken (race condition guard) — entire booking aborts.
 */
export const createBooking = mutation({
	args: {
		userId: v.string(),
		segmentSlug: v.string(),
		berthIds: v.array(v.string()),
		stripePaymentIntentId: v.string(),
		bookingRef: v.string()
	},
	handler: async (ctx, args) => {
		if (args.berthIds.length === 0)
			throw new Error('Wybierz przynajmniej jedną koję')

		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', args.segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${args.segmentSlug}`)

		const resolved = []
		for (const berthId of args.berthIds) {
			const berth = await ctx.db
				.query('berths')
				.withIndex('by_segment_berth', (q) =>
					q.eq('segmentId', segment._id).eq('berthId', berthId)
				)
				.first()
			if (!berth) throw new Error(`Berth not found: ${berthId}`)
			if (berth.status !== 'available')
				throw new Error(`Koja ${berthId} jest już zajęta`)
			resolved.push(berth)
		}

		// Atomic: mark all berths taken before inserting booking
		for (const berth of resolved) {
			await ctx.db.patch(berth._id, { status: 'taken' })
		}

		return ctx.db.insert('bookings', {
			userId: args.userId,
			berthIds: resolved.map((b) => b._id),
			segmentId: segment._id,
			status: 'pending',
			stripePaymentIntentId: args.stripePaymentIntentId,
			bookingRef: args.bookingRef
		})
	}
})

/** Confirm booking after successful Stripe payment (called from webhook). */
export const confirmBooking = mutation({
	args: {
		stripePaymentIntentId: v.string(),
		paidAt: v.number()
	},
	handler: async (ctx, { stripePaymentIntentId, paidAt }) => {
		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_payment_intent', (q) =>
				q.eq('stripePaymentIntentId', stripePaymentIntentId)
			)
			.first()
		if (!booking) throw new Error('Booking not found')
		await ctx.db.patch(booking._id, { status: 'confirmed', paidAt })
	}
})

/** Admin: reserve a berth complimentary (no payment). Throws if berth is not available. */
export const reserveComplimentary = mutation({
	args: {
		segmentSlug: v.string(),
		berthId: v.string(),
		guestName: v.string(),
		note: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', args.segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${args.segmentSlug}`)

		const berth = await ctx.db
			.query('berths')
			.withIndex('by_segment_berth', (q) =>
				q.eq('segmentId', segment._id).eq('berthId', args.berthId)
			)
			.first()
		if (!berth) throw new Error(`Berth not found: ${args.berthId}`)
		if (berth.status !== 'available') throw new Error('Koja niedostępna')

		await ctx.db.patch(berth._id, {
			status: 'complimentary',
			guestName: args.guestName,
			note: args.note
		})
	}
})

/** Admin: release a complimentary berth back to available. Captain berths cannot be cancelled. */
export const cancelAdminBooking = mutation({
	args: { segmentSlug: v.string(), berthId: v.string() },
	handler: async (ctx, args) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', args.segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${args.segmentSlug}`)

		const berth = await ctx.db
			.query('berths')
			.withIndex('by_segment_berth', (q) =>
				q.eq('segmentId', segment._id).eq('berthId', args.berthId)
			)
			.first()
		if (!berth) throw new Error(`Berth not found: ${args.berthId}`)
		if (berth.status !== 'complimentary')
			throw new Error('Można anulować tylko rezerwacje bezpłatne')

		await ctx.db.patch(berth._id, {
			status: 'available',
			guestName: undefined,
			note: undefined
		})
	}
})

/**
 * One-time migration: set C1 to captain on all existing segments.
 * Run from Convex dashboard after schema deploy.
 */
export const migrateCaptainBerths = mutation({
	args: {},
	handler: async (ctx) => {
		const segments = await ctx.db.query('voyageSegments').collect()
		let updated = 0
		for (const segment of segments) {
			const berth = await ctx.db
				.query('berths')
				.withIndex('by_segment_berth', (q) =>
					q.eq('segmentId', segment._id).eq('berthId', 'C1')
				)
				.first()
			if (berth && berth.status === 'available') {
				await ctx.db.patch(berth._id, { status: 'captain' })
				updated++
			}
		}
		return { updated }
	}
})

/** Release all berths and cancel booking on failed/cancelled payment (called from webhook). */
export const cancelBooking = mutation({
	args: { stripePaymentIntentId: v.string() },
	handler: async (ctx, { stripePaymentIntentId }) => {
		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_payment_intent', (q) =>
				q.eq('stripePaymentIntentId', stripePaymentIntentId)
			)
			.first()
		if (!booking) return

		for (const berthId of booking.berthIds) {
			await ctx.db.patch(berthId, { status: 'available' })
		}
		await ctx.db.patch(booking._id, { status: 'cancelled' })
	}
})
