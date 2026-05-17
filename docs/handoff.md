# AI Handoff — sailing-architects

> Ostatnia aktualizacja: 2026-05-03

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

## Sesja 2026-05-08 — Compile sessions + promocja wiki

### Zmiany poza kodem aplikacji

- Uruchomiono `compile sessions` w `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/claude-memory-compiler`:
  - komenda: `uv run python scripts/compile.py`
  - przetworzony log: `daily/2026-05-08.md`
  - wynik: `Knowledge base: 84 articles`
  - koszt agenta: `$0.7922`
- Compile uznał sam `daily/2026-05-08.md` za recap bez nowych artykułów technicznych, ale wcześniejsza wiedza z sesji Scenariusza 2 była już zapisana w `knowledge-vault/wiki/topics/tomek-coding-learning-profile.md`.
- Na tej podstawie ręcznie wypromowano 3 kandydatów do osobnych konceptów w `knowledge-vault/wiki/concepts/`:
  - `stripe-webhook-localhost-forwarding.md` — lokalne testy Stripe webhooków wymagają `stripe listen --forward-to localhost:5173/api/stripe/webhook`, lokalnego `STRIPE_WEBHOOK_SECRET` z CLI i restartu `pnpm dev`.
  - `convex-data-inspection-no-sql.md` — Convex nie ma ad-hoc SQL; dane sprawdzać przez Dashboard Data tab, Functions tab albo `npx convex run module:functionName '{"arg":"value"}'`.
  - `brew-fallback-to-github-binary.md` — gdy Homebrew blokuje instalację przez wymagania Xcode/toolchaina, sprawdzić oficjalną pre-built binarkę z GitHub Releases; na Apple Silicon binarki trafiają do `/opt/homebrew/bin`.
- Zaktualizowano `knowledge-vault/wiki/index.md` i `knowledge-vault/wiki/log.md`.
- Przy okazji naprawiono w `knowledge-vault/wiki/concepts/redirect-303-vs-error-403.md` dwa fałszywe wikilinki `[[lang=lang]]`, które lint czytał jako brakującą stronę.

### Weryfikacja

- `uv run python scripts/lint.py` w `claude-memory-compiler`:
  - broken links: `0`
  - wynik końcowy: `0 errors, 29 warnings, 174 suggestions`
- Pozostałe ostrzeżenia to istniejący dług vaulta: orphan pages, missing backlinks, sparse articles i 3 sugestie niespójności/kontradykcji.

### Znaczenie dla kolejnych sesji nauki

- Przy testach Scenariusza 2 w sailing-architects pamiętać, że płatność Stripe może przejść, a booking nadal wyglądać na anulowany, jeśli lokalny webhook nie jest forwardowany.
- Przy debugowaniu danych w Convex nie szukać konsoli SQL; najpierw Dashboard Data/Functions albo typed query przez `npx convex run`.
- Gdy instalacja CLI przez `brew` pada na wymagania Xcode, nie zatrzymywać pracy: sprawdzić release binarki upstream, szczególnie dla narzędzi typu Stripe CLI.

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

## Sesja 2026-04-29 — Brevo transactional email adapter

Sesja przygotowała backendową integrację transactional email przez Brevo dla Sailing Architects, bez budowania jeszcze formularza kontaktowego ani automacji cron.

### Zmiany

- **Env vars** (`.env.example`): dodano `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `CONTACT_EMAIL`.
- **Adapter serwerowy** (`src/lib/server/email.ts`): dodano `sendTransactionalEmail({ to, subject, html, text?, replyTo? })` korzystające z Brevo Transactional Email API (`/v3/smtp/email`) oraz wrappery `sendContactEmail(...)` i `sendDailyReportEmail(...)`.
- **Obsługa błędów** (`src/lib/server/email.ts`): adapter rzuca czytelne błędy dla brakujących envów i zwraca `messageId`/response z Brevo bez logowania sekretów.
- **Skrypty Node** (`scripts/brevo-mail.mjs`, `scripts/send-handoff-report.mjs`, `scripts/send-test-email.mjs`): dodano wspólny fetch wrapper Brevo oraz CLI do wysyłki raportu HTML przez `--to`, `--subject`, `--html-file` i prosty testowy mail przez `--to`.
- **Package scripts** (`package.json`): dodano `pnpm email:handoff` i `pnpm email:test`; oba czytają lokalne `.env` przez `node --env-file=.env`.
- **README** (`README.md`): dopisano Brevo do stacku, komendy testowe i informację o env vars.
- **Testy ręczne**: `pnpm email:test` wysłał wiadomość przez Brevo; test na iCloud miał w logach Brevo statusy `Sent`, `Delivered` i `First opening`, ale użytkownik uznał wynik za niewiarygodny. Drugi test na Gmail (`CONTACT_EMAIL=tomek.sosinski@gmail.com`) zadziałał poprawnie.

### Decyzje

- **Brevo zamiast Resend/Postmark** — wybrano zgodnie z zakresem sesji i potrzebą transactional email dla raportów handoff oraz późniejszych prostych maili systemowych/kontaktowych.
- **Brevo traktować jako adapter przygotowany, nie ostateczny kierunek** — po testach użytkownik zaznaczył, że wysyłka e-mail może pójść „w inną stronę”. Kod jest użyteczny jako warstwa abstrakcji, ale decyzja o finalnym providerze/dostarczalności pozostaje otwarta.
- **Fetch wrapper zamiast oficjalnego SDK Brevo** — Brevo endpoint do wysyłki transactional email jest prosty, a natywny `fetch` działa zarówno w SvelteKit server runtime, jak i w skryptach Node. Dzięki temu nie dodano nowego runtime dependency.
- **`$env/static/private` w module SvelteKit** — sekrety (`BREVO_API_KEY`) i adresy konfiguracyjne są dostępne tylko po stronie serwera.
- **Skrypty nie importują `$env/static/private`** — działają poza SvelteKit runtime, więc czytają env z `process.env`; package scripts uruchamiają je przez `node --env-file=.env`.

### Wnioski

- Node skrypty i kod SvelteKit potrzebują osobnych sposobów dostępu do env: `$env/static/private` w `src/lib/server/email.ts`, `process.env` w `scripts/*.mjs`.
- `pnpm check` wymaga, żeby zmienne używane przez `$env/static/private` istniały lokalnie w `.env` już podczas `svelte-kit sync`; w tej sesji dodano lokalne puste placeholdery Brevo do ignorowanego `.env`, bez commitowania sekretów.
- Test wysyłki wymaga realnych wartości `BREVO_API_KEY` i `BREVO_FROM_EMAIL`; bez nich skrypty kończą się kontrolowanym błędem.
- Brevo API response może zawierać `messageId`; adapter zwraca go do diagnostyki zamiast wypisywać payload z sekretami.
- Logi Brevo mogą pokazywać dostarczenie/otwarcie, ale nie rozstrzygają subiektywnego UX po stronie skrzynki odbiorczej; Gmail był praktycznym potwierdzeniem działania w tej sesji, iCloud pozostał podejrzany.
- `pnpm check` przechodzi; `pnpm lint` nadal pada wyłącznie na znanych plikach formatowania: `skills-lock.json` i `src/convex/_generated/*`.

### Następne kroki

#### Next

- Przed dalszą rozbudową maili zdecydować, czy zostajemy przy Brevo, czy przechodzimy na inny kierunek/providera.
- Jeśli Brevo zostaje: ustawić `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `CONTACT_EMAIL` w Vercel env i zrobić test produkcyjny na Gmail.
- Jeśli zmieniamy providera: zachować publiczne API `sendTransactionalEmail(...)` jako punkt wymiany adaptera.

#### Later / Open questions

- Podpiąć `sendContactEmail(...)` pod przyszły formularz kontaktowy.
- Podpiąć `sendDailyReportEmail(...)` pod automatyczny raport z `docs/handoff.md`, jeśli taka automatyzacja zostanie ustalona.
- Potwierdzić docelowego nadawcę i konfigurację domeny w Brevo przed produkcyjną wysyłką.

## Sesja 2026-04-29 17:15 — Logo i booking CTA flow

Sesja dopracowała wizualny detal logo/favikony oraz mechanikę przycisków `Rezerwuj` / `Zarezerwuj` tak, żeby wybór koi, etap i wejście do `/book` były spójne.

### Zmiany

- **Logo i favicon** (`static/images/brand/logo.png`, `static/favicon.png`): znak przemalowano z granatu na brass `#c4923a`, zostawiając transparentne tło. `static/favicon.png` zmniejszono do `512x512`.
- **Tło logo w UI** (`src/lib/components/site-nav/site-nav.svelte`, `src/lib/components/site-footer/site-footer.svelte`): usunięto jasne tło z wrapperów `.brand__mark` i `.footer__mark`; została subtelna złota ramka.
- **Mobile hero/nav** (`src/lib/components/site-nav/site-nav.svelte`, `src/routes/[[lang=lang]]/+page.svelte`): na mobile ukryto tekst `Sailing Architects` w belce menu i ustawiono hero na ok. `18px` pod nav (`padding-top: 82px`), żeby `Jesień 2026` nie nakładało się na menu.
- **Booking-first flow** (`src/routes/[[lang=lang]]/book/+page.svelte`): `/book` bez `berths` startuje od wyboru koi; `/book?...&berths=...` startuje od panelu logowania/rezerwacji. Dodano krok `Koje` przed `Konto`, więc płatność przesunęła się na krok 5, a sukces na krok 6.
- **Wspólny stan wyboru koi** (`src/lib/state/booking-selection.svelte.ts`): dodano frontowy stan `bookingSelection` dla `selectedSegment` i `selectedBerths`, używany przez `CabinsSection`, `PricingSection` i `SiteNav`.
- **CTA rezerwacji** (`src/lib/components/cabins-section/cabins-section.svelte`, `src/lib/components/pricing-section/pricing-section.svelte`, `src/lib/components/site-nav/site-nav.svelte`): `Rezerwuj` w menu i `Zarezerwuj` w cenniku uwzględniają wybrane koje tylko wtedy, gdy klik dotyczy aktualnego etapu; URL budowany jest przez `URLSearchParams`, więc `berths=E1%2CE2` jest spójne.
- **Panel użytkownika** (`src/lib/components/site-nav/site-nav.svelte`, `src/routes/[[lang=lang]]/dashboard/+layout.server.ts`, `src/routes/[[lang=lang]]/book/+page.svelte`): `Panel` prowadzi do `/book?auth=signin&next=dashboard`; po zalogowaniu bez wybranych koi użytkownik przechodzi do `/dashboard`.
- **Synchronizacja trasa → plan kajutowy** (`src/lib/components/route-section/route-section.svelte`, `src/lib/components/cabins-section/cabins-section.svelte`): klik w mapę lub `01/02/03/04` ustawia `?segment=...` bez przewijania z sekcji `TRASA REJSU`; `PLAN KAJUTOWY` przełącza etap po dojściu do sekcji, ale nadal pozwala lokalnie zmieniać etapy.

### Decyzje

- **Auth dopiero po intencji rezerwacji** — logowanie nie pojawia się po samym kliknięciu `/book`, jeśli nie ma wybranych koi. Wyjątek: `Panel`, bo tam intencją jest wejście do konta.
- **`bookingSelection` jako lekki stan frontowy** — wybrano wspólny stan zamiast przekazywania propsów między sekcjami, bo `SiteNav`, `PricingSection` i `CabinsSection` muszą widzieć tę samą intencję rezerwacji.
- **URL jako kontrakt wejścia do `/book`** — `segment` bez `berths` oznacza wybór koi, a `segment + berths` oznacza przejście do panelu logowania/rezerwacji.
- **Trasa nie przewija do kajut** — klik w trasie tylko synchronizuje etap przez `?segment=...`; użytkownik zostaje w sekcji `TRASA REJSU`.

### Wnioski

- Samo wygenerowanie URL z `berths=...` nie wystarczało: `/book` musiał też interpretować obecność `berths` jako sygnał startu od kroku `Konto`.
- Ręczne składanie query stringów dało niespójność `E1,E2` vs `E1%2CE2`; `URLSearchParams` powinien być używany do linków bookingowych.
- Synchronizacja URL → UI w `CabinsSection` wymaga pamiętania ostatnio zastosowanego `segmentParam`, żeby lokalna zmiana etapu w planie kajut nie była natychmiast nadpisywana przez stary query param.
- `pnpm check` przechodzi; `pnpm lint` nadal pada wyłącznie na znanych plikach formatowania: `skills-lock.json` i `src/convex/_generated/*`.

### Następne kroki

#### Next

- Przetestować ręcznie flow: wybór koi w `PLAN KAJUTOWY` → `Rezerwuj` w menu → `/book?...&berths=...` → auth; analogicznie `Zarezerwuj` w cenniku dla tego samego i innego etapu.
- Sprawdzić mobile po zmianach logo/nav/hero: czy brass logo bez tła jest czytelne i czy `Jesień 2026` ma właściwy odstęp od menu.
- Zdecydować, czy zmiany logo/booking flow commitować razem, czy rozdzielić na dwa commity.

#### Blocked / Later / Open questions

- `pnpm lint` nadal wymaga decyzji, co zrobić z `skills-lock.json` i `src/convex/_generated/*`: sformatować, dodać do `.prettierignore`, albo zostawić jako znany dług.
- Potwierdzić finalnie, czy route-section ma również wizualnie zaznaczać, że zmieniła etap w planie kajutowym, bez przewijania użytkownika.

## Sesja 2026-04-30 17:15 — Zod crew validation i booking auth

Sesja dopięła booking flow po Google OAuth, walidację formularza danych załogi przez Zod oraz telefon żeglarza zapisany w Convex. Zrobiono checkpoint commitem f5894d8.

### Zmiany

- Naprawiono powrót z Clerk Google OAuth do /book?segment=...&berths=... przez forceRedirectUrl/fallbackRedirectUrl oraz automatyczne przejście z kroku Konto do Dane załogi po zalogowaniu.
- Dodano zod ^4.3.6 i src/lib/schemas/crew-profile.ts; /book używa crewProfileSchema.safeParse zamiast ręcznej walidacji.
- Dodano pole Telefon żeglarza w formularzu, Convex mutation upsertCrewProfile i dashboard; w schema crewProfiles.phone jest optional dla kompatybilności istniejących rekordów.

### Decyzje

- Nie dodawano jeszcze sveltekit-superforms; Zod wszedł teraz jako wspólny schemat walidacji, a Superforms zostaje na większy refactor formularzy/dashboardu.

### Wnioski

- Przy schema change w Convex trzeba odświeżyć wygenerowane bindingi przez pnpm exec convex codegen; w sandboxie codegen może paść na Sentry DNS i wymagać eskalacji sieciowej.
- Wuchale przenosi komunikaty walidacji z kodu Svelte do .po, ale stringi w czystych modułach TS Zod nie są automatycznie ekstrahowane, więc ewentualne tłumaczenie błędów Zod wymaga osobnego podejścia.

### Następne kroki

- Po kompaktowaniu przetestować ręcznie booking: wybór 2 koi etap 1 → Google login → formularz danych załogi → walidacje daty, telefonu i dokumentu → zapis profilu.
- Zdecydować czy kolejnym krokiem jest dashboard użytkownika na realnych danych, edycja profilu załogi, czy refactor formularzy pod sveltekit-superforms.

## Sesja 2026-04-30 19:35 — Booking holds, transakcyjność i PDF potwierdzenia

Checkpoint przed kompaktowaniem po pracy nad booking flow Sailing Architects. Od ostatniego checkpointu najważniejsze były kwestie spójności procesu płatności: tymczasowe holdy miejsc, wygasanie blokad, obsługa porzuconych płatności oraz PDF potwierdzenia.

### Zmiany

- Dodano 15-minutowe holdy miejsc: berths.status ma teraz held, bookings mają holdExpiresAt, a createBooking ustawia miejsca na held zamiast taken do czasu sukcesu Stripe.
- Webhook payment_intent.succeeded potwierdza booking i zamienia held na taken; payment_failed/canceled zwalnia miejsca; dodano też obsługę późnego sukcesu po wygaśnięciu, jeśli miejsca nadal są wolne.
- Dodano Convex cron src/convex/crons.ts wywołujący internal mutations.expireCheckoutHolds co minutę, żeby pending bookingi po holdExpiresAt zmieniały się na expired i zwalniały koje.
- UI pokazuje cofający się licznik blokady w kroku płatności oraz dashboardzie; BoatPlan/Cabins/Admin znają status held.
- Po zgłoszeniu wiszącego procesu płatności dodano timeouty i czytelne błędy: frontend abortuje create-intent po 20 s, endpoint ma timeouty 15 s na Stripe/Convex i zawsze zwraca JSON { message }.
- Dodano PDF potwierdzenia rezerwacji: zależność pdfkit, endpoint /api/booking-confirmation/[bookingRef], query bookingConfirmationByRef oraz przyciski Pobierz PDF/Pobierz potwierdzenie w /book i dashboardzie.
- Rozszerzono formularz danych załogi o Miejsce urodzenia i zapis birthPlace w Convex/Profile/Dashboard.

### Decyzje

- Status taken oznacza teraz wyłącznie opłacone miejsce; stan tymczasowy checkoutu to held z holdExpiresAt.
- @types/pdfkit przeniesiono do devDependencies, a pdfkit zostaje runtime dependency dla endpointu PDF.

### Wnioski

- Convex mutacje są atomowe, ale proces biznesowy Stripe+booking wymaga jawnego timeoutu/holda i sprzątania wygasłych pendingów, inaczej można zostawić zablokowane koje bez płatności.
- Ostrzeżenie Clerk o development keys nie było przyczyną wiszącego flow; problemem było czekanie create-intent bez limitu i bez widocznego błędu UI.

### Następne kroki

- Przetestować ręcznie cały flow: wybór koi -> Google auth -> dane załogi -> płatność testowa BLIK -> krok 6 -> pobranie PDF -> dashboard PDF.
- Zweryfikować webhook Stripe lokalnie/na preview, bo bez poprawnego payment_intent.succeeded rezerwacja może zostać pending/held do wygaśnięcia.
- Rozważyć później przeniesienie userId z query paramu PDF na server-side auth/Clerk/Convex auth, żeby endpoint potwierdzenia nie ufał jawnie przekazanemu userId.
- Przed commitem sprawdzić/omówić szeroki zestaw niecommitowanych zmian: docs/handoff.md, package.json/pnpm-lock, Convex schema/mutations/queries/crons, /book, dashboard, endpoint PDF, locale.

## Sesja 2026-05-01 09:51 — Booking uczestnicy i płatności ratalne

Checkpoint przed kompaktowaniem po dużej przebudowie booking flow: holdy miejsc, PDF z polskimi znakami, e-mail potwierdzenia, rozdzielenie kupującego od żeglarzy, opcjonalne dane załogi oraz model płatności ratalnych.

### Zmiany

- Dodano bookingParticipants jako osobne rekordy uczestników przypisane do bookingów i koi; nowe bookingi tworzą uczestników w stanie missing, a checkout nie wymaga już danych żeglarzy przed płatnością.
- Naprawiono PDF przez osadzenie fontu DejaVuSans z dejavu-fonts-ttf oraz dodano wysyłkę potwierdzenia PDF przez Brevo po Stripe webhook, z fallbackiem na buyerEmail.
- Dodano model płatności ratalnych: paymentPlans, paymentPlanItems i bookingPayments, plan admina per segment, harmonogram płatności per booking oraz mutacje do oznaczania wybranych rat jako processing/paid/failed.

### Decyzje

- PLN zostaje jedyną walutą na teraz; model paymentPlans ma jednak jawne currency, żeby późniejszy EUR można było dodać bez przebudowy całego schematu.
- Etap 4, czyli UI i Stripe flow dla zaliczki / większej wpłaty / całości, nie został jeszcze rozpoczęty, bo użytkownik poprosił o checkpoint przed kompaktowaniem.

### Wnioski

- Po rozdzieleniu kupującego i żeglarzy e-mail potwierdzenia nie może zależeć od crewProfiles; buyerEmail musi być zapisany na booking już przy create-intent.
- Dla rat jedna płatność Stripe może obejmować kilka pozycji harmonogramu, więc bookingPayments dostały stripePaymentIntentId i osobne mutacje markBookingPaymentsProcessing/confirmBookingPayments/cancelBookingPayments.

### Następne kroki

- Po kompaktowaniu rozpocząć Etap 4: pozwolić użytkownikowi wybrać w checkout/panelu, czy płaci zaliczkę, kilka rat, czy całość, a create-intent musi liczyć amount z wybranych bookingPayments.
- Przed commitem przejrzeć szeroki zestaw zmian i pamiętać, że pnpm build wcześniej dochodził do adaptera Vercel, ale padał na lokalnym @vercel/nft QuickLook path.

## Sesja 2026-05-01 12:16 — Raport handoff dla klienta i automatyczna wysyłka

Sesja przygotowała raport prac za 2026-04-30 i dopięła prosty mechanizm automatycznej wysyłki raportów „z wczoraj” (tylko jeśli są wpisy do raportowania).

### Zmiany

- Przygotowano HTML raportu „Raport prac — 2026-04-30” i wysłano go przez Brevo na `msmolarski@jmsstudio.com` (po ponowieniu wysyłki poza sandboxem).
- Dodano skrypt `email:handoff:yesterday`, który:
	- wyciąga wpisy z `docs/handoff.md` z poprzedniego dnia
	- generuje krótki raport HTML po polsku bez technicznego żargonu
	- wysyła e-mail tylko wtedy, gdy są realne wpisy do raportowania
- Dodano krótką instrukcję uruchamiania cyklicznego (cron) w `docs/handoff-email-automation.md`.
- Dodano draft artykułu do bazy wiedzy projektu: `docs/kb/daily-handoff-email-automation.md` (do promocji do knowledge-vault przy kolejnej okazji).

### Decyzje

- Raport dzienny ma być wysyłany wyłącznie wtedy, gdy w `docs/handoff.md` są wpisy z poprzedniego dnia.
- Skrypt raportu ma budować treść biznesowo i prosto (bez nazw plików/komend/bibliotek), nawet jeśli wejściowe wpisy w handoff są techniczne.

### Wnioski

- W środowisku sandbox może nie być dostępu do DNS/Internetu (objaw: `ENOTFOUND api.brevo.com`) — automatyczna wysyłka musi działać na runnerze z dostępem do sieci.
- `pnpm check` przechodzi, ale `pnpm lint` nadal wskazuje znane problemy formatowania w istniejącym pliku dashboardu (niezwiązane bezpośrednio z tą sesją).

### Następne kroki

#### Next

- Ustalić gdzie ma działać harmonogram wysyłki (cron na maszynie / Vercel Cron / GitHub Actions) i wprowadzić zmienne środowiskowe Brevo w secrets danego środowiska.
- Rozstrzygnąć, co robimy z `pnpm lint` (format lub wyjątek dla problematycznego pliku), żeby automatyzacje nie były blokowane.

#### Blocked / Later / Open questions

- Promocja artykułu `docs/kb/daily-handoff-email-automation.md` do `knowledge-vault/wiki/` (ponadprojektowy wzorzec dla kolejnych projektów).

## Sesja 2026-05-01 10:55 — Raport handoff: automatyczna wysyłka

Sesja domknęła wysyłkę raportu handoff dla klienta za 2026-04-30 oraz dopięła stabilny sposób uruchamiania automatycznej wysyłki raportu „z wczoraj” na przyszłość.

### Zmiany

- Przygotowano raport HTML za 2026-04-30 na podstawie wpisów w docs/handoff.md i wysłano go do msmolarski@jmsstudio.com przez Brevo (transactional email).
- Dodano skrypt email:handoff:yesterday, który:
  - liczy datę „wczoraj” lokalnie
  - wysyła raport tylko wtedy, gdy są wpisy z tej daty
  - generuje plik HTML w /private/tmp dla diagnostyki
- Dodano krótki opis jak uruchamiać wysyłkę cyklicznie (cron/scheduler) w docs/handoff-email-automation.md.
- Dodano draft do bazy wiedzy repo: docs/kb/daily-handoff-email-automation.md (wzorzec do użycia w kolejnych projektach).

### Decyzje

- Automatyzacja raportu ma działać w trybie „no-op”: nie wysyłać e-maila, jeśli brak wpisów z poprzedniego dnia.

### Wnioski

- W środowisku sandbox (agent/CI) wysyłka HTTP może paść na brak DNS/Internetu (np. ENOTFOUND api.brevo.com). Tę automatyzację trzeba uruchamiać na runnerze z dostępem do sieci albo w trybie poza sandboxem.

### Następne kroki

#### Next

- Ustawić cykliczne uruchamianie email:handoff:yesterday (cron/scheduler) w docelowym środowisku.

#### Blocked / Later / Open questions

- pnpm lint nadal raportuje znane problemy formatowania w src/routes/[[lang=lang]]/dashboard/crew/[participantId]/+page.svelte (nie dotykane w tej sesji).

## Sesja 2026-05-01 10:56 — Raport handoff: automatyczna wysyłka

Przygotowano i wysłano raport prac za 2026-04-30 oraz dopięto mechanizm automatycznego wysyłania raportów z wczoraj.

### Zmiany

- Wysyłka raportu przez Brevo z gotowego HTML.
- Dodano skrypt email:handoff:yesterday, który wysyła tylko jeśli są wpisy z wczoraj.

### Decyzje

- Automatyzacja ma nie wysyłać maila, gdy brak wpisów z poprzedniego dnia.

### Wnioski

- W sandboxie może nie być DNS/Internetu (ENOTFOUND api.brevo.com) — wysyłkę uruchamiać na runnerze z dostępem do sieci.

### Następne kroki

- Ustawić uruchamianie email:handoff:yesterday w cron/scheduler oraz rozwiązać pnpm lint dla pliku dashboard/crew/[participantId].

## Sesja 2026-05-01 12:10 — Booking roadmap checkpoint (Etapy 1-7)

Checkpoint dla nowych sesji Codex, żeby nie zaczynały analizy booking flow od zera i rozumiały sekwencję zmian przed dalszą pracą nad Etapem 8.

### Zmiany

- **Etapy 1-3 są zamkniętym fundamentem modelu danych i płatności.**
  - Etap 1: dodano `bookingParticipants`, rozdzielono kupującego (`buyerUserId`, `buyerEmail`) od żeglarzy, pojawił się `dataStatus` oraz mutacje/query pod uczestników.
  - Etap 2: checkout nie wymaga już kompletnych danych żeglarzy przed płatnością; booking może powstać i zostać opłacony bez pełnej załogi.
  - Etap 3: dodano model płatności ratalnych (`paymentPlans`, `paymentPlanItems`, `bookingPayments`) oraz statusy finansowe na bookingu.
- **Etap 4 jest pierwszym etapem, od którego booking flow naprawdę zmienia zachowanie użytkownika, i jest już wdrożony.**
  - Checkout obsługuje zaliczkę / całość przez `bookingPayments`.
  - Po pierwszej wpłacie booking staje się aktywny, a koje przechodzą do `taken`.
  - Dashboard pokazuje harmonogram płatności, a raty można opłacać z panelu.
- **Etap 5 jest wdrożony.**
  - Dashboard ma listę uczestników per koja.
  - Jest osobna strona edycji `/dashboard/crew/[participantId]`.
  - Są checklisty postępu: dane załogi i płatności.
- **Etap 6 jest wdrożony.**
  - PDF pokazuje harmonogram płatności i aktualny status finansowy.
  - Maile rozróżniają zaliczkę, ratę i pełną płatność.
  - Email tracking działa per `bookingPayments`.
- **Etap 7 jest wdrożony.**
  - Są crony i maile przypominające o brakujących danych uczestników oraz o nadchodzących / zaległych ratach.
  - Convex reminders używają envów Brevo po stronie Convex deployment.

### Decyzje

- Dla rozumienia historii systemu należy traktować Etapy 1-3 jako warstwę fundamentu, a Etap 4 jako początek właściwego user-facing flow dla zaliczek i rat.
- Obecny stan projektu po booking refactorze to: **Etapy 1-7 ukończone, kolejnym logicznym krokiem jest Etap 8 (migracje, porządki, testy E2E).**
- Nowe sesje Codex nie powinny proponować ponownego projektowania modeli `bookingParticipants` ani `bookingPayments`, chyba że pojawi się nowy wymóg biznesowy.

### Wnioski

- Najważniejsze ryzyko dla nowej sesji to fałszywe założenie, że checkout nadal działa w modelu „pełna płatność + komplet danych załogi przed zakupem”. To już jest nieaktualne.
- Najważniejsze źródła prawdy dla booking flow są teraz rozproszone między Convex schema/mutations, Stripe endpointami, dashboardem uczestników/płatności oraz mailami/reminders; trzeba analizować je jako jeden system.
- Jeśli trzeba szybko wejść w temat, zaczynaj analizę od Etapu 4, ale pamiętaj, że Etapy 1-3 tłumaczą, skąd wzięły się obecne modele danych i statusy.

### Następne kroki

- Przy kolejnej dużej sesji bookingowej rozpocząć od Etapu 8: migracje legacy / cleanup / pełne testy E2E i domknięcie jakości flow.
- Przed kolejnymi zmianami w booking flow sprawdzić, czy aktualne decyzje z Etapów 4-7 nie pokrywają już proponowanego rozwiązania.

## Sesja 2026-05-01 — Etap 4-8 booking refactor + push main

### Zmiany

- **Etap 4**: `applyStripePayment` zastępuje `confirmBooking`/`confirmBookingPayments`; create-intent przyjmuje `selectedSortOrders[]`; nowy `/api/stripe/pay-installment` + standalone `/dashboard/pay/[paymentId]`; wybór „Co płacisz teraz?" w `/book` step 5 (kumulatywny prefix harmonogramu); `seedTestPaymentPlan` helper.
- **Etap 5**: Lista kart uczestników w `/dashboard` tab „Dane załogi" (legacy crewProfile ukryty); standalone `/dashboard/crew/[participantId]` z reuse `crewProfileSchema` + „Skopiuj moje dane"; checklisty Dane załogi/Płatności w tabie Rezerwacja.
- **Etap 6**: PDF dostał sekcję Harmonogram płatności; `sendPaymentConfirmationEmail({type: deposit/installment/fully-paid})`; per-payment email tracker (`confirmationEmailSentAt` na `bookingPayments` + `markPaymentEmailSent`); webhook klasyfikuje typ maila, PDF tylko dla deposit + fully-paid.
- **Etap 7**: Convex Brevo helpers (`src/convex/_brevo.ts`, `_emails.ts`) + crons reminders (`markOverduePayments` daily, `sendCrewDataReminders`/`sendUpcomingPaymentReminders`/`sendOverduePaymentReminders` daily); throttle (crew 14d×3, upcoming 1×, overdue 3d×5); `REMINDERS_DRY_RUN` guard.
- **Etap 8**: `backfillLegacyBookingPayments` idempotentna migracja istniejących bookings → 1 wiersz `kind:'full'` + uzupełnienie `totalAmount`/`paymentStatus`/`currency`; `docs/etap-test-checklist.md` (manualne E2E scenariusze).
- **Commits**: `649e079` Etap 1-4, `5d6d7ca` Etap 5, `0ad408e` Etap 6-7, `ad743e2` Etap 8 → `git push origin main` zrobiony.

### Decyzje

- Wariant **2a** wybrany dla checkout: radio z prefix-z-planu zamiast custom kwoty; 2c (partial payments) jako future evolution (project memory zapisana).
- Berths → `taken` już po zaliczce (semantyka: zarezerwowane), booking osobno trzyma `paymentStatus = deposit_paid`.
- Email installment **bez PDF** (lekki mail), deposit/fully-paid z PDF — kompromis spam vs dokumentacja.
- Convex env vars dla reminderów (`BREVO_*`, `PUBLIC_APP_URL`) ustawiane **osobno** od SvelteKit `.env` (przez `npx convex env set`).
- Migracja legacy → jedna pozycja `kind:'full'` z paid jeśli booking confirmed (nie dorabiamy retroaktywnego harmonogramu).
- Dla Etapu 5 legacy `crewProfiles` ukryte z UI dashboardu, ale prefilluje „Skopiuj moje dane" na stronie uczestnika.

### Wnioski

- **`$derived`** w Svelte 5 nie przyjmuje funkcji — dla złożonej derivacji używać **`$derived.by(() => {...})`**. Inaczej derived zawiera funkcję jako wartość. → kandydat na wiki
- **BookingInput.oninput** jest `() => void` (bez args). Dla listy kart z dynamicznymi kluczami stanu w Svelte 5 najprostszy pattern: **uncontrolled input + `bind:this={refMap[id]}` + czytanie `.value` na save**. Omija problemy z `bind:value` do dynamicznie tworzonych kluczy `$state`. → kandydat na wiki
- **Convex pliki z prefiksem `_`** są wykluczone z public API codegen (`api.ts`) — idealne na helpery internal modułów (`_brevo.ts`, `_emails.ts`). → kandydat na wiki
- **Convex actions używają `process.env.*`** (Convex runtime), osobno od SvelteKit `$env/static/private`. Multi-runtime aplikacja wymaga ustawienia envów dwukrotnie. → kandydat na wiki
- W Convex `internalQuery`/`runQuery` z tego samego pliku trzeba podać **explicit return type** na `await ctx.runQuery(...)`, żeby TS cycle-detection nie wywaliła. → kandydat na wiki
- `cancelBooking` woła się tylko po `booking.stripePaymentIntentId` — przy rozdziale na booking PI vs installment PI ma to skutek uboczny: failure raty NIE anuluje bookingu (cancelBookingPayments markuje tylko ratę jako failed). Accidentalnie poprawne — webhook bezpiecznie woła oba.

### Następne kroki

#### Next

- Push do `production` branch (z `main`) → automatyczny Vercel deploy.
- `npx convex deploy` na prod + ustawić env vars w Convex Dashboard (`BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `PUBLIC_APP_URL`).
- Uruchomić jednorazowo `mutations:backfillLegacyBookingPayments` i `mutations:backfillBookingParticipants` z Convex Dashboard po deploy.
- Manualny przebieg `docs/etap-test-checklist.md` na preview Vercel przed promote do prod.

#### Blocked / Later / Open questions

- Lokalizacja maili PL only — Wuchale nie sięga w server-side moduły.
- `pnpm lint` nadal pada na pre-existing pliki (`docs/handoff.md`, design HTML, codex script) — nie blokuje, do uporządkowania.
- Wariant 2c (custom kwota >= zaliczka + partial payments) — czeka na sygnał biznesowy.
## Sesja 2026-05-01 16:30 — Admin console design handoff

### Zmiany

- Przygotowano projektowy handoff rozbudowy `/admin` jako centrum sprzedaży, płatności, alertów i kompletności danych załogi:
  - `docs/design/admin-operations-console-spec.md`
  - `docs/design/admin-crew-data-verification-spec.md`
  - `docs/design/admin-implementation-prompts.md`
  - `docs/design/huashu-admin-operations-console.html`
- Rozszerzono prototyp Huashu o zakładki i moduły: Sales Board, Alert Queue, Automatyzacje, Dane załogi, Miejsca specjalne, drawer rezerwacji, monity adhoc, token flow potwierdzania danych i elastyczny harmonogram rat.
- Przygotowano materiały review dla Michała:
  - `docs/design/admin-panel-review-for-michal.html`
  - `docs/design/admin-clickable-prototype-email.html`
- Wysłano do `HANDOFF_REPORT_TO` dwa maile przez Brevo:
  - opis biznesowy projektu panelu admina, message ID `<202605011235.93153449012@smtp-relay.mailin.fr>`
  - klikalny prototyp HTML jako załącznik, message ID `<202605011240.30414070110@smtp-relay.mailin.fr>`
- Dodano obsługę załączników do skryptów:
  - `scripts/brevo-mail.mjs`
  - `scripts/send-handoff-report.mjs`
- Zrobiono commit `f79ca7f Add admin console design handoff`.

### Decyzje

- Produkcyjny dostęp do `/admin` ma być zabezpieczony przez Clerk role / metadata; produkcyjnie dostęp ma kapitan/operator, a w dev dodatkowo właściciel projektu jako operator testowy przez dev-only allowlist.
- Brevo zostaje aktualnym providerem monitów i alertów.
- Alerty admina mają być widoczne w panelu oraz wysyłane e-mailem do adresu analogicznego do `HANDOFF_REPORT_TO`.
- WhatsApp/SMS na start pozostają jako ręcznie kopiowana treść, z możliwością późniejszej automatyzacji.
- Harmonogram rat ma być elastyczny: admin wybiera szablon/liczbę pozycji, a plan segmentu jest przepisywany jako snapshot do bookingu.
- Dane żeglarzy wpisane przez admina nie są automatycznie finalne; uczestnik potwierdza je przez bezpieczny link tokenowy albo zgłasza korektę.
- Maile admin/crew/reminder mają stylistycznie bazować na mailach przygotowanych dla Michała: navy/brass, karta, inline styles, prosty język biznesowy, czytelne CTA.
- `captain` i `complimentary` zostają modułem obok Sales Board, bez mieszania z normalną sprzedażą.
- Pełny audit log zostaje na później.

### Wnioski

- Klikalny prototyp wysyłany mailem najlepiej przesyłać jako załącznik HTML z krótką instrukcją, bo klient pocztowy może blokować JS/CSS w podglądzie.
- Prompty dla kolejnego implementera powinny mieć formę senior-level brief: cel, kontekst, gotchas, weryfikacja; nie przepisywać implementacji linijka po linijce.
- `docs/design/huashu-admin-operations-console.html` jest wzorcem UI/UX, ale produkcyjna implementacja musi opierać się na realnych danych Convex i uprawnieniach Clerk.
- Zmiany w `docs/handoff.md` istniały już przed commitem i nie zostały ujęte w commicie `f79ca7f`.

### Następne kroki

#### Next

- Poczekać na feedback Michała do projektu panelu admina i ewentualnie doprecyzować UX/proces.
- Implementację zacząć od Etapu 1 w `docs/design/admin-implementation-prompts.md`: bezpieczny access control `/admin` przez Clerk.
- Następnie Etap 2: read-only Admin Overview z realnymi KPI, Sales Board i Alert Queue z Convex.

#### Blocked / Later / Open questions

- Ustalić ostatecznie długość ważności linku potwierdzającego dane żeglarza: 7 czy 14 dni.
- Ustalić, czy alerty krytyczne do admina mają iść natychmiast, czy w rytmie dziennym.
- Po obserwacji sprzedaży wrócić do decyzji o audit logu i automatyzacji WhatsApp/SMS.

## Sesja 2026-05-01 16:31 — Admin console design handoff

Sesja przygotowała design-first handoff rozbudowy /admin jako centrum sprzedaży, płatności, alertów i danych załogi oraz wysłała materiały review do Michała.

### Zmiany
- Dodano specy, prototyp Huashu i senior-level prompty wdrożeniowe dla etapów Admin Console.
- Wysłano do HANDOFF_REPORT_TO mail z opisem panelu oraz drugi mail z klikalnym prototypem HTML jako załącznikiem.

### Decyzje
- Produkcyjny /admin ma być zabezpieczony przez Clerk role metadata; Brevo zostaje providerem monitów; raty są elastyczne i snapshotowane do bookingów.

### Wnioski
- Klikalny HTML lepiej wysyłać jako załącznik z instrukcją otwarcia w przeglądarce, bo klient pocztowy może blokować interakcje.

### Następne kroki
- Po feedbacku Michała rozpocząć implementację od Etapu 1 w docs/design/admin-implementation-prompts.md: access control /admin przez Clerk.

## Sesja 2026-05-01 17:48 — Codex session

### Zmiany
- Brak skrótu zmian.

### Decyzje
- Brak nowych decyzji.

### Wnioski
- Brak nowych wniosków.

### Następne kroki
- Brak zapisanych kolejnych kroków.

## Sesja 2026-05-02 — Admin Operations Console Etap 1-8

### Zmiany

- Etap 1 (commit `040cda2`): guard `/admin` (`src/lib/server/admin-guard.ts`) z Clerk `publicMetadata.role` jako autorytetem i dev-only `ADMIN_DEV_ALLOWLIST`. Forbidden state w `+error.svelte`.
- Etap 2 (commit `040cda2`): `src/convex/admin.ts:overviewBySegment` agregujące KPI / Sales Board / Alert Queue z priorytetyzacją alertów. Admin shell `+layout@.svelte` z sidebar (4 zakładki).
- Etap 3 (commit `040cda2`): `bookingDetailById` query, `sendAdhocPaymentReminder` / `sendAdhocCrewDataReminder` actions z opcjonalną kopią do operatora. Drawer rezerwacji (raty, uczestnicy, historia kontaktu, copy WhatsApp). Email shell przerobiony na navy/brass card.
- Etap 4 (commit `e678991`): `/admin/automation` editor harmonogramów rat z 4 szablonami. Backend (`upsertSegmentPaymentPlan` + snapshot w `createBookingPaymentSchedule`) już istniał.
- Etap 5 (commit `e678991`): rozszerzenie `bookingParticipants` o `confirmationStatus` + `adminEditedAt/By`. Mutacja `adminUpdateParticipantData`. Drawer dostaje inline edit form i KPI „Do potwierdzenia".
- Etap 6 (commit `e678991`): tabela `crewConfirmationTokens` (SHA-256 hash, 14-dniowy expiry). `sendCrewConfirmationLink` action (Brevo). Public `/crew/confirm/[token]` z @-reset layoutu. Mutacje `confirmCrewDataByToken` i `requestCrewDataCorrectionByToken`.
- Etap 7 (commit `e678991`): `/admin/special` przepisany do dwóch paneli (Captain read-only, Complimentary edytowalne). Migracja captain schowana w `<details>`.
- Etap 8 (commit `e678991`): `docs/admin-e2e-checklist.md` (9 scenariuszy) + `docs/admin-post-mvp-decisions.md` (11 pozycji backloga).

### Decyzje

- Convex auth hardening świadomie odłożony do post-MVP — `adminUserId` przyjmowany jako string arg, weryfikacja przez SvelteKit guard. Trigger: drugi operator lub audyt.
- WhatsApp = client-side clipboard (bez DB write). Audit log nie ma osobnej tabeli — historia kontaktu derywowana z `lastReminderSentAt` / `reminderCount`.
- Edycja przez admina cofa `confirmed` → `drafted_by_admin` (rekomendacja MVP w specu) — kapitan widzi rozjazd „dane się zmieniły, uczestnik nie wie".
- Token użyty dopiero po akcji (nie podglądzie) — pozwala uczestnikowi otworzyć link wielokrotnie.
- Plan segmentu zmienia się tylko dla nowych bookingów. Snapshotowanie już istniało w `createBookingPaymentSchedule`.
- Email shell przerobiony na navy/brass z table layout — crony też dostały nową stylistykę (one shell, jedna spójność).

### Wnioski

- **SvelteKit `+layout@.svelte` (@-reset)** to czysty sposób na pominięcie parent layout (np. SiteNav) bez restrukturyzacji folderów. Działa równie dobrze dla admin shell jak i public token confirmation page. Wzorzec ponadprojektowy — kandydat do `knowledge-vault/wiki/`.
- Convex actions mają dostęp do `crypto.subtle` i `crypto.getRandomValues` bez `'use node'` directive — wystarczające do generacji i hashowania tokenów.
- Reactive Convex query w drawer: po mutacji dane same się odświeżają. Nie trzeba ręcznego invalidate.
- KPI grid 7→8 kolumn wymagało ręcznej zmiany `repeat(N, ...)` — `auto-fit/minmax` byłoby bardziej odporne na rozszerzenia.
- Edit z bezpośrednim Editem na pliku z tabami: czasem nie matchuje wieloliniowego stringa przy spacjach/tabach — bezpieczniej anchor na unikalnej linii niż cały blok.
- `prettier-plugin-svelte` formatuje `bind:value`/atrybuty inaczej niż ręczny styl — final pass `prettier --write` warto trzymać na koniec etapu, nie po każdej zmianie.

### Następne kroki

#### Next

- Push commits (`040cda2`, `e678991`) do `production` + `npx convex deploy` (z migrowaną schemą: `bookingParticipants` rozszerzone, `crewConfirmationTokens` nowa tabela).
- Ustawić Convex env: `npx convex env set HANDOFF_REPORT_TO ...` i `PUBLIC_APP_URL ...` na prod.
- Manualny przebieg `docs/admin-e2e-checklist.md` na preview Vercel.
- Odpalić `convex.mutations.seedTestPaymentPlan` z `s1` jeśli nie ma planu w prod.
- Ustawić Clerk publicMetadata `role: admin` dla operatorów produkcyjnych.

#### Blocked / Later / Open questions

- Convex auth hardening (`auth.config.ts` + `ctx.auth.getUserIdentity`) — najwyższy priorytet z post-MVP backloga, czeka na drugiego operatora lub audyt.
- Auto-wygaszający cron na confirmation tokens — lazy expiry działa, niski priorytet.
- WhatsApp/SMS automation — czeka na operacyjną potrzebę.
- Single source of truth dla `voyageSegments` (statyczne `src/lib/data/voyage-segments.ts` vs Convex) — czeka na pierwszą rozbieżność.
- Niezwiązane z admin: Clerk OTP styling (`+layout.svelte`, `book/+page.svelte`) — diff nieskommitowany, do osobnego commita.

## Sesja 2026-05-03 — FAQ + Poradnik załogi

### Zmiany

- Nowy moduł `src/lib/data/crew-guide.ts`: 6 kategorii, 3 checklisty (dokumenty / pakowanie / płatności), 27 pytań, 7 oznaczonych `featured`. Eksporty + typy TS (`CrewGuideCategory`, `CrewGuideChecklist`, `CrewGuideQuestion`, `featuredCrewGuideQuestions`).
- `src/lib/components/faq-section/faq-section.svelte` przebudowane: czyta `featuredCrewGuideQuestions` z modułu, lead „krótki wybór", CTA do `/poradnik`. Zachowany styl navy/brass akordeonu.
- Nowa strona `/poradnik` (`src/routes/[[lang=lang]]/poradnik/+page.svelte`) + komponent `src/lib/components/crew-guide-page/crew-guide-page.svelte` (+ `index.ts` barrel): hero z badge, sticky sidebar (kategorie + blok kontaktowy), 3 checklisty z lokalnym checked-state + progress bar, sekcje Q&A pogrupowane kategoriami, akordeon z `aria-expanded` / `aria-controls`, finalny CTA. Mobile (≤800px): sidebar → poziomy pas pigułek.
- `src/lib/components/site-footer/site-footer.svelte`: link „Poradnik załogi →" pod CTA rezerwacji.
- `src/convex/_emails.ts/sendCrewDataReminderEmail`: linijka HTML i text z linkiem do `panelUrl('/poradnik')`.
- `src/lib/server/email.ts`: opcjonalne `guideUrl?` w `PaymentEmailInput`, render dyskretnej linijki pod CTA panelu (HTML + text).
- `src/routes/api/stripe/webhook/+server.ts`: webhook przekazuje `guideUrl: ${PUBLIC_APP_URL}/poradnik`.
- Walidacja: `pnpm check` → 0 błędów / 0 ostrzeżeń (1745 plików).

### Decyzje

- `crew-guide.js` z handoff = kanoniczna baza redakcyjna. Jedyna korekta: `nie wykorzystana` → `niewykorzystana` (PL pisownia łączna).
- Komponent `crew-guide-page` wydzielony osobno (nie inline w route) — strona ma 7 odrębnych sekcji (hero, sidebar, checklists, 6 kategorii, CTA), inline byłoby trudne w utrzymaniu.
- Brak własnego sticky topbara dla `/poradnik` — istniejący `<SiteNav />` (fixed, 64px) z layoutu pełni rolę powrotu do strony głównej. Hero `padding-top: 120px`, żeby zmieścić fixed nav i nie konkurować wizualnie.
- Sidebar staje się poziomym pasem pigułek na ≤800px (zgodnie z prototypem) — nie reusowałem istniejącego nav-a, bo treść (kategorie poradnika) inna.
- Brak Tailwind klas — scoped CSS + tokeny z `app.css`, zgodnie z konwencją sąsiednich komponentów (faq-section, footer, hero).
- `<SiteNav />` zostawiony bez zmian — priorytet rezerwacji nie ma być rozcieńczany. Footer + CTA w FAQ wystarczają.
- `email.ts/guideUrl` opcjonalny w typie — żeby ewentualne inne callery nie pękły, choć Stripe webhook (jedyny obecny) zawsze go teraz wysyła.

### Wnioski

- **Svelte 5 reactivity dla `Record<K, Set<T>>`**: mutacja `Set` w miejscu (`state[k].add(x)`) NIE triggeruje reactivity, bo `$state` proxy widzi tylko zapisy na własnych kluczach obiektu, nie wewnątrz wartości. Trzeba przypisać nowy obiekt na zewnątrz: `state = { ...state, [k]: nextSet }`. Alternatywa: `SvelteSet`/`SvelteMap` z `svelte/reactivity`. Ponadprojektowy gotcha — promowane do `knowledge-vault/wiki/concepts/svelte5-state-nested-collections-reactivity.md`.
- **Layout chain `[[lang=lang]]/+layout.svelte` automatycznie wstrzykuje `<SiteNav />`** — każda nowa public page dziedziczy fixed 64px nav. Wymaga `padding-top` w hero żeby uniknąć nakładek. Pułapka manifestuje się dopiero w przeglądarce, nie w `pnpm check`.
- `$derived.by(() => { ... })` z `Map` pozwala zachłannie pogrupować listę w jednym wyrażeniu zamiast `forEach` + side-effect. Czyściej w runes.
- Lokalny checked-state nie persystuje (refresh = reset). Świadomy minimalizm — gdyby trzeba, localStorage albo `+layout.ts` data load.
- `/poradnik` jest publiczne (bez Clerk), pod `[[lang=lang]]` (PL/EN), ale bez ręcznych kluczy `.po` — Wuchale wyciągnie automatycznie, gdy będzie potrzeba EN.

### Następne kroki

#### Next

- Manualna weryfikacja wizualna w `pnpm dev`: `/`, `/poradnik`, mobile 390px / desktop 1440px — brak poziomego scrolla, akordeony, linki `/book` + `/poradnik`.
- Podmienić `Q&A-sailing-architects.md` na zaktualizowane pytania (gdyby kanoniczny dokument wymagał sync — na razie zostawione).
- Po feedbacku: zdecydować czy `/poradnik` ma trafić do `<SiteNav />`.

#### Blocked / Later / Open questions

- Tłumaczenie EN poradnika — czeka na sygnał, że ktoś chce EN.
- Persystencja checked-state checklist (localStorage / Convex) — czeka na sygnał.
- Cron 14 dni przed rejsem z mailem zawierającym poradnik — świadomie poza zakresem tej sesji.

## Sesja 2026-05-03 — Mobile nav, language switcher, FAQ redesign

### Zmiany

- Nowy `src/lib/components/language-switcher/language-switcher.svelte` (+ barrel) — przełącznik PL/EN czyta `page.url.pathname/search/hash` i `page.params.lang`, regex `^/(en|pl)(?=/|$)` strippuje istniejący prefix, dokleja `/en` lub zostawia goły. `data-sveltekit-reload`, by `loadLocale` w `[[lang=lang]]/+layout.ts` poprawnie podmienił locale.
- `src/lib/components/site-nav/site-nav.svelte`: dodany hamburger (≤900px), pełne mobile menu (linki + Panel + Rezerwuj + LanguageSwitcher), Escape zamyka, klik w link zamyka. Link `Poradnik` dodany do nav. Język widoczny też na desktop, obok Panel/Rezerwuj.
- `src/lib/components/faq-section/faq-section.svelte`: nagłówek przebudowany — eyebrow „Przed wejściem na pokład" + duży tytuł „Zanim wejdziesz na pokład" + outline button po prawej (kolumna na mobile). Pod akordeonem nowy bordered CTA box („Masz więcej pytań?" + opis + outline brass button). Max-width zwiększony z 720px do 1100px.
- `src/lib/components/crew-guide-page/crew-guide-page.svelte`: mobile UX naprawiony — sidebar staje się sticky horizontal scroll (`flex-wrap: nowrap` + `overflow-x: auto`) pod nav (top: 64px), `sidebar__contact` ukryty na mobile, hero zmniejszony (88-96px góra), checklisty 1-kolumnowe, akordeony zwarte, CTA buttons full-width.
- `src/routes/[[lang=lang]]/+page.svelte`: usunięty `<div class="hero__contact">` (Michał / +48 / email) z hero + powiązane style.
- Wuchale auto-wyciągnął nowe stringi do `src/locales/{pl,en}.po` (Poradnik, Otwórz/Zamknij menu, Język, Wybór języka, Przed wejściem na pokład, Zanim wejdziesz na pokład, Masz więcej pytań?, Czytaj poradnik załogi →, Pełny poradnik: 27 pytań…). Stare entries (FAQ, Najczęstsze pytania, „Krótki wybór…", „Otwórz pełny poradnik załogi →", „Michał · Sailing Architects", „SA") zniknęły / zostały oznaczone jako obsolete.
- Walidacja: `pnpm check` → 0 błędów / 0 ostrzeżeń (1747 plików).

### Decyzje

- Language switcher robiony lokalnie (nie reused `domy-modulowe`) — tamten projekt używa Paraglide, ten Wuchale; logika prefixu na poziomie stringa wystarcza, nie ma sensu wciągać helpera z innego stacku.
- Mobile menu jako panel pod nav (top: 64px, krótki content), nie full-screen overlay — zgodne z preferencją „nie zasłaniać całego viewportu bez potrzeby".
- Hamburger pojawia się od 900px (cluster z linkami chowa się), brand text chowa od 480px — żeby przy ~720-900px nie wpadać w stan, gdzie nav jest pusty.
- Sidebar contact w `/poradnik` zostawiony na desktop (przydatny przy długim content), ukryty na mobile (`display: none`) — kontakt do organizatora jest też w footerze i w finalnym CTA.
- Kontakt z hero strony głównej całkowicie usunięty (decyzja z drugiej tury) — był duplikatem footera, marketing-wise psuł hierarchię.
- Outline button w FAQ header celowo używa `border 0.35` + warm-white text (zgodnie ze screenshotem), CTA box pod akordeonem ma `border 0.5` + brass text — żeby wizualnie były odrębne, nie konkurujące.

### Wnioski

- **Wuchale + SvelteKit `[[lang=lang]]` — przełącznik języka nie ma własnego helpera**: trzeba ręcznie regex-stripować prefix z `page.url.pathname` i ponownie nakładać. Wystarczy, ale jeśli ścieżek lang-prefix się rozrośnie, warto wydzielić helper `localeHref(target)`. `data-sveltekit-reload` na linku jest kluczowe — bez niego nawigacja klient-side ominie `loadLocale` w `+layout.ts` i interfejs nie zmieni języka aż do twardego refresha.
- **`resolve('/...')` z grupy `[[lang=lang]]` zwraca ścieżkę bez prefixu** — wszystkie linki w nav/footer ignorują `params.lang`, więc klik z `/en/...` zabiera do PL. Pre-existing bug, nie naprawiony tu, do zaopiekowania osobno (pewnie helper `langHref(path)` w `$lib/i18n`).
- **Sticky horizontal scroll sidebar pod fixed nav (`top: 64px`)** to dobry wzorzec na mobile dla kategorii sekcji — `flex-wrap: nowrap` + `overflow-x: auto` + `scrollbar-width: none` + `flex-shrink: 0` na pigułkach. Nie powoduje horizontal scroll całej strony, bo overflow jest na rodzicu, nie na body.
- **Hamburger-mobile breakpoint 900px (nie 720)** — przy 720-900px desktop cluster z 5 linkami + lang + 2 buttonami nie mieści się czytelnie, lepiej przejść na hamburger wcześniej.
- **Auto-ekstrakcja Wuchale przy hot reload działa cicho** — nowe stringi (np. `aria-label="Wybór języka"`) trafiły do `.po` automatycznie. Warto przejrzeć diff `pl.po`/`en.po` przed commitem, bo auto-ekstrakcja może dodać niechciane klucze.

### Następne kroki

#### Next

- Manualna weryfikacja w przeglądarce (390px / 430px / 1440px, `/`, `/poradnik`, `/en/`, `/en/poradnik`) — niezrobiona, dev server nie był odpalany.
- Tłumaczenia EN dla nowych stringów (`msgstr` w `src/locales/en.po`) — obecnie są kopiami PL.
- Audyt `resolve(...)` → czy potrzebny helper `langHref(path)` honorujący `page.params.lang`.

#### Blocked / Later / Open questions

- Czy mobile menu ma blokować scroll body (gdyby content menu rosło > viewport)?
- Czy sidebar contact w `/poradnik` desktop zostaje, czy też do usunięcia.

## Sesja 2026-05-04 — Setup workflow nauki + git fundamenty

### Zmiany

Brak zmian w kodzie produkcyjnym. Sesja organizacyjna — zbudowanie warstw pamięci pod naukę kodowania.

W projekcie:
- `docs/learning-questions.md` (nowy) — parking lot na pytania w toku, pojedynczy plik z checkboxami
- `.gitignore` — dopisana linia `.claude/worktrees/`
- `scripts/send-yesterday-handoff-report.mjs` — `stripJargon` + `pickHighlights` rozszerzone o template literals, HTML tags, pnpm/npx/node, blok poradnik (autozmiana z poprzedniej sesji, tu tylko zacommitowana)

W `~/.claude/projects/.../memory/`:
- `user_role_learning.md` — rola: nauczyciel/uczeń, edytor: Cursor, projekt: sailing-architects
- `feedback_communication_style.md` — bez fluff, bez gamifikacji, bez „świetne pytanie"
- `user_dyslexia_dysgraphia.md` — krótkie zdania, struktura wizualna, nie komentować literówek
- `reference_learning_profile_vault.md` — pointer do profilu w vault + triggery sesji

W `knowledge-vault/wiki/`:
- `topics/tomek-coding-learning-profile.md` (nowy) — mapa kompetencji 0-4, aktywny kurs (admin E2E checklist 0/9), backlog luk fundamentów, format pracy
- `concepts/anonymous-convex-env-inheritance.md` (nowy) — anonymous Convex deployment dziedziczy `process.env` z parent shella `npx convex dev`
- `concepts/cursor-multi-root-source-control-confusion.md` (nowy) — multi-root workspace + dwa repo git mylą Source Control panel; default workflow podczas nauki: git z terminala
- `index.md` — dopisane pointery do nowych stron

W projekcie zainstalowany plugin Claude Code: `caveman@caveman` (globalnie, scope: user) — nie używamy podczas nauki, tnie wyjaśnienia za bardzo.

### Decyzje

- **Workflow nauki — „reading code as study"**: Tomek ma intuicję ale brak fundamentów. Bierzemy istniejący kod, ja pytam „co i dlaczego", przy luce stop + fundament. Bez kursu od podstaw.
- **Edycja kodu — Tomek pisze, ja sprawdzam**. `Cmd+L` (chat) używać liberalnie, `Cmd+K` (inline edit) ostrożnie — bo zabiera naukę.
- **Profil ucznia w `wiki/topics/`** edytowany ręcznie poza pipeline'em `compile.py`. Świadomy wyjątek od reguły „nie edytuj wiki ręcznie" w knowledge-vault/CLAUDE.md. Powód: kompiler produkuje wiedzę o stacku, profil ucznia to inny rodzaj danych.
- **Triggery sesji nauki**: `close session` (rozszerzony — aktualizuje też profil w vault) + `save learning progress` (checkpoint w środku sesji).
- **Aktywny kurs faza 1**: `docs/admin-e2e-checklist.md` (9 scenariuszy, Etapy 1-7 Admin Operations Console). Tomek testuje w UI, my razem czytamy kod, debugujemy gdy coś pęknie.
- **Parking lot pytań**: jeden plik `docs/learning-questions.md` z checkboxami. Otwarte / zamknięte. Po odpowiedzi: decyzja projektowa → `admin-post-mvp-decisions.md`; trwała wiedza → wiki concepts; lekcja kursowa → profil.
- **Cursor multi-root workspace**: dodany knowledge-vault obok sailing-architects. Wspólne `Cmd+P` po obu repo, ale **uwaga** — Source Control panel widzi dwa repo i może mylić.
- **Tomek ma dysleksję i dysgrafię** — stylistyka odpowiedzi: krótkie zdania, struktura wizualna (tabele, bullety, bold na akcji), izolowane bloki kodu, nigdy nie komentować literówek.

### Wnioski

- **Cursor multi-root + dwa git repo = mylący Source Control panel**. „Publish Branch" zamiast „Sync" pojawia się gdy panel skupia inny repo niż myślisz. Default workflow podczas nauki: git z terminala, GUI dopiero po fundamencie. Promowane do `wiki/concepts/cursor-multi-root-source-control-confusion.md`.
- **Anonymous Convex deployment (`CONVEX_DEPLOYMENT=anonymous:...`) dziedziczy `process.env` z parent shella `npx convex dev`**. Dotenv z `.env`/`.env.local` ładuje się automatycznie. W przeciwieństwie do cloud Convex (gdzie env idzie przez `npx convex env set`). Promowane do `wiki/concepts/anonymous-convex-env-inheritance.md` (z markerem do zweryfikowania empirycznie przy scenariuszu 4-6).
- **`git add .` to pułapka** — łatwo wciągnąć przypadkowo modyfied pliki innych autorów / sekrety / śmieci. Default: zawsze `git add <konkretny plik>`.
- **`git mv` vs zwykłe `mv`** — git zwykle zauważy rename po zawartości, ale `git mv` jest jednoznaczny i nic nie zostawia w „untracked". Zwłaszcza po commicie poprzedniej wersji.
- **Pager (`less`) urywa output git diff**. `git diff … | cat` omija pager — wygodniej do przeglądu całości na ekranie podczas nauki.
- **Plugin caveman zainstalowany ale niedostępny w bieżącej sesji** — Claude Code ładuje skille tylko przy starcie. Po `claude plugin install` trzeba zrestartować sesję żeby skill stał się wywoływalny.

### Następne kroki

#### Next
- **Scenariusz 1 — Guard `/admin`**: kroki 1, 3, 4 z `docs/admin-e2e-checklist.md` (krok 2 pomijamy do czasu drugiego konta Clerk). Po teście otwieramy 4 pliki: `admin-guard.ts`, `+layout.server.ts`, `+error.svelte`, `hooks.server.ts`. Pierwsza lekcja: dlaczego SvelteKit może odmówić dostępu zanim załaduje stronę (granica server/client).
- Tomek przegląda profil ucznia w `wiki/topics/tomek-coding-learning-profile.md` — feedback na mapę kompetencji i backlog luk. Profil zaktualizuję po jego korektach.

#### Blocked / Later / Open questions
- Krok 2 scenariusza 1 (test 403 dla non-admin) — czeka na drugie konto Clerk.
- Cursor pricing decision — zostajemy na Free, eskalacja gdy wpadnie w slow queue. Sprawdzimy empirycznie.
- Verification że anonymous Convex naprawdę widzi `PUBLIC_APP_URL` z `.env` — przyjdzie naturalnie przy scenariuszu 4-6 (mail z linkiem do `localhost:5173/crew/confirm/[token]`).

## Sesja 2026-05-07 — Nauka: Scenariusz 1 admin guard + fix i18n

### Zmiany

- `src/routes/[[lang=lang]]/admin/+layout.ts` (nowy) — dodano `loadLocale(params.lang ?? 'pl')` + `return { ...data }` żeby fix nie kasował `admin` z `+layout.server.ts`. Commit: `fix: load locale in admin layout to prevent i18n-404 on render`. Spushowane na `main`.
- `docs/learning-questions.md` — dopisane pytanie o cookie consent banner (lekcja na później).

### Decyzje

- **`+layout.ts` w admin jako miejsce `loadLocale`** — `+layout@.svelte` (reset) powodował że tłumaczenia były ładowane za późno względem renderowania komponentów. Osobny `+layout.ts` per segment jest najprostszym fixem bez ruszania globalnej struktury.

### Wnioski

- **`+layout@.svelte` (reset) nie blokuje data flow z `+layout.server.ts`** — ale timing `loadLocale` z `[[lang=lang]]/+layout.ts` jest za późny dla komponentów admina. Objaw: i18n-404 znikało po hover (Svelte re-ewaluował stan reaktywny przy evencie DOM). Fix: własny `+layout.ts` w admin.
- **Gdy istnieje i `+layout.server.ts` i `+layout.ts`** — universal load dostaje dane serwera przez parametr `data` i musi je zwrócić przez `return { ...data }`. Bez tego dane serwera znikają.
- **Redirect po Clerk login nie wraca do `/admin`** — po wpisaniu kodu OTP SvelteKit ląduje na `/dashboard`. Wymaga `forceRedirectUrl` lub `next` param w guard redirect. Nienaprawione — do osobnego commita.

### Następne kroki

#### Next

- **Scenariusz 2** z `docs/admin-e2e-checklist.md`: Sales Board + KPI. Kroki 1-4: segment strip, przełączanie KPI, Sales Board z kolumnami, filtry.
- Po Scenariuszu 2 — lekcja kodu: jak działa `useQuery` w Convex (reactive subscription vs fetch).

#### Blocked / Later / Open questions

- Krok 2 Scenariusza 1 (403 dla non-admin) — czeka na drugie konto Clerk.
- **Bug: redirect po OTP login ląduje na `/dashboard` zamiast `/admin`** — po wejściu na `/admin` wylogowanym, zalogowaniu przez OTP email, SvelteKit nie wraca do `/admin`. Wymaga `forceRedirectUrl=/admin` w guard redirect lub `next` param przekazanego do Clerk. Do naprawy w osobnym commicie przed Scenariuszem 2.
- Cookie consent banner — lekcja na później (parking lot).

## Sesja 2026-05-07 (popołudnie) — Nauka: fix redirect po loginie + fundamenty JS

### Zmiany

- `src/routes/[[lang=lang]]/book/+page.svelte` — nowy helper `panelTarget()` czytający `?next=` i routujący na `/admin` lub `/dashboard`. Podmienione dwa miejsca: `$effect` po loginie (~290) i ręczny klik „Przejdź do panelu →" (~594). Commit: `fix: route to /admin (not /dashboard) when next=admin after sign-in`. Spushowane na `main`.
- `src/locales/en.po`, `pl.po` — regeneracja przez Wuchale (skutek wcześniejszych zmian w `admin/+layout@.svelte` i `admin/automation/+page.svelte`). Commit: `chore: regenerate locale files`. Spushowane.
- `docs/learning-questions.md` — dodane dwa UX gaps z dzisiejszej sesji (brak „Wyloguj" w `/dashboard`, czarny caret na ciemnogranatowym OTP).

### Decyzje

- **Whitelist zamiast free-form `next`** — `panelTarget()` mapuje tylko znaną wartość `'admin'` na `/admin`, reszta → `/dashboard`. Powód: zabezpieczenie przed open redirect. Skalowalne na przyszłe wartości `next`.
- **Helper jako top-level `function`** zamiast arrow w zmiennej — dopasowanie do stylu pliku (`bookingUrl`, `syncBookingUrl` też są `function`).
- **`.po` w osobnym chore-commicie** zamiast w fixie — jeden commit, jeden cel.

### Wnioski

- **`?next=` to dane wrogie dopóki niezweryfikowane.** Każdy redirect bazujący na user-providowanej wartości URL musi być whitelistowany. Inaczej phishing przez open redirect.
- **`.po` (Wuchale) auto-regeneruje się przy `pnpm dev`** — gdy ktoś doda tekst UI ale nie zacommituje `.po`, kolejny dev serwer pokaże to jako modyfikację. Higiena: traktować `.po` jak generowany artefakt zsynchronizowany z kodem, nie ręcznie edytowany. Kandydat na `wiki/concepts/` — pójdzie przez `compile.py` w osobnej sesji.
- Drobiazg Prettier: `if (panelLoginMode )` z luźną spacją działa — formatter zje przy zapisie.

### Następne kroki

#### Next

- **Scenariusz 2** z `docs/admin-e2e-checklist.md`: Sales Board + KPI. Plan: segment strip, przełączanie KPI, kolumny Sales Board, filtry.
- Po Scenariuszu 2 — lekcja fundamentu: `useQuery` w Convex jako reactive subscription vs fetch.

#### Blocked / Later / Open questions

- Krok 2 Scenariusza 1 (403 dla non-admin) — nadal czeka na drugie konto Clerk.
- UX: brak „Wyloguj" w `/dashboard` (parking lot).
- UX: caret na OTP niewidoczny (parking lot).
- Cookie consent banner — lekcja na później (parking lot).
- Czy mobile menu ma blokować scroll body (gdyby content menu rosło > viewport)?
- Czy sidebar contact w `/poradnik` desktop zostaje, czy też do usunięcia.

# Sesja 2026-05-08 — Scenariusz 1 admin guard zamknięty + lekcja server/client boundary

### Zmiany

- Brak zmian w kodzie. Sesja wyłącznie dydaktyczna (reading code as study).

### Decyzje

- Scenariusz 1 z `docs/admin-e2e-checklist.md` zamknięty: drugie konto Clerk (`footy2_rubbles@icloud.com`) zweryfikowało krok 2 — non-admin dostaje 403 „Brak uprawnień administracyjnych" zamiast redirectu na `/dashboard`.
- Następna sesja: Scenariusz 2 (Sales Board + KPI) lub lekcja JS `.map().filter()` z backlogu — do decyzji.

### Wnioski

- **Redirect 303 vs error 403 — semantyka dobierana świadomie:** anonim → redirect (brakuje kroku który może zrobić: login). Non-admin zalogowany → 403 (brakuje uprawnień których sam nie zdobędzie). `requireAdmin` w `src/lib/server/admin-guard.ts:89-99` realizuje obie ścieżki. **Promowane do `wiki/concepts/redirect-303-vs-error-403.md`.**
- **JWT / session claims jako fast path, Clerk API jako slow path:** `resolveAdmin` najpierw czyta rolę z `auth.sessionClaims` (token w cookie, lokalnie, mikrosekundy). Fallback do `clerkClient.users.getUser()` (HTTP, setki ms) gdy token nie zawiera roli — bo token się starzeje, rola mogła się zmienić od czasu wystawienia. Wzorzec ogólny: szybki cache → fallback do źródła prawdy.
- **`+layout.server.ts` vs `+layout.ts` — granica server/client:** guard MUSI być `.server.ts`, bo używa `clerkClient` (sekret API), `env` z `$env/dynamic/private` i podejmuje decyzję autoryzacyjną. Reguła: autoryzacja zawsze server-side, bo klient kłamie. OTP / 2FA chronią autentykację (kim jesteś), nie autoryzację (co możesz).
- **`locals` to per-request scratch pad SvelteKit:** świeży `{}` na każdy request, hooks zapisują, `load` czyta, po response znika. `withClerkHandler()` w `hooks.server.ts` świadomie dopisuje `locals.auth()` — nie wszystko z hooka trafia do locals automatycznie.
- **`app.d.ts` zostaje pusty dopóki sami nie dopisujemy do `event.locals`:** paczki (np. `svelte-clerk`) rozszerzają `App.Locals` przez declaration merging — referencja `/// <reference types="svelte-clerk/env" />` ściąga typy. Edycja `app.d.ts` potrzebna tylko gdy własny hook kładzie własne pole (np. `locals.requestId`).
- **Destructuring jednego pola vs trzymanie obiektu — wybór stylistyczny, nie techniczny:** `const { userId } = locals.auth()` sygnalizuje „dalej używam tylko userId". `const auth = locals.auth(); auth.userId` pasuje gdy sięgamy też po `auth.sessionClaims`. Niespójność w `admin-guard.ts` (resolveAdmin trzyma obiekt, requireAdmin destrukturyzuje) bez głębszego powodu — historia edycji, nie projekt.

### Następne kroki

#### Next

- Scenariusz 2 z `docs/admin-e2e-checklist.md` — Sales Board + KPI (segment strip, KPI strip 8 kart, filtry po `flags`).
- Albo lekcja JS `.map().filter()` z backlogu fundamentów — wypłynie i tak przy listach w adminie.

#### Blocked / Later / Open questions

- (brak)

## Sesja 2026-05-10 11:30 — Scenariusz 3 (overdue rata) + bug fix _brevo

### Zmiany

- **Scenariusz 3 z `docs/admin-e2e-checklist.md` zamknięty** (3/9). Pipeline overdue rata → KPI/Alert Queue → drawer → "Wyślij monit" → audit → "Kopiuj WhatsApp" — wszystko zaliczone na rezerwacji `SA-2026-4842`.
- **Postarzenie raty w bazie**: ręczna edycja `bookingPayments` przez Convex Dashboard — `status: pending`, `dueAt: 1746230400000` (2025-05-03, błędnie obliczony — miało być 2026-05-05; zostawione, "372 dni zaległości" nie psuje testu). Wpis dalej w bazie po sesji.
- **Fix bugu `src/convex/_brevo.ts:30-49`**: kolejność `if (isDryRun())` przed `if (!apiKey || !fromEmail)` — wcześniej dry-run nie działał gdy klucze nieustawione, bo walidacja env rzucała pierwsze. Zmiana niezacommitowana.
- **Convex env**: `REMINDERS_DRY_RUN=1` ustawione. Mail nie poszedł fizycznie, treść do logu. WhatsApp clipboard działa (booking ref + kwota + link do panelu).
- **Trzy nowe wpisy w `Otwarte problemy`** (`docs/handoff.md` góra pliku):
  - Toast feedback poza viewportem przy małej wysokości okna → propozycja Svelte Sonner (top-right + richColors).
  - Drawer nie wyróżnia zaległej raty wizualnie mimo że KPI/Alert Queue tak.
  - UX: kupujący ≠ żeglarz — Krok 3 booking flow + email potwierdzenia mylą role.

### Decyzje

- **Dry-run zamiast realnej konfiguracji Brevo na lokalu** — świadomie nie wystawiamy API key na anonymous Convex; testujemy logikę backendową (licznik monitów, audit, toast) bez palenia kwoty na transakcyjny mail i bez ryzyka spamu testowych klientów.
- **Stan postarzonej raty zostaje po sesji** — Sonner integration jutro może się przydać do testów żywego alertu. Cleanup zrobimy gdy potrzebny będzie czysty stan (nie przed Scenariuszem 4 — ten dotyka uczestników, nie rat).
- **Fix `_brevo.ts` nie zacommitowany** — łącznie ze zmianami z otwartych problemów może iść w jednym commicie po Sonnerze, jeśli Tomek zechce wyciągnąć wnioski o atomowości.
- **Bug raportowany jako fix kolejności, nie jako "dorzuć dry-run mode"** — dry-run istniał jako koncept w kodzie, ale był nieosiągalny przez kolejność walidacji. Kierunek naprawy: minimalna zmiana porządku, nie dodanie nowej funkcjonalności.

### Wnioski

- **Convex env vs SvelteKit `.env` to dwa osobne worki** — Convex backend (chmurowy lub lokalny anonymous) ma własny zestaw env vars ustawianych przez `npx convex env set NAME value`. `process.env` w Convex action czyta env Convexa, nie projektu. SvelteKit `.env`/`.env.local` jest tylko dla frontendu i `+server.ts`. Pułapka: edycja `.env.local` nie wpływa na Convex actions, mimo że oba leżą w tym samym repo. Kandydat do `wiki/concepts/convex-env-vs-sveltekit-env.md` — ponadprojektowy.
- **Dry-run jako bypass dla brakujących secretów**: pattern wart zapamiętania — funkcja udaje wysyłkę (log + fake `messageId`) bez fetch do API. Ale **kolejność walidacji ma znaczenie**: `if (dryRun) return` musi być przed `if (!secret) throw`, inaczej dry-run jest nieosiągalny. Generic gotcha w "guard clauses" — najtwardszy guard nie zawsze powinien iść pierwszy.
- **Drawer status czyta surowy `bookingPayments.status`** zamiast derive po `dueAt < now` — stąd niespójność z KPI/Alert Queue. Wzorzec do rozpoznania: gdy ten sam fakt jest reprezentowany w bazie binarnie (`pending`/`overdue`) ale tylko jeden writer go aktualizuje (cron `markOverduePayments`), reszta widoków musi albo czekać na cron, albo derive'ować lokalnie. Dwa źródła prawdy = niespójność, jeden derive = spójność.
- **Wuchale toast (istniejący w admin shell) jest pozycjonowany u dołu** — przy krótkim viewport ucina feedback. Świadoma ingerencja w UX, nie tylko cosmetic. Sonner ma `position` jako prop, więc problem znika konfiguracją.
- **`npx convex dashboard` to jedyna ścieżka do anonymous local Convex Dashboard** — port `127.0.0.1:6790` nie jest serwerem WWW, to TCP control channel. Mit z poprzedniej sesji potwierdzony.

### Następne kroki

#### Next

- **Wdrożyć Svelte Sonner** (priorytet — wybór użytkownika): `pnpm add svelte-sonner`, `<Toaster position="top-right" richColors />` w admin shell layout, refactor istniejących toastów w drawer akcjach. Czytanie [Svelte Sonner doc](https://svelte-sonner.vercel.app/) + lokalna kopia `knowledge-vault/raw/docs/Svelte Sonner.md`.
- **Scenariusz 4** — admin edytuje dane uczestnika (`bookingParticipants`) → token email → `/crew/confirm/[token]` → potwierdzenie. Tu wreszcie tykamy „kupujący ≠ żeglarz" w UI.
- **Commit zmian z tej sesji** — `_brevo.ts` fix kolejności + ewentualnie Sonner refactor razem.

#### Blocked / Later / Open questions

- **Drawer overdue highlight** — fix w UI (derive `overdue` po `dueAt < now`) vs fix w backendzie (`markOverduePayments` aktualizuje `status`)? Decyzja pasuje do większej dyskusji „derive vs storage" — odłożone.
- **Realna integracja Brevo na lokalu** — czeka na potrzebę testowania wizualnego template'ów maili (póki co dry-run wystarcza).
- **Cleanup postarzonej raty `SA-2026-4842`** — przed produkcyjnym deployem albo gdy potrzebny będzie czysty stan testowy.
- **Kupujący ≠ żeglarz — copy + UI rozdzielić** — duża zmiana, do osobnej sesji po Sonnerze i Scenariuszu 4.
- **`package.json` ma malformed config** (warning npm: `Unknown project config "[\"esbuild\"]}"`) — niska priorytet, nie blokuje.

## Sesja 2026-05-15 — Toast/notification system (Krok 2 trzykrokowego planu)

### Zmiany

- **Nowy state singleton** `src/lib/state/toast.svelte.ts` — typy `ToastStatus` (`'success' | 'error' | 'info' | 'warning'`), `Toast` (id/message/status/duration), wewnętrzny `AddToastOptions`. Klasa `ToastState` z `toasts = $state<Toast[]>([])`, `private timeouts = new Map<string, ReturnType<typeof setTimeout>>()`, metodami `addToast(options)` (UUID + setTimeout warunkowy `duration > 0 && !== Infinity`) i `removeToast(id)` (clearTimeout + filter). Eksport `export const toastState = new ToastState()` — singleton modułu, spójny z konwencją `booking-selection.svelte.ts`.
- **Komponent `Toast`** `src/lib/components/toast/{toast.svelte, index.ts}` — przyjmuje `toast: Toast` jako jeden prop, BEM klasy `toast`, `toast--{status}`, `toast__message`, `toast__close`. `role="alert"` dla error, `role="status"` reszta. Przycisk X = znak `×` + `aria-label="Zamknij"` + `type="button"` (konwencja z `booking-drawer.svelte`). Stylowanie: navy/brass z `border-left: 3px` w kolorze statusu (success #4ade80, error #ef4444, warning #fbbf24, info brass). Min-width 280, max-width 420.
- **Komponent `Toaster`** `src/lib/components/toaster/{toaster.svelte, index.ts}` — kontener `position: fixed; top: 1rem; right: 1rem; z-index: 9999`. `aria-live="polite" aria-atomic="false"`. Keyed each po `toastState.toasts` z kluczem `(toast.id)`. Każdy slot ma `in:fly={{x:320, duration:200}}`, `out:fly={{x:320, duration:150}}`, `animate:flip={{duration:200}}`. Pointer-events overlay pattern: `none` na `.toaster`, `auto` na `.toaster__slot`.
- **Wpięcie root**: `src/routes/+layout.svelte` — import `Toaster` + render `<Toaster />` po `{@render children()}` wewnątrz `<ClerkProvider>` (jeden globalny system na całą apkę, działa nawet pod admin `+layout@.svelte` reset).

### Decyzje

- **Singleton zamiast Context API** — odejście od pomysłu nomadom toast (context). Powód: stan toastów jest **client-only** (akcje usera w przeglądarce, SSR nigdy nie renderuje toasta), więc wycieki między userami niemożliwe; spójność z istniejącym `booking-selection.svelte.ts`; mniej boilerplate (zero `setContext`/`getContext`/Symbol). Context lekcja z wczoraj zostaje w bazie, użyjemy gdy stan **musi** być per-request.
- **Obiekt opcji w `addToast({...})` zamiast args pozycyjnych** — defaults w destructuringu (`status = 'info'`, `duration = 3000`), `AddToastOptions` typ wewnętrzny (bez eksportu). Skaluje się bez breaking change gdy dorzucimy 4. opcję (np. `action`).
- **Reassignment zamiast mutacji in-place w `$state` collections** — `this.toasts = [...this.toasts, newToast]` i `this.toasts = this.toasts.filter(...)`, nie `.push()`. Spójność z `booking-selection.toggleBerth`. Bezpieczniejsze dla derivacji i debug snapshots.
- **`private timeouts`** — eksplicytne `private` na polu zamiast tylko konwencji. Kompilator wymusi.
- **Pojedyncze pole `message`** zamiast `title`+`comment` — odjazd od pomysłu w trakcie sesji. Jedno pole wystarczy dla MVP, mniej decyzji per wywołanie.
- **Znak `×` zamiast komponentu ikony** — konwencja repo (`booking-drawer.svelte:512` używa tego samego patternu). Zero zależności, A11y rozwiązane przez `aria-label="Zamknij"`.
- **`border-left: 3px` jako sygnał statusu** — spójność z dashboard cards (border-left brass dim). Kolory success/error/warning poza tokenami (tokeny repo nie mają semantic status); minimalna wstawka. Gdy projekt dostanie tokeny `--color-success` itp. — refactor jednolinijkowy.
- **Toaster top-right** (zamiast top-center / bottom-right) — admin patrzy na góra-prawo (Panel/SignOut tam już są), nie konkuruje z dolnymi CTA. Wybór dla MVP; hardcoded, nie prop.
- **Toaster w root `+layout.svelte`, nie `[[lang=lang]]`** — bo admin używa `+layout@.svelte` (reset chain), więc lang layout by go nie dosięgnął.

### Wnioski

- **`this` binding przy ekstrakcji metody klasy** — `export const addToast = toastState.addToast` to **runtime bug**, nie compile error. TS nie ostrzega. Po wywołaniu `addToast(...)` `this` jest `undefined`, dostajemy `Cannot read properties of undefined`. Powód: `this` jest ustawiane w momencie wywołania (to co stoi przed kropką), nie w momencie definicji. Wyciągnięcie referencji do funkcji odrywa ją od instancji. Fundament `this` z profilu („lekcja na potem") trafił sam — promowane: `wiki/concepts/js-this-binding-method-extraction.md`. Fixy: nie eksportuj metod osobno (rekomendowane, spójne z singletonem), arrow-function field, `.bind()`.
- **TS `type` vs `interface`** — 95% zamienne. Kluczowe różnice: union/intersection alias tylko w `type`; **declaration merging** tylko w `interface`. Praktyka: framework / public API biblioteki → `interface` (żeby konsumenci mogli rozszerzyć — patrz `app.d.ts` + `App.Locals`); lokalne kształty, uniony, alias prymitywu → `type`. Hoisting typów: TS pozwala użyć typu zdefiniowanego niżej, ale **człowiek czyta od góry** — kolejność atom → agregat (status → Toast → AddToastOptions → klasa). Promowane: `wiki/concepts/typescript-type-vs-interface-declaration-merging.md`.
- **ARIA — minimalny zestaw dla dynamicznych komponentów** — `role="status"` (polite, screen reader dokończy) vs `role="alert"` (assertive, przerywa); `aria-label` daje nazwę elementom bez tekstu (glify, ikony); `aria-live` na kontenerze monitorującym wstrzykiwany content; `aria-hidden="true"` na dekoracjach; stany dynamiczne `aria-expanded`/`aria-pressed`. Reguła: natywny HTML semantyczny pierwszy, ARIA jako doklejka. Nie promowane (broad topic, mocniejsze będzie po większej liczbie konkretnych przypadków).
- **Singleton vs Context — kiedy który** — singleton OK gdy: state client-only (toasty), repo trzyma tę konwencję, mało boilerplate. Context wymagany gdy: state per-user na serwerze (SSR cache), state per drzewo komponentów (theme provider, form context), testowanie izolowane. Wzmocniona lekcja z wczoraj.
- **Komponent jest funkcją stanu, nie statycznym obrazkiem** — manualne wstawienie `<Toast toast={{...}} />` z hardcoded prop nie reaguje na `removeToast` bo komponent nie czyta z `toastState.toasts`. Akcja zmienia **stan**, framework redrawuje. Różnica od imperatywnego modelu (jQuery: usuń node ręcznie). Fundament reaktywności po raz N-ty, ale tym razem zilustrowany konkretnym własnym bugiem testowym.
- **`animate:` musi siedzieć na bezpośrednim dziecku `{#each}`, nie na komponencie** — dlatego w `Toaster` jest `<div class="toaster__slot" animate:flip>` opakowujący `<Toast>`, nie `<Toast animate:flip>`. Dotyczy tylko animate, nie transition (transition na komponencie się łapie).
- **Pusty barrel `index.ts` = `Cannot read properties of undefined (is not a function)`** — typowy błąd po stworzeniu folderu. Plik istnieje, ale jest pusty, więc `import { Toast } from '$lib/components/toast'` zwraca `undefined`. Svelte krzyczy o `is not a function` w SSR renderze. Lekcja diagnostyczna: sprawdzaj treść barrel po stworzeniu.
- **Pointer-events overlay pattern** w praktyce — już opisane wczoraj jako koncept, dziś zastosowane. Kontener `pointer-events: none` przepuszcza kliknięcia na to co pod spodem (między toastami można normalnie klikać UI), child `pointer-events: auto` łapie kliknięcia X.

### Następne kroki

#### Next

- **Krok 3 trzykrokowego planu**: zastąpić istniejące „komunikaty pod viewportem" w admin booking detail (`src/lib/components/admin/booking-drawer.svelte`) wywołaniami `toastState.addToast({...})` — sukces/error po `sendAdhocPaymentReminder`, `sendAdhocCrewDataReminder`, `adminUpdateParticipantData`. Usunąć tymczasowe test-buttony z `/admin/+page.svelte`.
- Po toastach: powrót do **Scenariusza 4** admin E2E checklist (admin edytuje uczestnika → token → potwierdzenie email).

#### Later

- Toaster pozycja konfigurowalna przez prop (`position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'`) — gdy pojawi się drugi use case.
- Tokeny semantyczne kolorów (`--color-success`, `--color-error`, `--color-warning`) — refactor `toast.svelte` na nie gdy projekt dostanie design system pass.
- `action` na toaście (`{ label, onClick }`) — gdy pojawi się use case „Cofnij" / „Zobacz szczegóły".
- Pause-on-hover na toaście (zatrzymanie timera przy hover) — gdy będą sygnały że user nie zdąża przeczytać.

#### Blocked / Later / Open questions

- Czy toasty mają persystować przez nawigację SPA (klik linka → toast widoczny na nowej stronie)? Singleton trzyma listę, więc tak — ale nie testowane.


## Sesja 2026-05-16 — Krok 3 toast w drawerze + Scenariusz 4 (admin token confirmation)

### Zmiany

- `src/lib/components/admin/booking-drawer.svelte`: migracja 6 use-case'ów (sendPaymentReminder, sendCrewDataReminder, sendConfirmationLink, confirmParticipant, requestCorrection, copyText, saveParticipant) ze starego inline toasta na `toastState.addToast` z `$lib/components/toast`. Usunięty lokalny `let toast = $state(...)`, render `{#if toast}` z linii 901-903, style `.toast`/`.toast--ok`/`.toast--err`. Komunikat w `sendConfirmationLink` poprawiony („z toasta poniżej" → „URL skopiowany do schowka"), `try/catch` clipboardu przesunięte przed addToast żeby komunikat był prawdziwy w momencie wyświetlenia.
- `src/routes/[[lang=lang]]/crew/confirm/[token]/+layout.ts` — nowy plik, `loadLocale(params.lang ?? 'pl')` z typem `LayoutLoad`. Pattern z admin/+layout.ts (commit `a27684f` z 2026-05-15).
- `src/routes/[[lang=lang]]/crew/confirm/[token]/+layout@.svelte` przemianowany na `+layout.svelte` (zdjęty `@-reset`) — workaround dla i18n-404 z wuchale. Konsekwencja: public confirmation page dziedziczy `<SiteNav />` z `[[lang=lang]]/+layout.svelte`.
- `src/routes/[[lang=lang]]/crew/confirm/[token]/+page.svelte`: kolejność warunków renderu — `finished === 'confirmed'` i `finished === 'correction'` przesunięte **przed** `view.data.status === 'invalid'`. Fix race condition Convex reactive subscription vs lokalny `$state`.
- `docs/admin-post-mvp-decisions.md`: 6 nowych pozycji backloga — widoczność realnego odbiorcy reminderów, przyjazne komunikaty błędów, walidacja pól formy edycji uczestnika, drobiazgi UX (date icon, dropdowns, nationality), przywrócenie `+layout@.svelte` po fixie wuchale, przycisk „Poproś o nowy link" na zużytym tokenie.
- Convex env: `PUBLIC_APP_URL=http://localhost:5173` ustawione przez `npx convex env set` (działało już po staremu z prod, ale tokeny generowane lokalnie nie pasowały do prod URL).

### Decyzje

- **Brak refactoru `AddToastOptions` na `duration: number | 'persistent'`** — obecny kod (`if (duration > 0 && duration !== Infinity)`) sensownie obsługuje `0` = persistent. Dodanie union sypie typy bez wartości.
- **Reset `toast = null` na początku akcji skreślony** — w nowym systemie toaster to stos, nie pojedynczy slot. Stare toasty znikają same po duration lub zostają (przy error `duration: 0`). Brak slotu do wyczyszczenia.
- **A-tryb dla i18n-404 + @-reset + głęboko zagnieżdżona route w wuchale** — zdjęcie `@` zamiast debugowania root cause. `<SiteNav />` na public page UX-owo akceptowalny dla MVP. Powrót po fixie zaplanowany w backlogu.
- **Komunikat „URL skopiowany do schowka" mówiony po clipboard.writeText, nie przed** — jeśli clipboard zawiódł cicho (catch), toast nie kłamie. Świadomy odchył od pierwotnego porządku.
- **Lokalny `finished` ma priorytet nad `view.data.status === 'invalid'`** — „co właśnie zrobiłem" > „jaki jest stan bazy". Po refresh `finished` resetuje się i user widzi truth z bazy. Oba warunki potrzebne dla dwóch różnych scenariuszy wejścia.
- **Promocja do wiki:** [[concepts/convex-subscription-vs-local-success-state]] — uniwersalny wzorzec dla każdego systemu z reactive subscriptions.

### Wnioski

- **Convex reactive subscription wyprzedza lokalny `$state` w renderze** — najmocniejsza lekcja sesji. Po `await mutation()` subscription pushuje aktualizację szybciej niż `finished = 'confirmed'` zdąży się ustawić. Kolejność `{#if}` decyduje. Promowane do wiki.
- **`+layout.ts` (bez `.server`) jest uniwersalny** — odpala się SSR i klient. Te same dane potrzebne w obu pipeline'ach (locale catalog) → `.ts`. Sekrety, DB, auth → `.server.ts`. Trzy warstwy load chain wyjaśnione: root server → segment universal → segment server.
- **`./$types` to generowany moduł** — SvelteKit regeneruje przy zmianie struktury route'ów. Dodanie nowego `+layout.ts` wymaga restart `pnpm dev` lub `pnpm check` żeby TS zobaczył nowe typy `LayoutLoad`/`PageData`.
- **Convex env ≠ SvelteKit env (drugi raz)** — `PUBLIC_APP_URL` w Convex env służy actions sklejającym URL-e (token, confirmUrl). Edycja `.env.local` nie wpływa. Wzmocnienie lekcji z 2026-05-10.
- **`@-reset` + wuchale + głęboko zagnieżdżona route = i18n-404 (niezdiagnozowane)** — admin (1 segment od `[[lang=lang]]`) działa, crew/confirm/`[token]` (3 segmenty + dynamic) nie. Empirycznie potwierdzone, root cause nieznane. Backlog.
- **Convex mutation transakcyjność** — `result.ok = true` to **kontrakt** że dane są w bazie, nie zaufanie ślepe. Klient nie potrzebuje drugiego sprawdzenia. Lekcja przy okazji pytania „a co jak success a baza nie zapisze".
- **State machine w UI: stan danych → dostępna akcja** — „Wyślij prośbę" (gdy data missing) vs „Wyślij link do potwierdzenia" (gdy admin wypełnił). Operator nie pamięta, UI prowadzi. Pattern uniwersalny.
- **Incognito jako standard testowania public flow** — czysta sesja, brak ciasteczek admina, brak Clerk. Reset hasła, magic link, public share — wszystko incognito.

### Następne kroki

#### Next

- Scenariusz 5 (Korekta od uczestnika → alert dla admina). Wykorzystaj scenariusz 4 do kroku 7, w kroku 8 zamiast „Potwierdzam" → „Zgłoś poprawkę".
- Scenariusze 6 (Wygasły link), 7 (Plan rat), 8 (Miejsca specjalne), 9 (Hold expiring).

#### Blocked / Later / Open questions

- 6 pozycji w `docs/admin-post-mvp-decisions.md` — patrz sekcja UX/drobne.
- Diagnoza `@-reset` + wuchale + głęboko zagnieżdżona route — root cause nieznane.

## Sesja 2026-05-17 — Scenariusz 5 (korekta) + Scenariusz 6 (wygasły link) + toast cleanup + fundamenty Promise/async

### Zmiany

- `src/routes/[[lang=lang]]/crew/confirm/[token]/+page.svelte` — migracja toastów z lokalnego `let toast = $state(...)` na globalny `toastState.addToast`. Usunięte: deklaracja stanu, 3 resety `toast = null`, render `{#if toast}`, style `.toast/.toast--err/.toast--ok`. Pięć przypisań błędów (linie 40, 43, 55, 68, 71) zamienione na `toastState.addToast({ message, status: 'error', duration: 0 })`. Bug w pierwszej iteracji migracji: w `submitCorrection` znikł guard `if (!correctionNote.trim()) { ...; return }` — naprawiony przed commitem.
- `docs/admin-post-mvp-decisions.md` — dwie pozycje: (1) alert „Link potwierdzenia wygasł" nie wyzwala się sam (storage flag wymagająca eventu mutacji, której UI blokuje), (2) status pill na public confirmation page wygląda jak przycisk — false affordance.
- Convex Dashboard (mock danych do testu UI): ręczny patch `bookingParticipants.confirmationStatus = 'expired'` na jednym uczestniku — workaround żeby zobaczyć alert w Alert Queue mimo gapu w designie.

### Decyzje

- **Migracja toastów `duration: 0` (persistent) dla errorów** — spójność z drawerem (linia 229). User sam zamyka, nie znika przez timeout.
- **Workaround scenariusza 6 zamiast fixu designu** — naprawa derivacji alertu (z `participant.confirmationStatus` na `token.expiresAt < now`) wymaga zmiany w `src/convex/admin.ts` + analizy konsekwencji dla innych alertów. Sesja nauki, nie sesja refactoru — przeszło do backlogu.
- **Commit samodzielny przez Tomka** — tylko `+page.svelte` z migracją toastów; reszta (backlog, handoff, profil) osobno albo zbiorczo.

### Wnioski

- **Convex nie ma URL endpointów** — klient nie zna adresów. `convex.mutation(api.<plik>.<nazwa>, args)` idzie WebSocket'em, na backendzie ląduje w funkcji eksportowanej z `src/convex/<plik>.ts`. Trzy typy funkcji: `query` (read, reactive), `mutation` (write, transakcyjna), `action` (zewnętrzny świat — fetch, email). Inaczej niż REST gdzie endpoint = URL. Kandydat do wiki: [[concepts/convex-functions-vs-rest-endpoints]].
- **`useQuery` to subskrypcja, nie fetch — wzmocnienie z 2026-05-16** — alert „Korekta od uczestnika" w drawerze pojawia się sam po mutacji uczestnika bez refresh strony. WebSocket push: mutation patchuje `bookingParticipants.correctionNote` → Convex wie że `bookingDetailById` subskrybuje tę tabelę → push do drawera → `detail.data` aktualizuje się → Svelte `{#if}` przelicza. Drugi raz ta sama lekcja, na innym widoku.
- **Query agregat zamiast wielu subskrypcji** — `bookingDetailById` zwraca jednym wywołaniem: booking + segment + berths + buyer + payments + participants. Wewnątrz handlera `Promise.all([...])` odpala 4 zapytania **równolegle**. Świadomy wzorzec Convex: jedna subskrypcja per widok, mniej WebSocket round-tripów, prostszy konsument.
- **Storage vs derive — drugi raz, w drugą stronę (wzmocnienie 2026-05-10)** — alert „Link potwierdzenia wygasł" derive'uje z `participant.confirmationStatus === 'expired'` (storage), nie z `token.expiresAt < now` (derive). Storage wymaga eventu zapisu. UI blokuje akcję która jedyna mogła ten event wywołać → pętla zamknięta → alert nigdy nie wyzwala się sam. Pytania diagnostyczne: (1) czy fakt można policzyć z innych pól, (2) czy źródło zmienia się samo (jak czas), (3) czy storage wymaga eventu który może się nie wykonać. **Promocja do wiki:** [[concepts/storage-vs-derive-time-based-facts]].
- **Defense-in-depth — trzy warstwy obronne na wygasłym tokenie** — (1) UI ukrywa przyciski gdy `view.data.status === 'invalid'`, (2) query `getCrewConfirmationByToken` zwraca `status: 'invalid'` zamiast danych, (3) mutation `confirmCrewDataByToken` ma guard `if (row.expiresAt < now)` mimo że UI „już to załatwia". Warstwa 3 nie jest paranoja — chroni przed: stara karta otwarta sprzed wygaśnięcia + klik po wygaśnięciu, race condition na timestamp, klient odpalający mutation z konsoli przeglądarki, zatruty cache. Frontend dla UX, backend dla security. **Promocja do wiki:** [[concepts/defense-in-depth-frontend-backend-layers]]. Powiązane z lekcją 2026-05-08 (autoryzacja zawsze server-side).
- **`onsubmit={...}` + `preventDefault()`** — domyślne zachowanie `<form>` to HTTP request + przeładowanie strony. `e.preventDefault()` wyłącza to żeby SPA mogło obsłużyć submit w JS. Bez tego cały lokalny `$state` znika przy submit. Wzorzec uniwersalny dla każdego SPA, każdej formy.
- **Promise / async / await — pełny fundament** — JS jednowątkowy, operacje trwające (sieć, dysk, crypto) zwracają Promise zamiast wartości. Promise ma trzy stany: pending → fulfilled | rejected (jednorazowo). `await x` wstrzymuje **funkcję** (nie wątek) do rozstrzygnięcia Promise, fulfilled → zwraca wartość, rejected → throw do `catch`. `async` na funkcji wymusza Promise return + uprawnia `await` wewnątrz. Najczęstszy bug: brak `await` → operujesz na Promise zamiast wartości. `Promise.all([p1, p2])` dla równoległych niezależnych operacji — best-of zamiast sumy. Fundament nie jest jeszcze oswojony — wzmocni się przez realne bugi.
- **Niespójność checklisty z kodem — empiryka wygrywa** — krok 3 scenariusza 6 obiecuje że „próba akcji patchuje participanta na expired"; w realu UI blokuje akcję na warstwie query, więc mutation nigdy nie odpala. Mutation handle wygaśnięcia istnieje (linia 327 w `crewConfirmation.ts`) ale jest dead branch w tym konkretnym flow. Dokumentacja starzeje się względem kodu.
- **Convex Dashboard jako mock danych do testu UI** — gdy fizyczny flow nie da się odtworzyć w realistycznym czasie (token 14 dni żywotu, expired flow przez UI nieosiągalny), Dashboard Data tab pozwala ręcznie postawić stan. Drugi raz lekcja z 2026-05-10 (`bookingPayments.status` ręcznie do testu overdue).
- **Tryb rozkazujący w commit message** — test wypełnienia „Jeśli zastosujesz ten commit, on _____ ." Wypełnij bezokolicznikiem angielskim: `fix guard`, `migrate toast`, `add import` — nie `fixed`, nie `fixing`. Conventional Commits: `<type>: <opis>` gdzie type ∈ feat | fix | chore | docs | refactor | style | test.
- **Zsh glob `[[...]]`** — ścieżki SvelteKit z `[[lang=lang]]` w zsh traktowane jako glob pattern. `git add src/.../[[lang=lang]]/...` → `zsh: no matches found`. Fix: single quotes (`'src/...'`) albo escape backslashami albo `noglob` prefix. Single quotes nic nie interpretują — najsafest.

### Następne kroki

#### Next

- **Scenariusz 7** — Plan rat: globalna zmiana nie modyfikuje istniejących bookingów. Świeży obszar (`/admin/automation`), niezwiązany z tokens/uczestnicy światem.
- Po Scenariuszu 7 — lekcja: snapshot vs reference w bazie (dlaczego stare bookingi mają stary plan rat zamrożony).

#### Blocked / Later / Open questions

- Alert „Link potwierdzenia wygasł" — design fix derive'ujący z `token.expiresAt`, nie z `participant.confirmationStatus`. W backlogu.
- Status pill na public confirmation page wygląda jak button — false affordance. W backlogu UX.
- Fundament Promise/async nie jest „oswojony" — Tomek sygnalizował świadomie. Wzmocnienie przez realne bugi w kolejnych sesjach.
- Scenariusze 8 (Miejsca specjalne), 9 (Hold expiring) — po Scenariuszu 7.

~