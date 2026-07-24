<script lang="ts">
	const specs = [
		['Model', 'Jeanneau Sun Odyssey 519'],
		['Rok produkcji', '2019'],
		['Długość', '15,6 m'],
		['Szerokość', '4,6 m'],
		['Kajuty', '5 × 2 koje = 10 miejsc'],
		['Silnik', 'Volvo Penta 55 KM'],
		['Ożaglowanie', 'Grot + Genua'],
		[
			'Elektronika',
			'Ploter map, AIS, VHF, DSC, autopilot, EPIRB, internet sat.'
		]
	] as const

	const galleryImages = [
		{
			src: '/images/sailing/wiatr.jpg',
			alt: 'Jacht płynący w mocnym wietrze'
		},
		{
			src: '/images/sailing/salon.jpg',
			alt: 'Załoga w salonie jachtu'
		},
		{
			src: '/images/sailing/niebo.jpg',
			alt: 'Nocne niebo nad jachtem'
		},
		{
			src: '/images/sailing/jola.jpg',
			alt: 'Uczestniczka rejsu na pokładzie'
		},
		{
			src: '/images/sailing/majorka.jpg',
			alt: 'Katedra w Palmie na Majorce'
		}
	] as const

	let openIndex = $state<number | null>(null)
	let dialogEl = $state<HTMLDialogElement | null>(null)

	function openLightbox(index: number) {
		openIndex = index
		dialogEl?.showModal()
	}

	function showNext() {
		if (openIndex === null) return
		openIndex = (openIndex + 1) % galleryImages.length
	}
	function showPrev() {
		if (openIndex === null) return
		openIndex = (openIndex - 1 + galleryImages.length) % galleryImages.length
	}
</script>

<section id="vessel" class="vessel">
	<div class="vessel__inner">
		<p class="eyebrow">Jacht</p>
		<h2 class="title">Jeanneau Sun Odyssey 519</h2>

		<div class="vessel__grid">
			<div class="gallery">
				<figure class="gallery__hero">
					<button
						type="button"
						onclick={() => {
							openLightbox(0)
						}}
					>
						<img src={galleryImages[0].src} alt={galleryImages[0].alt} />
					</button>
				</figure>
				<div class="gallery__thumbs">
					{#each galleryImages.slice(1) as image, i (image.src)}
						<figure class="gallery__thumb">
							<button
								type="button"
								onclick={() => {
									openLightbox(i + 1)
								}}
							>
								<img src={image.src} alt={image.alt} />
							</button>
						</figure>
					{/each}
				</div>
			</div>

			<div class="copy">
				<p class="lead">
					Nowoczesny, wygodny jacht oceaniczny zaprojektowany z myślą o długich
					rejsach. Pięć niezależnych kajut dwuosobowych zapewnia prywatność i
					komfort na każdym etapie podróży.
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
	<dialog
		bind:this={dialogEl}
		class="lightbox"
		onclose={() => {
			openIndex = null
		}}
		onkeydown={(e) => {
			if (e.key === 'ArrowRight') showNext()
			if (e.key === 'ArrowLeft') showPrev()
		}}
	>
		{#if openIndex !== null}
			<button
				type="button"
				aria-label="Zamknij"
				onclick={() => dialogEl?.close()}>×</button
			>
			<button type="button" aria-label="Poprzednie zdjęcia" onclick={showPrev}
				>‹</button
			>
			<img
				src={galleryImages[openIndex].src}
				alt={galleryImages[openIndex].alt}
			/>
			<button type="button" aria-label="Następne zdjęcie" onclick={showNext}
				>›</button
			>
		{/if}
	</dialog>
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

	.vessel__grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		align-items: start;
	}

	.gallery__hero {
		width: 100%;
		aspect-ratio: 4 / 3;
		margin-bottom: 16px;
		margin-top: 0;
		margin-left: 0;
		margin-right: 0;
		position: relative;
		background: var(--color-navy-deep);
		border: 1px solid rgba(196, 146, 58, 0.16);
		overflow: hidden;
	}

	.gallery__thumbs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.gallery__thumb {
		aspect-ratio: 4 / 3;
		margin: 0;
		position: relative;
		background: var(--color-navy-deep);
		border: 1px solid rgba(196, 146, 58, 0.1);
		overflow: hidden;
	}

	.gallery__hero img,
	.gallery__thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: saturate(0.9) contrast(1.02);
	}

	.gallery__hero img {
		object-position: 50% 48%;
	}

	.gallery__thumb:nth-child(1) img {
		object-position: 50% 48%;
	}

	.gallery__thumb:nth-child(2) img {
		object-position: 50% 42%;
	}

	.gallery__thumb:nth-child(3) img,
	.gallery__thumb:nth-child(4) img {
		object-position: 50% 35%;
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
		color: var(--color-brass-text-soft);
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
	.lightbox {
		border: none;
		padding: 0;
		background: transparent;
		max-width: none;
		max-height: none;
		width: 100vw;
		height: 100dvh;
		position: fixed;
		inset: 0;
	}

	.lightbox[open] {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox::backdrop {
		background: rgba(10, 16, 26, 0.85);
	}

	.lightbox img {
		width: auto;
		height: auto;
		max-width: min(92vw, 1000px);
		max-height: 88vh;
		object-fit: contain;
	}

	.gallery__hero button,
	.gallery__thumb button {
		all: unset;
		display: block;
		cursor: pointer;
		width: 100%;
		height: 100%;
	}

	.lightbox button {
		position: fixed;
		background: rgba(10, 16, 26, 0.5);
		color: var(--color-warm-white);
		border: 1px solid rgba(196, 146, 58, 0.3);
		cursor: pointer;
		font-size: 28px;
		line-height: 1;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox button[aria-label='Zamknij'] {
		top: 20px;
		right: 20px;
	}
	.lightbox button[aria-label='Poprzednie zdjęcia'] {
		left: 20px;
		top: 50%;
	}
	.lightbox button[aria-label='Następne zdjęcie'] {
		right: 20px;
		top: 50%;
	}
</style>
