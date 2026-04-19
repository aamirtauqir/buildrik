# Design System — Buildrik

## Product Context
- **What this is:** AI-powered drag-and-drop website builder editor. Three creation modes (drag, templates, AI generate) sharing one element vocabulary.
- **Who it's for:** Solo designers currently billing clients on Webflow or Framer. Time-constrained power users, not beginners.
- **Space / industry:** Designer-grade web builders. Peers: Webflow, Framer, Webstudio. Not peers: Wix, Squarespace, Durable (different wedge).
- **Project type:** Desktop web app with separate marketing site. Editor chrome is the primary surface.

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

### Removed / Migrated Tokens (delete on next token pass)

- Every dark surface token: `--aqb-bg-dark`, `--aqb-bg-darker`, `--aqb-bg-panel-secondary`, `--aqb-bg-panel-tertiary`, `--aqb-bg-elevated` old values, `--aqb-surface-1` through `--aqb-surface-5` — remove entirely.
- Every dark-theme `--ls-*` token aliased to dark — reroute to new light `--aqb-*`.
- `--aqb-primary`, `--aqb-primary-hover`, `--aqb-primary-active`, `--aqb-primary-light`, `--aqb-primary-muted`, `--aqb-primary-subtle` — delete, use `--accent` family only. These are historical aliases from the pre-cobalt migration.
- `--bar`, `--bar2`, `--barStroke`, `--pillStroke`, `--pillStroke2`, `--txt`, `--muted`, `--blue`, `--blue2`, `--green`, `--green2` — legacy "navbar" tokens from the first editor. Delete.
- Any hex literals inside `.tb*` topbar classes — replace with new `--aqb-*` tokens.
- `--media-img`, `--media-vid`, `--media-ico`, `--media-fnt` — category-colored accents. Delete.

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

The left sidebar has 8 rail-visible tabs (Add, Templates, Media, Layers, Pages, Components, Settings, History). Every panel composes the same primitives. Every tab is the same machine with different cargo.

### Grammar — PanelShell

```
PanelShell
├── PanelHeader    (44px, required)   title · spacer · icon actions · pin · close
├── PanelToolbar   (36px, optional)   search · filters · primary action
├── PanelContent   (flex, scrollable) 12px padding · 4px gap rhythm
└── PanelFooter    (40px, optional)   selection count · batch actions · status
```

All 8 tabs compose these four zones. Lives at `packages/editor/src/editor/sidebar/shared/panel/`. Canonical classnames `ps-*`.

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
