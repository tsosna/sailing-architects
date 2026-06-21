import { json } from '@sveltejs/kit'
import { stripe } from '$lib/server/stripe'
import { createConvexAdminClient } from '$lib/server/convex-admin'
import { requireAdmin } from '$lib/server/admin-guard'
import { api, internal } from '$convex/api'
import type { RequestHandler } from './$types'
import type { Id } from '$convex/dataModel'

const convex = createConvexAdminClient()

function apiError(status: number, message: string) {
	return json({ message }, { status })
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const admin = await requireAdmin(locals)

	const body = await request.json().catch(() => null)
	const { bookingId, totalAmount, releaseBerth, reason } = (body ?? {}) as {
		bookingId?: string
		totalAmount?: number
		releaseBerth?: boolean
		reason?: string
	}

	if (
		!bookingId ||
		typeof totalAmount !== 'number' ||
		!Number.isInteger(totalAmount) ||
		totalAmount <= 0 ||
		typeof releaseBerth !== 'boolean'
	) {
		return apiError(
			400,
			'Brakujące lub niepoprawne pola: bookingId, totalAmount (integer grosze > 0), releaseBerth'
		)
	}

	const bookingIdT = bookingId as Id<'bookings'>

	const suggestion = await convex.query(
		api.refunds.calculateRefundPolicySuggestion,
		{ bookingId: bookingIdT }
	)

	if (suggestion.availableToRefund <= 0) {
		return apiError(400, 'Brak dostępnych środków do zwrotu')
	}

	if (totalAmount > suggestion.availableToRefund) {
		return apiError(
			400,
			`Kwota ${totalAmount} przekracza dostępne ${suggestion.availableToRefund}`
		)
	}

	const allocationResult = await convex.query(
		api.refunds.allocateRefundCascade,
		{ bookingId: bookingIdT, totalAmount }
	)

	if (allocationResult.allocation.length === 0) {
		return apiError(400, 'Brak pasujących charges do alokacji')
	}

	const refundBatchId = crypto.randomUUID()

	const refundResults: Array<{
		refundId: Id<'refunds'>
		stripeRefundId: string
	}> = []

	for (const entry of allocationResult.allocation) {
		const refundId = await convex.mutation(
			internal.mutations.insertPendingRefundRow,
			{
				bookingId: bookingIdT,
				bookingPaymentId: entry.bookingPaymentId as Id<'bookingPayments'>,
				refundBatchId,
				amountRequested: entry.amount,
				currency: suggestion.currency,
				initiatedByAdminId: admin.userId,
				initiatedOutsideApp: false,
				policySnapshot: suggestion.policyId
					? {
							suggestedPercent: suggestion.suggestedPercent!,
							suggestedAmount: suggestion.suggestedAmount!,
							daysBeforeDeparture: suggestion.daysBeforeDeparture,
							policyName: suggestion.policyName!,
							policyId: suggestion.policyId
						}
					: undefined,
				releaseBerth
			}
		)

		let stripeRefund: Awaited<ReturnType<typeof stripe.refunds.create>>
		try {
			stripeRefund = await stripe.refunds.create(
				{
					payment_intent: entry.stripePaymentIntentId,
					amount: entry.amount,
					metadata: {
						refundBatchId,
						bookingId,
						refundRowId: refundId
					}
				},
				{
					idempotencyKey: `${refundBatchId}:${entry.stripePaymentIntentId}`
				}
			)
		} catch (stripeErr) {
			console.error('Stripe refunds.create error:', stripeErr)
			return apiError(502, 'Błąd Stripe przy tworzeniu refundu')
		}

		const chargeId =
			typeof stripeRefund.charge === 'string'
				? stripeRefund.charge
				: stripeRefund.charge?.id
		if (!chargeId) {
			return apiError(500, 'Stripe nie zwrócił chargeId')
		}

		await convex.mutation(internal.mutations.updateRefundWithStripeId, {
			refundId,
			stripeRefundId: stripeRefund.id,
			stripeChargeId: chargeId
		})
		refundResults.push({ refundId, stripeRefundId: stripeRefund.id })
	}

	await convex.mutation(internal.mutations.insertAdminAuditLog, {
		adminUserId: admin.userId,
		action: 'refund_initiated',
		bookingId: bookingIdT,
		metadata: {
			refundBatchId,
			totalAmount,
			releaseBerth,
			reason: reason ?? null,
			refundIds: refundResults.map((r) => r.refundId),
			stripeRefundIds: refundResults.map((r) => r.stripeRefundId)
		}
	})

	return json({
		ok: true,
		refundBatchId,
		refundIds: refundResults.map((r) => r.refundId),
		stripeRefundIds: refundResults.map((r) => r.stripeRefundId)
	})
}
