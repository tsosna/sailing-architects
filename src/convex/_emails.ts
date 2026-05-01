// Reminder email templates used by Convex actions.
// Excluded from public Convex API by `_` prefix.

import {
	brevoSend,
	escapeHtml,
	formatDate,
	formatMoney,
	panelUrl,
	type BrevoSendResult
} from './_brevo'

function ctaButton(href: string, label: string): string {
	return `
		<p style="margin: 18px 0;">
			<a
				href="${escapeHtml(href)}"
				style="display: inline-block; padding: 12px 24px; background: #c4923a; color: #0d1b2e; text-decoration: none; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 12px;"
			>
				${escapeHtml(label)}
			</a>
		</p>`
}

function shell(heading: string, name: string, body: string): string {
	return `
		<div style="font-family: Arial, sans-serif; max-width: 640px; color: #0d1b2e;">
			<h2 style="margin: 0 0 16px;">${escapeHtml(heading)}</h2>
			<p style="margin: 0 0 12px;">Cześć ${escapeHtml(name)},</p>
			${body}
			<p style="margin: 0; color: #607089;">
				Pozdrawiamy,<br />Sailing Architects
			</p>
		</div>
	`
}

export type CrewDataReminderInput = {
	to: string
	name: string
	bookingRef: string
	berthLabel: string
	dataStatus: 'missing' | 'incomplete'
	participantId: string
}

export async function sendCrewDataReminderEmail(
	input: CrewDataReminderInput
): Promise<BrevoSendResult> {
	const safeName = input.name.trim() || 'Żeglarzu'
	const link = panelUrl(
		`/dashboard/crew/${encodeURIComponent(input.participantId)}`
	)
	const subject = `Uzupełnij dane żeglarza dla koi ${input.berthLabel} · Sailing Architects`
	const heading =
		input.dataStatus === 'missing'
			? `Brakuje danych żeglarza dla koi ${input.berthLabel}`
			: `Dane żeglarza dla koi ${input.berthLabel} są niekompletne`

	const html = shell(
		heading,
		safeName,
		`
			<div style="margin: 0 0 18px; padding: 14px 18px; border-left: 3px solid #c4923a; background: #f7efdc;">
				<p style="margin: 4px 0;">Numer rezerwacji: ${escapeHtml(input.bookingRef)}</p>
				<p style="margin: 4px 0;">Koja: <strong>${escapeHtml(input.berthLabel)}</strong></p>
				<p style="margin: 4px 0;">
					Kapitan potrzebuje kompletnych danych każdego uczestnika
					(dokument tożsamości, kontakt alarmowy, doświadczenie żeglarskie).
					Wpisz brakujące informacje w panelu — zajmie to chwilę.
				</p>
			</div>
			${ctaButton(link, 'Uzupełnij dane')}
		`
	)
	const text = [
		`Cześć ${safeName},`,
		'',
		heading,
		`Numer rezerwacji: ${input.bookingRef}`,
		`Koja: ${input.berthLabel}`,
		'',
		'Otwórz panel i uzupełnij dane:',
		link,
		'',
		'Pozdrawiamy,',
		'Sailing Architects'
	].join('\n')

	return brevoSend({
		to: { email: input.to, name: safeName },
		subject,
		html,
		text
	})
}

export type PaymentReminderInput = {
	to: string
	name: string
	bookingRef: string
	paymentLabel: string
	amount: number // grosze
	currency: string
	dueAt?: number
	overdue: boolean
	reminderCount: number // including this one (1-based)
}

export async function sendPaymentReminderEmail(
	input: PaymentReminderInput
): Promise<BrevoSendResult> {
	const safeName = input.name.trim() || 'Żeglarzu'
	const amountStr = formatMoney(input.amount, input.currency)
	const dueStr = input.dueAt ? formatDate(input.dueAt) : ''
	const link = panelUrl('/dashboard')

	const subject = input.overdue
		? `Zaległa rata rezerwacji ${input.bookingRef} · Sailing Architects`
		: `Zbliża się termin raty rezerwacji ${input.bookingRef} · Sailing Architects`
	const heading = input.overdue
		? `Zaległa wpłata: ${input.paymentLabel}`
		: `Zbliża się termin wpłaty: ${input.paymentLabel}`

	const intro = input.overdue
		? [
				`Termin raty <strong>${escapeHtml(input.paymentLabel)}</strong> minął${
					dueStr ? ` (${escapeHtml(dueStr)})` : ''
				}.`,
				`Prosimy o pilną wpłatę kwoty <strong>${escapeHtml(amountStr)}</strong>, aby zachować rezerwację.`,
				input.reminderCount >= 3
					? 'To kolejne przypomnienie — w razie problemów napisz do nas, aby ustalić dogodny termin.'
					: 'Płatność można zrealizować bezpośrednio z panelu.'
			]
		: [
				`Zbliża się termin raty <strong>${escapeHtml(input.paymentLabel)}</strong>${
					dueStr ? ` (${escapeHtml(dueStr)})` : ''
				}.`,
				`Kwota do zapłaty: <strong>${escapeHtml(amountStr)}</strong>.`,
				'Płatność można zrealizować bezpośrednio z panelu.'
			]

	const html = shell(
		heading,
		safeName,
		`
			<div style="margin: 0 0 18px; padding: 14px 18px; border-left: 3px solid ${input.overdue ? '#ef4444' : '#c4923a'}; background: ${input.overdue ? '#fdecec' : '#f7efdc'};">
				<p style="margin: 4px 0;">Numer rezerwacji: ${escapeHtml(input.bookingRef)}</p>
				${intro.map((line) => `<p style="margin: 4px 0;">${line}</p>`).join('')}
			</div>
			${ctaButton(link, 'Otwórz panel')}
		`
	)
	const textIntro = input.overdue
		? `Termin raty ${input.paymentLabel} minął${dueStr ? ` (${dueStr})` : ''}. Prosimy o wpłatę ${amountStr}.`
		: `Zbliża się termin raty ${input.paymentLabel}${dueStr ? ` (${dueStr})` : ''}. Kwota: ${amountStr}.`
	const text = [
		`Cześć ${safeName},`,
		'',
		heading,
		`Numer rezerwacji: ${input.bookingRef}`,
		textIntro,
		'',
		'Otwórz panel:',
		link,
		'',
		'Pozdrawiamy,',
		'Sailing Architects'
	].join('\n')

	return brevoSend({
		to: { email: input.to, name: safeName },
		subject,
		html,
		text
	})
}
