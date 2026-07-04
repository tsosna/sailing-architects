# ADR-011: Kupujący jest oddzielony od uczestników rejsu

- **Status:** przyjęta
- **Data:** 2026-05-01
- **Obszar:** dane załogi | rezerwacje

## Kontekst

Osoba płacąca za rejs nie zawsze jest wszystkimi uczestnikami. Wymaganie kompletu danych załogi przed płatnością zwiększałoby tarcie checkoutu i blokowało zakup dla rodzin lub grup.

## Decyzja

Booking zapisuje kupującego (`buyerUserId`, `buyerEmail`), a uczestnicy rejsu są osobnymi rekordami `bookingParticipants`, po jednym na koję. Dane uczestników mogą być uzupełnione po płatności.

Legacy `crewProfiles` może służyć jako prefill, ale nie jest kanonicznym rekordem uczestnictwa w konkretnym rejsie.

## Uzasadnienie

Checkout ma być szybki: wybór koi, konto, e-mail kupującego i płatność. Dane paszportowe, zdrowotne i żeglarskie mogą być zebrane później, bo dotyczą osób płynących, niekoniecznie kupującego.

## Konsekwencje

Nowe bookingi tworzą `bookingParticipants` w stanie `missing`. Sales Board i KPI danych załogi muszą patrzeć na uczestników powiązanych z żywymi bookingami, a nie zakładać relacji jeden user = jeden żeglarz.

## Źródła

- `docs/handoff.md:1605` — sesja 2026-05-01, uczestnicy i płatności ratalne.
- `docs/handoff.md:1772` — legacy `crewProfiles` ukryte z UI dashboardu, ale używane do prefill.
- `src/convex/schema.ts:66` — `bookings`.
- `src/convex/schema.ts:148` — `bookingParticipants`.
- `src/convex/mutations.ts:517` — tworzenie uczestników przy bookingu.
- `knowledge-vault/wiki/concepts/booking-participants-buyer-crew-split.md` — opis wzorca.
