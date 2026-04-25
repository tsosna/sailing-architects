<script lang="ts">
	import { resolve } from '$app/paths'
	import { voyageSegments } from '$lib/data/voyage-segments'

	const includes = [
		'Koja na jachcie',
		'Skipper + doświadczona załoga',
		'Wachty nawigacyjne',
		'Wspólne gotowanie na pokładzie',
		'Sprzęt bezpieczeństwa'
	]

	const excludes = [
		'Dojazd do mariny',
		'Opłaty portowe i paliwo (~150–200 EUR/os)',
		'Ubezpieczenie turystyczne (~250 zł/os)',
		'Napoje i wycieczki lądowe'
	]
</script>

<section id="pricing" class="pricing">
	<div class="pricing__inner">
		<p class="eyebrow">Cennik</p>
		<h2 class="title">Wybierz swój etap</h2>

		<div class="cards">
			{#each voyageSegments as seg, i (seg.id)}
				<article class="card">
					{#if i === 3}
						<span class="card__badge">Ostatnie miejsca</span>
					{/if}
					<p class="card__eyebrow">Etap {String(i + 1).padStart(2, '0')}</p>
					<h3 class="card__title">{seg.name}</h3>
					<p class="card__dates">{seg.dates} · {seg.days} dni</p>
					<p class="card__price">
						{seg.price.toLocaleString('pl-PL')}<span class="card__price-unit">&nbsp;zł</span>
					</p>
					<p class="card__per">za osobę · 1 koja</p>
					<a class="card__cta" href={resolve('/book')}>Zarezerwuj</a>
				</article>
			{/each}
		</div>

		<div class="lists">
			<div>
				<p class="lists__title">Cena zawiera</p>
				<ul class="lists__items">
					{#each includes as item (item)}
						<li class="lists__item">
							<span class="bullet bullet--filled" aria-hidden="true"></span>
							<span class="lists__label">{item}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div>
				<p class="lists__title lists__title--dim">Cena nie zawiera</p>
				<ul class="lists__items">
					{#each excludes as item (item)}
						<li class="lists__item">
							<span class="bullet bullet--outline" aria-hidden="true"></span>
							<span class="lists__label lists__label--dim">{item}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>

<style>
	.pricing {
		background: var(--color-navy-mid);
		padding: 96px 40px;
	}

	.pricing__inner {
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
		margin: 0 0 48px;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 1px;
		background: rgba(196, 146, 58, 0.1);
	}

	.card {
		padding: 32px 28px;
		background: var(--color-navy-mid);
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.card__badge {
		position: absolute;
		top: 16px;
		right: 16px;
		padding: 4px 10px;
		background: var(--color-brass);
		color: var(--color-navy);
		font-family: var(--font-sans);
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 1.5px;
		text-transform: uppercase;
	}

	.card__eyebrow {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.5);
		margin: 0 0 8px;
	}

	.card__title {
		font-family: var(--font-serif);
		font-size: 20px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 4px;
	}

	.card__dates {
		font-family: var(--font-sans);
		font-size: 12px;
		color: rgba(245, 240, 232, 0.35);
		margin: 0 0 24px;
	}

	.card__price {
		font-family: var(--font-serif);
		font-size: 36px;
		color: var(--color-brass);
		margin: 0 0 6px;
	}

	.card__price-unit {
		font-size: 16px;
	}

	.card__per {
		font-family: var(--font-sans);
		font-size: 10px;
		color: rgba(245, 240, 232, 0.3);
		margin: 0 0 24px;
	}

	.card__cta {
		display: block;
		padding: 12px;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.3);
		color: rgba(245, 240, 232, 0.7);
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 2px;
		text-transform: uppercase;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		border-radius: 0;
		margin-top: auto;
		transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
	}

	.card__cta:hover {
		color: var(--color-warm-white);
		border-color: var(--color-brass);
		background: rgba(196, 146, 58, 0.06);
	}

	.lists {
		margin-top: 48px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
	}

	.lists__title {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.6);
		margin: 0 0 16px;
	}

	.lists__title--dim {
		color: rgba(196, 146, 58, 0.4);
	}

	.lists__items {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.lists__item {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-bottom: 10px;
	}

	.bullet {
		width: 6px;
		height: 6px;
		flex-shrink: 0;
	}

	.bullet--filled {
		background: var(--color-brass);
	}

	.bullet--outline {
		border: 1px solid rgba(196, 146, 58, 0.3);
	}

	.lists__label {
		font-family: var(--font-sans);
		font-size: 13px;
		color: rgba(245, 240, 232, 0.6);
	}

	.lists__label--dim {
		color: rgba(245, 240, 232, 0.35);
	}

	@media (max-width: 720px) {
		.lists {
			grid-template-columns: 1fr;
		}
	}
</style>
