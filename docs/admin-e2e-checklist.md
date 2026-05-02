# Admin Operations Console — E2E checklist

Manualny scenariusz dla `/admin` (Etapy 1-7). Wymaga:

- `pnpm dev` + `npx convex dev` (osobny terminal)
- `stripe listen --forward-to localhost:5173/api/stripe/webhook` (jeśli testujemy płatności)
- Brevo działający (lub `REMINDERS_DRY_RUN=1` żeby zalogować zamiast wysyłać)

## Wymagania wstępne

### Convex env (Convex Dashboard → Settings → Environment Variables albo `npx convex env set`)

- `BREVO_API_KEY`, `BREVO_FROM_EMAIL`
- `PUBLIC_APP_URL` — URL tego deploymentu (dev: `http://localhost:5173`)
- `HANDOFF_REPORT_TO` lub `ADMIN_ALERT_EMAIL` — adres na kopie operacyjne (admin copy)
- opcjonalnie `REMINDERS_DRY_RUN=1`

### Lokalny `.env.local`

- `ADMIN_DEV_ALLOWLIST=tomek.sosinski@gmail.com,...` — dev-only operator

### Clerk

- Produkcyjny operator: w Clerk Dashboard → Users → publicMetadata: `{"role":"admin"}`

### Seed (jednorazowo)

- `mutations:seedTestPaymentPlan` z `{ "segmentSlug": "s1" }` — tworzy plan 30% zaliczka + 2 raty
- `mutations:backfillBookingParticipants` jeśli są legacy bookings bez uczestników

## Scenariusz 1 — guard `/admin`

1. Wyloguj się. Wejdź na `/admin` → redirect do logowania.
2. Zaloguj się jako zwykły user (bez roli admin, e-mail spoza `ADMIN_DEV_ALLOWLIST`) → `/admin` zwraca 403 z forbidden state „Brak dostępu".
3. Zaloguj się jako operator z `ADMIN_DEV_ALLOWLIST` lub Clerk `role: admin` → `/admin` ładuje się z sidebar i overview.
4. Sidebar pokazuje 4 sekcje: Sprzedaż i alerty / Automatyzacje / Dane załogi / Miejsca specjalne. Aktywna podświetlona brassem.

## Scenariusz 2 — Sales Board + KPI

1. `/admin` → Segment strip pokazuje 4 segmenty z datami.
2. Przełączanie segmentu zmienia KPI strip (8 kart): Sprzedane, Wpłacono, Do wpłaty, Zaległe, Brak danych, Do potwierdzenia, Held, Specjalne.
3. Sales Board pokazuje rezerwacje danego segmentu z kolumnami Ref / Kupujący / Koje / Płatność / Dane / Następna akcja.
4. Filtry („Wszystkie", „Zaległe", „Do przypomnienia", „Brak danych", „Oczekuje wpłaty", „Opłacone") zawężają tabelę po `flags` z query — nie po tekstach UI.

## Scenariusz 3 — Zaległa rata → alert → monit → aktualizacja stanu

1. W Convex Dashboard ustaw `bookingPayments.dueAt` jednej raty na timestamp z przeszłości i `status` = `pending` lub uruchom `reminders:markOverduePayments`.
2. W `/admin` → KPI „Zaległe" świeci na danger, Alert Queue pokazuje „Rata zaległa N dni" z badge `Pilne` na górze listy.
3. Klik „Otwórz rezerwację" w alercie albo „Otwórz" w Sales Board → drawer z harmonogramem.
4. Przy zaległej racie → „Wyślij monit" → toast „Monit wysłany. Kopia poszła do operatora.".
5. Sprawdź skrzynkę odbiorcy + skrzynkę `HANDOFF_REPORT_TO` (lub Brevo dashboard, jeśli dry-run wyłączony).
6. Drawer pokazuje: licznik monitów +1, „ostatnio: <data>".
7. „Kopiuj WhatsApp" → toast „Skopiowano do schowka". Wklej do edytora — treść zawiera bookingRef + kwotę + link do panelu.

## Scenariusz 4 — Admin edytuje dane → token → uczestnik potwierdza

1. Drawer → uczestnik z `dataStatus = missing` lub `incomplete` → „Wpisz dane" / „Edytuj dane".
2. Wypełnij wszystkie wymagane pola (imię, nazwisko, email, dateOfBirth, miejsce urodzenia, narodowość, telefon, dokument, kontakt alarmowy, pływanie, doświadczenie). Zapisz.
3. Toast: „Dane zapisane. Status: robocze (admin)".
4. Drawer pokazuje badge `Robocze (admin)` obok `Komplet`. Alert Queue: „Dane czekają na potwierdzenie uczestnika" (priority 80, info).
5. KPI „Do potwierdzenia" rośnie o 1.
6. Klik „Wyślij link do potwierdzenia" → toast „Link wysłany na <email>", URL trafia do schowka.
7. Otwórz link w incognito (`/crew/confirm/[token]`) → public page bez SiteNav, sekcje: Dane osobowe / Dokument / Kontakt alarmowy / Doświadczenie i zdrowie.
8. Klik „Potwierdzam, dane są poprawne" → success state „Dziękujemy za potwierdzenie".
9. Wróć do drawera → badge zmienia się na `Potwierdzone` z timestampem. Alert znika.

## Scenariusz 5 — Korekta od uczestnika → alert dla admina

1. Powtórz Scenariusz 4 do kroku 7.
2. Na public page → „Chcę zgłosić poprawkę" → wpisz np. „Nazwisko zapisane błędnie, powinno być Kowalski-Nowak" → „Wyślij zgłoszenie".
3. Uczestnik widzi success state „Otrzymaliśmy zgłoszenie poprawki".
4. W `/admin` → Alert Queue pokazuje „Uczestnik zgłosił korektę" z badge `Pilne` (priority 300, warn).
5. Drawer dla tej rezerwacji → badge `Korekta` przy uczestniku + cytat: „Korekta od uczestnika: »…«".
6. Admin → „Edytuj dane" → poprawia wpis → zapisuje. Status wraca do `Robocze (admin)`. Stary token został unieważniony przy wysyłce poprzedniego, nowy link można wysłać.

## Scenariusz 6 — Wygasły link

1. W Convex Dashboard ustaw `crewConfirmationTokens.expiresAt` na timestamp z przeszłości.
2. Otwórz link w incognito → public page „Link wygasł. Skontaktuj się z organizatorem".
3. Próba akcji → mutation patchuje participanta na `confirmationStatus = expired`.
4. Alert Queue → „Link potwierdzenia wygasł" (priority 80, info).

## Scenariusz 7 — Plan rat: zmiana globalna nie modyfikuje istniejących bookingów

1. `/admin/automation` → wybierz s1 → szablon „Zaliczka + 2 raty" → „Generuj pozycje" → suma równa cenie segmentu.
2. „Zapisz plan" → toast „Plan zapisany. Nowe rezerwacje dostaną ten harmonogram; istniejące pozostają bez zmian.".
3. Otwórz dowolną istniejącą rezerwację s1 w drawerze → harmonogram pozostaje niezmieniony (snapshot z momentu utworzenia).
4. Stwórz nową rezerwację s1 (np. `/book?segment=s1&berths=...`) → po sukcesie drawer pokazuje nowy snapshot z 3 pozycjami zgodnymi z planem.
5. Zmień plan na „Całość teraz" → zapisz. Nowy booking dostaje 1 pozycję `Całość`. Stare bookings pozostają.

## Scenariusz 8 — Miejsca specjalne

1. `/admin/special` → Captain panel pokazuje koje `status = captain` (np. C1 dla każdego segmentu).
2. Complimentary panel → wybierz dostępną koję → wpisz gościa → zapisz → toast OK, koja pojawia się na liście.
3. „Zwolnij koję" → koja wraca na listę dostępnych.
4. Overview → KPI „Specjalne" odzwierciedla liczbę complimentary. Captain nie wlicza się do KPI „Sprzedane".

## Scenariusz 9 — Hold expiring

1. Otwórz checkout (`/book`) i przejdź do kroku 5 — koja idzie w `held` na 15 min.
2. `/admin` → Alert Queue „Held kończy się za N min" (priority 60 jeśli < 15 min).
3. KPI „Held" pokazuje licznik + odliczanie do najbliższego wygaśnięcia.

## Sanity checks

- `pnpm check` — 0 błędów.
- `pnpm lint` — `--write` może być wymagany; znane długi formatowania w `dashboard/+page.svelte` są pre-Etap-1 (poza zakresem admin).
- Brak surowych `alert()` / mocków w `/admin`. Dialogi destrukcyjne (Zwolnij koję, Migracja captain, Potwierdź ręcznie) używają `confirm()` świadomie — niski koszt UX, wysoki próg pomyłki.
- Convex codegen po każdej zmianie schematu/funkcji: `npx convex codegen`.
