# Prompt dla Claude Design — landing: archiwum odbytych rejsów + sprzedaż nowych

> **Co to jest:** gotowy do wklejenia prompt projektowy (nie implementacyjny). Wynikiem ma być hi-fi prototyp HTML w konwencji `docs/design/design_handoff_sailing_architects/Sailing Architects.html`, a nie kod produkcyjny w SvelteKit.
> **Zakres backlogu:** FEAT-5 (multi-rejs + teaser przyszłych), FEAT-14 (dział „po rejsach"), FEAT-15 (Program rejsu), FEAT-13 (lightbox), UI-6 / UI-11 / UI-16 (typografia i kontrast — do zrobienia razem z przebudową landingu).
> **Załącz do promptu:** `docs/design/design_handoff_sailing_architects/Sailing Architects.html`, zrzuty aktualnej strony, `docs/design/design_handoff_sailing_architects/README.md`.

---

## 1. Rola i cel

Jesteś projektantem produktu pracującym nad stroną **Sailing Architects** — prywatnymi, niekomercyjnymi rejsami składkowymi organizowanymi przez Michała. Dziś strona jest **monografią jednego rejsu**: Sail Adventure 2026, Palma de Mallorca → Cabo Verde, cztery etapy, jacht Jeanneau Sun Odyssey 519. Ten rejs właśnie się skończył (październik–listopad 2026).

Twoje zadanie: zaprojektować serwis, w którym **rejsy mają cykl życia**. Zakończony rejs nie znika i nie zostaje martwą stroną sprzedażową — staje się **archiwum z relacją, zdjęciami i filmami**, które jest zarazem najlepszym dowodem wiarygodności przy sprzedaży kolejnych. Rejsy przyszłe wchodzą na jego miejsce jako oferta.

Nie projektuj od zera nowej marki. Istniejący język wizualny (navy + mosiądz, Playfair Display + DM Sans, zero zaokrągleń) jest zatwierdzony i zostaje. Przebudowujesz **architekturę informacji i stany**, a nie estetykę.

---

## 2. Stan faktyczny — co istnieje dziś

Jedna strona główna (`/`) złożona z sekcji, w tej kolejności:

1. **Hero** — pełnoekranowe zdjęcie, slogan „Zapraszamy do załogi na nasz prywatny rejs towarzysko-szkoleniowy", H1 „Sail Adventure", podtytuł „Palma de Mallorca → Cabo Verde · Jesień 2026", dwa CTA („Wybierz koję", „Zobacz trasę") i pasek czterech statystyk: `4 etapy / 10 miejsc / ~2200nm / 41 dni`.
2. **Jacht** (`#vessel`) — „Jeanneau Sun Odyssey 519", galeria zdjęć z lightboxem.
3. **Trasa** (`#route`) — „Cztery etapy przez Atlantyk", mapa i karty etapów.
4. **Kajuty** (`#cabins`) — „Wybierz swoją koję", zakładki etapów + interaktywny plan jachtu (SVG) ze stanami koi.
5. **Składki** (`#pricing`) — „Wybierz swój etap", karty z kwotą za osobę, badge dostępności („Brak miejsc" / „Wolne N miejsc").
6. **FAQ** (`#faq`) — „Zanim wejdziesz na pokład" + CTA do pełnego poradnika załogi (`/poradnik`).
7. **Stopka**.

Nawigacja: `Jacht · Trasa · Kajuty · Składki · Poradnik` + `Panel` + przycisk `Rezerwuj`. Poza landingiem istnieją: `/book` (kasa, 5 kroków), `/dashboard` (panel żeglarza), `/poradnik`, `/admin` (panel Michała).

**Ograniczenie, które wszystko zmienia:** drugi rejs to **inny jacht**. Seszele, katamaran Lagoon 40, 4 kajuty × 2 koje = 8 miejsc wobec 10 na Sun Odyssey. Plan kajutowy, liczba koi i specyfikacja należą do **jachtu**, a trasa, daty, etapy i długość do **rejsu**. Dziś te dwa byty są w projekcie zrośnięte (pasek statystyk w hero miesza `10 miejsc` z jachtu i `41 dni` z wyprawy). Twój projekt ma je **rozdzielić wizualnie i informacyjnie**.

---

## 3. Model stanu rejsu — sedno zadania

Zaprojektuj **pięć stanów** i pokaż każdy z nich. To nie jest ozdobnik: od stanu zależy, co strona obiecuje i czego oczekuje od odwiedzającego.

| Stan | Kiedy | Czego chce odwiedzający | Główne CTA |
| --- | --- | --- | --- |
| **Zapowiedź** | rejs ogłoszony, termin lub składka jeszcze nieustalone, sprzedaż nieotwarta | dowiedzieć się pierwszy | „Powiadom mnie" → zapis e-mail (z early-bird −5%) |
| **W sprzedaży** | są wolne koje | wybrać koję i zapłacić | „Wybierz koję" |
| **Komplet załogi** | wszystkie koje sprzedane, rejs **jeszcze nie wypłynął** | wejść na listę rezerwową albo zobaczyć następny rejs | „Lista rezerwowa" + „Zobacz kolejne rejsy" |
| **W trakcie** | rejs trwa | śledzić | opcjonalny tracker / „Rejs trwa — relacja wkrótce" |
| **Archiwum** | rejs się zakończył | zobaczyć, jak było | „Zobacz relację" + przekierowanie na rejsy w sprzedaży |

**Rozróżnienie, którego nie wolno zgubić:** komplet załogi ≠ archiwum. Rejs z kompletem załogi wciąż jest obietnicą na przyszłość — ma trasę, program, listę rezerwową i opłacających raty uczestników; nie ma relacji, bo jeszcze się nie wydarzył. Archiwum powstaje dopiero po dacie zakończenia. Zaprojektuj oba osobno i pokaż różnicę wizualną (badge, ton, zestaw sekcji).

Dla każdego stanu określ wprost: **które sekcje strony rejsu zostają, które znikają, a które się pojawiają**. Przykładowo w archiwum znika plan koi i karty składek jako akcje sprzedażowe, ale może zostać ich wersja informacyjna („tak wyglądał podział na etapy"); pojawia się relacja, galeria i filmy.

---

## 4. Architektura informacji

Przejście z „strona = jeden rejs" na „serwis = wiele rejsów w różnych stanach":

- **`/` — nowa strona główna, w dwóch rozdzielonych pasach** (decyzja Tomka). Góra: **„Najbliższe rejsy"** — wyłącznie to, co jest w sprzedaży albo zapowiadane. Niżej: **„Byliśmy tam"** — dwie, trzy wybrane relacje z odbytych rejsów jako dowód wiarygodności, z przejściem do pełnego archiwum. Nie jest to jeden strumień chronologiczny: przeszłość rośnie szybciej niż oferta, więc wspólna lista z czasem zepchnęłaby sprzedaż pod zagięcie strony. Pas archiwalny jest **selekcją, nie magazynem** — Michał wybiera, co tam stoi.
- **`/rejsy/[slug]` — strona pojedynczego rejsu.** Dzisiejszy landing staje się jej wariantem „w sprzedaży". Ta sama strona w stanie archiwalnym pokazuje relację.
- **Archiwum** — dostępne z menu i z dołu każdej strony rejsu, jako przegląd odbytych wypraw.
- **Nawigacja.** Dzisiejsze kotwice (`Jacht · Trasa · Kajuty · Składki`) opisują wnętrze jednego rejsu i przestaną działać jako menu globalne. Zaprojektuj **dwa poziomy**: globalny (Rejsy / Archiwum / Poradnik / Panel) i lokalny — w obrębie otwartej strony rejsu. Pokaż przełączanie między rejsami. Mobile ma dostać pełnowartościowy odpowiednik; CTA rezerwacji nie może chować się w hamburgerze.
- **Belka powiadomień.** Wysuwany pasek pod menu: „chcę szczegóły" → zapis e-mail → powiadomienie o starcie sprzedaży + rabat early-bird 5%. Zaprojektuj go tak, by nie przykrywał hero na mobile i dał się zamknąć.
- **Lista rezerwowa — mechanizm realny, nie atrapa** (decyzja Tomka). Przy komplecie załogi odwiedzający ma móc zapisać się na konkretny rejs i etap, a nie tylko na ogólny newsletter. Zaprojektuj:
  - **formularz zapisu** przy rejsie z kompletem — minimum danych, jasne powiedzenie, czego dotyczy zapis (ten rejs, ten etap) i czego nie obiecuje (miejsce nie jest zarezerwowane);
  - **potwierdzenie zapisu bez numeru w kolejce** — osoba zapisana ma wiedzieć, że zapis doszedł, ale nie dostaje pozycji w kolejce. Numer byłby obietnicą sztywnej kolejności, a zwolnioną koję przydziela Michał, patrząc na skład załogi, doświadczenie i podział kajut. Zamiast numeru: zbiorczy sygnał zainteresowania („czeka 7 osób"), który działa na korzyść kolejnych rejsów i niczego nie obiecuje konkretnej osobie;
  - **widok dla Michała** w panelu: kto czeka, na co, od kiedy, i akcja „zaproponuj zwolnioną koję";
  - **sygnał na stronie rejsu**, gdy lista rezerwowa jest długa — to jest ta sama informacja, co „duże zainteresowanie", i działa na korzyść kolejnych rejsów.
  Uwaga na istniejącą mechanikę: **koja potrafi wrócić do puli** (rezygnacja, zwrot, wygasła blokada). Rejs z kompletem załogi nie jest więc stanem końcowym — projekt ma znieść powrót takiego rejsu do sprzedaży bez wyglądania na pomyłkę.

---

## 5. Archiwum rejsu — relacja, zdjęcia, filmy

To jest nowa część produktu, zaprojektuj ją z największą uwagą.

**Treści, które mają się zmieścić:**

- **Relacja — jedna na etap, nie jedna na rejs** (decyzja Tomka). Sail Adventure 2026 ma cztery etapy, więc ma cztery relacje; każda z własnym tekstem, własną galerią i własnymi filmami. Nad nimi może stać krótki wstęp do całej wyprawy, ale ciężar treści leży w etapach. Konsekwencje, które musisz zaprojektować:
  - **nawigacja po etapach wewnątrz archiwum** — czytelnik ma widzieć, ile etapów było, na którym jest i jak przejść do następnego; etapy są uporządkowane geograficznie i w czasie, więc układ ma to oddać (dzisiejsza sekcja „Trasa" z kartami etapów jest naturalnym punktem wyjścia);
  - **stan mieszany** — etap 1 ma pełną relację, etap 3 tylko zdjęcia, etap 4 jeszcze nic. To jest stan normalny, nie wyjątek: Michał będzie dopisywał materiały przez tygodnie po powrocie;
  - **układ: jedna strona rejsu, etapy jako jej sekcje** — nie cztery osobne podstrony. Relacja czyta się jak podróż i ma dać się przejść ciągiem, od Palmy do Cabo Verde, z trwale widoczną nawigacją po etapach. Ciężar zdjęć rozwiązujesz **selekcją, nie podziałem strony**: w sekcji etapu stoi okładka i kilkanaście wybranych kadrów, a pełna galeria etapu („zobacz wszystkie 60 zdjęć") otwiera się osobno. Materiały niżej w strumieniu doczytują się dopiero, gdy czytelnik do nich dojdzie.
- Tekst relacji potraktuj jak **materiał redakcyjny**, nie jak podpis pod zdjęciem. Zaprojektuj typografię dla **długiego czytania** — dzisiejsza skala strony jest zbudowana pod krótkie bloki sprzedażowe i nie uniesie 3000 znaków na etap.
- **Zdjęcia** — galeria z powiększaniem (lightbox już istnieje w sekcji jachtu — zachowaj jego zachowanie: klik, strzałki, Esc, tło). Zaprojektuj galerię, która wygląda dobrze przy **12 zdjęciach i przy 200**, oraz stan „mało materiałów".
- **Filmy — dwa niezależne kanały** (decyzja Tomka):
  - **własny hosting (Cloudinary)** dla krótkich materiałów wpisanych w relację etapu — odtwarzane na stronie, bez obcej marki, z klatką-plakatem jako miniaturą;
  - **YouTube** jako drugi, osobny kanał dla dłuższych filmów — osadzony odtwarzacz niesie własne UI, własny branding i ekran „następne filmy" po zakończeniu. Zaprojektuj go tak, żeby nie rozbijał układu relacji, i uwzględnij, że nie masz kontroli nad jego wnętrzem.
  Oba kanały mają współistnieć w tym samym archiwum, więc kafel filmu musi czytelnie mówić, co się stanie po kliknięciu. Zaprojektuj kafel (miniatura, czas trwania, źródło), odtwarzanie (w miejscu albo w lightboxie) i zachowanie, gdy film jest jedynym materiałem etapu. Rozstrzygnij, czy filmy mieszają się ze zdjęciami w jednej siatce, czy mają własny pas.
- **Metryka rejsu** — przebyte mile, liczba dni, etapy, skład załogi. Stan archiwalny to dobre miejsce na liczby, które przed rejsem były obietnicą, a teraz są faktem.

**Archiwum jest publiczne — z furtką na pojedynczy materiał** (decyzja Tomka). Relacje, zdjęcia i filmy widzi każdy, bez logowania: to jest główny argument wiarygodności przy sprzedaży kolejnych rejsów. Ale zdjęcie załogi to wizerunek konkretnej osoby, a zgodę na publikację może dać wyłącznie ona sama (ten projekt ma już tę zasadę zapisaną w ADR-029 dla danych szczególnych). Dlatego galeria ma znieść **oznaczenie pojedynczego zdjęcia lub filmu jako „tylko dla załogi"**:

- kafel w stanie zamkniętym, wyglądający na świadomą decyzję, nie na błąd ładowania;
- zrozumiałe wyjaśnienie zamiast pustego miejsca;
- ścieżka logowania dla uczestnika rejsu, który ma prawo to zobaczyć.

Nie projektuj tego jako głównej ścieżki — to wyjątek, którego nie wolno zamknąć. Projekt bez tej furtki wymusza przy pierwszej prośbie o zdjęcie mniej albo usunięcie materiału, albo przebudowę mechanizmu po fakcie.

**Stan pusty jest obowiązkowy.** Rejs kończy się, zanim Michał wgra pierwsze zdjęcie. Zaprojektuj widok „rejs zakończony, relacja w przygotowaniu" — ma wyglądać na świadomą decyzję, nie na zepsutą stronę.

**Widok wgrywania.** Michał dodaje materiały sam, z `/admin`. Zaprojektuj **ekran dodawania relacji i mediów**: wybór etapu, tekst relacji, wrzucanie wielu plików naraz, postęp, kolejność, podpisy, wybór zdjęcia okładkowego, wklejenie linku YouTube, usuwanie.

Mechanika transferu jest już rozwiązana w projekcie `domy-modulowe` i ma zostać przeniesiona (decyzja Tomka). Jej istotne dla projektu konsekwencje:

- plik idzie **z przeglądarki prosto do Cloudinary**, nie przez serwer — serwer tylko podpisuje żądanie. Dlatego pasek postępu dotyczy pojedynczego pliku i jest realny, a nie udawany;
- **podpis jest ważny godzinę** — przy długiej sesji wgrywania dużej partii materiału trzeba przewidzieć stan „sesja wygasła, ponów";
- pliki lecą **kolejno, nie równolegle**, więc przy 200 zdjęciach potrzebny jest widok postępu całej partii, nie tylko bieżącego pliku, i możliwość odejścia od ekranu;
- rejestracja w bazie jest **osobnym krokiem po wgraniu** — istnieje więc stan „plik jest w Cloudinary, ale nie ma go jeszcze w relacji", który projekt musi umieć pokazać i naprawić;
- `domy-modulowe` serwuje już wideo z Cloudinary z automatyczną jakością i klatką-plakatem jako miniaturą — ten sam zabieg daje miniatury filmów w archiwum **bez ręcznego robienia okładek**. Uwaga: w `domy-modulowe` przez panel wgrywane są wyłącznie obrazy i PDF-y; wgrywanie wideo tą drogą nie było tam robione i jego limity trzeba sprawdzić przed wdrożeniem.

Zakładaj duże pliki i łącze z jachtu — wolne i zrywające się. Projekt musi mieć stan błędu, wznowienia i częściowego powodzenia partii.

---

## 6. Język i terminologia — twarde ograniczenia prawne

Rejsy są **prywatne, niekomercyjne, składkowe** (ADR-021, ADR-024). Słownictwo handlowe jest zakazane i nie wolno go wprowadzić w nowych tekstach:

- „**składka**", nie „cena"; „Składka za osobę", nie „cena za miejsce";
- „**Brak miejsc**", nie „Wyprzedane";
- „**Opłać składkę →**", nie „Kup" ani „Zapłać";
- stopka: „Private sailing adventures", nie „Boutique sailing trips";
- nie używaj „oferta", „produkt", „promocja" w widocznych tekstach — rabat early-bird nazywaj np. „zapis wcześniejszy".

Teksty projektuj po polsku. Serwis jest dwujęzyczny (PL/EN) — zostaw w układzie miejsce na przełącznik i na **dłuższe stringi angielskie** (zwykle +15–30% długości).

---

## 7. Design tokens — nie zmieniaj ich

```
--navy:        #0d1b2e   tło główne, hero, stopka
--navy-mid:    #0f1f35   sekcje naprzemienne
--navy-light:  #162840   sekcje jaśniejsze
--navy-deep:   #07111e   dolny pasek stopki
--brass:       #c4923a   akcent, CTA, stany aktywne
--brass-light: #d4aa5a   hover
--warm-white:  #f5f0e8   tekst główny
--cream:       #ede5d8   tekst drugorzędny
--muted:       rgba(245,240,232,0.45)
```

- Nagłówki: **Playfair Display** 400/600 + italic. UI i treść: **DM Sans** 300–700.
- `max-width: 1100px`, padding sekcji `96px 40px`, nav `64px` fixed.
- **`border-radius: 0` wszędzie.** Strona jest ostra i architektoniczna — nie zaokrąglaj kart galerii ani miniatur filmów.
- **Brak linii działowych** między sekcjami — rozdziela je wyłącznie tonalne tło. Separator wewnątrz siatek: `gap: 1px` na tle `rgba(196,146,58,0.1)`.
- Stany koi na planie jachtu (SVG) zostają bez zmian: available / hovered / selected / taken.

Archiwum potrzebuje własnej warstwy tonalnej, żeby odróżniało się od sprzedaży — ale **wewnątrz tej palety**. Nie wprowadzaj sepii, szarości ani filtru „stare zdjęcie": materiał z rejsu ma być atrakcyjny, a nie postarzony.

---

## 8. Dostępność i czytelność — naprawiane przy tej przebudowie

Trzy znane problemy mają zostać rozwiązane w projekcie, nie odłożone:

1. **Tekst na zdjęciu hero i przezroczysty nav nie osiągają kontrastu AA.** Zmierzone sufity: podtytuł 4.49 desktop / 4.25 mobile, linki nawigacji 3.93 na jasnym fragmencie nieba, przy progu 4.5. **Od strony koloru tekstu nie da się tego naprawić** — potrzebne są środki wizualne: widoczny scrim pod kolumną tekstu albo przyciemniony pasek nawigacji także przed przewinięciem. Rozstrzygnij to w projekcie i pokaż wybrany wariant.
2. **`font-size: 9px` na badge'ach i eyebrowach całej strony** — poniżej progu czytelności dla tekstu niosącego informację („Brak miejsc", „Wolne 3 miejsca"). Nie łataj pojedynczego miejsca: zaproponuj **nową skalę typograficzną** dla całego serwisu, z minimum czytelnym na telefonie. Odbiorcą jest też osoba z dysleksją — unikaj wersalików w dłuższych frazach i zbyt ciasnego światła międzyliterowego.
3. **Ogólna wyrazistość na telefonie.** Sprawdź każdą parę tło↔tekst, zwłaszcza warstwy z `alpha` (kontrast liczy się po zmieszaniu warstw) i teksty na zdjęciach galerii.

Projektuj **mobile-first dla nowych sekcji**: relacja i galeria będą oglądane głównie na telefonie. Testuj układ przy 320, 360, 375 i 768 px.

---

## 9. Realne treści do użycia w prototypie

Nie wymyślaj fikcyjnych rejsów — użyj prawdziwych, żeby projekt dało się ocenić:

- **Archiwum:** Sail Adventure 2026, Palma de Mallorca → Gibraltar → Madera → Teneryfa → Cabo Verde, cztery etapy, ~2200 nm, 41 dni, 10 koi, Jeanneau Sun Odyssey 519, październik–listopad 2026.
- **W sprzedaży / zapowiedź:** Seszele, katamaran **Lagoon 40**, 4 kajuty × 2 osoby (prywatne łazienki, klimatyzacja, agregat, odsalarka), **maj 2027**, dwa terminy (8–18 i 18–29 maja, z opcją 22 dni), **1150 EUR/os.** + przelot + pokładówka.
- **Dalsze zapowiedzi:** Francja (rejs winny, kwiecień), Grecja (czerwiec) — bez ustalonych terminów, jako stan „Zapowiedź".

---

## 10. Co dostarczyć

1. **Hi-fi prototyp HTML** (jeden plik, jak `Sailing Architects.html`), klikalny, z przełączaniem między:
   - nową stroną główną (dwa pasy),
   - stroną rejsu w sprzedaży,
   - stroną rejsu z kompletem załogi, razem z zapisem na listę rezerwową,
   - stroną archiwalną z pełną relacją czterech etapów,
   - pełną galerią pojedynczego etapu, w tym kafelkiem zamkniętym „tylko dla załogi",
   - stroną archiwalną bez materiałów i stanem mieszanym (etap 1 pełny, etap 4 pusty),
   - widokiem dodawania relacji i mediów w `/admin`.
   Każdy ekran pokaż w wersji desktop i mobile.
2. **Krótki opis decyzji** — dla każdego rozstrzygnięcia, które mogło pójść inaczej: co wybrałeś i dlaczego. Zwłaszcza: nawigacja po etapach, sposób pokazania filmów z dwóch źródeł, rozwiązanie kontrastu w hero, nowa skala typograficzna.
3. **Mapa sekcja → stan rejsu** — tabela mówiąca, co jest widoczne w którym stanie.
4. **Lista otwartych pytań** do Michała i Tomka, zamiast dopowiedzianych założeń.

## 11. Czego nie robić

- Nie zmieniaj palety, krojów ani zasady `border-radius: 0`.
- Nie wprowadzaj słownictwa handlowego (patrz punkt 6).
- Nie projektuj panelu administracyjnego poza ekranem dodawania relacji i mediów.
- Nie planuj schematu bazy, API ani komponentów Svelte — to jest zadanie projektowe, nie implementacyjne.
- Nie zakładaj, że zdjęcia będą w wysokiej rozdzielczości: dzisiejsze materiały mają maksymalnie 698×548 px. Projekt ma znieść zarówno słabe źródła, jak i pełnowymiarowe zdjęcia z Cloudinary.
- Nie usuwaj dotychczasowych funkcji rejsu w sprzedaży (plan koi, badge dostępności, zakładki etapów, poradnik) — mają przeżyć przeprowadzkę do nowej struktury.

## 12. Czego nie otwieraj ponownie

Te rozstrzygnięcia zapadły przed projektem i nie są materiałem do dyskusji w prototypie:

- relacja **per etap**, nie jedna na rejs;
- etapy jako **sekcje jednej strony rejsu**, z osobno otwieraną pełną galerią etapu;
- filmy w **dwóch niezależnych kanałach**: Cloudinary (krótkie, w relacji) i YouTube (dłuższe, osadzone);
- **lista rezerwowa** jako realny mechanizm, **bez numeru w kolejce**;
- **komplet załogi to stan osobny od archiwum** — archiwum powstaje wyłącznie po dacie zakończenia rejsu;
- strona główna w **dwóch rozdzielonych pasach**: najbliższe rejsy, niżej wybrane relacje;
- archiwum **publiczne**, z możliwością zamknięcia pojedynczego materiału.

Jeżeli któreś z nich zderzy się w projekcie z czymś, czego nie przewidziano — **nazwij konflikt i pokaż go**, zamiast po cichu zmieniać decyzję.

## 13. Poza zakresem projektu, do odnotowania

Archiwum z rozpoznawalnymi twarzami załogi wymaga **klauzuli zgody na publikację wizerunku w umowie uczestnika** — dziś takiej klauzuli nie ma. To sprawa dla organizatora i prawnika, nie dla projektu, ale projekt bez niej nie może wejść na produkcję ze zdjęciami ludzi.
