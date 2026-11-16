# Landing: archiwum + sprzedaż kolejnych rejsów — decyzje projektowe

> Odpowiedź na `landing-archive-and-multi-voyage-design-prompt.md` (punkty 10.2–10.4).
> Prototyp (Design canvas, prywatny): https://claude.ai/artifact/4JnrbWE7jSHNBsFiStmiUE
> Data: 2026-11-16. Zakres: projekt, nie implementacja.

## Co jest na canvasie

| Strona canvasu | Desktop | Mobile |
| --- | --- | --- |
| 00 System i stany | skala typograficzna, kontrast, badge 5 stanów, mapa sekcja → stan | — |
| 01 Strona główna | dwa pasy, belka powiadomień | menu, belka zwijana |
| 02 Rejs w sprzedaży | Seszele, Lagoon 40, plan koi (klikalny) | lokalna nawigacja chipami, dolny pasek CTA |
| 03 Komplet załogi | lista rezerwowa (formularz → potwierdzenie), wariant „koja wróciła”, widok Michała | formularz, dwa CTA w dolnym pasku |
| 04 Archiwum — relacja | 4 etapy jako sekcje jednej strony, filmy z dwóch kanałów | przyklejony pasek 01–04 |
| 05 Galeria etapu | przełącznik 4 / 12 / 64 / 200, filtry, lightbox, kafle „tylko dla załogi” | siatka 3 kolumny, lightbox pełnoekranowy |
| 06 Archiwum — pusty i mieszany | stan A i stan B na jednej planszy | to samo |
| 07 Admin — relacja i media | tekst, partia 200 plików, 6 stanów wiersza | wgrywanie z galerii telefonu, brak zasięgu |

Zdjęcia: wyłącznie z `static/images/sailing`, poglądowo. Seszeli, Lagoon 40 i Grecji brak w materiałach — oznaczone placeholdery. Teksty relacji, programu i dane listy rezerwowej to **oznaczone akapity przykładowe** w nawiasach kwadratowych. Daty etapów pochodzą z `src/lib/data/voyage-segments.ts`. Liczby wolnych koi (5 z 8, 6 z 8) i „czeka 7 osób” to wartości pokazowe.

## Decyzje

**Rozdzielenie rejsu i jachtu.** Dawny pasek `4 etapy / 10 miejsc / ~2200 nm / 41 dni` rozpada się na dwa panele: **Rejs** (terminy, długość, składka) i **Jacht** (model, kajuty, koje), każdy z własnym eyebrowem i tonem tła. Przy zmianie jachtu zmienia się tylko drugi panel. To samo rozdzielenie powtarza się w sekcjach: „Terminy” i „Program” należą do rejsu, „Jacht” i plan koi — do jachtu.

**Dwa poziomy nawigacji.** Globalny pasek: Rejsy / Archiwum / Poradnik / Panel (+ PL·EN). Pod nim, tylko na stronie rejsu, lokalny pasek: nazwa rejsu z przełącznikiem rejsów (lista ze stanami) + kotwice sekcji + CTA. Na mobile lokalne kotwice to przewijany pasek chipów, a CTA rezerwacji siedzi w nagłówku (strona główna) albo w dolnym przyklejonym pasku (strona rejsu) — nigdy w hamburgerze. Przełącznik rejsów zamiast osobnej strony „wybierz rejs”, bo rejsów jest kilka, nie kilkadziesiąt.

**Strona główna.** Hero skrócony do ~540 px, żeby pas „Najbliższe rejsy” zaczynał się nad zagięciem. Rejs w sprzedaży dostaje szeroką kartę, zapowiedzi — węższe karty z „Powiadom mnie”. Pas „Byliśmy tam” stoi na tle navy-light (warstwa archiwum) i dziś ma jedną kartę; siatka przyjmie trzy bez przebudowy.

**Belka powiadomień.** Pasek pod nawigacją, część przyklejonego nagłówka — **przesuwa** treść, nie przykrywa hero. Na mobile domyślnie jedna linia; formularz rozwija się po dotknięciu. Zamykana przyciskiem 44×44. Rabat nazwany „zapis wcześniejszy obniża składkę o 5%”.

**Kontrast w hero.** Wybrany wariant: **scrim pod kolumną tekstu** (gradient od navy 94% do ~20% w poziomie; na mobile w pionie) **oraz ciemny pasek nawigacji (94%) od pierwszego piksela**, nie dopiero po przewinięciu. Tekst pomocniczy w hero podniesiony z alfy 0.55 do 0.86. Powód: pomiary w briefie pokazują, że sam kolor tekstu nie przebije sufitu ~4.5, a pasek przezroczysty nad jasnym niebem zawsze będzie loterią zależną od zdjęcia.

**Skala typograficzna.** Minimum 13 px dla wszystkiego, co niesie informację (było 9 px). Badge’e 13 px / 600–700 **zwykłą wielkością liter**; wersaliki tylko w eyebrowach do trzech słów. Długie czytanie: DM Sans 18 / 1.75, kolumna 640 px (~64 znaki), akapity rozdzielone odstępem, bez justowania i dzielenia wyrazów. Lead etapu: Playfair italic 22 / 1.55. Pełna skala na planszy 00.

**Kontrast warstw z alfą.** Policzone po zmieszaniu: `--muted` (alfa 0.45) daje 3.8–4.1:1 na każdym tle navy — **nie przechodzi AA**. Nowe minimum dla tekstu informacyjnego: alfa 0.62 (≥ 5.9:1); 0.45 tylko dla dekoracji. Brass na navy 5.3–6.8:1, navy na brass 6.2:1.

**Warstwa tonalna archiwum.** Wewnątrz palety: tło navy-light `#162840` pod relacją, eyebrowy i badge w kolorze cream zamiast brass, badge „Odbyty” w kremowym obrysie. Brass zostaje dla akcji (CTA do kolejnych rejsów, numery etapów). Zdjęcia w pełnym kolorze, bez filtrów.

**Badge pięciu stanów.** Zapowiedź — brass obrys; W sprzedaży — brass wypełnienie; Komplet załogi — biały obrys; Rejs trwa — kropka na navy-light; Odbyty — kremowy obrys + daty. Różnią się wypełnieniem i jasnością, nie tylko barwą.

**Komplet załogi.** Ta sama strona rejsu co w sprzedaży: badge, CTA i belka zmieniają się, układ zostaje. Plan koi przechodzi w wersję informacyjną (prostokąty zajęte). Zwrot koi pokazuje **belka „Zwolniła się 1 koja”** + badge „W sprzedaży · wolna 1 koja” na właściwym terminie — powrót do sprzedaży wygląda jak zdarzenie, nie jak błąd.

**Lista rezerwowa.** Formularz: rejs (stały), termin (01 / 02 / którykolwiek), imię, liczba osób, e-mail, checkbox „Rozumiem, że zapis nie rezerwuje miejsca”. Przy formularzu dwa krótkie bloki „Co daje zapis / Czego nie daje”. Potwierdzenie: „Zapis doszedł”, czego dotyczy, link do wypisania w e-mailu, **bez numeru**, za to zbiorczy sygnał „na ten rejs czeka teraz N osób”. Ten sam sygnał stoi w hero jako badge.

**Nawigacja po etapach w archiwum.** Przyklejony pasek pod globalnym menu: cztery pozycje `01 Palma → Gibraltar` … w kolejności trasy, aktywna z brass podkreśleniem, pod paskiem cienka linia postępu (25% na etap). Na mobile same numery 01–04 i podpis aktualnego etapu. Na końcu każdej sekcji link „Etap 02: … →”, więc relację da się czytać ciągiem. Mapa trasy stoi we wstępie jako punkt wyjścia.

**Filmy z dwóch źródeł.** Filmy mają **własny pas „Filmy etapu”** pod zdjęciami — nie mieszają się z siatką zdjęć, bo zachowują się inaczej (dźwięk, czas, obcy odtwarzacz). Krótki film z Cloudinary może dodatkowo stać w tekście relacji jako ilustracja. Kafel zawsze mówi źródło i skutek: etykieta „Film z rejsu” + „Odtwarzany tutaj, bez reklam” albo „YouTube” + „Otworzy odtwarzacz YouTube w tym miejscu”, plus czas trwania. Oba odtwarzają się **w miejscu** (nie w lightboxie), a YouTube wczytuje się dopiero po kliknięciu (fasada, `youtube-nocookie`) — do tego czasu nie ma obcego UI, ciasteczek ani ekranu „następne filmy”. W galerii etapu filmy z Cloudinary są w tej samej siatce (z oznaczeniem ▶ i czasem), bo tam przeglądamy wszystko.

**Galeria.** Kwadratowa siatka `auto-fill` (180 px przy dużej liczbie, 260 px przy ≤12, 320 px przy ≤6). Powyżej 12 materiałów: filtry Wszystko / Zdjęcia / Filmy i doczytywanie porcjami po 48. Przy ≤6: bez filtrów, z komunikatem „Michał dodaje materiały przez kilka tygodni po rejsie”. Lightbox zachowuje dzisiejsze zachowanie (klik, strzałki, zamknięcie, tło); Esc i strzałki klawiatury działają w produkcji — prototyp ich nie rejestruje.

**„Tylko dla załogi”.** Kafel z kłódką w kremowym obrysie, tytuł „Tylko dla załogi”, jedno zdanie powodu („Osoba na zdjęciu poprosiła o widoczność tylko dla uczestników”) i link „Zaloguj się jako uczestnik”. Zamknięte kafle nie trafiają do wyboru kadrów w sekcji etapu ani do lightboxa. Pod galerią krótkie wyjaśnienie zasady.

**Stan pusty i mieszany.** Pusty: hero z daty powrotu („Wróciliśmy 14 listopada. Relacja jest w przygotowaniu.”), lista czterech etapów z „relacja wkrótce”, zapis na powiadomienie o relacji i kolejny rejs. Mieszany: pasek etapów pokazuje, co jest w każdym (relacja · 64 zdjęcia · 2 filmy / relacja · zdjęcia wkrótce / 37 zdjęć · tekst wkrótce / w przygotowaniu). Etap bez zdjęć zaczyna się od numeru i tytułu, bez pustej ramki; etap bez tekstu zaczyna się dużym kadrem; etap pusty to jedna niska karta, nie pełna sekcja.

**/admin — media.** Lewa kolumna: etapy ze statusem publikacji. Główna: tekst (lead + relacja, autozapis), dropzone + pole linku YouTube, pasek całej partii (wgrane / błędy / w kolejce, wstrzymaj/wznów, „możesz przejść do innych ekranów panelu, nie zamykaj karty”), tabela plików. Sześć stanów wiersza: w kolejce, wgrywanie (realny %), wgrane, błąd → Ponów, wstrzymane po wygaśnięciu podpisu (banner „Odnów i wznów” od pliku N), **„W Cloudinary, nie w relacji” → Dołącz do relacji**. Na wgranym wierszu: podpis, okładka (radio), „tylko załoga”, kolejność ▲▼, usuń. Mobile: „Dodaj z galerii telefonu”, stan „Brak połączenia — wznowi się samo”, opcje pliku w arkuszu „⋯”.

## Mapa sekcja → stan rejsu

● sekcja z akcją · ○ wersja informacyjna · + pojawia się · — znika

| Sekcja | Zapowiedź | W sprzedaży | Komplet załogi | W trakcie | Archiwum |
| --- | --- | --- | --- | --- | --- |
| Hero: główne CTA | ● Powiadom mnie | ● Wybierz koję | ● Lista rezerwowa + Kolejne rejsy | ○ Rejs trwa — relacja wkrótce | ● Zobacz relację |
| Fakty rejsu | ○ „do ustalenia” | ● | ● | ● + bieżący etap | + metryka faktów |
| Jacht | ○ jeśli wybrany | ● | ● | ○ | ○ skrót + link |
| Trasa / etapy | ○ szkic | ● | ● | ● bieżący wyróżniony | → nawigacja relacji |
| Program rejsu | ○ jeśli jest | ● | ● | ● | — |
| Plan koi | — | ● interaktywny | ○ zajęte; ● gdy koja wróci | — | — |
| Składki | ○ „do ustalenia” | ● z badge | ○ „Brak miejsc” | — | ○ podział na etapy |
| Zapis „Powiadom mnie” | ● | — | — | — | — |
| Lista rezerwowa | — | ○ przy pełnym etapie | ● | — | — |
| Sygnał „czeka N osób” | — | ○ przy pełnym etapie | ● | — | — |
| Relacja · zdjęcia · filmy | — | — | — | ○ opcjonalny tracker | + ● (pusty / mieszany) |
| FAQ + Poradnik | ● | ● | ● | ○ | — |
| Pas „Kolejne rejsy” | ○ | — | + ● | + ● | + ● |

## Konflikty w briefie (nazwane, nie rozstrzygnięte po cichu)

1. **Widok Michała dla listy rezerwowej vs. zakaz panelu poza mediami.** Punkt 4 prosi o widok „kto czeka, na co, od kiedy + zaproponuj zwolnioną koję”, punkt 11 zabrania projektowania panelu poza ekranem mediów. Pokazałem jedną minimalną tabelę na planszy 03, bez reszty panelu.
2. **Archiwum w menu globalnym vs. „Archiwum” jako stan.** Słowo oznacza i dział serwisu, i stan rejsu. W UI stan nazywam „Odbyty”, dział — „Archiwum”, żeby badge nie dublował nazwy menu.
3. **Lista rezerwowa vs. powrót koi do sprzedaży.** Jeśli Michał najpierw proponuje koję osobom z listy, publiczna belka „Zwolniła się koja” może pojawić się dopiero po tej rundzie. Prototyp zakłada, że lista dostała wiadomość pierwsza — kolejność wymaga decyzji (pytanie 1).

## Otwarte pytania do Michała i Tomka

1. Zwolniona koja: najpierw tylko lista rezerwowa (jak długo?), czy od razu publicznie z równoczesnym mailem do listy?
2. Lista rezerwowa per termin czy per rejs z preferencją terminu? Prototyp: wybór 01 / 02 / którykolwiek.
3. Czy sygnał „czeka N osób” ma mieć próg (np. pokazujemy od 3 osób), żeby „czeka 1 osoba” nie działało odwrotnie?
4. Opcja 22 dni na Seszelach: jaka składka i czy to osobna pozycja w kasie, czy dwa zapisy na tę samą koję?
5. Port zaokrętowania, trasa i program dzień po dniu dla Seszeli; zdjęcia Lagoon 40 od armatora.
6. Czy pas „Byliśmy tam” ma pokazywać relacje częściowe (dziś: etap 1 gotowy), czy dopiero kompletne?
7. Stan „W trakcie”: robimy tracker pozycji, czy tylko „Rejs trwa — relacja wkrótce”?
8. Metryka faktów: kto i kiedy wpisuje faktyczne mile, dni i liczbę osób załogi po rejsie?
9. Kto może oznaczyć materiał „tylko dla załogi”: tylko Michał, czy też uczestnik z panelu (prośba → akceptacja)?
10. Limity wideo w Cloudinary (rozmiar, długość) — do sprawdzenia przed wdrożeniem; od tego zależy próg „krótki film → YouTube”.
11. Wgrywanie z jachtu: czy partia ma przetrwać zamknięcie karty (wymaga innego mechanizmu niż dziś w `domy-modulowe`)?
12. LEGAL-21 bez zmian: archiwum ze zdjęciami ludzi nie wejdzie na produkcję bez zgód na wizerunek.
