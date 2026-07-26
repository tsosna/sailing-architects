# ADR-019: Koja z blokadą bez terminu wygaśnięcia jest traktowana jako zajęta

- **Status:** przyjęta
- **Data:** 2026-07-26
- **Obszar:** sprzedaż | dostępność | ryzyko finansowe

## Kontekst

Reguła „czy czasowa blokada koi jeszcze obowiązuje" była w kodzie spisana w czterech miejscach. Trzy z nich zostały sprowadzone do jednego helpera (`src/convex/_lib/berthFree.ts`) w dniach 2026-07-25 i 2026-07-26. Czwarta — guard sprzedaży w `createBooking` — okazała się **niezgodna z pozostałymi** na jednym stanie:

| Stan koi | Guard sprzedaży (przed) | Helper (przed) |
|---|---|---|
| `available` | do wzięcia | wolna |
| blokada aktywna (termin w przyszłości) | zajęta | zajęta |
| blokada wygasła (termin w przeszłości) | do wzięcia | wolna |
| **blokada bez terminu** (`holdExpiresAt` nie istnieje) | **zajęta** | **wolna** |

Ostatni wiersz to stan, w którym informacja o czasie zniknęła — nie wiadomo, czy blokada trwa, czy dawno wygasła.

Ustalono dowodowo, że **żadna ścieżka aplikacji takiego stanu nie produkuje**: jedyne miejsce w repozytorium ustawiające status blokady zapisuje termin w tej samej operacji, a wszystkie miejsca usuwające termin równocześnie zmieniają status na inny. Stan jest osiągalny wyłącznie przez ręczną edycję w panelu administracyjnym bazy danych albo przez przyszły błąd w kodzie zapisu.

## Decyzja

1. Koja ze statusem blokady, ale **bez terminu wygaśnięcia**, jest traktowana jako **zajęta** — we wszystkich konsumentach reguły, nie tylko w guardzie sprzedaży.
2. Ostrożniejszy wariant reguły został przeniesiony do wspólnego helpera. Kierunek unifikacji jest odwrotny do domyślnego: guard sprzedaży nie przyjął reguły helpera, to helper przyjął regułę guarda.
3. Konsekwencja dla warstwy prezentacji przyjęta świadomie: badge dostępności na landingu i licznik blokad w panelu administracyjnym również przestają uznawać taką koję za wolną.
4. Reguła jest przypięta testami jednostkowymi (`src/convex/_lib/berthFree.test.ts`, 7 przypadków), żeby przyszła zmiana wymagała jawnego dopisania się do tej decyzji.

## Uzasadnienie

Wybór między dwiema wersjami reguły to wybór między dwiema pomyłkami, a te nie są symetryczne:

- **Nie sprzedać koi, która była wolna** — koszt to utracona sprzedaż jednego miejsca. Odwracalne: administrator widzi anomalię w panelu i może ją ręcznie poprawić.
- **Sprzedać koję trzymaną przez kogoś innego** — koszt to podwójna sprzedaż tego samego miejsca na jachcie o skończonej liczbie koi. Nieodwracalne bez zwrotu pieniędzy, a przy rejsie już opłaconym przez drugą stronę wchodzi odpowiedzialność odszkodowawcza wobec konsumenta, który nie może odbyć rejsu.

Decyzja właściciela produktu (Tomek, 2026-07-26): „lepiej nie sprzedać niż sprzedać podwójnie — wchodzimy w jakieś odszkodowania".

Dodatkowa korzyść techniczna, nie będąca powodem decyzji: po przeniesieniu ostrożniejszej reguły do helpera podmiana w guardzie sprzedaży stała się **dokładną równoważnością** na wszystkich stanach, więc zmiana kodu na ścieżce pieniędzy nie wymagała zakładu o zachowanie.

## Konsekwencje

**Pozytywne**

- Reguła blokady ma jedno źródło; rozjazd między kopiami nie jest już możliwy bez świadomej zmiany w jednym pliku.
- Ryzyko podwójnej sprzedaży przechyla się w stronę bezpieczną na wszystkich wywołaniach naraz, nie tylko w guardzie.
- Anomalia w danych nie prowadzi do transakcji, której nie da się cofnąć bez zwrotu.

**Negatywne / do pilnowania**

- Koja w stanie anomalnym staje się **niewidoczna** zamiast krzyczeć: pokazuje się jako niedostępna i nikt jej nie zgłasza. Wykrycie wymaga osobnego mechanizmu (alert dla administratora), którego dziś nie ma.
- Jeśli anomalia kiedyś powstanie masowo (błąd w ścieżce zapisu), sprzedaż cicho straci miejsca zamiast zgłosić błąd.
- Decyzja jest obroną, nie lekarstwem. Docelowe rozwiązanie to uczynienie stanu **niezapisywalnym** na poziomie schematu bazy (pozycja backlogu REFACTOR-4, walidator `v.union` z dyskryminatorem po statusie). Po jego wdrożeniu ta decyzja stanie się bezprzedmiotowa i można ją będzie oznaczyć jako zastąpioną.

## Powiązane

- ADR-018 — komunikaty o dostępności wynikają z danych; ta sama reguła `isBerthFree` zasila badge z ADR-018
- Backlog REFACTOR-4 — discriminated union w tabeli `berths` (usunięcie możliwości anomalii)
- Backlog REFACTOR-5 — analogiczny problem piętro wyżej: oznaczanie rat zaległymi bez patrzenia na stan rezerwacji
- `wiki/concepts/unify-duplicated-rule-on-the-safer-variant.md` — reguła metodyczna wyprowadzona z tej decyzji
