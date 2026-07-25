const LOW_STOCK = 3

/** Tekst badge'a dostępności; null = nic nie renderuj. */

export type BerthBadge = { text: string; tone: 'sold-out' | 'low-stock' }

export function berthBadge(free: number | undefined): BerthBadge | null {
	if (free === undefined) return null
	if (free === 0) return { text: 'Wyprzedane', tone: 'sold-out' }
	if (free > LOW_STOCK) return null
	return {
		text: `Wolne ${free} ${free === 1 ? 'miejsce' : 'miejsca'}`,
		tone: 'low-stock'
	}
}
