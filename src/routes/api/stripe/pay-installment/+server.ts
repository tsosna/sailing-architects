import { json } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import { stripe } from '$lib/server/stripe'
import { api } from '$convex/api'
import type { Id } from '$convex/dataModel'
import type { RequestHandler } from './$types'

const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL)
const OPERATION_TIMEOUT_MS = 15000

function timeoutError(label: string): Promise<never> {
	return new Promise((_, reject) => {
		setTimeout(() => {
			reject(new Error(`${label} timeout`))
		}, OPERATION_TIMEOUT_MS)
	})
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
	return Promise.race([promise, timeoutError(label)])
}

function apiError(status: number, message: string) {
	return json({ message }, { status })
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null)
	const { userId, bookingId, paymentIds, buyerEmail } = (body ?? {}) as {
		userId?: string
		bookingId?: string
		paymentIds?: string[]
		buyerEmail?: string
	}

	if (
		!userId ||
		!bookingId ||
		!Array.isArray(paymentIds) ||
		paymentIds.length === 0
	) {
		return apiError(400, 'Brakujące pola: userId, bookingId, paymentIds')
	}

	const payments = await withTimeout(
		convex.query(api.queries.bookingPaymentsByBooking, {
			userId,
			bookingId: bookingId as Id<'bookings'>
		}),
		'Convex bookingPaymentsByBooking'
	).catch((err) => {
		console.error('Convex query error:', err)
		return null
	})
	if (!payments) return apiError(502, 'Błąd połączenia z bazą rezerwacji')

	const selected = payments.filter((p) => paymentIds.includes(p._id))
	if (selected.length !== paymentIds.length) {
		return apiError(
			404,
			'Płatność nie istnieje lub nie należy do tej rezerwacji'
		)
	}
	for (const p of selected) {
		if (p.status === 'paid') {
			return apiError(409, `Płatność "${p.label}" jest już opłacona`)
		}
		if (p.status === 'processing') {
			return apiError(409, `Płatność "${p.label}" jest obecnie przetwarzana`)
		}
	}
	const amount = selected.reduce((sum, p) => sum + p.amount, 0)
	if (amount <= 0)
		return apiError(400, 'Kwota płatności musi być większa od zera')
	const currency = selected[0].currency

	let paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.create>>
	try {
		paymentIntent = await stripe.paymentIntents.create(
			{
				amount,
				currency,
				metadata: {
					bookingId,
					userId,
					paymentIds: paymentIds.join(','),
					...(buyerEmail ? { buyerEmail } : {})
				}
			},
			{ timeout: OPERATION_TIMEOUT_MS }
		)
	} catch (stripeErr) {
		console.error('Stripe error:', stripeErr)
		return apiError(502, 'Błąd inicjalizacji płatności w Stripe')
	}

	try {
		await convex.mutation(api.mutations.markBookingPaymentsProcessing, {
			userId,
			bookingId: bookingId as Id<'bookings'>,
			paymentIds: paymentIds as Id<'bookingPayments'>[],
			stripePaymentIntentId: paymentIntent.id
		})
	} catch (convexErr) {
		console.error('markBookingPaymentsProcessing error:', convexErr)
		await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => null)
		return apiError(
			500,
			convexErr instanceof Error ? convexErr.message : 'Błąd zapisu płatności'
		)
	}

	return json({
		clientSecret: paymentIntent.client_secret,
		amount,
		currency
	})
}
