import { action, internalQuery, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import {
	sendAdminCopyEmail,
	sendCrewDataReminderEmail,
	sendPaymentReminderEmail
} from './_emails'

const DAY_MS = 24 * 60 * 60 * 1000
const DUE_SOON_WINDOW_MS = 7 * DAY_MS
const HOLD_NEAR_EXPIRY_MS = 15 * 60 * 1000

type AlertLevel = 'danger' | 'warn' | 'info'

type AlertItem = {
	id: string
	level: AlertLevel
	kind:
		| 'payment_overdue'
		| 'payment_due_soon'
		| 'data_missing'
		| 'data_pending_confirmation'
		| 'hold_expiring'
	title: string
	subtitle: string
	bookingRef?: string
	bookingId?: string
	priority: number
	suggestedActions: Array<'send_reminder' | 'copy_whatsapp' | 'open_booking'>
}

type SalesRow = {
	bookingId: string
	bookingRef: string
	buyerEmail: string
	berthLabels: string[]
	paymentLabel: string
	paymentLevel: 'ok' | 'warn' | 'danger' | 'info'
	dataLabel: string
	dataLevel: 'ok' | 'warn' | 'danger' | 'info'
	nextAction: string
	flags: {
		overdue: boolean
		dueSoon: boolean
		dataMissing: boolean
		paid: boolean
	}
}

/**
 * Operational overview for /admin Sales Board + Alert Queue.
 * Aggregates one segment's bookings, payments and participants into a
 * scannable shape. Returns null when the segment slug is unknown.
 */
export const overviewBySegment = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }) => {
		const segment = await ctx.db
			.query('voyageSegments')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first()
		if (!segment) return null

		const berths = await ctx.db
			.query('berths')
			.withIndex('by_segment', (q) => q.eq('segmentId', segment._id))
			.collect()
		const berthById = new Map(berths.map((b) => [b._id, b]))

		const allBookings = await ctx.db.query('bookings').collect()
		const bookings = allBookings.filter(
			(b) =>
				b.segmentId === segment._id &&
				b.status !== 'cancelled' &&
				b.status !== 'expired'
		)

		const enriched = await Promise.all(
			bookings.map(async (booking) => {
				const [payments, participants] = await Promise.all([
					ctx.db
						.query('bookingPayments')
						.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
						.collect(),
					ctx.db
						.query('bookingParticipants')
						.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
						.collect()
				])
				return { booking, payments, participants }
			})
		)

		const now = Date.now()
		let soldBerths = 0
		let paidAmount = 0
		let pendingAmount = 0
		let overdueAmount = 0
		let missingDataCount = 0
		let pendingConfirmationCount = 0

		const heldBerths = berths.filter(
			(b) => b.status === 'held' && (b.holdExpiresAt ?? 0) > now
		)
		const sellableBerths = berths.filter(
			(b) => b.status !== 'captain' && b.status !== 'complimentary'
		).length
		const complimentaryBerths = berths.filter(
			(b) => b.status === 'complimentary'
		).length

		const alerts: AlertItem[] = []
		const rows: SalesRow[] = []

		for (const { booking, payments, participants } of enriched) {
			const berthLabels = booking.berthIds
				.map((id) => berthById.get(id)?.berthId)
				.filter((label): label is string => Boolean(label))
				.sort()
			soldBerths += booking.berthIds.length

			const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
			const paid = payments
				.filter((p) => p.status === 'paid')
				.reduce((sum, p) => sum + p.amount, 0)
			const overduePayments = payments.filter(
				(p) =>
					p.status !== 'paid' &&
					p.status !== 'cancelled' &&
					typeof p.dueAt === 'number' &&
					p.dueAt < now
			)
			const dueSoonPayments = payments.filter(
				(p) =>
					p.status !== 'paid' &&
					p.status !== 'cancelled' &&
					typeof p.dueAt === 'number' &&
					p.dueAt >= now &&
					p.dueAt <= now + DUE_SOON_WINDOW_MS
			)
			const overdueSum = overduePayments.reduce((s, p) => s + p.amount, 0)
			const pendingSum = payments
				.filter((p) => p.status !== 'paid' && p.status !== 'cancelled')
				.reduce((s, p) => s + p.amount, 0)

			paidAmount += paid
			overdueAmount += overdueSum
			pendingAmount += Math.max(0, pendingSum - overdueSum)

			const missingParticipants = participants.filter(
				(p) => p.dataStatus !== 'complete'
			)
			missingDataCount += missingParticipants.length
			const pendingConfirmation = participants.filter(
				(p) =>
					p.dataStatus === 'complete' &&
					(p.confirmationStatus === 'drafted_by_admin' ||
						p.confirmationStatus === 'expired' ||
						p.confirmationStatus === 'correction_requested')
			)
			pendingConfirmationCount += pendingConfirmation.length

			let paymentLabel: string
			let paymentLevel: SalesRow['paymentLevel']
			if (overduePayments.length > 0) {
				paymentLabel = `${formatPLN(overdueSum)} zaległe`
				paymentLevel = 'danger'
			} else if (totalAmount > 0 && paid >= totalAmount) {
				paymentLabel = 'Opłacone'
				paymentLevel = 'ok'
			} else if (dueSoonPayments.length > 0) {
				const next = dueSoonPayments.sort(
					(a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0)
				)[0]
				const days = Math.max(
					0,
					Math.ceil(((next.dueAt ?? now) - now) / DAY_MS)
				)
				paymentLabel = days <= 1 ? 'Rata jutro' : `Rata za ${days} dni`
				paymentLevel = 'warn'
			} else if (paid > 0) {
				paymentLabel =
					booking.paymentStatus === 'deposit_paid'
						? 'Zaliczka'
						: 'Częściowo opłacone'
				paymentLevel = 'ok'
			} else {
				paymentLabel = 'Nieopłacone'
				paymentLevel = 'info'
			}

			let dataLabel: string
			let dataLevel: SalesRow['dataLevel']
			if (participants.length === 0) {
				dataLabel = 'Brak uczestników'
				dataLevel = 'info'
			} else if (missingParticipants.length === 0) {
				dataLabel = 'Komplet'
				dataLevel = 'ok'
			} else {
				const missing = missingParticipants.filter(
					(p) => p.dataStatus === 'missing'
				).length
				const incomplete = missingParticipants.filter(
					(p) => p.dataStatus === 'incomplete'
				).length
				if (missing > 0) {
					dataLabel = `${missing} brak${missing === 1 ? '' : 'i'}`
					dataLevel = 'danger'
				} else {
					dataLabel = `${incomplete} niekompletny${incomplete === 1 ? '' : 'ch'}`
					dataLevel = 'warn'
				}
			}

			let nextAction = 'Brak'
			if (overduePayments.length > 0) {
				nextAction = 'Monit płatności'
			} else if (missingParticipants.length > 0 && participants.length > 0) {
				nextAction = 'Prośba o dane załogi'
			} else if (dueSoonPayments.length > 0) {
				nextAction = 'Reminder płatności'
			} else if (totalAmount > 0 && paid >= totalAmount) {
				nextAction = 'Brak'
			} else if (paid === 0) {
				nextAction = 'Oczekuje płatności'
			}

			rows.push({
				bookingId: booking._id,
				bookingRef: booking.bookingRef,
				buyerEmail: booking.buyerEmail ?? '—',
				berthLabels,
				paymentLabel,
				paymentLevel,
				dataLabel,
				dataLevel,
				nextAction,
				flags: {
					overdue: overduePayments.length > 0,
					dueSoon: dueSoonPayments.length > 0,
					dataMissing: missingParticipants.length > 0,
					paid: totalAmount > 0 && paid >= totalAmount
				}
			})

			for (const p of overduePayments) {
				const days = Math.max(1, Math.floor((now - (p.dueAt ?? now)) / DAY_MS))
				alerts.push({
					id: `payment-${p._id}`,
					level: 'danger',
					kind: 'payment_overdue',
					title:
						days === 1 ? 'Rata zaległa 1 dzień' : `Rata zaległa ${days} dni`,
					subtitle: `${booking.bookingRef} · ${booking.buyerEmail ?? ''} · ${formatPLN(p.amount)}`,
					bookingRef: booking.bookingRef,
					bookingId: booking._id,
					priority: 1000 + days,
					suggestedActions: ['send_reminder', 'copy_whatsapp', 'open_booking']
				})
			}

			for (const p of dueSoonPayments) {
				const days = Math.max(0, Math.ceil(((p.dueAt ?? now) - now) / DAY_MS))
				alerts.push({
					id: `payment-soon-${p._id}`,
					level: 'warn',
					kind: 'payment_due_soon',
					title: days <= 1 ? 'Rata wymagalna jutro' : `Rata za ${days} dni`,
					subtitle: `${booking.bookingRef} · ${formatPLN(p.amount)}`,
					bookingRef: booking.bookingRef,
					bookingId: booking._id,
					priority: 200 + Math.max(0, 8 - days),
					suggestedActions: ['send_reminder', 'open_booking']
				})
			}

			for (const part of missingParticipants) {
				const isMissing = part.dataStatus === 'missing'
				alerts.push({
					id: `data-${part._id}`,
					level: isMissing ? 'danger' : 'warn',
					kind: 'data_missing',
					title: isMissing
						? 'Brak danych uczestnika'
						: 'Niekompletne dane uczestnika',
					subtitle: `${booking.bookingRef} · Koja ${part.berthLabel} · przypomnienia ${part.reminderCount ?? 0}`,
					bookingRef: booking.bookingRef,
					bookingId: booking._id,
					priority: isMissing ? 500 : 100,
					suggestedActions: ['send_reminder', 'copy_whatsapp', 'open_booking']
				})
			}

			for (const part of pendingConfirmation) {
				const status = part.confirmationStatus ?? 'drafted_by_admin'
				const title =
					status === 'correction_requested'
						? 'Uczestnik zgłosił korektę'
						: status === 'expired'
							? 'Link potwierdzenia wygasł'
							: 'Dane czekają na potwierdzenie uczestnika'
				alerts.push({
					id: `confirm-${part._id}`,
					level: status === 'correction_requested' ? 'warn' : 'info',
					kind: 'data_pending_confirmation',
					title,
					subtitle: `${booking.bookingRef} · Koja ${part.berthLabel}`,
					bookingRef: booking.bookingRef,
					bookingId: booking._id,
					priority: status === 'correction_requested' ? 300 : 80,
					suggestedActions: ['open_booking']
				})
			}
		}

		for (const b of heldBerths) {
			const minutesLeft = Math.max(
				0,
				Math.round(((b.holdExpiresAt ?? 0) - now) / 60000)
			)
			const isNear = (b.holdExpiresAt ?? 0) - now <= HOLD_NEAR_EXPIRY_MS
			alerts.push({
				id: `hold-${b._id}`,
				level: 'info',
				kind: 'hold_expiring',
				title:
					minutesLeft === 0
						? 'Held kończy się teraz'
						: `Held kończy się za ${minutesLeft} min`,
				subtitle: `Koja ${b.berthId}`,
				priority: isNear ? 60 : 10,
				suggestedActions: []
			})
		}

		alerts.sort((a, b) => b.priority - a.priority)

		const nextHoldExpiresAt =
			heldBerths.length === 0
				? null
				: heldBerths
						.map((b) => b.holdExpiresAt ?? Number.POSITIVE_INFINITY)
						.sort((a, b) => a - b)[0]

		return {
			segment: {
				slug: segment.slug,
				name: segment.name,
				dates: segment.dates,
				pricePerBerth: segment.pricePerBerth,
				totalBerths: berths.length
			},
			kpi: {
				soldBerths,
				sellableBerths,
				complimentaryBerths,
				paidAmount,
				pendingAmount,
				overdueAmount,
				missingDataCount,
				pendingConfirmationCount,
				heldCount: heldBerths.length,
				nextHoldExpiresAt
			},
			bookings: rows,
			alerts
		}
	}
})

function formatPLN(grosze: number): string {
	const zlote = Math.round(grosze / 100)
	const formatted = zlote.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
	return `${formatted} PLN`
}

/**
 * Detail payload for the admin Booking Drawer: booking, segment, berths,
 * payments, participants and the buyer's contact info.
 */
export const bookingDetailById = query({
	args: { bookingId: v.id('bookings') },
	handler: async (ctx, { bookingId }) => {
		const booking = await ctx.db.get(bookingId)
		if (!booking) return null

		const [segment, payments, participants, berthDocs] = await Promise.all([
			ctx.db.get(booking.segmentId),
			ctx.db
				.query('bookingPayments')
				.withIndex('by_booking', (q) => q.eq('bookingId', bookingId))
				.collect(),
			ctx.db
				.query('bookingParticipants')
				.withIndex('by_booking', (q) => q.eq('bookingId', bookingId))
				.collect(),
			Promise.all(booking.berthIds.map((id) => ctx.db.get(id)))
		])

		const berths = berthDocs.filter(
			(b): b is NonNullable<typeof b> => b !== null
		)
		const buyerKey = booking.buyerUserId ?? booking.userId
		const buyerProfile = await ctx.db
			.query('crewProfiles')
			.withIndex('by_user', (q) => q.eq('userId', buyerKey))
			.first()
		const buyerName = buyerProfile
			? `${buyerProfile.firstName} ${buyerProfile.lastName}`.trim()
			: null
		const buyerEmail = buyerProfile?.email ?? booking.buyerEmail ?? null

		return {
			booking,
			segment,
			berths,
			buyer: { name: buyerName, email: buyerEmail },
			payments: payments.sort((a, b) => a.sortOrder - b.sortOrder),
			participants: participants.sort((a, b) =>
				a.berthLabel.localeCompare(b.berthLabel)
			)
		}
	}
})

/* ---------- Adhoc reminders (admin-triggered) ---------- */

type AdhocPaymentPayload = {
	paymentId: string
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

type AdhocParticipantPayload = {
	participantId: string
	bookingRef: string
	berthLabel: string
	dataStatus: 'missing' | 'incomplete'
	recipient: string
	recipientName: string
}

export const _resolvePaymentAdhoc = internalQuery({
	args: { paymentId: v.id('bookingPayments') },
	handler: async (ctx, { paymentId }): Promise<AdhocPaymentPayload | null> => {
		const payment = await ctx.db.get(paymentId)
		if (!payment) return null
		const booking = await ctx.db.get(payment.bookingId)
		if (!booking) return null

		const buyerKey = booking.buyerUserId ?? booking.userId
		const buyerProfile = await ctx.db
			.query('crewProfiles')
			.withIndex('by_user', (q) => q.eq('userId', buyerKey))
			.first()

		const recipient = buyerProfile?.email ?? booking.buyerEmail ?? null
		if (!recipient) return null
		const recipientName = buyerProfile
			? `${buyerProfile.firstName} ${buyerProfile.lastName}`.trim()
			: recipient

		const overdue =
			payment.status === 'overdue' ||
			(payment.status !== 'paid' &&
				payment.status !== 'cancelled' &&
				typeof payment.dueAt === 'number' &&
				payment.dueAt < Date.now())

		return {
			paymentId: payment._id,
			bookingRef: booking.bookingRef,
			paymentLabel: payment.label,
			amount: payment.amount,
			currency: payment.currency,
			dueAt: payment.dueAt,
			overdue,
			reminderCount: (payment.reminderCount ?? 0) + 1,
			recipient,
			recipientName
		}
	}
})

export const _resolveParticipantAdhoc = internalQuery({
	args: { participantId: v.id('bookingParticipants') },
	handler: async (
		ctx,
		{ participantId }
	): Promise<AdhocParticipantPayload | null> => {
		const participant = await ctx.db.get(participantId)
		if (!participant) return null
		if (participant.dataStatus === 'complete') return null

		const booking = await ctx.db.get(participant.bookingId)
		if (!booking) return null

		let recipient: string | null = null
		let recipientName: string | null = null
		if (participant.invitedEmail) {
			recipient = participant.invitedEmail
			const stitched =
				`${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim()
			recipientName = stitched || null
		}
		if (!recipient) {
			const buyerKey = booking.buyerUserId ?? booking.userId
			const buyerProfile = await ctx.db
				.query('crewProfiles')
				.withIndex('by_user', (q) => q.eq('userId', buyerKey))
				.first()
			recipient = buyerProfile?.email ?? booking.buyerEmail ?? null
			if (buyerProfile) {
				recipientName =
					`${buyerProfile.firstName} ${buyerProfile.lastName}`.trim()
			}
		}
		if (!recipient) return null

		return {
			participantId: participant._id,
			bookingRef: booking.bookingRef,
			berthLabel: participant.berthLabel,
			dataStatus: participant.dataStatus,
			recipient,
			recipientName: recipientName ?? recipient
		}
	}
})

type AdhocResult =
	| { ok: true; messageId?: string; adminCopySent: boolean }
	| { ok: false; reason: string }

function adminCopyTarget(): string | null {
	const target = process.env.ADMIN_ALERT_EMAIL ?? process.env.HANDOFF_REPORT_TO
	return typeof target === 'string' && target.length > 0 ? target : null
}

/**
 * Adhoc payment reminder dispatched from the admin booking drawer.
 * Reuses the same Brevo template as cron reminders, bumps reminderCount and
 * lastReminderSentAt, and (optionally) notifies the operator address.
 */
export const sendAdhocPaymentReminder = action({
	args: {
		paymentId: v.id('bookingPayments'),
		notifyAdmin: v.optional(v.boolean())
	},
	handler: async (ctx, args): Promise<AdhocResult> => {
		const payload: AdhocPaymentPayload | null = await ctx.runQuery(
			internal.admin._resolvePaymentAdhoc,
			{ paymentId: args.paymentId }
		)
		if (!payload) return { ok: false, reason: 'recipient_unavailable' }

		const result = await sendPaymentReminderEmail({
			to: payload.recipient,
			name: payload.recipientName,
			bookingRef: payload.bookingRef,
			paymentLabel: payload.paymentLabel,
			amount: payload.amount,
			currency: payload.currency,
			dueAt: payload.dueAt,
			overdue: payload.overdue,
			reminderCount: payload.reminderCount
		})
		await ctx.runMutation(internal.reminders._markPaymentReminderSent, {
			paymentId: args.paymentId
		})

		let adminCopySent = false
		if (args.notifyAdmin) {
			const target = adminCopyTarget()
			if (target) {
				try {
					await sendAdminCopyEmail({
						to: target,
						subject: `Admin · monit płatności ${payload.bookingRef}`,
						context: `Adhoc monit płatności · ${payload.bookingRef}`,
						summary: `Wysłano monit do ${payload.recipient} (${payload.paymentLabel}). Łączna liczba przypomnień: ${payload.reminderCount}.`
					})
					adminCopySent = true
				} catch (err) {
					console.error('Admin copy failed:', err)
				}
			}
		}

		return { ok: true, messageId: result.messageId, adminCopySent }
	}
})

/**
 * Adhoc crew-data reminder dispatched from the admin booking drawer.
 */
export const sendAdhocCrewDataReminder = action({
	args: {
		participantId: v.id('bookingParticipants'),
		notifyAdmin: v.optional(v.boolean())
	},
	handler: async (ctx, args): Promise<AdhocResult> => {
		const payload: AdhocParticipantPayload | null = await ctx.runQuery(
			internal.admin._resolveParticipantAdhoc,
			{ participantId: args.participantId }
		)
		if (!payload) return { ok: false, reason: 'recipient_unavailable' }

		const result = await sendCrewDataReminderEmail({
			to: payload.recipient,
			name: payload.recipientName,
			bookingRef: payload.bookingRef,
			berthLabel: payload.berthLabel,
			dataStatus: payload.dataStatus,
			participantId: payload.participantId
		})
		await ctx.runMutation(internal.reminders._markParticipantReminderSent, {
			participantId: args.participantId
		})

		let adminCopySent = false
		if (args.notifyAdmin) {
			const target = adminCopyTarget()
			if (target) {
				try {
					await sendAdminCopyEmail({
						to: target,
						subject: `Admin · prośba o dane ${payload.bookingRef}`,
						context: `Adhoc prośba o dane · ${payload.bookingRef}`,
						summary: `Wysłano prośbę o dane do ${payload.recipient} dla koi ${payload.berthLabel}.`
					})
					adminCopySent = true
				} catch (err) {
					console.error('Admin copy failed:', err)
				}
			}
		}

		return { ok: true, messageId: result.messageId, adminCopySent }
	}
})
