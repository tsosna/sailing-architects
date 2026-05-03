<script lang="ts">
	import { resolve } from '$app/paths'
	import {
		crewGuideCategories,
		crewGuideChecklists,
		crewGuideQuestions,
		type CrewGuideCategoryId,
		type CrewGuideChecklistId
	} from '$lib/data/crew-guide'

	const questionsByCategory = $derived.by(() => {
		const map = new Map<CrewGuideCategoryId, typeof crewGuideQuestions>()
		for (const cat of crewGuideCategories) {
			map.set(
				cat.id,
				crewGuideQuestions.filter((q) => q.category === cat.id)
			)
		}
		return map
	})

	type SectionId = 'checklists' | CrewGuideCategoryId
	let activeSection = $state<SectionId>('checklists')

	const sections: ReadonlyArray<{ id: SectionId; label: string }> = [
		{ id: 'checklists', label: 'Checklisty' },
		...crewGuideCategories.map((cat) => ({ id: cat.id, label: cat.label }))
	]

	let openQuestion = $state<string | null>(null)
	function toggleQuestion(id: string) {
		openQuestion = openQuestion === id ? null : id
	}

	let checklistChecks = $state<Record<CrewGuideChecklistId, Set<number>>>({
		dokumenty: new Set(),
		pakowanie: new Set(),
		platnosci: new Set()
	})

	function toggleCheck(listId: CrewGuideChecklistId, index: number) {
		const next = new Set(checklistChecks[listId])
		if (next.has(index)) next.delete(index)
		else next.add(index)
		checklistChecks = { ...checklistChecks, [listId]: next }
	}
</script>

<header class="hero">
	<div class="hero__inner">
		<span class="phase-badge">Sail Adventure 2026</span>
		<h1 class="hero__title">Poradnik załogi</h1>
		<p class="hero__subtitle">
			Palma de Mallorca → Cabo Verde · Październik–Listopad 2026
		</p>
		<p class="hero__lead">
			Wszystko, co warto wiedzieć przed decyzją, po rezerwacji i tuż przed
			wyjazdem. Czytaj spokojnie — ocean jest cierpliwy.
		</p>
	</div>
</header>

<div class="layout">
	<aside class="sidebar" aria-label="Nawigacja po sekcjach poradnika">
		<p class="sidebar__label">Nawigacja</p>
		<nav class="sidebar__nav">
			{#each sections as section (section.id)}
				<a
					class="sidebar__link"
					class:sidebar__link--active={activeSection === section.id}
					href={`#${section.id}`}
					onclick={() => (activeSection = section.id)}>{section.label}</a
				>
			{/each}
		</nav>
		<div class="sidebar__contact">
			<p class="sidebar__contact-label">Pytania?</p>
			<p class="sidebar__contact-lead">Michał odpowiada w ciągu 24h.</p>
			<a class="sidebar__contact-link" href="tel:+48601671182"
				>+48 601 671 182</a
			>
			<a
				class="sidebar__contact-link sidebar__contact-link--soft"
				href="mailto:sailingarchitects@gmail.com"
				>sailingarchitects@gmail.com</a
			>
		</div>
	</aside>

	<main class="main">
		<section id="checklists" class="section">
			<header class="section__header">
				<span class="phase-badge">Przegląd przed rejsem</span>
				<h2 class="section__title">Najważniejsze przed wypłynięciem</h2>
			</header>
			<p class="section__lead">
				Trzy checklisty, trzy momenty. Odhaczaj pozycje — pomoże to ułożyć
				przygotowania w spokojnym tempie.
			</p>

			<div class="checklists">
				{#each crewGuideChecklists as cl (cl.id)}
					{@const total = cl.items.length}
					{@const done = checklistChecks[cl.id].size}
					<article class="checklist">
						<h3 class="checklist__title">{cl.title}</h3>
						<div class="checklist__head">
							<span class="phase-badge">{cl.phase}</span>
							<span
								class="checklist__count"
								class:checklist__count--done={done === total}
							>
								{done}/{total}
							</span>
						</div>
						<div class="checklist__progress" aria-hidden="true">
							<div
								class="checklist__progress-fill"
								style:width={`${(done / total) * 100}%`}
							></div>
						</div>
						<ul class="checklist__items">
							{#each cl.items as item, i (i)}
								{@const checked = checklistChecks[cl.id].has(i)}
								<li class="checklist__item">
									<button
										type="button"
										class="checklist__btn"
										aria-pressed={checked}
										onclick={() => toggleCheck(cl.id, i)}
									>
										<span
											class="checklist__box"
											class:checklist__box--checked={checked}
											aria-hidden="true"
										>
											{#if checked}✓{/if}
										</span>
										<span
											class="checklist__text"
											class:checklist__text--checked={checked}>{item}</span
										>
									</button>
								</li>
							{/each}
						</ul>
					</article>
				{/each}
			</div>
		</section>

		{#each crewGuideCategories as cat (cat.id)}
			{@const items = questionsByCategory.get(cat.id) ?? []}
			{#if items.length > 0}
				<section id={cat.id} class="section">
					<header class="section__header">
						<span class="phase-badge">{items[0].phase}</span>
						<h2 class="section__title">{cat.label}</h2>
					</header>
					<div class="qa">
						{#each items as item (item.id)}
							<div class="qa__item">
								<button
									type="button"
									class="qa__btn"
									class:qa__btn--open={openQuestion === item.id}
									aria-expanded={openQuestion === item.id}
									aria-controls={`qa-${item.id}`}
									onclick={() => toggleQuestion(item.id)}
								>
									<span class="qa__q">{item.q}</span>
									<span
										class="qa__icon"
										class:qa__icon--open={openQuestion === item.id}
										aria-hidden="true">+</span
									>
								</button>
								{#if openQuestion === item.id}
									<div id={`qa-${item.id}`} class="qa__answer">
										<p>{item.a}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/each}

		<section class="cta">
			<p class="cta__eyebrow">Gotowy/gotowa?</p>
			<h2 class="cta__title">Zostań częścią załogi.</h2>
			<p class="cta__lead">
				Wybierz etap, wybierz koję, dołącz. Zostało jeszcze kilka miejsc na rejs
				2026.
			</p>
			<div class="cta__actions">
				<a class="btn btn--primary" href={resolve('/book')}>Wybierz koję →</a>
				<a class="btn btn--ghost" href="mailto:sailingarchitects@gmail.com"
					>Napisz do Michała</a
				>
			</div>
		</section>
	</main>
</div>

<style>
	.hero {
		background: linear-gradient(180deg, #0f1f35 0%, #0d1b2e 100%);
		border-bottom: 1px solid rgba(196, 146, 58, 0.1);
		padding: 120px 40px 48px;
	}

	.hero__inner {
		max-width: 800px;
		margin: 0 auto;
	}

	.phase-badge {
		display: inline-block;
		padding: 2px 8px;
		border: 1px solid rgba(196, 146, 58, 0.3);
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.65);
		white-space: nowrap;
	}

	.hero__title {
		font-family: var(--font-serif);
		font-size: clamp(28px, 4vw, 48px);
		font-weight: 400;
		color: var(--color-warm-white);
		line-height: 1.1;
		margin: 20px 0 12px;
	}

	.hero__subtitle {
		font-family: var(--font-serif);
		font-size: 18px;
		font-style: italic;
		color: rgba(196, 146, 58, 0.75);
		margin: 0 0 20px;
	}

	.hero__lead {
		font-family: var(--font-sans);
		font-size: 15px;
		line-height: 1.75;
		color: rgba(245, 240, 232, 0.55);
		max-width: 540px;
		margin: 0 0 32px;
	}

	.layout {
		display: flex;
		max-width: 1100px;
		margin: 0 auto;
	}

	.sidebar {
		width: 220px;
		flex-shrink: 0;
		position: sticky;
		top: 64px;
		align-self: flex-start;
		max-height: calc(100vh - 64px);
		overflow-y: auto;
		border-right: 1px solid rgba(196, 146, 58, 0.1);
		padding: 32px 0;
	}

	.sidebar__label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2.5px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.4);
		padding: 0 24px;
		margin: 0 0 12px;
	}

	.sidebar__nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar__link {
		display: block;
		padding: 8px 24px;
		border-left: 2px solid transparent;
		font-family: var(--font-sans);
		font-size: 12px;
		color: rgba(245, 240, 232, 0.5);
		text-decoration: none;
		transition:
			color 200ms ease,
			border-color 200ms ease,
			background-color 200ms ease;
	}

	.sidebar__link:hover {
		color: var(--color-warm-white);
	}

	.sidebar__link--active {
		border-left-color: var(--color-brass);
		background: rgba(196, 146, 58, 0.06);
		color: var(--color-brass-text);
	}

	.sidebar__contact {
		margin: 32px 24px 0;
		padding: 16px;
		border: 1px solid rgba(196, 146, 58, 0.15);
		background: rgba(196, 146, 58, 0.04);
	}

	.sidebar__contact-label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.5);
		margin: 0 0 8px;
	}

	.sidebar__contact-lead {
		font-family: var(--font-sans);
		font-size: 12px;
		color: rgba(245, 240, 232, 0.7);
		line-height: 1.5;
		margin: 0 0 6px;
	}

	.sidebar__contact-link {
		display: block;
		font-family: var(--font-sans);
		font-size: 11px;
		color: var(--color-brass-text);
		text-decoration: none;
		margin-bottom: 2px;
	}

	.sidebar__contact-link--soft {
		font-size: 10px;
		color: rgba(196, 146, 58, 0.6);
		line-height: 1.4;
		word-break: break-all;
	}

	.main {
		flex: 1;
		min-width: 0;
		padding: 48px 48px 80px;
		max-width: 100%;
	}

	.section {
		margin-bottom: 64px;
	}

	.section__header {
		margin-bottom: 32px;
		padding-bottom: 20px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.1);
	}

	.section__title {
		font-family: var(--font-serif);
		font-size: clamp(22px, 3vw, 30px);
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 10px 0 0;
	}

	.section__lead {
		font-family: var(--font-sans);
		font-size: 14px;
		color: rgba(245, 240, 232, 0.45);
		line-height: 1.75;
		max-width: 540px;
		margin: 0 0 32px;
	}

	.checklists {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1px;
		background: rgba(196, 146, 58, 0.1);
	}

	.checklist {
		background: var(--color-navy);
		padding: 28px 24px;
	}

	.checklist__title {
		font-family: var(--font-serif);
		font-size: 18px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 16px;
	}

	.checklist__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		gap: 12px;
	}

	.checklist__count {
		font-family: var(--font-sans);
		font-size: 11px;
		color: rgba(245, 240, 232, 0.3);
	}

	.checklist__count--done {
		color: var(--color-brass-text);
	}

	.checklist__progress {
		height: 2px;
		background: rgba(196, 146, 58, 0.12);
		margin-bottom: 16px;
	}

	.checklist__progress-fill {
		height: 100%;
		background: var(--color-brass);
		transition: width 300ms ease;
	}

	.checklist__items {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.checklist__item {
		border-bottom: 1px solid rgba(196, 146, 58, 0.07);
	}

	.checklist__item:last-child {
		border-bottom: none;
	}

	.checklist__btn {
		width: 100%;
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 9px 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.checklist__box {
		width: 16px;
		height: 16px;
		border: 1px solid rgba(196, 146, 58, 0.4);
		flex-shrink: 0;
		margin-top: 1px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 9px;
		font-weight: 700;
		color: var(--color-navy);
		transition:
			background-color 150ms ease,
			border-color 150ms ease;
	}

	.checklist__box--checked {
		background: var(--color-brass);
		border-color: var(--color-brass);
	}

	.checklist__text {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.5;
		color: rgba(245, 240, 232, 0.75);
		transition: color 150ms ease;
	}

	.checklist__text--checked {
		color: rgba(245, 240, 232, 0.35);
		text-decoration: line-through;
	}

	.qa__item {
		border-top: 1px solid rgba(196, 146, 58, 0.1);
	}

	.qa__item:last-child {
		border-bottom: 1px solid rgba(196, 146, 58, 0.1);
	}

	.qa__btn {
		width: 100%;
		padding: 18px 0;
		background: none;
		border: none;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		cursor: pointer;
		text-align: left;
	}

	.qa__q {
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 400;
		color: var(--color-warm-white);
		line-height: 1.45;
		transition: color 200ms ease;
	}

	.qa__btn--open .qa__q {
		color: var(--color-brass-text);
	}

	.qa__icon {
		color: var(--color-brass-text);
		font-size: 18px;
		flex-shrink: 0;
		line-height: 1;
		margin-top: 2px;
		transition: transform 200ms ease;
		display: inline-block;
	}

	.qa__icon--open {
		transform: rotate(45deg);
	}

	.qa__answer {
		padding-bottom: 20px;
	}

	.qa__answer p {
		font-family: var(--font-sans);
		font-size: 14px;
		line-height: 1.8;
		color: rgba(245, 240, 232, 0.58);
		margin: 0;
	}

	.cta {
		margin-top: 64px;
		padding: 40px;
		background: rgba(196, 146, 58, 0.05);
		border: 1px solid rgba(196, 146, 58, 0.2);
	}

	.cta__eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2.5px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.55);
		margin: 0 0 10px;
	}

	.cta__title {
		font-family: var(--font-serif);
		font-size: 26px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 8px;
	}

	.cta__lead {
		font-family: var(--font-sans);
		font-size: 14px;
		color: rgba(245, 240, 232, 0.45);
		line-height: 1.7;
		max-width: 420px;
		margin: 0 0 28px;
	}

	.cta__actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn {
		font-family: var(--font-sans);
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		transition:
			background-color 200ms ease,
			color 200ms ease,
			border-color 200ms ease;
	}

	.btn--primary {
		padding: 14px 36px;
		background: var(--color-brass);
		border: none;
		color: var(--color-navy);
		font-weight: 700;
		font-size: 12px;
		letter-spacing: 2px;
	}

	.btn--primary:hover {
		background: var(--color-brass-light);
	}

	.btn--ghost {
		padding: 14px 24px;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.3);
		color: rgba(245, 240, 232, 0.6);
		font-size: 12px;
		letter-spacing: 2px;
	}

	.btn--ghost:hover {
		color: var(--color-warm-white);
		border-color: var(--color-brass);
	}

	@media (max-width: 800px) {
		.hero {
			padding: 96px 24px 32px;
		}

		.hero__title {
			margin: 16px 0 10px;
		}

		.hero__lead {
			margin-bottom: 24px;
		}

		.layout {
			flex-direction: column;
		}

		.sidebar {
			position: sticky;
			top: 64px;
			z-index: 10;
			width: 100%;
			max-height: none;
			border-right: none;
			border-bottom: 1px solid rgba(196, 146, 58, 0.15);
			padding: 12px 0;
			background: rgba(13, 27, 46, 0.97);
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
			overflow: visible;
		}

		.sidebar__label {
			display: none;
		}

		.sidebar__nav {
			flex-direction: row;
			flex-wrap: nowrap;
			gap: 6px;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			padding: 0 16px;
		}

		.sidebar__nav::-webkit-scrollbar {
			display: none;
		}

		.sidebar__link {
			padding: 8px 14px;
			border-left: none;
			border: 1px solid rgba(196, 146, 58, 0.18);
			font-size: 11px;
			white-space: nowrap;
			flex-shrink: 0;
		}

		.sidebar__link--active {
			border-color: var(--color-brass);
			background: rgba(196, 146, 58, 0.1);
		}

		.sidebar__contact {
			display: none;
		}

		.main {
			padding: 28px 20px 64px;
		}

		.section {
			margin-bottom: 48px;
		}

		.section__header {
			margin-bottom: 24px;
		}

		.checklists {
			grid-template-columns: 1fr;
		}

		.qa__btn {
			padding: 16px 0;
			gap: 12px;
		}

		.qa__q {
			font-size: 14px;
		}

		.cta {
			margin-top: 48px;
			padding: 28px 20px;
		}

		.cta__actions {
			flex-direction: column;
			align-items: stretch;
		}

		.cta__actions .btn {
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.hero {
			padding: 88px 20px 28px;
		}
	}
</style>
