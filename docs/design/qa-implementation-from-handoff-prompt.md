# Prompt: wdrożenie nowego FAQ i strony „Poradnik załogi”

Jesteś senior-level implementerem pracującym w repo `sailing-architects` (SvelteKit 2, Svelte 5 runes, Convex, Clerk, Stripe, Brevo). Twoim zadaniem jest wdrożyć gotowy projekt Q&A z handoffu do produkcyjnej aplikacji.

Nie projektuj od nowa. Nie twórz kolejnych wariantów UI. Nie używaj prototypu HTML jako finalnego artefaktu. Przenieś gotowe decyzje z `docs/design/design_handoff_sailing_architects_new_qa` do istniejącego kodu SvelteKit, zachowując obecny styl i architekturę projektu.

## Źródła prawdy

- Pełne źródłowe Q&A: `docs/design/Q&A-sailing-architects.md`
- Gotowy handoff: `docs/design/design_handoff_sailing_architects_new_qa/README.md`
- Prototyp landing page z nowym FAQ: `docs/design/design_handoff_sailing_architects_new_qa/Sailing Architects.html`
- Prototyp nowej strony: `docs/design/design_handoff_sailing_architects_new_qa/Poradnik Załogi.html`
- Gotowy model treści z prototypu: `docs/design/design_handoff_sailing_architects_new_qa/components/crew-guide.js`

Aktualny kod produkcyjny:

- Landing: `src/routes/[[lang=lang]]/+page.svelte`
- Obecne FAQ: `src/lib/components/faq-section/faq-section.svelte`
- Layout/nav: `src/routes/[[lang=lang]]/+layout.svelte`, `src/lib/components/site-nav/site-nav.svelte`
- Footer: `src/lib/components/site-footer/site-footer.svelte`
- Globalne tokeny: `src/app.css`
- Maile server-side: `src/lib/server/email.ts`
- Maile Convex/reminders: `src/convex/_emails.ts`

## Zakres wdrożenia

Wdroż dwie rzeczy:

1. Lekka zmiana sekcji FAQ na stronie głównej
   - obecna sekcja FAQ ma zostać krótka;
   - pytania mają pochodzić ze wspólnego modułu treści;
   - użyj pytań oznaczonych jako `featured` w prototypowym `crew-guide.js`;
   - dodaj CTA/link do pełnej strony „Poradnik załogi”;
   - nie rozbudowuj landingu o pełne Q&A.

2. Nowa publiczna strona „Poradnik załogi”
   - ścieżka: `src/routes/[[lang=lang]]/poradnik/+page.svelte`;
   - treść i strukturę oprzyj na `Poradnik Załogi.html` oraz `components/crew-guide.js`;
   - strona ma zawierać hero informacyjny, checklisty, kategorie i pełne Q&A;
   - ma być czytelna na mobile i desktop;
   - ma służyć jako link wysyłany uczestnikom przed rejsem.

## Model treści

Przenieś `CREW_GUIDE` z prototypowego `components/crew-guide.js` do typowanego modułu produkcyjnego:

- rekomendowany plik: `src/lib/data/crew-guide.ts`
- eksportuj:
  - `crewGuideCategories`
  - `crewGuideChecklists`
  - `crewGuideQuestions`
  - `featuredCrewGuideQuestions`
- zdefiniuj typy TypeScript dla kategorii, checklist i pytań.

Nie importuj pliku JS z `docs/design`. To jest tylko referencja. Produkcyjny moduł ma być normalnym kodem aplikacji.

Zachowaj redakcję z `crew-guide.js` jako bazę, ale porównaj ją z `docs/design/Q&A-sailing-architects.md`, żeby nie zgubić ważnych informacji. Jeśli znajdziesz niespójności, wybierz wersję bardziej precyzyjną merytorycznie i popraw język na spokojny, profesjonalny polski.

## Komponenty

Preferuj małe, jawne komponenty zamiast jednego bardzo długiego pliku.

Minimalny sensowny podział:

- `src/lib/components/faq-section/faq-section.svelte`
  - przebuduj tak, żeby korzystał z `featuredCrewGuideQuestions`;
  - dodaj link do `/poradnik`;
  - zachowaj styl obecnego akordeonu: navy/brass, ostre krawędzie, subtelne separatory.

- `src/lib/components/crew-guide-page/crew-guide-page.svelte`
  - implementacja pełnej strony poradnika;
  - hero informacyjny;
  - checklisty;
  - sidebar/topbar kategorii;
  - Q&A pogrupowane kategoriami.

- `src/lib/components/crew-guide-page/index.ts`
  - eksport komponentu, jeśli tworzysz folder komponentu.

- `src/routes/[[lang=lang]]/poradnik/+page.svelte`
  - route wrapper dla strony poradnika.

Możesz pominąć osobny `crew-guide-page` i zaimplementować stronę bezpośrednio w route, jeśli finalny kod będzie krótszy i czytelny. Nie duplikuj jednak modelu treści.

## Zachowanie strony poradnika

Odtwórz funkcjonalnie wzorzec z `Poradnik Załogi.html`:

- sticky/top nav lub prosty pasek powrotu do strony głównej;
- CTA do rezerwacji;
- kontakt do Michała;
- checklisty z lokalnym stanem zaznaczeń;
- kategorie Q&A;
- akordeon odpowiedzi;
- mobilny układ bez poziomego scrolla;
- dostępne przyciski z poprawnym `aria-expanded` i `aria-controls`.

Jeśli implementujesz filtr kategorii:

- domyślnie pokaż wszystkie albo pierwszą kategorię, wybierz wariant bliższy prototypowi;
- stan aktywnej kategorii ma być czytelny;
- użytkownik musi móc szybko wrócić do pełnej listy albo przejść przez wszystkie kategorie bez dezorientacji.

## Nawigacja

Dodaj link do poradnika w miejscu, które nie obniża priorytetu rezerwacji:

- preferowane: footer oraz CTA w FAQ;
- opcjonalnie nav, jeśli jest miejsce i nie robi się tłoczno.

Wewnętrzne linki buduj przez `resolve` z `$app/paths`, zgodnie z istniejącym kodem.

## Maile

Dodaj link do poradnika w istniejącej komunikacji, bez budowania nowej automatyzacji przed rejsem w tym zadaniu.

Minimalny zakres:

- `src/lib/server/email.ts`:
  - dodaj link do `/poradnik` w mailu potwierdzenia płatności/rezerwacji, jeśli template ma odpowiednie miejsce;
- `src/convex/_emails.ts`:
  - dodaj link do `/poradnik` w mailu przypominającym o danych załogi.

Nie dodawaj crona 14 dni przed rejsem, nowych pól trackingowych ani zmian w schema, chyba że użytkownik wyraźnie rozszerzy zakres.

## Zasady implementacji

- Użyj Svelte 5 runes zgodnie z aktualnym kodem.
- Nie dodawaj nowych zależności.
- Nie kopiuj Reacta/Babela ani inline style z prototypu.
- Nie dodawaj Tailwind klas, jeśli aktualny projekt dla tych sekcji używa scoped CSS i tokenów z `src/app.css`.
- Nie ruszaj booking flow, Convex schema, Stripe ani admin panelu poza dodaniem linków w mailach, jeśli konieczne.
- Nie przenoś całego `docs/design/Q&A-sailing-architects.md` do Markdown renderowanego runtime.
- Zachowaj ostre krawędzie, separator trick i istniejące tokeny kolorów.

## Walidacja

Po wdrożeniu uruchom:

```bash
pnpm check
```

Jeśli czas pozwala, uruchom lokalnie aplikację i sprawdź:

- `/`
- `/poradnik`
- mobile width około 390 px;
- desktop width około 1440 px.

Sprawdź szczególnie:

- brak poziomego scrolla;
- brak nachodzenia tekstu na przyciski;
- akordeony otwierają się i zamykają;
- linki do `/poradnik` działają;
- linki do `/book` działają.

## Oczekiwany raport końcowy

Na końcu podaj krótko:

- jakie pliki zmieniłeś;
- gdzie znajduje się nowy moduł treści;
- jak działa zmienione FAQ na stronie głównej;
- gdzie jest nowa strona poradnika;
- w których mailach dodałeś link;
- wynik `pnpm check`;
- co zostało poza zakresem, jeśli coś świadomie pominąłeś.

Raport końcowy                                                                                                                                                                       
                                                                                   
  Zmienione/dodane pliki:                                                                                                                                                              
  - src/lib/data/crew-guide.ts (nowy) — typowany moduł treści: 6 kategorii, 3 checklisty, 27 pytań, 7 oznaczonych jako featured. Eksporty: crewGuideCategories, crewGuideChecklists,   
  crewGuideQuestions, featuredCrewGuideQuestions + typy.                                                                                                                               
  - src/lib/components/faq-section/faq-section.svelte — przebudowane: korzysta z featuredCrewGuideQuestions, dodany lead "krótki wybór" i CTA do /poradnik. Zachowany styl akordeonu   
  (navy/brass, ostre krawędzie, separator trick).                                                                                                                                      
  - src/lib/components/crew-guide-page/crew-guide-page.svelte (nowy) + index.ts — pełna strona: hero z badge + dane organizatora, sticky sidebar (Checklisty + 6 kategorii + blok      
  kontaktowy), sekcja 3 checklist z lokalnym stanem zaznaczeń i progress barem, sekcje Q&A pogrupowane kategoriami z accordionem (aria-expanded, aria-controls), finalny blok CTA.     
  Mobile (≤800px): sidebar staje się poziomym pasem pigułek.                                                                                                                           
  - src/routes/[[lang=lang]]/poradnik/+page.svelte (nowy) — wrapper renderujący <CrewGuidePage /> + <SiteFooter /> + <svelte:head> z tytułem i meta description.                       
  - src/lib/components/site-footer/site-footer.svelte — link "Poradnik załogi →" pod CTA rezerwacji w bloku akcji.                                                                     
  - src/convex/_emails.ts — w mailu przypominającym o danych załogi: linijka HTML i text z linkiem do panelUrl('/poradnik').                                                           
  - src/lib/server/email.ts — opcjonalne pole guideUrl? w PaymentEmailInput; renderowane jako delikatna linijka pod CTA panelu i w wersji tekstowej.                                   
  - src/routes/api/stripe/webhook/+server.ts — webhook przekazuje guideUrl: ${PUBLIC_APP_URL}/poradnik.                                                                                
                                                                                                                                                                                       
  Jak działa zmienione FAQ: wybór 7 pytań oznaczonych featured z modułu treści, akordeon w stylu navy/brass, pod listą CTA prowadzące do pełnego poradnika.                            
                                                                                                                                                                                       
  Strona poradnika: /poradnik (oraz /en/poradnik itd. — segment [[lang=lang]] dziedziczy się automatycznie). Korzysta z istniejącej <SiteNav /> z layoutu (zrezygnowałem z             
  duplikującego sticky topbara, hero ma padding-top 120px, żeby zmieścić fixed nav).                                                                                                   
                                                                                                                                                                                       
  Linki w mailach: _emails.ts/sendCrewDataReminderEmail (przypomnienie o danych załogi) + email.ts/sendPaymentConfirmationEmail (potwierdzenie płatności — opcjonalnie, gdy webhook    
  poda guideUrl).
                                                                                                                                                                                       
  Walidacja: pnpm check — 1745 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS. Aplikacja nie była uruchamiana w przeglądarce — wizualną weryfikację (/, /poradnik, mobile 390px /     
  desktop 1440px, brak poziomego scrolla, działanie akordeonów, linki) zostawiam Tobie.
                                                                                                                                                                                       
  Świadomie poza zakresem (zgodnie z promptem): brak crona 14 dni przed rejsem, brak nowych pól trackingowych w schema, brak dodawania linku do /poradnik w głównym <SiteNav /> (footer
   + CTA w FAQ wystarczają — nav nie jest tłoczne, ale priorytet trzyma się rezerwacji), brak migracji Q&A-sailing-architects.md do markdown renderowanego runtime.
