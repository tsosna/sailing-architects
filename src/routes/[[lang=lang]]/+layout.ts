import { loadLocale } from 'wuchale/load-utils'

export const load = async ({ params }) => {
	await loadLocale(params.lang ?? 'pl')
	return {}
}
