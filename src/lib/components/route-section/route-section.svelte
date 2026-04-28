<script lang="ts">
	type Stage = {
		num: string
		from: string
		to: string
		dates: string
		days: number
		price: number
		desc: string
	}

	const stages: readonly Stage[] = [
		{
			num: '01',
			from: 'Palma de Mallorca',
			to: 'Gibraltar',
			dates: '4–11.10.2026',
			days: 7,
			price: 1800,
			desc: 'Start wyprawy. Żegluga wzdłuż wschodniego wybrzeża Hiszpanii, przez Cieśninę Gibraltarską — jedną z najważniejszych morskich bram świata.'
		},
		{
			num: '02',
			from: 'Gibraltar',
			to: 'Madera',
			dates: '12–21.10.2026',
			days: 9,
			price: 2300,
			desc: 'Kurs na południe-zachód. Pierwsze etapy oceaniczne. Madera — zielona perła Atlantyku, wulkaniczne klify, tarasowe winnice, historyczne Funchal.'
		},
		{
			num: '03',
			from: 'Madera',
			to: 'Teneryfa',
			dates: '22–31.10.2026',
			days: 9,
			price: 2300,
			desc: 'Wyspy Kanaryjskie. Teneryfa oferuje majestatyczny wulkan Teide, turkusowe plaże i doskonałą kuchnię — idealny odpoczynek przed ostatnim etapem.'
		},
		{
			num: '04',
			from: 'Teneryfa',
			to: 'Cabo Verde',
			dates: '1–14.11.2026',
			days: 13,
			price: 3200,
			desc: 'Finał — prawdziwy ocean. Pasaty, wieloryby i delfiny. Cabo Verde to esencja egzotyki: afrykańskie rytmy, oceaniczna przestrzeń, wulkaniczne krajobrazy.'
		}
	]

	const ports = [
		{ x: 200, y: 40, label: 'Palma de Mallorca', stage: 0 },
		{ x: 220, y: 120, label: 'Gibraltar', stage: 1 },
		{ x: 120, y: 200, label: 'Madera', stage: 2 },
		{ x: 80, y: 280, label: 'Teneryfa', stage: 3 },
		{ x: 40, y: 320, label: 'Cabo Verde', stage: 3 }
	] as const

	let activeStage = $state(0)
	const stage = $derived(stages[activeStage])
	const priceFormatted = $derived(stage.price.toLocaleString('pl-PL'))
</script>

<section id="route" class="route">
	<div class="route__inner">
		<p class="eyebrow">Trasa rejsu</p>
		<h2 class="title">Cztery etapy przez Atlantyk</h2>

		<div class="route__grid">
			<div class="map">
				<div class="map__caption">mapa poglądowa</div>
				<svg viewBox="0 0 300 360" width="80%" class="map__svg">
					<polyline
						points="200,40 220,120 120,200 80,280 40,320"
						fill="none"
						stroke="rgba(196,146,58,0.35)"
						stroke-width="1"
						stroke-dasharray="4 3"
					/>
					{#each ports as port (port.label)}
						<g
							class="map__port"
							class:map__port--active={activeStage === port.stage}
							onclick={() => (activeStage = port.stage)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									activeStage = port.stage
								}
							}}
							role="button"
							tabindex="0"
							aria-label="Etap {port.label}"
						>
							<circle
								cx={port.x}
								cy={port.y}
								r="5"
								fill={activeStage === port.stage
									? '#c4923a'
									: 'rgba(196,146,58,0.3)'}
								stroke="#c4923a"
								stroke-width="1"
							/>
							<text
								x={port.x + 10}
								y={port.y + 4}
								font-size="9"
								font-family="DM Sans, sans-serif"
								fill="rgba(245,240,232,0.5)">{port.label}</text
							>
						</g>
					{/each}
					<text
						x="150"
						y="350"
						font-size="7"
						font-family="monospace"
						fill="rgba(196,146,58,0.18)"
						letter-spacing="2"
						text-anchor="middle">OCEAN ATLANTYCKI</text
					>
				</svg>
			</div>

			<div class="details">
				<div class="selector" role="tablist" aria-label="Wybierz etap">
					{#each stages as st, i (st.num)}
						<button
							type="button"
							role="tab"
							aria-selected={activeStage === i}
							class="selector__btn"
							class:selector__btn--active={activeStage === i}
							onclick={() => (activeStage = i)}
						>
							{st.num}
						</button>
					{/each}
				</div>

				<article class="card" aria-live="polite">
					<p class="card__eyebrow">Etap {stage.num}</p>
					<h3 class="card__title">{stage.from}</h3>
					<p class="card__to">→ {stage.to}</p>
					<p class="card__desc">{stage.desc}</p>
					<div class="card__meta">
						<div>
							<p class="card__label">Termin</p>
							<p class="card__value">{stage.dates}</p>
						</div>
						<div>
							<p class="card__label">Dni</p>
							<p class="card__value">{stage.days}</p>
						</div>
						<div>
							<p class="card__label">Cena</p>
							<p class="card__price">{priceFormatted} zł</p>
						</div>
					</div>
				</article>
			</div>
		</div>
	</div>
</section>

<style>
	.route {
		background: var(--color-navy-mid);
		padding: 96px 40px;
	}

	.route__inner {
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
		margin: 0 0 48px;
	}

	.route__grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 48px;
		align-items: start;
	}

	.map {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1.1;
		border: 1px solid rgba(196, 146, 58, 0.15);
		background: rgba(196, 146, 58, 0.02);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.map__caption {
		position: absolute;
		top: 12px;
		right: 12px;
		font-family: monospace;
		font-size: 8px;
		color: var(--color-brass-text-soft);
		letter-spacing: 1px;
	}

	.map__svg {
		display: block;
	}

	.map__port {
		cursor: pointer;
		outline: none;
		transition: opacity 150ms ease;
	}

	.map__port:hover,
	.map__port:focus-visible {
		opacity: 0.85;
	}

	.map__port:focus-visible circle {
		stroke-width: 2;
	}

	.selector {
		display: flex;
		gap: 1px;
		margin-bottom: 32px;
		background: rgba(196, 146, 58, 0.1);
	}

	.selector__btn {
		flex: 1;
		padding: 12px 4px;
		background: var(--color-navy-mid);
		border: none;
		border-bottom: 2px solid transparent;
		color: rgba(245, 240, 232, 0.3);
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1px;
		cursor: pointer;
		transition:
			color 150ms ease,
			background-color 150ms ease,
			border-color 150ms ease;
	}

	.selector__btn:hover {
		color: rgba(245, 240, 232, 0.6);
	}

	.selector__btn--active {
		background: rgba(196, 146, 58, 0.15);
		border-bottom-color: var(--color-brass);
		color: var(--color-brass-text);
	}

	.card {
		padding: 28px;
		border: 1px solid rgba(196, 146, 58, 0.15);
		background: rgba(196, 146, 58, 0.03);
	}

	.card__eyebrow {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 8px;
	}

	.card__title {
		font-family: var(--font-serif);
		font-size: 24px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 4px;
	}

	.card__to {
		font-family: var(--font-serif);
		font-size: 16px;
		font-style: italic;
		color: var(--color-brass-text-soft);
		margin: 0 0 20px;
	}

	.card__desc {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.7;
		color: rgba(245, 240, 232, 0.55);
		margin: 0 0 24px;
	}

	.card__meta {
		display: flex;
		gap: 24px;
		padding-top: 20px;
		border-top: 1px solid rgba(196, 146, 58, 0.1);
		flex-wrap: wrap;
	}

	.card__label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 3px;
	}

	.card__value {
		font-family: var(--font-sans);
		font-size: 14px;
		color: var(--color-warm-white);
		margin: 0;
	}

	.card__price {
		font-family: var(--font-serif);
		font-size: 22px;
		color: var(--color-brass-text);
		margin: 0;
	}

	@media (max-width: 820px) {
		.route__grid {
			grid-template-columns: 1fr;
			gap: 32px;
		}
	}
</style>
