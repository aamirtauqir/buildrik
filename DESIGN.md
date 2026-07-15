# Design System — Buildrick

> **Staleness notice (2026-05-24 audit):** Sections §Typography, §Color, §Spacing,
> §Layout, §Sidebar Panel System are partially stale. Token namespace migrated
> `--aqb-*` → `--buildrick-*` after this doc was written but not back-patched.
> Width rule + tab list expanded since 2026-04-16. Canonical sources:
> - **Token defs:** `packages/editor/src/themes/design-system/*.css`
> - **Chrome enforcement:** `pnpm --filter @buildrik/editor verify:ds`
> - **Dashboard enforcement:** `pnpm --filter @buildrik/dashboard gate:ds`
> - **Architecture decisions:** `Decisions Log` section + memory entries
>   `project_ds_*_20260*.md`
> See L128-136 (drained tokens), L156 (tabs), L168 (PanelShell→TabFrame) for
> specific patches landed this audit. Full rewrite deferred.

## Product Context
- **What this is:** AI-powered drag-and-drop website builder editor. Three creation modes (drag, templates, AI generate) sharing one element vocabulary.
- **Who it's for:** Solo designers currently billing clients on Webflow or Framer. Time-constrained power users, not beginners.
- **Space / industry:** Designer-grade web builders. Peers: Webflow, Framer, Webstudio. Not peers: Wix, Squarespace, Durable (different wedge).
- **Project type:** Desktop web app with separate marketing site. Editor chrome is the primary surface.

## Surface Scope (which brand applies where)

Buildrick runs on **one brand accent: cobalt `#2D6DFF`** across editor, auth, and dashboard chrome. Onboarding runs its own scoped blue. Red is reserved for error/danger/destructive everywhere. (Unified 2026-07-12 — the dashboard's former red `#E42313` accent was flipped to cobalt as a deliberate rebrand matching the dc-skin; see changelog.)

| Surface | Lives in | Accent | Display font | Body font | Audience |
|---|---|---|---|---|---|
| **Editor chrome** (canvas + sidebars + topbar + inspector) | `packages/editor/` | **Cobalt `#2D6DFF`** | General Sans | Inter Tight | Power user mid-flow. Quiet. |
| **Dashboard chrome** (settings, billing, team, sites list, media, home) | `app/dashboard/`, `app/maintenance/`, 404, share | **Cobalt `#2D6DFF`** (`--color-primary`, hover `#1950DC`, subtle `#EBF1FF`) | Inter Tight | Inter Tight | Signed-in workspace tasks. |
| **Auth chrome** (signed-out craftwork) | `app/auth/` | **Cobalt `#2D6DFF`** (`--color-auth-cta`, hover `#1E58D9`) + art rail | Inter Tight | Inter Tight | New visitor / signed-out. |
| **Onboarding wizard** (scoped exception) | `app/onboarding/` | **Blue `#2563EB`** (`--color-onb-primary`) | Inter | Inter | Post-verification setup. |
| **Marketing site** (separate repo) | n/a in this repo | Own brand; not governed here | General Sans | Inter Tight | Cold traffic. |

**Why one accent:** editor, auth, and dashboard are one continuous signed-in-adjacent product; a single cobalt accent reads as one brand. Onboarding keeps its blue per the M2 spec.

Rules:
- **Cobalt `#2D6DFF` is the single accent** for CTAs, links, active states, focus rings across editor + auth + dashboard.
- **Red means error/danger/destructive only** (delete confirm, FAILED status, validation, over-limit, dunning) — on every surface. Never a red CTA or accent.
- Purple/violet/indigo remain **banned** as accents (AI-slop guard).
- The **NO BLACK RULE** below applies to **editor chrome only**. Dashboard may use `#0D0D0D` for primary text.

### Auth Surface — Craftwork (2026-07-10)

The **`app/auth/**` screens** (login, signup, 2FA, OTP, magic-link, forgot/reset, verify-email, workspace, invite, error/state screens) run a distinct **craftwork** visual language on the shared cobalt accent.

- **Accent = cobalt `#2D6DFF`** (`--color-auth-cta`, hover `#1E58D9`). Same accent as the rest of the dashboard now; the craftwork treatment below is what's auth-specific.
- **Art rail** — a two-column floating white card (`AuthCard`) with a cobalt illustration (`AuthArt`) left, form right. The "no gradients / no decorative illustration" aesthetic rule does **not** apply to the auth art rail; it still applies to the rest of the dashboard.
- **Gray-fill icon inputs** — `--color-auth-input-fill`, left icon, cobalt focus.
- Source of truth: `app/globals.css` `--color-auth-*` tokens + `components/auth/*`.

**Full-bleed white + compact controls (user 2026-07-15).** Supersedes the 1000×620-floating-card + `#ECECEE`-tint decision below. The **art screens fill the whole viewport** — the card is `w-full` × `min-h-auth-shell-min` (`--spacing-auth-shell-min: 100dvh`), edge-to-edge, **no radius, no shadow**: it *is* the surface, a 50/50 split with the art rail full-height on the left and the white form pane on the right. Page + card are white (`--color-auth-page: #FFFFFF`), `--container-auth-shell: 100vw`. Controls shrank to **input 40px, button 42px** (`--spacing-auth-input` / `--spacing-auth-btn`). The `app/auth/layout.tsx` wrapper dropped its `px-4 py-8` so the card reaches the edges. The transient **`noArt` spinner screens stay a small centered card** (`max-w-[460px]`, radius + shadow, `my-8`) — they are the *only* auth path that is still a floating card. Tokens live in `globals.css`; the art-vs-noArt split lives in `components/auth/auth-card.tsx`.

**Frame parity (2026-07-13).** Rebuilt against the M1 craftwork gallery (52 frames). The card is **1000×620, radius 24, art rail left** — it is *not* full-bleed; it was briefly flattened to `fixed inset-0` and that dropped the card on every art screen. Inputs 52px, buttons 50px, titles 18.5px. Craftwork ink is **near-black** (`#0A0A0B` titles, `#111113` body/links), muted `#6B6B70` — not slate. Error red is `#E5484D` (border) / `#C0343A` (text). `FormBanner` is a **borderless tinted chip** (9% fill), not a bordered alert box.

- **The gallery's intro prose is stale** — it claims a black Google button, gray-fill inputs and form-on-the-left. The frames themselves show a cobalt Google button, blue-fill inputs and art-on-the-left. Trust the frames.
- **Deliberate deviations from the frames** (user-confirmed 2026-07-13): sign-in keeps the **GitHub button** and the **"Remember me"** checkbox. The frames omit both, but GitHub OAuth is live and `rememberMe` really drives session lifetime — dropping the checkbox would silently pin every session short.
- **Not implemented, by design:** the frames' "N attempts remaining" counters. Login/2FA errors are generic *on purpose* to deny a user-enumeration oracle; surfacing counts would reverse that. Likewise the lockout countdown, workspace site counts and the device-alert Device/Location/Time table have no backing data (the device fingerprint is a one-way hash). Do not fabricate them.

### Onboarding Surface — M2 Wizard (2026-07-11, scoped exception)

The **`app/onboarding/**` wizard** (post-verification setup: workspace → first site → path chooser → AI/template/blank → editor) runs its own **primary blue `#2563EB`**, distinct from the cobalt `#2D6DFF` used everywhere else. This is an approved scoped exception, re-confirmed by the user on 2026-07-13.

- Accent = `--color-onb-primary` `#2563EB` (hover `#1D4FD7`, tint `#EFF6FF`). Primary CTAs, active stepper dot, progress fill, selected cards, links inside onboarding.
- Full token set: `--color-onb-*` + `--radius-onb` / `--spacing-onb-*` / `--container-onb` / `--text-onb-*` in `app/globals.css`. Inter type scale (titles 26/700).
- Scoped to `app/onboarding/` only. Do not spread `#2563EB` past it. Editor, auth, and the dashboard proper are all cobalt `#2D6DFF`. Because the global `*:focus-visible` ring is cobalt, `.onb-scope` (set on the onboarding layout) re-points it at `--color-onb-primary` so only one blue is ever on screen.
- **The accent is the only thing that diverges from the M2 frame gallery.** Geometry, neutrals, and type are taken from it literally: 180px header (brand tile 48/40, Skip 48/46, step indicator at 92), 480px content column, 46px inputs, 50px CTA (15px/700).
- Text is slate, not black: `onb-text` `#334155` is the darkest tone (titles, labels *and* body). There is deliberately **no** near-black `onb-ink` token — it was removed 2026-07-13 as a duplicate.
- Inputs are **filled, not outlined**: `onb-field` `#EAF1FF` on a 1px `onb-field-ring` `#D3E1FF` inset ring; the error state drops to a white fill with a 1.5px `onb-error` ring. Rings are inset shadows so state changes never shift layout.
- One button only (`OnbButton`, primary fill). Secondary actions are `OnbBack` text links (13px/600, muted → text on hover).

## Dashboard Shell + Design System (2026-07-12)

The dashboard is built as ONE system, not per-screen markup. Enforced by a shell + a primitive layer + a token contract (see `packages/dashboard/components/dashboard/shell/`, `…/primitives/`, `app/globals.css`).

**Two-level shell** (`DashboardShell`):
- **Top nav** (full-width, `--topnav-h: 52px`): brand · the four product areas `Dashboard · Marketplace · Learn · Resources` · ⌘K search · notifications · help · workspace switcher (`Plan · N seats` in mono) · account. These four areas live ONLY in the top nav.
- **Sidebar** (`--sidebar-w: 262px`, below the top nav): workspace/operational destinations only (Home, All projects, Sites, Media, Getting started, Agency group, Extend = Apps/Libraries, Workspace = Team/Billing/Plans/Usage/Domains/Settings/Help). Never repeats the top-nav areas.

**Token contract** (`globals.css @theme`): radius scale `--radius-xs 4 / sm 6 / md 8 / lg 10 / xl 12 / pill`; `--font-mono` Geist Mono for all data (counts, $, sizes, seats, dates) with `tabular-nums`; named text tokens `--text-page-title 22 / section 15 / eyebrow 11 / metric 24 / body 13`. No arbitrary `text-[22px]` or freehand `rounded-*` in new work.

**Primitives** (`components/dashboard/primitives/`, use these — do NOT hand-roll): `PageHeader`, `SectionCard`, `StatCard` (+ `visual`/`href`), `DataTable`, `Pill` (tones neutral/success/warning/error/accent), `ProgressBar`, `MetricValue`. Screens compose primitives; they don't style surfaces directly. Data-viz helpers (donut/sparkline/avatars) live in `dataviz.tsx`.

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

**Canonical CSS:**

```css
--aqb-font-family: "Inter Tight", sans-serif;
--aqb-font-mono:   "Geist Mono", monospace;
```

The only fallback allowed is the CSS generic (`sans-serif` / `monospace`). Never name a specific fallback font. If `Inter Tight` fails to load, the user gets the system generic — which is acceptable because `font-display: swap` means Inter Tight replaces it as soon as it loads.

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
--aqb-border-focus:   #2D6DFF   /* cobalt focus ring */
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
--accent:         #2D6DFF
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
--info:    #2D6DFF   /* = accent */
```

Use for status indicators only (save state, validation, toasts). Never for decoration.

### Removed / Migrated Tokens (DRAINED 2026-04 → 2026-05)

Audit 2026-05-24 verified: all tokens listed below have zero defs remaining
in `packages/editor/src/themes/`. No "delete on next pass" pending — done.

- ~~`--aqb-bg-dark`, `--aqb-bg-darker`, `--aqb-bg-panel-secondary`, `--aqb-bg-panel-tertiary`, `--aqb-surface-1..5`~~ — drained.
- ~~Dark-theme `--ls-*` aliases~~ — drained (0 defs).
- ~~`--aqb-primary*` family~~ — drained (cobalt-only).
- ~~`--bar`, `--bar2`, `--barStroke`, `--pillStroke`, `--pillStroke2`, `--txt`, `--muted`, `--blue`, `--blue2`, `--green`, `--green2`~~ — drained (0 defs).
- ~~`--media-img`, `--media-vid`, `--media-ico`, `--media-fnt`~~ — drained.
- Topbar `.tb*` hex literals — drained (audit verified, gate-enforced).

## Spacing
- **Base unit:** 4px.
- **Density:** Compact. Designers want screen real estate.
- **Scale:** 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Layout
- **Editor:** Grid-disciplined. Topbar (56px) / Left rail (60px) / Left sidebar panel (240 nav / 320 authoring / fullpage) / canvas (flex) / right inspector (320px).
- **Border radius scale:** `sm: 4px` (inputs, row corners), `md: 8px` (buttons, panels, cards — matches topbar), `lg: 12px` (modals), `full: 9999px` (pills, avatars, compact-state buttons).
- **Topbar height:** 56px — canonical. All other chrome heights flow from this rhythm.
- **Panel header height:** 44px — matches sidebar contract.

## Motion
- **Approach:** Minimal-functional. Only transitions that aid comprehension.
- **Easing:** `enter: ease-out`, `exit: ease-in`, `move: ease-in-out`.
- **Duration:** hover `120ms` (matches topbar), panel open `200ms`, modal enter `200ms`. No spring physics. No scroll choreography. No entrance animations on first paint.
- **Reduced motion:** respect `prefers-reduced-motion: reduce` — disable all non-essential transitions.

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

## Anti-Slop Rules (enforce in QA and code review)

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
| 2026-04-16 | DESIGN.md created | /design-consultation run after /plan-design-review flagged purple as AI slop. First formal design system for Buildrik. |
| 2026-04-16 | Rip `--aqb-primary` (indigo) and `--aqb-secondary` (violet) | Existing tokens were the exact AI-slop accents the design review banned. |
| 2026-04-16 | One accent = cobalt `#2D6DFF` | Reuses existing `--blue2`. Ships immediately without token churn. |
| 2026-04-16 | Typography: General Sans / Inter Tight or Geist / Geist Mono | No default stacks. Geist Mono required for tabular numbers. |
| 2026-04-18 | Sidebar Panel System — PanelShell grammar | Per-tab CSS (10K+ lines across 8 tabs) was making consistency impossible. |
| 2026-04-18 | Three-width rule (240 / 320 / fullpage) | Current widths had no rule. Users relearned spatial expectation per tab. |
| 2026-04-18 | 28/32/48 row density, never 40 | 40px is the SaaS default. Dropping to 32px is the "professional tool" signal. |
| 2026-04-18 | **DIRECTION FLIP — editor is now light-chrome, not dark** | User identified that topbar (light) and sidebar (dark) were two parallel systems. Called for unification. Chose LIGHT as canonical because topbar already ships. Inverts previous "dark-only" decision. |
| 2026-04-18 | **Topbar is the token reference surface** | Topbar's `#F8FAFC` panel, `#CBD5E1` border, `#334155` text, `#64748B` secondary text — all become canonical `--aqb-*` tokens. Every other surface inherits from this. |
| 2026-04-18 | **NO BLACK rule** | User explicit: "aik bhee black color ni chai hai." Primary text caps at slate-700 (`#334155`). No surface or fill darker than that. Includes legacy `#1F2937` avatar pill. |
| 2026-04-18 | **Account avatar flips from `#1F2937` to cobalt** | Legacy near-black pill violates NO BLACK. Cobalt + white icon becomes a branded avatar, aligned with single-accent rule. |
| 2026-04-18 | Font stack fix — drop all system fallbacks | Current `--aqb-font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` violates DESIGN.md explicit "no Roboto/system-ui/Helvetica" rule. Replaced with `"Inter Tight", sans-serif` only. |
| 2026-04-18 | Delete legacy navbar tokens `--bar`, `--blue`, `--txt`, etc. | Dead tokens from first-gen editor. 11 tokens, used in a handful of legacy places. Replace with `--aqb-*` canonical. |
| 2026-04-18 | Add Design + Publish to rail | Previously keyboard-only, inconsistent with every other config surface. Goes in Config zone. |
| 2026-04-19 | **Buildrik DS V1** — supersedes V3 theme unification | V3 shipped ~65% complete. DS V1 locks 7 architecture decisions: strict site/shell namespace, no alias layers, `--accent` alias-then-drain, a11y.css owns all media queries, intent+path hex lint, INSPECTOR_TOKENS codemod (single-commit convergence), full token versioning framework. Aggregator execution (no big-switch). See `docs/superpowers/specs/2026-04-19-buildrik-design-system-v1-design.md`. |
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

1. **Cobalt `#2D6DFF` is used ONLY where §Color §Accent Usage Rules already allow** — primary CTA, selection outlines and selected-row tint, active rail/tab indicator, focus rings, account avatar. Nowhere else in chrome.
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
