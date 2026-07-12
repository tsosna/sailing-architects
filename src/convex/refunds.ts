import { v } from 'convex/values'
import { query, internalQuery } from './_generated/server'
import { matchRefundTier } from './_lib/refundTiers'
import { allocateCascade } from './_lib/refundCascade'

export const calculateRefundPolicySuggestion = query({
	args: { bookingId: v.id('bookings') },
	handler: async (ctx, { bookingId }) => {
		// 1. Booking + segment
		const booking = await ctx.db.get(bookingId)
		if (!booking) throw new Error('Booking not found')

		const segment = await ctx.db.get(booking.segmentId)
		if (!segment) throw new Error('Segment not found')

		// 2. Days before departure (clamp do 0 jeśli już minął)
		const now = Date.now()
		const dayMs = 86_400_000
		const daysBeforeDeparture = Math.max(
			0,
			Math.floor((segment.startDate - now) / dayMs)
		)

		// 3. Paid payments + totals
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_booking', (q) => q.eq('bookingId', bookingId))
			.collect()

		const paidPayments = payments.filter((p) => p.status === 'paid')
		const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0)
		const totalAlreadyRefunded = paidPayments.reduce(
			(sum, p) => sum + p.refundedAmount,
			0
		)
		const availableToRefund = totalPaid - totalAlreadyRefunded
		const currency = paidPayments[0]?.currency ?? 'pln'

		// 4. Policy: snapshot z bookingu (zamrozenie przy zakupie) -> fallback na zywą (stare bookingi)
		const snapshot = booking.refundPolicySnapshot
		const policy = snapshot
			? {
					_id: snapshot.policyId,
					name: snapshot.policyName,
					tiers: snapshot.tiers
				}
			: await ctx.db
					.query('refundPolicies')
					.withIndex('by_is_active', (q) => q.eq('isActive', true))
					.first()

		if (!policy) {
			return {
				suggestedPercent: null,
				suggestedAmount: null,
				daysBeforeDeparture,
				policyName: null,
				policyId: null,
				totalPaid,
				availableToRefund,
				currency,
				matchedTier: null
			}
		}

		// 5. Match tier: highest minDaysBefore gdzie days >= min

		const { matchedTier, percent, suggestedAmount } = matchRefundTier({
			tiers: policy.tiers,
			daysBeforeDeparture,
			availableToRefund
		})

		return {
			suggestedPercent: percent,
			suggestedAmount,
			daysBeforeDeparture,
			policyName: policy.name,
			policyId: policy._id,
			totalPaid,
			availableToRefund,
			currency,
			matchedTier
		}
	}
})

export const allocateRefundCascade = query({
	args: {
		bookingId: v.id('bookings'),
		totalAmount: v.number()
	},
	handler: async (ctx, { bookingId, totalAmount }) => {
		// Wszystkie paid payments, sort desc po _creationTime (najnowsze first)
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_booking', (q) => q.eq('bookingId', bookingId))
			.collect()

		return allocateCascade({ payments, totalAmount })
	}
})

export const getActiveRefundPolicy = query({
	args: {},
	handler: async (ctx) => {
		const policy = await ctx.db
			.query('refundPolicies')
			.withIndex('by_is_active', (q) => q.eq('isActive', true))
			.first()
		return { policy }
	}
})

export const listStuckPendingRefunds = internalQuery({
	args: { staleMs: v.number() },
	handler: async (ctx, { staleMs }) => {
		const cutoff = Date.now() - staleMs
		const pending = await ctx.db
			.query('refunds')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.collect()
		return pending
			.filter((r) => r._creationTime < cutoff && r.stripeRefundId !== undefined)
			.map((r) => ({
				refundRowId: r._id,
				stripeRefundId: r.stripeRefundId!,
				bookingId: r.bookingId
			}))
	}
})
