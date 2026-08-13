# ADR-023 — Regulamin publikowany jako wersjonowany plik; dowodem akceptacji jest identyfikator wersji

**Data:** 2026-08-13
**Status:** przyjęta
**Obszar:** dokumenty prawne / zgody klienta / publikacja treści
**Powiązane:** [ADR-002](ADR-002-refund-policy-snapshot-at-purchase.md), [ADR-021](ADR-021-private-non-commercial-membership-cruise.md), [ADR-001](ADR-001-refund-tiers.md)

## Kontekst

Regulamin rejsu istniał wyłącznie jako plik Worda w repozytorium (`docs/business-decisions/`). Żeglarz nie miał do niego dostępu: brak trasy, brak pliku publicznego, brak odnośnika w stopce. Panel żeglarza do 2026-07-31 obiecywał go na liście dokumentów do pobrania — obietnica bez pokrycia, w kontekście prawnym, na produkcji (LEGAL-6 p.3).

Od 2026-08-13 Stripe działa w trybie live, czyli przyjmowane są realne pieniądze. Przed nami **LEGAL-9**: checkbox „zapoznałem się i akceptuję regulamin" w kasie oraz umowa uczestnika.

Pytanie do rozstrzygnięcia nie brzmiało „gdzie wrzucić plik", tylko: **co system ma umieć udowodnić, gdy klient za rok zakwestionuje warunki, na które się zgodził.**

## Decyzja

**Regulamin publikujemy jako wersjonowany plik pod publicznym adresem. Dowodem akceptacji będzie identyfikator wersji, nie treść i nie sam fakt zgody.**

1. **Postać publikacji:** plik w katalogu statycznym, nie trasa renderująca treść z kodu.
2. **Zasada nazywania:** nazwa niesie temat, język i datę wersji — `regulamin-pl-2026-08-09.pdf`.
3. **Nowa wersja = nowy plik.** Opublikowanego pliku nie edytujemy; poprzednie wersje zostają osiągalne.
4. **Zapis zgody (LEGAL-9):** rezerwacja przechowuje **identyfikator wersji**, nie kopię treści i nie samo `true`.
5. **Język wiążący:** dziś publikujemy wyłącznie wersję polską. Czy i na jakich zasadach wiąże wersja angielska, rozstrzyga Michał ze swoim prawnikiem — pozycja **LEGAL-10**, nie decyzja tego ADR.

Rozważone i odrzucone warianty:

- **Trasa `/regulamin` z treścią w kodzie.** Odrzucona: adres pozostaje ten sam, a tekst zmienia się wraz z wdrożeniem. Aplikacja nie ma uchwytu do wersji poprzedniej, a nic nie wymusza podbicia identyfikatora przy zmianie treści — reguła istniałaby wyłącznie w pamięci osoby edytującej. Wariant wygrywa czytelnością na telefonie i indeksowaniem; przegrywa na jedynym kryterium, które w tym zadaniu jest rozstrzygające.
- **Zapis całej treści regulaminu przy każdej rezerwacji.** Odrzucony: 13,7 tys. znaków w każdym wierszu, przy dokumencie identycznym dla wszystkich kupujących z danego okresu.
- **Zapis samego faktu zgody (`true` + data).** Odrzucony: nie pozwala pokazać klientowi tekstu, na który się zgodził, więc nie jest dowodem, tylko śladem.

## Uzasadnienie

- **Ta sama zasada, co przy ADR-002.** Snapshot polityki zwrotów przy zakupie chroni rezerwację przed późniejszą zmianą progów. Regulamin to ten sam problem w większej skali: późniejsza wersja nie może zmieniać warunków, na których sprzedano wcześniejszą rezerwację. Różnica jest wyłącznie w rozmiarze danych — stąd odwołanie do wersji zamiast kopii.
- **Identyfikator wersji ma sens tylko z regułą nazywania.** Bez niej jest napisem, którego nikt nie gwarantuje. Reguła i identyfikator to jedna decyzja, nie dwie.
- **Kryterium wyboru formy było prawne, nie estetyczne.** Pytanie „czy z tego zapisu da się odtworzyć tekst, na który klient się zgodził" rozstrzyga między trasą a plikiem jednoznacznie. Kryteria czytelności i SEO są realne, ale wtórne wobec dowodu.
- **Nierówny koszt pomyłki.** Gorsza czytelność PDF-u na telefonie to niedogodność. Niemożność wykazania treści zaakceptowanego dokumentu to spór, w którym nie mamy czym argumentować.

## Konsekwencje

- Regulamin dostępny publicznie: `static/regulamin-pl-2026-08-09.pdf`, odnośnik w stopce z otwarciem w nowej karcie (commit `c0d01f2f`, na produkcji 2026-08-13). LEGAL-6 punkty (1) i (2) zamknięte.
- **Poprawka treści regulaminu nie jest edycją opublikowanego pliku.** Każda zmiana wymaga nowego pliku, przepięcia odnośnika i — po wdrożeniu LEGAL-9 — nowego identyfikatora wersji. Dotyczy to również pierwszego znanego błędu w treści (nieprawidłowy URL, LEGAL-6 p.5). **Wyjątek dopuszczalny wyłącznie do czasu wdrożenia checkboxa:** dopóki żaden klient nie zaakceptował dokumentu, nie istnieje dowód akceptacji do ochrony i podmiana pliku pod tą samą nazwą jest obroniona. Po LEGAL-9 wyjątek znika.
- **Suma kontrolna nie jest częścią tej decyzji, ale jest jej naturalnym rozwinięciem.** Nazwa pliku to obietnica człowieka; hash treści to fakt policzony z bajtów i pozwala **aplikacji** wykryć podmianę. Kierunek zapisany przy LEGAL-9. Zastrzeżenie: hash wykrywa podmianę, nie zapobiega jej, więc uzupełnia zasadę nazywania, a nie zastępuje.
- **Jaki poziom dowodu jest wymagany prawnie, pozostaje pytaniem do prawnika Michała** — ta sama lista co numer uprawnień organizatora (ADR-021, LEGAL-7 c). Tu rozstrzygnięto wyłącznie, co system **potrafi** udowodnić, nie ile udowodnić **musi**.
- Umowa uczestnika (`docs/assets/2026_08_sailing_architects_UMOWA UCZESTNIK_składkowy.odt`) pójdzie tą samą drogą — publikacja, wersjonowanie, identyfikator w zapisie zgody.
- Odnośnik w stopce nie pokrywa kasy: stopka renderuje się na landingu i w poradniku, nie na `/book`. Odnośnik przy checkboxie jest osobnym zadaniem (LEGAL-9) i musi otwierać nową kartę, żeby klik w regulamin nie kosztował wybranych koi i wypełnionych danych załogi.
