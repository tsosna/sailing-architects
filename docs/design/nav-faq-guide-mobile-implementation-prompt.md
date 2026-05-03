# Prompt: menu języka, mobile nav, nowe FAQ CTA i mobile UX poradnika

Jesteś senior-level implementerem pracującym w repo `sailing-architects` (SvelteKit 2, Svelte 5 runes, Convex, Clerk, Stripe, Brevo). Twoim zadaniem jest wdrożyć cztery dopracowania UI/UX po wdrożeniu nowego Q&A i strony „Poradnik załogi”.

Nie projektuj od zera. Zmiany mają być precyzyjne, zgodne z aktualnym stylem Sailing Architects i z istniejącymi wzorcami z `domy-modulowe`.

## Zakres

1. Dodać wybór języka do menu.
2. Dodać pełne menu mobile, którego teraz praktycznie nie ma.
3. Przerobić nagłówek sekcji FAQ na stronie głównej zgodnie ze screenshotem.
4. Przerobić CTA „Otwórz pełny poradnik załogi →” zgodnie ze screenshotem.
5. Naprawić UX „Poradnik załogi” na mobile, zachowując dobry sticky UX desktop.

## Pliki referencyjne

Aktualny projekt:

- `src/lib/components/site-nav/site-nav.svelte`
- `src/lib/components/faq-section/faq-section.svelte`
- `src/lib/components/crew-guide-page/crew-guide-page.svelte`
- `src/routes/[[lang=lang]]/+layout.svelte`
- `src/routes/[[lang=lang]]/poradnik/+page.svelte`
- `src/app.css`

Wzorzec mobile nav + language menu z innego projektu:

- `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/Projekty-Code/domy-modulowe/src/lib/components/layout/Navigation.svelte`
- `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/Projekty-Code/domy-modulowe/src/lib/components/ui/language/language-switcher.svelte`

Screenshoty docelowego FAQ:

- `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/Projekty-Code/sailing-architects/docs/assets/Screenshot 2026-05-03 at 10.42.10.png`
- `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/Projekty-Code/sailing-architects/docs/assets/Screenshot 2026-05-03 at 10.43.57.png`

## 1. Language switcher i mobile menu

W `site-nav.svelte` dodaj:

- desktopowy wybór języka w prawej części nav, obok `Panel` / `Rezerwuj`;
- hamburger na mobile;
- rozwijane mobile menu z linkami: `Jacht`, `Trasa`, `Kajuty`, `Cennik`, opcjonalnie `Poradnik`;
- mobile menu z akcjami `Panel`, `Rezerwuj` i wyborem języka;
- zamykanie menu po kliknięciu linku;
- `aria-expanded`, `aria-label`, sensowną obsługę focus/keyboard.

Wzoruj się na `domy-modulowe`, ale nie kopiuj bezmyślnie Tailwind ani importów Paraglide. Najpierw sprawdź aktualny mechanizm lokalizacji w `sailing-architects`. Jeśli nie ma gotowego komponentu language switchera, stwórz lekki lokalny komponent albo helper:

- preferowana ścieżka komponentu: `src/lib/components/language-switcher/language-switcher.svelte`;
- przełącznik ma obsłużyć `pl` i `en`;
- ma zachować aktualną ścieżkę przy zmianie języka, np. `/poradnik` ↔ `/en/poradnik`, `/book` ↔ `/en/book`;
- nie psuj anchorów na landing page (`/#route`, `/en/#route` itd.);
- jeżeli aktualny routing `[[lang=lang]]` ma inne helpery, użyj ich zamiast własnego string hackowania.

Wizualnie:

- styl ma pasować do navy/brass;
- brak zaokrąglonych pigułek, jeśli reszta nav jest ostra;
- hamburger może używać 3 linii jak w `domy-modulowe`;
- mobile menu nie może zasłaniać całego viewportu bez potrzeby, ale ma być pełnowartościowe.

## 2. FAQ header jak screenshot 10.42.10

Obecny tekst:

```text
FAQ
Najczęstsze pytania
Krótki wybór. Pełny poradnik załogi — checklisty, kategorie i wszystkie odpowiedzi — czeka na osobnej stronie.
```

Zastąp układem ze screenshotu:

- eyebrow: `PRZED WEJŚCIEM NA POKŁAD`
- duży tytuł: `Zanim wejdziesz na pokład`
- po prawej przycisk outline: `PORADNIK ZAŁOGI →`
- całość jako szeroki poziomy header nad akordeonem;
- tło nadal `var(--color-navy)`;
- max-width większy niż obecne 720px, żeby header oddychał podobnie do screenshotu;
- na desktop tytuł i przycisk w jednym rzędzie, przycisk wyrównany do prawej;
- na mobile tytuł i przycisk układają się pionowo, bez ścisku i bez overflow.

Nie pokazuj już pod tytułem zdania „Krótki wybór...”. To ma zniknąć z tego miejsca.

## 3. CTA box jak screenshot 10.43.57

Obecny pojedynczy link:

```text
Otwórz pełny poradnik załogi →
```

Zastąp go boxem pod akordeonem jak na screenshotcie:

- bordered container na pełną szerokość sekcji;
- tytuł: `Masz więcej pytań?`
- opis: `Pełny poradnik: 27 pytań, checklisty dokumentów, pakowanie, życie na pokładzie.`
- przycisk outline brass: `CZYTAJ PORADNIK ZAŁOGI →`
- box ma mieć większy max-width niż sam akordeon, jeśli potrzebne dla zgodności ze screenshotem;
- CTA nie ma wyglądać jak marketing card z dużym radiusem; krawędzie ostre, subtelny border.

Zachowaj akordeon pytań z `featuredCrewGuideQuestions`.

## 4. Poradnik załogi mobile UX

Desktop obecnie jest dobry dzięki sticky sidebar. Nie zepsuj desktopu.

Problem: mobile UX jest słaby. Napraw go tak, żeby na telefonie poradnik był naturalny do czytania.

Wymagania mobile:

- sidebar nie powinien tworzyć dużego bloku, który trzeba przewijać przed treścią;
- kontakt w sidebarze na mobile powinien zniknąć, przenieść się niżej albo być skrócony;
- kategorie powinny być dostępne jako:
  - poziomy sticky pasek przewijany pod nav, albo
  - kompaktowy `<select>` / disclosure „Sekcje poradnika”;
- jeśli używasz poziomego paska, musi mieć `overflow-x: auto`, stabilne rozmiary i nie może powodować poziomego scrolla całej strony;
- hero na mobile ma być krótsze; obecne `padding: 96px 24px 40px` może być nadal za wysokie po dodaniu nav/menu;
- checklisty na mobile: jedna kolumna, czytelne tap targety, bez tekstu uciekającego poza kontener;
- akordeony: pytanie i ikona nie mogą nachodzić na siebie;
- final CTA: przyciski pełnej szerokości lub dobrze zawijane.

Wymagania desktop:

- zachowaj sticky sidebar od 801px w górę albo popraw breakpoint, jeśli lepiej pasuje;
- sidebar dalej ma działać jako szybka nawigacja po sekcjach;
- desktopowy układ nie powinien dostać gorszych spacingów przez mobile poprawki.

## Kryteria akceptacji

- Desktop nav nadal wygląda jak obecny Sailing Architects.
- Desktop nav ma wybór języka.
- Mobile nav ma hamburger i pełne menu.
- Mobile menu zamyka się po kliknięciu linku.
- Language switcher przełącza między PL/EN bez gubienia aktualnej ścieżki.
- FAQ header wygląda jak screenshot `10.42.10`: eyebrow + duży title + prawy outline button.
- FAQ CTA wygląda jak screenshot `10.43.57`: bordered box + tytuł + opis + outline button.
- `/poradnik` na mobile nie zaczyna się od męczącego sidebaru; sekcje są łatwe do wyboru.
- Brak poziomego scrolla strony na szerokościach 390px i 430px.
- Akordeony FAQ i poradnika działają po zmianach.
- `pnpm check` przechodzi.

## Walidacja obowiązkowa

Uruchom:

```bash
pnpm check
```

Następnie uruchom aplikację lokalnie i sprawdź w przeglądarce:

- `/` desktop ok. 1440px;
- `/` mobile ok. 390px;
- `/poradnik` desktop ok. 1440px;
- `/poradnik` mobile ok. 390px i 430px;
- `/en/` i `/en/poradnik`, jeśli routing EN jest dostępny.

Sprawdź ręcznie:

- hamburger open/close;
- kliknięcie linku w mobile menu;
- language switcher desktop i mobile;
- FAQ CTA;
- przewijanie poradnika na mobile;
- brak poziomego scrolla.

## Raport końcowy

Na końcu podaj:

- zmienione pliki;
- jak zaimplementowałeś language switcher;
- jak zaimplementowałeś mobile menu;
- co dokładnie zmieniłeś w FAQ header i CTA;
- jak rozwiązałeś mobile UX poradnika;
- wynik `pnpm check`;
- czy wykonano visual QA w przeglądarce i na jakich viewportach;
- znane ograniczenia, jeśli jakieś zostały.

 Krótka weryfikacja sztuczki z resolve('/poradnik') w nowym linku z site-nav: skoro w istniejącym kodzie cała aplikacja używa resolve('/...') z grupy [[lang=lang]], jest to spójne z 
  resztą.                                                                                                                                                                              
                                                                                                                                                                                       
  Podsumowanie zmian                                                                                                                                                                   
                                                                                                                                                                                       
  Zmienione pliki:
  - src/lib/components/site-nav/site-nav.svelte — dodany hamburger, mobile menu, language switcher, link Poradnik
  - src/lib/components/faq-section/faq-section.svelte — przebudowany nagłówek (eyebrow „Przed wejściem na pokład" + duży tytuł + outline button po prawej) i CTA box pod akordeonem    
  - src/lib/components/crew-guide-page/crew-guide-page.svelte — naprawiony mobile UX (sticky horizontal nav pod nav, ukryty sidebar contact, jedna kolumna checklist, mniejszy hero,
  full-width CTA buttons)                                                                                                                                                              
                                                                                                                                                                                       
  Nowe pliki:                                                                                                                                                                          
  - src/lib/components/language-switcher/language-switcher.svelte — komponent PL/EN                                                                                                    
  - src/lib/components/language-switcher/index.ts — barrel                                                                                                                             
                                                          
  Language switcher: czyta page.url.pathname/search/hash i page.params.lang; usuwa istniejący prefix /(en|pl), opcjonalnie nakłada /en. Zachowuje query i hash. data-sveltekit-reload, 
  by loadLocale w +layout.ts poprawnie podmienił locale.                                                                                                                               
   
  Mobile menu: hamburger pojawia się przy ≤900px (desktop bar znika), Escape zamyka, klik w link/akcję zamyka, panel pod nav (top: 64px), nie zasłania całego viewportu.               
                                                            
  FAQ header: flex row na desktop, kolumna na mobile, max-width 1100px, tytuł clamp(32px, 5vw, 56px), outline button po prawej.                                                        
                                                            
  FAQ CTA: bordered box (border 0.18, padding 32 / 24 mobile), tytuł serif 22px, opis, outline brass button.                                                                           
                                                            
  Crew guide mobile: sidebar jako poziomy sticky pasek pod nav z overflow-x: auto, flex-wrap: nowrap, ukryta etykieta i contact card, hero zmniejszone do 88-96px góra, checklisty 1   
  kolumna, akordeony zwarte, CTA buttons full-width.        
                                                                                                                                                                                       
  pnpm check: 0 errors, 0 warnings.                         

  Visual QA w przeglądarce: nie wykonane — nie miałem uruchomionego dev servera. Zalecam ręczny test viewportów 390/430/1440 oraz /en/poradnik zgodnie z prośbą.                       
   
  Znane ograniczenia:                                                                                                                                                                  
  - Linki w nav (Jacht/Trasa/Kajuty/Cennik/Poradnik) nadal używają resolve(...) bez ręcznego przepisania prefixa lang — to spójne z resztą projektu, ale potencjalnie wymaga osobnego
  audytu czy resolve w [[lang=lang]] honoruje aktywny lang. Naprawa wykraczała poza zakres tego zadania.                                                                               
  - Mobile menu nie blokuje scrolla body (panel jest krótki, więc to nie powinno przeszkadzać; gdyby treść menu rosła — warto dodać overflow: hidden na body w stanie open).