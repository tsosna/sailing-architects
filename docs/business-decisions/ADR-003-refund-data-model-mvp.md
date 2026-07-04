# ADR-003: Model danych refundów dla MVP

- **Status:** przyjęta
- **Data:** 2026-06-20
- **Obszar:** refundy

## Kontekst

System płatności ratalnych musiał dostać obsługę zwrotów bez przebudowy całego modelu finansowego. Rozważane były: agregat zwrotu na `bookingPayments`, wpisy refundów jako wiersze w `bookingPayments` oraz osobna tabela ledgerowa.

## Decyzja

Wybrano wariant MVP: `bookingPayments.refundedAmount` jako agregat zwróconej kwoty oraz osobna tabela `refunds` jako log zdarzeń refundowych.

Nie wprowadzono osobnej tabeli `bookingLedger` jako kanonicznego event ledgeru.

## Uzasadnienie

Wybrany wariant minimalizuje zmiany w istniejącym kodzie, zachowuje semantykę `bookingPayments` jako harmonogramu płatności i daje osobny log refundów. Event ledger został odrzucony w MVP, bo wymagałby audytu wielu call-siteów oraz zwiększałby ryzyko regresji.

## Konsekwencje

Refundy aktualizują `bookingPayments.refundedAmount`, a szczegóły operacji zapisują się w `refunds`. Raportowanie pełnej historii częściowych refundów opiera się na tabeli `refunds`, nie na samym agregacie.

Jeśli wymagania audytowe lub finansowe urosną, model może wymagać przejścia w stronę pełnego ledgeru.

## Źródła

- `docs/handoff.md:353` — sesja 2026-06-20, wybór wariantu Y.
- `src/convex/schema.ts:134` — `bookingPayments.refundedAmount`.
- `src/convex/schema.ts:270` — tabela `refunds`.
- `src/convex/mutations.ts:1377` — aktualizacja agregatu `refundedAmount`.
- `knowledge-vault/wiki/concepts/refund-data-schema-mvp.md` — porównanie wariantów.
