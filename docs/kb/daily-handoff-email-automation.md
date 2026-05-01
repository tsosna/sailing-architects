# Automatyczna wysyłka dziennego raportu (handoff) e-mailem

## Cel

Automatycznie wysyłać klientowi krótki raport z „wczoraj” na podstawie dziennika prac (`docs/handoff.md`), ale **tylko wtedy**, gdy są realne wpisy do raportowania.

## Sprawdzony wzorzec

1. Źródło prawdy: `docs/handoff.md` z wpisami sesji w formacie `## Sesja YYYY-MM-DD ...`
2. Skrypt CLI:
   - oblicza datę „wczoraj” (lokalnie)
   - wyciąga wszystkie sesje z tej daty
   - buduje prosty raport HTML (nietechniczny język)
   - wysyła e-mail przez transactional provider (np. Brevo)
   - jeśli nie ma wpisów: kończy bez wysyłki
3. Uruchamianie cykliczne:
   - cron na serwerze / VM / workstation, albo scheduler platformy (np. Vercel Cron, GitHub Actions)
   - uruchomienie raz dziennie o stałej godzinie

## Integracja z Brevo (Transactional Email)

- Wysyłka przez endpoint HTTP `POST /v3/smtp/email`
- Wymagane env:
  - `BREVO_API_KEY`
  - `BREVO_FROM_EMAIL`
- Skrypt powinien zwracać / logować `messageId` (diagnostyka), bez logowania sekretów

## Operacyjne „gotcha”

- Środowiska uruchomieniowe w sandboxie (CI/agent/desktop) mogą nie mieć dostępu do DNS/Internetu — objaw: `getaddrinfo ENOTFOUND ...`
  - jeśli to automatyzacja w narzędziu z sandboxem: potrzebne jest uruchomienie poza sandboxem albo osobny runner z dostępem do sieci
- Skrypty e-mail zwykle potrzebują `.env` dostępnego w runtime (lokalnie lub w CI secrets)
- Raport nie powinien zawierać żargonu technicznego; warto usuwać backticki i nazwy plików/komend z wejściowych bulletów

## Minimalny format raportu dla klienta

- Podsumowanie: 2–3 zdania
- „Co zostało zrobione” (bullet list)
- Opcjonalnie: „Co wymaga decyzji lub uwagi”
- „Kolejny krok”

## Przykładowy cron (lokalnie)

```bash
0 9 * * * cd /ABSOLUTE/PATH/TO/PROJECT && pnpm -s email:handoff:yesterday >> /tmp/handoff.log 2>&1
```
