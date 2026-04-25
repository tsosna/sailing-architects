<script lang="ts">
	const specs = [
		['Model', 'Jeanneau Sun Odyssey 519'],
		['Rok produkcji', '2019'],
		['Długość', '15,6 m'],
		['Szerokość', '4,6 m'],
		['Kajuty', '5 × 2 koje = 10 miejsc'],
		['Silnik', 'Volvo Penta 55 KM'],
		['Żagiel główny', 'Lazy bag + furling'],
		['Elektronika', 'Ploter, AIS, VHF, automat']
	] as const
</script>

<section id="vessel" class="vessel">
	<div class="vessel__inner">
		<p class="eyebrow">Jacht</p>
		<h2 class="title">Jeanneau Sun Odyssey 519</h2>

		<div class="vessel__grid">
			<div class="gallery">
				<div class="gallery__hero diagonal" aria-hidden="true"></div>
				<div class="gallery__thumbs">
					{#each Array(4) as _, i (i)}
						<div class="gallery__thumb diagonal" aria-hidden="true"></div>
					{/each}
				</div>
			</div>

			<div class="copy">
				<p class="lead">
					Nowoczesny, wygodny jacht oceaniczny zaprojektowany z myślą o długich rejsach. Pięć
					niezależnych kajut dwuosobowych zapewnia prywatność i komfort na każdym etapie podróży.
				</p>
				<div class="specs">
					{#each specs as [label, value] (label)}
						<div class="specs__cell">
							<p class="specs__label">{label}</p>
							<p class="specs__value">{value}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.vessel {
		background: var(--color-navy);
		padding: 96px 40px;
	}

	.vessel__inner {
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

	.vessel__grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		align-items: start;
	}

	.diagonal {
		background-color: rgba(196, 146, 58, 0.02);
		background-image: repeating-linear-gradient(
			-55deg,
			transparent 0,
			transparent 19px,
			rgba(196, 146, 58, 0.08) 19px,
			rgba(196, 146, 58, 0.08) 20px
		);
		border: 1px solid rgba(196, 146, 58, 0.1);
	}

	.gallery__hero {
		width: 100%;
		aspect-ratio: 4 / 3;
		margin-bottom: 16px;
	}

	.gallery__thumbs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.gallery__thumb {
		aspect-ratio: 4 / 3;
		border-color: rgba(196, 146, 58, 0.08);
	}

	.copy {
		min-width: 0;
	}

	.lead {
		font-family: var(--font-sans);
		font-size: 15px;
		line-height: 1.8;
		color: rgba(245, 240, 232, 0.6);
		margin: 0 0 36px;
	}

	.specs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1px;
		background: rgba(196, 146, 58, 0.1);
	}

	.specs__cell {
		padding: 14px 16px;
		background: var(--color-navy);
	}

	.specs__label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.45);
		margin: 0 0 3px;
	}

	.specs__value {
		font-family: var(--font-sans);
		font-size: 13px;
		color: var(--color-warm-white);
		margin: 0;
	}

	@media (max-width: 820px) {
		.vessel__grid {
			grid-template-columns: 1fr;
			gap: 32px;
		}
	}
</style>
