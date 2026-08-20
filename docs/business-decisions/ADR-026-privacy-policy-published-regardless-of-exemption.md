# ADR-026: Politykę prywatności publikujemy niezależnie od wyłączenia z RODO, administratorem jest osoba fizyczna

- **Status:** przyjęta (decyzja Michała, mail „RODO na jachcie", 2026-08-19)
- **Data:** 2026-08-19
- **Obszar:** legal / compliance / dane osobowe

## Kontekst

ADR-021 opisuje rejs jako **prywatne, niekomercyjne przedsięwzięcie składkowe**. Powstało ryzyko, że ta forma zostanie odczytana jako „RODO nas nie dotyczy" — art. 2 ust. 2 lit. c wyłącza przetwarzanie w ramach działalności czysto osobistej lub domowej.

Fakty z systemu przemawiają przeciw takiemu odczytaniu: koje sprzedawane są przez internet nieokreślonemu kręgowi odbiorców, płatności idą przez Stripe, działa harmonogram rat, automatyczne monity, panel administracyjny i landing z ofertą. To przetwarzanie systematyczne i zorganizowane, a nie lista znajomych w notesie. Rozstrzygnięcie prawne należy do prawnika, ale **decyzja produktowa nie musiała na nie czekać**.

Równolegle otwarte było, kto figuruje jako administrator. Michał prowadzi biuro architektoniczne, ale rejs nie jest działalnością tego biura — a `docs/business-decisions/privacy-policy-inputs.md` (LEGAL-2) wskazywał, że wzór z `domy-modulowe` opiera się na wierszu „firma z siedzibą w…", którego tutaj nie ma czym wypełnić.

## Decyzja

**Piszemy i publikujemy informację RODO nawet przy ewentualnym zwolnieniu z tego obowiązku.** Cytat rozstrzygający: *„Piszemy informacje rodo, nawet mimo ewentualnego zwolnienia z tego obowiązku"*.

**Administratorem jest osoba fizyczna — Michał Smolarski** — bez NIP-u, REGON-u i nazwy firmy. Jako dane kontaktowe publikujemy jego adres e-mail oraz adres korespondencyjny; Michał podał konkretny adres i uzasadnił, że może się nim posługiwać (ma do tego lokalu umowę najmu), zamiast adresu prywatnego. Wartości znajdują się w mailu źródłowym i **nie są przepisywane do repozytorium**, żeby nie mnożyć kopii danych osobowych.

## Uzasadnienie

- **Ocena prawna przestaje być blokadą.** Dotąd LEGAL-2 czekał na rozstrzygnięcie, czy wyłączenie ma zastosowanie. Publikacja polityki jest poprawna w obu scenariuszach, więc czekanie nie kupowało niczego poza opóźnieniem.
- **Regulamin już odsyła do nieistniejącej strony.** `https://www.sailing-architect.com/polityka-prywatnosci` zwraca 404 od 2026-08-14 i widzą to klienci. Każdy dzień zwłoki to realna rozbieżność między dokumentem a serwisem.
- **Osoba fizyczna jako administrator jest normą, nie obejściem.** RODO wymaga tożsamości administratora i danych kontaktowych — nie wymaga formy prawnej ani numerów rejestrowych.
- **Publikacja mimo zwolnienia niczego nie przesądza.** Podanie informacji nie jest przyznaniem, że wyłączenie nie przysługuje.

## Konsekwencje

- **LEGAL-2 odblokowany.** Ustalenie (c) z tej pozycji („forma prywatna nie przesądza o wyłączeniu — rozstrzyga prawnik") schodzi z roli blokady do roli przypisu.
- **Sekcja o administratorze powstaje od zera.** Wzorzec z `domy-modulowe` dostarcza kolejności sekcji i listy praw z art. 15–21, ale wiersza o siedzibie firmy nie ma czym zastąpić — trzeba go napisać, nie przepisać.
- **Adres domowy staje się daną publiczną.** Skutek świadomie przyjęty przez Michała, oparty na umowie najmu. Przy zmianie lokalu polityka wymaga aktualizacji — to zobowiązanie ciągłe, nie jednorazowe.
- **Bez wpływu na ustalenia (a) i (b) z LEGAL-2.** Dane o zdrowiu z art. 9 nadal wymagają osobnej zgody (LEGAL-9), a obowiązek informacyjny z art. 14 wobec osób, których dane wpisuje kupujący, nadal trafia do maila z tokenem potwierdzenia.
- **Pytania do Michała z `privacy-policy-inputs.md` zostają otwarte** — manifest załogi, retencja numerów dokumentów, ubezpieczyciel jako odbiorca, notatki medyczne w bazie. Ta decyzja ich nie dotyka.
