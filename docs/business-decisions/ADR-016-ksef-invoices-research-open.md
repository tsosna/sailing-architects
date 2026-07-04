# ADR-016: Faktury i KSeF jako osobny moduł

- **Status:** do potwierdzenia przez Michała
- **Data:** 2026-07-03
- **Obszar:** faktury | KSeF | płatności

## Kontekst

Klienci biznesowi mogą wymagać faktury. Dla polskich podatników VAT dochodzi KSeF, a system musi uwzględnić dane sprzedawcy, dane nabywcy, kraj nabywcy oraz terminy obowiązków.

## Decyzja

Faktury i KSeF nie są częścią bieżącego flow booking/refund. To osobny moduł researchowo-produktowy do potwierdzenia z Michałem.

Otwarte decyzje obejmują: dane firmy Michała, obsługę nabywców zagranicznych, obowiązek i termin KSeF dla Michała oraz dostarczenie certyfikatu KSeF typ 1.

## Uzasadnienie

Moduł ma konsekwencje prawne i księgowe, a nie tylko techniczne. Implementowanie go bez danych sprzedawcy, certyfikatu i decyzji o zagranicznych nabywcach groziłoby błędnym zakresem.

## Konsekwencje

Architektura wstępnie wskazuje Convex action jako miejsce integracji z zewnętrznym API KSeF, generowanie FA(3) XML oraz polling statusów. Przed kodowaniem trzeba potwierdzić zakres biznesowy i wymagania księgowe.

## Źródła

- `docs/handoff.md:38` — otwarty problem „Faktury + KSeF”.
- `docs/handoff.md:176` — sesja 2026-07-03, KSeF jako temat otwarty.
- `docs/handoff.md:240` — research KSeF / faktury w kolejce.
