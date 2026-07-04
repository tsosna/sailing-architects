# ADR-005: Zwolnienie koi przy refundzie jest decyzją admina

- **Status:** przyjęta
- **Data:** 2026-06-28
- **Obszar:** refundy | koje

## Kontekst

Refund nie zawsze oznacza, że uczestnik przestaje płynąć. System musiał rozstrzygnąć, czy koja ma wracać do sprzedaży automatycznie na podstawie kwoty refundu, czy ma to być jawna decyzja operatora.

## Decyzja

Formularz refundu ma checkbox `releaseBerth`. Admin decyduje, czy zwolnić koję przy danym refundzie. System nie podejmuje tej decyzji automatycznie na podstawie refund amount.

## Uzasadnienie

To operator zna kontekst operacyjny: częściowy zwrot może być korektą ceny, gestem handlowym albo zmianą ustaleń bez zwalniania miejsca. Automatyczne zwalnianie koi według kwoty mogłoby sprzedać miejsce, które nadal należy do klienta.

## Konsekwencje

`refunds.releaseBerth` zapisuje decyzję admina, a `berthReleasedAt` zapisuje wykonanie zwolnienia. Booking z pełnym refundem, ale bez zwolnienia koi, pozostaje żywy operacyjnie.

## Źródła

- `docs/handoff.md:284` — sesja 2026-06-28, checkbox `releaseBerth` zamiast auto-decyzji.
- `src/convex/schema.ts:296` — `refunds.releaseBerth`.
- `src/convex/schema.ts:297` — `refunds.berthReleasedAt`.
- `src/convex/mutations.ts:1404` — warunkowe zwolnienie koi po refundzie.
