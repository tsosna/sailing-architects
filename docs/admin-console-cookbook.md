# Admin Console Cookbook

Roboczy słownik i notatnik techniczny do wspólnego testowania panelu admina.

Cel: zapisywać krótkie, ludzkie wyjaśnienia pojęć i decyzji, które pojawiają się podczas pracy z `/admin`. Po czasie wybrane wpisy można przenieść do `knowledge-vault/wiki/` jako trwalsze artykuły.

## Jak Dopisywać

- **Termin** — słowo lub fraza techniczna.
- **Prosto** — znaczenie bez żargonu.
- **W tym projekcie** — gdzie to widać w Sailing Architects.
- **Ważne** — gotcha, ryzyko albo zasada bezpieczeństwa.

## ADMIN_DEV_ALLOWLIST

**Prosto:** lokalna lista adresów e-mail, które w trybie developerskim mogą wejść do panelu admina bez ustawionej roli `admin` w Clerk.

**W tym projekcie:** `ADMIN_DEV_ALLOWLIST` jest czytane w `src/lib/server/admin-guard.ts`. Jeśli aplikacja działa lokalnie w trybie dev, a zalogowany użytkownik ma e-mail z tej listy, `/admin` go wpuszcza.

**Ważne:** to jest tylko lokalny wyjątek testowy. Nie ustawiamy tego na produkcji, nie commitujemy prawdziwych maili do repo i nie traktujemy tego jako produkcyjnego modelu uprawnień.

## Clerk

**Prosto:** zewnętrzny system logowania i kont użytkowników. Projekt nie trzyma własnych haseł ani sesji użytkowników.

**W tym projekcie:** Clerk obsługuje logowanie do `/book`, `/dashboard` i `/admin`. Panel admina sprawdza, kim jest użytkownik według Clerk.

**Ważne:** e-mail wpisany w `.env` nie tworzy użytkownika. Taki adres musi istnieć jako konto w Clerk albo trzeba móc się nim zalogować/zarejestrować.

## Clerk Metadata

**Prosto:** dodatkowe informacje zapisane przy użytkowniku w Clerk, np. rola `admin`.

**W tym projekcie:** produkcyjny dostęp do `/admin` ma wynikać z roli `admin` w Clerk metadata, a nie z lokalnej allowlisty.

**Ważne:** to jest właściwy mechanizm dla produkcji. Allowlista jest tylko skrótem na lokalne testy.

## Guard

**Prosto:** bramka przed wejściem na stronę. Sprawdza, czy użytkownik ma prawo zobaczyć dany ekran.

**W tym projekcie:** `src/routes/[[lang=lang]]/admin/+layout.server.ts` woła `requireAdmin()`. Jeśli użytkownik nie spełnia warunków, nie zobaczy `/admin`.

**Ważne:** guard strony chroni UI. Dla pełnego bezpieczeństwa akcje zmieniające dane też powinny mieć kontrolę uprawnień po stronie backendu.

## Kod 6-Cyfrowy Clerk

**Prosto:** jednorazowy kod logowania wysyłany na e-mail.

**W tym projekcie:** gdy wpisujesz e-mail istniejący w Clerk, Clerk może wysłać kod i pokazać ekran weryfikacji.

**Ważne:** ikona pióra na ekranie Clerk zwykle oznacza edycję adresu e-mail, czyli powrót do poprzedniego kroku, a nie pole wpisywania kodu.

## Ostrożne Stylowanie Zewnętrznych Komponentów

**Prosto:** komponenty z bibliotek, takich jak Clerk, renderują własny HTML w środku. Nie zawsze widzimy wszystkie pola i wrappery w naszym kodzie.

**W tym projekcie:** pole kodu 6-cyfrowego Clerk wymaga stylowania po klasach Clerk, np. `.cl-otpCodeFieldInput`, a nie szeroko po `input[inputmode='numeric']`.

**Ważne:** zbyt szeroki selector CSS może złapać ukryty lub techniczny input biblioteki i zepsuć układ, np. nałożyć cyfry OTP na siebie.
