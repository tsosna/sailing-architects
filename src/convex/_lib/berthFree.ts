import type { Doc } from '../_generated/dataModel'

export function isBerthFree(
	berth: Pick<Doc<'berths'>, 'status' | 'holdExpiresAt'>,
	now: number
): boolean {
	if (berth.status === 'available') return true
	if (berth.status !== 'held') return false
	return !(typeof berth.holdExpiresAt === 'number' && berth.holdExpiresAt > now)
}
