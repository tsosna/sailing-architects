import { describe, it, expect } from 'vitest'
import { shouldCancelPaymentAfterFullRefund } from './refundCancellation'

describe('shouldCancelPaymentAfterFullRefund (src/convex/_lib/refundCancellation.ts)', () => {
	it('Rata pending zostaje zamknięta po pełnym zwrocie', () => {
		// Arrange
		const status = { currentStatus: 'pending' as const }

		// Act
		const result = shouldCancelPaymentAfterFullRefund(status)

		// Assert
		expect(result).toBe(true)
	})

	it('Rata overdue płatność przeterminowana zostaje zamknięta po pełnym zwrocie"', () => {
		// Arrange
		const status = { currentStatus: 'overdue' as const }

		// Act
		const result = shouldCancelPaymentAfterFullRefund(status)

		// Assert
		expect(result).toBe(true)
	})

	it('Rata failed nie została prawidłowo opłacono zostaje zamknięta po pełnym zwrocie"', () => {
		// Arrange
		const status = { currentStatus: 'failed' as const }

		// Act
		const result = shouldCancelPaymentAfterFullRefund(status)

		// Assert
		expect(result).toBe(true)
	})

	it('Rata paid pminięta bo pieniądze wpłacone rata do zwrotu', () => {
		// Arrange
		const status = { currentStatus: 'paid' as const }

		// Act
		const result = shouldCancelPaymentAfterFullRefund(status)

		// Assert
		expect(result).toBe(false)
	})

	it('Rata cancelled zastaje ominięta bo już zamknięta — powtórny zapis skłamałby updatedAt lub Michał zablokował', () => {
		// Arrange
		const status = {
			currentStatus: 'cancelled' as const
		}

		// Act
		const result = shouldCancelPaymentAfterFullRefund(status)

		// Assert
		expect(result).toBe(false)
	})

	it('Rata processing zostaje nietknięta — pieniądze są w locie w Stripe', () => {
		// Arrange
		const status = {
			currentStatus: 'processing' as const
		}

		// Act
		const result = shouldCancelPaymentAfterFullRefund(status)

		// Assert
		expect(result).toBe(false)
	})
})
