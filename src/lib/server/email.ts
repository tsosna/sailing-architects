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
	replyTo
}: SendTransactionalEmailInput): Promise<SendTransactionalEmailResult> {
	assertEmailEnv()

	const body = {
		sender: { email: BREVO_FROM_EMAIL },
		to: normalizeRecipients(to),
		subject,
		htmlContent: html,
		...(text ? { textContent: text } : {}),
		...(replyTo ? { replyTo: toBrevoRecipient(replyTo) } : {})
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
