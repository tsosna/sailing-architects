# ADR-014: Logowanie dopiero po intencji rezerwacji

- **Status:** przyjęta
- **Data:** 2026-04-29
- **Obszar:** rezerwacje | auth | UX

## Kontekst

Strona publiczna prowadzi użytkownika przez wybór rejsu i koi. Zbyt wczesne logowanie mogłoby przerwać eksplorację oferty i obniżyć konwersję.

## Decyzja

Logowanie pojawia się dopiero po wyrażeniu intencji rezerwacji, czyli po wyborze segmentu i koi. Samo wejście na `/book` bez wybranych koi nie wymusza logowania. Wyjątkiem jest `Panel`, gdzie intencją użytkownika jest wejście do konta.

## Uzasadnienie

Użytkownik powinien najpierw zobaczyć ofertę i wybrać konkretną koję. Auth jest potrzebny do rezerwacji i panelu, nie do oglądania procesu wyboru.

## Konsekwencje

URL `/book` działa jako kontrakt wejścia: sam `segment` oznacza wybór koi, a `segment + berths` prowadzi do flow logowania/rezerwacji. Stan wyboru bookingu musi być dostępny dla elementów strony, które pokazują intencję rezerwacji.

## Źródła

- `docs/handoff.md:1523` — sesja 2026-04-29, auth dopiero po intencji rezerwacji.
- `docs/handoff.md:1523` — URL jako kontrakt wejścia do `/book`.
- `knowledge-vault/wiki/concepts/clerk-auth-intent-gated-booking.md` — wzorzec intent-gated auth.
