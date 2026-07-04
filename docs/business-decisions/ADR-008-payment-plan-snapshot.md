# ADR-008: Harmonogram płatności snapshotowany do bookingu

- **Status:** przyjęta
- **Data:** 2026-05-22
- **Obszar:** płatności | rezerwacje

## Kontekst

Admin może zmieniać plan płatności segmentu, ale istniejące bookingi muszą zachować harmonogram zaakceptowany przy zakupie. Bez snapshotu stary booking mógłby nagle pokazywać nowe kwoty albo inne terminy rat.

## Decyzja

Plan segmentu działa tylko dla nowych bookingów. Przy tworzeniu bookingu system przepisuje pozycje planu do `bookingPayments`. Stare plany nie są hard-delete'owane ani edytowane in-place; są wygaszane przez `isActive: false`, a nowy plan dostaje nowe `paymentPlanItems`.

`bookingPayments.paymentPlanItemId` jest historycznym wskazaniem na pozycję planu z momentu zakupu.

## Uzasadnienie

Historia płatności nie może kłamać. Klient dostał mail, Stripe PaymentIntent i harmonogram na określone kwoty, więc późniejsza zmiana planu przez admina nie może zmienić starej umowy.

Odrzucono update in-place starych pozycji planu oraz przepisywanie istniejących bookingów na nowy plan.

## Konsekwencje

Zmiana planu segmentu nie naprawia ani nie zmienia istniejących bookingów. Nowe bookingi korzystają z nowego aktywnego planu, stare zachowują własne `bookingPayments`.

## Źródła

- `docs/handoff.md:950` — sesja 2026-05-22, scenariusz snapshot vs reference.
- `docs/handoff.md:1902` — sesja 2026-05-02, plan segmentu zmienia się tylko dla nowych bookingów.
- `src/convex/mutations.ts:146` — tworzenie harmonogramu płatności bookingu.
- `src/convex/mutations.ts:196` — insert snapshotowanych `bookingPayments`.
- `src/convex/mutations.ts:326` — wygaszanie starych aktywnych planów.
- `knowledge-vault/wiki/concepts/snapshot-vs-reference-in-storage.md` — wzorzec snapshotu.
