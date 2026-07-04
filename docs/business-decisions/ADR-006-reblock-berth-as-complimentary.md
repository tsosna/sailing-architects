# ADR-006: Ponowne zablokowanie koi po refundzie jako complimentary

- **Status:** przyjęta
- **Data:** 2026-07-03
- **Obszar:** refundy | koje

## Kontekst

Po refundzie z opcją zwolnienia koi operator może uznać, że miejsce jednak nie powinno wrócić do normalnej sprzedaży. System potrzebował statusu dla ręcznego ponownego zablokowania takiej koi.

## Decyzja

Reblock ustawia koje bookingu na status `complimentary`, nie `taken`.

## Uzasadnienie

`taken` oznacza opłacone miejsce. Po refundzie booking jest zrefundowany, więc ustawienie `taken` kłamałoby o stanie płatności. `complimentary` oznacza miejsce zarezerwowane administracyjnie, bez normalnej sprzedaży.

## Konsekwencje

Michał może później zwolnić koję w module miejsc specjalnych. Sales Board i inventory muszą traktować `complimentary` jako zablokowane miejsce bez płatności.

## Źródła

- `docs/handoff.md:138` — sesja 2026-07-03, decyzja `Reblock -> complimentary`.
- `src/convex/schema.ts:49` — statusy koi, w tym `taken` i `complimentary`.
- `src/convex/mutations.ts:402` — mutacja `reblockBerth`.
- `src/convex/mutations.ts:418` — patch statusu na `complimentary`.
