# Prompt — destylacja decyzji biznesowych do ADR

> Wklej to jako pierwszą wiadomość świeżej sesji CODE (nie sesji nauki — to zadanie
> produkcyjne, agent pisze pliki samodzielnie). Cel: zbudować bazę decyzji
> biznesowych, po której później agent AI będzie odpowiadał na pytania w języku
> naturalnym (patrz `docs/handoff.md` → „Widget AI dokumentacji").

## Kontekst projektu

`sailing-architects` — platforma sprzedaży rejsów żeglarskich. Stack: SvelteKit 2 +
Svelte 5 (runes) + Convex + Clerk + Tailwind v4 + Wuchale i18n + Stripe + Vercel.
Klient końcowy: Michał (operator rejsów). Logika biznesowa narosła i jest rozproszona
po trzech źródłach — nigdzie nie ma jej jako queryable bazy reguł.

## Zadanie

Zbuduj `docs/business-decisions/` — zbiór plików ADR (Architecture Decision Record),
jeden plik = jedna decyzja biznesowa/produktowa. Format każdego pliku:

```markdown
# ADR-NNN: [krótki tytuł decyzji]

- **Status:** przyjęta | zastąpiona przez ADR-XXX | do potwierdzenia przez Michała
- **Data:** YYYY-MM-DD (data podjęcia — z handoff)
- **Obszar:** refundy | płatności | rezerwacje | dane załogi | koje | i18n | ...

## Kontekst
Jaki problem/pytanie wymusiło decyzję. Stan przed.

## Decyzja
Co postanowiono. Precyzyjnie, jednoznacznie.

## Uzasadnienie
Dlaczego tak, a nie inaczej. Jakie alternatywy odrzucono i czemu.

## Konsekwencje
Co z tego wynika (dla kodu, użytkownika, danych, prawa). Co trzeba pamiętać.

## Źródła
Linki do wpisów `docs/handoff.md` (data sesji), plików kodu (`file:line`),
wiki (`knowledge-vault/wiki/...`).
```

## Źródła do destylacji (kolejność)

1. **`docs/handoff.md`** — sekcje „Decyzje" i „Otwarte problemy" wszystkich sesji.
   To główne źródło. Każda świadoma decyzja z uzasadnieniem = kandydat na ADR.
2. **`knowledge-vault/wiki/concepts/`** — wzorce ponadprojektowe; część to techniczne,
   ale niektóre kodują regułę biznesową (np. snapshot-vs-reference dla płatności).
3. **Kod** — `src/convex/mutations.ts`, `src/convex/refunds.ts`, `src/convex/schema.ts`,
   `src/convex/_lib/` (helpery kodują reguły, np. `bookingClosed.ts`, `refundStatus.ts`).
   Komentarze w tych plikach często niosą uzasadnienie.

## Znane decyzje-kandydaci (nie wyczerpująca lista — przeczesz handoff sam)

- Refund tiers (progi %/dni) — wartości Michała: 180/100%, 90/90%, 42/50%, 0/0%.
- Refund liczony wg **żywej** polityki vs snapshot z zakupu → decyzja: snapshot (opcja A,
  do potwierdzenia przez Michała). Powód prawny: konsument podlega regulaminowi z chwili umowy.
- Reblock koi → status `complimentary` (nie `taken`) — bo `taken` = „opłacona", kłamałoby.
- „Zamknięty booking" = pełny zwrot (`paymentStatus === 'refunded'`) **AND** wszystkie
  koje oddane. Konsekwencja: znika z Sales Board (wyszarzony), zero akcji.
- `bookingPayments.paymentPlanItemId` jako snapshot, nie referencja (historia nie kłamie).
- Payment plan: prefix-z-planu (wariant 2a), nie custom kwota (2c w zapasie).
- KSeF / faktury — moduł research, decyzje otwarte (certyfikat, zagraniczni nabywcy).

## Zasady

- **Tylko decyzje biznesowe/produktowe.** Nie dokumentuj wyborów czysto technicznych
  (nazwa zmiennej, wybór biblioteki) — chyba że niosą konsekwencję dla użytkownika/prawa.
- **Jedna decyzja = jeden plik.** Numeruj `ADR-001`, `ADR-002`...
- **Decyzje otwarte** (czeka na Michała) — też zapisz, ze statusem `do potwierdzenia`.
- **Nie zmyślaj uzasadnień.** Jeśli w handoff jest tylko decyzja bez „dlaczego" —
  zaznacz `Uzasadnienie: nie odnotowane w handoff` zamiast konfabulować.
- Zrób `docs/business-decisions/README.md` z indeksem (tabela: ADR / tytuł / obszar / status).

## Weryfikacja

- Każdy ADR ma wypełnione wszystkie sekcje (albo jawne „nie odnotowane").
- Indeks w README zgadza się z plikami.
- Zero duplikatów (jedna decyzja nie rozbita na dwa ADR).
