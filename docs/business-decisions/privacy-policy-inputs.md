# Polityka prywatności — materiał wejściowy

**Status:** wejście do decyzji, nie decyzja. ADR powstanie z odpowiedzi Michała.
**Data:** 2026-08-14
**Pozycja backlogu:** LEGAL-2 (polityka prywatności), odblokowuje LEGAL-9 (checkbox akceptacji)

## Po co ten dokument

Regulamin opublikowany 2026-08-13 odsyła do polityki prywatności pod adresem
`https://www.sailing-architect.com/polityka-prywatnosci`. Ta strona **nie istnieje** —
zwraca 404 od 2026-08-14. Link jest celowy i wyprzedza stronę, ale termin biegnie.

Polityki nie da się napisać bez decyzji Michała i oceny prawnika. Da się natomiast
dostarczyć im **fakty o tym, co system faktycznie robi z danymi** — czego żadne z nich
nie ma skąd wziąć. To jest zawartość tego pliku.

**To nie jest opinia prawna.** Kwalifikacja — czy rejs składkowy podlega wyłączeniu z
RODO, jaka podstawa dla danych o zdrowiu, jakie terminy retencji — należy do prawnika.

---

## Część 1 — fakty z systemu

### 1.1 Jakie dane osobowe zbieramy

Źródło: `src/convex/schema.ts`.

**`bookings`** (linie 66-116) — kupujący:
identyfikator konta Clerk, adres e-mail, numer rezerwacji `SA-2026-XXXX`, kwoty,
identyfikator płatności Stripe, harmonogram rat.

**`crewProfiles`** (linie 233-250) i **`bookingParticipants`** (linie 160-208) — uczestnicy:

| dana | pole |
|---|---|
| imię, nazwisko | `firstName`, `lastName` |
| e-mail, telefon | `email`, `phone` |
| data urodzenia | `dateOfBirth` |
| miejsce urodzenia | `birthPlace` |
| narodowość | `nationality` |
| typ i numer dokumentu tożsamości | `docType`, `docNumber` |
| kontakt alarmowy (imię + telefon osoby trzeciej) | `emergencyContactName`, `emergencyContactPhone` |
| umiejętność pływania | `swimmingAbility` |
| doświadczenie żeglarskie | `sailingExperience` |
| **wymagania dietetyczne** | `dietaryRequirements` |
| **notatki medyczne** | `medicalNotes` |

Dwa ostatnie pola — patrz punkt 2.3.

**`adminAuditLog`** — ślad zmian administracyjnych.
**`crewConfirmationTokens`** — hashe tokenów do potwierdzenia danych przez uczestnika.

### 1.2 Komu dane są powierzane

| dostawca | rola | lokalizacja |
|---|---|---|
| Convex | baza danych | **Irlandia** (`eu-west-1`, potwierdzone 2026-07-13) |
| Clerk | konta użytkowników, logowanie | USA |
| Stripe | płatności kartą | USA |
| Brevo | poczta transakcyjna | Francja |
| Vercel | hosting, logi serwera | USA |

Logowanie społecznościowe przez **Google** i **Facebooka** (Clerk).

Transfer poza EOG **jest faktem**, nie hipotezą — Clerk, Stripe i Vercel hostują w USA.
Każdy z tych dostawców wymaga umowy powierzenia (DPA) — pozycja SEC-2 (b), otwarta.

### 1.3 Czego w systemie NIE ma

Sprawdzone wprost w kodzie:

- **zero narzędzi analitycznych** — brak Google Analytics, Plausible, Posthog, Hotjar
- **zero pikseli marketingowych** — brak Meta Pixel i pokrewnych
- **brak newslettera** — Brevo służy wyłącznie poczcie transakcyjnej

Konsekwencja: sekcja o cookies będzie **znacznie krótsza** niż w typowych politykach.
Ciasteczka są techniczne (sesja Clerka, płatność Stripe), nie marketingowe.

---

## Część 2 — trzy kwestie do rozstrzygnięcia

### 2.1 „Prywatny, niekomercyjny" nie znaczy „poza RODO"

ADR-021 ustala formę: prywatny rejs niekomercyjny składkowy.

RODO przewiduje wyłączenie dla działalności **czysto osobistej lub domowej**
(art. 2 ust. 2 lit. c). Jeśli ktoś czyta ADR-021 jako „rejs prywatny, więc RODO nie
dotyczy" — to założenie trzeba sprawdzić, zanim oprze się na nim decyzje.

Fakty przemawiające przeciw wyłączeniu:

- koje sprzedawane przez internet **nieokreślonemu kręgowi odbiorców**
- płatności kartą przez Stripe, harmonogram rat, automatyczne monity
- panel administracyjny, systematyczne przetwarzanie danych uczestników
- publiczna strona z ofertą

To przetwarzanie zorganizowane, nie lista znajomych w notesie. **Rozstrzyga prawnik** —
naszym zadaniem było dostarczyć powyższą listę, żeby ocena szła po faktach.

### 2.2 Administrator jako osoba fizyczna

Decyzja Michała z 2026-08-10: nazwa firmy nie jest publikowana; na stronie zostaje
kontakt i osoba „Michał Smolarski" (LEGAL-7 b).

**To nie koliduje z polityką prywatności.** RODO wymaga tożsamości administratora i
danych kontaktowych — nie wymaga NIP-u, REGON-u ani nazwy firmy. Osoba fizyczna jako
administrator danych jest normalna.

Otwarte: **czy wystarczy adres e-mail, czy potrzebny adres pocztowy**. Dla osoby
prywatnej to adres domowy — realny koszt prywatności, nie formalność. Pytanie do prawnika.

### 2.3 Dane o zdrowiu — kategoria wymagająca odrębnej zgody

`medicalNotes` i `dietaryRequirements` to **dane szczególnej kategorii** (art. 9 RODO).
Notatki medyczne wprost. Wymagania dietetyczne pośrednio — potrafią ujawnić religię
(halal, koszer) albo chorobę (celiakia).

Reżim jest ostrzejszy: przetwarzanie takich danych jest zakazane, chyba że zachodzi
jeden z wyjątków z art. 9 ust. 2. W tej sytuacji realny jest jeden — **wyraźna zgoda**.

**Konsekwencja projektowa dla LEGAL-9:**

> Akceptacja regulaminu nie jest zgodą na przetwarzanie danych o zdrowiu.

To musi być osobne pole, przy formularzu danych uczestnika — nie przy kasie. Kupujący
w kasie nie podaje jeszcze notatek medycznych; podaje je uczestnik pod linkiem z tokenem.
Zgoda musi stać tam, gdzie zbierane są dane.

Do rozważenia z prawnikiem: czy te dwa pola są w ogóle **niezbędne**. Notatki medyczne
mają sens dla bezpieczeństwa na morzu, ale można je zbierać poza systemem, u skipera,
i nie przechowywać w bazie.

### 2.4 Kupujący wpisuje dane cudze

Kupujący bierze cztery koje i wpisuje dane trzech kolegów. Ci koledzy nie mieli kontaktu
z serwisem — ich dane pozyskano **nie od nich**.

RODO ma na to osobny obowiązek informacyjny (art. 14): trzeba poinformować osobę, że jej
dane są przetwarzane, przez kogo i po co.

**Miejsce już istnieje.** Tabela `crewConfirmationTokens` i mail z linkiem do potwierdzenia
danych to dokładnie ten moment kontaktu. Klauzula informacyjna wchodzi do treści tego maila.
Nic nowego nie trzeba budować — trzeba dopisać tekst.

To samo dotyczy pola `emergencyContactName` / `emergencyContactPhone`: zapisujemy dane
osoby trzeciej, która o rejsie może nic nie wiedzieć.

---

## Część 3 — pytania do Michała

Odpowiedzi są faktograficzne, nie prawne. Bez nich polityka nie może powstać.

1. **Komu przekazujesz manifest załogi?** Kapitanat, straż graniczna, ubezpieczyciel,
   czarterodawca jachtu? Numery dokumentów zbieramy w jakimś celu, a ten cel wyznacza
   listę odbiorców danych. W kodzie jej nie ma — wie ją tylko organizator.
2. **Jak długo dane mają zostać po rejsie?** Numer paszportu przechowywany bezterminowo
   to ryzyko bez korzyści. Potrzebny termin i powód (roszczenia, księgowość).
3. **Czy planujesz newsletter lub inny marketing?** Dziś nie ma. Jeśli ma być — osobna
   zgoda, osobna sekcja polityki.
4. **Czy ubezpieczyciel dostaje dane uczestników?** Kolejny odbiorca, niewidoczny w kodzie.
5. **Czy notatki medyczne i dieta muszą trafiać do bazy?** Patrz 2.3 — najprostsze
   rozwiązanie problemu to nie zbierać.

## Część 4 — pytania do prawnika

Ta sama lista co LEGAL-7 (c) i LEGAL-10 — do zadania jedną rozmową.

1. Czy rejs składkowy w opisanej formie (część 2.1) podlega wyłączeniu z art. 2 ust. 2 lit. c?
2. Podstawa prawna dla danych o zdrowiu i diety — wyraźna zgoda czy inny wyjątek z art. 9 ust. 2?
3. Czy administrator będący osobą fizyczną musi podać adres pocztowy, czy wystarczy e-mail?
4. Terminy retencji dla danych dokumentów tożsamości po zakończeniu rejsu.
5. Język wiążący dokumentów prawnych przy dwujęzycznej stronie (LEGAL-10).

---

## Część 5 — materiał źródłowy z innego projektu

Michał/Tomek wskazali gotową politykę z `domy-modulowe`:
`src/routes/[[lang=lang]]/(app)/polityka-prywatnosci/+page.svelte`,
opublikowana pod `https://domy-modulowe.eu/polityka-prywatnosci`.

**Czego ten plik nie zawiera: treści.** To 414 linii układu i 80 kluczy Paraglide
(`m.privacy_*`). Tekst siedzi w `messages/pl.json` — 7885 znaków.

### Co da się przenieść

- **kolejność sekcji**: administrator → zakres → cele → odbiorcy → transfer poza EOG →
  retencja → prawa → cookies → logi → bezpieczeństwo → zmiany → data wejścia w życie
- **lista praw z RODO** (art. 15-21) — uniwersalna, niezależna od projektu
- **wzorzec układu**: lista jako tablica + `{#each}`

### Czego przenieść nie można

| bariera | powód |
|---|---|
| mechanizm i18n | tamten projekt używa **Paraglide**, `AGENTS.md` wymienia go w „Czego NIE robić" — tu jest **Wuchale**, wyciągający naturalne stringi |
| klasy CSS | `bg-surface`, `text-headline-sm`, `font-display` to skala Material tamtego projektu; tu navy/brass, Playfair/DM Sans, `border-radius: 0` |
| administrator | „Technologie Modułowe, Wieliczka, ul. Polna 2" wobec osoby fizycznej bez publikowanej nazwy |
| zakres danych | tam formularz kontaktowy i cookies; tu dokumenty tożsamości, dane medyczne, płatności |
| odbiorcy | tam ogólniki („dostawcy hostingu, CRM"); tu pięciu dostawców znanych z nazwy i lokalizacji |
| transfer poza EOG | tam tryb przypuszczający („**jeżeli** narzędzia poza EOG"); tu transfer jest pewny — po skopiowaniu zdanie staje się **nieprawdziwe** |
| retencja | brak reguły dla danych paszportowych |

Ostatnie trzy wiersze to nie brak precyzji, tylko zdania, które po skopiowaniu byłyby
fałszywe w dokumencie, którym organizator odpowiada przed UODO.

---

## Kolejność prac

1. Michał odpowiada na pytania z części 3 → treść polityki może powstać
2. Prawnik ocenia część 4 → rozstrzygnięcie 2.1 i 2.3
3. Strona `/polityka-prywatnosci` (link z regulaminu przestaje zwracać 404)
4. Klauzula informacyjna w mailu do uczestnika (art. 14, część 2.4)
5. LEGAL-9 — checkbox akceptacji regulaminu **plus osobna zgoda na dane o zdrowiu**

Punkty 1 i 2 idą równolegle. Punkt 5 nie powinien wejść na produkcję przed punktem 3 —
inaczej klient akceptuje regulamin odsyłający do nieistniejącej polityki.

## Źródła

- `src/convex/schema.ts` — inwentarz pól
- `docs/business-decisions/ADR-021-private-non-commercial-membership-cruise.md` — forma prawna rejsu
- `docs/business-decisions/ADR-023-terms-published-as-versioned-file.md` — sposób publikacji dokumentów
- `docs/backlog.md` — SEC-1 (szyfrowanie i retencja), SEC-2 (region i DPA), LEGAL-2, LEGAL-7, LEGAL-9, LEGAL-10
