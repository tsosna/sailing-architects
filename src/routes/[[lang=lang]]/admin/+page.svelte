<script lang="ts">
	import { useQuery } from 'convex-svelte'
	import { api } from '$convex/api'
	import type { Id } from '$convex/dataModel'
	import { voyageSegments } from '$lib/data/voyage-segments'
	import BookingDrawer from '$lib/components/admin/booking-drawer.svelte'
	import type { PageData } from './$types'

	type FilterKey =
		| 'all'
		| 'overdue'
		| 'due_soon'
		| 'data_missing'
		| 'awaiting_confirmation'
		| 'paid'

	let { data: pageData }: { data: PageData } = $props()
	let selectedSegment = $state(voyageSegments[0].id)
	let activeFilter = $state<FilterKey>('all')
	let openBookingId = $state<Id<'bookings'> | null>(null)

	const overview = useQuery(api.admin.overviewBySegment, () => ({
		slug: selectedSegment
	}))

	const data = $derived(overview.data ?? null)
	const isLoading = $derived(overview.isLoading)
	const error = $derived(overview.error)

	const filteredRows = $derived.by(() => {
		const rows = data?.bookings ?? []
		switch (activeFilter) {
			case 'overdue':
				return rows.filter((r) => r.flags.overdue)
			case 'due_soon':
				return rows.filter((r) => r.flags.dueSoon && !r.flags.overdue)
			case 'data_missing':
				return rows.filter((r) => r.flags.dataMissing)
			case 'awaiting_confirmation':
				return rows.filter((r) => !r.flags.paid && !r.flags.overdue)
			case 'paid':
				return rows.filter((r) => r.flags.paid)
			default:
				return rows
		}
	})

	function formatPLN(grosze: number): string {
		const zlote = Math.round(grosze / 100)
		return zlote.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
	}

	function formatHoldCountdown(timestamp: number | null): string {
		if (!timestamp) return '—'
		const minutes = Math.max(0, Math.round((timestamp - Date.now()) / 60000))
		if (minutes < 1) return 'teraz'
		if (minutes < 60) return `${minutes} min`
		const hours = Math.floor(minutes / 60)
		return `${hours} h`
	}
</script>

<svelte:head>
	<title>Admin · Sprzedaż i alerty</title>
</svelte:head>

<header class="topline">
	<div>
		<p class="eyebrow">Operations Console</p>
		<h1>Sprzedaż, płatności i kompletność załogi</h1>
	</div>
</header>

<div class="segment-strip" aria-label="Segmenty rejsu">
	{#each voyageSegments as seg (seg.id)}
		<button
			type="button"
			class="segment"
			data-active={selectedSegment === seg.id || undefined}
			onclick={() => {
				selectedSegment = seg.id
				activeFilter = 'all'
			}}
		>
			<strong>{seg.name}</strong>
			<span>{seg.dates}</span>
		</button>
	{/each}
</div>

{#if error}
	<p class="error-state">Nie udało się pobrać danych: {error.message}</p>
{:else if isLoading && !data}
	<p class="empty-state">Wczytuję panel operacyjny…</p>
{:else if !data}
	<p class="empty-state">Brak danych dla tego segmentu.</p>
{:else}
	<div class="kpi-grid">
		<div class="kpi">
			<span>Sprzedane</span>
			<strong>{data.kpi.soldBerths} / {data.kpi.sellableBerths}</strong>
			<em
				>{data.kpi.sellableBerths > 0
					? Math.round((data.kpi.soldBerths / data.kpi.sellableBerths) * 100)
					: 0}% miejsc</em
			>
		</div>
		<div class="kpi">
			<span>Wpłacono</span>
			<strong>{formatPLN(data.kpi.paidAmount)}</strong>
			<em>PLN brutto</em>
		</div>
		<div class="kpi">
			<span>Do wpłaty</span>
			<strong>{formatPLN(data.kpi.pendingAmount)}</strong>
			<em>w ratach</em>
		</div>
		<div class="kpi" class:kpi--danger={data.kpi.overdueAmount > 0}>
			<span>Zaległe</span>
			<strong>{formatPLN(data.kpi.overdueAmount)}</strong>
			<em
				>{data.alerts.filter((a) => a.kind === 'payment_overdue').length}
				rat</em
			>
		</div>
		<div class="kpi" class:kpi--warn={data.kpi.missingDataCount > 0}>
			<span>Brak danych</span>
			<strong>{data.kpi.missingDataCount}</strong>
			<em>uczestników</em>
		</div>
		<div class="kpi">
			<span>Do potwierdzenia</span>
			<strong>{data.kpi.pendingConfirmationCount}</strong>
			<em>uczestników</em>
		</div>
		<div class="kpi">
			<span>Held</span>
			<strong>{data.kpi.heldCount}</strong>
			<em>{formatHoldCountdown(data.kpi.nextHoldExpiresAt)} do wygaśnięcia</em>
		</div>
		<div class="kpi">
			<span>Specjalne</span>
			<strong>{data.kpi.complimentaryBerths}</strong>
			<em>complimentary</em>
		</div>
	</div>

	<div class="grid">
		<section class="panel">
			<div class="panel-head">
				<div>
					<h2>Sales Board</h2>
					<p>Rezerwacje, płatności i następna akcja operacyjna.</p>
				</div>
			</div>
			<div class="filters">
				{#each [['all', 'Wszystkie'], ['overdue', 'Zaległe'], ['due_soon', 'Do przypomnienia'], ['data_missing', 'Brak danych'], ['awaiting_confirmation', 'Oczekuje wpłaty'], ['paid', 'Opłacone']] as const as [key, label] (key)}
					<button
						type="button"
						class="filter"
						data-active={activeFilter === key || undefined}
						onclick={() => (activeFilter = key)}
					>
						{label}
					</button>
				{/each}
			</div>
			<div class="table-wrap">
				{#if filteredRows.length === 0}
					<p class="empty-row">Brak rezerwacji w tym widoku.</p>
				{:else}
					<table class="table">
						<thead>
							<tr>
								<th>Ref</th>
								<th>Kupujący</th>
								<th>Koje</th>
								<th>Płatność</th>
								<th>Dane</th>
								<th>Następna akcja</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each filteredRows as row (row.bookingId)}
								<tr>
									<td><span class="ref">{row.bookingRef}</span></td>
									<td>
										<div class="person">
											<strong>{row.buyerEmail}</strong>
										</div>
									</td>
									<td>{row.berthLabels.join(', ') || '—'}</td>
									<td>
										<span class="badge badge--{row.paymentLevel}"
											>{row.paymentLabel}</span
										>
									</td>
									<td>
										<span class="badge badge--{row.dataLevel}"
											>{row.dataLabel}</span
										>
									</td>
									<td>{row.nextAction}</td>
									<td>
										<button
											class="row-action"
											type="button"
											onclick={() =>
												(openBookingId = row.bookingId as Id<'bookings'>)}
											>Otwórz</button
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</section>

		<section class="panel">
			<div class="panel-head">
				<div>
					<h2>Alert Queue</h2>
					<p>Priorytety do ręcznej reakcji kapitana.</p>
				</div>
			</div>
			<div class="alert-list">
				{#if data.alerts.length === 0}
					<p class="empty-row">Brak aktywnych alertów. Czysto.</p>
				{:else}
					{#each data.alerts as alert (alert.id)}
						<article class="alert" data-level={alert.level}>
							<div class="alert-top">
								<div>
									<h3>{alert.title}</h3>
									<p>{alert.subtitle}</p>
								</div>
								<span class="badge badge--{alert.level}">
									{alert.kind === 'payment_overdue'
										? 'Pilne'
										: alert.kind === 'payment_due_soon'
											? 'Płatność'
											: alert.kind === 'data_missing'
												? 'Dane'
												: alert.kind === 'hold_expiring'
													? 'Checkout'
													: 'Info'}
								</span>
							</div>
							{#if alert.bookingId}
								<div class="alert-actions">
									<button
										type="button"
										class="alert-link"
										onclick={() =>
											(openBookingId = alert.bookingId as Id<'bookings'>)}
										>Otwórz rezerwację</button
									>
								</div>
							{/if}
						</article>
					{/each}
				{/if}
			</div>
		</section>
	</div>
{/if}

<BookingDrawer
	bookingId={openBookingId}
	adminUserId={pageData.admin.userId}
	onclose={() => (openBookingId = null)}
/>

<style>
	.topline {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 26px;
	}

	.eyebrow {
		margin: 0 0 9px;
		color: var(--admin-brass-light);
		font-size: 10px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3 {
		margin: 0;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-weight: 400;
	}

	h1 {
		font-size: clamp(28px, 4vw, 48px);
		line-height: 1;
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

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(8, minmax(118px, 1fr));
		gap: 1px;
		background: var(--admin-line);
		margin-bottom: 26px;
	}

	.kpi {
		min-height: 104px;
		background: var(--admin-navy-mid);
		padding: 15px;
	}

	.kpi span {
		display: block;
		color: var(--admin-muted);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.kpi strong {
		display: block;
		margin-top: 15px;
		font-size: 24px;
		font-weight: 500;
	}

	.kpi em {
		display: block;
		margin-top: 4px;
		color: rgba(245, 240, 232, 0.58);
		font-size: 11px;
		font-style: normal;
	}

	.kpi--danger strong {
		color: var(--admin-danger);
	}

	.kpi--warn strong {
		color: var(--admin-warn);
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.65fr);
		gap: 22px;
		align-items: start;
	}

	.panel {
		background: rgba(15, 31, 53, 0.82);
		border: 1px solid var(--admin-line);
	}

	.panel-head {
		min-height: 58px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding: 16px 18px;
		border-bottom: 1px solid var(--admin-line);
	}

	.panel-head h2 {
		font-size: 22px;
	}

	.panel-head p {
		margin: 4px 0 0;
		color: var(--admin-muted);
		font-size: 12px;
	}

	.filters {
		display: flex;
		gap: 1px;
		background: var(--admin-line);
		overflow: auto;
		border-bottom: 1px solid var(--admin-line);
	}

	.filter {
		border: 0;
		background: var(--admin-navy-light);
		color: var(--admin-muted);
		padding: 11px 14px;
		font-size: 11px;
		white-space: nowrap;
		cursor: pointer;
		font-family: inherit;
	}

	.filter[data-active] {
		background: rgba(196, 146, 58, 0.12);
		color: var(--admin-warm-white);
	}

	.table {
		width: 100%;
		border-collapse: collapse;
	}

	.table th,
	.table td {
		padding: 13px 14px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.09);
		text-align: left;
		font-size: 12px;
		vertical-align: middle;
	}

	.table th {
		color: rgba(245, 240, 232, 0.44);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.table tbody tr:hover {
		background: rgba(196, 146, 58, 0.07);
	}

	.ref {
		color: var(--admin-brass-light);
		font-weight: 700;
	}

	.person strong {
		font-weight: 500;
		font-size: 12px;
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
		white-space: nowrap;
	}

	.badge--ok {
		background: var(--admin-ok-bg);
		border-color: rgba(138, 199, 164, 0.3);
		color: var(--admin-ok);
	}

	.badge--warn {
		background: var(--admin-warn-bg);
		border-color: rgba(224, 179, 95, 0.34);
		color: var(--admin-warn);
	}

	.badge--danger {
		background: var(--admin-danger-bg);
		border-color: rgba(228, 109, 95, 0.34);
		color: var(--admin-danger);
	}

	.badge--info {
		background: rgba(245, 240, 232, 0.04);
	}

	.row-action {
		border: 1px solid var(--admin-line);
		background: transparent;
		color: var(--admin-warm-white);
		padding: 8px 10px;
		font-size: 11px;
		cursor: pointer;
		font-family: inherit;
		transition:
			background 140ms ease,
			border-color 140ms ease;
	}

	.row-action:hover {
		background: rgba(196, 146, 58, 0.08);
		border-color: var(--admin-line-strong);
	}

	.alert-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.alert-link {
		border: 1px solid var(--admin-line);
		background: rgba(7, 17, 30, 0.48);
		color: var(--admin-warm-white);
		padding: 6px 10px;
		font-size: 11px;
		cursor: pointer;
		font-family: inherit;
	}

	.alert-link:hover {
		background: rgba(196, 146, 58, 0.1);
	}

	.alert-list {
		display: grid;
	}

	.alert {
		padding: 15px 16px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.1);
		display: grid;
		gap: 12px;
	}

	.alert[data-level='danger'] {
		background: linear-gradient(90deg, var(--admin-danger-bg), transparent 66%);
	}

	.alert[data-level='warn'] {
		background: linear-gradient(90deg, var(--admin-warn-bg), transparent 66%);
	}

	.alert-top {
		display: flex;
		justify-content: space-between;
		gap: 14px;
	}

	.alert h3 {
		font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif);
		font-size: 13px;
		font-weight: 700;
	}

	.alert p {
		margin: 5px 0 0;
		color: var(--admin-muted);
		font-size: 12px;
		line-height: 1.5;
	}

	.empty-state,
	.empty-row {
		margin: 24px 0;
		padding: 16px;
		color: var(--admin-muted);
		font-size: 13px;
	}

	.empty-row {
		margin: 0;
		padding: 28px 20px;
		text-align: center;
	}

	.error-state {
		margin: 24px 0;
		padding: 16px;
		color: var(--admin-danger);
		font-size: 13px;
		border: 1px solid rgba(228, 109, 95, 0.3);
		background: var(--admin-danger-bg);
	}

	.table-wrap {
		overflow-x: auto;
	}

	@media (max-width: 1180px) {
		.kpi-grid {
			grid-template-columns: repeat(4, minmax(118px, 1fr));
		}
		.grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 760px) {
		.segment-strip,
		.kpi-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
