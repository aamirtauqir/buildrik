# Design System — Buildrick

## Product Context
- **What this is:** AI-powered drag-and-drop website builder editor. Three creation modes (drag, templates, AI generate) sharing one element vocabulary.
- **Who it's for:** Solo designers currently billing clients on Webflow or Framer. Time-constrained power users, not beginners.
- **Space / industry:** Designer-grade web builders. Peers: Webflow, Framer, Webstudio. Not peers: Wix, Squarespace, Durable (different wedge).
- **Project type:** Desktop web app with separate marketing site. Editor chrome is the primary surface.

## Surface Scope (which brand applies where)

Buildrick runs on **one brand accent: `#406ED6`** across dashboard, auth and onboarding — no scoped exceptions, one blue on screen anywhere. Red is reserved for error/danger/destructive everywhere. (Adopted 2026-07-18 from the founder-supplied UI kit, `docs/design/dashboard-ui-kit.md`; supersedes the cobalt `#2D6DFF` unification of 2026-07-12, which itself had replaced the dashboard's red `#E42313`. See Decisions Log.)

**Editor chrome is now on `#406ED6` in code too** (migrated 2026-07-21, M4) — it carries its own `--buildrick-*` design system in `packages/editor/` with its own token contract and CI gates, so it was a separate migration. The flip is the single `--buildrick-accent` token in `themes/design-system/color.css` (+ `border-focus`/`info` and the `accent-hover`/`pressed`/`subtle`/`tint` shades); every chrome consumer follows via the `--bd-accent` / `--bd-cobalt` aliases, so no per-component edits were needed. The Figma file (`g4GzQFqzNYz5sosz1QtZXC`) had already moved to `#406ED6` on 2026-07-20; code now matches. `#406ED6` also cleared the last contrast failure — white on cobalt was 4.43:1, under the 4.5 bar; white on `#406ED6` is 4.75:1. (The user-facing site-builder default tokens in `editor/design-system/` stay their own palette — that is user output, not chrome.)

| Surface | Lives in | Accent | Display font | Body font | Audience |
|---|---|---|---|---|---|
| **Editor chrome** (canvas + sidebars + topbar + inspector) | `packages/editor/` | **`#406ED6`** (own `--buildrick-*` DS; code migrated 2026-07-21) | General Sans | Inter Tight | Power user mid-flow. Quiet. |
| **Dashboard chrome** (settings, billing, team, sites list, media, home) | `app/dashboard/`, `app/maintenance/`, 404, share | **`#406ED6`** (`--color-primary`, hover `#2E56B8`, subtle `#EBF1FF`) | Inter | Inter | Signed-in workspace tasks. |
| **Auth chrome** (signed-out craftwork) | `app/auth/` | **`#406ED6`** (`--color-auth-cta`, hover `#2E56B8`) + art rail | Inter Tight | Inter Tight | New visitor / signed-out. |
| **Onboarding wizard** | `app/onboarding/` | **`#406ED6`** (`--color-onb-primary`) — no longer a scoped exception | Inter | Inter | Post-verification setup. |
| **Marketing site** (separate repo) | n/a in this repo | Own brand; not governed here | General Sans | Inter Tight | Cold traffic. |

**Why one accent:** editor, auth, and dashboard are one continuous signed-in-adjacent product; a single cobalt accent reads as one brand. Onboarding keeps its blue per the M2 spec.

Rules:
- **`#406ED6` is the single accent** for CTAs, links, active states and focus rings — everywhere, including the editor. (Editor chrome code migrated to `#406ED6` on 2026-07-21; design and code now match.)
- **Red means error/danger/destructive only** (delete confirm, FAILED status, validation, over-limit, dunning) — on every surface. Never a red CTA or accent.
- Purple/violet/indigo remain **banned** as accents (AI-slop guard). **One narrow
  exception (user-approved 2026-07-18):** third-party *brand* colours on the
  Marketplace app tiles may be purple (e.g. Commerce `#7C5CF6`) — these are
  per-app branding data in `lib/marketplace-catalog.ts`, never an accent, never a
  gradient, and never applied to CTAs, links, focus, or active states. The
  "no purple gradients, ever" rule below is unaffected.
- The **NO BLACK RULE** below applies to **editor chrome only**. Dashboard may use `#0D0D0D` for primary text.

### Auth Surface — Craftwork (2026-07-10)

The **`app/auth/**` screens** (login, signup, 2FA, OTP, magic-link, forgot/reset, verify-email, workspace, invite, error/state screens) run a distinct **craftwork** visual language on the shared cobalt accent.

- **Accent = `#406ED6`** (`--color-auth-cta`, hover `#2E56B8`). Same accent as the rest of the product; the craftwork treatment below is what's auth-specific.
- **Art rail** — a two-column floating white card (`AuthCard`) with a cobalt illustration (`AuthArt`) left, form right. The "no gradients / no decorative illustration" aesthetic rule does **not** apply to the auth art rail; it still applies to the rest of the dashboard.
- **Gray-fill icon inputs** — `--color-auth-input-fill`, left icon, cobalt focus.
- Source of truth: `app/globals.css` `--color-auth-*` tokens + `components/auth/*`.

**Full-bleed white + compact controls (user 2026-07-15).** Supersedes the 1000×620-floating-card + `#ECECEE`-tint decision below. The **art screens fill the whole viewport** — the card is `w-full` × `min-h-auth-shell-min` (`--spacing-auth-shell-min: 100dvh`), edge-to-edge, **no radius, no shadow**: it *is* the surface, a 50/50 split with the art rail full-height on the left and the white form pane on the right. Page + card are white (`--color-auth-page: #FFFFFF`), `--container-auth-shell: 100vw`. Controls shrank to **input 40px, button 42px** (`--spacing-auth-input` / `--spacing-auth-btn`). The `app/auth/layout.tsx` wrapper dropped its `px-4 py-8` so the card reaches the edges. The transient **`noArt` spinner screens stay a small centered card** (`max-w-[460px]`, radius + shadow, `my-8`) — they are the *only* auth path that is still a floating card. Tokens live in `globals.css`; the art-vs-noArt split lives in `components/auth/auth-card.tsx`.

**Frame parity (2026-07-13).** Rebuilt against the M1 craftwork gallery (52 frames). The card is **1000×620, radius 24, art rail left** — it is *not* full-bleed; it was briefly flattened to `fixed inset-0` and that dropped the card on every art screen. Inputs 52px, buttons 50px, titles 18.5px. Craftwork ink is **near-black** (`#0A0A0B` titles, `#111113` body/links), muted `#6B6B70` — not slate. Error red is `#E5484D` (border) / `#C0343A` (text). `FormBanner` is a **borderless tinted chip** (9% fill), not a bordered alert box.

- **The gallery's intro prose is stale** — it claims a black Google button, gray-fill inputs and form-on-the-left. The frames themselves show a cobalt Google button, blue-fill inputs and art-on-the-left. Trust the frames.
- **Deliberate deviations from the frames** (user-confirmed 2026-07-13): sign-in keeps the **GitHub button** and the **"Remember me"** checkbox. The frames omit both, but GitHub OAuth is live and `rememberMe` really drives session lifetime — dropping the checkbox would silently pin every session short.
- **Not implemented, by design:** the frames' "N attempts remaining" counters. Login/2FA errors are generic *on purpose* to deny a user-enumeration oracle; surfacing counts would reverse that. Likewise the lockout countdown, workspace site counts and the device-alert Device/Location/Time table have no backing data (the device fingerprint is a one-way hash). Do not fabricate them.

### Onboarding Surface — M2 Wizard (2026-07-11; scoped exception RETIRED 2026-07-18)

The **`app/onboarding/**` wizard** (post-verification setup: workspace → first site → path chooser → AI/template/blank → editor) **no longer runs a scoped blue.** It now uses the single product accent `#406ED6`, like the dashboard and auth. History: it shipped on `#2563EB`, was flipped to cobalt `#2D6DFF` on 2026-07-18 to match the v3 frame gallery, and moved to `#406ED6` with the UI-kit adoption the same day. The `.onb-scope` focus-ring override was removed with the exception — there is nothing left to scope.

- Accent = `--color-onb-primary` `#406ED6` (hover `#2E56B8`, tint `#EBF1FF`). Primary CTAs, active stepper dot, progress fill, selected cards, links inside onboarding.
- Full token set: `--color-onb-*` + `--radius-onb` / `--spacing-onb-*` / `--container-onb` / `--text-onb-*` in `app/globals.css`. Inter type scale (titles 26/700).
- The `--color-onb-*` token set still exists and still owns onboarding's geometry/neutrals/type; only the accent stopped diverging. The global `*:focus-visible` ring resolves to `--color-primary`, which onboarding now shares, so one blue is on screen without any scoping.
- **The accent is the only thing that diverges from the M2 frame gallery.** Geometry, neutrals, and type are taken from it literally: 180px header (brand tile 48/40, Skip 48/46, step indicator at 92), 480px content column, 46px inputs, 50px CTA (15px/700).
- Text is slate, not black: `onb-text` `#334155` is the darkest tone (titles, labels *and* body). There is deliberately **no** near-black `onb-ink` token — it was removed 2026-07-13 as a duplicate.
- Inputs are **filled, not outlined**: `onb-field` `#EAF1FF` on a 1px `onb-field-ring` `#D3E1FF` inset ring; the error state drops to a white fill with a 1.5px `onb-error` ring. Rings are inset shadows so state changes never shift layout.
- One button only (`OnbButton`, primary fill). Secondary actions are `OnbBack` text links (13px/600, muted → text on hover).

## Dashboard Shell + Design System (2026-07-12)

The dashboard is built as ONE system, not per-screen markup. Enforced by a shell + a primitive layer + a token contract (see `packages/dashboard/components/dashboard/shell/`, `…/primitives/`, `app/globals.css`).

**Two-level shell** (`DashboardShell`):
- **Top nav** (full-width, `--topnav-h: 52px`): brand · the four product areas `Dashboard · Marketplace · Learn · Resources` · ⌘K search · notifications · help · workspace switcher (`Plan · N seats` in mono) · account. These four areas live ONLY in the top nav.
- **Sidebar** (`--sidebar-w: 262px`, below the top nav): workspace/operational destinations only — IA v2 (2026-07-17) trimmed 19 items to **6 + 2**: `Home · Projects · Agency (agency-only) · Media · Templates · Settings` plus a labeled Support group (`Getting started · Help center`). SSOT is `components/dashboard/shell/nav.ts` (`NAV_GROUPS`); mobile tab bar and the ⌘K palette's nav entries derive from it. Agency tabs (Clients · Reviews · Shared theme · Partner) and the Settings rail (WORKSPACE / PLATFORM / BILLING / PERSONAL + Danger) live inside their sections, not in the sidebar. Never repeats the top-nav areas.

**Token contract** (`globals.css @theme`): radius scale `--radius-xs 4 / sm 6 / md 8 / lg 10 / xl 12 / pill`; `--font-mono` Geist Mono + `tabular-nums` for **tabular data** (counts, $, sizes, seats, dates — via `MetricValue`) — **hero stat metrics may use the display font (Inter Tight)**, as the dc artifact does; consistency within a surface matters more than mono everywhere. Named text tokens `--text-page-title 24 / section 15 / eyebrow 11 / body 14 / body-sm 12` (one ramp — Tailwind's `text-sm`/`text-xs` are swept out of the dashboard) are **preferred** (hero stat metric renders at the artifact's 27px in `StatCard`), but **artifact-matched pixel values** (`text-[13.5px]`, `font-[520]`) are allowed when matching a mockup 1:1. Depth is hairline borders + subtle card shadow (`shadow-card`), not heavy elevation.

**Primitives** (`components/dashboard/primitives/`, use these — do NOT hand-roll): `PageHeader`, `SectionCard`, `StatCard` (+ `visual`/`href`), `DataTable`, `Pill` (tones neutral/success/warning/error/accent), `ProgressBar`, `MetricValue`. Screens compose primitives; they don't style surfaces directly. Data-viz helpers (donut/sparkline/avatars) live in `dataviz.tsx`.

**Explicitly allowed on the dashboard** (2026-07-18 — the editor-chrome
[Anti-Slop Rules](#anti-slop-rules--editor-chrome-only-enforce-in-qa-and-code-review)
do NOT apply here):
- **Elevation shadows on cards** — `shadow-card` / `shadow-card-hover` on stat, section, table and app cards. Depth is hairline border + soft shadow, not flat-only.
- **Ink surfaces** — `--color-ink` `#141924` for hero/featured cards and filled pills (e.g. the Marketplace featured card and its active filter chip). The NO BLACK RULE is editor-chrome only.
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
- **Body + Editor UI (primary workhorse):** `Inter Tight`. Tight letter-spacing, reads as "tool" not "document." Used for every label, button, input, breadcrumb, panel title, row label in the editor.
- **Data / Inspector values / mono content:** `Geist Mono` with `font-variant-numeric: tabular-nums`. Required for dimensions, timestamps, slugs, file sizes, page counts.
- **Loading:** Bunny Fonts CDN with `font-display: swap` in dev. Self-host in production. No `@font-face` redefinitions in individual components.
- **Dashboard UI (scoped exception):** `Inter` is loaded alongside Inter Tight and applied only on the dashboard shell root (`DashboardShell`), cascading to dashboard content. Auth and onboarding keep `Inter Tight`; Geist Mono remains the data face everywhere.

**Canonical CSS:**

```css
--aqb-font-family: "Inter Tight", sans-serif;
--aqb-font-mono:   "Geist Mono", monospace;
```

In **editor chrome**, the only fallback allowed is the CSS generic (`sans-serif` / `monospace`) — never name a specific fallback font. If `Inter Tight` fails to load, the user gets the system generic, which is acceptable because `font-display: swap` swaps Inter Tight in as soon as it loads. (The **dashboard** is the one exception: it sets `'Inter', 'Inter Tight', sans-serif` on the shell root so Inter is scoped to the dashboard and everything outside it keeps Inter Tight.)

**Scale (px):** 11 / 12 / 13 / 14 / 16 / 20 / 24 / 32 / 48. Editor chrome lives mostly at 12–14. Breadcrumb project = 13/400, page = 13/500. Panel titles = 14/600. Row labels = 13/400. Mono data = 11/500.

## Color

**Approach:** Restrained. **One accent (cobalt). All other color is warm slate neutral.** Color is rare and meaningful.

### Surfaces (5-layer light depth, derived from topbar)

```
--aqb-bg-app:      #F1F5F9   /* slate-100, outermost — rail background edge */
--aqb-bg-panel:    #F8FAFC   /* slate-50, topbar + sidebar panel */
--aqb-bg-subtle:   #F1F5F9   /* search fields, hover fills */
--aqb-bg-card:     #FFFFFF   /* cards, list rows, inputs, popovers */
--aqb-bg-elevated: #FFFFFF   /* modals, dropdowns, command palette */
--aqb-bg-canvas:   #FFFFFF   /* user's canvas — unchanged */
```

Depth is communicated by nesting + hairline borders, not shadows. Modals get one `box-shadow: 0 8px 32px rgba(15,23,42,0.08)` on the outer container.

### Borders (slate, matches topbar)

```
--aqb-border:         #E2E8F0   /* slate-200, default hairline */
--aqb-border-medium:  #CBD5E1   /* slate-300, inputs + buttons — matches topbar */
--aqb-border-strong:  #94A3B8   /* slate-400, hover — matches topbar hover */
--aqb-border-focus:   #2D6DFF   /* cobalt focus ring — CODE ONLY, design is #406ED6 */
```

### Text (no black, ever)

```
--aqb-text-primary:   #334155   /* slate-700, 11.6:1 on slate-50 — AAA */
--aqb-text-secondary: #64748B   /* slate-500, 7.0:1 — AAA */
--aqb-text-muted:     #94A3B8   /* slate-400, 3.7:1 — AA for large text only */
--aqb-text-disabled:  #CBD5E1   /* slate-300 — visibly inert */
--aqb-text-on-accent: #FFFFFF   /* white on cobalt surfaces */
```

The primary text color matches topbar `.tbBreadcrumb-page` (`#334155`). Secondary matches topbar `.tbBreadcrumb-project` (`#64748B`). This is intentional — topbar becomes the type-color reference for every surface in the editor.

### Accent (cobalt, single, unchanged)

```
--accent:         #2D6DFF   /* CODE ONLY, design is #406ED6 */
--accent-hover:   #4B8DFF
--accent-pressed: #1E58D9
--accent-tint:    rgba(45, 109, 255, 0.10)   /* selection bg on light surfaces */
--accent-subtle:  rgba(45, 109, 255, 0.05)   /* hover bg on light surfaces */
--accent-on:      #FFFFFF                     /* text on cobalt buttons */
```

**Usage rules:** accent appears on (a) the one primary CTA per screen, (b) selection outlines and selected-row tint, (c) active rail/tab indicator, (d) focus rings, (e) the account avatar (replaces the legacy `#1F2937` pill). Nowhere else.

### Semantic (light-mode tuned, WCAG AA on light bg)

```
--success: #16A34A   /* green-600 */
--warning: #D97706   /* amber-600 */
--error:   #DC2626   /* red-600 */
--info:    #2D6DFF   /* CODE ONLY — design accent is #406ED6 */
```

Use for status indicators only (save state, validation, toasts). Never for decoration.

## Spacing
- **Base unit:** 4px.
- **Density:** Compact. Designers want screen real estate.
- **Scale:** 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Layout
- **Editor:** Grid-disciplined. Topbar (56px) / Left rail (60px) / **Drawer 320px — all six panels** / canvas (flex) / **right inspector 300px**. *(Corrected 2026-07-19: read "240 nav / 320 authoring" and "inspector 320px". Both were the previous IA and both were outside the supersede banner below, so they read as live. The canonical source for every chrome dimension is `docs/designs/2026-07-18-editor-shell-wireframes.md` — this line exists only so it does not contradict it.)*
- **Border radius scale:** `sm: 4px` (inputs, row corners), `md: 8px` (buttons, panels, cards — matches topbar), `lg: 12px` (modals), `full: 9999px` (pills, avatars, compact-state buttons).
- **Topbar height:** 56px — canonical. All other chrome heights flow from this rhythm.
- **Panel header height:** 44px — matches sidebar contract.

## Motion
- **Approach:** Minimal-functional. Only transitions that aid comprehension.
- **Easing:** `enter: ease-out`, `exit: ease-in`, `move: ease-in-out`.
- **Duration:** hover `120ms` (matches topbar), panel open `200ms`, modal enter `200ms`. No spring physics. No scroll choreography. No entrance animations on first paint.
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

### Grammar — TabFrame (was PanelShell pre-2026-05)

```
TabFrame
├── TabFrame.Header    (44px, required)   title · subtitle · actions · close
├── TabFrame.Toolbar   (36px, optional)   search · filters · primary action
├── TabFrame.Content   (flex, scrollable) 12px padding · 4px gap rhythm
└── TabFrame.Footer    (40px, optional)   selection count · batch actions · status
```

All tabs compose these four zones. Lives at
`packages/editor/src/shared/extensions/TabFrame.tsx`. Canonical classnames
`bd-surface-head__*` (header internals) + `bd-*` tab-specific prefixes.

Pre-2026-05 name `PanelShell` + `ps-*` classes are dead — drained during sidebar
header canonicalization (commits `0a2410a4`..`f9377302`).

### Width Rule

| Width | Mode | Tabs | Purpose |
|-------|------|------|---------|
| **240px** | nav | Layers, Pages, Components | Browse a tree / list. Dense. |
| **320px** | authoring | Add, Publish, History | Drag sources out, read details, scan a timeline. |
| **Fullpage** | surface | Templates, Media, Settings, Design | Grids, forms, token editors. |

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

- Tokens live in `packages/editor/src/themes/design-system/` (DS V1, 2026-04-19). Canonical split across 11 files: `color.css`, `typography.css`, `spacing.css`, `radius.css`, `shadow.css`, `motion.css`, `z-index.css`, `layout.css`, `design.css`, `a11y.css`, `index.css`.
- `themes/default.css` is the stable public import path — a thin aggregator of `design-system/index.css` + `components.css` (legacy class rules).
- Every consumer uses `var(--buildrick-*)` (chrome) or `var(--buildrick-design-*)` (user site tokens) directly in Emotion `styled()` or `.css` files. No INSPECTOR_TOKENS indirection.
- For JS-level reads (canvas drawing, color math), use the `getToken(name)` helper from `shared/utils/tokens.ts`.
- Inline `style={{}}` allowed only for runtime-computed values (drag positions, transforms). Colors inside dynamic inline still use `var(--buildrick-*)` strings.
- `packages/editor/src/features/design-system/constants.ts` is the JS source-of-truth for the 68 user-editable `--buildrick-design-*` tokens. Values match `themes/design-system/design.css` baseline (verified by `scripts/verify-design-baselines.mjs`).
- Marketing site uses the same token system. Keep naming consistent.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-18 | **Single accent → `#406ED6` (UI kit); onboarding's scoped blue retired** | Founder adopted the supplied UI kit (`docs/design/dashboard-ui-kit.md`) over the cobalt reskin values, and chose to flip auth + onboarding with the dashboard so the kit's "one blue" rule (§7.2) actually holds. `--color-primary`, `--color-auth-cta` and `--color-onb-primary` all → `#406ED6` (hover `#2E56B8`); `--color-nav-label-active` → `#2E56B8`. The `.onb-scope` focus override and the short-lived `.dash-scope` override were both deleted — with one accent there is nothing to scope, and the global ring now resolves to `--color-primary`. Supersedes the 2026-07-12 RED→COBALT unification for these three surfaces. **Editor chrome remains cobalt `#2D6DFF`** in its own `--buildrick-*` DS (separate token contract + CI gates) and is a pending migration — until it lands, editor and app chrome differ. |
| 2026-07-18 | **Anti-Slop Rules scoped to editor chrome; dashboard allowances made explicit** | The 12 anti-slop rules sat at top level and read as global, but were written alongside the editor Rail/Composition specs. As global rules they contradicted shipped dashboard code on four counts — card elevation shadows (#10), the ink `#141924` featured surface and filter chip (#1), per-app brand tile colours (#11), and the multi-column grid of coloured icon tiles (#3) — and the Dashboard section already prescribed `shadow-card`, so the doc contradicted itself. Rules retitled editor-chrome-only; the dashboard section now lists what it explicitly allows. The editor keeps the guard (light chrome / no-black is a real decision there). Cobalt remains the single accent everywhere — brand tile colours are illustrative data, never accents. Also scoped the "never name a specific fallback font" typography rule to the editor, since the dashboard deliberately sets `'Inter', 'Inter Tight', sans-serif` on its shell root. No code change. |
| 2026-07-10 | **Auth surface → craftwork (cobalt + art rail)** | User-approved reskin of all `app/auth/**` screens to the "craftwork" design language: cobalt `#2D6DFF` accent, two-column floating card with art rail, gray-fill icon inputs. Scoped exception to the red dashboard brand — auth only; settings/billing/onboarding stay red. Business logic unchanged. See §Auth Surface — Craftwork. |
| 2026-07-12 | **Dashboard accent flip RED → COBALT (brand unification)** | User-approved rebrand: the dashboard chrome's former red `#E42313` accent flips to cobalt `#2D6DFF`, matching the dc-skin and unifying with editor + auth (both already cobalt). Token change: `--color-primary` `#E42313`→`#2D6DFF`, `--color-primary-hover`→`#1950DC`, added `--color-primary-subtle` `#EBF1FF`, `--color-error`→`#DC2626`, focus outline→cobalt. Semantic reds (error/danger/destructive/FAILED) unchanged. Purple stays banned. Two-accent system retired → single cobalt (+ onboarding's scoped blue). Business logic unchanged. |
| 2026-07-13 | **Onboarding → M2 frame-gallery parity** | The wizard is rebuilt against the M2 frame gallery (`Buildrik Onboarding-taiba`): 180px header with brand tile, 480px column, filled `#EAF1FF` inputs on a `#D3E1FF` ring, slate `#334155` text, 50px/15px/700 CTA, `OnbBack` text links. **The accent stays `#2563EB`** — the user chose to keep the DESIGN.md exception over the gallery's `#2D6DFF`, so onboarding is deliberately *not* pixel-identical to the mockup in accent hue alone. Tokens: added `--color-onb-field` / `--color-onb-field-ring` / `--spacing-onb-header`; removed `--color-onb-ink` (duplicated `--color-onb-text`); `--container-onb` 520→480. `.onb-scope` re-points the cobalt focus ring at the onboarding accent. Business logic unchanged. |
| 2026-04-29 | **Vibcoder `bd-topbar` evolution — temporary override layer** | Vibcoder canonical `bd-topbar` ships at 48px floating panel with minimal composition (brand label · undo/redo · saved · 3-cell breakpoints · preview · share · publish). DESIGN.md §Layout requires 56px flush bar with full action set (brand mark + breadcrumb + 4-cell breakpoints + +Invite + cmd palette + help + account + state-variant status pill). Temporary override at `themes/design-system/bd-topbar-overrides.css` extends canonical via `@layer overrides` until upstream PR lands. Saving-pulse keyframe suppression added to `a11y.css` (Gate 7). Override sunsets on next `npm run vibcoder:vendor` after upstream merge — file deletion + `@import` removal verified by re-running `verify:ds`. See `docs/superpowers/specs/2026-04-29-vibcoder-bd-topbar-evolution.md`. |

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

See: `docs/superpowers/specs/2026-04-19-buildrik-design-system-v1-design.md`

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

1. **The accent is used ONLY where §Color §Accent Usage Rules already allow** — primary CTA, selection outlines and selected-row tint, active rail/tab indicator, focus rings, account avatar. Nowhere else in chrome. (`#406ED6` in design; the editor code still emits cobalt `#2D6DFF` until the migration lands.)
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
