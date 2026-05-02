# Prompt: Q&A jako Poradnik załogi Sailing Architects

Jesteś senior-level implementerem pracującym w repo `sailing-architects` (SvelteKit 2, Svelte 5 runes, Convex, Clerk, Stripe, Brevo). Twoim zadaniem jest wpleść rozbudowany dokument `docs/design/Q&A-sailing-architects.md` w publiczną stronę i komunikację przed rejsem tak, żeby nie powstał ciężki blok FAQ, tylko użyteczny, elegancki „Poradnik załogi” dla osób przed zakupem i po rezerwacji.

Użyj lokalnego design skill: `.claude/skills/huashu-design`. Potraktuj go jako etap projektowy: najpierw zaproponuj/zwizualizuj kierunek IA i UI, potem przenieś go do produkcyjnego Svelte. Nie buduj finalnej funkcji jako statycznego HTML prototype; prototyp może trafić do `docs/design/`, ale finalny efekt ma działać w aplikacji.

## Kontekst wejściowy

- Główna strona: `src/routes/[[lang=lang]]/+page.svelte`
- Obecny landing: Hero, Vessel, Route, Cabins, Pricing, FAQ, Footer
- Obecne krótkie FAQ: `src/lib/components/faq-section/faq-section.svelte`
- Style globalne: `src/app.css`
- Dane etapów rejsu: `src/lib/data/voyage-segments.ts`
- Maile Convex/reminders: `src/convex/_emails.ts`, `src/convex/reminders.ts`, `src/convex/crons.ts`
- Maile server-side po płatności: `src/lib/server/email.ts`, `src/routes/api/stripe/webhook/+server.ts`
- Projekt ma premium, spokojny ton: navy/brass, Playfair Display + DM Sans, dużo powietrza, brak marketingowego krzyku.

Preflight: sprawdź, czy `docs/design/Q&A-sailing-architects.md` nie jest pusty. Jeśli ma 0 bajtów albo nie zawiera realnego Q&A, przerwij implementację i zgłoś to jako blocker. Nie wymyślaj pełnych odpowiedzi z głowy. Możesz użyć istniejącego krótkiego FAQ jako fallback wyłącznie do prototypu struktury.

## Cel produktu

Z pełnego Q&A zrób dwuwarstwowy system:

1. Krótkie, sprzedażowo-operacyjne FAQ na landing page
   - zostaw 6-8 pytań wysokiej intencji: patent, liczba osób, życie na pokładzie, pakowanie, płatności/anulacje, kontakt;
   - dodaj czytelne przejście do pełnego poradnika;
   - nie zamieniaj landing page w ścianę tekstu.

2. Pełny „Poradnik załogi” jako osobna, czytelna strona
   - rekomendowana ścieżka: `/poradnik` w strukturze `src/routes/[[lang=lang]]/poradnik/+page.svelte`;
   - alternatywnie `/cookbook`, jeśli w projekcie istnieje silniejsza konwencja angielska, ale copy publiczne ma być po polsku;
   - strona ma być przeznaczona do czytania przed rejsem, linkowania z maili i przekazywania uczestnikom.

Traktuj poradnik jak „cookbook dla żeglarza”, nie jak encyklopedię. Użytkownik powinien szybko znaleźć odpowiedź przed decyzją, po rezerwacji i tuż przed wyjazdem.

## Praca z `huashu-design`

Najpierw użyj `.claude/skills/huashu-design` do krótkiej eksploracji UX/UI. Wygeneruj albo opisz jeden konkretny kierunek, bez trzech rozbudowanych wariantów, chyba że dokument Q&A okazuje się bardzo chaotyczny.

Kierunek rekomendowany:

- „Captain’s briefing / poradnik wachtowy”
- lewa lub górna nawigacja kategorii;
- sekcje jako pełnowymiarowe pasy lub zwarte listy, nie karty w kartach;
- akordeony tylko tam, gdzie redukują skanowanie;
- wyróżnione checklisty: dokumenty, pakowanie, płatności, życie na pokładzie;
- subtelne etykiety typu „Przed rezerwacją”, „Po rezerwacji”, „7 dni przed rejsem”, „Na pokładzie”.

Jeśli robisz HTML prototype, zapisz go w `docs/design/qa-cookbook-prototype.html` i nie podłączaj go do aplikacji, oraz zatrzymaj się. Finalna implementacja ma być w Svelte.

## Model treści

Wydziel dane Q&A do osobnego modułu, żeby landing, poradnik i maile nie duplikowały ręcznie tych samych odpowiedzi.

Rekomendowana struktura:

- `src/lib/data/crew-guide.ts`
- typy:
  - `GuideCategory`
  - `GuideQuestion`
  - `GuideChecklist`
- pola dla pytania:
  - `id`
  - `question`
  - `answer`
  - `category`
  - `stage`: `before_booking | after_booking | before_departure | onboard`
  - `featured?: boolean`
  - `emailSummary?: string`

Nie parsuj Markdownu runtime, jeśli nie ma w projekcie ustalonego pipeline’u Markdown. Dla tej skali lepszy jest jawny, typowany moduł z treścią przepisaną z Q&A. Zachowaj merytorykę dokumentu, ale skróć zdania tam, gdzie Q&A jest rozwlekłe.

## Implementacja strony

Dodaj komponenty w stylu istniejących sekcji:

- `src/lib/components/crew-guide-section/crew-guide-section.svelte` dla landingowego teaseru albo przebudowanej sekcji FAQ;
- `src/lib/components/crew-guide-page/crew-guide-page.svelte` albo bezpośrednio route component, jeśli nie ma potrzeby reużycia;
- zaktualizuj eksporty `index.ts`, jeśli tworzysz komponent-folder.

Na landing page:

- `FaqSection` może zostać, ale powinna pobierać `featured` pytania z `crew-guide.ts`;
- dodaj CTA do `/poradnik`: np. „Przeczytaj poradnik załogi”;
- rozważ zmianę tytułu z „Pytania i odpowiedzi” na coś cieplejszego, np. „Zanim wejdziesz na pokład”.

Na stronie `/poradnik`:

- hero ma być informacyjny, nie landingowy: tytuł, krótki opis, CTA do rezerwacji i kontakt do Michała;
- dodaj szybkie filtry/kategorie;
- dodaj sekcję „Najważniejsze przed wypłynięciem” jako checklistę;
- dodaj pełne Q&A pogrupowane tematycznie;
- dodaj końcowy kontakt i powrót do rezerwacji;
- zadbaj o mobile: nawigacja kategorii nie może zasłaniać treści ani tworzyć poziomego scrolla.

Nie dodawaj dekoracyjnych gradientowych orbów, kart w kartach ani marketingowej hero-sekcji. To ma być narzędzie do czytania.

## Komunikacja e-mail przed rejsem

Zaprojektuj lekki wariant mailowy poradnika, ale nie twórz agresywnej automatyzacji, jeśli brakuje pewnego źródła daty startu dla rezerwacji.

Minimalny wartościowy zakres:

- dodaj link do poradnika w istniejących mailach, gdzie pasuje:
  - potwierdzenie płatności / rezerwacji w `src/lib/server/email.ts`;
  - przypomnienie o danych załogi w `src/convex/_emails.ts`;
- copy ma mówić: „Przed rejsem przygotowaliśmy krótki poradnik: dokumenty, pakowanie, życie na pokładzie, płatności i kontakt”.

Opcjonalny zakres, jeśli model danych pozwala bezpiecznie ustalić start etapu:

- dodaj `sendPreCruiseGuideEmail` w `src/convex/_emails.ts`;
- dodaj cron/action wysyłający go np. 14 dni przed startem etapu tylko do potwierdzonych rezerwacji;
- dodaj pola trackingowe w schema tylko jeśli są naprawdę potrzebne i uwzględnij migrację/backfill;
- zabezpiecz idempotencję, żeby uczestnik nie dostał kilku identycznych maili.

Nie dodawaj crona „na oko”. Jeśli brakuje danych lub indeksów, zostaw tę część jako osobny, opisany follow-up.

## Nawigacja i linki

Sprawdź `src/lib/components/site-nav/site-nav.svelte` i `site-footer`. Dodaj link do poradnika tam, gdzie naturalnie pasuje, ale nie przeładuj górnej nawigacji. Priorytet nav: rezerwacja i kontakt nadal mają być łatwe do znalezienia.

Wszystkie linki wewnętrzne buduj przez `resolve` z `$app/paths`, tak jak robi to landing.

## Jakość i dostępność

- Akordeony: poprawne `button`, `aria-expanded`, `aria-controls`.
- Kategorie/filtry: klikalne przyciski, widoczny stan aktywny.
- Brak layout shift przy otwieraniu odpowiedzi.
- Tekst w przyciskach nie może wypadać poza kontener na mobile.
- Treść poradnika ma być semantyczna: `main`, `section`, nagłówki w sensownej kolejności.
- Nie ukrywaj pełnej treści wyłącznie za JS; strona ma być czytelna i indeksowalna.

## Kryteria akceptacji

- Landing nadal ma krótki blok FAQ/briefing i nie robi się tekstową ścianą.
- Istnieje działająca publiczna strona `/poradnik`.
- Pełny Q&A z `docs/design/Q&A-sailing-architects.md` jest przeniesiony, pogrupowany i zredagowany bez utraty ważnych informacji.
- Co najmniej jeden mail transakcyjny prowadzi do poradnika.
- Wspólny moduł treści eliminuje ręczne duplikowanie pytań między landingiem i poradnikiem.
- UI pasuje do obecnego stylu Sailing Architects.
- `pnpm check` przechodzi.
- Jeśli uruchamiasz dev server, sprawdź widoki desktop i mobile w przeglądarce.

## Raport końcowy

Na końcu podaj:

- które pliki zmieniłeś;
- jak pogrupowałeś Q&A;
- gdzie użytkownik zobaczy poradnik;
- gdzie dodałeś link mailowy;
- wynik `pnpm check`;
- ewentualne follow-upy, szczególnie jeśli pełna automatyzacja „przed rejsem” wymaga dodatkowych pól w danych.
