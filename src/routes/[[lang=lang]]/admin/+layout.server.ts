import { requireAdmin } from '$lib/server/admin-guard'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	const admin = await requireAdmin(locals)
	return { admin }
}
