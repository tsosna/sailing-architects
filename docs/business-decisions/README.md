# Business Decisions ADR

Indeks decyzji biznesowych i produktowych dla `sailing-architects`.

| ADR | Tytuł | Obszar | Status |
|---|---|---|---|
| [ADR-001](ADR-001-refund-tiers.md) | Progi polityki zwrotów | refundy | przyjęta |
| [ADR-002](ADR-002-refund-policy-snapshot-at-purchase.md) | Polityka zwrotów snapshotowana przy zakupie | refundy | do potwierdzenia przez Michała |
| [ADR-003](ADR-003-refund-data-model-mvp.md) | Model danych refundów dla MVP | refundy | przyjęta |
| [ADR-004](ADR-004-refund-cascade-newest-first.md) | Zwrot alokowany od najnowszej płatności | refundy / płatności | przyjęta |
| [ADR-005](ADR-005-release-berth-admin-choice.md) | Zwolnienie koi przy refundzie jest decyzją admina | refundy / koje | przyjęta |
| [ADR-006](ADR-006-reblock-berth-as-complimentary.md) | Ponowne zablokowanie koi po refundzie jako complimentary | refundy / koje | przyjęta |
| [ADR-007](ADR-007-closed-booking-definition-and-ui.md) | Zamknięty booking wymaga refundu i zwolnionych koi | rezerwacje / refundy / koje | przyjęta |
| [ADR-008](ADR-008-payment-plan-snapshot.md) | Harmonogram płatności snapshotowany do bookingu | płatności / rezerwacje | przyjęta |
| [ADR-009](ADR-009-checkout-payment-options-prefix.md) | Checkout oferuje prefix planu płatności | płatności / rezerwacje | przyjęta |
| [ADR-010](ADR-010-berth-status-semantics.md) | Status taken oznacza opłacone miejsce | koje / rezerwacje / płatności | przyjęta |
| [ADR-011](ADR-011-buyer-vs-crew-participants.md) | Kupujący jest oddzielony od uczestników rejsu | dane załogi / rezerwacje | przyjęta |
| [ADR-012](ADR-012-admin-edits-require-crew-reconfirmation.md) | Edycja danych przez admina wymaga ponownego potwierdzenia | dane załogi | przyjęta |
| [ADR-013](ADR-013-crew-confirmation-token.md) | Dane załogi potwierdzane przez link tokenowy | dane załogi / bezpieczeństwo | przyjęta |
| [ADR-014](ADR-014-auth-after-booking-intent.md) | Logowanie dopiero po intencji rezerwacji | rezerwacje / auth / UX | przyjęta |
| [ADR-015](ADR-015-pln-now-currency-field-for-future.md) | PLN jako jedyna waluta z jawnym polem currency | płatności | przyjęta |
| [ADR-016](ADR-016-ksef-invoices-research-open.md) | Faktury i KSeF jako osobny moduł | faktury / KSeF / płatności | do potwierdzenia przez Michała |
| [ADR-017](ADR-017-payment-item-kind-semantics.md) | Semantyka kind pozycji planu płatności (full/deposit niosą reguły) | płatności | przyjęta |
