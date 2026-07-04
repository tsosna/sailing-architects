# ADR-010: Status taken oznacza opłacone miejsce

- **Status:** przyjęta
- **Data:** 2026-04-30
- **Obszar:** koje | rezerwacje | płatności

## Kontekst

Checkout potrzebował stanu tymczasowej blokady koi przed płatnością. Wcześniejsze mieszanie blokady i zajętości mogło mylić inventory oraz admina.

## Decyzja

`taken` oznacza wyłącznie opłacone miejsce. Tymczasowa blokada checkoutu używa statusu `held` z `holdExpiresAt`. Rezerwacja administracyjna bez płatności używa `complimentary`, a koja kapitańska używa `captain`.

## Uzasadnienie

Status koi ma nieść prawdę biznesową. `taken` bez płatności kłamałby o sprzedaży, dlatego stan przed płatnością i stany specjalne mają osobne wartości.

## Konsekwencje

Po utworzeniu checkoutu koja jest `held`. Po udanej pierwszej płatności Stripe zmienia się na `taken`. Refund z reblockiem używa `complimentary`, nie `taken`.

## Źródła

- `docs/handoff.md:1588` — sesja 2026-04-30, `taken` tylko dla opłaconego miejsca, checkout jako `held`.
- `src/convex/schema.ts:49` — statusy koi.
- `src/convex/mutations.ts:511` — ustawienie `held` przy tworzeniu bookingu.
- `src/convex/mutations.ts:623` — ustawienie `taken` po udanej płatności.
