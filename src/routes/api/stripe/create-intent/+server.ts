import { json } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import { stripe } from '$lib/server/stripe'
import { api } from '$convex/api'
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

type ScheduleRow = { sortOrder: number; kind: string; amount: number }

/**
 * Project the bookingPayments schedule for an upcoming booking, mirroring the
 * insert order in `createBookingPaymentSchedule` in src/convex/mutations.ts.
 * Used to compute the Stripe PI amount before the booking exists.
 */
function projectSchedule(
	pricePerBerthPln: number,
	berthCount: number,
	plan: {
		allowFullPayment: boolean
		items: ReadonlyArray<{
			kind: string
			amountPerBerth: number
			sortOrder: number
		}>
	} | null
): ScheduleRow[] {
	const totalAmount = pricePerBerthPln * berthCount * 100
	if (!plan) {
		return [{ sortOrder: 1, kind: 'full', amount: totalAmount }]
	}

	const items = [...plan.items].sort((a, b) => a.sortOrder - b.sortOrder)
	const rows: ScheduleRow[] = items.map((item) => ({
		sortOrder: item.sortOrder,
		kind: item.kind,
		amount: item.amountPerBerth * berthCount
	}))

	if (plan.allowFullPayment) {
		rows.push({ sortOrder: 0, kind: 'full', amount: totalAmount })
	}

	const scheduledAmount = items.reduce(
		(sum, item) => sum + item.amountPerBerth * berthCount,
		0
	)
	if (scheduledAmount !== totalAmount && items.length > 0) {
		rows.push({
			sortOrder: items.length + 1,
			kind: 'balance',
			amount: Math.max(0, totalAmount - scheduledAmount)
		})
	}

	return rows
}

/**
 * Validate the selected sortOrders form a payable subset of the schedule:
 *  - a single `full` row (sortOrder 0 in plans, or the lone row when no plan), or
 *  - a consecutive prefix [1..k] of plan items by sortOrder.
 */
function validateSelection(
	schedule: ReadonlyArray<ScheduleRow>,
	selectedSortOrders: number[]
): { ok: true; amount: number } | { ok: false; message: string } {
	if (selectedSortOrders.length === 0) {
		return { ok: false, message: 'Nie wybrano żadnej płatności' }
	}
	const unique = Array.from(new Set(selectedSortOrders)).sort((a, b) => a - b)
	if (unique.length !== selectedSortOrders.length) {
		return { ok: false, message: 'Duplikaty w wyborze płatności' }
	}
	const fullRow = schedule.find(
		(r) => r.kind === 'full' && unique.length === 1 && unique[0] === r.sortOrder
	)
	if (fullRow) {
		return { ok: true, amount: fullRow.amount }
	}

	const matched = unique.map((so) =>
		schedule.find((r) => r.sortOrder === so && r.kind !== 'full')
	)
	if (matched.some((m) => !m)) {
		return { ok: false, message: 'Nieprawidłowy wybór płatności' }
	}

	const isPrefix = unique.every((so, idx) => so === idx + 1)
	if (!isPrefix) {
		return {
			ok: false,
			message: 'Wybór musi obejmować raty od pierwszej, bez pomijania'
		}
	}

	const amount = matched.reduce((sum, p) => sum + (p?.amount ?? 0), 0)
	return { ok: true, amount }
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null)
	const { segmentSlug, berthIds, userId, buyerEmail, selectedSortOrders } =
		(body ?? {}) as {
			segmentSlug?: string
			berthIds?: string[]
			userId?: string
			buyerEmail?: string
			selectedSortOrders?: number[]
		}

	if (
		!segmentSlug ||
		!userId ||
		!Array.isArray(berthIds) ||
		berthIds.length === 0 ||
		!Array.isArray(selectedSortOrders) ||
		selectedSortOrders.length === 0
	) {
		return apiError(
			400,
			'Brakujące pola: segmentSlug, berthIds, userId, selectedSortOrders'
		)
	}

	const [segments, plan] = await Promise.all([
		withTimeout(
			convex.query(api.queries.listSegments),
			'Convex listSegments'
		).catch((err) => {
			console.error('Convex listSegments error:', err)
			return null
		}),
		withTimeout(
			convex.query(api.queries.activePaymentPlanBySlug, { slug: segmentSlug }),
			'Convex activePaymentPlanBySlug'
		).catch((err) => {
			console.error('Convex activePaymentPlanBySlug error:', err)
			return null
		})
	])
	if (!segments) return apiError(502, 'Błąd połączenia z bazą rezerwacji')

	const segment = segments.find((s) => s.slug === segmentSlug)
	if (!segment) return apiError(400, `Nieznany etap: ${segmentSlug}`)

	const schedule = projectSchedule(
		segment.pricePerBerth,
		berthIds.length,
		plan ?? null
	)
	const validation = validateSelection(schedule, selectedSortOrders)
	if (!validation.ok) return apiError(400, validation.message)

	const bookingRef = `SA-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`
	const currency = plan?.currency ?? 'pln'

	let paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.create>>
	try {
		paymentIntent = await stripe.paymentIntents.create(
			{
				amount: validation.amount,
				currency,
				metadata: {
					segmentSlug,
					berthIds: berthIds.join(','),
					userId,
					...(buyerEmail ? { buyerEmail } : {}),
					bookingRef,
					selectedSortOrders: selectedSortOrders.join(',')
				}
			},
			{ timeout: OPERATION_TIMEOUT_MS }
		)
	} catch (stripeErr) {
		console.error('Stripe error:', stripeErr)
		return apiError(502, 'Błąd inicjalizacji płatności w Stripe')
	}

	let bookingResult: Awaited<
		ReturnType<typeof convex.mutation<typeof api.mutations.createBooking>>
	>
	try {
		bookingResult = await withTimeout(
			convex.mutation(api.mutations.createBooking, {
				userId,
				...(buyerEmail ? { buyerEmail } : {}),
				segmentSlug,
				berthIds,
				stripePaymentIntentId: paymentIntent.id,
				bookingRef
			}),
			'Convex createBooking'
		)
	} catch (convexErr) {
		await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => null)
		return apiError(
			409,
			convexErr instanceof Error ? convexErr.message : 'Koja niedostępna'
		)
	}

	const selectedPaymentIds = bookingResult.payments
		.filter((p) => selectedSortOrders.includes(p.sortOrder))
		.map((p) => p._id)

	if (selectedPaymentIds.length !== selectedSortOrders.length) {
		await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => null)
		await convex
			.mutation(api.mutations.cancelBooking, {
				stripePaymentIntentId: paymentIntent.id
			})
			.catch(() => null)
		return apiError(500, 'Niespójność harmonogramu z wyborem płatności')
	}

	try {
		await convex.mutation(api.mutations.markBookingPaymentsProcessing, {
			userId,
			bookingId: bookingResult.bookingId,
			paymentIds: selectedPaymentIds,
			stripePaymentIntentId: paymentIntent.id
		})
	} catch (convexErr) {
		console.error('markBookingPaymentsProcessing error:', convexErr)
		await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => null)
		await convex
			.mutation(api.mutations.cancelBooking, {
				stripePaymentIntentId: paymentIntent.id
			})
			.catch(() => null)
		return apiError(
			500,
			convexErr instanceof Error ? convexErr.message : 'Błąd zapisu płatności'
		)
	}

	return json({
		clientSecret: paymentIntent.client_secret,
		bookingRef,
		holdExpiresAt: bookingResult.holdExpiresAt,
		amount: validation.amount,
		currency
	})
}
