// Osobny config dla vitest — CELOWO nie używamy vite.config.ts.
// Vitest domyślnie czytałby vite.config.ts i ładował pluginy
// (wuchale, sveltekit) — niepotrzebne i kruche dla czystych testów TS.
// Obecność tego pliku sprawia, że vitest ignoruje vite.config.ts.
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts']
	}
})
