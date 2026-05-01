<svelte:head>
	<title>Admin · Automatyzacje</title>
</svelte:head>

<header class="topline">
	<p class="eyebrow">Automation</p>
	<h1>Harmonogramy i reguły monitów</h1>
</header>

<section class="placeholder">
	<p>
		Konfigurator planów rat, reguł przypomnień i ustawień alertów admina trafi
		tutaj w Etapie 4 (harmonogramy) oraz Etapie 3 (reguły monitów).
	</p>
</section>

<style>
	.topline {
		margin-bottom: 26px;
	}
	.eyebrow {
		margin: 0 0 9px;
		color: var(--admin-brass-light);
		font-size: 10px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-weight: 400;
		font-size: clamp(28px, 4vw, 44px);
		line-height: 1.05;
	}
	.placeholder {
		padding: 32px;
		border: 1px solid var(--admin-line);
		background: rgba(15, 31, 53, 0.82);
		max-width: 720px;
	}
	.placeholder p {
		margin: 0;
		color: var(--admin-muted);
		font-size: 14px;
		line-height: 1.65;
	}
</style>
