# Zlecenie 02 — Tożsamość z sesji w zapytaniach Convexa, unikalny `bookingRef`, dedup webhooka

Data: 2026-09-18. Zleca: Tomek (audyt Fable). Baza: `main` po `e139a660`. Backlog: **SEC-10** (część A, P1), **BUG-16** (B), **INFRA-24** (C), drobne (D).
Źródło: [audyt 2026-09-18](../audits/2026-09-18-audyt-kodu.md). Kontekst przed pracą: `CLAUDE.md`, `AGENTS.md`, `docs/handoff.md`, wpisy SEC-6/SEC-8/SEC-9 w backlogu, vault: [[idor-adminuserid-from-args]], [[pair-consistency-check-is-not-authorization]], [[convex-two-callers-two-trust-levels]].

## A. Tożsamość z `ctx.auth`, nie z argumentu (SEC-10) — P1

Cztery publiczne zapytania biorą `userId` z argumentów: `bookingByUser`, `crewProfileByUser`, `bookingPaymentsByBooking`, `bookingParticipantsByBooking` (`src/convex/queries.ts`). Docelowo:

1. Każde z nich: `const identity = await ctx.auth.getUserIdentity(); if (!identity) return []/null;` i `userId = identity.subject` (tak jak `bookingConfirmationByRef` i `berthStatusesBySlug`). Argument `userId` **znika** z walidatora.
2. Wołający w panelu (`dashboard/+page.svelte:19`, `dashboard/pay/[paymentId]/+page.svelte:22`, `dashboard/crew/[participantId]/+page.svelte:66-67`) przestają przekazywać `userId`. `useQuery` z `convex-svelte` przekazuje token Clerka, jeśli `setupConvex` ma auth — potwierdzić w `+layout.svelte`, że tak jest (zapytania z `getUserIdentity` już działają w kasie, więc tak).
3. `api/stripe/pay-installment/+server.ts:46` woła `api.queries.bookingPaymentsByBooking` przez klienta admina **bez sesji użytkownika** — po zmianie zwróci `[]`. Rozwiązanie jak przy SEC-6: rozdzielić na `internal.queries.bookingPaymentsByBookingInternal({ userId, bookingId })` (dla trasy serwerowej, która ma już `userId` z `locals.auth()`) i publiczne bez argumentu. Nie zostawiać publicznej wersji z argumentem „dla wygody”.
4. Przejrzeć `admin.ts` i `crewConfirmation.ts` pod tym samym kątem (`grep -n "userId: v.string()" src/convex/*.ts`): każdy publiczny `query`/`mutation` z tożsamością w argumencie to ta sama klasa błędu. Tokenowe trasy (`/crew/confirm/[token]`) są inne — token jest sekretem, nie identyfikatorem.

Odbiór: zalogowany widzi swoje rezerwacje jak dotąd (panel, raty, dane załogi); wywołanie `bookingByUser` bez sesji z dashboardu Convexa lub `curl` zwraca `[]`; wywołanie z sesją A i (już nieistniejącym) argumentem B nie ma jak podać B. Smoke na dev: panel → rata → płatność testowa; strona załoganta.

**Wdrożenie:** zmiana dotyka `src/convex/` → `pnpm exec convex deploy` na produkcję **przed** `git push origin main:production` (kolejność z handoffu 28.08: Convex przed frontem, inaczej panel woła zapytanie ze starą sygnaturą). Wpis w backlogu SEC-10 + ocena jak przy LEGAL-12 (czy zdarzenie wymaga oceny z art. 33; odpowiedź „nie da się stwierdzić ani wykluczyć” jest dopuszczalna, ale musi być zapisana).

## B. `bookingRef` bez kolizji (BUG-16)

`create-intent/+server.ts:227` losuje `SA-2026-XXXX` z 9000 wartości bez sprawdzenia. Przenieść generację do `createBooking` (mutacja ma dostęp do indeksu `by_booking_ref`): pętla do 10 prób, `withIndex('by_booking_ref').first()`, brak → użyj; po 10 → `throw`. Format: zostawić `SA-YYYY-` i zwiększyć entropię do 5 znaków `[A-HJ-NP-Z2-9]` (bez `0/O/1/I`) **albo** zostawić 4 cyfry z kontrolą kolizji — decyzja Tomka; rekomendacja: 5 znaków, bo numer trafia na dokumenty i do rozmów telefonicznych, a kontrola kolizji nie usuwa dwuznaczności między latami/segmentami. Metadane PaymentIntentu dostają `bookingRef` **po** `createBooking` (dziś przed) — sprawdzić, czy coś czyta `bookingRef` z metadanych PI (grep) i czy kolejność `paymentIntents.create` → `createBooking` da się odwrócić bez utraty korelacji; jeśli nie, `paymentIntents.update` z `metadata.bookingRef` po utworzeniu rezerwacji.

Odbiór: test jednostkowy generatora w `_lib` (format, alfabet, długość); test kolizji na mocku indeksu; istniejące numery 4-cyfrowe nadal wyszukiwalne.

## C. Dedup i odciążenie webhooka (INFRA-24)

1. Tabela `stripeEvents { stripeEventId, type, receivedAt, outcome }` z indeksem `by_event_id`; `applyStripePayment` (albo nowa mutacja-brama `recordStripeEvent`) zwraca `duplicate`, gdy zdarzenie już było. Handler pomija resztę dla duplikatu.
2. Wysyłka e-maila i PDF poza żądaniem webhooka: mutacja planuje `ctx.scheduler.runAfter(0, internal.emails.sendPaymentConfirmation, {...})` (akcja Convexa w runtime Node, jeśli PDF wymaga `Buffer`/czcionek — dziś PDF powstaje w SvelteKit; jeśli przeniesienie PDF do Convexa jest za drogie, zostaw wysyłkę w SvelteKit, ale **po** `return 200` przez `event.waitUntil`/`platform.context.waitUntil` na Vercelu — udokumentuj wybór). Strażnik `paymentEmailSentAt` ustawiany **atomowo** w tej samej mutacji, która decyduje o wysyłce (rezerwacja prawa do wysłania), nie po fakcie.
3. Nie ruszać logiki `applyStripePayment` poza dedupem — BUG-15 (zlecenie 01) zmienia ją równolegle; jeden właściciel pliku `mutations.ts` na raz.

Odbiór: ten sam `event.id` dwa razy → jeden e-mail, jeden wpis `stripeEvents`; czas odpowiedzi webhooka < 2 s w logach Vercela.

## D. Drobne

- `create-intent`: nie zwracać `convexErr.message` klientowi; mapować `ConvexError` na jego treść, `Error` na „Koja niedostępna” + `console.error`.
- `buyerEmail`: walidacja formatu (prosty regex lub `z.string().email()`), max 254 znaki, `trim().toLowerCase()`; inaczej 400.

## Poza zakresem

BUG-15 (zlecenie 01), refundy, panel admina, plany ratalne, KSeF.

## Weryfikacja

```bash
pnpm check && pnpm lint && pnpm test
```
plus smoke na dev opisane przy A i B; `pnpm exec convex dev` jako typecheck Convexa. Bez produkcyjnych płatności. Przy wdrożeniu: `convex deploy` → `git push origin main:production` → sprawdzenie panelu zalogowanym kontem testowym.

## Na koniec

Commity wg `knowledge-vault/wiki/procedures/commit-message-recipe.md`, osobny commit na A (bezpieczeństwo), B, C, D. Backlog: SEC-10/BUG-16/INFRA-24 skreślone z datą i hashami. Handoff z hashami `main` i `production` oraz wynikiem `convex deploy`.
