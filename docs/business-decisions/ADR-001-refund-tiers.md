# ADR-001: Progi polityki zwrotów

- **Status:** przyjęta (progi zaktualizowane 2026-08-13, patrz Uzupełnienie)
- **Data:** 2026-07-03
- **Obszar:** refundy

## Kontekst

Moduł refundów potrzebował domyślnej polityki sugerującej kwotę zwrotu na podstawie liczby dni do rozpoczęcia rejsu. Granica między „3 miesiące” a „12 tygodni” była niejednoznaczna, bo mogła oznaczać 90 albo 84 dni.

## Decyzja

**Nieaktualne od 2026-08-13 — patrz Uzupełnienie poniżej.** Pierwotna polityka Michała (2026-07-03) miała cztery progi:

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

## Uzupełnienie 2026-08-13 — progi zaktualizowane, trzy rozjeżdżające się źródła sprowadzone do jednego

Przy przełączeniu Stripe na nowe konto (produkcja) wyszło na jaw, że trzy źródła tej samej reguły mówiły różne rzeczy: (1) ten ADR / dokument regulaminu z 07-07 — `90%` / `42 dni`; (2) opis Michała podany słownie na czacie 08-10 — `80%` / `45 dni`, bez wzmianki o dodatkowym progu; (3) żywa konfiguracja w `refundPolicies` (wpisana ręcznie przez Tomka w `/admin/automation` tego samego dnia) — cztery progi, `180/100%, 90/80%, 60/50%, 45/0%`.

Sprawdzone matematycznie: wariant (3) daje refund % **mniejszy lub równy** obu pozostałym w każdym przedziale dni — jest zdominowanym (najkorzystniejszym dla organizatora) połączeniem wszystkich trzech. Tomek zdecydował: system zostaje bez zmian, dokumenty (regulamin) poprawiane do tych liczb, nie odwrotnie. Michał potwierdził.

**Nowe, obowiązujące progi:**

- 180 dni lub więcej przed rejsem: 100% zwrotu.
- 90-179 dni przed rejsem: 80% zwrotu.
- 60-89 dni przed rejsem: 50% zwrotu.
- 0-59 dni przed rejsem: 0% zwrotu.

Regulamin `docs/business-decisions/2026_08_09_SA_regulamin_rejsu_v2.doc` zaktualizowany do tych liczb (w dniach, nie miesiącach/tygodniach — usuwa dwuznaczność z Kontekstu powyżej raz na zawsze). Stary `.doc` z 07-07 zostaje w repo jako historia, nie jako źródło prawne.

## Źródła

- `docs/handoff.md:138` — sesja 2026-07-03, decyzja o progach `180/100, 90/90, 42/50, 0/0`.
- `src/convex/schema.ts:240` — tabela `refundPolicies` i pola `tiers`.
- `src/convex/refunds.ts:57` — dopasowanie najwyższego progu.
- `knowledge-vault/wiki/concepts/refund-policy-retroactivity.md` — progi i rozstrzygnięcie 84 vs 90 dni.
- `docs/backlog.md` LEGAL-8 — sesja 2026-08-13, pełne śledztwo trzech źródeł i wynik matematyczny.
- `npx convex run refunds:getActiveRefundPolicy --prod` (2026-08-13) — odczyt żywej konfiguracji, punkt wyjścia śledztwa.
