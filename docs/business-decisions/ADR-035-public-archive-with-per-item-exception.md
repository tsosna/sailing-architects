# ADR-035: Archiwum rejsu jest publiczne, z wyjątkiem na pojedynczy materiał

- **Status:** przyjęta warunkowo — wejście na produkcję wymaga klauzuli zgody na wizerunek w umowie uczestnika (LEGAL-21)
- **Data:** 2026-11-16
- **Obszar:** treść strony | dane osobowe | sprzedaż

## Kontekst

Rejs zakończony staje się archiwum z relacją, zdjęciami i filmami (ADR-033). Materiał z rejsu to w większości zdjęcia **rozpoznawalnych ludzi** — załogi.

Zgody na publikację wizerunku może udzielić wyłącznie osoba, której wizerunek dotyczy. Ta sama zasada została już w tym projekcie zapisana dla danych szczególnych (ADR-029), ale wizerunku nie obejmuje żaden dotychczasowy ADR, a umowa uczestnika i regulamin nie zawierają klauzuli zgody.

## Decyzja

**Archiwum jest publiczne — dostępne bez logowania.** Jednocześnie pojedyncze zdjęcie lub film da się oznaczyć jako **„tylko dla załogi”**; taki materiał widzi po zalogowaniu uczestnik tego rejsu.

Wyjątek jest furtką na pojedynczy przypadek, **nie** podstawą prawną dla całej galerii i **nie** domyślnym trybem.

## Uzasadnienie

Archiwum publiczne jest głównym argumentem wiarygodności przy sprzedaży kolejnych rejsów — relacja z przebytego Atlantyku mówi o organizatorze więcej niż opis oferty. Zamknięcie go za logowaniem zamienia je w prywatny album i odbiera mu tę rolę.

Wariant pośredni (publiczna zajawka, pełna galeria po zalogowaniu) odrzucono: osoba z zewnątrz widzi wtedy, że coś jest, ale nie widzi czego — koszt jak przy zamknięciu, korzyść żadna.

Furtka na pojedynczy materiał jest tania teraz i droga później. Bez niej pierwsza prośba uczestnika „to zdjęcie zdejmijcie” zostawia dwa wyjścia: usunięcie materiału albo przebudowę mechanizmu na działającym archiwum.

## Konsekwencje

- **Blokada wdrożeniowa:** archiwum ze zdjęciami rozpoznawalnych osób nie wchodzi na produkcję przed rozstrzygnięciem LEGAL-21. Dotyczy to także materiałów z rejsu **już odbytego** — uczestnicy Sail Adventure 2026 podpisywali umowę bez klauzuli zgody, więc zgodę trzeba zebrać od nich osobno, po fakcie.
- Galeria musi mieć zaprojektowany stan materiału zamkniętego: kafel wyglądający na świadomą decyzję, wyjaśnienie zamiast pustego miejsca i ścieżkę logowania dla uczestnika.
- Potrzebna jest ścieżka **wycofania zgody po publikacji** — oznaczenie materiału jako zamkniętego musi działać też po tym, jak był już widoczny publicznie.
- Relacje tekstowe i materiały bez wizerunku (krajobraz, jacht, mapa) nie są objęte blokadą i mogą zostać opublikowane wcześniej.
- Decyzja nie rozstrzyga, czy zgoda ma obejmować też media społecznościowe organizatora — to osobne pytanie do LEGAL-21.

## Powiązania

- LEGAL-21 (backlog) — klauzula zgody na wizerunek; blokuje wdrożenie tej decyzji
- ADR-029 — zgoda należy do osoby, której dane dotyczą (ta sama zasada, inny rodzaj danych)
- ADR-033 — stan archiwalny rejsu
- FEAT-14 (backlog), prompt projektowy `docs/design/landing-archive-and-multi-voyage-design-prompt.md`
