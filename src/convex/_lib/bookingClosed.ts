import type { Doc } from '../_generated/dataModel'

export function isBookingClosed(
	booking: Doc<'bookings'>,
	berths: (Doc<'berths'> | null | undefined)[]
): boolean {
	if (booking.paymentStatus !== 'refunded') return false
	return berths.every(
		(b) => !b || b.bookingPaymentIntentId !== booking.stripePaymentIntentId
	)
}
