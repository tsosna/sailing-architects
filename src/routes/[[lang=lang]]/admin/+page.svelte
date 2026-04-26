<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte'
	import { api } from '$convex/api'
	import { voyageSegments } from '$lib/data/voyage-segments'

	const convex = useConvexClient()

	let selectedSegment = $state(voyageSegments[0].id)
	let formBerthId = $state('')
	let formGuestName = $state('')
	let formNote = $state('')
	let saving = $state(false)
	let saveError = $state('')
	let saveOk = $state(false)

	const berthsQuery = useQuery(api.queries.allBerthsBySlug, () => ({
		slug: selectedSegment
	}))

	const berths = $derived(berthsQuery.data ?? [])
	const availableBerths = $derived(
		berths.filter((b) => b.status === 'available')
	)

	async function reserve() {
		if (!formBerthId || !formGuestName.trim()) {
			saveError = 'Koja i imię gościa są wymagane'
			return
		}
		saving = true
		saveError = ''
		saveOk = false
		try {
			await convex.mutation(api.mutations.reserveComplimentary, {
				segmentSlug: selectedSegment,
				berthId: formBerthId,
				guestName: formGuestName.trim(),
				note: formNote.trim() || undefined
			})
			formBerthId = ''
			formGuestName = ''
			formNote = ''
			saveOk = true
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'Błąd'
		} finally {
			saving = false
		}
	}

	async function cancel(berthId: string) {
		try {
			await convex.mutation(api.mutations.cancelAdminBooking, {
				segmentSlug: selectedSegment,
				berthId
			})
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Błąd')
		}
	}

	async function runMigration() {
		if (
			!confirm('Ustawi C1 jako "kapitan" na wszystkich etapach. Kontynuować?')
		)
			return
		try {
			const result = await convex.mutation(
				api.mutations.migrateCaptainBerths,
				{}
			)
			alert(`Zaktualizowano: ${result.updated} koj`)
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Błąd migracji')
		}
	}
</script>

<svelte:head>
	<title>Admin · Sailing Architects</title>
</svelte:head>

<div class="admin">
	<header class="admin__header">
		<h1 class="admin__title">Panel administracyjny</h1>
		<a href="/" class="admin__back">← Strona główna</a>
	</header>

	<!-- Segment picker -->
	<div class="admin__segments">
		{#each voyageSegments as seg (seg.id)}
			<button
				type="button"
				class="seg-btn"
				class:seg-btn--active={selectedSegment === seg.id}
				onclick={() => {
					selectedSegment = seg.id
					formBerthId = ''
					saveOk = false
				}}
			>
				{seg.name}
			</button>
		{/each}
	</div>

	<div class="admin__body">
		<!-- Current berth statuses -->
		<section class="admin__section">
			<h2 class="admin__section-title">
				Koje · {voyageSegments.find((s) => s.id === selectedSegment)?.name}
			</h2>
			<div class="berth-grid">
				{#each berths as b (b._id)}
					<div class="berth-card berth-card--{b.status}">
						<span class="berth-card__id"
							>{b.status === 'captain' ? '⚓' : ''}{b.berthId}</span
						>
						<span class="berth-card__status">{b.status}</span>
						{#if b.guestName}
							<span class="berth-card__guest">{b.guestName}</span>
						{/if}
						{#if b.note}
							<span class="berth-card__note">{b.note}</span>
						{/if}
						{#if b.status === 'complimentary'}
							<button
								type="button"
								class="berth-card__cancel"
								onclick={() => cancel(b.berthId)}
							>
								Anuluj
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<!-- Reserve complimentary form -->
		<section class="admin__section">
			<h2 class="admin__section-title">Nowa rezerwacja bezpłatna</h2>
			<form
				class="admin__form"
				onsubmit={(e) => {
					e.preventDefault()
					reserve()
				}}
			>
				<label class="field">
					<span class="field__label">Koja</span>
					<select class="field__input" bind:value={formBerthId} required>
						<option value="">— wybierz —</option>
						{#each availableBerths as b (b._id)}
							<option value={b.berthId}>{b.berthId}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span class="field__label">Imię i nazwisko gościa</span>
					<input
						type="text"
						class="field__input"
						bind:value={formGuestName}
						placeholder="np. Anna Kowalska"
						required
					/>
				</label>
				<label class="field">
					<span class="field__label">Uwagi (opcjonalnie)</span>
					<input
						type="text"
						class="field__input"
						bind:value={formNote}
						placeholder="np. żona kapitana"
					/>
				</label>
				{#if saveError}
					<p class="admin__error">{saveError}</p>
				{/if}
				{#if saveOk}
					<p class="admin__ok">Rezerwacja zapisana.</p>
				{/if}
				<button type="submit" class="admin__btn" disabled={saving}>
					{saving ? 'Zapisuję…' : 'Zarezerwuj bezpłatnie'}
				</button>
			</form>
		</section>

		<!-- Migration tool -->
		<section class="admin__section admin__section--tools">
			<h2 class="admin__section-title">Narzędzia migracji</h2>
			<p class="admin__hint">
				Jeśli baza danych była seedowana przed Block 2 — uruchom migrację, aby
				ustawić C1 jako "kapitan" na wszystkich etapach.
			</p>
			<button
				type="button"
				class="admin__btn admin__btn--secondary"
				onclick={runMigration}
			>
				Ustaw C1 = kapitan (migracja)
			</button>
		</section>
	</div>
</div>

<style>
	.admin {
		min-height: 100vh;
		background: var(--color-navy);
		padding: 48px 40px;
		font-family: var(--font-sans);
	}

	.admin__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 40px;
	}

	.admin__title {
		font-family: var(--font-serif);
		font-size: 28px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0;
	}

	.admin__back {
		font-size: 12px;
		color: rgba(196, 146, 58, 0.6);
		text-decoration: none;
	}

	.admin__back:hover {
		color: var(--color-brass);
	}

	.admin__segments {
		display: flex;
		gap: 1px;
		margin-bottom: 40px;
		flex-wrap: wrap;
	}

	.seg-btn {
		padding: 10px 20px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(196, 146, 58, 0.15);
		color: rgba(245, 240, 232, 0.5);
		font-family: var(--font-sans);
		font-size: 12px;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.seg-btn--active {
		background: rgba(196, 146, 58, 0.12);
		border-color: var(--color-brass);
		color: var(--color-warm-white);
	}

	.admin__body {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 40px;
		align-items: start;
	}

	@media (max-width: 900px) {
		.admin__body {
			grid-template-columns: 1fr;
		}
	}

	.admin__section {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(196, 146, 58, 0.12);
		padding: 28px;
	}

	.admin__section--tools {
		grid-column: 1 / -1;
	}

	.admin__section-title {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 3px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.6);
		margin: 0 0 20px;
	}

	.berth-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 8px;
	}

	.berth-card {
		padding: 12px 10px;
		border: 1px solid rgba(196, 146, 58, 0.15);
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.berth-card--available {
		border-color: rgba(196, 146, 58, 0.2);
	}

	.berth-card--taken {
		background: rgba(13, 27, 46, 0.5);
		border-color: #3a4a5c;
	}

	.berth-card--captain {
		background: rgba(8, 18, 36, 0.8);
		border-color: rgba(196, 146, 58, 0.35);
	}

	.berth-card--complimentary {
		background: rgba(196, 146, 58, 0.05);
		border-color: rgba(196, 146, 58, 0.3);
	}

	.berth-card__id {
		font-family: var(--font-serif);
		font-size: 16px;
		color: var(--color-warm-white);
	}

	.berth-card--taken .berth-card__id,
	.berth-card--captain .berth-card__id {
		color: rgba(245, 240, 232, 0.4);
	}

	.berth-card__status {
		font-size: 9px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.5);
	}

	.berth-card__guest {
		font-size: 11px;
		color: rgba(245, 240, 232, 0.7);
		margin-top: 2px;
	}

	.berth-card__note {
		font-size: 10px;
		color: rgba(245, 240, 232, 0.35);
		font-style: italic;
	}

	.berth-card__cancel {
		margin-top: 6px;
		padding: 4px 8px;
		background: transparent;
		border: 1px solid rgba(196, 146, 58, 0.3);
		color: rgba(196, 146, 58, 0.6);
		font-size: 10px;
		cursor: pointer;
		font-family: var(--font-sans);
		transition: all 150ms ease;
	}

	.berth-card__cancel:hover {
		border-color: var(--color-brass);
		color: var(--color-brass);
	}

	.admin__form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field__label {
		font-size: 11px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.6);
	}

	.field__input {
		padding: 10px 14px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(196, 146, 58, 0.2);
		color: var(--color-warm-white);
		font-family: var(--font-sans);
		font-size: 13px;
		outline: none;
		appearance: none;
	}

	.field__input:focus {
		border-color: var(--color-brass);
	}

	.admin__btn {
		padding: 12px 24px;
		background: var(--color-brass);
		border: none;
		color: var(--color-navy);
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 12px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	.admin__btn:hover:not(:disabled) {
		background: var(--color-brass-light);
	}

	.admin__btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.admin__btn--secondary {
		background: transparent;
		border: 1px solid rgba(196, 146, 58, 0.4);
		color: rgba(196, 146, 58, 0.7);
	}

	.admin__btn--secondary:hover {
		border-color: var(--color-brass);
		color: var(--color-brass);
		background: transparent;
	}

	.admin__error {
		font-size: 12px;
		color: #e57373;
		margin: 0;
	}

	.admin__ok {
		font-size: 12px;
		color: rgba(196, 146, 58, 0.9);
		margin: 0;
	}

	.admin__hint {
		font-size: 12px;
		color: rgba(245, 240, 232, 0.4);
		margin: 0 0 16px;
		line-height: 1.6;
	}
</style>
