<script lang="ts">
	import { SiteNav } from '$components/site-nav'
	import type { LayoutProps } from './$types'

	let { children }: LayoutProps = $props()
</script>

<SiteNav />
{@render children()}
