# ADR-034: Lista rezerwowa bez numeru w kolejce

- **Status:** przyjęta
- **Data:** 2026-11-16
- **Obszar:** sprzedaż | komunikacja z zainteresowanym | uczciwość obietnicy

## Kontekst

Rejs z kompletem załogi (ADR-033) nie ma czego sprzedać, a zainteresowanie trwa. Potrzebny jest mechanizm, który zatrzymuje tę uwagę: zapis na konkretny rejs i etap, a nie ogólny newsletter.

Naturalnym odruchem przy liście rezerwowej jest pokazanie pozycji w kolejce — „jesteś piąty”. Buduje pilność i daje poczucie porządku.

## Decyzja

**Lista rezerwowa jest realnym mechanizmem, prowadzonym per rejs i per etap, ale zapisany nie dostaje numeru w kolejce.**

Zapisany dostaje: potwierdzenie, że zapis doszedł, jasne powiedzenie czego dotyczy (ten rejs, ten etap) i czego **nie** obiecuje (miejsce nie jest zarezerwowane). Na stronie rejsu może stać zbiorczy sygnał zainteresowania („czeka 7 osób”).

Michał widzi w panelu, kto czeka, na co i od kiedy, oraz ma akcję „zaproponuj zwolnioną koję”.

## Uzasadnienie

Numer w kolejce jest **obietnicą sztywnej kolejności**, a zwolnionej koi nie przydziela kolejność zgłoszeń. Przydziela ją organizator, patrząc na skład załogi, doświadczenie żeglarskie i podział kajut — pojedyncza wolna koja w kajucie dwuosobowej nie jest obojętna na to, kto w tej kajucie już płynie. Gdyby numer był widoczny, każde odstępstwo od niego byłoby złamaniem danego słowa, a odstępstwa będą regułą, nie wyjątkiem.

Odrzucono też wariant „numer widoczny, ale z gwiazdką”. Zastrzeżenie drobnym drukiem nie kasuje obietnicy, którą niesie duża liczba.

Sygnał zbiorczy („czeka N osób”) zachowano, bo mówi prawdę o popycie, a nie obiecuje niczego konkretnej osobie. Jest też spójny z ADR-018: komunikat wynika z danych, nie z decyzji marketingowej.

## Konsekwencje

- Zapis na listę rezerwową nie tworzy żadnego roszczenia ani blokady koi. Nie wchodzi w mechanikę holdów (ADR-019, ADR-031).
- Kolejność zapisów jest przechowywana (data zapisu), ale **nie jest publikowana** — służy Michałowi jako jedna z przesłanek, nie jako reguła.
- Zaproponowanie zwolnionej koi jest czynnością ręczną. Automatyczne „pierwszy z listy dostaje link” byłoby wdrożeniem kolejki tylnymi drzwiami i wymagałoby zmiany tej decyzji.
- Treść potwierdzenia musi jawnie mówić, że miejsce nie jest zarezerwowane — inaczej sam fakt zapisu zostanie odczytany jako rezerwacja.
- Pozycja wchodzi w ten sam obszar co FEAT-20 (token grupowy) i FEAT-16 (rabat jako encja) — przy ich projektowaniu sprawdzić, czy nie wprowadzają kolejki inną drogą.

## Powiązania

- ADR-033 — stan „komplet załogi”, w którym lista rezerwowa jest głównym CTA
- ADR-018 — komunikaty o dostępności wynikają z danych
- FEAT-5 (b) — belka powiadomień i rabat early-bird; osobny mechanizm, nie mylić z listą rezerwową
- FEAT-20 — token grupowy; tam kolejność ma inne znaczenie
