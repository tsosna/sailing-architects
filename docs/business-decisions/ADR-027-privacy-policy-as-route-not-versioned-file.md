# ADR-027: Polityka prywatności jako trasa aplikacji, a nie wersjonowany plik

- **Status:** przyjęta (decyzja Tomka, sesja 2026-08-23)
- **Data:** 2026-08-23
- **Obszar:** legal / publikacja treści
- **Powiązane:** [ADR-023](ADR-023-terms-published-as-versioned-file.md), [ADR-026](ADR-026-privacy-policy-published-regardless-of-exemption.md)

## Kontekst

ADR-023 rozstrzygnął formę publikacji **regulaminu** na korzyść statycznego pliku PDF o nazwie niosącej datę wersji. Kryterium było jedno i rozstrzygające: system musi umieć wykazać, na jaką treść klient się zgodził, więc rezerwacja zapisuje identyfikator wersji dokumentu.

Przy polityce prywatności powstało pytanie, czy przenieść ten sam wzorzec — plik obok pliku, ta sama konwencja nazw.

## Decyzja

**Polityka prywatności jest trasą aplikacji** (`src/routes/[[lang=lang]]/polityka-prywatnosci/+page.svelte`), nie plikiem w katalogu statycznym.

## Uzasadnienie

- **Kryterium z ADR-023 tutaj nie występuje.** Polityki prywatności się nie akceptuje — RODO wymaga *poinformowania*, nie zgody. Nie ma checkboxa, nie ma czego dowodzić, nie ma wersji do zapisania przy rezerwacji. Argument, który przy regulaminie przeważył nad wszystkimi innymi, przy polityce jest bezprzedmiotowy.
- **Pozostałe kryteria wskazują w drugą stronę.** Art. 12 RODO wymaga formy „łatwo dostępnej i zrozumiałej"; PDF na telefonie wymaga powiększania i przewijania w bok. Uzasadnienie Tomka: *„czytelność i aktualność ważniejsze"*.
- **Aktualizacja jest tu regułą, nie wyjątkiem.** Zmiana dostawcy, zakresu danych albo okresu retencji zmienia treść polityki. Przy pliku każda taka zmiana to nowy plik i przepięcie odnośników; przy trasie to edycja tekstu.
- **Drugi język idzie tą samą drogą co reszta serwisu** — wuchale wyciąga stringi z markupu, więc polityka nie wymaga osobnego mechanizmu tłumaczeń ani drugiego pliku.

## Konsekwencje

- Strona opublikowana 2026-08-23 (commity `b33630ae`, `8bb6e6b4`); `https://www.sailing-architect.com/polityka-prywatnosci` odpowiada, licznik 404 biegnący od 2026-08-14 zatrzymany.
- **Historia wersji polityki mieszka w gicie, nie w nazwach plików.** Jeżeli kiedykolwiek pojawi się potrzeba wykazania brzmienia z konkretnej daty, źródłem jest historia repozytorium — wystarczające, bo nikt tej treści nie akceptował.
- Sekcja „Data wejścia w życie" musi być aktualizowana ręcznie przy każdej istotnej zmianie. Nic tego nie wymusza — to reguła w głowie edytującego, ta sama słabość, którą ADR-023 wytknął wariantowi z trasą.
- Odnośnik w stopce (`site-footer.svelte`) prowadzi do trasy bez `target="_blank"`, w odróżnieniu od regulaminu, który jako PDF otwiera się w nowej karcie.
