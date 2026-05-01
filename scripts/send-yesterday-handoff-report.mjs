import { readFile } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { sendBrevoEmail, parseArgs } from './brevo-mail.mjs'

function pad2(value) {
	return String(value).padStart(2, '0')
}

function formatDate(date) {
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function getYesterdayLocal() {
	const now = new Date()
	const yesterday = new Date(now)
	yesterday.setDate(now.getDate() - 1)
	return yesterday
}

function stripJargon(text) {
	return text
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\(([^)]*\/[^)]*)\)/g, '')
		.replace(/\s{2,}/g, ' ')
		.trim()
}

function extractSectionBlock(sessionBlock, heading) {
	const start = sessionBlock.indexOf(`### ${heading}`)
	if (start === -1) return null

	const afterHeading = sessionBlock.slice(start + `### ${heading}`.length)
	const match = afterHeading.match(/\n### |\n## Sesja /)
	const end = match ? match.index : afterHeading.length
	return afterHeading.slice(0, end).trim()
}

function extractBullets(markdownBlock) {
	if (!markdownBlock) return []
	return markdownBlock
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.startsWith('- '))
		.map((line) => stripJargon(line.slice(2)))
}

function extractSessionsForDate(markdown, dateStr) {
	const headings = [
		...markdown.matchAll(/^## Sesja (\d{4}-\d{2}-\d{2}).*$/gm)
	].map((m) => ({
		date: m[1],
		index: m.index ?? 0
	}))

	const result = []

	for (let i = 0; i < headings.length; i += 1) {
		const head = headings[i]
		if (head.date !== dateStr) continue

		const start = head.index
		const end =
			i + 1 < headings.length ? headings[i + 1].index : markdown.length
		result.push(markdown.slice(start, end).trim())
	}

	return result
}

function pickHighlights(changeBullets) {
	const highlights = []

	const rules = [
		{
			key: 'płatno',
			text: 'Poprawiliśmy niezawodność płatności i potwierdzania rezerwacji.'
		},
		{
			key: 'blokad',
			text: 'Dodaliśmy mechanizm tymczasowej blokady miejsc na czas płatności.'
		},
		{
			key: 'walid',
			text: 'Uspójniliśmy weryfikację danych w formularzu, żeby ograniczyć błędy.'
		},
		{
			key: 'logow',
			text: 'Dopilnowaliśmy, żeby po logowaniu użytkownik wracał do właściwego kroku rezerwacji.'
		},
		{
			key: 'pdf',
			text: 'Dodaliśmy możliwość pobrania potwierdzenia rezerwacji w PDF.'
		}
	]

	for (const rule of rules) {
		if (highlights.length >= 2) break
		if (changeBullets.some((b) => b.toLowerCase().includes(rule.key))) {
			highlights.push(rule.text)
		}
	}

	return highlights
}

function buildHtml({ dateStr, summary, done, attention, nextStep }) {
	const attentionHtml = attention.length
		? `\n\t\t\t\t<h2 style="margin:18px 0 8px;font-size:14px">Co wymaga decyzji lub uwagi</h2>\n\t\t\t\t<ul style="margin:0 0 16px;padding-left:18px;line-height:1.5">\n\t\t\t\t\t${attention.map((item) => `<li>${item}</li>`).join('')}\n\t\t\t\t</ul>\n`
		: ''

	return `<!doctype html>
<html lang="pl">
\t<head>
\t\t<meta charset="utf-8" />
\t\t<meta name="viewport" content="width=device-width, initial-scale=1" />
\t\t<title>Raport prac — ${dateStr}</title>
\t</head>
\t<body style="margin:0;padding:0;background:#f6f6f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
\t\t<div style="max-width:640px;margin:0 auto;padding:24px">
\t\t\t<div style="background:#ffffff;border:1px solid #e8e8e8;padding:20px">
\t\t\t\t<h1 style="margin:0 0 12px;font-size:18px;line-height:1.3">Raport prac — ${dateStr}</h1>
\t\t\t\t<p style="margin:0 0 16px;line-height:1.5">${summary}</p>
\t\t\t\t<h2 style="margin:18px 0 8px;font-size:14px">Co zostało zrobione</h2>
\t\t\t\t<ul style="margin:0 0 16px;padding-left:18px;line-height:1.5">
\t\t\t\t\t${done.map((item) => `<li>${item}</li>`).join('')}
\t\t\t\t</ul>${attentionHtml}
\t\t\t\t<h2 style="margin:18px 0 8px;font-size:14px">Kolejny krok</h2>
\t\t\t\t<p style="margin:0;line-height:1.5">${nextStep}</p>
\t\t\t</div>
\t\t\t<p style="margin:12px 0 0;color:#666;font-size:12px;line-height:1.4">Wiadomość wygenerowana automatycznie na podstawie dziennika prac.</p>
\t\t</div>
\t</body>
</html>`
}

async function main() {
	const args = parseArgs(process.argv.slice(2))
	const to =
		args.to ?? process.env.HANDOFF_REPORT_TO ?? 'msmolarski@jmsstudio.com'
	const dateStr = args.date ?? formatDate(getYesterdayLocal())

	const handoff = await readFile(
		new URL('../docs/handoff.md', import.meta.url),
		'utf8'
	)
	const sessions = extractSessionsForDate(handoff, dateStr)

	if (sessions.length === 0) {
		console.log(`No entries for ${dateStr}`)
		return
	}

	const allChangeBullets = sessions.flatMap((session) =>
		extractBullets(extractSectionBlock(session, 'Zmiany'))
	)
	const allNextBullets = sessions.flatMap((session) =>
		extractBullets(extractSectionBlock(session, 'Następne kroki'))
	)

	const done = allChangeBullets.length
		? allChangeBullets.slice(0, 8)
		: ['Drobne poprawki i porządki w obszarze rezerwacji.']
	const summaryHints = pickHighlights(allChangeBullets)
	const summary = summaryHints.length
		? summaryHints.join(' ')
		: 'Poniżej krótkie podsumowanie prac z wczoraj. Skupiliśmy się na stabilności procesu rezerwacji i dopracowaniu doświadczenia użytkownika.'

	const nextStep = allNextBullets.length
		? allNextBullets.slice(0, 2).join(' ')
		: 'Wykonamy szybki test całego procesu od wyboru miejsc do potwierdzenia rezerwacji.'

	const attention = []

	const html = buildHtml({ dateStr, summary, done, attention, nextStep })
	const outPath = `/private/tmp/sailing-architects-handoff-${dateStr}.html`
	await writeFile(outPath, html, 'utf8')

	const subject = `Raport prac — ${dateStr}`
	const result = await sendBrevoEmail({ to, subject, html })

	console.log(`Sent: ${result?.messageId ?? 'unknown-id'}`)
	console.log(`Draft: ${outPath}`)
}

await main()
