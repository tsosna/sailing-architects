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

## Sesja 2026-06-20 (długa, ~5h) — A7a 15/17: schema refundów + widen-migrate-narrow ćwiczony na żywo

### Zmiany

- **Nowy moduł A7 (Stripe refundy) — design + schema gotowe.** 14-wiadomościowy dry-run koncepcji z Tomkiem, mail do Michała wysłany (do akceptacji 4 decyzji biznesowych: progi polityki, prowizja Stripe, własny email, edge case'y).
- **Architektura refund'ów uzgodniona (pełen scope w 5 sub-etapach A7a-A7e):** wariant Y (`bookingPayments.refundedAmount` + osobna `refunds` tabela), cascade od najnowszej charge, auto-release koi przy full refund (Michał decyduje partial), 2 emaile po webhook potwierdzeniu (Brevo własny template), ad-hoc Stripe Dashboard refundy obsługiwane w MVP (`unhandledStripeEvents` tabela + reconciliation UI w A7e).
- **`@convex-dev/migrations@0.3.5` zainstalowany** + `src/convex/convex.config.ts` + `src/convex/migrations.ts` z bazową instancją + runner. Pierwszy komponent Convex w projekcie.
- **Pełny pattern widen-migrate-narrow ćwiczony na żywo** dla pola `bookingPayments.refundedAmount`:
  - Deploy 1 (widen): `refundedAmount: v.optional(v.number())`
  - Migration `backfillRefundedAmount` (idempotent guard `if (payment.refundedAmount === undefined)` + shorthand `return { refundedAmount: 0 }`)
  - Dry run → 22 rekordów, jeden batch, no changes committed
  - Real run → 22 rekordów zmigrowanych
  - Deploy 2 (narrow): `refundedAmount: v.number()` (required)
- **5 nowych tabel w `schema.ts`:** `refundPolicies` (tiers embedded array), `adminAuditLog` (z 6 typami akcji + metadata: v.any()), `refunds` (5 indexów, najważniejszy `by_stripe_refund_id` dla webhook idempotency), `unhandledStripeEvents` (ad-hoc reconciliation), oraz rozszerzenie `bookings.paymentStatus` union o `'refunded'` + `'partially_refunded'`.
- **Nowy plik `src/convex/refunds.ts`** z 2 queries: `calculateRefundPolicySuggestion(bookingId)` (zwraca `{ suggestedPercent, suggestedAmount, daysBeforeDeparture, totalPaid, availableToRefund, ... }`) + `allocateRefundCascade(bookingId, totalAmount)` (cascade allocation desc po `_creationTime`, walidacja `totalAmount <= totalAvailable`, integer guard `Number.isInteger`).
- **4 inserty `bookingPayments` w `mutations.ts` uzupełnione o `refundedAmount: 0`** — konsekwencja narrow schema. „Let compiler guide refactor" w akcji (z lekcji 2026-05-21).
- Pozostały kawałek A7a: seed default policy (`>30d=100%, 14-30d=50%, <14d=0%`) — `wiki` zatwierdzony do regulaminu po akcept Michała.

### Decyzje

- **Wariant Y > event ledger w bookingPayments > osobna tabela `bookingLedger`** — porównane wszystkie trzy. Wybrano Y (pole `refundedAmount` + osobna tabela `refunds`) bo: minimalne zmiany w istniejącym kodzie, snapshot vs reference utrwalone (historia `bookingPayments.amount` nietknięta), `refunds` jako osobny event log. Event ledger w `bookingPayments` odrzucony bo łamie semantykę „schedule of payments" + audyt wszystkich call-site filtrów = wysokie ryzyko regresji.
- **Polityka zwrotów w bazie (`refundPolicies`)** nie w kodzie — wzorzec na przyszłe projekty (Hotel Lenart booking, inne sprzedaże). Tiers jako embedded array (cardinality <10, lifecycle z polityką, atomic update).
- **`@convex-dev/migrations` > small table shortcut** — chociaż 22 wiersze pozwalają na shortcut (`.collect() + forEach`), wybrano komponent bo: pattern transferowalny, infra raz na projekt, każda przyszła migracja idzie tym samym mechanizmem, skaluje się na duże tabele.
- **Cascade od najnowszej charge + auto-validation** `amount <= sum(paid)`. Walidacja dwuwarstwowa (UI + backend handler).
- **Ad-hoc Stripe Dashboard refund w MVP, nie backlog.** Defensive design: webhook nie crashuje na unmatched refund, tworzy row w `unhandledStripeEvents` z natychmiastowym alertem do Michała, UI reconciliation w A7e (decyzja release/keep/orphan).
- **`v.any()` na `metadata` w `adminAuditLog`** — pragmatyczny choice nad discriminated union. Audit log głównie do odczytu przez ludzi, elastyczność > walidacja shape'u. Jeśli okaże się że metadata jest queryowane → refactor.
- **Integer guard w handler, nie w validator.** `v.number()` w Convex akceptuje floaty. Grosze są integer (business rule), `Number.isInteger(totalAmount)` w handler. Validator robi walidację kształtu, nie business rules.
- **Email do Michała pisze i wysyła Tomek z prywatnego adresu** (nie z `noreply@`). Treść drafted by Claude jako proposal, Tomek wysłał z Gmaila → kontekst rozmowy biznesowej utrzymany.

### Wnioski

- **`import type` vs `import` — runtime erasure to nie tylko styl.** `import type` znika z JS bundle przy kompilacji. Konsekwencje: zero bytes w bundle, brak side effects, bezpieczne przy cyclic deps. Reguła: używasz tylko w sygnaturach typów (parametry, return, generic args)? → `import type`. Używasz runtime (instancja, wywołanie, instanceof)? → zwykły. Promocja: [[concepts/import-type-vs-runtime-erasure]].
- **Embed vs separate table w document databases — 5 pytań decyzyjnych.** (1) cardinality (<20 ograniczone → embed), (2) lifecycle (item bez parenta sensowny? → separate), (3) niezależny query (tak → separate), (4) update frequency per item (high → separate, unikaj write contention), (5) atomic invariants (wiele items naraz → embed). `refundPolicies.tiers` przeszło 5/5 → embed. `bookingPayments` względem `bookings` przeszło 4/5 → separate. Pattern fundamentalnie różny od SQL (tam normalizacja 3NF default). Promocja: [[concepts/embed-vs-separate-table-document-databases]].
- **Convex validator vs handler guard — różne odpowiedzialności.** Validator (`v.number()`) sprawdza **kształt** (czy JS number). Handler guard sprawdza **business rules** (czy integer, czy >0, czy ≤ available). `v.int64()` istnieje ale ma typ BigInt — niespójne z resztą systemu używającą `number`. Projekt konwencja: `number` wszędzie + explicit `Number.isInteger` guards. Promocja: [[concepts/convex-validator-shape-vs-handler-business-rules]].
- **Widen-migrate-narrow ćwiczone na żywo z prawdziwą tabelą** — 22 rekordy. Trzy deploye + jeden migration call. Dry run pokazał before/after każdego rekordu (Convex domyślnie loguje 10 przykładów). Real run zakończony w 1 batchu (małe tabele). Komponent `@convex-dev/migrations` jest idempotent — re-run mówi „already completed, no work to do". Pattern jasny: pierwszy raz najtrudniejszy, każdy następny mechaniczny.
- **Convex schema validation @ deploy time = bezpieczna sieć przed rozjazdem schema↔dane.** Próba `v.optional(v.number())` → `v.number()` bez migracji = deploy REJECTED z konkretnym komunikatem „Document X missing required field Y". Inne bazy (Mongo bez schema, raw SQL bez constraints) tego nie mają — bug ujawnia się w runtime. Convex pedantyczny by design.
- **Idempotency w migracjach — guard pattern.** `if (payment.refundedAmount === undefined) return { refundedAmount: 0 }` chroni przed nadpisaniem podczas re-run. Bez guardu: każdy rekord (też już zmigrowany) dostaje patch → utrata danych refundu. Reguła: każda migracja musi być idempotent przez guard lub warunek tak silny że re-run nie szkodzi.
- **Cursor robi insertion w mutations.ts po dodaniu pola — TS dał nazwę 4 spotów do naprawy.** Klasyczne „let compiler guide refactor" (utrwalone z 2026-05-21, dziś empirycznie zastosowane). Bez TS musiałbyś grepować po `insert('bookingPayments'` ręcznie.
- **Procesowe: dynamika 2-warstwowa (koncept + kod) działa.** Dziś najpierw 14 wiadomości czystego designu (Stripe webhook flow, polityka, edge cases), potem dopiero schema. Tomek wprost stwierdził „jest logiczny, ale też najpierw przejdźmy wszystko na sucho" → dry-run wykrył 6 problemów projektowych ZANIM napisaliśmy linijkę kodu. Procesowe wzmocnienie z 2026-05-25.
- **Procesowe: Tomek wyłapał brak integer guard po dodaniu walidacji `<= 0`.** Pytanie sprawdzające trafiło, sam zauważył lukę między schema validator a business rule. Sygnał: rozumienie warstw walidacji utrwalone, nie ma już mgły między „typ" a „walidacja business'owa".
- **Procesowe: 5h sesja, ale dwie fazy energetycznie różne.** Pierwsze ~3h gęste design + dyskusja Michał email — wymagało myślenia. Ostatnie 2h schema additions + helpery — mechaniczne po dzisiejszym fundamencie. Reguła: po długich design discussions zostawić energię na schema/code patterns które „idą same".

### Następne kroki

#### Next (jutro / kolejna sesja, świeża głowa)

- **Chunk 7 A7a — seed default policy** (`>30d=100%, 14-30d=50%, <14d=0%`). ~15 min. Mutation seed + odpalenie raz. Po nim A7a zamknięte 17/17.
- **A7b** — Convex action `adminInitiateRefund` (idempotencyKey Stripe) + webhook handlers (`charge.refunded`, `charge.refund.updated`, `refund.failed`) + processStripeRefund mutation + 5s retry race fix. To jest najtrudniejszy chunk A7 — webhook idempotency + Stripe API.
- **A7c** — UI booking-drawer RefundDialog modal + 2 email templates Brevo + failure banner /admin.
- **A7d** — UI `/admin/automation` polityka tiers + reblock berth + tekst regulaminu.
- **A7e** — Webhook ad-hoc detection + `/admin/refunds` reconciliation UI.

#### Wiki — kolejka 4 nowe artykuły z dziś (+ kontynuacja)

**Nowe z dziś (priorytet):**
- `concepts/import-type-vs-runtime-erasure` — fundament TS, świeża nauka
- `concepts/embed-vs-separate-table-document-databases` — 5-question heuristic, transferowalne na każdy projekt z document DB
- `concepts/convex-validator-shape-vs-handler-business-rules` — niuans Convex
- `concepts/widen-migrate-narrow-live-walkthrough` (opcjonalnie) — case study z prawdziwej migracji, mógłby uzupełnić ogólny pattern

**Strategia:** spróbuję napisać pierwsze 2-3 dziś (najświeższy kontekst). Reszta backlog na osobne sesje.

#### Blocked / Later / Open questions

- **Michał email** wysłany — odpowiedź dyktuje implementację A7d (treść regulaminu, akceptacja progów). Nieblokujące dla A7a-c (schema + flow tech-side), ale A7d wymaga decyzji.
- **`CONVEX_TMPDIR` warning** (cross-filesystem) — backlog. Fix: `export CONVEX_TMPDIR=/Volumes/HomeX-MacMini/.tmp/convex` w `~/.zshrc`.
- **pnpm outdated** — backlog. `npm install -g pnpm@latest` przy najbliższej okazji.
- **Convex 1.36 → 1.41 upgrade** — od 2026-06-19, niepilne.
- **A7e scope** (ad-hoc Stripe Dashboard refundy) — w scope MVP wg decyzji dziś. Pomyśleć czy nie obciąć do „minimal alert + log" jeśli A7b-d okażą się większe niż założono.

---



### Zmiany

- **Profil ucznia i handoff:** poprawka fałszywej atrybucji. Wpis 2026-06-19 (A6) przypisał Tomkowi propozycję „1 artykuł per sesja jako routine"; w rzeczywistości była to moja sugestia oznaczona „do uzgodnienia" w handoff.md. Profil rewrote'ował to jako decyzję Tomka. Fix: usunięcie atrybucji + skreślenie sztywnej reguły. Commit `590f809` (sailing) + `d1fc8b5` (vault).
- **Wiki backlog grupa 1 — 3 nowe artykuły:** `procedures/prod-deployment-from-scratch` (pełna procedura 6 dostawców prod deploy), `concepts/vercel-convex-build-vs-runtime-keys` (separacja deploy keys per rola), `concepts/webhook-url-canonical-no-redirect` (pre-flight curl -I dla webhook URL). Plus 2 z poprzedniej sesji uncommitted (cloudflare-proxy + public-id). Commit `eb8d5c9`.
- **Wiki backlog grupa 2 — 4 nowe artykuły:** `concepts/jwt-auth-convex-clerk` (analogia paszport/lotnisko, wzorzec B, 3 warstwy security), `concepts/convex-deploy-staleness-breaks-contract` (strict validator, kolejność deploy), `concepts/learning-by-concrete-analogy` (pedagogia — zmień warstwę gdy „mgła"), `concepts/git-three-trees-mental-model` (4 drzewa, mapa komend). Commit `d0687c3`. snapshot-vs-reference-in-storage już istniał (70 linii).
- **Razem: 7 nowych artykułów wiki w jednej sesji** (+2 dopisane do commitu z poprzedniej sesji). Indeks vault zaktualizowany. Kolejka backlog 10/10 ✔.

### Decyzje

- **Sztywny routine „1 artykuł per close session" odrzucony.** Procedura wiki ustalona z Tomkiem: artykuły powstają w trakcie nauki gdy koncept dojrzeje (świeża pamięć kontekstu > pisanie z notatki tygodnie później). Bez sztywnego limitu „N per sesja". `close session` realizuje tylko procedurę CLAUDE.md (handoff entry + ocena Wniosków → ewentualna promocja).
- **Batch processing kolejki backlog akceptowalny.** Empirycznie: 7 artykułów w jednej sesji bez utraty jakości (każdy ma own analogię/przykład/antywzorce/diagnostykę). Kontekst handoff + profil wystarcza za źródło dla artykułów do 2-4 tygodni wstecz.
- **Nie wracamy do „re-close" starych sesji.** Handoff entries już są — wystarczają za kontekst. Promocja artykułów może iść z opóźnieniem.
- **Decyzja per artykuł, nie per sesja:** wartość teraz (świeży kontekst?), nie liczba sesji wstecz.

### Wnioski

- **Drift atrybucji w meta-dokumentach — realny pattern do pilnowania.** Moja sugestia z handoff („do uzgodnienia") została przepisana w profilu jako decyzja Tomka. Mechanizm: kompresja kontekstu między dokumentami gubi flagi tymczasowości („sugestia", „TBD", „do uzgodnienia"). **Reguła:** w profilu wiki cytuj wprost kto co powiedział, oznacz świadomie kto jest źródłem propozycji vs decyzji. Kandydat do wiki ponadprojektowo: `concepts/attribution-drift-in-meta-docs` (gdyby pojawił się drugi raz).
- **Batch writing artykułów z handoff/profil jako źródło — działa do 2-4 tyg wstecz.** Wszystkie 7 artykułów dziś bazowały na materiale z handoff entries + profile lessons. Świeże (do tygodnia) — pisanie szybkie, dużo szczegółów. Starsze (3+ tyg jak jwt-auth z 2026-05-23) — wymagało rekonstrukcji z profilu, ale możliwe. Granica gdzie batch się załamuje: prawdopodobnie >2 miesiące (kontekst zbyt zdekompresowany).
- **Mnożnik artykułów: 1 sesja A6 marathon = 4 artykuły wiki + 2 uzupełnienia.** Sesje gęste w nowe koncepty (prod deploy, pierwszy raz coś robione) generują dużo backlog'u. Sesje rutynowe (kolejny scenariusz checklisty) — 0-1 artykuł. Planowanie kolejnych sesji intensywnych: budżet 30-60 min na end-of-session na artykuł świeży, batch zostawić na sesję dedykowaną.
- **Procesowe: zawsze sprawdzaj atrybucję przy refactor profilu.** Profil ucznia jako żywa pamięć między sesjami = critical asset. Jeden zły wpis i kolejne sesje opierają decyzje na fałszywym fundamencie.

### Następne kroki

#### Next

- Powrót do nauki/kodu: backlog pre-prod (B1-B13, A7) lub nowy temat. Tomek decyduje.
- Smoke test prod live payment (Stripe) odłożony — wymaga osobnej sesji z kartą.

#### Blocked / Later / Open questions

- (brak nowych blockerów z tej sesji)

---

## Sesja 2026-06-19 — A6 zakończone: pierwszy prod deploy (Convex + Clerk + Stripe + Brevo + Vercel + Cloudflare)

### Zmiany

- **Stripe live webhook** utworzony — endpoint `https://www.sailing-architect.com/api/stripe/webhook`, 3 events (`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`). API version `2026-04-22.dahlia`. Signing secret `whsec_*` w 1Password.
- **Clerk prod instance** utworzona (clone z dev) — primary application `sailing-architect.com`, JWT template `convex` z prod issuer `https://clerk.sailing-architect.com`, claims `aud`/`role` + extras. Facebook + GitHub disabled, Email + Google enabled.
- **5 CNAME w Cloudflare** dla Clerk (proxy OFF dla wszystkich): `clerk` → `frontend-api.clerk.services`, `accounts` → `accounts.clerk.services`, `clkmail` → `mail.am5g0ag8i3ry.clerk.services`, `clk._domainkey` → `dkim1.am5g0ag8i3ry.clerk.services`, `clk2._domainkey` → `dkim2.am5g0ag8i3ry.clerk.services`. Verify w Clerk wszystkie ✅. SSL pending (Clerk wystawi w tle).
- **Google Cloud OAuth** custom credentials — projekt z OAuth consent screen (audience External, opublikowany do Production), OAuth client „sailing-architects prod" z redirect URI `https://clerk.sailing-architect.com/v1/oauth_callback`. Client ID + Secret w 1Password, wpisane w Clerk Social Connections → Google.
- **Brevo prod** — sender `noreply@sailing-architect.com` utworzony (domena już zweryfikowana wcześniej). Nowy API key `sailing-architects prod` w 1Password.
- **Convex prod env vars** (5) ustawione na `qualified-crab-196`: `CLERK_JWT_ISSUER_DOMAIN`, `BREVO_API_KEY`, `BREVO_FROM_EMAIL=noreply@sailing-architect.com`, `PUBLIC_APP_URL=https://www.sailing-architect.com`, `HANDOFF_REPORT_TO=msmolarski@jmsstudio.com`.
- **`npx convex deploy` z CONVEX_DEPLOY_KEY** — pierwszy prawdziwy prod deploy po 2 miesiącach pracy w dev. Schema validation clean (tabele puste = zero ryzyka), indexes preserved, functions pushed. ✔ `Deployed Convex functions to https://qualified-crab-196.eu-west-1.convex.cloud`.
- **Drugi Convex deploy key** wygenerowany — `cli-deploy-sailing-architects`, permission **tylko** `deployment:deploy`, 1 year expiration. Pierwszy klucz z 2026-06-17 miał tylko `runInternal*` (runtime), brak `deployment:deploy` → CLI deploy padał `403 Forbidden`. Klucz w 1Password.
- **Vercel env vars Production** (11) — poprawiony `PUBLIC_CONVEX_URL` na `https://qualified-crab-196.eu-west-1.convex.cloud` (z regionem), dodane: `CONVEX_DEPLOY_KEY` (build-time = CLI deploy key), Clerk `pk_live_*` + `sk_live_*`, Stripe `sk_live_*` + `whsec_*` + `pk_live_*`, Brevo API key + `noreply@sailing-architect.com`, `CONTACT_EMAIL=msmolarski@jmsstudio.com`, `PUBLIC_APP_URL`. `CONVEX_ADMIN_KEY` z 2026-06-17 (runtime) zostaje bez zmian.
- **Vercel redeploy** bez build cache — 32s, clean. Build hook to `npx convex deploy --cmd 'vite build'` (Convex+SvelteKit integration), w buildzie też push do Convex prod. Header `x-clerk-auth-reason` zmienił się z `dev-browser-missing` (przed) na `session-token-and-uat-missing` (po) — prod Clerk active.
- **Smoke test partial:** strona główna OK, sign-up email+password (kod verification z prod Clerk), panel żeglarza renderuje (Convex prod query OK). Google sign-in test pominięty na osobną sesję. Stripe live payment test pominięty (seed wstawia segmenty 1800-3200 PLN, 30% zaliczki = 540 zł — risk vs reward refund nie warty).
- Brak commitów w repo — A6 to wyłącznie konfiguracja środowisk i kluczy.

### Decyzje

- **A6 zatrzymane przed Stripe live payment test** — pierwszy realny booking będzie real testem. Webhook URL skonfigurowany, klucze live na Vercel, infrastruktura gotowa. Alternatywa „seed mini cenami + test 5 zł + clear + reseed real" rozważana — odrzucona jako overhead.
- **Trzy klucze Convex prod (separacja per role)** — finalnie:
  - Runtime key (3 perms `runInternal*`) na Vercel jako `CONVEX_ADMIN_KEY` — używany przez `ConvexHttpClient.setAdminAuth` w SvelteKit server.
  - CLI deploy key (`deployment:deploy` only) na Vercel jako `CONVEX_DEPLOY_KEY` — używany w build hook + lokalnie do manualnych deployów.
  - Oba w 1Password, oba least-privilege. Mix-up = build albo runtime fail z 401/403.
- **Cloudflare proxy OFF** dla wszystkich 5 Clerk CNAMEs i istniejących rekordów Vercel — proxy ON łamie SSL verification (Cloudflare terminuje TLS swoim certem, zewnętrzny serwis widzi cudzy cert). Apex `sailing-architect.com` resolves prosto na Vercel anycast IPs (zweryfikowane `dig +short`).
- **Domena kanoniczna = `www.sailing-architect.com`** — apex 308 redirect → www. Wszystkie env vars (`PUBLIC_APP_URL`, Clerk redirect URIs, Stripe webhook URL) używają www. Powód: Stripe POST nie podąża za 308.
- **Google OAuth audience = External + Publish do Production od razu** — nie testing mode. Basic scopes (email+profile) nie wymagają weryfikacji Google. Limit „100 użytkowników" dla unverified sensitive scopes nie obowiązuje (basic = unlimited).
- **Email + Google jako jedyne auth methods w prod** — Facebook/GitHub disable. Mniej setupu OAuth, czystszy UI dla bookingu Hotel Lenart.
- **`BREVO_FROM_EMAIL = noreply@sailing-architect.com`** — Sailing Architects jako From Name. Domena była już zweryfikowana w Brevo, dziś tylko utworzenie Sender record.
- **`CONTACT_EMAIL = msmolarski@jmsstudio.com`** — kontakt do klientów hotelu poprzez Michała.

### Wnioski

- **CONVEX_DEPLOY_KEY (build) ≠ CONVEX_ADMIN_KEY (runtime) — najmocniejsza techniczna lekcja sesji**. Vercel-Convex integration to dwa różne aktorzy klucza: build hook robi `npx convex deploy` (wymaga `deployment:deploy`), runtime SvelteKit robi `setAdminAuth` (wymaga `runInternal*`). Sesja 2026-06-17 wygenerowała JEDEN klucz z runtime perms i nazwała go `CONVEX_ADMIN_KEY` — dziś build padał `401 Unauthorized` aż dodaliśmy drugi klucz z deploy perm. Reguła: dla każdego external service z deploy+runtime split — osobne klucze per role, nie jeden uniwersalny. Pattern uniwersalny też dla GitHub Actions z deploy permission. Promocja: [[concepts/vercel-convex-build-vs-runtime-keys]].
- **Cloudflare proxy OFF dla CNAMEs do zewnętrznych SSL providers — krytyczna pułapka konfiguracyjna**. Każdy serwis który wystawia CNAME do swojej infrastruktury i sam zarządza SSL (Clerk, Resend, SendGrid, Brevo verification, Vercel domain) wymaga proxy OFF w Cloudflare. Proxy ON = Cloudflare terminuje TLS swoim wildcardem → zewnętrzny CA nie może wystawić cert na cudzą domenę → „SSL pending forever". Reguła diagnostyczna: gdy zewnętrzny dashboard mówi „DNS records not pointing correctly" mimo prawidłowych CNAME, sprawdź proxy. Promocja: [[concepts/cloudflare-proxy-off-for-third-party-ssl]].
- **Webhook URL MUSI być canonical (no redirect)** — `curl -I` na webhook URL powinien zwracać 200/4xx, nie 3xx. Stripe POST do apex `sailing-architect.com` → 308 redirect do www → Stripe NIE podąża za POST redirect → cały webhook fail bez wyraźnego logu (event sent OK, response read jako fail). Reguła ogólna dla każdego webhook external service. Promocja: [[concepts/webhook-url-canonical-no-redirect]].
- **Convex CLI flag drift — `--prod` deprecated w 1.40+** — sesja 2026-06-17 zaplanowała `npx convex deploy --prod`, dziś flag nie istnieje. Nowy mechanizm: `CONVEX_DEPLOY_KEY` env var + komenda bez flagi. Reguła: gdy CLI usuwa flag, alternative path jest często env var (CI/CD friendly). Pre-deploy zawsze `--help` na CLI gdy nie używana >2 tygodnie. Powiązane z [[concepts/convex-deploy-staleness-breaks-contract]] — kontrakty rozjeżdżają się też po stronie CLI.
- **OAuth consent screen Publish jako jawny krok** — pierwsza wersja OAuth client była w trybie Testing (komunikat „Dostęp OAuth ograniczony do użytkowników testowych"). Bez Publish app w consent screen → tylko whitelistowani users mogą się logować, max 100. Reguła: każdy Google OAuth client dla prod app wymaga **dwóch** kroków: utworzenie client + opublikowanie consent screen.
- **Brevo: domain verified ≠ sender created** — domena `sailing-architect.com` dodana wcześniej (DNS SPF/DKIM gotowe), ale każdy `BREVO_FROM_EMAIL` wymaga osobno utworzonego Sender record. Pomyłka „skoro domena verified, mogę wpisać dowolny @domain" → błąd API przy pierwszym wysłaniu.
- **Vercel build cache vs env vars** — redeploy z „Use existing Build Cache" ON może nie pobrać nowych env vars do bundle (PUBLIC_* są baked w build). Dla zmian env: redeploy BEZ cache.
- **Procesowe: A6 marathon ~5h, szacunek 2-3h — drugi raz w rzędzie pattern się potwierdza** (sesja 2026-06-17 sama przewidziała mnożnik ×3-5 dla prod env tasków). Hotel Lenart booking deploy = 4 dostawcy SaaS + 2 infra + DNS propagation. Każdy ma swoje quirks ujawniane dopiero w trakcie pracy. Empiryczna potwierdzona zasada planowania.
- **Procesowe: dwa razy z rzędu zgadywałem coś co dashboard mówiłby na pewno** — 2026-06-17 URL bez regionu, dziś `--prod` jako działająca komenda. Reguła wzmocniona: zewnętrzna weryfikacja > zaufanie do pamięci/sesji poprzedniej. Pre-deploy sprawdzaj `--help` i dashboard wartości, nie polegaj na notatkach starszych niż tydzień.
- **Procesowe (Tomka prośba): potrzebna procedura prod-deployment from scratch** — dziś przeszliśmy 6 dostawców w jednej sesji, kolejność krytyczna, decyzje (proxy, key separacja, scope env vars) nie są oczywiste z dokumentacji każdego z osobna. Replicowalne dla następnego projektu. Promocja: [[procedures/prod-deployment-from-scratch]].

### Następne kroki

#### Next (osobna sesja, świeża głowa)

- **A7 — Stripe `charge.refunded` → release koi.** Design decisions przed kodem:
  1. Partial vs full refund: zwalniać koi tylko przy full refund (`amount_refunded === amount`), czy też przy każdym? Rekomendacja: tylko full — partial może być negocjowany rabat.
  2. Email do usera o refundzie: yes/no? Osobny template w `email.ts`?
  3. Nowa internal mutation `releaseBookingAfterRefund` czy rozszerzenie `cancelBooking`? `cancelBooking` ma komentarz „releases berths only when PI was first checkout" — semantyka inna od refundu.
  4. Stripe Polska refund fee — sprawdzić czy 100% fee returns.
- **Po A7: Stripe live payment smoke** — przez Stripe CLI symulacja `charge.refunded` w dev (bez realnej karty), test end-to-end.
- **Google sign-in test prod** — incognito browser → „Sign in with Google" → callback `clerk.sailing-architect.com/v1/oauth_callback` → app.
- **Convex 1.36 → 1.41 upgrade** — minor available. CHANGELOG review. Po deploy dziś backend = 1.41, klient lokalnie nadal 1.36 — rozjazd do zsynchronizowania.

#### Wiki — kolejka 10 artykułów (Tomka prośba o jasną procedurę pisania)

**Nowe z dziś (priorytet):**
- ~~[[procedures/prod-deployment-from-scratch]]~~ ✔ napisane 2026-06-19 (sesja routine)
- ~~[[concepts/vercel-convex-build-vs-runtime-keys]]~~ ✔ napisane 2026-06-19
- ~~[[concepts/cloudflare-proxy-off-for-third-party-ssl]]~~ ✔ napisane 2026-06-19
- ~~[[concepts/webhook-url-canonical-no-redirect]]~~ ✔ napisane 2026-06-19

**Wcześniej kandydaci (z handoff i profile, nadal otwarte):**
- ~~[[concepts/snapshot-vs-reference-in-storage]]~~ ✔ już istniał w wiki (70 linii)
- ~~[[concepts/jwt-auth-convex-clerk]]~~ ✔ napisane 2026-06-19 (batch 2)
- ~~[[concepts/convex-deploy-staleness-breaks-contract]]~~ ✔ napisane 2026-06-19 (batch 2)
- ~~[[concepts/public-id-vs-secret-credential]]~~ ✔ napisane 2026-06-19 (poprzednia sesja)
- ~~[[concepts/learning-by-concrete-analogy]]~~ ✔ napisane 2026-06-19 (batch 2)
- ~~[[concepts/git-three-trees-mental-model]]~~ ✔ napisane 2026-06-19 (batch 2)

**Kolejka wiki zamknięta: 10/10.** ✔

**Kolejka 10 artykułów do napisania.** Procedura: artykuły pisze Claude w trakcie nauki gdy koncept dojrzeje (świeża pamięć kontekstu). Brak sztywnego limitu „N per sesja". `close session` realizuje procedurę z `CLAUDE.md` (handoff entry + ocena Wniosków → ewentualna promocja). Priorytet kolejny w kolejce: `prod-deployment-from-scratch` (świeże, 2026-06-19), potem `cloudflare-proxy-off-for-third-party-ssl`, potem reszta.

#### Blocked / Later / Open questions

- **Stripe live keys** — działają (zweryfikowane dziś, `sk_live_*` i `pk_live_*` w Vercel + 1Password).
- **Deploy key rotation routine** — runtime key (2026-06-17) ma `No expiration`, CLI deploy key (dziś) ma 1 year. Dopisać do operacyjnego checklist: rotacja raz w roku.
- **Stripe Polska refund fee policy** — sprawdzić przy A7 design (czy 100% fee returns).
- **Cloudflare-Vercel proxy** — na razie OFF dla wszystkich rekordów (proxy ON łamie zarówno Clerk SSL jak i Vercel SSL). W przyszłości można rozważyć ON dla static assets (cache + DDoS), ale wymaga osobnej analizy.
- **OAuth user limit awareness** — Google 100 użytkowników dla unverified sensitive scopes — nie aktualne, backlog jeśli kiedyś dodamy Gmail/Drive scopes.
- **Stripe webhook UI changed** — nowy multi-step flow. Stare docs i pamięć z dev przestarzałe. Pre-flight dla Stripe operacji: weryfikacja w aktualnym dashboard.
- **Fundament Promise/async** (od 2026-05-17) — nadal nie sformalizowany do wiki. Dziś dotykany przez `await convex.mutation` × 5 w webhook, bez nowych potknięć.

---

## Sesja 2026-06-17 20:25 — backlog cleanup + start A6 (Convex Cloud prod env)

### Zmiany

- **3 commity bezpośrednio na main (housekeeping):**
  - [`f86289c`](https://github.com/tsosna/sailing-architects/commit/f86289c) — `chore(handoff-email): rozszerz reguły filtrowania jargonu w dziennym raporcie`. +116 linii w `scripts/send-yesterday-handoff-report.mjs` (niezacommitowane wcześniej). Nowe wzorce w `pickHighlights` + `normalizeChangeBullet` + `normalizeNextStepBullet` — przepuszczają biznesowe zmiany (walidacja, hardening, i18n), ucinają dev-jargon (`PR #`, `internalMutation`, `wuchale`, `worktree`, `git`, `branch`, `wiki/concepts/*.md`, `Promise/async`).
  - [`f1ba67a`](https://github.com/tsosna/sailing-architects/commit/f1ba67a) — `chore(i18n): regenerate .po po PR #13 (formatHoldCountdown 2-arg)`. Auto-regen wuchale po merge'u PR #13 — sygnatura `formatHoldCountdown(timestamp, currentTime)` zmieniona przy reactive clock fix, `.po` pliki nie poszły w tamtym PR.
  - [`0f9931c`](https://github.com/tsosna/sailing-architects/commit/0f9931c) — `docs(backlog): skreśl "Hardening Convex side dla admin mutations" jako resolved`. Usunięte 8 linii sekcji z `docs/admin-post-mvp-decisions.md` — wszystkie 9 admin mutations zhardenowane przez A2 (PR #7) + A3 + B14 (PR #12).
- **A6 wystartowane (Convex Cloud prod env setup) — nie skończone, zamrożone:**
  - Wygenerowany prod deploy key w Convex Cloud (`qualified-crab-196`, region `eu-west-1`, Europe Ireland). Nazwa `vercel-production-sailing-architects`, no expiration, **principle of least privilege**: tylko 3 permissions Functions (`runInternalMutations` + `runInternalQueries` + `runInternalActions`). Klucz zapisany w 1Password.
  - Vercel env vars (Production scope) — wpisane 2 z 11:
    - `PUBLIC_CONVEX_URL` = `https://qualified-crab-196.eu-west-1.convex.cloud` (z regionem — patrz Decyzje)
    - `CONVEX_ADMIN_KEY` = wartość deploy key z 1Password
- **Weryfikacja prod Convex `qualified-crab-196`:**
  - **Schema zgodne** z `src/convex/schema.ts` (tabele: `berths`, `bookings`, `bookingParticipants`, `bookingPayments`, `crewConfirmationTokens`, `crewProfiles`, `paymentPlans`, `paymentPlanItems`, `voyageSegments`).
  - **Last deployed 2 months ago** — kod funkcji STARY. Nie ma A2 / A3 / A4b / A5 / B14 / reactive clock / toast migracji / wuchale fix.
  - **Convex 1.36 → 1.41 dostępne** (osobny temat, nie A6).
  - **Prod nigdy nie był używany na żywo** — Tomek potwierdził. Tabele puste / seed only. Zero ryzyka migracji danych przy pierwszym `npx convex deploy --prod`.

### Decyzje

- **Prod = Convex Cloud (nie self-hosted)** — `.env.example` pokazywał `.convex.cloud`, Tomek potwierdził świadomie. Rozwiały lekcję 2026-05-24 (`CONVEX_DEPLOY_KEY` collision) — na Vercel runtime nie odpala się CLI, więc kolizja nazwy z 2026-05-24 nie zachodzi. Self-hosted byłby tylko gdyby compliance / vendor lock-in / skala wymusiły — Hotel Lenart nie ma tych constraints.
- **Naming convention dla `CONVEX_ADMIN_KEY` — opcja A (zostaje, bez rename)** — kod w `src/lib/server/convex-admin.ts:8` importuje `CONVEX_ADMIN_KEY`. Vercel env var ma tę samą nazwę, ale **inną wartość** (dev = local backend admin key, prod = Convex Cloud deploy key). Zero zmian w kodzie. Alternatywa B (rename na `CONVEX_DEPLOY_KEY`) odrzucona — wymagałaby zmian w 2-3 plikach + spójności w `.env.example` + ryzyko że ktoś pomyli z auto-pickup przez CLI w innym kontekście.
- **Deploy key — principle of least privilege** — z 22 permissions Convex Cloud zaznaczono **tylko 3** (`runInternalMutations`, `runInternalQueries`, `runInternalActions`). Świadomie pomięte: `data:view/write` (bypass funkcji — niebezpieczne, atakujący czyści bazę), `actAsUser` (impersonation), `deployment:deploy` (Vercel runtime nie deployuje), `env:view/write`, `backups:*`, monitoring. Gdyby klucz wyciekł — atakujący może wywoływać twoje funkcje (z walidatorami + business logic), nie czyści surowo bazy.
- **No expiration deploy key** — Tomek wybrał wieczny. Ryzyko: jak wycieknie i nie zauważy, atakujący ma dostęp na zawsze. Decyzja świadoma — opcja `1 year` była proponowana jako lepszy default (forsuje rotację), ale Tomek zostawił `No expiration`. Do przemyślenia na kolejną sesję — może po prostu dopisać do backlog „rotacja deploy keys raz w roku".
- **Vercel scope: tylko Production checkbox** — nie Preview, nie Development. Preview/dev używa lokalnych `.env` z dev backend (local anonymous Convex). Branch deploys na Vercel powinny używać dev Convex, nie prod.
- **A6 zatrzymane przed Clerk prod** — Clerk dev jest jedyną instancją, prod nie utworzona. Tworzenie prod Clerk = 30-60 min konfiguracji + weryfikacja domeny (DNS propagation, czasem 24h) + odtworzenie JWT template + sign-in methods + email templates. To **osobna sesja**, nie ogon dzisiejszej.
- **Trzy mini-wykłady fundamentów w jednej sesji** — Convex Cloud vs self-hosted (analogia wynajem mieszkania vs własny dom), `PUBLIC_*` SvelteKit (public = bundle do browsera = każdy widzi), identity vs credential (BREVO_FROM_EMAIL = etykieta, BREVO_API_KEY = władza). Wszystkie poprzedzone pytaniem sprawdzającym — uczeń odpowiadał zanim Claude tłumaczył.

### Wnioski

- **„Last deployed N miesięcy temu" + nowy frontend = breaking contract risk** — najmocniejsza techniczna lekcja meta sesji. Prod Convex `qualified-crab-196` ma kod sprzed 2 miesięcy. Validatory args są wtedy inne (np. `userId: v.string()` na user-facing mutations, później usunięte przez B14). Frontend nowy → woła mutacje bez `userId` → backend stary odrzuca `ArgumentValidationError`. Każdy `npx convex deploy --prod` po dłuższej przerwie wymaga sprawdzenia jak daleko poszedł kod między deployami. Reguła diagnostyczna: zawsze sprawdź `Last deployed` w prod dashboard zanim ruszysz Vercel deploy z nowym kodem. Dla Hotel Lenart booking — *najpierw* deploy Convex prod (synchronizuje warstwę backend), *potem* deploy Vercel (frontend uderza w aktualny backend). Kolejność krytyczna. Promocja: `concepts/convex-deploy-staleness-breaks-contract.md` (do napisania).
- **Handoff szacunek scope często krzywdzi rzeczywistość — A6 ×8** — handoff sesji 2026-06-16 opisał A6 jako „mała pozycja przed prod". W rzeczywistości to **8 kroków, 2-3h skupionej pracy, multi-session minimum**: DNS + Stripe webhook + Clerk prod create + Convex prod env + `convex deploy --prod` + Vercel env reszta + Vercel deploy + smoke test. Reguła planowania na przyszłość: jak zadanie dotyka **prod env / external services / integrations** → mnożnik ×3-5 na czas/scope w stosunku do pierwszego oszacowania. Dla samego dev-side refactoru mnożnik ×1-1.5 wystarczy. Im więcej cudzych systemów w grze (Clerk, Stripe, Vercel, DNS, Brevo), tym większy rozjazd plan↔rzeczywistość.
- **Identity vs credential — wzorzec uniwersalny dla każdego serwisu** — pytanie sprawdzające o `BREVO_API_KEY` ujawniło częsty błąd: uczeń odpowiedział „mam mieć dostęp tylko ja do mojego adresu email". Pomyłka: pomieszał `BREVO_FROM_EMAIL` (etykieta, wycieka w nagłówku każdego maila) z `BREVO_API_KEY` (władza wysyłania w czyimś imieniu). Wzorzec uniwersalny: **każdy serwis (Brevo, Stripe, Clerk, Convex, Twilio, AWS) ma dwie warstwy: public ID (etykieta „to mój projekt") + secret credential (siła sprawcza). Mylenie ich = wyciek.** Stripe celowo daje `pk_*` (public, do payment intent client-side) + `sk_*` (secret). Clerk daje `pk_*` + `sk_*`. Reguła diagnostyczna dla każdego nowego env var: (1) co dokładnie wartość zawiera — adres/ID/klucz/token, (2) co atakujący zrobi mając tę wartość — nic / wyśle requesty w moim imieniu / zaloguje się jako admin. Jeśli (2) = „cokolwiek czego sam nie zrobiłbym dobrowolnie" → private. Promocja: `concepts/public-id-vs-secret-credential.md` (do napisania).
- **PUBLIC_ prefix to świadoma deklaracja „MOŻE wyciec"** — SvelteKit `$env/static/public` bundle do JS browsera, `$env/static/private` zostaje na serwerze node. PUBLIC_CONVEX_URL OK (adres do gadania, sam nie daje uprawnień, dalej jest auth gateway), CONVEX_ADMIN_KEY private CRITICAL (bypass auth-Z, każdy posiadacz = admin prod). Reguła zapamiętana: prefix to nie convenience — to oświadczenie kontraktu bezpieczeństwa.
- **Mój błąd: zgadnięty URL bez regionu zamiast wzięcia z dashboardu** — w pierwszej iteracji A6 dałem `https://qualified-crab-196.convex.cloud` (bez regionu), poprawne to `https://qualified-crab-196.eu-west-1.convex.cloud` (z regionem). Tomek wpisał na Vercel, potem dostał z dashboardu prawdziwą wartość, musi poprawiać. Lekcja procesowa: **zawsze brać wartości env prosto ze źródła (dashboard), nie zgadywać po wzorze nazwy**. Powiedziałem to też uczniowi explicit — „nawet ja zgaduję czasem, weryfikuj z dashboard nie z czata". Cenne dla nauki: pokazanie że nauczyciel popełnia błędy, weryfikacja zewnętrzna ważna.
- **Auth-N vs auth-Z z 2026-05-23 — utrwalone, używane jako narzędzie diagnostyczne 3 tygodnie później** — Tomek nie pomylił auth-N (URL = adres, sam nie daje wstępu, browser przy Convex pyta o JWT) z auth-Z (admin key = bypass całej kontroli ról). Bez przypomnienia — wyciągnął koncept sam. Wzorzec utrwalania: koncept poznany ~3 tygodnie temu zastosowany w nowym kontekście bez ponownego tłumaczenia = utrwalony. Lekcja meta dla mnie: ekspozycja konceptu w 1 sesji + naturalne użycie w 2-3 kolejnych = bezpiecznie utrwalone.
- **Analogie ratują rozumienie — Convex Cloud vs self-hosted = mieszkanie vs dom** — uczeń wprost „nie potrafię odpowiedzieć bo nie rozumiem Self-hosted Convex czy Convex Cloud na prod". Próba tłumaczenia czystej definicji = mgła. Analogia (Cloud = wynajem mieszkania, właściciel dba o rury; self-hosted = kupujesz dom, wszystko twoje) odblokowała. Trzecia ekspozycja patternu po analogii paszport/lotnisko 2026-06-16. Reguła nauki: gdy uczeń mówi „nie rozumiem", wracaj do konkretnego obrazka z aktorami i akcjami zanim wrócisz do koncepcji. Promocja: `concepts/learning-by-concrete-analogy.md` (kandydat zidentyfikowany 2026-06-16, dziś druga ekspozycja — czas pisać).

### Następne kroki

#### Next (sesja jutro, dedykowana 2-3h)

**A6 dokończenie — Convex Cloud prod env + pierwszy prod deploy.** Plan 8 kroków:

1. **DNS + Vercel domain** najpierw (DNS propaguje w tle, mija się z resztą pracy). Ustal docelową domenę prod (`sailing-architects.wysokijohn.pl` z `.env.example` czy inna), wskaż w Vercel project settings, DNS records do Vercel u registrar'a.
2. **Stripe live mode setup** — utworzyć prod webhook endpoint na docelowym URL (`https://docelowa-domena/api/stripe/webhook`), zapisać signing secret.
3. **Clerk prod instance** — kliknij `Create production instance`, skonfiguruj:
   - JWT template `convex` (`aud: "convex"`, custom claim `role: {{user.public_metadata.role}}`) — tak jak dev sesja 2026-05-23
   - Sign-in methods (email + password? Google?)
   - Verify production domain (CNAME records do Clerk, czeka na DNS)
   - Email templates jeśli były dostosowane w dev
4. **Convex prod env vars** (dashboard prod albo `npx convex env set --prod`):
   - `CLERK_JWT_ISSUER_DOMAIN` = prod Clerk Frontend API URL (bez `https://`)
   - `BREVO_API_KEY` = prod Brevo key
   - `BREVO_FROM_EMAIL` = verified sender
   - `HANDOFF_REPORT_TO` lub `ADMIN_ALERT_EMAIL` = admin email
5. **`npx convex deploy --prod`** — pierwszy real deploy 2 miesięcy zmian. Sprawdzić output deploya pod kątem schema migrations / function diff.
6. **Vercel env reszta** (Production scope) — 9 zmiennych:
   - **Poprawka:** `PUBLIC_CONVEX_URL` zmienić wartość na `https://qualified-crab-196.eu-west-1.convex.cloud` (z regionem) — wpisany bez regionu, trzeba edytować
   - `PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (prod Clerk)
   - `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `PUBLIC_STRIPE_PUBLISHABLE_KEY` (prod Stripe live)
   - `BREVO_API_KEY` + `BREVO_FROM_EMAIL` + `CONTACT_EMAIL`
   - `PUBLIC_APP_URL` (docelowa domena)
7. **Vercel deploy** — push branch który wymusi rebuild z nowymi env vars (albo redeploy z UI).
8. **Smoke test prod** — login, browse, book happy path, payment małą kwotą, webhook hit, mail confirmation.

#### Blocked / Later / Open questions

- **Pre-condition dla A6 sesji jutro:** zarezerwować realny 2-3h block. Mniej ryzykownie iść na sesję 2x100min z przerwą niż wbić 3h ciągłe na zmęczonych oczach przy konfiguracji prod (gdzie pomyłka = realna stratą).
- **Convex 1.36 → 1.41 upgrade** — prod backend ma starszą wersję Convex SDK. Sprawdzić release notes 1.37/1.38/1.39/1.40/1.41 przed prod deploy — breaking changes mogą zmusić do osobnego rollout'u.
- **Deploy key rotation** — Tomek wybrał `No expiration`. Dopisać do backlog `docs/admin-post-mvp-decisions.md`: „rotacja Convex prod deploy keys raz w roku, dopisać do operacyjnego checklist".
- **Clerk MAU pricing** — sprawdzić plan Clerk Hobby + jak skaluje się na prod (czy free tier wystarczy na start Hotel Lenart, ile rejestracji oczekiwane w 1 sezonie).
- **Stripe live keys + KYC** — handoff 2026-06-16 mówił że to async-blocker Michała. Dziś Tomek powiedział „mam dostęp do wszystkich" — sprawdzić czy KYC zakończony **realnie** (sk_live_* działają) czy klucze są w panelu ale konto jeszcze nie zweryfikowane.
- **A7** — Stripe `charge.refunded` → release koi (zwrot berth do inventory). Po A6 zamknięte.
- **Wiki article `concepts/convex-deploy-staleness-breaks-contract.md`** — nowy kandydat z dziś.
- **Wiki article `concepts/public-id-vs-secret-credential.md`** — nowy kandydat z dziś.
- **Wiki article `concepts/learning-by-concrete-analogy.md`** — kandydat z 2026-06-16, dziś druga ekspozycja patternu (Cloud vs self-hosted) — czas pisać.

---

## Sesja 2026-06-16 — powrót po 10 dniach urlopu: B14 dokończenie + PR #11 merge + reactive clock fix

### Zmiany

- **PR [#11](https://github.com/tsosna/sailing-architects/pull/11) — A5 regeneracja items w `/admin/automation` (squash-merged dziś):** sprzed urlopu, wisiał open od sesji 2026-05-25. Merge bez zmian, A5 zamknięty.
- **PR [#12](https://github.com/tsosna/sailing-architects/pull/12) — B14 hardening user-facing Convex mutations (open, do code review jutro):**
  - `src/convex/_lib/requireAdmin.ts` — helper rozszerzony o `GenericActionCtx<DataModel>` w `AnyCtx` union (action support dla `sendCrewConfirmationLink`).
  - `src/convex/mutations.ts` — 3 mutations zhardenowane wzorcem B:
    - `upsertCrewProfile` — drop `userId: v.string()` z args, `const identity = await ctx.auth.getUserIdentity()` na początku handlera, `identity.subject` w `withIndex` query + insert + patch.
    - `upsertBookingParticipant` — drop `userId: v.string()` z args, auth check + IDOR check `buyerUserId !== identity.subject` (zamiast `args.userId`), destructure bez `userId`.
    - `adminUpdateParticipantData` — drop `adminUserId: v.string()` z args, `const adminIdentity = await requireConvexAdmin(ctx)` (zamiast `await requireConvexAdmin(ctx)`), `adminEditedBy: adminIdentity.subject`.
  - `src/convex/crewConfirmation.ts` — 2 admin endpointy zhardenowane:
    - `sendCrewConfirmationLink` (action) — drop arg, `requireConvexAdmin` przed `runQuery`, `adminUserId: adminIdentity.subject` w `_persistConfirmationDispatch` call.
    - `adminMarkConfirmedManually` (mutation) — drop arg, `const adminIdentity = ...`, `adminEditedBy: adminIdentity.subject`.
  - Klienci (drop pola z wywołań):
    - `src/lib/components/admin/booking-drawer.svelte` + `src/routes/[[lang=lang]]/admin/+page.svelte` — Cursor fix dziś rano (drop `adminUserId` prop + 3 wywołania).
    - `src/routes/[[lang=lang]]/book/+page.svelte` — drop `userId` z `upsertCrewProfile`.
    - `src/routes/[[lang=lang]]/dashboard/+page.svelte` + `src/routes/[[lang=lang]]/dashboard/crew/[participantId]/+page.svelte` — drop `userId` z `upsertBookingParticipant`.
  - `pnpm check`: 0 errors, 0 warnings.
  - Delta produkcyjna: **+29 / -40 linii** w 8 plikach.
- **Reactive clock fix `/admin/+page.svelte`** (niezacommitowany, czeka na osobny PR):
  - `let now = $state(Date.now())` + `$effect(() => { const id = setInterval(() => { now = Date.now() }, 60_000); return () => clearInterval(id) })` na samej górze `<script>`.
  - `formatHoldCountdown(timestamp, currentTime)` przyjmuje drugi argument zamiast wewnętrznego `Date.now()`.
  - Call-site KPI „Held — X min do wygaśnięcia" przekazuje `now`.
  - Cursor przy okazji usunął martwy kod (`import type { PageData }` + `let { data: pageData }: { data: PageData } = $props()` — nieużywane, `data` brane z `$derived(overview.data ?? null)`).
  - Empiryczna weryfikacja: countdown odlicza („tak czas się cofa" — Tomek na żywo).
- `knowledge-vault/wiki/concepts/svelte5-effect-cleanup-ambient-clock.md` — nowy artykuł (pattern reactive clock, ambient state vs DB-fact, cleanup function w `$effect`).
- `knowledge-vault/wiki/index.md` — wpisany nowy koncept w sekcji Concepts.
- `knowledge-vault/wiki/topics/tomek-coding-learning-profile.md` — update sesji 2026-06-16, mapa kompetencji (Svelte 5 `$effect` cleanup + ambient state jako utrwalony pattern; Convex security 3-warstwowy: utrwalony przez 5x wzorzec B).
- **Worktree cleanup:** `git worktree remove .claude/worktrees/jolly-elion-0f66c7` + `git branch -D claude/jolly-elion-0f66c7` (A5 branch).

### Decyzje

- **PR #12 zostawione open, NIE zmergowane dziś** — security PR (5 mutations + IDOR check), warto przespać i wrócić świeżymi oczami jutro. Sugestia z sesji, Tomek zaakceptował. Brak konfliktu z main (różne pliki niż A5/PR #11).
- **Mini-wykład po analogii zamiast od razu w kod** — pierwsza próba tłumaczenia wzorca B kodem (linia po linii `requireConvexAdmin`) trafiła w „mgłę". Decyzja: cofnąć się do analogii paszport/lotnisko/bramka/VIP, czekać aż Tomek powie „teraz jaśniej", potem wrócić do kodu. Empirycznie zadziałało — po analogii 4 mutations Tomek napisał samodzielnie bez błędu.
- **5-krotne powtórzenie wzorca B w jednej sesji jako forma utrwalenia** — zamiast jednej mutacji „dla przykładu" + przerwa, świadomie przeszliśmy wszystkie 5 podobnych mutations (`upsertCrewProfile`, `upsertBookingParticipant`, `adminUpdateParticipantData`, `adminMarkConfirmedManually`, `sendCrewConfirmationLink`). Z każdą Tomek tracił czas decyzyjny. Ostatnia była natychmiastowa.
- **Reactive clock fix tylko po stronie klienta (KPI), alert title odłożone do backlogu** — handoff z 2026-05-22 II mówił o dwóch zamrożonych miejscach: KPI „X do wygaśnięcia" + alert title „Held kończy się za X min". Klient front side łatwy (`$state` + `setInterval`). Alert title wymaga zmiany Convex query (zwracać raw `holdExpiresAt` zamiast formatowanego stringa). Dziś tylko mniejszy scope.
- **`pageData` martwy kod usunięty przez Cursora przy okazji** — niegroźny scope creep. `pnpm check` zielony. Cursor czyściej niż reakcja „zwroc" — akceptujemy.
- **Cursor accept ≠ persisted to disk (drugi raz w sesji)** — przy rozszerzeniu helper'a o `GenericActionCtx` Cursor nie zapisał plik mimo „gotowe". `git diff` wyłapał. Procedura potwierdzona: po każdym accept Cursora → `git diff` natychmiast. Reguła z 2026-05-24 II.
- **`scripts/send-yesterday-handoff-report.mjs` świadomie poza scope B14** — modified z dawniejszej pracy, niezacommitowane, nie należy do tej linii tematycznej. Do osobnego ogarnięcia.

### Wnioski

- **Analogia konkretna > kod linia po linii dla powrotu po przerwie > tydzień** — najmocniejsza lekcja meta. Powrót po 10 dniach urlopu wymagał mini-wykładu od zera, nie kontynuacji. Tomek wprost: „rozumiem słowa ale całość jest dla mnie całkowitą mgłą" po próbie tłumaczenia kodem helper'a `requireConvexAdmin`. Analogia paszport (Clerk wyrabia JWT) / pasażer (user) / bramka (Convex backend) / salonik VIP (admin mutation) z trzema krokami kontroli (paszport jest? pieczęć OK? status VIP?) mapowanymi 1-do-1 na 3 linie helper'a odblokowała. Pattern: gdy uczeń mówi „mgła" — wracaj do aktorów i akcji zanim wrócisz do kodu. Powiązane z reverse-engineering principle [[concepts/learning-by-concrete-analogy]] (do napisania).
- **Wzorzec B utrwalony przez 5-krotne powtórzenie** — Convex 3-warstwowy security model utrwalony nie przez kolejne sesje ale przez 5 powtórzeń w jednej. Tomek umie z głowy: drop arg `userId`/`adminUserId` → auth check pierwszy w handlerze (`getUserIdentity` dla user, `requireConvexAdmin` dla admin) → użyj `identity.subject` w query/insert/patch/audit log. IDOR check zostaje, ale porównuje z `identity.subject` zamiast args. Reguła nauki: utrwalenie przez wielokrotną ekspozycję w jednej sesji > pojedyncze wprowadzenie + długa przerwa.
- **`$effect` z return cleanup function — fundament Svelte 5 dla long-living subscriptions** — funkcja zwrócona z `$effect` to cleanup, Svelte wywoła automatycznie przy unmount / re-run effect. Pattern uniwersalny dla `setInterval`, `addEventListener`, websocket connection, observer pattern. Bez cleanup: leak resource po nawigacji, podwójne tick'i jeśli komponent montowany kilka razy. Promocja: [[svelte5-effect-cleanup-ambient-clock]].
- **Ambient state vs DB-fact — trzeci raz, pierwszy pełny fix** — czas to ambient state (jak `window.innerWidth`, scroll position). Convex `useQuery` reactive na DB, nie na czas. Funkcja formatująca z `Date.now()` wewnątrz = snapshot przy renderze, nie żyje. Fix: `$state(now)` + `setInterval` + przekazanie `now` jako jawny argument do funkcji formatującej. Pierwsze dwa razy (2026-05-22 II Scenariusz 9 hold countdown, 2026-05-16 post-mutation subscription race) tylko diagnoza koncepcyjna; dziś implementowany fix z weryfikacją empiryczną.
- **3-warstwowy git mental model wymaga jawnego wytłumaczenia po wielu PR-ach** — Tomek pod koniec sesji „gubię się w tym git" przy stanie: lokalny main, origin/main, branch B14. Trzy miejsca historii + sytuacja „PR #11 zmergowany, PR #12 open" wymagały tekstowego diagramu. Po diagramie pytanie „co świadomie zrobić" miało prostą odpowiedź („nic"). Reguła nauki: po każdym merge/push wytłumaczyć eksplicytnie gdzie co żyje, nie tylko wykonać komendy. Lekcja meta dla siebie: nie zakładać że uczeń trzyma diagram w głowie.
- **Pre-MVP sesja kombinowana: security PR + UX bonus** — dwa różne profile zadań w jednej sesji (security/dyscyplinowane przepisywanie + Svelte 5 reactive clock fix) działa tylko gdy lighter task kończy sesję. Po heavy security session UX/Svelte zmienia rejestr, łatwiej ogarnąć. Reguła planowania nauki: drugie zadanie powinno być inny rejestr techniczny niż pierwsze.
- **Cursor scope creep akceptowalny gdy `pnpm check` zielony** — Cursor przy okazji usunął martwy kod (`import PageData` + `let { data: pageData } = $props()` nieużywane). To pewien scope creep poza zadanie reactive clock, ale niegroźny: pnpm check przechodzi, `data` brane z `$derived(overview.data)` poniżej w kodzie. Reguła: drobny dead-code cleanup OK, ale weryfikacja typecheck obowiązkowa (przykład Cursor scope creep który był legitymny).

### Następne kroki

#### Next (nowa sesja)

- **Code review PR #12** świeżymi oczami → merge lub poprawka. Jeśli OK: squash-merge + `git pull` na main. Sugerowane sprawdzenie: test ataku w DevTools (`convex.mutation(api.mutations.upsertCrewProfile, { firstName: "X" })` bez sesji → powinien throw `Unauthorized`).
- **Reactive clock fix → osobny PR** (czeka niezacommitowane). Komendy: branch, add `src/routes/[[lang=lang]]/admin/+page.svelte`, commit z message, push, PR.
- **Backlog Tier A pozostałe pozycje:**
  - **A6** — Hardening server-side mutations w prod context (CONVEX_ADMIN_KEY → CONVEX_SELF_HOSTED_ADMIN_KEY, dodać do Vercel env). Mała pozycja przed prod.
  - **A7** — Stripe `charge.refunded` → release koi (return berths to inventory). Płatność/refundy = krytyczne pre-prod.
  - **Backlog cleanup**: skreślić „Hardening Convex side dla admin mutations" jako resolved przez A2 + A3 + B14 (stale entry w `docs/admin-post-mvp-decisions.md`).
- **Update profilu ucznia** dopisanie wpisu sesji 2026-06-16 → zrobione w tej sesji.

#### Blocked / Later / Open questions

- **Alert title „Held kończy się za X min" zamrożony** — ciągle bug, wymaga zmiany Convex query (`admin.ts:319-331`) — zwracać raw `holdExpiresAt` zamiast formatowanego stringa, klient formatuje z lokalnego `now`. Średni priorytet UX, do backlogu jako rozszerzenie reactive clock fix.
- **Stripe live keys** — async-blocker przez Michała (KYC weryfikacja firmy). Bez tego prod test za 5 zł nie ruszy.
- **`scripts/send-yesterday-handoff-report.mjs`** modified niezacommitowane od poprzedniej sesji (+116 linii). Należy do osobnej linii tematycznej (handoff e-mail reporter). Sprawdzić co dokładnie, zacommitować lub revert.
- **Wiki article `concepts/snapshot-vs-reference-in-storage.md`** (od 2026-05-22 I) — nadal do napisania.
- **Wiki article `concepts/jwt-auth-convex-clerk.md`** (od 2026-05-23) — nadal do napisania.
- **Wiki article `concepts/learning-by-concrete-analogy.md`** — nowy kandydat z dziś (analogia paszport/bramka jako odblokowanie po przerwie). Patterna „concrete actors > abstract code" warto skodyfikować.
- **Wiki article `concepts/git-three-trees-mental-model.md`** — nowy kandydat z dziś (origin/main vs local main vs branch B14 jako trzy miejsca historii).
- **Fundament Promise/async** (od 2026-05-17) — nieoswojony; dziś dotykane przez `await ctx.auth.getUserIdentity()` × 5, drobny progres przez ekspozycję, ale bez nowych potknięć.

---

## Sesja 2026-05-24 (II) — A4b walidacja dueAt + migracja toasta admin/automation + wuchale runtime fix

### Zmiany

- **PR [#9](https://github.com/tsosna/sailing-architects/pull/9) — A4b walidacja dueAt (merged):**
  - `src/convex/mutations.ts` — w handlerze `upsertSegmentPaymentPlan` dodany throw `if (item.kind !== 'full' && !item.dueAt)` w istniejącej pętli walidującej `amountPerBerth`. Validator args zostaje `v.optional(v.number())` (kontrakt API), guard w handlerze daje czytelny komunikat z nazwą pozycji.
  - `src/routes/[[lang=lang]]/admin/automation/+page.svelte` — w `save()` dodany 4. blok walidacji `if (items.some((it) => it.kind !== 'full' && it.dueAt === ''))` przed wywołaniem mutation, analogicznie do istniejących walidacji `sumOver/amountRequired/labelRequired`. Toast + `return`.
  - `docs/admin-post-mvp-decisions.md` — +2 pozycje backlogu odkryte przy A4b: „domyślny szablon wygląda na zapisany plan przy pierwszym wejściu", „/book Step 5 fallback Całość maskuje brak planu w bazie".
  - Delta produkcyjna: **+12 / -0 linii** w 2 plikach + 2 nowe entries backlogu.

- **PR [#10](https://github.com/tsosna/sailing-architects/pull/10) — refactor toaster + wuchale (merged):**
  - `src/lib/admin/payment-plan-labels.ts` — nowy plik (Cursor): wszystkie polskie stringi z logiki (`PAYMENT_PLAN_FALLBACK_NAME`, `PAYMENT_PLAN_ITEM_LABELS`, `PAYMENT_PLAN_TOAST`, `defaultPlanName(segmentName)`). 28 linii.
  - `src/routes/[[lang=lang]]/admin/automation/+page.svelte` — Cursor refactor wuchale: import stringów z `payment-plan-labels`, `planName` startuje jako `''` + `$effect` ustawia, `generateItems(t, price)` przyjmuje cenę jako arg zamiast czytać `$state` w funkcji. Plus własna migracja toasta: 7 wywołań `toastState.addToast({message, status})` zamiast `let toast = $state(...)`, usunięty render `{#if toast}` linia 407 + style `.toast/.toast--ok/.toast--err/.toast--info` linia 693+. Import `toastState` z `$lib/state/toast.svelte`.
  - `src/locales/en.po` + `pl.po` — Cursor regenerated (mniej entries, bo stringi przeszły do .ts poza komponentem Svelte = wuchale ich nie wyciąga).
  - Delta produkcyjna: **+129 / -150 linii** w 4 plikach (netto -21, plik labels +28 zysk; .po pliki -65 lokalnych translation entries każdy).

### Decyzje

- **A4b: walidacja w 2 warstwach (UI + Convex handler), nie zmiana validatora na `v.number()`** — opcja B (throw w handlerze) zamiast A (validator wymuszony). Plus: czytelny komunikat z nazwą pozycji (`Pozycja "X" musi mieć datę płatności`), kontrola treści, spójność z istniejącymi walidacjami `amountPerBerth` w tej samej pętli. Minus: walidacja w 2 miejscach — akceptowalne, każda ma inną rolę (UI = UX feedback przed mutation call; backend = ostatni mur dla innych klientów).
- **`kind === 'full'` pomijane w walidacji `dueAt`** — w obu warstwach. Logicznie: „Całość" = zapłać teraz, data terminu nie ma sensu. Reguła spójna między UI a Convex (zmiana jednej wymaga zmiany drugiej — three-layer API contract symmetry, [[concepts/three-layer-api-contract-symmetry]] z 2026-05-21).
- **Bug C (fallback „Całość" w `/book` Step 5) → backlog, nie A4b scope** — choć ujawniony przy A4b, to klasa inna (UX user-facing, fallback maskuje błąd). Disciplined scope, osobna pozycja w `admin-post-mvp-decisions.md`.
- **Wuchale refactor robi Cursor, toast migration robi Tomek** — podział pracy w drugiej połowie sesji. Cursor lepiej skaluje na mechaniczne ekstrakcje wielu stringów, Tomek dokładnie maps `kind→status` + `text→message` w 7 wywołaniach + usuwa template+style. Pierwszy refactor Cursor cofnął (silently), drugi raz po reset+ponowne uruchomienie zaaplikował poprawnie po weryfikacji `git diff` przed Tomka pracą.
- **Dwa PR-y, nie jeden** — A4b (PR #9) i toast/wuchale refactor (PR #10) jako osobne PR. Powód: czysty scope per PR, łatwo cofnąć jedną zmianę gdyby pękła, A4b mergowane natychmiast bo to security/correctness, refactor mergowane po niezależnym teście.

### Wnioski

- **Cursor auto-import dla krótkich nazw parametrów (`it`, `t`, `e`) — pułapka** — w pierwszej iteracji A4b dodanie `items.some((it) => ...)` triggerowało Cursor auto-import `import { it } from 'node:test'`. Wuchale następnie wybuchnął warning `state_referenced_locally` mylącym wskazaniem linii 30 (niespokrewnionej). Reguła diagnostyczna: po napisaniu kodu z krótką nazwą parametru (1-2 znaki) zrób grep importów — jeśli pojawił się import którego nie pisałeś, usuń. Konwencja na przyszłość: w plikach które edytuje Cursor używać dłuższych nazw (`item`, `task`, `event`) zamiast `it`/`t`/`e`. Promocja: [[concepts/cursor-auto-import-short-name-params]].
- **Wuchale runtime kolizja z Svelte 5 runes — extract stringów do `.ts`** — najmocniejsza lekcja techniczna sesji. Wuchale auto-wrappuje literały stringów w komponencie Svelte przez `_w_runtime_(...)` dla i18n. Gdy literał używany w `let x = $state('Plan domyślny')`, kompilator widzi że runtime translator capturuje wartość statycznie — emituje warning `state_referenced_locally` mówiący „use derived". Realny fix: wyciągnąć stringi do `.ts` poza komponentem (`src/lib/admin/payment-plan-labels.ts`). W module .ts wuchale ich nie tłumaczy (poza-komponentowy scope), więc nie wrappuje. Side effect: `.po` pliki mają mniej entries (te stringi nie są już translation candidates). Wzorzec: gdy widzisz wuchale warning w runach Svelte 5 → wytypuj stringi do osobnego `.ts` modułu. Promocja: [[concepts/wuchale-runtime-vs-svelte5-runes]].
- **Cursor potrafi cichaczem cofnąć zmiany po „accept"** — Cursor zaproponował refactor wuchale (nowy `.ts` + modyfikacja `+page.svelte`). Tomek „zaakceptował", ale: (1) nowy plik powstał, (2) zmiany w `+page.svelte` zostały cofnięte (zerowy diff vs origin). Hipoteza: stash+pull+pop sequence w trakcie sync z PR #9 nadpisał zmiany Cursora (silent merge bo części identyczne). Reguła: po każdej akceptacji zmian od Cursora — `git diff <plik>` żeby zweryfikować realne zastosowanie. „Accept" w UI ≠ „changes persisted to disk". Analogiczna pułapka co „plik istnieje ≠ komponent działa" (2026-05-23). Promocja: [[concepts/verify-after-ai-accept]].
- **Validator `v.optional()` jako contract statement, nie jako convenience default** — `dueAt: v.optional(v.number())` w `paymentPlanItemArgs` (Convex) jest **świadomym oświadczeniem kontraktu** „to pole MOŻE być nieobecne". Gdy w istocie pole jest wymagane (z biznesowego punktu widzenia), validator kłamie. Bug A4b: validator `v.optional` + UI bez walidacji = każdy pusty `dueAt` przechodzi czysto do bazy. Reguła diagnostyczna: gdy validator pola jest `v.optional`, sprawdź **wszystkie call-site'y** czy któryś z nich nie traktuje pola jako wymaganego — jeśli tak, validator jest nieprawdziwy, popraw. Wzmocnienie [[concepts/three-layer-api-contract-symmetry]] o aspekt validatora (warstwa 4).
- **`!item.dueAt` vs `item.dueAt === ''` — precyzja przy znanych typach** — w UI `dueAt: string`, więc `=== ''` precyzyjne i czytelniejsze. W backend `dueAt: number | undefined`, więc `!item.dueAt` (łapie undefined i 0). Reguła: gdy znasz typ konkretnie, użyj porównania konkretnego (`=== ''` dla pustego stringa, `=== undefined` dla braku liczby). `!x` jest wygodny ale rozjeżdża się z intencją gdy typ ma więcej falsy values (np. `0` to legalna kwota).
- **Toast migration ✗ inline error w `/book`** — `/book` ma osobny pattern (`saveError`/`intentError`/`paymentError` jako inline errors przy formularzu/przyciskach, nie floating toast). Świadoma decyzja: w checkoutie inline errors lepsze niż floating toast (buyer mógłby przegapić toast przy wpisywaniu karty Stripe). Toast dobry dla admin gdzie akcje dyskretne („zapisałem", „nie udało się"). Reguła ogólna: floating toast = transient ack/error po akcji; inline error = walidacja formy + kontekstowe błędy przy przyciskach. Mieszanie psuje UX (toast znika za szybko, inline rośnie listę i ginie).
- **4-ta migracja toasta (booking-drawer, crew/confirm/[token], confirmation page, teraz admin/automation)** — wzorzec utrwala się: `import { toastState } from '$lib/state/toast.svelte'`, `addToast({ message, status, duration? })`, zero lokalnych `let toast`. Mapowanie: `kind: 'ok' → status: 'success'`, `'err' → 'error'`, `'info' → 'info'`. Konsystencja kodu rośnie z każdą migracją.

### Następne kroki

#### Next (nowa sesja)

- **Backlog Tier A** — następna pozycja: A5 (`/admin/automation` regeneracja przy zmianie szablonu + select wraca do defaultu), A7 (Stripe `charge.refunded` → release koi), albo B14 (audyt user-facing mutations pod `ctx.auth.getUserIdentity()`). Decyzja przed startem.
- **Update profilu ucznia** — sesja 2026-05-24 (II) — mapa kompetencji + wnioski.
- **Sprzątanie worktree** po dwóch PR-ach merged — `git worktree remove .claude/worktrees/xenodochial-euler-d35b93` + `git branch -d` dla 2 branchy lokalnych (claude/xenodochial-euler-d35b93 + claude/toast-migration-admin-automation).

#### Blocked / Later / Open questions

- **PR #11 nie istnieje — sesja zamknięta 2/2 PR-ów merged.**
- **A4c — domyślny szablon w admin/automation wygląda na zapisany plan** — nowa pozycja backlogu z dziś. Hold/select gotcha z 2026-05-22 oraz dzisiejszy „pre-MVP user mistake" zbiegają się. Kierunek w backlogu — wizualnie odróżnić draft od zapisanego, banner „Niezapisany draft", `beforeunload` warning. Niski priorytet, UX po MVP.
- **Step 5 fallback „Całość" maskuje brak planu** — nowa pozycja backlogu. Powiązane z A4c — gdy plan nie istnieje w bazie, UI buyera kłamie pokazując „Całość", API odrzuca z cryptic toast. Kierunek: usunąć fallback, pokazać komunikat „Plan nie skonfigurowany". UX, średni priorytet.
- **Stripe live keys** — async-blocker przez Michała (KYC), bez tego prod test za 5 zł nie ruszy.
- **18 otwartych pozycji w backlogu Tier A/B** (z 23 sprzed dzisiejszej sesji: +2 nowe z A4b, -2 zamknięte przez A4b i toast migration).
- **Wiki article `concepts/snapshot-vs-reference-in-storage.md`** (od 2026-05-22 I) — nadal do napisania.
- **Wiki article `concepts/jwt-auth-convex-clerk.md`** (od 2026-05-23) — nadal do napisania.
- **Fundament Promise/async** (od 2026-05-17) — nieoswojony, A4b/A4 dotykały async (`await convex.mutation`), bez nowych potknięć.

---

## Sesja 2026-05-24 — A3: Hardening Convex server-only mutations (`internalMutation` + admin auth)

### Zmiany

- `src/convex/mutations.ts` — 7 mutations zmienionych z `mutation(...)` na `internalMutation(...)`: `createBooking` (linia 351), `applyStripePayment` (465), `markPaymentEmailSent` (565), `markConfirmationEmailSent` (590), `markBookingPaymentsProcessing` (613), `cancelBookingPayments` (661), `cancelBooking` (1121). Import `internalMutation` już istniał z A2 (linia 1).
- `src/lib/server/convex-admin.ts` — nowy helper `createConvexAdminClient(): ConvexAdminClient`. Tworzy `ConvexHttpClient` + `setAdminAuth(CONVEX_ADMIN_KEY)`. Rozszerza typ klienta o sygnaturę `mutation<InternalMutation>` żeby call-site'y nie potrzebowały każdorazowo `FunctionReturnType` (Cursor poprawił mój pierwotny szablon).
- `src/routes/api/stripe/webhook/+server.ts` — import `internal` (dodany do istniejącego `api`), klient z `createConvexAdminClient()`, 5 wywołań `api.mutations.X` → `internal.mutations.X` (linie 49, 127, 133, 146, 151). `api.queries.bookingConfirmationByRef` zostaje publiczne.
- `src/routes/api/stripe/pay-installment/+server.ts` — to samo, 1 wywołanie (`markBookingPaymentsProcessing`).
- `src/routes/api/stripe/create-intent/+server.ts` — to samo, 5 wywołań (`createBooking`, `cancelBooking` ×2, `markBookingPaymentsProcessing`). Typ `let bookingResult` zmieniony z `Awaited<ReturnType<typeof convex.mutation<typeof api.mutations.createBooking>>>` na `FunctionReturnType<typeof internal.mutations.createBooking>` (Cursor — generic constraint `convex.mutation<T extends FunctionReference<'mutation', 'public'>>` blokuje internal).
- `.env.local` (main repo) — dodane `CONVEX_ADMIN_KEY=local-tomek_sosinski-sailing_architects|<adminKey>`. Wartość = `adminKey` z `.convex/local/default/config.json`.
- `.env.example` — dodany szablonowy wpis `CONVEX_ADMIN_KEY=` z komentarzem o źródle wartości (lokalny config lub `npx convex deploy-key` dla prod).
- **Delta produkcyjna:** ~+50 / -41 linii w 5 plikach + 1 nowy helper.

### Decyzje

- **Strategia: `internalMutation` keyword zamiast service token w argach** — opcja A z dwóch rozważanych (opcja B = `mutation` + `args.serviceToken: v.string()` + guard). A zwycięża: (1) zgodne z guidelines Convex linia 81-82 („Do NOT use mutation to register sensitive internal functions"), (2) atakujący nie widzi nawet nazwy funkcji w `api.*`, (3) spójne z mechanizmem `_` prefix z A2 (lekcja endpoint-vs-helper).
- **`CONVEX_ADMIN_KEY` zamiast `CONVEX_DEPLOY_KEY`** — początkowo ustawiona jako `CONVEX_DEPLOY_KEY`, Convex CLI wybuchł: `InvalidDeploymentName: Couldn't parse deployment name local-...`. CLI rezerwuje prefix `CONVEX_DEPLOY_KEY` / `CONVEX_DEPLOYMENT` jako sygnał „to dla mnie, cloud auth". Lokalny anonymous backend nie ma cloud konta → CLI próbuje resolve URL i pada. Fix: przenazwać własną zmienną. Convex docs używa `CONVEX_SELF_HOSTED_ADMIN_KEY` dla self-hosted — alternatywa do rozważenia w prod.
- **A3 scope: tylko 7 mutations server-only** — `upsertCrewProfile`, `upsertBookingParticipant` itd. (user-facing) zostają jako `mutation` z guardem `ctx.auth.getUserIdentity()`. Wymagają auth usera, nie admin guard — osobny wzorzec. Backlog: B14 audyt user-facing mutations pod kątem `getUserIdentity()`.
- **Query `bookingConfirmationByRef` zostaje publiczna** — query mają własne walidacje i tylko czytają. Hardening query (np. weryfikacja czy `userId` w args matchuje JWT) to osobna analiza, świadomie poza A3.

### Wnioski

- **Dwa mechanizmy „private" w Convex — pełna mapa po dwóch sesjach** — najsilniejsza lekcja sesji. (1) Prefix `_` w nazwie pliku (lekcja A2: `_lib/`, `_emails.ts`, `_brevo.ts`) — cały plik wykluczony z `api.*` codegen. (2) Keyword `internalMutation`/`internalQuery`/`internalAction` — pojedyncza funkcja w pliku z publicznymi mutations ląduje w `internal.*`. Granularność różna (cały plik vs pojedyncza funkcja), efekt netto identyczny. Można mieszać w jednym pliku: `mutations.ts` ma 9 admin mutations jako `mutation` (z `requireConvexAdmin` guard) + 7 server-only jako `internalMutation`. Promocja: [[concepts/convex-internalmutation-keyword-and-admin-auth]].
- **`setAdminAuth` to brama do `internal.*` z zewnątrz** — `ConvexHttpClient.setAdminAuth(adminKey)` daje klientowi prawo wołać `internal.*`. Bez tego klient widzi tylko `api.*`. SvelteKit server ma admin key w env, woła `internal.mutations.applyStripePayment` jak każdą funkcję. Atakujący bez klucza dostaje `Could not find public function for 'mutations:applyStripePayment'` — Convex nie ujawnia że funkcja istnieje. Trzecia warstwa po SvelteKit guard + JWT admin guard. Najsilniejsza z trzech bo atakujący nie ma zaczepu do brute-force argumentów.
- **`npx convex run` to admin CLI, nie symulacja ataku — gotcha metodyczna** — pierwszy test ataku przez `npx convex run mutations:applyStripePayment '{...}'` dał fałszywie pozytywny wynik: handler wykonał się i padł na biznesowym błędzie linii 480 (`Payment rows not found for PaymentIntent`). Wniosek na chwilę „hardening nie działa". Korekta: CLI czyta admin key z `.convex/local/default/config.json` i wywołuje `internal.*` jak każdy admin. Pukasz do własnych drzwi własnym kluczem — nie testujesz zamka. Prawdziwy test ataku: klient bez admin auth (`ConvexHttpClient` bez `setAdminAuth`), np. mini-skrypt Node. Wtedy 3 z 3 mutations zablokowane czysto. Promocja: [[concepts/convex-cli-admin-key-not-attack-test]].
- **`setAdminAuth` istnieje w runtime, ukryty w `.d.ts`** — Convex SDK oznacza metodę `@internal` i nie eksportuje w publicznych typach. Runtime ma `setAdminAuth(token, actingAsIdentity)` na linii 112/127 `http_client.js`. Cast lokalnym typem `ConvexHttpClient & { setAdminAuth(token: string): void }` jako dokumentujący workaround. Cursor agent wyłapał i podpowiedział — drugi raz z rzędu po A2 (`setAuth(async () => null)` zamiast `clearAuth`). Wzorzec: agent jako pierwszy code review w obszarach API Convex których SDK nie eksportuje czysto.
- **`convex.mutation<T>` ma constraint `"public"` — `FunctionReturnType` jako wyjście** — `typeof convex.mutation<typeof internal.mutations.createBooking>` wybucha: `Type '"internal"' is not assignable to type '"public"'`. Generic klienta wymusza public mutations. Cursor podał czyste rozwiązanie: `FunctionReturnType<typeof internal.mutations.createBooking>` (helper Convex z `convex/server`). Pierwsza propozycja Cursora („wywal Awaited<...>") była gorsza (traci typowanie, `p` implicit `any` w `.filter(p => ...)`) — odrzucone. Końcowa wersja w `convex-admin.ts` poszła dalej: rozszerzony typ `ConvexAdminClient` z metodą `mutation<InternalMutation>`.
- **Compiler-guide-refactor ma granice — usuwając import zrób grep** — usunąłem `import { api } from '$convex/api'` w webhook bo „wszystko poszło na internal", ale plik dalej wołał `api.queries.bookingConfirmationByRef`. Compiler powiedział „symbol nieznany" — ale **nie powiedział** „chciałeś go zachować". Compiler-guide wskazuje co nie kompiluje, nie co miałeś na myśli. Reguła: przed usunięciem importu grep nazwy w pliku (`api.` w tym wypadku). Granica strategii [[concepts/let-compiler-guide-refactor]] (2026-05-21).
- **3-warstwowy model security mutations zamknięty po A2 + A3** — (1) Mutations admin = `mutation` + `requireConvexAdmin` (JWT + role check, A2). (2) Mutations user-facing = `mutation` + `ctx.auth.getUserIdentity()` (JWT usera, B14 do audytu). (3) Mutations server-only = `internalMutation` + admin auth na kliencie (A3). Każda warstwa testuje się **innym narzędziem**: (1) przeglądarka bez/z JWT admin, (2) przeglądarka z różnymi userami, (3) `ConvexHttpClient` bez admin auth (powinien blokować) + SvelteKit server (powinien działać). Mieszanie narzędzi = przegapienie warstwy.

### Następne kroki

#### Next (nowa sesja)

- **A4** — następna pozycja w TaskList (do sprawdzenia treści).
- **Sprzątanie worktree** po PR merge — `git worktree remove .claude/worktrees/elastic-rubin-b4e845` + `git branch -d claude/elastic-rubin-b4e845`.

#### Blocked / Later / Open questions

- **A6 — Hardening server-side mutations w prod context** — dziś użyliśmy lokalnego admin key z `.convex/local/default/config.json`. Dla cloud deployment trzeba `npx convex deploy-key generate`, zmienić nazwę zmiennej na `CONVEX_SELF_HOSTED_ADMIN_KEY` (lub zostać przy `CONVEX_ADMIN_KEY`), dodać do Vercel env. Osobna pozycja przed prod.
- **B14 — Audyt user-facing mutations pod `ctx.auth.getUserIdentity()`** — `upsertCrewProfile`, `upsertBookingParticipant`, ewentualne inne. Sprawdzić czy każda waliduje userIdentity przed write. Świadomie poza A3 scope.
- **Hardening publicznych queries** — np. `bookingConfirmationByRef` przyjmuje `userId: string` jako arg bez weryfikacji że to matchuje sesji. Atakujący z innym userId może odczytać cudzą rezerwację. Osobna analiza per query, B-tier.
- **Stripe live keys** — async-blocker przez Michała (KYC weryfikacja firmy).
- **17 otwartych pozycji w TaskList** — A4-A7 + B1-B13. Wszystkie świadomie wybrane przed prod.
- **Wiki article `concepts/snapshot-vs-reference-in-storage.md`** (od 2026-05-22 I) — nadal do napisania.
- **Wiki article `concepts/jwt-auth-convex-clerk.md`** (od 2026-05-23) — nadal do napisania.
- **Fundament Promise/async** (od 2026-05-17) — nadal nie „oswojony"; A3 dotykało async (`await convex.mutation`, `await convex.query`), bez nowych potknięć — drobny progres przez wzmocnienie ekspozycji.

---

## Sesja 2026-05-23 — A2: Hardening Convex admin mutations (auth-N + auth-Z przez Clerk JWT)

### Zmiany

- `src/convex/auth.config.ts` — nowy plik, provider Clerk: `domain: process.env.CLERK_JWT_ISSUER_DOMAIN`, `applicationID: "convex"`. Bez tego `ctx.auth.getUserIdentity()` zwraca null.
- `src/convex/_lib/requireAdmin.ts` — nowy helper `requireConvexAdmin(ctx)`: `getUserIdentity()` → throw `Unauthorized` gdy null, throw `Forbidden` gdy `identity.role !== 'admin'`. Generic ctx (query/mutation).
- `src/lib/auth/convex-clerk-bridge.svelte` — nowy komponent (zero render), `$effect` wpina token Clerk do `convexClient.setAuth(async () => session.getToken({ template: 'convex' }))`. Brak sesji → `setAuth(async () => null)` (ConvexClient z `convex/browser` nie ma `clearAuth`).
- `src/lib/auth/index.ts` — barrel.
- `src/routes/+layout.svelte` — import `ConvexClerkBridge`, render wewnątrz `<ClerkProvider>`. Bridge musi być dzieckiem providera (context API).
- `src/convex/mutations.ts` — `await requireConvexAdmin(ctx)` jako pierwsza linia handlera w 8 mutacjach: `upsertSegmentPaymentPlan`, `adminUpdateParticipantData`, `backfillBookingParticipants`, `reserveComplimentary`, `cancelAdminBooking`, `seedTestPaymentPlan`, `backfillLegacyBookingPayments`, `migrateCaptainBerths`.
- `src/convex/crewConfirmation.ts` — `await requireConvexAdmin(ctx)` w `adminMarkConfirmedManually`.
- Clerk Dashboard (poza repo): JWT template `convex` z custom claim `role: {{user.public_metadata.role}}`. User Tomek: `publicMetadata.role = "admin"`.
- Convex env: `CLERK_JWT_ISSUER_DOMAIN=https://poetic-cougar-82.clerk.accounts.dev`.
- `docs/admin-post-mvp-decisions.md` — +2 pozycje backlogu:
  1. Dashboard żeglarza pokazuje tylko jedną koję mimo zakupu wielu (3 hipotezy do diagnozy).
  2. Dashboard żeglarza — „Cała trasa rejsu" zawsze podświetla Gibraltar → Madera (korzeń: hardcode w design mock `dashboard.jsx:7`).

### Decyzje

- **Custom claim `role` w JWT template Clerk, nie allowlist** — produkcyjna ścieżka, jedno źródło prawdy (`publicMetadata.role`). Bez zewnętrznych roundtripów z Convex do Clerk REST (mutation runtime nie ma sensownie dostępu).
- **Brak dev-allowlist po email w Convex** — `admin-guard.ts` w SvelteKit ma dev-allowlist dla wygody, ale Convex side wymaga JWT role. Powielanie = drift, kto admin w SvelteKit musi też mieć rolę w Clerk.
- **Throw zamiast `{ ok: false, reason }`** — błąd bezpieczeństwa, nie biznesowy. Throw + rollback transakcji gratis. Frontend łapie i pokazuje toast (osobna sprawa).
- **A2 scope: tylko 9 admin mutations** — server-side mutations wołane przez `ConvexHttpClient` ze Stripe webhook (`applyStripePayment`, `markPaymentEmailSent`, `cancelBooking` itd.) wyłączone. Wymagają osobnej strategii (`internalMutation` + service token albo `CONVEX_DEPLOY_KEY`). Odrębne zadanie A6.
- **`_lib/` jako konwencja Convex** — prefix `_` w nazwie pliku/folderu = nie generuj endpointu, helper wewnętrzny.

### Wnioski

- **Authentication vs Authorization — fundament otwarty** — auth-N („kim jesteś", podpis JWT) vs auth-Z („co możesz", reguła roli). Pierwsze Convex weryfikuje sam podpisem (`auth.config.ts` + JWKS Clerk), drugie my piszemy (`requireConvexAdmin`). User signed-in to nie to samo co user uprawniony. Powiązany koncept: defense-in-depth (lekcja 2026-05-17 Scenariusz 6), tu jako trzecia warstwa po SvelteKit guard + ukrywaniu UI.
- **JWT — struktura `xxx.yyy.zzz` (base64.base64.signature)** — payload czytelny dla każdego, podpis niefalszowalny bez klucza prywatnego wydawcy. Convex weryfikuje publicznym kluczem Clerk z JWKS endpoint (stąd `domain` w config). Audience claim `aud === "convex"` matchuje `applicationID`. Nazwa template w Clerk = applicationID = audience. Trzy nazwy muszą się zgadzać.
- **Endpoint vs helper — fundament Convex** — endpoint = funkcja w `api.*`, publicznie wystawiona (z internetu można wywołać). Helper = funkcja importowana tylko z innych funkcji backendu (nie ma URL). Prefix `_` = helper, bez prefiksu = endpoint. Reguła: walidacja argumentów + guardy są tylko na endpointach (drzwiach z ulicy). Analogia: drzwi frontowe vs lodówka.
- **Throw propaguje się sam, try/catch w handlerze = anty-wzorzec** — throw → Convex rollback transakcji + odsyła error klientowi (Promise rejected po stronie browsera). Try/catch wewnątrz handlera „połyka" błąd i kontynuuje handler → klasyczny bug bezpieczeństwa (nie-admin zapisze do bazy). Reguła: nie łap throw którego nie umiesz sensownie obsłużyć.
- **Context API: konsument musi być pod producentem w drzewie komponentów** — `useClerkContext()` w `<script>` `+layout.svelte` rzucił 500 bo `<ClerkProvider>` w template tego samego pliku ustawia context dopiero przy mount. Komponent rodzic NIE widzi swojego własnego contextu. Fix: dziecko providera. Trzeci raz lekcja contextu (2026-05-12 setContext/getContext, 2026-05-16 useConvexClient po setupConvex). Wzorzec: bridge component = małe dziecko ekspozytora dwóch contextów (Clerk + Convex), zero render, tylko effect.
- **Convex WS jest lazy — otwiera się przy pierwszym `useQuery`/mutation** — na landing bez query Network/WS pusty, na `/dashboard` z `useQuery(api.queries.bookingByUser)` WS się pojawia. Diagnostyka WebSocket w DevTools: hard reload przy otwartych DevTools, filter All, sortuj po Type, szukaj `websocket` / `101 Switching Protocols`. Wiadomości w zakładce Messages: `Connect` → `ModifyQuerySet` → `Transition` → `Authenticate` (gdy bridge aktywny). Brak `Authenticate` = bridge nie odpalił.
- **`ConvexClient` z `convex/browser` ma `setAuth()` ale nie `clearAuth()`** — `clearAuth` jest w React adapterze, nie w base client. Wyczyszczenie auth = `setAuth(async () => null)`. Cursor agent wyłapał ten bug — wzmocnienie wartości narzędzia jako review-bot.
- **Convex `_creationTime` stempel + setAuth race** — gdy bridge effect odpali się PO pierwszym query, sekwencja w WS to: Connect → ModifyQuerySet (queryId=0, identity=0) → Transition (identity=0, dane wracają jako anonim, bo query startuje przed Authenticate) → Authenticate → Transition (identity=1). Convex re-evaluuje queries po nowym identity. W praktyce: query który nie zależy od identity (jak `bookingByUser` z arg `userId`) działa bez auth — bo my przesyłamy userId jawnie. Query który zależy od `ctx.auth.getUserIdentity()` poleci z null aż do drugiego Transition. Dla A2 nieistotne (guard tylko w mutations), ale warto mieć w głowie.
- **Diagnostyka „dlaczego setAuth nie wysłał Authenticate" — sprawdź czy komponent zamontowany** — Cursor utworzył plik bridge ale zapomniał wstawić `<ConvexClerkBridge />` w template. Plik istniał, importu nie było, effect nigdy się nie wykonał. Reguła weryfikacji: po dodaniu komponentu sprawdź czy jest faktycznie renderowany (grep import + render tagu w wrapper). „Plik istnieje" ≠ „komponent działa".

### Następne kroki

#### Next

- **A3** z TaskList — następna pozycja po A2 (do sprawdzenia treści w głównym repo TaskList).
- **Update profilu ucznia** sesją 2026-05-23 — mapa kompetencji (auth-N/Z, JWT, endpoint vs helper, context bridge pattern jako 3 nowe pozycje).
- **Sprzątanie worktree** po PR merge — `git worktree remove .claude/worktrees/goofy-dirac-ac5f90` + `git branch -d claude/goofy-dirac-ac5f90`.

#### Blocked / Later / Open questions

- **A6 — Hardening server-side mutations** (Stripe webhook, API routes) — wymaga `CONVEX_DEPLOY_KEY` lub przekształcenia na `internalMutation` z service token. Osobna pozycja w TaskList.
- **Backlog 23 otwartych pozycji** w `docs/admin-post-mvp-decisions.md` — +2 z dziś (dashboard żeglarza: jedna koja zamiast wielu, hardcoded Gibraltar → Madera).
- **Fundament Promise/async + auth** — Tomek świadomie sygnalizował lukę. Wzmocnienie przez kolejne realne bugi.
- **Wiki article `concepts/snapshot-vs-reference-in-storage.md`** (od 2026-05-22 I) — nadal do napisania.
- **Wiki article `concepts/jwt-auth-convex-clerk.md`** — nowy kandydat z dziś, pełny obraz auth flow Clerk → JWT → Convex z bridge pattern.

## Sesja 2026-05-22 (III) — A1 backlog: reset booking-selection po sukcesie zakupu (PR #5 merged)

### Zmiany

- `src/lib/state/booking-selection.svelte.ts` — dodana metoda `reset()` (4 linie): `selectedSegment = voyageSegments[0].id`, `selectedBerths = []`. Przywraca singleton do stanu jak po świeżym utworzeniu.
- `src/routes/[[lang=lang]]/book/+page.svelte` — import `bookingSelection` + wywołanie `bookingSelection.reset()` w `submitPayment` w gałęzi `else` (po sukcesie Stripe), bezpośrednio przed `step = 6`.
- **PR [#5](https://github.com/tsosna/sailing-architects/pull/5)** — squash-merged do main jako `fa58bf1`. Delta produkcyjna: **+7 linii, zero usuniętych**.
- `knowledge-vault/wiki/concepts/svelte5-runes-declare-not-invoke.md` — nowy artykuł (runy jako compile-time markery w miejscu deklaracji; w metodach przypisuj/czytaj jak zwykłą zmienną).
- `knowledge-vault/wiki/index.md` — wpisany nowy koncept w sekcji Concepts.
- `knowledge-vault/wiki/topics/tomek-coding-learning-profile.md` — update sesji 2026-05-22 (III), mapa kompetencji (Svelte 5 runes podniesiony z 2 na 2-3 + powiązanie z [[svelte5-runes-declare-not-invoke]]).
- TaskList — A1 completed; dodano A4b (walidacja `dueDate` + gate Step 5) i A7 (Stripe webhook `charge.refunded` → release koi). 21 pozycji w liście (1 done, 20 pending).

### Decyzje

- **Tier A + Tier B całość przed prod, Tier C odłożone świadomie** — user wybrał ścieżkę pełnego backlogu Tier A (6 poz.) + Tier B (13 poz.) przed prod testem za 5 zł. Tier C (WhatsApp/Twilio, audit log, granular roles, eksport CSV, cron token cleanup, reguły monitów konfigurowalne, per-booking override, nightly admin email, `allowFullPayment` cleanup) świadomie do post-prod. Backlog w `docs/admin-post-mvp-decisions.md` otwiera się „Nic z tej listy nie jest blokerem MVP" — Tier A/B robimy bo realne ryzyko poprawności/UX, Tier C bo to dni-tygodnie roboty których test pieniędzy nie wymaga.
- **Reset PRZED `step = 6`**, nie po — Step 6 nie czyta `bookingSelection` (czyta `berths` / `segment` / `createdBookingRef` z URL params i lokalnego state), więc kolejność technicznie obojętna. Wybór konwencji „najpierw cleanup, potem zmiana widoku" jako defensive default na wypadek przyszłych zmian Step 6.
- **Brak `try/catch` wokół `reset()`** — dwie linie zwykłego przypisania, nie może rzucić. Defensive try/catch byłby ceremonia kontrproduktywna.
- **Stripe live KYC przez Michała async-blocker** — sesja produkcyjna nie ruszy bez live keys. User pyta Michała, sesje idą równolegle przez backlog. Inne pre-prod TODO: Vercel project + Clerk prod instance (status nieznany — Michał wie).
- **Nowo odkryte luki podczas testu A1 → backlog, nie chasujemy** — `/admin/automation` zapis bez wpisanych dat działa, „Nieprawidłowy wybór płatności" przy pustym `paymentPlanItems` w `/book` Step 5. Symptomy A5 + nowy A4b. Dyscyplina scope: A1 dokończone czysto.
- **Sprzątanie main repo: divergent po PR #5 squash** — main miał lokalny commit z tym samym fixem (z `cp` testu) + drift `scripts/`+`.po`. `git diff main origin/main` puste → trees identyczne → `stash` driftu, `reset --hard origin/main`, `stash pop`. Bezpieczne bo commity różniły się tylko hash'em.

### Wnioski

- **Runy Svelte 5 to compile-time markery w miejscu deklaracji** — najmocniejsza lekcja sesji. `$state(...)` wewnątrz metody to bug; w metodach przypisujesz/czytasz pole jak zwykłą zmienną JS. Kompilator robi getter/setter raz przy deklaracji. Reguła diagnostyczna: jeśli widzisz `$rune(...)` w wnętrzu metody/handlera/callbacku → prawdopodobnie błąd. Powiązanie z 2026-05-12 lekcją `$props()` (`let` mimo read-only — ten sam compiler-magic principle). Promocja: [[concepts/svelte5-runes-declare-not-invoke]].
- **Server/client boundary: backend nie ma dostępu do RAM-u przeglądarki** — pytanie o miejsce resetu trafiło na pułapkę „w webhook Stripe / Convex mutation". Webhook leci z serwerów Stripe na Vercel na Convex; `bookingSelection` żyje w pamięci konkretnej karty Chrome. Convex umie pchnąć dane do przeglądarki (WebSocket subscription), ale singleton lokalny to nie subskrypcja Convex. Wzmocnienie [[concepts/sveltekit-server-client-boundary]] na konkretnym przypadku.
- **Success view ≠ draft state — różne źródła prawdy** — Step 6 to ekran historii faktu („kupiłeś te koje"), singleton to draft intencji („co user chciałby kupić następnym razem"). Mieszanie daje sprzeczność. Wzorzec uniwersalny: dla ekranu sukcesu pytanie „dane czyje?" — historia faktu (URL params snapshot, query Convex), nie draft.
- **Reset w singletonie po zakończonej operacji jako konwencja** — analogiczna do Map+timeout cleanup w `ToastState` (2026-05-12). Wzorzec: wszystko co zaczynasz w singletonie, kończysz w singletonie. Bez tego śmieci między operacjami → ryzyko podwójnej płatności w tym konkretnym przypadku.
- **Dyscyplina scope w trakcie A1** — odkryte 2 luki (A5 symptomy + A4b nowy), zero inline fixów. Backlog rośnie do 21 pozycji, ale każdy task zamykany czysto. Powtórka lekcji 2026-05-22 (I/II).

### Następne kroki

#### Next

- **A2 — Hardening Convex admin mutations** (`ctx.auth.getUserIdentity()` + weryfikacja roli przez Clerk JWT). Większy niż A1 — `convex/auth.config.ts` setup + 9 mutations do migracji. Prawdopodobnie pełna sesja.
- **Michał async** — sprawdzenie statusu: Stripe live KYC, Vercel project, Clerk prod instance.
- **Sprzątanie worktree** po PR #5 → po następnej sesji: `git worktree remove .claude/worktrees/unruffled-cartwright-103e23` + `git branch -d claude/unruffled-cartwright-103e23`.

#### Blocked / Later / Open questions

- **Stripe live keys** — async-blocker przez Michała (KYC weryfikacja firmy). Bez tego prod test za 5 zł nie ruszy.
- **20 otwartych pozycji w TaskList** — A2-A7 + B1-B13. Wszystkie świadomie wybrane do zrobienia przed prod.
- **Wiki article `concepts/snapshot-vs-reference-in-storage.md`** (od 2026-05-22 I) — nadal do napisania.
- **Fundament Promise/async** (od 2026-05-17) — nieoswojony, wzmocnienie przez realne bugi w kolejnych zadaniach (A2 ma `convex.auth` — dużo `await`).

---

## Sesja 2026-05-22 (II) — Scenariusz 8 + 9 zaliczone, admin E2E checklist 9/9, +5 obserwacji backlogu

### Zmiany

- `docs/admin-post-mvp-decisions.md` — +5 pozycji backlogu:
  1. `/admin/special` — stary inline toast do migracji na `toastState.addToast`.
  2. `/admin/special` — „Complimentary" PL.
  3. `/admin/crew` — placeholder bez funkcji (Etap 5/6 zrealizowane gdzie indziej). Kierunek: cross-booking overview uczestników (preferowane) lub usunąć route.
  4. Reactive clock dla odliczania held — alert (`admin.ts:319–322`) i KPI (`admin/+page.svelte:53–56`) liczą `(holdExpiresAt - Date.now())` w query/funkcji bez żywego zegara. Odliczanie zamrożone do najbliższego push'a z DB.
  5. `/admin` — subtitle alertu held „Checkout" po angielsku (`admin/+page.svelte:248`). Piąta lokalizacja jęz. niespójności.

**Brak zmian w kodzie produkcyjnym** — całość sesji = empiryczna weryfikacja Scenariuszy 8/9 + dokumentacja backlogu.

### Decyzje

- **Toast `/admin/special` + „Complimentary" do backlogu, nie inline fix** — scope sesji = Scenariusz 8 (special), nie refactor toastów. Migracja toasta wymaga audytu wszystkich wywołań + style cleanup, osobna pozycja.
- **`/admin/crew` jako overview cross-booking** (kierunek preferowany w backlogu) — Etap 5 (admin edit) i Etap 6 (token confirm) już zrealizowane w booking-drawer + `/crew/confirm/[token]`. Strona crew była stub'em z fazy designu; zamiast usuwać, dać jej realną funkcję — tabela wszystkich uczestników wszystkich bookingów z filtrami statusu. Klik → drawer z deep-linkiem do koi. Fallback: usunąć route + link.
- **Scenariusz 9 zaliczony z asteryskiem** — funkcjonalnie kroki 1-3 przechodzą (koja w held, alert generuje się, KPI licznik OK), ale odliczanie statyczne (Convex query reactive na DB, nie na zegar). UX kłamie, ale to lekcja koncepcyjna nie blocker. Reactive clock = backlog.
- **Close session bez wolnych myśli** (user opt-out).
- **Przeniesienie zmian z worktree do main repo** przez commit z worktree + PR + merge (procedura z 2026-05-21).

### Wnioski

- **Convex query reactive na DB, nie na czas** — najmocniejsza lekcja sesji. `useQuery` push'uje gdy zmienia się tabela. Czas (ambient state, nie DB-fact) wymaga lokalnego zegara klienta. Pattern: `$state(now) + setInterval` + `$derived` countdown z `now` jako żywego źródła. Heurystyka diagnostyczna: gdy UI ma odliczać/odświeżać per minutę, pytaj — kto pcha aktualizację? Jeśli backend → tylko zmiana DB to wyzwoli. Jeśli klient → lokalny zegar. Trzeci przykład [[concepts/storage-vs-derive-time-based-facts]] (po Scenariusz 6 link expired + Scenariusz 7 snapshot). Powiązane: [[concepts/convex-subscription-vs-local-success-state]] (2026-05-16) — ten sam fundament „co właściwie triggeruje re-render", inny przejaw.
- **Stub-routes z fazy designu jako sygnał drift'u** — `/admin/crew` zaplanowany w sidebarze + placeholder strona „Etap 5 i 6 trafią tutaj". Etap 5 zrealizowany w drawerze (bardziej kontekstowo), Etap 6 jako public page (bo wymaga braku auth). Sidebar link został. Heurystyka: po zamknięciu etapu sprawdzić czy stub-routes z planu zostały świadomie napełnione albo świadomie usunięte. Czasem realizacja okazuje się lepsza poza pierwotnym slotem — wtedy slot trzeba zlikwidować lub przebudować, nie zostawiać jako dead navigation.
- **Backlog jako dyscyplina dla scope creep — drugi raz** — Scenariusz 8 + 9 razem dały +5 obserwacji, zero inline fixów. Toast migracja `/admin/special` była kuszącym małym refactorem, ale dotknięcie strony rozszerzyłoby scope. Backlog urósł do 14 otwartych + 1 zamknięta (PR #2). Wzmocnienie lekcji 2026-05-22 popołudniu.
- **Niespójność jęz. polski/angielski — pattern parasolowy** — 5 lokalizacji teraz (Valid, Complimentary, status pill, Checkout, wcześniejsze). Każda osobno drobiazg, razem klasa problemu. Sygnał: code review nie łapie inline literałów; warto rozważyć rule (lint na hardcoded English strings w plikach pod `[[lang=lang]]/`) albo zdyscyplinowane przejście raz na cały admin po MVP.

### Następne kroki

#### Next

- **Update profilu ucznia** sesją 2026-05-22 (II) — mapa kompetencji (Convex: reactive subscription vs ambient state — czas jako nie-DB-fact).
- **Sprzątanie worktree** — `git worktree remove .claude/worktrees/nervous-torvalds-670ebd` + `git branch -d claude/nervous-torvalds-670ebd` po merge.
- Po MVP — wybór z backlogu (14 otwartych): false affordance parasolowa decyzja, `/admin/crew` overview, reactive clock fix, lub toast migracje (`/admin/special` + `/admin/automation`).

#### Blocked / Later / Open questions

- **`allowFullPayment` cleanup** (od 2026-05-21) — flaga martwa, schema + admin UI + mutations args. Osobna sesja refactor.
- **Backlog 14 otwartych pozycji** w `docs/admin-post-mvp-decisions.md`. Cykle UX/refactor po MVP.
- **Fundament Promise/async** (od 2026-05-17) — nieoswojony, wzmocnienie przez realne bugi.
- **Wiki article `concepts/snapshot-vs-reference-in-storage.md`** (od 2026-05-22 I) — do napisania.

---

## Sesja 2026-05-22 — Scenariusz 7 zamknięty (snapshot vs reference) + 4 obserwacje backlogu

### Zmiany

- `docs/admin-e2e-checklist.md` — Scenariusz 7 krok 5 oznaczony jako nieaktualny po PR #2 (Całość nie idzie do bookingPayments).
- `docs/admin-post-mvp-decisions.md` — entry `createPaymentSchedule duplikuje` oznaczone RESOLVED 2026-05-21 (PR #2). Dopisane 4 nowe pozycje backlogu:
  1. `/admin/automation` — badge „Valid" wygląda jak przycisk + niespójność językowa (polski/angielski).
  2. Alert Queue — koja jako primary identifier, nie booking ID.
  3. Alert Queue — sortowanie po severity tworzy wizualne duplikaty bookingu.
  4. Alert Queue — drawer nie zaznacza klikniętej koi.
- `knowledge-vault/wiki/topics/tomek-coding-learning-profile.md` — update sesji 2026-05-22 (do dopisania ręcznie albo następną sesją).

### Decyzje

- **Krok 5 Scenariusza 7 jako nieaktualny, nie usuwać** — krok mówił „Zmień plan na Całość → nowy booking dostaje 1 pozycję Całość". Po PR #2 „Całość" to opcja UI, nie wiersz storage. Oznaczone strikethrough + adnotacja, żeby przyszłe odczyty checklisty widziały kontekst (historia decyzji ważna).
- **Scenariusz 7 zaliczony na 4 krokach** — empirycznie potwierdzony snapshot principle: nowy plan, stary booking nietknięty (2 raty stare), nowy booking z nowym planem (Zaliczka 900 opłacona + rata 900 czeka). Krok 5 niepotrzebny do weryfikacji inwariantu.
- **Backlog zamiast inline fix** — 4 obserwacje (badge Valid, 3× Alert Queue) → backlog, nie ruszać. Scope sesji = Scenariusz 7. Per CLAUDE.md i konwencja sesji.

### Wnioski

- **Snapshot vs reference jako wzorzec ogólny** — `bookingPayments` snapshotuje plan przez `paymentPlanItemId` na konkretny item-rev. `upsertSegmentPaymentPlan` (mutations.ts:289–342) robi soft delete (`isActive: false`) + insert nowego planu, **nie iteruje** istniejących bookingów. Stare wiersze dalej wskazują na stary item (który zostaje w bazie z `isActive: false`). Trzy alternatywy które łamią inwariant: (1) `delete(plan._id)` — FK rozkład, audyt znika; (2) update in place na items — historia kłamie, opłacone raty rozjeżdżają się z planem; (3) iteracja po bookingach z patchem — zmiana reguł gry w trakcie spłaty. Wzorzec uniwersalny: faktury kopiują adres+cenę, order line kopiuje productName+price, audit log kopiuje wartości. Promocja: [[concepts/snapshot-vs-reference-in-storage]] (nowy artykuł, do napisania).
- **Soft delete jako forma snapshot** — `isActive: false` zamiast `delete` ma dwie funkcje: (1) zachowuje integralność FK z `bookingPayments.paymentPlanItemId`, (2) zachowuje audyt „jaki plan był aktywny gdy user kupował". Pattern: gdy rekord ma FK z innych tabel **i** ma znaczenie historyczne, soft delete > hard delete.
- **Krok 4 jako kontrolny test inwariantu** — sam krok 3 (stary booking nietknięty) nie wystarcza, bo mógłby też oznaczać że plan w ogóle nic nie zmienia. Krok 4 (nowy booking z nowym planem) zamyka asymetrię — plan się zmienia dla nowych, nie dla starych. Reguła: do weryfikacji inwariantu „X nie wpływa na Y" potrzeba też dowodu że X realnie działa gdzieś indziej.
- **Backlog jako antidotum na scope creep** — 4 obserwacje w trakcie scenariusza, zero fixów inline. Decyzja świadoma — gdyby fix'ować na bieżąco, sesja zajęłaby 3× więcej i Scenariusz 7 nie zamknąłby się. Backlog ma 9 otwartych pozycji + 1 zamknięta (PR #2) — pokazuje dyscyplinę.

### Następne kroki

#### Next

- **Scenariusz 8 — Miejsca specjalne** — Captain panel (koje status=captain), Complimentary panel (rezerwuj/zwolnij), KPI „Specjalne" vs „Sprzedane".
- **Po S8** → Scenariusz 9 (Hold expiring).
- **Update profilu ucznia** sesją 2026-05-22 — mapa kompetencji (snapshot vs reference jako koncept opanowany).

#### Blocked / Later / Open questions

- **`allowFullPayment` cleanup** — flaga martwa od PR #2. Schema + admin UI + mutations args. Osobna sesja refactor.
- **Backlog 9 otwartych pozycji** w `docs/admin-post-mvp-decisions.md` — false affordance (3 lokalizacje: confirmation page, Sales Board, badge Valid), Alert Queue (header/sort/drawer focus), `/admin/automation` (regeneracja przy szablonie + select default + stary toast). Cykle UX/refactor po MVP.
- **Fundament Promise/async** — nadal nie oswojony, wzmocnienie przez realne bugi.
- **Wiki article `concepts/snapshot-vs-reference-in-storage.md`** — do napisania. Wzorzec uniwersalny (faktury, order lines, audit log) z konkretem `bookingPayments.paymentPlanItemId`.


## Sesja 2026-05-21 — Fix duplikatu „Całość" w `createPaymentSchedule` (PR #2 merged)

### Zmiany

- `src/convex/mutations.ts` — usunięty blok `if (plan.allowFullPayment) { insert('bookingPayments', { label: 'Całość', kind: 'full', sortOrder: 0, ... }) }` w `createBookingPaymentSchedule` (linie 213–230). 19 linii usuniętych.
- `src/routes/api/stripe/create-intent/+server.ts` — usunięty `rows.push({ sortOrder: 0, kind: 'full', amount: totalAmount })` w `projectSchedule` (linie 58–60). 4 linie usunięte.
- `src/routes/[[lang=lang]]/book/+page.svelte` — usunięta opcja `{ id: 'full', label: 'Całość', sortOrders: [0] }` w `paymentOptions $derived.by` (linie 409–417). 10 linii usuniętych.
- `knowledge-vault/wiki/concepts/three-layer-api-contract-symmetry.md` — nowy artykuł (kontrakt UI/API/DB w 3 warstwach, anti-pattern „fix tylko jednej warstwy").
- `knowledge-vault/wiki/concepts/let-compiler-guide-refactor.md` — nowy artykuł (typecheck guide jako strategia + granice: działa dla typów, nie wartości runtime).
- `knowledge-vault/wiki/procedures/test-fix-from-worktree-via-cp.md` — nowa procedura (cp dla testu, commit z worktree, stash+pull+pop dla sync).
- `knowledge-vault/wiki/topics/tomek-coding-learning-profile.md` — update sesji 2026-05-21, mapa kompetencji (nowa pozycja „Refactor strategy — three-layer contract + compiler guide"), postęp.
- `knowledge-vault/wiki/index.md` — wpisane 2 nowe koncepty + 1 procedura + adnotacja w „Recently updated".

**Delta produkcyjna: 33 linie usunięte, zero dodanych.** Pure delete-only fix.

### Decyzje

- **Sesja jako nauka, nie pure refactor** — handoff 2026-05-20 sugerował „fix to refactor backendu, nie nauka, oddzielna sesja". Tomek wybrał wariant „zrób fix razem ze mną jako sesja nauki" — przy okazji wytłumaczyłem trzy warstwy kontraktu, kompilator guide, worktree workflow. Wszystkie 3 koncepty wyniosły się do wiki.
- **Opcja C (cp) dla testu zamiast B (`git checkout`)** — główny katalog miał uncommitted changes (package.json, pnpm-lock, scripts, en.po, pl.po) niezwiązane z fixem. `git checkout` brancha pada na konflikty. `cp` 3 plików = zero ingerencji w git state głównego, łatwe cofnąć.
- **`allowFullPayment` flag zostaje jako martwy kod** — per CLAUDE.md „wspomnij, nie usuwaj". Flag dalej w schema, admin UI, mutations args — po fixie nic nie robi, ale scope czysta. Dopisać do backlogu cleanupu.
- **Squash merge przez gh CLI** — `gh pr merge 2 --squash --delete-branch` z głównego katalogu (z worktree pada na „main is already used"). Lokalny branch worktree'a nieusuwalny dopóki worktree istnieje — zostawione do późniejszego sprzątania.

### Wnioski

- **Three-layer API contract symmetry** — kontrakt „co user wybiera → co serwer waliduje → co DB zapisuje" żyje w 3 plikach. Zmiana wymaga update wszystkich trzech atomowo, inaczej runtime mismatch (walidacja odrzuca / sum 2× / sortOrder krzaczy). UI: typ TypeScript opisujący opcję. API: pomocnicza funkcja projekcji odtwarzająca schedule w pamięci (bo zapis jeszcze nie istnieje gdy liczymy cenę dla Stripe). DB: handler mutation. Heurystyka diagnostyczna: gdy widzisz zmianę w jednej z trzech warstw, pytaj „czy pozostałe dwie znają tę zmianę?". Promocja: [[concepts/three-layer-api-contract-symmetry]].
- **Let-the-compiler-guide-you refactor — z ograniczeniem** — strategia „zmień jedno, niech błędy wskażą resztę" działa świetnie dla refactoringów na poziomie **typów** (rename pola, zmiana sygnatury). **Nie działa** dla zmian na poziomie **wartości runtime** (kontrakt `sortOrder: 0` szedł przez wartość, nie typ — `pnpm check` zwrócił 0 błędów po usunięciu inserta). Wtedy: grep + manualna lista call-site'ów. Lekcja: typecheck sprawdza typy, nie semantykę kontraktów wartościowych. Promocja: [[concepts/let-compiler-guide-refactor]].
- **Pure delete-only fix jako idealny case** — 33 linie usunięte, zero dodanych, zero nowych komentarzy. Sygnał że bug to **akumulacja kodu** (ktoś dodał ścieżkę „Całość" obok itemów planu, nie zauważając że Step 5 i tak deriwuje opcję z planu). Heurystyka: gdy fix wymaga **mniej** kodu niż przed, prawdopodobnie naprawiasz akumulację, nie braki. Często idzie z lekcją „opcje UI ≠ storage" ([[concepts/bookingpayments-schedule-vs-ui-options]] z poprzedniej sesji).
- **Worktree workflow dla Claude'a — opcja C najprostsza dla testu** — Claude pracuje w `.claude/worktrees/<nazwa>/`, node chodzi w głównym katalogu. Cp plików → HMR podłapie → test → commit z worktree → PR → merge → stash+pull+pop dla sync. Promocja: [[procedures/test-fix-from-worktree-via-cp]].

### Następne kroki

#### Next

- **Re-run Scenariusza 7** — snapshot vs reference (`paymentPlanItemId` przy bookingach, zmiana planu admin → bookingi trzymają stary plan). Bug już nie blokuje, można empirycznie zweryfikować inwariant.
- **Po Scenariuszu 7** → Scenariusz 8 (Miejsca specjalne) + Scenariusz 9 (Hold expiring).
- **Sprzątanie worktree** — `git worktree remove .claude/worktrees/clever-haslett-1a171c` + `git branch -d claude/clever-haslett-1a171c` po zakończeniu obecnej sesji.

#### Blocked / Later / Open questions

- **`allowFullPayment` cleanup** — flaga martwa po dzisiejszym fixie. Schema field + admin UI checkbox + mutations args wymagają migracji (downgrade schema, usunięcie z admin UI, usunięcie z args). Czeka na osobną sesję refactoringową.
- **Backlog z 2026-05-20** — 8 obserwacji UX/UI/DB w `docs/admin-post-mvp-decisions.md` (brak SignOut w `/admin`, responsywność Sales Board, false affordance pigułek, booking-selection reset, /admin/automation regeneracja+select+toast). Czekają na cykle UX/refactor.
- **Fundament Promise/async (z 2026-05-17)** — nadal nie „oswojony", wzmocnienie przez realne bugi w kolejnych sesjach.


## Sesja 2026-05-20 — Scenariusz 7 odłożony, znaleziony bug w `createPaymentSchedule`

### Zmiany

- `docs/admin-post-mvp-decisions.md` — dopisanych 5 nowych pozycji backlogu (brak SignOut w `/admin`, responsywność akcji Sales Board, false affordance pigułek/kolumn w admin UI, booking-selection nie czyści state po sukcesie zakupu, `/admin/automation` nie regeneruje pozycji przy zmianie szablonu + select cofa się do defaultu, `/admin/automation` używa starego inline toasta), 1 wycofana błędna hipoteza („krzyżowanie payments między bookingami"), zastąpiona prawdziwym opisem korzenia w `createPaymentSchedule`.
- `knowledge-vault/wiki/concepts/convex-creation-time-as-forensic-tool.md` — nowy artykuł (semantyka `_creationTime` w Convex + use case forensyczny).
- `knowledge-vault/wiki/concepts/bookingpayments-schedule-vs-ui-options.md` — nowy artykuł (anti-pattern „opcja UI w storage" + reguła diagnostyczna).
- `knowledge-vault/wiki/topics/tomek-coding-learning-profile.md` — update sesji 2026-05-20, mapa kompetencji (Convex level + nowa pozycja „Modelowanie danych — fakty w czasie vs alternatywy UI"), powiązania.
- `knowledge-vault/wiki/index.md` — wpisane 2 nowe koncepty w sekcji listy + adnotacja w „Recently updated".
- `claude-memory-compiler/daily/2026-05-20.md` — daily log sesji dla compilera.
- **Brak zmian w kodzie produkcyjnym** (close session bez fixu — Plan A wybrany przez Tomka, fix to czysty refactor backendu nie sesja nauki).

### Decyzje

- **Scenariusz 7 odłożony** — start zablokowany przez bug w `createPaymentSchedule`. Bez fixu nie da się empirycznie zweryfikować inwariantu `sum(bookingPayments) === totalAmount`, więc lekcja koncepcyjna „snapshot vs reference" tonie w szumie. Fix to refactor backendu (nie nauka) — oddzielna sesja.
- **Plan A close session** — bez czytania zmiany przez Tomka, bez fixu w tej sesji, z promocją do wiki + commit + push.
- **Backlog jako jedyne miejsce prawdy** — wszystkie 8 obserwacji UX/UI/DB w `docs/admin-post-mvp-decisions.md`, format Stan/Trigger/Kierunek (z opcjonalnym Korzeniem gdy znaleziony). Nie rozsiewanie między plikami.

### Wnioski

- **`_creationTime` w Convex jako narzędzie forensyczne** — stempel ustawiany **raz na początku transakcji mutacji**, nie per `ctx.db.insert()`. Wszystkie inserty w jednym handlerze dostają identyczne `_creationTime` z mikrosekundowym tiebreakerem. Klaster < 1 ms = jeden write (bug w insercie), rozjazd minut = osobne writy (bug w narastaniu). Cztery wiersze SA-2026-3508 miały rozrzut < 1 ms → wszystkie z jednej transakcji, hipoteza „admin save dopisał później" padła bez czytania kodu. **Promocja do wiki:** [[concepts/convex-creation-time-as-forensic-tool]].
- **Storage vs derive — trzeci wymiar: opcje UI nie należą do storage** (rozszerzenie 2026-05-17 w wymiarze alternatywy) — `bookingPayments` to harmonogram faktów do zapłacenia w czasie. „Całość teraz" nie jest dodatkowym zobowiązaniem, tylko **alternatywną ścieżką** do tego samego faktu (zapłać wszystko jednorazowo). Step 5 i tak buduje opcje radio przez `$derived.by(...)` z planu + flagi `allowFullPayment` — wpis „Całość" w storage jest redundantny i kłamie sumę 2×. Pytanie diagnostyczne: czy artefakt to przyszły fakt, czy alternatywna ścieżka do faktu już reprezentowanego? **Promocja do wiki:** [[concepts/bookingpayments-schedule-vs-ui-options]].
- **Schemat debugowania query → data → write → render** — gdy widzisz złe dane w UI, eliminuj warstwy. (1) filtr query, (2) dane w bazie surowo, (3) write mutation, (4) render. Każdy krok zamyka jeden front. Dziś wykluczyliśmy 1, 4 i 3a; winowajca = 3b (`createPaymentSchedule`).
- **Pierwsza hipoteza bywa atrakcyjna i fałszywa** — „krzyżowanie payments" pasowało do obserwacji 3508, ale test asymetrii (czy 4842 też ma cudze wiersze) ją zabił. Reguła: hipoteza musi się zgadzać ze **wszystkimi** obserwacjami, nie tylko niektórymi.
- **`paymentOptions` w step 5 to derive z planu — model „prefix z planu" (2a)** — `/book +page.svelte:363–419` akumuluje prefix planu + opcjonalna „Całość" gdy `allowFullPayment`. UX kosztuje: dwa ostatnie radio z identyczną kwotą wyglądają jak duplikat. Lekcja UX dopisana do backlogu.
- **`upsertSegmentPaymentPlan` jako wzorzec snapshot principle** — `src/convex/mutations.ts:289–361` nie iteruje istniejących bookingów. Tworzy nowy plan (`isActive: true`), dezaktywuje stary, wstawia nowe itemy. Stare bookingi trzymają stary `paymentPlanItemId` → snapshot zachowany. Scenariusz 7 technicznie się broni, tylko brudny przez bug w `createPaymentSchedule`.

### Następne kroki

#### Next

- **Fix `createPaymentSchedule`** (`src/convex/mutations.ts:~213–230`) — usunąć blok `if (plan.allowFullPayment) { insert('bookingPayments', { label: 'Całość', ... }) }`. Konsumenci którzy zakładają obecność tego wiersza — audyt i przepięcie na derive z planu. Po fixie weryfikacja `sum(bookingPayments) === totalAmount` na świeżym bookingu.
- **Po fixie** — re-run Scenariusza 7 z czystym segmentem. Po Scenariuszu 7 lekcja: **snapshot vs reference w bazie** (czemu stare bookingi mają stary plan rat zamrożony przez `paymentPlanItemId`).

#### Blocked / Later / Open questions

- Bug w `createPaymentSchedule` — fix to refactor backendu, prawdopodobnie touchuje schemat lub konsumentów. Wymaga osobnej sesji refactoringowej (nie nauki).
- 5 pozycji backlogu z dzisiejszej sesji + 3 sprzed Scenariusza 7 (brak SignOut, responsywność, false affordance) — czekają na cykle UX/refactor.
- Scenariusze 8 (Miejsca specjalne), 9 (Hold expiring) — po Scenariuszu 7.
- Fundament Promise/async (z 2026-05-17) nadal nie „oswojony" — wzmocnienie przez realne bugi w kolejnych sesjach.


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