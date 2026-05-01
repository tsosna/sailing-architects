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
