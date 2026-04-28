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

## Sesja 2026-04-26 — Walidacja booking, SignOut, Wuchale, multi-berth

### Zmiany

- **Step 2 walidacja** (`book/+page.svelte`): `validate()` sprawdza required (firstName/lastName/dob/docNumber/emergencyName/emergencyPhone + select swimming/experience), zwraca `{valid, errors}`. `next()` wywołuje walidację przed Convex mutation. `BookingInput` rozszerzony o `error?: string` + `oninput?: () => void` props — czerwona ramka `.field__input--error` i `.field__error` (11px #ef4444). Błąd kasowany przez `clearError(field)` na `oninput`.
- **SignOutButton** w dashboardzie (`dashboard/+page.svelte`): import z `svelte-clerk`, w `.dash__header-right` obok numeru rezerwacji. Klasa `.btn--signout` zdefiniowana przez `:global(...)` — svelte-clerk renderuje button poza scope'em parent componentu.
- **Wuchale**: `npx wuchale` przeszedł — extrakcja stringów z 15 komponentów do `src/locales/pl.po` + `en.po` (single-file layout, nie directory). `src/locales/.wuchale/` już w `.gitignore`.
- **Multi-berth** (cały pipeline): jedna transakcja Stripe = wiele kój.
  - Schema: `bookings.berthId: v.id('berths')` → `berthIds: v.array(v.id('berths'))`
  - `mutations.createBooking`: przyjmuje `berthIds: v.array(v.string())`, waliduje każdą, atomowo patchuje wszystkie na `taken` przed insertem booking. `cancelBooking` iteruje po `booking.berthIds`.
  - `queries.bookingByUser`: dohydratuje `berths` (resolved doc[]) dla dashboardu.
  - `/api/stripe/create-intent`: body `berthIds: string[]`, kwota = `pricePerBerth × count × 100`. 400 na pustą tablicę, 409 (z anulowaniem PI) na konflikt Convex.
  - `BoatPlan`: props `selectedBerths: ReadonlyArray<string>` + `onToggleBerth: (id) => void`. Sidebar listuje wszystkie wybrane.
  - `cabins-section`: `selectedBerths: string[]` + `toggleBerth()`. Banner pluralizuje "koję/koje" + total. URL `?segment=X&berths=A1,B2,...`. `selectSegment()` resetuje wybór przy zmianie etapu (zamiast $effect).
  - `book/+page.svelte`: parsuje CSV `berths` (fallback `['A1']`), confirm rows z listą + count + totalem, payment summary listuje każdą koję, Step 5 pluralizuje copy.
  - `dashboard`: nowy row "Koja/Koje" (joined) + "Liczba miejsc" + cena × count.
- **Bug fix**: `boat-plan.svelte:471-473` — `boat__berth--clickable` aplikuje się też dla `state === 'selected'` (kursor `pointer` zamiast `not-allowed`, bo selected można odznaczyć).

### Decyzje

- **`berthIds: v.array(v.id('berths'))` na `bookings`, nie tabela join** — wszystkie koje w jednym bookingu należą do tego samego segmentu, nie ma potrzeby normalizacji. Atomowość zapewnia jeden mutation transaction.
- **`:global(.btn--signout)` zamiast scoped CSS** — `svelte-clerk` renderuje `<button>` we własnym module; klasa parent componentu nie zaaplikowałaby się. Promocja: `concepts/svelte-clerk-button-global-styling.md`.
- **Wuchale generuje single-file `pl.po`/`en.po`**, nie directory `pl/`/`en/` — z `adapter: svelte({ loader: 'svelte' })` bez `localesDir`. Wpływa na config loader-a.
- **`selectSegment()` zamiast `$effect`** — autofixer flaguje pisanie do `$state` z effectu jako malpractice (wpis z poprzedniej sesji). Reset przy zmianie segmentu jest eventem, nie reaktywnym side-effectem — więc handler.
- **Sygnatura `BookingInput.error`: `string`, nie `string[]`** — pole pokazuje pierwszy błąd, klikalność ekranu prosta.
- **Stałe required text + dwa selecty osobno** w `validate()` — selecty mają inny komunikat ("Wybierz opcję" vs "Pole wymagane") i inną semantykę pustej wartości.

### Wnioski

- **`svelte-clerk` button styling wymaga `:global(.klasa)`** — klasa przekazana do `<SignOutButton class="...">` aplikuje się do `<button>` w module svelte-clerk, nie w scope'ie parenta. → Promocja: `concepts/svelte-clerk-button-global-styling.md`
- **Wuchale single-file `.po` layout** — `pl.po`/`en.po` w root `locales/`, nie podkatalogi. Przy migracji z innych i18n trzeba dostosować loader. → Promocja: `concepts/wuchale-single-file-po-layout.md`
- **Schema change array shape** — Convex odrzuca istniejące rzędy z innym kształtem przy push'u. Bez migracji `npx convex dev` zablokuje deploy. (Obecnie dev DB pusta, więc nie problem — ale na produkcji wymaga skryptu migracji lub TTL.)
- **`pnpm lint` zmieniło się** — usunięto `&& eslint .` z scriptu (eslint nie był zainstalowany jako devDep), teraz tylko prettier. Lint przechodzi czysto.

### Następne kroki

#### Next

- Stripe webhook (`api/stripe/webhook/+server.ts`) → wywołanie `api.mutations.confirmBooking` po `payment_intent.succeeded` i `cancelBooking` po failed/canceled
- Migracja istniejących bookingów (jeśli są) na nowy kształt `berthIds` przed pierwszym push'em do prod-Convex
- UI hint na minimum/maksimum kój per booking (obecnie 1+, brak górnego limitu poza fizyczną liczbą dostępnych)
- Locale-aware redirects (preserve `/{lang}/` w guardach — `/book` resetuje locale)

#### Later

- Przetłumaczyć `pl.po`/`en.po` (Wuchale extracted, ale wartości puste)
- Booking step state w URL (`?step=N`) żeby F5 nie resetował
- Refactor `route-section` żeby używał wspólnego `voyageSegments`
- Logo SA — extract do `sa-logo` komponentu
- Zdjęcia hero/jacht/mapa (podmiana placeholderów)

#### Open questions

- Czy multi-berth booking ma jeden crew profile, czy osobny per koja? Obecnie `crewProfiles` jest 1:1 z userId — co jeśli ktoś rezerwuje dla 4 osób?
- Booking history vs latest booking w dashboardzie — `bookingByUser` zwraca tylko najnowszy. Lista wszystkich (taby: Aktywne / Historia)?

---

## Sesja 2026-04-26 (II) — Wuchale i18n fix, Block 2 captain berths, PR

### Zmiany

- **Wuchale i18n-404 fix**: `[[lang=lang]]/+layout.ts` — `export const load = async ({ params }) => { await loadLocale(params.lang ?? 'pl'); return {} }`. Loader `svelte` (z `data.js`) inicjalizuje `emptyRuntime` przez `registerLoaders()` — dopiero wywołanie `loadLocale()` ładuje skompilowany katalog. Bez tego każde `c[N]` zwraca `undefined` → `[i18n-404:N]`. SvelteKit `load` odpala się przed renderem na serwerze i kliencie.
- **`pnpm lint`**: usunięto `&& eslint .` ze skryptu — ESLint nigdy nie był zainstalowany jako devDep. Lint = tylko `prettier --check .`.
- **Block 2 — Captain berth (C1) + rezerwacje bezpłatne**:
  - Schema: `berths.status` rozszerzone o `'captain' | 'complimentary'`, dodane `guestName?: string`, `note?: string`
  - Seed: C1 seeded jako `'captain'` od razu; `migrateCaptainBerths` mutation dla istniejących danych
  - Nowe mutations: `reserveComplimentary`, `cancelAdminBooking`, `migrateCaptainBerths`
  - Nowe queries: `berthStatusesBySlug` (zwraca `{berthId, status}[]`), `allBerthsBySlug` (admin)
  - Guard w `createBooking` zmieniony z `=== 'taken'` na `!== 'available'` (blokuje captain/complimentary)
  - `BoatPlan`: prop `takenBerths: Set` → `berthStatuses: Map<string, BerthStatus>`. Stan `captain`: ciemnogranatowe tło + ⚓ + "SKP". Stan `complimentary`: X-pattern overlay. Sidebar buttons: klasy `--captain`, `--complimentary`.
  - Admin page `/admin`: grid koji z kolorami statusów, formularz bezpłatnej rezerwacji, przycisk Anuluj dla complimentary, przycisk migracji.
- **Bug fix cursor**: `boat__berth--clickable` stosowany też dla `state === 'selected'` — kursor `pointer` (nie `not-allowed`) bo zaznaczoną koję można odznaczyć.
- **PR #1** otwarte: `main → production` (11 commitów, stan OPEN): https://github.com/tsosna/sailing-architects/pull/1

### Decyzje

- **C1 jako stałe miejsce kapitana** — hardcoded w seed i migrateCaptainBerths; nie konfigurowalny przez UI (za mała potrzeba).
- **`berths.status` extended zamiast osobnej tabeli admin-reservations** — 10 koj per segment, status wystarczy; osobna tabela = overhead bez korzyści.
- **Admin page bez Clerk guard** — celowo pominięty na teraz; URL security-by-obscurity na dev. Do dodania przed produkcją.
- **High-autonomy prompt dla Opus** — cel + pliki wejściowe + jeden gotcha (useMutation) zamiast linijka po linijce. Opus sam podjął decyzje projektowe (nazwy zmiennych, kształt danych).

### Wnioski

- **Wuchale `loader: 'svelte'` wymaga jawnego `loadLocale()`** — `registerLoaders()` startuje z `emptyRuntime`; nic nie ładuje katalogu dopóki `loadLocale()` nie zostanie wywołane. Fix: `+layout.ts` z async load. → Promocja: `concepts/wuchale-sveltekit-loadlocale.md`
- **High-autonomy prompt > step-by-step dla modeli senior-tier** — dawanie Opus celu + kontekstu + jednego nieoczywistego gotcha daje lepszy efekt niż przepis krok po kroku. Model sam podejmuje decyzje projektowe, kod jest bardziej spójny. → Promocja: `concepts/engineering-prompts-senior-ai-model.md`
- **`boat__berth--clickable` CSS klasa musi pokrywać WSZYSTKIE klikalme stany** — selected berth też jest klikalny (toggle), więc musi mieć `cursor: pointer`. Zawsze mapować CSS cursor na faktyczną funkcjonalność, nie na intuicję.

### Następne kroki

#### Next (Block 3 — Deploy)

- Vercel: deploy z `production` branch, env vars w Vercel dashboard
- Stripe produkcja: zmiana kluczy, rejestracja webhook URL na Vercel
- Convex prod deployment: `npx convex deploy` (oddzielne od dev)
- Seed prod DB: `initializeVoyage()` + `migrateCaptainBerths()` z Convex dashboard
- Media/zdjęcia: podmiana diagonal pattern placeholderów na rzeczywiste fotografie (hero/jacht/mapa)

#### Later

- Clerk SignIn/SignUp `appearance` prop dla brass/navy tokenów
- Booking step state w URL (`?step=N`) żeby F5 nie resetował
- Limit max koj per booking (UI hint + walidacja server-side)
- Crew profile per osoba vs per userId — jeśli ktoś rezerwuje 3 koje dla 3 osób
- Booking history (wszystkie, nie tylko najnowszy)
- Locale-aware redirects (preserve `/{lang}/` w guardach)
- Admin page: Clerk guard

#### Open questions

- Stripe produkcja: jeden webhook endpoint dla dev i prod czy osobne? (Vercel preview deployments komplikują)
- Czy `/admin` dostaje osobny Clerk role (np. `admin`) czy wystarczy URL obscurity?

---

## Sesja 2026-04-27 — Stripe webhook + Clerk PL/brass theme

### Zmiany

- **Stripe webhook** (`src/routes/api/stripe/webhook/+server.ts`): rewrite z czystym typem `Stripe.Event` (zamiast conditional-type construct). Raw body przez `await request.text()`, weryfikacja sygnatury przez `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.
  - `payment_intent.succeeded` → `api.mutations.confirmBooking({ stripePaymentIntentId, paidAt: Date.now() })`
  - `payment_intent.payment_failed` / `canceled` → `api.mutations.cancelBooking({ stripePaymentIntentId })`
  - unknown event types → 200 (Stripe retries on non-2xx)
  - signature failure → 400 z message
- **Clerk PL + brass/navy theme** (`src/routes/+layout.svelte`): zainstalowany `@clerk/localizations@4.5.5`. Dodane `localization={plPL}` + `appearance` prop: `colorPrimary: '#c4923a'`, `colorBackground: '#0d1b2e'`, `colorText: '#f5f0e8'`, `colorInputBackground: '#07111e'` (--color-navy-deep), `borderRadius: '2px'`.

### Decyzje

- **Modyfikowany `src/routes/+layout.svelte` (root), nie `[[lang=lang]]/+layout.svelte`** — `ClerkProvider` jest w root, zgodnie z AGENTS.md. Prompt wskazywał `[[lang=lang]]` (błąd; root jest właściwym miejscem).
- **`appearance.variables` jako hex literals**, nie `var(--color-brass)` — Clerk parsuje wartości jako kolory natywnie i nie ma dostępu do CSS custom properties z `app.css`.
- **`colorInputBackground: '#07111e'`** użyłem istniejącego tokenu `--color-navy-deep` zamiast wymyślać nowy odcień.
- **Webhook: `import type Stripe from 'stripe'` + `let event: Stripe.Event`** zamiast conditional type — czytelniej, ten sam efekt runtime'owy.

### Wnioski

- **`appearance.variables` w Clerk = literały kolorów, nie CSS variables** — zmiana tokenu w `app.css` nie propaguje się do Clerk UI. Synchronizacja ręczna albo wspólny moduł JS importowany przez oba miejsca. → **Promocja kandydat: `concepts/clerk-appearance-no-css-vars.md`**
- **`pnpm lint` failuje na 27 plikach pre-existing** (`.agents/skills/*`, `src/convex/_generated/ai/*`, `AGENTS.md`, `CLAUDE.md`, `pnpm-lock.yaml`). Wygląda jakby blok `<!-- convex-ai-start -->` dodany do CLAUDE.md sprowadził auto-generowane pliki bez prettier-ignore. Warto rozszerzyć `.prettierignore`.
- **Webhook handler — Stripe wymaga raw bytes** dla `constructEvent()`. W SvelteKit: `await request.text()`, nie `.json()`. (Już było wspomniane w AGENTS.md, ale warto trzymać świadomość.)

### Następne kroki

#### Next

- Rozszerzyć `.prettierignore` o `.agents/skills/`, `src/convex/_generated/ai/` — odblokowuje czysty `pnpm lint`
- Test webhook end-to-end: `stripe listen --forward-to localhost:5173/api/stripe/webhook` + test booking → weryfikacja `bookings.status: pending → confirmed`
- Tłumaczenia `pl.po`/`en.po` (nadal puste)

#### Later

- Synchronizacja tokenów brass/navy między `app.css` i Clerk `appearance` (wspólny `$lib/design-tokens.ts`?)
- Vercel deploy + Stripe webhook URL produkcyjny
- Booking step state w URL (`?step=N`)
- Limit max koj per booking (UI hint + server-side)
- Locale-aware redirects
- Admin page: Clerk guard

#### Open questions

- Dla `payment_intent.canceled` rozróżniać cancel-by-user vs cancel-by-system? Obecnie oba lecą do tego samego `cancelBooking`.
- `colorInputBackground: '#07111e'` na dark background `#0d1b2e` daje ledwo widoczny kontrast inputów — sprawdzić w przeglądarce, być może lepszy `#162840` (--color-navy-light).

---

## Sesja 2026-04-27 (III) — Vercel deploy, Convex prod, webhook, Clerk PL live

### Zmiany

- **Stripe webhook scommitowany** (`src/routes/api/stripe/webhook/+server.ts`) — napisany przez Opus w sesji II, scommitowany tu. Cursor bug fix w `boat-plan.svelte` (`boat__berth--clickable` dodane dla `state === 'selected'`) — Opus poprawił przy okazji.
- **Convex prod deployment**: `npx convex login` → `npx convex deploy` → `PUBLIC_CONVEX_URL=https://qualified-crab-196.eu-west-1.convex.cloud`. Seed uruchomiony z Convex Dashboard: `seed:initializeVoyage` + `mutations:migrateCaptainBerths`.
- **Vercel env vars**: `PUBLIC_CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` ustawione w Vercel Dashboard.
- **Vercel build fix — `_generated/` scommitowane**: `npx convex deploy --cmd 'pnpm build'` nie generuje lokalnych plików na Vercel CI. Fix: wyciągnięcie `src/convex/_generated/` z `.gitignore` i scommitowanie. Komentarz w `.gitignore`: `# committed intentionally for Vercel build`.
- **Vercel Ignored Build Step**: ustawiono "Only build production" — pushe na `main` nie triggerują buildu.
- **`pnpm-lock.yaml` dodany do `.prettierignore`** — eliminuje false positive w `pnpm lint`.
- **Clerk PL + brass/navy theme** (z sesji II) — zdeployowane, działa na produkcji.
- **Stripe webhook zarejestrowany w Stripe Dashboard** (test mode): URL `https://sailing-architects.wysokijohn.pl/api/stripe/webhook`, events: `payment_intent.succeeded/failed/canceled`.
- **Strona live**: `https://sailing-architects.wysokijohn.pl` — Convex dane w tabelach, Clerk PL, booking flow dostępny.
- **Grafiki**: 3 pliki WhatsApp JPEG w `docs/assets/` — to ulotki marketingowe z nałożonym tekstem, nie czyste fotografie. Image `(2)` = mapa trasy (Majorka→Gibraltar→Madera→Teneryfa→Cabo Verde), idealna dla route-section. Decyzja o użyciu wstrzymana do ustalenia czy są oryginały.

### Decyzje

- **`src/convex/_generated/` commitowane** — pragmatyczny wybór dla Vercel CI. Pliki są deterministyczne względem schematu; aktualizują się po `npx convex dev` i muszą być scommitowane razem ze zmianą schematu.
- **Stripe webhook: test mode na razie** — produkcyjne klucze Stripe (`sk_live_`) do dodania gdy klient gotowy na prawdziwe płatności.
- **Grafiki w `/static/`** (nie Cloudinary) — projekt ma ~15 zdjęć statycznych, bez potrzeby admin uploadu. SvelteKit `enhanced:img` generuje WebP + srcset przy buildzie.

### Wnioski

- **`npx convex deploy --cmd` nie generuje `_generated/` na Vercel** — musi być commitowane osobno. → Promocja: `concepts/convex-vercel-production-deployment.md`
- **Vercel "Ignored Build Step" = UI dropdown**, nie ręczna komenda — opcja "Only build production" dostępna od razu bez pisania skryptu. → Promocja: `concepts/vercel-ignored-build-step.md`
- **Sekwencja Convex prod**: login → deploy → seed — w tej kolejności; bez seedu baza pusta i UI nie działa.

### Następne kroki

#### Next

- Grafiki: potwierdzić z klientem czy są oryginalne fotografie (nie ulotki). Jeśli tak — skopiować do `/static/images/`, podmienić diagonal placeholders w `vessel-section` i `hero-section`.
- Stripe live: zmiana `sk_test_` → `sk_live_` + rejestracja nowego webhooka w live mode gdy klient gotowy.
- Test end-to-end booking flow na produkcji (Stripe test card `4242 4242 4242 4242`).
- Admin page: dodać Clerk guard przed produkcją.

#### Later

- Tłumaczenia `pl.po`/`en.po` (Wuchale extracted, wartości puste)
- Wspólny moduł `$lib/design-tokens.ts` (synchronizacja `app.css` i Clerk `appearance`)
- Booking step state w URL (`?step=N`)
- Locale-aware redirects (preserve `/{lang}/` w guardach)
- Limit max koj per booking

#### Open questions

- Grafiki: ulotki jako-jest (image 2 dla route-section?) czy czekamy na oryginały?
- Clerk: kiedy przełączyć z test keys na live (production Clerk)?

## Sesja 2026-04-29 00:34 — Huashu assets i hero d.jpg

Sesja obejmowała dopracowanie designu Sailing Architects na bazie huashu-design: propozycje HTML, poprawki Clerk auth w /book, kotwice nav oraz wdrożenie assetów z docs/assets do static z d.jpg jako hero.

### Zmiany

- **Huashu design review / warianty HTML**: przygotowano i aktualizowano `docs/design/huashu-sailing-architects-review-variants.html` oraz `docs/design/huashu-assets-placement-proposals.html` z wariantami dla kontaktu do Michała, poprawy kontrastu brass eyebrow text, odróżnienia Clerk login modal i rozmieszczenia zdjęć z `docs/assets`.
- **Assety statyczne dla Vercel**: skopiowano aktualne pliki z `docs/assets` do `static/images/sailing/`, logo do `static/images/brand/logo.png` oraz favicon do `static/favicon.png`.
- **Hero landing** (`src/routes/[[lang=lang]]/+page.svelte`): wdrożono rekomendowany wariant z `d.jpg` jako tłem hero, z navy overlay i dopasowaniem CTA/kotwic.
- **Logo w UI** (`src/lib/components/site-nav/site-nav.svelte`, `src/lib/components/site-footer/site-footer.svelte`, `src/app.html`): podstawiono realne logo w belce menu i footerze oraz ustawiono favicon.
- **Galeria / jacht** (`src/lib/components/vessel-section/vessel-section.svelte`): placeholderowe pola graficzne zastąpiono zdjęciami `wiatr.jpg`, `salon.jpg`, `niebo.jpg`, `jola.jpg`, `majorka.jpg`.
- **Booking flow** (`src/routes/[[lang=lang]]/book/+page.svelte`): poprawiono sumowanie wybranych koi, layout listy kajut i panelu wyboru, etykiety `undefined`, pozycję informacji „Cena nie zawiera...”, widoczność panelu kontaktu do organizatora oraz wygląd Clerk login modal.
- **Clerk SignIn/SignUp routing** (`src/routes/[[lang=lang]]/book/+page.svelte`): synchronizacja `auth=signin|signup` z URL, czyszczenie Clerk hash `#/?auth=...`, przełączanie formularza po kliknięciu „Zaloguj się” / „Zarejestruj się”.
- **Menu na `/book`** (`src/lib/components/site-nav/site-nav.svelte`): linki kotwic prowadzą do strony głównej (`/#vessel`, `/#route` itd.), a nie do `/book#vessel`.
- **Kontrast brass text** (`src/app.css` i komponenty): dodano mocniejsze tokeny `--color-brass-text` / `--color-brass-text-soft` i poprawiono małe złote etykiety o niskim kontraście.
- **Repo hygiene**: dodano `.claude/skills/huashu-design/` do `.gitignore`.

### Decyzje

- **`d.jpg` jako hero** — wybrane jako spokojniejsze, bardziej premium tło niż `a.jpg`; `a.jpg` po ponownej analizie nadal miało charakter materiału promocyjnego z mocną typografią, więc nie zostało użyte jako główny hero poster.
- **`static/` dla obrazów** — zdjęcia i logo są lokalnymi assetami dla Vercel deploy, bez wprowadzania zewnętrznego storage.
- **Clerk auth mode przez query param** — `/book?auth=signin|signup` stało się źródłem stanu dla formularza, żeby linki Clerk nie wyprowadzały użytkownika na `accounts.dev` ani nie tworzyły podwójnych `auth` w hash/query.
- **Kontakt do Michała jako element pierwszoplanowy** — numer `+48 601 671 182` i `sailingarchitects@gmail.com` mają być widoczne bez szukania, szczególnie w hero/booking/auth context.
- **Mały brass text nie może być półprzezroczysty na navy** — dla małych liter 9-11px kontrast jest ważniejszy niż subtelność; opacity obniżono/zastąpiono mocniejszymi tokenami.

### Wnioski

- **Tweaks panel w HTML jest tylko podglądem runtime** — wartości z suwaków, np. rozmiar logo, nie są widoczne dla Codex i nie zapisują się do komponentów/CSS, dopóki użytkownik nie poda wartości lub nie zapisze ich w pliku.
- **Clerk UI ma własne style i linki w hash/query** — trzeba przechwytywać kliknięcia w linki przełączające SignIn/SignUp oraz resetować komponent przez `{#key authMode}`, inaczej Svelte state i wewnętrzny Clerk router rozjeżdżają się.
- **Nie wszystkie zmiany wizualne w Clerk łapią przez oczywiste selektory** — rozmiar ikon social providerów był ograniczany głębiej w strukturze Clerk; zmiana jednego wrappera nie wystarczała.
- **`pnpm check` przechodzi**, ale **`pnpm lint` nadal pada na znanych plikach formatowania**: `skills-lock.json` i `src/convex/_generated/*`.

### Następne kroki

#### Next

- Sprawdzić wizualnie hero/nav/footer/galerię w przeglądarce na desktop/mobile i ewentualnie dopasować wielkość logo (obecnie 46px nav, 58px footer) oraz overlay hero.
- Zweryfikować cały booking flow po zmianach Clerk: `/book`, `/book?auth=signin`, `/book?auth=signup`, przełączanie formularzy oraz wybór koi.
- Ocenić czy `wiatr.jpg`, `salon.jpg`, `niebo.jpg`, `jola.jpg`, `majorka.jpg` dobrze działają w galerii jachtu na mobile.
- Uporządkować lint/prettier dla istniejących problematycznych plików `skills-lock.json` i `src/convex/_generated/*` albo dodać je do `.prettierignore`.

#### Later / Open questions

- Czy rozmiar logo ustawiony w aktualnym kodzie odpowiada wartościom ustawianym ręcznie w Tweaks panel?
- Czy `a.jpg` ma zostać użyte gdzieś jako social proof / materiał promocyjny, czy całkowicie wypada z landing page?
- Czy kontakt do Michała ma być dodatkowo powtórzony w sticky barze na mobile?
