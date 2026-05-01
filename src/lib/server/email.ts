import {
	BREVO_API_KEY,
	BREVO_FROM_EMAIL,
	CONTACT_EMAIL
} from '$env/static/private'

const BREVO_TRANSACTIONAL_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'

type EmailRecipient = string | { email: string; name?: string }

type BrevoRecipient = {
	email: string
	name?: string
}

export type SendTransactionalEmailInput = {
	to: EmailRecipient | EmailRecipient[]
	subject: string
	html: string
	text?: string
	replyTo?: EmailRecipient
	attachments?: Array<{ name: string; content: string }>
}

export type SendContactEmailInput = {
	name: string
	email: string
	phone?: string | null
	subject?: string
	message: string
}

export type SendDailyReportEmailInput = {
	to?: EmailRecipient | EmailRecipient[]
	subject: string
	html: string
	text?: string
}

export type SendTransactionalEmailResult = {
	messageId?: string
	response: unknown
}

function assertEmailEnv() {
	const missing = [
		['BREVO_API_KEY', BREVO_API_KEY],
		['BREVO_FROM_EMAIL', BREVO_FROM_EMAIL]
	].filter(([, value]) => !value)

	if (missing.length > 0) {
		throw new Error(
			`Missing Brevo email environment variable(s): ${missing.map(([key]) => key).join(', ')}`
		)
	}
}

function assertContactEmail() {
	if (!CONTACT_EMAIL) {
		throw new Error('Missing CONTACT_EMAIL environment variable')
	}
}

function toBrevoRecipient(recipient: EmailRecipient): BrevoRecipient {
	if (typeof recipient === 'string') return { email: recipient }

	return recipient
}

function normalizeRecipients(
	recipients: EmailRecipient | EmailRecipient[]
): BrevoRecipient[] {
	const list = Array.isArray(recipients) ? recipients : [recipients]

	if (list.length === 0) {
		throw new Error('At least one recipient is required')
	}

	return list.map(toBrevoRecipient)
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;')
}

async function readBrevoResponse(response: Response) {
	const raw = await response.text()

	if (!raw) return null

	try {
		return JSON.parse(raw) as unknown
	} catch {
		return raw
	}
}

function getBrevoMessageId(responseBody: unknown) {
	if (
		responseBody &&
		typeof responseBody === 'object' &&
		'messageId' in responseBody &&
		typeof responseBody.messageId === 'string'
	) {
		return responseBody.messageId
	}

	return undefined
}

export async function sendTransactionalEmail({
	to,
	subject,
	html,
	text,
	replyTo,
	attachments
}: SendTransactionalEmailInput): Promise<SendTransactionalEmailResult> {
	assertEmailEnv()

	const body = {
		sender: { email: BREVO_FROM_EMAIL },
		to: normalizeRecipients(to),
		subject,
		htmlContent: html,
		...(text ? { textContent: text } : {}),
		...(replyTo ? { replyTo: toBrevoRecipient(replyTo) } : {}),
		...(attachments?.length ? { attachment: attachments } : {})
	}

	const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'api-key': BREVO_API_KEY,
			'content-type': 'application/json'
		},
		body: JSON.stringify(body)
	})

	const responseBody = await readBrevoResponse(response)

	if (!response.ok) {
		throw new Error(
			`Brevo transactional email failed (${response.status} ${response.statusText}): ${JSON.stringify(responseBody)}`
		)
	}

	return {
		messageId: getBrevoMessageId(responseBody),
		response: responseBody
	}
}

export async function sendContactEmail(data: SendContactEmailInput) {
	assertContactEmail()

	const subject = data.subject?.trim() || 'Kontakt'
	const phone = data.phone?.trim()

	return sendTransactionalEmail({
		to: CONTACT_EMAIL,
		replyTo: { email: data.email, name: data.name },
		subject: `[Sailing Architects] ${subject} — ${data.name}`,
		text: [
			'Nowe zapytanie kontaktowe Sailing Architects',
			'',
			`Imię i nazwisko: ${data.name}`,
			`Email: ${data.email}`,
			...(phone ? [`Telefon: ${phone}`] : []),
			`Temat: ${subject}`,
			'',
			data.message
		].join('\n'),
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 640px; color: #0d1b2e;">
				<h2 style="margin: 0 0 16px;">Nowe zapytanie kontaktowe Sailing Architects</h2>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 8px 0; color: #607089;">Imię i nazwisko:</td>
						<td style="padding: 8px 0;"><strong>${escapeHtml(data.name)}</strong></td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #607089;">Email:</td>
						<td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
					</tr>
					${
						phone
							? `
					<tr>
						<td style="padding: 8px 0; color: #607089;">Telefon:</td>
						<td style="padding: 8px 0;">${escapeHtml(phone)}</td>
					</tr>`
							: ''
					}
					<tr>
						<td style="padding: 8px 0; color: #607089;">Temat:</td>
						<td style="padding: 8px 0;">${escapeHtml(subject)}</td>
					</tr>
				</table>
				<hr style="margin: 20px 0; border: 0; border-top: 1px solid #d8c7a9;" />
				<p style="margin: 0 0 8px; color: #607089;">Wiadomość:</p>
				<p style="white-space: pre-wrap; margin: 0;">${escapeHtml(data.message)}</p>
				<hr style="margin: 20px 0; border: 0; border-top: 1px solid #d8c7a9;" />
				<p style="font-size: 12px; color: #607089;">Wysłano przez adapter Brevo w projekcie Sailing Architects.</p>
			</div>
		`
	})
}

export async function sendDailyReportEmail({
	to,
	subject,
	html,
	text
}: SendDailyReportEmailInput) {
	assertContactEmail()

	return sendTransactionalEmail({
		to: to ?? CONTACT_EMAIL,
		subject,
		html,
		text
	})
}

export type PaymentEmailType = 'deposit' | 'installment' | 'fully-paid'

export type PaymentEmailInput = {
	type: PaymentEmailType
	to: string
	name: string
	bookingRef: string
	currency: string
	paidAmount: number // grosze, cumulative after this payment
	totalAmount: number // grosze
	thisPaymentLabel: string
	thisPaymentAmount: number // grosze
	remainingPayments?: Array<{
		label: string
		amount: number
		dueAt?: number
	}>
	panelUrl: string
	pdf?: Buffer
	filename?: string
}

function formatMoney(grosze: number, currency: string): string {
	const value = (grosze / 100).toLocaleString('pl-PL', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})
	return `${value} ${currency.toUpperCase()}`
}

function formatDate(timestamp?: number): string {
	if (!timestamp) return ''
	return new Date(timestamp).toLocaleDateString('pl-PL', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	})
}

function paymentEmailSubject(type: PaymentEmailType, bookingRef: string) {
	switch (type) {
		case 'deposit':
			return `Zaliczka rezerwacji ${bookingRef} opłacona · Sailing Architects`
		case 'fully-paid':
			return `Rezerwacja ${bookingRef} opłacona w całości · Sailing Architects`
		default:
			return `Wpłata raty rezerwacji ${bookingRef} · Sailing Architects`
	}
}

function paymentEmailHeading(type: PaymentEmailType): string {
	switch (type) {
		case 'deposit':
			return 'Zaliczka opłacona — rezerwacja aktywna'
		case 'fully-paid':
			return 'Rezerwacja opłacona w całości'
		default:
			return 'Otrzymaliśmy Twoją wpłatę'
	}
}

function paymentEmailIntro(
	type: PaymentEmailType,
	bookingRef: string,
	thisPaymentLabel: string,
	thisPaymentAmountStr: string,
	paidAmountStr: string,
	totalAmountStr: string,
	remainingAmountStr: string
): string[] {
	const intro: string[] = []
	intro.push(`Numer rezerwacji: ${bookingRef}`)
	intro.push(`${thisPaymentLabel}: ${thisPaymentAmountStr}`)
	intro.push(`Wpłacono łącznie: ${paidAmountStr} z ${totalAmountStr}`)

	if (type === 'deposit') {
		intro.push(
			'Twoje miejsca są zarezerwowane. Pozostałe raty znajdziesz poniżej oraz w panelu.'
		)
		intro.push(`Do zapłaty pozostało: ${remainingAmountStr}`)
	} else if (type === 'installment') {
		intro.push(`Do zapłaty pozostało: ${remainingAmountStr}`)
	} else {
		intro.push('Dziękujemy — Twoja rezerwacja jest opłacona w całości.')
	}

	return intro
}

export async function sendPaymentConfirmationEmail(input: PaymentEmailInput) {
	const safeName = input.name.trim() || 'Żeglarzu'
	const subject = paymentEmailSubject(input.type, input.bookingRef)
	const heading = paymentEmailHeading(input.type)
	const remaining = Math.max(0, input.totalAmount - input.paidAmount)
	const paidStr = formatMoney(input.paidAmount, input.currency)
	const totalStr = formatMoney(input.totalAmount, input.currency)
	const thisStr = formatMoney(input.thisPaymentAmount, input.currency)
	const remainingStr = formatMoney(remaining, input.currency)

	const introLines = paymentEmailIntro(
		input.type,
		input.bookingRef,
		input.thisPaymentLabel,
		thisStr,
		paidStr,
		totalStr,
		remainingStr
	)

	const remainingList = (input.remainingPayments ?? []).filter(
		(p) => p.amount > 0
	)

	const textLines: string[] = [
		`Cześć ${safeName},`,
		'',
		heading,
		'',
		...introLines
	]
	if (remainingList.length > 0 && input.type !== 'fully-paid') {
		textLines.push('', 'Pozostałe płatności:')
		for (const item of remainingList) {
			const due = item.dueAt ? `, termin ${formatDate(item.dueAt)}` : ''
			textLines.push(
				`- ${item.label}: ${formatMoney(item.amount, input.currency)}${due}`
			)
		}
	}
	textLines.push(
		'',
		`Otwórz panel: ${input.panelUrl}`,
		'',
		'Do zobaczenia na pokładzie,',
		'Sailing Architects'
	)

	const remainingHtml =
		remainingList.length > 0 && input.type !== 'fully-paid'
			? `
				<h3 style="margin: 24px 0 8px; font-size: 14px; color: #0d1b2e;">
					Pozostałe płatności
				</h3>
				<ul style="margin: 0 0 18px; padding: 0 0 0 18px; color: #0d1b2e;">
					${remainingList
						.map((item) => {
							const due = item.dueAt
								? ` <span style="color: #607089;">(termin ${escapeHtml(
										formatDate(item.dueAt)
									)})</span>`
								: ''
							return `<li style="margin: 4px 0;">
								<strong>${escapeHtml(item.label)}</strong>:
								${escapeHtml(formatMoney(item.amount, input.currency))}${due}
							</li>`
						})
						.join('')}
				</ul>`
			: ''

	const introHtml = introLines
		.map((line) => `<p style="margin: 4px 0;">${escapeHtml(line)}</p>`)
		.join('')

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 640px; color: #0d1b2e;">
			<h2 style="margin: 0 0 16px;">${escapeHtml(heading)}</h2>
			<p style="margin: 0 0 12px;">Cześć ${escapeHtml(safeName)},</p>
			<div style="margin: 0 0 18px; padding: 14px 18px; border-left: 3px solid #c4923a; background: #f7efdc;">
				${introHtml}
			</div>
			${remainingHtml}
			<p style="margin: 18px 0;">
				<a
					href="${escapeHtml(input.panelUrl)}"
					style="display: inline-block; padding: 12px 24px; background: #c4923a; color: #0d1b2e; text-decoration: none; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 12px;"
				>
					Otwórz panel
				</a>
			</p>
			<p style="margin: 0; color: #607089;">
				Do zobaczenia na pokładzie,<br />Sailing Architects
			</p>
		</div>
	`

	const attachments =
		input.pdf && input.filename
			? [{ name: input.filename, content: input.pdf.toString('base64') }]
			: undefined

	return sendTransactionalEmail({
		to: { email: input.to, name: safeName },
		subject,
		text: textLines.join('\n'),
		html,
		...(attachments ? { attachments } : {})
	})
}
