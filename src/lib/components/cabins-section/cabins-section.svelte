<script lang="ts">
	import { resolve } from '$app/paths'
	import { useQuery } from 'convex-svelte'
	import { BoatPlan } from '$components/boat-plan'
	import { findCabinByBerth } from '$lib/data/cabins'
	import { voyageSegments } from '$lib/data/voyage-segments'
	import { api } from '$convex/api'

	let selectedSegment = $state<string>(voyageSegments[0].id)
	let selectedBerth = $state<string | null>(null)

	const segment = $derived(
		voyageSegments.find((s) => s.id === selectedSegment) ?? voyageSegments[0]
	)
	const cabin = $derived(
		selectedBerth ? findCabinByBerth(selectedBerth) : undefined
	)

	// Live berth statuses from Convex — falls back to empty map while loading
	const statusQuery = useQuery(api.queries.berthStatusesBySlug, () => ({
		slug: selectedSegment
	}))
	type BerthStatus = 'taken' | 'captain' | 'complimentary'
	const berthStatuses = $derived(
		new Map(
			(statusQuery.data ?? []).map(({ berthId, status }) => [
				berthId,
				status as BerthStatus
			])
		)
	)
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
					aria-selected={selectedSegment === seg.id}
					class="segments__btn"
					class:segments__btn--active={selectedSegment === seg.id}
					onclick={() => (selectedSegment = seg.id)}
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
			{selectedBerth}
			{berthStatuses}
			onSelectBerth={(id) => (selectedBerth = id)}
		/>

		{#if selectedBerth && cabin}
			<div class="banner" aria-live="polite">
				<div class="banner__copy">
					<p class="banner__eyebrow">Wybrano</p>
					<p class="banner__title">
						Koja {selectedBerth} · {cabin.label} · {segment.name}
					</p>
				</div>
				<a
					class="banner__cta"
					href={`${resolve('/book')}?segment=${selectedSegment}&berth=${selectedBerth}`}
					>Rezerwuj →</a
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
		color: rgba(196, 146, 58, 0.6);
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
		color: rgba(196, 146, 58, 0.3);
	}

	.segments__btn--active .segments__dates {
		color: var(--color-brass);
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
		color: rgba(196, 146, 58, 0.4);
	}

	.segments__btn--active .segments__price {
		color: var(--color-brass);
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
		color: rgba(196, 146, 58, 0.5);
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
