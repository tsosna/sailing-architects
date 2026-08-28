<script lang="ts">
	import { useQuery } from 'convex-svelte'
	import { BoatPlan } from '$components/boat-plan'
	import { voyageSegments } from '$lib/data/voyage-segments'
	import { bookingSelection } from '$lib/state/booking-selection.svelte'
	import { api } from '$convex/api'
	import { berthBadge } from '$lib/berth-badge'

	let { onSelectSegment }: { onSelectSegment?: (id: string) => void } = $props()

	let planEl: HTMLElement | undefined

	function selectSegment(id: string) {
		bookingSelection.selectSegment(id)
		onSelectSegment?.(id)
		const soldOut = freeBySlug.get(id) === 0
		const rect = planEl?.getBoundingClientRect()
		if (!soldOut && rect && rect.bottom > window.innerHeight) {
			planEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}

	const segmentName = $derived(
		voyageSegments.find((s) => s.id === bookingSelection.selectedSegment)?.name
	)

	// Live berth statuses from Convex — falls back to empty map while loading
	const statusQuery = useQuery(api.queries.berthStatusesBySlug, () => ({
		slug: bookingSelection.selectedSegment
	}))
	type BerthStatus = 'held' | 'taken' | 'captain' | 'complimentary'

	const berthStatuses = $derived(
		new Map(
			(statusQuery.data ?? [])
				.filter(({ heldByMe }: { heldByMe: boolean }) => !heldByMe)
				.map(({ berthId, status }) => [berthId, status as BerthStatus])
		)
	)

	// Free berth count per segment — empty map while loading
	const availabilityQuery = useQuery(
		api.queries.listBerthAvailability,
		() => ({})
	)

	const freeBySlug = $derived(
		new Map(
			(availabilityQuery.data ?? []).map(({ slug, free }) => [slug, free])
		)
	)
</script>

<div class="segments" role="tablist" aria-label="Wybierz etap rejsu">
	{#each voyageSegments as seg (seg.id)}
		{@const badge = berthBadge(freeBySlug.get(seg.id))}
		<button
			type="button"
			role="tab"
			aria-selected={bookingSelection.selectedSegment === seg.id}
			class="segments__btn"
			class:segments__btn--active={bookingSelection.selectedSegment === seg.id}
			onclick={() => selectSegment(seg.id)}
		>
			<span class="segments__dates">{seg.dates}</span>
			<span class="segments__name">{seg.name}</span>
			<span class="segments__price">{seg.price.toLocaleString('pl-PL')} zł</span
			>
			{#if badge}
				<span class="segments__badge segments__badge--{badge.tone}"
					>{badge.text}</span
				>
			{/if}
		</button>
	{/each}
</div>

<div class="plan-anchor" bind:this={planEl}>
	<BoatPlan
		selectedBerths={bookingSelection.selectedBerths}
		{berthStatuses}
		onToggleBerth={bookingSelection.toggleBerth.bind(bookingSelection)}
		{segmentName}
	/>
</div>

<style>
	.segments {
		display: flex;
		gap: 1px;
		margin-bottom: 48px;
		background: rgba(196, 146, 58, 0.1);
		flex-wrap: wrap;
	}

	.segments__btn:not(.segments__btn--active):hover {
		background: var(--color-navy-light);
	}

	.segments__btn:hover .segments__name {
		color: var(--color-on-surface);
	}

	.segments__btn--active {
		background: rgba(196, 146, 58, 0.18);
		border-bottom-color: var(--color-brass);
		box-shadow: inset 0 0 0 1px rgba(196, 146, 58, 0.35);
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
		color: var(--color-on-surface-soft);
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

	.segments__badge {
		align-self: flex-start;
		padding: 4px 10px;
		font-family: var(--font-sans);
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 1.5px;
		text-transform: uppercase;
	}

	.segments__badge--low-stock {
		background: var(--color-brass);
		color: var(--color-navy);
	}

	.segments__badge--sold-out {
		background: rgba(245, 240, 232, 0.12);
		border: 1px solid var(--color-muted);
		color: var(--color-warm-white);
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

	.plan-anchor {
		scroll-margin-top: 64px;
	}
</style>
