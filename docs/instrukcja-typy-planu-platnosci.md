# Instrukcja dla Michała — pole „Typ" w planie płatności

> Zakładka **Automatyzacja** w panelu admina. Wersja bez technikaliów.
> Źródło reguł (techniczne): `docs/business-decisions/ADR-017-payment-item-kind-semantics.md`.

Każda pozycja planu (zaliczka, raty…) ma wybierany „Typ". To **nie jest tylko opis** — system podejmuje na jego podstawie decyzje o pieniądzach i przypomnieniach.

## Typy i ich znaczenie

**„Pełna wpłata" (full)** — pozycja specjalna. Znaczy: „klient może zamiast rat zapłacić wszystko od razu".

- Nie wlicza się do sumy planu — to alternatywa dla rat, nie dodatkowa kwota.
- Kiedy klient ją opłaci, system uznaje rezerwację za w całości opłaconą.
- Nie ma terminu i nie wysyłamy do niej przypomnień.
- Używać **wyłącznie** dla opcji „zapłać całość teraz". Ustawienie raty jako „Pełna wpłata" psuje sumę planu i wyłącza przypomnienia o tej racie.

**„Zaliczka" (deposit)** — pierwsza wpłata rezerwująca miejsce.

- Po jej opłaceniu rezerwacja dostaje status „zaliczka wpłacona" — to widać na tablicy sprzedaży i od tego zależą alerty.
- W planie powinna być dokładnie jedna.

**„Rata" (installment) i „Dopłata końcowa" (balance)** — zwykłe płatności terminowe. Działają tak samo: mają termin, system pilnuje zaległości i wysyła przypomnienia. Nazwa służy czytelności planu.

**„Inna" (custom)** — czysty opis, bez żadnych skutków. Na dziś lepiej nie używać.

## Krótko

Zaliczka = „Zaliczka", każda kolejna płatność = „Rata" (ostatnia może być „Dopłata końcowa"), opcja „zapłać wszystko od razu" = „Pełna wpłata". Nic innego.

## Ważne — plan zamraża się przy zakupie

W momencie kupna klient dostaje **kopię** aktualnego planu i ona obowiązuje go do końca. Późniejsze zmiany planu w Automatyzacji dotyczą tylko **przyszłych** kupujących — nikomu, kto już kupił, raty się nie zmienią.

Dlatego pomyłkę w planie warto poprawić od razu, zanim ktoś kupi — ale nie trzeba się bać, że edycja „przestawi" istniejące rezerwacje.
