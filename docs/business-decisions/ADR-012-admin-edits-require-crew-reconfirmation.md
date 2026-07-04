# ADR-012: Edycja danych przez admina wymaga ponownego potwierdzenia

- **Status:** przyjęta
- **Data:** 2026-05-02
- **Obszar:** dane załogi

## Kontekst

Admin może uzupełniać lub poprawiać dane uczestnika na podstawie telefonu, WhatsAppa albo e-maila. Uczestnik powinien wiedzieć, że dane zapisane w systemie są tymi, które akceptuje.

## Decyzja

Edycja danych uczestnika przez admina cofa status potwierdzenia do `drafted_by_admin`, gdy dane są kompletne. Jeśli uczestnik wcześniej potwierdził dane, zmiana admina wymaga ponownej akceptacji przez uczestnika.

## Uzasadnienie

Dane załogi mają znaczenie operacyjne i formalne. Admin może przepisać je z rozmowy, ale uczestnik musi zatwierdzić finalną wersję albo zgłosić korektę.

## Konsekwencje

Panel admina musi traktować `dataStatus` i `confirmationStatus` jako dwie różne warstwy: kompletność danych nie oznacza ich potwierdzenia. Link potwierdzający powinien być wysłany po przygotowaniu draftu.

## Źródła

- `docs/handoff.md:1902` — sesja 2026-05-02, admin edit cofa `confirmed` do `drafted_by_admin`.
- `src/convex/schema.ts:154` — `dataStatus`.
- `src/convex/schema.ts:159` — komentarz o niezależności `dataStatus` i `confirmationStatus`.
- `src/convex/mutations.ts:832` — komentarz mutacji admin edit.
- `src/convex/mutations.ts:872` — logika przejścia statusu potwierdzenia.
