# ADR-017: Semantyka `kind` pozycji planu płatności

- **Status:** przyjęta (dokumentacja zastanego zachowania, spisana 2026-07-16)
- **Data:** 2026-07-16
- **Obszar:** płatności

## Kontekst

Każda pozycja planu płatności (`paymentPlanItems.kind`, kopiowana do `bookingPayments.kind`) ma typ `'deposit' | 'installment' | 'balance' | 'full' | 'custom'`. Admin może wybrać dowolny kind w dropdownie `/admin/automation` (pozycja backlogu: „kolumna Typ wystawia raw enum adminowi" — footgun). Pytanie: czy te wartości niosą logikę biznesową, czy są tylko etykietą?

Audyt kodu (2026-07-16) — wszystkie gałęzie na `kind`:

## Decyzja (stan faktyczny)

Wartości `kind` **nie są ozdobnikiem** — ale ich waga jest skrajnie nierówna:

### `full` — najcięższa semantyka: „alternatywa całości", nie rata

- **Wykluczony z sumy `totalAmount`** — wiersz `full` duplikuje sumę rat, liczenie go podwajałoby cenę (`mutations.ts` `recalcBookingPaymentTotals`).
- **Opłacony `full` = booking w całości opłacony** (`paidAmount = totalAmount`), niezależnie od statusów rat.
- **Zwolniony z walidacji `dueAt`** — „zapłać całość teraz" nie ma terminu (A4b, `mutations.ts:314`).
- **Pomijany w remindera​ch/monitach** (`reminders.ts:161,207`) — nie jest zaległością.
- **Niewidoczny w harmonogramach**: PDF potwierdzenia i dashboard żeglarza filtrują `kind !== 'full'`.
- **Specjalne dopasowanie w Stripe**: `create-intent` akceptuje wybór `full` tylko jako jedyną pozycję; webhook rozdziela matching intentu full vs raty.

### `deposit` — status „zaliczka opłacona"

- Opłacony `deposit` ustawia `hasDepositPaid` → wpływa na `bookingPaymentStatus` bookingu (rozróżnienie „zaliczka wpłacona" vs „częściowo opłacony") → dalej na Sales Board/alerty.

### `installment` / `balance` — niemal czysta etykieta

- Jedyna logika: detekcja szablonu w UI `/admin/automation` (rozpoznanie „deposit_2" vs „full" przy ładowaniu planu). Poza tym traktowane generycznie jako „rata terminowa" (`kind !== 'full'`).

### `custom` — czysta etykieta

- Zero gałęzi w kodzie. Wyłącznie opis dla człowieka.

## Uzasadnienie

Spisane, bo enum wygląda na dekorację, a `full` i `deposit` niosą reguły finansowe (suma, status opłacenia, monity, Stripe). Admin wybierający zły kind w dropdownie może: podwoić/zaniżyć `totalAmount` (błędny `full`), wyłączyć monity dla raty (`full` zamiast `installment`), zepsuć status zaliczki (`installment` zamiast `deposit`).

## Konsekwencje

- Zmiana `kind` istniejącej pozycji to zmiana reguł finansowych, nie kosmetyka.
- Dropdown raw enum dla admina pozostaje footgunem (pozycja w `admin-post-mvp-decisions.md`) — docelowo UI powinno wybierać kind konsekwencją struktury planu (jedna pozycja bez terminu = `full`, pierwsza terminowa = `deposit`), nie ręcznym wyborem.
- `custom` i rozróżnienie `installment`/`balance` można dziś żonglować bez skutków — ale kod przyszły może zacząć na nich gałęzić; traktować jako semantykę zarezerwowaną.
