# ADR-024: Dwie składki mają własne nazwy — rejsowa i pokładowa

- **Status:** przyjęta (do potwierdzenia przez Michała — nazwa „składka rejsowa" jest naszym dopowiedzeniem do jego „składki")
- **Data:** 2026-08-15
- **Obszar:** treść produktu / komunikacja z uczestnikiem / dokumenty

## Kontekst

ADR-021 nakazał zastąpić „cenę" „składką" na stronie. Przy realizacji (UI-17) okazało się, że słowo „składka" **już było używane w produkcie w innym znaczeniu**: „składka pokładowa" to kasa zbierana od załogi na miejscu, na jedzenie, paliwo i opłaty portowe (150-200 EUR/os na 7 dni) — poradnik, `crew-guide.ts`, pytanie q24.

Po mechanicznej zamianie oba znaczenia stawały obok siebie w jednym zdaniu:

> „Poza składką: dojazd, wyżywienie, paliwo i opłaty portowe (składka pokładowa ok. 150-200 EUR/os)…"

To samo zderzenie występuje na landingu: nagłówek listy wykluczeń stoi bezpośrednio nad pozycją „Opłaty portowe i paliwo (~150-200 EUR/os)", czyli nad opisem składki pokładowej bez jej nazwy.

## Decyzja

Obie składki mają w komunikacji z uczestnikiem **własną, pełną nazwę**:

- **Składka rejsowa** — to, co uczestnik wpłaca przez system (dawna „cena rejsu”, rozbita na wpłatę początkową i raty).
- **Składka pokładowa** — gotówka zbierana od załogi na miejscu; nazwa i zakres bez zmian.

Zasada stosowania: **pełna nazwa tam, gdzie obie mogą się pomylić; forma skrócona tam, gdzie kontekst je rozróżnia.** Krótkie etykiety przy kwocie („Składki" w menu, „Składka" nad kwotą etapu, „Składka za osobę" w podsumowaniu rezerwacji) zostają bez przymiotnika — kwota stoi obok i nie ma z czym mylić.

## Uzasadnienie

Rozważony wariant odrzucony: zostawić samo „składka" dla głównej opłaty i liczyć, że przymiotnik „pokładowa" wystarczy do odróżnienia drugiej. Odrzucony, bo w dwóch miejscach (poradnik q23, lista wykluczeń na landingu) obie występują w jednym zdaniu — wtedy „składka" bez przymiotnika czyta się jako nazwa własna nadrzędna, a „składka pokładowa" jako jej odmiana. To odwrotność stanu faktycznego: to dwie różne opłaty, płacone w różnych momentach, różnymi kanałami, o różnym statusie (jedna przez Stripe do organizatora, druga gotówką między załogą, z rozliczeniem nadwyżki po rejsie).

Ryzyko jest finansowe, nie stylistyczne: uczestnik, który uzna, że 150-200 EUR jest częścią wpłaty przez system, dowie się o dodatkowym koszcie dopiero na jachcie.

## Konsekwencje

- Teksty na landingu, w kasie, w panelu uczestnika, w poradniku i w PDF potwierdzenia używają tej terminologii od commita `9b0c106c` (2026-08-15).
- **Dokumenty prawne nie zostały zsynchronizowane.** Regulamin v2 i umowa uczestnika powstawały przed tym rozróżnieniem — do sprawdzenia, czy używają słowa „składka" w sposób zgodny z tym podziałem. Pozycja: LEGAL-11.
- Maile nie wymagały zmian: nie używają słowa „cena" ani „składka", tylko „wpłata" i „rata".
- Panel administracyjny celowo poza zakresem — narzędzie wewnętrzne, nie komunikacja z uczestnikiem.

## Źródła

- ADR-021 — forma prawna rejsu (źródło nakazu „cena" → „składka").
- `docs/backlog.md` — UI-17, LEGAL-11.
- Commit `9b0c106c`, sesja 2026-08-15.
