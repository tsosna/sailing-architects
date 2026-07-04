# ADR-001: Progi polityki zwrotów

- **Status:** przyjęta
- **Data:** 2026-07-03
- **Obszar:** refundy

## Kontekst

Moduł refundów potrzebował domyślnej polityki sugerującej kwotę zwrotu na podstawie liczby dni do rozpoczęcia rejsu. Granica między „3 miesiące” a „12 tygodni” była niejednoznaczna, bo mogła oznaczać 90 albo 84 dni.

## Decyzja

Polityka zwrotów Michała ma cztery progi:

- 180 dni lub więcej przed rejsem: 100% zwrotu.
- 90-179 dni przed rejsem: 90% zwrotu.
- 42-89 dni przed rejsem: 50% zwrotu.
- 0-41 dni przed rejsem: 0% zwrotu.

Granica „3 miesiące” została zapisana jako 90 dni, nie 84 dni.

## Uzasadnienie

Wartości progów pochodzą od Michała. Rozstrzygnięcie 90 dni usuwa lukę interpretacyjną między miesiącami i tygodniami oraz daje jednoznaczne dopasowanie tierów w backendzie.

## Konsekwencje

Backend przechowuje progi w `refundPolicies.tiers` jako `minDaysBefore` oraz `refundPercent` w zakresie 0-1. Kalkulacja wybiera najwyższy próg, dla którego liczba dni do rejsu jest większa lub równa `minDaysBefore`.

Zmiana tych progów wpływa na sugestie dla przyszłych refundów, ale sama nie powinna zmieniać warunków już zawartych umów bez snapshotu polityki przy zakupie.

## Źródła

- `docs/handoff.md:138` — sesja 2026-07-03, decyzja o progach `180/100, 90/90, 42/50, 0/0`.
- `src/convex/schema.ts:240` — tabela `refundPolicies` i pola `tiers`.
- `src/convex/refunds.ts:57` — dopasowanie najwyższego progu.
- `knowledge-vault/wiki/concepts/refund-policy-retroactivity.md` — progi i rozstrzygnięcie 84 vs 90 dni.
