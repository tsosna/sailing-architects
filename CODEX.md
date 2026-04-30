# Codex workflow — sailing-architects

Codex nie ma lifecycle hooków Claude Code (`SessionStart`, `PreCompact`, `SessionEnd`). Ten projekt używa więc jawnego bootstrapu, który zbiera ten sam kontekst do jednego pliku startowego.

## Start sesji

W katalogu projektu uruchom:

```bash
pnpm codex:start
```

Skrypt:

- czyta `.claude/settings.json`, żeby pokazać aktywne hooki Claude Code
- czyta `CLAUDE.md` jako zasady myślenia i zamykania sesji
- czyta `AGENTS.md` jako instrukcje projektu dla Codexa
- czyta `docs/handoff.md` i wybiera ostatnie wpisy sesji
- czyta `knowledge-vault/wiki/index.md`
- czyta najnowsze dzienne logi z `claude-memory-compiler/daily/`
- zapisuje wynik do `docs/codex-session-context.md`
- drukuje krótki raport, który można wkleić do panelu Codex, jeśli panel nie załadował pliku sam

W panelu Codex traktuj `docs/codex-session-context.md` jako odpowiednik kontekstu startowego Claude Code.

## Praca w sesji

1. Najpierw stosuj `AGENTS.md`.
2. Jeśli zadanie dotyczy znanego wzorca, sprawdź indeks wiki z `docs/codex-session-context.md`.
3. Jeśli indeks wskazuje pasujący artykuł, przeczytaj pełny plik z `knowledge-vault/wiki/`.
4. Po zmianach w kodzie uruchom `pnpm check` i `pnpm lint`.

## Zamknięcie sesji

Gdy użytkownik napisze `close session`, wykonaj procedurę z `CLAUDE.md`:

1. Przeczytaj `docs/handoff.md`.
2. Wygeneruj wpis sesji w opisanym tam formacie.
3. Zapytaj o wolne myśli lub obserwacje.
4. Oceń, które wnioski nadają się do promocji do `knowledge-vault/wiki/`.
5. Dopisz wpis do `docs/handoff.md`.

Jeśli sesja Codex ma też trafić do dziennego logu Claude memory compiler, dopisz krótkie podsumowanie do właściwego pliku w:

```bash
pnpm codex:stop -- \
	--title "Krótki tytuł" \
	--context "Co robiliśmy w sesji" \
	--key "Najważniejsza zmiana" \
	--decision "Decyzja techniczna" \
	--lesson "Wniosek lub gotcha" \
	--action "Następny krok"
```

`pnpm codex:compact` jest aliasem do tego samego skryptu. Używaj go przed ręcznym kompaktowaniem długiej rozmowy, żeby nie zgubić stanu pracy.

Skrypt dopisuje wpis do:

- `/Volumes/HomeX-MacMini/tomeksosinskiminiEx/Workspace/claude-memory-compiler/daily/YYYY-MM-DD.md`
- `docs/handoff.md`
