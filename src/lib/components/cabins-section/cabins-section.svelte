<script lang="ts">
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { BerthPicker } from '$components/berth-picker'
	import { voyageSegments } from '$lib/data/voyage-segments'
	import { bookingSelection } from '$lib/state/booking-selection.svelte'

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

		<BerthPicker onSelectSegment={() => (appliedSegmentParam = segmentParam)} />

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
		color: var(--color-on-surface-muted);
		margin: 0 0 48px;
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
