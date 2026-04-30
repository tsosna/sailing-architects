<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { onMount } from 'svelte'
	import { useConvexClient } from 'convex-svelte'
	import {
		loadStripe,
		type Stripe,
		type StripeElements
	} from '@stripe/stripe-js'
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public'
	import { useQuery } from 'convex-svelte'
	import { BookingInput } from '$components/booking-input'
	import { BoatPlan } from '$components/boat-plan'
	import { StepIndicator } from '$components/step-indicator'
	import { findCabinByBerth } from '$lib/data/cabins'
	import { voyageSegments } from '$lib/data/voyage-segments'
	import {
		crewProfileSchema,
		getCrewProfileErrors,
		type CrewProfileData
	} from '$lib/schemas/crew-profile'
	import { SignIn, SignUp, useClerkContext } from 'svelte-clerk'
	import { api } from '$convex/api'

	const STEPS = [
		{ id: 1, label: 'Koje' },
		{ id: 2, label: 'Konto' },
		{ id: 3, label: 'Dane załogi opcjonalnie' },
		{ id: 4, label: 'Potwierdzenie' },
		{ id: 5, label: 'Płatność' },
		{ id: 6, label: 'Gotowe' }
	] as const

	const NATIONALITY_OPTIONS = [
		{ value: '', label: 'Wybierz...' },
		{ value: 'PL', label: 'Polska' },
		{ value: 'AT', label: 'Austria' },
		{ value: 'BE', label: 'Belgia' },
		{ value: 'HR', label: 'Chorwacja' },
		{ value: 'CZ', label: 'Czechy' },
		{ value: 'DK', label: 'Dania' },
		{ value: 'EE', label: 'Estonia' },
		{ value: 'FI', label: 'Finlandia' },
		{ value: 'FR', label: 'Francja' },
		{ value: 'DE', label: 'Niemcy' },
		{ value: 'GR', label: 'Grecja' },
		{ value: 'ES', label: 'Hiszpania' },
		{ value: 'NL', label: 'Holandia' },
		{ value: 'IE', label: 'Irlandia' },
		{ value: 'LT', label: 'Litwa' },
		{ value: 'LV', label: 'Łotwa' },
		{ value: 'NO', label: 'Norwegia' },
		{ value: 'PT', label: 'Portugalia' },
		{ value: 'SK', label: 'Słowacja' },
		{ value: 'SI', label: 'Słowenia' },
		{ value: 'SE', label: 'Szwecja' },
		{ value: 'HU', label: 'Węgry' },
		{ value: 'GB', label: 'Wielka Brytania' },
		{ value: 'IT', label: 'Włochy' },
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

	const initialSegmentParam = page.url.searchParams.get('segment')
	const initialBerthsParam = page.url.searchParams.get('berths')
	const initialAuthParam = page.url.searchParams.get('auth')
	const initialBerths = initialBerthsParam
		? initialBerthsParam
				.split(',')
				.map((b) => b.trim())
				.filter(Boolean)
		: []

	let selectedSegment = $state(initialSegmentParam ?? voyageSegments[0].id)
	let selectedBerths = $state(initialBerths)

	const segment = $derived(
		voyageSegments.find((s) => s.id === selectedSegment) ?? voyageSegments[0]
	)
	const berths = $derived(selectedBerths)
	const panelLoginMode = $derived(berths.length === 0)
	const berthDetails = $derived(
		berths.map((id) => ({ id, cabin: findCabinByBerth(id) }))
	)
	const totalPrice = $derived(segment.price * berths.length)
	const totalPriceFormatted = $derived(totalPrice.toLocaleString('pl-PL'))
	const pricePerBerthFormatted = $derived(segment.price.toLocaleString('pl-PL'))
	const selectedBerthsLabel = $derived(
		selectedBerths.length === 1 ? 'koję' : 'koje'
	)
	const selectionEyebrow = $derived(
		selectedBerths.length > 0
			? ['Wybrano', selectedBerths.length, selectedBerthsLabel].join(' ')
			: 'Wybór koi'
	)
	const selectionSummary = $derived(
		selectedBerths.length > 0
			? `${selectedBerths.join(', ')} · ${segment.name} · ${totalPriceFormatted} zł`
			: 'Wybierz koję na planie lub z listy, aby kontynuować.'
	)

	const statusQuery = useQuery(api.queries.berthStatusesBySlug, () => ({
		slug: selectedSegment
	}))
	const planQuery = useQuery(api.queries.activePaymentPlanBySlug, () => ({
		slug: selectedSegment
	}))
	type BerthStatus = 'held' | 'taken' | 'captain' | 'complimentary'
	const berthStatuses = $derived(
		new Map<string, BerthStatus>(
			(statusQuery.data ?? []).map(
				({ berthId, status }: { berthId: string; status: string }) => [
					berthId,
					status as BerthStatus
				]
			)
		)
	)

	let step = $state(
		initialAuthParam === 'signin' ||
			initialAuthParam === 'signup' ||
			initialBerths.length > 0
			? 2
			: 1
	)
	type AuthMode = 'signin' | 'signup'

	let selectedAuthMode = $state<AuthMode>('signin')
	const authParam = $derived(page.url.searchParams.get('auth'))
	const authMode = $derived(
		authParam === 'signin' || authParam === 'signup'
			? authParam
			: selectedAuthMode
	)

	function authUrl(mode: AuthMode): string {
		const params = new URLSearchParams(page.url.searchParams)
		params.set('auth', mode)
		const query = params.toString()
		return `${page.url.pathname}${query ? `?${query}` : ''}`
	}

	const signInUrl = $derived(authUrl('signin'))
	const signUpUrl = $derived(authUrl('signup'))

	function bookingUrl(): string {
		const params = new URLSearchParams(page.url.searchParams)
		params.set('segment', selectedSegment)
		params.delete('auth')

		if (selectedBerths.length > 0) {
			params.set('berths', selectedBerths.join(','))
		} else {
			params.delete('berths')
		}

		const query = params.toString()
		return `${page.url.pathname}${query ? `?${query}` : ''}`
	}

	const authRedirectUrl = $derived(bookingUrl())
	async function syncBookingUrl() {
		await goto(bookingUrl(), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		})
	}

	function selectSegment(id: string) {
		selectedSegment = id
		selectedBerths = []
	}

	function toggleBerth(id: string) {
		if (selectedBerths.includes(id)) {
			selectedBerths = selectedBerths.filter((b) => b !== id)
		} else {
			selectedBerths = [...selectedBerths, id]
		}
	}

	async function continueFromSelection() {
		if (selectedBerths.length === 0) return
		await syncBookingUrl()
		step = isSignedIn ? 3 : 2
	}

	async function setAuthMode(mode: AuthMode) {
		selectedAuthMode = mode
		await goto(authUrl(mode), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		})
	}

	function modeFromClerkLink(anchor: HTMLAnchorElement): AuthMode | null {
		const href = anchor.getAttribute('href')?.toLowerCase() ?? ''
		const label = anchor.textContent?.toLowerCase() ?? ''

		if (
			label.includes('zarejestruj') ||
			label.includes('utwórz') ||
			label.includes('sign up') ||
			label.includes('create account')
		) {
			return 'signup'
		}

		if (
			label.includes('zaloguj') ||
			label.includes('sign in') ||
			label.includes('log in')
		) {
			return 'signin'
		}

		if (href.includes('auth=signin') || href.includes('sign-in')) {
			return 'signin'
		}

		if (href.includes('auth=signup') || href.includes('sign-up')) {
			return 'signup'
		}

		return null
	}

	function handleClerkModeClick(event: MouseEvent) {
		if (!(event.target instanceof Element)) return

		const anchor = event.target.closest('a')
		if (!(anchor instanceof HTMLAnchorElement)) return

		const mode = modeFromClerkLink(anchor)
		if (!mode) return

		event.preventDefault()
		event.stopPropagation()
		void setAuthMode(mode)
	}

	$effect(() => {
		if (!page.url.hash.includes('auth=')) return
		void goto(authUrl(authMode), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		})
	})

	$effect(() => {
		if (!isSignedIn || step !== 2) return

		if (panelLoginMode && page.url.searchParams.get('next') === 'dashboard') {
			void goto(resolve('/dashboard'))
			return
		}

		if (!panelLoginMode) {
			if (!crew.email && userEmail) {
				crew.email = userEmail
			}
			step = 4
		}
	})

	let crew = $state({
		firstName: '',
		lastName: '',
		email: ctx.user?.primaryEmailAddress?.emailAddress ?? '',
		dob: '',
		birthPlace: '',
		nationality: '',
		phone: '',
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

	function validate():
		| { valid: true; data: CrewProfileData }
		| { valid: false; errors: Record<string, string> } {
		const result = crewProfileSchema.safeParse(crew)

		if (result.success) {
			return { valid: true, data: result.data }
		}

		return { valid: false, errors: getCrewProfileErrors(result.error) }
	}

	function clearError(field: CrewField) {
		if (errors[field]) {
			const { [field]: _, ...rest } = errors
			errors = rest
		}
	}

	// ── Payment plan + selection ────────────────────────────────────────
	type PaymentOption = {
		id: string
		label: string
		amount: number // grosze
		amountFormatted: string
		sortOrders: number[]
	}

	function formatGrosze(grosze: number): string {
		return (grosze / 100).toLocaleString('pl-PL', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})
	}

	const paymentOptions: PaymentOption[] = $derived.by(() => {
		const totalGrosze = segment.price * berths.length * 100
		const plan = planQuery.data
		if (!plan || !plan.items || plan.items.length === 0) {
			return [
				{
					id: 'full',
					label: 'Całość',
					amount: totalGrosze,
					amountFormatted: formatGrosze(totalGrosze),
					sortOrders: [1]
				}
			]
		}

		const items = [...plan.items].sort((a, b) => a.sortOrder - b.sortOrder)
		const options: PaymentOption[] = []
		const labels: string[] = []
		let cumulative = 0
		for (const item of items) {
			labels.push(item.label)
			cumulative += item.amountPerBerth * berths.length
			options.push({
				id: `prefix-${item.sortOrder}`,
				label: labels.join(' + '),
				amount: cumulative,
				amountFormatted: formatGrosze(cumulative),
				sortOrders: items
					.filter((it) => it.sortOrder <= item.sortOrder)
					.map((it) => it.sortOrder)
			})
		}

		if (cumulative !== totalGrosze) {
			const allOrders = items.map((it) => it.sortOrder)
			allOrders.push(items.length + 1)
			labels.push('Dopłata końcowa')
			options.push({
				id: 'prefix-balance',
				label: labels.join(' + '),
				amount: totalGrosze,
				amountFormatted: formatGrosze(totalGrosze),
				sortOrders: allOrders
			})
		}

		if (plan.allowFullPayment) {
			options.push({
				id: 'full',
				label: 'Całość',
				amount: totalGrosze,
				amountFormatted: formatGrosze(totalGrosze),
				sortOrders: [0]
			})
		}

		return options
	})

	let selectedPaymentOptionId = $state<string | null>(null)
	const selectedPaymentOption = $derived<PaymentOption | null>(
		paymentOptions.find((o) => o.id === selectedPaymentOptionId) ??
			paymentOptions[0] ??
			null
	)

	// ── Stripe state ─────────────────────────────────────────────────────
	let stripeInstance = $state<Stripe | null>(null)
	let stripeElements = $state<StripeElements | null>(null)
	let paymentMountRef = $state<HTMLElement | null>(null)
	let clientSecret = $state<string | null>(null)
	let createdBookingRef = $state<string | null>(null)
	const confirmationPdfUrl = $derived(
		createdBookingRef && ctx.auth.userId
			? resolve(
					`/api/booking-confirmation/${encodeURIComponent(createdBookingRef)}?userId=${encodeURIComponent(ctx.auth.userId)}`
				)
			: null
	)
	let holdExpiresAt = $state<number | null>(null)
	let now = $state(Date.now())
	let intentLoading = $state(false)
	let intentError = $state<string | null>(null)
	let paymentLoading = $state(false)
	let paymentError = $state<string | null>(null)
	const holdRemainingMs = $derived(
		holdExpiresAt ? Math.max(0, holdExpiresAt - now) : null
	)
	const holdExpired = $derived(holdRemainingMs !== null && holdRemainingMs <= 0)
	const holdRemainingLabel = $derived(
		holdRemainingMs === null ? '' : formatRemaining(holdRemainingMs)
	)

	function formatRemaining(ms: number): string {
		const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
		const minutes = Math.floor(totalSeconds / 60)
		const seconds = totalSeconds % 60
		return `${minutes}:${String(seconds).padStart(2, '0')}`
	}

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

	onMount(() => {
		now = Date.now()
		const interval = window.setInterval(() => {
			now = Date.now()
		}, 1000)

		return () => {
			window.clearInterval(interval)
		}
	})

	/** Initiate Stripe PaymentIntent for the chosen payment option. */
	async function initiatePayment() {
		if (clientSecret || intentLoading) return
		const option = selectedPaymentOption
		if (!option) {
			intentError = 'Wybierz, ile chcesz zapłacić teraz'
			return
		}

		intentLoading = true
		intentError = null
		const controller = new AbortController()
		const timeout = window.setTimeout(() => {
			controller.abort()
		}, 20000)

		try {
			const response = await fetch('/api/stripe/create-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				signal: controller.signal,
				body: JSON.stringify({
					segmentSlug: segment.id,
					berthIds: berths,
					userId: ctx.auth.userId,
					buyerEmail: userEmail || undefined,
					selectedSortOrders: option.sortOrders
				})
			})
			if (!response.ok) {
				throw await paymentIntentError(response)
			}
			const {
				clientSecret: cs,
				bookingRef,
				holdExpiresAt: expiresAt
			} = await response.json()
			clientSecret = cs
			createdBookingRef = bookingRef
			holdExpiresAt = expiresAt
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
		if (!stripeInstance || !stripeElements || holdExpired) return
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
			step = 6
			paymentLoading = false
		}
	}

	async function next() {
		if (step === 1) {
			await continueFromSelection()
			return
		}

		if (step === 2) {
			if (!isSignedIn) return
			if (panelLoginMode) {
				await goto(resolve('/dashboard'))
				return
			}
			if (!crew.email && userEmail) {
				crew.email = userEmail
			}
			step = 4
			return
		}

		if (step === 3) {
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
					firstName: result.data.firstName,
					lastName: result.data.lastName,
					email: result.data.email,
					dateOfBirth: result.data.dob,
					birthPlace: result.data.birthPlace,
					nationality: result.data.nationality,
					phone: result.data.phone,
					docType: result.data.docType,
					docNumber: result.data.docNumber,
					emergencyContactName: result.data.emergencyName,
					emergencyContactPhone: result.data.emergencyPhone,
					swimmingAbility: result.data.swimming,
					sailingExperience: result.data.experience,
					dietaryRequirements: result.data.diet || undefined,
					medicalNotes: result.data.medical || undefined
				})
				step = 4
			} catch (err) {
				saveError = err instanceof Error ? err.message : 'Błąd zapisu danych'
			} finally {
				savingProfile = false
			}
			return
		}

		step = Math.min(step + 1, 6)
	}

	function back() {
		if (step === 2 && panelLoginMode) {
			void goto(resolve('/'))
			return
		}

		if (step === 3 && isSignedIn) {
			step = 4
			return
		}

		if (step === 4 && isSignedIn && !panelLoginMode) {
			step = 2
			return
		}

		if (step > 1) step--
	}

	function openCrewStep() {
		if (!crew.email && userEmail) {
			crew.email = userEmail
		}
		step = 3
	}

	function skipCrewStep() {
		errors = {}
		saveError = null
		step = 4
	}

	const confirmRows = $derived([
		['Etap', segment.name],
		['Termin', segment.dates],
		['Czas trwania', `${segment.days} dni`],
		[
			berths.length === 1 ? 'Koja' : 'Koje',
			berthDetails
				.map((d) => `${d.id} — ${d.cabin?.label ?? 'Kabina'}`)
				.join(', ')
		],
		['Liczba miejsc', String(berths.length)],
		['Cena za miejsce', `${pricePerBerthFormatted} zł`],
		['Razem', `${totalPriceFormatted} zł`]
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
			<section class="step step--selection">
				<p class="eyebrow">Krok 1</p>
				<h2 class="title">Wybierz koję</h2>
				<p class="lead">
					Najpierw wybierz etap i miejsce na planie jachtu. Logowanie pojawi się
					dopiero po kliknięciu „Kontynuuj rezerwację”.
				</p>

				<div
					class="booking-segments"
					role="tablist"
					aria-label="Wybierz etap rejsu"
				>
					{#each voyageSegments as seg (seg.id)}
						<button
							type="button"
							role="tab"
							aria-selected={selectedSegment === seg.id}
							class="booking-segments__btn"
							class:booking-segments__btn--active={selectedSegment === seg.id}
							onclick={() => selectSegment(seg.id)}
						>
							<span class="booking-segments__dates">{seg.dates}</span>
							<span class="booking-segments__name">{seg.name}</span>
							<span class="booking-segments__price"
								>{seg.price.toLocaleString('pl-PL')} zł</span
							>
						</button>
					{/each}
				</div>

				<BoatPlan
					{selectedBerths}
					{berthStatuses}
					onToggleBerth={toggleBerth}
				/>

				<div
					class="selection-banner"
					class:selection-banner--empty={selectedBerths.length === 0}
					aria-live="polite"
				>
					<div class="selection-banner__copy">
						<p class="selection-banner__eyebrow">{selectionEyebrow}</p>
						<p class="selection-banner__title">{selectionSummary}</p>
					</div>
					<button
						type="button"
						class="selection-banner__cta"
						disabled={selectedBerths.length === 0}
						onclick={continueFromSelection}
					>
						{selectedBerths.length > 0
							? 'Kontynuuj rezerwację →'
							: 'Wybierz koję'}
					</button>
				</div>
			</section>
		{/if}

		{#if step === 2}
			<section class="step step--auth">
				<p class="eyebrow">Booking-first</p>
				<h2 class="title">Rezerwacja jako manifest pokładowy</h2>
				<p class="lead lead--auth">
					Zachowujesz kontekst etapu, koi i kontaktu do organizatora podczas
					logowania.
				</p>

				<div class="auth-layout">
					<aside class="auth-summary" aria-label="Szczegóły rezerwacji">
						<p class="auth-summary__eyebrow">
							{panelLoginMode ? 'Panel użytkownika' : 'Rezerwujesz'}
						</p>
						<p class="auth-summary__title">
							{panelLoginMode ? 'Wejdź do panelu' : 'Sail Adventure 2026'}
						</p>
						<dl class="auth-summary__rows">
							<div>
								<dt>Etap</dt>
								<dd>{panelLoginMode ? 'Po zalogowaniu' : segment.name}</dd>
							</div>
							<div>
								<dt>Termin</dt>
								<dd>{panelLoginMode ? 'Twoje rezerwacje' : segment.dates}</dd>
							</div>
							{#if !panelLoginMode}
								<div>
									<dt>{berths.length === 1 ? 'Koja' : 'Koje'}</dt>
									<dd>{berths.join(', ')}</dd>
								</div>
								<div>
									<dt>Razem</dt>
									<dd>{totalPriceFormatted} zł</dd>
								</div>
							{/if}
						</dl>
						<div class="auth-contact">
							<p>Kontakt do organizatora</p>
							<strong>Michał</strong>
							<a href="tel:+48601671182">+48 601 671 182</a>
							<a href="mailto:sailingarchitects@gmail.com"
								>sailingarchitects@gmail.com</a
							>
						</div>
						<p class="auth-note">
							Cena nie zawiera: kosztów dojazdu do mariny, opłat portowych i
							paliwa (ok. 150–200 EUR/os), ubezpieczenia turystycznego (ok. 250
							zł/os).
						</p>
					</aside>

					<div class="auth-panel">
						<div class="auth-panel__intro">
							<p class="auth-panel__eyebrow">Krok 2</p>
							<h3>
								{panelLoginMode ? 'Zaloguj się do panelu' : 'Wejdź na pokład'}
							</h3>
							<p>
								{panelLoginMode
									? 'Po zalogowaniu przejdziesz do swoich rezerwacji i danych załogi.'
									: 'Konto załogi zabezpiecza dane rezerwacji i płatności.'}
							</p>
						</div>
						{#if isSignedIn}
							<div class="signed-in" role="status">
								<p class="signed-in__eyebrow">Sesja aktywna</p>
								<p class="signed-in__title">Zalogowano jako {userEmail}</p>
								<p class="signed-in__hint">
									{panelLoginMode
										? 'Możesz przejść do panelu.'
										: 'Możesz przejść dalej.'}
								</p>
							</div>
						{:else}
							<div class="auth-tabs" role="tablist">
								<button
									type="button"
									role="tab"
									aria-selected={authMode === 'signin'}
									class="auth-tab"
									class:auth-tab--active={authMode === 'signin'}
									onclick={() => void setAuthMode('signin')}
								>
									Logowanie
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={authMode === 'signup'}
									class="auth-tab"
									class:auth-tab--active={authMode === 'signup'}
									onclick={() => void setAuthMode('signup')}
								>
									Rejestracja
								</button>
							</div>

							<div class="clerk-host" onclickcapture={handleClerkModeClick}>
								{#key authMode}
									{#if authMode === 'signin'}
										<SignIn
											{signUpUrl}
											forceRedirectUrl={authRedirectUrl}
											fallbackRedirectUrl={authRedirectUrl}
											signUpForceRedirectUrl={authRedirectUrl}
											signUpFallbackRedirectUrl={authRedirectUrl}
										/>
									{:else}
										<SignUp
											{signInUrl}
											forceRedirectUrl={authRedirectUrl}
											fallbackRedirectUrl={authRedirectUrl}
											signInForceRedirectUrl={authRedirectUrl}
											signInFallbackRedirectUrl={authRedirectUrl}
										/>
									{/if}
								{/key}
							</div>
						{/if}

						<div class="actions">
							<button
								type="button"
								class="btn btn--primary"
								disabled={!isSignedIn}
								onclick={next}
								>{panelLoginMode ? 'Przejdź do panelu →' : 'Dalej →'}</button
							>
						</div>
					</div>
				</div>
			</section>
		{/if}

		{#if step === 3}
			<section class="step">
				<p class="eyebrow">Krok 3</p>
				<h2 class="title">Dane załogi</h2>
				<p class="lead">
					Możesz uzupełnić je teraz albo wrócić do nich po płatności w panelu.
					Na tym etapie zapisujemy dane kontaktowe konta załogi.
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
						label="E-mail żeglarza"
						type="email"
						bind:value={crew.email}
						required
						placeholder="adres@email.pl"
						autocomplete="email"
						error={errors.email}
						oninput={() => clearError('email')}
					/>
					<BookingInput
						label="Data urodzenia"
						bind:value={crew.dob}
						required
						placeholder="dd/mm/yyyy"
						inputmode="numeric"
						autocomplete="bday"
						maxlength={10}
						error={errors.dob}
						oninput={() => clearError('dob')}
					/>
					<BookingInput
						label="Miejsce urodzenia"
						bind:value={crew.birthPlace}
						required
						placeholder="Miasto"
						autocomplete="off"
						error={errors.birthPlace}
						oninput={() => clearError('birthPlace')}
					/>
					<BookingInput
						label="Narodowość"
						bind:value={crew.nationality}
						required
						options={NATIONALITY_OPTIONS}
						error={errors.nationality}
						oninput={() => clearError('nationality')}
					/>
					<BookingInput
						label="Telefon żeglarza"
						type="tel"
						bind:value={crew.phone}
						required
						placeholder="+48 600 000 000"
						autocomplete="tel"
						error={errors.phone}
						oninput={() => clearError('phone')}
					/>

					<div class="form__divider">
						<p class="form__divider-label">Dokument tożsamości</p>
					</div>

					<BookingInput
						label="Typ dokumentu"
						bind:value={crew.docType}
						options={DOC_TYPE_OPTIONS}
						oninput={() => clearError('docNumber')}
					/>
					<BookingInput
						label="Numer dokumentu"
						bind:value={crew.docNumber}
						required
						placeholder={crew.docType === 'id' && crew.nationality === 'PL'
							? 'ABC123456'
							: 'Litery i cyfry'}
						autocomplete="off"
						maxlength={15}
						hint="Bez spacji i znaków specjalnych"
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
					<button type="button" class="btn btn--ghost" onclick={skipCrewStep}
						>Uzupełnię później</button
					>
					<button
						type="button"
						class="btn btn--primary"
						disabled={savingProfile}
						onclick={next}
					>
						{savingProfile ? 'Zapisywanie…' : 'Zapisz i wróć →'}
					</button>
				</div>
			</section>
		{/if}

		{#if step === 4}
			<section class="step">
				<p class="eyebrow">Krok 4</p>
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
				</div>

				<div class="crew-reminder">
					<p class="crew-reminder__title">
						Dane żeglarzy możesz uzupełnić po płatności.
					</p>
					<p class="crew-reminder__copy">
						Dla każdej wybranej koi utworzymy osobną kartę uczestnika w panelu.
					</p>
					<button type="button" class="btn btn--ghost" onclick={openCrewStep}>
						Uzupełnij teraz
					</button>
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

		{#if step === 5}
			<section class="step">
				<p class="eyebrow">Krok 5</p>
				<h2 class="title">Płatność</h2>

				<div class="pay">
					<div class="pay__form">
						<div class="pay__notice">
							🔒 Płatność obsługiwana przez Stripe. Twoje dane są bezpieczne.
						</div>

						{#if !clientSecret}
							<fieldset class="pay-options">
								<legend class="pay-options__legend">Co płacisz teraz?</legend>
								{#each paymentOptions as option (option.id)}
									<label class="pay-options__row">
										<input
											type="radio"
											name="payment-option"
											value={option.id}
											checked={selectedPaymentOption?.id === option.id}
											onchange={() => (selectedPaymentOptionId = option.id)}
											disabled={intentLoading}
										/>
										<span class="pay-options__label">{option.label}</span>
										<span class="pay-options__amount"
											>{option.amountFormatted} zł</span
										>
									</label>
								{/each}
							</fieldset>
						{/if}

						{#if holdRemainingMs !== null}
							<div
								class="pay__hold"
								class:pay__hold--expired={holdExpired}
								role="status"
								aria-live="polite"
							>
								<span class="pay__hold-label">
									{holdExpired
										? 'Blokada miejsc wygasła'
										: 'Miejsca zablokowane na'}
								</span>
								<strong>{holdRemainingLabel}</strong>
							</div>
						{/if}

						{#if intentError}
							<p class="error-msg" role="alert">{intentError}</p>
						{:else if holdExpired}
							<p class="error-msg" role="alert">
								Czas blokady minął. Wróć do wyboru koi i rozpocznij płatność od
								nowa.
							</p>
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
							{#each berths as b (b)}
								<div class="pay__summary-row">
									<span>Koja {b}</span>
									<span>{pricePerBerthFormatted} zł</span>
								</div>
							{/each}
							<div class="pay__summary-row pay__summary-row--total">
								<span>Razem</span>
								<span>{totalPriceFormatted} zł</span>
							</div>
							{#if selectedPaymentOption && selectedPaymentOption.amount !== totalPrice * 100}
								<div class="pay__summary-row pay__summary-row--installment">
									<span>Teraz</span>
									<span>{selectedPaymentOption.amountFormatted} zł</span>
								</div>
							{/if}
						</div>
					</aside>
				</div>

				<div class="actions">
					<button
						type="button"
						class="btn btn--ghost"
						onclick={back}
						disabled={paymentLoading || intentLoading}
					>
						← Wróć
					</button>
					{#if !clientSecret}
						<button
							type="button"
							class="btn btn--primary"
							disabled={intentLoading || !selectedPaymentOption}
							onclick={initiatePayment}
						>
							{intentLoading
								? 'Inicjalizacja…'
								: `Zapłać ${selectedPaymentOption?.amountFormatted ?? ''} zł →`}
						</button>
					{:else}
						<button
							type="button"
							class="btn btn--primary"
							disabled={paymentLoading ||
								!!intentError ||
								holdExpired ||
								!stripeElements}
							onclick={submitPayment}
						>
							{paymentLoading
								? 'Przetwarzanie…'
								: `Potwierdź ${selectedPaymentOption?.amountFormatted ?? ''} zł →`}
						</button>
					{/if}
				</div>
			</section>
		{/if}

		{#if step === 6}
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
					{berths.length === 1 ? 'Koja' : 'Koje'}
					<strong>{berths.join(', ')}</strong>
					na etapie
					<strong>{segment.name}</strong>
					({segment.dates})
					{berths.length === 1 ? 'jest Twoja' : 'są Twoje'}. Potwierdzenie
					zostanie wysłane e-mailem po zaksięgowaniu płatności.
				</p>
				<div class="actions actions--center">
					<a class="btn btn--primary" href={resolve('/dashboard')}>Mój panel</a>
					{#if confirmationPdfUrl}
						<a class="btn btn--ghost" href={confirmationPdfUrl}>↓ Pobierz PDF</a
						>
					{:else}
						<button type="button" class="btn btn--ghost" disabled
							>↓ Pobierz PDF</button
						>
					{/if}
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
		max-width: 920px;
		margin: 0 auto;
	}

	.book__back {
		background: none;
		border: none;
		color: var(--color-brass-text-soft);
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
		color: var(--color-brass-text);
	}

	.step {
		min-height: 320px;
	}

	.step--auth {
		max-width: 920px;
	}

	.step--selection {
		max-width: 1100px;
		margin: 0 auto;
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
		color: var(--color-brass-light);
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

	.step--auth .title {
		margin-bottom: 24px;
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

	.lead--auth {
		margin: -12px 0 28px;
		color: rgba(245, 240, 232, 0.64);
	}

	.booking-segments {
		display: flex;
		gap: 1px;
		margin-bottom: 48px;
		background: rgba(196, 146, 58, 0.1);
		flex-wrap: wrap;
	}

	.booking-segments__btn {
		flex: 1;
		min-width: 160px;
		padding: 16px 20px;
		background: var(--color-navy);
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 4px;
		transition:
			background-color 150ms ease,
			border-color 150ms ease;
	}

	.booking-segments__btn--active {
		background: rgba(196, 146, 58, 0.12);
		border-bottom-color: var(--color-brass);
	}

	.booking-segments__dates {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
	}

	.booking-segments__btn--active .booking-segments__dates {
		color: var(--color-brass-text);
	}

	.booking-segments__name {
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		color: rgba(245, 240, 232, 0.4);
	}

	.booking-segments__btn--active .booking-segments__name {
		color: var(--color-warm-white);
	}

	.booking-segments__price {
		font-family: var(--font-serif);
		font-size: 18px;
		color: var(--color-brass-text-soft);
	}

	.booking-segments__btn--active .booking-segments__price {
		color: var(--color-brass-text);
	}

	.selection-banner {
		margin-top: 48px;
		display: flex;
		align-items: center;
		gap: 24px;
		flex-wrap: wrap;
	}

	.selection-banner__copy {
		flex: 1;
		min-width: 240px;
		padding: 20px 24px;
		background: rgba(196, 146, 58, 0.07);
		border: 1px solid rgba(196, 146, 58, 0.25);
	}

	.selection-banner--empty .selection-banner__copy {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(196, 146, 58, 0.16);
	}

	.selection-banner__eyebrow {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0 0 4px;
	}

	.selection-banner__title {
		font-family: var(--font-serif);
		font-size: 20px;
		color: var(--color-warm-white);
		margin: 0;
	}

	.selection-banner--empty .selection-banner__title {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.6;
		color: rgba(245, 240, 232, 0.52);
	}

	.selection-banner__cta {
		padding: 18px 42px;
		background: var(--color-brass);
		border: none;
		color: var(--color-navy);
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 13px;
		letter-spacing: 2px;
		text-transform: uppercase;
		cursor: pointer;
		border-radius: 0;
		white-space: nowrap;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		transition:
			background-color 200ms ease,
			opacity 200ms ease;
	}

	.selection-banner__cta:hover:not(:disabled) {
		background: var(--color-brass-light);
	}

	.selection-banner__cta:disabled {
		cursor: not-allowed;
		opacity: 0.48;
	}

	.signed-in {
		padding: 20px 24px;
		background: rgba(196, 146, 58, 0.08);
		border: 1px solid rgba(196, 146, 58, 0.25);
		margin-bottom: 0;
	}

	.signed-in__eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-light);
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
		margin-bottom: 24px;
		border-bottom: 1px solid rgba(196, 146, 58, 0.22);
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
		color: var(--color-brass-light);
		border-bottom-color: var(--color-brass);
	}

	.auth-layout {
		display: grid;
		grid-template-columns: minmax(280px, 0.72fr) minmax(360px, 1fr);
		gap: 1px;
		background: rgba(196, 146, 58, 0.18);
		max-width: 920px;
	}

	.auth-summary,
	.auth-panel {
		background: var(--color-navy-mid);
	}

	.auth-summary {
		padding: 34px;
		border-left: 3px solid var(--color-brass);
	}

	.auth-summary__eyebrow,
	.auth-contact p {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-light);
		margin: 0 0 10px;
	}

	.auth-summary__title {
		font-family: var(--font-serif);
		font-size: 34px;
		line-height: 1.2;
		color: var(--color-warm-white);
		margin: 0 0 28px;
	}

	.auth-summary__rows {
		display: grid;
		gap: 1px;
		background: rgba(196, 146, 58, 0.16);
		margin: 0 0 28px;
	}

	.auth-summary__rows div {
		display: grid;
		grid-template-columns: 92px 1fr;
		gap: 12px;
		background: var(--color-navy);
		padding: 12px 14px;
	}

	.auth-summary__rows dt {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: rgba(245, 240, 232, 0.58);
	}

	.auth-summary__rows dd {
		font-family: var(--font-sans);
		font-size: 13px;
		color: var(--color-warm-white);
		margin: 0;
		text-align: right;
	}

	.auth-contact {
		background: var(--color-navy-deep);
		border-top: 1px solid rgba(196, 146, 58, 0.18);
		border-left: 3px solid var(--color-brass);
		padding: 18px;
		font-family: var(--font-sans);
	}

	.auth-contact strong {
		display: block;
		font-size: 16px;
		color: var(--color-warm-white);
		margin-bottom: 10px;
	}

	.auth-contact a {
		display: table;
		color: rgba(245, 240, 232, 0.86);
		font-size: 13px;
		line-height: 1.6;
		text-decoration: none;
		border-bottom: 1px solid rgba(196, 146, 58, 0.35);
		transition:
			color 200ms ease,
			border-color 200ms ease;
	}

	.auth-contact a + a {
		margin-top: 6px;
	}

	.auth-contact a:hover {
		color: var(--color-brass-light);
		border-bottom-color: var(--color-brass-light);
	}

	.auth-note {
		font-family: var(--font-sans);
		font-size: 11px;
		line-height: 1.55;
		color: rgba(245, 240, 232, 0.48);
		margin: 12px 0 0;
		padding-left: 14px;
		border-left: 1px solid rgba(196, 146, 58, 0.28);
	}

	.auth-panel {
		padding: 34px;
		border-top: 3px solid var(--color-brass);
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
	}

	.auth-panel__intro {
		margin-bottom: 24px;
	}

	.auth-panel__eyebrow {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-light);
		margin: 0 0 8px;
	}

	.auth-panel__intro h3 {
		font-family: var(--font-serif);
		font-size: 34px;
		font-weight: 400;
		color: var(--color-warm-white);
		margin: 0 0 8px;
	}

	.auth-panel__intro p:last-child {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.6;
		color: rgba(245, 240, 232, 0.62);
		margin: 0;
	}

	.clerk-host {
		margin-bottom: 8px;
	}

	.clerk-host :global(.cl-rootBox) {
		width: 100%;
	}

	.clerk-host :global(.cl-card) {
		width: 100%;
		background: var(--color-navy-deep);
		border: 1px solid rgba(212, 170, 90, 0.46);
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26);
	}

	.clerk-host :global(.cl-headerTitle) {
		color: var(--color-warm-white);
	}

	.clerk-host :global(.cl-headerSubtitle),
	.clerk-host :global(.cl-footerActionText) {
		color: rgba(245, 240, 232, 0.7);
	}

	.clerk-host :global(.cl-socialButtonsBlockButton) {
		min-height: 54px;
		min-width: 54px;
		background: rgba(245, 240, 232, 0.08);
		border-color: rgba(212, 170, 90, 0.32);
		color: var(--color-warm-white);
		transition:
			background-color 180ms ease,
			border-color 180ms ease;
	}

	.clerk-host :global(.cl-socialButtonsIconButton),
	.clerk-host :global(button[aria-label*='Facebook']),
	.clerk-host :global(button[aria-label*='GitHub']),
	.clerk-host :global(button[aria-label*='Github']),
	.clerk-host :global(button[aria-label*='Google']) {
		width: 74px !important;
		height: 54px !important;
		min-width: 74px !important;
		min-height: 54px !important;
		background: rgba(245, 240, 232, 0.08) !important;
		border: 1px solid rgba(212, 170, 90, 0.32) !important;
		color: var(--color-warm-white) !important;
	}

	.clerk-host :global(.cl-socialButtonsBlockButton:hover) {
		background: rgba(245, 240, 232, 0.12);
		border-color: rgba(212, 170, 90, 0.46);
	}

	.clerk-host :global(.cl-socialButtonsIconButton:hover),
	.clerk-host :global(button[aria-label*='Facebook']:hover),
	.clerk-host :global(button[aria-label*='GitHub']:hover),
	.clerk-host :global(button[aria-label*='Github']:hover),
	.clerk-host :global(button[aria-label*='Google']:hover) {
		background: rgba(245, 240, 232, 0.12) !important;
		border-color: rgba(212, 170, 90, 0.54) !important;
	}

	.clerk-host :global(.cl-socialButtonsBlockButton svg),
	.clerk-host :global(.cl-socialButtonsIconButton svg),
	.clerk-host :global(.cl-socialButtonsProviderIcon),
	.clerk-host :global(button[aria-label*='Facebook'] svg),
	.clerk-host :global(button[aria-label*='GitHub'] svg),
	.clerk-host :global(button[aria-label*='Github'] svg),
	.clerk-host :global(button[aria-label*='Google'] svg),
	.clerk-host :global(button[aria-label*='Facebook'] img),
	.clerk-host :global(button[aria-label*='GitHub'] img),
	.clerk-host :global(button[aria-label*='Github'] img),
	.clerk-host :global(button[aria-label*='Google'] img) {
		width: 26px !important;
		height: 26px !important;
	}

	.clerk-host :global(button[aria-label*='GitHub'] svg),
	.clerk-host :global(button[aria-label*='Github'] svg) {
		color: var(--color-warm-white) !important;
		fill: currentColor !important;
	}

	.clerk-host :global(button[aria-label*='GitHub'] svg *),
	.clerk-host :global(button[aria-label*='Github'] svg *) {
		fill: currentColor !important;
	}

	.clerk-host :global(.cl-dividerText) {
		color: rgba(245, 240, 232, 0.56);
	}

	.clerk-host :global(.cl-formFieldLabel) {
		color: var(--color-brass-text);
		font-size: 12px;
		font-weight: 600;
	}

	.clerk-host :global(.cl-formFieldInput) {
		background: var(--color-navy-light);
		border-color: rgba(212, 170, 90, 0.46);
		color: var(--color-warm-white);
		font-size: 14px;
	}

	.clerk-host :global(.cl-formFieldInput::placeholder) {
		color: rgba(245, 240, 232, 0.42);
	}

	.clerk-host :global(.cl-formFieldInput:focus) {
		border-color: var(--color-brass-text);
		box-shadow: 0 0 0 1px rgba(212, 170, 90, 0.36);
	}

	.clerk-host :global(.cl-formButtonPrimary) {
		color: var(--color-navy-deep);
		font-weight: 700;
	}

	.auth-panel .actions {
		margin-top: 28px;
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
		color: var(--color-brass-text-soft);
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
		color: var(--color-brass-text);
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

	.crew-reminder {
		max-width: 480px;
		margin-top: 16px;
		padding: 20px 24px;
		border: 1px solid rgba(196, 146, 58, 0.18);
		background: rgba(245, 240, 232, 0.04);
	}

	.crew-reminder__title {
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 600;
		color: var(--color-warm-white);
		margin: 0 0 6px;
	}

	.crew-reminder__copy {
		font-family: var(--font-sans);
		font-size: 13px;
		line-height: 1.6;
		color: rgba(245, 240, 232, 0.64);
		margin: 0 0 16px;
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

	.pay__hold {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 16px;
		background: rgba(196, 146, 58, 0.1);
		border: 1px solid rgba(196, 146, 58, 0.32);
		font-family: var(--font-sans);
	}

	.pay__hold-label {
		font-size: 11px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: rgba(245, 240, 232, 0.55);
	}

	.pay__hold strong {
		font-family: var(--font-serif);
		font-size: 28px;
		font-weight: 400;
		color: var(--color-brass-text);
		font-variant-numeric: tabular-nums;
	}

	.pay__hold--expired {
		background: rgba(239, 68, 68, 0.08);
		border-color: rgba(239, 68, 68, 0.28);
	}

	.pay__hold--expired strong {
		color: #ef4444;
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
		color: var(--color-brass-text);
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
		color: var(--color-brass-text);
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
		color: var(--color-brass-text);
	}

	.pay__summary-row--total > span:last-child {
		font-family: var(--font-serif);
		font-size: 18px;
		font-weight: 400;
		letter-spacing: 0;
		color: var(--color-brass-text);
		text-transform: none;
	}

	.pay__summary-row--installment {
		border-top: 1px dashed rgba(196, 146, 58, 0.25);
		padding-top: 12px;
		margin-top: 4px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--color-brass);
	}

	.pay__summary-row--installment > span:last-child {
		font-family: var(--font-serif);
		font-size: 18px;
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
	}

	.pay-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		border: 1px solid rgba(196, 146, 58, 0.18);
		padding: 16px;
		margin: 0 0 16px;
	}

	.pay-options__legend {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--color-brass-text);
		padding: 0 6px;
	}

	.pay-options__row {
		display: grid;
		grid-template-columns: 20px 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 10px 8px;
		cursor: pointer;
		font-size: 14px;
	}

	.pay-options__row:hover {
		background: rgba(196, 146, 58, 0.06);
	}

	.pay-options__row input[type='radio'] {
		accent-color: var(--color-brass);
		cursor: pointer;
	}

	.pay-options__label {
		color: var(--color-warm-white);
	}

	.pay-options__amount {
		font-family: var(--font-serif);
		font-size: 16px;
		color: var(--color-brass-text);
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
		color: var(--color-brass-text);
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

		.auth-layout {
			grid-template-columns: 1fr;
		}

		.auth-summary,
		.auth-panel {
			padding: 22px;
		}

		.auth-summary__rows div {
			grid-template-columns: 1fr;
			gap: 4px;
		}

		.auth-summary__rows dd {
			text-align: left;
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
