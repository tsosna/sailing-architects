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

	berths: defineTable({
		segmentId: v.id('voyageSegments'),
		cabinId: v.string(), // "A" | "B" | "C" | "D" | "E"
		berthId: v.string(), // "A1" | "A2" | "B1" ...
		status: v.union(
			v.literal('available'),
			v.literal('taken'), // paid booking
			v.literal('captain'), // permanently reserved for skipper
			v.literal('complimentary') // admin-reserved, no payment
		),
		guestName: v.optional(v.string()), // set for complimentary
		note: v.optional(v.string())
	})
		.index('by_segment', ['segmentId'])
		.index('by_segment_berth', ['segmentId', 'berthId']),

	bookings: defineTable({
		userId: v.string(), // Clerk user ID
		berthId: v.id('berths'),
		segmentId: v.id('voyageSegments'),
		status: v.union(
			v.literal('pending'),
			v.literal('confirmed'),
			v.literal('cancelled')
		),
		stripePaymentIntentId: v.optional(v.string()),
		paidAt: v.optional(v.number()),
		bookingRef: v.string() // "SA-2026-XXXX"
	})
		.index('by_user', ['userId'])
		.index('by_payment_intent', ['stripePaymentIntentId']),

	crewProfiles: defineTable({
		userId: v.string(), // Clerk user ID
		firstName: v.string(),
		lastName: v.string(),
		dateOfBirth: v.string(),
		nationality: v.string(),
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
