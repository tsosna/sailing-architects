import { internalMutation, mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { v } from 'convex/values'

const HOLD_DURATION_MS = 15 * 60 * 1000
const DEFAULT_CURRENCY = 'pln'
const PARTICIPANT_REQUIRED_FIELDS = [
	'firstName',
	'lastName',
	'email',
	'dateOfBirth',
	'birthPlace',
	'nationality',
	'phone',
	'docType',
	'docNumber',
	'emergencyContactName',
	'emergencyContactPhone',
	'swimmingAbility',
	'sailingExperience'
] as const

const participantProfileArgs = {
	invitedEmail: v.optional(v.string()),
	firstName: v.optional(v.string()),
	lastName: v.optional(v.string()),
	email: v.optional(v.string()),
	dateOfBirth: v.optional(v.string()),
	birthPlace: v.optional(v.string()),
	nationality: v.optional(v.string()),
	phone: v.optional(v.string()),
	docType: v.optional(v.union(v.literal('passport'), v.literal('id'))),
	docNumber: v.optional(v.string()),
	emergencyContactName: v.optional(v.string()),
	emergencyContactPhone: v.optional(v.string()),
	swimmingAbility: v.optional(v.string()),
	sailingExperience: v.optional(v.string()),
	dietaryRequirements: v.optional(v.string()),
	medicalNotes: v.optional(v.string())
}

const paymentPlanItemArgs = v.object({
	label: v.string(),
	kind: v.union(
		v.literal('deposit'),
		v.literal('installment'),
		v.literal('balance'),
		v.literal('full'),
		v.literal('custom')
	),
	amountPerBerth: v.number(),
	dueAt: v.optional(v.number()),
	sortOrder: v.number()
})

type ParticipantPatch = Partial<
	Record<(typeof PARTICIPANT_REQUIRED_FIELDS)[number], string>
> & {
	invitedEmail?: string
	dietaryRequirements?: string
	medicalNotes?: string
}

function hasText(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0
}

function participantDataStatus(
	data: ParticipantPatch
): 'missing' | 'incomplete' | 'complete' {
	const hasAnyData = Object.values(data).some(hasText)
	if (!hasAnyData) return 'missing'

	return PARTICIPANT_REQUIRED_FIELDS.every((field) => hasText(data[field]))
		? 'complete'
		: 'incomplete'
}

function bookingPaymentStatus(
	paidAmount: number,
	totalAmount: number,
	hasDepositPaid: boolean
): 'unpaid' | 'deposit_paid' | 'partially_paid' | 'paid' {
	if (paidAmount >= totalAmount) return 'paid'
	if (hasDepositPaid) return 'deposit_paid'
	if (paidAmount > 0) return 'partially_paid'
	return 'unpaid'
}

async function refreshBookingPaymentTotals(
	ctx: MutationCtx,
	booking: Doc<'bookings'>
) {
	const payments = await ctx.db
		.query('bookingPayments')
		.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
		.collect()
	const fullPayment = payments.find(
		(payment) => payment.kind === 'full' && payment.status === 'paid'
	)
	const totalAmount =
		booking.totalAmount ??
		payments.reduce((sum, payment) => {
			if (payment.kind === 'full') return sum
			return sum + payment.amount
		}, 0)
	const paidAmount = fullPayment
		? totalAmount
		: payments.reduce((sum, payment) => {
				if (payment.kind === 'full' || payment.status !== 'paid') return sum
				return sum + payment.amount
			}, 0)
	const hasDepositPaid = payments.some(
		(payment) => payment.kind === 'deposit' && payment.status === 'paid'
	)
	const paymentStatus = bookingPaymentStatus(
		paidAmount,
		totalAmount,
		hasDepositPaid
	)

	await ctx.db.patch(booking._id, {
		totalAmount,
		paidAmount,
		paymentStatus
	})

	return { totalAmount, paidAmount, paymentStatus }
}

async function activePaymentPlan(
	ctx: MutationCtx,
	segmentId: Id<'voyageSegments'>
): Promise<Doc<'paymentPlans'> | null> {
	return ctx.db
		.query('paymentPlans')
		.withIndex('by_segment_and_is_active', (q) =>
			q.eq('segmentId', segmentId).eq('isActive', true)
		)
		.first()
}

async function createBookingPaymentSchedule({
	ctx,
	bookingId,
	buyerUserId,
	segment,
	berthCount
}: {
	ctx: MutationCtx
	bookingId: Id<'bookings'>
	buyerUserId: string
	segment: Doc<'voyageSegments'>
	berthCount: number
}) {
	const now = Date.now()
	const totalAmount = segment.pricePerBerth * berthCount * 100
	const plan = await activePaymentPlan(ctx, segment._id)
	const currency = plan?.currency ?? DEFAULT_CURRENCY
	const inserted: Id<'bookingPayments'>[] = []

	if (!plan) {
		const id = await ctx.db.insert('bookingPayments', {
			bookingId,
			buyerUserId,
			segmentId: segment._id,
			label: 'Całość',
			kind: 'full',
			amount: totalAmount,
			currency,
			sortOrder: 1,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			reminderCount: 0
		})
		inserted.push(id)

		return { totalAmount, currency, paymentIds: inserted }
	}

	const items = await ctx.db
		.query('paymentPlanItems')
		.withIndex('by_plan', (q) => q.eq('planId', plan._id))
		.collect()
	const sortedItems = items.sort((a, b) => a.sortOrder - b.sortOrder)
	let scheduledAmount = 0

	for (const item of sortedItems) {
		const amount = item.amountPerBerth * berthCount
		scheduledAmount += amount
		const id = await ctx.db.insert('bookingPayments', {
			bookingId,
			buyerUserId,
			segmentId: segment._id,
			paymentPlanId: plan._id,
			paymentPlanItemId: item._id,
			label: item.label,
			kind: item.kind,
			amount,
			currency,
			dueAt: item.dueAt,
			sortOrder: item.sortOrder,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			reminderCount: 0
		})
		inserted.push(id)
	}

	if (plan.allowFullPayment) {
		const id = await ctx.db.insert('bookingPayments', {
			bookingId,
			buyerUserId,
			segmentId: segment._id,
			paymentPlanId: plan._id,
			label: 'Całość',
			kind: 'full',
			amount: totalAmount,
			currency,
			sortOrder: 0,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			reminderCount: 0
		})
		inserted.push(id)
	}

	if (scheduledAmount !== totalAmount && sortedItems.length > 0) {
		const id = await ctx.db.insert('bookingPayments', {
			bookingId,
			buyerUserId,
			segmentId: segment._id,
			paymentPlanId: plan._id,
			label: 'Dopłata końcowa',
			kind: 'balance',
			amount: Math.max(0, totalAmount - scheduledAmount),
			currency,
			sortOrder: sortedItems.length + 1,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			reminderCount: 0
		})
		inserted.push(id)
	}

	return { totalAmount, currency, paymentIds: inserted }
}

/** Save or update crew profile for a user (booking Step 2). */
export const upsertCrewProfile = mutation({
	args: {
		userId: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		dateOfBirth: v.string(),
		birthPlace: v.string(),
		nationality: v.string(),
		phone: v.string(),
		docType: v.union(v.literal('passport'), v.literal('id')),
		docNumber: v.string(),
		emergencyContactName: v.string(),
		emergencyContactPhone: v.string(),
		swimmingAbility: v.string(),
		sailingExperience: v.string(),
		dietaryRequirements: v.optional(v.string()),
		medicalNotes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('crewProfiles')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.first()

		if (existing) {
			await ctx.db.patch(existing._id, args)
			return existing._id
		}
		return ctx.db.insert('crewProfiles', args)
	}
})

/** Admin: configure an active payment plan for a voyage segment. */
export const upsertSegmentPaymentPlan = mutation({
	args: {
		segmentSlug: v.string(),
		name: v.string(),
		currency: v.optional(v.string()),
		allowFullPayment: v.boolean(),
		items: v.array(paymentPlanItemArgs)
	},
	handler: async (ctx, args) => {
		if (!args.allowFullPayment && args.items.length === 0) {
			throw new Error('Plan płatności musi mieć raty albo płatność całości')
		}

		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', args.segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${args.segmentSlug}`)

		const segmentPricePerBerth = segment.pricePerBerth * 100
		const scheduledAmountPerBerth = args.items.reduce(
			(sum, item) => sum + item.amountPerBerth,
			0
		)
		if (scheduledAmountPerBerth > segmentPricePerBerth) {
			throw new Error('Suma rat na miejsce nie może przekraczać ceny miejsca')
		}

		for (const item of args.items) {
			if (item.amountPerBerth <= 0) {
				throw new Error(
					`Kwota pozycji "${item.label}" musi być większa od zera`
				)
			}
		}

		const now = Date.now()
		const activePlans = await ctx.db
			.query('paymentPlans')
			.withIndex('by_segment_and_is_active', (q) =>
				q.eq('segmentId', segment._id).eq('isActive', true)
			)
			.collect()

		for (const plan of activePlans) {
			await ctx.db.patch(plan._id, { isActive: false, updatedAt: now })
		}

		const planId = await ctx.db.insert('paymentPlans', {
			segmentId: segment._id,
			name: args.name,
			currency: args.currency ?? DEFAULT_CURRENCY,
			isActive: true,
			allowFullPayment: args.allowFullPayment,
			createdAt: now,
			updatedAt: now
		})

		for (const item of args.items) {
			await ctx.db.insert('paymentPlanItems', {
				planId,
				segmentId: segment._id,
				label: item.label,
				kind: item.kind,
				amountPerBerth: item.amountPerBerth,
				dueAt: item.dueAt,
				sortOrder: item.sortOrder
			})
		}

		return { planId, itemCount: args.items.length }
	}
})

/**
 * Create a pending booking and temporarily hold all berths.
 * Called server-side from /api/stripe/create-intent after the PaymentIntent is created.
 * Throws if any berth is unavailable (race condition guard) — entire booking aborts.
 */
export const createBooking = mutation({
	args: {
		userId: v.string(),
		buyerEmail: v.optional(v.string()),
		segmentSlug: v.string(),
		berthIds: v.array(v.string()),
		stripePaymentIntentId: v.string(),
		bookingRef: v.string()
	},
	handler: async (ctx, args) => {
		if (args.berthIds.length === 0)
			throw new Error('Wybierz przynajmniej jedną koję')

		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', args.segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${args.segmentSlug}`)

		const now = Date.now()
		const holdExpiresAt = now + HOLD_DURATION_MS
		const resolved = []
		for (const berthId of args.berthIds) {
			const berth = await ctx.db
				.query('berths')
				.withIndex('by_segment_berth', (q) =>
					q.eq('segmentId', segment._id).eq('berthId', berthId)
				)
				.first()
			if (!berth) throw new Error(`Berth not found: ${berthId}`)
			const expiredHold =
				berth.status === 'held' &&
				typeof berth.holdExpiresAt === 'number' &&
				berth.holdExpiresAt <= now
			if (berth.status !== 'available' && !expiredHold)
				throw new Error(`Koja ${berthId} jest już zajęta`)
			resolved.push(berth)
		}

		const bookingId = await ctx.db.insert('bookings', {
			userId: args.userId,
			buyerUserId: args.userId,
			buyerEmail: args.buyerEmail,
			berthIds: resolved.map((b) => b._id),
			segmentId: segment._id,
			status: 'pending',
			stripePaymentIntentId: args.stripePaymentIntentId,
			holdExpiresAt,
			paidAmount: 0,
			paymentStatus: 'unpaid',
			bookingRef: args.bookingRef
		})

		const paymentSchedule = await createBookingPaymentSchedule({
			ctx,
			bookingId,
			buyerUserId: args.userId,
			segment,
			berthCount: resolved.length
		})
		await ctx.db.patch(bookingId, {
			totalAmount: paymentSchedule.totalAmount,
			currency: paymentSchedule.currency
		})

		for (const berth of resolved) {
			await ctx.db.patch(berth._id, {
				status: 'held',
				holdExpiresAt,
				holdPaymentIntentId: args.stripePaymentIntentId
			})
			await ctx.db.insert('bookingParticipants', {
				bookingId,
				buyerUserId: args.userId,
				segmentId: segment._id,
				berthId: berth._id,
				berthLabel: berth.berthId,
				dataStatus: 'missing',
				reminderCount: 0
			})
		}

		const paymentDocs = await Promise.all(
			paymentSchedule.paymentIds.map(async (id) => {
				const doc = await ctx.db.get(id)
				if (!doc) throw new Error('Payment row missing after insert')
				return {
					_id: doc._id,
					kind: doc.kind,
					label: doc.label,
					amount: doc.amount,
					sortOrder: doc.sortOrder
				}
			})
		)

		return {
			bookingId,
			holdExpiresAt,
			currency: paymentSchedule.currency,
			totalAmount: paymentSchedule.totalAmount,
			payments: paymentDocs
		}
	}
})

/**
 * Apply a successful Stripe payment to its booking.
 * Used for both first checkout (deposit/full) and dashboard installments.
 * - Marks bookingPayments rows attached to this PI as paid.
 * - Promotes a still-pending booking to confirmed (held → taken berths).
 * - Refreshes paidAmount/paymentStatus on the booking.
 * Returns isFirstPayment so the webhook knows when to send the confirmation email.
 */
export const applyStripePayment = mutation({
	args: {
		stripePaymentIntentId: v.string(),
		paidAt: v.number()
	},
	handler: async (ctx, { stripePaymentIntentId, paidAt }) => {
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_payment_intent', (q) =>
				q.eq('stripePaymentIntentId', stripePaymentIntentId)
			)
			.collect()
		if (payments.length === 0) {
			throw new Error('Payment rows not found for PaymentIntent')
		}

		const booking = await ctx.db.get(payments[0].bookingId)
		if (!booking) throw new Error('Booking not found')
		for (const payment of payments) {
			if (payment.bookingId !== booking._id) {
				throw new Error('PaymentIntent spans multiple bookings')
			}
		}

		const paymentEmailSentAt =
			payments.find((p) => p.confirmationEmailSentAt)
				?.confirmationEmailSentAt ?? null

		const now = Date.now()
		for (const payment of payments) {
			if (payment.status !== 'paid') {
				await ctx.db.patch(payment._id, {
					status: 'paid',
					paidAt,
					updatedAt: now
				})
			}
		}

		const isFirstPayment =
			booking.status === 'pending' || booking.status === 'expired'

		if (isFirstPayment) {
			for (const berthId of booking.berthIds) {
				const berth = await ctx.db.get(berthId)
				if (!berth) continue
				const heldByThisIntent =
					berth.status === 'held' &&
					berth.holdPaymentIntentId === stripePaymentIntentId
				const availableAfterExpiry = berth.status === 'available'
				const alreadyTakenByThisIntent =
					berth.status === 'taken' &&
					berth.bookingPaymentIntentId === stripePaymentIntentId

				if (
					!heldByThisIntent &&
					!availableAfterExpiry &&
					!alreadyTakenByThisIntent
				) {
					throw new Error('Booking berths are no longer available')
				}
			}

			for (const berthId of booking.berthIds) {
				await ctx.db.patch(berthId, {
					status: 'taken',
					holdExpiresAt: undefined,
					holdPaymentIntentId: undefined,
					bookingPaymentIntentId: stripePaymentIntentId
				})
			}

			await ctx.db.patch(booking._id, {
				status: 'confirmed',
				paidAt,
				stripePaymentIntentId
			})
		}

		const totals = await refreshBookingPaymentTotals(ctx, booking)

		return {
			bookingRef: booking.bookingRef,
			userId: booking.userId,
			buyerEmail: booking.buyerEmail ?? null,
			paidAmount: totals.paidAmount,
			totalAmount: totals.totalAmount,
			paymentStatus: totals.paymentStatus,
			isFirstPayment,
			confirmationEmailSentAt: booking.confirmationEmailSentAt ?? null,
			paymentEmailSentAt
		}
	}
})

/**
 * Mark per-payment confirmation email as sent (idempotent).
 * Targets all bookingPayments rows attached to a single PaymentIntent so that
 * Stripe webhook retries do not send the same payment confirmation twice.
 */
export const markPaymentEmailSent = mutation({
	args: {
		stripePaymentIntentId: v.string(),
		sentAt: v.number(),
		messageId: v.optional(v.string())
	},
	handler: async (ctx, { stripePaymentIntentId, sentAt, messageId }) => {
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_payment_intent', (q) =>
				q.eq('stripePaymentIntentId', stripePaymentIntentId)
			)
			.collect()
		for (const payment of payments) {
			if (payment.confirmationEmailSentAt) continue
			await ctx.db.patch(payment._id, {
				confirmationEmailSentAt: sentAt,
				confirmationEmailMessageId: messageId,
				updatedAt: Date.now()
			})
		}
	}
})

/** Mark booking confirmation email as sent after the Stripe webhook sends it. */
export const markConfirmationEmailSent = mutation({
	args: {
		stripePaymentIntentId: v.string(),
		sentAt: v.number(),
		messageId: v.optional(v.string())
	},
	handler: async (ctx, { stripePaymentIntentId, sentAt, messageId }) => {
		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_payment_intent', (q) =>
				q.eq('stripePaymentIntentId', stripePaymentIntentId)
			)
			.first()
		if (!booking || booking.confirmationEmailSentAt) return

		await ctx.db.patch(booking._id, {
			confirmationEmailSentAt: sentAt,
			confirmationEmailMessageId: messageId
		})
	}
})

/** Attach one Stripe PaymentIntent to one or more pending booking payment rows. */
export const markBookingPaymentsProcessing = mutation({
	args: {
		userId: v.string(),
		bookingId: v.id('bookings'),
		paymentIds: v.array(v.id('bookingPayments')),
		stripePaymentIntentId: v.string()
	},
	handler: async (ctx, args) => {
		if (args.paymentIds.length === 0) {
			throw new Error('Wybierz przynajmniej jedną płatność')
		}

		const booking = await ctx.db.get(args.bookingId)
		const buyerUserId = booking?.buyerUserId ?? booking?.userId
		if (!booking || buyerUserId !== args.userId) {
			throw new Error('Booking not found')
		}

		const now = Date.now()
		let amount = 0
		for (const paymentId of args.paymentIds) {
			const payment = await ctx.db.get(paymentId)
			if (!payment || payment.bookingId !== booking._id) {
				throw new Error('Payment not found')
			}
			if (
				payment.status !== 'pending' &&
				payment.status !== 'failed' &&
				payment.status !== 'overdue'
			) {
				throw new Error(`Płatność "${payment.label}" nie jest dostępna`)
			}
			amount += payment.amount
		}

		for (const paymentId of args.paymentIds) {
			await ctx.db.patch(paymentId, {
				status: 'processing',
				stripePaymentIntentId: args.stripePaymentIntentId,
				updatedAt: now
			})
		}

		return { amount, currency: booking.currency ?? DEFAULT_CURRENCY }
	}
})

/** Release processing payment rows after failed/cancelled Stripe PaymentIntent. */
export const cancelBookingPayments = mutation({
	args: { stripePaymentIntentId: v.string() },
	handler: async (ctx, { stripePaymentIntentId }) => {
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_payment_intent', (q) =>
				q.eq('stripePaymentIntentId', stripePaymentIntentId)
			)
			.collect()
		if (payments.length === 0) return

		const booking = await ctx.db.get(payments[0].bookingId)
		for (const payment of payments) {
			if (payment.status === 'processing') {
				await ctx.db.patch(payment._id, {
					status: 'failed',
					updatedAt: Date.now()
				})
			}
		}
		if (booking) {
			await refreshBookingPaymentTotals(ctx, booking)
		}
	}
})

/** Save participant/crew data for a single booked berth. */
export const upsertBookingParticipant = mutation({
	args: {
		userId: v.string(),
		participantId: v.id('bookingParticipants'),
		...participantProfileArgs
	},
	handler: async (ctx, args) => {
		const participant = await ctx.db.get(args.participantId)
		if (!participant) throw new Error('Participant not found')

		const booking = await ctx.db.get(participant.bookingId)
		const buyerUserId = booking?.buyerUserId ?? booking?.userId
		if (!booking || buyerUserId !== args.userId) {
			throw new Error('Participant not found')
		}

		const {
			userId: _userId,
			participantId: _participantId,
			...profilePatch
		} = args
		const nextParticipant = { ...participant, ...profilePatch }
		const dataStatus = participantDataStatus({
			invitedEmail: nextParticipant.invitedEmail,
			firstName: nextParticipant.firstName,
			lastName: nextParticipant.lastName,
			email: nextParticipant.email,
			dateOfBirth: nextParticipant.dateOfBirth,
			birthPlace: nextParticipant.birthPlace,
			nationality: nextParticipant.nationality,
			phone: nextParticipant.phone,
			docType: nextParticipant.docType,
			docNumber: nextParticipant.docNumber,
			emergencyContactName: nextParticipant.emergencyContactName,
			emergencyContactPhone: nextParticipant.emergencyContactPhone,
			swimmingAbility: nextParticipant.swimmingAbility,
			sailingExperience: nextParticipant.sailingExperience,
			dietaryRequirements: nextParticipant.dietaryRequirements,
			medicalNotes: nextParticipant.medicalNotes
		})

		await ctx.db.patch(participant._id, {
			...profilePatch,
			dataStatus
		})

		return participant._id
	}
})

/**
 * One-time compatibility migration for existing bookings.
 * Creates missing participant rows without copying legacy crewProfiles blindly.
 */
export const backfillBookingParticipants = mutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }) => {
		const bookings = await ctx.db
			.query('bookings')
			.order('desc')
			.take(limit ?? 50)
		let created = 0
		let patchedBookings = 0

		for (const booking of bookings) {
			const buyerUserId = booking.buyerUserId ?? booking.userId
			if (!booking.buyerUserId) {
				await ctx.db.patch(booking._id, { buyerUserId })
				patchedBookings++
			}

			for (const berthId of booking.berthIds) {
				const existing = await ctx.db
					.query('bookingParticipants')
					.withIndex('by_booking_and_berth', (q) =>
						q.eq('bookingId', booking._id).eq('berthId', berthId)
					)
					.first()
				if (existing) continue

				const berth = await ctx.db.get(berthId)
				if (!berth) continue

				await ctx.db.insert('bookingParticipants', {
					bookingId: booking._id,
					buyerUserId,
					segmentId: booking.segmentId,
					berthId,
					berthLabel: berth.berthId,
					dataStatus: 'missing',
					reminderCount: 0
				})
				created++
			}
		}

		return { scannedBookings: bookings.length, patchedBookings, created }
	}
})

/** Admin: reserve a berth complimentary (no payment). Throws if berth is not available. */
export const reserveComplimentary = mutation({
	args: {
		segmentSlug: v.string(),
		berthId: v.string(),
		guestName: v.string(),
		note: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', args.segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${args.segmentSlug}`)

		const berth = await ctx.db
			.query('berths')
			.withIndex('by_segment_berth', (q) =>
				q.eq('segmentId', segment._id).eq('berthId', args.berthId)
			)
			.first()
		if (!berth) throw new Error(`Berth not found: ${args.berthId}`)
		if (berth.status !== 'available') throw new Error('Koja niedostępna')

		await ctx.db.patch(berth._id, {
			status: 'complimentary',
			guestName: args.guestName,
			note: args.note
		})
	}
})

/** Admin: release a complimentary berth back to available. Captain berths cannot be cancelled. */
export const cancelAdminBooking = mutation({
	args: { segmentSlug: v.string(), berthId: v.string() },
	handler: async (ctx, args) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', args.segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${args.segmentSlug}`)

		const berth = await ctx.db
			.query('berths')
			.withIndex('by_segment_berth', (q) =>
				q.eq('segmentId', segment._id).eq('berthId', args.berthId)
			)
			.first()
		if (!berth) throw new Error(`Berth not found: ${args.berthId}`)
		if (berth.status !== 'complimentary')
			throw new Error('Można anulować tylko rezerwacje bezpłatne')

		await ctx.db.patch(berth._id, {
			status: 'available',
			guestName: undefined,
			note: undefined
		})
	}
})

/**
 * Test seed for Etap 4: install a payment plan with 30% deposit + two equal
 * installments for the given segment slug (default: 's1'). Idempotent — replaces
 * any existing active plan for that segment. Run from Convex dashboard.
 */
export const seedTestPaymentPlan = mutation({
	args: {
		segmentSlug: v.optional(v.string()),
		dueAtFirstInstallment: v.optional(v.number()),
		dueAtSecondInstallment: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const segmentSlug = args.segmentSlug ?? 's1'
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', segmentSlug))
			.first()
		if (!segment) throw new Error(`Segment not found: ${segmentSlug}`)

		const totalPerBerthGrosze = segment.pricePerBerth * 100
		const depositPerBerth = Math.round(totalPerBerthGrosze * 0.3)
		const installmentPerBerth = Math.floor(
			(totalPerBerthGrosze - depositPerBerth) / 2
		)

		const now = Date.now()
		const activePlans = await ctx.db
			.query('paymentPlans')
			.withIndex('by_segment_and_is_active', (q) =>
				q.eq('segmentId', segment._id).eq('isActive', true)
			)
			.collect()
		for (const plan of activePlans) {
			await ctx.db.patch(plan._id, { isActive: false, updatedAt: now })
		}

		const planId = await ctx.db.insert('paymentPlans', {
			segmentId: segment._id,
			name: 'Plan testowy: zaliczka 30% + 2 raty',
			currency: DEFAULT_CURRENCY,
			isActive: true,
			allowFullPayment: true,
			createdAt: now,
			updatedAt: now
		})

		await ctx.db.insert('paymentPlanItems', {
			planId,
			segmentId: segment._id,
			label: 'Zaliczka',
			kind: 'deposit',
			amountPerBerth: depositPerBerth,
			sortOrder: 1
		})
		await ctx.db.insert('paymentPlanItems', {
			planId,
			segmentId: segment._id,
			label: 'Rata 1',
			kind: 'installment',
			amountPerBerth: installmentPerBerth,
			dueAt: args.dueAtFirstInstallment,
			sortOrder: 2
		})
		await ctx.db.insert('paymentPlanItems', {
			planId,
			segmentId: segment._id,
			label: 'Rata 2',
			kind: 'installment',
			amountPerBerth: installmentPerBerth,
			dueAt: args.dueAtSecondInstallment,
			sortOrder: 3
		})

		return {
			planId,
			segmentSlug,
			depositPerBerth,
			installmentPerBerth,
			totalPerBerthGrosze
		}
	}
})

/**
 * One-time migration: for every booking that predates the bookingPayments
 * schedule (Etap 3), insert a single `kind: 'full'` row mirroring its status
 * and backfill totalAmount / paidAmount / paymentStatus / currency on the
 * booking itself. Idempotent — bookings that already have any bookingPayments
 * row are skipped.
 *
 * Run once from Convex dashboard after deploying the new schema.
 */
export const backfillLegacyBookingPayments = mutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }) => {
		const bookings = await ctx.db
			.query('bookings')
			.order('desc')
			.take(limit ?? 200)
		let migratedBookings = 0
		let insertedRows = 0
		const now = Date.now()

		for (const booking of bookings) {
			const existing = await ctx.db
				.query('bookingPayments')
				.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
				.first()
			if (existing) continue

			const segment = await ctx.db.get(booking.segmentId)
			if (!segment) continue

			const totalAmount = segment.pricePerBerth * booking.berthIds.length * 100
			const currency = booking.currency ?? DEFAULT_CURRENCY
			const buyerUserId = booking.buyerUserId ?? booking.userId

			let rowStatus: 'paid' | 'pending' | 'cancelled' = 'pending'
			let bookingPaymentStatus:
				| 'unpaid'
				| 'deposit_paid'
				| 'partially_paid'
				| 'paid'
				| 'cancelled'
			let paidAmount = 0
			if (booking.status === 'confirmed') {
				rowStatus = 'paid'
				bookingPaymentStatus = 'paid'
				paidAmount = totalAmount
			} else if (
				booking.status === 'cancelled' ||
				booking.status === 'expired'
			) {
				rowStatus = 'cancelled'
				bookingPaymentStatus = 'cancelled'
			} else {
				rowStatus = 'pending'
				bookingPaymentStatus = 'unpaid'
			}

			await ctx.db.insert('bookingPayments', {
				bookingId: booking._id,
				buyerUserId,
				segmentId: booking.segmentId,
				label: 'Całość',
				kind: 'full',
				amount: totalAmount,
				currency,
				sortOrder: 1,
				status: rowStatus,
				stripePaymentIntentId: booking.stripePaymentIntentId,
				paidAt: rowStatus === 'paid' ? booking.paidAt : undefined,
				createdAt: booking._creationTime,
				updatedAt: now,
				reminderCount: 0
			})
			insertedRows++

			await ctx.db.patch(booking._id, {
				totalAmount,
				paidAmount,
				currency,
				paymentStatus: bookingPaymentStatus,
				...(booking.buyerUserId ? {} : { buyerUserId })
			})
			migratedBookings++
		}

		return {
			scannedBookings: bookings.length,
			migratedBookings,
			insertedRows
		}
	}
})

/**
 * One-time migration: set C1 to captain on all existing segments.
 * Run from Convex dashboard after schema deploy.
 */
export const migrateCaptainBerths = mutation({
	args: {},
	handler: async (ctx) => {
		const segments = await ctx.db.query('voyageSegments').collect()
		let updated = 0
		for (const segment of segments) {
			const berth = await ctx.db
				.query('berths')
				.withIndex('by_segment_berth', (q) =>
					q.eq('segmentId', segment._id).eq('berthId', 'C1')
				)
				.first()
			if (berth && berth.status === 'available') {
				await ctx.db.patch(berth._id, { status: 'captain' })
				updated++
			}
		}
		return { updated }
	}
})

/** Release all berths and cancel booking on failed/cancelled payment (called from webhook). */
export const cancelBooking = mutation({
	args: { stripePaymentIntentId: v.string() },
	handler: async (ctx, { stripePaymentIntentId }) => {
		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_payment_intent', (q) =>
				q.eq('stripePaymentIntentId', stripePaymentIntentId)
			)
			.first()
		if (!booking) return
		if (booking.status === 'confirmed') return

		for (const berthId of booking.berthIds) {
			const berth = await ctx.db.get(berthId)
			const heldByThisIntent =
				berth?.status === 'held' &&
				berth.holdPaymentIntentId === stripePaymentIntentId
			const legacyPendingTaken =
				berth?.status === 'taken' &&
				!berth.bookingPaymentIntentId &&
				booking.status === 'pending'

			if (heldByThisIntent || legacyPendingTaken) {
				await ctx.db.patch(berthId, {
					status: 'available',
					holdExpiresAt: undefined,
					holdPaymentIntentId: undefined,
					bookingPaymentIntentId: undefined
				})
			}
		}
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
			.collect()
		for (const payment of payments) {
			if (payment.status !== 'paid') {
				await ctx.db.patch(payment._id, {
					status: 'cancelled',
					updatedAt: Date.now()
				})
			}
		}
		await ctx.db.patch(booking._id, {
			status: 'cancelled',
			paymentStatus: 'cancelled'
		})
	}
})

/** Release expired checkout holds. Called by cron; bounded for transaction safety. */
export const expireCheckoutHolds = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now()
		const expiredBookings = await ctx.db
			.query('bookings')
			.withIndex('by_status_and_hold_expires_at', (q) =>
				q.eq('status', 'pending').lte('holdExpiresAt', now)
			)
			.take(50)

		let releasedBerths = 0
		for (const booking of expiredBookings) {
			for (const berthId of booking.berthIds) {
				const berth = await ctx.db.get(berthId)
				if (
					berth?.status === 'held' &&
					berth.holdPaymentIntentId === booking.stripePaymentIntentId
				) {
					await ctx.db.patch(berthId, {
						status: 'available',
						holdExpiresAt: undefined,
						holdPaymentIntentId: undefined,
						bookingPaymentIntentId: undefined
					})
					releasedBerths++
				}
			}
			const payments = await ctx.db
				.query('bookingPayments')
				.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
				.collect()
			for (const payment of payments) {
				if (payment.status !== 'paid') {
					await ctx.db.patch(payment._id, {
						status: 'cancelled',
						updatedAt: now
					})
				}
			}
			await ctx.db.patch(booking._id, {
				status: 'expired',
				paymentStatus: 'cancelled'
			})
		}

		return { expiredBookings: expiredBookings.length, releasedBerths }
	}
})
