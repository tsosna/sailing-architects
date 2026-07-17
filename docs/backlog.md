# Backlog — sailing-architects

> **Jedyne źródło prawdy dla OTWARTYCH pozycji.** Ostatni reconcile: 2026-07-16.
>
> Zasady:
> - Tu trafia **każda** otwarta pozycja (bug / feature / infra). Rozwiązane → skreśl `~~…~~` z datą albo usuń.
> - Szczegóły dużych list żyją w dedykowanych plikach (poniżej linkowane) — tu tylko 1-linijkowy wpis + wskaźnik.
> - `handoff.md` = narracja sesji (co się stało). **Nie jest** backlogiem.
> - Close-session: przenieś nowe otwarte tu, oznacz rozwiązane. Jeden przebieg = lista uczciwa.
> - ID stabilne — nie zmieniaj po nadaniu.

---

## 🔴 Bugi otwarte

- ~~**BUG-1 — Panel żeglarza: „Cała trasa rejsu" zawsze podświetla Gibraltar→Madera.**~~ ✅ 2026-07-13 (hardcoded `active` usunięte z `ports[]`; `activeLeg` derived ze `slug` segmentu bookingu, mapa s1..s4→0..3; reaguje na selektor multi-booking). *(dup: admin-post-mvp „…zawsze podświetla Gibraltar → Madera" — skreślić i tam)*
- ~~**BUG-2 — Checkout krok 4 (`/book?segment=s1`): przycisk „Wróć" nie działa.**~~ ✅ 2026-07-13 (commit `15261fa4`: ping-pong back()↔$effect; łańcuch wstecz zalogowanego 4→3→1). *(feedback 07-05; ta sama uwaga w docx Michała 06-19)*
- ~~**BUG-3 — Po kliknięciu „Rezerwuj" klik na „Panel" nie działa** („Poradnik" działa)~~ ✅ 2026-07-13 (nie overlay: same-route nav `/book`→`/book?auth=` nie remountuje komponentu, `initialAuthParam` czytany raz w init; fix: `$effect` na reaktywnym `authParam` — zalogowany → `panelTarget()`, wylogowany → step 2). *(feedback 07-05)*
- ~~**BUG-4 — Alert „Held kończy się za X min" zamrożony.**~~ ✅ 2026-07-15 (commit `650887e9`: query zwraca surowe `holdExpiresAt?` w alercie, klient formatuje z reactive clock `{@const}` + ternary; na prod). *(dup: admin-post-mvp „Reactive clock dla odliczania held" — skreślić i tam)*
- ~~**BUG-5 — `/book` Step 5: fallback „Całość" maskuje brak planu w bazie.**~~ ✅ 2026-07-16 (commit `cc28966`: fallback → `[]`, template z gałęziami loading / query-error / brak-planu / radia; smoke test przez `isActive: false` w Dashboardzie OK). *(dup: admin-post-mvp „`/book` Step 5 — fallback…" — skreślić i tam)*
- ~~**BUG-6 — Admin: brak akcji „Wyloguj" w `/admin` w ogóle** + brak avatar/user-menu.~~ ✅ 2026-07-15 (commit `1274523d`: `<UserButton />` w admin sidebar dół + mobilebar + dashboard header; dark theme popovera naprawiony — nowe nazwy zmiennych Clerk + `elements.userButtonPopoverActionButton`; na prod). Style `.btn--signout` zostają — reużyte przez selektor rejsu. *(dup: admin-post-mvp „Brak akcji Wyloguj w layoucie /admin" — skreślić i tam)*
- **BUG-7 — Walidacja formy edycji uczestnika w drawerze.** `adminUpdateParticipantData` przyjmuje surowe stringi bez format/enum check (email, data, enumy). Fix: współdziel zod z booking flow. *(admin-post-mvp „Walidacja pól formy…")* **W toku 07-16 (kod gotowy, niecommitowany):** `adminParticipantSchema` (format-only, pola opcjonalne) w `crew-profile.ts`; walidacja klient (drawer, `novalidate`) + serwer (mutation, throw). Przy okazji: drawer miał `type="date"` (ISO) vs reszta app `dd/mm/yyyy` — ujednolicone na tekstowe. **Zostaje: smoke test warstwy serwerowej** (zakomentuj walidację w drawerze → zły email → toast z komunikatem serwera z `;` → przywróć) + commit.

## 🚀 Deploy

- ~~**DEP-1 — Deploy zbiorczy:** snapshot polityki + A7e cron + audit UI + admin nav shell.~~ **✅ ZDEPLOYOWANE 2026-07-10** (`push origin main:production` → `efb399fc..f289608b`; CRON_SECRET w Vercel; build zielony; Vercel Cron zarejestrowany). Zostaje **walidacja na prod** (nie sam deploy):
  - **DEP-1a — Test odporności snapshotu na prod** (właściwy dowód prawny): kup rejs → snapshot zamraża % → admin zmienia próg → zwrot → sugestia trzyma snapshot, nie żywą.
  - **DEP-1b — A7e na realnym stuck refund:** wymuś pending bez webhooka → cron/curl z `CRON_SECRET` → koja wraca + mail.

## ✨ Features (większe)

- **FEAT-1 — PDF itinerary rejsu do pobrania,** gated za auth (tylko uczestnicy). INNY niż PDF potwierdzenia. *(Michał 06-19 #18)*
- **FEAT-2 — Faktury + KSeF** (duży moduł, research 2026-07-03). Convex action, FA(3) XML, cert KSeF typ 1 Michała. Szczegóły: handoff „Otwarte problemy".
- **FEAT-3 — Audit log rozbudowa:** filtry server-side (`by_action`/`by_booking`) + `policy_updated` before→after diff. MVP już żyje (`/admin/audit`).
- **FEAT-4 — unhandledStripeEvents resolution UI** (refundy z Stripe Dashboard) — lista + decyzje admina (release/keep/orphan), `resolution` enum już w schema.
- **FEAT-5 — Multi-rejs / multi-segment platform + teaser przyszłych rejsów.** Przerobić landing + bazę pod wiele rejsów, tak by współistniały: aktualny (wyprzedany lub w sprzedaży) + zapowiadany nowy. Elementy: (a) zakładka np. „REJS GRECJA maj 2027" z opisem + „termin wkrótce"; (b) **wysuwana belka pod menu** „chcę szczegóły" → email capture → powiadomienie przy starcie sprzedaży + **5% rabat** early-bird; (c) **rozbudowa menu — przechodzenie między rejsami**. DUŻY, przemyśleć cały landing. *(Michał 07-07 #3 + Tomek 07-10 #1-3)* **Pierwszy konkretny drugi rejs (Michał 07-12): Seszele, katamaran Lagoon 40, 4 kajuty×2 os. (prywatne łazienki, klima, agregat, odsalarka), maj 2027, 2 terminy: 8-18 i 18-29 maja (można 22 dni), 1150 EUR/os. + przelot + pokładówka. Plakat: `docs/assets/WhatsApp Image 2026-07-10 at 15.34.38.jpeg` — termin na plakacie BŁĘDNY.**
- **FEAT-6 — Indywidualne ceny koi** (rabat per koja; boczna kajuta taniej „gdy chcemy"). Mechanizm: procent rabatu przy koi albo opis + reużycie działającego mechanizmu zwrotu. *(Michał 07-07 #2 + Tomek 07-07 #2)*
- **FEAT-7 — Płeć żeglarza** w schemacie + opcjonalne pokazywanie K/M na sprzedanych miejscach. *(Michał 07-07 #4)*
- **FEAT-8 — Badge „BRAK MIEJSC"** gdy odcinek/rejs wyprzedany (wyraźny napis że jest, ale sprzedany). *(Michał 07-07 #1)*
- **FEAT-9 — Miejsca specjalne: podpiąć edycję danych żeglarza** (`/admin/special`). *(Tomek 07-07 #1)*
- **FEAT-11 — Admin: samodzielna edycja cen segmentów i parametrów landingu (Michał).** Feedback Michała 07-17: nie mógł zmienić ceny całkowitej rejsu („pole ceny nieaktywne") ani długości trasy (km→nm). Stan dzisiejszy: cena żyje w **4 miejscach** — (1) Convex `voyageSegments.pricePerBerth` (jedyne źródło naliczania w Stripe `create-intent`!), (2) `src/lib/data/voyage-segments.ts` (UI checkout), (3) `route-section.svelte` (landing, hardcoded lista), (4) kwoty rat w planach płatności (`/admin/automation`). Zmiana ceny = ręczna synchronizacja wszystkich 4 (Tomek 07-17: „centy musiałem zmieniać w trzech miejscach" + patch DB). Docelowo: jedno źródło (DB) + UI admina do edycji ceny segmentu i statów landingu (długość trasy w nm). Uwaga na snapshot: istniejące bookingi trzymają kopie — zmiana ceny działa tylko w przód. *(Michał 07-17 + Tomek 07-17)*
- **FEAT-10 — Checkout: przemyśleć miejsce kroku 3 (dane załogi).** Obserwacja przy BUG-2: krok 3 miesza dane żeglarza z procesem płatności; jest hybrydą etapu flow i formularza-detour z kroku 4 (stąd niejasny przycisk „Zapisz i wróć"). Dane są już opcjonalne i uzupełnialne po płatności w panelu → kandydat: wyjąć krok 3 z checkoutu (zostawić tylko ścieżkę panelową + detour z podsumowania) albo przesunąć za płatność. Decyzja produktowa — zdanie Michała. *(Tomek 07-13, przy naprawie BUG-2)*

## ⚖️ Legal / compliance

- **LEGAL-1 — Strona RODO pod `/rodo`** (`www.sailing-architect.com/rodo`). Wymagane prawnie. *(Michał 07-07 #6)*
- **LEGAL-2 — Polityka prywatności** + link wklejony do regulaminu. Wzór: https://domy-modulowe.eu/polityka-prywatnosci *(Michał 07-07 #7)*

## 🔐 Security / dane wrażliwe

- **SEC-1 — Szyfrowanie pól wrażliwych + minimalizacja/retencja.** `bookingParticipants.documentNumber` (nr dowodu/paszportu) w Convex jako szyfrogram (AES-256-GCM), klucz w env Vercela — **poza Convexem** (wyciek dumpa bazy = bełkot; szyfrowanie pola jest tak dobre jak separacja klucza od bazy). Granica szyfr/deszyfr = SvelteKit server, NIE klient (klucz w przeglądarce = problem dystrybucji; serwer i tak musi widzieć plaintext: PDF, manifest, maile). Konsekwencja: zapis wrażliwych pól z klienta musi przejść przez endpoint SvelteKit + `internalMutation` (wzorzec z `/api/admin/refunds/*`), dziś idzie prosto do `upsertBookingParticipant`; tracimy indeksy po zaszyfrowanym polu (nie szukamy po nim). NAJPIERW minimalizacja: czy pole musi istnieć i jak długo — retencja po rejsie + okresie roszczeń → kasować. Haszowanie NIE (jednokierunkowe — dane trzeba odczytywać). *(dyskusja Tomek 07-13, kontekst: handoff sesja 07-12/13)*
- **SEC-2 — Region EU Convex ✅ potwierdzony / zostaje: DPA + nota kosztowa.** (a) ✅ 07-13: prod `qualified-crab-196` = **Europe (Ireland)**, URL `eu-west-1.convex.cloud` — projekt tworzony z default Europe, **zero migracji, „dane w Europie" prawdziwe od startu**. Nota kosztowa na przyszłość: na darmowym planie zużycie EU liczy się do zwykłych limitów; **po upgrade na płatny plan** limity wliczone obejmują tylko US — EU billowane on-demand od pierwszego calla **+30% surcharge** (info dla Michała przy skalowaniu). (b) Zostaje: DPA od Convex, Clerk, Stripe, Brevo (wiąże się z LEGAL-2); uwaga: Clerk/Stripe/Brevo hostują w USA — „dane w Europie" dotyczy bazy Convex, nie całego łańcucha (auth, płatności, maile); w polityce prywatności opisać uczciwie. *(dyskusja Tomek 07-13)*
- **SEC-3 — Backup produkcyjnego deploymentu Convex.** ~~„No backup yet"~~ pierwszy backup ręczny zrobiony + pobrany 07-13 (Tomek). Plik eksportu zaszyfrowany (zip -e) 07-13; FileVault na Mac mini OFF — do włączenia przez Tomka. **Ustalony kierunek (07-13):** Warstwa 1 = snapshoty w Convex Backup & Restore (plik nie opuszcza chmury; sprawdzić harmonogram na darmowym vs Pro). Warstwa 2 = cykliczny (np. miesięczny) eksport szyfrowany PRZED wysyłką (`zip -e`, jedno mocne hasło w menedżerze haseł) → iCloud Drive (opcjonalnie Advanced Data Protection dla E2E); retencja 3 ostatnie; poza Downloads i poza repo. Kwartalnie test odtworzenia: `npx convex import` na dev. *(wykryte 07-13 przy weryfikacji regionu)*

## 🎨 UI / landing (drobne, spoza Michał 06-19)

- **UI-1 — Mobile: odwrócić kolejność CTA** po „Rezerwuj" — najpierw „Zaloguj się do panelu", potem „Rezerwacja jako manifest pokładowy". *(feedback 07-05 #3)*
- **UI-2 — Wolne/zajęte miejsca wyraźniej** w layout strony. *(Michał 07-07 #5)*
- **UI-3 — Podciągnąć wyrazistość/percepcję strony i panelu** (Michał: obrazy `assets/WhatsApp Image 2026-07-07 at 15.08.44/15.09.09.jpeg`). *(Michał 07-07 #8)*
- **UI-4 — Admin: mobile-tabs rozjeżdżają się przy szerokości ~1180px.** Breakpoint chowa sidebar, a taby sekcji renderują się jako ogromne kafle na szerokości tabletu — layout „do kitu" między desktopem a telefonem. Przejrzeć media query w `admin/+layout@.svelte` (breakpoint + wysokość/proporcje `.mobile-tabs`). *(Tomek 07-15, zauważone przy BUG-6)*
- **UI-5 — Admin: nie da się wyczyścić pola uczestnika w drawerze.** Puste pole → `optional()` → `undefined` → Convex traktuje jako „argument nieobecny" → `ctx.db.patch` nie dotyka pola, stara wartość zostaje. Puste = „nie ruszaj", nie „wyczyść". Fix wymagałby zmiany kontraktu mutation (rozróżnienie brak-argumentu vs ustaw-pusto); najpierw decyzja, czy czyszczenie pól to realny use-case admina. *(wykryte 07-16 przy BUG-7)*

## 🎨 Landing — uwagi Michała 2026-06-19 (22 poz.)

→ **Szczegóły: `handoff.md` sekcja „Backlog Michała — landing (2026-06-19)".** ~~13 pozycji copy~~ ✅ 2026-07-12 (commit `9a02312e`). ~~Ramka logo~~ ✅ 07-13 (`ff60d02c`). ~~Mapa: realna geografia + mobile~~ ✅ 07-13 (`875e731a`). ~~Link Instagram~~ ✅ 07-13 (`462e492c`, `instagram.com/sailing_architects`). **Zostają tylko:** galeria (Later — Michał odłożył), zakładka „O nas" (Later), blok „nikt nie wie o co chodzi" (czeka na autora); PDF itinerary = FEAT-1. Otwarte z copy: czy „Wachty nawigacyjne" zostaje osobno obok „aktywnego udziału załogi" (pytanie do Michała).

## ⚙️ Post-MVP admin (świadomie odłożone, ~33 poz.)

→ **Szczegóły: `docs/admin-post-mvp-decisions.md`** (format Stan/Trigger/Kierunek). Bierz gdy trigger realny (sprzedaż/feedback kapitana). Główne: granularne role kapitan/operator, eksport CSV Sales Board, nightly admin e-mail, konfigurowalne reguły monitów, single-source `voyageSegments`, `+layout@` reset na `/crew/confirm/[token]`, „Poproś o nowy link", WhatsApp/SMS API. **Uwaga: BUG-1/4/5/6/7 pochodzą z tego pliku — po naprawie skreśl w obu miejscach.**

## 📚 Nauka / jakość kodu

- ~~**LEARN-1 — Lekcja ekstrakcji: logika refundów do `_lib/` + testy.**~~ ✅ 2026-07-11 (sesja II) — `matchRefundTier` → `_lib/refundTiers.ts` (5 testów) + `allocateCascade` → `_lib/refundCascade.ts` (8 testów, throw ×3), handlery cienkie, commit `451e0c6a`, CI zielone.
- ~~**INFRA-1 — ESLint** (eslint + eslint-plugin-svelte). Trzeci brak z audytu 07-11 (po CI ✅ i testach ✅). Prettier ≠ linting: brak kontroli a11y, unused vars, wzorców Svelte.~~ ✅ 2026-07-12 — flat config (js+ts+svelte+prettier, ignores z `.gitignore`), triaga 54 znalezisk: 19 fixów (eqeqeq ×3, martwe inicjalizatory ×3, unused ×3, ctx `any`→`QueryCtx`/`DatabaseReader` ×6, prefer-const), 5 inline-disable z uzasadnieniem, wpięte w `pnpm lint` + CI.
- **INFRA-2 — `svelte/no-navigation-without-resolve` (23 warningi).** Przejście linków/`goto()` na `resolve()` z `$app/paths` — typowane trasy. Reguła zdegradowana do `warn` w `eslint.config.js`; refactor 23 miejsc (site-nav ×6, book ×6, admin ×5, reszta pojedyncze) jako osobna sesja.
- **INFRA-3 — Przegląd zależności w `package.json`.** Do sprawdzenia nowe/odstające pakiety *(Tomek 07-15)*. Konkretny sygnał z sesji 07-15: dryf svelte-clerk — typy `clerk-js` 6.7.7 w node_modules vs runtime 6.25.3 z CDN (źródło problemów z appearance i propsami; wiki `clerk-cdn-runtime-version-drift`). Rozważyć aktualizację svelte-clerk/@clerk i przegląd reszty (`pnpm outdated`).
- **REFACTOR-1 — `/book`: jedno źródło prawdy wyboru koi.** Dziś dwa stany o tym samym fakcie: lokalny `selectedSegment`/`selectedBerths` w `book/+page.svelte` + globalny `bookingSelection` (czyta nav), synchronizowane ręcznie w 3 punktach (Plan A, 07-14). Docelowo `/book` czyta/pisze wyłącznie `bookingSelection` (klasa dostaje init z URL), lokalne zmienne znikają. Uwaga na SSR: init do singletona tylko w `if (browser)`. *(decyzja Tomka 07-14 przy feedbacku 07-17)*

## 🌍 i18n

- **I18N-1 — Uruchomienie EN: teksty z plików danych `.ts` poza wuchale + pusty katalog.** (a) Config wuchale ma tylko adapter `svelte` → pliki danych (`src/lib/data/crew-guide.ts` — całe FAQ/poradnik) nie trafiają do `.po`; wersja EN pokaże je po polsku. Rozwiązanie do wyboru przy podjęciu: drugi adapter `vanilla` dla plików danych ALBO per-locale pliki (`crew-guide.pl.ts` / `crew-guide.en.ts` wybierane po `params.lang`). (b) `en.po` ma niemal wszystkie `msgstr` puste — EN treściowo nie istnieje; uruchomienie = realna praca tłumaczeniowa, nie tylko technika. *(wykryte 07-12 przy copy landing)*

## ❓ Open questions

- **A7d regulamin rejsu** — progi 180/90/42/0 potwierdzone (§3.8); dokument dostarczony 07-07. Czy coś jeszcze otwarte? Zweryfikować.
- **Faktury KSeF:** (a) zagraniczni nabywcy przez KSeF czy poza; (b) termin obowiązku Michała wg obrotu; (c) cert typ 1 od Michała.

## 📥 Feedback — status przetworzenia

> Diff: `ls docs/feedback/` vs ta lista. Każdy plik nieoznaczony ✅ → striażuj do backlogu i dopisz tu. Chroni przed zgubieniem nowego feedbacku.

- ✅ `2026-06-19-uwagi-do-strony.docx` — striażowany 07-10 → „Landing Michała 06-19" (22 poz.)
- ✅ `2026-07-05.md` — striażowany wcześniej → BUG-2/BUG-3/UI-1 (status dopisany 07-13)
- ✅ `2026-07-07.md` — striażowany wcześniej → FEAT-5..8, LEGAL-1/2, UI-2/3 (status dopisany 07-13)
- ✅ `2026-07-10.md` — striażowany wcześniej → BUG-6/avatar, FEAT-5 (status dopisany 07-13)
- ✅ `2026-07-12.md` — striażowany 07-13 → FEAT-5 (rejs Seszele maj 2027, szczegóły + plakat w pozycji FEAT-5)
- ✅ `2026-07-17.md` — striażowany 07-14 → zrealizowany od ręki (1 poz.): nav „Kontynuuj rezerwację →" gdy zalogowany + koje wybrane (commit `d1aba342`)
- ℹ️ `2026_07_07_SA_regulamin_rejsu.doc` — nie feedback, dokument źródłowy (regulamin; progi §3.8 wykorzystane przy ADR-002)

## ✅ Rozwiązane niedawno (żeby nie wracały)

- ~~Nav „Rezerwuj" statyczny mimo zalogowania + wyboru koi (feedback 07-17)~~ — 07-14 (`d1aba342`: `reserveLabel` w site-nav + sync `/book` → `bookingSelection`; na main, prod czeka na zbiorczy push).
- ~~Panel żeglarza pokazywał zły/wygasły booking~~ — 07-05 (`bookingByUser` lista + filtr `confirmed`).
- ~~Panel żeglarza: tylko jedna koja mimo wielu~~ — 07-05 (selektor rejsu).
- ~~PDF potwierdzenia font poza bundlem~~ — 07-07 (`?url` + `read()`).
- ~~Refund webhook race → podwójny refund~~ — 07-07 (match po `refundRowId`).
- ~~Refund policy retroaktywny~~ — 07-09 (snapshot przy zakupie, ADR-002) — **czeka deploy DEP-1**.
- ~~Audit log brak UI~~ — 07-10 (`/admin/audit` MVP) — **czeka deploy DEP-1**.
