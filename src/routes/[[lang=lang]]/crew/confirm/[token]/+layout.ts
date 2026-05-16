import { loadLocale } from 'wuchale/load-utils'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ params }) => {
	await loadLocale(params.lang ?? 'pl')
}
