<script lang="ts">
	import { page } from '$app/state'

	let { children } = $props()

	const navItems = [
		{ href: '/admin', label: 'Sprzedaż i alerty', match: 'overview' },
		{ href: '/admin/automation', label: 'Automatyzacje', match: 'automation' },
		{ href: '/admin/crew', label: 'Dane załogi', match: 'crew' },
		{ href: '/admin/special', label: 'Miejsca specjalne', match: 'special' }
	] as const

	const activeKey = $derived.by(() => {
		const path = page.url.pathname.replace(/\/$/, '')
		if (path === '/admin' || path.endsWith('/admin')) return 'overview'
		if (path.includes('/admin/automation')) return 'automation'
		if (path.includes('/admin/crew')) return 'crew'
		if (path.includes('/admin/special')) return 'special'
		return 'overview'
	})
</script>

<div class="shell">
	<aside class="sidebar">
		<a class="brand" href="/">
			<span class="brand__mark">SA</span>
			<span class="brand__text">
				<strong>Sailing Architects</strong>
				<span>Admin Console</span>
			</span>
		</a>
		<nav class="nav-group" aria-label="Sekcje admina">
			{#each navItems as item (item.href)}
				<a
					class="nav-button"
					data-active={activeKey === item.match || undefined}
					href={item.href}
				>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
		<div class="sidebar-note">
			<p>
				Clerk role: admin. Produkcja: kapitan / operator. Dev: dodatkowy
				operator testowy. Brevo aktywne.
			</p>
		</div>
	</aside>

	<div class="mobilebar">
		<strong>Sailing Architects · Admin</strong>
	</div>
	<nav class="mobile-tabs" aria-label="Sekcje admina (mobile)">
		{#each navItems as item (item.href)}
			<a
				class="nav-button"
				data-active={activeKey === item.match || undefined}
				href={item.href}
			>
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>

	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	:global(:root) {
		--admin-navy: #0d1b2e;
		--admin-navy-mid: #0f1f35;
		--admin-navy-light: #162840;
		--admin-navy-deep: #07111e;
		--admin-brass: #c4923a;
		--admin-brass-light: #d4aa5a;
		--admin-warm-white: #f5f0e8;
		--admin-muted: rgba(245, 240, 232, 0.52);
		--admin-line: rgba(196, 146, 58, 0.16);
		--admin-line-strong: rgba(196, 146, 58, 0.32);
		--admin-danger: #e46d5f;
		--admin-danger-bg: rgba(228, 109, 95, 0.12);
		--admin-ok: #8ac7a4;
		--admin-ok-bg: rgba(138, 199, 164, 0.12);
		--admin-warn: #e0b35f;
		--admin-warn-bg: rgba(224, 179, 95, 0.13);
	}

	.shell {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 248px minmax(0, 1fr);
		background:
			linear-gradient(90deg, rgba(7, 17, 30, 0.72), rgba(13, 27, 46, 0)),
			var(--admin-navy);
		color: var(--admin-warm-white);
		font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif);
	}

	.sidebar {
		position: sticky;
		top: 0;
		height: 100vh;
		padding: 28px 22px;
		background: rgba(7, 17, 30, 0.94);
		border-right: 1px solid var(--admin-line);
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
		color: inherit;
	}

	.brand__mark {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border: 1px solid var(--admin-line-strong);
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-size: 16px;
		color: var(--admin-brass-light);
	}

	.brand__text strong {
		display: block;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-size: 17px;
		font-weight: 400;
	}

	.brand__text > span {
		display: block;
		margin-top: 3px;
		color: var(--admin-muted);
		font-size: 10px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.nav-group {
		display: grid;
		gap: 8px;
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 11px 12px;
		background: transparent;
		border: 1px solid transparent;
		color: rgba(245, 240, 232, 0.68);
		text-align: left;
		font-size: 12px;
		text-decoration: none;
		transition:
			background 140ms ease,
			color 140ms ease;
	}

	.nav-button:hover {
		background: rgba(196, 146, 58, 0.06);
		color: var(--admin-warm-white);
	}

	.nav-button[data-active] {
		background: rgba(196, 146, 58, 0.1);
		border-color: var(--admin-line-strong);
		color: var(--admin-warm-white);
	}

	.sidebar-note {
		margin-top: auto;
		padding: 14px;
		border: 1px solid var(--admin-line);
		background: rgba(245, 240, 232, 0.035);
	}

	.sidebar-note p {
		margin: 0;
		color: var(--admin-muted);
		font-size: 12px;
		line-height: 1.55;
	}

	.main {
		min-width: 0;
		padding: 32px 34px 56px;
	}

	.mobilebar {
		display: none;
	}

	.mobile-tabs {
		display: none;
	}

	@media (max-width: 1180px) {
		.shell {
			grid-template-columns: 1fr;
		}
		.sidebar {
			display: none;
		}
		.mobilebar {
			position: sticky;
			top: 0;
			z-index: 30;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			padding: 14px 18px;
			background: rgba(7, 17, 30, 0.95);
			border-bottom: 1px solid var(--admin-line);
		}
		.mobile-tabs {
			position: sticky;
			top: 53px;
			z-index: 29;
			display: flex;
			gap: 1px;
			overflow-x: auto;
			background: var(--admin-line);
			border-bottom: 1px solid var(--admin-line);
		}
		.mobile-tabs .nav-button {
			min-width: max-content;
			background: var(--admin-navy-mid);
			border: 0;
		}
		.mobile-tabs .nav-button[data-active] {
			background: rgba(196, 146, 58, 0.12);
			box-shadow: inset 0 -2px 0 var(--admin-brass);
		}
	}

	@media (max-width: 760px) {
		.main {
			padding: 22px 16px 42px;
		}
	}
</style>
