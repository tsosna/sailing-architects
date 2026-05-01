const BREVO_TRANSACTIONAL_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'

export function parseArgs(argv) {
	const args = {}

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i]

		if (!arg.startsWith('--')) continue

		const key = arg.slice(2)
		const next = argv[i + 1]

		if (!next || next.startsWith('--')) {
			args[key] = true
			continue
		}

		args[key] = next
		i += 1
	}

	return args
}

export function requireEnv(name) {
	const value = process.env[name]

	if (!value) {
		throw new Error(`Missing ${name} in environment`)
	}

	return value
}

export async function sendBrevoEmail({
	to,
	subject,
	html,
	text,
	replyTo,
	attachments
}) {
	const apiKey = requireEnv('BREVO_API_KEY')
	const from = requireEnv('BREVO_FROM_EMAIL')

	const recipients = Array.isArray(to) ? to : [to]

	if (recipients.length === 0 || recipients.some((recipient) => !recipient)) {
		throw new Error('At least one recipient is required')
	}

	const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'api-key': apiKey,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			sender: { email: from },
			to: recipients.map((email) => ({ email })),
			subject,
			htmlContent: html,
			...(text ? { textContent: text } : {}),
			...(replyTo ? { replyTo: { email: replyTo } } : {}),
			...(attachments?.length ? { attachment: attachments } : {})
		})
	})

	const raw = await response.text()
	let body = raw

	try {
		body = raw ? JSON.parse(raw) : null
	} catch {
		// Keep raw Brevo response for diagnostics.
	}

	if (!response.ok) {
		throw new Error(
			`Brevo transactional email failed (${response.status} ${response.statusText}): ${JSON.stringify(body)}`
		)
	}

	return body
}
