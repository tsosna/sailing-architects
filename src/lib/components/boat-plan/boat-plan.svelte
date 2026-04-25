<script lang="ts">
	import { cabins, findCabinByBerth } from '$lib/data/cabins'

	type BerthState = 'available' | 'hovered' | 'selected' | 'taken'

	type Props = {
		selectedBerth: string | null
		onSelectBerth: (id: string | null) => void
		takenBerths?: ReadonlySet<string>
	}

	let {
		selectedBerth,
		onSelectBerth,
		takenBerths = new Set(['A2', 'C1', 'D2'])
	}: Props = $props()

	let hovered = $state<string | null>(null)

	function berthState(id: string): BerthState {
		if (takenBerths.has(id)) return 'taken'
		if (selectedBerth === id) return 'selected'
		if (hovered === id) return 'hovered'
		return 'available'
	}

	function berthFill(id: string): string {
		switch (berthState(id)) {
			case 'taken':
				return 'rgba(13,27,46,0.55)'
			case 'selected':
				return 'rgba(196,146,58,0.85)'
			case 'hovered':
				return 'rgba(196,146,58,0.22)'
			default:
				return 'rgba(245,240,232,0.12)'
		}
	}

	function berthStroke(id: string): string {
		return berthState(id) === 'taken' ? '#3a4a5c' : '#c4923a'
	}

	function berthLabelColor(id: string): string {
		switch (berthState(id)) {
			case 'selected':
				return '#fff'
			case 'taken':
				return '#3a4a5c'
			default:
				return '#c4923a'
		}
	}

	function handleBerth(id: string) {
		if (takenBerths.has(id)) return
		onSelectBerth(selectedBerth === id ? null : id)
	}

	function handleKey(e: KeyboardEvent, id: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleBerth(id)
		}
	}

	const berthSlots = [
		{ id: 'A1', x: 22, y: 125, w: 68, h: 38 },
		{ id: 'A2', x: 110, y: 125, w: 68, h: 38 },
		{ id: 'D1', x: 12, y: 318, w: 82, h: 32 },
		{ id: 'D2', x: 12, y: 355, w: 82, h: 32 },
		{ id: 'E1', x: 106, y: 318, w: 82, h: 32 },
		{ id: 'E2', x: 106, y: 355, w: 82, h: 32 },
		{ id: 'B1', x: 12, y: 418, w: 82, h: 30 },
		{ id: 'B2', x: 12, y: 452, w: 82, h: 28 },
		{ id: 'C1', x: 106, y: 418, w: 82, h: 30 },
		{ id: 'C2', x: 106, y: 452, w: 82, h: 28 }
	] as const

	const forwardCorners = [
		[22, 125],
		[90, 125],
		[110, 125],
		[178, 125],
		[22, 163],
		[90, 163],
		[110, 163],
		[178, 163]
	] as const

	const legend = [
		{ fill: 'rgba(245,240,232,0.12)', stroke: '#c4923a', label: 'Dostępna koja' },
		{ fill: 'rgba(196,146,58,0.85)', stroke: '#c4923a', label: 'Wybrana koja' },
		{ fill: 'rgba(13,27,46,0.55)', stroke: '#3a4a5c', label: 'Zajęta koja' }
	]

	const selectedCabin = $derived(selectedBerth ? findCabinByBerth(selectedBerth) : undefined)
</script>

<div class="boat">
	<div class="boat__svg-wrap">
		<svg
			viewBox="0 0 200 520"
			width="200"
			height="520"
			class="boat__svg"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern id="boat-grid" patternUnits="userSpaceOnUse" width="10" height="10">
					<path
						d="M 10 0 L 0 0 0 10"
						fill="none"
						stroke="rgba(196,146,58,0.07)"
						stroke-width="0.5"
					/>
				</pattern>
			</defs>
			<rect width="200" height="520" fill="url(#boat-grid)" />

			<path
				d="M 100 8 C 140 18, 186 80, 192 170 L 192 370 C 192 430, 168 470, 140 488 L 60 488 C 32 470, 8 430, 8 370 L 8 170 C 14 80, 60 18, 100 8 Z"
				fill="none"
				stroke="#c4923a"
				stroke-width="1.5"
			/>

			<line
				x1="100"
				y1="8"
				x2="100"
				y2="488"
				stroke="rgba(196,146,58,0.2)"
				stroke-width="0.5"
				stroke-dasharray="4 3"
			/>

			<line x1="20" y1="175" x2="180" y2="175" stroke="#c4923a" stroke-width="0.8" />
			<text
				x="100"
				y="22"
				text-anchor="middle"
				font-size="6"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.7)"
				letter-spacing="2">DZIÓB</text>
			<text
				x="100"
				y="108"
				text-anchor="middle"
				font-size="7.5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.5)"
				font-weight="700"
				letter-spacing="1">A</text>

			{#each forwardCorners as [cx, cy] (`${cx}-${cy}`)}
				<circle {cx} {cy} r="1.5" fill="#c4923a" opacity="0.6" />
			{/each}

			<line x1="8" y1="295" x2="192" y2="295" stroke="#c4923a" stroke-width="0.8" />
			<text
				x="100"
				y="237"
				text-anchor="middle"
				font-size="6"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.4)"
				letter-spacing="2">SALON</text>
			<rect
				x="72"
				y="208"
				width="56"
				height="30"
				fill="none"
				stroke="rgba(196,146,58,0.25)"
				stroke-width="0.7"
			/>
			<rect
				x="20"
				y="200"
				width="45"
				height="44"
				fill="none"
				stroke="rgba(196,146,58,0.18)"
				stroke-width="0.7"
			/>
			<rect
				x="135"
				y="200"
				width="45"
				height="44"
				fill="none"
				stroke="rgba(196,146,58,0.18)"
				stroke-width="0.7"
			/>
			<text
				x="160"
				y="190"
				text-anchor="middle"
				font-size="4.5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.35)"
				letter-spacing="1">NAV</text>
			<rect
				x="136"
				y="177"
				width="44"
				height="20"
				fill="none"
				stroke="rgba(196,146,58,0.18)"
				stroke-width="0.5"
			/>

			<line x1="100" y1="295" x2="100" y2="395" stroke="#c4923a" stroke-width="0.8" />
			<line x1="15" y1="395" x2="185" y2="395" stroke="#c4923a" stroke-width="0.8" />

			<text
				x="54"
				y="308"
				text-anchor="middle"
				font-size="7.5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.5)"
				font-weight="700"
				letter-spacing="1">D</text>
			<text
				x="146"
				y="308"
				text-anchor="middle"
				font-size="7.5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.5)"
				font-weight="700"
				letter-spacing="1">E</text>

			<line x1="100" y1="395" x2="100" y2="487" stroke="#c4923a" stroke-width="0.8" />

			<text
				x="54"
				y="408"
				text-anchor="middle"
				font-size="7.5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.5)"
				font-weight="700"
				letter-spacing="1">B</text>
			<text
				x="146"
				y="408"
				text-anchor="middle"
				font-size="7.5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.5)"
				font-weight="700"
				letter-spacing="1">C</text>

			{#each berthSlots as berth (berth.id)}
				{@const state = berthState(berth.id)}
				<g
					class="boat__berth"
					class:boat__berth--clickable={state !== 'taken'}
					role="button"
					tabindex={state === 'taken' ? -1 : 0}
					aria-label={`Koja ${berth.id} — ${state === 'taken' ? 'zajęta' : state === 'selected' ? 'wybrana' : 'dostępna'}`}
					aria-pressed={state === 'selected'}
					aria-disabled={state === 'taken'}
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
						stroke-width={state === 'selected' ? 1.5 : 0.8}
						rx="0"
					/>
					{#if state === 'taken'}
						<line
							x1={berth.x + 4}
							y1={berth.y + 4}
							x2={berth.x + berth.w - 4}
							y2={berth.y + berth.h - 4}
							stroke="#3a4a5c"
							stroke-width="0.8"
						/>
					{/if}
					{#if state === 'selected'}
						<line
							x1={berth.x + berth.w / 2 - 4}
							y1={berth.y + berth.h / 2}
							x2={berth.x + berth.w / 2 + 4}
							y2={berth.y + berth.h / 2}
							stroke="#fff"
							stroke-width="1.2"
						/>
						<line
							x1={berth.x + berth.w / 2}
							y1={berth.y + berth.h / 2 - 4}
							x2={berth.x + berth.w / 2}
							y2={berth.y + berth.h / 2 + 4}
							stroke="#fff"
							stroke-width="1.2"
						/>
					{/if}
					<text
						x={berth.x + berth.w / 2}
						y={berth.y + berth.h / 2}
						text-anchor="middle"
						dominant-baseline="central"
						font-size="7"
						font-family="DM Sans, sans-serif"
						fill={berthLabelColor(berth.id)}
						font-weight="600"
						letter-spacing="0.5">{berth.id}</text>
				</g>
			{/each}

			<rect
				x="72"
				y="290"
				width="56"
				height="8"
				fill="rgba(13,27,46,0.4)"
				stroke="rgba(196,146,58,0.3)"
				stroke-width="0.6"
			/>
			<text
				x="100"
				y="296.5"
				text-anchor="middle"
				font-size="4"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.5)"
				letter-spacing="1">ZEJŚCIE</text>

			<g transform="translate(166, 258)">
				<circle cx="0" cy="0" r="10" fill="none" stroke="rgba(196,146,58,0.2)" stroke-width="0.5" />
				<text
					x="0"
					y="-13"
					text-anchor="middle"
					font-size="5"
					font-family="DM Sans"
					fill="rgba(196,146,58,0.4)"
					font-weight="700">N</text>
				<line x1="0" y1="-9" x2="0" y2="9" stroke="rgba(196,146,58,0.3)" stroke-width="0.6" />
				<line x1="-9" y1="0" x2="9" y2="0" stroke="rgba(196,146,58,0.3)" stroke-width="0.6" />
			</g>

			<line x1="20" y1="505" x2="80" y2="505" stroke="rgba(196,146,58,0.4)" stroke-width="0.8" />
			<line x1="20" y1="502" x2="20" y2="508" stroke="rgba(196,146,58,0.4)" stroke-width="0.8" />
			<line x1="80" y1="502" x2="80" y2="508" stroke="rgba(196,146,58,0.4)" stroke-width="0.8" />
			<text
				x="50"
				y="514"
				text-anchor="middle"
				font-size="4.5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.4)">≈ 8m</text>

			<text
				x="130"
				y="504"
				text-anchor="middle"
				font-size="5"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.35)"
				letter-spacing="1">JEANNEAU SO 519</text>
			<text
				x="130"
				y="512"
				text-anchor="middle"
				font-size="4"
				font-family="DM Sans"
				fill="rgba(196,146,58,0.25)"
				letter-spacing="0.5">rzut poziomy / plan kojowy</text>
		</svg>
	</div>

	<aside class="boat__sidebar">
		<section class="boat__legend">
			<p class="boat__legend-title">Legenda</p>
			<div class="boat__legend-list">
				{#each legend as item (item.label)}
					<div class="boat__legend-item">
						<span class="swatch" style:background={item.fill} style:border-color={item.stroke}
						></span>
						<span class="boat__legend-label">{item.label}</span>
					</div>
				{/each}
			</div>
		</section>

		<section>
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
									aria-pressed={state === 'selected'}
									aria-disabled={state === 'taken'}
									aria-label={`Koja ${b}`}
									onclick={() => handleBerth(b)}
									onmouseenter={() => (hovered = b)}
									onmouseleave={() => (hovered = null)}
								>
									{b}
								</button>
							{/each}
						</div>
					</li>
				{/each}
			</ul>
		</section>

		{#if selectedBerth && selectedCabin}
			<aside class="boat__selected">
				<p class="boat__selected-eyebrow">Wybrana</p>
				<p class="boat__selected-title">Koja {selectedBerth}</p>
				<p class="boat__selected-meta">{selectedCabin.label} · {selectedCabin.position}</p>
			</aside>
		{/if}
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
		stroke-width: 2;
	}

	.boat__sidebar {
		min-width: 220px;
		max-width: 280px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.boat__legend-title {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		color: rgba(196, 146, 58, 0.7);
		text-transform: uppercase;
		margin: 0 0 12px;
	}

	.boat__legend-list {
		display: flex;
		flex-direction: column;
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
		color: var(--color-brass);
		transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
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

	.boat__selected {
		padding: 14px 16px;
		background: rgba(196, 146, 58, 0.12);
		border: 1px solid rgba(196, 146, 58, 0.4);
	}

	.boat__selected-eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		color: var(--color-brass);
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
</style>
