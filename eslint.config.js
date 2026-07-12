import js from '@eslint/js'
import ts from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import svelteConfig from './svelte.config.js'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default ts.config(
	includeIgnoreFile(gitignorePath),
	// 1-3: gotowe zestawy reguł
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,

	// 4: Prettier ma ostatnie słowo w formatowaniu
	prettier,
	...svelte.configs.prettier,

	// 5: zmienne globalne — bez tego ESLint krzyczy że `window` nie istnieje
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},

	// 6: pliki .svelte parsuje parser Svelte, a TS w środku — parser TS
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte'],
				svelteConfig
			}
		}
	},

	// 7: czego nie lintujemy
	{
		ignores: ['src/convex/_generated/']
	},

	// 8: nasze reguły
	{
		rules: {
			eqeqeq: ['error', 'always', { null: 'ignore' }],
			'svelte/no-navigation-without-resolve': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	}
)
