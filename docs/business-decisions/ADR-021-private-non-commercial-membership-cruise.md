# ADR-021: Forma prawna rejsu — prywatny, niekomercyjny, składkowy

- **Status:** przyjęta (część konsekwencji jeszcze niezrealizowana — patrz Konsekwencje)
- **Data:** 2026-08-10 (decyzja Michała), spisana 2026-08-13
- **Obszar:** prawo / marketing / treść strony

## Kontekst

Do 08-10 strona i wewnętrzna dokumentacja projektu traktowały rejsy jako produkt komercyjny: „cena", „boutique sailing trips", „przejdź do płatności", sprzedaż miejsc. Michał, odpowiadając na pytania o dane organizatora (kto formalnie sprzedaje rejs, jakie ma uprawnienia), rozstrzygnął sprawę u źródła zamiast odpowiadać punkt po punkcie na pytania zakładające model komercyjny.

## Decyzja

Oficjalna forma prawna rejsu to **prywatny rejs niekomercyjny składkowy** — nie działalność gospodarcza sprzedająca miejsca na wycieczkę, tylko prywatna inicjatywa finansowana składkami uczestników. Konsekwentnie:

- Na stronie **nie publikuje się** nazwy firmy ani danych rejestrowych. Widoczny kontakt to wyłącznie: e-mail, telefon, osoba kontaktowa „Michał Smolarski".
- Język strony ma unikać słownictwa komercyjnego: „cena" → „składka", „cena za miejsce" → „Składka za osobę", „przejdź do płatności" → „Opłać składkę", „wyprzedane" → „brak miejsc", „boutique" → „private". Nowy slogan hero: *„Zapraszamy do załogi na nasz prywatny rejs towarzysko szkoleniowy"*.
- Regulamin i umowa uczestnika (`docs/business-decisions/2026_08_09_SA_regulamin_rejsu_v2.doc`, `docs/assets/2026_08_sailing_architects_UMOWA UCZESTNIK_składkowy.odt`) są pisane w tym samym duchu — rejs składkowy, nie usługa turystyczna sprzedawana klientowi.

## Uzasadnienie

Decyzja Michała, motywacja prawna — nie podana wprost w treści feedbacku 08-10, tylko rozstrzygnięcie. Prawdopodobny kierunek: reżim prawny organizatora turystyki (licencje, ubezpieczenia, obowiązki wobec klienta-konsumenta) jest inny dla działalności komercyjnej niż dla prywatnej inicjatywy finansowanej składkami — ale to przypuszczenie Claude, nie potwierdzone zdanie Michała. Do weryfikacji, jeśli kiedyś zapyta ktoś spoza projektu „dlaczego".

## Konsekwencje

- **Zrealizowane 08-13:** progi zwrotu ujednolicone i zapisane w regulaminie w dniach (ADR-001, uzupełnienie 08-13) — pośrednio wywołane tą samą falą porządkowania dokumentów.
- **Zrealizowane 2026-08-15:** zmiana słownictwa (**UI-17**) — commity `9b0c106c` i `13f9ed61`. Objęła landing, kasę, panel uczestnika, poradnik i PDF potwierdzenia. Przy realizacji wyszła kolizja dwóch znaczeń słowa „składka" → **ADR-024**. Trzy elementy czekają na potwierdzenie Michała: pozycja sloganu w hero, łącznik w „towarzysko-szkoleniowy" i przeniesienie „Jesień 2026" z górnej linii do linii z trasą.
- **Zrealizowane 2026-08-13:** publikacja regulaminu (**LEGAL-6**, punkty 1-2).
- **Niezrealizowane, w backlogu:** checkbox akceptacji regulaminu + umowy uczestnika przy checkout (**LEGAL-9**).
- **Otwarte, blokuje decyzję prawną:** czy forma „niekomercyjna" zwalnia z numeru uprawnień organizatora turystyki (**LEGAL-7**, punkt c) — pytanie do prawnika Michała, nie do zespołu technicznego. Ta ADR nie rozstrzyga tego pytania, tylko odnotowuje że od niej zależy odpowiedź.
- **Ryzyko do świadomości, nie do natychmiastowego działania:** nazwanie czegoś „niekomercyjnym" w treści strony nie zmienia automatycznie stanu prawnego, jeśli realia (płatność za miejsce, świadczenie usługi za wynagrodzenie) wskazują na działalność komercyjną. Ostateczna ocena należy do prawnika Michała, nie do tego dokumentu.

## Źródła

- `docs/feedback/2026-08-10.md` — odpowiedź Michała, punkt „Oficjalna forma rejsu to prywatny rejs niekomercyjny składkowy" + decyzje o słownictwie.
- `docs/backlog.md` — **LEGAL-7** (dopisek 08-10), **UI-17**, **LEGAL-9**.
