<script lang="ts">
	import { resolve } from '$app/paths'
	import { useQuery } from 'convex-svelte'
	import { useClerkContext, SignOutButton } from 'svelte-clerk'
	import { api } from '$convex/api'

	type Tab = 'booking' | 'profile' | 'docs'

	const ctx = useClerkContext()
	const firstName = $derived(ctx.user?.firstName ?? 'Żeglarz')
	const userId = $derived(ctx.auth.userId ?? '')

	let tab = $state<Tab>('booking')

	// ── Convex queries ────────────────────────────────────────────────────
	const bookingQuery = useQuery(api.queries.bookingByUser, () => ({ userId }))
	const profileQuery = useQuery(api.queries.crewProfileByUser, () => ({
		userId
	}))

	const bookingData = $derived(bookingQuery.data)
	const profileData = $derived(profileQuery.data)

	// ── Derived display data from Convex (falls back to placeholders) ─────
	const bookingRows = $derived<ReadonlyArray<readonly [string, string]>>(
		bookingData
			? [
					['Ref', bookingData.bookingRef],
					['Etap', bookingData.segment?.name ?? '—'],
					['Termin', bookingData.segment?.dates ?? '—'],
					['Dni', String(bookingData.segment?.days ?? '—')],
					[
						bookingData.berths.length === 1 ? 'Koja' : 'Koje',
						bookingData.berths.map((b) => b.berthId).join(', ') || '—'
					],
					['Liczba miejsc', String(bookingData.berths.length)],
					[
						'Status',
						bookingData.status === 'confirmed'
							? 'Potwierdzona'
							: 'Oczekuje na płatność'
					],
					[
						'Cena',
						`${((bookingData.segment?.pricePerBerth ?? 0) * bookingData.berths.length).toLocaleString('pl-PL')} zł`
					]
				]
			: []
	)

	const profile = $derived<ReadonlyArray<readonly [string, string]>>(
		profileData
			? [
					[
						'Imię i nazwisko',
						`${profileData.firstName} ${profileData.lastName}`
					],
					['Data urodzenia', profileData.dateOfBirth],
					['Narodowość', profileData.nationality],
					['Telefon żeglarza', profileData.phone ?? '—'],
					[
						'Typ dokumentu',
						profileData.docType === 'passport' ? 'Paszport' : 'Dowód osobisty'
					],
					['Numer dokumentu', profileData.docNumber],
					['Kontakt alarmowy', profileData.emergencyContactName],
					['Tel. alarmowy', profileData.emergencyContactPhone],
					['Umiejętności pływackie', profileData.swimmingAbility],
					['Doświadczenie', profileData.sailingExperience]
				]
			: []
	)

	// Timeline ports — static for Sail Adventure 2026
	const ports = [
		{ port: 'Palma de Mallorca', date: '4.10', active: false },
		{ port: 'Gibraltar', date: '11.10', active: true },
		{ port: 'Madera', date: '21.10', active: true },
		{ port: 'Teneryfa', date: '31.10', active: false },
		{ port: 'Cabo Verde', date: '14.11', active: false }
	]

	function legActive(i: number): boolean {
		return ports[i]?.active === true && ports[i + 1]?.active === true
	}

	const docs = [
		{ name: 'Potwierdzenie rezerwacji', date: '24.04.2026', type: 'PDF' },
		{ name: 'Regulamin rejsu', date: '01.01.2026', type: 'PDF' },
		{ name: 'Lista rzeczy do zabrania', date: '01.01.2026', type: 'PDF' },
		{ name: 'Plan trasy szczegółowy', date: '01.03.2026', type: 'PDF' }
	]

	const tabs: ReadonlyArray<{ id: Tab; label: string }> = [
		{ id: 'booking', label: 'Rezerwacja' },
		{ id: 'profile', label: 'Dane załogi' },
		{ id: 'docs', label: 'Dokumenty' }
	]
</script>

<svelte:head>
	<title>Panel · Sailing Architects</title>
</svelte:head>

<main class="dash">
	<div class="dash__inner">
		<header class="dash__header">
			<div>
				<a class="dash__back" href={resolve('/')}>← Strona główna</a>
				<p class="eyebrow">Panel użytkownika</p>
				<h1 class="dash__title">Cześć, {firstName}</h1>
			</div>
			<div class="dash__header-right">
				{#if bookingData}
					<div class="dash__ref">
						<p class="dash__ref-label">Numer rezerwacji</p>
						<p class="dash__ref-value">{bookingData.bookingRef}</p>
					</div>
				{/if}
				<SignOutButton class="btn btn--signout">Wyloguj</SignOutButton>
			</div>
		</header>

		<div class="tabs" role="tablist" aria-label="Sekcje panelu">
			{#each tabs as t (t.id)}
				<button
					type="button"
					role="tab"
					aria-selected={tab === t.id}
					aria-controls={`panel-${t.id}`}
					class="tabs__btn"
					class:tabs__btn--active={tab === t.id}
					onclick={() => (tab = t.id)}
				>
					{t.label}
				</button>
			{/each}
		</div>

		{#if tab === 'booking'}
			<div id="panel-booking" role="tabpanel">
				<div class="status">
					<span class="status__dot" aria-hidden="true"></span>
					<span class="status__text"
						>Rezerwacja potwierdzona · Płatność zrealizowana</span
					>
				</div>

				<article class="voyage">
					<header class="voyage__header">
						<p class="voyage__eyebrow">Sail Adventure 2026</p>
						<h3 class="voyage__title">{bookingData?.segment?.name ?? '—'}</h3>
					</header>
					{#if bookingRows.length}
						<dl class="voyage__rows">
							{#each bookingRows as [label, value] (label)}
								<div class="voyage__cell">
									<dt class="voyage__label">{label}</dt>
									<dd class="voyage__value">{value}</dd>
								</div>
							{/each}
						</dl>
					{:else}
						<p class="voyage__empty">Brak aktywnej rezerwacji.</p>
					{/if}
				</article>

				<section class="timeline">
					<p class="timeline__title">Cała trasa rejsu</p>
					<ol class="timeline__list" aria-label="Porty na trasie">
						{#each ports as p, i (p.port)}
							<li
								class="timeline__port"
								class:timeline__port--active={p.active}
							>
								<span class="timeline__diamond" aria-hidden="true"></span>
								<span class="timeline__name">{p.port}</span>
								<span class="timeline__date">{p.date}</span>
							</li>
							{#if i < ports.length - 1}
								<span
									class="timeline__leg"
									class:timeline__leg--active={legActive(i)}
									aria-hidden="true"
								></span>
							{/if}
						{/each}
					</ol>
				</section>

				<div class="actions">
					<button type="button" class="btn btn--primary" disabled
						>↓ Pobierz potwierdzenie</button
					>
					<button type="button" class="btn btn--ghost" disabled
						>Kontakt z organizatorem</button
					>
				</div>
			</div>
		{/if}

		{#if tab === 'profile'}
			<div id="panel-profile" role="tabpanel">
				<p class="lead">
					Dane wymagane przez kapitana. Możesz je aktualizować do 30 dni przed
					rejsem.
				</p>
				{#if profile.length}
					<div class="profile">
						{#each profile as [label, value] (label)}
							<div class="profile__card">
								<p class="profile__label">{label}</p>
								<p class="profile__value">{value}</p>
							</div>
						{/each}
					</div>
					<button type="button" class="btn btn--outline" disabled
						>Edytuj dane</button
					>
				{:else}
					<p class="voyage__empty">Profil nie został jeszcze uzupełniony.</p>
				{/if}
			</div>
		{/if}

		{#if tab === 'docs'}
			<div id="panel-docs" role="tabpanel">
				<p class="lead">Dokumenty do pobrania</p>
				<ul class="docs">
					{#each docs as doc (doc.name)}
						<li>
							<button type="button" class="docs__item" disabled>
								<div class="docs__text">
									<p class="docs__name">{doc.name}</p>
									<p class="docs__meta">{doc.type} · {doc.date}</p>
								</div>
								<span class="docs__icon" aria-hidden="true">↓</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</main>

<style>
	.dash {
		min-height: 100vh;
		background: var(--color-navy);
		padding: 124px 24px 80px;
	}

	.dash__inner {
		max-width: 860px;
		margin: 0 auto;
	}

	.dash__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 48px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.dash__header-right {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
	}

	:global(.btn--signout) {
		font-family: var(--font-sans);
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 11px;
		padding: 12px 24px;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.3);
		color: rgba(245, 240, 232, 0.6);
		cursor: pointer;
		border-radius: 0;
		transition:
			background-color 200ms ease,
			color 200ms ease,
			border-color 200ms ease;
	}

	:global(.btn--signout:hover) {
		color: var(--color-warm-white);
		border-color: var(--color-brass);
		background: rgba(196, 146, 58, 0.06);
	}

	.dash__back {
		background: none;
		border: none;
		color: var(--color-brass-text-soft);
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		cursor: pointer;
		padding: 0;
		margin-bottom: 20px;
		display: block;
		text-decoration: none;
		transition: color 200ms ease;
	}

	.dash__back:hover {
		color: var(--color-brass-text);
	}

	.eyebrow {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 3px;
		color: var(--color-brass-text);
		text-transform: uppercase;
		margin: 0 0 6px;
	}

	.dash__title {
		font-family: var(--font-serif);
		font-size: 32px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0;
	}

	.dash__ref {
		padding: 12px 20px;
		border: 1px solid rgba(196, 146, 58, 0.25);
		background: rgba(196, 146, 58, 0.05);
	}

	.dash__ref-label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 4px;
	}

	.dash__ref-value {
		font-family: var(--font-serif);
		font-size: 20px;
		color: var(--color-brass-text);
		margin: 0;
	}

	.tabs {
		border-bottom: 1px solid rgba(196, 146, 58, 0.15);
		margin-bottom: 40px;
		display: flex;
		flex-wrap: wrap;
	}

	.tabs__btn {
		padding: 10px 24px;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: rgba(245, 240, 232, 0.4);
		font-family: var(--font-sans);
		font-size: 12px;
		letter-spacing: 1px;
		text-transform: uppercase;
		cursor: pointer;
		margin-bottom: -1px;
		transition:
			color 200ms ease,
			border-color 200ms ease;
	}

	.tabs__btn:hover {
		color: rgba(245, 240, 232, 0.7);
	}

	.tabs__btn--active {
		color: var(--color-brass-text);
		border-bottom-color: var(--color-brass);
	}

	.status {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 20px;
		background: rgba(80, 160, 80, 0.08);
		border: 1px solid rgba(80, 160, 80, 0.25);
		margin-bottom: 32px;
	}

	.status__dot {
		width: 8px;
		height: 8px;
		background: #50a050;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status__text {
		font-family: var(--font-sans);
		font-size: 12px;
		color: rgba(245, 240, 232, 0.7);
		letter-spacing: 0.5px;
	}

	.voyage {
		border: 1px solid rgba(196, 146, 58, 0.2);
		margin-bottom: 32px;
	}

	.voyage__header {
		padding: 20px 24px;
		background: rgba(196, 146, 58, 0.06);
		border-bottom: 1px solid rgba(196, 146, 58, 0.12);
	}

	.voyage__eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text);
		margin: 0 0 4px;
	}

	.voyage__title {
		font-family: var(--font-serif);
		font-size: 22px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0;
	}

	.voyage__empty {
		font-family: var(--font-sans);
		font-size: 13px;
		color: rgba(245, 240, 232, 0.3);
		padding: 24px;
		margin: 0;
	}

	.voyage__rows {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		margin: 0;
	}

	.voyage__cell {
		padding: 16px 20px;
		border-right: 1px solid rgba(196, 146, 58, 0.08);
		border-bottom: 1px solid rgba(196, 146, 58, 0.08);
	}

	.voyage__label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 4px;
	}

	.voyage__value {
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 500;
		color: var(--color-warm-white);
		margin: 0;
	}

	.timeline {
		margin-bottom: 32px;
	}

	.timeline__title {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 16px;
	}

	.timeline__list {
		list-style: none;
		padding: 0 0 8px;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0;
		overflow-x: auto;
	}

	.timeline__port {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 80px;
		flex-shrink: 0;
	}

	.timeline__diamond {
		width: 10px;
		height: 10px;
		border: 1.5px solid rgba(196, 146, 58, 0.3);
		background: transparent;
		transform: rotate(45deg);
		flex-shrink: 0;
	}

	.timeline__port--active .timeline__diamond {
		border-color: var(--color-brass);
		background: var(--color-brass);
	}

	.timeline__name {
		font-family: var(--font-sans);
		font-size: 10px;
		color: rgba(245, 240, 232, 0.35);
		text-align: center;
		line-height: 1.3;
	}

	.timeline__port--active .timeline__name {
		color: var(--color-warm-white);
	}

	.timeline__date {
		font-family: var(--font-sans);
		font-size: 9px;
		color: var(--color-brass-text-soft);
	}

	.timeline__port--active .timeline__date {
		color: var(--color-brass-text);
	}

	.timeline__leg {
		flex: 1;
		height: 1px;
		background: rgba(196, 146, 58, 0.15);
		min-width: 24px;
		margin-bottom: 30px;
	}

	.timeline__leg--active {
		background: var(--color-brass);
	}

	.actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn {
		font-family: var(--font-sans);
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 11px;
		cursor: pointer;
		border-radius: 0;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 200ms ease,
			color 200ms ease,
			border-color 200ms ease;
	}

	.btn--primary {
		padding: 12px 28px;
		background: var(--color-brass);
		border: none;
		color: var(--color-navy);
		font-weight: 700;
	}

	.btn--primary:hover:not(:disabled) {
		background: var(--color-brass-light);
	}

	.btn--ghost {
		padding: 12px 24px;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.25);
		color: rgba(245, 240, 232, 0.5);
	}

	.btn--ghost:hover:not(:disabled) {
		color: var(--color-warm-white);
		border-color: var(--color-brass);
	}

	.btn--outline {
		padding: 12px 28px;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.35);
		color: var(--color-brass-text);
		margin-top: 28px;
	}

	.btn--outline:hover:not(:disabled) {
		background: rgba(196, 146, 58, 0.06);
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.lead {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.6;
		color: rgba(245, 240, 232, 0.4);
		margin: 0 0 32px;
	}

	.profile {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 20px;
		max-width: 600px;
	}

	.profile__card {
		padding: 14px 16px;
		background: rgba(255, 255, 255, 0.03);
		border-left: 2px solid rgba(196, 146, 58, 0.2);
	}

	.profile__label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 4px;
	}

	.profile__value {
		font-family: var(--font-sans);
		font-size: 13px;
		color: var(--color-warm-white);
		margin: 0;
	}

	.docs {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.docs li {
		margin-bottom: 8px;
	}

	.docs__item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border: 1px solid rgba(196, 146, 58, 0.12);
		background: none;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition:
			border-color 200ms ease,
			background-color 200ms ease;
	}

	.docs__item:hover:not(:disabled) {
		border-color: var(--color-brass);
		background: rgba(196, 146, 58, 0.04);
	}

	.docs__item:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.docs__name {
		font-family: var(--font-sans);
		font-size: 13px;
		color: var(--color-warm-white);
		margin: 0 0 2px;
	}

	.docs__meta {
		font-family: var(--font-sans);
		font-size: 10px;
		color: rgba(245, 240, 232, 0.3);
		margin: 0;
	}

	.docs__icon {
		font-family: var(--font-sans);
		font-size: 11px;
		color: var(--color-brass-text);
		letter-spacing: 1px;
	}

	@media (max-width: 640px) {
		.dash {
			padding: 100px 16px 60px;
		}
	}
</style>
