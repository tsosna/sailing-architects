import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const closeScript =
	'/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/knowledge-vault/scripts/codex-session-close'

const forwardedArgs = process.argv.slice(2)
if (forwardedArgs[0] === '--') {
	forwardedArgs.shift()
}

const args = [
	closeScript,
	'--project',
	'sailing-architects',
	'--project-root',
	projectRoot,
	...forwardedArgs
]

const result = spawnSync('python3', args, { stdio: 'inherit' })
process.exit(result.status ?? 1)
