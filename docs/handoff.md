# AI Handoff — [project-name]

> Ostatnia aktualizacja: [data]

---

## Stack

| Warstwa | Technologia |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Backend / DB | Convex 1.x + convex-svelte |
| Styling | Tailwind CSS v4 |
| i18n | Wuchale + @wuchale/svelte |
| Payments | Stripe 22.x |
| Deploy | Vercel |
| Package manager | **pnpm** (wyłącznie) |

---

## Zaimplementowane

### Strony

| Trasa | Plik | Status |
|---|---|---|
| `/` | `src/routes/+page.svelte` | Szkielet |

### Infrastruktura

- `setupConvex(PUBLIC_CONVEX_URL)` — inicjalizacja w root layout
- `src/lib/server/stripe.ts` — singleton Stripe client
- `src/routes/api/stripe/webhook/+server.ts` — webhook z weryfikacją sygnatury
- `src/convex/schema.ts` — schema (pusta)

---

## Otwarte problemy

_(brak na starcie)_

---

## Następne kroki

1. `npx convex dev` — inicjalizacja projektu Convex, wygenerowanie `_generated/`
2. `npx wuchale` — inicjalne scaffoldowanie plików `.po`
3. Uzupełnić `src/convex/schema.ts` o tabele projektu
4. Uzupełnić `src/app.css` `@theme` o kolory projektu
5. Zbudować główną stronę

---

## Komendy szybkiego startu

```bash
pnpm dev                    # dev server (Vite)
npx convex dev              # Convex backend dev (osobny terminal)
pnpm check                  # type check
pnpm lint                   # prettier + check
npx wuchale                 # ekstrakcja stringów i18n
```

---

<!-- Wpisy sesji poniżej (od najnowszych) -->
