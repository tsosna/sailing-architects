# ADR-007: Zamknięty booking wymaga refundu i zwolnionych koi

- **Status:** przyjęta
- **Data:** 2026-07-04
- **Obszar:** rezerwacje | refundy | koje

## Kontekst

Sales Board po refundach zaczął mieszać aktywne sprawy z bookingami, w których klient dostał zwrot. Potrzebna była definicja „zamkniętego” bookingu i sposób prezentacji w adminie.

## Decyzja

Booking jest zamknięty tylko wtedy, gdy spełnia oba warunki:

- `paymentStatus === 'refunded'`.
- Wszystkie koje z tego bookingu zostały oddane, czyli nie są już przypisane do tego `stripePaymentIntentId`.

W Sales Board zamknięty booking nie jest ukrywany. Jest wyciszany, sortowany na dół i pozbawiony CTA akcji. Przycisk „Otwórz” zostaje dostępny jako podgląd historii.

## Uzasadnienie

Pełny refund bez zwolnienia koi nie zamyka operacyjnie sprawy, bo klient może nadal płynąć albo wymagać obsługi danych załogi. Nieukrywanie zamkniętych bookingów zachowuje widoczność historii dla Michała, ale ogranicza szum w codziennej pracy.

Toggle „pokaż zamknięte” został odłożony do czasu, gdy Board urośnie.

## Konsekwencje

Reguła zamknięcia jest helperem współdzielonym przez query, żeby nie dryfowała między widokami. Akcje na zamkniętym bookingu są zdejmowane, ale audyt i podgląd pozostają dostępne.

## Źródła

- `docs/handoff.md:86` — sesja 2026-07-04, closed-booking approach B.
- `src/convex/_lib/bookingClosed.ts:3` — helper `isBookingClosed`.
- `src/convex/schema.ts:83` — `bookings.paymentStatus`.
- `src/convex/schema.ts:58` — `berths.bookingPaymentIntentId`.
