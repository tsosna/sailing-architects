<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { onMount } from 'svelte'
	import { useQuery } from 'convex-svelte'
	import { useClerkContext } from 'svelte-clerk'
	import {
		loadStripe,
		type Stripe,
		type StripeElements
	} from '@stripe/stripe-js'
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public'
	import { api } from '$convex/api'

	const ctx = useClerkContext()
	const userId = $derived(ctx.auth.userId ?? '')
	const userEmail = $derived(ctx.user?.primaryEmailAddress?.emailAddress ?? '')
	const paymentId = $derived(page.params.paymentId ?? '')

	const bookingQuery = useQuery(api.queries.bookingByUser, () => ({ userId }))
	const bookingData = $derived(bookingQuery.data)
	const payment = $derived(
		bookingData?.payments.find((p) => p._id === paymentId) ?? null
	)
	const bookingId = $derived(bookingData?._id ?? null)

	function formatGrosze(grosze: number): string {
		return (grosze / 100).toLocaleString('pl-PL', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})
	}

	let stripeInstance = $state<Stripe | null>(null)
	let stripeElements = $state<StripeElements | null>(null)
	let paymentMountRef = $state<HTMLElement | null>(null)
	let clientSecret = $state<string | null>(null)
	let intentLoading = $state(false)
	let intentError = $state<string | null>(null)
	let payLoading = $state(false)
	let payError = $state<string | null>(null)
	let succeeded = $state(false)

	async function paymentIntentError(response: Response): Promise<Error> {
		const contentType = response.headers.get('content-type') ?? ''
		if (contentType.includes('application/json')) {
			const data = (await response.json().catch(() => null)) as {
				message?: string
			} | null
			return new Error(data?.message ?? 'Błąd inicjalizacji płatności')
		}
		const message = await response.text().catch(() => '')
		return new Error(message || 'Błąd inicjalizacji płatności')
	}

	async function initiate() {
		if (!userId || !bookingId || !payment || clientSecret || intentLoading)
			return
		intentLoading = true
		intentError = null
		const controller = new AbortController()
		const timeout = window.setTimeout(() => controller.abort(), 20000)
		try {
			const response = await fetch('/api/stripe/pay-installment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				signal: controller.signal,
				body: JSON.stringify({
					userId,
					bookingId,
					paymentIds: [payment._id],
					buyerEmail: userEmail || undefined
				})
			})
			if (!response.ok) throw await paymentIntentError(response)
			const { clientSecret: cs } = await response.json()
			clientSecret = cs
			stripeInstance = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY)
			if (stripeInstance) {
				stripeElements = stripeInstance.elements({
					clientSecret: cs,
					appearance: {
						theme: 'night',
						variables: {
							colorPrimary: '#c4923a',
							colorBackground: '#0f1f35',
							colorText: '#f5f0e8',
							colorDanger: '#ef4444',
							fontFamily: 'DM Sans, system-ui, sans-serif',
							borderRadius: '0px'
						}
					}
				})
			}
		} catch (err: unknown) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				intentError =
					'Inicjalizacja płatności trwa zbyt długo. Spróbuj ponownie za chwilę.'
			} else {
				intentError =
					err instanceof Error ? err.message : 'Błąd inicjalizacji płatności'
			}
		} finally {
			window.clearTimeout(timeout)
			intentLoading = false
		}
	}

	$effect(() => {
		if (!paymentMountRef || !stripeElements) return
		const el = stripeElements.create('payment')
		el.mount(paymentMountRef)
		return () => {
			el.unmount()
		}
	})

	onMount(() => {
		// nothing — initiation is user-triggered to avoid race with Convex query loading
	})

	async function submitPayment() {
		if (!stripeInstance || !stripeElements) return
		payLoading = true
		payError = null
		const { error: stripeErr } = await stripeInstance.confirmPayment({
			elements: stripeElements,
			redirect: 'if_required'
		})
		if (stripeErr) {
			payError = stripeErr.message ?? 'Płatność nie powiodła się'
			payLoading = false
		} else {
			succeeded = true
			payLoading = false
		}
	}

	async function backToDashboard() {
		await goto(resolve('/dashboard'))
	}
</script>

<svelte:head>
	<title>Płatność raty · Sailing Architects</title>
</svelte:head>

<main class="pay-page">
	<div class="pay-page__inner">
		<a class="pay-page__back" href={resolve('/dashboard')}>← Wróć do panelu</a>
		<p class="eyebrow">Płatność raty</p>

		{#if bookingQuery.isLoading}
			<p class="lead">Ładowanie rezerwacji…</p>
		{:else if !bookingData}
			<p class="lead">Brak aktywnej rezerwacji.</p>
		{:else if !payment}
			<p class="lead">Nie znaleziono tej płatności.</p>
		{:else if succeeded}
			<section class="card">
				<div class="success__check" aria-hidden="true">✓</div>
				<h1 class="title">Dziękujemy!</h1>
				<p class="lead">
					Płatność <strong>{payment.label}</strong> ({formatGrosze(
						payment.amount
					)} zł) została zaksięgowana.
				</p>
				<button
					type="button"
					class="btn btn--primary"
					onclick={backToDashboard}
				>
					Wróć do panelu
				</button>
			</section>
		{:else}
			<section class="card">
				<header class="card__header">
					<h1 class="title">{payment.label}</h1>
					<p class="card__amount">{formatGrosze(payment.amount)} zł</p>
				</header>
				{#if payment.dueAt}
					<p class="card__meta">
						Termin {new Date(payment.dueAt).toLocaleDateString('pl-PL', {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric'
						})}
					</p>
				{/if}
				{#if payment.status === 'paid'}
					<p class="lead">Ta płatność jest już opłacona.</p>
					<button
						type="button"
						class="btn btn--ghost"
						onclick={backToDashboard}
					>
						Wróć do panelu
					</button>
				{:else if payment.status === 'processing' && !clientSecret}
					<p class="lead">
						Ta płatność jest w trakcie przetwarzania. Spróbuj ponownie za chwilę
						lub wróć do panelu.
					</p>
					<button
						type="button"
						class="btn btn--ghost"
						onclick={backToDashboard}
					>
						Wróć do panelu
					</button>
				{:else}
					<div class="pay-block">
						<div class="pay-block__notice">
							🔒 Płatność obsługiwana przez Stripe. Twoje dane są bezpieczne.
						</div>

						{#if intentError}
							<p class="error-msg" role="alert">{intentError}</p>
						{/if}

						{#if !clientSecret}
							<button
								type="button"
								class="btn btn--primary"
								disabled={intentLoading}
								onclick={initiate}
							>
								{intentLoading
									? 'Inicjalizacja…'
									: `Zapłać ${formatGrosze(payment.amount)} zł →`}
							</button>
						{:else}
							<div
								bind:this={paymentMountRef}
								id="stripe-payment-element"
							></div>
							{#if payError}
								<p class="error-msg" role="alert">{payError}</p>
							{/if}
							<button
								type="button"
								class="btn btn--primary"
								disabled={payLoading || !stripeElements}
								onclick={submitPayment}
							>
								{payLoading
									? 'Przetwarzanie…'
									: `Potwierdź ${formatGrosze(payment.amount)} zł →`}
							</button>
						{/if}
					</div>
				{/if}
			</section>
		{/if}
	</div>
</main>

<style>
	.pay-page {
		min-height: 100vh;
		background: var(--color-navy);
		padding: 124px 24px 80px;
	}

	.pay-page__inner {
		max-width: 640px;
		margin: 0 auto;
	}

	.pay-page__back {
		display: inline-block;
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		text-decoration: none;
		margin-bottom: 24px;
		transition: color 200ms ease;
	}

	.pay-page__back:hover {
		color: var(--color-brass-text);
	}

	.eyebrow {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 3px;
		color: var(--color-brass-text);
		text-transform: uppercase;
		margin: 0 0 18px;
	}

	.title {
		font-family: var(--font-serif);
		font-size: 28px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0;
	}

	.lead {
		font-size: 14px;
		color: rgba(245, 240, 232, 0.8);
		line-height: 1.6;
		margin: 16px 0 24px;
	}

	.card {
		background: rgba(255, 255, 255, 0.02);
		border-left: 2px solid rgba(196, 146, 58, 0.4);
		padding: 32px;
	}

	.card__header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
		flex-wrap: wrap;
	}

	.card__amount {
		font-family: var(--font-serif);
		font-size: 24px;
		color: var(--color-brass-text);
		margin: 0;
	}

	.card__meta {
		font-family: var(--font-sans);
		font-size: 12px;
		color: var(--color-brass-text-soft);
		margin: 12px 0 0;
	}

	.pay-block {
		margin-top: 28px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.pay-block__notice {
		font-size: 12px;
		color: rgba(245, 240, 232, 0.6);
		padding: 10px 14px;
		background: rgba(196, 146, 58, 0.06);
		border-left: 2px solid rgba(196, 146, 58, 0.3);
	}

	.error-msg {
		color: #ef4444;
		font-size: 13px;
		margin: 0;
	}

	.btn {
		font-family: var(--font-sans);
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 11px;
		padding: 14px 28px;
		cursor: pointer;
		border-radius: 0;
		border: 1px solid transparent;
		transition: all 200ms ease;
		text-decoration: none;
		display: inline-block;
		text-align: center;
	}

	.btn--primary {
		background: var(--color-brass);
		color: var(--color-navy);
		border-color: var(--color-brass);
	}

	.btn--primary:hover:not(:disabled) {
		background: var(--color-brass-light);
		border-color: var(--color-brass-light);
	}

	.btn--primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn--ghost {
		background: transparent;
		color: var(--color-warm-white);
		border-color: rgba(196, 146, 58, 0.3);
	}

	.btn--ghost:hover:not(:disabled) {
		border-color: var(--color-brass);
		background: rgba(196, 146, 58, 0.06);
	}

	.success__check {
		width: 56px;
		height: 56px;
		border: 2px solid var(--color-brass);
		display: grid;
		place-items: center;
		font-size: 28px;
		color: var(--color-brass);
		margin-bottom: 18px;
	}

	#stripe-payment-element {
		min-height: 200px;
	}
</style>
