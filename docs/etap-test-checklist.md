# E2E checklist — Etapy 1-7

Manualny scenariusz pokrywający flow zaliczka → rata → PDF/mail → dane uczestników. Wymaga `pnpm dev` + `npx convex dev` (osobny terminal) + `stripe listen --forward-to localhost:5173/api/stripe/webhook`.

## Wymagania wstępne

1. Convex env (Convex Dashboard → Settings → Environment Variables albo `npx convex env set`):
   - `BREVO_API_KEY`
   - `BREVO_FROM_EMAIL`
   - `PUBLIC_APP_URL=http://localhost:5173` (dev) lub URL produkcyjny
   - opcjonalnie `REMINDERS_DRY_RUN=true` żeby crony tylko logowały
2. Convex prod (jednorazowo po deploy nowej schemy):
   - `mutations:backfillLegacyBookingPayments` (Convex Dashboard) — uzupełnia istniejące bookings o harmonogram (idempotentna)
   - `mutations:backfillBookingParticipants` — uzupełnia bookings o pustych uczestników per koja
3. Test plan płatności (jeśli chcemy testować zaliczki):
   - `mutations:seedTestPaymentPlan` z `{ "segmentSlug": "s1" }` — tworzy plan 30% zaliczka + 2 raty

## Scenariusz A — zakup z zaliczką

1. `/` → wybierz koję w sekcji Plan kajutowy (etap s1, np. A1) → „Rezerwuj"
2. `/book?segment=s1&berths=A1` → Krok 2 (Konto) → zaloguj/zarejestruj się przez Clerk
3. Krok 3 (Dane załogi opcjonalnie) → kliknij „Pomiń" — chcemy sprawdzić, że płatność idzie bez wymuszania danych żeglarza
4. Krok 4 (Potwierdzenie rezerwacji) → „Przejdź do płatności"
5. Krok 5 (Płatność) → powinny się pokazać 4 opcje radio z planu testowego: „Zaliczka", „Zaliczka + Rata 1", „Zaliczka + Rata 1 + Rata 2", „Całość". Wybierz **„Zaliczka"** → kliknij „Zapłać X zł"
6. Stripe Elements → karta testowa `4242 4242 4242 4242`, dowolna data w przyszłości, dowolny CVC → potwierdź
7. Krok 6 (Sukces) — pojawia się numer rezerwacji + link do PDF
8. Webhook (terminal `stripe listen`) → log `payment_intent.succeeded` → mail „Zaliczka opłacona — rezerwacja aktywna" z załączonym PDF (sprawdź skrzynkę bądź Brevo dashboard)
9. PDF zawiera sekcję „Harmonogram płatności": Zaliczka (paid), Rata 1 (pending), Rata 2 (pending), opcjonalnie Dopłata końcowa

## Scenariusz B — opłacenie kolejnej raty z dashboardu

1. `/dashboard` → tab „Rezerwacja"
2. Sekcja „Stan rezerwacji" pokazuje 2 checklisty:
   - „Dane załogi: 0/N uzupełnione" (klikalna, przeskakuje do tabu „Dane załogi")
   - „Płatności: 1/N opłacone" + badge `Zaliczka opłacona`
3. Sekcja „Harmonogram płatności" niżej — Zaliczka (Opłacone), Rata 1 (Oczekuje) z przyciskiem „Zapłać"
4. Klik „Zapłać" przy Rata 1 → `/dashboard/pay/[paymentId]` → „Zapłać X zł" → Stripe → potwierdź
5. Po sukcesie redirect do `/dashboard` → status zmienia się na `Częściowo opłacona`, paidAmount cumulative
6. Mail: „Otrzymaliśmy Twoją wpłatę" (BEZ załącznika PDF — installment) + lista pozostałych rat
7. Powtórz dla Rata 2 → po sukcesie status `Opłacona w całości` + mail „Rezerwacja opłacona w całości" z załączonym PDF (aktualnym)

## Scenariusz C — uzupełnienie danych uczestnika

1. `/dashboard` → tab „Dane załogi"
2. Lista kart per koja (1 karta dla pojedynczej rezerwacji A1)
3. Karta A1 → status „Brak danych" → opcjonalnie wpisz e-mail zaproszenia → „Zapisz e-mail" → sukces inline
4. „Uzupełnij" → `/dashboard/crew/[participantId]` → formularz (analogiczny do booking step 3)
5. Banner „Skopiuj moje dane" (jeśli istnieje legacy `crewProfile` z booking step 3) — kliknij, prefilluje formularz
6. Uzupełnij wymagane pola → „Zapisz" → redirect do `/dashboard`
7. Status karty zmienia się na „Komplet"; checklist „Dane załogi" 1/N

## Scenariusz D — testy reminderów (Etap 7)

Dry-run w Convex (ustaw `REMINDERS_DRY_RUN=true`):

1. Convex Dashboard → Functions → Run:
   - `reminders:markOverduePayments` (mutation) — oznacza pending z `dueAt < now` jako `overdue`
   - `reminders:sendCrewDataReminders` (action) — w logach pojawia się `[reminders dry-run] would send to ...`
   - `reminders:sendUpcomingPaymentReminders` (action)
   - `reminders:sendOverduePaymentReminders` (action)
2. Każda akcja zwraca `{ total, sent, failed }`. W dry-run `sent` to liczba kandydatów (mail nie pójdzie).
3. Po wyłączeniu dry-run (`REMINDERS_DRY_RUN=false` lub usunięcie env) reminders idą faktyczną wysyłką przez Brevo.
4. Throttle: powtórne uruchomienie tej samej akcji nie wyśle ponownie do tego samego adresata przed upływem interwału (14 dni dla crew, 7 dni dla upcoming, 3 dni dla overdue).

## Sanity check po zmianach schemy

- `pnpm check` → 0 errors, 0 warnings
- `pnpm lint` → All files use Prettier code style
- Stary booking (przed Etapem 3) bez `bookingPayments` rows nadal otwiera się w `/dashboard` (gracefully — `payments: []`, brak sekcji Harmonogram, brak checklisty „Płatności"). Po `backfillLegacyBookingPayments` dostaje pełny harmonogram.
- Stary booking bez `bookingParticipants` nadal otwiera się w `/dashboard` (zakładka „Dane załogi" pokazuje placeholder). Po `backfillBookingParticipants` dostaje karty per koja.

## Czego nie pokrywa

- Refund flow (Stripe).
- Lokalizacja maili (PL only).
- Ręczne re-send maila/PDF z dashboardu („Pobierz potwierdzenie" już jest, ale nie ma „Wyślij ponownie e-mail").
- Edycja terminów rat z poziomu admina (poza `upsertSegmentPaymentPlan` per-segment).
