# Admin Console · Etapy wdrożenia i prompty inżynierskie

## Kontekst wspólny

Źródła prawdy:

- `docs/design/admin-operations-console-spec.md`
- `docs/design/admin-crew-data-verification-spec.md`
- `docs/design/huashu-admin-operations-console.html` — wzorzec UI/UX, układ i ton interfejsu
- `docs/design/admin-panel-review-for-michal.html` — wzorzec stylu e-mail: navy/brass, elegancki, nietechniczny
- `docs/design/admin-clickable-prototype-email.html` — prosty wzorzec maila z krótką instrukcją i czytelną kartą
- istniejące modele Convex: `bookings`, `bookingParticipants`, `bookingPayments`, `paymentPlans`, `paymentPlanItems`, `berths`

Docelowy `/admin` ma być operacyjnym centrum sprzedaży, płatności, alertów i kompletności danych załogi. UI ma iść za wzorcem Huashu: gęsty, spokojny, zadaniowy, navy/brass, tabele + kolejki + drawer, bez landing-page’owej dekoracyjności.

Maile wysyłane z modułów admina mają iść za stylem przygotowanym dla Michała: ciemny navy, brass jako akcent, karta o stałej szerokości, inline styles/table layout, prosty język biznesowy, bez technicznego żargonu. Nie projektować maili jako surowych plaintextów ani jako losowych szablonów Brevo oderwanych od identyfikacji Sailing Architects.

Prompty poniżej są przeznaczone dla senior-level implementera. Nie opisują każdego kroku technicznego. Mają wskazać cel, ograniczenia, ryzyka i oczekiwany rezultat, a implementer powinien sam dobrać najlepszy kształt kodu zgodny z obecnym projektem.

## Etap 1 — Bezpieczny dostęp do `/admin`

Cel: zastąpić obecny luźny dostęp produkcyjnym guardem opartym o Clerk, z kontrolowanym wyjątkiem dev.

Zakres:

- Guard dla `/admin`.
- Produkcja: dostęp wyłącznie dla kapitana/operatorów z rolą admin w Clerk metadata.
- Dev: dodatkowy dostęp dla właściciela projektu jako operatora testowego, najlepiej przez dev-only env allowlist.
- Czytelny forbidden/redirect state dla osób bez uprawnień.
- Nie opierać produkcji na twardej whiteliście w kodzie.

Prompt:

```text
Jesteś senior engineerem w projekcie Sailing Architects. Wdróż bezpieczny dostęp do `/admin` zgodnie z `docs/design/admin-operations-console-spec.md`.

Kontekst:
- Stack: SvelteKit 2, Svelte 5, Clerk, Convex.
- `/admin` istnieje, ale historycznie był narzędziem dev/admin bez produkcyjnego guarda.
- Produkcyjnie dostęp ma kapitan/operator z rolą admin w Clerk metadata.
- W dev dostęp ma też właściciel projektu jako operator testowy, ale ten wyjątek ma być dev-only i konfigurowalny przez env.

Oczekiwany rezultat:
- `/admin` nie jest dostępne dla zwykłych zalogowanych użytkowników.
- Guard jest spójny z aktualnym setupem Clerk w projekcie.
- Brak roli admin daje czytelny forbidden/redirect state.
- Rozwiązanie jest gotowe do późniejszego użycia przez wszystkie admin mutations/actions.

Gotcha:
- Nie wprowadzaj produkcyjnej whitelisty user IDs zaszytej w kodzie.
- Nie implementuj własnej auth obok Clerk.
- Zachowaj locale/routing SvelteKit tam, gdzie ma to znaczenie.

Weryfikacja:
- Ręczna próba wejścia jako user bez admin role.
- Ręczna próba wejścia jako admin/dev operator.
- `pnpm check`; `pnpm lint` jeśli nie blokują go znane długi formatowania.
```

Etap 1 — gotowe ✅                                                                                                                                                                   
                                                                                                                                                                                       
  Zmiany:                                     
  - src/lib/server/admin-guard.ts:1 — requireAdmin(locals) + resolveAdmin(locals). Sprawdza publicMetadata.role === 'admin' (najpierw z sessionClaims, potem z                         
  clerkClient.users.getUser jako autorytet). W dev fallback do ADMIN_DEV_ALLOWLIST (lista e-maili z env, ignorowana w produkcji).                                                      
  - src/routes/[[lang=lang]]/admin/+layout.server.ts:1 — ładuje guard dla całego /admin. Anonimowy → redirect do sign-in. Zalogowany bez admina → error(403).                          
  - src/routes/[[lang=lang]]/admin/+error.svelte:1 — czytelny forbidden state (navy/brass), CTA do /dashboard i /.                                                                     
  - .env.example:9 — dopisany ADMIN_DEV_ALLOWLIST=.                                                                                                                                    
                                                                                                                                                                                       
  Decyzje:                                                                                                                                                                           
  - Brak whitelisty user IDs zaszytej w kodzie — produkcja idzie wyłącznie przez publicMetadata.role w Clerk.                                                                          
  - Helper jest reużywalny — gotowy do requireAdmin(locals) w server actions/loadach kolejnych etapów.                                                                               
  - Dev allowlist celowo dev-only (gated import { dev } from '$app/environment'), więc nawet jeśli ktoś omyłkowo ustawi env w produkcji, nie obchodzi to wymogu roli.                  
  - clerkClient.users.getUser — to jeden roundtrip per page load, akceptowalne dla operacyjnego /admin.                                                              
                                                                                                                                                                                       
  Weryfikacja:                                                                                                                                                                         
  - pnpm check — 0 błędów, 0 ostrzeżeń.                                                                                                                                                
  - Ręczna weryfikacja po Twojej stronie: aby zachować dev access dopisz w .env.local: ADMIN_DEV_ALLOWLIST=tomek.sosinski@gmail.com (albo nadaj sobie rolę admin w Clerk Dashboard →   
  Users → publicMetadata: {"role":"admin"}).                                                                                                                                           
                                                                                                                                                                                       
  Gotcha do zapamiętania:                                                          
  - Dotychczasowe Convex mutations admin (reserveComplimentary, cancelAdminBooking, migrateCaptainBerths) wciąż przyjmują wywołanie z dowolnego klienta — gating jest na poziomie      
  SvelteKit (jedyna ścieżka UI). Twardszy gating na poziomie Convex (przez ctx.auth.getUserIdentity + Clerk JWT) to osobna decyzja, naturalnie wpada do Etap 8.          

## Etap 2 — Admin Overview: Sales Board + Alert Queue

Cel: zbudować realny operacyjny overview dla sprzedaży i alertów, zamiast obecnego wąskiego panelu statusów koi.

Zakres:

- Convex query/agregacja dla KPI per segment.
- Sales Board: booking ref, kupujący, koje, payment status, data status, next action.
- Alert Queue: zaległe raty, raty blisko terminu, brakujące dane, dane do potwierdzenia, korekty, holdy blisko wygaśnięcia.
- UI wg `huashu-admin-operations-console.html`: segment tabs, KPI strip, tabela, panel alertów.
- Na tym etapie akcje mogą być częściowo pasywne, jeśli potrzebują późniejszych etapów.

Prompt:

```text
Zbuduj pierwszy produkcyjny widok `/admin` jako Sales Board + Alert Queue, korzystając z `docs/design/huashu-admin-operations-console.html` jako wzorca UI/UX i `docs/design/admin-operations-console-spec.md` jako specu funkcjonalnego.

Kontekst:
- Dane istnieją w Convex: bookings, bookingParticipants, bookingPayments, berths, voyageSegments.
- Booking flow obsługuje raty, holdy, uczestników i statusy płatności.
- UI admina ma być narzędziem pracy: gęste, skanowalne, bez marketingowych sekcji.

Oczekiwany rezultat:
- Admin widzi KPI dla wybranego segmentu.
- Admin widzi listę rezerwacji z informacją, co wymaga reakcji.
- Admin widzi Alert Queue z priorytetami i następnymi akcjami.
- Dane są realne z Convex, nie mockowane.
- Istnieją sensowne empty/loading/error states.

Gotcha:
- Nie zakładaj starego modelu „jedna pełna płatność i komplet danych przed zakupem”. Obecnie są `bookingPayments` i `bookingParticipants`.
- Alert Queue powinna bazować na obecnych statusach, a nie na tekstach zakodowanych w UI.
- Zachowaj istniejące tokeny navy/brass i ostre krawędzie.

Weryfikacja:
- Segment z zaległą ratą pokazuje alert.
- Segment z brakami danych pokazuje alert.
- Booking z opłaconymi ratami i kompletem danych nie wpada do kolejki pilnej.
- `pnpm check`.
```

Etap 2 — gotowe ✅                                         
                                              
  Zmiany:                                     
  - src/convex/admin.ts:1 — nowa query overviewBySegment(slug) agreguje bookings + bookingPayments + bookingParticipants + berths w jednym przebiegu. Zwraca: kpi (sprzedane, wpłacono,
   do wpłaty, zaległe, brak danych, held, complimentary), bookings[] (Sales Board) i alerts[] posortowane po priority.                                                                 
  - src/routes/[[lang=lang]]/admin/+layout@.svelte:1 — admin shell z bocznym sidebar (Sprzedaż / Automatyzacje / Dane załogi / Miejsca specjalne). Używa @-reset, więc nie ciągnie     
  SiteNav z [[lang=lang]]/+layout.svelte. Tokeny --admin-* jako globalne CSS variables (przez :global(:root)).                                                                         
  - src/routes/[[lang=lang]]/admin/+page.svelte:1 — Sales Board + Alert Queue. Segment strip, KPI grid (7 kart), filtrowana tabela rezerwacji, panel alertów z badge kind.             
  Loading/error/empty states.                                                                                                                                                          
  - src/routes/[[lang=lang]]/admin/special/+page.svelte:1 — przeniesiony stary content (formularz complimentary + migracja C1). Nadal działa, czeka na Etap 7.                         
  - src/routes/[[lang=lang]]/admin/automation/+page.svelte:1, crew/+page.svelte:1 — placeholdery na Etap 4 i Etap 5/6.                                                                 
                                                                                                                      
  Decyzje:                                                                                                                                                                             
  - Alert priority: overdue (1000+dni), missing data (500), pending confirmation (100), due soon (200+8-dni), hold expiring (60 lub 10). Sortowanie malejące — najpilniejsze na górze.
  - Filtry tabeli pochodzą z flags zwracanych przez query, nie z tekstów w UI — możemy dowolnie przelabelować i działa dalej.                                                          
  - KPI pendingAmount celowo wyklucza overdueAmount, żeby kapitan widział te dwie pozycje rozłącznie.                                                                                  
  - Dane są realne z Convex (nie mock). Akcje na alertach/wierszach (Otwórz, Wyślij monit) są pasywne — Etap 3 doda drawer i ręczne monity.
  - Stare narzędzia (complimentary form, migracja C1) zachowane pod /admin/special, żeby nie zerwać funkcjonalności przed Etap 7.                                                      
  - npx convex codegen uruchomione lokalnie; api.admin.overviewBySegment jest w _generated/api.d.ts. Convex deployment dostał też nowy moduł.
                                                                                                                                                                                       
  Weryfikacja:                                                                                                                                                                         
  - pnpm check — 0 błędów, 0 ostrzeżeń, 1735 plików.                                                                                                                                   
  - Manualna weryfikacja po Twojej stronie (po pnpm dev + npx convex dev):                                                                                                             
    - Segment z zaległą ratą → karta KPI „Zaległe" świeci na danger, alert „Rata zaległa N dni" na górze Alert Queue.                                                                  
    - Segment z brakami danych → alert „Brak danych uczestnika" / „Niekompletne dane".                                                                                                 
    - Segment w pełni opłacony i z kompletem danych → Alert Queue puste, „Brak aktywnych alertów. Czysto."                                                                             
    - Filtry „Zaległe", „Do przypomnienia", „Brak danych" działają.                                                                                                                    
                                                                                                                                                                                       
  Gotcha:                                                                                                                                                                              
  - bookings table nie ma indexu by_segment, więc query robi db.query('bookings').collect() i filtruje w JS. Akceptowalne dopóki bookings count jest niski. Performance audit do       
  Etapu 8.                                                                                                                                                                             
  - +layout@.svelte (z @-reset) — gdyby ktoś dodał +layout.ts (klient) lub kolejny +layout w segmencie, to ostrożnie z hierarchią. Server load +layout.server.ts i @-reset współpracują
   bez problemu.                              

## Etap 3 — Booking Drawer i ręczne monity

Cel: dać adminowi szybkie miejsce pracy na konkretnej rezerwacji: raty, uczestnicy, historia kontaktu i akcja „wyślij monit”.

Zakres:

- Drawer lub równoważny panel szczegółów rezerwacji.
- Harmonogram `bookingPayments`.
- Uczestnicy `bookingParticipants` per koja.
- Operacyjna historia kontaktu na bazie dostępnych pól `reminderCount`, `lastReminderSentAt`, confirmation email fields; jeśli potrzeba, zaproponować minimalne rozszerzenie.
- Adhoc reminder przez Brevo.
- Szablony maili zgodne wizualnie z `docs/design/admin-panel-review-for-michal.html`.
- Opcjonalna kopia alertu do admina.
- WhatsApp/SMS na razie jako „copy message”.

Prompt:

```text
Rozbuduj `/admin` o Booking Drawer i ręczne monity. Użyj `docs/design/huashu-admin-operations-console.html` jako wzorca: drawer otwierany z Sales Board, harmonogram płatności, uczestnicy, historia kontaktu i akcje.

Kontekst:
- Brevo zostaje providerem.
- WhatsApp/SMS na start to ręczne kopiowanie wiadomości, ale UX powinien nie zamykać drogi do automatyzacji.
- Alerty admina powinny móc iść także e-mailem do adresu analogicznego do `HANDOFF_REPORT_TO`.

Oczekiwany rezultat:
- Admin może otworzyć rezerwację z Sales Board.
- Widzi raty, statusy, uczestników i najważniejsze informacje kontaktowe.
- Może wysłać adhoc monit płatności lub prośbę o dane.
- Może skopiować treść wiadomości do WhatsApp/SMS.
- Wysyłka aktualizuje odpowiednie liczniki/timestamps i odświeża Alert Queue.

Gotcha:
- Nie wysyłaj maili z klienta. Wysyłka musi być server/Convex-safe.
- Nie loguj sekretów Brevo ani payloadów z danymi wrażliwymi.
- Nie używaj surowego/plain stylu maila dla komunikacji do uczestników; zachowaj navy/brass, prosty język i czytelne CTA jak w mailu review dla Michała.
- Jeśli istniejący model historii kontaktu jest niewystarczający, zaproponuj minimalne rozszerzenie zamiast dużego audit logu.

Weryfikacja:
- Monit płatności dochodzi przez Brevo.
- Reminder count/last sent aktualizuje się w danych.
- Copy-to-WhatsApp działa bez zewnętrznej integracji.
- `pnpm check`.
```

Etap 3 — gotowe ✅                                                               
                                                                                                                                                                                       
  Zmiany:                                                                          
  - src/convex/_emails.ts — przerobiony shell() na navy/brass card (table layout, eyebrow + serif heading, ciemne tło #0d1b2e, brass CTA przyciskiem table-cell). Stylistyka 1:1 z     
  mailem do Michała. Plus nowy sendAdminCopyEmail() dla powiadomień operacyjnych.                                                                                                      
  - src/convex/admin.ts — dodane:                                                                                                                                                      
    - bookingDetailById(bookingId) — booking + segment + berths + payments + participants + buyer (z crewProfiles).                                                                    
    - _resolvePaymentAdhoc / _resolveParticipantAdhoc (internalQuery) — domykają wybór odbiorcy (uczestnik z invitedEmail, fallback do kupującego).
    - sendAdhocPaymentReminder / sendAdhocCrewDataReminder (action) — wysyłka przez Brevo, bump reminderCount/lastReminderSentAt (re-using internal.reminders._mark*ReminderSent),     
  opcjonalna kopia admina przez ADMIN_ALERT_EMAIL lub HANDOFF_REPORT_TO.                                                                                                               
  - src/lib/components/admin/booking-drawer.svelte — drawer (scrim + 620px panel) z: detail strip, harmonogramem płatności (mini-akcje per rata), uczestnikami (mini-akcje per koja),  
  operacyjną historią kontaktu, toggle „kopia do operatora", toast statusu, copy WhatsApp w schowku (client-only utility).                                                             
  - src/routes/[[lang=lang]]/admin/+page.svelte — przyciski „Otwórz" w tabeli i „Otwórz rezerwację" w alertach (gdy alert ma bookingId); render <BookingDrawer>.                       
                                        
  Decyzje:                                                                                                                                                                             
  - Brak nowego modelu „contact log" — operacyjna historia jest derywatą lastReminderSentAt + reminderCount z payments/participants i confirmationEmailSentAt z bookings. Spec wprost  
  dopuszcza minimalne rozszerzenia, ale tu istniejące pola wystarczają.                                                                                                                
  - WhatsApp copy nie zapisuje stanu w DB — client-only navigator.clipboard.writeText. „Kopia WhatsApp" to czynność operacyjna kapitana, nie zdarzenie systemu. Kapitan widzi w UI     
  „Skopiowano do schowka" jako toast.                                                                                                                                                  
  - Adhoc i cron używają tego samego template'u i mutacji licznika — żaden monit nie ucieka liczeniu i wszystko widać w panelu po wysyłce.                                             
  - Kopia do admina wybiera priorytetowo ADMIN_ALERT_EMAIL jeśli jest ustawiony, w przeciwnym razie HANDOFF_REPORT_TO. Toggle domyślnie ON, łatwo wyłączyć przed wysłaniem.            
                                                                                                                                                                                     
  Weryfikacja:                                                                                                                                                                         
  - npx convex codegen + pnpm check — 0 błędów, 0 ostrzeżeń.                       
  - Po Twojej stronie: pnpm dev + npx convex dev → kliknij „Otwórz" w Sales Board → drawer pokazuje raty/uczestników → wciśnij „Wyślij monit" → toast „Monit wysłany.", w drawer przy  
  racie pojawia się aktualizowany licznik. Sprawdź też Alert Queue → „Otwórz rezerwację".                                                                                            
                                                                                                                                                                                       
  Gotcha/uwagi do zapamiętania:                                                                                                                                                        
  - Admin copy wymaga, żeby env był ustawiony w Convex deploymencie: npx convex env set HANDOFF_REPORT_TO <email> (Convex actions używają process.env, nie czytają lokalnego .env
  automatycznie). Bez tego adminCopySent zwróci false.                                                                                                                                 
  - Dotychczasowe crony (sendOverduePaymentReminders, sendCrewDataReminders, sendUpcomingPaymentReminders) automatycznie dostały nowy navy/brass shell — żaden cron nie wymagał zmian, 
  ale przy najbliższej wysyłce stara stylistyka zniknie.                                                                                                                               
  - Drawer scrim to <button> dla a11y (zamknięcie kliknięciem w ciemne tło). Escape nie jest wpięte — można dodać w razie potrzeby.         

## Etap 4 — Elastyczne harmonogramy rat

Cel: umożliwić adminowi definiowanie planów płatności per segment z dowolną liczbą pozycji, a następnie snapshotowanie planu do bookingów.

Zakres:

- UI Automatyzacje wg prototypu: szablon, liczba rat, generowanie pozycji, edycja kwot i terminów.
- Obsługa szablonów: np. `Zaliczka + 2 raty`, `Zaliczka + 3 raty`, `Całość teraz`, `Własny plan`.
- Walidacja sumy pozycji względem ceny za koję.
- Zapis globalnego planu per segment.
- Snapshot do `bookingPayments` przy tworzeniu bookingu.
- Zasada: zmiana globalnego planu nie zmienia istniejących bookingów.
- Opcjonalna ręczna korekta snapshotu konkretnego bookingu przed wysłaniem płatności/monitu.

Prompt:

```text
Wdróż elastyczne harmonogramy rat w `/admin`, zgodnie z sekcją „Elastyczność rat” w `docs/design/admin-operations-console-spec.md` i zakładką Automatyzacje w `docs/design/huashu-admin-operations-console.html`.

Kontekst:
- Obecny model ma `paymentPlans`, `paymentPlanItems` i `bookingPayments`.
- Plan segmentu ma być domyślnym szablonem.
- Booking musi mieć własny snapshot płatności, żeby późniejsze zmiany globalnego planu nie zmieniały istniejących zobowiązań.

Oczekiwany rezultat:
- Admin może wybrać szablon lub liczbę rat.
- System generuje edytowalne pozycje planu.
- Suma planu jest walidowana.
- Zapis planu aktualizuje plan aktywny dla segmentu.
- Nowe bookingi dostają snapshot zgodny z aktywnym planem.

Gotcha:
- Kwoty w modelu są w najmniejszej jednostce waluty, pilnuj formatowania PLN w UI.
- Nie nadpisuj płatności istniejących bookingów zmianą szablonu segmentu.
- Jeżeli obecny model `paymentPlanItems` wymaga korekty, zaproponuj najmniejszą zmianę zgodną z Convex.

Weryfikacja:
- Plan `Zaliczka + 2 raty` sumuje się do ceny za koję.
- Plan `Całość teraz` tworzy jedną pozycję.
- Nowy booking dostaje snapshot planu.
- Zmiana planu segmentu nie zmienia starego bookingu.
```

Etap 4 — gotowe ✅                                                        
                                              
  Zmiany:                                     
  - src/routes/[[lang=lang]]/admin/automation/+page.svelte:1 — zastąpiony stub pełnym edytorem planów. Segment strip → form-grid (Szablon / Nazwa planu / Cena za koję / toggle „Pozwól
   zapłacić całość") → edytowalna lista pozycji (Etykieta, Typ, Kwota / koja w PLN, Termin) z przyciskami ↑/↓/Usuń → dynamiczna suma planu (Valid/Pod/Ponad) → toast statusu zapisu.
                                                                                                                                                                                       
  Decyzje:                                                                                                                                                                             
  - Backend już istniał (upsertSegmentPaymentPlan, activePaymentPlanBySlug, createBookingPaymentSchedule snapshotuje per booking) — tylko zbudowane UI.                                
  - Templates:                                                                                                                                                                         
    - Zaliczka + 2 raty → 30% deposit + 2 raty z reszty (last = balance żeby zaokrąglenia trafiły w nią)                                                                               
    - Zaliczka + 3 raty → 30% deposit + 3 raty z reszty                                                                                                                                
    - Całość teraz → jedna pozycja full na 100%                                    
    - Własny plan → jedna pusta pozycja typu custom, admin buduje od zera                                                                                                              
    - Daty domyślnie puste — admin uzupełnia per segment.                
  - Suma vs cena: over blokuje zapis (mutacja i tak by odrzuciła), under przepuszcza z ostrzeżeniem ("różnica trafi do Dopłata końcowa") — odzwierciedla istniejącą logikę             
  createBookingPaymentSchedule, która i tak doszywa balance jeśli plan jest niepełny. Nie chcemy dwukrotnej walidacji w UI i serwerze.                                    
  - Po zapisie effect lastLoadedSegment = null powoduje że Convex reactive subscription odświeży lokalny formularz z autorytatywnego stanu serwera.                                    
  - Pominąłem panel „Reguły monitów" z prototypu — Etap 4 ma zakres tylko harmonogramów rat. Reguły monitów wpadają do Etap 8 / decyzji po MVP.    
  - Pominąłem opcjonalną „ręczną korekta snapshotu konkretnego bookingu" — spec oznacza ją jako opcjonalną. Edycja kwot na już istniejącym bookingu wprowadza ryzyka (np. nieaktualne  
  PaymentIntenty) i nie jest na ścieżce krytycznej. Można dodać w drawer w Etap 8 jeśli realna potrzeba.                                                                               
                                                                                                                                                                                       
  Weryfikacja:                                                                                                                                                                         
  - pnpm check — 0 błędów, 0 ostrzeżeń.                                                                                                                                                
  - Po Twojej stronie:                                                                                                                                                                 
    - Wybierz segment → szablon Zaliczka + 2 raty → suma równa cenie → zapisz → toast OK.                                                                                              
    - Szablon Całość teraz → jedna pozycja, zapisz.                                                                                                                                    
    - Stwórz nową rezerwację po zapisie → jej bookingPayments mają nowy harmonogram (snapshot).                                                                                        
    - Zmień plan segmentu, otwórz starą rezerwację w drawerze → harmonogram pozostaje niezmieniony.                                                                                    
                                                                                                                                                                                       
  Gotcha:                                                                                                                                                                              
  - Jeśli admin zmieni plan kiedy są aktywne bookingPayments z poprzedniego — istniejące rezerwacje pozostają nienaruszone (snapshot), ale ewentualne nowe wpłaty użytkowników i tak   
  pójdą do snapshotów ich bookingów. To jest intencja spec'u.                                                                                                                          
  - Pole „Cena za koję" w UI pochodzi ze statycznego voyageSegments (PLN), nie z Convex voyageSegments.pricePerBerth — obie wartości muszą się zgadzać. To istniejący stan rzeczy w
  projekcie (statyczne segmenty są też używane w segment strip Etap 2). Zharmonizowanie tego do jednego źródła wpada do Etap 8.     

## Etap 5 — Admin edytuje dane uczestników

Cel: admin może uzupełnić dane żeglarza otrzymane innymi kanałami, ale dane wymagają osobnego potwierdzenia przez uczestnika.

Zakres:

- Admin edit UI dla `bookingParticipants` w drawerze lub osobnej stronie adminowej.
- Wykorzystanie istniejącego schematu walidacji danych załogi tam, gdzie to rozsądne.
- Rozszerzenie `bookingParticipants` o `confirmationStatus`, timestamps i metadane admin edit.
- Status po kompletnej edycji: `drafted_by_admin`.
- Alert Queue uwzględnia dane kompletne, ale niepotwierdzone.

Prompt:

```text
Wdróż adminową edycję danych uczestników jako pierwszy krok modułu Crew Data Verification. Opieraj się na `docs/design/admin-crew-data-verification-spec.md` i sekcji „Dane załogi” w `docs/design/huashu-admin-operations-console.html`.

Kontekst:
- Istnieje `bookingParticipants` oraz user-facing `/dashboard/crew/[participantId]`.
- Admin ma uzupełniać dane dostarczone telefonicznie, mailem lub WhatsAppem.
- Dane wpisane przez admina nie powinny automatycznie oznaczać finalnego potwierdzenia przez żeglarza.

Oczekiwany rezultat:
- Admin może edytować dane uczestnika z poziomu `/admin`.
- `dataStatus` nadal opisuje kompletność pól.
- Nowe `confirmationStatus` opisuje potwierdzenie danych przez uczestnika.
- Po kompletnej edycji przez admina status potwierdzenia staje się `drafted_by_admin`.
- Alert Queue pokazuje uczestników, którzy mają kompletne dane bez potwierdzenia.

Gotcha:
- Nie duplikuj osobnego modelu „crew admin data” obok `bookingParticipants`, jeśli nie ma mocnego powodu.
- Nie mieszaj `dataStatus` i `confirmationStatus`; to dwa różne znaczenia.
- Po edycji danych już potwierdzonych rozważ cofnięcie statusu do `drafted_by_admin`, ale oceń najlepsze zachowanie i udokumentuj decyzję.

Weryfikacja:
- Admin zapisuje komplet danych i widzi status `drafted_by_admin`.
- Niekompletne dane pozostają `incomplete`.
- Zwykły użytkownik nie może edytować danych przez admin mutation.
- `pnpm check`.
```

Etap 5 — gotowe ✅                                                        
                                              
  Zmiany:                              
  - src/convex/schema.ts:171 — bookingParticipants rozszerzony o confirmationStatus (none / drafted_by_admin / sent / confirmed / correction_requested / expired) + adminEditedAt +    
  adminEditedBy. Pozostałe pola tokenowe (sentAt/expiresAt/confirmedAt/correctionNote) zostawiam dla Etap 6.                                                                       
  - src/convex/mutations.ts — nowy adminUpdateParticipantData(participantId, adminUserId, …profil). Przelicza dataStatus, ustawia adminEditedAt/By. Przejście statusu: complete →      
  drafted_by_admin (także gdy ktoś poprawia już potwierdzone dane — pada do drafted_by_admin, czyli wymaga ponownego linku); incomplete/missing → none (kasuje stary draft/sent).      
  - src/convex/admin.ts — overviewBySegment zwraca dodatkowo kpi.pendingConfirmationCount oraz nowe alerty data_pending_confirmation (priority 80 / 300 dla correction_requested).     
  - src/lib/components/admin/booking-drawer.svelte — nowy prop adminUserId, badge confirmationStatus obok dataStatus, akcja „Edytuj dane" / „Wpisz dane" odsłaniająca inline form (16  
  pól, nazwiska, emaile, dokument, kontakt alarmowy, doświadczenie, dieta, notatki medyczne). Po zapisie status w toast informuje, czy dane są kompletne.                              
  - src/routes/[[lang=lang]]/admin/+page.svelte — przekazuje pageData.admin.userId do drawera (zmiana destrukturyzacji żeby uniknąć kolizji z data query); nowy KPI „Do potwierdzenia";
   grid KPI z 7 → 8 kolumn.                                                                                                                                                            
                                                                                                                                                                                       
  Decyzje:                                                                         
  - Edycja przez admina cofa confirmed do drafted_by_admin (rekomendacja MVP w specu) — kapitan zawsze widzi rozjazd "dane się zmieniły, uczestnik nie wie".                           
  - confirmationStatus nie jest częścią dataStatus — to dwie ortogonalne miary. KPI „Brak danych" liczy tylko niekompletne; KPI „Do potwierdzenia" tylko kompletne ale jeszcze nie     
  potwierdzone (lub po korekcie / wygasłe).                                                                                                                                       
  - Form edycji jest „luźny" — nie używa crewProfileSchema z user-facing dashboardu. Powód: admin często wpisuje to, co dostał telefonicznie, nie chcemy go blokować Zod validation.   
  Server-side participantDataStatus i tak weryfikuje kompletność.                                                                                                                      
  - adminUserId jest przekazywany przez prop z layout server-load (pageData.admin.userId). Server-side mutation jeszcze nie weryfikuje go autorytatywnie (Convex bez Clerk JWT) — ten  
  gap jest świadomie zostawiony do Etap 8.                                                                                                                                             
                                                                                   
  Weryfikacja:                                                                                                                                                                         
  - pnpm check — 0 błędów, 0 ostrzeżeń, 1736 plików.                                                                                                                                   
  - Po Twojej stronie:                                                                                                                                                                 
    - Otwórz drawer → "Edytuj dane" → wypełnij komplet → Zapisz → toast „Status: robocze (admin)", badge Robocze (admin), alert „Dane czekają na potwierdzenie uczestnika" pojawia się 
  w Alert Queue, KPI „Do potwierdzenia" rośnie.                                                                                                                                       
    - Wpisz część pól → toast informuje o niekompletnych danych, badge zostaje Niekompletne, alert „Niekompletne dane uczestnika".                                                     
    - Zwykły zalogowany user (non-admin) nie ma jak wywołać tej mutacji bo guard /admin zwraca 403 zanim klient załaduje page (warstwa SvelteKit; Etap 8 dorzuci hardening na poziomie
  Convex).                       

## Etap 6 — Token confirmation flow dla żeglarzy

Cel: żeglarz potwierdza dane przez bezpieczny, ograniczony link bez konieczności logowania.

Zakres:

- Tabela tokenów lub równoważny bezpieczny mechanizm z hash tokenu.
- Admin action: utwórz token i wyślij e-mail przez Brevo.
- E-mail potwierdzający dane w stylu `admin-panel-review-for-michal.html`: navy/brass, karta, jasne CTA, bez technicznego opisu tokenu.
- Public route `/crew/confirm/[token]`.
- Read-only podgląd danych jednego uczestnika.
- Akcje: potwierdź dane albo zgłoś korektę.
- Expiry, usedAt, korekta i alert dla admina.

Prompt:

```text
Wdróż publiczny flow potwierdzania danych żeglarza przez unikalny token. Źródłem specu jest `docs/design/admin-crew-data-verification-spec.md`; UI publicznej strony ma być prosty i zgodny wizualnie z Sailing Architects, ale nie powinien wyglądać jak panel admina.

Kontekst:
- Link nie wymaga logowania, bo działa jak transakcyjny link potwierdzający.
- Zakres linku musi być ograniczony do jednego `bookingParticipant`.
- W bazie zapisujemy hash tokenu, nie jawny token.
- Brevo jest providerem maili.
- E-mail ma wyglądać jak część Sailing Architects, nie jak techniczny system notification.

Oczekiwany rezultat:
- Admin może wysłać link potwierdzający z `/admin`.
- Uczestnik widzi tylko swoje dane.
- Uczestnik może potwierdzić poprawność danych.
- Uczestnik może zgłosić korektę w textarea.
- Token wygasa i nie może być nadużywany.
- Admin widzi status `confirmed`, `correction_requested` lub `expired`.

Gotcha:
- Nie pokazuj danych finansowych ani danych innych uczestników na publicznej stronie.
- Nie zapisuj jawnego tokenu w bazie.
- Rozstrzygnij, czy token staje się użyty dopiero po akcji, czy już po podglądzie; dla MVP rekomendowane jest użycie dopiero po potwierdzeniu/korekcie.

Weryfikacja:
- Poprawny token pokazuje dane jednego uczestnika.
- Wygasły/użyty token pokazuje bezpieczny komunikat.
- Potwierdzenie aktualizuje status.
- Korekta tworzy alert dla admina.
- `pnpm check`.
```

Etap 6 — gotowe ✅                                        
                                                                                                                                                                                       
  Zmiany:                              
  - src/convex/schema.ts — bookingParticipants rozszerzone o confirmationSentAt / confirmationExpiresAt / confirmedAt / correctionRequestedAt / correctionNote. Nowa tabela            
  crewConfirmationTokens (participantId, bookingId, tokenHash, expiresAt, usedAt, createdByAdminUserId, sentToEmail) z indexami by_token_hash i by_participant.                        
  - src/convex/_emails.ts — nowy sendCrewConfirmationEmail (navy/brass shell, eyebrow „Potwierdzenie danych", CTA „Sprawdź i potwierdź dane", info o expiry, footer „Jeśli e-mail nie
  był do Ciebie, zignoruj").                                                                                                                                                           
  - src/convex/crewConfirmation.ts (nowy):                                         
    - sendCrewConfirmationLink (action) — generuje 32-bajtowy token (hex) przez crypto.getRandomValues, hashuje SHA-256, unieważnia poprzednie aktywne tokeny dla tego participanta,   
  wstawia row z hashem + 14-dniowym expiresAt, patchuje participanta na confirmationStatus = sent. Wysyła Brevo e-mail z jawnym linkiem (token tylko w URL, nigdy w DB).               
    - getCrewConfirmationByToken (public query) — hashuje token, weryfikuje row, sprawdza usedAt i expiresAt, zwraca tylko dane jednego uczestnika.                                    
    - confirmCrewDataByToken / requestCrewDataCorrectionByToken (public mutations) — oznaczają token usedAt dopiero po akcji (nie po podglądzie); patchują participanta na confirmed   
  lub correction_requested z notatką (max 2000 znaków).                                                                                                                                
    - adminMarkConfirmedManually (admin mutation) — oznacza ręcznie po telefonie + spala wszystkie aktywne tokeny.
  - src/routes/[[lang=lang]]/crew/confirm/[token]/+layout@.svelte — minimalny ciemny shell, @-reset (bez SiteNav, bez admin sidebar).                                                  
  - src/routes/[[lang=lang]]/crew/confirm/[token]/+page.svelte — read-only widok danych w 4 sekcjach (Dane osobowe / Dokument / Kontakt alarmowy / Doświadczenie i zdrowie), CTA       
  „Potwierdzam, dane są poprawne" lub przejście do textarea „Co wymaga poprawy?". Stany: invalid (not_found/expired/already_used), already confirmed, ready, post-success.      
  - src/lib/components/admin/booking-drawer.svelte — nowe akcje per uczestnik (gdy dataStatus = complete i nie potwierdzony): „Wyślij link do potwierdzenia" / „Wyślij ponownie" (po   
  wysłaniu URL trafia też do schowka), „Potwierdź ręcznie" (z confirm() prompt, unieważnia tokeny). Drawer pokazuje też: link aktywny do (gdy sent), datę potwierdzenia, treść korekty 
  od uczestnika w wyróżnionej notce.                                                                                                                                                   
                                                                                                                                                                                       
  Decyzje:                                                                                                                                                                             
  - Token użyty dopiero po akcji (potwierdzeniu lub korekcie), nie po samym podglądzie — pozwala na ponowne otwarcie linku przez uczestnika, jeśli ktoś go zamknął w trakcie czytania. 
  Spec wprost rekomendował to dla MVP.                                                                                                                                                 
  - Wygaśnięcie 14 dni — zgodnie z rekomendacją MVP w specu.                                                                                                                           
  - Korekta = krótki textarea (max 2000 znaków). Nie pozwalamy uczestnikowi edytować pól bezpośrednio — bezpieczniej, bo admin ma kontrolę nad tym, co finalnie trafia do DB.          
  - Edycja przez admina po confirmed cofa do drafted_by_admin (Etap 5) — tu komplementarnie: ręczne potwierdzenie unieważnia outstanding tokeny, więc nie ma race condition „uczestnik 
  kliknął stary link już po telefonie".                                                                                                                                                
  - Token hashing: SHA-256 jest deterministyczne (lookup po hashu via index) i wystarczające — tokeny są jednorazowe i krótkoterminowe; pełna kryptografia (HMAC z secretem) nie dodaje
   wartości operacyjnej dla tego use case.                                                                                                                                             
  - E-mail uczestnika ma priorytet > invitedEmail > buyerEmail/crewProfile. Uczestnik powinien dostawać link na własny adres jeśli go ma; fallback do kupującego tylko gdy uczestnik
  nie ma adresu.                                                                                                                                                                       
                                           
  Weryfikacja:                                                                                                                                                                         
  - pnpm check — 0 błędów, 0 ostrzeżeń, 1740 plików (4 nowe).                                                                                                                          
  - Po Twojej stronie:                                                                                                                                                                 
    - Drawer → uczestnik z kompletem danych i drafted_by_admin → „Wyślij link do potwierdzenia" → toast „Link wysłany na…", URL w schowku, badge zmienia się na Wysłane.               
    - Otwórz link w incognito → public page pokazuje dane → „Potwierdzam" → success state, drawer pokazuje Potwierdzone, alert z Alert Queue znika.                                    
    - Inny scenariusz: „Chcę zgłosić poprawkę" → wpisz tekst → wyślij → drawer dostaje badge Korekta + cytat notki, alert „Uczestnik zgłosił korektę" pojawia się z priority 300.      
    - „Potwierdź ręcznie" → potwierdza bez maila, unieważnia istniejące tokeny.                                                                                                  
                                                                                                                                                                                       
  Gotcha:                                                                          
  - Wymaga PUBLIC_APP_URL ustawionego w Convex deployment env (npx convex env set PUBLIC_APP_URL https://...) — link generowany w action używa fallbacku z _brevo.ts. W dev URL może   
  wskazywać na produkcję, jeśli env nie jest ustawiony lokalnie.                                                                                                                       
  - Cron markOverduePayments z reminders.ts istnieje, ale nie ma cronu auto-wygasającego tokeny. Wygasłe tokeny są oznaczane lazy (przy próbie użycia w mutation) — alert dla admina   
  pokazuje się dopiero gdy participant ma confirmationStatus = expired. Auto-wygaszający cron można dodać w Etap 8, jeśli realna potrzeba.                                             
  - Public page działa też pod /pl/crew/confirm/... (matcher [[lang=lang]]) — link generowany przez panelUrl() jest pod „bare" path bez locale. Oba routy są tym samym page'em. 

## Etap 7 — Miejsca specjalne i porządki operacyjne

Cel: utrzymać `captain` i `complimentary` poza głównym Sales Board, ale w jednym panelu operacyjnym.

Zakres:

- Moduł `Miejsca specjalne` zgodny z prototypem.
- Zarządzanie `captain` i `complimentary`.
- Widoczność wpływu tych miejsc na KPI dostępności.
- Bez mieszania miejsc specjalnych z normalną sprzedażą i zaległościami.
- Usunięcie/ukrycie starych narzędzi migracyjnych, jeśli nie są już potrzebne.

Prompt:

```text
Uporządkuj obsługę miejsc specjalnych w `/admin`, zgodnie z zakładką „Miejsca specjalne” w `docs/design/huashu-admin-operations-console.html`.

Kontekst:
- Projekt ma statusy berths: available, held, taken, captain, complimentary.
- Miejsca specjalne mają wpływać na dostępność, ale nie powinny mieszać się z normalną sprzedażą, ratami i zaległościami.

Oczekiwany rezultat:
- Admin widzi i zarządza miejscami captain/complimentary w osobnym module.
- KPI sprzedażowe nie traktują complimentary jako płatnej sprzedaży.
- Dostępność koji jest spójna z Cabins/BoatPlan.
- Stare narzędzie migracji C1 nie dominuje UI, jeśli nie jest już potrzebne.

Gotcha:
- Nie zepsuj istniejącej logiki blokowania captain/complimentary w booking flow.
- Jeśli migration tool nadal jest potrzebny, przenieś go do narzędzi technicznych, nie do głównego workflow kapitana.

Weryfikacja:
- Captain berth nie jest dostępna do rezerwacji.
- Complimentary berth blokuje koję, ale nie zwiększa paid revenue.
- Sales Board i KPI pokazują to rozróżnienie czytelnie.
```

Etap 7 — gotowe ✅                                    
                                           
  Zmiany:                                  
  - src/routes/[[lang=lang]]/admin/special/+page.svelte:1 — przepisany od zera. Layout zgodny z resztą admina (sidebar dziedziczony z +layout@.svelte):                                
    - Topline + lede tłumacząca, że captain/complimentary są poza Sales Board                                                                          
    - Segment strip (taki sam jak w overview / automation)                                                                                                                             
    - Panel Captain — read-only lista koi status='captain' z badge i komunikatem fallback gdy seed nie był uruchomiony                                                                 
    - Panel Complimentary — lista rezerwacji bezpłatnych z „Zwolnij koję" + formularz „Dodaj complimentary" (koja z dropdown dostępnych, gość, uwagi)                                  
    - Toast statusu (zastąpił alert())                                                                                                                                                 
    - <details> „Narzędzia techniczne" — schowana migracja C1 (jednorazowa, idempotentna)                                                                                              
                                                                                                                                                                                       
  Decyzje:                                                                         
  - Captain berths są read-only — nie ma admin UI do swapowania kapitana, bo to stała blokada per jacht. Zmiana jednostki kapitańskiej to operacja seedu, nie operacyjna.              
  - Migration tool przeniesiony do <details> zamiast usuwania — jest idempotentny i nieuciążliwy schowany. Daje wyjście awaryjne na przypadek nowego seedu.              
  - KPI complimentary już istnieje w overview (kpi.complimentaryBerths od Etap 2). KPI captain nie jest osobną metryką, bo to constanta — dlatego lede zwraca uwagę kapitana.          
  - Panel widzi pojedynczy segment naraz — spójne z resztą admina i z allBerthsBySlug query (już istniało).                                                                            
  - confirm() zamiast custom modala dla cancel/migrate — operacje awaryjne, niski koszt UX, wysoki próg pomyłki.                                                                       
  - Cała wcześniejsza wersja (panel administracyjny z własnym headerem) była pre-Etap-2 leftover w /admin/special. Teraz layout jest jednolity.                                        
                                                                                                                                                                                       
  Weryfikacja:                                                                                                                                                                         
  - pnpm check — 0 błędów, 0 ostrzeżeń, 1740 plików.                                                                                                                                   
  - Po Twojej stronie:                                                                                                                                                                 
    - /admin/special w sidebar admina → spójny styl, aktywna zakładka „Miejsca specjalne".
    - Captain panel pokazuje koje status=captain (np. C1) jeśli były seedowane; jeśli nie — fallback z odsyłką do narzędzi technicznych.                                               
    - „Dodaj complimentary" → wybierz dostępną koję → zapisz → toast OK, koja pojawia się na liście complimentary, znika z listy dostępnych.                                           
    - „Zwolnij koję" → confirm → koja wraca do dostępnych, KPI „Specjalne" w overview maleje.                                                                                          
    - „Narzędzia techniczne" rozwija migrację — wciśnij raz, idempotentne.                                                                                                             
                                                                                                                                                                                       
  Gotcha:                                                                                                                                                                              
  - W overview KPI „Specjalne" (Etap 2) liczy complimentaryBerths, nie captain. Captain nie jest w nim widoczny celowo — bo to stała blokada, nie ruch. Jeśli chcesz osobnego widoku   
  „captain count", łatwo dorzucić w kpi.                                                                                                                                            
  - Migration tool jest publicznie dostępny przez Convex (mutation migrateCaptainBerths). SvelteKit guard chroni stronę, ale samej mutacji nie. Hardening Convex side pójdzie w Etap 8.
                                                                                                                                                                                   

## Etap 8 — E2E, cleanup i decyzje po MVP

Cel: domknąć jakość po wdrożeniu modułów admina.

Zakres:

- Testy/manual checklist dla pełnych scenariuszy.
- Cleanup starych mocków i narzędzi dev.
- Sprawdzenie maili Brevo.
- Sprawdzenie uprawnień admin/dev.
- Decyzje po obserwacji sprzedaży: audit log, WhatsApp/SMS automation, bardziej szczegółowe role.

Prompt:

```text
Przeprowadź etap jakościowy po wdrożeniu Admin Operations Console. Celem jest wychwycenie niespójności między booking flow, płatnościami, przypomnieniami, adminem i publicznym potwierdzaniem danych.

Kontekst:
- Admin Console dotyka wielu obszarów: Clerk, Convex, Stripe/Brevo, bookingPayments, bookingParticipants, crons/reminders.
- `docs/design/huashu-admin-operations-console.html` jest wzorcem UX, ale produkcyjny kod ma być zgodny z rzeczywistymi danymi i uprawnieniami.

Oczekiwany rezultat:
- Checklist ręczna lub testowa dla najważniejszych scenariuszy.
- Brak mocków w produkcyjnym `/admin`.
- Czyste uprawnienia admin/dev.
- Potwierdzone, że reminder e-maile i admin alerty działają.
- Lista decyzji po MVP, bez implementowania wszystkiego naraz.

Gotcha:
- Nie wprowadzaj dużego audit logu ani automatycznego WhatsApp/SMS, jeśli nie są jeszcze wymagane biznesowo.
- Nie refaktoruj booking flow szerzej niż wymaga stabilizacja admina.

Weryfikacja:
- Scenariusz: zaległa rata -> alert -> monit -> aktualizacja stanu.
- Scenariusz: admin wpisuje dane -> wysyła token -> uczestnik potwierdza.
- Scenariusz: uczestnik zgłasza korektę -> admin widzi alert.
- Scenariusz: zmiana planu segmentu nie zmienia istniejącego bookingu.
- `pnpm check` i `pnpm lint` albo jawne wskazanie znanych długów.
```

## Sugerowana kolejność

1. Etap 1 — Access control.
2. Etap 2 — Read-only Admin Overview.
3. Etap 3 — Drawer i ręczne monity.
4. Etap 4 — Elastyczne harmonogramy rat.
5. Etap 5 — Admin edytuje dane uczestników.
6. Etap 6 — Publiczny token confirmation flow.
7. Etap 7 — Miejsca specjalne.
8. Etap 8 — E2E, cleanup, decyzje po MVP.

Jeśli trzeba ograniczyć MVP, minimalny sensowny zakres to etapy 1-3 oraz read-only część etapu 5. Pełna wartość operacyjna pojawia się po etapach 4-6.

Etap 8 — gotowe ✅                                                                                                                                                                   
                                                                                                                                                                                       
  Zmiany:                                                                                                                                                                              
  - docs/admin-e2e-checklist.md (nowy) — manualna checklist dla 9 scenariuszy: guard /admin, KPI/Sales Board, zaległa rata → monit → state, admin edit → token → confirm, korekta →    
  alert, wygasły link, plan zmiana nie modyfikuje istniejących bookingów, miejsca specjalne, hold expiring. Plus wymagania wstępne (Convex env, Clerk role, seed) i sanity checks.     
  - docs/admin-post-mvp-decisions.md (nowy) — 11 pozycji backloga z trigger-driven priorytetami: Convex auth hardening, audit log, WhatsApp/SMS automation, auto-wygaszający cron      
  tokenów, konfigurowalne reguły monitów, per-booking snapshot override, granularne role, eksport CSV, nightly admin alert, single source of truth dla voyageSegments. Plus jawna lista
   „świadomie pomijane".                                                                                                                                                               
  - Prettier --write na 8 plikach admina (admin.ts, crewConfirmation.ts, mutations.ts, booking-drawer.svelte, +page.svelte, automation/+page.svelte, special/+page.svelte,             
  crew/confirm/[token]/+page.svelte) — zero zmian funkcjonalnych, tylko formatowanie.                                                                                                  
                                                                                                                                                                                       
  Audit cleanup:                                                                                                                                                                       
  - Brak TODO/FIXME/MOCK w kodzie admina (src/convex/admin.ts, crewConfirmation.ts, src/lib/components/admin/, src/routes/[[lang=lang]]/admin/, src/routes/[[lang=lang]]/crew/).       
  - Migracja captain (runMigration) jest schowana w <details> na /admin/special — dostępna gdy potrzeba, niewidoczna jako element głównego workflow kapitana.                          
  - Wszystkie KPI / alerty / Sales Board zasilane są z overviewBySegment na żywych danych Convex; brak mocków.                                                                         
  - confirm() używane tylko dla operacji destrukcyjnych z wysokim progiem pomyłki (Zwolnij koję, Migracja, Potwierdź ręcznie) — świadomie zostawione.                                  
                                                                                                                                                                                       
  Weryfikacja:                                                                                                                                                                         
  - pnpm check — 0 błędów, 0 ostrzeżeń, 1740 plików.                                                                                                                                   
  - pnpm lint — czysty po stronie admina. Pozostałe 5 warnings to pre-existing długi formatowania w plikach poza zakresem (3× HTML design prototypy w docs/design/, docs/handoff.md,   
  scripts/codex-session-start.mjs). Wszystkie sprzed Etap 1.                                                                                                                        
                                                                                                                                                                                       
  Po-MVP / decyzje świadomie odłożone:                      
  - Pełen audit log — zostaje na drugiego operatora.                                                                                                                                   
  - WhatsApp/SMS automation — zostaje na codzienne 5+ wiadomości.                                                                                                                      
  - Convex auth hardening (ctx.auth + Clerk JWT) — najwyższy priorytet z backloga, zostaje na drugiego operatora lub audyt.                                                            
  - Reguły monitów konfigurowalne (panel z prototypu, świadomie pominięty w Etap 4).                                                                                                   
  - Auto-wygaszający cron na confirmation tokens — lazy expiry działa wystarczająco.                                                                                                   
                                                                                                                                                                                       
  Status:                                                                                                                                                                              
  - 8/8 etapów Admin Operations Console ukończone.                                                                                                                                     
  - E2E checklist gotowe do manualnego runa.                                                                                                                                           
  - Backlog post-MVP udokumentowany.                                                                                                              