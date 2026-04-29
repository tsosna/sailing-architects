import { parseArgs, sendBrevoEmail } from './brevo-mail.mjs'

async function main() {
	const { to, subject = 'Sailing Architects — test Brevo' } = parseArgs(
		process.argv.slice(2)
	)

	if (!to) throw new Error('Missing --to')

	const result = await sendBrevoEmail({
		to,
		subject,
		text: 'Test transactional email from Sailing Architects via Brevo.',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0d1b2e;">
				<h1 style="margin: 0 0 12px; color: #0d1b2e;">Sailing Architects</h1>
				<p style="margin: 0 0 16px;">Test transactional email from Brevo.</p>
				<p style="margin: 0; color: #607089;">If this reached your inbox, the backend email adapter is configured correctly.</p>
			</div>
		`
	})

	console.log(`Sent: ${result?.messageId ?? 'unknown-id'}`)
}

await main()
