# Automatyczna wysyłka raportu handoff

Projekt ma skrypt, który:

- sprawdza, czy w `docs/handoff.md` są wpisy z wczoraj
- jeśli są: generuje krótki raport HTML i wysyła go przez Brevo
- jeśli nie ma wpisów: kończy bez wysyłki

## Uruchomienie ręczne

```bash
pnpm -s email:handoff:yesterday
```

Domyślny odbiorca to `msmolarski@jmsstudio.com`. Możesz nadpisać:

```bash
pnpm -s email:handoff:yesterday -- --to inny@adres.pl
```

Możesz też ustawić stałego odbiorcę przez env `HANDOFF_REPORT_TO` w `.env`.

## Automatyzacja (cron)

Przykład uruchomienia codziennie o 9:00:

```bash
0 9 * * * cd /ABSOLUTE/PATH/TO/sailing-architects && pnpm -s email:handoff:yesterday >> /tmp/sailing-architects-handoff.log 2>&1
```

Wymagane są zmienne środowiskowe Brevo w `.env` (lokalnie), takie jak `BREVO_API_KEY` i `BREVO_FROM_EMAIL`.
