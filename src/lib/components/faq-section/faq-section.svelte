<script lang="ts">
	import { resolve } from '$app/paths'
	import { featuredCrewGuideQuestions } from '$lib/data/crew-guide'

	let open = $state<string | null>(null)

	function toggle(id: string) {
		open = open === id ? null : id
	}
</script>

<section class="faq">
	<div class="faq__inner">
		<p class="eyebrow">FAQ</p>
		<h2 class="title">Najczęstsze pytania</h2>
		<p class="lead">
			Krótki wybór. Pełny poradnik załogi — checklisty, kategorie i wszystkie
			odpowiedzi — czeka na osobnej stronie.
		</p>

		{#each featuredCrewGuideQuestions as item (item.id)}
			<div class="faq__item">
				<button
					type="button"
					class="faq__btn"
					class:faq__btn--open={open === item.id}
					aria-expanded={open === item.id}
					aria-controls={`faq-${item.id}`}
					onclick={() => toggle(item.id)}
				>
					<span class="faq__q">{item.q}</span>
					<span
						class="faq__icon"
						class:faq__icon--open={open === item.id}
						aria-hidden="true">+</span
					>
				</button>
				{#if open === item.id}
					<div id={`faq-${item.id}`} class="faq__answer">
						<p>{item.a}</p>
					</div>
				{/if}
			</div>
		{/each}
		<div class="faq__divider"></div>

		<a class="faq__cta" href={resolve('/poradnik')}>
			Otwórz pełny poradnik załogi →
		</a>
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
		color: var(--color-brass-text);
		margin: 0 0 12px;
	}

	.title {
		font-family: var(--font-serif);
		font-size: clamp(28px, 4vw, 40px);
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 16px;
	}

	.lead {
		font-family: var(--font-sans);
		font-size: 14px;
		line-height: 1.7;
		color: rgba(245, 240, 232, 0.5);
		margin: 0 0 40px;
		max-width: 540px;
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
		color: var(--color-brass-text);
	}

	.faq__icon {
		color: var(--color-brass-text);
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

	.faq__cta {
		display: inline-block;
		margin-top: 32px;
		padding: 14px 28px;
		border: 1px solid rgba(196, 146, 58, 0.35);
		font-family: var(--font-sans);
		font-size: 12px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-warm-white);
		text-decoration: none;
		transition:
			color 200ms ease,
			background-color 200ms ease,
			border-color 200ms ease;
	}

	.faq__cta:hover {
		color: var(--color-navy);
		background: var(--color-brass);
		border-color: var(--color-brass);
	}
</style>
