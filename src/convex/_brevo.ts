// Brevo transactional email helper for Convex actions.
// Mirrors src/lib/server/email.ts but uses process.env (Convex runtime) so it
// can be called from internal actions without depending on SvelteKit env.
// Files prefixed with `_` are excluded from the Convex public API.

const BREVO_TRANSACTIONAL_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'

export type BrevoSendInput = {
	to: { email: string; name?: string }
	subject: string
	html: string
	text?: string
	replyTo?: { email: string; name?: string }
}

export type BrevoSendResult = {
	messageId?: string
}

function readEnv(name: string): string | undefined {
	const value = process.env[name]
	return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function isDryRun(): boolean {
	const flag = readEnv('REMINDERS_DRY_RUN')
	return flag === '1' || flag === 'true'
}

export async function brevoSend(
	input: BrevoSendInput
): Promise<BrevoSendResult> {
	const apiKey = readEnv('BREVO_API_KEY')
	const fromEmail = readEnv('BREVO_FROM_EMAIL')
	if (!apiKey || !fromEmail) {
		throw new Error(
			'Missing Brevo env in Convex (BREVO_API_KEY or BREVO_FROM_EMAIL)'
		)
	}

	if (isDryRun()) {
		console.log(
			'[reminders dry-run] would send to',
			input.to.email,
			'·',
			input.subject
		)
		return { messageId: 'dry-run' }
	}

	const body = {
		sender: { email: fromEmail },
		to: [input.to],
		subject: input.subject,
		htmlContent: input.html,
		...(input.text ? { textContent: input.text } : {}),
		...(input.replyTo ? { replyTo: input.replyTo } : {})
	}

	const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'api-key': apiKey,
			'content-type': 'application/json'
		},
		body: JSON.stringify(body)
	})

	const raw = await response.text()
	let parsed: unknown = null
	try {
		parsed = raw ? JSON.parse(raw) : null
	} catch {
		parsed = raw
	}
	if (!response.ok) {
		throw new Error(
			`Brevo email failed (${response.status} ${response.statusText}): ${
				typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
			}`
		)
	}

	const messageId =
		parsed &&
		typeof parsed === 'object' &&
		'messageId' in parsed &&
		typeof (parsed as { messageId: unknown }).messageId === 'string'
			? ((parsed as { messageId: string }).messageId as string)
			: undefined

	return { messageId }
}

export function panelUrl(path = '/dashboard'): string {
	const base =
		readEnv('PUBLIC_APP_URL') ?? 'https://sailing-architects.wysokijohn.pl'
	return `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;')
}

export function formatMoney(grosze: number, currency = 'pln'): string {
	const value = (grosze / 100).toLocaleString('pl-PL', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})
	return `${value} ${currency.toUpperCase()}`
}

export function formatDate(timestamp?: number): string {
	if (!timestamp) return ''
	return new Date(timestamp).toLocaleDateString('pl-PL', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	})
}
