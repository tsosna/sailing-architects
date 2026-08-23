# ADR-028: Wiążąca jest polska wersja dokumentów prawnych, pozostałe języki mają charakter informacyjny

- **Status:** przyjęta (decyzja Tomka, sesja 2026-08-23)
- **Data:** 2026-08-23
- **Obszar:** legal / i18n
- **Powiązane:** [ADR-023](ADR-023-terms-published-as-versioned-file.md), [ADR-027](ADR-027-privacy-policy-as-route-not-versioned-file.md), LEGAL-10

## Kontekst

Serwis jest dwujęzyczny (`wuchale.config.js`: `locales: ['pl', 'en']`, trasa `/en` działa), a dokumenty prawne powstają po polsku. LEGAL-10 nazwał ryzyko: **dokument prawny po angielsku nie jest tłumaczeniem interfejsu, tylko drugim dokumentem prawnym**. Nietrafnie przetłumaczony przycisk kosztuje jedno błędne kliknięcie; nietrafnie przetłumaczony próg zwrotu tworzy roszczenie.

Pozycja wymieniała trzy warianty do rozstrzygnięcia: (a) tylko polski, (b) polski wiążący plus angielski pomocniczy, (c) obie wersje równorzędne.

## Decyzja

**Wersja polska jest wiążąca. Wersje w innych językach mają charakter informacyjny i muszą nieść o tym wyraźną adnotację — w polityce prywatności i w regulaminie.**

Brzmienie przyjęte w polityce: *„Dokument sporządzono w języku polskim. Wersje w innych językach mają charakter informacyjny — w razie rozbieżności wiążąca jest wersja polska."*

## Uzasadnienie

- **Wariant (c) mnoży odpowiedzialność bez korzyści.** Dwie równorzędne wersje znaczą, że każda rozbieżność tłumaczeniowa jest sporem o treść zobowiązania — a tłumaczenia powstają maszynowo albo półautomatycznie przez wuchale.
- **Wariant (a) zostawia zarzut,** że uczestnik anglojęzyczny nie miał możliwości zapoznania się z dokumentem.
- **Wariant (b) daje jedno i drugie:** czytelnik obcojęzyczny rozumie treść, a zobowiązanie ma jedno brzmienie. Kosztem jest adnotacja, którą trzeba pamiętać w każdym dokumencie.
- **Adnotacja jest warunkiem, nie ozdobnikiem.** Bez niej wersja angielska wygląda na równorzędną i cała konstrukcja przestaje działać.

## Konsekwencje

- Adnotacja stoi w sekcji „Data wejścia w życie" opublikowanej polityki.
- **Regulamin jej nie ma.** Dopisanie wymaga — zgodnie z ADR-023 — **nowego pliku PDF**, nie edycji opublikowanego. Zadanie otwarte, zapisane przy LEGAL-10.
- **Każdy przyszły dokument prawny dziedziczy ten obowiązek:** umowa uczestnika, klauzula informacyjna w mailu z tokenem, zgody z LEGAL-9.
- Wuchale wyciągnęło z polityki **119 kluczy**; nieprzetłumaczone renderują tekst polski. Czy wersja angielska w ogóle powstaje i kto odpowiada za jej brzmienie — decyzja Michała i prawnika, otwarta.
