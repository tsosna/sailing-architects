# ADR-004: Zwrot alokowany od najnowszej płatności

- **Status:** przyjęta
- **Data:** 2026-06-20
- **Obszar:** refundy | płatności

## Kontekst

Jeden refund Michała może wymagać zwrotu środków przez kilka Stripe charge, bo booking może mieć zaliczkę i raty. System musiał rozdzielić jedną żądaną kwotę refundu na opłacone płatności.

## Decyzja

Refund jest alokowany kaskadowo od najnowszej opłaconej płatności do najstarszej. Kwota nie może przekroczyć sumy środków dostępnych do zwrotu.

## Uzasadnienie

Najnowsza płatność jest refundowana jako pierwsza, bo odwraca kolejność pobierania rat i daje prosty, deterministyczny algorytm. Walidacja `amount <= sum(paid - refunded)` chroni przed zwrotem większym niż realnie wpłacona i jeszcze niezwrócona kwota.

## Konsekwencje

UI może pokazać reaktywny podgląd alokacji przed faktycznym wywołaniem Stripe. Backend musi walidować kwotę w groszach jako integer i musi uwzględniać już wykonane zwroty.

## Źródła

- `docs/handoff.md:353` — sesja 2026-06-20, cascade od najnowszej charge i auto-validation.
- `src/convex/refunds.ts:80` — query `allocateRefundCascade`.
- `src/convex/refunds.ts:99` — filtrowanie płatności opłaconych i sort od najnowszych.
- `src/convex/refunds.ts:103` — walidacja dostępnej kwoty.
- `knowledge-vault/wiki/concepts/refund-cascade-allocation.md` — opis algorytmu.
