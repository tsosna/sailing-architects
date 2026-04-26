<script lang="ts">
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { useConvexClient } from 'convex-svelte'
	import {
		loadStripe,
		type Stripe,
		type StripeElements
	} from '@stripe/stripe-js'
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public'
	import { BookingInput } from '$components/booking-input'
	import { StepIndicator } from '$components/step-indicator'
	import { findCabinByBerth } from '$lib/data/cabins'
	import { voyageSegments } from '$lib/data/voyage-segments'
	import { SignIn, SignUp, useClerkContext } from 'svelte-clerk'
	import { api } from '$convex/api'

	const STEPS = [
		{ id: 1, label: 'Konto' },
		{ id: 2, label: 'Dane załogi' },
		{ id: 3, label: 'Potwierdzenie' },
		{ id: 4, label: 'Płatność' },
		{ id: 5, label: 'Gotowe' }
	] as const

	const NATIONALITY_OPTIONS = [
		{ value: 'PL', label: 'Polska' },
		{ value: 'DE', label: 'Niemcy' },
		{ value: 'UK', label: 'Wielka Brytania' },
		{ value: 'other', label: 'Inna' }
	]

	const DOC_TYPE_OPTIONS = [
		{ value: 'passport', label: 'Paszport' },
		{ value: 'id', label: 'Dowód osobisty' }
	]

	const SWIMMING_OPTIONS = [
		{ value: '', label: 'Wybierz...' },
		{ value: 'excellent', label: 'Doskonały pływak' },
		{ value: 'good', label: 'Dobry pływak' },
		{ value: 'basic', label: 'Podstawowy' },
		{ value: 'none', label: 'Nie pływam' }
	]

	const EXPERIENCE_OPTIONS = [
		{ value: '', label: 'Wybierz...' },
		{ value: 'skipper', label: 'Skipper / patent' },
		{ value: 'crew', label: 'Doświadczony crew' },
		{ value: 'beginner', label: 'Kilka rejsów' },
		{ value: 'none', label: 'Pierwszy rejs' }
	]

	const ctx = useClerkContext()
	const isSignedIn = $derived(!!ctx.auth.userId)
	const userEmail = $derived(ctx.user?.primaryEmailAddress?.emailAddress ?? '')

	const segmentParam = $derived(page.url.searchParams.get('segment'))
	const berthParam = $derived(page.url.searchParams.get('berth'))

	const segment = $derived(
		voyageSegments.find((s) => s.id === segmentParam) ?? voyageSegments[0]
	)
	const berth = $derived(berthParam ?? 'A1')
	const cabin = $derived(findCabinByBerth(berth))
	const priceFormatted = $derived(segment.price.toLocaleString('pl-PL'))

	let step = $state(1)
	let authMode = $state<'signin' | 'signup'>('signin')

	let crew = $state({
		firstName: '',
		lastName: '',
		dob: '',
		nationality: 'PL',
		docType: 'passport',
		docNumber: '',
		emergencyName: '',
		emergencyPhone: '',
		swimming: '',
		experience: '',
		diet: '',
		medical: ''
	})

	// ── Convex client (mutations) ─────────────────────────────────────────
	const convex = useConvexClient()
	let savingProfile = $state(false)
	let saveError = $state<string | null>(null)
	let errors = $state<Record<string, string>>({})

	type CrewField = keyof typeof crew

	function validate(): { valid: boolean; errors: Record<string, string> } {
		const next: Record<string, string> = {}
		const requiredText: ReadonlyArray<CrewField> = [
			'firstName',
			'lastName',
			'dob',
			'docNumber',
			'emergencyName',
			'emergencyPhone'
		]
		for (const f of requiredText) {
			if (!crew[f].trim()) next[f] = 'Pole wymagane'
		}
		if (!crew.swimming) next.swimming = 'Wybierz opcję'
		if (!crew.experience) next.experience = 'Wybierz opcję'
		return { valid: Object.keys(next).length === 0, errors: next }
	}

	function clearError(field: CrewField) {
		if (errors[field]) {
			const { [field]: _, ...rest } = errors
			errors = rest
		}
	}

	// ── Stripe state ─────────────────────────────────────────────────────
	let stripeInstance = $state<Stripe | null>(null)
	let stripeElements = $state<StripeElements | null>(null)
	let paymentMountRef = $state<HTMLElement | null>(null)
	let clientSecret = $state<string | null>(null)
	let createdBookingRef = $state<string | null>(null)
	let intentLoading = $state(false)
	let intentError = $state<string | null>(null)
	let paymentLoading = $state(false)
	let paymentError = $state<string | null>(null)

	/** Fetch PaymentIntent + init Stripe when entering step 4. */
	$effect(() => {
		if (step !== 4 || clientSecret) return

		intentLoading = true
		intentError = null

		fetch('/api/stripe/create-intent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				segmentSlug: segment.id,
				berthId: berth,
				userId: ctx.auth.userId
			})
		})
			.then((r) => {
				if (!r.ok)
					return r
						.json()
						.then((d) => Promise.reject(new Error(d.message ?? 'Błąd')))
				return r.json()
			})
			.then(async ({ clientSecret: cs, bookingRef }) => {
				clientSecret = cs
				createdBookingRef = bookingRef
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
			})
			.catch((err: unknown) => {
				intentError =
					err instanceof Error ? err.message : 'Błąd inicjalizacji płatności'
			})
			.finally(() => {
				intentLoading = false
			})
	})

	/** Mount PaymentElement when both DOM ref and StripeElements are ready. */
	$effect(() => {
		if (!paymentMountRef || !stripeElements) return
		const el = stripeElements.create('payment')
		el.mount(paymentMountRef)
		return () => {
			el.unmount()
		}
	})

	async function submitPayment() {
		if (!stripeInstance || !stripeElements) return
		paymentLoading = true
		paymentError = null
		const { error: stripeErr } = await stripeInstance.confirmPayment({
			elements: stripeElements,
			redirect: 'if_required'
		})
		if (stripeErr) {
			paymentError = stripeErr.message ?? 'Płatność nie powiodła się'
			paymentLoading = false
		} else {
			step = 5
			paymentLoading = false
		}
	}

	async function next() {
		if (step === 1 && !isSignedIn) return

		if (step === 2) {
			const result = validate()
			if (!result.valid) {
				errors = result.errors
				return
			}
			savingProfile = true
			saveError = null
			try {
				await convex.mutation(api.mutations.upsertCrewProfile, {
					userId: ctx.auth.userId!,
					firstName: crew.firstName,
					lastName: crew.lastName,
					dateOfBirth: crew.dob,
					nationality: crew.nationality,
					docType: crew.docType as 'passport' | 'id',
					docNumber: crew.docNumber,
					emergencyContactName: crew.emergencyName,
					emergencyContactPhone: crew.emergencyPhone,
					swimmingAbility: crew.swimming,
					sailingExperience: crew.experience,
					dietaryRequirements: crew.diet || undefined,
					medicalNotes: crew.medical || undefined
				})
				step = 3
			} catch (err) {
				saveError = err instanceof Error ? err.message : 'Błąd zapisu danych'
			} finally {
				savingProfile = false
			}
			return
		}

		step = Math.min(step + 1, 5)
	}

	function back() {
		if (step > 1) step--
	}

	const confirmRows = $derived([
		['Etap', segment.name],
		['Termin', segment.dates],
		['Czas trwania', `${segment.days} dni`],
		['Koja', `${berth} — ${cabin?.label ?? 'Kabina A'}`],
		['Pozycja', cabin?.position ?? 'Dziobowa'],
		['Cena', `${priceFormatted} zł / osoba`]
	])
</script>

<svelte:head>
	<title>Rezerwacja · Sailing Architects</title>
</svelte:head>

<main class="book">
	<div class="book__inner">
		<a class="book__back" href={resolve('/')}>← Wróć do strony głównej</a>
		<StepIndicator current={step} steps={STEPS} />

		{#if step === 1}
			<section class="step">
				<p class="eyebrow">Krok 1</p>
				<h2 class="title">Zaloguj się lub utwórz konto</h2>

				{#if isSignedIn}
					<div class="signed-in" role="status">
						<p class="signed-in__eyebrow">Sesja aktywna</p>
						<p class="signed-in__title">Zalogowano jako {userEmail}</p>
						<p class="signed-in__hint">Możesz przejść dalej.</p>
					</div>
				{:else}
					<div class="auth-tabs" role="tablist">
						<button
							type="button"
							role="tab"
							aria-selected={authMode === 'signin'}
							class="auth-tab"
							class:auth-tab--active={authMode === 'signin'}
							onclick={() => (authMode = 'signin')}
						>
							Logowanie
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={authMode === 'signup'}
							class="auth-tab"
							class:auth-tab--active={authMode === 'signup'}
							onclick={() => (authMode = 'signup')}
						>
							Rejestracja
						</button>
					</div>

					<div class="clerk-host">
						{#if authMode === 'signin'}
							<SignIn />
						{:else}
							<SignUp />
						{/if}
					</div>
				{/if}

				<div class="actions">
					<button
						type="button"
						class="btn btn--primary"
						disabled={!isSignedIn}
						onclick={next}>Dalej →</button
					>
				</div>
			</section>
		{/if}

		{#if step === 2}
			<section class="step">
				<p class="eyebrow">Krok 2</p>
				<h2 class="title">Dane załogi</h2>
				<p class="lead">
					Wymagane przez kapitana i władze portowe. Dane przechowywane
					bezpiecznie, widoczne tylko dla organizatora.
				</p>

				<div class="form">
					<BookingInput
						label="Imię"
						bind:value={crew.firstName}
						required
						error={errors.firstName}
						oninput={() => clearError('firstName')}
					/>
					<BookingInput
						label="Nazwisko"
						bind:value={crew.lastName}
						required
						error={errors.lastName}
						oninput={() => clearError('lastName')}
					/>
					<BookingInput
						label="Data urodzenia"
						type="date"
						bind:value={crew.dob}
						required
						error={errors.dob}
						oninput={() => clearError('dob')}
					/>
					<BookingInput
						label="Narodowość"
						bind:value={crew.nationality}
						options={NATIONALITY_OPTIONS}
					/>

					<div class="form__divider">
						<p class="form__divider-label">Dokument tożsamości</p>
					</div>

					<BookingInput
						label="Typ dokumentu"
						bind:value={crew.docType}
						options={DOC_TYPE_OPTIONS}
					/>
					<BookingInput
						label="Numer dokumentu"
						bind:value={crew.docNumber}
						required
						hint="Wymagane do rejestru jachtu"
						error={errors.docNumber}
						oninput={() => clearError('docNumber')}
					/>

					<div class="form__divider">
						<p class="form__divider-label">Kontakt alarmowy</p>
					</div>

					<BookingInput
						label="Imię i nazwisko"
						bind:value={crew.emergencyName}
						required
						error={errors.emergencyName}
						oninput={() => clearError('emergencyName')}
					/>
					<BookingInput
						label="Telefon"
						type="tel"
						bind:value={crew.emergencyPhone}
						required
						error={errors.emergencyPhone}
						oninput={() => clearError('emergencyPhone')}
					/>

					<div class="form__divider">
						<p class="form__divider-label">Profil żeglarski</p>
					</div>

					<BookingInput
						label="Umiejętności pływackie"
						bind:value={crew.swimming}
						required
						options={SWIMMING_OPTIONS}
						error={errors.swimming}
						oninput={() => clearError('swimming')}
					/>
					<BookingInput
						label="Doświadczenie żeglarskie"
						bind:value={crew.experience}
						required
						options={EXPERIENCE_OPTIONS}
						error={errors.experience}
						oninput={() => clearError('experience')}
					/>
					<BookingInput
						label="Wymagania dietetyczne"
						type="textarea"
						bind:value={crew.diet}
						hint="Wegetarianizm, alergie, itp."
					/>
					<BookingInput
						label="Uwagi medyczne"
						type="textarea"
						bind:value={crew.medical}
						hint="Informacje istotne dla bezpieczeństwa"
					/>
				</div>

				{#if saveError}
					<p class="error-msg" role="alert">{saveError}</p>
				{/if}

				<div class="actions">
					<button type="button" class="btn btn--ghost" onclick={back}
						>← Wróć</button
					>
					<button
						type="button"
						class="btn btn--primary"
						disabled={savingProfile}
						onclick={next}
					>
						{savingProfile ? 'Zapisywanie…' : 'Dalej →'}
					</button>
				</div>
			</section>
		{/if}

		{#if step === 3}
			<section class="step">
				<p class="eyebrow">Krok 3</p>
				<h2 class="title">Potwierdzenie rezerwacji</h2>

				<div class="confirm">
					<header class="confirm__header">
						<p class="confirm__eyebrow">Rejs</p>
						<p class="confirm__title">Sail Adventure 2026</p>
					</header>
					<dl class="confirm__rows">
						{#each confirmRows as [k, v] (k)}
							<div class="confirm__row">
								<dt class="confirm__key">{k}</dt>
								<dd class="confirm__value">{v}</dd>
							</div>
						{/each}
					</dl>
					<footer class="confirm__footer">
						<p>
							Cena nie zawiera: kosztów dojazdu do mariny, opłat portowych i
							paliwa (ok. 150–200 EUR/os), ubezpieczenia turystycznego (ok. 250
							zł/os).
						</p>
					</footer>
				</div>

				<div class="actions">
					<button type="button" class="btn btn--ghost" onclick={back}
						>← Wróć</button
					>
					<button type="button" class="btn btn--primary" onclick={next}>
						Przejdź do płatności →
					</button>
				</div>
			</section>
		{/if}

		{#if step === 4}
			<section class="step">
				<p class="eyebrow">Krok 4</p>
				<h2 class="title">Płatność</h2>

				<div class="pay">
					<div class="pay__form">
						<div class="pay__notice">
							🔒 Płatność obsługiwana przez Stripe. Twoje dane są bezpieczne.
						</div>

						{#if intentError}
							<p class="error-msg" role="alert">{intentError}</p>
						{:else if intentLoading}
							<div class="pay__loading" aria-live="polite">
								Inicjalizacja płatności…
							</div>
						{:else if stripeElements}
							<div
								bind:this={paymentMountRef}
								id="stripe-payment-element"
							></div>
						{/if}

						{#if paymentError}
							<p class="error-msg" role="alert">{paymentError}</p>
						{/if}
					</div>

					<aside class="pay__summary">
						<p class="pay__summary-eyebrow">Podsumowanie</p>
						<p class="pay__summary-title">{segment.name}</p>
						<p class="pay__summary-dates">{segment.dates}</p>
						<div class="pay__summary-rows">
							<div class="pay__summary-row">
								<span>Koja {berth}</span>
								<span>{priceFormatted} zł</span>
							</div>
							<div class="pay__summary-row pay__summary-row--total">
								<span>Razem</span>
								<span>{priceFormatted} zł</span>
							</div>
						</div>
					</aside>
				</div>

				<div class="actions">
					<button
						type="button"
						class="btn btn--ghost"
						onclick={back}
						disabled={paymentLoading}
					>
						← Wróć
					</button>
					<button
						type="button"
						class="btn btn--primary"
						disabled={paymentLoading ||
							!!intentError ||
							intentLoading ||
							!stripeElements}
						onclick={submitPayment}
					>
						{paymentLoading
							? 'Przetwarzanie…'
							: `Zapłać ${priceFormatted} zł →`}
					</button>
				</div>
			</section>
		{/if}

		{#if step === 5}
			<section class="step step--success">
				<div class="success__check" aria-hidden="true">✓</div>
				<p class="eyebrow">Rezerwacja potwierdzona</p>
				<h2 class="title">Witaj na pokładzie!</h2>
				{#if createdBookingRef}
					<p class="success__ref" aria-label="Numer rezerwacji">
						{createdBookingRef}
					</p>
				{/if}
				<p class="success__lead">
					Koja <strong>{berth}</strong> na etapie
					<strong>{segment.name}</strong>
					({segment.dates}) jest Twoja. Potwierdzenie zostanie wysłane e-mailem
					po zaksięgowaniu płatności.
				</p>
				<div class="actions actions--center">
					<a class="btn btn--primary" href={resolve('/dashboard')}>Mój panel</a>
					<button type="button" class="btn btn--ghost" disabled
						>↓ Pobierz PDF</button
					>
				</div>
			</section>
		{/if}
	</div>
</main>

<style>
	.book {
		min-height: 100vh;
		background: var(--color-navy);
		padding: 124px 24px 80px;
	}

	.book__inner {
		max-width: 800px;
		margin: 0 auto;
	}

	.book__back {
		background: none;
		border: none;
		color: rgba(196, 146, 58, 0.5);
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		cursor: pointer;
		display: inline-block;
		margin-bottom: 40px;
		padding: 0;
		text-decoration: none;
		transition: color 200ms ease;
	}

	.book__back:hover {
		color: var(--color-brass);
	}

	.step {
		min-height: 320px;
	}

	.step--success {
		text-align: center;
		max-width: 480px;
		margin: 0 auto;
		padding-top: 20px;
	}

	.eyebrow {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		color: rgba(196, 146, 58, 0.6);
		text-transform: uppercase;
		margin: 0 0 8px;
	}

	.title {
		font-family: var(--font-serif);
		font-size: 28px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 32px;
	}

	.step--success .title {
		font-size: 32px;
		margin: 0 0 12px;
	}

	.lead {
		font-family: var(--font-sans);
		font-size: 13px;
		color: rgba(245, 240, 232, 0.4);
		max-width: 480px;
		line-height: 1.6;
		margin: -24px 0 32px;
	}

	.signed-in {
		padding: 20px 24px;
		background: rgba(196, 146, 58, 0.08);
		border: 1px solid rgba(196, 146, 58, 0.25);
		margin-bottom: 32px;
		max-width: 480px;
	}

	.signed-in__eyebrow {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass);
		margin: 0 0 6px;
	}

	.signed-in__title {
		font-family: var(--font-serif);
		font-size: 18px;
		color: var(--color-warm-white);
		margin: 0 0 4px;
	}

	.signed-in__hint {
		font-family: var(--font-sans);
		font-size: 12px;
		color: rgba(245, 240, 232, 0.5);
		margin: 0;
	}

	.auth-tabs {
		display: flex;
		gap: 0;
		margin-bottom: 32px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.15);
		max-width: 480px;
	}

	.auth-tab {
		padding: 10px 24px;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: rgba(245, 240, 232, 0.4);
		font-family: var(--font-sans);
		font-size: 12px;
		letter-spacing: 1px;
		text-transform: uppercase;
		cursor: pointer;
		margin-bottom: -1px;
		transition:
			color 200ms ease,
			border-color 200ms ease;
	}

	.auth-tab:hover {
		color: rgba(245, 240, 232, 0.7);
	}

	.auth-tab--active {
		color: var(--color-brass);
		border-bottom-color: var(--color-brass);
	}

	.clerk-host {
		max-width: 480px;
		margin-bottom: 8px;
	}

	.form {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 20px;
		max-width: 600px;
	}

	.form__divider {
		grid-column: 1 / -1;
		border-top: 1px solid rgba(196, 146, 58, 0.1);
		padding-top: 20px;
	}

	.form__divider-label {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.5);
		margin: 0;
	}

	.confirm {
		max-width: 480px;
		border: 1px solid rgba(196, 146, 58, 0.25);
	}

	.confirm__header {
		background: rgba(196, 146, 58, 0.08);
		padding: 20px 24px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.15);
	}

	.confirm__eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.6);
		margin: 0 0 4px;
	}

	.confirm__title {
		font-family: var(--font-serif);
		font-size: 20px;
		color: var(--color-warm-white);
		margin: 0;
	}

	.confirm__rows {
		margin: 0;
	}

	.confirm__row {
		display: flex;
		justify-content: space-between;
		padding: 14px 24px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.08);
		gap: 16px;
	}

	.confirm__key {
		font-family: var(--font-sans);
		font-size: 11px;
		color: rgba(245, 240, 232, 0.4);
		letter-spacing: 1px;
		text-transform: uppercase;
		margin: 0;
	}

	.confirm__value {
		font-family: var(--font-sans);
		font-size: 13px;
		color: var(--color-warm-white);
		font-weight: 500;
		margin: 0;
		text-align: right;
	}

	.confirm__footer {
		padding: 14px 24px;
		background: rgba(196, 146, 58, 0.05);
	}

	.confirm__footer p {
		font-family: var(--font-sans);
		font-size: 10px;
		color: rgba(245, 240, 232, 0.3);
		margin: 0;
		line-height: 1.6;
	}

	.pay {
		display: flex;
		gap: 40px;
		flex-wrap: wrap;
		align-items: flex-start;
	}

	.pay__form {
		flex: 1;
		min-width: 280px;
		max-width: 380px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.pay__notice {
		padding: 12px 16px;
		background: rgba(196, 146, 58, 0.08);
		border: 1px solid rgba(196, 146, 58, 0.2);
		font-family: var(--font-sans);
		font-size: 12px;
		color: rgba(245, 240, 232, 0.5);
	}

	.pay__loading {
		font-family: var(--font-sans);
		font-size: 13px;
		color: rgba(245, 240, 232, 0.4);
		padding: 24px 0;
	}

	#stripe-payment-element {
		/* Stripe injects iframe here — needs explicit min-height to avoid flicker */
		min-height: 200px;
	}

	.error-msg {
		font-family: var(--font-sans);
		font-size: 12px;
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.25);
		padding: 10px 14px;
		margin: 0;
	}

	.success__ref {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 3px;
		text-transform: uppercase;
		color: var(--color-brass);
		background: rgba(196, 146, 58, 0.08);
		border: 1px solid rgba(196, 146, 58, 0.25);
		padding: 8px 20px;
		display: inline-block;
		margin: 0 auto 24px;
	}

	.pay__summary {
		width: 220px;
		padding: 20px;
		border: 1px solid rgba(196, 146, 58, 0.2);
		background: rgba(196, 146, 58, 0.04);
	}

	.pay__summary-eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(196, 146, 58, 0.6);
		margin: 0 0 16px;
	}

	.pay__summary-title {
		font-family: var(--font-serif);
		font-size: 13px;
		color: rgba(245, 240, 232, 0.8);
		margin: 0 0 4px;
	}

	.pay__summary-dates {
		font-family: var(--font-sans);
		font-size: 11px;
		color: rgba(245, 240, 232, 0.4);
		margin: 0 0 20px;
	}

	.pay__summary-rows {
		border-top: 1px solid rgba(196, 146, 58, 0.15);
		padding-top: 16px;
	}

	.pay__summary-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
		font-family: var(--font-sans);
		font-size: 11px;
		color: rgba(245, 240, 232, 0.4);
	}

	.pay__summary-row > span:last-child {
		color: var(--color-warm-white);
	}

	.pay__summary-row--total {
		border-top: 1px solid rgba(196, 146, 58, 0.15);
		padding-top: 12px;
		margin-top: 4px;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--color-brass);
	}

	.pay__summary-row--total > span:last-child {
		font-family: var(--font-serif);
		font-size: 18px;
		font-weight: 400;
		letter-spacing: 0;
		color: var(--color-brass);
		text-transform: none;
	}

	.success__check {
		width: 64px;
		height: 64px;
		border: 2px solid var(--color-brass);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 32px;
		font-size: 24px;
		color: var(--color-brass);
	}

	.success__lead {
		font-family: var(--font-sans);
		font-size: 14px;
		color: rgba(245, 240, 232, 0.5);
		margin: 0 0 40px;
		line-height: 1.7;
	}

	.success__lead strong {
		color: var(--color-warm-white);
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 16px;
		margin-top: 40px;
		flex-wrap: wrap;
	}

	.actions--center {
		justify-content: center;
	}

	.btn {
		font-family: var(--font-sans);
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 12px;
		cursor: pointer;
		border-radius: 0;
		transition:
			background-color 200ms ease,
			color 200ms ease,
			border-color 200ms ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn--primary {
		padding: 14px 40px;
		background: var(--color-brass);
		border: none;
		color: var(--color-navy);
		font-weight: 700;
	}

	.btn--primary:hover:not(:disabled) {
		background: var(--color-brass-light);
	}

	.btn--primary:disabled {
		background: rgba(196, 146, 58, 0.25);
		color: rgba(13, 27, 46, 0.5);
		cursor: not-allowed;
	}

	.btn--ghost {
		padding: 14px 28px;
		background: none;
		border: 1px solid rgba(196, 146, 58, 0.3);
		color: rgba(245, 240, 232, 0.6);
	}

	.btn--ghost:hover:not(:disabled) {
		color: var(--color-warm-white);
		border-color: var(--color-brass);
	}

	.btn--ghost:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.book {
			padding: 100px 16px 60px;
		}

		.actions {
			flex-direction: column;
			align-items: stretch;
		}

		.btn {
			justify-content: center;
		}
	}
</style>
