<script lang="ts">
	import { api } from '$convex/api'
	import type { Id } from '$convex/dataModel'
	import { useQuery } from 'convex-svelte'
	import { toastState } from '$lib/state/toast.svelte'

	type Props = {
		bookingId: Id<'bookings'> | null
		onclose: () => void
	}

	const { bookingId, onclose }: Props = $props()

	const suggestion = useQuery(
		api.refunds.calculateRefundPolicySuggestion,
		() => (bookingId ? { bookingId } : 'skip')
	)

	let amountPln = $state<number | null>(null)
	let preloaded = $state(false)
	let reason = $state('')
	let releaseBerth = $state(true)
	let releaseBerthTouched = $state(false)
	let submitting = $state(false)

	$effect(() => {
		if (
			suggestion.data &&
			suggestion.data.suggestedAmount !== null &&
			!preloaded
		) {
			amountPln = suggestion.data.suggestedAmount / 100
			preloaded = true
		}
	})

	const amountGrosze = $derived(
		amountPln === null ? 0 : Math.round(amountPln * 100)
	)

	$effect(() => {
		if (suggestion.data && !releaseBerthTouched) {
			releaseBerth = amountGrosze === suggestion.data.availableToRefund
		}
	})

	const canSubmit = $derived(
		!!suggestion.data &&
			amountGrosze > 0 &&
			amountGrosze <= suggestion.data.availableToRefund
	)

	function formatPLN(grosze: number): string {
		return (grosze / 100).toLocaleString('pl-PL', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})
	}

	async function handleSubmit() {
		if (!bookingId || !canSubmit) return
		submitting = true
		try {
			const res = await fetch('/api/admin/refunds/initiate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookingId,
					totalAmount: amountGrosze,
					releaseBerth,
					reason: reason.trim() || undefined
				})
			})
			const body = await res.json().catch(() => ({}))
			if (!res.ok) {
				throw new Error(body.error ?? 'Nie udało się zainicjować zwrotu.')
			}
			toastState.addToast({
				message: `Zwrot ${formatPLN(amountGrosze)} PLN zainicjowany. Czeka na potwierdzenie Stripe.`,
				status: 'success',
				duration: 5000
			})
			onclose()
		} catch (err) {
			toastState.addToast({
				message: err instanceof Error ? err.message : 'Błąd zwrotu.',
				status: 'error',
				duration: 0
			})
		} finally {
			submitting = false
		}
	}
</script>

{#if bookingId}
	<div
		class="overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Inicjuj zwrot"
	>
		<button class="scrim" type="button" aria-label="Zamknij" onclick={onclose}
		></button>
		<aside class="panel">
			<header class="head">
				<div>
					<p>Inicjuj zwrot</p>
				</div>
				<button
					class="close"
					type="button"
					aria-label="Zamknij"
					onclick={onclose}>×</button
				>
			</header>
			<div class="body">
				{#if !suggestion.data}
					<p>Wczytuję politykę zwrotów…</p>
				{:else}
					{@const s = suggestion.data}
					<p class="suggestion">
						{#if s.suggestedAmount !== null}
							Sugerowany zwrot: <strong
								>{formatPLN(s.suggestedAmount)} PLN</strong
							>
							({s.suggestedPercent * 100} % wg polityki — {s.daysBeforeDeparture}
							dni przed wypłynięciem).<br />
						{:else}
							Brak sugestii (poza polityką lub nic do zwrotu)
						{/if}

						Wpłacone: {formatPLN(s.totalPaid)} PLN · Dostępne do zwrotu: {formatPLN(
							s.availableToRefund
						)} PLN.
					</p>

					<label class="field">
						<span>Kwota zwrotu (PLN)</span>
						<input
							type="number"
							min="0"
							step="0.01"
							bind:value={amountPln}
							disabled={submitting}
						/>
					</label>

					<label class="field">
						<span>Powód (opcjonalnie)</span>
						<textarea rows="3" bind:value={reason} disabled={submitting}
						></textarea>
					</label>

					<label class="checkbox">
						<input
							type="checkbox"
							checked={releaseBerth}
							onchange={(e) => {
								releaseBerth = e.currentTarget.checked
								releaseBerthTouched = true
							}}
							disabled={submitting}
						/>
						<span>Zwolnij koje (stanie się dostępna dla nowej rezerwacji)</span>
					</label>

					{#if amountGrosze > s.availableToRefund}
						<p class="error">
							Kwota przekracza dostępne {formatPLN(s.availableToRefund)} PLN.
						</p>
					{/if}
				{/if}
			</div>
			<footer class="foot">
				<button
					class="btn-cancel"
					type="button"
					onclick={onclose}
					disabled={submitting}
				>
					Anuluj
				</button>
				<button
					class="btn-confirm"
					type="button"
					disabled={!canSubmit || submitting}
					onclick={handleSubmit}
				>
					{submitting ? 'Wysyłam…' : 'Zatwierdź zwrot'}
				</button>
			</footer>
		</aside>
	</div>
{/if}

<style>
	button {
		cursor: pointer;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		padding: 24px;
		border-bottom: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
	}

	.close {
		width: 36px;
		height: 36px;
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
		background: transparent;
		color: inherit;
		font-size: 22px;
		cursor: pointer;
	}
	.body {
		padding: 22px 24px 24px;
		display: grid;
		gap: 16px;
	}
	.suggestion {
		margin: 0;
		font-size: 14px;
		line-height: 1.6;
	}
	.field {
		display: grid;
		gap: 6px;
		font-size: 13px;
	}
	.field input,
	.field textarea {
		padding: 8px 10px;
		background: var(--admin-bg-deep, #07111e);
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
		color: inherit;
		font: inherit;
	}
	.checkbox {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 13px;
	}
	.error {
		margin: 0;
		color: #e46d5f;
		font-size: 13px;
	}
	.scrim {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		border: 0;
	}
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 70;
	}
	.panel {
		position: relative;
		z-index: 1;
		background: var(--admin-bg, #0d1b2e);
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
		max-width: 520px;
		width: 90%;
	}
	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 24px;
		border-top: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
	}
	.btn-cancel,
	.btn-confirm {
		padding: 8px 18px;
		font: inherit;
		cursor: pointer;
	}
	.btn-cancel {
		background: transparent;
		color: inherit;
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
	}
	.btn-cancel:hover:not(:disabled) {
		border-color: var(--color-brass, #c4923a);
	}
	.btn-confirm {
		background: var(--color-brass, #c4923a);
		color: #0d1b2e;
		border: 1px solid var(--color-brass, #c4923a);
		font-weight: 600;
	}
	.btn-confirm:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn-cancel:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.field input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield;
	}
	.field input[type='number']::-webkit-outer-spin-button,
	.field input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
