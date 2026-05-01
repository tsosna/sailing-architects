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
				v.literal('cancelled')
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
	}).index('by_user', ['userId'])
})
