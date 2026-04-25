<script lang="ts">
	import '../app.css'
	import { setupConvex } from 'convex-svelte'
	import { ClerkProvider } from 'svelte-clerk'
	import { PUBLIC_CONVEX_URL } from '$env/static/public'

	setupConvex(PUBLIC_CONVEX_URL)

	let { children } = $props()
</script>

<ClerkProvider>
	{@render children()}
</ClerkProvider>
