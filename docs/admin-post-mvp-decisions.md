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

### Przywrócić `+layout@.svelte` reset na `/crew/confirm/[token]`

**Stan:** sesja 2026-05-16 — pattern `@-reset` + `+layout.ts` z `loadLocale` działa w admin (`[[lang=lang]]/admin/`), ale na `/crew/confirm/[token]` powoduje wuchale `i18n-404:597` mimo identycznego setupu. Empirycznie potwierdzone — usunięcie `@` z nazwy pliku (`+layout@.svelte` → `+layout.svelte`) rozwiązuje problem renderowania. Konsekwencja: public confirmation page pokazuje `<SiteNav />` dziedziczone z `[[lang=lang]]/+layout.svelte`, zamiast czystego full-bleed shell.

**Trigger:** UX kompromis akceptowalny dla MVP — uczestnik klika link z maila, wypełnia, gotowe. Nav nie blokuje. Ale wzorzec wraca w innych public flow (reset hasła, zaproszenia) i warto zrozumieć root cause.

**Kierunek:** zdiagnozować różnicę między `admin/` (1 segment od `[[lang=lang]]`, działa) a `crew/confirm/[token]/` (3 segmenty + dynamiczny `[token]`, nie działa). Hipotezy: głębokość zagnieżdżenia, interakcja z `[token]` matcher, kolejność rejestracji katalogu wuchale przy @-reset w głębokim drzewie. Po fixie przywrócić `+layout@.svelte` (kod jest w git history).

### Przycisk „Poproś o nowy link" na stronie zużytego/wygasłego tokenu

**Stan:** `/crew/confirm/[token]` przy `status === 'invalid'` pokazuje tylko komunikat „Ten link został już użyty. Skontaktuj się z organizatorem, jeżeli potrzebujesz nowego." plus tekstowy hint. Brak akcji — uczestnik musi szukać kontaktu w mailu/poradniku/footerze (a tej strony nie ma w SiteNav).

**Trigger:** uczestnik traci link albo klika po expirym, nie ma jak samodzielnie ruszyć dalej.

**Kierunek:** dodać przycisk „Poproś o nowy link" → Convex action `requestNewConfirmationLink({ oldToken })` która: (1) sprawdza czy stary token istniał (anti-spam), (2) generuje nowy, (3) wysyła do tego samego odbiorcy + kopia do admina. Bez auth — token sam jest dowodem że ktoś dostał oryginalny mail.

### Walidacja pól formy edycji uczestnika w drawerze

**Stan:** `adminUpdateParticipantData` w `src/convex/mutations.ts` przyjmuje stringi bez walidacji — można wpisać dowolne wartości w `firstName`, `email`, `dateOfBirth`, `phone`, `docNumber`, `nationality`, `swimmingAbility`, `sailingExperience`. Brak ograniczeń długości, brak format check (email regex, data ISO, telefon), brak whitelist dla enumów typu `swimmingAbility`/`sailingExperience`/`docType`. Forma kupującego ma walidację (zod) — admin form ją pomija.

**Trigger:** operator wpisze literówkę w mailu → token leci w pustkę albo do złej osoby; data urodzenia jako „01-02-2026" zamiast „2026-02-01" → cron który filtruje pełnoletnich się myli; nationality jako „PL" obok „Polska" obok „Polish" → niespójność na liście pasażerów do kapitana.

**Kierunek:** współdzielić schemat zod między booking flow a admin form (`src/lib/schemas/participant.ts`). Po stronie Convex mutation — walidacja przed zapisem (już istnieje `v.string()`, ale brak `v.union(v.literal(...))` dla enumów). Po stronie UI — błędy walidacji inline pod polami, blokada submit przy invalid.

### Drobiazgi UX formy edycji uczestnika w drawerze

**Stan:** form w `booking-drawer.svelte` ma trzy ograniczenia względem formy kupującego z booking flow:
- pole `dateOfBirth` to surowe `<input type="date">` bez widocznej ikony kalendarza (Safari/Chrome różnie renderują)
- `swimmingAbility` i `sailingExperience` to text input zamiast `<select>` z predefiniowanymi opcjami (forma kupującego ma dropdowny)
- `nationality` to text input zamiast listy krajów

**Trigger:** operator wpisuje wartości literówkami, niespójność z dropdownami kupującego, schemat walidacji nie wyłapie.

**Kierunek:** dopasować widgety do formy kupującego — wspólny komponent `nationality-select`, `swimming-ability-select`, `sailing-experience-select` plus styling ikony kalendarza (custom button albo `::-webkit-calendar-picker-indicator`).

### Widoczność realnego odbiorcy reminderów w karcie uczestnika

**Stan:** karta koji w `booking-drawer.svelte` pokazuje `participant.invitedEmail ?? participant.email ?? 'brak adresu uczestnika'` (linia 634-636). Resolver `_resolveParticipantAdhoc` ma fallback chain: `invitedEmail` → `crewProfiles.email` kupującego → `booking.buyerEmail`. Gdy uczestnik nie ma adresu, reminder leci do kupującego — ale admin widzi „brak adresu uczestnika · prośby: 4" i nie wie do kogo poszły maile. Dysonans informacyjny.

**Trigger:** operator pyta „dlaczego prośby się liczą skoro nie ma adresu", albo wysyła ponowne monity nieświadomy że trafiają do kupującego.

**Kierunek:** zwracać `recipientResolved` z resolvera do drawera (przez query, nie tylko z action). Karta pokazuje np. „prośby kierowane do: kupującego (jan@kowalski.pl) · 4, ostatnio …". Wymaga dodania pola do query zwracającego participanci.

### Przyjazne komunikaty błędów w toastach drawera

**Stan:** w `booking-drawer.svelte` wszystkie `catch (err)` używają `err instanceof Error ? err.message : 'fallback'`. `err.message` z Convex action to surowy ConvexError / ArgumentValidationError — techniczny, mylący dla operatora (np. „Server Error: ArgumentValidationError: Value does not match validator…").

**Trigger:** operator widzi techniczny komunikat i nie wie czy próbować ponownie, czy zgłosić bug.

**Kierunek:** whitelist znanych `result.reason` po stronie action (już istnieje dla `recipient_unavailable`), rozszerzyć o pozostałe ścieżki błędu. W catch działa generyczny fallback typu „Nie udało się wysłać — spróbuj ponownie lub skontaktuj się z administracją." Surowy `err.message` ewentualnie do `console.error` dla debugowania.

## Świadomie pomijane

- Pełen audit log (wymaga osobnej tabeli + UI; brak realnej potrzeby przy 1 operatorze).
- Multi-language admin UI (admin jest wewnętrzny, polski; spec nie wymaga).
- Refaktor booking flow (niezwiązany z admin console; obecne przepływy działają).
- Migracja `voyageSegments` price source — patrz „Single source of truth" wyżej. Dotyka landing page, więc trzeba uważać.
