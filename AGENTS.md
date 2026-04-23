# AGENTS.md — [project-name]

## Package Manager & Commands

- **pnpm** only (not npm, yarn, or bun)
- One-off CLI: `pnpx`
- After code changes: `pnpm check` and `pnpm lint`
- Dev: `pnpm dev`
- Build: `pnpm build`

## Formatting

- Tabs for indentation
- No semicolons
- Single quotes
- No trailing commas
- Prettier plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`

---

## Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Backend / DB | Convex (`convex` + `convex-svelte`) |
| Styling | Tailwind CSS v4 (CSS-first) |
| i18n | Wuchale (`wuchale` + `@wuchale/svelte`) |
| Payments | Stripe (`stripe` server + `@stripe/stripe-js` client) |
| Deploy | Vercel (`@sveltejs/adapter-vercel`) |

---

## Styling — Tailwind CSS v4 (CSS-first)

- **Brak `tailwind.config.ts`** — konfiguracja przez `@theme` w `src/app.css`
- **Brak `postcss.config.js`** — Tailwind v4 używa `@tailwindcss/vite`
- **Brak `lang="postcss"`** w blokach `<style>` — zbędne w Tailwind v4
- Kolory przez CSS variables: `bg-primary`, `text-on-surface` (zdefiniowane w `@theme`)
- `@apply` działa tylko w globalnym CSS, nie w `<style>` komponentów

---

## Convex — Backend & Realtime DB

### Konfiguracja
- Funkcje backendu w `src/convex/` (zmienione z domyślnego `convex/` — wymagane przez SvelteKit)
- `convex.json` musi zawierać `"functions": "src/convex/"`
- `PUBLIC_CONVEX_URL` w `.env` — URL deploymentu

### Integracja w SvelteKit
- `setupConvex(PUBLIC_CONVEX_URL)` **MUSI** być wywołane w root `+layout.svelte` — inicjalizuje klienta globalnie
- Używaj `$env/static/public` dla `PUBLIC_CONVEX_URL` — nigdy `process.env.*`

### Queries i mutacje w komponentach
```ts
import { useQuery, useMutation } from 'convex-svelte'
import { api } from '../convex/_generated/api'

// Query (reaktywna subskrypcja)
const items = useQuery(api.items.list, {})
// $items.data, $items.isLoading, $items.error

// Mutacja
const create = useMutation(api.items.create)
await create({ name: 'example' })
```

### Definicja funkcji Convex
```ts
// src/convex/items.ts
import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query('items').collect(),
})

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => ctx.db.insert('items', args),
})
```

### Schema
- Definicja w `src/convex/schema.ts`
- Typy przez `v.string()`, `v.number()`, `v.id('tableName')` etc.
- **Brak migracji SQL** — zmiany schematu przez `npx convex dev` (hot reload)

### Webhook od Stripe → Convex
- Stripe webhook trafia do `src/routes/api/stripe/webhook/+server.ts`
- Po weryfikacji sygnatury — wywołaj Convex mutation przez HTTP action lub `ConvexHttpClient`

### Dev workflow
```bash
npx convex dev   # uruchom razem z pnpm dev (osobny terminal)
```

---

## Wuchale — i18n (zero-code-change)

### Jak działa
- Wuchale automatycznie wyciąga stringi z komponentów Svelte do plików `.po`
- **Nie owijaj stringów** ręcznie — pisz naturalny kod: `<p>Witaj</p>` → wyciągnie samo
- Pliki tłumaczeń w `locales/pl/`, `locales/en/` (format Gettext `.po`)

### Konfiguracja
```js
// wuchale.config.js
import { adapter as svelte } from '@wuchale/svelte'
import { defineConfig } from 'wuchale'

export default defineConfig({
  locales: ['pl', 'en'],
  adapters: { main: svelte({ loader: 'svelte' }) },
})
```

### Vite plugin — kolejność krytyczna
```ts
// vite.config.ts
plugins: [
  wuchale(),    // MUSI być przed sveltekit()
  tailwindcss(),
  sveltekit(),
]
```

### Workflow
1. Napisz komponenty naturalnie (bez `m.*` czy `t()`)
2. `npx wuchale` — inicjalne scaffoldowanie katalogów i ekstrakcja
3. Edytuj `.po` pliki dla każdej lokalizacji
4. HMR automatycznie ładuje zmiany tłumaczeń

### Czego NIE robić
- Nie używaj `@inlang/paraglide-js` — ten projekt używa Wuchale
- Nie twórz ręcznie plików `.po` — wygeneruj przez `npx wuchale`
- Pliki `locales/` są w `.prettierignore` — nie formatuj ich Prettierem

---

## Stripe — Payments

### Klucze
- `STRIPE_SECRET_KEY` — tylko server-side (`$env/static/private`)
- `STRIPE_WEBHOOK_SECRET` — tylko server-side
- `PUBLIC_STRIPE_PUBLISHABLE_KEY` — client-side (`$env/static/public`)
- **NIGDY `process.env.*`** — używaj `$env/static/private` lub `$env/static/public`

### Server client
```ts
// src/lib/server/stripe.ts
import Stripe from 'stripe'
import { STRIPE_SECRET_KEY } from '$env/static/private'
export const stripe = new Stripe(STRIPE_SECRET_KEY)
```

### Webhook
- Endpoint: `src/routes/api/stripe/webhook/+server.ts`
- Zawsze weryfikuj sygnaturę: `stripe.webhooks.constructEvent(body, signature, secret)`
- `body` musi być raw string (`.text()`) — nie JSON
- Po weryfikacji aktualizuj stan w Convex

### Payment Intent flow (zalecany dla custom UI)
```ts
// +page.server.ts (action)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 9900, // w groszach
  currency: 'pln',
  metadata: { bookingId: '...' },
})
return { clientSecret: paymentIntent.client_secret }
```

---

## Svelte 5 — Runes

### `$props()` — zawsze z generic
```ts
// poprawne
let { data, form } = $props<{ data: PageData; form: ActionData }>()
// unikaj
let { data, form }: { data: PageData; form: ActionData } = $props()
```

### Zmienne środowiskowe
- `$env/static/private` — build-time, server-only
- `$env/static/public` — build-time, dostępne w przeglądarce
- **Nigdy `process.env.*`** — Vite module runner nie wstrzykuje `.env`

### MCP Server dla Svelte (opcjonalny)
Jeśli skonfigurowany: `@sveltejs/mcp` w `.mcp.json` w rocie projektu.
Dostarcza: `list-sections`, `get-documentation`, `svelte-autofixer`.

---

## File Conventions

- Komponenty: kebab-case katalogi (`src/lib/components/booking-form/booking-form.svelte`)
- State: `*-state.svelte.ts`
- Barrel exports: `index.ts` w każdym katalogu komponentu
- Server-only: `src/lib/server/`
- Convex functions: `src/convex/*.ts`
- Path aliases: `$components` → `src/lib/components`

## Files That Should NOT Exist

- `postcss.config.js` — Tailwind v4 używa Vite plugin
- `tailwind.config.ts` — konfiguracja przez `@theme` w CSS
- `convex/` w rocie projektu — funkcje są w `src/convex/` (SvelteKit wymaga)

## What to Avoid

- `process.env.*` dla zmiennych środowiskowych
- Lokalne obrazy zamiast zewnętrznego storage (Cloudinary / Convex file storage)
- Ręczne owijanie stringów w funkcje i18n (Wuchale robi to automatycznie)
- `pnpm add @inlang/paraglide-js` — ten projekt używa Wuchale
- Raw `body` jako JSON w webhook handlerze — Stripe wymaga tekstu do weryfikacji sygnatury
