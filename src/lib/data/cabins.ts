export type Cabin = {
	id: 'A' | 'B' | 'C' | 'D' | 'E'
	label: string
	position: string
	berths: readonly [string, string]
}

export const cabins: readonly Cabin[] = [
	{
		id: 'A',
		label: 'Kabina A',
		position: 'Dziobowa lewa',
		berths: ['A1', 'A2']
	},
	{
		id: 'B',
		label: 'Kabina B',
		position: 'Dziobowa prawa',
		berths: ['B1', 'B2']
	},
	{ id: 'C', label: 'Kabina C', position: 'Rufowa lewa', berths: ['C1', 'C2'] },
	{
		id: 'D',
		label: 'Kabina D',
		position: 'Rufowa prawa',
		berths: ['D1', 'D2']
	},
	{
		id: 'E',
		label: 'Kabina E',
		position: 'Środkowa prawa (piętrowa)',
		berths: ['E1', 'E2']
	}
]

export function findCabinByBerth(berthId: string): Cabin | undefined {
	return cabins.find((c) => c.berths.includes(berthId))
}
