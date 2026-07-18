# Buildrik — Design System & Implementation Guide

> Source: founder-supplied UI kit for `Buildrik Dashboard_final.dc.html`
> (claude.ai/design project `1f20d4e4-cb45-494b-b81e-b9030a31864d`), captured
> 2026-07-18. This is the *kit as supplied*. Where it conflicts with shipped
> tokens in `packages/dashboard/app/globals.css` or with `DESIGN.md`, see
> **§0 Conflicts** — those are resolved decisions, not free choices.

## 0. Conflicts with shipped code (READ FIRST)

| Kit value | Shipped value | Status |
|---|---|---|
| `--color-primary: rgb(64,110,214)` `#406ED6` | `#2D6DFF` cobalt | **Cobalt wins** — DESIGN.md §Color + Decisions Log (RED→COBALT flip, 2026-07-12) make cobalt the single accent across editor + auth + dashboard. |
| `--color-text-primary: rgb(28,33,44)` `#1C212C` | `#334155` | Reskin Task 1 (2026-07-18) moved text to slate `#334155`. |
| `--color-canvas: rgb(249,250,252)` | `--color-bg-page #FAFAFC` | Reskin value. |
| `--color-border: rgb(232,234,239)` | `#E5E8ED` | Reskin value. |
| `--shadow-card: 0 1px 2px…, 0 10px 26px -20px…` | inset ring + soft drop | Reskin premium shadow set. |
| Sidebar `272px` | `--sidebar-w: 244px` | Reskin; confirmed against the founder's own screenshot. |
| Top bar `60px` | `--topnav-h` | Shipped shell value. |
| Button radius `--radius-lg` (10px) | `6px` | Reskin Task 4. |
| Inter via Google Fonts | Inter via **Bunny Fonts** | Privacy-respecting loader already in `app/layout.tsx`; Inter is scoped to the dashboard shell root. |

Everything below that does **not** appear in the table above is safe to adopt as-is.

---

## 1. Design tokens

```css
:root {
  /* Brand */
  --color-primary:         rgb(64,110,214);
  --color-primary-hover:   rgb(46,86,184);
  --color-primary-subtle:  rgb(235,241,255);

  /* Text */
  --color-text-primary:     rgb(28,33,44);
  --color-text-secondary:   rgb(107,115,128);
  --color-text-placeholder: rgb(152,160,175);

  /* Surfaces */
  --color-surface:      rgb(255,255,255);
  --color-canvas:       rgb(249,250,252);
  --color-fill-subtle:  rgb(243,245,248);
  --color-border:       rgb(232,234,239);
  --color-border-strong:rgb(214,218,225);

  /* Status */
  --color-success: rgb(5,150,105);   --color-success-subtle: rgb(220,252,231);
  --color-warning: rgb(217,119,6);   --color-warning-subtle: rgb(254,243,199);
  --color-danger:  rgb(220,38,38);   --color-danger-subtle:  rgb(254,226,226);

  /* Accents (icon chips, categories) */
  --color-teal:   rgb(13,148,166);
  --color-purple: rgb(124,92,246);
  --color-amber:  rgb(234,142,30);
  --color-pink:   rgb(219,80,140);
  --color-ink:    rgb(20,25,36);   /* near-black — logo mark, dark hero cards */

  /* Radius */
  --radius-xs:4px; --radius-sm:6px; --radius-md:8px; --radius-lg:10px;
  --radius-xl:12px; --radius-2xl:16px; --radius-pill:9999px;

  /* Elevation */
  --shadow-ring: inset 0 0 0 1px var(--color-border);
  --shadow-card: 0 1px 2px rgba(15,23,42,0.04), 0 10px 26px -20px rgba(15,23,42,0.28);

  /* Type */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Base resets:**

```css
body { margin:0; background:var(--color-canvas); font-family:var(--font-sans);
       color:var(--color-text-primary); -webkit-font-smoothing:antialiased;
       font-variant-numeric:tabular-nums; }
a       { color:var(--color-primary); text-decoration:none; }
a:hover { color:var(--color-primary-hover); }
input,textarea,select { font-family:inherit; font-size:14px; color:var(--color-text-primary);
       background:transparent; border:none; width:100%; box-sizing:border-box; }
input::placeholder { color:var(--color-text-placeholder); }
button:focus-visible, a:focus-visible, [tabindex]:focus-visible {
       outline:2px solid var(--color-primary); outline-offset:2px; border-radius:var(--radius-sm); }
```

---

## 2. Typography scale

Inter only. Weights carry hierarchy — don't introduce a second family.

| Role | Size | Weight | Letter-spacing | Color |
|---|---|---|---|---|
| Page H1 | 24px | 700 | -.01em | text-primary |
| Hero H1 (empty states) | 30px | 800 | -.02em | text-primary |
| Section / card title | 14–16px | 700 | — | text-primary |
| Card item title | 13.5px | 600 | — | text-primary |
| Body | 13–14px | 400–500 | — | text-primary |
| Secondary / description | 11.5–12.5px | 400–500 | — | text-secondary |
| Group label (eyebrow) | 11px | 600 | .05em, UPPERCASE | text-placeholder |
| Badge / pill | 11px | 600 | — | contextual |

Numbers keep `font-variant-numeric: tabular-nums` so figures align in tables.

---

## 3. Spacing & layout

- **Grid gaps:** cards `16px`, dense rows `10px`, inline icon+text `10–13px`.
- **Card padding:** standard `16px`, comfortable `18–22px`, dense rows `11–14px`.
- **Container widths:** settings/forms `max-width:760px`; centered empty states `max-width:1040px`.
- **App shell:** fixed `60px` top bar, `272px` sidebar, scrolling content on `--color-canvas`.
- Always lay siblings out with `display:flex/grid` + `gap` — never margins between items.

---

## 4. Component recipes

### Primary button
`height:38px; padding:0 16px; border:none; border-radius:var(--radius-lg); background:var(--color-primary); font-size:13px; font-weight:600; color:#fff` — hover swaps to `--color-primary-hover`.

### Secondary button
`height:38px; padding:0 15px; border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-surface); font-size:13px; font-weight:600; color:var(--color-text-primary); box-shadow:var(--shadow-ring)`

### Status pill
`font-size:11px; font-weight:600; color:var(--color-success); background:var(--color-success-subtle); border-radius:var(--radius-pill); padding:3px 9px` — swap `success`→`warning`/`danger`/`primary` with matching `-subtle`.

### Colored icon chip
`width:40px; height:40px; border-radius:var(--radius-md); background:<accent at 12–14% alpha>; color:<solid accent>; flex-centered`, holding an 18–20px stroke-1.7 icon. Accent rotation: primary / teal / amber / purple / success — one per category, kept consistent.

### Card
`background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-xl); box-shadow:var(--shadow-card); padding:16px`

### Clickable entry card (settings / directory row)
Whole card is the target: `display:flex; align-items:center; gap:13px; padding:15px; border-radius:var(--radius-lg)`, with `transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease, padding .15s ease`. Hover → `translateY(-2px)`, `border-color:var(--color-primary)`, `box-shadow:0 12px 26px -16px rgba(45,109,255,0.4)`, chevron nudges (`padding-right:11px`). Contains: 36px icon chip (`--color-primary-subtle` / `--color-primary`) + title (13.5px/600) + subtitle (11.5px secondary) + 17px chevron in `--color-text-placeholder`.

### Input field
`height:42px; border-radius:var(--radius-lg); box-shadow:var(--shadow-ring); display:flex; align-items:center; padding:0 13px`, inner `input` at 13.5px.

### Search / command trigger (top bar)
`display:flex; align-items:center; gap:8px; height:36px; padding:0 10px; border-radius:var(--radius-lg); background:var(--color-surface); border:1px solid var(--color-border)` — 15px magnifier + placeholder text + a `⌘K` key badge (`11px/600`, `--color-fill-subtle`, hairline border, `--radius-xs`, `padding:1px 5px`).

### Section label (eyebrow)
`font-size:11px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:var(--color-text-placeholder)`

### Segmented filter chips
Group: `display:flex; gap:4px; padding:4px; background:var(--color-fill-subtle); border-radius:var(--radius-lg); width:fit-content`. Active chip: `background:var(--color-surface); box-shadow:var(--shadow-ring); font-weight:600`. Inactive: `color:var(--color-text-secondary); font-weight:500`.

### Modal
Backdrop `position:fixed; inset:0; background:rgba(15,23,42,0.4)`, centered. Panel `width:520px; border-radius:var(--radius-2xl); box-shadow:0 24px 60px -12px rgba(15,23,42,0.4); overflow:hidden`, split into header (`18px 22px`, bottom hairline, 16px/700 title + × close), body (`20px 22px`), footer (`16px 22px`, top hairline, right-aligned buttons `gap:10px`).

**Rule:** clicking the backdrop closes read-only/confirm modals, but never discards a form-in-progress (require an explicit Cancel there).

### Dark hero card (upsell / tier)
`display:flex; align-items:center; gap:24px; padding:24px; background:var(--color-ink); border-radius:var(--radius-2xl); color:#fff`

### List with dividers (directory / timeline)
Rows separated by `border-bottom:1px solid var(--color-border)` (omit on last). Each row = icon chip + title/subtitle column + right-side status dot or Connect button. Connected rows use an 8px `--color-success` dot with a `0 0 0 3px --color-success-subtle` halo.

### Back link (sub-page → parent)
`inline-flex; align-items:center; gap:7px; padding:5px 10px; border-radius:var(--radius-md); font-size:13px; font-weight:500; color:var(--color-text-secondary)`; hover → `color:var(--color-primary)`, `background:var(--color-primary-subtle)`; 15px left chevron.

---

## 5. Iconography

- **Style:** outline, `stroke="currentColor"`, `stroke-width="1.7"`, round caps/joins, `fill="none"`.
- **Sizes:** 15–16px inline, 18px in chips/rows, 20–22px in large tiles.
- Color comes from the parent (`color:` on the chip). Accent colors for category icons, `--color-text-placeholder` for chevrons/affordances, `--color-text-secondary` for neutral inline icons.

---

## 6. Interaction & motion

- **Transitions:** 150ms for card hover (`transform`, `box-shadow`, `border-color`), 180ms for link background/color, easing `ease`.
- **Hover lift:** `translateY(-2px)` + softened blue-tinted shadow for clickable cards.
- **Focus:** always a visible `2px solid var(--color-primary)` ring at `2px` offset — never remove it.
- **Reduced motion:** honor `@media (prefers-reduced-motion: reduce)` by collapsing durations.
- **Loading:** show a busy label ("Sending…", "Saving…") on one-step submits; keep destructive actions behind a confirm.

---

## 7. Application rules (the "feel")

1. **Neutral canvas, white cards.** Content sits on `--color-canvas`; every surface is a white card with a hairline border and the soft `--shadow-card`.
2. **One blue.** `--color-primary` is the only interactive color — links, primary buttons, active states, focus. Accents (teal/amber/purple/pink) are *decorative* icon tints only, never actions.
3. **Weight over size.** Hierarchy comes from 600/700/800 weights and secondary-gray, not from many font sizes.
4. **Pills for status, chips for filters.** Subtle-tinted pill = state; fill-subtle segmented group = filter.
5. **Everything clickable is a whole target** with hover + focus feedback — no bare text links pretending to be buttons.
6. **Generous but consistent padding**, hairline dividers, and `gap`-based layout throughout.

---

Follow tokens → typography → component recipes → application rules in that order.
