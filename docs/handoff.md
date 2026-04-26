# AI Handoff — sailing-architects

> Ostatnia aktualizacja: 2026-04-23

---

## Stack

| Warstwa         | Technologia                    |
| --------------- | ------------------------------ |
| Framework       | SvelteKit 2 + Svelte 5 (runes) |
| Backend / DB    | Convex 1.x + convex-svelte     |
| Styling         | Tailwind CSS v4                |
| i18n            | Wuchale + @wuchale/svelte      |
| Payments        | Stripe 22.x                    |
| Deploy          | Vercel                         |
| Package manager | **pnpm** (wyłącznie)           |

---

## Zaimplementowane

### Strony

| Trasa | Plik                      | Status   |
| ----- | ------------------------- | -------- |
| `/`   | `src/routes/+page.svelte` | Szkielet |

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

## Sesja 2026-04-25 — Clerk + landing + booking + dashboard

### Zmiany

- **Clerk**: pakiet `svelte-clerk@1.1.5` + `@clerk/clerk-js@6.7.7`. `src/hooks.server.ts` z `withClerkHandler()`, root `+layout.server.ts` z `buildClerkProps(locals.auth())`, root `+layout.svelte` opakowany w `<ClerkProvider>`. Klucze `PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` w `.env.example`/`.env.local`.
- **Landing** (`[[lang=lang]]/+page.svelte`): 7 sekcji — Hero, Vessel, Route, Cabins, Pricing, FAQ, Footer. SiteNav przeniesiony do `[[lang=lang]]/+layout.svelte`.
- **Komponenty UI**: `site-nav`, `vessel-section`, `route-section`, `boat-plan` (SVG floor plan 200×520, 10 koje A1–E2 w 4 stanach available/hovered/selected/taken), `cabins-section` (segment picker + BoatPlan + selection banner), `pricing-section` (4 karty z separator-trick, badge OSTATNIE MIEJSCA), `faq-section` (accordion 6 pytań), `site-footer`, `booking-input` (reusable z `$bindable`, obsługa text/email/password/date/tel/textarea/select), `step-indicator` (5-step visual progress).
- **Współdzielone dane**: `$lib/data/voyage-segments.ts` (4 etapy s1–s4) + `$lib/data/cabins.ts` (5 kajut + helper `findCabinByBerth`).
- **Booking flow** (`[[lang=lang]]/book/+page.svelte`): 5-krokowy formularz inline ze `$state(step)`, Krok 1 z `<SignIn>`/`<SignUp>` ze svelte-clerk + reaktywnym banner "Zalogowano jako" gdy sesja aktywna; Krok 2 formularz crew (12 pól, 3 sekcje); Krok 3 confirm card; Krok 4 mock Stripe (4 pola card/exp/cvc/name + summary box); Krok 5 success z linkiem do dashboardu. URL params `?segment=&berth=` z fallbackami. Guard `book/+layout.server.ts` eksponuje `userId` bez redirectu (Step 1 to sama auth).
- **Dashboard** (`[[lang=lang]]/dashboard/+page.svelte`): 3 taby — Rezerwacja (status banner + voyage card + timeline 5 portów + 2 CTA), Dane załogi (grid 9 kart z `border-left: 2px brass dim`), Dokumenty (lista 4 plików z hover). Header z back-link + eyebrow + H1 "Cześć, {firstName}" (z `useClerkContext().user?.firstName`) + box numeru rezerwacji. Mockowane dane (gotowe pod Convex queries). Guard `dashboard/+layout.server.ts` redirect 303 do `/book` gdy `!userId`.

### Decyzje

- **`[[lang=lang]]` zamiast `[[lang]]`** — wymaga matchera `src/params/lang.ts` (już był z template), bezpieczniejsze bo matchuje tylko `pl|en`. Zamknięty open question z poprzedniej sesji.
- **Inline steps w booking** (`{#if step === N}`) zamiast 5 osobnych komponentów — propsy `next/back/state/segment/berth` byłyby boilerplate, jeden plik (~600 linii) jest manageable.
- **Diagonal pattern przez CSS** `repeating-linear-gradient` zamiast SVG `<pattern url(#id)>` — `url(#id)` jest document-scoped i nie crossuje granic komponentów.
- **Stan `selectedBerth` w `cabins-section`**, nie liftowany — booking flow ma własne źródło prawdy (URL params + docelowo Convex). Self-contained sekcja landingowa.
- **A11y**: `<div role="tablist">` zamiast `<nav>`, `<div role="tabpanel">` zamiast `<section>` — landmarki nie mogą mieć interaktywnych ról ARIA. `<label>` jako wrapper w `BookingInput` zamiast `for=/id=` — prostsze native association.
- **`useClerkContext()` reaktywny** — gdy user loguje się w `<SignIn>`, Step 1 → Step 2 odblokuje się bez full reload.
- **Footer w `+page.svelte`** (nie w layout) — booking i dashboard dostaną własny lub żaden; landingowy mocno marketingowy.
- **Mockowane dane w dashboardzie** — `booking`, `profile`, `docs` jako lokalne const. Docelowo Convex queries `api.bookings.byUser`, `api.crewProfiles.byUser`, lista plików ze storage.

### Wnioski

- **`url(#id)` w SVG jest document-scoped** — nie crossuje granic komponentów, reusable patterny lepiej w CSS. → Promocja: `concepts/svg-url-id-document-scoped.md`
- **`<nav>`/`<section>` + ARIA tablist/tabpanel** — landmarki nie przyjmują interaktywnych ról; użyj `<div>`. → Promocja: `concepts/aria-tablist-tabpanel-non-interactive-elements.md`
- **`$effect` ze scroll-listenerem to legitymny pattern** — autofixer flaguje pisanie do `$state` z effectu jako "malpractice", ale to false positive dla event-driven state. → Promocja: `concepts/svelte5-effect-event-listener-pattern.md`
- **`svelte-kit sync` typuje `$env/*` z `.env.example`** — brakujący klucz tam = type error mimo że runtime z `.env.local` działa. → Promocja: `concepts/sveltekit-sync-types-from-env-example.md`
- **`resolve()` z `$app/paths` wymagany przez autofixer** dla absolute paths; pure hash anchory (`#vessel`) zostawić bez `resolve()`.
- **Clerk `<SignIn>`/`<SignUp>` crashują przy mount bez kluczy w `.env.local`** — `pnpm dev` wymaga skonfigurowanych kluczy z `dashboard.clerk.com`.

### Następne kroki

#### Next

- `npx convex dev` — inicjalizacja, generowanie `_generated/`, podpięcie pod queries/mutations
- Convex queries dla landingu (`voyageSegments`, `takenBerths` per segment) i dashboardu (`bookings.byUser`, `crewProfiles.byUser`)
- Convex mutations dla booking flow: Step 2 → save crew profile, Step 4 → create booking + Stripe Payment Intent
- Stripe Elements w Step 4 (zamiana mock fields na `<PaymentElement>` + clientSecret z server action)
- Walidacja required pól w booking (zod + sveltekit-superforms — obecnie tylko Step 1 jest gated)

#### Later

- Klucze Clerk w `.env.local` (z `dashboard.clerk.com`) — bez nich `<SignIn>` crashuje
- Stripe webhook → Convex mutation (`api/stripe/webhook/+server.ts` już istnieje, dopisać call do Convex po `payment_intent.succeeded`)
- Wuchale `npx wuchale` — scaffolding `locales/pl,en/`, ekstrakcja stringów
- Sign-out w dashboardzie (`<SignOutButton>` ze svelte-clerk w narożniku)
- Locale-aware redirects (preserve `/{lang}/` w guardach — obecnie `/book` resetuje locale)
- Zdjęcia hero/jacht/mapa (podmiana diagonal pattern placeholderów)
- Booking step state w URL (`?step=N`) żeby F5 nie resetował
- Refactor `route-section` żeby używał wspólnego `voyageSegments` (obecnie ma własne stages z opisami — rozszerzyć typ `VoyageSegment` o `desc/from/to/num`)
- Logo SA — extract do `sa-logo` komponentu (obecnie duplikowany w `site-nav` + `site-footer`)

#### Open questions

- Clerk SignIn/SignUp styling: `appearance` prop wystarczy do dopasowania tokenów (brass/navy/Playfair), czy iść w custom UI z `useSignIn`/`useSignUp`?
- Czy `voyageSegments` i `cabins` powinny być w Convex czy hardcoded w `$lib/data/`? (Stabilne — być może hardcode lepszy; berths z dostępnością na pewno w Convex.)
- Routing locale: URL `/pl/`/`/en/` czy Wuchale zero-touch z cookie/header? Weryfikacja przy `npx wuchale`.
