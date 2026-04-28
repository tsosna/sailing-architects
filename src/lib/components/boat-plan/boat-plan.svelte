<script lang="ts">
	import { cabins, findCabinByBerth } from '$lib/data/cabins'

	type BerthStatus = 'taken' | 'captain' | 'complimentary'
	type BerthState =
		| 'available'
		| 'hovered'
		| 'selected'
		| 'taken'
		| 'captain'
		| 'complimentary'

	type Props = {
		selectedBerths: ReadonlyArray<string>
		onToggleBerth: (id: string) => void
		berthStatuses?: ReadonlyMap<string, BerthStatus>
	}

	let {
		selectedBerths,
		onToggleBerth,
		berthStatuses = new Map<string, BerthStatus>([
			['A2', 'taken'],
			['C1', 'captain'],
			['D2', 'taken']
		])
	}: Props = $props()

	let hovered = $state<string | null>(null)

	function berthState(id: string): BerthState {
		const status = berthStatuses.get(id)
		if (status) return status
		if (selectedBerths.includes(id)) return 'selected'
		if (hovered === id) return 'hovered'
		return 'available'
	}

	function berthFill(id: string): string {
		switch (berthState(id)) {
			case 'taken':
				return 'rgba(13,27,46,0.55)'
			case 'captain':
				return 'rgba(8,18,36,0.92)'
			case 'complimentary':
				return 'rgba(196,146,58,0.06)'
			case 'selected':
				return 'rgba(196,146,58,0.85)'
			case 'hovered':
				return 'rgba(196,146,58,0.22)'
			default:
				return 'rgba(245,240,232,0.12)'
		}
	}

	function berthStroke(id: string): string {
		switch (berthState(id)) {
			case 'taken':
				return '#3a4a5c'
			case 'captain':
				return 'rgba(196,146,58,0.5)'
			case 'complimentary':
				return 'rgba(196,146,58,0.35)'
			default:
				return '#c4923a'
		}
	}

	function berthLabelColor(id: string): string {
		switch (berthState(id)) {
			case 'selected':
				return '#fff'
			case 'taken':
				return '#3a4a5c'
			case 'captain':
				return 'rgba(196,146,58,0.5)'
			case 'complimentary':
				return 'rgba(196,146,58,0.4)'
			default:
				return '#c4923a'
		}
	}

	function handleBerth(id: string) {
		if (berthStatuses.has(id)) return
		onToggleBerth(id)
	}

	function handleKey(e: KeyboardEvent, id: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleBerth(id)
		}
	}

	// Berth rectangles computed from design SVG (viewBox 0 0 420 1080)
	// Forward section (A = port, B = starboard): 4 berths side-by-side pairs
	// Middle section (E): bunk-bed cabin, E1 lower / E2 upper
	// Aft section (C = port, D = starboard): 4 berths in two pairs
	const berthSlots = [
		{ id: 'A1', x: 80, y: 126, w: 59, h: 138 },
		{ id: 'A2', x: 147, y: 126, w: 59, h: 138 },
		{ id: 'B1', x: 214, y: 126, w: 59, h: 138 },
		{ id: 'B2', x: 281, y: 126, w: 59, h: 138 },
		{ id: 'E1', x: 228, y: 587, w: 68, h: 172 },
		{ id: 'E2', x: 322, y: 585, w: 66, h: 174 },
		{ id: 'C1', x: 59, y: 798, w: 69, h: 150 },
		{ id: 'C2', x: 137, y: 798, w: 69, h: 150 },
		{ id: 'D1', x: 214, y: 798, w: 69, h: 150 },
		{ id: 'D2', x: 292, y: 798, w: 69, h: 150 }
	] as const

	const legend = [
		{ fill: 'rgba(245,240,232,0.12)', stroke: '#c4923a', label: 'Dostępna' },
		{ fill: 'rgba(196,146,58,0.85)', stroke: '#c4923a', label: 'Wybrana' },
		{ fill: 'rgba(13,27,46,0.55)', stroke: '#3a4a5c', label: 'Zajęta' },
		{
			fill: 'rgba(8,18,36,0.92)',
			stroke: 'rgba(196,146,58,0.5)',
			label: 'Kapitan ⚓'
		},
		{
			fill: 'rgba(196,146,58,0.06)',
			stroke: 'rgba(196,146,58,0.35)',
			label: 'Bezpłatna'
		}
	]

	const selectedDetails = $derived(
		selectedBerths
			.map((id) => ({ id, cabin: findCabinByBerth(id) }))
			.filter(
				(d): d is { id: string; cabin: NonNullable<typeof d.cabin> } =>
					!!d.cabin
			)
	)
	const selectedHeading = $derived(
		selectedDetails.length === 1
			? ['Wybrana', 'koja'].join(' ')
			: ['Wybrane', 'koje', `(${selectedDetails.length})`].join(' ')
	)
</script>

<div class="boat">
	<div class="boat__svg-wrap">
		<svg
			viewBox="0 0 420 1080"
			width="210"
			height="540"
			class="boat__svg"
			xmlns="http://www.w3.org/2000/svg"
		>
			<!-- Hull outline (all coords at 2× design scale) -->
			<path
				d="M210,20 C290,40 384,164 392,350 L392,756 C392,876 340,956 280,992 L140,992 C80,956 28,876 28,756 L28,350 C36,164 130,40 210,20Z"
				fill="rgba(13,27,46,0.55)"
				stroke="#c4923a"
				stroke-width="3"
			/>

			<!-- Centreline (dashed) -->
			<line
				x1="210"
				y1="20"
				x2="210"
				y2="992"
				stroke="rgba(196,146,58,0.18)"
				stroke-width="1"
				stroke-dasharray="8 6"
			/>

			<!-- ── BOW ── -->
			<text
				x="210"
				y="56"
				text-anchor="middle"
				font-size="11"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.6)"
				letter-spacing="4">DZIÓB</text
			>

			<!-- Forward cabin: shared outer border -->
			<rect
				x="76"
				y="124"
				width="268"
				height="144"
				fill="rgba(245,240,232,0.04)"
				stroke="rgba(196,146,58,0.22)"
				stroke-width="1.2"
			/>

			<!-- Forward cabin: inner centreline divider -->
			<line
				x1="210"
				y1="124"
				x2="210"
				y2="268"
				stroke="rgba(196,146,58,0.22)"
				stroke-width="1"
				stroke-dasharray="4 4"
			/>

			<!-- Forward section labels -->
			<text
				x="138"
				y="112"
				text-anchor="middle"
				font-size="13"
				font-family="DM Sans"
				font-weight="700"
				fill="rgba(196,146,58,0.6)">A</text
			>
			<text
				x="282"
				y="112"
				text-anchor="middle"
				font-size="13"
				font-family="DM Sans"
				font-weight="700"
				fill="rgba(196,146,58,0.6)">B</text
			>

			<!-- Separator: forward cabin → salon -->
			<line
				x1="52"
				y1="280"
				x2="368"
				y2="280"
				stroke="#c4923a"
				stroke-width="1.6"
			/>

			<!-- ── SALON ── -->
			<text
				x="210"
				y="316"
				text-anchor="middle"
				font-size="11"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.32)"
				letter-spacing="4">SALON</text
			>

			<!-- Salon settees (port + starboard) -->
			<rect
				x="32"
				y="320"
				width="84"
				height="104"
				fill="none"
				stroke="rgba(196,146,58,0.14)"
				stroke-width="1.2"
			/>
			<rect
				x="304"
				y="320"
				width="84"
				height="104"
				fill="none"
				stroke="rgba(196,146,58,0.14)"
				stroke-width="1.2"
			/>
			<!-- Salon table -->
			<rect
				x="144"
				y="332"
				width="132"
				height="80"
				fill="none"
				stroke="rgba(196,146,58,0.2)"
				stroke-width="1.2"
			/>

			<!-- NAV station -->
			<rect
				x="304"
				y="330"
				width="84"
				height="44"
				fill="none"
				stroke="rgba(196,146,58,0.12)"
				stroke-width="1"
			/>
			<text
				x="346"
				y="356"
				text-anchor="middle"
				font-size="9"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.28)"
				letter-spacing="2">NAV</text
			>

			<!-- Galley -->
			<rect
				x="32"
				y="430"
				width="84"
				height="56"
				fill="none"
				stroke="rgba(196,146,58,0.12)"
				stroke-width="1"
			/>
			<text
				x="74"
				y="462"
				text-anchor="middle"
				font-size="9"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.28)"
				letter-spacing="1">GALLEY</text
			>

			<!-- Companionway hatch -->
			<rect
				x="152"
				y="494"
				width="116"
				height="18"
				fill="rgba(13,27,46,0.8)"
				stroke="rgba(196,146,58,0.4)"
				stroke-width="1.2"
			/>
			<text
				x="210"
				y="507"
				text-anchor="middle"
				font-size="8"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.6)"
				letter-spacing="2">ZEJŚCIE</text
			>

			<!-- Separator: salon → middle cabins -->
			<line
				x1="28"
				y1="524"
				x2="392"
				y2="524"
				stroke="#c4923a"
				stroke-width="1.8"
			/>

			<!-- Middle section centreline -->
			<line
				x1="210"
				y1="524"
				x2="210"
				y2="764"
				stroke="#c4923a"
				stroke-width="1.6"
			/>

			<!-- E section label -->
			<text
				x="289"
				y="564"
				text-anchor="middle"
				font-size="13"
				font-family="DM Sans"
				font-weight="700"
				fill="rgba(196,146,58,0.6)">E</text
			>
			<text
				x="323"
				y="580"
				text-anchor="middle"
				font-size="9"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.65)">piętrowe</text
			>

			<!-- E2 upper-bunk outline (dashed overlay, shown when not selected/taken) -->
			<rect
				x="322"
				y="585"
				width="66"
				height="174"
				fill="none"
				stroke="rgba(196,146,58,0.35)"
				stroke-width="1"
				stroke-dasharray="6 3"
			/>

			<!-- Port-side mid dashed separator (head area) -->
			<line
				x1="32"
				y1="656"
				x2="206"
				y2="656"
				stroke="rgba(196,146,58,0.28)"
				stroke-width="1"
				stroke-dasharray="4 4"
			/>

			<!-- Separator: middle → aft cabins -->
			<line
				x1="28"
				y1="764"
				x2="392"
				y2="764"
				stroke="#c4923a"
				stroke-width="1.8"
			/>

			<!-- Aft section: centreline + labels -->
			<line
				x1="210"
				y1="764"
				x2="210"
				y2="990"
				stroke="#c4923a"
				stroke-width="1.6"
			/>
			<text
				x="114"
				y="790"
				text-anchor="middle"
				font-size="13"
				font-family="DM Sans"
				font-weight="700"
				fill="rgba(196,146,58,0.6)">C</text
			>
			<text
				x="284"
				y="790"
				text-anchor="middle"
				font-size="13"
				font-family="DM Sans"
				font-weight="700"
				fill="rgba(196,146,58,0.6)">D</text
			>

			<!-- Aft dashed internal separator (D cabin) -->
			<line
				x1="214"
				y1="886"
				x2="388"
				y2="886"
				stroke="rgba(196,146,58,0.28)"
				stroke-width="1"
				stroke-dasharray="4 4"
			/>

			<!-- ── STERN ── -->
			<text
				x="210"
				y="1022"
				text-anchor="middle"
				font-size="11"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.45)"
				letter-spacing="4">RUFA</text
			>
			<text
				x="210"
				y="1054"
				text-anchor="middle"
				font-size="9"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.28)"
				letter-spacing="1">JEANNEAU SUN ODYSSEY 519</text
			>
			<text
				x="210"
				y="1070"
				text-anchor="middle"
				font-size="7"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.16)"
				letter-spacing="1">Sailing Architects · rzut kojowy</text
			>

			<!-- ── INTERACTIVE BERTHS ── -->
			{#each berthSlots as berth (berth.id)}
				{@const state = berthState(berth.id)}
				<g
					class="boat__berth"
					class:boat__berth--clickable={state === 'available' ||
						state === 'hovered' ||
						state === 'selected'}
					role="button"
					tabindex={state === 'available' ||
					state === 'hovered' ||
					state === 'selected'
						? 0
						: -1}
					aria-label={`Koja ${berth.id} — ${state === 'captain' ? 'kapitan' : state === 'complimentary' ? 'bezpłatna' : state === 'taken' ? 'zajęta' : state === 'selected' ? 'wybrana' : 'dostępna'}`}
					aria-pressed={state === 'selected'}
					aria-disabled={state !== 'available' &&
						state !== 'hovered' &&
						state !== 'selected'}
					onclick={() => handleBerth(berth.id)}
					onkeydown={(e) => handleKey(e, berth.id)}
					onmouseenter={() => (hovered = berth.id)}
					onmouseleave={() => (hovered = null)}
					onfocus={() => (hovered = berth.id)}
					onblur={() => (hovered = null)}
				>
					<rect
						x={berth.x}
						y={berth.y}
						width={berth.w}
						height={berth.h}
						fill={berthFill(berth.id)}
						stroke={berthStroke(berth.id)}
						stroke-width={state === 'selected' ? 3 : 1.6}
						rx="0"
					/>
					{#if state === 'taken'}
						<line
							x1={berth.x + 6}
							y1={berth.y + 6}
							x2={berth.x + berth.w - 6}
							y2={berth.y + berth.h - 6}
							stroke="#3a4a5c"
							stroke-width="1.5"
						/>
					{/if}
					{#if state === 'complimentary'}
						<line
							x1={berth.x + 6}
							y1={berth.y + 6}
							x2={berth.x + berth.w - 6}
							y2={berth.y + berth.h - 6}
							stroke="rgba(196,146,58,0.3)"
							stroke-width="1"
						/>
						<line
							x1={berth.x + berth.w - 6}
							y1={berth.y + 6}
							x2={berth.x + 6}
							y2={berth.y + berth.h - 6}
							stroke="rgba(196,146,58,0.3)"
							stroke-width="1"
						/>
					{/if}
					{#if state === 'selected'}
						<line
							x1={berth.x + berth.w / 2 - 8}
							y1={berth.y + berth.h / 2}
							x2={berth.x + berth.w / 2 + 8}
							y2={berth.y + berth.h / 2}
							stroke="#fff"
							stroke-width="2.5"
						/>
						<line
							x1={berth.x + berth.w / 2}
							y1={berth.y + berth.h / 2 - 8}
							x2={berth.x + berth.w / 2}
							y2={berth.y + berth.h / 2 + 8}
							stroke="#fff"
							stroke-width="2.5"
						/>
					{/if}
					{#if state === 'captain'}
						<!-- Anchor symbol for captain berth -->
						<text
							x={berth.x + berth.w / 2}
							y={berth.y + berth.h / 2 - 6}
							text-anchor="middle"
							dominant-baseline="central"
							font-size="18"
							fill="rgba(196,146,58,0.45)">⚓</text
						>
						<text
							x={berth.x + berth.w / 2}
							y={berth.y + berth.h / 2 + 14}
							text-anchor="middle"
							dominant-baseline="central"
							font-size="9"
							font-family="DM Sans, sans-serif"
							fill="rgba(196,146,58,0.35)"
							letter-spacing="1">SKP</text
						>
					{:else}
						<text
							x={berth.x + berth.w / 2}
							y={berth.y + berth.h / 2}
							text-anchor="middle"
							dominant-baseline="central"
							font-size="14"
							font-family="DM Sans, sans-serif"
							fill={berthLabelColor(berth.id)}
							font-weight="600"
							letter-spacing="0.5">{berth.id}</text
						>
						{#if berth.id === 'E1' || berth.id === 'E2'}
							<text
								x={berth.x + berth.w / 2}
								y={berth.y + berth.h / 2 + 18}
								text-anchor="middle"
								dominant-baseline="central"
								font-size="9"
								font-family="DM Sans, sans-serif"
								fill={berthLabelColor(berth.id)}
								fill-opacity="0.7">{berth.id === 'E1' ? 'dół' : 'góra'}</text
							>
						{/if}
					{/if}
				</g>
			{/each}
		</svg>
	</div>

	<aside class="boat__sidebar">
		<section class="boat__legend">
			<p class="boat__legend-title">Legenda</p>
			<div class="boat__legend-list">
				{#each legend as item (item.label)}
					<div class="boat__legend-item">
						<span
							class="swatch"
							style:background={item.fill}
							style:border-color={item.stroke}
						></span>
						<span class="boat__legend-label">{item.label}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="boat__cabins-panel">
			<div class="boat__cabins-list">
				<p class="boat__legend-title">Kajuty</p>
				<ul class="boat__cabins">
					{#each cabins as cabin (cabin.id)}
						<li class="boat__cabin">
							<div class="boat__cabin-text">
								<span class="boat__cabin-label">{cabin.label}</span>
								<span class="boat__cabin-pos">{cabin.position}</span>
							</div>
							<div class="boat__cabin-berths">
								{#each cabin.berths as b (b)}
									{@const state = berthState(b)}
									<button
										type="button"
										class="berth-btn"
										class:berth-btn--selected={state === 'selected'}
										class:berth-btn--taken={state === 'taken'}
										class:berth-btn--captain={state === 'captain'}
										class:berth-btn--complimentary={state === 'complimentary'}
										aria-pressed={state === 'selected'}
										aria-disabled={state !== 'available' &&
											state !== 'hovered' &&
											state !== 'selected'}
										aria-label={`Koja ${b}`}
										onclick={() => handleBerth(b)}
										onmouseenter={() => (hovered = b)}
										onmouseleave={() => (hovered = null)}
									>
										{state === 'captain' ? '⚓' : b}
									</button>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
			</div>

			{#if selectedDetails.length > 0}
				<aside class="boat__selected">
					<p class="boat__selected-eyebrow">{selectedHeading}</p>
					{#each selectedDetails as d (d.id)}
						<div class="boat__selected-entry">
							<p class="boat__selected-title">Koja {d.id}</p>
							<p class="boat__selected-meta">
								{d.cabin.label} · {d.cabin.position}
							</p>
						</div>
					{/each}
				</aside>
			{/if}
		</section>
	</aside>
</div>

<style>
	.boat {
		display: flex;
		gap: 32px;
		align-items: flex-start;
		justify-content: center;
		flex-wrap: wrap;
	}

	.boat__svg-wrap {
		position: relative;
	}

	.boat__svg {
		display: block;
	}

	.boat__berth {
		outline: none;
		transition: opacity 150ms ease;
	}

	.boat__berth--clickable {
		cursor: pointer;
	}

	.boat__berth:not(.boat__berth--clickable) {
		cursor: not-allowed;
	}

	.boat__berth:focus-visible rect {
		stroke-width: 4;
	}

	.boat__sidebar {
		min-width: 220px;
		max-width: 560px;
		flex: 1 1 500px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.boat__legend-title {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--color-brass-text);
		text-transform: uppercase;
		margin: 0 0 12px;
	}

	.boat__legend-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.boat__legend-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.swatch {
		width: 20px;
		height: 12px;
		border: 1px solid;
		flex-shrink: 0;
	}

	.boat__legend-label {
		font-family: var(--font-sans);
		font-size: 12px;
		color: rgba(245, 240, 232, 0.6);
	}

	.boat__cabins-panel {
		display: grid;
		grid-template-columns: minmax(240px, 1fr) minmax(210px, 0.82fr);
		gap: 20px;
		align-items: start;
	}

	.boat__cabins-list {
		min-width: 0;
	}

	.boat__cabins {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.boat__cabin {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.04);
		border-left: 2px solid rgba(196, 146, 58, 0.3);
		gap: 12px;
	}

	.boat__cabin-text {
		min-width: 0;
	}

	.boat__cabin-label {
		font-family: var(--font-serif);
		font-size: 13px;
		color: rgba(245, 240, 232, 0.9);
		font-weight: 600;
		display: block;
	}

	.boat__cabin-pos {
		font-family: var(--font-sans);
		font-size: 10px;
		color: rgba(245, 240, 232, 0.4);
		margin-top: 1px;
		display: block;
	}

	.boat__cabin-berths {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.berth-btn {
		width: 28px;
		height: 22px;
		background: transparent;
		border: 1px solid var(--color-brass);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-family: var(--font-sans);
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.3px;
		color: var(--color-brass-text);
		transition:
			background-color 150ms ease,
			color 150ms ease,
			border-color 150ms ease;
		padding: 0;
		border-radius: 0;
	}

	.berth-btn:hover:not(.berth-btn--taken):not(.berth-btn--selected) {
		background: rgba(196, 146, 58, 0.15);
	}

	.berth-btn--selected {
		background: var(--color-brass);
		color: #fff;
	}

	.berth-btn--taken {
		background: rgba(13, 27, 46, 0.5);
		border-color: #3a4a5c;
		color: #3a4a5c;
		cursor: not-allowed;
	}

	.berth-btn--captain {
		background: rgba(8, 18, 36, 0.9);
		border-color: rgba(196, 146, 58, 0.4);
		color: var(--color-brass-text-soft);
		cursor: not-allowed;
		font-size: 11px;
	}

	.berth-btn--complimentary {
		background: rgba(196, 146, 58, 0.05);
		border-color: rgba(196, 146, 58, 0.3);
		color: var(--color-brass-text-soft);
		cursor: not-allowed;
	}

	.boat__selected {
		padding: 14px 16px;
		background: rgba(196, 146, 58, 0.12);
		border: 1px solid rgba(196, 146, 58, 0.4);
		min-height: 100%;
		box-sizing: border-box;
	}

	.boat__selected-eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		color: var(--color-brass-text);
		text-transform: uppercase;
		margin: 0 0 4px;
	}

	.boat__selected-title {
		font-family: var(--font-serif);
		font-size: 18px;
		color: var(--color-warm-white);
		margin: 0 0 2px;
	}

	.boat__selected-meta {
		font-family: var(--font-sans);
		font-size: 11px;
		color: rgba(245, 240, 232, 0.5);
		margin: 0;
	}

	.boat__selected-entry + .boat__selected-entry {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid rgba(196, 146, 58, 0.18);
	}

	@media (max-width: 920px) {
		.boat__sidebar {
			max-width: 100%;
		}

		.boat__cabins-panel {
			grid-template-columns: 1fr;
		}
	}
</style>
