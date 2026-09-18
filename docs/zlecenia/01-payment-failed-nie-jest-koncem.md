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


---

## Załącznik — wersja szczegółowa zlecenia z 2026-09-03 (wystawiona z amarry)

> Dopisane 2026-09-18 przy audycie: ta wersja leżała nieśledzona w głównym checkoucie macMini i została zastąpiona przez plik z 08.09. Nagłówek z 08.09 jest kanoniczny; poniżej szczegóły techniczne (sekcje A–D, testy, smoke), których tam brakuje.

> Data wystawienia: 2026-09-03. Wystawione **z projektu amarra**, gdzie ten sam defekt został znaleziony w audycie, naprawiony i potwierdzony na żywym przejściu przez Stripe'a (kartą testową, w dwie minuty).
> Źródło: `../amarra/docs/audyt-t2-2026-09-03.md` (BUG-2) oraz `../amarra/docs/zlecenia/03-pending-payment-lifecycle.md`. Poprawka w amarze: gałąź `claude/pending-payment-lifecycle-0342d1`, [tsosna/amarra#2](https://github.com/tsosna/amarra/pull/2).
> Kontekst przed pracą: `CLAUDE.md`, `docs/handoff.md`, `docs/backlog.md`.
> Backlog: pozycja jeszcze nie założona. Następny wolny identyfikator to **BUG-15**.

### Wada

`src/routes/api/stripe/webhook/+server.ts:204` skleja dwa zdarzenia w jeden przypadek:

```ts
case 'payment_intent.payment_failed':
case 'payment_intent.canceled':
    await convex.mutation(internal.mutations.cancelBookingPayments, { … })
    await convex.mutation(internal.mutations.cancelBooking, { … })
```

`payment_intent.payment_failed` opisuje **próbę**, nie koniec. Po odrzuconej karcie PaymentIntent wraca do `requires_payment_method` i **pozostaje ważny** — klient poprawia dane na tym samym intencie i płaci. Stripe wysyła to zdarzenie przy **każdej** odrzuconej próbie. Jedynym zdarzeniem terminalnym jest `payment_intent.canceled`.

### Dlaczego to boli akurat tutaj

`cancelBooking` (`src/convex/mutations.ts:1260`) wychodzi wcześniej tylko dla `status === 'confirmed'`. Przy pierwszym checkoucie rezerwacja jest `pending`, więc odrzucona karta:

1. zwalnia miejsca (`status: 'available'`, `holdPaymentIntentId` skasowane),
2. ustawia rezerwację na `cancelled`.

Potem klient poprawia kartę i płaci. `applyStripePayment` (`mutations.ts:595`) liczy `isFirstPayment` jako `status === 'pending' || status === 'expired'` — dla `cancelled` to **fałsz**. Więc:

- miejsca **nie** zostają z powrotem zajęte,
- rezerwacja zostaje `cancelled`,
- wiersze `bookingPayments` idą na `paid`, `refreshBookingPaymentTotals` przelicza sumy.

**Stripe ma pieniądze, klient nie ma rezerwacji, a system nie zgłasza niczego.** Cicho, bez wyjątku, bez logu. Odtworzenie: checkout, karta `4000 0000 0000 0002`, potem `4242 4242 4242 4242` na tym samym ekranie.

Raty są nietknięte tym scenariuszem (rezerwacja jest wtedy `confirmed`, `cancelBooking` wychodzi wcześniej) — i **muszą takie zostać**. To jest główne ryzyko regresji w tym zleceniu.

### Zakres

### A. Rozdzielić oba zdarzenia (rdzeń)

`payment_failed` przestaje zamykać rezerwację. Zostaje przy nim wyłącznie odnotowanie nieudanej próby (`cancelBookingPayments` przestawia wiersze `processing` → `failed`, co jest faktem o próbie i jest w porządku). `cancelBooking` zostaje **tylko** przy `payment_intent.canceled`.

Nad `switch` komentarz z powodem — inaczej ktoś to za pół roku „naprawi" z powrotem.

### B. Głośny sygnał, gdy pieniądze trafiają na zamkniętą rezerwację

Dziś `applyStripePayment` przy `status === 'cancelled'` po prostu nie wchodzi w `isFirstPayment` i milczy. Ma zostać `console.error` z `bookingRef`, identyfikatorem PaymentIntentu i kwotą — to jest sygnał do ręcznego zwrotu. Statusu **nie** cofać: miejsca mogły już pójść komuś innemu.

W amarze ta ścieżka zwraca `{ status: 'paid_after_close' }` i loguje; tu wystarczy log, bo wynik webhooka i tak nie jest konsumowany w ten sposób.

### C. Do rozważenia w tym samym przejściu (rekomendowane, osobny commit)

`expireCheckoutHolds` (`mutations.ts:1311`) zwalnia miejsca i ustawia `expired`, ale **nie anuluje PaymentIntentu** w Stripie. Klient, który stoi przy formularzu dłużej niż hold, nadal może zapłacić. Wtedy `isFirstPayment` jest prawdą (`expired` jest na liście) i kod próbuje odzyskać miejsca: bierze je, jeśli są wolne, a jeśli ktoś je zajął — **rzuca** `Booking berths are no longer available`. Wyjątek w handlerze webhooka znaczy dla Stripe'a „dostarcz ponownie", więc zdarzenie będzie wracać trzy dni, a operator nie dostanie z tego nic użytecznego.

Kierunek jak w amarze: przy wygaszaniu holdu zaplanować akcję anulującą PaymentIntent (`stripe.paymentIntents.cancel`), planowaną **z tej samej mutacji** — planowanie z mutacji jest w Convexie transakcyjne, więc nie ma wygaszonej rezerwacji z żywym intentem. Błędy Stripe'a o intencie w stanie terminalnym łapać i logować (ponowienie nic nie zmieni), inne rzucać.

**Uwaga, na której amarra się przewróciła podczas weryfikacji:** anulowanie intentu **wraca webhookiem** jako `payment_intent.canceled`, więc `cancelBooking` przepisze świeże `expired` na `cancelled` i zgubi różnicę między „skończył się czas" a „płatność anulowana". Jeśli robisz C, dodaj do `cancelBooking` wyjście wcześniejsze dla statusów końcowych (`confirmed`, `expired`, `cancelled`), nie tylko dla `confirmed`.

### D. Poza zakresem

Zwroty, e-maile, PDF, panel admina, plany ratalne. Nie ruszać.

### Testy

W tym repo nie ma `convex-test` — testy vitest siedzą w `src/convex/_lib/*.test.ts` i są czystą logiką. Zgodnie z tym wzorcem: wyciągnąć decyzję „czy to zdarzenie zamyka rezerwację" do funkcji w `_lib` i pokryć ją testem (`payment_failed` → nie zamyka; `canceled` → zamyka), zamiast testować sam handler HTTP.

Jeśli uznasz, że to sztuczne — napisz w handoffie dlaczego i zostaw sam smoke test z sekcji niżej. Nie udawaj pokrycia.

### Weryfikacja

1. `pnpm check`, `pnpm lint`, `pnpm test` zielone.
2. **Smoke test na dev, ręcznie** (dokładnie ten, który w amarze wykrył wadę i potwierdził poprawkę):
   - checkout → karta `4000 0000 0000 0002` → komunikat o odrzuceniu, **rezerwacja nadal `pending`** (sprawdzić w bazie w tym momencie — to jest istota tej poprawki), miejsca nadal `held`;
   - ta sama strona, karta `4242 4242 4242 4242` → rezerwacja `confirmed`, miejsca `taken`, jeden PaymentIntent `succeeded` w Stripie.
3. Jeśli robisz C: wejść w checkout, zamknąć kartę przeglądarki, po upływie holdu sprawdzić, że rezerwacja jest `expired` (**nie** `cancelled`), miejsca wolne, a PaymentIntent w Stripie `canceled`.
4. Typecheck Convexa własnym przebiegiem (`npx convex dev`) — `pnpm check` go nie zastępuje.

### Na koniec

Commity wg `knowledge-vault/wiki/procedures/commit-message-recipe.md`. Wpis do `docs/backlog.md` jako **BUG-15** (od razu skreślony z datą, jeśli domknięty) i wpis do `docs/handoff.md`.

Wiedza ogólna z tej sprawy jest już w vaulcie — przeczytaj przed pracą, nie odtwarzaj od zera:

- „zdarzenie próby vs. zdarzenie końca" w webhookach płatności,
- `copied-pattern-carries-its-reason` — ten defekt przyjechał do amarry razem z kopiowanym wzorcem z tego repo; kopiowanie idzie w obie strony.
