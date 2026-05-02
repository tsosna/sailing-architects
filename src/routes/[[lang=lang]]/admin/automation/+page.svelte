<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte'
	import { api } from '$convex/api'
	import { voyageSegments } from '$lib/data/voyage-segments'

	type ItemKind = 'deposit' | 'installment' | 'balance' | 'full' | 'custom'

	type DraftItem = {
		key: string
		label: string
		kind: ItemKind
		amountPLN: number
		dueAt: string // YYYY-MM-DD or empty
	}

	type TemplateKey = 'deposit_2' | 'deposit_3' | 'full' | 'custom'

	const convex = useConvexClient()

	let selectedSegment = $state(voyageSegments[0].id)
	let template = $state<TemplateKey>('deposit_2')
	let allowFullPayment = $state(true)
	let planName = $state('Plan domyślny')
	let items = $state<DraftItem[]>([])
	let saving = $state(false)
	let toast = $state<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null)

	const planQuery = useQuery(api.queries.activePaymentPlanBySlug, () => ({
		slug: selectedSegment
	}))

	const segmentMeta = $derived(
		voyageSegments.find((s) => s.id === selectedSegment) ?? voyageSegments[0]
	)
	const pricePerBerthPLN = $derived(segmentMeta.price)

	let lastLoadedSegment = $state<string | null>(null)
	$effect(() => {
		if (planQuery.isLoading) return
		if (lastLoadedSegment === selectedSegment) return
		lastLoadedSegment = selectedSegment

		const plan = planQuery.data
		if (plan && plan.items.length > 0) {
			planName = plan.name
			allowFullPayment = plan.allowFullPayment
			items = plan.items.map((item, index) => ({
				key: `${item._id}-${index}`,
				label: item.label,
				kind: item.kind,
				amountPLN: Math.round(item.amountPerBerth / 100),
				dueAt: item.dueAt ? toDateInput(item.dueAt) : ''
			}))
			template = inferTemplate(plan.items)
		} else {
			planName = `Plan ${segmentMeta.name}`
			allowFullPayment = true
			template = 'deposit_2'
			generateItems('deposit_2')
		}
	})

	function inferTemplate(serverItems: { kind: string }[]): TemplateKey {
		if (serverItems.length === 0) return 'custom'
		if (serverItems.length === 1 && serverItems[0].kind === 'full')
			return 'full'
		const hasDeposit = serverItems.some((i) => i.kind === 'deposit')
		const installmentCount = serverItems.filter(
			(i) => i.kind === 'installment' || i.kind === 'balance'
		).length
		if (hasDeposit && installmentCount === 2) return 'deposit_2'
		if (hasDeposit && installmentCount === 3) return 'deposit_3'
		return 'custom'
	}

	function toDateInput(timestamp: number): string {
		const d = new Date(timestamp)
		const yyyy = d.getFullYear()
		const mm = String(d.getMonth() + 1).padStart(2, '0')
		const dd = String(d.getDate()).padStart(2, '0')
		return `${yyyy}-${mm}-${dd}`
	}

	function fromDateInput(value: string): number | undefined {
		if (!value) return undefined
		const [y, m, d] = value.split('-').map(Number)
		if (!y || !m || !d) return undefined
		return new Date(y, m - 1, d).getTime()
	}

	function newKey(): string {
		return `i-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
	}

	function generateItems(t: TemplateKey) {
		const price = pricePerBerthPLN
		if (t === 'full') {
			items = [
				{
					key: newKey(),
					label: 'Całość',
					kind: 'full',
					amountPLN: price,
					dueAt: ''
				}
			]
			return
		}
		if (t === 'custom') {
			items = [
				{
					key: newKey(),
					label: 'Pozycja 1',
					kind: 'custom',
					amountPLN: price,
					dueAt: ''
				}
			]
			return
		}
		const installmentCount = t === 'deposit_2' ? 2 : 3
		const depositPLN = Math.round(price * 0.3)
		const remaining = price - depositPLN
		const installmentBase = Math.floor(remaining / installmentCount)
		const remainder = remaining - installmentBase * installmentCount

		const next: DraftItem[] = [
			{
				key: newKey(),
				label: 'Zaliczka',
				kind: 'deposit',
				amountPLN: depositPLN,
				dueAt: ''
			}
		]
		for (let i = 0; i < installmentCount; i++) {
			const isLast = i === installmentCount - 1
			next.push({
				key: newKey(),
				label: `Rata ${i + 1}`,
				kind: isLast ? 'balance' : 'installment',
				amountPLN: installmentBase + (isLast ? remainder : 0),
				dueAt: ''
			})
		}
		items = next
	}

	function regenerate() {
		generateItems(template)
		toast = {
			kind: 'info',
			text: 'Pozycje wygenerowane. Możesz teraz dopiąć kwoty i terminy.'
		}
	}

	function addItem() {
		items = [
			...items,
			{
				key: newKey(),
				label: `Pozycja ${items.length + 1}`,
				kind: 'custom',
				amountPLN: 0,
				dueAt: ''
			}
		]
	}

	function removeItem(key: string) {
		items = items.filter((it) => it.key !== key)
	}

	function moveItem(key: string, direction: -1 | 1) {
		const idx = items.findIndex((it) => it.key === key)
		if (idx < 0) return
		const next = idx + direction
		if (next < 0 || next >= items.length) return
		const copy = [...items]
		;[copy[idx], copy[next]] = [copy[next], copy[idx]]
		items = copy
	}

	const totalPLN = $derived(
		items.reduce(
			(sum, it) => sum + (Number.isFinite(it.amountPLN) ? it.amountPLN : 0),
			0
		)
	)
	const overByPLN = $derived(totalPLN - pricePerBerthPLN)
	const sumStatus = $derived<'ok' | 'under' | 'over'>(
		overByPLN === 0 ? 'ok' : overByPLN > 0 ? 'over' : 'under'
	)

	function formatPLN(value: number): string {
		return Math.round(value)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
	}

	async function save() {
		if (sumStatus === 'over') {
			toast = {
				kind: 'err',
				text: 'Suma pozycji przekracza cenę za koję. Skoryguj kwoty.'
			}
			return
		}
		if (items.some((it) => it.amountPLN <= 0)) {
			toast = {
				kind: 'err',
				text: 'Każda pozycja musi mieć kwotę większą od zera.'
			}
			return
		}
		if (items.some((it) => !it.label.trim())) {
			toast = {
				kind: 'err',
				text: 'Każda pozycja musi mieć nazwę.'
			}
			return
		}
		saving = true
		toast = null
		try {
			await convex.mutation(api.mutations.upsertSegmentPaymentPlan, {
				segmentSlug: selectedSegment,
				name: planName.trim() || 'Plan domyślny',
				allowFullPayment,
				items: items.map((it, index) => ({
					label: it.label.trim(),
					kind: it.kind,
					amountPerBerth: Math.round(it.amountPLN * 100),
					dueAt: fromDateInput(it.dueAt),
					sortOrder: index + 1
				}))
			})
			toast = {
				kind: 'ok',
				text: 'Plan zapisany. Nowe rezerwacje dostaną ten harmonogram; istniejące pozostają bez zmian.'
			}
			lastLoadedSegment = null // refresh from server on next tick
		} catch (err) {
			toast = {
				kind: 'err',
				text:
					err instanceof Error ? err.message : 'Nie udało się zapisać planu.'
			}
		} finally {
			saving = false
		}
	}
</script>

<svelte:head>
	<title>Admin · Automatyzacje</title>
</svelte:head>

<header class="topline">
	<p class="eyebrow">Automation</p>
	<h1>Elastyczny harmonogram rat</h1>
</header>

<div class="segment-strip" aria-label="Segmenty rejsu">
	{#each voyageSegments as seg (seg.id)}
		<button
			type="button"
			class="segment"
			data-active={selectedSegment === seg.id || undefined}
			onclick={() => {
				selectedSegment = seg.id
				lastLoadedSegment = null
				toast = null
			}}
		>
			<strong>{seg.name}</strong>
			<span>{seg.dates} · {formatPLN(seg.price)} PLN / koja</span>
		</button>
	{/each}
</div>

<section class="panel">
	<div class="panel-head">
		<div>
			<h2>Plan dla segmentu</h2>
			<p>
				Globalny szablon. Zmiana planu nie zmienia istniejących rezerwacji —
				każdy booking ma własny snapshot.
			</p>
		</div>
		<div class="head-actions">
			<button type="button" class="btn" onclick={regenerate}
				>Generuj pozycje</button
			>
			<button
				type="button"
				class="btn btn--primary"
				onclick={save}
				disabled={saving}
			>
				{saving ? 'Zapisuję…' : 'Zapisz plan'}
			</button>
		</div>
	</div>

	<div class="form-grid">
		<label class="field">
			<span>Szablon</span>
			<select bind:value={template}>
				<option value="deposit_2">Zaliczka + 2 raty</option>
				<option value="deposit_3">Zaliczka + 3 raty</option>
				<option value="full">Całość teraz</option>
				<option value="custom">Własny plan</option>
			</select>
		</label>
		<label class="field">
			<span>Nazwa planu</span>
			<input bind:value={planName} placeholder="Plan domyślny" />
		</label>
		<label class="field">
			<span>Cena za koję</span>
			<input value={`${formatPLN(pricePerBerthPLN)} PLN`} readonly />
		</label>
		<label class="field field--toggle">
			<span>Płatność jednorazowa</span>
			<label class="toggle">
				<input type="checkbox" bind:checked={allowFullPayment} />
				<span>Pozwól zapłacić całość zamiast rat</span>
			</label>
		</label>
	</div>

	<ul class="plan-list">
		{#each items as item, index (item.key)}
			<li class="plan-item">
				<div class="plan-item__order">{index + 1}</div>
				<div class="plan-item__fields">
					<label class="inline">
						<span>Etykieta</span>
						<input bind:value={item.label} />
					</label>
					<label class="inline">
						<span>Typ</span>
						<select bind:value={item.kind}>
							<option value="deposit">deposit</option>
							<option value="installment">installment</option>
							<option value="balance">balance</option>
							<option value="full">full</option>
							<option value="custom">custom</option>
						</select>
					</label>
					<label class="inline">
						<span>Kwota / koja (PLN)</span>
						<input type="number" min="0" bind:value={item.amountPLN} />
					</label>
					<label class="inline">
						<span>Termin</span>
						<input type="date" bind:value={item.dueAt} />
					</label>
				</div>
				<div class="plan-item__actions">
					<button
						type="button"
						class="mini"
						aria-label="W górę"
						disabled={index === 0}
						onclick={() => moveItem(item.key, -1)}>↑</button
					>
					<button
						type="button"
						class="mini"
						aria-label="W dół"
						disabled={index === items.length - 1}
						onclick={() => moveItem(item.key, 1)}>↓</button
					>
					<button
						type="button"
						class="mini mini--danger"
						onclick={() => removeItem(item.key)}>Usuń</button
					>
				</div>
			</li>
		{/each}
		<li class="plan-add">
			<button type="button" class="btn" onclick={addItem}
				>+ Dodaj pozycję</button
			>
		</li>
		<li class="plan-sum" data-status={sumStatus}>
			<div>
				<strong>Suma planu · {formatPLN(totalPLN)} PLN / koja</strong>
				<span>
					{sumStatus === 'ok'
						? 'Suma pozycji równa się cenie segmentu.'
						: sumStatus === 'under'
							? `Brakuje ${formatPLN(-overByPLN)} PLN / koja — przy bookingu różnica trafi do "Dopłata końcowa".`
							: `Przekroczono cenę o ${formatPLN(overByPLN)} PLN / koja — zapis zostanie odrzucony.`}
				</span>
			</div>
			<span
				class="badge badge--{sumStatus === 'ok'
					? 'ok'
					: sumStatus === 'under'
						? 'warn'
						: 'danger'}"
			>
				{sumStatus === 'ok' ? 'Valid' : sumStatus === 'under' ? 'Pod' : 'Ponad'}
			</span>
		</li>
	</ul>

	{#if toast}
		<p class="toast toast--{toast.kind}">{toast.text}</p>
	{/if}
</section>

<style>
	.topline {
		margin-bottom: 22px;
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
		flex-wrap: wrap;
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
		max-width: 540px;
	}

	.head-actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
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

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1px;
		background: var(--admin-line);
		border-bottom: 1px solid var(--admin-line);
	}
	.field {
		display: grid;
		gap: 8px;
		background: var(--admin-navy-mid);
		padding: 15px;
	}
	.field span {
		color: var(--admin-muted);
		font-size: 10px;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}
	.field input,
	.field select {
		width: 100%;
		min-height: 38px;
		border: 1px solid var(--admin-line);
		background: var(--admin-navy-deep);
		color: var(--admin-warm-white);
		padding: 9px 10px;
		font-family: inherit;
	}
	.field input[readonly] {
		opacity: 0.7;
	}
	.field--toggle {
		gap: 12px;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		color: var(--admin-warm-white);
	}
	.toggle input {
		width: 16px;
		height: 16px;
		accent-color: var(--admin-brass);
	}

	.plan-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.plan-item {
		display: grid;
		grid-template-columns: 36px minmax(0, 1fr) auto;
		gap: 12px;
		padding: 14px 18px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.08);
		align-items: center;
	}
	.plan-item__order {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 1px solid var(--admin-line);
		color: var(--admin-brass-light);
		font-size: 12px;
	}
	.plan-item__fields {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 10px;
	}
	.inline {
		display: grid;
		gap: 4px;
		font-size: 11px;
	}
	.inline span {
		color: var(--admin-muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.inline input,
	.inline select {
		min-height: 34px;
		border: 1px solid var(--admin-line);
		background: var(--admin-navy-deep);
		color: var(--admin-warm-white);
		padding: 6px 10px;
		font-family: inherit;
	}
	.plan-item__actions {
		display: flex;
		gap: 6px;
	}
	.mini {
		min-height: 30px;
		border: 1px solid var(--admin-line);
		background: rgba(7, 17, 30, 0.48);
		color: var(--admin-warm-white);
		padding: 0 10px;
		font-size: 11px;
		cursor: pointer;
		font-family: inherit;
	}
	.mini:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.mini--danger {
		color: var(--admin-danger);
		border-color: rgba(228, 109, 95, 0.34);
	}

	.plan-add {
		padding: 14px 18px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.08);
	}
	.plan-sum {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-top: 1px solid var(--admin-line);
	}
	.plan-sum strong {
		display: block;
		font-size: 14px;
	}
	.plan-sum span {
		display: block;
		margin-top: 4px;
		color: var(--admin-muted);
		font-size: 12px;
	}
	.plan-sum[data-status='ok'] strong {
		color: var(--admin-ok);
	}
	.plan-sum[data-status='over'] strong {
		color: var(--admin-danger);
	}
	.plan-sum[data-status='under'] strong {
		color: var(--admin-warn);
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

	.toast {
		margin: 14px 18px 18px;
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

	@media (max-width: 1180px) {
		.segment-strip {
			grid-template-columns: 1fr 1fr;
		}
		.form-grid {
			grid-template-columns: 1fr;
		}
		.plan-item {
			grid-template-columns: 1fr;
		}
		.plan-item__fields {
			grid-template-columns: 1fr 1fr;
		}
		.plan-item__order {
			justify-self: start;
		}
		.plan-item__actions {
			justify-self: end;
		}
	}
	@media (max-width: 720px) {
		.segment-strip {
			grid-template-columns: 1fr;
		}
		.plan-item__fields {
			grid-template-columns: 1fr;
		}
	}
</style>
