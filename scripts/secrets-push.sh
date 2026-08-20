#!/bin/sh
# Jednorazowe (lub odświeżające) wypchnięcie sekretów dev z lokalnego .env
# do dwóch magazynów, z których korzystają wszystkie maszyny deweloperskie:
#
#   1. Vercel, środowisko Development  -> źródło dla `vercel env pull .env`
#   2. deployment dev w Convex         -> zmienne widoczne dla funkcji backendu
#
# Uruchamiaj TYLKO na maszynie, której .env jest aktualny. Pozostałe maszyny
# nie pushują — one ciągną (patrz docs/dev-machine-setup.md).
#
# Wartości nie są nigdzie drukowane.

set -e
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
	echo "Brak .env w $(pwd) — nie ma czego wypychać." >&2
	exit 1
fi

if ! grep -q '^CONVEX_DEPLOYMENT=dev:' .env.local 2>/dev/null; then
	echo "Ta maszyna nie jest jeszcze przełączona na chmurowy deployment dev." >&2
	echo "Najpierw: pnpm exec convex dev --once --configure existing \\" >&2
	echo "            --team tomek-sosinski --project sailing-architects \\" >&2
	echo "            --dev-deployment cloud" >&2
	exit 1
fi

read_env() {
	grep -m1 "^$1=" .env | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

# --- 1. Vercel, środowisko Development -------------------------------------
# Bez zmiennych Convex: CONVEX_DEPLOYMENT / PUBLIC_CONVEX_URL /
# PUBLIC_CONVEX_SITE_URL generuje `convex dev` do .env.local, per maszyna.
# Bez CONVEX_ADMIN_KEY: wartość w .env to admin key lokalnego backendu i przeciw
# chmurze nie działa — deploy key generuje się raz w dashboardzie, patrz
# docs/dev-machine-setup.md.

VERCEL_VARS="PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY ADMIN_DEV_ALLOWLIST \
STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET PUBLIC_STRIPE_PUBLISHABLE_KEY \
BREVO_API_KEY BREVO_FROM_EMAIL CONTACT_EMAIL HANDOFF_REPORT_TO \
PUBLIC_APP_URL CRON_SECRET"

echo "--- Vercel / Development ---"
for k in $VERCEL_VARS; do
	v=$(read_env "$k")
	if [ -z "$v" ]; then
		echo "SKIP $k (brak wartości w .env)"
		continue
	fi
	# idempotencja: skasuj poprzednią wartość, jeśli była
	pnpm dlx vercel@latest env rm "$k" development --yes >/dev/null 2>&1 || true
	if printf '%s' "$v" | pnpm dlx vercel@latest env add "$k" development >/dev/null 2>&1; then
		echo "OK   $k"
	else
		echo "FAIL $k"
	fi
done

# --- 2. Deployment dev w Convex --------------------------------------------
# Funkcje backendu czytają process.env z deploymentu, nie z .env.
# CLERK_JWT_ISSUER_DOMAIN nie ma w .env — wyliczamy go z publishable key,
# który koduje domenę frontend API w base64 (pk_test_<base64>, sufiks '$').

echo
echo "--- Convex / deployment dev ---"
for k in BREVO_API_KEY BREVO_FROM_EMAIL HANDOFF_REPORT_TO PUBLIC_APP_URL; do
	v=$(read_env "$k")
	if [ -z "$v" ]; then
		echo "SKIP $k (brak wartości w .env)"
		continue
	fi
	pnpm exec convex env set "$k" "$v" >/dev/null 2>&1 && echo "OK   $k"
done

pk=$(read_env PUBLIC_CLERK_PUBLISHABLE_KEY)
body=${pk#pk_test_}
body=${body#pk_live_}
pad=$(( (4 - ${#body} % 4) % 4 ))
i=0
while [ "$i" -lt "$pad" ]; do
	body="$body="
	i=$((i + 1))
done
issuer=$(printf '%s' "$body" | base64 -d 2>/dev/null | tr -d '$')
if [ -n "$issuer" ]; then
	pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN "https://$issuer" >/dev/null 2>&1 \
		&& echo "OK   CLERK_JWT_ISSUER_DOMAIN (https://$issuer)"
else
	echo "FAIL CLERK_JWT_ISSUER_DOMAIN — nie udało się odczytać domeny z publishable key"
fi

echo
echo "=== Vercel Development ==="
pnpm dlx vercel@latest env ls development
echo "=== Convex dev (nazwy) ==="
pnpm exec convex env list | cut -d= -f1
