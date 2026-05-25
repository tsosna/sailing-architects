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

## Alert „Link potwierdzenia wygasł" nie wyzwala się automatycznie

**Stan:** Alert derivuje z `bookingParticipants.confirmationStatus === 'expired'`,
status ląduje tylko po wywołaniu mutacji `confirmCrewDataByToken` z wygasłym
tokenem. Strona confirmation blokuje UI w query gdy token wygasł, więc mutacja
nigdy nie zostanie odpalona. Alert pojawia się tylko gdy uczestnik miał kartę
otwartą sprzed wygaśnięcia.

**Trigger:** Każdy wygasły token bez odwiedziny strony zostaje cichy.

**Kierunek:** Alert powinien derivować bezpośrednio z `crewConfirmationTokens`
(np. query: `expiresAt < now && !usedAt && participant.confirmationStatus
!== 'confirmed'`). Storage flag na uczestniku zostaje jako optymalizacja /
cache, ale nie jest jedynym źródłem.

## Brak akcji „Wyloguj" w layoucie `/admin`

**Stan:** Admin layout (`src/routes/[[lang=lang]]/admin/+layout.svelte` + nagłówek) nie eksponuje `<SignOutButton />` ani linku do wylogowania. Żeby zakończyć sesję operator musi nawigować ręcznie do `/dashboard` (gdzie SignOut żyje) i kliknąć tam.

**Trigger:** Operator kończy zmianę przy publicznym/współdzielonym ekranie i nie ma jednoklikowej drogi do wylogowania z poziomu admin console — zwiększa ryzyko porzuconej sesji.

**Kierunek:** Dodać SignOut do nagłówka admin (np. menu pod awatarem / inicjałami) — spójnie z `/dashboard`. Wspólny komponent `user-menu` jeśli sensownie się da wyciągnąć.

## Responsywność akcji w wierszu Sales Board

**Stan:** Przy zwężaniu viewportu (ale jeszcze nie mobile) z wiersza Sales Board znikają kolejno przyciski akcji — najpierw „Otwórz", potem „Monit płatności". Layout chowa je bez fallbacku (overflow / hamburger / menu kontekstowe).

**Trigger:** Na laptopie z bocznym panelem dev-tools albo split-screen operator traci dostęp do podstawowej akcji wiersza. Nie ma sygnału że coś jest ukryte.

**Kierunek:** Albo przenieść akcje do menu kebab (`⋯`) z pełną listą poniżej breakpointu, albo trzymać minimum (`Otwórz`) przyklejone i resztę pakować do overflow. Audytować pozostałe breakpointy admin tabel pod tym kątem.

## Booking-selection nie czyści stanu po zakończonym zakupie

**Stan:** Po sukcesie checkoutu state w `booking-selection` (singleton / `$state` klasa, ewentualnie z persystencją w `localStorage`/`sessionStorage`) nie resetuje zaznaczonych koi. Otwarcie nowego zakupu w tej samej sesji pokazuje poprzednio kupione koje jako wciąż „wybrane"; dorzucenie kolejnych daje sumę krzyżową (np. A1+A2 już opłacone + E1+E2 nowe → panel pokazuje 4 koje, 7200 zł zamiast 3600 zł).

**Trigger:** Operator/klient kupuje 2 koje, wraca do flow żeby kupić następne — zamiast czystego startu widzi historyczne zaznaczenie i potencjalnie próbuje zapłacić ponownie za to co już ma.

**Kierunek:** Reset state po `bookingComplete` (po sukcesie mutation albo na unmount strony sukcesu). Audytować źródło prawdy — jeśli state żyje w singletonie, dodać `reset()`; jeśli w storage, czyścić klucz. Rozważyć osobno: zaznaczenia powinny być scoped per `bookingDraft` (lub per segment), nie globalnie.

## ~~`/admin/automation` — zmiana szablonu nie regeneruje pozycji~~ — ZAMKNIĘTE (A5, sesja 2026-05-25)

**Fix:** `onchange={() => generateItems(template, pricePerBerthPLN)}` na `<select>` szablonu. Bug 2 („select wraca do defaultu") był konsekwencją bug 1 — items nie regenerowały się przy zmianie selecta, więc save wysyłał stare items pasujące do innego template, a `inferTemplate` po reload zwracał oryginalny.

## `/admin/automation` używa starego inline toasta

**Stan:** Strona `/admin/automation` ma własny komunikat „Plan zapisany" wpięty bezpośrednio w stronie (stary wzorzec sprzed globalnego toastera), zamiast `toastState.addToast(...)`. Niespójne z resztą admina (booking-drawer, crew-confirm) zmigrowanej w sesjach 2026-05-15/16/17.

**Trigger:** Niespójny UX (różne miejsce/styl powiadomień w jednej konsoli), techniczny dług niedokończonej migracji.

**Kierunek:** Zmigrowac wszystkie toasty na `/admin/automation` na globalny `toastState.addToast` — analogicznie do migracji booking-drawer (sesja 2026-05-16) i crew/confirm (sesja 2026-05-17). Wyrzucić lokalny render/style toastów.

## ~~`createPaymentSchedule` duplikuje sumę przez wpisanie „Całość" obok itemów planu~~ — RESOLVED 2026-05-21 (PR #2)

**Stan:** `createPaymentSchedule` w `src/convex/mutations.ts` (linie ~190–230) przy zakładaniu nowego bookingu wstawia do `bookingPayments`:
1. pętla po `paymentPlanItems` — N wierszy (zaliczka + N-1 rat) sumujących się do `totalAmount`,
2. **dodatkowo**, jeśli `plan.allowFullPayment === true`, wiersz `label='Całość', kind='full', amount=totalAmount` **bez `paymentPlanItemId`**.

Skutek dla bookingu SA-2026-3508 (2 koje, `totalAmount=3600` PLN): 4 wiersze w bazie — `zaliczka 1080 + rata1 1260 + rata2 1260` (suma 3600, z `paymentPlanItemId`) **oraz** osobny `całość 3600` (bez `paymentPlanItemId`). `sum(bookingPayments.amount) = 7200 = 2 × totalAmount`. Niespójność wewnętrzna w danych już od momentu insertu (potwierdzone przez identyczne `_creationTime` wszystkich 4 wierszy — jedna transakcja, nie późniejsze dopiski). `paidAmount = 1080` (zaliczka opłacona przez Stripe) zgodne z rzeczywistością — bug nie dotyczy płatności, tylko reprezentacji harmonogramu.

Pierwotna hipoteza („krzyżowanie wierszy między bookingami przez błędny filtr w query") wykluczona: `bookingDetailById` w `src/convex/admin.ts` filtruje poprawnie `withIndex('by_booking', q => q.eq('bookingId', bookingId))`.

**Trigger:** Każde KPI / dashboard / alert sumujący `bookingPayments` po stronie czytania widzi 2× kwotę. Drower pokazuje 4 pozycje gdzie powinny być 3. Scenariusz 7 admin checklisty (snapshot vs reference) niewykonalny — nie da się empirycznie zweryfikować „suma rat = totalAmount" zanim ten bug nie zostanie naprawiony.

**Korzeń:** dwa nakładające się modele danych w jednej tabeli. `bookingPayments` powinien być **harmonogramem zobowiązań w czasie** (rzeczy które kupujący ma zapłacić, każda raz). „Całość" nie jest dodatkowym zobowiązaniem — jest **alternatywną opcją wyboru** w kroku 5 checkoutu (zapłać teraz wszystko zamiast rozkładać). Czyli żywiołem UI/derive, nie storage. Step 5 (`/book +page.svelte:363`) i tak buduje opcje radio przez `$derived.by(...)` z `paymentPlanItems` + `plan.allowFullPayment` — wpis „Całość" w `bookingPayments` jest redundantny.

**Kierunek:** Usunąć blok `if (plan.allowFullPayment) { insert('bookingPayments', { label: 'Całość', ... }) }` z `createPaymentSchedule`. Konsumenci którzy zakładają obecność tego wiersza — przepiąć na derive z planu. Audyt: drower, KPI, alerty, step 5 (już derive). Po fixie: re-run Scenariusza 7 z czystym segmentem, weryfikacja `sum(bookingPayments) === totalAmount`.

## False affordance — wartości w kolumnach `płatność` / `dane` i pigułki w Alert Queue

**Stan:** W tabeli Sales Board komórki kolumn `płatność` i `dane` oraz pigułki statusu w Alert Queue (`pilne`, `dane`, `info`) mają border + padding + tło, wyglądają jak klikalne kontrolki, ale są wyłącznie informacyjne. Ta sama klasa problemu co status pill na public confirmation page (backlog 2026-05-17) — tym razem w widoku administratora, na wielu kolumnach.

**Trigger:** Operator klika i nic się nie dzieje; powtarzające się false affordance obniża zaufanie do UI ("co tu w ogóle reaguje na klik").

**Kierunek:** Albo zdjąć button-like styling z elementów czysto informacyjnych (płaska etykieta, badge bez bordera), albo nadać im funkcję — np. klik na pigułkę „pilne" filtruje listę po severity, klik na `płatność` skrolluje drawer do sekcji płatności. Konsekwentnie w całym admin UI.

## `/admin/automation` — badge „Valid" wygląda jak przycisk + niespójność językowa

**Stan:** `src/routes/[[lang=lang]]/admin/automation/+page.svelte:407` renderuje `<span class="badge badge--ok|warn|danger">{sumStatus === 'ok' ? 'Valid' : 'Pod' : 'Ponad'}</span>` jako status walidacji sumy planu. Dwa problemy: (1) `.badge` ma border + padding + kolorowe tło → wygląda klikalnie (ta sama klasa false affordance co kolumny Sales Board / pigułki Alert Queue), (2) etykieta `Valid` po angielsku, reszta UI po polsku („Pod", „Ponad", „Suma pozycji równa się cenie segmentu").

**Trigger:** Operator próbuje kliknąć badge (nie reaguje); niespójność jęz. obniża jakość konsoli.

**Kierunek:** (1) Zmienić `Valid` na `OK` lub `Zgadza się`. (2) Spłaszczyć styling badge'a statusowego (bez bordera) albo zunifikować z resztą badge'y informacyjnych (decyzja parasolowa z [false affordance] wyżej).

## Alert Queue — koja jako primary identifier, nie booking ID

**Stan:** Alert Queue renderuje header alertu jako `SA-2026-3508 · Koja A1 · przypomnienia 0`. Booking ID wizualnie dominuje, koja jest w treści. Dla alertów typu „Brak danych uczestnika" / „Niekompletne dane uczestnika" akcja jest **per koja** (jeden uczestnik, jeden token), nie per booking.

**Trigger:** Operator widząc 4 alerty z tym samym booking ID (`SA-2026-1155 ×2`, `SA-2026-3508 ×2`, `SA-2026-4842 ×3`) musi szukać koi w drugiej linijce żeby zrozumieć którą koje obsługuje.

**Kierunek:** Koja jako primary (większy font / lewy panel), booking ID jako kontekst (mniejszy, w treści). Albo grupować alerty per booking gdy z jednego bookingu jest 2+ alertów tej samej klasy.

## Alert Queue — sortowanie po severity tworzy wizualne duplikaty bookingu

**Stan:** Lista posortowana po severity (Pilne → Dane → Info). `SA-2026-4842` pojawia się na pozycji 1 (Rata zaległa, Pilne) i ostatniej (Link wygasł, Info), między nimi 4 inne alerty. Operator widzi „ten sam booking dwa razy" jako wizualny zgrzyt.

**Trigger:** Naturalna interpretacja „bug, lista źle zsortowana"; przy większej liczbie alertów problem rośnie.

**Kierunek:** Secondary sort po booking ID po severity, albo grupowanie wizualne per booking (collapsible section per booking z miniaturą severity). Decyzja parasolowa z poprzednią pozycją Alert Queue.

## Alert Queue — drawer nie zaznacza klikniętej koi

**Stan:** Klik „Otwórz rezerwację" przy alercie dla koi B1 otwiera drawer z całym bookingiem (B1 + B2). Brak focusu / scrollu / highlightu na koję która wygenerowała alert. Operator musi sam szukać której koi dotyczy akcja.

**Trigger:** Booking z 2+ kojami i alertem na konkretną — operator klika, traci kontekst który uczestnik wymaga uwagi.

**Kierunek:** Deep link `?berth=<berthId>` na link „Otwórz rezerwację", drawer scrolluje + highlightuje sekcję uczestnika dla tej koi. Stan zaznaczenia widoczny ~3s, potem fade.

## `/admin/special` — stary inline toast do migracji na globalny toaster

**Stan:** `src/routes/[[lang=lang]]/admin/special/+page.svelte` używa lokalnego inline toasta (własny render + style + state). Reszta admin UI (booking-drawer od 2026-05-16, crew/confirm od 2026-05-17) już zmigrowana na `toastState.addToast`. `/admin/automation` ma tę samą zaległość (osobna pozycja backlogu wyżej).

**Trigger:** Niespójność UX (różne miejsca/styl powiadomień w jednej konsoli), dług niedokończonej migracji toasterowej.

**Kierunek:** Zmigrować wszystkie wywołania toasta na `/admin/special` na `toastState.addToast` — analogicznie do `/admin/automation` i booking-drawer. Wyrzucić lokalny render/style.

## `/admin/special` — niespójność językowa „Complimentary"

**Stan:** Panel „Complimentary" (rezerwacje bezpłatne admin) używa angielskiej etykiety w polskim UI. Czwarta lokalizacja niespójności jęz. po `Valid` (badge automation), oraz CTA confirmation page.

**Trigger:** Operator widzi angielski label między polskimi sekcjami — drobiazg, ale obniża jakość konsoli i sygnalizuje brak code review na inline literały.

**Kierunek:** Etykieta po polsku — propozycje: „Rezerwacje gratisowe" / „Bezpłatne" / „Gratisy". Decyzja parasolowa z resztą jęz. niespójności (jeden język per UI).

## `/admin/crew` — placeholder strona bez funkcji

**Stan:** `src/routes/[[lang=lang]]/admin/crew/+page.svelte` to placeholder z tekstem „Edycja danych uczestników (Etap 5) oraz publiczny flow potwierdzania (Etap 6) trafią tutaj". Obie funkcje już zrealizowane gdzie indziej: Etap 5 w `booking-drawer.svelte` (admin edytuje dane per koja), Etap 6 w `/crew/confirm/[token]/+page.svelte` (public token confirm). Strona `/admin/crew` nie ma własnej zawartości, ale sidebar w `+layout@.svelte:9` dalej linkuje do niej.

**Trigger:** Operator klika „Dane załogi" w sidebarze — trafia na pustą stronę. False navigation, sygnał „nieukończony admin".

**Kierunek:** Najsensowniej (preferowane) — **cross-booking overview uczestników**: tabela wszystkich uczestników wszystkich bookingów ze statusem (`missing` / `drafted_by_admin` / `confirmed` / `expired`), filtry per status + per segment, klik → otwiera booking-drawer scrollowany do tej koi (synergia z deep-link backlogiem Alert Queue). Realny ops-tool: kapitan ma jedną stronę „kto jeszcze nie potwierdził danych" cross-cały rejs. Fallback (jeśli overview nie ma priorytetu) — usunąć route + link w sidebarze, dead navigation precz.

## Reactive clock dla odliczania held (alert + KPI)

**Stan:** `src/convex/admin.ts:319-322` liczy `minutesLeft = (holdExpiresAt - now) / 60000` z `now = Date.now()` **wewnątrz query**. Convex subscription reactive na zmiany **DB**, nie na upływ czasu — Convex nie wie że minuta minęła. Identyczny problem: `src/routes/[[lang=lang]]/admin/+page.svelte:53-56` (`formatHoldCountdown` używa `Date.now()` w funkcji, `$derived` przelicza tylko gdy źródło DB się zmieni). Skutek: alert „Held kończy się za 15 min" zamrożony, KPI „N do wygaśnięcia" zamrożone — odliczanie nie tyka aż coś z DB nie pchnie nowego stanu.

**Trigger:** Operator patrzy na alert / KPI w admin overview — odliczanie kłamie, „15 min" wisi 10 minut.

**Kierunek:** Lokalny zegar po stronie klienta — `$state(now)` + `setInterval(() => now = Date.now(), 1000)` w admin page, `$derived` countdown z `now` jako żywego źródła. Alert label też przeliczać klientsko z `holdExpiresAt` (query zwraca timestamp surowy, klient liczy minuty). Wzorzec ogólny: gdy widok zależy od „teraz", nie polegaj na backendzie żeby push'ował upływ czasu — drugi przykład [[concepts/storage-vs-derive-time-based-facts]] po Scenariusz 6 (alert „link wygasł").

## `/admin` — „Checkout" jako subtitle alertu held po angielsku

**Stan:** `src/routes/[[lang=lang]]/admin/+page.svelte:248` renderuje subtitle alertu held jako `'Checkout'`. Piąta lokalizacja niespójności jęz. po `Valid` (`/admin/automation`), `Complimentary` (`/admin/special`), status pill confirmation page i wcześniejsze.

**Trigger:** Operator widzi angielski subtitle w polskim admin UI; ten sam wzorzec false-affordance/jęz. decyzji parasolowej.

**Kierunek:** Subtitle po polsku, propozycje: „Trwa checkout" / „W koszyku" / „Wybrana w checkout". Decyzja parasolowa z innymi niespójnościami jęz. — jeden język per UI, code review łapie inline literały.

## Dashboard żeglarza — pokazuje tylko jedną koję mimo zakupu wielu

**Stan:** Po zakupie kilku kój na jeden booking dashboard użytkownika (`/dashboard`) renderuje tylko jedną z nich (przykład: user kupił SA-2026-7663 + inne, widzi tylko SA-2026-7663). Admin booking-drawer dla tego samego usera/bookingu pokazuje wszystkie koje poprawnie. Niespójność między widokami.

**Trigger:** Kupujący wraca po zakupie kilku kój, widzi tylko jedną — myśli że transakcja się nie dopięła lub pieniądze poszły bez przydziału. Realne ryzyko zgłoszeń „brak mojej rezerwacji".

**Kierunek:** Diagnoza wymaga obejrzenia query `bookingByUser` (prawdopodobnie `bookings` filtrowane po `userId`, ale nie hydratuje wszystkich `berthIds` albo `voyageSegments`). Hipotezy do sprawdzenia: (1) query bierze tylko pierwszy booking usera ignorując pozostałe, (2) renderer dashboardu iteruje tylko po `bookings[0].berthIds[0]`, (3) bookingi dla tego usera mają różne `userId` (np. complimentary utworzone przez admina). Schemat debugowania query → data → write → render (lekcja 2026-05-20).

## Dashboard żeglarza — „cała trasa rejsu" zawsze podświetla Gibraltar → Madera

**Stan:** Sekcja „Cała trasa rejsu" na dole `/dashboard` zawsze ma podkreślony segment **Gibraltar → Madera**, niezależnie od tego który segment user faktycznie kupił. Korzeń: design mock `docs/design/design_handoff_sailing_architects/components/dashboard.jsx:7` hardcoduje `name: 'Gibraltar → Madera'` i flagi `active: true` na konkretnych portach (linie 298-299) — wartości prawdopodobnie przeszły do faktycznego komponentu bez przepięcia na dane z bookingu.

**Trigger:** User kupuje segment Palma → Gibraltar lub Madera → Teneryfa, widzi że dashboard podświetla coś innego — sygnał „aplikacja kłamie".

**Kierunek:** Zamienić hardcode'owany `name` na `booking.voyageSegment.name` (z hydrowanego query). Timeline portów (`active`) derive'ować z bookingu (porty należące do segmentu są `active`, reszta nie). Ujednolicić źródło danych: `voyageSegments` z `$lib/data/voyage-segments.ts` (4 etapy s1-s4) ma wszystkie potrzebne pola.

## `/admin/automation` — domyślny szablon wygląda na zapisany plan przy pierwszym wejściu

**Stan:** Wchodząc po raz pierwszy na `/admin/automation` (lub przeskakując między segmentami bez zapisanego planu), UI od razu pokazuje wygenerowany domyślny szablon (Zaliczka + 2 raty) z polami `label`/`amount`/`dueAt`. Brak wskaźnika że to **draft niezapisany** — wygląda identycznie jak plan załadowany z bazy. Admin myśli że plan istnieje, klika do następnego segmentu, plan nigdy nie ląduje w DB.

**Trigger:** Operator konfiguruje plany dla wszystkich segmentów, część zapisuje, część przeskakuje uznając „już jest". W bazie tylko część segmentów ma plan. User próbuje zakupu segmentu bez planu → fallback „Całość" w Step 5 → API odrzuca (zob. A4b — przy okazji ujawnione przy tym samym fixie).

**Kierunek:** (1) Wizualnie odróżnić draft od zapisanego — banner „Niezapisany draft z szablonu" + zmiana koloru sekcji + przycisk „Zapisz plan" wyróżniony. (2) Alternatywa: nie generować draftu automatycznie, pokazać pusty stan z przyciskiem „Wygeneruj z szablonu". (3) Po zmianie segmentu wykryć niezapisane zmiany i ostrzec (`beforeunload` / dialog „Masz niezapisane zmiany, kontynuować?").

## `/book` Step 5 — fallback „Całość" maskuje brak planu w bazie

**Stan:** `paymentOptions` w `src/routes/[[lang=lang]]/book/+page.svelte:367–376` ma fallback: gdy `plan` jest null albo `plan.items.length === 0`, UI i tak pokazuje pojedynczy radio „Całość" (`sortOrders: [1]`). User wybiera, klika „Zapłać", API `validateSelection` (`src/routes/api/stripe/create-intent/+server.ts:99–101`) odtwarza schedule po swojej stronie, sortOrder UI nie matchuje serwerowego → toast „Nieprawidłowy wybór płatności". Bug ujawniony przy A4b ale klasa inna — UX user-facing, fallback maskuje stan błędny zamiast go pokazać.

**Trigger:** Segment bez zapisanego planu (powiązane z A4b oraz pozycją „domyślny szablon wygląda na zapisany plan"). User dochodzi do Step 5, widzi normalną opcję płatności, klika i dostaje cryptic toast.

**Kierunek:** (1) Usunąć fallback, gdy `!plan || plan.items.length === 0` zwrócić pustą tablicę `paymentOptions = []`. (2) W template Step 5 dodać branch: gdy `paymentOptions.length === 0` pokazać komunikat „Plan płatności dla tego segmentu nie jest jeszcze skonfigurowany — skontaktuj się z biurem" + zablokować Step 5 (przycisk „Zapłać" już jest disabled przez `!selectedPaymentOption`, ale komunikat brakuje). (3) Alternatywa: zwracać `plan` jako wymagany w `voyageSegmentDetail` query — gdy brak planu, w ogóle blokować wejście w `/book` na poziomie route.


## `/admin/automation` — kolumna „Typ" pozycji wystawia raw enum adminowi

**Stan:** Każda pozycja planu ma dropdown „Typ" z 5 opcjami: `deposit`, `installment`, `balance`, `full`, `custom`. Admin może wybrać dowolny kind dla dowolnej pozycji — np. plan z pozycją 1 jako `full` (kwota cząstkowa 690 PLN) + pozycje 2/3 jako `installment`/`balance`. Schema przepuszcza, save działa, ale semantyka nonsensowna — `full` znaczy „zapłać całość teraz, brak terminu", a tu jest 1/3 ceny z datą.

**Trigger:** Footgun. Admin nie wie do czego służy `kind`, klika cokolwiek. Downstream `kind` decyduje o (1) skip walidacji `dueAt`, (2) prawdopodobnie alert/monit logice, (3) Stripe schedule mapping. Wartość raw enum nie powinna być w UI admina.

**Kierunek:** (1) Ukryć kolumnę „Typ" w UI. Autoderywować `kind` z pozycji w liście — pierwsza = `deposit`, środkowe = `installment`, ostatnia = `balance`, lub `full` gdy template = `full` (1 item). (2) Alternatywa: zostawić kolumnę ale jako read-only z labelami PL („Zaliczka"/„Rata"/„Wyrównanie"/„Całość"). (3) Dla template `custom` użytkownik dodaje pozycje bez przypisanego `kind` — wszystkie jako `custom`.

## `/admin/automation` — brak ostrzeżenia o niezapisanym drafcie przy zmianie szablonu/segmentu

**Stan:** User edytuje plan (zmienia kwoty, dodaje pozycje), nie klika „Zapisz", zmienia szablon w selecie → items się regenerują z szablonu, draft user'a znika bez ostrzeżenia. Analogicznie zmiana segmentu w `segment-strip` (linia 286-290) ładuje plan innego segmentu bez ostrzeżenia.

**Trigger:** Cicha utrata pracy. Wzmocnienie istniejącej pozycji „domyślny szablon wygląda na zapisany plan" (linia ~324) — ten sam korzeń (brak rozróżnienia draft/saved), inny przejaw.

**Kierunek:** (1) Track `isDirty` (boolean) — true gdy items/planName/allowFullPayment różnią się od ostatnio załadowanego planu. (2) Przy zmianie szablonu/segmentu z `isDirty=true` pokaż `confirm()` lub modal „Masz niezapisane zmiany — kontynuować?". (3) `beforeunload` handler dla nawigacji poza stronę. (4) Zsynchronizować z pozycją A4c.

## `/admin/automation` — „Generuj pozycje" button po fix A5 — przemianować

**Stan:** Po A5 (sesja 2026-05-25) zmiana selecta szablonu sama regeneruje pozycje. Przycisk „Generuj pozycje" (linia 307-309) dalej wywołuje `regenerate()` — przydatne jako re-roll po ręcznej edycji items (user pozmieniał kwoty/dodał wiersze, chce reset z szablonu). Ale label „Generuj pozycje" sugeruje że bez kliknięcia pozycje nie istnieją.

**Trigger:** Nieoczywisty cel przycisku po A5. Mylący label.

**Kierunek:** Przemianować na „Resetuj z szablonu" + tooltip „Nadpisuje obecne pozycje świeżymi z wybranego szablonu". Niski priorytet, polish.
