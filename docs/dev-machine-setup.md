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

- **`.env`** — wypełniany przez `vercel env pull .env --yes`. Uwaga: pull
  **scala**, nie nadpisuje — zmienne obecne lokalnie, a nieobecne w środowisku
  Development, zostają w pliku nietknięte. Ręczna edycja nie zniknie przy
  następnym pullu, ale też nigdzie nie dojedzie: zostanie u Ciebie jako cicha
  rozbieżność. Żeby zmiana obowiązywała wszędzie, wypchnij ją (patrz „Zmiana
  sekretu"). Żeby dostać plik czysty, skasuj `.env` przed pullem.
- **`.env.local`** — należy do narzędzi, nadpisywane automatem. Ma wyższy
  priorytet niż `.env` w Vite, więc adres Convexa stąd wygrywa.

Oba są w `.gitignore` i żaden nie trafia do repo.

## Wersje narzędzi

| Narzędzie | Wersja       | Przypięta w                     | Kto pilnuje                                     |
| --------- | ------------ | ------------------------------- | ----------------------------------------------- |
| Node      | **24.14.1**  | `.nvmrc`                        | nvm (`nvm use`), fnm czyta ten sam plik          |
| pnpm      | **11.22.0**  | `packageManager` w package.json | pnpm sam, od wersji 10 wzwyż                     |

pnpm od wersji 10 ma `manage-package-manager-versions` domyślnie włączone, więc
czyta `packageManager` i **sam** pobiera właściwą wersję. Maszyna z pnpm ≥ 10
nie wymaga żadnej komendy — wystarczy `git pull`. Corepack jest tu niepotrzebny.

Maszyna z pnpm 9 lub starszym musi raz podbić wersję ręcznie (`brew upgrade pnpm`
albo instalator ze strony pnpm), bo pnpm 9 tego pola nie honoruje.

`engines.node` **celowo nie jest ustawione**: Vercel czyta to pole i wybiera po
nim runtime produkcyjny, a to osobna decyzja niż wersja na maszynie
deweloperskiej. `.nvmrc` działa wyłącznie lokalnie.

### Skrypty build zależności

pnpm 11 wymaga jawnej zgody na uruchomienie skryptów build zależności i traktuje
brak deklaracji jako **błąd**, nie ostrzeżenie (`strictDepBuilds` domyślnie
`true`). Lista mieszka w `pnpm-workspace.yaml` pod kluczem **`allowBuilds`**,
jako mapa `pakiet: true|false`.

Uwaga na starą nazwę: `onlyBuiltDependencies` (pnpm 10 i `package.json`) jest
w 11 martwe. Najgorsze jest to, że `pnpm config get onlyBuiltDependencies` nadal
je zwraca, więc wygląda na działające — a przy instalacji nie jest stosowane.

## Nowa maszyna, od zera

```sh
git clone https://github.com/tsosna/sailing-architects.git
cd sailing-architects
nvm use          # bierze wersję z .nvmrc
pnpm install
```

```sh
pnpm exec convex login
pnpm dlx vercel@latest login
pnpm dlx vercel@latest link --yes --project sailing-architects --team tsosnas-projects
```

`--project` i `--team` nie są ozdobnikiem — bez nich `--yes` wpada w linkowanie
na poziomie repozytorium i zapisuje `.vercel/repo.json` zamiast
`.vercel/project.json`, czego `vercel env` nie obsłuży.

Sekrety — **zwróć uwagę na jawną nazwę pliku**, patrz „Pułapki":

```sh
pnpm dlx vercel@latest env pull .env --yes
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
pnpm dlx vercel@latest env pull .env --yes
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

- **`vercel env pull` bez argumentu pisze do `.env.local`** i wejdzie w plik
  należący do Convexa. Zawsze podawaj `.env` jawnie.
- **Pull scala, więc nieaktualne wartości lokalne przeżywają.** Po migracji albo
  po dłuższej przerwie skasuj `.env` i zaciągnij od zera, zamiast pullować na
  wierzch.
- **Zmienna czytana przez `$env/static/private` musi istnieć w środowisku
  Development**, inaczej build pada. Pusta wartość w lokalnym `.env` tego nie
  załatwia: `secrets-push.sh` pomija puste, więc do Vercela nic nie trafia,
  a pull nie ma czego przynieść. Tak wyszło z `CRON_SECRET`.
- **`vercel link --yes` bez `--project` linkuje repo, nie projekt** — powstaje
  `.vercel/repo.json` (tryb alpha) zamiast `.vercel/project.json`, a wszystkie
  `vercel env` przestają działać. Jeśli tak wyjdzie: skasuj `repo.json` i zlinkuj
  ponownie z `--project` i `--team`.
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
