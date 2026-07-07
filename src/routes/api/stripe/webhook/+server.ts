import { error } from '@sveltejs/kit'
import type Stripe from 'stripe'
import { PUBLIC_APP_URL } from '$env/static/public'
import { stripe } from '$lib/server/stripe'
import {
	bookingConfirmationFilename,
	generateBookingConfirmationPdf
} from '$lib/server/booking-confirmation-pdf'
import {
	sendPaymentConfirmationEmail,
	type PaymentEmailType
} from '$lib/server/email'
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private'
import type { RequestHandler } from './$types'
import type { Id } from '$convex/dataModel'
import { api, internal } from '$convex/api'
import { createConvexAdminClient } from '$lib/server/convex-admin'
import { sendRefundEmail } from '$lib/server/email'

const convex = createConvexAdminClient()

function emailTypeFor(
	isFirstPayment: boolean,
	paymentStatus: string
): PaymentEmailType {
	if (paymentStatus === 'paid') return 'fully-paid'
	if (isFirstPayment && paymentStatus === 'deposit_paid') return 'deposit'
	return 'installment'
}

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature')
	if (!signature) error(400, 'Missing stripe-signature header')

	const body = await request.text()

	let event: Stripe.Event
	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			STRIPE_WEBHOOK_SECRET
		)
	} catch (err) {
		error(400, err instanceof Error ? err.message : 'Invalid webhook signature')
	}

	switch (event.type) {
		case 'payment_intent.succeeded': {
			const paymentIntentId = event.data.object.id
			const result = await convex.mutation(
				internal.mutations.applyStripePayment,
				{
					stripePaymentIntentId: paymentIntentId,
					paidAt: Date.now()
				}
			)

			if (result.paymentEmailSentAt) break

			const confirmation = await convex.query(
				api.queries.bookingConfirmationByRef,
				{
					bookingRef: result.bookingRef,
					userId: result.userId
				}
			)

			const recipientEmail =
				confirmation?.profile?.email ?? result.buyerEmail ?? undefined

			if (!confirmation || !recipientEmail) {
				console.warn(
					'Payment confirmation email skipped: missing buyer or crew email'
				)
				break
			}

			const type = emailTypeFor(result.isFirstPayment, result.paymentStatus)
			const paidPaymentRows = confirmation.payments.filter(
				(p) => p.kind !== 'full' && p.stripePaymentIntentId === paymentIntentId
			)
			const fullPaymentRow = confirmation.payments.find(
				(p) => p.kind === 'full' && p.stripePaymentIntentId === paymentIntentId
			)
			const thisPayment = fullPaymentRow ?? paidPaymentRows[0] ?? null
			const thisPaymentLabel = fullPaymentRow
				? fullPaymentRow.label
				: paidPaymentRows.length > 1
					? paidPaymentRows.map((p) => p.label).join(' + ')
					: (thisPayment?.label ?? 'Wpłata')
			const thisPaymentAmount = fullPaymentRow
				? fullPaymentRow.amount
				: paidPaymentRows.reduce((sum, p) => sum + p.amount, 0)

			const remainingPayments = confirmation.payments
				.filter((p) => p.kind !== 'full' && p.status !== 'paid')
				.map((p) => ({ label: p.label, amount: p.amount, dueAt: p.dueAt }))

			const includePdf = type !== 'installment'
			let pdf: Buffer | undefined
			let filename: string | undefined
			if (includePdf) {
				try {
					pdf = await generateBookingConfirmationPdf(confirmation)
					filename = bookingConfirmationFilename(
						confirmation.booking.bookingRef
					)
				} catch (pdfErr) {
					console.error('PDF generation failed:', pdfErr)
				}
			}

			try {
				const sendResult = await sendPaymentConfirmationEmail({
					type,
					to: recipientEmail,
					name: confirmation.profile
						? `${confirmation.profile.firstName} ${confirmation.profile.lastName}`
						: recipientEmail,
					bookingRef: confirmation.booking.bookingRef,
					currency: confirmation.booking.currency ?? 'pln',
					paidAmount: result.paidAmount,
					totalAmount: result.totalAmount,
					thisPaymentLabel,
					thisPaymentAmount,
					remainingPayments,
					panelUrl: `${PUBLIC_APP_URL}/dashboard`,
					guideUrl: `${PUBLIC_APP_URL}/poradnik`,
					...(pdf && filename ? { pdf, filename } : {})
				})
				await convex.mutation(internal.mutations.markPaymentEmailSent, {
					stripePaymentIntentId: paymentIntentId,
					sentAt: Date.now(),
					messageId: sendResult.messageId
				})
				if (result.isFirstPayment && !result.confirmationEmailSentAt) {
					await convex.mutation(internal.mutations.markConfirmationEmailSent, {
						stripePaymentIntentId: paymentIntentId,
						sentAt: Date.now(),
						messageId: sendResult.messageId
					})
				}
			} catch (sendErr) {
				console.error('Payment confirmation email failed:', sendErr)
			}
			break
		}
		case 'charge.refund.updated':
		case 'refund.updated': {
			const refund = event.data.object as Stripe.Refund

			// Skip non-terminal statuses ('pending', 'canceled', 'requires_action')
			if (refund.status !== 'succeeded' && refund.status !== 'failed') break

			const result = await convex.mutation(
				internal.mutations.processStripeRefund,
				{
					stripeRefundId: refund.id,
					refundRowId:
						(refund.metadata?.refundRowId as Id<'refunds'> | undefined) ??
						undefined,
					stripeRefundStatus: refund.status,
					amountRefunded: refund.amount,
					failureReason: refund.failure_reason ?? undefined,
					stripeEventId: event.id,
					eventType: event.type,
					stripeChargeId:
						typeof refund.charge === 'string'
							? refund.charge
							: (refund.charge?.id ?? undefined),
					rawPayload: event
				}
			)
			if (
				result.status === 'processed' &&
				result.refundStatus === 'succeeded'
			) {
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
					console.error('sendRefundEmail (comleted) failed:', emailErr)
				}
			}
			break
		}
		case 'payment_intent.payment_failed':
		case 'payment_intent.canceled':
			await convex.mutation(internal.mutations.cancelBookingPayments, {
				stripePaymentIntentId: event.data.object.id
			})
			// Releases berths only when this PI was the first checkout (booking still pending);
			// no-op for installment failures (booking already confirmed).
			await convex.mutation(internal.mutations.cancelBooking, {
				stripePaymentIntentId: event.data.object.id
			})
			break
	}

	return new Response(null, { status: 200 })
}
