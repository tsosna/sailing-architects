# ADR-009: Checkout oferuje prefix planu płatności

- **Status:** przyjęta
- **Data:** 2026-05-01
- **Obszar:** płatności | rezerwacje

## Kontekst

Checkout miał obsłużyć zaliczkę, większą wpłatę albo całość. Rozważano swobodną kwotę wpłaty częściowej, ale to zwiększało złożoność walidacji i obsługi harmonogramu.

## Decyzja

Wybrano wariant 2a: użytkownik wybiera radio z prefixem planu płatności, np. zaliczka, zaliczka plus pierwsza rata, albo całość. Custom kwota częściowa pozostaje wariantem przyszłym.

## Uzasadnienie

Prefix planu jest prosty dla użytkownika i spójny z harmonogramem rat. Nie tworzy płatności poza zaplanowanymi pozycjami i ogranicza ryzyko błędów księgowych.

Custom kwota została odłożona jako wariant 2c, bo wymagałaby osobnego systemu partial payments.

## Konsekwencje

PaymentIntent może obejmować jedną lub więcej istniejących pozycji `bookingPayments`. Nie trzeba generować ad-hoc pozycji dla dowolnej kwoty wpisanej przez użytkownika.

## Źródła

- `docs/handoff.md:1772` — sesja 2026-05-01, wariant 2a checkout.
- `docs/handoff.md:1799` — wariant 2c jako przyszła ewolucja.
- `src/convex/mutations.ts:707` — `markBookingPaymentsProcessing` podpina Stripe PaymentIntent do wybranych pozycji.
- `src/convex/mutations.ts:728` — suma wybranych płatności.
