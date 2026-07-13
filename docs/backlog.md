# Backlog — sailing-architects

> **Jedyne źródło prawdy dla OTWARTYCH pozycji.** Ostatni reconcile: 2026-07-10.
>
> Zasady:
> - Tu trafia **każda** otwarta pozycja (bug / feature / infra). Rozwiązane → skreśl `~~…~~` z datą albo usuń.
> - Szczegóły dużych list żyją w dedykowanych plikach (poniżej linkowane) — tu tylko 1-linijkowy wpis + wskaźnik.
> - `handoff.md` = narracja sesji (co się stało). **Nie jest** backlogiem.
> - Close-session: przenieś nowe otwarte tu, oznacz rozwiązane. Jeden przebieg = lista uczciwa.
> - ID stabilne — nie zmieniaj po nadaniu.

---

## 🔴 Bugi otwarte

- **BUG-1 — Panel żeglarza: „Cała trasa rejsu" zawsze podświetla Gibraltar→Madera.** `dashboard/+page.svelte:202-211` — `ports[]` ma hardcoded `active: true` na Gibraltar+Madera; `legActive()` podświetla odcinek gdy oba końce `active`. Fix: wyprowadź `active` z segmentu bookingu (`bookingData`; slug→odcinek s1..s4). *(dup: admin-post-mvp „…zawsze podświetla Gibraltar → Madera")*
- ~~**BUG-2 — Checkout krok 4 (`/book?segment=s1`): przycisk „Wróć" nie działa.**~~ ✅ 2026-07-13 (commit `15261fa4`: ping-pong back()↔$effect; łańcuch wstecz zalogowanego 4→3→1). *(feedback 07-05; ta sama uwaga w docx Michała 06-19)*
- ~~**BUG-3 — Po kliknięciu „Rezerwuj" klik na „Panel" nie działa** („Poradnik" działa)~~ ✅ 2026-07-13 (nie overlay: same-route nav `/book`→`/book?auth=` nie remountuje komponentu, `initialAuthParam` czytany raz w init; fix: `$effect` na reaktywnym `authParam` — zalogowany → `panelTarget()`, wylogowany → step 2). *(feedback 07-05)*
- **BUG-4 — Alert „Held kończy się za X min" zamrożony.** `admin.ts:319-331` zwraca sformatowany string zamiast raw `holdExpiresAt`; klient nie odlicza. Fix: zwróć raw, formatuj z lokalnego `now` (jak reactive clock KPI). *(dup: admin-post-mvp „Reactive clock dla odliczania held")*
- **BUG-5 — `/book` Step 5: fallback „Całość" maskuje brak planu w bazie.** Klasa UX (fallback ukrywa błąd konfiguracji). *(admin-post-mvp „`/book` Step 5 — fallback…")*
- **BUG-6 — Admin: brak akcji „Wyloguj" w `/admin` w ogóle** + brak avatar/user-menu (standard „zalogowany"). Dashboard żeglarza ma surowy `<SignOutButton>` (`dashboard/+page.svelte:247`) do zawinięcia. Idiom: svelte-clerk `<UserButton />`. *(dup: admin-post-mvp „Brak akcji Wyloguj w layoucie /admin"; Tomek 07-10)*
- **BUG-7 — Walidacja formy edycji uczestnika w drawerze.** `adminUpdateParticipantData` przyjmuje surowe stringi bez format/enum check (email, data, enumy). Fix: współdziel zod z booking flow. *(admin-post-mvp „Walidacja pól formy…")*

## 🚀 Deploy

- ~~**DEP-1 — Deploy zbiorczy:** snapshot polityki + A7e cron + audit UI + admin nav shell.~~ **✅ ZDEPLOYOWANE 2026-07-10** (`push origin main:production` → `efb399fc..f289608b`; CRON_SECRET w Vercel; build zielony; Vercel Cron zarejestrowany). Zostaje **walidacja na prod** (nie sam deploy):
  - **DEP-1a — Test odporności snapshotu na prod** (właściwy dowód prawny): kup rejs → snapshot zamraża % → admin zmienia próg → zwrot → sugestia trzyma snapshot, nie żywą.
  - **DEP-1b — A7e na realnym stuck refund:** wymuś pending bez webhooka → cron/curl z `CRON_SECRET` → koja wraca + mail.

## ✨ Features (większe)

- **FEAT-1 — PDF itinerary rejsu do pobrania,** gated za auth (tylko uczestnicy). INNY niż PDF potwierdzenia. *(Michał 06-19 #18)*
- **FEAT-2 — Faktury + KSeF** (duży moduł, research 2026-07-03). Convex action, FA(3) XML, cert KSeF typ 1 Michała. Szczegóły: handoff „Otwarte problemy".
- **FEAT-3 — Audit log rozbudowa:** filtry server-side (`by_action`/`by_booking`) + `policy_updated` before→after diff. MVP już żyje (`/admin/audit`).
- **FEAT-4 — unhandledStripeEvents resolution UI** (refundy z Stripe Dashboard) — lista + decyzje admina (release/keep/orphan), `resolution` enum już w schema.
- **FEAT-5 — Multi-rejs / multi-segment platform + teaser przyszłych rejsów.** Przerobić landing + bazę pod wiele rejsów, tak by współistniały: aktualny (wyprzedany lub w sprzedaży) + zapowiadany nowy. Elementy: (a) zakładka np. „REJS GRECJA maj 2027" z opisem + „termin wkrótce"; (b) **wysuwana belka pod menu** „chcę szczegóły" → email capture → powiadomienie przy starcie sprzedaży + **5% rabat** early-bird; (c) **rozbudowa menu — przechodzenie między rejsami**. DUŻY, przemyśleć cały landing. *(Michał 07-07 #3 + Tomek 07-10 #1-3)*
- **FEAT-6 — Indywidualne ceny koi** (rabat per koja; boczna kajuta taniej „gdy chcemy"). Mechanizm: procent rabatu przy koi albo opis + reużycie działającego mechanizmu zwrotu. *(Michał 07-07 #2 + Tomek 07-07 #2)*
- **FEAT-7 — Płeć żeglarza** w schemacie + opcjonalne pokazywanie K/M na sprzedanych miejscach. *(Michał 07-07 #4)*
- **FEAT-8 — Badge „BRAK MIEJSC"** gdy odcinek/rejs wyprzedany (wyraźny napis że jest, ale sprzedany). *(Michał 07-07 #1)*
- **FEAT-9 — Miejsca specjalne: podpiąć edycję danych żeglarza** (`/admin/special`). *(Tomek 07-07 #1)*
- **FEAT-10 — Checkout: przemyśleć miejsce kroku 3 (dane załogi).** Obserwacja przy BUG-2: krok 3 miesza dane żeglarza z procesem płatności; jest hybrydą etapu flow i formularza-detour z kroku 4 (stąd niejasny przycisk „Zapisz i wróć"). Dane są już opcjonalne i uzupełnialne po płatności w panelu → kandydat: wyjąć krok 3 z checkoutu (zostawić tylko ścieżkę panelową + detour z podsumowania) albo przesunąć za płatność. Decyzja produktowa — zdanie Michała. *(Tomek 07-13, przy naprawie BUG-2)*

## ⚖️ Legal / compliance

- **LEGAL-1 — Strona RODO pod `/rodo`** (`www.sailing-architect.com/rodo`). Wymagane prawnie. *(Michał 07-07 #6)*
- **LEGAL-2 — Polityka prywatności** + link wklejony do regulaminu. Wzór: https://domy-modulowe.eu/polityka-prywatnosci *(Michał 07-07 #7)*

## 🎨 UI / landing (drobne, spoza Michał 06-19)

- **UI-1 — Mobile: odwrócić kolejność CTA** po „Rezerwuj" — najpierw „Zaloguj się do panelu", potem „Rezerwacja jako manifest pokładowy". *(feedback 07-05 #3)*
- **UI-2 — Wolne/zajęte miejsca wyraźniej** w layout strony. *(Michał 07-07 #5)*
- **UI-3 — Podciągnąć wyrazistość/percepcję strony i panelu** (Michał: obrazy `assets/WhatsApp Image 2026-07-07 at 15.08.44/15.09.09.jpeg`). *(Michał 07-07 #8)*

## 🎨 Landing — uwagi Michała 2026-06-19 (22 poz.)

→ **Szczegóły: `handoff.md` sekcja „Backlog Michała — landing (2026-06-19)".** ~~13 pozycji copy~~ ✅ 2026-07-12 (commit `9a02312e`: etapy 01-04, cennik + gwarancja miejsca, jacht, FAQ q2, kapitan→skipper w całym src). **Zostają:** ramka logo w hero (bug), mapa — realna geografia + większe napisy/kropki mobile, link Instagram, galeria (Later — Michał odłożył), blok „nikt nie wie o co chodzi" (czeka na autora); PDF itinerary = FEAT-1. Otwarte z copy: czy „Wachty nawigacyjne" zostaje osobno obok „aktywnego udziału załogi" (pytanie do Michała).

## ⚙️ Post-MVP admin (świadomie odłożone, ~33 poz.)

→ **Szczegóły: `docs/admin-post-mvp-decisions.md`** (format Stan/Trigger/Kierunek). Bierz gdy trigger realny (sprzedaż/feedback kapitana). Główne: granularne role kapitan/operator, eksport CSV Sales Board, nightly admin e-mail, konfigurowalne reguły monitów, single-source `voyageSegments`, `+layout@` reset na `/crew/confirm/[token]`, „Poproś o nowy link", WhatsApp/SMS API. **Uwaga: BUG-1/4/5/6/7 pochodzą z tego pliku — po naprawie skreśl w obu miejscach.**

## 📚 Nauka / jakość kodu

- ~~**LEARN-1 — Lekcja ekstrakcji: logika refundów do `_lib/` + testy.**~~ ✅ 2026-07-11 (sesja II) — `matchRefundTier` → `_lib/refundTiers.ts` (5 testów) + `allocateCascade` → `_lib/refundCascade.ts` (8 testów, throw ×3), handlery cienkie, commit `451e0c6a`, CI zielone.
- ~~**INFRA-1 — ESLint** (eslint + eslint-plugin-svelte). Trzeci brak z audytu 07-11 (po CI ✅ i testach ✅). Prettier ≠ linting: brak kontroli a11y, unused vars, wzorców Svelte.~~ ✅ 2026-07-12 — flat config (js+ts+svelte+prettier, ignores z `.gitignore`), triaga 54 znalezisk: 19 fixów (eqeqeq ×3, martwe inicjalizatory ×3, unused ×3, ctx `any`→`QueryCtx`/`DatabaseReader` ×6, prefer-const), 5 inline-disable z uzasadnieniem, wpięte w `pnpm lint` + CI.
- **INFRA-2 — `svelte/no-navigation-without-resolve` (23 warningi).** Przejście linków/`goto()` na `resolve()` z `$app/paths` — typowane trasy. Reguła zdegradowana do `warn` w `eslint.config.js`; refactor 23 miejsc (site-nav ×6, book ×6, admin ×5, reszta pojedyncze) jako osobna sesja.

## 🌍 i18n

- **I18N-1 — Uruchomienie EN: teksty z plików danych `.ts` poza wuchale + pusty katalog.** (a) Config wuchale ma tylko adapter `svelte` → pliki danych (`src/lib/data/crew-guide.ts` — całe FAQ/poradnik) nie trafiają do `.po`; wersja EN pokaże je po polsku. Rozwiązanie do wyboru przy podjęciu: drugi adapter `vanilla` dla plików danych ALBO per-locale pliki (`crew-guide.pl.ts` / `crew-guide.en.ts` wybierane po `params.lang`). (b) `en.po` ma niemal wszystkie `msgstr` puste — EN treściowo nie istnieje; uruchomienie = realna praca tłumaczeniowa, nie tylko technika. *(wykryte 07-12 przy copy landing)*

## ❓ Open questions

- **A7d regulamin rejsu** — progi 180/90/42/0 potwierdzone (§3.8); dokument dostarczony 07-07. Czy coś jeszcze otwarte? Zweryfikować.
- **Faktury KSeF:** (a) zagraniczni nabywcy przez KSeF czy poza; (b) termin obowiązku Michała wg obrotu; (c) cert typ 1 od Michała.

## 📥 Feedback — status przetworzenia

> Diff: `ls docs/feedback/` vs ta lista. Każdy plik nieoznaczony ✅ → striażuj do backlogu i dopisz tu. Chroni przed zgubieniem nowego feedbacku.

- ✅ `2026-06-19-uwagi-do-strony.docx` — striażowany 07-10 → „Landing Michała 06-19" (22 poz.)
- ✅ `2026-07-05.md` — striażowany 07-10 → BUG-2, BUG-3, UI-1 (3 poz.)
- ✅ `2026-07-07.md` — striażowany 07-10 → FEAT-5..9, LEGAL-1..2, UI-2..3 (10 poz.)
- ✅ `2026_07_07_SA_regulamin_rejsu.doc` — źródło regulaminu, skonsumowany 07-07 → ADR-002 / refund policy §3.8 (progi 180/90/42/0)
- ✅ `2026-07-10.md` — striażowany 07-10 → wzbogacił FEAT-5 (belka zapowiedzi + menu między rejsami + współistnienie wyprzedany/nowy)

## ✅ Rozwiązane niedawno (żeby nie wracały)

- ~~Panel żeglarza pokazywał zły/wygasły booking~~ — 07-05 (`bookingByUser` lista + filtr `confirmed`).
- ~~Panel żeglarza: tylko jedna koja mimo wielu~~ — 07-05 (selektor rejsu).
- ~~PDF potwierdzenia font poza bundlem~~ — 07-07 (`?url` + `read()`).
- ~~Refund webhook race → podwójny refund~~ — 07-07 (match po `refundRowId`).
- ~~Refund policy retroaktywny~~ — 07-09 (snapshot przy zakupie, ADR-002) — **czeka deploy DEP-1**.
- ~~Audit log brak UI~~ — 07-10 (`/admin/audit` MVP) — **czeka deploy DEP-1**.
