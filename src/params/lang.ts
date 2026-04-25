import type { ParamMatcher } from '@sveltejs/kit'

const locales = ['pl', 'en']

export const match: ParamMatcher = (param) => {
	return locales.includes(param)
}
