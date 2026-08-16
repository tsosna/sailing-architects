# ADR-025: Kupujący po terminie raty płaci ją od razu, plan zostaje nietknięty

- **Status:** przyjęta (do zakomunikowania Michałowi — jego propozycja z 08-13 została przyjęta co do zasady, z innym mechanizmem)
- **Data:** 2026-08-16
- **Obszar:** sprzedaż / harmonogram płatności / kasa

## Kontekst

Plan płatności jest **snapshotem segmentu** (ADR-008): terminy rat liczone są od daty rejsu, nie od daty zakupu. Kupujący, który wchodzi późno, dostawał harmonogram z pozycjami, których termin już minął. Skutki łańcuchowe: cron `markOverduePayments` ustawiał `overdue` natychmiast, monit o zaległość mógł wyjść tego samego dnia co zakup, a panel klienta pokazywał dług w chwili potwierdzenia rezerwacji.

Zgłoszenie Michała (dopisek do `docs/feedback/2026-08-12.md`, 08-13): *„gdy kupuję koje (pierwsza płatność) w terminie późniejszym niż np. druga płatność, to druga płatność jest automatycznie przeterminowana"*, z propozycją: *„czy nie powinno być tak, że w takim przypadku pierwsza płatność nie powinna być w wysokości dwóch wpłat"*.

Rozważane były trzy drogi:

- **(a) scalenie** — kupujący obejmuje pierwszą wpłatą wszystkie raty już wymagalne
- **(b) przesunięcie terminów** względem daty zakupu
- **(c) odcięcie sprzedaży** segmentu po ostatnim progu

## Decyzja

**Wariant (a).** Plan płatności pozostaje nietknięty — jest własnością Michała i jednakowy dla wszystkich uczestników rejsu. Kupujący, który wchodzi po terminie którejś raty, **musi przy zakupie objąć wszystkie raty już wymagalne**. Nie może wybrać krótszego zakresu.

Skrajny przypadek jest świadomie dopuszczony: zakup po **ostatnim** terminie planu oznacza zapłatę wszystkich rat naraz (poza dopłatą końcową, która nie ma terminu).

## Uzasadnienie

Słowa Tomka przy wyborze: *„planu nie ruszamy (to decyzja Michała), promujemy tych, którzy zdecydują kupić wcześniej"*.

Wariant (b) odrzucony, bo łamie sens harmonogramu: terminy przestają być wspólne dla rejsu, dwie osoby na tym samym rejsie mają różne daty rat, a monity i cron liczą od `dueAt`. Wariant (c) odrzucony jako utrata sprzedaży last-minute — to decyzja Michała o pieniądzach, nie problem techniczny.

Wariant (a) ma dodatkowo tę własność, że **nagradza wcześniejszy zakup** — im później ktoś kupuje, tym większą część składki wpłaca od razu. Jest to spójne z kierunkiem rozważanym osobno w FEAT-19 (ceny dynamiczne).

## Konsekwencje

- **Mechanizm nie wymagał zmiany harmonogramu.** Kasa i tak oferuje wyłącznie **prefiksy** planu („Zaliczka", „Zaliczka + Rata 1", …), więc reguła sprowadza się do minimalnej długości prefiksu. Rata opłacona przy zakupie nie stanie się `overdue`, bo cron bierze wyłącznie pozycje `pending`.
- Odmowa stoi **na serwerze** (`validateSelection` w `/api/stripe/create-intent`, commit `6bbc120e`). UI ma to odzwierciedlać, nie zastępować.
- Kupujący zobaczy przy zakupie kwotę wyższą niż nominalna pierwsza wpłata z planu. Komunikat musi mówić, ile pozycji trzeba objąć — nie „nieprawidłowy wybór".
- Wiersz „Dopłata końcowa" nie ma terminu, więc nigdy nie wchodzi do minimum. Spójne z `markOverduePayments`, który pomija pozycje bez `dueAt`.
- **Do zrobienia:** interfejs wyboru płatności ma zaznaczać minimum sam i nie pozwalać zejść niżej (BUG-11, część otwarta).

## Źródła

- `docs/feedback/2026-08-12.md` — zgłoszenie Michała (dopisek 08-13)
- ADR-008 — plan płatności jako snapshot segmentu
- `docs/backlog.md` — BUG-11
- commity `6bbc120e`, `22664324` (2026-08-16)
