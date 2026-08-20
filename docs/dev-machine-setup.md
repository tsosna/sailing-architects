# Konfiguracja maszyny deweloperskiej

Odpowiedź na INFRA-4: jak postawić projekt na nowej maszynie i jak trzymać
sekrety zsynchronizowane między MacBookiem Air a Mac mini.

## Sekrety mieszkają w trzech magazynach

Kluczowa rzecz, której nie widać z samego `.env`: to nie jest jeden plik do
przeniesienia. Są trzy niezależne miejsca, z czego dwa są zdalne.

| Magazyn                       | Co trzyma                                                                                    | Kto zapisuje                            | Kto czyta                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Vercel → środowisko **Development** | Clerk, Stripe, Brevo, `CRON_SECRET`, adresy e-mail, `PUBLIC_APP_URL`, `CONVEX_ADMIN_KEY` | `scripts/secrets-push.sh` (raz)         | `vercel env pull .env` na każdej maszynie   |
| **Deployment dev w Convex**   | `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `HANDOFF_REPORT_TO`, `PUBLIC_APP_URL`, `CLERK_JWT_ISSUER_DOMAIN` | `scripts/secrets-push.sh` (raz)         | funkcje w `src/convex/` przez `process.env` |
| **`.env.local`** (lokalny)    | `CONVEX_DEPLOYMENT`, `PUBLIC_CONVEX_URL`, `PUBLIC_CONVEX_SITE_URL`, `VERCEL_OIDC_TOKEN`        | `convex dev` i `vercel link`, automatem | Vite / SvelteKit                            |

Podział plików lokalnych:

- **`.env`** — plik **generowany** przez `vercel env pull .env`. Nie edytuj go
  ręcznie z myślą, że zmiana gdzieś dojedzie; edycja jest lokalna i zginie przy
  następnym pullu. Żeby zmiana była trwała, wypchnij ją (patrz „Zmiana sekretu").
- **`.env.local`** — należy do narzędzi, nadpisywane automatem. Ma wyższy
  priorytet niż `.env` w Vite, więc adres Convexa stąd wygrywa.

Oba są w `.gitignore` i żaden nie trafia do repo.

## Nowa maszyna, od zera

```sh
git clone https://github.com/tsosna/sailing-architects.git
cd sailing-architects
pnpm install
```

```sh
pnpm exec convex login
pnpm dlx vercel@latest login
pnpm dlx vercel@latest link --yes
```

Sekrety — **zwróć uwagę na jawną nazwę pliku**, patrz „Pułapki":

```sh
pnpm dlx vercel@latest env pull .env
```

Podpięcie się pod współdzielony deployment dev w Convex:

```sh
pnpm exec convex dev --once --configure existing \
  --team tomek-sosinski --project sailing-architects --dev-deployment cloud
```

Start (dwa terminale):

```sh
pnpm dev
```

```sh
pnpm exec convex dev
```

## Zmiana sekretu (np. nowe klucze Stripe)

Na maszynie, na której go zmieniasz:

1. wpisz nową wartość do `.env`,
2. `sh scripts/secrets-push.sh` — wypchnie ją do Vercela i do deploymentu dev.

Na pozostałych maszynach:

```sh
pnpm dlx vercel@latest env pull .env
```

Skrypt jest idempotentny (kasuje starą wartość przed dodaniem nowej), więc można
go puszczać wielokrotnie. Puszczaj go **tylko** z maszyny, której `.env` jest
aktualny — inaczej cofniesz cudze zmiany.

## `CONVEX_ADMIN_KEY` — jedyny krok ręczny

`src/lib/server/convex-admin.ts` woła `setAdminAuth(CONVEX_ADMIN_KEY)`. Klucz
jest związany z konkretnym deploymentem, więc nie da się go wyprowadzić z `.env`
ani wygenerować z CLI (`convex deploy-key` nie istnieje w 1.36). Raz, w
dashboardzie:

1. `https://dashboard.convex.dev/d/animated-lemming-109/settings` → **Deploy Keys**
2. wygeneruj klucz z uprawnieniami `runInternal*` (jak dla prod, patrz
   `handoff.md` — build key ≠ runtime key),
3. `pnpm dlx vercel@latest env add CONVEX_ADMIN_KEY development` i wklej wartość,
4. na pozostałych maszynach `vercel env pull .env`.

## Convex dev jest chmurowy i wspólny

Deployment dev to `dev:animated-lemming-109` (eu-west-1). Convex daje **jeden
deployment dev na parę konto+projekt**, więc obie maszyny logujące się na to samo
konto trafiają na ten sam backend i te same dane. To celowe: koniec z bazą,
która istnieje tylko na jednym dysku.

Skutek uboczny: `PUBLIC_CONVEX_URL` jest publicznym `https`, więc przeglądarka z
dowolnej maszyny w LAN-ie go osiągnie — to domyka też INFRA-5, bez bindowania
lokalnego backendu na `0.0.0.0`.

## Pułapki

- **`vercel env pull` bez argumentu pisze do `.env.local`** i nadpisze plik
  należący do Convexa. Zawsze podawaj `.env` jawnie.
- **`vercel link` dopisuje `.env*` do `.gitignore`** — reguła szersza niż nasza,
  psuje negacje `!.env.example` / `!.env.test`. Cofnij ją, jeśli się pojawi.
- **`npx convex` ściąga najnowsze CLI**, nie wersję z `package.json`. Efekt:
  pliki w `src/convex/_generated/` przerzucają się między maszynami przy każdym
  commicie. Używaj `pnpm exec convex`.
- **Nowy deployment dev startuje bez zmiennych** i push funkcji wywala się na
  `CLERK_JWT_ISSUER_DOMAIN`. To robi `scripts/secrets-push.sh`.
- **`PUBLIC_APP_URL` w środowisku Development** to `http://localhost:5173`.
  Zmienne Development czyta wyłącznie `vercel env pull` i `vercel dev` —
  deploymenty preview biorą z osobnego środowiska Preview, więc localhost tam nie
  wycieknie.
