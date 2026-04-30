<script lang="ts">
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { useQuery } from 'convex-svelte'
	import { BoatPlan } from '$components/boat-plan'
	import { voyageSegments } from '$lib/data/voyage-segments'
	import { bookingSelection } from '$lib/state/booking-selection.svelte'
	import { api } from '$convex/api'

	const segmentParam = $derived(page.url.searchParams.get('segment'))
	let appliedSegmentParam = $state<string | null>(null)

	const segment = $derived(
		voyageSegments.find((s) => s.id === bookingSelection.selectedSegment) ??
			voyageSegments[0]
	)
	const totalPrice = $derived(
		segment.price * bookingSelection.selectedBerths.length
	)
	const selectedBerthsLabel = $derived(
		bookingSelection.selectedBerths.length === 1 ? 'koję' : 'koje'
	)
	const totalPriceFormatted = $derived(totalPrice.toLocaleString('pl-PL'))
	const selectionEyebrow = $derived(
		[
			'Wybrano',
			bookingSelection.selectedBerths.length,
			selectedBerthsLabel
		].join(' ')
	)
	const selectionSummary = $derived(
		`${bookingSelection.selectedBerths.join(', ')} · ${segment.name} · ${totalPriceFormatted} zł`
	)

	// Live berth statuses from Convex — falls back to empty map while loading
	const statusQuery = useQuery(api.queries.berthStatusesBySlug, () => ({
		slug: bookingSelection.selectedSegment
	}))
	type BerthStatus = 'held' | 'taken' | 'captain' | 'complimentary'
	const berthStatuses = $derived(
		new Map(
			(statusQuery.data ?? []).map(({ berthId, status }) => [
				berthId,
				status as BerthStatus
			])
		)
	)

	function selectSegment(id: string) {
		bookingSelection.selectSegment(id)
		appliedSegmentParam = segmentParam
	}

	$effect(() => {
		if (!segmentParam) return
		if (segmentParam === appliedSegmentParam) return
		if (!voyageSegments.some((s) => s.id === segmentParam)) return
		if (bookingSelection.selectedSegment === segmentParam) return

		bookingSelection.selectSegment(segmentParam)
		appliedSegmentParam = segmentParam
	})
</script>

<section id="cabins" class="cabins">
	<div class="cabins__inner">
		<p class="eyebrow">Plan kajutowy</p>
		<h2 class="title">Wybierz swoją koję</h2>
		<p class="lead">
			Kliknij koję na planie lub użyj listy. Szary oznacza zajęte, mosiądz —
			dostępne, złoty — wybrane.
		</p>

		<div class="segments" role="tablist" aria-label="Wybierz etap rejsu">
			{#each voyageSegments as seg (seg.id)}
				<button
					type="button"
					role="tab"
					aria-selected={bookingSelection.selectedSegment === seg.id}
					class="segments__btn"
					class:segments__btn--active={bookingSelection.selectedSegment ===
						seg.id}
					onclick={() => selectSegment(seg.id)}
				>
					<span class="segments__dates">{seg.dates}</span>
					<span class="segments__name">{seg.name}</span>
					<span class="segments__price"
						>{seg.price.toLocaleString('pl-PL')} zł</span
					>
				</button>
			{/each}
		</div>

		<BoatPlan
			selectedBerths={bookingSelection.selectedBerths}
			{berthStatuses}
			onToggleBerth={bookingSelection.toggleBerth.bind(bookingSelection)}
		/>

		{#if bookingSelection.selectedBerths.length > 0}
			<div class="banner" aria-live="polite">
				<div class="banner__copy">
					<p class="banner__eyebrow">{selectionEyebrow}</p>
					<p class="banner__title">{selectionSummary}</p>
				</div>
				<a
					class="banner__cta"
					href={bookingSelection.bookingPath(resolve('/book'))}>Rezerwuj →</a
				>
			</div>
		{/if}
	</div>
</section>

<style>
	.cabins {
		background: var(--color-navy);
		padding: 96px 40px;
	}

	.cabins__inner {
		max-width: 1100px;
		margin: 0 auto;
	}

	.eyebrow {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 4px;
		text-transform: uppercase;
		color: var(--color-brass-text);
		margin: 0 0 12px;
	}

	.title {
		font-family: var(--font-serif);
		font-size: clamp(28px, 4vw, 48px);
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 12px;
	}

	.lead {
		font-family: var(--font-sans);
		font-size: 14px;
		line-height: 1.7;
		max-width: 480px;
		color: rgba(245, 240, 232, 0.45);
		margin: 0 0 48px;
	}

	.segments {
		display: flex;
		gap: 1px;
		margin-bottom: 48px;
		background: rgba(196, 146, 58, 0.1);
		flex-wrap: wrap;
	}

	.segments__btn {
		flex: 1;
		min-width: 160px;
		padding: 16px 20px;
		background: var(--color-navy);
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 4px;
		transition:
			background-color 150ms ease,
			border-color 150ms ease;
	}

	.segments__btn--active {
		background: rgba(196, 146, 58, 0.12);
		border-bottom-color: var(--color-brass);
	}

	.segments__dates {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
	}

	.segments__btn--active .segments__dates {
		color: var(--color-brass-text);
	}

	.segments__name {
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		color: rgba(245, 240, 232, 0.4);
	}

	.segments__btn--active .segments__name {
		color: var(--color-warm-white);
	}

	.segments__price {
		font-family: var(--font-serif);
		font-size: 18px;
		color: var(--color-brass-text-soft);
	}

	.segments__btn--active .segments__price {
		color: var(--color-brass-text);
	}

	.banner {
		margin-top: 48px;
		display: flex;
		align-items: center;
		gap: 24px;
		flex-wrap: wrap;
	}

	.banner__copy {
		flex: 1;
		min-width: 240px;
		padding: 20px 24px;
		background: rgba(196, 146, 58, 0.07);
		border: 1px solid rgba(196, 146, 58, 0.25);
	}

	.banner__eyebrow {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 4px;
	}

	.banner__title {
		font-family: var(--font-serif);
		font-size: 20px;
		color: var(--color-warm-white);
		margin: 0;
	}

	.banner__cta {
		padding: 18px 48px;
		background: var(--color-brass);
		border: none;
		color: var(--color-navy);
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 13px;
		letter-spacing: 2px;
		text-transform: uppercase;
		cursor: pointer;
		border-radius: 0;
		white-space: nowrap;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		transition: background-color 200ms ease;
	}

	.banner__cta:hover {
		background: var(--color-brass-light);
	}
</style>
