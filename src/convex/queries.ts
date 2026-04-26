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

		return berths
			.filter((b) => b.status !== 'available')
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

/**
 * Latest booking for a user, enriched with segment data.
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
		return { ...booking, segment }
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
