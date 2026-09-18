# Zlecenie 01 — odmowa karty nie kończy rezerwacji

Data: 2026-09-08. Zleca: Tomek. ID: BUG-15. Baza: main b94caad; ponownie potwierdzony wspólny case payment_failed/canceled w webhooku. Handoff amarra 03.09 wspominał to zlecenie, ale pliku brakowało w bieżącym repo — niniejszy dokument formalizuje zakres.

## Problem

src/routes/api/stripe/webhook/+server.ts:204 obsługuje payment_intent.payment_failed i payment_intent.canceled tą samą gałęzią, wywołując cancelBookingPayments i cancelBooking. Odmowa pierwszej karty może zwolnić koje mimo możliwości ponowienia płatności. applyStripePayment traktuje pending/expired jako pierwszą płatność; cancelled może ominąć przypisanie miejsc po późniejszym sukcesie.

## Wymagany wynik

1. Rozdziel błąd próby karty od końca PI i anulowania rezerwacji. Odmowa nie zwalnia miejsc ani nie anuluje obowiązku raty. Zachowaj informację o nieudanej próbie bez niszczenia harmonogramu.
2. Retry tej samej płatności po odmowie ma prowadzić do prawidłowego rozliczenia i dokładnie jednego przypisania miejsc. Nie dodawaj cancelled do isFirstPayment bez kontroli dostępności i przyczyny zamknięcia.
3. Prześledź osobno pierwszą wpłatę, kolejne raty, faktyczne canceled, expiry, admin cancellation i refund. Canceled starego PI nie może anulować bieżącego zakupu. Istniejące reguły rat i zwrotów pozostają obowiązujące.
4. Potwierdź kompletny mechanizm wygaszania porzuconego checkoutu i uzgadniania PI. Nie kopiuj anulowania z amarra bez oceny wyścigów opisanych w jego zleceniu 04. Zewnętrzny timeout nie jest dowodem braku płatności.
5. Późny sukces po zamknięciu/zajęciu miejsc lub wpłata dla refunded ma trwały, deduplikowany zapis do rozpatrzenia. Nie przywracaj miejsc zajętych przez inną rezerwację; nie wykonuj automatycznego zwrotu.
6. Sprawdź idempotencję wznowienia checkoutu oraz korelację amount/currency/PI w istniejącym sailing. Dalsze defekty potwierdź testem i napraw w zakresie cyklu płatności albo wystaw odrębny blokujący follow-up. Ustalenia amarra nie są dowodem identycznego defektu sailing.

## Testy akceptacyjne

- Pierwsza karta odrzucona → booking nadal oczekuje i blokuje te same koje → druga poprawna karta → wpłata i miejsca przypisane raz.
- Odmowa kolejnej raty → rezerwacja potwierdzona i miejsca zachowane; rata możliwa do ponowienia.
- Porzucony checkout → kontrolowane expiry i uzgodnione PI; zasoby odzyskane bez pozostawienia niewidocznej wpłaty.
- Sukces podczas wygaszania oraz po przydzieleniu miejsc komuś innemu → brak oversellingu, trwały wyjątek jeśli realizacja niemożliwa.
- Duplikaty i success → późniejsze failed/canceled → brak cofnięcia opłaconego stanu lub powtórnych emaili.
- Canceled starego PI po nowej próbie; anulowanie administracyjne; refund → żadnego wskrzeszenia zamkniętej rezerwacji.
- Historia rat, sumy rozliczeń i istniejące testy refundów bez regresji. Nie maskuj problemu usunięciem całej obsługi błędów bez zastąpienia odpowiednim stanem próby.

Pliki startowe: webhook Stripe, src/convex/mutations.ts (cancelBookingPayments/cancelBooking/applyStripePayment), tworzenie checkoutu, crony i testy powiązane. Najpierw prześledź rzeczywisty graf wywołań.

## Sposób wykonania i dowód ukończenia

1. Przeczytaj aktualne AGENTS/CLAUDE, backlog, kod i Convex guidelines. Porównaj bieżący HEAD z bazą audytu; nie zakładaj, że wszystkie ustalenia nadal są aktualne.
2. Najpierw test odtwarzający sekwencję błędu, potem najmniejsza spójna naprawa i testy regresji. Wspólny model stanów ustala jeden prowadzący.
3. Testuj timeouty, duplikaty i kolejność zdarzeń deterministycznie na symulatorze; następnie Stripe test mode w odrębnym dev, bez danych klientów i wysyłki prawdziwych emaili.
4. Uruchom właściwe komendy z package.json: testy, pnpm check, pnpm lint i build; osobno weryfikuj backend. Zapisz dokładne komendy, wyniki i ograniczenia. Brak środowiska nie jest zaliczonym testem.
5. Drugi przegląd końcowego diffu i scenariuszy; jeśli samodzielny, jawnie zapisz brak niezależnego recenzenta. Zaktualizuj backlog i handoff dopiero według dowodów.
6. Dostarcz commit/PR, model przejść, testy, plan zgodności istniejących danych i odzyskania po awarii. Bez automatycznych refundów, produkcyjnego deploymentu ani modyfikacji historycznych wpłat. Najpierw raport rozbieżności do decyzji właściciela.

Status: **ready — zlecenie do wykonania, nie naprawa**. Priorytet P1 przed dalszą rzeczywistą sprzedażą dotkniętą defektem. W tej sesji wykonano wyłącznie odczyt statyczny i przygotowanie dokumentacji.
