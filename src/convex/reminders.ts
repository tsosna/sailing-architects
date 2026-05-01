import {
	internalAction,
	internalMutation,
	internalQuery
} from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'
import { sendCrewDataReminderEmail, sendPaymentReminderEmail } from './_emails'

const DAY_MS = 24 * 60 * 60 * 1000
const CREW_REMINDER_FIRST_DELAY_MS = 14 * DAY_MS
const CREW_REMINDER_INTERVAL_MS = 14 * DAY_MS
const CREW_REMINDER_MAX = 3
const UPCOMING_PAYMENT_WINDOW_MS = 7 * DAY_MS
const OVERDUE_REMINDER_INTERVAL_MS = 3 * DAY_MS
const OVERDUE_REMINDER_MAX = 5
const CRON_BATCH_SIZE = 25
const PARTICIPANT_SCAN_LIMIT = 200
const PAYMENT_SCAN_LIMIT = 200

type CrewReminderCandidate = {
	participantId: Id<'bookingParticipants'>
	bookingRef: string
	berthLabel: string
	dataStatus: 'missing' | 'incomplete'
	recipient: string
	recipientName: string
}

type PaymentReminderCandidate = {
	paymentId: Id<'bookingPayments'>
	bookingRef: string
	paymentLabel: string
	amount: number
	currency: string
	dueAt?: number
	overdue: boolean
	reminderCount: number
	recipient: string
	recipientName: string
}

/**
 * Mark pending bookingPayments past their dueAt as overdue.
 * Bounded scan; safe to run daily.
 */
export const markOverduePayments = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now()
		const candidates = await ctx.db
			.query('bookingPayments')
			.withIndex('by_status_and_due_at', (q) =>
				q.eq('status', 'pending').lte('dueAt', now)
			)
			.take(PAYMENT_SCAN_LIMIT)
		let updated = 0
		for (const payment of candidates) {
			if (!payment.dueAt || payment.dueAt > now) continue
			await ctx.db.patch(payment._id, {
				status: 'overdue',
				updatedAt: now
			})
			updated++
		}
		return { scanned: candidates.length, updated }
	}
})

async function resolveBuyerRecipient(
	ctx:
		| { db: { query: typeof internalQuery extends never ? never : any } }
		| any,
	booking: { buyerUserId?: string; userId: string; buyerEmail?: string }
): Promise<{ email: string; name: string } | null> {
	const buyerUserId = booking.buyerUserId ?? booking.userId
	const profile = await ctx.db
		.query('crewProfiles')
		.withIndex('by_user', (q: any) => q.eq('userId', buyerUserId))
		.first()
	const email = profile?.email ?? booking.buyerEmail ?? null
	if (!email) return null
	const name = profile ? `${profile.firstName} ${profile.lastName}` : email
	return { email, name }
}

export const _listCrewReminderCandidates = internalQuery({
	args: {},
	handler: async (ctx): Promise<CrewReminderCandidate[]> => {
		const now = Date.now()
		const candidates: CrewReminderCandidate[] = []
		const participants = await ctx.db
			.query('bookingParticipants')
			.take(PARTICIPANT_SCAN_LIMIT)

		for (const p of participants) {
			if (p.dataStatus === 'complete') continue
			const reminderCount = p.reminderCount ?? 0
			if (reminderCount >= CREW_REMINDER_MAX) continue
			if (
				p.lastReminderSentAt &&
				now - p.lastReminderSentAt < CREW_REMINDER_INTERVAL_MS
			)
				continue

			const booking = await ctx.db.get(p.bookingId)
			if (!booking || booking.status !== 'confirmed') continue
			if (!booking.paidAt) continue
			if (now - booking.paidAt < CREW_REMINDER_FIRST_DELAY_MS) continue

			let recipient: string | null = null
			let recipientName: string | null = null
			if (p.invitedEmail) {
				recipient = p.invitedEmail
				recipientName =
					p.firstName || p.lastName
						? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
						: null
			}
			if (!recipient) {
				const fallback = await resolveBuyerRecipient(ctx, booking)
				if (fallback) {
					recipient = fallback.email
					recipientName = fallback.name
				}
			}
			if (!recipient) continue

			candidates.push({
				participantId: p._id,
				bookingRef: booking.bookingRef,
				berthLabel: p.berthLabel,
				dataStatus: p.dataStatus as 'missing' | 'incomplete',
				recipient,
				recipientName: recipientName ?? recipient
			})

			if (candidates.length >= CRON_BATCH_SIZE) break
		}

		return candidates
	}
})

export const _listUpcomingPaymentCandidates = internalQuery({
	args: {},
	handler: async (ctx): Promise<PaymentReminderCandidate[]> => {
		const now = Date.now()
		const horizon = now + UPCOMING_PAYMENT_WINDOW_MS
		const candidates: PaymentReminderCandidate[] = []
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_status_and_due_at', (q) =>
				q.eq('status', 'pending').lte('dueAt', horizon)
			)
			.take(PAYMENT_SCAN_LIMIT)

		for (const payment of payments) {
			if (!payment.dueAt || payment.dueAt < now) continue
			if ((payment.reminderCount ?? 0) >= 1) continue
			if (payment.kind === 'full') continue

			const booking = await ctx.db.get(payment.bookingId)
			if (!booking || booking.status !== 'confirmed') continue

			const recipient = await resolveBuyerRecipient(ctx, booking)
			if (!recipient) continue

			candidates.push({
				paymentId: payment._id,
				bookingRef: booking.bookingRef,
				paymentLabel: payment.label,
				amount: payment.amount,
				currency: payment.currency,
				dueAt: payment.dueAt,
				overdue: false,
				reminderCount: (payment.reminderCount ?? 0) + 1,
				recipient: recipient.email,
				recipientName: recipient.name
			})

			if (candidates.length >= CRON_BATCH_SIZE) break
		}

		return candidates
	}
})

export const _listOverduePaymentCandidates = internalQuery({
	args: {},
	handler: async (ctx): Promise<PaymentReminderCandidate[]> => {
		const now = Date.now()
		const candidates: PaymentReminderCandidate[] = []
		const payments = await ctx.db
			.query('bookingPayments')
			.withIndex('by_status_and_due_at', (q) => q.eq('status', 'overdue'))
			.take(PAYMENT_SCAN_LIMIT)

		for (const payment of payments) {
			const reminderCount = payment.reminderCount ?? 0
			if (reminderCount >= OVERDUE_REMINDER_MAX) continue
			if (
				payment.lastReminderSentAt &&
				now - payment.lastReminderSentAt < OVERDUE_REMINDER_INTERVAL_MS
			)
				continue
			if (payment.kind === 'full') continue

			const booking = await ctx.db.get(payment.bookingId)
			if (!booking || booking.status !== 'confirmed') continue

			const recipient = await resolveBuyerRecipient(ctx, booking)
			if (!recipient) continue

			candidates.push({
				paymentId: payment._id,
				bookingRef: booking.bookingRef,
				paymentLabel: payment.label,
				amount: payment.amount,
				currency: payment.currency,
				dueAt: payment.dueAt,
				overdue: true,
				reminderCount: reminderCount + 1,
				recipient: recipient.email,
				recipientName: recipient.name
			})

			if (candidates.length >= CRON_BATCH_SIZE) break
		}

		return candidates
	}
})

export const _markParticipantReminderSent = internalMutation({
	args: { participantId: v.id('bookingParticipants') },
	handler: async (ctx, { participantId }) => {
		const participant = await ctx.db.get(participantId)
		if (!participant) return
		await ctx.db.patch(participantId, {
			lastReminderSentAt: Date.now(),
			reminderCount: (participant.reminderCount ?? 0) + 1
		})
	}
})

export const _markPaymentReminderSent = internalMutation({
	args: { paymentId: v.id('bookingPayments') },
	handler: async (ctx, { paymentId }) => {
		const payment = await ctx.db.get(paymentId)
		if (!payment) return
		await ctx.db.patch(paymentId, {
			lastReminderSentAt: Date.now(),
			reminderCount: (payment.reminderCount ?? 0) + 1,
			updatedAt: Date.now()
		})
	}
})

export const sendCrewDataReminders = internalAction({
	args: {},
	handler: async (ctx) => {
		const candidates: CrewReminderCandidate[] = await ctx.runQuery(
			internal.reminders._listCrewReminderCandidates,
			{}
		)
		let sent = 0
		let failed = 0
		for (const c of candidates) {
			try {
				await sendCrewDataReminderEmail({
					to: c.recipient,
					name: c.recipientName,
					bookingRef: c.bookingRef,
					berthLabel: c.berthLabel,
					dataStatus: c.dataStatus,
					participantId: c.participantId
				})
				await ctx.runMutation(internal.reminders._markParticipantReminderSent, {
					participantId: c.participantId
				})
				sent++
			} catch (err) {
				console.error('Crew data reminder failed:', err)
				failed++
			}
		}
		return { total: candidates.length, sent, failed }
	}
})

async function dispatchPaymentReminders(
	ctx: { runMutation: any },
	candidates: PaymentReminderCandidate[]
) {
	let sent = 0
	let failed = 0
	for (const c of candidates) {
		try {
			await sendPaymentReminderEmail({
				to: c.recipient,
				name: c.recipientName,
				bookingRef: c.bookingRef,
				paymentLabel: c.paymentLabel,
				amount: c.amount,
				currency: c.currency,
				dueAt: c.dueAt,
				overdue: c.overdue,
				reminderCount: c.reminderCount
			})
			await ctx.runMutation(internal.reminders._markPaymentReminderSent, {
				paymentId: c.paymentId
			})
			sent++
		} catch (err) {
			console.error('Payment reminder failed:', err)
			failed++
		}
	}
	return { sent, failed }
}

export const sendUpcomingPaymentReminders = internalAction({
	args: {},
	handler: async (ctx) => {
		const candidates: PaymentReminderCandidate[] = await ctx.runQuery(
			internal.reminders._listUpcomingPaymentCandidates,
			{}
		)
		const result = await dispatchPaymentReminders(ctx, candidates)
		return { total: candidates.length, ...result }
	}
})

export const sendOverduePaymentReminders = internalAction({
	args: {},
	handler: async (ctx) => {
		const candidates: PaymentReminderCandidate[] = await ctx.runQuery(
			internal.reminders._listOverduePaymentCandidates,
			{}
		)
		const result = await dispatchPaymentReminders(ctx, candidates)
		return { total: candidates.length, ...result }
	}
})
