<script lang="ts">
	const items: ReadonlyArray<readonly [string, string]> = [
		[
			'Czy muszę mieć patent żeglarski?',
			'Nie. Nie wymagamy patentu. Doświadczenie mile widziane, ale przyjmujemy osoby bez doświadczenia — pod warunkiem chęci do nauki i pracy w załodze.'
		],
		[
			'Ile osób jest na jachcie?',
			'Maksymalnie 10 uczestników + skipper. Każdy ma własną koje w jednej z 5 kajut. Wszystkie kajuty są dwuosobowe.'
		],
		[
			'Jak wygląda życie na pokładzie?',
			'Wachty nawigacyjne, wspólne gotowanie, zwiedzanie portów. Atmosfera jest luźna, ale wszyscy aktywnie uczestniczą w rejsie.'
		],
		[
			'Co wziąć na rejs?',
			'Prześlemy pełną listę po rezerwacji. Podstawy: odzież sportowa, kurtka przeciwdeszczowa, obuwie z białą podeszwą, dokumenty tożsamości.'
		],
		[
			'Jaka jest polityka anulacji?',
			'Do 60 dni przed rejsem — pełny zwrot. 30–60 dni — 50% zwrotu. Poniżej 30 dni — brak zwrotu (można wskazać zastępstwo).'
		],
		[
			'Jak skontaktować się z organizatorem?',
			'Michał: +48 601 671 182 · sailingarchitects@gmail.com. Odpowiadamy w ciągu 24h.'
		]
	]

	let open = $state<number | null>(null)

	function toggle(i: number) {
		open = open === i ? null : i
	}
</script>

<section class="faq">
	<div class="faq__inner">
		<p class="eyebrow">FAQ</p>
		<h2 class="title">Pytania i odpowiedzi</h2>

		{#each items as [q, a], i (q)}
			<div class="faq__item">
				<button
					type="button"
					class="faq__btn"
					class:faq__btn--open={open === i}
					aria-expanded={open === i}
					aria-controls={`faq-${i}`}
					onclick={() => toggle(i)}
				>
					<span class="faq__q">{q}</span>
					<span
						class="faq__icon"
						class:faq__icon--open={open === i}
						aria-hidden="true">+</span
					>
				</button>
				{#if open === i}
					<div id={`faq-${i}`} class="faq__answer">
						<p>{a}</p>
					</div>
				{/if}
			</div>
		{/each}
		<div class="faq__divider"></div>
	</div>
</section>

<style>
	.faq {
		background: var(--color-navy);
		padding: 96px 40px;
	}

	.faq__inner {
		max-width: 720px;
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
		font-size: clamp(28px, 4vw, 40px);
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 48px;
	}

	.faq__item {
		border-top: 1px solid rgba(196, 146, 58, 0.1);
	}

	.faq__btn {
		width: 100%;
		padding: 20px 0;
		background: none;
		border: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		cursor: pointer;
		text-align: left;
	}

	.faq__q {
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 400;
		color: var(--color-warm-white);
		transition: color 200ms ease;
	}

	.faq__btn--open .faq__q {
		color: var(--color-brass);
	}

	.faq__icon {
		color: var(--color-brass);
		font-size: 18px;
		flex-shrink: 0;
		transition: transform 200ms ease;
		display: inline-block;
	}

	.faq__icon--open {
		transform: rotate(45deg);
	}

	.faq__answer {
		padding-bottom: 20px;
	}

	.faq__answer p {
		font-family: var(--font-sans);
		font-size: 14px;
		line-height: 1.75;
		color: rgba(245, 240, 232, 0.55);
		margin: 0;
	}

	.faq__divider {
		border-top: 1px solid rgba(196, 146, 58, 0.1);
	}
</style>
