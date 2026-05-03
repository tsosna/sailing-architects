<script lang="ts">
	import { resolve } from '$app/paths'
	import { CabinsSection } from '$components/cabins-section'
	import { FaqSection } from '$components/faq-section'
	import { PricingSection } from '$components/pricing-section'
	import { RouteSection } from '$components/route-section'
	import { SiteFooter } from '$components/site-footer'
	import { VesselSection } from '$components/vessel-section'

	const stats = [
		['4', 'etapy'],
		['10', 'miejsc'],
		['~3500km', 'trasa'],
		['41 dni', 'łącznie']
	] as const
</script>

<section class="hero">
	<div class="hero__bg" aria-hidden="true">
		<img class="hero__image" src="/images/sailing/d.jpg" alt="" />
		<svg class="hero__pattern" width="100%" height="100%">
			<defs>
				<pattern
					id="diagonal"
					patternUnits="userSpaceOnUse"
					width="20"
					height="20"
					patternTransform="rotate(35)"
				>
					<line
						x1="0"
						y1="0"
						x2="0"
						y2="20"
						stroke="#c4923a"
						stroke-width="1"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#diagonal)" />
		</svg>
		<div class="hero__glow"></div>
	</div>

	<div class="hero__inner">
		<div class="hero__row">
			<div class="hero__copy">
				<p class="eyebrow">Jesień 2026</p>
				<h1 class="title">
					Sail<br /><em>Adventure</em>
				</h1>
				<p class="subtitle">Palma de Mallorca → Cabo Verde</p>
				<p class="lead">
					Cztery etapy przez Atlantyk. Jacht Jeanneau Sun Odyssey 519.
					Październik–Listopad 2026. Wybierz swoją koję i dołącz do załogi.
				</p>
				<div class="cta">
					<a class="btn btn--primary" href={resolve('/book')}>Wybierz koję</a>
					<a class="btn btn--ghost" href={`${resolve('/')}#route`}
						>Zobacz trasę</a
					>
				</div>
			</div>

			<div class="stats">
				{#each stats as [value, label] (label)}
					<div class="stats__cell">
						<p class="stats__value">{value}</p>
						<p class="stats__label">{label}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<VesselSection />
<RouteSection />
<CabinsSection />
<PricingSection />
<FaqSection />
<SiteFooter />

<style>
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		padding: 0 0 80px;
		overflow: hidden;
		background: var(--color-navy);
	}

	.hero__bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.hero__bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				90deg,
				rgba(7, 17, 30, 0.9) 0%,
				rgba(13, 27, 46, 0.66) 38%,
				rgba(13, 27, 46, 0.22) 72%
			),
			linear-gradient(
				0deg,
				rgba(7, 17, 30, 0.9) 0%,
				rgba(7, 17, 30, 0.36) 42%,
				rgba(7, 17, 30, 0.24) 100%
			);
	}

	.hero__image {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 50% 58%;
		filter: saturate(0.9) contrast(1.03);
	}

	.hero__pattern {
		position: absolute;
		inset: 0;
		z-index: 1;
		opacity: 0.055;
		mix-blend-mode: screen;
	}

	.hero__glow {
		position: absolute;
		bottom: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		height: 200px;
		background: radial-gradient(
			ellipse,
			rgba(196, 146, 58, 0.12) 0%,
			transparent 70%
		);
		pointer-events: none;
		z-index: 1;
	}

	.hero__inner {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 40px;
	}

	.hero__row {
		display: flex;
		gap: 24px;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.hero__copy {
		flex: 1;
		min-width: 300px;
	}

	.eyebrow {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 4px;
		text-transform: uppercase;
		color: var(--color-brass-light);
		margin: 0 0 16px;
	}

	.title {
		font-family: var(--font-serif);
		font-size: clamp(40px, 6vw, 76px);
		line-height: 1.05;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 8px;
	}

	.title em {
		font-style: italic;
	}

	.subtitle {
		font-family: var(--font-serif);
		font-size: clamp(16px, 2vw, 22px);
		font-style: italic;
		color: rgba(196, 146, 58, 0.8);
		margin: 0 0 24px;
	}

	.lead {
		font-family: var(--font-sans);
		font-size: 14px;
		line-height: 1.7;
		max-width: 420px;
		color: rgba(245, 240, 232, 0.55);
		margin: 0 0 40px;
	}

	.cta {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn {
		font-family: var(--font-sans);
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 0;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		transition:
			background-color 200ms ease,
			color 200ms ease,
			border-color 200ms ease;
	}

	.btn--primary {
		padding: 16px 40px;
		background: var(--color-brass);
		color: var(--color-navy);
		border: none;
		font-weight: 700;
		font-size: 13px;
		letter-spacing: 2px;
	}

	.btn--primary:hover {
		background: var(--color-brass-light);
	}

	.btn--ghost {
		padding: 16px 32px;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.35);
		color: rgba(245, 240, 232, 0.7);
		font-size: 12px;
		letter-spacing: 2px;
	}

	.btn--ghost:hover {
		color: var(--color-warm-white);
		border-color: var(--color-brass);
	}

	.stats {
		display: flex;
		gap: 1px;
		background: rgba(196, 146, 58, 0.15);
	}

	.stats__cell {
		padding: 20px 24px;
		background: rgba(13, 27, 46, 0.85);
		text-align: center;
		min-width: 90px;
	}

	.stats__value {
		font-family: var(--font-serif);
		font-size: 28px;
		color: var(--color-warm-white);
		margin: 0 0 4px;
	}

	.stats__label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0;
	}

	@media (max-width: 720px) {
		.hero {
			min-height: auto;
			justify-content: flex-start;
			padding: 82px 0 56px;
		}

		.hero__inner {
			padding: 0 20px;
		}
	}
</style>
