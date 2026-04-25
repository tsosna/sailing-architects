export type VoyageSegment = {
	id: string
	name: string
	dates: string
	days: number
	price: number
}

export const voyageSegments: readonly VoyageSegment[] = [
	{ id: 's1', name: 'Majorka → Gibraltar', dates: '4–11.10.2026', days: 7, price: 1800 },
	{ id: 's2', name: 'Gibraltar → Madera', dates: '12–21.10.2026', days: 9, price: 2300 },
	{ id: 's3', name: 'Madera → Teneryfa', dates: '22–31.10.2026', days: 9, price: 2300 },
	{ id: 's4', name: 'Teneryfa → Cabo Verde', dates: '1–14.11.2026', days: 13, price: 3200 }
]
