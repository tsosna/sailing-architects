import { loadLocale } from 'wuchale/load-utils'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ params, data }) => {
	console.log('[crew/confirm layout.ts] params.lang =', params.lang)
	await loadLocale(params.lang ?? 'pl')
	console.log('[crew/confirm layout.ts] locale loaded')
}
