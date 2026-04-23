<script lang="ts">
	import '../app.css'
	import { setupConvex } from 'convex-svelte'
	import { PUBLIC_CONVEX_URL } from '$env/static/public'

	setupConvex(PUBLIC_CONVEX_URL)

	let { children } = $props()
</script>

{@render children()}
