# ADR-002: Polityka zwrotów snapshotowana przy zakupie

- **Status:** Zaakceptowana — wdrożona 2026-07-09 (regulamin dostarczony 2026-07-07)
- **Data decyzji:** 2026-07-03
- **Obszar:** refundy

## Kontekst

Kalkulacja refundu czytała aktywną, żywą politykę zwrotów (`refundPolicies` po indeksie `by_is_active`). Booking nie zapisywał polityki obowiązującej w chwili zakupu.

Wiersz `refundPolicies` jest **mutowalny** — `updateRefundPolicy` nadpisuje `tiers` w miejscu (`ctx.db.patch(policy._id, ...)`), nie tworzy nowej rewizji. Skutek: sama referencja `booking.refundPolicyId` nie chroniłaby historii, bo wskazywałaby na zmienione tiers. Klient mógł kupić rejs przy łagodniejszej polityce, a późniejsza zmiana progów przez admina obniżyłaby jego zwrot z mocą wsteczną.

Regulamin Rejsu (`docs/feedback/2026_07_07_SA_regulamin_rejsu.doc`, §3 ust. 8) ustala progi zwrotu liczone od momentu rezygnacji względem daty rejsu:

| Moment rezygnacji przed rejsem | Zwrot |
| --- | --- |
| ≥ 6 miesięcy | 100% |
| 3–6 miesięcy | 90% |
| 6–12 tygodni | 50% |
| < 6 tygodni | 0% |

§3 ust. 10 potwierdza zamrożenie warunków: „Uczestnika obowiązuje koszt Rejsu z dnia w którym dokonał rezerwacji".

## Decyzja

Booking **snapshotuje politykę zwrotów przy utworzeniu rezerwacji** (`createBooking`, moment hold/zawarcia umowy). Snapshot **kopiuje cały `tiers`** (plus `policyId` forensic i `policyName`) do pola `bookings.refundPolicySnapshot`, nie trzyma samej referencji — bo wiersz polityki jest mutowalny.

Refund liczy się według snapshotu z bookingu. Gdy booking nie ma snapshotu (rezerwacje sprzed wdrożenia), kalkulacja **spada na żywą aktywną politykę** (fallback). Pole pozostaje `optional` na stałe — brak migracji wstecznej, bo nie znamy polityki z chwili zakupu starych bookingów, a wpisanie dziś-aktywnej byłoby zgadywaniem podanym jako fakt.

## Uzasadnienie

Konsument podlega regulaminowi z chwili zawarcia umowy. Snapshot chroni warunki umowy tak samo, jak snapshot harmonogramu rat (ADR-008) i `pricePerBerth` chronią kwoty zaakceptowane przy zakupie. Referencja na mutowalny wiersz łamałaby tę zasadę — edycja progów działałaby retroaktywnie na stare bookingi.

Fallback na żywą politykę dla starych bookingów zawęża ryzyko retroaktywności do znanego, malejącego zbioru rezerwacji sprzed wdrożenia, bez fabrykowania danych historycznych.

`refunds.policySnapshot` pozostaje zapisem forensic po fakcie (tworzony przy inicjowaniu refundu). Nie zastępuje snapshotu na bookingu — nie chroni klienta, bo powstaje dopiero przy zwrocie, nie przy zakupie.

## Konsekwencje

Wdrożone 2026-07-09:

- `bookings.refundPolicySnapshot` — nowe pole `optional` (`policyId`, `policyName`, `tiers`). Widen na prod (bez narrow — pole zostaje opcjonalne).
- `createBooking` (`src/convex/mutations.ts`) — odczyt aktywnej polityki i kopia do snapshotu przy insercie bookingu; `undefined` gdy brak aktywnej polityki (booking nie może paść przez brak polityki — hold koi ma priorytet).
- `calculateRefundPolicySuggestion` (`src/convex/refunds.ts`) — czyta snapshot z bookingu, fallback na żywą aktywną politykę dla starych bookingów.

Progi liczbowe polityki (180/90/42/0 dni) żyją w `refundPolicies` i są edytowalne przez admina (ADR-001) — ten ADR dotyczy mechanizmu zamrożenia, nie wartości progów.

## Źródła

- `docs/feedback/2026_07_07_SA_regulamin_rejsu.doc` §3 ust. 8, ust. 10 — warunki zwrotu i zamrożenie kosztu.
- `src/convex/schema.ts` — `bookings.refundPolicySnapshot`.
- `src/convex/mutations.ts` — `createBooking` snapshot; `updateRefundPolicy` (patch in place → wiersz mutowalny).
- `src/convex/refunds.ts` — `calculateRefundPolicySuggestion` snapshot + fallback.
- `docs/business-decisions/ADR-001-refund-tiers.md` — wartości progów.
- `docs/business-decisions/ADR-008-payment-plan-snapshot.md` — bliźniaczy wzorzec snapshotu.
- `knowledge-vault/wiki/concepts/refund-policy-retroactivity.md` — ryzyko retroaktywności.
- `knowledge-vault/wiki/concepts/snapshot-vs-reference-in-storage.md` — ogólny wzorzec snapshot vs reference.
