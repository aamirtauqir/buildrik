# Design System — Buildrick

## Product Context
- **What this is:** AI-powered drag-and-drop website builder editor. Three creation modes (drag, templates, AI generate) sharing one element vocabulary.
- **Who it's for:** Solo designers currently billing clients on Webflow or Framer. Time-constrained power users, not beginners.
- **Space / industry:** Designer-grade web builders. Peers: Webflow, Framer, Webstudio. Not peers: Wix, Squarespace, Durable (different wedge).
- **Project type:** Desktop web app with separate marketing site. Editor chrome is the primary surface.

## Surface Scope (which brand applies where)

Buildrick runs on the **Flowbite palette with one brand accent: `#1A56DB`**
(Flowbite blue-700) — founder-confirmed 2026-07-29. Red is reserved for
error/danger/destructive everywhere. This supersedes the `#406ED6` UI-kit
adoption of 2026-07-18 (which superseded cobalt `#2D6DFF`, which superseded the
dashboard's red `#E42313`). See Decisions Log.

**The editor shipped on Flowbite first** (`ds/fresh-token-system`, 2026-07-28):
its entire chrome runs on `--bk-*` tokens GENERATED from the Figma file
(`g4GzQFqzNYz5sosz1QtZXC` → `scripts/tokens/figma-tokens.json` →
`packages/editor/src/themes/tokens.generated.css`). Palette changes are made in
Figma and regenerated — never hand-edited. Dashboard, auth and onboarding
**migrated 2026-07-30** (Tailwind-native route: `flowbite-react` +
`@plugin "flowbite-react/plugin/tailwindcss"` in `app/globals.css`; token
values mirror `tokens.generated.css`).
(The user-facing site-builder default tokens in `editor/design-system/` stay
their own palette — that is user output, not chrome.)

| Surface | Lives in | Accent | Display font | Body font | Audience |
|---|---|---|---|---|---|
| **Editor chrome** (canvas + sidebars + topbar + inspector) | `packages/editor/` | **`#1A56DB`** (generated `--bk-*` DS; SHIPPED 2026-07-28) | Inter | Inter | Power user mid-flow. Quiet. |
| **Dashboard chrome** (settings, billing, team, sites list, media, home) | `app/dashboard/`, `app/maintenance/`, 404, share | **`#1A56DB`** (dc tokens on Flowbite palette; migrated 2026-07-30) | Inter | Inter | Signed-in workspace tasks. |
| **Auth chrome** (signed-out craftwork) | `app/auth/` | **`#1A56DB`** + art rail (migrated 2026-07-30) | Inter Tight | Inter Tight | New visitor / signed-out. |
| **Onboarding wizard** | `app/onboarding/` | **`#1A56DB`** (migrated 2026-07-30) | Inter | Inter | Post-verification setup. |
| **Marketing site** (separate repo) | n/a in this repo | Own brand; not governed here | General Sans | Inter Tight | Cold traffic. |

**Why one accent:** editor, auth, and dashboard are one continuous signed-in-adjacent product; a single blue accent reads as one brand. The `#406ED6` vs `#1A56DB` split closed 2026-07-30 — every surface now runs `#1A56DB`.

Rules:
- **`#1A56DB` is the single accent** for CTAs, links, active states and focus rings. (Hover `#1E429F` blue-800, pressed `#233876` blue-900, subtle `#E1EFFE` blue-100, tint `#EBF5FF` blue-50.)
- **Red means error/danger/destructive only** (delete confirm, FAILED status, validation, over-limit, dunning) — on every surface. Never a red CTA or accent.
- Purple/violet/indigo remain **banned as accents** (AI-slop guard) — never on CTAs, links, focus, or active states, and never as gradients. Two data-colour allowances: (1) third-party *brand* colours on Marketplace app tiles (`lib/marketplace-catalog.ts`, user-approved 2026-07-18); (2) the Flowbite **purple ramp as identity/semantic data** — avatar identity tones (tone derived from user id) and the PRO badge (`--bk-purple-*`, founder-confirmed with the palette 2026-07-29).
- The **NO BLACK RULE** below applies to **editor chrome only**. Dashboard may use `#0D0D0D` for primary text.

### Auth Surface — Craftwork (2026-07-10)

The **`app/auth/**` screens** (login, signup, 2FA, OTP, magic-link, forgot/reset, verify-email, workspace, invite, error/state screens) run a distinct **craftwork** visual language on the shared cobalt accent.

- **Accent = `#1A56DB`** (`--color-auth-cta`, hover `#1E429F`; migrated 2026-07-30). Same accent as the rest of the product; the craftwork treatment below is what's auth-specific.
- **Art rail** — a two-column floating white card (`AuthCard`) with a cobalt illustration (`AuthArt`) left, form right. The "no gradients / no decorative illustration" aesthetic rule does **not** apply to the auth art rail; it still applies to the rest of the dashboard.
- **Gray-fill icon inputs** — `--color-auth-input-fill`, left icon, cobalt focus.
- Source of truth: `app/globals.css` `--color-auth-*` tokens + `components/auth/*`.

**Full-bleed white + compact controls (user 2026-07-15).** Supersedes the 1000×620-floating-card + `#ECECEE`-tint decision below. The **art screens fill the whole viewport** — the card is `w-full` × `min-h-auth-shell-min` (`--spacing-auth-shell-min: 100dvh`), edge-to-edge, **no radius, no shadow**: it *is* the surface, a 50/50 split with the art rail full-height on the left and the white form pane on the right. Page + card are white (`--color-auth-page: #FFFFFF`), `--container-auth-shell: 100vw`. Controls shrank to **input 40px, button 42px** (`--spacing-auth-input` / `--spacing-auth-btn`). The `app/auth/layout.tsx` wrapper dropped its `px-4 py-8` so the card reaches the edges. The transient **`noArt` spinner screens stay a small centered card** (`max-w-[460px]`, radius + shadow, `my-8`) — they are the *only* auth path that is still a floating card. Tokens live in `globals.css`; the art-vs-noArt split lives in `components/auth/auth-card.tsx`.

**Frame parity (2026-07-13).** Rebuilt against the M1 craftwork gallery (52 frames). The card is **1000×620, radius 24, art rail left** — it is *not* full-bleed; it was briefly flattened to `fixed inset-0` and that dropped the card on every art screen. Inputs 52px, buttons 50px, titles 18.5px. Craftwork ink is **near-black** (`#0A0A0B` titles, `#111113` body/links), muted `#6B6B70` — not slate. Error red is `#E5484D` (border) / `#C0343A` (text). `FormBanner` is a **borderless tinted chip** (9% fill), not a bordered alert box.

- **The gallery's intro prose is stale** — it claims a black Google button, gray-fill inputs and form-on-the-left. The frames themselves show a cobalt Google button, blue-fill inputs and art-on-the-left. Trust the frames.
- **Deliberate deviations from the frames** (user-confirmed 2026-07-13): sign-in keeps the **GitHub button** and the **"Remember me"** checkbox. The frames omit both, but GitHub OAuth is live and `rememberMe` really drives session lifetime — dropping the checkbox would silently pin every session short.
- **Not implemented, by design:** the frames' "N attempts remaining" counters. Login/2FA errors are generic *on purpose* to deny a user-enumeration oracle; surfacing counts would reverse that. Likewise the lockout countdown, workspace site counts and the device-alert Device/Location/Time table have no backing data (the device fingerprint is a one-way hash). Do not fabricate them.

### Onboarding Surface — M2 Wizard (2026-07-11; scoped exception RETIRED 2026-07-18)

The **`app/onboarding/**` wizard** (post-verification setup: workspace → first site → path chooser → AI/template/blank → editor) **no longer runs a scoped blue.** It now uses the single product accent `#1A56DB`, like the dashboard and auth. History: it shipped on `#2563EB`, was flipped to cobalt `#2D6DFF` on 2026-07-18 to match the v3 frame gallery, moved to `#406ED6` with the UI-kit adoption the same day, and to `#1A56DB` with the Flowbite migration 2026-07-30. The `.onb-scope` focus-ring override was removed with the exception — there is nothing left to scope.

- Accent = `--color-onb-primary` `#1A56DB` (hover `#1E429F`, tint `#EBF5FF`; migrated 2026-07-30). Primary CTAs, active stepper dot, progress fill, selected cards, links inside onboarding.
- Full token set: `--color-onb-*` + `--radius-onb` / `--spacing-onb-*` / `--container-onb` / `--text-onb-*` in `app/globals.css`. Inter type scale (titles 26/700).
- The `--color-onb-*` token set still exists and still owns onboarding's geometry/neutrals/type; only the accent stopped diverging. The global `*:focus-visible` ring resolves to `--color-primary`, which onboarding now shares, so one blue is on screen without any scoping.
- **The accent is the only thing that diverges from the M2 frame gallery.** Geometry, neutrals, and type are taken from it literally: 180px header (brand tile 48/40, Skip 48/46, step indicator at 92), 480px content column, 46px inputs, 50px CTA (15px/700).
- Text is slate, not black: `onb-text` `#334155` is the darkest tone (titles, labels *and* body). There is deliberately **no** near-black `onb-ink` token — it was removed 2026-07-13 as a duplicate.
- Inputs are **filled, not outlined**: `onb-field` `#EAF1FF` on a 1px `onb-field-ring` `#D3E1FF` inset ring; the error state drops to a white fill with a 1.5px `onb-error` ring. Rings are inset shadows so state changes never shift layout.
- One button only (`OnbButton`, primary fill). Secondary actions are `OnbBack` text links (13px/600, muted → text on hover).

## Dashboard Shell + Design System (2026-07-12)

The dashboard is built as ONE system, not per-screen markup. Enforced by a shell + a primitive layer + a token contract (see `packages/dashboard/components/dashboard/shell/`, `…/primitives/`, `app/globals.css`).

**Two-level shell** (`DashboardShell`):
- **Top nav** (full-width, `--topnav-h: 60px`): brand · the five product areas `Dashboard · Marketplace · Learn · Resources · Templates` (Templates joined the ecosystem top nav 2026-07-21) · ⌘K search · notifications · help · workspace switcher (`Plan · N seats` in mono) · account. These five areas live ONLY in the top nav.
- **Sidebar** (`--sidebar-w: 293px`, below the top nav): workspace/operational destinations only — IA v2 (2026-07-17) trimmed 19 items to 6 + 2; the 2026-07-21 follow-up dropped the Support group and settled the sidebar at a single **6-item** group: `Home · Getting started · Sites · Agency (agency-only) · Media · Settings`. There is **no Support group** — Getting started sits in the main group, and Help centre moved into Resources (a top-nav ecosystem area), not the sidebar — and the former `Projects` item is now labelled **Sites** (route stays `/dashboard/projects`). SSOT is `components/dashboard/shell/nav.ts` (`NAV_GROUPS`); mobile tab bar and the ⌘K palette's nav entries derive from it. Agency tabs (Clients · Reviews · Shared theme · Partner) and the Settings rail (WORKSPACE / PLATFORM / BILLING / PERSONAL + Danger) live inside their sections, not in the sidebar. Never repeats the top-nav areas.

**Token contract** (`globals.css @theme`): radius scale `--radius-xs 4 / sm 6 / md 8 / lg 8 / xl 12 / pill` (lg 10→8 with the Flowbite migration 2026-07-30); `--font-mono` Geist Mono + `tabular-nums` for **tabular data** (counts, $, sizes, seats, dates — via `MetricValue`) — **hero stat metrics may use the display font (Inter Tight)**, as the dc artifact does; consistency within a surface matters more than mono everywhere. Named text tokens `--text-page-title 24 / section 15 / eyebrow 11 / body 14 / body-sm 12` (one ramp — Tailwind's `text-sm`/`text-xs` are swept out of the dashboard) are **preferred** (hero stat metric renders at the artifact's 27px in `StatCard`), but **artifact-matched pixel values** (`text-[13.5px]`, `font-[520]`) are allowed when matching a mockup 1:1. Depth is hairline borders + subtle card shadow (`shadow-card`), not heavy elevation.

**Primitives** (`components/dashboard/primitives/`, use these — do NOT hand-roll): `PageHeader`, `SectionCard`, `StatCard` (+ `visual`/`href`), `DataTable`, `Pill` (tones neutral/success/warning/error/accent), `ProgressBar`, `MetricValue`. Screens compose primitives; they don't style surfaces directly. Data-viz helpers (donut/sparkline/avatars) live in `dataviz.tsx`.

These primitives are **compositions of Flowbite, not an alternative to it** — the dashboard's UI system is Flowbite (`packages/dashboard/AGENTS.md` §UI system). Precedence: primitive → `flowbite-react` directly → a new primitive built from flowbite-react. Six of the thirteen already compose flowbite (button, data-table, modal, pill, progress-bar, …); the raw-markup ones are a drain target, not the pattern. So "do NOT hand-roll" and "Flowbite first" say the same thing: a screen should never reach raw HTML for a control.

**Explicitly allowed on the dashboard** (2026-07-18 — the editor-chrome
[Anti-Slop Rules](#anti-slop-rules--editor-chrome-only-enforce-in-qa-and-code-review)
do NOT apply here):
- **Elevation shadows on cards** — `shadow-card` / `shadow-card-hover` on stat, section, table and app cards. Depth is hairline border + soft shadow, not flat-only.
- **Ink surfaces** — `--color-ink` `#111827` (Flowbite gray-900 since 2026-07-30; was `#141924`) for hero/featured cards and filled pills (e.g. the Marketplace featured card and its active filter chip). The NO BLACK RULE is editor-chrome only.
- **Per-app brand tile colours** — third-party branding on Marketplace/Apps tiles, sourced from `lib/marketplace-catalog.ts`. These are illustrative data, not accents; cobalt stays the only accent for CTAs, links, focus and active states.
- **Multi-column card grids with coloured icon tiles** — the Marketplace/Apps grid is exactly this shape and is intended.
- **A named font fallback** — the dashboard sets `'Inter', 'Inter Tight', sans-serif` on the shell root so Inter is scoped to the dashboard while auth/onboarding/editor keep Inter Tight.

## Aesthetic Direction
- **Direction:** Industrial / Utilitarian, **light chrome**. Premium tool, not premium marketing. "Webflow meets Linear, daylight edition."
- **Decoration level:** Minimal. Surfaces communicate depth through layered warm neutrals and hairline borders. No gradients, no blobs, no grain, no decorative texture, no shadows beyond subtle elevation on modals.
- **Mood:** A calm, daylit studio. The chrome steps out of the way so the canvas (the user's actual work) is the loudest thing on screen. Confidence without showmanship.
- **Reference points (in-distribution, not copied):** Linear light mode, Vercel dashboard, Notion, Arc browser toolbar. Not: Figma (too colorful in chrome), Canva (too soft).

## **NO BLACK RULE** — enforce in code review

The editor chrome contains **zero pure-black or near-black surfaces**. This is the single most important visual rule after the accent rule.

- No `#000`, `#0a0a0a`, `#14141f`, `#1F2937` (near-black navy), or any hex with all three RGB channels under `0x35` as a surface, background, or fill.
- Text can be dark — darkest allowed is `#334155` (slate-700) — but never `#000` or `#1F2937`.
- Account avatar, context menus, tooltips all follow this. The legacy `#1F2937` avatar pill is replaced by cobalt-on-white.
- Icons inherit `currentColor` from the text scale. No independent "icon-only dark tone."

If you are tempted to reach for black for emphasis, use `--accent` (cobalt) instead. It carries the same weight without violating the rule.

## Typography

**No system fallbacks. No `system-ui`. No `-apple-system`. No `Roboto`, `Helvetica`, `Arial`, `Segoe UI` named in any stack.**

- **Display / Hero (marketing site only):** `General Sans` (Fontshare). 600–700 weight for hero copy.
- **Body + Editor UI + Dashboard (primary workhorse):** `Inter`. The editor chrome moved from Inter Tight to Inter on 2026-07-26 with the DS replacement — the Figma foundation ("Buildrick — Product", `g4GzQFqzNYz5sosz1QtZXC`) sets every ui/* style in Inter. Used for every label, button, input, breadcrumb, panel title, row label in the editor.
- **Data / Inspector values / mono content:** `Geist Mono` with `font-variant-numeric: tabular-nums`. Required for dimensions, timestamps, slugs, file sizes, page counts.
- **Loading:** Bunny Fonts CDN with `font-display: swap` in dev. Self-host in production. No `@font-face` redefinitions in individual components.
- **Auth/onboarding:** still on `Inter Tight` until their own reskin lands; Geist Mono remains the data face everywhere.

**Canonical CSS (editor chrome):**

```css
/* Generated from Figma — src/themes/tokens.generated.css. Do not hand-edit:
   change the Figma text style, re-export figma-tokens.json, regenerate. */
--bk-font-ui:   "Inter", "Inter Tight", sans-serif;   /* Inter Tight = transition fallback only */
--bk-font-mono: "Geist Mono", "SF Mono", Menlo, Consolas, monospace;
```

*(This block named `--buildrick-font-family` until 2026-08-03. That namespace is
banned — Gate 15 rejects any `--buildrick-*` / `--bd-*` chrome token definition —
so following the doc produced a build failure. The `ui` stack also carried
`-apple-system, BlinkMacSystemFont, "Segoe UI"`, which is what the rule directly
above this block forbids; removed from the token source the same day.)*

**Type ramp (Figma "Type — 11 styles"):** ui/11 caption (11/16, 500) · ui/12 small (12/16) · ui/13 row label (13/20, 400/500) · ui/14 panel title (14/20, 600) · ui/16 heading (16/24, 600, −0.06em) · ui/20 heading lg (20/28, 600) · ui/24 title (24/32, 600) · data/11–13 in Geist Mono. **Weights cap at 600 — no 700 anywhere in chrome.** Editor chrome lives mostly at 12–14. Panel/drawer headers = 11/500 UPPERCASE ink-soft.

## Color — the Flowbite palette (founder-confirmed 2026-07-29)

**Approach:** Restrained. **One accent (Flowbite blue-700). All other color is
Flowbite gray neutral.** Color is rare and meaningful. Every value below IS the
live generated token (`packages/editor/src/themes/tokens.generated.css`) —
change it in Figma, re-export, regenerate; never edit values in code or in this
doc alone.

### Surfaces (light depth, Flowbite grays)

```
--bk-bg-app:      #F3F4F6   /* gray-100 — shell/canvas backdrop, rail */
--bk-bg-panel:    #FFFFFF   /* panels, drawers, inspector */
--bk-bg-subtle:   #F3F4F6   /* gray-100 — search fields, hover fills */
--bk-bg-card:     #FFFFFF   /* cards, list rows, inputs, popovers */
--bk-bg-elevated: #FFFFFF   /* modals, dropdowns, command palette */
```

Depth is communicated by nesting + hairline borders, not heavy shadows. The
elevation scale is exactly three steps: `raised 0 1px 2px rgba(0,0,0,.08)`
(knobs, chips) · `drag 0 4px 6px rgba(0,0,0,.10)` (picked-up state, menus,
popovers) · `overlay 0 10px 15px rgba(0,0,0,.10)` (modals, command palette,
floating drawers).

### Borders (Flowbite grays)

```
--bk-border:         #E5E7EB   /* gray-200, default hairline */
--bk-border-medium:  #D1D5DB   /* gray-300, inputs + buttons */
--bk-border-input:   #9CA3AF   /* gray-400 */
--bk-border-strong:  #9CA3AF   /* gray-400, hover */
```

Focus = accent border + `--bk-shadow-focus: 0 0 0 2px rgba(26,86,219,.30)` —
a soft 2px accent ring, the Flowbite focus language at editor density.

### Text — the ink scale (no pure black, ever)

```
--bk-ink:          #111827   /* gray-900 — primary text */
--bk-ink-soft:     #4B5563   /* gray-600 — secondary labels, panel headers */
--bk-ink-muted:    #6B7280   /* gray-500 — captions, counts, footer */
--bk-ink-disabled: #D1D5DB   /* gray-300 — visibly inert */
--bk-accent-on:    #FFFFFF   /* white on accent surfaces */
```

### Accent (single blue — the guard against a second blue)

```
--bk-accent:         #1A56DB   /* blue-700 */
--bk-accent-hover:   #1E429F   /* blue-800 */
--bk-accent-pressed: #233876   /* blue-900 */
--bk-accent-text:    #1A56DB   /* accent-colored text on light */
--bk-accent-subtle:  #E1EFFE   /* blue-100 — selected-row fill, PRE-MIXED */
--bk-accent-tint:    #EBF5FF   /* blue-50 — badge/pill fill, PRE-MIXED */
--bk-accent-on:      #FFFFFF   /* text on accent buttons */
```

**Tint rule:** semantic and accent tints are pre-mixed opaque values — never
frame/alpha opacity. Alpha survives only where transparency is the point
(scrims, canvas overlays, shimmer, the focus ring).

**Usage rules:** accent appears on (a) the one primary CTA per screen, (b) selection outlines and selected-row tint, (c) active rail/tab indicator, (d) focus rings, (e) the account avatar. Nowhere else. Avatar identity tones and the PRO badge may additionally use the Flowbite purple ramp (`--bk-purple-*`) — identity/semantic data, not an accent.

### Semantic (fill / text / tint triads — Flowbite, WCAG AA, tints pre-mixed)

```
--bk-success: #0E9F6E   --bk-success-text: #057A55   --bk-success-tint: #DEF7EC
--bk-warning: #C27803   --bk-warning-text: #723B13   --bk-warning-tint: #FDFDEA
--bk-error:   #E02424   --bk-error-text:   #C81E1E   --bk-error-tint:   #FDE8E8
--info:       = accent (blue family — one blue)
```

Fill = dots/icons/borders. Text = labels on the matching tint. Tint = the chip/badge background. Use for status indicators only (save state, validation, toasts). Never for decoration.

## Spacing
- **Base unit:** 4px.
- **Density:** Compact. Designers want screen real estate.
- **Scale:** 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Layout
- **Editor:** Grid-disciplined. Topbar (56px) / Left rail (60px) / **Drawer 320px — all six panels** / canvas (flex) / **right inspector 300px**. *(Corrected 2026-07-19: read "240 nav / 320 authoring" and "inspector 320px". Both were the previous IA and both were outside the supersede banner below, so they read as live. The canonical source for every chrome dimension is `docs/designs/2026-07-18-editor-shell-wireframes.md` — this line exists only so it does not contradict it.)*
- **Border radius scale (Flowbite):** `sm: 4px` (row corners, small chips), `md: 6px` (icon tiles, compact controls), `lg: 8px` (buttons, inputs, panels, cards, modals — Flowbite rounded-lg), `full: 9999px` (pills, avatars).
- **Topbar height:** 56px — canonical. All other chrome heights flow from this rhythm.
- **Panel header height:** 44px — matches sidebar contract.

## Motion
- **Approach:** Minimal-functional. Only transitions that aid comprehension.
- **Easing:** house curve `cubic-bezier(0.2, 0, 0, 1)` (ease-out) for enter/hover; `ease-in` for exit.
- **Duration (Figma motion tokens, 2026-07-26):** hover/press `100ms` (fast), panel/drawer `160ms` (base), modal/overlay enter `240ms` (slow). No spring physics. No scroll choreography. No entrance animations on first paint. No hover lifts/scales — the design moves color, not geometry.
- **Reduced motion:** respect `prefers-reduced-motion: reduce` — disable all non-essential transitions.

## ⚠ Editor layout sections — SUPERSEDED 2026-07-18

**The sections from "Sidebar Panel System" through "Rail Rules" describe the PREVIOUS editor IA.**
They document an 11-tab sidebar, a 3-zone rail (Creation/Structure/Config), an 8-tab Composition
Map including Templates · Settings · History, and the old `A/T/M/Z/P/⇧A/D/S/U/H` shortcut map.
**None of that is the editor being built.** A designer who follows them builds the previous product.

The live editor layout is:

| Concern | Now |
|---|---|
| Rail | **6 flat tool icons**, no zones, frequency-ordered: Insert · Layers · Pages · Media · Content · Brand |
| Retired from the rail | Templates (dissolved into the New-Page flow + Insert) · AI (⌘K + canvas selection toolbar) · Settings & Publish (the separate Site full-page) · History (the save-status pill → Versions) |
| Comments | a canvas **mode** (💬, key `C`), not a panel |
| Shortcuts | `A` Insert · `P` Pages · `L` Layers · `M` Media · `D` Content · `B` Brand · `C` comment · `⌘P` preview · `⌘K` palette |
| Panel width | **320 for all six** (declared override of the 240/320 Width Rule below — 240 cannot hold the Pages SEO table or a deep Layers tree) |

**Authoritative layout specs — build from these, not from the sections below:**
- `docs/designs/2026-07-17-editor-product-redesign-complete.md` **§4.3** — the placement map (what goes where)
- `docs/designs/2026-07-18-editor-shell-wireframes.md` — dimensions, states, drawer spec, z-index, empty states, device frames
- `docs/designs/2026-07-18-site-fullpage-wireframes.md` — the Site full-page area
- `docs/prd/editor/14-screen-specs.md` — per-screen specs

**What in DESIGN.md still holds and is still SSOT:** every *value* — colour, typography, spacing scale, motion timings, row density (28h dense / 32h standard), the NO BLACK rule, accent, semantic colours, token namespace, chrome axioms, anti-slop rules, accessibility. Only the *layout* sections below are stale.

*Note: these sections already contradict each other — "11 rail-visible tabs" at Sidebar Panel System vs "Composition Map — 8 Tabs" — which is part of why they should not be built from.*

---

## Sidebar Panel System

The left sidebar has 11 rail-visible tabs as of 2026-05-24 (Add/elements,
Templates, Media, Layers, Pages, Components, Settings, History, plus AI,
Build, Publish). Every panel composes the same primitives. Every tab is the
same machine with different cargo.

Original spec listed 8 tabs (Add/Templates/Media/Layers/Pages/Components/Settings/History).
"Add" renamed to "elements". AI/Build/Publish added since the 2026-04-16 spec.

### Grammar — panel zones (was TabFrame; PanelShell before that)

```
Panel
├── PanelHeader        (44px, required)   title · subtitle · actions · close
├── Toolbar            (36px, optional)   search · filters · primary action
├── Content            (flex, scrollable) 12px padding · 4px gap rhythm
└── Footer             (32px, optional)   selection count · batch actions · status
```

**`TabFrame` no longer exists as a component** (it lived at
`src/shared/extensions/TabFrame.tsx`, deleted 2026-07-28 with `shared/extensions/`).
The four zones are still the grammar, now composed from `@/editor/chrome-ui`:
`PanelHeader` (44px, `chrome-ui/PanelHeader.tsx`), `Toolbar` (36px), the panel's
own scroll container, and `Footer` (32px, `chrome-ui/Footer.tsx`) — drill-in
panels swap the header for `sidebar/shared/DrillInHeader`. What survives of the
old name is comments and a few `bd-*` class prefixes.

Pre-2026-05 name `PanelShell` + `ps-*` classes are dead — drained during sidebar
header canonicalization (commits `0a2410a4`..`f9377302`).

### Width Rule

| Width | Mode | Tabs | Purpose |
|-------|------|------|---------|
| **320px** | drawer | every drawer panel | One drawer width, one token: `--bk-size-drawer: 320px`. |
| **Fullpage** | surface | Templates, Media, Settings, Design | Grids, forms, token editors. |

*(A 240px "nav mode" row sat here until 2026-08-03, contradicting §Layout above
— which already said "Drawer 320px — all six panels" — and the shipped shell,
which resolves `--layout-drawer-width` from the single 320 token. The matching
`SIDEBAR_W = 240` constant had no consumers left.)*

### Row Density

| Height | Use | Typography |
|--------|-----|-----------|
| **28px** | Layers tree, dense lists | 12px label |
| **32px** | Standard list rows | 13px label |
| **48px** | Cards with metadata | 13px + 11px mono meta line |

Never 40px. Desktop power users want density.

### Content Rules

1. **Numeric values use Geist Mono + `tabular-nums`.** Page counts, file sizes, timestamps, version numbers, dimensions, slugs.
2. **Icons only where they disambiguate.** Labels carry.
3. **No category-colored accents.** Category is grouping + label, not hue.
4. **Hover is quiet.** `background: var(--accent-subtle)` or `background: var(--aqb-bg-subtle)`.
5. **Selection is cobalt-tinted.** `background: var(--accent-tint)`, `color: var(--accent)`.
6. **Empty states are typographic.** 13px muted title, 12px tertiary body, one primary action. No illustrations.

### Composition Map — 8 Tabs (light chrome)

| # | Tab | Width | Header | Toolbar | Content | Footer |
|---|-----|-------|--------|---------|---------|--------|
| 1 | Add | 320 | "Add" | search + category chips | 48px element cards, 2-col | — |
| 2 | Templates | fullpage | "Templates" | search + category tabs | thumb grid, 3-col | — |
| 3 | Media | fullpage | "Media Library" | tabs + search + "+ Upload" | thumb grid, 4-col | batch |
| 4 | Layers | 240 | "Layers" | search | 28px tree rows | — |
| 5 | Pages | 240 | "Pages" | search + "+ New" | 32px rows + mono slug | status |
| 6 | Components | 240 | "Components" | search + "+ New" | 32px rows + mono usage | — |
| 7 | Settings | fullpage | "Settings" | — | nav + form | save/discard |
| 8 | History | 320 | "History" | search + filter | 32px timeline rows | status |

### Rail Rules

Rail is 60px, `--aqb-bg-panel` (`#F8FAFC`), three zones (Creation / Structure / Config) separated by `--aqb-border` hairlines. Active button has a 3px cobalt left bar AND `--accent-tint` background. Every tab has a rail button — Design and Publish get buttons (previously keyboard-only).

## Anti-Slop Rules — **editor chrome only** (enforce in QA and code review)

> **Scope, set 2026-07-18.** These rules govern the **editor chrome** (rail, panels,
> inspector, canvas chrome) — they were written alongside the Rail/Composition specs
> above. They are **not binding on the dashboard**, which follows the dc/Figma design
> language (see [Dashboard Shell + Design System](#dashboard-shell--design-system-2026-07-12)
> for what it explicitly allows). Previously this list sat at top level and read as
> global, which put it in direct conflict with shipped dashboard code (card shadows,
> ink hero surfaces, brand-coloured app tiles, multi-column card grids). The doc was
> wrong, not the code. Auth and onboarding follow their own scoped sections.

1. **NO black or near-black surfaces.** No `#000`, `#14141f`, `#1F2937`. Primary text caps at `#334155` slate-700.
2. No purple, violet, indigo gradients. Ever.
3. No 3-column feature grid with icons in colored circles.
4. No centered-everything sections.
5. No decorative blobs, wavy SVG dividers, floating circles.
6. No emoji as design elements.
7. No colored left-border card treatment.
8. No default font stacks. No specific named fallbacks (`Helvetica`, `Arial`, `system-ui`).
9. Cards earn their existence. If it's not interactive, don't wrap it in a card.
10. No shadows on flat surfaces. Depth is hairline borders + warm neutral layering. Only modals get elevation shadow.
11. No category-colored accents (e.g., `--media-img: #3b82f6`). One accent only.
12. No per-row action strips. Actions live in hover-reveal overflow menus.

## Accessibility

- WCAG AA minimum on all body text. Primary text on panel: 11.6:1 (AAA). Secondary: 7.0:1 (AAA). Muted: 3.7:1 (AA large).
- Keyboard navigable. Global: `⌘K` (command palette), `⌘Z` / `⌘⇧Z` (undo/redo), `⌘P` (preview). Rail: `A / T / M / Z / P / ⇧A / D / S / U / H` per tab shortcut.
- Touch targets ≥ 44×44 on marketing site (editor is desktop-only).
- ARIA landmarks on main editor regions (topbar, rail, sidebar, canvas, inspector).
- Respect `prefers-reduced-motion: reduce` — disable all non-essential transitions.

## Implementation Notes

- **Chrome tokens** are GENERATED: `packages/editor/src/themes/tokens.generated.css` (+ `.ts`), produced from `scripts/tokens/figma-tokens.json` by `node scripts/tokens/generate.mjs`. Hand-editing either generated file fails `gate:tokens-generated`. `themes/design-system/` now holds three files only — `design.css` (the customer's site-builder tokens), `a11y.css`, `index.css`. (This line described an 11-file DS V1 split until 2026-08-03; that split was replaced 2026-07-28.)
- `themes/default.css` is the stable public import path — it aggregates `design-system/index.css`, `tw.css` (Tailwind utilities, `tw:` prefix), `chrome-reset.css` and `legacy-components.css` (the residual engine selectors; `components.css` was renamed to that 2026-05-07).
- **Chrome consumers use `var(--bk-*)` only** — inside `tw:`-prefixed Tailwind utilities or a feature `.css` file. Defining a `--buildrick-*` or `--bd-*` CHROME token is rejected by Gate 15, so the previous wording here (`var(--buildrick-*)` "in Emotion `styled()`") described a build failure: Emotion is retired for chrome and that namespace is dead. The customer's site tokens keep `var(--buildrick-design-*)` — different audience, different contract. (Corrected 2026-08-03.)
- For JS-level reads (canvas drawing, color math), use the `getToken(name)` helper from `shared/utils/tokens.ts`.
- Inline `style={{}}` is for runtime-computed values only (drag positions, transforms, a swatch whose fill IS the value). Everything static is a `tw:` utility — `gate:styling-ratchet` counts what is left and may only go down. Colours inside a dynamic inline style use `var(--bk-*)` for chrome, `var(--buildrick-design-*)` for customer output.
- `packages/editor/src/editor/design-system/constants.ts` is the JS source-of-truth for the user-editable `--buildrick-design-*` tokens (moved out of `src/features/` when that single-tenant folder was deleted 2026-05-03). Values match `themes/design-system/design.css` baseline (verified by `scripts/verify-design-baselines.mjs`).
- Marketing site uses the same token system. Keep naming consistent.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-30 | **Dashboard/auth/onboarding Flowbite migration SHIPPED (Tailwind-native)** | Closes the 2026-07-29 "pending Flowbite migration" for the three Next.js surfaces. `flowbite-react` installed in `packages/dashboard`; `@plugin "flowbite-react/plugin/tailwindcss"` wired in `app/globals.css` (no prefix — no customer canvas in the dashboard, so Tailwind preflight is fine). All `@theme` token VALUES flipped to the canonical Flowbite set mirrored from the editor's `tokens.generated.css`: accent `#1A56DB`/`#1E429F`, subtle `#E1EFFE`, tint `#EBF5FF`; neutrals → Flowbite gray (`#111827`/`#4B5563`/`#6B7280`, borders `#E5E7EB`/`#D1D5DB`, bg `#F3F4F6`); semantic triads → Flowbite green/yellow/red (`#0E9F6E`/`#C27803`/`#E02424` + tints); destructive `#9B1C1C`. Token NAMES (`--color-*`, `auth-*`, `onb-*`) unchanged — consumers untouched. Inline old-palette hexes swept in 10 files (review-client, editor-route skeleton/boundary, templates, learn, domains, cancel-modal, ticket-form, review-invite email, workspace-form DEFAULT_ACCENT). Primitives' internals move to flowbite-react components in the same arc (keeper rule: primitive API stays, paint changes). |
| 2026-07-29 | **Flowbite palette CONFIRMED as the product design language; accent → `#1A56DB`** | Founder confirmed the Flowbite re-base of the Figma foundation (2026-07-28) as final. Single accent moves `#406ED6` → **`#1A56DB`** (blue-700; hover blue-800 `#1E429F`, pressed blue-900 `#233876`, subtle blue-100 `#E1EFFE`, tint blue-50 `#EBF5FF`). Neutrals move slate → Flowbite gray (ink `#111827`/`#4B5563`/`#6B7280`); semantic triads → Flowbite green/yellow/red; radius lg 8px (rounded-lg) on buttons/inputs/cards/modals; focus = accent border + soft 2px ring `rgba(26,86,219,.30)`. Purple ramp allowed as identity/semantic data only (avatar tones, PRO badge) — still banned as accent/gradient. **Editor SHIPPED on this** via `ds/fresh-token-system` (generated `--bk-*` tokens + `src/editor/ui/` library, migration 402→0). Dashboard/auth/onboarding stay on `#406ED6` pending their Flowbite migration (Tailwind-native route expected). Values in this doc's §Color are transcriptions of `tokens.generated.css` — Figma is the source of truth. |
| 2026-07-26 | **Editor chrome DS replaced with the Figma "Buildrick — Product" foundation** | Founder-directed replacement (Figma file `g4GzQFqzNYz5sosz1QtZXC`): the editor's token layer was rewritten from the file's Foundations page and all 173 shipped components. Concrete flips: editor UI font Inter Tight → **Inter**; accent shades corrected (hover `#2E56B8` — was lighter `#5E86E0`; pressed `#264899`); accent/semantic tints became **pre-mixed opaque** values (`accent-subtle #EBF1FF`, `accent-tint #ECF0FB`, success/warning/error tints `#E3F4E9/#FAECDC/#FBE5E5`) per the Figma "never frame opacity" rule; text ramp darkened onto the ink scale (`#0F172A/#485465/#656F7E`); elevation collapsed to the 3-step raised/drag/overlay scale; focus = 2px accent with **no halo**; motion re-based to 100/160/240ms ease-out with hover lifts/scales retired; weights cap at 600. Legacy token names survive only as references onto the new set — no legacy value survives. Conformance locked by `figma-32-2-conformance.test.ts` (rewritten against the new file). |
| 2026-07-21 | **Dashboard IA follow-up — Templates → top nav, Help → Resources, Projects → Sites** | Post-IA-v2 cleanup (Codex dashboard audit): Templates moved out of the sidebar into the ecosystem top nav (it's a browse-the-catalog surface, not a workspace destination); the labeled Support group was dropped — Getting started folds into the main sidebar group and Help centre moves into Resources; the `Projects` sidebar item was relabelled **Sites** (route unchanged, `/dashboard/projects`). Sidebar settles at a single 6-item group `Home · Getting started · Sites · Agency (agency-only) · Media · Settings`. SSOT `components/dashboard/shell/nav.ts` reflects this; the shell bullets above were updated to match. No accent/token change. |
| 2026-07-18 | **Single accent → `#406ED6` (UI kit); onboarding's scoped blue retired** | Founder adopted the supplied UI kit (`docs/design/dashboard-ui-kit.md`) over the cobalt reskin values, and chose to flip auth + onboarding with the dashboard so the kit's "one blue" rule (§7.2) actually holds. `--color-primary`, `--color-auth-cta` and `--color-onb-primary` all → `#406ED6` (hover `#2E56B8`); `--color-nav-label-active` → `#2E56B8`. The `.onb-scope` focus override and the short-lived `.dash-scope` override were both deleted — with one accent there is nothing to scope, and the global ring now resolves to `--color-primary`. Supersedes the 2026-07-12 RED→COBALT unification for these three surfaces. **Editor chrome remains cobalt `#2D6DFF`** in its own `--buildrick-*` DS (separate token contract + CI gates) and is a pending migration — until it lands, editor and app chrome differ. |
| 2026-07-18 | **Anti-Slop Rules scoped to editor chrome; dashboard allowances made explicit** | The 12 anti-slop rules sat at top level and read as global, but were written alongside the editor Rail/Composition specs. As global rules they contradicted shipped dashboard code on four counts — card elevation shadows (#10), the ink `#141924` featured surface and filter chip (#1), per-app brand tile colours (#11), and the multi-column grid of coloured icon tiles (#3) — and the Dashboard section already prescribed `shadow-card`, so the doc contradicted itself. Rules retitled editor-chrome-only; the dashboard section now lists what it explicitly allows. The editor keeps the guard (light chrome / no-black is a real decision there). Cobalt remains the single accent everywhere — brand tile colours are illustrative data, never accents. Also scoped the "never name a specific fallback font" typography rule to the editor, since the dashboard deliberately sets `'Inter', 'Inter Tight', sans-serif` on its shell root. No code change. |
| 2026-07-10 | **Auth surface → craftwork (cobalt + art rail)** | User-approved reskin of all `app/auth/**` screens to the "craftwork" design language: cobalt `#2D6DFF` accent, two-column floating card with art rail, gray-fill icon inputs. Scoped exception to the red dashboard brand — auth only; settings/billing/onboarding stay red. Business logic unchanged. See §Auth Surface — Craftwork. |
| 2026-07-12 | **Dashboard accent flip RED → COBALT (brand unification)** | User-approved rebrand: the dashboard chrome's former red `#E42313` accent flips to cobalt `#2D6DFF`, matching the dc-skin and unifying with editor + auth (both already cobalt). Token change: `--color-primary` `#E42313`→`#2D6DFF`, `--color-primary-hover`→`#1950DC`, added `--color-primary-subtle` `#EBF1FF`, `--color-error`→`#DC2626`, focus outline→cobalt. Semantic reds (error/danger/destructive/FAILED) unchanged. Purple stays banned. Two-accent system retired → single cobalt (+ onboarding's scoped blue). Business logic unchanged. |
| 2026-07-13 | **Onboarding → M2 frame-gallery parity** | The wizard is rebuilt against the M2 frame gallery (`Buildrik Onboarding-taiba`): 180px header with brand tile, 480px column, filled `#EAF1FF` inputs on a `#D3E1FF` ring, slate `#334155` text, 50px/15px/700 CTA, `OnbBack` text links. **The accent stays `#2563EB`** — the user chose to keep the DESIGN.md exception over the gallery's `#2D6DFF`, so onboarding is deliberately *not* pixel-identical to the mockup in accent hue alone. Tokens: added `--color-onb-field` / `--color-onb-field-ring` / `--spacing-onb-header`; removed `--color-onb-ink` (duplicated `--color-onb-text`); `--container-onb` 520→480. `.onb-scope` re-points the cobalt focus ring at the onboarding accent. Business logic unchanged. |
| 2026-04-29 | **Vibcoder `bd-topbar` evolution — temporary override layer** | Vibcoder canonical `bd-topbar` ships at 48px floating panel with minimal composition (brand label · undo/redo · saved · 3-cell breakpoints · preview · share · publish). DESIGN.md §Layout requires 56px flush bar with full action set (brand mark + breadcrumb + 4-cell breakpoints + +Invite + cmd palette + help + account + state-variant status pill). Temporary override at `themes/design-system/bd-topbar-overrides.css` extends canonical via `@layer overrides` until upstream PR lands. Saving-pulse keyframe suppression added to `a11y.css` (Gate 7). Override sunsets on next `npm run vibcoder:vendor` after upstream merge — file deletion + `@import` removal verified by re-running `verify:ds`. See `docs/superpowers/archive-pre-v1/2026-04-29-vibcoder-bd-topbar-evolution.md`. |

## Token Namespace Contract (DS V1, 2026-04-19)

Two namespaces. One invariant each.

- `--buildrick-*` — **editor SHELL tokens**. Chrome UI only (sidebar, topbar, panels, inspector, buttons, rail). Static — never mutated at runtime. Defined only in `themes/design-system/*.css` (excluding `design.css`).
- `--buildrick-design-*` — **user SITE tokens**. User-editable via Design tab. Runtime-mutated via `useTokenBase` / `useColorTokens` / `useSpacingTokens` / `useTypeTokens` hooks. Defined in two locations only: `features/design-system/constants.ts` (JS source-of-truth) and `themes/design-system/design.css` (pre-render baseline — must match constants.ts, verified by script).

### Public contract (token names appear in user-deployed sites)

All `--buildrick-design-*` token names are part of Buildrik's public contract. They appear in:
- User project JSON (`settings.designTokens[].cssVar`)
- User's published site CSS output (via `exportUtils.ts`)
- localStorage key `buildrick-design-tokens-${projectId}-v1`
- Exported `design-tokens.css` / `design-tokens.json` / `design-tokens.tailwind.js`

**Renaming these names is a BREAKING change.** Requires:
1. Bump `CURRENT_SCHEMA_VERSION` in `features/design-system/migrations/index.ts`
2. Add migration function to `MIGRATIONS[newVersion]`
3. Add alias entry to `ALIAS_RETENTION` in `exportUtils.ts` (2-version retention window)
4. CHANGELOG entry with before/after name mapping

Editor SHELL tokens (`--buildrick-*` without `design-` prefix) are INTERNAL — may rename freely without migration.

### CI-enforceable invariants

Run `npm run verify:ds` in `packages/editor/` to check all 8 gates:
1. No self-referential CSS var defs
2. `--buildrick-design-*` defs only in `design.css`
3. No `--buildrick-design-*` consumers in editor chrome (sensor reads in `features/design-system/ui` excepted)
4. No deprecated alias consumers (`--ls-*`, `--rail-*`, `--accent`, etc.)
5. No `--aqb-*` / `data-aqb-*` survives
6. No duplicate keys within any DS file
7. No `@media (prefers-*)` outside `a11y.css` (best-effort, some transitional duplicates in `components.css`)
8. No bare deprecated defs (`--accent`, `--buildrick-text`, `--buildrick-surface`)

Plus baseline parity: `scripts/verify-design-baselines.mjs` confirms `design.css` values match `constants.ts` DEFAULT_TOKENS byte-for-byte (normalized).

See: `docs/superpowers/archive-pre-v1/2026-04-19-buildrik-design-system-v1-design.md` (moved out of `specs/` when that folder was reorganised)

## Chrome Axioms (editor-chrome DS rollout, 2026-04-20)

These axioms codify the editor-chrome design constraints. They extend (not contradict) the existing §Color, §Typography, §Spacing, §Layout, and §Sidebar Panel System sections. Where this section and earlier sections appear to conflict, earlier sections win — these axioms only add new lint-enforced constraints.

### Scope

Chrome paths enforced:
- `packages/editor/src/editor/**`
- `packages/editor/src/shared/ui/**`
- `packages/editor/src/shared/forms/**`

LOCAL_SHADOW — exempt because they render or edit user-site content, not chrome:
- `editor/sidebar/tabs/design/**` (user-site token editor, legitimately mutates `--buildrick-design-*`)
- `editor/inspector/sections/BackgroundSection.tsx` (user-site gradient editor)
- `editor/media/VideoPreview.tsx`, `editor/export/PreviewFrame.tsx`, `editor/wizard/sectionData.ts` (user-content preview renderers)
- `shared/forms/GradientPicker.tsx` (user-site gradient editor)
- `shared/utils/parsers/**` (user-content parsers)
- `**/__tests__/**`, `**/*.test.*`, `**/*.stories.*`

NOT exempt (in scope, enforced): `features/design-system/ui/**` — this is the Design tab's own chrome (headers, footers, modals, dropdowns), enforced like the rest of the sidebar.

### Chrome vs form atoms

Two tiers within chrome. Axioms apply differently to each.

- **Panel chrome** — panel shells, headers, toolbars, content backgrounds, sidebar rows, inspector sections, rail zones, canvas overlays, topbar containers. Zero-decoration rules apply strictly.
- **Form atoms** — `Button`, `Input`, `Select`, `Toggle`, `Tooltip`, `Toast`, `Modal`, `IconButton`, `Kbd`, `Badge`. These are atomic primitives inside panels. They may use the full `--buildrick-radius-*` scale (sm 4 / md 8 / lg 12 / xl 16) and `--buildrick-shadow-*` tokens. They are NOT panel chrome.

### Axiom A1 — Zero Decoration on Panel Chrome

Panel chrome must be visually restrained. Canvas (user content) owns decoration; panel chrome is the instrument chassis.

1. **No gradients** in panel chrome (`linear-gradient`, `radial-gradient`, `conic-gradient`).
2. **Box-shadow in chrome must come from a `--buildrick-shadow-*` token** — not from raw `rgba(...)` or hex values inline. Allowed tokens: `shadow-xs/sm/md/lg/xl`, `shadow-dropdown`, `shadow-modal`, `shadow-hover`, `shadow-inner`, and the `glow-*` family for focus rings. Use `shadow-dropdown` or `shadow-modal` for floating panels; never invent a raw shadow.
3. **`border-radius` ≤ 4px on panel chrome containers.** Panels, headers, toolbars, footers, sidebar rows, inspector sections, rail zones all cap at `--buildrick-radius-sm` (4px). Form atoms are exempt (see tier above).
4. **No decorative hover effects on panel chrome** — no glow, no scale, no rotate, no tint animations on panel containers. Hover on rows uses a background-color change to a hover-surface token. Form-atom hover states (button color shift, input focus ring) are unchanged.

**Rationale.** Adobe Spectrum, VS Code, Figma UI3, and every professional DAW/CAD/game-engine converge on this: decorative panel chrome competes with user content for attention and trains users to mistake chrome for editable objects.

### Axiom A2 — Hue Is Never Load-Bearing in Chrome

Restates and sharpens the existing §Color rules.

1. **The accent is used ONLY where §Color §Accent Usage Rules already allow** — primary CTA, selection outlines and selected-row tint, active rail/tab indicator, focus rings, account avatar. Nowhere else in chrome. (`#1A56DB` in design AND code since 2026-07-30; was `#406ED6` from 2026-07-21.)
2. **Semantic colors (`--success`, `--warning`, `--error`, `--info`) are used ONLY in functional status indicators** — Toast, SyncStatusIndicator, save-state badges, validation messages. Never as decoration elsewhere in chrome.
3. **No decorative tint** in panel headers, sidebar section backgrounds, toolbar fills. Chrome uses the neutral surface tokens (`--aqb-bg-*` / `--buildrick-bg-panel*`) only.
4. **Chrome must survive any user canvas color.** A user building a hot-pink brand site and a user building a forest-green one must see the same chrome affordances.

**Rationale.** The microscope/DAW invariant: hue on chrome biases the user's perception of hue in their own content. Chrome separates via luminance + typography + iconography.

### Axiom A3 — No Motion Beyond Function

1. **No scroll choreography, no parallax, no spring physics.**
2. **Allowed:** 100-150ms ease-out transitions on background-color, opacity, transform (drag only). Nothing else.
3. **No entrance/exit animations** on panels, modals, menus beyond a simple opacity fade ≤150ms.

### Enforcement

Enforcement has two layers. Both run in WARN mode at introduction, tied to `.chrome-axioms-baseline`. Counts can only go down.

1. **`no-restricted-syntax` rules inside `eslint.config.mjs`** — scoped via `files: ["src/editor/**/*.{ts,tsx}", ...]` overrides. Catches most Emotion tagged-template-literal and JSX object-literal cases. ESLint is advisory only (CI step allows non-blocking `|| true`); real enforcement lives in the grep gates.
2. **Grep gates 11-14 in `scripts/ds-grep-gates.sh`**, backed by `scripts/.chrome-axioms-baseline`:
   - Gate 11 — no gradients in panel chrome
   - Gate 12 — no raw box-shadow literals in panel chrome (must use `--buildrick-shadow-*` tokens)
   - Gate 13 — `border-radius` ≤ 4px on panel chrome (form atoms exempt)
   - Gate 14 — magic layout literals (44/48/56/60/28/32/36/40/240/300/320) — migrate to `src/shared/constants/layout.ts` when it lands (Week 1, Survivor #3)

Gates compare current count against the frozen baseline and fail on regression. Lower the baseline as migrations ship.

See: `docs/ideation/2026-04-20-editor-chrome-ds-ideation.md` (rollout plan) and `docs/reviews/2026-04-20-editor-chrome-consumer-inventory.md` (Week 0 inventory).
