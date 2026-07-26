import { describe, it, expect } from 'vitest'
import { isBerthFree } from './berthFree'

const NOW = 1_800_000_000_000

describe('isBerthFree (src/convex/_lib/berthFree.ts)', () => {
	it('Koja available jest wolna', () => {
		// Arrange
		const berth = { status: 'available' as const }

		// Act
		const result = isBerthFree(berth, NOW)

		// Assert
		expect(result).toBe(true)
	})

	it('Koja taken jest zajęta', () => {
		// Arrange
		const berth = { status: 'taken' as const }

		// Act
		const result = isBerthFree(berth, NOW)

		// Assert
		expect(result).toBe(false)
	})

	it('Koja captain jest zajęta', () => {
		// Arrange
		const berth = { status: 'captain' as const }

		// Act
		const result = isBerthFree(berth, NOW)

		// Assert
		expect(result).toBe(false)
	})

	it('Koja complimentary jest zajęta', () => {
		// Arrange
		const berth = { status: 'complimentary' as const }

		// Act
		const result = isBerthFree(berth, NOW)

		// Assert
		expect(result).toBe(false)
	})

	it('Koja held bez liczbowego holdExpiresAt jest zajęta', () => {
		// Arrange
		const berth = { status: 'held' as const, holdExpiresAt: undefined }

		// Act
		const result = isBerthFree(berth, NOW)

		// Assert
		expect(result).toBe(false)
	})

	it('Koja held z wygasłym holdem jest wolna', () => {
		// Arrange
		const berth = { status: 'held' as const, holdExpiresAt: NOW - 60_000 }

		// Act
		const result = isBerthFree(berth, NOW)

		// Assert
		expect(result).toBe(true)
	})

	it('Koja held z holdExpiresAt w przyszłości jest zajęta', () => {
		// Arrange
		const berth = { status: 'held' as const, holdExpiresAt: NOW + 60_000 }

		// Act
		const result = isBerthFree(berth, NOW)

		// Assert
		expect(result).toBe(false)
	})
})
