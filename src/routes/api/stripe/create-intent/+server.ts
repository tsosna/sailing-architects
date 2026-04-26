import { error, json } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import { stripe } from '$lib/server/stripe'
import { api } from '$convex/api'
import type { RequestHandler } from './$types'

const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL)

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null)
	const { segmentSlug, berthIds, userId } = (body ?? {}) as {
		segmentSlug?: string
		berthIds?: string[]
		userId?: string
	}

	if (
		!segmentSlug ||
		!userId ||
		!Array.isArray(berthIds) ||
		berthIds.length === 0
	) {
		error(400, 'Brakujące pola: segmentSlug, berthIds, userId')
	}

	// Resolve segment for the price
	const segments = await convex.query(api.queries.listSegments)
	const segment = segments.find((s) => s.slug === segmentSlug)
	if (!segment) error(400, `Nieznany etap: ${segmentSlug}`)

	// Generate booking reference
	const bookingRef = `SA-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`

	// Create Stripe PaymentIntent (amount = price per berth × count, in grosze)
	let paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.create>>
	try {
		paymentIntent = await stripe.paymentIntents.create({
			amount: segment.pricePerBerth * berthIds.length * 100,
			currency: 'pln',
			metadata: {
				segmentSlug,
				berthIds: berthIds.join(','),
				userId,
				bookingRef
			}
		})
	} catch (stripeErr) {
		console.error('Stripe error:', stripeErr)
		error(502, 'Błąd inicjalizacji płatności')
	}

	// Create Convex booking — marks all berths as taken (throws if any already taken)
	try {
		await convex.mutation(api.mutations.createBooking, {
			userId,
			segmentSlug,
			berthIds,
			stripePaymentIntentId: paymentIntent.id,
			bookingRef
		})
	} catch (convexErr) {
		// Berth taken / not found — cancel the intent so it's never charged
		await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => null)
		error(
			409,
			convexErr instanceof Error ? convexErr.message : 'Koja niedostępna'
		)
	}

	return json({ clientSecret: paymentIntent.client_secret, bookingRef })
}
