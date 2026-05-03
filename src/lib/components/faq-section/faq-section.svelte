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
		<header class="faq__header">
			<div class="faq__header-text">
				<p class="eyebrow">Przed wejściem na pokład</p>
				<h2 class="title">Zanim wejdziesz na pokład</h2>
			</div>
			<a class="faq__header-cta" href={resolve('/poradnik')}
				>Poradnik załogi →</a
			>
		</header>

		<div class="faq__list">
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
		</div>

		<aside class="faq__cta-box">
			<h3 class="faq__cta-title">Masz więcej pytań?</h3>
			<p class="faq__cta-lead">
				Pełny poradnik: 27 pytań, checklisty dokumentów, pakowanie, życie na
				pokładzie.
			</p>
			<a class="faq__cta-link" href={resolve('/poradnik')}
				>Czytaj poradnik załogi →</a
			>
		</aside>
	</div>
</section>

<style>
	.faq {
		background: var(--color-navy);
		padding: 96px 40px;
	}

	.faq__inner {
		max-width: 1100px;
		margin: 0 auto;
	}

	.faq__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 32px;
		margin: 0 0 48px;
		padding-bottom: 32px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.1);
	}

	.faq__header-text {
		min-width: 0;
	}

	.eyebrow {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 4px;
		text-transform: uppercase;
		color: var(--color-brass-text);
		margin: 0 0 16px;
	}

	.title {
		font-family: var(--font-serif);
		font-size: clamp(32px, 5vw, 56px);
		font-weight: 400;
		color: var(--color-warm-white);
		line-height: 1.1;
		margin: 0;
	}

	.faq__header-cta {
		flex-shrink: 0;
		padding: 14px 24px;
		border: 1px solid rgba(196, 146, 58, 0.35);
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-warm-white);
		text-decoration: none;
		transition:
			color 200ms ease,
			background-color 200ms ease,
			border-color 200ms ease;
	}

	.faq__header-cta:hover {
		color: var(--color-navy);
		background: var(--color-brass);
		border-color: var(--color-brass);
	}

	.faq__list {
		max-width: 820px;
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

	.faq__cta-box {
		margin-top: 40px;
		padding: 32px;
		border: 1px solid rgba(196, 146, 58, 0.18);
		background: rgba(196, 146, 58, 0.03);
	}

	.faq__cta-title {
		font-family: var(--font-serif);
		font-size: 22px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 8px;
	}

	.faq__cta-lead {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.7;
		color: rgba(245, 240, 232, 0.5);
		margin: 0 0 24px;
	}

	.faq__cta-link {
		display: inline-block;
		padding: 14px 24px;
		border: 1px solid rgba(196, 146, 58, 0.5);
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text);
		text-decoration: none;
		transition:
			color 200ms ease,
			background-color 200ms ease,
			border-color 200ms ease;
	}

	.faq__cta-link:hover {
		color: var(--color-navy);
		background: var(--color-brass);
		border-color: var(--color-brass);
	}

	@media (max-width: 720px) {
		.faq {
			padding: 64px 24px;
		}

		.faq__header {
			flex-direction: column;
			align-items: flex-start;
			gap: 20px;
			margin-bottom: 32px;
			padding-bottom: 24px;
		}

		.faq__header-cta {
			align-self: flex-start;
		}

		.faq__cta-box {
			padding: 24px;
		}
	}
</style>
