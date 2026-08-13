# ADR-022 — Pieniądze przychodzące po pełnym zwrocie wymagają decyzji człowieka

**Data:** 2026-08-13
**Status:** przyjęta
**Obszar:** płatności / zwroty / obsługa operacyjna
**Powiązane:** [ADR-020](ADR-020-full-refund-closes-installments.md), [ADR-007](ADR-007-closed-booking-definition-and-ui.md)

## Kontekst

Po pełnym zwrocie rezerwacja jest zamknięta: koje wracają do sprzedaży, monity o zaległe raty nie wychodzą (ADR-020, BUG-8). Istnieje jednak scenariusz, w którym **pieniądze wpływają po zwrocie**:

- rata była w stanie `processing` w momencie zwrotu — ADR-020 (uzupełnienie 08-08) świadomie jej nie anuluje, bo o niej rozstrzyga Stripe;
- webhook `payment_intent.succeeded` dochodzi z opóźnieniem (ponawianie po nieudanej dostawie, opóźnienie po stronie banku lub dostawcy);
- klient kliknął „zapłać" tuż przed rezygnacją.

Do 2026-08-13 system księgował taką wpłatę bezwarunkowo i przeliczał status rezerwacji funkcją nieznającą pojęcia zwrotu, co nadpisywało `paymentStatus: 'refunded'` (BUG-9).

Pieniądze realnie leżą na koncie Stripe. Trzeba rozstrzygnąć, **kto decyduje, co się z nimi dzieje**.

## Decyzja

**Decyduje Michał, nie system.**

1. System **nie księguje** wpłaty przychodzącej do rezerwacji o statusie `refunded`. Stan rezerwacji pozostaje `refunded`.
2. System **nie zwraca** takiej wpłaty automatycznie.
3. Fakt ma zostać przedstawiony Michałowi do rozstrzygnięcia. Możliwe rozstrzygnięcia (zwrot, przywrócenie rezerwacji, zaksięgowanie na poczet innego rejsu) są decyzją operacyjną, nie regułą kodu.
4. Zwrot **częściowy** nie podlega tej regule — zgodnie z ADR-020 to korekta ceny, rezerwacja trwa, kolejne wpłaty księgują się normalnie.

Rozważone i odrzucone warianty:

- **Automatyczny zwrot pieniędzy.** Odrzucone: system nie wie, dlaczego wpłata przyszła. Klient mógł właśnie wracać do rejsu — automat oddałby pieniądze osobie, która chciała zapłacić.
- **Normalne zaksięgowanie.** Odrzucone: to jest dokładnie zachowanie sprzed poprawki (BUG-9). Prowadzi do cichego, błędnego stanu finansowego i monitów do osoby po zwrocie.

## Uzasadnienie

- **Nierówny koszt pomyłki.** Nieksięgowanie zostawia pieniądze widoczne u dostawcy płatności i sprawę do rozstrzygnięcia. Błędne zaksięgowanie produkuje fałszywy stan finansowy i korespondencję do klienta, który już odszedł.
- **System nie ma danych do rozstrzygnięcia.** Rozróżnienie „klient wraca" / „bank się spóźnił" / „podwójne kliknięcie" wymaga kontekstu spoza bazy.
- **Ta sama struktura pytania co przy ADR-020 i `isBookingClosed`:** rozstrzyga ten, kto ma informację. Przy racie `processing` to Stripe. Tutaj to człowiek.

## Konsekwencje

- Guard w `applyStripePayment` wychodzi wcześniej, gdy `booking.paymentStatus === 'refunded'`; webhook odpowiada Stripe'owi `200`, więc dostawca nie ponawia dostawy przez trzy dni i lista nieudanych zdarzeń nadal znaczy „awaria" (commit `d0f841cf`, na produkcji 2026-08-13).
- **Punkt 3 decyzji nie jest zaimplementowany.** Wpłata jest dziś ignorowana po cichu — Michał nie dostaje żadnego sygnału. Przyczyna: żadna istniejąca tabela nie jest właściwym miejscem zapisu (log czynności admina wymaga aktora, którego nie ma; tabela nieobsłużonych zdarzeń Stripe dotyczy zdarzeń **niedopasowanych**, a to zostało obsłużone świadomie). Brakuje encji „rozbieżność finansowa wymagająca decyzji". Zapisane w backlogu jako **FEAT-18**.
- Do czasu FEAT-18 wykrycie jest możliwe **zapytaniem**: rata ma status `cancelled`, a Stripe dla tego samego `stripePaymentIntentId` raportuje `succeeded`. Infrastruktura skanu istnieje (A7e reconciliation).
- Smoke test BUG-9 (kup → zwróć → Resend zdarzenia `payment_intent.succeeded` w dashboardzie Stripe → status ma pozostać `refunded`) **odłożony do czasu FEAT-18** — decyzja Tomka, żeby wykonać jeden przebieg testowy dla całości zamiast dwóch. Skutek: poprawka jest na produkcji niezweryfikowana behawioralnie.
