# ADR-029: Zgoda na dane o zdrowiu stoi przy polach danych, nie przy płatności, a jej zaznaczenie odsłania pola

- **Status:** przyjęta (decyzja Tomka, sesja 2026-08-23)
- **Data:** 2026-08-23
- **Obszar:** legal / dane osobowe / UX formularzy
- **Powiązane:** [ADR-026](ADR-026-privacy-policy-published-regardless-of-exemption.md), LEGAL-9, LEGAL-19

## Kontekst

`medicalNotes` i `dietaryRequirements` to dane szczególnej kategorii (art. 9 RODO) — ich przetwarzanie jest co do zasady zakazane, a jedynym realnym wyjątkiem w tej sytuacji jest **wyraźna zgoda**. Dziś system nie ma pola, które by taką zgodę zapisywało; akceptacja regulaminu zgodą nie jest.

Przy pisaniu polityki prywatności trzeba było rozstrzygnąć, gdzie ta zgoda stanie. Pierwsza propozycja Tomka umieszczała ją **na poziomie zakupu koi**; w trakcie rozmowy sam ją skorygował na **poziom danych**.

Pomiar w kodzie: pola medyczne występują w dwóch miejscach — `book/+page.svelte:1064-1074` (kasa; obiekt `crew` jest jeden, a e-mail wstępnie wypełniony z konta zalogowanego, więc kupujący wpisuje tam **swoje** dane) oraz `dashboard/crew/[participantId]` (edycja danych **innego** uczestnika).

## Decyzja

**Checkbox zgody stoi przy polach danych medycznych, w każdym miejscu, gdzie te pola występują — nie przy płatności i nie przy akceptacji regulaminu.**

**Zaznaczenie zgody odsłania pola.** Niezaznaczona zgoda oznacza, że pól nie ma na ekranie.

## Uzasadnienie

- **Zgodę z art. 9 może wyrazić wyłącznie osoba, której dane dotyczą.** Checkbox przy płatności oznaczałby, że kupujący biorący cztery koje jednym kliknięciem zgadza się także za trzech kolegów. Taka zgoda jest prawnie bezwartościowa dla ich danych.
- **Zgoda musi stać tam, gdzie dane są zbierane** — a są zbierane w dwóch miejscach, więc checkbox też musi być w dwóch.
- **Odsłanianie pól zamiast samego zaznaczenia daje mocniejszą gwarancję.** Przy zwykłym checkboxie dane można wpisać, a zgody nie zaznaczyć — powstaje rekord bez podstawy prawnej. Przy odsłanianiu ten stan jest niemożliwy: brak zgody to brak pól, czyli brak danych.
- **Zgoda musi być dobrowolna,** więc pola pozostają opcjonalne. Zgoda, bez której nie da się kupić koi, nie jest zgodą w rozumieniu RODO i cała podstawa się sypie.

## Konsekwencje

- **LEGAL-9 podniesione do blokującego.** Opublikowana polityka twierdzi, że dane o zdrowiu zbieramy wyłącznie za odrębną zgodą wyrażoną przy polu — dopóki formularz jej nie zbiera, dokument opisuje stan, którego nie ma. Publikacja mimo to była świadomym wyborem (wariant B, sesja 2026-08-23).
- Potrzebne: pole w `schema.ts` zapisujące fakt i moment udzielenia zgody, checkbox w dwóch formularzach, oraz mechanizm wycofania — polityka obiecuje wycofanie „w każdej chwili" mailem do administratora.
- **Ta sama zasada obejmie zgodę marketingową (LEGAL-18):** osobne pole, niezaznaczone domyślnie, oddzielone od akceptacji regulaminu.
- **Rozstrzygnięte 2026-08-23 (Tomek): dane zdrowotne zostają w systemie.** Pytanie z `privacy-policy-inputs.md` (2.3) — czy nie zbierać ich poza bazą, u skipera — zamknięte odmownie: *„nie możemy ograniczyć danych zdrowotnych tylko do notatek poza systemem, odpowiedzialność i tak zostaje"*. Przeniesienie danych poza aplikację nie przenosi roli administratora: organizator dalej je przetwarza, tylko bez kontroli dostępu, bez retencji i bez śladu, kto je widział. Wariant wyglądał na uproszczenie, a był przeniesieniem ryzyka w miejsce gorzej chronione.

## Sprostowanie z 2026-08-23 (po zapisaniu decyzji)

**Punkt „checkbox w dwóch miejscach" jest błędny i nie da się go wykonać w obecnym układzie stron.**

Drugie miejsce — `dashboard/crew/[participantId]` — ładuje dane przez `bookingByUser` z `userId` **zalogowanego kupującego** (`:66`) i służy do edycji danych **pozostałych uczestników** jego rezerwacji; jest tam nawet pole `invitedEmail`. Checkbox postawiony tam byłby zaznaczany przez kupującego za kolegę — dokładnie ten defekt, przed którym ta decyzja miała chronić, przeniesiony z ekranu płatności na ekran danych.

Trzecie miejsce, `crew/confirm/[token]`, pozwala uczestnikowi wyłącznie **potwierdzić** dane albo zgłosić poprawkę notatką (`correctionNote`) — formularza edycji nie ma.

**Wniosek: uczestnik nie ma dziś żadnego miejsca, w którym sam wpisuje swoje dane medyczne**, więc zgody z art. 9 nie da się poprawnie zebrać bez zbudowania takiego miejsca. Decyzja zasadnicza (zgoda przy danych, zaznaczenie odsłania pola) zostaje w mocy; zmienia się liczba i lokalizacja checkboxów: **jeden, na stronie, którą otwiera sam uczestnik**.

**Skutek dla zakresu: LEGAL-9 w części zdrowotnej i FEAT-21 to jedno zadanie.** FEAT-21 (kupujący podaje tylko swoje dane, resztę załogi zaprasza linkiem) nie jest ulepszeniem obok zgody — jest jej warunkiem wykonalności. Dochodzą: guard serwerowy odmawiający zapisu pól bez zapisanej zgody, usunięcie tych pól z formularzy kupującego, akcja wycofania zgody dla administratora (polityka obiecuje wycofanie mailem) oraz rozstrzygnięcie, co zrobić z rekordami zapisanymi przed wdrożeniem — dziś nie mają podstawy prawnej.
