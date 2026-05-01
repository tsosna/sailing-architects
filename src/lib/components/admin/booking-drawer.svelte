<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte'
	import { api } from '$convex/api'
	import { PUBLIC_APP_URL } from '$env/static/public'
	import type { Id } from '$convex/dataModel'

	type Props = {
		bookingId: Id<'bookings'> | null
		onclose: () => void
	}

	const { bookingId, onclose }: Props = $props()

	const convex = useConvexClient()

	const detail = useQuery(api.admin.bookingDetailById, () =>
		bookingId ? { bookingId } : 'skip'
	)

	let busyId = $state<string | null>(null)
	let toast = $state<{ kind: 'ok' | 'err'; text: string } | null>(null)
	let copiedAt = $state<number | null>(null)
	let notifyAdmin = $state(true)

	function formatPLN(grosze: number): string {
		const zlote = (grosze / 100).toLocaleString('pl-PL', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})
		return `${zlote} PLN`
	}

	function formatDateTime(timestamp?: number): string {
		if (!timestamp) return '—'
		return new Date(timestamp).toLocaleString('pl-PL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	function formatDate(timestamp?: number): string {
		if (!timestamp) return '—'
		return new Date(timestamp).toLocaleDateString('pl-PL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	function paymentBadge(status: string): {
		label: string
		level: 'ok' | 'warn' | 'danger' | 'info'
	} {
		switch (status) {
			case 'paid':
				return { label: 'Opłacono', level: 'ok' }
			case 'overdue':
				return { label: 'Zaległe', level: 'danger' }
			case 'processing':
				return { label: 'W trakcie', level: 'warn' }
			case 'pending':
				return { label: 'Czeka', level: 'info' }
			case 'failed':
				return { label: 'Nieudane', level: 'danger' }
			case 'cancelled':
				return { label: 'Anulowane', level: 'info' }
			default:
				return { label: status, level: 'info' }
		}
	}

	function dataBadge(status: string): {
		label: string
		level: 'ok' | 'warn' | 'danger' | 'info'
	} {
		switch (status) {
			case 'complete':
				return { label: 'Komplet', level: 'ok' }
			case 'incomplete':
				return { label: 'Niekompletne', level: 'warn' }
			case 'missing':
				return { label: 'Brak', level: 'danger' }
			default:
				return { label: status, level: 'info' }
		}
	}

	type ContactEntry = {
		key: string
		when: number
		title: string
		count: number
	}

	const contactHistory = $derived.by<ContactEntry[]>(() => {
		const data = detail.data
		if (!data) return []
		const entries: ContactEntry[] = []
		for (const p of data.payments) {
			if (p.lastReminderSentAt) {
				entries.push({
					key: `payment-${p._id}`,
					when: p.lastReminderSentAt,
					title: `Monit płatności · ${p.label}`,
					count: p.reminderCount ?? 0
				})
			}
		}
		for (const part of data.participants) {
			if (part.lastReminderSentAt) {
				entries.push({
					key: `participant-${part._id}`,
					when: part.lastReminderSentAt,
					title: `Prośba o dane · Koja ${part.berthLabel}`,
					count: part.reminderCount ?? 0
				})
			}
		}
		if (data.booking.confirmationEmailSentAt) {
			entries.push({
				key: `booking-confirmation`,
				when: data.booking.confirmationEmailSentAt,
				title: 'Potwierdzenie rezerwacji wysłane',
				count: 1
			})
		}
		return entries.sort((a, b) => b.when - a.when)
	})

	const totalAmount = $derived(
		detail.data?.payments.reduce((sum, p) => sum + p.amount, 0) ?? 0
	)
	const paidAmount = $derived(
		detail.data?.payments
			.filter((p) => p.status === 'paid')
			.reduce((sum, p) => sum + p.amount, 0) ?? 0
	)
	const remainingAmount = $derived(Math.max(0, totalAmount - paidAmount))

	async function sendPaymentReminder(paymentId: Id<'bookingPayments'>) {
		busyId = paymentId
		toast = null
		try {
			const result = await convex.action(
				api.admin.sendAdhocPaymentReminder,
				{ paymentId, notifyAdmin }
			)
			if (result.ok) {
				toast = {
					kind: 'ok',
					text: result.adminCopySent
						? 'Monit wysłany. Kopia poszła do operatora.'
						: 'Monit wysłany.'
				}
			} else {
				toast = {
					kind: 'err',
					text:
						result.reason === 'recipient_unavailable'
							? 'Brak adresu odbiorcy — uzupełnij dane uczestnika lub kupującego.'
							: `Nie udało się wysłać: ${result.reason}`
				}
			}
		} catch (err) {
			toast = {
				kind: 'err',
				text: err instanceof Error ? err.message : 'Błąd wysyłki'
			}
		} finally {
			busyId = null
		}
	}

	async function sendCrewReminder(participantId: Id<'bookingParticipants'>) {
		busyId = participantId
		toast = null
		try {
			const result = await convex.action(
				api.admin.sendAdhocCrewDataReminder,
				{ participantId, notifyAdmin }
			)
			if (result.ok) {
				toast = {
					kind: 'ok',
					text: result.adminCopySent
						? 'Prośba wysłana. Kopia poszła do operatora.'
						: 'Prośba wysłana.'
				}
			} else {
				toast = {
					kind: 'err',
					text:
						result.reason === 'recipient_unavailable'
							? 'Brak adresu odbiorcy — uzupełnij dane uczestnika lub kupującego.'
							: `Nie udało się wysłać: ${result.reason}`
				}
			}
		} catch (err) {
			toast = {
				kind: 'err',
				text: err instanceof Error ? err.message : 'Błąd wysyłki'
			}
		} finally {
			busyId = null
		}
	}

	function buildPaymentWhatsapp(args: {
		bookingRef: string
		label: string
		amount: number
		overdue: boolean
		dueAt?: number
	}): string {
		const link = `${PUBLIC_APP_URL.replace(/\/+$/, '')}/dashboard`
		const intro = args.overdue
			? `przypominam o zaległej racie „${args.label}" dla rezerwacji ${args.bookingRef}.`
			: `przypominam o nadchodzącej racie „${args.label}" dla rezerwacji ${args.bookingRef}${
					args.dueAt ? ` (termin ${formatDate(args.dueAt)})` : ''
				}.`
		return [
			'Cześć,',
			intro,
			`Kwota do zapłaty: ${formatPLN(args.amount)}.`,
			`Płatność można zrealizować w panelu: ${link}`,
			'',
			'Pozdrawiamy,',
			'Sailing Architects'
		].join('\n')
	}

	function buildCrewWhatsapp(args: {
		bookingRef: string
		berthLabel: string
		participantId: string
		dataStatus: 'missing' | 'incomplete'
	}): string {
		const link = `${PUBLIC_APP_URL.replace(/\/+$/, '')}/dashboard/crew/${args.participantId}`
		const headline =
			args.dataStatus === 'missing'
				? `dla koi ${args.berthLabel} brakuje jeszcze danych żeglarza.`
				: `dla koi ${args.berthLabel} dane żeglarza są niekompletne.`
		return [
			'Cześć,',
			`${headline} Numer rezerwacji: ${args.bookingRef}.`,
			'Można je uzupełnić tu:',
			link,
			'',
			'Pozdrawiamy,',
			'Sailing Architects'
		].join('\n')
	}

	async function copyText(text: string) {
		try {
			await navigator.clipboard.writeText(text)
			copiedAt = Date.now()
			toast = { kind: 'ok', text: 'Skopiowano do schowka.' }
		} catch {
			toast = {
				kind: 'err',
				text: 'Nie udało się skopiować — zaznacz ręcznie.'
			}
		}
	}

	function handleScrim(e: KeyboardEvent | MouseEvent) {
		if ('key' in e && e.key !== 'Escape' && e.key !== 'Enter' && e.key !== ' ')
			return
		onclose()
	}
</script>

{#if bookingId}
	<div
		class="drawer"
		role="dialog"
		aria-modal="true"
		aria-label="Szczegóły rezerwacji"
	>
		<button
			class="scrim"
			type="button"
			aria-label="Zamknij"
			onclick={onclose}
		></button>
		<aside class="panel">
			<header class="head">
				<div>
					<p class="eyebrow">{detail.data?.booking.bookingRef ?? 'Rezerwacja'}</p>
					<h2>
						{detail.data?.buyer.name ??
							detail.data?.buyer.email ??
							'Wczytuję…'}
					</h2>
					{#if detail.data?.buyer.email}
						<p class="head-sub">{detail.data.buyer.email}</p>
					{/if}
				</div>
				<button class="close" type="button" aria-label="Zamknij" onclick={onclose}
					>×</button
				>
			</header>

			{#if detail.error}
				<p class="error">Nie udało się wczytać rezerwacji: {detail.error.message}</p>
			{:else if detail.isLoading || !detail.data}
				<p class="loading">Wczytuję szczegóły…</p>
			{:else}
				{@const data = detail.data}
				<div class="body">
					<div class="detail-strip">
						<div>
							<span>Koje</span>
							<strong
								>{data.berths
									.map((b) => b.berthId)
									.sort()
									.join(', ') || '—'}</strong
							>
						</div>
						<div>
							<span>Segment</span>
							<strong>{data.segment?.name ?? '—'}</strong>
						</div>
						<div>
							<span>Pozostało</span>
							<strong>{formatPLN(remainingAmount)}</strong>
						</div>
					</div>

					<section class="block">
						<div class="block-head">
							<h3>Harmonogram płatności</h3>
							<p>Snapshot przepisany z planu segmentu przy tworzeniu bookingu.</p>
						</div>
						{#if data.payments.length === 0}
							<p class="empty-row">Brak harmonogramu.</p>
						{:else}
							<ul class="rows">
								{#each data.payments as payment (payment._id)}
									{@const badge = paymentBadge(payment.status)}
									<li class="row">
										<div class="row-main">
											<strong>{payment.label}</strong>
											<span>
												{formatPLN(payment.amount)} · termin {formatDate(
													payment.dueAt
												)}
												{#if payment.lastReminderSentAt}
													· monity: {payment.reminderCount ?? 0}, ostatnio {formatDateTime(
														payment.lastReminderSentAt
													)}
												{/if}
											</span>
										</div>
										<div class="row-side">
											<span class="badge badge--{badge.level}">{badge.label}</span>
											{#if payment.status !== 'paid' && payment.status !== 'cancelled'}
												<button
													class="mini mini--brass"
													type="button"
													disabled={busyId === payment._id}
													onclick={() => sendPaymentReminder(payment._id)}
												>
													{busyId === payment._id ? 'Wysyłam…' : 'Wyślij monit'}
												</button>
												<button
													class="mini"
													type="button"
													onclick={() =>
														copyText(
															buildPaymentWhatsapp({
																bookingRef: data.booking.bookingRef,
																label: payment.label,
																amount: payment.amount,
																overdue: payment.status === 'overdue',
																dueAt: payment.dueAt
															})
														)}
												>
													Kopiuj WhatsApp
												</button>
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</section>

					<section class="block">
						<div class="block-head">
							<h3>Uczestnicy</h3>
							<p>Dane załogi powiązane z kojami.</p>
						</div>
						{#if data.participants.length === 0}
							<p class="empty-row">Brak uczestników w tej rezerwacji.</p>
						{:else}
							<ul class="rows">
								{#each data.participants as participant (participant._id)}
									{@const badge = dataBadge(participant.dataStatus)}
									<li class="row">
										<div class="row-main">
											<strong
												>Koja {participant.berthLabel} ·
												{participant.firstName || participant.lastName
													? `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim()
													: 'brak imienia'}</strong
											>
											<span>
												{participant.invitedEmail ??
													participant.email ??
													'brak adresu uczestnika'}
												{#if participant.lastReminderSentAt}
													· prośby: {participant.reminderCount ?? 0}, ostatnio {formatDateTime(
														participant.lastReminderSentAt
													)}
												{/if}
											</span>
										</div>
										<div class="row-side">
											<span class="badge badge--{badge.level}">{badge.label}</span>
											{#if participant.dataStatus !== 'complete'}
												<button
													class="mini mini--brass"
													type="button"
													disabled={busyId === participant._id}
													onclick={() => sendCrewReminder(participant._id)}
												>
													{busyId === participant._id
														? 'Wysyłam…'
														: 'Wyślij prośbę'}
												</button>
												<button
													class="mini"
													type="button"
													onclick={() =>
														copyText(
															buildCrewWhatsapp({
																bookingRef: data.booking.bookingRef,
																berthLabel: participant.berthLabel,
																participantId: participant._id,
																dataStatus:
																	participant.dataStatus as
																		| 'missing'
																		| 'incomplete'
															})
														)}
												>
													Kopiuj WhatsApp
												</button>
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</section>

					<section class="block">
						<div class="block-head">
							<h3>Historia kontaktu</h3>
							<p>Operacyjna oś monitów (bez pełnego audit logu).</p>
						</div>
						{#if contactHistory.length === 0}
							<p class="empty-row">Jeszcze nie wysłano żadnej wiadomości.</p>
						{:else}
							<ul class="history">
								{#each contactHistory as entry (entry.key)}
									<li>
										<span class="history-date">{formatDateTime(entry.when)}</span>
										<span class="history-title">
											{entry.title}
											{#if entry.count > 0}
												· {entry.count}
											{/if}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</section>

					<section class="block">
						<div class="block-head">
							<h3>Ustawienia wysyłki</h3>
							<p>Dotyczą monitów wysyłanych z tego drawera.</p>
						</div>
						<label class="toggle">
							<input type="checkbox" bind:checked={notifyAdmin} />
							<span>Wyślij kopię do operatora (HANDOFF_REPORT_TO)</span>
						</label>
					</section>

					{#if toast}
						<p class="toast toast--{toast.kind}">{toast.text}</p>
					{/if}
				</div>
			{/if}
		</aside>
	</div>
{/if}

<style>
	.drawer {
		position: fixed;
		inset: 0;
		z-index: 60;
	}

	.scrim {
		position: absolute;
		inset: 0;
		background: rgba(7, 17, 30, 0.68);
		border: 0;
		padding: 0;
		cursor: pointer;
	}

	.panel {
		position: absolute;
		top: 0;
		right: 0;
		width: min(620px, 100vw);
		height: 100%;
		background: var(--admin-navy-mid, #0f1f35);
		border-left: 1px solid var(--admin-line-strong, rgba(196, 146, 58, 0.32));
		overflow: auto;
		box-shadow: -32px 0 80px rgba(0, 0, 0, 0.32);
		font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif);
		color: var(--admin-warm-white, #f5f0e8);
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		padding: 24px;
		border-bottom: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
	}

	.eyebrow {
		margin: 0 0 6px;
		color: var(--admin-brass-light, #d4aa5a);
		font-size: 10px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	.head h2 {
		margin: 0;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-weight: 400;
		font-size: 24px;
	}

	.head-sub {
		margin: 4px 0 0;
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
		font-size: 12px;
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
		padding: 22px 24px 36px;
		display: grid;
		gap: 18px;
	}

	.error,
	.loading {
		padding: 24px;
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
	}

	.error {
		color: var(--admin-danger, #e46d5f);
	}

	.detail-strip {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1px;
		background: var(--admin-line, rgba(196, 146, 58, 0.16));
	}

	.detail-strip > div {
		background: var(--admin-navy-light, #162840);
		padding: 14px;
	}

	.detail-strip span {
		display: block;
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
		font-size: 10px;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.detail-strip strong {
		display: block;
		margin-top: 7px;
		font-size: 15px;
		font-weight: 500;
	}

	.block {
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
		background: rgba(15, 31, 53, 0.65);
	}

	.block-head {
		padding: 14px 18px;
		border-bottom: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
	}

	.block-head h3 {
		margin: 0;
		font-family: var(--font-serif, 'Playfair Display', serif);
		font-weight: 400;
		font-size: 18px;
	}

	.block-head p {
		margin: 4px 0 0;
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
		font-size: 12px;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
		padding: 14px 18px;
		border-top: 1px solid rgba(196, 146, 58, 0.08);
		flex-wrap: wrap;
	}

	.row:first-child {
		border-top: 0;
	}

	.row-main strong {
		display: block;
		font-size: 13px;
		font-weight: 500;
	}

	.row-main span {
		display: block;
		margin-top: 4px;
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
		font-size: 11px;
		line-height: 1.5;
	}

	.row-side {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		min-height: 22px;
		padding: 0 8px;
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.badge--ok {
		background: var(--admin-ok-bg, rgba(138, 199, 164, 0.12));
		border-color: rgba(138, 199, 164, 0.3);
		color: var(--admin-ok, #8ac7a4);
	}

	.badge--warn {
		background: var(--admin-warn-bg, rgba(224, 179, 95, 0.13));
		border-color: rgba(224, 179, 95, 0.34);
		color: var(--admin-warn, #e0b35f);
	}

	.badge--danger {
		background: var(--admin-danger-bg, rgba(228, 109, 95, 0.12));
		border-color: rgba(228, 109, 95, 0.34);
		color: var(--admin-danger, #e46d5f);
	}

	.mini {
		min-height: 28px;
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
		background: rgba(7, 17, 30, 0.48);
		color: var(--admin-warm-white, #f5f0e8);
		padding: 0 10px;
		font-size: 11px;
		cursor: pointer;
		font-family: inherit;
	}

	.mini:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.mini--brass {
		background: rgba(196, 146, 58, 0.16);
		border-color: rgba(196, 146, 58, 0.44);
		color: var(--admin-brass-light, #d4aa5a);
	}

	.history {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.history li {
		display: grid;
		grid-template-columns: 158px 1fr;
		gap: 14px;
		padding: 12px 18px;
		border-top: 1px solid rgba(196, 146, 58, 0.08);
		font-size: 12px;
	}

	.history li:first-child {
		border-top: 0;
	}

	.history-date {
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
	}

	.empty-row {
		margin: 0;
		padding: 22px 18px;
		color: var(--admin-muted, rgba(245, 240, 232, 0.52));
		font-size: 12px;
		text-align: center;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 18px;
		font-size: 12px;
		color: var(--admin-warm-white, #f5f0e8);
	}

	.toggle input {
		width: 16px;
		height: 16px;
		accent-color: var(--admin-brass, #c4923a);
	}

	.toast {
		margin: 0;
		padding: 12px 16px;
		border: 1px solid var(--admin-line, rgba(196, 146, 58, 0.16));
		font-size: 12px;
	}

	.toast--ok {
		background: var(--admin-ok-bg, rgba(138, 199, 164, 0.12));
		border-color: rgba(138, 199, 164, 0.3);
		color: var(--admin-ok, #8ac7a4);
	}

	.toast--err {
		background: var(--admin-danger-bg, rgba(228, 109, 95, 0.12));
		border-color: rgba(228, 109, 95, 0.34);
		color: var(--admin-danger, #e46d5f);
	}

	@media (max-width: 600px) {
		.detail-strip {
			grid-template-columns: 1fr;
		}
		.history li {
			grid-template-columns: 1fr;
		}
	}
</style>
