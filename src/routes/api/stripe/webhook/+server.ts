import { error } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import type Stripe from 'stripe'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import { stripe } from '$lib/server/stripe'
import {
	bookingConfirmationFilename,
	generateBookingConfirmationPdf
} from '$lib/server/booking-confirmation-pdf'
import { sendBookingConfirmationEmail } from '$lib/server/email'
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private'
import { api } from '$convex/api'
import type { RequestHandler } from './$types'

const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL)

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
			const result = await convex.mutation(api.mutations.applyStripePayment, {
				stripePaymentIntentId: event.data.object.id,
				paidAt: Date.now()
			})
			if (result.isFirstPayment && !result.confirmationEmailSentAt) {
				const confirmation = await convex.query(
					api.queries.bookingConfirmationByRef,
					{
						bookingRef: result.bookingRef,
						userId: result.userId
					}
				)

				const recipientEmail =
					confirmation?.profile?.email ?? result.buyerEmail ?? undefined

				if (confirmation && recipientEmail) {
					try {
						const pdf = await generateBookingConfirmationPdf(confirmation)
						const sendResult = await sendBookingConfirmationEmail({
							to: recipientEmail,
							name: confirmation.profile
								? `${confirmation.profile.firstName} ${confirmation.profile.lastName}`
								: recipientEmail,
							bookingRef: confirmation.booking.bookingRef,
							pdf,
							filename: bookingConfirmationFilename(
								confirmation.booking.bookingRef
							)
						})
						await convex.mutation(api.mutations.markConfirmationEmailSent, {
							stripePaymentIntentId: event.data.object.id,
							sentAt: Date.now(),
							messageId: sendResult.messageId
						})
					} catch (err) {
						console.error('Booking confirmation email failed:', err)
					}
				} else {
					console.warn(
						'Booking confirmation email skipped: missing buyer or crew email'
					)
				}
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
