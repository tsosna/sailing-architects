import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
	voyageSegments: defineTable({
		slug: v.string(), // "s1" | "s2" | "s3" | "s4"
		name: v.string(), // "Gibraltar → Madera"
		dates: v.string(), // "15–29 Oct 2026"
		startDate: v.number(), // timestamp
		endDate: v.number(),
		pricePerBerth: v.number(), // PLN
		days: v.number()
	}).index('by_slug', ['slug']),

	paymentPlans: defineTable({
		segmentId: v.id('voyageSegments'),
		name: v.string(),
		currency: v.string(), // currently "pln"; modeled explicitly for future EUR
		isActive: v.boolean(),
		allowFullPayment: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_segment', ['segmentId'])
		.index('by_segment_and_is_active', ['segmentId', 'isActive']),

	paymentPlanItems: defineTable({
		planId: v.id('paymentPlans'),
		segmentId: v.id('voyageSegments'),
		label: v.string(), // "Zaliczka", "Rata 1", "Rata 2"
		kind: v.union(
			v.literal('deposit'),
			v.literal('installment'),
			v.literal('balance'),
			v.literal('full'),
			v.literal('custom')
		),
		amountPerBerth: v.number(), // smallest currency unit, e.g. grosze
		dueAt: v.optional(v.number()),
		sortOrder: v.number()
	})
		.index('by_plan', ['planId'])
		.index('by_segment', ['segmentId']),

	berths: defineTable({
		segmentId: v.id('voyageSegments'),
		cabinId: v.string(), // "A" | "B" | "C" | "D" | "E"
		berthId: v.string(), // "A1" | "A2" | "B1" ...
		status: v.union(
			v.literal('available'),
			v.literal('held'), // temporary checkout hold
			v.literal('taken'), // paid booking
			v.literal('captain'), // permanently reserved for skipper
			v.literal('complimentary') // admin-reserved, no payment
		),
		holdExpiresAt: v.optional(v.number()),
		holdPaymentIntentId: v.optional(v.string()),
		bookingPaymentIntentId: v.optional(v.string()),
		guestName: v.optional(v.string()), // set for complimentary
		note: v.optional(v.string())
	})
		.index('by_segment', ['segmentId'])
		.index('by_segment_berth', ['segmentId', 'berthId'])
		.index('by_status_and_hold_expires_at', ['status', 'holdExpiresAt']),

	bookings: defineTable({
		userId: v.string(), // Clerk user ID
		buyerUserId: v.optional(v.string()), // Clerk user ID; replaces userId as the explicit buyer/account owner field
		buyerEmail: v.optional(v.string()),
		berthIds: v.array(v.id('berths')),
		segmentId: v.id('voyageSegments'),
		status: v.union(
			v.literal('pending'),
			v.literal('confirmed'),
			v.literal('cancelled'),
			v.literal('expired')
		),
		stripePaymentIntentId: v.optional(v.string()),
		holdExpiresAt: v.optional(v.number()),
		totalAmount: v.optional(v.number()), // smallest currency unit
		paidAmount: v.optional(v.number()), // smallest currency unit
		currency: v.optional(v.string()),
		paymentStatus: v.optional(
			v.union(
				v.literal('unpaid'),
				v.literal('deposit_paid'),
				v.literal('partially_paid'),
				v.literal('paid'),
				v.literal('overdue'),
				v.literal('cancelled'),
				v.literal('refunded'),
				v.literal('partially_refunded')
			)
		),
		paidAt: v.optional(v.number()),
		confirmationEmailSentAt: v.optional(v.number()),
		confirmationEmailMessageId: v.optional(v.string()),
		bookingRef: v.string() // "SA-2026-XXXX"
	})
		.index('by_user', ['userId'])
		.index('by_buyer_user', ['buyerUserId'])
		.index('by_payment_intent', ['stripePaymentIntentId'])
		.index('by_booking_ref', ['bookingRef'])
		.index('by_status_and_hold_expires_at', ['status', 'holdExpiresAt']),

	bookingPayments: defineTable({
		bookingId: v.id('bookings'),
		buyerUserId: v.string(),
		segmentId: v.id('voyageSegments'),
		paymentPlanId: v.optional(v.id('paymentPlans')),
		paymentPlanItemId: v.optional(v.id('paymentPlanItems')),
		label: v.string(),
		kind: v.union(
			v.literal('deposit'),
			v.literal('installment'),
			v.literal('balance'),
			v.literal('full'),
			v.literal('custom')
		),
		amount: v.number(), // smallest currency unit
		currency: v.string(),
		dueAt: v.optional(v.number()),
		sortOrder: v.number(),
		status: v.union(
			v.literal('pending'),
			v.literal('processing'),
			v.literal('paid'),
			v.literal('failed'),
			v.literal('cancelled'),
			v.literal('overdue')
		),
		stripePaymentIntentId: v.optional(v.string()),
		paidAt: v.optional(v.number()),
		refundedAmount: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
		reminderCount: v.optional(v.number()),
		lastReminderSentAt: v.optional(v.number()),
		confirmationEmailSentAt: v.optional(v.number()),
		confirmationEmailMessageId: v.optional(v.string())
	})
		.index('by_booking', ['bookingId'])
		.index('by_buyer_user', ['buyerUserId'])
		.index('by_payment_intent', ['stripePaymentIntentId'])
		.index('by_status_and_due_at', ['status', 'dueAt'])
		.index('by_buyer_user_and_status', ['buyerUserId', 'status']),

	bookingParticipants: defineTable({
		bookingId: v.id('bookings'),
		buyerUserId: v.string(), // Clerk user ID of the account owner who bought the berth
		segmentId: v.id('voyageSegments'),
		berthId: v.id('berths'),
		berthLabel: v.string(), // denormalized label such as "A1" for dashboard/PDF without extra joins
		dataStatus: v.union(
			v.literal('missing'),
			v.literal('incomplete'),
			v.literal('complete')
		),
		// Verification layer on top of dataStatus. `dataStatus` is "are required
		// fields filled in?", `confirmationStatus` is "did the participant
		// approve them?". They evolve independently — see admin-crew-data-verification-spec.md.
		confirmationStatus: v.optional(
			v.union(
				v.literal('none'),
				v.literal('drafted_by_admin'),
				v.literal('sent'),
				v.literal('confirmed'),
				v.literal('correction_requested'),
				v.literal('expired')
			)
		),
		confirmationSentAt: v.optional(v.number()),
		confirmationExpiresAt: v.optional(v.number()),
		confirmedAt: v.optional(v.number()),
		correctionRequestedAt: v.optional(v.number()),
		correctionNote: v.optional(v.string()),
		adminEditedAt: v.optional(v.number()),
		adminEditedBy: v.optional(v.string()),
		invitedEmail: v.optional(v.string()),
		reminderCount: v.optional(v.number()),
		lastReminderSentAt: v.optional(v.number()),
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
	})
		.index('by_booking', ['bookingId'])
		.index('by_buyer_user', ['buyerUserId'])
		.index('by_booking_and_berth', ['bookingId', 'berthId'])
		.index('by_buyer_user_and_data_status', ['buyerUserId', 'dataStatus'])
		.index('by_data_status_and_last_reminder_sent_at', [
			'dataStatus',
			'lastReminderSentAt'
		]),

	crewConfirmationTokens: defineTable({
		participantId: v.id('bookingParticipants'),
		bookingId: v.id('bookings'),
		tokenHash: v.string(),
		expiresAt: v.number(),
		usedAt: v.optional(v.number()),
		createdAt: v.number(),
		createdByAdminUserId: v.string(),
		sentToEmail: v.string(),
		lastSentAt: v.optional(v.number())
	})
		.index('by_token_hash', ['tokenHash'])
		.index('by_participant', ['participantId']),

	crewProfiles: defineTable({
		userId: v.string(), // Clerk user ID
		firstName: v.string(),
		lastName: v.string(),
		email: v.optional(v.string()),
		dateOfBirth: v.string(),
		birthPlace: v.optional(v.string()),
		nationality: v.string(),
		phone: v.optional(v.string()),
		docType: v.union(v.literal('passport'), v.literal('id')),
		docNumber: v.string(),
		emergencyContactName: v.string(),
		emergencyContactPhone: v.string(),
		swimmingAbility: v.string(),
		sailingExperience: v.string(),
		dietaryRequirements: v.optional(v.string()),
		medicalNotes: v.optional(v.string())
	}).index('by_user', ['userId']),

	refundPolicies: defineTable({
		name: v.string(), // 'default' dla MVP; w przyszłości per-segment lub per-event
		tiers: v.array(
			v.object({
				minDaysBefore: v.number(), // próg w dniach przed rejsem
				refundPercent: v.number() // 0.0 - 1.0 (np. 0.5 = 50%)
			})
		),
		isActive: v.boolean(),
		updatedAt: v.number(),
		updatedBy: v.string() // identity.subject z JWT admina
	}).index('by_is_active', ['isActive']),

	adminAuditLog: defineTable({
		adminUserId: v.string(), // identity.subject z JWT
		action: v.union(
			v.literal('refund_initiated'),
			v.literal('refund_completed'),
			v.literal('refund_failed'),
			v.literal('reblock_berth'),
			v.literal('release_berth_manual'),
			v.literal('policy_updated')
		),
		bookingId: v.optional(v.id('bookings')), // optional bo policy_updated nie dotyczy bookingu
		metadata: v.any() // payload zależny od action
	})
		.index('by_booking', ['bookingId'])
		.index('by_admin', ['adminUserId'])
		.index('by_action', ['action']),

	refunds: defineTable({
		bookingId: v.id('bookings'),
		bookingPaymentId: v.id('bookingPayments'),
		refundBatchId: v.string(), // UUID grupujący gdy 1 refund Michała = N charges
		stripeRefundId: v.optional(v.string()), // re_xxx; optional bo pre-insert PRZED Stripe call
		stripeChargeId: v.string(), // ch_xxx z bookingPayments.stripePaymentIntentId
		amountRequested: v.number(), // grosze — co Michał wpisał (per ten row)
		amountRefunded: v.optional(v.number()), // grosze — co Stripe potwierdził (po webhook)
		currency: v.string(),
		status: v.union(
			v.literal('pending'), // wysłane do Stripe, czekamy webhook
			v.literal('succeeded'), // webhook charge.refunded
			v.literal('failed') // webhook refund.failed
		),
		initiatedByAdminId: v.string(), // identity.subject; null gdy initiatedOutsideApp
		initiatedOutsideApp: v.boolean(), // true gdy refund z Stripe Dashboard (Problem 4)
		policySnapshot: v.optional(
			v.object({
				// optional bo outsideApp nie ma policy
				suggestedPercent: v.number(),
				suggestedAmount: v.number(),
				daysBeforeDeparture: v.number(),
				policyName: v.string(),
				policyId: v.id('refundPolicies')
			})
		),
		releaseBerth: v.boolean(), // co Michał zaznaczył w UI
		berthReleasedAt: v.optional(v.number()), // gdy releaseBerth=true → kiedy faktycznie zwolniono
		reblockedAt: v.optional(v.number()), // gdy Michał później zablokował koję
		reblockedBy: v.optional(v.string()),
		reblockReason: v.optional(v.string()),
		customerEmailSentAt: v.optional(v.number()),
		customerEmailMessageId: v.optional(v.string()),
		adminEmailSentAt: v.optional(v.number()),
		adminEmailMessageId: v.optional(v.string()),
		failureReason: v.optional(v.string()) // refund.failure_reason z Stripe
	})
		.index('by_booking', ['bookingId'])
		.index('by_booking_payment', ['bookingPaymentId'])
		.index('by_refund_batch', ['refundBatchId'])
		.index('by_stripe_refund_id', ['stripeRefundId']) // KLUCZOWE dla idempotency webhook
		.index('by_status', ['status']), // dla failed refunds banner

	unhandledStripeEvents: defineTable({
		eventType: v.string(), // 'charge.refunded', 'charge.refund.updated' itd.
		stripeEventId: v.string(), // evt_xxx — unique per event w Stripe (idempotency)
		stripeChargeId: v.optional(v.string()), // ch_xxx jeśli event powiązany z charge
		stripeRefundId: v.optional(v.string()), // re_xxx jeśli refund event
		rawPayload: v.any(), // pełny event Stripe do późniejszej analizy
		detectedAt: v.number(), // kiedy webhook to dostał
		resolvedAt: v.optional(v.number()), // gdy Michał kliknął decyzję
		resolvedBy: v.optional(v.string()), // identity.subject admina
		resolution: v.optional(
			v.union(
				v.literal('release_berth'), // Michał: „tak, zwolnij koję"
				v.literal('keep_berth'), // Michał: „nie zwalniaj"
				v.literal('orphan') // Michał: „to refund niezwiązany z tym bookingiem"
			)
		),
		notes: v.optional(v.string()), // opcjonalna notatka Michała
		matchedBookingId: v.optional(v.id('bookings')) // znaleziony przy detection po chargeId
	})
		.index('by_event_id', ['stripeEventId']) // idempotency webhook
		.index('by_resolution', ['resolvedAt']) // 'pokaż nieobsłużone' = resolvedAt undefined
		.index('by_matched_booking', ['matchedBookingId'])
})
