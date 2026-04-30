# AGENTS.md — sailing-architects

## Package Manager & Commands

- **pnpm** only (not npm, yarn, or bun)
- One-off CLI: `pnpx`
- Codex context bootstrap: `pnpm codex:start` writes `docs/codex-session-context.md`
- Codex session capture: `pnpm codex:stop -- ...`; `pnpm codex:compact -- ...` before manual compaction
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

## Codex Session Context

Codex does not receive Claude Code `SessionStart`, `PreCompact`, or `SessionEnd` hooks automatically.

At the beginning of substantial work:

1. Read `CODEX.md` for the Codex-specific workflow.
2. If `docs/codex-session-context.md` exists, read it as the manual equivalent of Claude Code's startup context.
3. If it does not exist, tell the user to run `pnpm codex:start` or run it yourself before continuing.
4. Use the `Knowledge Base Index` inside that file to decide which full wiki articles to read on demand.
5. On `close session`, follow the shutdown procedure in `CLAUDE.md`, then use `pnpm codex:stop -- ...` if the summary should be written to the shared daily log.

---

## Stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Framework    | SvelteKit 2 + Svelte 5 (runes)                        |
| Backend / DB | Convex (`convex` + `convex-svelte`)                   |
| Auth         | Clerk (`@clerk/clerk-js` + `svelte-clerk`)            |
| Styling      | Tailwind CSS v4 (CSS-first)                           |
| i18n         | Wuchale (`wuchale` + `@wuchale/svelte`)               |
| Payments     | Stripe (`stripe` server + `@stripe/stripe-js` client) |
| Deploy       | Vercel (`@sveltejs/adapter-vercel`)                   |

---

## Design — Sailing Architects Visual Identity

Pełna specyfikacja: `docs/design/design_handoff_sailing_architects/README.md`
Interaktywny prototyp: `docs/design/design_handoff_sailing_architects/Sailing Architects.html`

### Paleta kolorów

| Token                 | Hex                      | Użycie                                  |
| --------------------- | ------------------------ | --------------------------------------- |
| `--color-navy`        | `#0d1b2e`                | Główne tło, hero, footer                |
| `--color-navy-mid`    | `#0f1f35`                | Sekcje naprzemienne (trasa, cennik)     |
| `--color-navy-light`  | `#162840`                | Sekcje jasniejsze                       |
| `--color-navy-deep`   | `#07111e`                | Footer bottom bar                       |
| `--color-brass`       | `#c4923a`                | Akcent — CTA, highlights, aktywne stany |
| `--color-brass-light` | `#d4aa5a`                | Hover brass                             |
| `--color-warm-white`  | `#f5f0e8`                | Tekst główny                            |
| `--color-cream`       | `#ede5d8`                | Tekst drugorzędny                       |
| `--color-muted`       | `rgba(245,240,232,0.45)` | Tekst wyciszony                         |

### Typografia

- **Nagłówki:** Playfair Display (serif) — weights 400/600, italic variant
- **UI/body:** DM Sans (sans-serif) — weights 300/400/500/600/700
- H1: `clamp(40px, 6vw, 76px)`, lineHeight 1.05
- Google Fonts import jest w `src/app.css`

### Spacing / Layout

- `max-width: 1100px` (centred)
- Section padding: `96px 40px`
- Nav height: `64px` fixed
- **border-radius: 0px wszędzie** (sharp, architectural)
- Separator trick: `gap: 1px` na `rgba(196,146,58,0.1)` bg + child bg = optyczny border

### Tonal layering (bez linii działowych)

- Sekcja główna: `#0d1b2e` (hero, jacht, kajuty, FAQ, footer)
- Sekcja naprzemiennia: `#0f1f35` (trasa, cennik)

### Stany interaktywne koja (BoatPlan SVG)

```
available: fill rgba(245,240,232,0.12), stroke #c4923a 0.8px
hovered:   fill rgba(196,146,58,0.22), stroke #c4923a
selected:  fill rgba(196,146,58,0.85), stroke #c4923a 1.5px
taken:     fill rgba(13,27,46,0.55),   stroke #3a4a5c + przekreślenie
```

---

## Auth — Clerk

- Pakiet: `svelte-clerk` (SvelteKit adapter) + `@clerk/clerk-js`
- `PUBLIC_CLERK_PUBLISHABLE_KEY` — `$env/static/public`
- `CLERK_SECRET_KEY` — `$env/static/private`
- `ClerkProvider` w root `+layout.svelte`
- Guard na `/dashboard`: `+layout.server.ts` sprawdza `auth().userId`
- Guard na `/book/crew` i dalej: wymaga zalogowania
- Clerk user ID (`userId`) jest kluczem w tabelach Convex: `bookings`, `crewProfiles`
- **NIE implementuj własnej auth** — Clerk obsługuje sesje, tokeny, GDPR

---

## Routing (SvelteKit + Wuchale)

```
src/routes/
├── [[lang]]/                     ← Wuchale i18n wrapper (PL/EN)
│   ├── +layout.svelte            ← ClerkProvider + setupConvex + Nav + Footer
│   ├── +page.svelte              ← Landing page
│   ├── book/
│   │   ├── +page.svelte          ← Booking flow (5 kroków, wymaga Clerk)
│   │   └── +layout.server.ts     ← guard: redirect jeśli !userId
│   └── dashboard/
│       ├── +page.svelte          ← Panel użytkownika
│       └── +layout.server.ts     ← guard: redirect jeśli !userId
```

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
	handler: async (ctx) => ctx.db.query('items').collect()
})

export const create = mutation({
	args: { name: v.string() },
	handler: async (ctx, args) => ctx.db.insert('items', args)
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
	adapters: { main: svelte({ loader: 'svelte' }) }
})
```

### Vite plugin — kolejność krytyczna

```ts
// vite.config.ts
plugins: [
	wuchale(), // MUSI być przed sveltekit()
	tailwindcss(),
	sveltekit()
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
	metadata: { bookingId: '...' }
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

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `src/convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
