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

export type CrewConfirmationInput = {
	to: string
	name: string
	bookingRef: string
	berthLabel: string
	confirmUrl: string
	expiresAt: number
}

export async function sendCrewConfirmationEmail(
	input: CrewConfirmationInput
): Promise<BrevoSendResult> {
	const safeName = input.name.trim() || 'Żeglarzu'
	const expiry = formatDate(input.expiresAt)
	const subject = `Potwierdź dane uczestnika rejsu · ${input.bookingRef}`

	const html = shell({
		eyebrow: 'Sailing Architects · Potwierdzenie danych',
		heading: 'Potwierdź dane uczestnika rejsu',
		greetingName: safeName,
		bodyHtml: `
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;background:#0f1f35;border:1px solid rgba(196,146,58,0.18);">
				<tr><td style="padding:14px 18px;color:#ede5d8;font-size:14px;line-height:1.7;">
					<p style="margin:0 0 6px;color:rgba(245,240,232,0.66);font-size:12px;">Numer rezerwacji: <strong style="color:#f5f0e8;">${escapeHtml(input.bookingRef)}</strong></p>
					<p style="margin:0;color:rgba(245,240,232,0.66);font-size:12px;">Koja: <strong style="color:#f5f0e8;">${escapeHtml(input.berthLabel)}</strong></p>
				</td></tr>
			</table>
			<p style="margin:0 0 14px;">Wpisaliśmy Twoje dane na podstawie kontaktu z organizatorem. Otwórz krótką stronę i potwierdź, że wszystko się zgadza — albo zgłoś poprawkę.</p>
			${ctaButton(input.confirmUrl, 'Sprawdź i potwierdź dane')}
			<p style="margin:8px 0 0;color:rgba(245,240,232,0.55);font-size:12px;">Link jest aktywny do ${escapeHtml(expiry)}. Pokazuje wyłącznie Twoje dane — nikt poza Tobą ich nie zobaczy.</p>
		`,
		footerNote:
			'Jeżeli ten e-mail nie był do Ciebie, po prostu go zignoruj — link wygaśnie automatycznie.'
	})

	const text = [
		`Cześć ${safeName},`,
		'',
		'Potwierdź dane uczestnika rejsu Sailing Architects.',
		`Numer rezerwacji: ${input.bookingRef}`,
		`Koja: ${input.berthLabel}`,
		'',
		'Otwórz link i potwierdź lub zgłoś poprawkę:',
		input.confirmUrl,
		'',
		`Link aktywny do ${expiry}.`,
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

export type AdminCopyInput = {
	to: string
	subject: string
	context: string // e.g. "Adhoc monit płatności · SA-2026-0142"
	summary: string // short single-line summary
}

/**
 * Lightweight notification for an admin/operator that an adhoc reminder
 * has been dispatched. Uses the same navy/brass shell so the tone stays
 * consistent across operational emails.
 */
export async function sendAdminCopyEmail(
	input: AdminCopyInput
): Promise<BrevoSendResult> {
	const html = `
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07111e;font-family:Arial,Helvetica,sans-serif;">
			<tr><td align="center" style="padding:32px 16px;">
				<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#0d1b2e;border:1px solid rgba(196,146,58,0.28);">
					<tr><td style="padding:26px 32px;border-bottom:1px solid rgba(196,146,58,0.18);">
						<p style="margin:0 0 8px;color:#d4aa5a;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Sailing Architects · Admin alert</p>
						<h1 style="margin:0;color:#f5f0e8;font-family:Georgia,serif;font-weight:400;font-size:22px;line-height:1.2;">${escapeHtml(input.context)}</h1>
					</td></tr>
					<tr><td style="padding:22px 32px;color:#ede5d8;font-size:14px;line-height:1.7;">
						<p style="margin:0;">${escapeHtml(input.summary)}</p>
					</td></tr>
				</table>
			</td></tr>
		</table>
	`
	return brevoSend({
		to: { email: input.to },
		subject: input.subject,
		html
	})
}

function ctaButton(href: string, label: string): string {
	return `
		<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 22px 0 8px;">
			<tr>
				<td bgcolor="#c4923a" style="background:#c4923a;padding:12px 26px;">
					<a
						href="${escapeHtml(href)}"
						style="color:#0d1b2e;text-decoration:none;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:12px;font-family:Arial,Helvetica,sans-serif;"
					>${escapeHtml(label)}</a>
				</td>
			</tr>
		</table>`
}

function shell(opts: {
	eyebrow: string
	heading: string
	greetingName: string
	bodyHtml: string
	footerNote?: string
}): string {
	const safeName = opts.greetingName.trim() || 'Żeglarzu'
	return `
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07111e;font-family:Arial,Helvetica,sans-serif;">
			<tr>
				<td align="center" style="padding:32px 16px;">
					<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#0d1b2e;border:1px solid rgba(196,146,58,0.28);">
						<tr>
							<td style="padding:30px 32px 22px;border-bottom:1px solid rgba(196,146,58,0.18);">
								<p style="margin:0 0 10px;color:#d4aa5a;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(opts.eyebrow)}</p>
								<h1 style="margin:0;color:#f5f0e8;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;">${escapeHtml(opts.heading)}</h1>
							</td>
						</tr>
						<tr>
							<td style="padding:24px 32px 4px;color:#ede5d8;font-size:14px;line-height:1.7;">
								<p style="margin:0 0 14px;">Cześć ${escapeHtml(safeName)},</p>
								${opts.bodyHtml}
							</td>
						</tr>
						<tr>
							<td style="padding:18px 32px 30px;color:rgba(245,240,232,0.66);font-size:12px;line-height:1.6;">
								<p style="margin:0;">Pozdrawiamy,<br />Sailing Architects</p>
								${opts.footerNote ? `<p style="margin:14px 0 0;color:rgba(245,240,232,0.5);">${escapeHtml(opts.footerNote)}</p>` : ''}
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
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
	const guideLink = panelUrl('/poradnik')
	const subject = `Uzupełnij dane żeglarza dla koi ${input.berthLabel} · Sailing Architects`
	const heading =
		input.dataStatus === 'missing'
			? `Brakuje danych żeglarza dla koi ${input.berthLabel}`
			: `Dane żeglarza dla koi ${input.berthLabel} są niekompletne`

	const html = shell({
		eyebrow: 'Sailing Architects · Dane załogi',
		heading,
		greetingName: safeName,
		bodyHtml: `
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;background:#0f1f35;border:1px solid rgba(196,146,58,0.18);">
				<tr><td style="padding:14px 18px;color:#ede5d8;font-size:14px;line-height:1.7;">
					<p style="margin:0 0 6px;color:rgba(245,240,232,0.66);font-size:12px;">Numer rezerwacji: <strong style="color:#f5f0e8;">${escapeHtml(input.bookingRef)}</strong></p>
					<p style="margin:0 0 6px;color:rgba(245,240,232,0.66);font-size:12px;">Koja: <strong style="color:#f5f0e8;">${escapeHtml(input.berthLabel)}</strong></p>
				</td></tr>
			</table>
			<p style="margin:0 0 14px;">Kapitan potrzebuje kompletnych danych każdego uczestnika — dokument tożsamości, kontakt alarmowy i doświadczenie żeglarskie. Wpisanie ich w panelu zajmie chwilę.</p>
			${ctaButton(link, 'Uzupełnij dane')}
			<p style="margin:18px 0 0;font-size:13px;color:rgba(245,240,232,0.55);">Przed rejsem przejrzyj <a href="${escapeHtml(guideLink)}" style="color:#d4aa5a;text-decoration:underline;">poradnik załogi</a> — checklisty, pakowanie i odpowiedzi na najczęstsze pytania.</p>
		`
	})
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
		'Poradnik załogi (checklisty + pełne Q&A):',
		guideLink,
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

	const html = shell({
		eyebrow: input.overdue
			? 'Sailing Architects · Zaległa rata'
			: 'Sailing Architects · Termin raty',
		heading,
		greetingName: safeName,
		bodyHtml: `
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;background:#0f1f35;border:1px solid rgba(196,146,58,0.18);${input.overdue ? 'border-left:3px solid #e46d5f;' : 'border-left:3px solid #c4923a;'}">
				<tr><td style="padding:14px 18px;color:#ede5d8;font-size:14px;line-height:1.7;">
					<p style="margin:0 0 6px;color:rgba(245,240,232,0.66);font-size:12px;">Numer rezerwacji: <strong style="color:#f5f0e8;">${escapeHtml(input.bookingRef)}</strong></p>
					${intro.map((line) => `<p style="margin:6px 0 0;color:#ede5d8;">${line}</p>`).join('')}
				</td></tr>
			</table>
			${ctaButton(link, 'Otwórz panel')}
		`
	})
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
