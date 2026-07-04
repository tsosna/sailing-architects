# ADR-013: Dane załogi potwierdzane przez link tokenowy

- **Status:** przyjęta
- **Data:** 2026-05-02
- **Obszar:** dane załogi | bezpieczeństwo

## Kontekst

Uczestnik rejsu może nie mieć konta w aplikacji, ale musi potwierdzić lub poprawić dane wpisane przez admina. System potrzebował przepływu bez wymuszania rejestracji każdego uczestnika.

## Decyzja

Uczestnik potwierdza dane przez bezpieczny link tokenowy. Token może być otwierany wielokrotnie do podglądu, ale zostaje zużyty dopiero po akcji potwierdzenia lub korekty.

## Uzasadnienie

Link tokenowy obniża tarcie dla uczestników i pozwala zebrać formalne potwierdzenie danych bez tworzenia kont. Zużycie tokenu dopiero po akcji pozwala uczestnikowi wrócić do linku przed wysłaniem odpowiedzi.

## Konsekwencje

System przechowuje tokeny w tabeli `crewConfirmationTokens` z datą wygaśnięcia i `usedAt`. Publiczny flow musi walidować token przy użyciu i obsługiwać statusy: nieprawidłowy, wygasły, potwierdzony, korekta.

## Źródła

- `docs/handoff.md:1902` — sesja 2026-05-02, token użyty dopiero po akcji.
- `src/convex/schema.ts:207` — tabela `crewConfirmationTokens`.
- `src/convex/schema.ts:162` — statusy potwierdzenia uczestnika.
- `knowledge-vault/wiki/concepts/crew-confirmation-token-flow.md` — opis przepływu tokenowego.
