<script lang="ts">
	import { page } from '$app/state'

	type Lang = 'pl' | 'en'

	const locales: ReadonlyArray<Lang> = ['pl', 'en']

	const current = $derived<Lang>(
		(page.params.lang as Lang | undefined) ?? 'pl'
	)

	function buildHref(target: Lang): string {
		const pathname = page.url.pathname
		const search = page.url.search
		const hash = page.url.hash
		const stripped = pathname.replace(/^\/(en|pl)(?=\/|$)/, '') || '/'
		const path =
			target === 'pl'
				? stripped
				: stripped === '/'
					? '/en'
					: `/en${stripped}`
		return `${path}${search}${hash}`
	}
</script>

<div class="lang" role="group" aria-label="Wybór języka">
	{#each locales as locale (locale)}
		<a
			class="lang__btn"
			class:lang__btn--active={current === locale}
			href={buildHref(locale)}
			aria-current={current === locale ? 'true' : undefined}
			data-sveltekit-reload>{locale.toUpperCase()}</a
		>
	{/each}
</div>

<style>
	.lang {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		border: 1px solid rgba(196, 146, 58, 0.3);
	}

	.lang__btn {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 1.5px;
		padding: 7px 10px;
		color: rgba(245, 240, 232, 0.55);
		text-decoration: none;
		transition:
			color 200ms ease,
			background-color 200ms ease;
	}

	.lang__btn:hover {
		color: var(--color-warm-white);
	}

	.lang__btn--active {
		background: rgba(196, 146, 58, 0.15);
		color: var(--color-brass-text);
	}
</style>
