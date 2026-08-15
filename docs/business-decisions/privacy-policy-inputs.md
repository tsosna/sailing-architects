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
6. **[LEGAL-12 b — jedyne pytanie z terminem, nie łączyć z resztą rozmowy]** Do 2026-08-15
   plik PDF z potwierdzeniem rezerwacji — zawierający dane uczestników, w tym informacje
   o stanie zdrowia i diecie — dało się pobrać **bez zalogowania**, jeśli znało się adres.
   Podatność istniała ok. 107 dni i została naprawiona. **Ustalenie faktu jest niemożliwe:**
   logi hostingu przechowywane są godzinę, a rozróżnienie „żądanie z sesją / bez sesji"
   nie było w ogóle zapisywane, bo mechanizm go nie sprawdzał. Pytanie: czy niemożność
   zweryfikowania, przy podatności realnej i dotyczącej danych z art. 9, sama w sobie
   rodzi obowiązek zgłoszenia z art. 33? **Sformułowanie faktu nie może być łagodzone:**
   nie „nie doszło do nieuprawnionego dostępu", tylko „nie istnieje zapis pozwalający to
   stwierdzić ani wykluczyć". Termin 72 h biegnie od stwierdzenia naruszenia, nie od
   uzyskania opinii — stąd osobny tryb. Pytanie poboczne do tej samej odpowiedzi: jaką
   formę ma mieć dokumentacja z art. 33 ust. 5, skoro zdarzenie opisane jest dziś tylko
   w repozytorium kodu (backlog + treść commita), a nie w dokumencie administratora.

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

## Część 6 — projekt sekcji polityki: odbiorcy, logi, retencja, bezpieczeństwo, art. 9

Powstało 2026-08-15 (III) przy LEGAL-12. **To materiał wejściowy dla prawnika, nie gotowy
dokument** — autor nie jest prawnikiem.

**Zasada redakcyjna przyjęta dla całej części:** brzmienie ma być korzystne dla
administratora, ale **korzystne znaczy precyzyjne, nie nieprawdziwe**. Fałszywe zdanie
w polityce jest samodzielnym naruszeniem art. 5 ust. 1 lit. a i przy kontroli działa
przeciw administratorowi mocniej niż brak dokumentu. Środki: formuły zamiast liczb,
sufity zamiast deklaracji, czasowniki weryfikowalne zamiast przymiotników.

Zdania oznaczone ⚠️ **są dziś nieprawdziwe** — wchodzą do dokumentu dopiero razem
z odpowiadającym im mechanizmem w systemie. Decyzja Tomka 08-15 (III): dorabiamy je
systematycznie, nie usuwamy z projektu.

### 6.1 Fakty ustalone o dostawcach (stan 2026-08-15)

| | ustalenie | źródło |
|---|---|---|
| Vercel — umowa powierzenia | DPA obejmuje **wyłącznie plany Enterprise i Pro**; projekt stoi na Hobby, więc umowy z art. 28 ust. 3 **nie ma**. Pro: $20/mies. | [vercel.com/legal/dpa](https://vercel.com/legal/dpa), LEGAL-13 |
| Vercel — logi | retencja: Hobby 1 h · Pro 1 dzień · Enterprise 3 dni; Observability Plus 30 dni (Pro+, $1,20/1 mln zdarzeń); drainy do własnego magazynu tylko Pro+ | [docs Observability Plus](https://vercel.com/docs/observability/observability-plus) |
| Vercel — region | **funkcje można przypiąć do regionu UE także na Hobby** (jeden region; Pro do pięciu). Domyślny to `iad1` (Waszyngton) i taki jest dziś — `vercel.json` nie ma klucza `regions`. Kandydat: `dub1` (Dublin), ten sam obszar co baza Convex | [docs regions](https://vercel.com/docs/functions/configuring-functions/region), INFRA-13 |
| Vercel — granica tego ruchu | przypięcie regionu przenosi **obliczenia**, nie jurysdykcję: operatorem pozostaje Vercel Inc. (USA), CDN działa globalnie, adresy IP przechodzą przez infrastrukturę w USA (ochrona przed DDoS) | j.w. |
| Stripe — region | **nie oferuje rezydencji danych w UE**; przetwarzanie jest globalne z założenia. Podstawa transferu: EU-US Data Privacy Framework, posiłkowo SCC. Podmiotem kontraktującym w Europie jest spółka irlandzka | [stripe.com/legal/dpa](https://stripe.com/legal/dpa) |
| Convex | region produkcyjny **Irlandia** od startu (SEC-2); log streams i dzienne backupy dopiero od planu Pro ($25/dev/mies.) | SEC-2, [convex.dev/pricing](https://www.convex.dev/pricing) |
| Convex — niewiadoma | czy DPA obowiązuje na planie Free/Starter — **nie ustalone**, strony prawne renderują treść skryptem. Jedno pytanie do supportu, nie zgadywać | LEGAL-13 |

**Wniosek dla polityki:** „dane w Europie" jest prawdą wyłącznie o bazie danych. Konta,
płatności i logi serwera są w USA i żadna konfiguracja tego nie zmienia — Stripe nie ma
opcji europejskiej w ogóle, a europejski region Vercela zmienia miejsce obliczeń, nie
podmiot nimi władający.

### 6.2 Odbiorcy danych i przekazywanie poza EOG

> Dane są przetwarzane z wykorzystaniem usług dostawców działających na zlecenie administratora:
>
> | Dostawca | Rola | Miejsce przetwarzania |
> |---|---|---|
> | Convex | baza danych aplikacji | Unia Europejska (Irlandia) |
> | Vercel | hosting aplikacji i logi serwera | Stany Zjednoczone |
> | Clerk | obsługa kont i logowania | Stany Zjednoczone |
> | Stripe | obsługa płatności | Stany Zjednoczone |
> | Brevo | wysyłka wiadomości e-mail | Unia Europejska |
>
> Przekazywanie danych do dostawców spoza Europejskiego Obszaru Gospodarczego odbywa się
> na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską.
>
> Lista według stanu na dzień wskazany na końcu dokumentu.

**Uzasadnienie brzmienia.** Dane rejsu — te najwrażliwsze — leżą w Irlandii i warto to
powiedzieć wprost, bo to prawda i brzmi dobrze. Zdanie „dane są przechowywane w Unii
Europejskiej" **bez tabeli** byłoby nieprawdą. Tabela pozwala pokazać mocną stronę bez
kłamstwa o reszcie. Klauzula o dacie chroni przed dezaktualizacją: zmiana dostawcy nie
czyni dokumentu fałszywym wstecz.

⚠️ Sformułowanie zakłada, że umowy powierzenia istnieją. Z Vercelem na Hobby jej nie ma
(LEGAL-13) i **żadne brzmienie tego nie obejdzie** — to pierwsze pytanie, jakie zada prawnik.

### 6.3 Logi techniczne

> W związku z działaniem serwisu automatycznie zapisywane są dane techniczne: adres IP,
> data i godzina zapytania, adres żądanej strony oraz informacje o przeglądarce. Służą one
> wyłącznie zapewnieniu bezpieczeństwa i prawidłowego działania serwisu; podstawą jest
> prawnie uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO), polegający na
> ochronie serwisu przed nadużyciami.
>
> Dane te są przechowywane przez okres wynikający z konfiguracji dostawcy hostingu, nie
> dłużej niż 30 dni, a następnie usuwane automatycznie.

**Uzasadnienie brzmienia.**

- **„nie dłużej niż 30 dni"** — sufit, nie deklaracja. Dziś Vercel trzyma je godzinę.
  Wpisanie „1 godzina" związałoby administratorowi ręce i wymagałoby zmiany polityki przy
  każdej zmianie planu; sufit 30 dni pokrywa nawet wariant z Observability Plus.
- **„usuwane automatycznie"** — mocne, a prawdziwe: wygasanie logów jest mechanizmem
  dostawcy, nie obietnicą, że ktoś o tym pamięta.
- **Interes uzasadniony, nie zgoda** — logi serwera to nie cookies; podpięcie ich pod zgodę
  stworzyłoby obowiązek, którego nie ma.

**Uwaga systemowa, ważniejsza niż samo brzmienie:** dłuższa retencja logów **nie jest**
„bardziej zgodna z RODO". Art. 5 ust. 1 lit. e każe trzymać dane nie dłużej, niż to
konieczne, a logi z adresami IP są zbiorem danych osobowych — wydłużenie tworzy nowy zbiór
wymagający własnego celu i okresu. Każdy odbiorca strumienia logów (Axiom, Datadog) to
kolejny podmiot przetwarzający, kolejny transfer do USA i kolejna pozycja w tej tabeli.

### 6.4 Okresy przechowywania danych uczestników

> Dane uczestników przechowujemy przez czas niezbędny do organizacji rejsu, a po jego
> zakończeniu — przez okres przedawnienia roszczeń wynikających z uczestnictwa. Dane
> niezbędne do rozliczeń podatkowych przechowujemy przez okres wymagany przepisami prawa.
> ⚠️ Dane dotyczące stanu zdrowia i wymagań żywieniowych usuwamy po zakończeniu rejsu.

**Uzasadnienie brzmienia.** Formuły zamiast liczb: „okres przedawnienia roszczeń" jest
odesłaniem do ustawy — nie da się go przekroczyć przez pomyłkę i nie wymaga aktualizacji.

⚠️ **Ostatnie zdanie jest dziś nieprawdziwe.** Nic w systemie nie kasuje `medicalNotes`
ani `dietaryRequirements` po rejsie — to SEC-1, niezrobione. Obietnica usuwania bez
mechanizmu usuwania to najkrótsza droga do naruszenia stwierdzonego z własnego dokumentu.
Zdanie wchodzi razem z cronem kasującym, nie wcześniej. Pułapka do zapamiętania przy
projektowaniu tego crona: **backupy mają własną retencję** — dane skasowane wracają
z każdej wcześniejszej kopii, więc reguła kasowania musi obejmować cykl kopii zapasowych,
inaczej słowo „usuwamy" pozostaje nieprawdziwe mimo działającego mechanizmu.

### 6.5 Bezpieczeństwo

> Dostęp do danych uczestników wymaga zalogowania się na konto, dla którego dane zostały
> zapisane. Transmisja między przeglądarką a serwerem jest szyfrowana. Dostęp
> administracyjny do danych ma wyłącznie organizator.

**Uzasadnienie brzmienia.** Trzy zdania, każde weryfikowalne, żaden przymiotnik. Unikamy
sformułowań typu „stosujemy najwyższe standardy bezpieczeństwa" czy „gwarantujemy
poufność" — to obietnice bez treści, które przy incydencie cytuje się administratorowi
jako dowód, że obiecał więcej, niż zrobił.

Zdanie pierwsze jest prawdziwe **od commita `d1b72e94`** (SEC-6, 2026-08-15). Przed nim
byłoby fałszywe — i to jest dobra ilustracja zasady: polityka opisuje system po naprawie,
nie sprzed.

**Czego tu świadomie nie ma:** zdania „dane są szyfrowane" bez kwalifikatora. Szyfrowany
jest transport, pola w bazie nie (SEC-1). Rozszerzenie tej sekcji o szyfrowanie pól
wrażliwych jest możliwe dopiero po SEC-1 — i to kolejne miejsce, w którym SEC-1 wraca jako
warunek treści dokumentu, nie jako ulepszenie techniczne.

### 6.6 Dane o zdrowiu i diecie

> Informacje o stanie zdrowia i wymaganiach żywieniowych podajesz dobrowolnie, wyłącznie
> w celu zapewnienia bezpieczeństwa na pokładzie i przygotowania wyżywienia. Przetwarzamy
> je na podstawie Twojej wyraźnej zgody (art. 9 ust. 2 lit. a RODO). Zgodę możesz wycofać
> w każdej chwili — nie wpływa to na zgodność z prawem przetwarzania sprzed wycofania.
> ⚠️ Podanie tych informacji nie jest warunkiem uczestnictwa w rejsie.

**Uzasadnienie brzmienia.** „Dobrowolnie" i „nie jest warunkiem uczestnictwa" chronią samą
podstawę prawną: zgoda wymuszona — taka, bez której nie da się kupić koi — nie jest zgodą
w rozumieniu RODO i cała podstawa się sypie. Kosztuje to tyle, że pole musi być opcjonalne.

⚠️ Ostatnie zdanie wymaga sprawdzenia w formularzu i ewentualnej zmiany pola na opcjonalne.

Wiąże się z LEGAL-9: zgoda musi być zbierana **osobno** od akceptacji regulaminu i **tam,
gdzie te dane się wpisuje**, nie w kasie.

### 6.7 Czego w tym projekcie świadomie nie ma

- „Nie przekazujemy danych poza EOG" — nieprawda przy Clerk, Stripe i Vercelu.
- „Dane są szyfrowane" bez kwalifikatora — patrz 6.5.
- Konkretnych okresów w dniach — każdy taki wpis to zobowiązanie do pilnowania kalendarza.
- Deklaracji o cookies — osobna sekcja, do napisania po ustaleniu, co realnie ustawiają
  Clerk i Stripe.

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
- `docs/backlog.md` — LEGAL-12 (ocena naruszenia z art. 33), LEGAL-13 (DPA Vercela wymaga planu Pro), SEC-7 (log pobrań dokumentów), INFRA-13 (region funkcji w UE) — wszystkie z 2026-08-15, materiał do części 6
