<script lang="ts">
	import { resolve } from '$app/paths'
</script>

<footer class="footer">
	<div class="footer__inner">
		<div class="footer__top">
			<div class="footer__brand">
				<div class="footer__logo">
					<svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true">
						<circle cx="20" cy="20" r="19" stroke="#c4923a" stroke-width="1.5" />
						<text
							x="20"
							y="25"
							text-anchor="middle"
							font-size="14"
							font-weight="700"
							font-family="DM Sans, sans-serif"
							fill="#c4923a"
							letter-spacing="1">SA</text>
					</svg>
					<span>Sailing Architects</span>
				</div>
				<p class="footer__desc">
					Boutique sailing trips. Łączymy pasję żeglowania z odkrywaniem świata.
				</p>
				<p class="footer__contact">
					<a href="mailto:sailingarchitects@gmail.com">sailingarchitects@gmail.com</a> ·
					<a href="tel:+48601671182">+48 601 671 182</a>
				</p>
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

	.footer__logo span {
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
		font-size: 12px;
		color: rgba(196, 146, 58, 0.5);
		margin: 0;
	}

	.footer__contact a {
		color: inherit;
		text-decoration: none;
		transition: color 200ms ease;
	}

	.footer__contact a:hover {
		color: var(--color-brass);
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
