// Test wzorcowy — przykład struktury dla wszystkich przyszłych testów.
//
// Anatomia jednego testu (wzorzec AAA):
//   Arrange — przygotuj dane wejściowe
//   Act     — wywołaj testowaną funkcję
//   Assert  — sprawdź wynik (expect)
//
// Uruchamianie:
//   pnpm test           — jednorazowo (tak robi CI)
//   pnpm test:watch     — tryb watch przy pisaniu testów
import { describe, it, expect } from 'vitest'
import { calculatePaymentStatusAfterRefund } from './refundStatus'
import { isBookingClosed } from './bookingClosed'
import type { Doc } from '../_generated/dataModel'

describe('calculatePaymentStatusAfterRefund', () => {
	it('zwraca obecny status gdy nic nie zwrócono', () => {
		// Arrange
		const args = {
			totalPaid: 100_00, // grosze: 100 zł
			totalRefunded: 0,
			currentStatus: 'paid' as const
		}
		// Act
		const result = calculatePaymentStatusAfterRefund(args)
		// Assert
		expect(result).toBe('paid')
	})

	it('zwraca partially_refunded gdy zwrot częściowy', () => {
		const result = calculatePaymentStatusAfterRefund({
			totalPaid: 100_00,
			totalRefunded: 30_00,
			currentStatus: 'paid'
		})
		expect(result).toBe('partially_refunded')
	})

	it('zwraca refunded gdy zwrot równy wpłacie (przypadek brzegowy: ==)', () => {
		const result = calculatePaymentStatusAfterRefund({
			totalPaid: 100_00,
			totalRefunded: 100_00,
			currentStatus: 'partially_refunded'
		})
		expect(result).toBe('refunded')
	})

	it('zwraca refunded gdy zwrot przekracza wpłatę (nadmiarowy zwrot)', () => {
		// Nie powinno się zdarzyć w praktyce, ale funkcja musi się
		// zachować przewidywalnie — dlatego testujemy
		const result = calculatePaymentStatusAfterRefund({
			totalPaid: 100_00,
			totalRefunded: 150_00,
			currentStatus: 'paid'
		})
		expect(result).toBe('refunded')
	})

	it('zachowuje deposit_paid gdy zwrot zerowy po zaliczce', () => {
		const result = calculatePaymentStatusAfterRefund({
			totalPaid: 30_00,
			totalRefunded: 0,
			currentStatus: 'deposit_paid'
		})
		expect(result).toBe('deposit_paid')
	})
})

// it.todo = vitest pokazuje je jako "pending" w wynikach.
// Zamień każde na działający test (usuń .todo, dopisz ciało).
describe('isBookingClosed (src/convex/_lib/bookingClosed.ts)', () => {
	it('false gdy paymentStatus inny niż refunded', () => {
		// Arrange — booking, który NIE jest refunded
		const booking = {
			paymentStatus: 'cancelled'
		} as Doc<'bookings'>

		// Act
		const result = isBookingClosed(booking, [])

		// Assert
		expect(result).toBe(false)
	})
	it('true gdy refunded i żadna koja nie wskazuje na paymentIntent bookingu', () => {
		// Arrange — booking, który JEST refunded
		const booking = {
			paymentStatus: 'refunded',
			stripePaymentIntentId: 'pi_123'
		} as Doc<'bookings'>
		const berth = {
			bookingPaymentIntentId: 'pi_other'
		} as Doc<'berths'>

		// Act
		const result = isBookingClosed(booking, [berth])

		// Assert
		expect(result).toBe(true)
	})
	it('false gdy refunded ale koja nadal ma bookingPaymentIntentId bookingu', () => {
		// Arrange — booking, JEST refunded
		const booking = {
			paymentStatus: 'refunded',
			stripePaymentIntentId: 'pi_123'
		} as Doc<'bookings'>
		const berth = {
			bookingPaymentIntentId: 'pi_123'
		} as Doc<'berths'>

		// Act
		const result = isBookingClosed(booking, [berth])

		// Assert
		expect(result).toBe(false)
	})
	it('true gdy refunded a lista koi zawiera null/undefined', () => {
		// Arrange — booking, JEST refunded
		const booking = {
			paymentStatus: 'refunded',
			stripePaymentIntentId: 'pi_123'
		} as Doc<'bookings'>
		const berth = {
			bookingPaymentIntentId: 'pi_123'
		} as Doc<'berths'>

		// Act
		const result = isBookingClosed(booking, [null, undefined, berth])

		// Assert
		expect(result).toBe(false)
	})
})
