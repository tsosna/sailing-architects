# ADR-031: Własna nieopłacona blokada ustępuje nowszemu wyborowi tego samego kupującego

- **Status:** przyjęta
- **Data:** 2026-08-28 (reguła ustalona 2026-08-16, wdrożona 2026-08-28)
- **Obszar:** sprzedaż | dostępność | płatności

## Kontekst

Wybór koi uruchamia blokadę na 15 minut i tworzy nieopłaconą rezerwację w Stripie. Kupujący, który po dojściu do ekranu płatności wracał dołożyć drugą koję, dostawał odmowę: **pierwsza koja była trzymana przez jego własną, nieopłaconą rezerwację**.

Koja nie pamięta właściciela blokady — tabela `berths` zna termin wygaśnięcia i identyfikator płatności, nie zna użytkownika. Reguła dostępności widziała wyłącznie status i termin, więc nie umiała odróżnić „zajęte przez kogoś" od „zajęte przez ciebie".

Zgłoszone przez Tomka 2026-08-16 z realnej ścieżki zakupu, nie z przeglądu kodu.

## Decyzja

**Nowszy wybór tego samego kupującego unieważnia jego wcześniejsze nieopłacone blokady — w granicach tego samego etapu rejsu.**

Trzy ograniczenia są częścią decyzji, nie szczegółem wykonania:

1. **Tylko własne.** Tożsamość pochodzi z sesji, nie z danych przysłanych przez przeglądarkę. Blokada innego człowieka jest nietykalna.
2. **Tylko ten sam etap.** Blokada na innym odcinku rejsu to osobny zakup w toku, o którego porzucenie nikt nie prosił.
3. **Tylko nieopłacone.** Rezerwacja opłacona nie jest zwalniana nigdy, nawet własna.

## Uzasadnienie

Alternatywą było utrzymanie blokady do wygaśnięcia i pokazanie kupującemu komunikatu „poczekaj 15 minut albo dokończ poprzednią płatność". Odrzucone: kupujący nie ma powodu rozumieć, że blokuje go jego własna, porzucona próba, a kwadrans czekania na własnym koszyku jest karą za zmianę zdania.

Rozpoznanie własnej blokady **w guardzie sprzedaży** też zostało odrzucone. Warstwa transakcyjna bazy nie rozmawia ze Stripe'em, więc stary PaymentIntent pozostałby płatny — dałoby się kupić tę samą koję dwa razy.

Stąd kolejność, która jest sednem tej decyzji: **najpierw anulowanie płatności w Stripie, dopiero potem zwolnienie koi w bazie**. Odmowa Stripe'a („nie mogę anulować, bo to już opłacone") jest jedynym sygnałem, że rezerwacja przestała być nieopłacona, zanim zdążyliśmy ją tak potraktować. Kolejność odwrotna zwalnia koję, która chwilę wcześniej została sprzedana.

Punkt 3 zapisano jako **listę statusów dopuszczalnych**, nie jako wykluczenie statusu opłaconego. Wykluczenie działa dziś i przepuściłoby po cichu każdy status dodany w przyszłości, a kosztem pomyłki jest anulowanie cudzych — albo własnych — opłaconych koi.

## Konsekwencje

- Kupujący może swobodnie wracać do wyboru koi i zmieniać zdanie. Ostatni wybór jest tym, który obowiązuje.
- Porzucona karta przeglądarki z formularzem płatności przestaje działać w momencie rozpoczęcia nowej płatności. Dostaje komunikat, że jest nieaktualna, i prośbę o odświeżenie — to świadomy koszt tej reguły.
- Blokady na innych etapach żyją dalej. Kupujący prowadzący dwa zakupy równolegle nie traci żadnego.
- Rezerwacja nieopłacona bez identyfikatora płatności zostałaby pominięta, a jej koje pozostałyby zablokowane do wygaśnięcia. Dziś taki rekord nie powstaje, bo rezerwacje tworzy wyłącznie ścieżka płatności.
- Reguła nie zastępuje wygaszania blokad przez zadanie cykliczne. Zwalnia blokady **aktywnie**, gdy kupujący wraca; wygasłymi nadal zajmuje się cron.

## Powiązania

- BUG-12 (wszystkie trzy warstwy), REFACTOR-8 (druga kopia widoku)
- SEC-8 — tożsamość z sesji była warunkiem wdrożenia tej reguły
- ADR-019 — koja z blokadą bez terminu wygaśnięcia
