<script lang="ts">
	import { page } from '$app/state'

	const status = $derived(page.status)
	const isForbidden = $derived(status === 403)
	const message = $derived(
		isForbidden
			? 'Ten obszar jest zarezerwowany dla operatorów rejsu. Twoje konto nie ma uprawnień administracyjnych.'
			: (page.error?.message ?? 'Nieoczekiwany błąd.')
	)
</script>

<svelte:head>
	<title>Brak dostępu · Sailing Architects</title>
</svelte:head>

<div class="forbidden">
	<div class="forbidden__card">
		<span class="forbidden__eyebrow">Sailing Architects · Admin</span>
		<h1 class="forbidden__title">
			{isForbidden ? 'Brak dostępu' : 'Coś poszło nie tak'}
		</h1>
		<p class="forbidden__copy">{message}</p>
		<div class="forbidden__actions">
			<a class="forbidden__btn" href="/dashboard">Wróć do panelu</a>
			<a class="forbidden__btn forbidden__btn--ghost" href="/">Strona główna</a>
		</div>
	</div>
</div>

<style>
	.forbidden {
		min-height: 100vh;
		background: var(--color-navy);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
		font-family: var(--font-sans);
	}

	.forbidden__card {
		max-width: 520px;
		width: 100%;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(196, 146, 58, 0.25);
		padding: 40px;
	}

	.forbidden__eyebrow {
		font-size: 11px;
		letter-spacing: 3px;
		text-transform: uppercase;
		color: var(--color-brass);
	}

	.forbidden__title {
		font-family: var(--font-serif);
		font-weight: 400;
		font-size: 32px;
		color: var(--color-warm-white);
		margin: 16px 0 12px;
	}

	.forbidden__copy {
		font-size: 14px;
		line-height: 1.6;
		color: rgba(245, 240, 232, 0.7);
		margin: 0 0 28px;
	}

	.forbidden__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.forbidden__btn {
		padding: 12px 20px;
		background: var(--color-brass);
		color: var(--color-navy);
		font-size: 12px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		font-weight: 700;
		text-decoration: none;
		transition: background-color 150ms ease;
	}

	.forbidden__btn:hover {
		background: var(--color-brass-light);
	}

	.forbidden__btn--ghost {
		background: transparent;
		border: 1px solid rgba(196, 146, 58, 0.4);
		color: rgba(245, 240, 232, 0.8);
	}

	.forbidden__btn--ghost:hover {
		border-color: var(--color-brass);
		color: var(--color-warm-white);
		background: transparent;
	}
</style>
