# ADR-032: Kupujący nie dowiaduje się, że karta została zgłoszona jako zgubiona lub skradziona

- **Status:** przyjęta
- **Data:** 2026-08-29
- **Obszar:** płatności | komunikacja z klientem | bezpieczeństwo

## Kontekst

Od 2026-08-29 komunikaty błędów płatniczych są tłumaczone na polski przez moduł `src/lib/stripe-errors.ts` (pozycja I18N-6, commit `68a2b686`). Stripe podaje przy odmowie karty dwa pola: `code` mówi, że bank odrzucił płatność, a `decline_code` — dlaczego.

Wśród powodów odmowy są trzy o innym charakterze niż pozostałe: `lost_card`, `stolen_card` i `fraudulent`. Bank wystawcy zwraca je, gdy karta została zgłoszona jako zgubiona, skradziona albo objęta podejrzeniem oszustwa.

Reszta powodów (brak środków, przekroczony limit, typ transakcji niedozwolony) opisuje sytuację, którą właściciel karty może rozwiązać sam. Te trzy opisują sytuację, w której **osoba wpisująca dane karty może nie być jej właścicielem**.

## Decyzja

**Przy `lost_card`, `stolen_card` i `fraudulent` kupujący widzi wyłącznie ogólne zdanie: „Twój bank odrzucił płatność."**

Powód odmowy nie jest pokazywany, nie jest parafrazowany i nie jest sugerowany. Trzy kody nie mają wpisu w mapie powodów odmowy — brak wpisu **jest** implementacją tej decyzji.

Pozostałe powody odmowy są nadal pokazywane w całości, razem ze zdaniem ogólnym.

## Uzasadnienie

Komunikat na ekranie płatności czyta ten, kto wpisał dane karty. Przy karcie zgłoszonej jako skradziona to z definicji może być osoba, która weszła w jej posiadanie nielegalnie. Zdanie „ta karta została zgłoszona jako skradziona" jest dla niej informacją operacyjną: ta karta jest spalona, trzeba wziąć następną. Milczenie tej informacji nie daje.

Koszt dla właściciela karty jest realny, ale niski. Dostaje zdanie o odmowie banku i idzie do banku — czyli tam, gdzie sprawa i tak się rozstrzyga, bo my nie mamy ani prawa, ani możliwości jej rozwiązać.

Rozważona i odrzucona alternatywa: **zdanie pośrednie** w rodzaju „skontaktuj się pilnie z bankiem". Odrzucone, bo słowo sygnalizujące wyjątkowość odróżnia tę odmowę od zwykłej, a to wystarczy, żeby przekazać tę samą wiadomość. Komunikat ma być nieodróżnialny od pozostałych ogólnych odmów.

Nie rozważano powiadamiania organizatora ani blokowania konta. Wykrycie kradzieży karty należy do banku i do Stripe'a; my nie mamy danych, żeby cokolwiek na ten temat twierdzić, a rezerwacja i tak nie powstaje bez udanej płatności.

Reguła nie wynika z przepisu ani z regulaminu Stripe'a. Wynika z tego, komu komunikat trafia przed oczy.

## Konsekwencje

- Właściciel karty zgłoszonej jako zgubiona dostaje mniej informacji niż mógłby — świadoma cena tej decyzji.
- W kodzie brak trzech wpisów wygląda jak przeoczenie. Wymaga komentarza przy mapie, inaczej ktoś je „uzupełni" w dobrej wierze.
- Każde przyszłe rozszerzenie mapy powodów odmowy przechodzi przez to samo pytanie: **czy ten powód opisuje coś, co właściciel karty może naprawić, czy coś, co dotyczy statusu karty jako takiej?** Drugi rodzaj zostaje nieujawniony.
- Decyzja dotyczy wyłącznie komunikatu dla kupującego. Pełny kod odmowy jest dostępny w panelu Stripe'a i tam pozostaje widoczny dla organizatora.

## Powiązania

- I18N-6 — pozycja backlogu, w ramach której reguła powstała
- `src/lib/stripe-errors.ts` — mapa powodów odmowy bez tych trzech kodów
- Wiki: `stripe-dwa-kody-bledu-i-granica-ujawniania` (scope: stack)
