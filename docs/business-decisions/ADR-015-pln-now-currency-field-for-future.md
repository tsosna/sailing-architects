# ADR-015: PLN jako jedyna waluta z jawnym polem currency

- **Status:** przyjęta
- **Data:** 2026-05-01
- **Obszar:** płatności

## Kontekst

Projekt sprzedaje rejs Michała w PLN, ale przyszłe potrzeby mogą obejmować EUR. Model płatności musiał uniknąć przebudowy schematu przy dodaniu kolejnej waluty.

## Decyzja

PLN jest jedyną walutą na teraz. Jednocześnie model płatności przechowuje jawne `currency`, żeby późniejsze EUR można było dodać bez przebudowy całego schematu.

## Uzasadnienie

Jedna waluta upraszcza MVP i operacje Stripe. Jawne pole `currency` jest tanim zabezpieczeniem przyszłej zmiany, zwłaszcza że kwoty są przechowywane w najmniejszej jednostce waluty.

## Konsekwencje

Kod może domyślnie używać `pln`, ale nie powinien zakładać, że waluta nie istnieje w danych. Przyszłe dodanie EUR będzie wymagało decyzji produktowej i operacyjnej, ale nie podstawowej migracji kształtu płatności.

## Źródła

- `docs/handoff.md:1615` — sesja 2026-05-01, PLN teraz, `currency` na przyszłe EUR.
- `src/convex/schema.ts:18` — `paymentPlans.currency`.
- `src/convex/schema.ts:121` — `bookingPayments.currency`.
- `src/convex/mutations.ts:9` — `DEFAULT_CURRENCY = 'pln'`.
