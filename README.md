# SvelteKit Starter

Opinionated SvelteKit template with Convex, Wuchale i18n, Stripe, and Tailwind CSS v4.

## Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Backend / DB | [Convex](https://convex.dev) — realtime, reactive, no migrations |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` in `app.css`) |
| i18n | [Wuchale](https://wuchale.dev) — zero-code-change, PO files |
| Payments | [Stripe](https://stripe.com) — Payment Intents + webhook |
| Deploy | Vercel |

## Getting started

**1. Clone and install**

```sh
git clone https://github.com/tomek-sosinski/sveltekit-starter my-project
cd my-project
pnpm install
```

**2. Set up environment variables**

```sh
cp .env.example .env
# fill in real values
```

**3. Initialize Convex** (creates `src/convex/_generated/` and links to cloud)

```sh
npx convex dev
```

**4. Initialize Wuchale** (scaffolds `locales/` and extracts strings)

```sh
npx wuchale
```

**5. Start development**

```sh
pnpm dev        # Vite dev server
npx convex dev  # Convex backend (separate terminal)
```

## Checklist before first commit

- [ ] Replace `[project-name]` in `CLAUDE.md`, `AGENTS.md`, `docs/handoff.md`
- [ ] Fill `src/convex/schema.ts` with your tables
- [ ] Update `@theme` tokens in `src/app.css` to match your brand colors
- [ ] Fill in real Stripe + Convex keys in `.env`
- [ ] Update `wuchale.config.js` if you need different locales

## Key commands

```sh
pnpm dev              # dev server
pnpm build            # production build
pnpm check            # TypeScript + Svelte type check
pnpm lint             # Prettier + ESLint
npx convex dev        # Convex backend dev mode
npx wuchale           # extract/update i18n strings
```

## Project structure

```
src/
├── app.css                         # Tailwind v4 @theme tokens
├── convex/
│   ├── schema.ts                   # Convex DB schema
│   └── http.ts                     # HTTP actions (e.g. Stripe webhook via Convex)
├── lib/
│   ├── components/                 # Svelte components
│   └── server/
│       └── stripe.ts               # Stripe singleton client
└── routes/
    ├── +layout.svelte              # setupConvex here
    └── api/stripe/webhook/
        └── +server.ts              # Stripe webhook handler
```

## Notes

- `prettier-plugin-tailwindcss` is pinned to an insiders build — only version with Tailwind v4 support
- Convex functions live in `src/convex/` (not root `convex/`) — required by SvelteKit's module resolution
- Wuchale auto-extracts strings from `.svelte` files — no manual `m.*` wrappers needed
- Never use `process.env.*` — always `$env/static/private` or `$env/static/public`
