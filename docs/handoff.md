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
