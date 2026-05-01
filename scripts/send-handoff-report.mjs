import { basename } from 'node:path'
import { readFile } from 'node:fs/promises'
import { parseArgs, sendBrevoEmail } from './brevo-mail.mjs'

async function main() {
	const {
		to,
		subject,
		'html-file': htmlFile,
		attach
	} = parseArgs(process.argv.slice(2))

	if (!to) throw new Error('Missing --to')
	if (!subject) throw new Error('Missing --subject')
	if (!htmlFile) throw new Error('Missing --html-file')

	const html = await readFile(htmlFile, 'utf8')
	const attachments = attach
		? [
				{
					name: basename(attach),
					content: (await readFile(attach)).toString('base64')
				}
			]
		: undefined
	const result = await sendBrevoEmail({ to, subject, html, attachments })

	console.log(`Sent: ${result?.messageId ?? 'unknown-id'}`)
}

await main()
