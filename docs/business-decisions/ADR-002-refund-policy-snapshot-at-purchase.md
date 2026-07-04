# ADR-002: Polityka zwrotów snapshotowana przy zakupie

- **Status:** do potwierdzenia przez Michała
- **Data:** 2026-07-03
- **Obszar:** refundy

## Kontekst

Obecna kalkulacja refundu czyta aktywną, żywą politykę zwrotów. Booking nie zapisuje polityki obowiązującej w chwili zakupu. To tworzy ryzyko prawne: klient mógł kupić rejs przy łagodniejszej polityce, a późniejsza zmiana w panelu admina mogłaby obniżyć jego zwrot.

## Decyzja

Wybrano kierunek: booking powinien snapshotować politykę zwrotów przy zakupie. Refund ma być liczony według warunków obowiązujących w chwili zawarcia umowy, nie według aktualnie aktywnej polityki.

Decyzja wymaga potwierdzenia przez Michała przed implementacją.

## Uzasadnienie

Uzasadnienie biznesowo-prawne: konsument podlega regulaminowi z chwili zawarcia umowy. Snapshot chroni historię umowy tak samo, jak snapshot harmonogramu rat chroni kwoty zaakceptowane przy zakupie.

Odrzucony kierunek to liczenie według żywej polityki, bo zmiana polityki przez admina mogłaby działać retroaktywnie na stare bookingi.

## Konsekwencje

Trzeba dodać snapshot polityki do bookingu albo wskazanie na niezmienną wersję polityki. Checkout ma zapisać aktualną politykę przy utworzeniu rezerwacji, a refund calc ma czytać snapshot z bookingu.

`refunds.policySnapshot` pozostaje zapisem forensic po fakcie. Nie wystarcza jako ochrona klienta, bo jest tworzony dopiero przy inicjowaniu refundu.

## Źródła

- `docs/handoff.md:38` — otwarty problem „Refund policy — snapshot vs reference”.
- `docs/handoff.md:144` — sesja 2026-07-03, wybór opcji A.
- `src/convex/refunds.ts:37` — obecny lookup aktywnej polityki.
- `src/convex/schema.ts:286` — `refunds.policySnapshot` jako snapshot po fakcie.
- `knowledge-vault/wiki/concepts/refund-policy-retroactivity.md` — opis ryzyka retroaktywności.
- `knowledge-vault/wiki/concepts/snapshot-vs-reference-in-storage.md` — ogólny wzorzec snapshot vs reference.
