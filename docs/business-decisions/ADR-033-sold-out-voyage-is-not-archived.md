# ADR-033: Rejs z kompletem załogi jest stanem osobnym od archiwum

- **Status:** przyjęta
- **Data:** 2026-11-16
- **Obszar:** sprzedaż | cykl życia rejsu | treść strony

## Kontekst

Sail Adventure 2026 zakończył się w listopadzie 2026. Jednocześnie w planach są kolejne rejsy (Seszele maj 2027, Francja, Grecja), więc strona przestaje być monografią jednego rejsu i musi pokazywać kilka rejsów w różnych momentach życia.

Pytanie wyjściowe Tomka brzmiało: rejs, który **się zakończył lub któremu skończyły się miejsca**, staje się archiwalny z relacją, zdjęciami i filmami. Oba przypadki wyglądają z zewnątrz tak samo — nie da się kupić koi.

## Decyzja

**Rejs ma pięć stanów: zapowiedź → w sprzedaży → komplet załogi → w trakcie → archiwum.** Archiwum powstaje wyłącznie po **dacie zakończenia** rejsu. Wyczerpanie miejsc nie archiwizuje rejsu.

Rejs z kompletem załogi zachowuje pełną stronę sprzedażową — trasę, program, plan kajutowy, poradnik — a zamiast przycisku zakupu dostaje zapis na listę rezerwową (ADR-034) i odesłanie do rejsów w sprzedaży.

## Uzasadnienie

Zlanie obu stanów w jeden kasuje cztery rzeczy naraz:

1. **Żywe zobowiązania.** Rejs z kompletem załogi ma uczestników, którzy nadal płacą raty i wchodzą na stronę po informacje operacyjne. Oznaczenie go jako archiwalnego odbiera im te treści na pół roku przed wypłynięciem.
2. **Powrót miejsc do puli.** Rezygnacja, zwrot albo wygasła blokada zwalniają koję — rejs wraca do sprzedaży. Gdyby komplet załogi był stanem końcowym, powrót wyglądałby jak błąd systemu. Mechanizm zwalniania koi jest w tym projekcie realny i udokumentowany (ADR-005, ADR-006, ADR-031).
3. **Brak materiału.** Archiwum stoi na relacji z tego, co się wydarzyło. Rejs, który dopiero popłynie, nie ma czego pokazać — strona „archiwalna” bez materiałów wygląda na zepsutą.
4. **Utrata sygnału popytu.** „Brak miejsc + lista rezerwowa” jest informacją działającą na korzyść kolejnych rejsów. „Archiwalny” nie niesie jej wcale.

Stan **„w trakcie”** (rejs trwa) wydzielono osobno, bo też nie ma ani sprzedaży, ani relacji, a przy rejsie 41-dniowym trwa półtora miesiąca.

## Konsekwencje

- Zestaw sekcji strony rejsu zależy od stanu; projekt wymaga jawnej mapy „sekcja → stan”, a nie jednego szablonu z ukrywaniem przycisku.
- Rejs potrafi wrócić ze stanu „komplet załogi” do „w sprzedaży” bez zmiany charakteru strony i bez interwencji w treść.
- Przejście do archiwum wyzwala **data zakończenia**, nie decyzja o wyczerpaniu miejsc. Rejs zakończony bez wgranych materiałów ma własny, zaprojektowany stan pusty („relacja w przygotowaniu”).
- Nazewnictwo pozostaje zgodne z ADR-021 i ADR-024: „Brak miejsc”, nie „Wyprzedane”.

## Powiązania

- FEAT-5, FEAT-14 (backlog), prompt projektowy `docs/design/landing-archive-and-multi-voyage-design-prompt.md`
- ADR-034 — lista rezerwowa, główne CTA stanu „komplet załogi”
- ADR-035 — archiwum publiczne
- ADR-018 — komunikaty o dostępności wynikają z danych
- ADR-031, ADR-005, ADR-006 — mechanizmy zwalniające koję z powrotem do puli
- Wiki: `sold-out-is-not-finished` (universal)
