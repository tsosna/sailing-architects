import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	writeFileSync
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

const knowledgeRoot =
	'/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/knowledge-vault/wiki'
const dailyRoot =
	'/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/claude-memory-compiler/daily'
const outputPath = join(projectRoot, 'docs/codex-session-context.md')

function readText(path) {
	if (!existsSync(path)) {
		return `_Missing: ${path}_\n`
	}

	return readFileSync(path, 'utf8').trim()
}

function headingSlice(text, pattern, maxSections) {
	const matches = [...text.matchAll(pattern)]

	if (matches.length === 0) {
		return text.trim()
	}

	const start = matches[Math.max(0, matches.length - maxSections)].index ?? 0
	return text.slice(start).trim()
}

function latestFiles(dir, count) {
	if (!existsSync(dir)) {
		return []
	}

	return readdirSync(dir)
		.filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
		.sort()
		.slice(-count)
		.map((name) => join(dir, name))
}

function section(title, body) {
	return `## ${title}\n\n${body.trim()}\n`
}

const handoff = readText(join(projectRoot, 'docs/handoff.md'))
const handoffRecent = headingSlice(handoff, /^## Sesja .*$/gm, 5)

const dailySections = latestFiles(dailyRoot, 3)
	.map((path) => `### ${path.split('/').at(-1)}\n\n${readText(path)}`)
	.join('\n\n')

const context = [
	'# Codex Session Context — sailing-architects',
	'',
	`Generated: ${new Date().toISOString()}`,
	'',
	section(
		'How To Use This File',
		[
			'This is the manual Codex equivalent of the Claude Code session-start hook.',
			'Read `AGENTS.md` as the active project instruction file.',
			'Use the knowledge index below for retrieval: read full wiki articles only when they match the current task.',
			'Use `docs/handoff.md` and recent daily logs to understand what happened before this session.'
		].join('\n')
	),
	section(
		'Claude Hook Settings',
		readText(join(projectRoot, '.claude/settings.json'))
	),
	section('CLAUDE.md', readText(join(projectRoot, 'CLAUDE.md'))),
	section('AGENTS.md', readText(join(projectRoot, 'AGENTS.md'))),
	section('Knowledge Base Index', readText(join(knowledgeRoot, 'index.md'))),
	section('Recent Handoff Entries', handoffRecent),
	section(
		'Recent Daily Logs',
		dailySections || `_No daily logs found in ${dailyRoot}_`
	)
].join('\n')

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${context}\n`)

console.log(`Codex session context written to ${outputPath}`)
console.log('')
console.log('Next step in the Codex panel:')
console.log(
	'1. Ask Codex to read docs/codex-session-context.md if it has not already done so.'
)
console.log('2. Then continue the session normally.')
