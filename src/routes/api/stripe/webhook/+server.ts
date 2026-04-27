import { error } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import type Stripe from 'stripe'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import { stripe } from '$lib/server/stripe'
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
		case 'payment_intent.succeeded':
			await convex.mutation(api.mutations.confirmBooking, {
				stripePaymentIntentId: event.data.object.id,
				paidAt: Date.now()
			})
			break
		case 'payment_intent.payment_failed':
		case 'payment_intent.canceled':
			await convex.mutation(api.mutations.cancelBooking, {
				stripePaymentIntentId: event.data.object.id
			})
			break
	}

	return new Response(null, { status: 200 })
}
