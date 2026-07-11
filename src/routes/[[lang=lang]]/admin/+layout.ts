import { loadLocale } from 'wuchale/load-utils'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ params, data }) => {
	await loadLocale(params.lang ?? 'pl')
	return { ...data }
}
