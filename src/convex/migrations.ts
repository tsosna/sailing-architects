import { Migrations } from '@convex-dev/migrations'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'

export const migrations = new Migrations<DataModel>(components.migrations)
export const run = migrations.runner()

export const backfillRefundedAmount = migrations.define({
	table: 'bookingPayments',
	migrateOne: (_ctx, payment) => {
		if (payment.refundedAmount === undefined) {
			return { refundedAmount: 0 }
		}
	}
})

export const cancelPaymentsOfRefundedBookings = migrations.define({
	table: 'bookingPayments',
	migrateOne: async (ctx, payment) => {
		if (payment.status === 'paid' || payment.status === 'cancelled') return
		const booking = await ctx.db.get(payment.bookingId)
		if (booking?.paymentStatus !== 'refunded') return

		return { status: 'cancelled' as const, updatedAt: Date.now() }
	}
})
