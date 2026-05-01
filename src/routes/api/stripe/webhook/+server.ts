import { error } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import type Stripe from 'stripe'
import { PUBLIC_APP_URL, PUBLIC_CONVEX_URL } from '$env/static/public'
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
import { api } from '$convex/api'
import type { RequestHandler } from './$types'

const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL)

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
			const result = await convex.mutation(api.mutations.applyStripePayment, {
				stripePaymentIntentId: paymentIntentId,
				paidAt: Date.now()
			})

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
					...(pdf && filename ? { pdf, filename } : {})
				})
				await convex.mutation(api.mutations.markPaymentEmailSent, {
					stripePaymentIntentId: paymentIntentId,
					sentAt: Date.now(),
					messageId: sendResult.messageId
				})
				if (result.isFirstPayment && !result.confirmationEmailSentAt) {
					await convex.mutation(api.mutations.markConfirmationEmailSent, {
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
		case 'payment_intent.payment_failed':
		case 'payment_intent.canceled':
			await convex.mutation(api.mutations.cancelBookingPayments, {
				stripePaymentIntentId: event.data.object.id
			})
			// Releases berths only when this PI was the first checkout (booking still pending);
			// no-op for installment failures (booking already confirmed).
			await convex.mutation(api.mutations.cancelBooking, {
				stripePaymentIntentId: event.data.object.id
			})
			break
	}

	return new Response(null, { status: 200 })
}
