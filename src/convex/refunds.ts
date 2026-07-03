import { v } from 'convex/values'
import { query } from './_generated/server'

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

		// 4. Active policy lookup (może być null)
		const policy = await ctx.db
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
		const sortedTiers = [...policy.tiers].sort(
			(a, b) => b.minDaysBefore - a.minDaysBefore
		)
		const matchedTier =
			sortedTiers.find((t) => daysBeforeDeparture >= t.minDaysBefore) ?? null
		const percent = matchedTier?.refundPercent ?? 0
		const suggestedAmount = Math.floor(availableToRefund * percent)

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
		if (totalAmount <= 0) {
			throw new Error('Total amount must be > 0')
		}
		if (!Number.isInteger(totalAmount)) {
			throw new Error('Total amount must be integer (grosze)')
		}

		// Wszystkie paid payments, sort desc po _creationTime (najnowsze first)
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_booking', (q) => q.eq('bookingId', bookingId))
			.collect()

		const paidPayments = payments
			.filter((p) => p.status === 'paid' && p.stripePaymentIntentId)
			.sort((a, b) => b._creationTime - a._creationTime)

		// Walidacja: czy total mieści się w available
		const totalAvailable = paidPayments.reduce(
			(sum, p) => sum + (p.amount - p.refundedAmount),
			0
		)
		if (totalAmount > totalAvailable) {
			throw new Error(
				`Requested ${totalAmount} exceeds available ${totalAvailable}`
			)
		}

		// Cascade allocation
		let remaining = totalAmount
		const allocation: Array<{
			bookingPaymentId: string
			stripePaymentIntentId: string
			amount: number
			paymentLabel: string
		}> = []

		for (const payment of paidPayments) {
			if (remaining <= 0) break

			const available = payment.amount - payment.refundedAmount
			if (available <= 0) continue

			const allocatedToThisCharge = Math.min(remaining, available)
			allocation.push({
				bookingPaymentId: payment._id,
				stripePaymentIntentId: payment.stripePaymentIntentId!,
				amount: allocatedToThisCharge,
				paymentLabel: payment.label
			})
			remaining -= allocatedToThisCharge
		}

		return {
			allocation,
			totalAllocated: totalAmount - remaining,
			totalAvailable
		}
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
