import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => {
	const { userId } = locals.auth()
	return { userId }
}
