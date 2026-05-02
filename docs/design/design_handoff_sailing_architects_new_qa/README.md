# Handoff: Sailing Architects — Full Website

## Overview

Boutique sailing trip booking platform. Użytkownicy rezerwują konkretną koję na jachcie (Jeanneau Sun Odyssey 519) dla wybranego etapu rejsu Sail Adventure 2026: Palma de Mallorca → Gibraltar → Madera → Teneryfa → Cabo Verde. 10 miejsc (5 kajut × 2 koje). Zbierane są wrażliwe dane załogi (paszport, kontakt alarmowy, doświadczenie żeglarskie).

## O plikach designu

Pliki w tym pakiecie to **prototypy hi-fi stworzone w HTML/React** — pokazują zamierzony wygląd i zachowanie. **Nie kopiuj ich bezpośrednio do produkcji.** Zadaniem jest odtworzenie tych projektów w istniejącym środowisku: **SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS v4 + Convex + Clerk + Stripe + Wuchale (i18n PL/EN)**.

Otwórz `Sailing Architects.html` w przeglądarce, aby zobaczyć działający prototyp.

## Fidelity: HIGH-FIDELITY

Pixel-perfect mockup z finalnymi kolorami, typografią, spacingiem i interakcjami. Odtwórz UI z pikselową precyzją używając istniejącego stacku.

---

## Design Tokens

### Kolory

```css
--navy:        #0d1b2e   /* główne tło */
--navy-mid:    #0f1f35   /* tło sekcji naprzemiennych */
--navy-light:  #162840   /* tło sekcji jasniejszych */
--brass:       #c4923a   /* akcent mosiądz — CTA, highlights */
--brass-light: #d4aa5a   /* hover stanu brass */
--warm-white:  #f5f0e8   /* tekst główny */
--cream:       #ede5d8   /* tekst drugorzędny jasny */
--muted:       rgba(245,240,232,0.45)  /* tekst wyciszony */

/* Tailwind @theme tokens w app.css — zaktualizuj: */
--color-primary: oklch(0.65 0.12 65);   /* brass ≈ #c4923a */
--color-surface: oklch(0.12 0.08 252);  /* navy ≈ #0d1b2e */
```

### Typografia

```
Nagłówki:  Playfair Display — serif, weights 400/600, italic variant
UI/body:   DM Sans — sans-serif, weights 300/400/500/600/700

Google Fonts import:
  family=Playfair+Display:ital,wght@0,400;0,600;1,400
  family=DM+Sans:wght@300;400;500;600;700
```

### Spacing / Layout

```
max-width strony:   1100px (centred)
section padding:    96px 40px (top/bottom 96px, sides 40px)
nav height:         64px fixed
border-radius:      0px wszędzie (sharp, architectural)
gap w grid 1px:     background: rgba(196,146,58,0.1) + child bg = separator trick
```

### Borders & Dividers

**Brak linii działowych między sekcjami.** Sekcje rozróżniane wyłącznie tonalnymi tłami:
- `#0d1b2e` — sekcja główna (hero, jacht, kajuty, FAQ, footer)
- `#0f1f35` — sekcja naprzemiennia (trasa, cennik)

---

## Strony / Widoki

### 1. Landing Page (`/`)

#### Nav (fixed)

- Height: 64px, `position: fixed`, `z-index: 100`
- Transparent gdy scroll = 0; po scrollu: `background: rgba(13,27,46,0.97)`, `backdrop-filter: blur(12px)`, `border-bottom: 1px solid rgba(196,146,58,0.1)`
- **Logo SA:** SVG circle 36px, tekst „SA" + ring + tekst „Sailing Architects" (Playfair Display 16px)
- **Linki:** Jacht / Trasa / Kajuty / Cennik — DM Sans 12px, letterSpacing 1.5px, uppercase, kolor `rgba(245,240,232,0.6)` → hover `#c4923a`
- **Przycisk „Panel":** border `1px solid rgba(196,146,58,0.3)`, brak bg, 8px 16px padding
- **Przycisk „Rezerwuj":** bg `#c4923a`, kolor `#0d1b2e`, bold, 10px 24px padding

#### Hero

- `min-height: 100vh`, flex column, `justify-content: flex-end`, padding bottom 80px
- Tło: `linear-gradient(165deg, #0d1b2e 0%, #162840 35%, #1e3a5c 65%, #0d1b2e 100%)`
- **Placeholder hero photo:** absolutny, `top: 10%`, `width: 90%`, `max-width: 900px`, `height: 55vh`, `border: 1px dashed rgba(196,146,58,0.12)` — podmień na rzeczywistą fotografię żeglarską
- **Eyebrow:** DM Sans 11px, letterSpacing 4px, uppercase, `rgba(196,146,58,0.7)` — „Jesień 2026"
- **H1:** Playfair Display, `clamp(40px, 6vw, 76px)`, lineHeight 1.05, „Sail Adventure" (z `<em>` na italic)
- **Podtytuł trasy:** Playfair Display 22px italic, `rgba(196,146,58,0.8)` — „Palma de Mallorca → Cabo Verde"
- **Lead text:** DM Sans 14px, `rgba(245,240,232,0.55)`, maxWidth 420px, lineHeight 1.7
- **CTA primary:** bg `#c4923a`, kolor `#0d1b2e`, bold 13px, letterSpacing 2px, padding 16px 40px, borderRadius 0
- **CTA secondary:** border `1px solid rgba(196,146,58,0.35)`, kolor `rgba(245,240,232,0.7)`, href `#route`
- **Stats bar:** 4 komórki (4 etapy / 10 miejsc / ~3500km / 41 dni), gap `1px` na `rgba(196,146,58,0.15)` bg, bg komórek `rgba(13,27,46,0.85)`, Playfair 28px wartość + DM Sans 9px uppercase label

#### Sekcja Jacht (`#vessel`)

- Eyebrow: „Jacht"
- H2: „Jeanneau Sun Odyssey 519"
- Grid 2-kolumnowy: lewa = galeria zdjęć (1 duże + 4 miniatury 2×2), prawa = opis + specyfikacje
- **Specyfikacje:** grid 2-kolumnowy, gap `1px`, bg separator `rgba(196,146,58,0.1)`, każda komórka: padding 14px 16px, label 9px uppercase brass, wartość 13px warm-white
- 8 wierszy: Model / Rok / Długość / Szerokość / Kajuty / Silnik / Żagiel główny / Elektronika

#### Sekcja Trasa (`#route`)

- Tło: `#0f1f35`
- Grid 2-kolumnowy: lewa = mapa SVG, prawa = selektor etapów + szczegóły
- **Mapa:** SVG poglądowa z 5 punktami (Palma, Gibraltar, Madera, Teneryfa, Cabo Verde) połączonymi linią przerywaną, klikalne
- **Selektor etapów:** 4 przyciski `01`–`04`, gap `1px`, active: `borderBottom: 2px solid #c4923a`, bg `rgba(196,146,58,0.15)`
- **Karta etapu:** padding 28px, border `1px solid rgba(196,146,58,0.15)`, wyświetla: numer etapu, from/to, opis, termin, dni, cena (Playfair 22px brass)

#### Selektor Kajut (`#cabins`)

- **Segment picker:** 4 przyciski z datą / nazwą etapu / ceną, active: borderBottom brass
- **Plan kojowy SVG:** komponent `BoatPlan` — patrz sekcja Komponenty poniżej
- **CTA po wyborze:** pełnowymiarowy banner z info o wybranej koji + przycisk „Rezerwuj →"

#### Cennik (`#pricing`)

- Tło: `#0f1f35`
- Grid 4 kart, gap `1px`, bg `rgba(196,146,58,0.1)` (separator trick)
- Każda karta: padding 32px 28px, eyebrow etapu, H3 trasy, daty, cena Playfair 36px brass, przycisk „Zarezerwuj"
- Badge „OSTATNIE MIEJSCA" na etapie 4 — bg `#c4923a`, kolor `#0d1b2e`, absolute top-right
- 2 kolumny pod kartami: „Cena zawiera" vs „Cena nie zawiera" z bullet points

#### FAQ

- Accordion — kliknięcie toggleuje odpowiedź
- `border-top: 1px solid rgba(196,146,58,0.1)` między pytaniami
- Pytanie: DM Sans 15px warm-white → brass gdy open; ikona `+` obraca się 45° gdy open (CSS transform)
- Odpowiedź: DM Sans 14px, `rgba(245,240,232,0.55)`, lineHeight 1.75

#### Footer

- Tło: `#07111e`
- Logo + nazwa + opis + kontakt po lewej, CTA „Rezerwuj koję →" po prawej
- Copyright bar z `border-top: 1px solid rgba(196,146,58,0.08)`

---

### 2. Booking Flow (`/book` lub modal)

Multi-step form, 5 kroków. **Step indicator** na górze: numery `01`–`05` w kwadratach 32×32px, separator linią 40px, active = brass outline + brass text, done = brass fill + checkmark `✓`, inactive = dim.

#### Krok 1 — Konto (Clerk)

- Toggle tabs: Logowanie / Rejestracja — `border-bottom: 2px solid #c4923a` active
- Pola: E-mail, Hasło, (Powtórz hasło przy rejestracji)
- Social login: Google / Apple — border buttons flex
- CTA „Dalej →" — brass bg

#### Krok 2 — Dane załogi

Grid 2-kolumnowy, pola:
- Imię, Nazwisko, Data urodzenia (date input), Narodowość (select)
- Sekcja „Dokument tożsamości": Typ (Paszport/Dowód), Numer dokumentu
- Sekcja „Kontakt alarmowy": Imię i nazwisko, Telefon
- Sekcja „Profil żeglarski": Umiejętności pływackie (select), Doświadczenie (select), Wymagania dietetyczne (textarea), Uwagi medyczne (textarea)

Separator sekcji: `border-top: 1px solid rgba(196,146,58,0.1)` + label 10px uppercase brass

**Input style:**
```
background: rgba(255,255,255,0.04)
border: 1px solid rgba(196,146,58,0.25)
padding: 10px 14px
color: #f5f0e8
border-radius: 0
```

#### Krok 3 — Potwierdzenie

Karta rezerwacji: header z tytułem rejsu, 6 wierszy (Etap/Termin/Czas trwania/Koja/Pozycja/Cena), footer z disclaimerem. Tabela `justify-content: space-between`, label uppercase dim, wartość 13px warm-white.

#### Krok 4 — Płatność (Stripe)

- Lewa: formularz karty (Stripe Elements lub własny mock) + info o bezpieczeństwie
- Prawa: order summary box (mały, border brass dim)
- CTA: „Zapłać {cena} zł →"

#### Krok 5 — Sukces

- Okrąg z checkmarkiem (border `2px solid #c4923a`, border-radius 50%, 64×64px)
- Playfair 32px „Witaj na pokładzie!"
- Dwa przyciski: „Mój panel" (brass) + „Pobierz PDF" (outline)

---

### 3. Dashboard (`/dashboard`)

Trzy zakładki: Rezerwacja / Dane załogi / Dokumenty

#### Zakładka Rezerwacja

- Status banner: zielony `rgba(80,160,80,0.08)` + zielona kropka + tekst
- Karta rejsu: header (brass dim bg) + grid informacji (6 pól)
- Route timeline: 5 portów jako diamendy (rotate 45°) połączone liniami, aktywny etap brass
- Przyciski akcji

#### Zakładka Dane załogi

Grid 2-kolumnowy kart z danymi, każda: `border-left: 2px solid rgba(196,146,58,0.2)`, label 9px uppercase, wartość 13px. Przycisk „Edytuj dane".

#### Zakładka Dokumenty

Lista plików: padding 16px 20px, border `1px solid rgba(196,146,58,0.12)`, nazwa + typ + data + ikona pobierania `↓`.

---

## Komponenty

### BoatPlan — Plan kojowy SVG

**Plik referencyjny:** `components/boat-plan.jsx`

Architektoniczny rzut z góry jachtu Jeanneau Sun Odyssey 519. SVG `viewBox="0 0 200 520"`.

**5 kajut:**
| ID | Nazwa | Pozycja |
|---|---|---|
| A | Kabina A | Dziobowa |
| B | Kabina B | Rufowa lewa |
| C | Kabina C | Rufowa prawa |
| D | Kabina D | Środkowa lewa |
| E | Kabina E | Środkowa prawa |

**10 koje:** A1, A2, B1, B2, C1, C2, D1, D2, E1, E2

**Stany koji:**
```
available: fill rgba(245,240,232,0.12), stroke #c4923a 0.8px
hovered:   fill rgba(196,146,58,0.22), stroke #c4923a
selected:  fill rgba(196,146,58,0.85), stroke #c4923a 1.5px + biały krzyżyk
taken:     fill rgba(13,27,46,0.55), stroke #3a4a5c + przekreślenie
```

**Implementacja Svelte:**
```svelte
<!-- +page.svelte lub komponent BoatPlan.svelte -->
<script>
  let selectedBerth = $state(null);
  const takenBerths = new Set(['A2', 'C1', 'D2']); // z Convex DB
  
  function selectBerth(id) {
    if (takenBerths.has(id)) return;
    selectedBerth = selectedBerth === id ? null : id;
  }
</script>
```

Convex query powinna zwracać zestaw zajętych koje dla danego segmentu rejsu.

### Input komponent

Wielokrotnie używany formularz. Obsługuje: `text`, `email`, `password`, `date`, `tel`, `textarea`, `select`.

```svelte
<!-- lib/components/Input.svelte -->
<script>
  export let label = '';
  export let type = 'text';
  export let value = '';
  export let required = false;
  export let hint = '';
  export let options = null; // [{value, label}] dla select
</script>
```

---

## Interakcje i animacje

| Interakcja | Czas | Easing | Właściwości |
|---|---|---|---|
| Nav scroll | 300ms | ease | background, backdropFilter, borderBottom |
| Hover linki nav | 200ms | ease | color |
| FAQ accordion | instant (no transition) | — | display toggle |
| Etap route hover | 150ms | ease | opacity |
| Koja hover/select | 150ms | ease | fill, stroke, strokeWidth |
| Selektor etapów | instant | — | borderBottom, background |

---

## Routing (SvelteKit + Wuchale)

```
src/routes/
├── [[lang]]/               ← Wuchale i18n wrapper (PL/EN)
│   ├── +layout.svelte      ← Nav + Footer
│   ├── +page.svelte        ← Landing page
│   ├── book/
│   │   └── +page.svelte    ← Booking flow (requires Clerk auth)
│   └── dashboard/
│       └── +page.svelte    ← Dashboard (requires Clerk auth, protected route)
```

Wszystkie linki wewnętrzne przez Wuchale localePath helper.

---

## Convex Schema (sugestia)

```typescript
// src/convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  voyageSegments: defineTable({
    name: v.string(),           // "Gibraltar → Madera"
    dates: v.string(),
    startDate: v.number(),      // timestamp
    endDate: v.number(),
    pricePerBerth: v.number(),  // PLN
    days: v.number(),
  }),

  berths: defineTable({
    segmentId: v.id("voyageSegments"),
    cabinId: v.string(),        // "A" | "B" | "C" | "D" | "E"
    berthId: v.string(),        // "A1" | "A2" | ...
    status: v.union(v.literal("available"), v.literal("taken")),
  }),

  bookings: defineTable({
    userId: v.string(),          // Clerk user ID
    berthId: v.id("berths"),
    segmentId: v.id("voyageSegments"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    stripePaymentIntentId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    bookingRef: v.string(),      // "SA-2026-XXXX"
  }),

  crewProfiles: defineTable({
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    nationality: v.string(),
    docType: v.union(v.literal("passport"), v.literal("id")),
    docNumber: v.string(),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    swimmingAbility: v.string(),
    sailingExperience: v.string(),
    dietaryRequirements: v.optional(v.string()),
    medicalNotes: v.optional(v.string()),
  }),
});
```

---

## Assets

| Asset | Status | Ścieżka |
|---|---|---|
| Hero photography | **PLACEHOLDER** — podmień | 1600×900px, żeglowanie, golden hour |
| Zdjęcia jachtu | **PLACEHOLDER** — podmień | SO519 burt + cockpit + kabiny (4 szt.) |
| Logo SA (SVG) | W kodzie jako SVG inline | Okrąg + litery SA |
| Broszura referencji | W projekcie | `docs/assets/WhatsApp Image 2025-12-31 at 14.30.57*.jpeg` |
| Mapa trasy | **PLACEHOLDER** — podmień | Mapa Atlantyku z trasą |

---

## Pliki w tym pakiecie

```
design_handoff_sailing_architects/
├── README.md                    ← ten plik
├── Sailing Architects.html      ← landing page (otwórz w przeglądarce)
├── Poradnik Załogi.html         ← strona /poradnik — pełny poradnik załogi
├── tweaks-panel.jsx             ← helper UI dla panelu podglądu
└── components/
    ├── boat-plan.jsx            ← SVG plan kajutowy (kluczowy komponent)
    ├── booking-flow.jsx         ← 5-krokowy flow rezerwacji
    ├── dashboard.jsx            ← panel użytkownika
    └── crew-guide.js            ← wspólny moduł treści Q&A (źródło prawdy)
```

**Instrukcja podglądu:**
1. Otwórz `Sailing Architects.html` w przeglądarce (Chrome/Firefox)
2. Strona jest w pełni interaktywna — klikaj koje, przechódź przez booking flow, otwieraj dashboard
3. Kliknij link „Poradnik załogi →" w sekcji FAQ → otworzy `Poradnik Załogi.html`
4. W poradniku: klikalne checklisty, accordion Q&A, sidebar nawigacja
5. Kliknij „Tweaks" w prawym dolnym rogu na landing page aby zobaczyć warianty

---

## Poradnik Załogi — dodatkowe informacje

### Architektura treści

Plik `components/crew-guide.js` to **jedyne źródło prawdy** dla całego Q&A.
- Landing page (`FaqSection`) pobiera z niego pytania oznaczone `featured: true` (7 pytań)
- Strona `/poradnik` pobiera pełne Q&A pogrupowane wg kategorii
- Nie ma duplikacji treści między stronami

W implementacji SvelteKit przenieść do `src/lib/crew-guide.ts`.

### Routing SvelteKit

```
src/routes/[[lang=lang]]/
├── +page.svelte              ← landing page
└── poradnik/
    └── +page.svelte          ← Poradnik Załogi
```

### Checklisty (interaktywne)

Trzy checklisty z paskiem postępu i klikalnymi checkboxami:
- **Dokumenty** — faza „7 dni przed rejsem"
- **Pakowanie** — faza „Co zabrać"  
- **Płatności i formalności** — faza „Po rezerwacji"

Stan checkboxów przechowywać w `localStorage` per userId lub sessionStorage.

### Kategorie Q&A (6 grup)

| ID | Nazwa | Pytań |
|---|---|---|
| `przed-rejsem` | Przed rezerwacją | 5 |
| `kto-plynie` | Kto płynie | 4 |
| `zycie-na-pokladzie` | Życie na pokładzie | 6 |
| `bezpieczenstwo` | Bezpieczeństwo | 5 |
| `logistyka` | Logistyka i koszty | 4 |
| `pakowanie` | Co zabrać | 2 |

### Fazy (phase labels)

Wyróżnione etykiety przy pytaniach i checklistach:
- `Przed rezerwacją`
- `Po rezerwacji`
- `7 dni przed rejsem`
- `Na pokładzie`

---

## Kontakt / Marka

```
Sailing Architects
Michał: +48 601 671 182
sailingarchitects@gmail.com
```
