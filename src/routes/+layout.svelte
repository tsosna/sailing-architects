<script lang="ts">
	import '../app.css'
	import { setupConvex } from 'convex-svelte'
	import { ClerkProvider } from 'svelte-clerk'
	import { plPL } from '@clerk/localizations'
	import { PUBLIC_CONVEX_URL } from '$env/static/public'

	setupConvex(PUBLIC_CONVEX_URL)

	let { children } = $props()

	const clerkAppearance = {
		variables: {
			colorPrimary: '#c4923a',
			colorBackground: '#0d1b2e',
			colorText: '#f5f0e8',
			colorInputBackground: '#07111e',
			borderRadius: '2px'
		}
	}
</script>

<ClerkProvider localization={plPL} appearance={clerkAppearance}>
	{@render children()}
</ClerkProvider>
