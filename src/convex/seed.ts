import { mutation } from './_generated/server'

/**
 * One-time seed: inserts all 4 voyage segments and 10 berths per segment.
 * Idempotent — skips if data already exists.
 * Call once from the Convex dashboard or via ConvexHttpClient in dev.
 */
export const initializeVoyage = mutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db.query('voyageSegments').first()
		if (existing) return { status: 'already_seeded' as const }

		const BERTH_IDS = [
			'A1',
			'A2',
			'B1',
			'B2',
			'C1',
			'C2',
			'D1',
			'D2',
			'E1',
			'E2'
		] as const
		const BERTH_CABIN: Record<string, string> = {
			A1: 'A',
			A2: 'A',
			B1: 'B',
			B2: 'B',
			C1: 'C',
			C2: 'C',
			D1: 'D',
			D2: 'D',
			E1: 'E',
			E2: 'E'
		}

		const segments = [
			{
				slug: 's1',
				name: 'Majorka → Gibraltar',
				dates: '4–11.10.2026',
				startDate: new Date('2026-10-04').getTime(),
				endDate: new Date('2026-10-11').getTime(),
				pricePerBerth: 1800,
				days: 7
			},
			{
				slug: 's2',
				name: 'Gibraltar → Madera',
				dates: '12–21.10.2026',
				startDate: new Date('2026-10-12').getTime(),
				endDate: new Date('2026-10-21').getTime(),
				pricePerBerth: 2300,
				days: 9
			},
			{
				slug: 's3',
				name: 'Madera → Teneryfa',
				dates: '22–31.10.2026',
				startDate: new Date('2026-10-22').getTime(),
				endDate: new Date('2026-10-31').getTime(),
				pricePerBerth: 2300,
				days: 9
			},
			{
				slug: 's4',
				name: 'Teneryfa → Cabo Verde',
				dates: '1–14.11.2026',
				startDate: new Date('2026-11-01').getTime(),
				endDate: new Date('2026-11-14').getTime(),
				pricePerBerth: 3200,
				days: 13
			}
		]

		let berthCount = 0
		for (const seg of segments) {
			const segmentId = await ctx.db.insert('voyageSegments', seg)
			for (const berthId of BERTH_IDS) {
				await ctx.db.insert('berths', {
					segmentId,
					cabinId: BERTH_CABIN[berthId],
					berthId,
					// C1 is permanently reserved for the skipper
					status: berthId === 'C1' ? 'captain' : 'available'
				})
				berthCount++
			}
		}

		return {
			status: 'seeded' as const,
			segments: segments.length,
			berths: berthCount
		}
	}
})
