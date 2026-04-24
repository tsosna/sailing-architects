# AI Handoff — sailing-architects

> Ostatnia aktualizacja: 2026-04-23

---

## Stack

| Warstwa | Technologia |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Backend / DB | Convex 1.x + convex-svelte |
| Styling | Tailwind CSS v4 |
| i18n | Wuchale + @wuchale/svelte |
| Payments | Stripe 22.x |
| Deploy | Vercel |
| Package manager | **pnpm** (wyłącznie) |

---

## Zaimplementowane

### Strony

| Trasa | Plik | Status |
|---|---|---|
| `/` | `src/routes/+page.svelte` | Szkielet |

### Infrastruktura

- `setupConvex(PUBLIC_CONVEX_URL)` — inicjalizacja w root layout
- `src/lib/server/stripe.ts` — singleton Stripe client
- `src/routes/api/stripe/webhook/+server.ts` — webhook z weryfikacją sygnatury
- `src/convex/schema.ts` — schema (pusta)

---

## Otwarte problemy

_(brak na starcie)_

---

## Następne kroki

1. `npx convex dev` — inicjalizacja projektu Convex, wygenerowanie `_generated/`
2. `npx wuchale` — inicjalne scaffoldowanie plików `.po`
3. Uzupełnić `src/convex/schema.ts` o tabele projektu
4. Uzupełnić `src/app.css` `@theme` o kolory projektu
5. Zbudować główną stronę

---

## Komendy szybkiego startu

```bash
pnpm dev                    # dev server (Vite)
npx convex dev              # Convex backend dev (osobny terminal)
pnpm check                  # type check
pnpm lint                   # prettier + check
npx wuchale                 # ekstrakcja stringów i18n
```

---

<!-- Wpisy sesji poniżej (od najnowszych) -->

## Sesja 2026-04-24 — Setup projektu sailing-architects

### Zmiany
- Stworzony `sveltekit-starter` (template publiczny: `tsosna/sveltekit-starter`) — SvelteKit + Convex + Wuchale + Stripe + Tailwind v4
- Sklonowany jako `sailing-architects` (`tsosna/sailing-architects`), podmienione placeholdery
- Dodane `.mcp.json` (Svelte MCP) + `.claude/settings.json` (hooks, gitignorowany)
- Wgrane zdjęcia broszury do `docs/assets/`
- Wgrane pliki z Claude Design do `docs/design/design_handoff_sailing_architects/`
- `src/app.css` — tokeny navy/brass + Google Fonts (Playfair Display + DM Sans)
- `src/convex/schema.ts` — 4 tabele: `voyageSegments`, `berths`, `bookings`, `crewProfiles`
- `AGENTS.md` — Clerk, design tokens, routing, stany SVG koji
- Gałąź `production` na GitHubie (dla Vercel)

### Decyzje
- **Convex zamiast Prisma** — rezerwacja kajut to problem real-time (race condition na dostępności)
- **Wuchale zamiast Paraglide** — zero-touch i18n, lepsze dla małego projektu
- **Clerk zamiast własnej auth** — dane wrażliwe załogi; Clerk jest GDPR-compliant out-of-box
- **`convex/_generated/` w gitignore** — auto-generowane przez `npx convex dev`
- **`.claude/settings.json` w gitignore** — absolutne ścieżki do kompilatora, nieprzenosalne
- **`.mcp.json` commitowany** — używa `npx`, przenośny między maszynami

### Wnioski
- Claude Design generuje kompletny handoff (tokeny, schema, JSX komponenty, routing) — warto zaczynać każdy projekt od Design przed kodowaniem
- Przy klonowaniu template gdy `docs/` już istnieje — sprawdzić czy pliki nie lądują w `docs/docs/`
- `convex/_generated/` pojawia się w root `convex/` nawet gdy funkcje są w `src/convex/` — gitignorować oba

### Następne kroki
#### Next
- Zainstalować Clerk (`svelte-clerk` + `@clerk/clerk-js`), dodać klucze do `.env.example`
- `npx convex dev` — inicjalizacja projektu Convex w chmurze
- `npx wuchale` — scaffoldowanie `locales/`
- Struktura routes: `[[lang]]/+layout.svelte`, `/book/`, `/dashboard/`
- Komponent `BoatPlan.svelte` — wzorzec w `docs/design/.../components/boat-plan.jsx`

#### Later
- Podmienić placeholdery zdjęć na rzeczywiste fotografie
- Seed danych: 4 etapy Sail Adventure 2026 (Palma → Cabo Verde)
- Generowanie PDF potwierdzenia rezerwacji

#### Open questions
- Czy `[[lang]]` Wuchale działa tak samo jak `[[lang=lang]]` Paraglide? Weryfikacja przy `npx wuchale`
- Czy `svelte-clerk` jest gotowy na Svelte 5 runes?
