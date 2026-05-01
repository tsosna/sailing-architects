<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { useConvexClient, useQuery } from 'convex-svelte'
	import { useClerkContext } from 'svelte-clerk'
	import { BookingInput } from '$components/booking-input'
	import {
		crewProfileSchema,
		getCrewProfileErrors,
		type CrewProfileData
	} from '$lib/schemas/crew-profile'
	import { api } from '$convex/api'

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
	const userId = $derived(ctx.auth.userId ?? '')
	const participantId = $derived(page.params.participantId ?? '')

	const bookingQuery = useQuery(api.queries.bookingByUser, () => ({ userId }))
	const profileQuery = useQuery(api.queries.crewProfileByUser, () => ({
		userId
	}))
	const bookingData = $derived(bookingQuery.data)
	const participant = $derived(
		bookingData?.participants.find((p) => p._id === participantId) ?? null
	)
	const legacyProfile = $derived(profileQuery.data)

	const convex = useConvexClient()

	let crew = $state({
		firstName: '',
		lastName: '',
		email: '',
		dob: '',
		birthPlace: '',
		nationality: '',
		phone: '',
		docType: 'passport' as 'passport' | 'id',
		docNumber: '',
		emergencyName: '',
		emergencyPhone: '',
		swimming: '',
		experience: '',
		diet: '',
		medical: ''
	})
	let invitedEmail = $state('')

	let hydrated = $state(false)
	$effect(() => {
		if (hydrated || !participant) return
		crew = {
			firstName: participant.firstName ?? '',
			lastName: participant.lastName ?? '',
			email: participant.email ?? '',
			dob: participant.dateOfBirth ?? '',
			birthPlace: participant.birthPlace ?? '',
			nationality: participant.nationality ?? '',
			phone: participant.phone ?? '',
			docType: (participant.docType ?? 'passport') as 'passport' | 'id',
			docNumber: participant.docNumber ?? '',
			emergencyName: participant.emergencyContactName ?? '',
			emergencyPhone: participant.emergencyContactPhone ?? '',
			swimming: participant.swimmingAbility ?? '',
			experience: participant.sailingExperience ?? '',
			diet: participant.dietaryRequirements ?? '',
			medical: participant.medicalNotes ?? ''
		}
		invitedEmail = participant.invitedEmail ?? ''
		hydrated = true
	})

	let errors = $state<Record<string, string>>({})
	let saving = $state(false)
	let saveError = $state<string | null>(null)
	let saved = $state(false)

	type CrewField = keyof typeof crew

	function clearError(field: CrewField | 'invitedEmail') {
		if (errors[field]) {
			const { [field]: _, ...rest } = errors
			errors = rest
		}
	}

	function validate():
		| { valid: true; data: CrewProfileData }
		| { valid: false; errors: Record<string, string> } {
		const result = crewProfileSchema.safeParse(crew)
		if (result.success) return { valid: true, data: result.data }
		return { valid: false, errors: getCrewProfileErrors(result.error) }
	}

	function copyFromAccount() {
		if (!legacyProfile) return
		crew = {
			...crew,
			firstName: legacyProfile.firstName ?? crew.firstName,
			lastName: legacyProfile.lastName ?? crew.lastName,
			email: legacyProfile.email ?? crew.email,
			dob: legacyProfile.dateOfBirth ?? crew.dob,
			birthPlace: legacyProfile.birthPlace ?? crew.birthPlace,
			nationality: legacyProfile.nationality ?? crew.nationality,
			phone: legacyProfile.phone ?? crew.phone,
			docType: (legacyProfile.docType ?? crew.docType) as 'passport' | 'id',
			docNumber: legacyProfile.docNumber ?? crew.docNumber,
			emergencyName: legacyProfile.emergencyContactName ?? crew.emergencyName,
			emergencyPhone:
				legacyProfile.emergencyContactPhone ?? crew.emergencyPhone,
			swimming: legacyProfile.swimmingAbility ?? crew.swimming,
			experience: legacyProfile.sailingExperience ?? crew.experience,
			diet: legacyProfile.dietaryRequirements ?? crew.diet,
			medical: legacyProfile.medicalNotes ?? crew.medical
		}
		errors = {}
	}

	async function save() {
		if (!participant || !userId) return
		const result = validate()
		if (!result.valid) {
			errors = result.errors
			saveError =
				'Brakuje wymaganych pól. Możesz je uzupełnić później — dane zostały zapisane jako niekompletne.'
		} else {
			errors = {}
			saveError = null
		}

		saving = true
		try {
			await convex.mutation(api.mutations.upsertBookingParticipant, {
				userId,
				participantId: participant._id,
				...(invitedEmail.trim() ? { invitedEmail: invitedEmail.trim() } : {}),
				...(crew.firstName.trim() ? { firstName: crew.firstName.trim() } : {}),
				...(crew.lastName.trim() ? { lastName: crew.lastName.trim() } : {}),
				...(crew.email.trim() ? { email: crew.email.trim() } : {}),
				...(crew.dob.trim() ? { dateOfBirth: crew.dob.trim() } : {}),
				...(crew.birthPlace.trim()
					? { birthPlace: crew.birthPlace.trim() }
					: {}),
				...(crew.nationality.trim()
					? { nationality: crew.nationality.trim() }
					: {}),
				...(crew.phone.trim() ? { phone: crew.phone.trim() } : {}),
				docType: crew.docType,
				...(crew.docNumber.trim()
					? { docNumber: crew.docNumber.trim().toUpperCase() }
					: {}),
				...(crew.emergencyName.trim()
					? { emergencyContactName: crew.emergencyName.trim() }
					: {}),
				...(crew.emergencyPhone.trim()
					? { emergencyContactPhone: crew.emergencyPhone.trim() }
					: {}),
				...(crew.swimming.trim()
					? { swimmingAbility: crew.swimming.trim() }
					: {}),
				...(crew.experience.trim()
					? { sailingExperience: crew.experience.trim() }
					: {}),
				...(crew.diet.trim() ? { dietaryRequirements: crew.diet.trim() } : {}),
				...(crew.medical.trim() ? { medicalNotes: crew.medical.trim() } : {})
			})
			saved = true
			if (result.valid) {
				await goto(resolve('/dashboard'))
			}
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Błąd zapisu danych'
		} finally {
			saving = false
		}
	}

	async function backToDashboard() {
		await goto(resolve('/dashboard'))
	}
</script>

<svelte:head>
	<title>Dane żeglarza · Sailing Architects</title>
</svelte:head>

<main class="crew-page">
	<div class="crew-page__inner">
		<a class="crew-page__back" href={resolve('/dashboard')}>← Wróć do panelu</a>
		<p class="eyebrow">Dane żeglarza</p>

		{#if bookingQuery.isLoading}
			<p class="lead">Ładowanie rezerwacji…</p>
		{:else if !bookingData}
			<p class="lead">Brak aktywnej rezerwacji.</p>
		{:else if !participant}
			<p class="lead">Nie znaleziono uczestnika.</p>
		{:else}
			<header class="crew-header">
				<h1 class="title">Koja {participant.berthLabel}</h1>
				<span
					class="status-badge"
					class:status-badge--complete={participant.dataStatus === 'complete'}
					class:status-badge--incomplete={participant.dataStatus ===
						'incomplete'}
				>
					{participant.dataStatus === 'complete'
						? 'Komplet'
						: participant.dataStatus === 'incomplete'
							? 'Niekompletne'
							: 'Brak danych'}
				</span>
			</header>

			{#if legacyProfile}
				<div class="copy-banner">
					<p class="copy-banner__copy">
						Wpisałeś już swoje dane przy rezerwacji. Możesz skopiować je do tego
						uczestnika i edytować, jeśli to ta sama osoba.
					</p>
					<button
						type="button"
						class="btn btn--ghost"
						onclick={copyFromAccount}
						disabled={saving}
					>
						Skopiuj moje dane
					</button>
				</div>
			{/if}

			<section class="form-card">
				<header class="form-card__header">
					<p class="form-card__eyebrow">Zaproszenie</p>
					<p class="form-card__hint">
						Adres e-mail, na który wyślemy uczestnikowi przypomnienia o
						uzupełnieniu danych i nadchodzących płatnościach.
					</p>
				</header>
				<BookingInput
					label="E-mail zaproszenia"
					type="email"
					bind:value={invitedEmail}
					placeholder="adres@email.pl"
					autocomplete="email"
				/>
			</section>

			<section class="form-card">
				<header class="form-card__header">
					<p class="form-card__eyebrow">Dane osobowe</p>
				</header>
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
			</section>

			{#if saveError}
				<p class="error-msg" role="alert">{saveError}</p>
			{/if}
			{#if saved && !saveError}
				<p class="success-msg" role="status">Zapisano dane uczestnika.</p>
			{/if}

			<div class="actions">
				<button
					type="button"
					class="btn btn--ghost"
					onclick={backToDashboard}
					disabled={saving}
				>
					← Anuluj
				</button>
				<button
					type="button"
					class="btn btn--primary"
					onclick={save}
					disabled={saving}
				>
					{saving ? 'Zapisywanie…' : 'Zapisz'}
				</button>
			</div>
		{/if}
	</div>
</main>

<style>
	.crew-page {
		min-height: 100vh;
		background: var(--color-navy);
		padding: 124px 24px 80px;
	}

	.crew-page__inner {
		max-width: 720px;
		margin: 0 auto;
	}

	.crew-page__back {
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

	.crew-page__back:hover {
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

	.crew-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 24px;
	}

	.status-badge {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 1.6px;
		text-transform: uppercase;
		padding: 6px 12px;
		border: 1px solid rgba(245, 240, 232, 0.25);
		color: rgba(245, 240, 232, 0.7);
	}

	.status-badge--incomplete {
		border-color: rgba(196, 146, 58, 0.5);
		color: var(--color-brass-text);
		background: rgba(196, 146, 58, 0.08);
	}

	.status-badge--complete {
		border-color: rgba(80, 160, 80, 0.5);
		color: #b6e1a4;
		background: rgba(80, 160, 80, 0.1);
	}

	.copy-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 16px 20px;
		margin-bottom: 24px;
		background: rgba(196, 146, 58, 0.06);
		border-left: 2px solid rgba(196, 146, 58, 0.4);
		flex-wrap: wrap;
	}

	.copy-banner__copy {
		flex: 1 1 280px;
		font-size: 13px;
		color: rgba(245, 240, 232, 0.85);
		margin: 0;
		line-height: 1.5;
	}

	.form-card {
		padding: 24px;
		margin-bottom: 24px;
		background: rgba(255, 255, 255, 0.02);
		border-left: 2px solid rgba(196, 146, 58, 0.25);
	}

	.form-card__header {
		margin-bottom: 16px;
	}

	.form-card__eyebrow {
		font-family: var(--font-sans);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text);
		margin: 0;
	}

	.form-card__hint {
		font-size: 12px;
		color: rgba(245, 240, 232, 0.6);
		margin: 6px 0 0;
		line-height: 1.5;
	}

	.form {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	@media (max-width: 600px) {
		.form {
			grid-template-columns: 1fr;
		}
	}

	.form__divider {
		grid-column: 1 / -1;
		padding-top: 8px;
		border-top: 1px solid rgba(196, 146, 58, 0.15);
	}

	.form__divider-label {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
		margin: 0;
	}

	.error-msg {
		color: #ef4444;
		font-size: 13px;
		margin: 0 0 16px;
	}

	.success-msg {
		color: #b6e1a4;
		font-size: 13px;
		margin: 0 0 16px;
	}

	.actions {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
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
</style>
