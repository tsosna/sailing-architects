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
	let toast = $state<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null)

	const berthsQuery = useQuery(api.queries.allBerthsBySlug, () => ({
		slug: selectedSegment
	}))

	const berths = $derived(berthsQuery.data ?? [])
	const captainBerths = $derived(berths.filter((b) => b.status === 'captain'))
	const complimentaryBerths = $derived(
		berths.filter((b) => b.status === 'complimentary')
	)
	const availableBerths = $derived(
		berths.filter((b) => b.status === 'available')
	)
	const segmentMeta = $derived(
		voyageSegments.find((s) => s.id === selectedSegment) ?? voyageSegments[0]
	)

	async function reserve(e: Event) {
		e.preventDefault()
		if (!formBerthId || !formGuestName.trim()) {
			toast = { kind: 'err', text: 'Koja i imię gościa są wymagane.' }
			return
		}
		saving = true
		toast = null
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
			toast = { kind: 'ok', text: 'Rezerwacja complimentary zapisana.' }
		} catch (err) {
			toast = {
				kind: 'err',
				text: err instanceof Error ? err.message : 'Nie udało się zapisać.'
			}
		} finally {
			saving = false
		}
	}

	async function cancel(berthId: string) {
		if (
			!confirm(
				`Zwolnić koję ${berthId} z rezerwacji complimentary? Wróci na listę dostępnych.`
			)
		)
			return
		try {
			await convex.mutation(api.mutations.cancelAdminBooking, {
				segmentSlug: selectedSegment,
				berthId
			})
			toast = { kind: 'ok', text: `Koja ${berthId} zwolniona.` }
		} catch (err) {
			toast = {
				kind: 'err',
				text: err instanceof Error ? err.message : 'Nie udało się zwolnić.'
			}
		}
	}

	let runningMigration = $state(false)
	async function runMigration() {
		if (
			!confirm(
				'Ustawi koje C1 jako "captain" na wszystkich segmentach. Operacja jednorazowa, idempotentna.'
			)
		)
			return
		runningMigration = true
		try {
			const result = await convex.mutation(
				api.mutations.migrateCaptainBerths,
				{}
			)
			toast = {
				kind: 'ok',
				text: `Migracja captain — zaktualizowano ${result.updated} koj.`
			}
		} catch (err) {
			toast = {
				kind: 'err',
				text: err instanceof Error ? err.message : 'Błąd migracji.'
			}
		} finally {
			runningMigration = false
		}
	}
</script>

<svelte:head>
	<title>Admin · Miejsca specjalne</title>
</svelte:head>

<header class="topline">
	<p class="eyebrow">Special seats</p>
	<h1>Miejsca specjalne</h1>
	<p class="lede">
		Captain i complimentary trzymamy poza Sales Board, żeby nie mieszały się z
		normalną sprzedażą i zaległościami. KPI „Specjalne" w sekcji „Sprzedaż i
		alerty" liczy tylko complimentary — captain jest stałą blokadą.
	</p>
</header>

<div class="segment-strip" aria-label="Segmenty rejsu">
	{#each voyageSegments as seg (seg.id)}
		<button
			type="button"
			class="segment"
			data-active={selectedSegment === seg.id || undefined}
			onclick={() => {
				selectedSegment = seg.id
				toast = null
			}}
		>
			<strong>{seg.name}</strong>
			<span>{seg.dates}</span>
		</button>
	{/each}
</div>

<div class="grid">
	<section class="panel">
		<div class="panel-head">
			<div>
				<h2>Captain</h2>
				<p>Stała blokada koi kapitana — nie podlega rezerwacji.</p>
			</div>
		</div>
		{#if berthsQuery.isLoading && !berthsQuery.data}
			<p class="empty-row">Wczytuję koje…</p>
		{:else if captainBerths.length === 0}
			<p class="empty-row">
				Brak oznaczonej koi kapitana dla {segmentMeta.name}. Użyj narzędzia
				technicznego poniżej, jeśli baza nie była seedowana z Block 2.
			</p>
		{:else}
			<ul class="rows">
				{#each captainBerths as berth (berth._id)}
					<li class="row">
						<div class="row-main">
							<strong>⚓ Koja {berth.berthId}</strong>
							<span>Stała blokada · {segmentMeta.name}</span>
						</div>
						<span class="badge">Captain</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="panel">
		<div class="panel-head">
			<div>
				<h2>Complimentary</h2>
				<p>
					Rezerwacje bezpłatne organizatora. Blokują koję, ale nie wchodzą do
					paid revenue.
				</p>
			</div>
		</div>
		{#if complimentaryBerths.length === 0}
			<p class="empty-row">
				Brak rezerwacji complimentary dla {segmentMeta.name}.
			</p>
		{:else}
			<ul class="rows">
				{#each complimentaryBerths as berth (berth._id)}
					<li class="row">
						<div class="row-main">
							<strong>Koja {berth.berthId} · {berth.guestName ?? 'Gość'}</strong
							>
							<span>{berth.note ?? 'Bez uwag'}</span>
						</div>
						<div class="row-side">
							<span class="badge badge--warn">Complimentary</span>
							<button
								class="mini"
								type="button"
								onclick={() => cancel(berth.berthId)}>Zwolnij koję</button
							>
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		<form class="form" onsubmit={reserve}>
			<h3>Dodaj complimentary</h3>
			<div class="form-grid">
				<label>
					<span>Koja</span>
					<select bind:value={formBerthId} required>
						<option value="">— wybierz —</option>
						{#each availableBerths as b (b._id)}
							<option value={b.berthId}>{b.berthId}</option>
						{/each}
					</select>
				</label>
				<label>
					<span>Imię i nazwisko gościa</span>
					<input
						type="text"
						bind:value={formGuestName}
						placeholder="np. Anna Kowalska"
						required
					/>
				</label>
				<label class="span-2">
					<span>Uwagi (opcjonalnie)</span>
					<input
						type="text"
						bind:value={formNote}
						placeholder="np. żona kapitana, partner medialny"
					/>
				</label>
			</div>
			<div class="form-actions">
				<button class="btn btn--primary" type="submit" disabled={saving}>
					{saving ? 'Zapisuję…' : 'Zarezerwuj bezpłatnie'}
				</button>
			</div>
		</form>
	</section>
</div>

{#if toast}
	<p class="toast toast--{toast.kind}">{toast.text}</p>
{/if}

<details class="tools">
	<summary>Narzędzia techniczne (jednorazowe migracje)</summary>
	<div class="tools-body">
		<p>
			Operacje uruchamiane raz po seedowaniu. Idempotentne — można odpalić
			ponownie bez efektów ubocznych.
		</p>
		<button
			class="btn"
			type="button"
			onclick={runMigration}
			disabled={runningMigration}
		>
			{runningMigration ? 'Migruję…' : 'Ustaw C1 = captain (migracja)'}
		</button>
	</div>
</details>

<style>
	.topline {
		margin-bottom: 24px;
	}
	.eyebrow {
		margin: 0 0 9px;
		color: var(--admin-brass-light);
		font-size: 10px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-weight: 400;
		font-size: clamp(28px, 4vw, 44px);
		line-height: 1.05;
	}
	.lede {
		margin: 12px 0 0;
		max-width: 640px;
		color: var(--admin-muted);
		font-size: 13px;
		line-height: 1.6;
	}

	.segment-strip {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1px;
		background: var(--admin-line);
		margin-bottom: 24px;
	}
	.segment {
		min-height: 74px;
		background: var(--admin-navy-mid);
		border: 0;
		color: var(--admin-muted);
		padding: 14px 16px;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
	}
	.segment[data-active] {
		background: rgba(196, 146, 58, 0.1);
		color: var(--admin-warm-white);
		box-shadow: inset 0 -2px 0 var(--admin-brass);
	}
	.segment strong {
		display: block;
		font-size: 13px;
		font-weight: 600;
	}
	.segment span {
		display: block;
		margin-top: 5px;
		font-size: 11px;
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: 22px;
		align-items: start;
	}
	@media (max-width: 1180px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.segment-strip {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 720px) {
		.segment-strip {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		background: rgba(15, 31, 53, 0.82);
		border: 1px solid var(--admin-line);
	}
	.panel-head {
		min-height: 58px;
		padding: 16px 18px;
		border-bottom: 1px solid var(--admin-line);
	}
	.panel-head h2 {
		margin: 0;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-weight: 400;
		font-size: 22px;
	}
	.panel-head p {
		margin: 4px 0 0;
		color: var(--admin-muted);
		font-size: 12px;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 14px 18px;
		border-top: 1px solid rgba(196, 146, 58, 0.08);
	}
	.row:first-child {
		border-top: 0;
	}
	.row-main strong {
		display: block;
		font-size: 13px;
		font-weight: 500;
	}
	.row-main span {
		display: block;
		margin-top: 4px;
		color: var(--admin-muted);
		font-size: 11px;
	}
	.row-side {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		min-height: 24px;
		padding: 0 8px;
		border: 1px solid var(--admin-line);
		color: var(--admin-muted);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.badge--warn {
		background: var(--admin-warn-bg);
		border-color: rgba(224, 179, 95, 0.34);
		color: var(--admin-warn);
	}

	.mini {
		min-height: 28px;
		border: 1px solid var(--admin-line);
		background: rgba(7, 17, 30, 0.48);
		color: var(--admin-warm-white);
		padding: 0 10px;
		font-size: 11px;
		cursor: pointer;
		font-family: inherit;
	}

	.empty-row {
		margin: 0;
		padding: 22px 18px;
		color: var(--admin-muted);
		font-size: 12px;
		text-align: center;
	}

	.form {
		padding: 18px;
		border-top: 1px solid var(--admin-line);
	}
	.form h3 {
		margin: 0 0 14px;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-weight: 400;
		font-size: 16px;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.form-grid label {
		display: grid;
		gap: 4px;
		font-size: 11px;
	}
	.form-grid label.span-2 {
		grid-column: span 2;
	}
	.form-grid span {
		color: var(--admin-muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.form-grid input,
	.form-grid select {
		min-height: 34px;
		border: 1px solid var(--admin-line);
		background: var(--admin-navy-deep);
		color: var(--admin-warm-white);
		padding: 6px 10px;
		font-family: inherit;
		font-size: 12px;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 14px;
	}

	.btn {
		min-height: 38px;
		border: 1px solid var(--admin-line-strong);
		background: rgba(245, 240, 232, 0.04);
		color: var(--admin-warm-white);
		padding: 0 14px;
		font-size: 12px;
		cursor: pointer;
		font-family: inherit;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn--primary {
		background: var(--admin-brass);
		border-color: var(--admin-brass);
		color: var(--admin-navy-deep);
		font-weight: 700;
	}

	.toast {
		margin: 22px 0 0;
		padding: 12px 16px;
		border: 1px solid var(--admin-line);
		font-size: 12px;
	}
	.toast--ok {
		background: var(--admin-ok-bg);
		border-color: rgba(138, 199, 164, 0.3);
		color: var(--admin-ok);
	}
	.toast--err {
		background: var(--admin-danger-bg);
		border-color: rgba(228, 109, 95, 0.34);
		color: var(--admin-danger);
	}
	.toast--info {
		background: rgba(196, 146, 58, 0.08);
		border-color: rgba(196, 146, 58, 0.3);
		color: var(--admin-brass-light);
	}

	.tools {
		margin-top: 28px;
		border: 1px solid var(--admin-line);
		background: rgba(7, 17, 30, 0.4);
	}
	.tools summary {
		padding: 14px 18px;
		font-size: 12px;
		color: var(--admin-muted);
		cursor: pointer;
		letter-spacing: 0.05em;
	}
	.tools-body {
		padding: 0 18px 18px;
		display: grid;
		gap: 12px;
	}
	.tools-body p {
		margin: 0;
		color: var(--admin-muted);
		font-size: 12px;
		line-height: 1.6;
	}

	@media (max-width: 600px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-grid label.span-2 {
			grid-column: span 1;
		}
	}
</style>
