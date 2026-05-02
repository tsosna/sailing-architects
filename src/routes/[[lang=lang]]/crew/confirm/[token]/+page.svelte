<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte'
	import { api } from '$convex/api'
	import { page } from '$app/state'

	const convex = useConvexClient()
	const token = $derived(page.params.token ?? '')

	const view = useQuery(api.crewConfirmation.getCrewConfirmationByToken, () =>
		token ? { token } : 'skip'
	)

	let mode = $state<'idle' | 'correction'>('idle')
	let correctionNote = $state('')
	let busy = $state(false)
	let toast = $state<{ kind: 'ok' | 'err'; text: string } | null>(null)
	let finished = $state<'confirmed' | 'correction' | null>(null)

	function formatDate(timestamp?: number): string {
		if (!timestamp) return '—'
		return new Date(timestamp).toLocaleDateString('pl-PL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	async function confirmData() {
		if (!token) return
		busy = true
		toast = null
		try {
			const result = await convex.mutation(
				api.crewConfirmation.confirmCrewDataByToken,
				{ token }
			)
			if (result.ok) {
				finished = 'confirmed'
			} else {
				toast = { kind: 'err', text: explainReason(result.reason) }
			}
		} catch (err) {
			toast = {
				kind: 'err',
				text: err instanceof Error ? err.message : 'Nie udało się potwierdzić.'
			}
		} finally {
			busy = false
		}
	}

	async function submitCorrection() {
		if (!token) return
		if (!correctionNote.trim()) {
			toast = { kind: 'err', text: 'Opisz krótko, co wymaga poprawy.' }
			return
		}
		busy = true
		toast = null
		try {
			const result = await convex.mutation(
				api.crewConfirmation.requestCrewDataCorrectionByToken,
				{ token, note: correctionNote }
			)
			if (result.ok) {
				finished = 'correction'
			} else {
				toast = { kind: 'err', text: explainReason(result.reason) }
			}
		} catch (err) {
			toast = {
				kind: 'err',
				text: err instanceof Error ? err.message : 'Nie udało się wysłać.'
			}
		} finally {
			busy = false
		}
	}

	function explainReason(reason: string): string {
		switch (reason) {
			case 'not_found':
				return 'Link jest nieprawidłowy lub został zastąpiony nowym.'
			case 'expired':
				return 'Link wygasł. Skontaktuj się z organizatorem, aby otrzymać nowy.'
			case 'already_used':
				return 'Ten link został już użyty. Skontaktuj się z organizatorem, jeżeli potrzebujesz nowego.'
			default:
				return 'Coś poszło nie tak. Spróbuj ponownie lub napisz do organizatora.'
		}
	}

	const fields = $derived.by(() => {
		const v = view.data
		if (!v || v.status !== 'ready') return []
		const p = v.participant
		const text = (val?: string) => (val && val.trim() ? val : '—')
		return [
			{
				section: 'Dane osobowe',
				rows: [
					['Imię', text(p.firstName)],
					['Nazwisko', text(p.lastName)],
					['Data urodzenia', text(p.dateOfBirth)],
					['Miejsce urodzenia', text(p.birthPlace)],
					['Narodowość', text(p.nationality)],
					['Email', text(p.email)],
					['Telefon', text(p.phone)]
				]
			},
			{
				section: 'Dokument',
				rows: [
					[
						'Typ',
						p.docType === 'passport'
							? 'Paszport'
							: p.docType === 'id'
								? 'Dowód'
								: '—'
					],
					['Numer', text(p.docNumber)]
				]
			},
			{
				section: 'Kontakt alarmowy',
				rows: [
					['Imię i nazwisko', text(p.emergencyContactName)],
					['Telefon', text(p.emergencyContactPhone)]
				]
			},
			{
				section: 'Doświadczenie i zdrowie',
				rows: [
					['Pływanie', text(p.swimmingAbility)],
					['Doświadczenie żeglarskie', text(p.sailingExperience)],
					['Dieta', text(p.dietaryRequirements)],
					['Notatki medyczne', text(p.medicalNotes)]
				]
			}
		]
	})
</script>

<svelte:head>
	<title>Potwierdź dane uczestnika rejsu · Sailing Architects</title>
</svelte:head>

<article class="card">
	<header class="head">
		<p class="eyebrow">Sailing Architects</p>
		<h1>Potwierdź dane uczestnika rejsu</h1>
	</header>

	{#if view.error}
		<p class="error">Nie udało się wczytać linku. {view.error.message}</p>
	{:else if view.isLoading || !view.data}
		<p class="loading">Wczytuję dane…</p>
	{:else if view.data.status === 'invalid'}
		<p class="invalid">{explainReason(view.data.reason)}</p>
		<p class="hint">
			Skontaktuj się z organizatorem rejsu — możemy wystawić nowy link.
		</p>
	{:else if finished === 'confirmed'}
		<div class="result result--ok">
			<h2>Dziękujemy za potwierdzenie</h2>
			<p>
				Dane uczestnika zostały zatwierdzone. Możesz zamknąć tę stronę — kapitan
				dostanie informację automatycznie.
			</p>
		</div>
	{:else if finished === 'correction'}
		<div class="result result--info">
			<h2>Otrzymaliśmy zgłoszenie poprawki</h2>
			<p>
				Organizator skontaktuje się z Tobą, żeby uzupełnić dane. Tę stronę
				możesz zamknąć.
			</p>
		</div>
	{:else}
		{@const data = view.data}
		<div class="meta">
			<span>Rezerwacja</span>
			<strong>{data.bookingRef}</strong>
			<span>Koja</span>
			<strong>{data.berthLabel}</strong>
			<span>Link aktywny do</span>
			<strong>{formatDate(data.expiresAt)}</strong>
		</div>

		{#if data.confirmationStatus === 'confirmed'}
			<div class="result result--ok">
				<h2>Dane są już potwierdzone</h2>
				<p>
					Potwierdziłaś/eś je {formatDate(data.confirmedAt)}. Jeśli coś trzeba
					zmienić, napisz do organizatora.
				</p>
			</div>
		{:else}
			<div class="sections">
				{#each fields as section (section.section)}
					<section class="section">
						<h2>{section.section}</h2>
						<dl>
							{#each section.rows as [label, value] (label)}
								<dt>{label}</dt>
								<dd>{value}</dd>
							{/each}
						</dl>
					</section>
				{/each}
			</div>

			{#if mode === 'idle'}
				<div class="actions">
					<button
						type="button"
						class="btn btn--primary"
						onclick={confirmData}
						disabled={busy}
					>
						{busy ? 'Potwierdzam…' : 'Potwierdzam, dane są poprawne'}
					</button>
					<button
						type="button"
						class="btn"
						onclick={() => {
							mode = 'correction'
							toast = null
						}}
						disabled={busy}
					>
						Chcę zgłosić poprawkę
					</button>
				</div>
			{:else}
				<form
					class="correction"
					onsubmit={(e) => {
						e.preventDefault()
						submitCorrection()
					}}
				>
					<label>
						<span>Co wymaga poprawy?</span>
						<textarea
							rows="4"
							bind:value={correctionNote}
							placeholder="Np. nazwisko zapisane błędnie, telefon kontaktu alarmowego się zmienił."
							required
						></textarea>
					</label>
					<div class="actions">
						<button
							type="button"
							class="btn"
							onclick={() => (mode = 'idle')}
							disabled={busy}
						>
							Wróć
						</button>
						<button class="btn btn--primary" type="submit" disabled={busy}>
							{busy ? 'Wysyłam…' : 'Wyślij zgłoszenie'}
						</button>
					</div>
				</form>
			{/if}
		{/if}
	{/if}

	{#if toast}
		<p class="toast toast--{toast.kind}">{toast.text}</p>
	{/if}
</article>

<style>
	.card {
		max-width: 640px;
		width: 100%;
		background: #0d1b2e;
		border: 1px solid rgba(196, 146, 58, 0.28);
		padding: 36px 32px;
	}

	.head {
		border-bottom: 1px solid rgba(196, 146, 58, 0.18);
		padding-bottom: 22px;
		margin-bottom: 22px;
	}

	.eyebrow {
		margin: 0 0 10px;
		color: #d4aa5a;
		font-size: 11px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-family: 'Playfair Display', Georgia, serif;
		font-weight: 400;
		font-size: clamp(26px, 4vw, 36px);
		line-height: 1.15;
	}

	h2 {
		margin: 0 0 10px;
		font-family: 'Playfair Display', Georgia, serif;
		font-weight: 400;
		font-size: 20px;
	}

	.loading,
	.error,
	.invalid {
		margin: 0;
		color: rgba(245, 240, 232, 0.78);
		font-size: 14px;
		line-height: 1.65;
	}
	.error {
		color: #e46d5f;
	}

	.hint {
		margin: 12px 0 0;
		color: rgba(245, 240, 232, 0.55);
		font-size: 13px;
	}

	.meta {
		display: grid;
		grid-template-columns: auto 1fr auto 1fr auto 1fr;
		gap: 6px 16px;
		font-size: 12px;
		margin-bottom: 22px;
		color: rgba(245, 240, 232, 0.55);
	}
	.meta strong {
		color: #f5f0e8;
		font-size: 13px;
	}

	.sections {
		display: grid;
		gap: 22px;
	}

	.section {
		border: 1px solid rgba(196, 146, 58, 0.14);
		padding: 16px;
		background: #0f1f35;
	}

	.section dl {
		margin: 0;
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 6px 14px;
		font-size: 13px;
	}
	.section dt {
		color: rgba(245, 240, 232, 0.55);
	}
	.section dd {
		margin: 0;
		color: #f5f0e8;
	}

	.actions {
		display: flex;
		gap: 12px;
		margin-top: 26px;
		flex-wrap: wrap;
	}

	.btn {
		min-height: 44px;
		padding: 0 20px;
		border: 1px solid rgba(212, 170, 90, 0.4);
		background: rgba(245, 240, 232, 0.04);
		color: #f5f0e8;
		font-family: inherit;
		font-size: 13px;
		cursor: pointer;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn--primary {
		background: #c4923a;
		border-color: #c4923a;
		color: #07111e;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.correction {
		display: grid;
		gap: 14px;
		margin-top: 24px;
	}
	.correction label {
		display: grid;
		gap: 6px;
		font-size: 12px;
	}
	.correction span {
		color: rgba(245, 240, 232, 0.66);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.correction textarea {
		min-height: 120px;
		padding: 12px;
		background: #07111e;
		border: 1px solid rgba(196, 146, 58, 0.2);
		color: #f5f0e8;
		font-family: inherit;
		font-size: 14px;
		resize: vertical;
	}

	.result {
		padding: 22px;
		border: 1px solid rgba(196, 146, 58, 0.18);
		background: #0f1f35;
	}
	.result p {
		margin: 0;
		color: rgba(245, 240, 232, 0.78);
		font-size: 14px;
		line-height: 1.6;
	}
	.result--ok {
		border-color: rgba(138, 199, 164, 0.34);
	}
	.result--info {
		border-color: rgba(212, 170, 90, 0.34);
	}

	.toast {
		margin-top: 18px;
		padding: 12px 16px;
		font-size: 13px;
		border: 1px solid rgba(196, 146, 58, 0.18);
	}
	.toast--err {
		background: rgba(228, 109, 95, 0.12);
		border-color: rgba(228, 109, 95, 0.34);
		color: #e46d5f;
	}
	.toast--ok {
		background: rgba(138, 199, 164, 0.12);
		border-color: rgba(138, 199, 164, 0.3);
		color: #8ac7a4;
	}

	@media (max-width: 600px) {
		.meta {
			grid-template-columns: auto 1fr;
		}
		.section dl {
			grid-template-columns: 1fr;
		}
	}
</style>
