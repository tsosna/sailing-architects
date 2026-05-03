<script lang="ts">
	import { resolve } from '$app/paths'
	import { LanguageSwitcher } from '$components/language-switcher'
	import { bookingSelection } from '$lib/state/booking-selection.svelte'

	let scrolled = $state(false)
	let menuOpen = $state(false)

	$effect(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 60
		}
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	})

	$effect(() => {
		if (!menuOpen) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') menuOpen = false
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	})

	const links = [
		['Jacht', `${resolve('/')}#vessel`],
		['Trasa', `${resolve('/')}#route`],
		['Kajuty', `${resolve('/')}#cabins`],
		['Cennik', `${resolve('/')}#pricing`],
		['Poradnik', resolve('/poradnik')]
	] as const

	const reserveHref = $derived(bookingSelection.bookingPath(resolve('/book')))

	function closeMenu() {
		menuOpen = false
	}
</script>

<nav class="site-nav" class:site-nav--scrolled={scrolled || menuOpen}>
	<a class="brand" href={resolve('/')} onclick={closeMenu}>
		<span class="brand__mark">
			<img src="/images/brand/logo.png" alt="" />
		</span>
		<span>Sailing Architects</span>
	</a>

	<div class="cluster">
		{#each links as [label, href] (href)}
			<a class="link" {href}>{label}</a>
		{/each}
		<LanguageSwitcher />
		<a
			class="btn btn--ghost"
			href={`${resolve('/book')}?auth=signin&next=dashboard`}>Panel</a
		>
		<a class="btn btn--primary" href={reserveHref}>Rezerwuj</a>
	</div>

	<button
		type="button"
		class="hamburger"
		class:hamburger--open={menuOpen}
		aria-expanded={menuOpen}
		aria-controls="site-nav-mobile"
		aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
		onclick={() => (menuOpen = !menuOpen)}
	>
		<span class="hamburger__line"></span>
		<span class="hamburger__line"></span>
		<span class="hamburger__line"></span>
	</button>
</nav>

{#if menuOpen}
	<div
		id="site-nav-mobile"
		class="mobile-menu"
		role="dialog"
		aria-modal="false"
		aria-label="Menu"
	>
		<div class="mobile-menu__links">
			{#each links as [label, href] (href)}
				<a class="mobile-menu__link" {href} onclick={closeMenu}>{label}</a>
			{/each}
		</div>

		<div class="mobile-menu__actions">
			<a
				class="btn btn--ghost btn--full"
				href={`${resolve('/book')}?auth=signin&next=dashboard`}
				onclick={closeMenu}>Panel</a
			>
			<a
				class="btn btn--primary btn--full"
				href={reserveHref}
				onclick={closeMenu}>Rezerwuj</a
			>
		</div>

		<div class="mobile-menu__lang">
			<span class="mobile-menu__lang-label">Język</span>
			<LanguageSwitcher />
		</div>
	</div>
{/if}

<style>
	.site-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		height: 64px;
		padding: 0 32px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: transparent;
		backdrop-filter: none;
		border-bottom: 1px solid transparent;
		transition:
			background 300ms ease,
			backdrop-filter 300ms ease,
			border-color 300ms ease;
	}

	.site-nav--scrolled {
		background: rgba(13, 27, 46, 0.97);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom-color: rgba(196, 146, 58, 0.1);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
		color: var(--color-warm-white);
	}

	.brand__mark {
		width: 46px;
		height: 46px;
		display: grid;
		place-items: center;
		background: transparent;
		border: 1px solid rgba(196, 146, 58, 0.28);
		box-shadow: inset 0 0 0 1px rgba(196, 146, 58, 0.08);
		overflow: hidden;
		flex: 0 0 auto;
	}

	.brand__mark img {
		width: 88%;
		height: 88%;
		object-fit: contain;
		display: block;
	}

	.brand > span:last-child {
		font-family: var(--font-serif);
		font-size: 16px;
		letter-spacing: 1px;
	}

	.cluster {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.link {
		font-family: var(--font-sans);
		font-size: 12px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: rgba(245, 240, 232, 0.6);
		text-decoration: none;
		transition: color 200ms ease;
	}

	.link:hover {
		color: var(--color-brass-text);
	}

	.btn {
		font-family: var(--font-sans);
		text-transform: uppercase;
		cursor: pointer;
		text-decoration: none;
		border-radius: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 200ms ease,
			color 200ms ease,
			border-color 200ms ease;
	}

	.btn--ghost {
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.3);
		padding: 8px 16px;
		color: rgba(245, 240, 232, 0.6);
		font-size: 11px;
		letter-spacing: 1.5px;
	}

	.btn--ghost:hover {
		color: var(--color-warm-white);
		border-color: var(--color-brass);
	}

	.btn--primary {
		background: var(--color-brass);
		border: none;
		padding: 10px 24px;
		color: var(--color-navy);
		font-weight: 700;
		font-size: 11px;
		letter-spacing: 2px;
	}

	.btn--primary:hover {
		background: var(--color-brass-light);
	}

	.btn--full {
		width: 100%;
		padding-top: 14px;
		padding-bottom: 14px;
	}

	.hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 5px;
		width: 40px;
		height: 40px;
		padding: 0;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.3);
		cursor: pointer;
	}

	.hamburger__line {
		display: block;
		width: 18px;
		height: 1px;
		background: var(--color-warm-white);
		transition:
			transform 200ms ease,
			opacity 200ms ease;
	}

	.hamburger--open .hamburger__line:nth-child(1) {
		transform: translateY(6px) rotate(45deg);
	}

	.hamburger--open .hamburger__line:nth-child(2) {
		opacity: 0;
	}

	.hamburger--open .hamburger__line:nth-child(3) {
		transform: translateY(-6px) rotate(-45deg);
	}

	.mobile-menu {
		position: fixed;
		top: 64px;
		left: 0;
		right: 0;
		z-index: 99;
		background: rgba(13, 27, 46, 0.98);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(196, 146, 58, 0.15);
		padding: 24px 24px 28px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.mobile-menu__links {
		display: flex;
		flex-direction: column;
	}

	.mobile-menu__link {
		font-family: var(--font-sans);
		font-size: 13px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(245, 240, 232, 0.75);
		text-decoration: none;
		padding: 14px 0;
		border-bottom: 1px solid rgba(196, 146, 58, 0.08);
	}

	.mobile-menu__link:hover {
		color: var(--color-brass-text);
	}

	.mobile-menu__actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.mobile-menu__lang {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.mobile-menu__lang-label {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.55);
	}

	@media (max-width: 900px) {
		.site-nav {
			padding: 0 20px;
		}

		.cluster {
			display: none;
		}

		.hamburger {
			display: flex;
		}
	}

	@media (max-width: 480px) {
		.brand > span:last-child {
			display: none;
		}
	}
</style>
