import {
	action,
	internalMutation,
	internalQuery,
	mutation,
	query
} from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'
import { panelUrl } from './_brevo'
import { sendCrewConfirmationEmail } from './_emails'

const TOKEN_VALIDITY_MS = 14 * 24 * 60 * 60 * 1000

function generateToken(): string {
	const bytes = new Uint8Array(32)
	crypto.getRandomValues(bytes)
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder()
	const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(token))
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

function buildConfirmUrl(token: string): string {
	const base = panelUrl(`/crew/confirm/${encodeURIComponent(token)}`)
	return base
}

type DispatchPayload = {
	participantId: Id<'bookingParticipants'>
	bookingRef: string
	berthLabel: string
	recipient: string
	recipientName: string
}

/* ---------- Internal helpers (admin flow) ---------- */

export const _resolveConfirmationDispatch = internalQuery({
	args: { participantId: v.id('bookingParticipants') },
	handler: async (ctx, { participantId }): Promise<DispatchPayload | null> => {
		const participant = await ctx.db.get(participantId)
		if (!participant) return null
		if (participant.dataStatus !== 'complete') return null

		const booking = await ctx.db.get(participant.bookingId)
		if (!booking) return null

		let recipient: string | null = null
		let recipientName: string | null = null
		if (participant.email) {
			recipient = participant.email
		} else if (participant.invitedEmail) {
			recipient = participant.invitedEmail
		}
		if (recipient) {
			const stitched =
				`${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim()
			recipientName = stitched || null
		}

		if (!recipient) {
			recipient = booking.buyerEmail ?? null
			const buyerKey = booking.buyerUserId ?? booking.userId
			const buyerProfile = await ctx.db
				.query('crewProfiles')
				.withIndex('by_user', (q) => q.eq('userId', buyerKey))
				.first()
			if (buyerProfile?.email) recipient = buyerProfile.email
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
			recipient,
			recipientName: recipientName ?? recipient
		}
	}
})

export const _persistConfirmationDispatch = internalMutation({
	args: {
		participantId: v.id('bookingParticipants'),
		tokenHash: v.string(),
		expiresAt: v.number(),
		recipientEmail: v.string(),
		adminUserId: v.string()
	},
	handler: async (ctx, args) => {
		const participant = await ctx.db.get(args.participantId)
		if (!participant) throw new Error('Participant disappeared')
		const now = Date.now()

		// Invalidate any earlier active tokens for the same participant.
		const existing = await ctx.db
			.query('crewConfirmationTokens')
			.withIndex('by_participant', (q) =>
				q.eq('participantId', args.participantId)
			)
			.collect()
		for (const row of existing) {
			if (!row.usedAt) {
				await ctx.db.patch(row._id, { usedAt: now })
			}
		}

		await ctx.db.insert('crewConfirmationTokens', {
			participantId: args.participantId,
			bookingId: participant.bookingId,
			tokenHash: args.tokenHash,
			expiresAt: args.expiresAt,
			createdAt: now,
			createdByAdminUserId: args.adminUserId,
			sentToEmail: args.recipientEmail,
			lastSentAt: now
		})

		await ctx.db.patch(args.participantId, {
			confirmationStatus: 'sent',
			confirmationSentAt: now,
			confirmationExpiresAt: args.expiresAt
		})
	}
})

type SendResult =
	| {
			ok: true
			confirmUrl: string
			expiresAt: number
			recipient: string
			messageId?: string
	  }
	| { ok: false; reason: string }

/**
 * Admin: create a crew confirmation token and email the participant a link.
 * Hashes the token (only the hash is stored), invalidates earlier tokens for
 * the same participant, and patches the participant to `confirmationStatus = sent`.
 * Returns the bare URL once so the admin can also copy it manually.
 */
export const sendCrewConfirmationLink = action({
	args: {
		participantId: v.id('bookingParticipants'),
		adminUserId: v.string()
	},
	handler: async (ctx, args): Promise<SendResult> => {
		const dispatch: DispatchPayload | null = await ctx.runQuery(
			internal.crewConfirmation._resolveConfirmationDispatch,
			{ participantId: args.participantId }
		)
		if (!dispatch) return { ok: false, reason: 'recipient_unavailable' }

		const token = generateToken()
		const tokenHash = await hashToken(token)
		const expiresAt = Date.now() + TOKEN_VALIDITY_MS
		const confirmUrl = buildConfirmUrl(token)

		try {
			const result = await sendCrewConfirmationEmail({
				to: dispatch.recipient,
				name: dispatch.recipientName,
				bookingRef: dispatch.bookingRef,
				berthLabel: dispatch.berthLabel,
				confirmUrl,
				expiresAt
			})
			await ctx.runMutation(
				internal.crewConfirmation._persistConfirmationDispatch,
				{
					participantId: args.participantId,
					tokenHash,
					expiresAt,
					recipientEmail: dispatch.recipient,
					adminUserId: args.adminUserId
				}
			)
			return {
				ok: true,
				confirmUrl,
				expiresAt,
				recipient: dispatch.recipient,
				messageId: result.messageId
			}
		} catch (err) {
			console.error('Crew confirmation email failed:', err)
			return {
				ok: false,
				reason: err instanceof Error ? err.message : 'email_failed'
			}
		}
	}
})

/* ---------- Public flow (no auth) ---------- */

type PublicConfirmationView =
	| {
			status: 'invalid'
			reason: 'not_found' | 'expired' | 'already_used'
	  }
	| {
			status: 'ready'
			bookingRef: string
			berthLabel: string
			expiresAt: number
			confirmationStatus:
				| 'sent'
				| 'confirmed'
				| 'correction_requested'
				| 'drafted_by_admin'
				| 'expired'
			confirmedAt?: number
			correctionNote?: string
			participant: {
				firstName?: string
				lastName?: string
				email?: string
				dateOfBirth?: string
				birthPlace?: string
				nationality?: string
				phone?: string
				docType?: 'passport' | 'id'
				docNumber?: string
				emergencyContactName?: string
				emergencyContactPhone?: string
				swimmingAbility?: string
				sailingExperience?: string
				dietaryRequirements?: string
				medicalNotes?: string
			}
	  }

async function findActiveTokenRow(
	db: any,
	tokenHash: string
): Promise<{
	_id: Id<'crewConfirmationTokens'>
	participantId: Id<'bookingParticipants'>
	expiresAt: number
	usedAt?: number
} | null> {
	const row = await db
		.query('crewConfirmationTokens')
		.withIndex('by_token_hash', (q: any) => q.eq('tokenHash', tokenHash))
		.first()
	return row
}

export const getCrewConfirmationByToken = query({
	args: { token: v.string() },
	handler: async (ctx, { token }): Promise<PublicConfirmationView> => {
		const tokenHash = await hashToken(token)
		const row = await findActiveTokenRow(ctx.db, tokenHash)
		if (!row) return { status: 'invalid', reason: 'not_found' }
		if (row.usedAt) return { status: 'invalid', reason: 'already_used' }
		if (row.expiresAt < Date.now()) {
			return { status: 'invalid', reason: 'expired' }
		}

		const participant = await ctx.db.get(row.participantId)
		if (!participant) return { status: 'invalid', reason: 'not_found' }
		const booking = await ctx.db.get(participant.bookingId)
		if (!booking) return { status: 'invalid', reason: 'not_found' }

		return {
			status: 'ready',
			bookingRef: booking.bookingRef,
			berthLabel: participant.berthLabel,
			expiresAt: row.expiresAt,
			confirmationStatus:
				participant.confirmationStatus === 'confirmed' ||
				participant.confirmationStatus === 'correction_requested' ||
				participant.confirmationStatus === 'drafted_by_admin' ||
				participant.confirmationStatus === 'expired'
					? participant.confirmationStatus
					: 'sent',
			confirmedAt: participant.confirmedAt,
			correctionNote: participant.correctionNote,
			participant: {
				firstName: participant.firstName,
				lastName: participant.lastName,
				email: participant.email,
				dateOfBirth: participant.dateOfBirth,
				birthPlace: participant.birthPlace,
				nationality: participant.nationality,
				phone: participant.phone,
				docType: participant.docType,
				docNumber: participant.docNumber,
				emergencyContactName: participant.emergencyContactName,
				emergencyContactPhone: participant.emergencyContactPhone,
				swimmingAbility: participant.swimmingAbility,
				sailingExperience: participant.sailingExperience,
				dietaryRequirements: participant.dietaryRequirements,
				medicalNotes: participant.medicalNotes
			}
		}
	}
})

type PublicActionResult =
	| { ok: true }
	| { ok: false; reason: 'not_found' | 'expired' | 'already_used' }

export const confirmCrewDataByToken = mutation({
	args: { token: v.string() },
	handler: async (ctx, { token }): Promise<PublicActionResult> => {
		const tokenHash = await hashToken(token)
		const row = await findActiveTokenRow(ctx.db, tokenHash)
		if (!row) return { ok: false, reason: 'not_found' }
		if (row.usedAt) return { ok: false, reason: 'already_used' }
		const now = Date.now()
		if (row.expiresAt < now) {
			await ctx.db.patch(row.participantId, {
				confirmationStatus: 'expired'
			})
			return { ok: false, reason: 'expired' }
		}

		await ctx.db.patch(row._id, { usedAt: now })
		await ctx.db.patch(row.participantId, {
			confirmationStatus: 'confirmed',
			confirmedAt: now,
			correctionNote: undefined,
			correctionRequestedAt: undefined
		})
		return { ok: true }
	}
})

export const requestCrewDataCorrectionByToken = mutation({
	args: { token: v.string(), note: v.string() },
	handler: async (ctx, { token, note }): Promise<PublicActionResult> => {
		const trimmed = note.trim()
		if (!trimmed) {
			return { ok: false, reason: 'not_found' }
		}
		const tokenHash = await hashToken(token)
		const row = await findActiveTokenRow(ctx.db, tokenHash)
		if (!row) return { ok: false, reason: 'not_found' }
		if (row.usedAt) return { ok: false, reason: 'already_used' }
		const now = Date.now()
		if (row.expiresAt < now) {
			await ctx.db.patch(row.participantId, {
				confirmationStatus: 'expired'
			})
			return { ok: false, reason: 'expired' }
		}

		await ctx.db.patch(row._id, { usedAt: now })
		await ctx.db.patch(row.participantId, {
			confirmationStatus: 'correction_requested',
			correctionRequestedAt: now,
			correctionNote: trimmed.slice(0, 2000)
		})
		return { ok: true }
	}
})

/* ---------- Admin: manual confirmation override ---------- */

export const adminMarkConfirmedManually = mutation({
	args: {
		participantId: v.id('bookingParticipants'),
		adminUserId: v.string()
	},
	handler: async (ctx, args) => {
		const participant = await ctx.db.get(args.participantId)
		if (!participant) throw new Error('Participant not found')
		if (participant.dataStatus !== 'complete') {
			throw new Error('Dane są niekompletne — uzupełnij je zanim potwierdzisz.')
		}
		const now = Date.now()
		await ctx.db.patch(args.participantId, {
			confirmationStatus: 'confirmed',
			confirmedAt: now,
			adminEditedAt: now,
			adminEditedBy: args.adminUserId
		})

		// Burn outstanding tokens — no public link should keep working after a
		// manual override.
		const tokens = await ctx.db
			.query('crewConfirmationTokens')
			.withIndex('by_participant', (q) =>
				q.eq('participantId', args.participantId)
			)
			.collect()
		for (const row of tokens) {
			if (!row.usedAt) await ctx.db.patch(row._id, { usedAt: now })
		}
	}
})
