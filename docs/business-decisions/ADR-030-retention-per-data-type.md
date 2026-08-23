# ADR-030: Okres przechowywania ustalany osobno dla każdego rodzaju danych

- **Status:** przyjęta (decyzja Tomka, sesja 2026-08-23)
- **Data:** 2026-08-23
- **Obszar:** legal / dane osobowe / retencja
- **Powiązane:** LEGAL-17, SEC-1, [ADR-002](ADR-002-refund-policy-snapshot-at-purchase.md)

## Kontekst

Przy pisaniu sekcji o okresach przechowywania zderzyły się dwie reguły z różnych źródeł:

- **Michał (mail „RODO na jachcie", 2026-08-19):** *„dla mnie mogą być trzymane to 30 dni od końca rejsu"*, z wyjątkiem jednego egzemplarza listy załogi w dzienniku jachtowym.
- **`privacy-policy-inputs.md`, część 6.4:** „przez okres przedawnienia roszczeń wynikających z uczestnictwa".

To nie są warianty tego samego. Trzydzieści dni jest **krócej** niż przedawnienie: skasowanie wszystkiego po miesiącu oznacza, że przy roszczeniu zgłoszonym po roku nie ma czym wykazać, na jakich warunkach doszło do uczestnictwa. LEGAL-17 punkt (c) nazywał tę kolizję jako nierozstrzygniętą.

## Decyzja

**Nie ustalamy jednego okresu dla wszystkich danych. Każdy rodzaj danych dostaje okres wynikający z celu, któremu służy.**

| dane | okres |
|---|---|
| adres e-mail i konto w serwisie | do czasu usunięcia konta |
| rezerwacja, płatności, zwroty | przez okres przedawnienia roszczeń |
| dane do listy załogi (data i miejsce urodzenia, obywatelstwo, dokument tożsamości) | nie dłużej niż 30 dni od zakończenia rejsu |
| kontakt alarmowy | nie dłużej niż 30 dni od zakończenia rejsu |
| wymagania dietetyczne i informacje o zdrowiu | nie dłużej niż 30 dni od zakończenia rejsu, a przy wycofaniu zgody — niezwłocznie |

Wszystkie terminy zapisane jako **sufit** („nie dłużej niż"), zgodnie z LEGAL-17 (a).

## Uzasadnienie

- **Cel wyznacza okres, nie odwrotnie.** Dane potrzebne **na rejs** tracą cel z chwilą jego zakończenia. Dane transakcyjne służą wykazaniu warunków i są potrzebne tak długo, jak długo spór jest możliwy.
- **Reguła Michała zostaje spełniona tam, gdzie ma sens** — obejmuje dokumenty tożsamości, dane medyczne i kontakt alarmowy, czyli wszystko, co najbardziej wrażliwe.
- **Obrona przed roszczeniem nie zostaje rozbrojona.** Numer paszportu nie jest do niczego potrzebny w sporze o zwrot składki; harmonogram rat i historia płatności są.
- **Sufit zamiast terminu dziennego.** Zobowiązanie „usuwamy 30. dnia" wymaga crona działającego co do dnia; sufit dotrzymuje się kasując kiedykolwiek wcześniej, przy tej samej ochronie uczestnika.

## Konsekwencje

- Tabela opublikowana w polityce prywatności, sekcja „Okresy przechowywania".
- **Dziś nic nie kasuje żadnych danych** — pięć cronów w `src/convex/crons.ts` i żaden nie usuwa. To SEC-1, otwarte; polityka opisuje stan docelowy.
- **Trzy pytania do rozstrzygnięcia przy pisaniu crona,** dopisane do SEC-1: zawiadomienie uczestnika 7 dni przed usunięciem (pomysł Tomka; mail przed, nie po, bo adres uczestnika sam jest kasowaną daną), los e-maila uczestnika bez konta (`bookingParticipants.email` — tabela o nim milczy) oraz cykl kopii zapasowych (dane wracają z backupu, więc reguła kasowania musi go obejmować).
- **Dziennik jachtowy i operator płatności wymienione osobno w polityce,** bo w obu przypadkach dane przeżywają nasze kasowanie i przemilczenie tego byłoby nieprawdą.
