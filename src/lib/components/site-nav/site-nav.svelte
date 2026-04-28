<script lang="ts">
	import { resolve } from '$app/paths'

	let scrolled = $state(false)

	$effect(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 60
		}
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	})

	const links = [
		['Jacht', `${resolve('/')}#vessel`],
		['Trasa', `${resolve('/')}#route`],
		['Kajuty', `${resolve('/')}#cabins`],
		['Cennik', `${resolve('/')}#pricing`]
	] as const
</script>

<nav class="site-nav" class:site-nav--scrolled={scrolled}>
	<a class="brand" href={resolve('/')}>
		<span class="brand__mark">
			<img src="/images/brand/logo.png" alt="" />
		</span>
		<span>Sailing Architects</span>
	</a>

	<div class="cluster">
		{#each links as [label, href] (href)}
			<a class="link" {href}>{label}</a>
		{/each}
		<a class="btn btn--ghost" href={resolve('/dashboard')}>Panel</a>
		<a class="btn btn--primary" href={resolve('/book')}>Rezerwuj</a>
	</div>
</nav>

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
		background: rgba(245, 240, 232, 0.96);
		border: 1px solid rgba(196, 146, 58, 0.48);
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
		gap: 32px;
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

	@media (max-width: 720px) {
		.site-nav {
			padding: 0 20px;
		}
		.cluster {
			gap: 16px;
		}
		.link {
			display: none;
		}
	}
</style>
