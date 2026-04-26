import { adapter as svelte } from '@wuchale/svelte'
import { defineConfig } from 'wuchale'

export default defineConfig({
	locales: ['pl', 'en'],
	adapters: {
		main: svelte({ loader: 'svelte' })
	}
})
