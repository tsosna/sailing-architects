# sailing-architects — instrukcje dla Claude

> **Na początku każdej sesji przeczytaj `AGENTS.md`** — zawiera stack projektu, decyzje architektoniczne i konwencje. Bez tego możesz naruszyć ustalone wzorce.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Przed implementacją:
- Sformułuj założenia wprost. Jeśli niepewny — zapytaj.
- Jeśli istnieje wiele interpretacji — przedstaw je, nie wybieraj w ciszy.
- Jeśli prostsze rozwiązanie istnieje — powiedz o tym.
- Jeśli coś jest niejasne — zatrzymaj się, nazwij problem, zapytaj.

## 2. Simplicity First

**Minimum kodu który rozwiązuje problem. Nic spekulatywnego.**

- Żadnych funkcji poza tym o co poproszono.
- Żadnych abstrakcji dla kodu jednorazowego użytku.
- Żadnej „elastyczności" której nie wymagano.
- Żadnej obsługi błędów dla scenariuszy niemożliwych.
- Jeśli piszesz 200 linii a wystarczy 50 — przepisz.

## 3. Surgical Changes

**Dotykaj tylko tego co musisz. Sprzątaj tylko własny bałagan.**

- Nie „poprawiaj" sąsiedniego kodu, komentarzy ani formatowania.
- Nie refaktoryzuj rzeczy które nie są zepsute.
- Dopasuj istniejący styl, nawet jeśli zrobiłbyś to inaczej.
- Jeśli zauważysz martwy kod — wspomnij, nie usuwaj.

Każda zmieniona linia musi wynikać wprost z prośby użytkownika.

## 4. Goal-Driven Execution

**Zdefiniuj kryteria sukcesu. Weryfikuj po każdym kroku.**

Dla zadań wieloetapowych podaj krótki plan:
```
1. [Krok] → weryfikacja: [check]
2. [Krok] → weryfikacja: [check]
```

---

## 5. Baza wiedzy

Na początku każdej sesji hook automatycznie wstrzykuje `knowledge-vault/wiki/index.md` jako kontekst.
Indeks jest już dostępny — nie czytaj go ponownie.

### Sprawdź indeks przed kodowaniem

**Zanim napiszesz nowy kod lub zaproponujesz rozwiązanie:**

1. Przejrzyj wstrzyknięty indeks (`## Knowledge Base Index` w kontekście sesji)
2. Jeśli istnieje artykuł pasujący do bieżącego zadania — przeczytaj go w całości przed odpowiedzią
3. Jeśli nie istnieje pasujący artykuł — rozwiąż problem normalnie

Czytaj artykuł gdy zadanie dotyczy:
- komponentu, wzorca lub mechanizmu który już był wcześniej omawiany
- problemu architektonicznego (routing, state, API, struktura folderów)
- narzędzia lub biblioteki wymienionej w indeksie
- błędu lub gotchy który mógł już zostać opisany

### Ścieżki

- Baza wiedzy: `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/knowledge-vault/wiki/`
- Dzienne logi sesji: `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/claude-memory-compiler/daily/`
- Notatki operacyjne: `docs/handoff.md`

---

## 6. Zamknięcie sesji

Gdy użytkownik napisze `close session`:

1. **Przeczytaj `docs/handoff.md`** — zapoznaj się z ostatnimi wpisami
2. **Wygeneruj nowy wpis** w formacie:

```markdown
## Sesja YYYY-MM-DD HH:MM — [krótki tytuł]

### Zmiany
- Co zostało zaimplementowane (konkretne pliki/komponenty)

### Decyzje
- Świadome wybory techniczne z uzasadnieniem

### Wnioski
- Gotchas, nieoczywiste zachowania, rzeczy które warto pamiętać

### Następne kroki
#### Next
- Konkretne zadania do zrobienia w następnej sesji

#### Blocked / Later / Open questions
```

3. **Zapytaj użytkownika**: "Czy masz wolne myśli, obserwacje lub coś do dopisania?"
4. **Oceń Wnioski**: jeśli wniosek to ponadprojektowy wzorzec — zaproponuj przeniesienie do `knowledge-vault/wiki/`
5. **Dopisz wpis** do `docs/handoff.md`
