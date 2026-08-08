# ADR-020: Pełny zwrot zamyka niezapłacone raty, częściowy ich nie rusza

- **Status:** przyjęta
- **Data:** 2026-08-06
- **Obszar:** płatności | zwroty | komunikacja z klientem

## Kontekst

Rezerwacja opłacana ratalnie ma w bazie wiersze `bookingPayments` — po jednym na pozycję planu płatności. Zwrot pieniędzy zmieniał dotąd wyłącznie: kwotę zwróconą na opłaconej racie, status płatności rezerwacji (`refunded` albo `partially_refunded`) oraz — opcjonalnie, gdy administrator tak zaznaczył — stan koi.

Statusu pozostałych rat nie zmieniał nic. Rata niezapłacona zostawała `pending` ze swoim pierwotnym terminem, więc dzienny cron przestawiał ją na `overdue`, a crony mailowe wyławiały ją jako zaległość. W lipcu 2026 wysłało to serię wezwań do zapłaty do rezerwacji, których pieniądze zostały już zwrócone (BUG-8; jeden wiersz zebrał pięć monitów, czyli osiągnął limit serii).

Obrona była dokładana u odbiorców — trzy niezależne miejsca odfiltrowywały takie wiersze u siebie. Ta obrona miała dziurę: opierała się na predykacie „rezerwacja zamknięta", który wymaga **równocześnie** zwróconych pieniędzy i zwolnionych koi. Zwolnienie koi jest osobną decyzją administratora podejmowaną kliknięciem w panelu. Pełny zwrot bez zaznaczenia tego pola nie spełniał predykatu i monity szły dalej.

Przy okazji naprawy pojawiło się pytanie, na które kod nie miał odpowiedzi: co znaczy zwrot **częściowy**.

## Decyzja

1. **Pełny zwrot zamyka rezerwację finansowo.** W momencie, w którym status płatności rezerwacji staje się `refunded`, wszystkie jej raty inne niż opłacone dostają status `cancelled`. Rezerwacja przestaje generować należności.

   **Uzupełnienie 2026-08-08 — rata w stanie `processing` jest wyjątkiem.** Rata, dla której Stripe jeszcze nie potwierdził wyniku płatności, nie dostaje `cancelled`. Powód: o wyniku takiej raty rozstrzygają pieniądze w drodze przez Stripe, nie stan bazy w Convex — etykieta w bazie nie zatrzymuje transferu, który już się dzieje. Zasada dobiera się do decyzji z punktu 3: to nie administrator ani reguła aplikacji rozstrzyga o tej racie, tylko zdarzenie zewnętrzne, którego jeszcze nie ma. Rata `processing` zostaje nietknięta i rozstrzyga się sama poprzez webhook `payment_intent.succeeded` (→ `paid`) na normalnej ścieżce. Implementacja: predykat `shouldCancelPaymentAfterFullRefund` w [`_lib/refundCancellation.ts`](../../src/convex/_lib/refundCancellation.ts), lista pozytywna trzech statusów (`pending`, `overdue`, `failed`) — wybrana świadomie zamiast listy negatywnej, żeby siódmy status dodany do schematu w przyszłości domyślnie **nie** był anulowany.

2. **Zwrot częściowy jest korektą, nie wyjściem z rejsu.** Przy statusie `partially_refunded` raty pozostają nietknięte, rezerwacja żyje, żeglarz płynie, a monity o pozostałe raty chodzą normalnie.

3. **Decyzja nie zależy od stanu koi.** To, czy administrator zwolnił miejsca, jest odpowiedzią na pytanie „czy koja jest znów do sprzedania" i nie ma wpływu na pytanie „czy mamy się upominać o pieniądze". Wezwanie do zapłaty wysłane osobie, której oddano pieniądze, nie może zależeć od tego, czy ktoś zaznaczył pole w panelu.

4. **Obniżenie ceny istniejącej rezerwacji nie jest zwrotem.** Zwrot oddaje pieniądze pobrane i technicznie może dotyczyć wyłącznie rat już opłaconych. Nie zmienia kwoty rat przyszłych. Jeżeli intencją jest „ten klient płaci mniej", potrzebne jest osobne narzędzie — dziś nie istnieje (backlog: RABAT jako brakująca encja).

## Uzasadnienie

**Pieniądze oddane znoszą roszczenie.** Po pełnym zwrocie nie ma tytułu do żądania dopłaty — wysłanie monitu jest wtedy nie tylko błędem technicznym, ale komunikatem sprzecznym z tym, co faktycznie zaszło między stronami.

**Koszty dwóch możliwych pomyłek są nierówne.** Zamknięcie rat rezerwacji, która wciąż powinna płacić, kosztuje brak przypomnienia — administrator widzi stan w panelu i może zareagować ręcznie. Wysłanie wezwania do zapłaty do osoby, której oddano pieniądze, kosztuje zaufanie klienta i wymaga tłumaczenia się; przy powtórzeniu serii pięciu monitów wygląda jak windykacja nienależnego długu.

**Częściowy zwrot ma inny sens biznesowy niż pełny.** Michał używa go, gdy coś skorygował — pomyłkę w kwocie, ustaloną indywidualnie zniżkę, rozliczenie różnicy. Rezerwacja zostaje, miejsce zostaje, rejs się odbędzie. Traktowanie takiego zwrotu jak wyjścia z rejsu odebrałoby należność za usługę, która nadal ma być wykonana.

**Reguła musi być zapisywalna w danych.** Rozważany wariant „monituj o różnicę po częściowym zwrocie" nie miał wierszy, na których mógłby stanąć: zwrot dotyczy rat opłaconych, monit dotyczy rat niezapłaconych, a te zbiory są rozłączne. Potrzeba stojąca za tym pomysłem jest prawdziwa, ale realizuje ją zmiana kwoty raty, nie zwrot.

## Konsekwencje

- Reguła żyje w jednym miejscu — w funkcji przetwarzającej zwrot (`processStripeRefund` w `src/convex/mutations.ts`), czyli tam, gdzie powstaje status `refunded`. To jedyny writer tej wartości.
- Wiersze zapisane przed wdrożeniem reguły zostały poprawione jednorazową migracją (`cancelPaymentsOfRefundedBookings`), uruchomioną na dev i na produkcji 2026-08-06. Na produkcji dotyczyła ośmiu rat w trzech rezerwacjach.
- Obrona u odbiorców (predykat „rezerwacja zamknięta" w cronach mailowych) **zostaje**, mimo że po tej zmianie jest praktycznie nieosiągalna. Powód: koszt jej utrzymania to dwa odczyty dokumentów w cronie chodzącym raz dziennie, a koszt błędnego usunięcia to wezwanie do zapłaty wysłane do klienta po zwrocie. Zapisane świadomie, żeby nie wyglądało na przeoczenie.
- Zwrot częściowy, który w intencji Michała ma jednak oznaczać rezygnację z rejsu, wymaga osobnego działania administratora (anulowanie rezerwacji). System nie zgadnie intencji z samej kwoty.
- Reguła nie obejmuje zwrotów wykonanych bezpośrednio w panelu Stripe z pominięciem aplikacji — takie zdarzenia nie ustawiają statusu płatności rezerwacji i trafiają do osobnej kolejki nieobsłużonych zdarzeń (FEAT-4).
- **Ryzyko odkryte 2026-08-08, nienaprawione — BUG-9.** Zostawienie raty `processing` nietkniętą (punkt 1, uzupełnienie) zamyka jeden problem (przedwczesne kasowanie), ale nie zamyka drugiego: jeśli webhook `payment_intent.succeeded` dla tej raty dojdzie **po** tym, jak zwrot ustawił `paymentStatus: 'refunded'`, `applyStripePayment` bezwarunkowo wywołuje `refreshBookingPaymentTotals`, która liczy `paymentStatus` funkcją nieznającą pojęcia zwrotu (`bookingPaymentStatus`, zwraca wyłącznie `unpaid | deposit_paid | partially_paid | paid`) i **nadpisuje `refunded`**. Szczegóły w backlogu.

## Powiązane

- ADR-007 — definicja rezerwacji zamkniętej (predykat pieniądze + koje)
- ADR-005 — zwolnienie koi jako wybór administratora
- ADR-017 — semantyka rodzajów pozycji płatności
