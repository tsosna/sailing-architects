<script lang="ts">
	import { resolve } from '$app/paths'
</script>

<footer class="footer">
	<div class="footer__inner">
		<div class="footer__top">
			<div class="footer__brand">
				<div class="footer__logo">
					<span class="footer__mark">
						<img src="/images/brand/logo.png" alt="" />
					</span>
					<span>Sailing Architects</span>
				</div>
				<p class="footer__desc">
					Boutique sailing trips. Łączymy pasję żeglowania z odkrywaniem świata.
				</p>
				<div class="footer__contact" aria-label="Kontakt do organizatora">
					<p>Kontakt do organizatora</p>
					<strong>Michał</strong>
					<a href="tel:+48601671182">+48 601 671 182</a>
					<a href="mailto:sailingarchitects@gmail.com"
						>sailingarchitects@gmail.com</a
					>
				</div>
			</div>
			<a class="footer__cta" href={resolve('/book')}>Zarezerwuj koję →</a>
		</div>
		<div class="footer__bottom">
			<p>© 2026 Sailing Architects.</p>
			<p>SvelteKit + Convex + Stripe + Clerk</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--color-navy-deep);
		padding: 64px 40px 40px;
		border-top: 1px solid rgba(196, 146, 58, 0.1);
	}

	.footer__inner {
		max-width: 1100px;
		margin: 0 auto;
	}

	.footer__top {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 48px;
		align-items: end;
		margin-bottom: 48px;
	}

	.footer__logo {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.footer__mark {
		width: 58px;
		height: 58px;
		display: grid;
		place-items: center;
		background: transparent;
		border: 1px solid rgba(196, 146, 58, 0.28);
		box-shadow: inset 0 0 0 1px rgba(196, 146, 58, 0.08);
		overflow: hidden;
		flex: 0 0 auto;
	}

	.footer__mark img {
		width: 88%;
		height: 88%;
		object-fit: contain;
		display: block;
	}

	.footer__logo > span:last-child {
		font-family: var(--font-serif);
		font-size: 18px;
		color: var(--color-warm-white);
	}

	.footer__desc {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.7;
		max-width: 360px;
		color: rgba(245, 240, 232, 0.35);
		margin: 0 0 20px;
	}

	.footer__contact {
		font-family: var(--font-sans);
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 8px 14px;
		margin: 0;
	}

	.footer__contact p {
		width: 100%;
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text);
		margin: 0 0 2px;
	}

	.footer__contact strong {
		font-size: 14px;
		color: var(--color-warm-white);
	}

	.footer__contact a {
		font-size: 13px;
		color: rgba(245, 240, 232, 0.82);
		text-decoration: none;
		border-bottom: 1px solid rgba(196, 146, 58, 0.35);
		transition:
			color 200ms ease,
			border-color 200ms ease;
	}

	.footer__contact a:hover {
		color: var(--color-brass-text);
		border-bottom-color: var(--color-brass-text);
	}

	.footer__cta {
		padding: 16px 40px;
		background: var(--color-brass);
		border: none;
		color: var(--color-navy);
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 12px;
		letter-spacing: 2px;
		text-transform: uppercase;
		cursor: pointer;
		border-radius: 0;
		white-space: nowrap;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		transition: background-color 200ms ease;
	}

	.footer__cta:hover {
		background: var(--color-brass-light);
	}

	.footer__bottom {
		border-top: 1px solid rgba(196, 146, 58, 0.08);
		padding-top: 24px;
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
	}

	.footer__bottom p {
		font-family: var(--font-sans);
		font-size: 11px;
		color: rgba(245, 240, 232, 0.2);
		margin: 0;
	}

	@media (max-width: 720px) {
		.footer__top {
			grid-template-columns: 1fr;
			gap: 32px;
			align-items: start;
		}
	}
</style>
