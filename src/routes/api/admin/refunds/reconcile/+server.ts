import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { CRON_SECRET } from '$env/static/private'
import { PUBLIC_APP_URL } from '$env/static/public'
import { stripe } from '$lib/server/stripe'
import { internal, api } from '$convex/api'
import { createConvexAdminClient } from '$lib/server/convex-admin'
import { sendRefundEmail } from '$lib/server/email'

const convex = createConvexAdminClient()
const STALE_MS = 3 * 60 * 1000 // 3 min - daj webhook czas dojść pierwszy

export const GET: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization')
	if (auth !== `Bearer ${CRON_SECRET}`) error(401, 'Unauthorized')

	const stuck = await convex.query(internal.refunds.listStuckPendingRefunds, {
		staleMs: STALE_MS
	})

	let reconciled = 0
	for (const row of stuck) {
		const refund = await stripe.refunds.retrieve(row.stripeRefundId)
		if (refund.status !== 'succeeded' && refund.status != 'failed') continue

		const result = await convex.mutation(
			internal.mutations.processStripeRefund,
			{
				stripeRefundId: refund.id,
				refundRowId: row.refundRowId,
				stripeRefundStatus: refund.status,
				amountRefunded: refund.amount,
				failureReason: refund.failure_reason ?? undefined,
				stripeEventId: `reconcile:${refund.id}:${refund.status}`,
				eventType: 'reconcile',
				stripeChargeId:
					typeof refund.charge === 'string'
						? refund.charge
						: (refund.charge?.id ?? undefined),
				rawPayload: refund
			}
		)

		if (result.status === 'processed' && result.refundStatus === 'succeeded') {
			try {
				const detail = await convex.query(api.admin.bookingDetailById, {
					bookingId: result.bookingId
				})
				if (detail?.buyer.email && refund.amount != null) {
					await sendRefundEmail({
						type: 'completed',
						to: {
							email: detail.buyer.email,
							name: detail.buyer.name ?? undefined
						},
						bookingRef: detail.booking.bookingRef,
						customerName: detail.buyer.name ?? 'Kliencie',
						amount: refund.amount,
						currency: refund.currency ?? 'pln',
						panelUrl: `${PUBLIC_APP_URL}/dashboard`,
						settledAt: Date.now()
					})
				}
			} catch (emailErr) {
				console.error(`sendRefundEmail (reconcile) failed`, emailErr)
			}
		}

		reconciled++
	}

	return json({ checked: stuck.length, reconciled })
}
