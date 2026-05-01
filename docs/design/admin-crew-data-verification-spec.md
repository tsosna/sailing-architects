# Admin Crew Data Verification · Handoff / Spec

## Cel

Admin musi móc uzupełniać dane żeglarzy dostarczone innymi kanałami, ale dane nie powinny automatycznie stawać się finalne bez potwierdzenia uczestnika.

Docelowy flow:

1. Admin wpisuje lub poprawia dane uczestnika w `/admin`.
2. System oznacza dane jako robocze / oczekujące na potwierdzenie.
3. Admin wysyła e-mail z unikalnym linkiem.
4. Żeglarz otwiera specjalną stronę bez logowania.
5. Żeglarz potwierdza poprawność danych albo zgłasza korektę.
6. Admin widzi status potwierdzenia w booking drawerze i Alert Queue.

## Dlaczego tak

To jest bezpieczniejszy model niż „admin wpisał, więc dane są kompletne”, bo:

- dane mogą pochodzić z telefonu, WhatsAppa albo maila i łatwo o literówkę,
- uczestnik powinien dostać prostą ścieżkę weryfikacji bez zakładania konta,
- kapitan ma czytelny status operacyjny: brak danych, robocze, wysłane, potwierdzone, wymaga poprawki,
- proces dobrze pasuje do istniejących przypomnień i Brevo.

## Dostęp admina

Ten moduł dziedziczy zasady dostępu z `/admin`:

- produkcyjnie edytować i wysyłać potwierdzenia może kapitan / operator z rolą admin w Clerk,
- w dev dostęp ma też właściciel projektu jako operator testowy,
- publiczna strona potwierdzenia z tokenem nie wymaga logowania, ale pokazuje wyłącznie dane jednego uczestnika.

## Relacja do obecnego modelu

Projekt ma już `bookingParticipants` i `dataStatus: missing | incomplete | complete`.

Nie rekomenduję zastępowania tego modelu. Najczyściej będzie dodać warstwę potwierdzenia:

- `dataStatus` nadal opisuje kompletność pól,
- nowy status potwierdzenia opisuje, czy uczestnik zaakceptował dane.

Przykładowo:

- `dataStatus = incomplete`, `confirmationStatus = none`
- `dataStatus = complete`, `confirmationStatus = drafted_by_admin`
- `dataStatus = complete`, `confirmationStatus = sent`
- `dataStatus = complete`, `confirmationStatus = confirmed`
- `dataStatus = complete`, `confirmationStatus = correction_requested`

## Proponowane statusy

### `dataStatus`

Pozostaje operacyjną miarą kompletności:

- `missing` — brak większości danych.
- `incomplete` — część danych jest wpisana, ale wymagane pola nie są kompletne.
- `complete` — wymagane pola są kompletne.

### `confirmationStatus`

Nowy status weryfikacji:

- `none` — brak procesu potwierdzania.
- `drafted_by_admin` — admin wpisał dane, ale jeszcze nie wysłał linku.
- `sent` — link potwierdzający został wysłany.
- `confirmed` — uczestnik potwierdził poprawność.
- `correction_requested` — uczestnik zgłosił poprawki.
- `expired` — link wygasł, trzeba wysłać nowy.

## Proponowane pola danych

Minimalne rozszerzenie `bookingParticipants`:

- `confirmationStatus?: 'none' | 'drafted_by_admin' | 'sent' | 'confirmed' | 'correction_requested' | 'expired'`
- `confirmationSentAt?: number`
- `confirmationExpiresAt?: number`
- `confirmedAt?: number`
- `correctionRequestedAt?: number`
- `correctionNote?: string`
- `confirmedFromIp?: string` — opcjonalnie, jeśli łatwo dostępne po stronie endpointu.
- `confirmedUserAgent?: string` — opcjonalnie, diagnostycznie.
- `adminEditedAt?: number`
- `adminEditedBy?: string` — Clerk user ID admina albo dev operatora.

Osobna tabela tokenów jest bezpieczniejsza niż token zapisany jawnie na uczestniku:

`crewConfirmationTokens`

- `participantId`
- `bookingId`
- `tokenHash`
- `expiresAt`
- `usedAt?`
- `createdAt`
- `createdByAdminUserId`
- `sentToEmail`
- `lastSentAt?`

Token jawny istnieje tylko w linku e-mail. W bazie zapisujemy hash.

## Bezpieczeństwo linku

Rekomendowane praktyki:

- Token losowy, długi, jednorazowy.
- W bazie zapis tylko hash tokenu.
- Wygasanie po 7-14 dniach.
- Link daje dostęp tylko do jednego `bookingParticipant`, nie do całej rezerwacji.
- Po użyciu ustawiamy `usedAt`.
- Ponowne wysłanie tworzy nowy token i może unieważnić poprzednie.
- Strona nie wymaga Clerk loginu, bo link jest transakcyjnym potwierdzeniem, ale zakres danych jest ograniczony.
- Nie pokazujemy danych innych uczestników ani danych finansowych.

## Routing

Proponowana publiczna ścieżka:

- `/crew/confirm/[token]`

Alternatywa bardziej opisowa:

- `/confirm/crew/[token]`

Preferuję `/crew/confirm/[token]`, bo semantycznie pasuje do istniejącego `/dashboard/crew/[participantId]`.

## UX w `/admin`

W booking drawerze, przy każdej koji/uczestniku:

- status: `Brak danych`, `Niekompletne`, `Robocze`, `Wysłane do potwierdzenia`, `Potwierdzone`, `Wymaga poprawki`, `Link wygasł`
- akcje:
  - `Edytuj dane`
  - `Wyślij do potwierdzenia`
  - `Kopiuj link`
  - `Wyślij ponownie`
  - `Oznacz jako potwierdzone ręcznie` — awaryjnie, np. po telefonie.

Po edycji przez admina:

- jeśli wymagane pola nie są kompletne: `dataStatus = incomplete`
- jeśli wymagane pola są kompletne: `dataStatus = complete`, `confirmationStatus = drafted_by_admin`
- UI pokazuje CTA `Wyślij do potwierdzenia`

Alert Queue powinna uwzględniać:

- kompletne dane, ale brak potwierdzenia,
- link wygasł,
- uczestnik zgłosił korektę,
- e-mail potwierdzający nie został wysłany.

## UX strony potwierdzenia

Strona powinna być bardzo prosta i nie wyglądać jak panel administracyjny.

Nagłówek:

`Potwierdź dane uczestnika rejsu`

Sekcje:

- Dane osobowe
- Dokument
- Kontakt alarmowy
- Doświadczenie / zdrowie / dieta

Akcje:

- `Potwierdzam, dane są poprawne`
- `Chcę zgłosić poprawkę`

Ścieżka korekty:

- pokazujemy textarea `Co wymaga poprawy?`
- opcjonalnie pozwalamy edytować konkretne pola, ale na start textarea jest bezpieczniejsza i prostsza
- po wysłaniu: `confirmationStatus = correction_requested`
- Alert Queue pokazuje adminowi zadanie do ręcznej poprawy.

## E-mail przez Brevo

Typ e-maila:

- temat: `Potwierdź dane uczestnika rejsu Sailing Architects`
- odbiorca: `participant.email` albo `participant.invitedEmail`
- fallback: `booking.buyerEmail`, jeśli uczestnik nie ma własnego maila

Treść:

- krótki kontekst rezerwacji i koji,
- informacja, że dane zostały wpisane na podstawie kontaktu z organizatorem,
- przycisk `Sprawdź i potwierdź dane`,
- informacja o terminie ważności linku,
- kontakt do organizatora.

Styl e-maila:

- bazować na wzorcu z `docs/design/admin-panel-review-for-michal.html` i `docs/design/admin-clickable-prototype-email.html`,
- ciemne tło `#07111e`, główna karta `#0d1b2e`, akcent brass `#d4aa5a` / `#c4923a`,
- layout tabelaryczny i inline styles, żeby działał w klientach pocztowych,
- ton prosty, spokojny, premium, bez technicznego żargonu,
- CTA jako wyraźny przycisk w brass,
- tekst ma tłumaczyć, co żeglarz ma zrobić, nie opisywać mechanizmu tokenów.

## Mutacje / akcje do implementacji

Admin:

- `adminUpdateParticipantData`
  - wymaga Clerk admin role,
  - zapisuje dane uczestnika,
  - ustawia `adminEditedAt`, `adminEditedBy`,
  - przelicza `dataStatus`,
  - ustawia `confirmationStatus = drafted_by_admin`, jeśli dane są kompletne.

- `adminCreateCrewConfirmationToken`
  - wymaga Clerk admin role,
  - tworzy token,
  - zapisuje hash i expiry,
  - zwraca jednorazowo publiczny URL.

- `adminSendCrewConfirmationEmail`
  - wymaga Clerk admin role,
  - tworzy token albo używa świeżego,
  - wysyła e-mail przez Brevo,
  - ustawia `confirmationSentAt`, `confirmationExpiresAt`, `confirmationStatus = sent`.

Public:

- `getCrewConfirmationByToken`
  - weryfikuje hash i expiry,
  - zwraca tylko dane jednego uczestnika.

- `confirmCrewDataByToken`
  - oznacza token jako użyty,
  - ustawia `confirmationStatus = confirmed`, `confirmedAt`,
  - pozostawia `dataStatus = complete`.

- `requestCrewDataCorrectionByToken`
  - zapisuje `correctionNote`,
  - ustawia `confirmationStatus = correction_requested`,
  - oznacza token jako użyty albo pozwala na jeden retry, decyzja implementacyjna.

## Otwarte decyzje przed kodowaniem

- Czy korekta ma być tylko textarea, czy formularz edycji pól?
- Czy link potwierdzający może być użyty tylko raz także dla samego podglądu, czy dopiero po akcji potwierdzenia/korekty?
- Czy po edycji admina już potwierdzonych danych status wraca do `drafted_by_admin`?
- Ile dni ważny jest link: 7 czy 14?
- Czy kopia e-maila potwierdzającego ma iść do admina?

## Rekomendacja MVP

Na start:

- admin może edytować uczestnika w `/admin`,
- po kompletnej edycji status zmienia się na `drafted_by_admin`,
- admin wysyła link przez Brevo,
- link ważny 14 dni,
- strona publiczna pokazuje dane read-only,
- uczestnik może potwierdzić albo wpisać korektę w textarea,
- korekta tworzy alert dla admina,
- pełny audit log i automatyczne WhatsApp/SMS zostają na później.
