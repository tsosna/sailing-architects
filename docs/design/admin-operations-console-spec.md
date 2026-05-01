# Admin Operations Console · UI/UX Spec

## Cel

`/admin` ma być centrum operacyjne sprzedaży i kompletności załogi. Główne pytanie ekranu:

> Co dziś wymaga reakcji kapitana, żeby sprzedaż, płatności i dane uczestników nie utknęły?

## Decyzje produktowe

- Dostęp do `/admin` zabezpieczony przez Clerk role / metadata.
- Produkcyjnie dostęp ma kapitan / operator z rolą admin w Clerk; w dev dostęp ma też właściciel projektu jako operator testowy.
- Brevo zostaje providerem maili i monitów.
- Alerty admina pojawiają się w panelu i idą e-mailem do adresu analogicznego do `HANDOFF_REPORT_TO`.
- WhatsApp/SMS startują jako ręczne „kopiuj wiadomość”; automatyzacja zostaje przyszłym kierunkiem.
- Harmonogram rat jest elastyczny: admin wybiera liczbę rat / pozycji dla segmentu, a plan jest przepisywany jako domyślny snapshot do bookingu.
- Rezerwacje `captain` i `complimentary` są modułem obok Sales Board.
- Audit log zostaje na później; na teraz wystarczy operacyjna historia kontaktu.

## Ekrany / stany prototypu

Prototyp HTML: `docs/design/huashu-admin-operations-console.html`

Powiązany spec modułu danych załogi:
`docs/design/admin-crew-data-verification-spec.md`

Etapy wdrożenia i prompty inżynierskie:
`docs/design/admin-implementation-prompts.md`

Wzorzec stylu maili:
`docs/design/admin-panel-review-for-michal.html` oraz
`docs/design/admin-clickable-prototype-email.html`

### 1. Sprzedaż i alerty

- KPI segmentu: sprzedane, wpłacono, do wpłaty, zaległe, braki danych, holdy, następny alert.
- Segment switcher dla etapów rejsu.
- Sales Board jako CRM/tabela rezerwacji.
- Alert Queue z priorytetami i szybkimi akcjami.

### 2. Booking drawer

Otwierany z wiersza Sales Board.

- Podsumowanie rezerwacji.
- Snapshot harmonogramu płatności.
- Uczestnicy per koja.
- Edycja danych uczestnika przez admina.
- Wysyłka linku do potwierdzenia danych przez żeglarza.
- Historia kontaktu.
- Szybki monit adhoc.

### 3. Automatyzacje

- Globalny harmonogram rat per segment.
- Generator planu: zaliczka + dowolna liczba rat / pozycji.
- Możliwość zapisania kilku szablonów, np. `Zaliczka + 2 raty`, `Zaliczka + 3 raty`, `Całość teraz`.
- Reguły monitów płatności.
- Reguły monitów danych załogi.
- Adres e-mail dla alertów admina.

### 4. Miejsca specjalne

- Lista miejsc `captain`.
- Lista/draft rezerwacji `complimentary`.
- Miejsce na późniejsze rozwinięcie, bez mieszania ich z normalną sprzedażą.

## Dane wymagane do implementacji

- Admin guard:
  - Clerk metadata role: `admin` jako podstawowy mechanizm.
  - Produkcja: tylko kapitan / operatorzy z rolą admin.
  - Dev: dodatkowy dostęp dla właściciela projektu jako operatora testowego, najlepiej przez dev-only env allowlist, nie przez produkcyjną whitelistę w kodzie.
  - Redirect / forbidden state dla userów bez roli.
- Admin overview query:
  - agregaty per segment,
  - lista bookingów z kupującym, kojami, payment status, data status, next action.
- Alert queue query:
  - zaległe raty,
  - raty zbliżające się do terminu,
  - brakujące dane uczestników,
  - dane wpisane przez admina, ale niepotwierdzone przez uczestnika,
  - korekty zgłoszone przez uczestników,
  - holdy bliskie wygaśnięcia,
  - błędy wysyłki maili, jeśli będą zapisywane.
- Reminder mutation/action:
  - wysyłka adhoc przez Brevo,
  - zapis `lastReminderSentAt` / `reminderCount`,
  - opcjonalna kopia do admina.
- Email templates:
  - styl navy/brass jak w mailach wysłanych do Michała,
  - prosty, elegancki układ tabelaryczny kompatybilny z klientami pocztowymi,
  - język biznesowy i ludzki, bez technicznego żargonu.
- Automation settings:
  - globalny plan rat per segment,
  - liczba rat / pozycji planu edytowana przez admina,
  - kwoty i terminy każdej pozycji,
  - snapshot planu przepisywany do bookingu przy tworzeniu rezerwacji,
  - ustawienia przypomnień,
  - adresy alertów admina.

## Elastyczność rat

Plan płatności nie powinien być zakodowany jako stałe `zaliczka + rata 1 + rata 2`.

Rekomendowany model UX:

- Admin wybiera szablon lub liczbę pozycji płatności dla segmentu.
- System generuje wiersze planu: `Zaliczka`, `Rata 1`, `Rata 2`, `Rata N`, `Dopłata końcowa` albo `Całość`.
- Każdy wiersz ma: nazwę, typ, kwotę za koję, termin, kolejność.
- Suma planu musi równać się cenie za koję dla segmentu.
- Przy tworzeniu bookingu plan globalny jest kopiowany do `bookingPayments`.
- Po skopiowaniu booking ma własny snapshot, żeby późniejsza zmiana planu segmentu nie zmieniała już istniejących rezerwacji.
- W wyjątkowych przypadkach admin może ręcznie skorygować snapshot konkretnego bookingu przed wysłaniem płatności / monitu.

## Ton UI

Panel ma być gęsty, spokojny i operacyjny. Mniej marketingu, więcej skanowania:

- navy/brass zgodnie z identyfikacją Sailing Architects,
- ostre krawędzie,
- brass tylko dla priorytetów i akcji,
- tabele, kolejki i drawery zamiast dużych kart opisowych,
- tekst krótki, zadaniowy, bez instruktażowego tonu.
