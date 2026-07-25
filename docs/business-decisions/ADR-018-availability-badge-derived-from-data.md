# ADR-018: Komunikaty o dostępności miejsc wynikają z danych, nie z decyzji marketingowej

- **Status:** przyjęta
- **Data:** 2026-07-25
- **Obszar:** landing | sprzedaż | compliance

## Kontekst

Na karcie cennika czwartego etapu wisiał badge „Ostatnie miejsca" zaszyty warunkiem `{#if i === 3}` — przypisany do pozycji na liście, bez związku z jakimikolwiek danymi. W dniu wykrycia (2026-07-25) stan koi wyglądał tak:

| Etap | Wolnych koi | Co mówiła strona |
|---|---|---|
| s1 Majorka → Gibraltar | 1 | nic |
| s2 Gibraltar → Madera | 7 | nic |
| s3 Madera → Teneryfa | 9 | nic |
| s4 Teneryfa → Cabo Verde | 9 | „Ostatnie miejsca" |

Komunikat o kończących się miejscach wisiał na etapie o **największej** dostępności, a etap z jedną wolną koją nie informował o niczym. Michał niezależnie zgłaszał potrzebę oznaczania wyprzedanych etapów (FEAT-8).

## Decyzja

1. Każdy komunikat o dostępności („Wyprzedane", „Wolne N miejsc") wynika z zapytania o realny stan koi. Nie istnieje wariant ustawiany ręcznie ani przypisany do pozycji na liście.
2. Próg komunikatu o kończących się miejscach: **3 wolne koje lub mniej** (`LOW_STOCK` w `src/lib/berth-badge.ts`). Powyżej progu badge nie pojawia się w ogóle.
3. Wyprzedany etap **pozostaje klikalny**. Badge informuje, nie blokuje — użytkownik może obejrzeć plan jachtu i szczegóły etapu, którego nie kupi.
4. Wolne miejsca liczone są jako koje `available` plus koje z wygasłą blokadą czasową. Koje kapitana i complimentary nie są wolne, mimo że nikt ich nie kupił.

## Uzasadnienie

Sztuczna presja zakupowa — komunikat o kończących się miejscach niezgodny ze stanem faktycznym — jest w prawie unijnym i polskim kwalifikowana jako nieuczciwa praktyka rynkowa, a nie jako chwyt marketingowy. Ryzyko jest innej kategorii niż niedopracowany interfejs: dotyczy relacji z konsumentem i organu nadzoru, nie estetyki.

Niezależnie od kwestii prawnej: fałszywy komunikat kieruje uwagę kupującego na etap, który akurat nie wymaga pośpiechu, i milczy tam, gdzie zostało jedno miejsce. Działa przeciwko sprzedaży.

Próg 3 jest wartością produktową, nie wyliczoną — dobrany tak, by komunikat pozostał rzadki i przez to wiarygodny. Zmiana progu wymaga uwagi na odmianę rzeczownika w komunikacie (powyżej 4 potrzebna trzecia forma: „5 miejsc").

Pozostawienie wyprzedanego etapu klikalnym wynika z prośby Michała, żeby było widać, że etap istnieje, ale jest sprzedany — informacja o wyprzedaniu ma być czytelna, ale nie ma odbierać dostępu do treści.

## Konsekwencje

- Komunikat aktualizuje się sam wraz ze sprzedażą i zwrotami — subskrypcja Convex, bez odświeżania strony i bez pracy ręcznej.
- Nie ma mechanizmu „wymuś komunikat na etapie X". Gdyby marketing kiedykolwiek takiego potrzebował, wymaga to osobnej decyzji i świadomego odejścia od tego ADR.
- Reguła liczenia wolnych koi żyje w jednym miejscu (`src/convex/_lib/berthFree.ts`), wspólnym z planem jachtu — plan i badge nie mogą pokazywać sprzecznych stanów.
- Teksty komunikatów są dziś poza zasięgiem ekstraktora tłumaczeń (I18N-1). Uruchomienie wersji angielskiej wymaga ich objęcia.

## Źródła

- `docs/handoff.md` — sesja 2026-07-25, FEAT-8.
- `docs/backlog.md` — FEAT-8 (zamknięty), UI-6, REFACTOR-3.
- `src/lib/berth-badge.ts` — próg i teksty.
- `src/convex/_lib/berthFree.ts` — definicja wolnej koi.
- `src/convex/queries.ts` — `listBerthAvailability`.
- commit `d8f9b246`.
