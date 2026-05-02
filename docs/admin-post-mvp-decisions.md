# Admin Operations Console — decyzje po MVP

Backlog rzeczy, które są świadomie odłożone po Etapach 1-7. Nic z tej listy nie jest blokerem MVP. Każda pozycja ma być zaadresowana wtedy, kiedy realna sprzedaż / feedback kapitana to wymusi — nie wcześniej.

## Bezpieczeństwo i auth

### Hardening Convex side dla admin mutations

**Stan:** SvelteKit guard (`requireAdmin`) chroni stronę `/admin`. Convex mutations admina (`reserveComplimentary`, `cancelAdminBooking`, `migrateCaptainBerths`, `upsertSegmentPaymentPlan`, `adminUpdateParticipantData`, `sendAdhocPaymentReminder`, `sendAdhocCrewDataReminder`, `sendCrewConfirmationLink`, `adminMarkConfirmedManually`) przyjmują `adminUserId: string` jako arg bez weryfikacji autorytatywnej.

**Trigger do zaadresowania:** drugi operator dołącza do projektu, lub audyt bezpieczeństwa.

**Kierunek:** dodać `convex/auth.config.ts` z Clerk JWT issuer, używać `ctx.auth.getUserIdentity()` w mutations zamiast string arg, weryfikować rolę przez `clerkClient.users.getUser` w internal action / cache.

### Allowlista user IDs / dev-only env

**Stan:** `ADMIN_DEV_ALLOWLIST` w `.env` działa wyłącznie pod `import { dev } from '$app/environment'`. Prod używa Clerk publicMetadata.role.

**Trigger:** ktoś zwraca uwagę, że allowlist e-mail wycieka do logów / repo.

**Kierunek:** zostać przy obecnym modelu — to jest zaprojektowane jako przejściowy mechanizm do dev. W przyszłości zastąpić Clerk Organizations.

## Operacyjne

### Audit log

**Stan:** brak. Operacyjna „historia kontaktu" w drawerze jest derywatą `lastReminderSentAt` + `reminderCount` z payments / participants i `confirmationEmailSentAt` z bookings. Spec wprost mówił: „Audit log zostaje na później".

**Trigger:** dwóch operatorów zaczyna sobie nawzajem zmieniać dane i kapitan chce wiedzieć kto co kiedy.

**Kierunek:** osobna tabela `adminEvents` z `actorUserId`, `kind`, `targetId`, `metadata`, `at`. Rendering w drawerze obok obecnej historii.

### WhatsApp / SMS automation

**Stan:** „Kopiuj WhatsApp" generuje treść po stronie klienta i kopiuje do schowka. Brak integracji z API.

**Trigger:** kapitan zaczyna codziennie kopiować 5+ wiadomości manualnie.

**Kierunek:** integracja z Twilio / WhatsApp Business API. Do tego template'y per kanał (e-mail / SMS / WhatsApp), bo mają różne limity znaków i tonu.

### Auto-wygaszający cron na confirmation tokens

**Stan:** wygasanie token jest lazy — przy próbie użycia mutation patchuje participanta na `confirmationStatus = expired`. Alert Queue widzi to dopiero po próbie użycia.

**Trigger:** kapitan zauważa, że alert „Link wygasł" pojawia się dopiero po fakcie.

**Kierunek:** dodać `internalAction` skanującą `crewConfirmationTokens` z `expiresAt < now` i ustawiającą flagę. Cron raz dziennie. Niski priorytet — operacyjnie kapitan i tak widzi „dane czekają na potwierdzenie" zaraz po wysłaniu.

### Reguły monitów konfigurowalne przez admina

**Stan:** stałe w `reminders.ts`: 14d crew first delay, 14d interval, 3 max. 7d upcoming payment window. 3d overdue interval, 5 max.

**Trigger:** kapitan mówi „chciałbym ratę ponawiać co 5 dni a nie 3".

**Kierunek:** tabela `reminderRules` per typ + UI w `/admin/automation` (panel „Reguły monitów" z prototypu, świadomie pominięty w Etap 4).

### Per-booking override snapshotu płatności

**Stan:** plan segmentu jest snapshotowany do bookingu. Nie ma admin UI do zmiany kwot na konkretnej rezerwacji.

**Trigger:** wyjątkowy klient negocjuje rabat / inny harmonogram.

**Kierunek:** edycja w drawerze przy wierszach `bookingPayments`. Ostrożność z PaymentIntenty już wystawionymi przez Stripe.

## UX / drobne

### Granularne role (kapitan vs operator)

**Stan:** jedna rola `admin` w Clerk publicMetadata.

**Trigger:** kapitan chce, żeby asystent widział sprzedaż, ale nie zmieniał planu rat.

**Kierunek:** rozdzielić role `admin` i `operator`. Operator może czytać i wysyłać monity; admin dodatkowo edytuje plan rat i miejsca specjalne.

### Eksport CSV Sales Board

**Stan:** prototyp pokazuje przycisk „Eksport CSV", nie jest zaimplementowany.

**Trigger:** kapitan chce zrobić sprawozdanie Excel.

**Kierunek:** SvelteKit `+server.ts` endpoint w `/admin` zwracający CSV z `overviewBySegment`. Z guardem.

### Nightly admin alert e-mail

**Stan:** istnieje codzienny `pnpm email:handoff:yesterday` (handoff dla Michała). Brak osobnego „daily summary" dla kapitana z Sales Board / Alert Queue.

**Trigger:** kapitan chce dostać „dzisiaj rano: 3 zaległe raty, 2 brak danych".

**Kierunek:** Convex internalAction wysyłana cronem o 09:00, zbiera `overviewBySegment` per segment i wysyła zbiorczy e-mail przez Brevo.

### Single source of truth dla `voyageSegments`

**Stan:** statyczna lista w `src/lib/data/voyage-segments.ts` (PLN) używana w segment strip / segment picker, oraz dane w Convex `voyageSegments` (grosze + timestampy). Wartości muszą się zgadzać manualnie.

**Trigger:** ktoś zmieni cenę lub datę i zapomni zaktualizować w obu miejscach.

**Kierunek:** zlikwidować static, używać `api.queries.listSegments` wszędzie, cache-ować na poziomie layout server load. Wymaga ostrożności bo `voyage-segments.ts` jest też używana w landing page (statycznym).

## Świadomie pomijane

- Pełen audit log (wymaga osobnej tabeli + UI; brak realnej potrzeby przy 1 operatorze).
- Multi-language admin UI (admin jest wewnętrzny, polski; spec nie wymaga).
- Refaktor booking flow (niezwiązany z admin console; obecne przepływy działają).
- Migracja `voyageSegments` price source — patrz „Single source of truth" wyżej. Dotyka landing page, więc trzeba uważać.
