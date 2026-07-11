import { describe, it, expect } from 'vitest'
import { matchRefundTier } from './refundTiers'

describe('matchRefundTier (src/convex/_lib/refundTiers.ts)', () => {
	it('Dopasowanie najwyższego progu — dni duże, kilka tiers, trafia najostrzejszy', () => {
		// Arrange
		const tiers: Array<{ minDaysBefore: number; refundPercent: number }> = [
			{ minDaysBefore: 90, refundPercent: 0.9 },
			{ minDaysBefore: 60, refundPercent: 0.5 },
			{ minDaysBefore: 12, refundPercent: 0.15 },
			{ minDaysBefore: 6, refundPercent: 0 }
		]

		// Act
		const result = matchRefundTier({
			tiers,
			daysBeforeDeparture: 126,
			availableToRefund: 1000
		})

		// Assert
		expect(result).toEqual({
			matchedTier: {
				minDaysBefore: 90,
				refundPercent: 0.9
			},
			percent: 0.9,
			suggestedAmount: 900
		})
	})
	it('Nieposortowane wejście — tiers podane w złej kolejności, wynik nadal poprawny. To test-regresja na bug 2 z kroku 1: gdyby ktoś kiedyś usunął sort, ten test robi się czerwony', () => {
		// Arrange
		const tiers: Array<{ minDaysBefore: number; refundPercent: number }> = [
			{ minDaysBefore: 60, refundPercent: 0.5 },
			{ minDaysBefore: 90, refundPercent: 0.9 },
			{ minDaysBefore: 12, refundPercent: 0.15 },
			{ minDaysBefore: 6, refundPercent: 0 }
		]

		// Act
		const result = matchRefundTier({
			tiers,
			daysBeforeDeparture: 126,
			availableToRefund: 1000
		})

		// Assert
		expect(result).toEqual({
			matchedTier: {
				minDaysBefore: 90,
				refundPercent: 0.9
			},
			percent: 0.9,
			suggestedAmount: 900
		})
	})
	it('Granica: dni równe progowi — days === minDaysBefore → tier łapie (warunek >=, nie >)', () => {
		// Arrange
		const tiers: Array<{ minDaysBefore: number; refundPercent: number }> = [
			{ minDaysBefore: 60, refundPercent: 0.5 },
			{ minDaysBefore: 90, refundPercent: 0.9 },
			{ minDaysBefore: 12, refundPercent: 0.15 },
			{ minDaysBefore: 6, refundPercent: 0 }
		]

		// Act
		const result = matchRefundTier({
			tiers,
			daysBeforeDeparture: 60,
			availableToRefund: 1000
		})

		// Assert
		expect(result).toEqual({
			matchedTier: {
				minDaysBefore: 60,
				refundPercent: 0.5
			},
			percent: 0.5,
			suggestedAmount: 500
		})
	})
	it('Brak dopasowania — wszystkie progi wyżej niż dni (np. brak tieru min: 0) → matchedTier: null, percent: 0, suggestedAmount: 0.', () => {
		// Arrange
		const tiers: Array<{ minDaysBefore: number; refundPercent: number }> = [
			{ minDaysBefore: 60, refundPercent: 0.5 },
			{ minDaysBefore: 90, refundPercent: 0.9 },
			{ minDaysBefore: 12, refundPercent: 0.15 },
			{ minDaysBefore: 6, refundPercent: 0 }
		]

		// Act
		const result = matchRefundTier({
			tiers,
			daysBeforeDeparture: 3,
			availableToRefund: 1000
		})

		// Assert
		expect(result).toEqual({
			matchedTier: null,
			percent: 0,
			suggestedAmount: 0
		})
	})
	it('Zaokrąglenie — availableToRefund i percent takie, że wynik ułamkowy → Math.floor w dół. Np. 1001 grosze × 0.5 → 500, nie 500.5.', () => {
		// Arrange
		const tiers: Array<{ minDaysBefore: number; refundPercent: number }> = [
			{ minDaysBefore: 60, refundPercent: 0.5 },
			{ minDaysBefore: 90, refundPercent: 0.9 },
			{ minDaysBefore: 12, refundPercent: 0.15 },
			{ minDaysBefore: 6, refundPercent: 0 }
		]

		// Act
		const result = matchRefundTier({
			tiers,
			daysBeforeDeparture: 60,
			availableToRefund: 1001
		})

		// Assert
		expect(result).toEqual({
			matchedTier: {
				minDaysBefore: 60,
				refundPercent: 0.5
			},
			percent: 0.5,
			suggestedAmount: 500
		})
	})
})
