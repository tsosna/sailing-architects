import type { RequestHandler } from './$types'
import { stripe } from '$lib/server/stripe'
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private'
import { error } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature')
	if (!signature) error(400, 'Missing stripe-signature header')

	const body = await request.text()

	let event: ReturnType<typeof stripe.webhooks.constructEvent> extends Promise<infer T> ? T : ReturnType<typeof stripe.webhooks.constructEvent>
	try {
		event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
	} catch {
		error(400, 'Invalid webhook signature')
	}

	switch (event.type) {
		case 'payment_intent.succeeded':
			// TODO: mark booking as paid in Convex
			break
		case 'payment_intent.payment_failed':
			// TODO: mark booking as failed in Convex
			break
	}

	return new Response(null, { status: 200 })
}
