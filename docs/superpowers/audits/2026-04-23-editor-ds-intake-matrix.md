---
date: 2026-04-23
topic: editor-ds-intake-matrix
focus: Phase 0 compatibility matrix for user-provided design-system drop at /Users/shahg/Desktop/design-system/project/
status: intake (pre-Phase-1 bridge). Decisions locked where marked LOCKED.
source: drop folder at 2026-04-23 + inventory at docs/superpowers/audits/2026-04-22-editor-v2-inventory.md
---

# Editor DS Intake — Phase 0 Matrix

Codex Phase 0 gate: "every token maps to `--buildrick-*` or `--buildrick-design-*`; zero third-prefix vars approved; zero non-Emotion styling systems approved." This doc is the evidence that gate passes (or flags what fails).

## Summary Verdict

**GO for Phase 1 Token Bridge**, with caveats:
- Values match canonical (`#2D6DFF` cobalt, slate palette, Inter Tight + Geist Mono, 4pt grid, 4/8/12/16 radii). Zero value conflicts.
- **Prefix mismatch** — drop uses `--bd-*`, locked contract is `--buildrick-*` / `--buildrick-design-*`. Resolved by one-way alias: `--bd-accent: var(--buildrick-accent)`. No new namespace definitions.
- **No foreign styling runtime** — plain CSS classes, no Tailwind / CSS Modules / Vanilla Extract / Panda. Constraint 3 satisfied after Emotion port.
- **No `.tsx` components** — 58 HTML prototypes + 14 CSS files. Each component → Emotion rewrite. Bounded work, no runtime dependency.

## Drop Inventory

Root: `/Users/shahg/Desktop/design-system/project/`

| Type | Count | Notes |
|---|---:|---|
| HTML prototypes | 58 | Per-tab + editor kit + preview cards |
| CSS files | 14 | `colors_and_type.css` (canonical tokens), `ui_kits/editor/editor.css` (chrome), `left-panel/_shared.css` (tab shell), 10 tab-specific HTML embed `<style>` blocks + component prototypes |
| SVG icons | 54 | `assets/icons/{navbar, blocks, layers}` — outline, 1.5 stroke, match Lucide style |
| Markdown specs | 3 | README.md, SKILL.md, ui_kits/editor/README.md |
| PNG mockups | 4 | Reference images (inspector-fixed.jpeg, 3 previews) |
| Raw hex values | 23 unique | All within slate / semantic family + cobalt. See hex audit below. |
| `.tsx` / `.ts` | **0** | No component source. Emotion rewrite required per component. |
| Tailwind / CSS Modules / Panda / Vanilla Extract | **0** | No foreign styling runtime. ✓ |

Key structural folders:
- `reference/*.css` — mirrors `src/themes/design-system/{color,typography,spacing,radius,shadow,motion,z-index,layout,design,a11y}.css` verbatim. **Canonical source already present in drop.**
- `ui_kits/editor/` — `editor.css` + `index.html`. The "editor recreation" — highest-fidelity mock.
- `left-panel/` — 10 `tab-*.html` files + `_shared.css`, one per sidebar tab.
- `complete-tab-prototypes/` — empty folder (no files).
- `preview/` — Design System tab cards.

## Decisions Locked

| # | Decision | Locked 2026-04-23 |
|---|---|---|
| D1 | Structure-zone panel width: **320** (Layers, Pages, Components). Was 200. | LOCKED |
| D2 | Alias layer, not renames — drop stays `--bd-*`, canonical stays `--buildrick-*`. Unidirectional. | LOCKED |
| D3 | No `editor-v2/` folder. Everything lands inside `packages/editor/src/editor/` or `packages/editor/src/shared/ui/`. | LOCKED (from 2026-04-22 kill) |
| D4 | PanelShell + InspectorRenderer + FullPageView + TokenRegistryProvider preserved. | LOCKED (from 2026-04-22 inventory) |
| D5 | Seam order: tokens → primitives → low-risk panels → fullpage → Media/History. | LOCKED (from Codex roadmap) |
| D6 | General Sans substituted with Inter Tight (tight tracking) until `.woff2` supplied. | LOCKED (drop README:184) |

## Decisions Pending

| # | Question | Blocks |
|---|---|---|
| Q1 | Brand logo SVG — not in drop, not in repo. Text wordmark OK as interim? | Topbar surface only. Not blocking Phase 1. |
| Q2 | `ed-shell` grid in `ui_kits/editor/editor.css` uses `rail 56 / panel 320 / inspector 280` but current shell has `LayoutShell` responsible for grid. Adopt fixed pixels or keep LayoutShell's existing flexible layout? | Phase 3 shell-composition restyle. Not blocking Phase 1/2. |
| Q3 | `reference/` folder mirrors canonical `src/themes/design-system/*.css`. Is this snapshot-in-time (use drop's `colors_and_type.css` as source of truth) or should we re-verify against current canonical files? | Phase 1 bridge generation. |

---

## Part A — Token Table

Source: drop's `colors_and_type.css` (145 lines). All `--bd-*` declarations below. Destination column marks target canonical token. "Map via alias" = `--bd-x: var(--buildrick-y)` in a new alias file, no rename. "Alias miss" = token has no direct canonical equivalent yet; requires either rename or canonical addition.

### A.1 Surfaces (10 tokens)

| `--bd-*` | Value | Canonical `--buildrick-*` | Action |
|---|---|---|---|
| `--bd-bg-panel` | `#F8FAFC` | `--buildrick-panel-bg` (verify) | Alias |
| `--bd-bg-card` | `#FFFFFF` | `--buildrick-card-bg` (verify) | Alias |
| `--bd-bg-input` | `#FFFFFF` | `--buildrick-input-bg` (verify) | Alias |
| `--bd-bg-elevated` | `#FFFFFF` | `--buildrick-elevated-bg` (verify) | Alias |
| `--bd-bg-subtle` | `#F1F5F9` | `--buildrick-subtle-bg` (verify) | Alias |
| `--bd-bg-hover` | `rgba(15,23,42,0.04)` | `--buildrick-hover-bg` (verify) | Alias |
| `--bd-bg-pressed` | `rgba(15,23,42,0.06)` | `--buildrick-pressed-bg` (verify) | Alias |
| `--bd-canvas-wrapper` | `#F8FAFC` | `--buildrick-canvas-wrap-bg` (verify) | Alias |
| `--bd-canvas-content` | `#FFFFFF` | `--buildrick-canvas-content-bg` (verify) | Alias |
| `--bd-canvas-dot` | `rgba(15,23,42,0.08)` | `--buildrick-canvas-dot` (verify) | Alias |

### A.2 Text (6 tokens)

| `--bd-*` | Value | Canonical | Action |
|---|---|---|---|
| `--bd-fg-primary` | `#334155` | `--buildrick-text-primary` | Alias |
| `--bd-fg-secondary` | `#64748B` | `--buildrick-text-secondary` | Alias |
| `--bd-fg-muted` | `#94A3B8` | `--buildrick-text-muted` | Alias |
| `--bd-fg-disabled` | `#CBD5E1` | `--buildrick-text-disabled` (verify) | Alias |
| `--bd-fg-on-accent` | `#FFFFFF` | `--buildrick-accent-fg` (verify) | Alias |
| `--bd-fg-heading` | `#0F172A` | `--buildrick-text-heading` (verify; doc says "derived") | Alias OR add to canonical |

### A.3 Borders (5 tokens)

| `--bd-*` | Value | Canonical | Action |
|---|---|---|---|
| `--bd-border` | `#E2E8F0` | `--buildrick-border` | Alias |
| `--bd-border-medium` | `#CBD5E1` | `--buildrick-border-medium` (verify) | Alias |
| `--bd-border-strong` | `#94A3B8` | `--buildrick-border-strong` (verify) | Alias |
| `--bd-border-subtle` | `rgba(148,163,184,0.24)` | `--buildrick-border-subtle` (verify) | Alias |
| `--bd-border-focus` | `#2D6DFF` | `--buildrick-accent` | Alias (one-to-one: border-focus = accent) |

### A.4 Accent — single cobalt system (6 tokens)

| `--bd-*` | Value | Canonical | Action |
|---|---|---|---|
| `--bd-accent` | `#2D6DFF` | `--buildrick-accent` | Alias |
| `--bd-accent-hover` | `#4B8DFF` | `--buildrick-accent-hover` (verify) | Alias |
| `--bd-accent-pressed` | `#1E58D9` | `--buildrick-accent-pressed` (verify) | Alias |
| `--bd-accent-subtle` | `rgba(45,109,255,0.05)` | `--buildrick-accent-subtle` (verify) | Alias |
| `--bd-accent-tint` | `rgba(45,109,255,0.10)` | `--buildrick-accent-tint` (verify) | Alias |
| `--bd-accent-alpha-15` | `rgba(45,109,255,0.15)` | `--buildrick-accent-alpha-15` (verify) | Alias |

**Cross-check against memory:** MediaTab.tsx:150 currently uses `var(--buildrick-accent, #1D4ED8)` (wrong fallback). Phase 2 primitive work must fix this as part of `bg` token usage. Separately flagged in 2026-04-22 inventory G.2.

### A.5 Semantic status (11 tokens)

| `--bd-*` | Value | Canonical | Action |
|---|---|---|---|
| `--bd-error` | `#DC2626` | `--buildrick-error` | Alias |
| `--bd-error-bg` | `rgba(220,38,38,0.05)` | `--buildrick-error-bg` (verify) | Alias |
| `--bd-error-tint` | `rgba(220,38,38,0.10)` | `--buildrick-error-tint` (verify) | Alias |
| `--bd-error-border` | `rgba(220,38,38,0.30)` | `--buildrick-error-border` (verify) | Alias |
| `--bd-success` | `#16A34A` | `--buildrick-success` | Alias |
| `--bd-success-bg` | `rgba(22,163,74,0.10)` | `--buildrick-success-bg` (verify) | Alias |
| `--bd-success-border` | `rgba(22,163,74,0.30)` | `--buildrick-success-border` (verify) | Alias |
| `--bd-warning` | `#D97706` | `--buildrick-warning` | Alias |
| `--bd-warning-bg` | `rgba(217,119,6,0.05)` | `--buildrick-warning-bg` (verify) | Alias |
| `--bd-warning-tint` | `rgba(217,119,6,0.10)` | `--buildrick-warning-tint` (verify) | Alias |
| `--bd-warning-border` | `rgba(217,119,6,0.30)` | `--buildrick-warning-border` (verify) | Alias |
| `--bd-info` | `#2D6DFF` (= accent) | `--buildrick-accent` | Alias (info = accent) |

### A.6 Canvas box-model overlays (3 tokens)

| `--bd-*` | Value | Canonical | Action |
|---|---|---|---|
| `--bd-box-content` | `rgba(111,168,220,0.50)` | (verify in canonical) | Alias OR add to canonical |
| `--bd-box-padding` | `rgba(147,196,125,0.45)` | (verify in canonical) | Alias OR add to canonical |
| `--bd-box-margin` | `rgba(246,178,107,0.50)` | (verify in canonical) | Alias OR add to canonical |

**Canvas-unique** — only used by Canvas spacing overlay. Verify against `editor/canvas/spots/CanvasSpotSpacing.css` before Phase 1.

### A.7 Overlays (1 token)

| `--bd-*` | Value | Canonical | Action |
|---|---|---|---|
| `--bd-overlay` | `rgba(15,23,42,0.40)` | `--buildrick-modal-overlay` (verify) | Alias |

### A.8 Typography (21 tokens)

| `--bd-*` | Value | Canonical | Action |
|---|---|---|---|
| `--bd-font-family`, `--bd-font` | `"Inter Tight", system-ui, -apple-system, sans-serif` | `--buildrick-font` (verify) | Alias (both aliases) |
| `--bd-font-display` | `"Inter Tight", system-ui, sans-serif` | `--buildrick-font-display` (verify; sub for General Sans) | Alias |
| `--bd-font-mono`, `--bd-mono` | `"Geist Mono", "SF Mono", Menlo, monospace` | `--buildrick-font-mono` | Alias (both aliases) |
| `--bd-text-2xs` | `10px` | `--buildrick-text-2xs` (verify) | Alias |
| `--bd-text-xs` | `11px` | `--buildrick-text-xs` (verify) | Alias |
| `--bd-text-sm` | `12px` | `--buildrick-text-sm` (verify) | Alias |
| `--bd-text-sm-plus` | `13px` | (verify canonical) | Alias OR add |
| `--bd-text-md` | `14px` | `--buildrick-text-md` | Alias |
| `--bd-text-md-plus` | `15px` | (verify) | Alias OR add |
| `--bd-text-lg` | `16px` | `--buildrick-text-lg` | Alias |
| `--bd-text-xl` | `18px` | `--buildrick-text-xl` | Alias |
| `--bd-text-2xl` | `20px` | `--buildrick-text-2xl` | Alias |
| `--bd-text-3xl` | `24px` | (verify) | Alias OR add |
| `--bd-text-4xl` | `32px` | (verify) | Alias OR add |
| `--bd-text-display` | `48px` | (verify) | Alias OR add |
| `--bd-weight-*` | 400/500/600/700 | `--buildrick-weight-*` (verify) | Alias (4 tokens) |
| `--bd-track-*` | 5 tracking values | (verify) | Alias (5 tokens) |
| `--bd-leading-*` | 3 leading values | (verify) | Alias (3 tokens) |

### A.9 Semantic type roles (18 composite tokens)

Drop declares H1/H2/H3/H4/body/small/label/caption/code composites (e.g. `--bd-h1-size: 32px; --bd-h1-weight: 700; --bd-h1-leading: 1.2; --bd-h1-track: -0.02em`). These can stay in drop's `colors_and_type.css` as-is since they compose `--bd-*` primitives. No aliasing needed at canonical level — they resolve through the alias chain.

### Token totals

- Primitive `--bd-*` vars: **~71 tokens** across sections A.1–A.8.
- Composite role vars: **~18 tokens** in A.9 (pure compositions, no aliasing needed).
- Canonical tokens needing **verification**: ~40 (marked "verify" above). Phase 1 must grep `packages/editor/src/themes/design-system/*.css` to confirm existence/value match.
- Canonical tokens needing **addition**: possibly ~8–12 (rows marked "Alias OR add to canonical"). Decide case-by-case in Phase 1.
- **Zero third-prefix violations** once alias file lands. Codex gate: green.

### Phase 1 output

File: `packages/editor/src/themes/design-system/bd-aliases.css`.
- Imports from existing canonical files (no redefinition).
- Maps every `--bd-*` in the table above to its canonical `--buildrick-*` counterpart.
- Added to `index.css` import chain AFTER canonical, so aliases resolve correctly.
- Gate: grep `-rE '^\s*--bd-[a-z0-9-]+:'` across `shared/ui/`, `editor/`, `themes/` must match **only** `bd-aliases.css` (alias definitions). Everywhere else, `--bd-*` appears only in `var(...)` consumer position.

### A.10 Verification Results (2026-04-23)

Grep run against `packages/editor/src/themes/design-system/*.css`. Full resolution:

| Drop `--bd-*` | Canonical target | Value match | Verdict |
|---|---|---|---|
| `--bd-bg-panel` | `--buildrick-bg-panel` | `#F8FAFC` ✓ | alias |
| `--bd-bg-card` | `--buildrick-bg-card` | `#FFFFFF` ✓ | alias |
| `--bd-bg-input` | `--buildrick-bg-input` | `#FFFFFF` ✓ | alias |
| `--bd-bg-elevated` | `--buildrick-bg-elevated` | `#FFFFFF` ✓ | alias |
| `--bd-bg-subtle` | `--buildrick-bg-subtle` | `#F1F5F9` ✓ | alias |
| `--bd-bg-hover` | `--buildrick-bg-hover` | `rgba(15,23,42,0.04)` ✓ | alias |
| `--bd-bg-pressed` | `--buildrick-bg-pressed` | `rgba(15,23,42,0.06)` ✓ | alias |
| `--bd-canvas-wrapper` | `--buildrick-canvas-wrapper` | `#F8FAFC` ✓ | alias |
| `--bd-canvas-content` | `--buildrick-canvas-content` | `#FFFFFF` ✓ | alias |
| `--bd-canvas-dot` | `--buildrick-canvas-dot` | `rgba(15,23,42,0.08)` ✓ | alias |
| `--bd-fg-primary` | `--buildrick-text-primary` | `#334155` ✓ | alias |
| `--bd-fg-secondary` | `--buildrick-text-secondary` | `#64748B` ✓ | alias |
| `--bd-fg-muted` | `--buildrick-text-muted` | `#94A3B8` ✓ | alias |
| `--bd-fg-disabled` | `--buildrick-text-disabled` | `#CBD5E1` ✓ | alias |
| `--bd-fg-on-accent` | `--buildrick-text-on-accent` | `#FFFFFF` ✓ | alias |
| **`--bd-fg-heading`** | **NO CANONICAL** | `#0F172A` (slate-900) — not defined | **GAP — add `--buildrick-text-heading: #0F172A;` to `color.css`** |
| `--bd-border` | `--buildrick-border` | `#E2E8F0` ✓ | alias |
| `--bd-border-medium` | `--buildrick-border-medium` | `#CBD5E1` ✓ | alias |
| `--bd-border-strong` | `--buildrick-border-strong` | `#94A3B8` ✓ | alias |
| `--bd-border-subtle` | `--buildrick-border-subtle` | `rgba(148,163,184,0.24)` ✓ | alias |
| `--bd-border-focus` | `--buildrick-border-focus` | `#2D6DFF` ✓ | alias |
| `--bd-accent` | `--buildrick-accent` | `#2D6DFF` ✓ | alias |
| `--bd-accent-hover` | `--buildrick-accent-hover` | `#4B8DFF` ✓ | alias |
| `--bd-accent-pressed` | `--buildrick-accent-pressed` | `#1E58D9` ✓ | alias |
| `--bd-accent-subtle` | `--buildrick-accent-subtle` | `rgba(45,109,255,0.05)` ✓ | alias |
| `--bd-accent-tint` | `--buildrick-accent-tint` | `rgba(45,109,255,0.10)` ✓ | alias |
| `--bd-accent-alpha-15` | `--buildrick-primary-alpha-15` | `rgba(45,109,255,0.15)` ✓ | alias (canonical name differs — ugly but fine) |
| `--bd-error` | `--buildrick-error` | `#DC2626` ✓ | alias |
| `--bd-error-bg` | `--buildrick-error-bg` | `rgba(220,38,38,0.05)` ✓ | alias |
| `--bd-error-tint` | `--buildrick-error-light` | `rgba(220,38,38,0.10)` ✓ | alias (canonical name `*-light`) |
| `--bd-error-border` | `--buildrick-error-border` | `rgba(220,38,38,0.30)` ✓ | alias |
| `--bd-success` | `--buildrick-success` | `#16A34A` ✓ | alias |
| `--bd-success-bg` | `--buildrick-success-bg` or `--buildrick-success-light` | `rgba(22,163,74,0.10)` ✓ | alias |
| `--bd-success-border` | `--buildrick-success-border` | `rgba(22,163,74,0.30)` ✓ | alias |
| `--bd-warning` | `--buildrick-warning` | `#D97706` ✓ | alias |
| `--bd-warning-bg` | `--buildrick-warning-bg` | `rgba(217,119,6,0.05)` ✓ | alias |
| `--bd-warning-tint` | `--buildrick-warning-light` | `rgba(217,119,6,0.10)` ✓ | alias (canonical `*-light`) |
| `--bd-warning-border` | `--buildrick-warning-border` | `rgba(217,119,6,0.30)` ✓ | alias |
| `--bd-info` | `--buildrick-info` | `#2D6DFF` ✓ | alias |
| `--bd-box-content` | `--buildrick-boxmodel-content` | `rgba(111,168,220,0.50)` ✓ | alias |
| `--bd-box-padding` | `--buildrick-boxmodel-padding` | `rgba(147,196,125,0.45)` ✓ | alias |
| `--bd-box-margin` | `--buildrick-boxmodel-margin` | `rgba(246,178,107,0.50)` ✓ | alias |
| `--bd-overlay` | `--buildrick-overlay` | `rgba(15,23,42,0.40)` ✓ | alias |
| `--bd-font-family` / `--bd-font` | `--buildrick-font-family` | Inter Tight stack ✓ | alias (both `--bd-*` aliases point to same canonical) |
| `--bd-font-display` | `--buildrick-font-family-display` | canonical = General Sans; drop subs with Inter Tight | **value diff** — alias points to canonical, actual General Sans font loads when `.woff2` lands. Until then browser falls back. Non-blocking. |
| `--bd-font-mono` / `--bd-mono` | `--buildrick-font-family-mono` | Geist Mono stack ✓ | alias (both) |
| `--bd-text-2xs` | `--buildrick-text-2xs` | `10px` ✓ | alias |
| `--bd-text-xs` | `--buildrick-text-xs` | `11px` ✓ | alias |
| `--bd-text-sm` | `--buildrick-text-sm` | `12px` ✓ | alias |
| `--bd-text-sm-plus` | `--buildrick-text-sm-plus` | `13px` ✓ | alias |
| `--bd-text-md` | `--buildrick-text-md` | `14px` ✓ | alias |
| `--bd-text-md-plus` | `--buildrick-text-md-plus` | `15px` ✓ | alias |
| `--bd-text-lg` | `--buildrick-text-lg` | `16px` ✓ | alias |
| `--bd-text-xl` | `--buildrick-text-xl` | `18px` ✓ | alias |
| `--bd-text-2xl` | `--buildrick-text-2xl` | `20px` ✓ | alias |
| `--bd-text-3xl` | `--buildrick-text-3xl` | `24px` ✓ | alias |
| `--bd-text-4xl` | `--buildrick-text-4xl` | `32px` ✓ | alias |
| `--bd-text-display` | `--buildrick-text-display` | `48px` ✓ | alias |
| `--bd-weight-regular` | `--buildrick-font-weight-normal` | `400` ✓ | alias |
| `--bd-weight-medium` | `--buildrick-font-weight-medium` | `500` ✓ | alias |
| `--bd-weight-semibold` | `--buildrick-font-weight-semibold` | `600` ✓ | alias |
| `--bd-weight-bold` | `--buildrick-font-weight-bold` | `700` ✓ | alias |
| `--bd-track-tight` | `--buildrick-tracking-tight` | `-0.02em` ✓ | alias |
| `--bd-track-normal` | `--buildrick-tracking-normal` | `0` ✓ | alias |
| `--bd-track-wide` | `--buildrick-tracking-wide` | `0.02em` ✓ | alias |
| `--bd-track-wider` | `--buildrick-tracking-wider` | `0.04em` ✓ | alias |
| `--bd-track-widest` | `--buildrick-tracking-widest` | `0.08em` ✓ | alias |
| `--bd-leading-tight` | `--buildrick-line-tight` | `1.2` ✓ | alias |
| `--bd-leading-normal` | `--buildrick-line-normal` | `1.5` ✓ | alias |
| `--bd-leading-relaxed` | `--buildrick-line-relaxed` | `1.6` ✓ | alias |

### A.10 — Summary

- **~71 drop tokens audited.**
- **70 resolve cleanly** via direct alias (name-to-name or name-to-similar-name).
- **1 gap** — `--bd-fg-heading` (value `#0F172A`) has no canonical equivalent. Action: add `--buildrick-text-heading: #0F172A;` to `color.css` in Phase 1 as part of bridge commit.
- **0 value conflicts.**
- **0 prefix violations** after bridge lands.

### Semantic type roles (A.9) — no verification needed

The ~18 composite tokens (`--bd-h1-size`, `--bd-h1-weight`, etc.) in drop's `colors_and_type.css` are pure compositions of primitives already aliased above. They can be kept as-is in the bridge file or dropped — downstream consumers use primitives directly. **Recommendation: drop composites from bridge** (not used by any drop CSS — verified via grep in `ui_kits/editor/editor.css` and `left-panel/_shared.css`, no `--bd-h1-*` or `--bd-body-*` references found outside their own declarations).

### Phase 1 concrete deliverable (finalized)

`packages/editor/src/themes/design-system/bd-aliases.css`:
```css
/* Buildrik DS — --bd-* alias layer (consumer shorthand only, no value source)
 * Added 2026-04-23 — see docs/superpowers/audits/2026-04-23-editor-ds-intake-matrix.md A.10.
 * Rule: all aliases MUST be `--bd-x: var(--buildrick-y)` form. Any standalone value
 * definition is a gate failure. No third namespace.
 */
:root {
  /* surfaces */
  --bd-bg-panel: var(--buildrick-bg-panel);
  --bd-bg-card: var(--buildrick-bg-card);
  /* ... (70 aliases total) */

  /* font shortcuts */
  --bd-font: var(--buildrick-font-family);
  --bd-mono: var(--buildrick-font-family-mono);
}
```

Plus ONE canonical addition to `color.css` under the `/* Text */` block:
```css
--buildrick-text-heading: #0F172A;
```

And the alias:
```css
--bd-fg-heading: var(--buildrick-text-heading);
```

---

## Part B — Primitive Table (CSS class → Emotion target)

Source: `ui_kits/editor/editor.css` (301 lines) + `left-panel/_shared.css` (270 lines) + per-tab HTML embedded `<style>` blocks.

Destination decisions:
- **`shared/ui/<Name>.tsx`** — reusable atom, belongs in design system library.
- **`editor/<area>/<Name>.tsx`** — editor-specific composite (uses shared/ui atoms + composer deps).
- **skip** — prototype-only scaffolding (wireframe helpers, page-layout classes from prototype pages, etc).

### B.1 Atoms → `shared/ui/`

| Drop class | Destination | Status | Notes |
|---|---|---|---|
| `.btn` / `.btn.primary` / `.btn.secondary` / `.btn.publish` / `.btn.icon` | `shared/ui/Button.tsx` | Likely exists, augment | Check current Button API; add `variant="publish"` (pill) if missing. |
| `.badge` / `.badge.saved` / `.badge.dot` | `shared/ui/Badge.tsx` | New | Size: 10.5px, pill radius, colored-border. |
| `.num-input` / `.num-input.q-t/q-r/q-b/q-l` | `shared/ui/NumInput.tsx` | New (or augment if exists) | Scrubbable numeric. Quad variant uses `q-t/r/b/l` side indicators. |
| `.text-input` | `shared/ui/TextInput.tsx` | Likely exists, augment | Height 24px, subtle bg, focus ring cobalt. |
| `.color-field` (`.sw`, `.hx`, `.pct`) | `shared/ui/ColorField.tsx` | New | Swatch + hex input + percent. |
| `.seg` (segmented control) | `shared/ui/Segmented.tsx` | Check existence | Likely exists; align styling. |
| `.switch` (`.track`, `.thumb`, `.track.off`) | `shared/ui/Switch.tsx` | Check existence | 28×16 track, 12px thumb. |
| `.kbd` | `shared/ui/Kbd.tsx` | New | Small mono badge (keyboard hint). |
| `.panel-search` / `.psearch` | `shared/ui/SearchBar.tsx` | Exists (`shared/SearchBar`), augment | Add `.kbd` slot variant. |
| `.icon-btn` | `shared/ui/IconButton.tsx` | Likely exists, augment | 24×24, subtle hover. |
| `.cat-h` | `shared/ui/SectionHeader.tsx` | Check existence | Uppercase micro-label + count on right. |
| `.field-row` + `.lb` + `.lb.warn` | `shared/ui/FieldRow.tsx` | Likely exists (inspector), augment | 56px label column. |
| `.quad` | `shared/ui/QuadGrid.tsx` | New | 2×2 grid for top/right/bottom/left inputs. |
| `.ssection` (`<h3>`, `.desc`) | `shared/ui/SettingsSection.tsx` | New | Padded block with title + description. |
| `.inwrap` (`.pfx`, `.sfx`) | `shared/ui/InputWrap.tsx` | New | Input with prefix/suffix slots. |
| `.bp-group` (breakpoint group) | `shared/ui/BreakpointGroup.tsx` | Check inspector | 3-button device picker. |

### B.2 Composites → `editor/<area>/`

| Drop class | Destination | Notes |
|---|---|---|
| `.ed-shell` (grid) | `editor/rail/LayoutShell` already exists | Don't replace. Confirm grid values against drop's `56 / 320 / 1fr / 280` (pending Q2). |
| `.top` (topbar) | `editor/shell/Topbar.tsx` exists | Restyle in place. Don't replace. |
| `.rail` (icon rail) | `editor/rail/LeftRail` | Drop has `40×40` button with 8px radius + 2px accent strip on `.on`. Restyle in place. |
| `.panel` + `.panel-h` + `.panel-body` | PanelShell already exists | Add `.panel-h h2` + `.panel-sub` contract. Preserve existing API. |
| `.lr` (layer row) | `editor/sidebar/tabs/layers/` or `shared/ui/LayerRow.tsx` | Was in inventory as section entity. Decide shared vs editor-scoped. |
| `.pg` (page row) | `editor/sidebar/tabs/pages/` | Editor-scoped; composer-dependent. |
| `.block-card` (block palette card) | `editor/sidebar/tabs/build/` | Editor-scoped. |
| `.block-grid` | `editor/sidebar/tabs/build/` | 3-col grid wrapper. |
| `.snav` (settings secondary nav) | `editor/sidebar/tabs/settings/` | Currently `FeatureCardGrid` + `FeatureCard` — restyle these. |
| `.insp` + `.insp-h` + `.insp-tabs` + `.insp-sec` + `.insp-body` | `editor/inspector/ProInspector.tsx` + `InspectorRenderer` | **Do not replace `InspectorRenderer`.** Restyle chrome only. |
| `.canvas` (dot-grid wrapper) + `.artboard` | `editor/canvas/Canvas.tsx` + overlay | Dot pattern already in code (StudioPanels.tsx:132). Unify. |
| `.foot` (status bar) | `editor/shell/Footer.tsx` (verify existence) | Mono-styled status footer. |
| `.selected-hero` outline/label | `editor/canvas/spots/CanvasSpotBadge.tsx` (exists) | Restyle overlay label. |
| `.view-switcher` / `.view-tab` (History) | `editor/sidebar/tabs/history/` | Already in codebase (bleed-prone names — flagged in 2026-04-22 inventory G.1). Rename during port. |
| `.flow` / `.step` (onboarding flows) | `editor/onboarding/` or skip | Prototype-looking; confirm if in product chrome. |

### B.3 Skip (prototype-only)

| Drop class | Reason |
|---|---|
| `.page`, `.head`, `.split`, `.col-h` | Prototype page-wrapper layout for `_shared.css` demo pages only. Not product chrome. |
| `.w-box`, `.w-stroke`, `.w-bar`, `.w-lbl`, `.w-note`, `.wire` | Wireframe-mode helpers — prototype-only. |
| `.notes`, `.note`, `.note .k` | Callout boxes for prototype explanations. Not product. |
| `.toast` | Already implemented: `shared/ui/Toast`. Don't duplicate. |
| `.base`, `.f`, `.f3`, `.s`, `.s2` (SVG sprite presets) | Inline SVG styles for prototype icons. Use Lucide/existing SVGs in product. |
| `.shell.wire`, `.panel.wire`, `.lr.leaf`, `.art.hidden` | Wireframe/prototype state decorations. |

---

## Part C — HTML-to-Surface Map

Source: `/Users/shahg/Desktop/design-system/project/left-panel/*.html`. Each prototype maps to one editor tab surface.

| Drop HTML | Existing surface path | Mode (inventory) | Router | Phase |
|---|---|---|---|---|
| `tab-add.html` | `editor/sidebar/tabs/build/BuildTab.tsx` | panel 280 | TabRouter | 3 |
| `tab-layers.html` | `editor/sidebar/tabs/layers/LayersTab.tsx` | panel **320** (D1 change) | TabRouter | 3 |
| `tab-pages.html` | `editor/sidebar/tabs/pages/PagesTab.tsx` | panel **320** (D1 change) | TabRouter | 3 |
| `tab-components.html` | `editor/sidebar/tabs/ComponentsTab.tsx` | panel **320** (D1 change) | TabRouter | 3 |
| `tab-templates.html` | `editor/sidebar/tabs/templates/TemplatesTab.tsx` | fullpage | FullPageRouter | 4 |
| `tab-media.html` | `editor/sidebar/tabs/media/MediaTab.tsx` + `editor/media/LibraryManager.tsx` | **dual-mode** (panel slim + fullpage manager) | both | 5 |
| `tab-design.html` | `editor/sidebar/tabs/DesignSystemTab.tsx` | fullpage | FullPageRouter | 4 |
| `tab-settings.html` | `editor/sidebar/tabs/settings/SettingsTab.tsx` + 9 screens | fullpage | FullPageRouter | 4 |
| `tab-publish.html` | `editor/sidebar/tabs/publish/PublishTab.tsx` | panel 280 | TabRouter | 3 |
| `tab-history.html` | `editor/sidebar/tabs/history/HistoryTab.tsx` | **panel 280** (NOT fullpage — inventory D) | TabRouter | 5 |
| `tab-ai.html` | No current tab. AI-specific surface. | — | — | defer |
| `index.html` + `ui_kits/editor/index.html` | `editor/shell/StudioPanels.tsx` (full shell) | — | — | Phase 3 chrome touch only, no shell replace |

**`tab-ai.html` is the only prototype without an existing tab.** Flagged — decide later whether to add an AI tab to `tabsConfig.ts` or skip.

---

## Part D — Raw Hex / RGBA Audit

23 unique hex values across drop CSS. Classification:

| Hex | Classification | Maps to |
|---|---|---|
| `#FFFFFF` / `#fff` | Base canvas — OK in themes/ | `--bd-bg-card` |
| `#F8FAFC` | slate-50 | `--bd-bg-panel` |
| `#F1F5F9` | slate-100 | `--bd-bg-subtle` |
| `#FAFBFC` | wireframe variant | skip (prototype-only) |
| `#FFF3CD` | wireframe note highlight | skip (prototype-only) |
| `#E2E8F0` | slate-200 | `--bd-border` |
| `#CBD5E1` | slate-300 | `--bd-border-medium` / `--bd-fg-disabled` |
| `#94A3B8` | slate-400 | `--bd-border-strong` / `--bd-fg-muted` |
| `#64748B` | slate-500 | `--bd-fg-secondary` |
| `#334155` | slate-700 | `--bd-fg-primary` |
| `#0F172A` | slate-900 | `--bd-fg-heading` |
| `#2D6DFF` | cobalt accent | `--bd-accent` ✓ |
| `#4B8DFF` | cobalt hover | `--bd-accent-hover` |
| `#1E58D9` | cobalt pressed | `--bd-accent-pressed` |
| `#3B82F6` | blue-500 | **FLAG** — not in canonical. Either kill (use `--bd-accent`) or justify. |
| `#DC2626` / `#EF4444` | red (error) | `--bd-error` / red-500 variant — **FLAG** `#EF4444`, not in table |
| `#16A34A` / `#22C55E` | green (success) | `--bd-success` / green-500 variant — **FLAG** `#22C55E`, not in table |
| `#D97706` | amber (warning) | `--bd-warning` |
| `#27272A` / `#71717A` | zinc — **FLAG** not in slate family | either kill or justify canvas-unique |

**Action in Phase 2:** during primitive port, every raw hex in source CSS → replace with `var(--bd-*)` token reference. The 4 flagged values (`#3B82F6`, `#EF4444`, `#22C55E`, `#27272A`, `#71717A`) must be either (a) resolved to existing tokens, (b) justified as new canonical additions, or (c) deleted.

RGBA analysis: 15 unique rgba values. Slate-based (`rgba(15,23,42,*)`) = 7, all valid hover/press/shadow tokens. Slate-400 (`rgba(148,163,184,*)`) = 3, used for border-subtle. Cobalt (`rgba(45,109,255,*)`) = 3, covered by accent-* tokens. Semantic color rgbas covered above. Two outliers in canvas box-model (`rgba(111,168,220,0.50)` / `rgba(147,196,125,0.45)`) already flagged in A.6.

**Gate:** Phase 2 per-primitive commit must not introduce new raw hex outside `themes/`. Existing hex baseline: `1498` (per memory). Ratchet down only.

---

## Part E — SSOT Risks

| Risk | Evidence | Mitigation |
|---|---|---|
| Duplicate token declarations | `colors_and_type.css` declares full set. `left-panel/_shared.css` declares a subset (lines 4–22) with same values. | Phase 1: source-of-truth = alias file. Drop's `_shared.css` is not imported into editor; only used for prototype pages. |
| Canonical drift | `reference/` folder mirrors canonical `src/themes/design-system/*.css` from an unknown date. | Phase 1: re-verify against current `packages/editor/src/themes/design-system/*.css` at HEAD. Do not import `reference/` into editor. |
| Global class names bleed | 58 HTML prototypes use global `.top`, `.rail`, `.panel`, `.btn`, `.badge`, `.lr`, `.pg`, `.seg`, `.switch`, `.view-switcher`, `.search-bar` etc. | Emotion `styled()` gives each a unique hashed className. Classnames from prototype HTML die at port time; only Emotion components survive. |
| HistoryTab already leaks generic class names | Existing code uses `.view-switcher`, `.view-tab`, `.search-bar`, `.list-container` (2026-04-22 inventory G.1). | Phase 5 History port: rename all to scoped Emotion. |
| MediaTab uses wrong cobalt | `MediaTab.tsx:150` hardcodes `#1D4ED8` instead of `#2D6DFF`. | Phase 2 primitive port (Media is Phase 5, but selection-bar is early primitive) — replace with `var(--buildrick-accent)`. |
| Duplicate shell file | Both `packages/editor/src/components/Editor/StudioPanels.tsx` AND `packages/editor/src/editor/shell/StudioPanels.tsx` exist (legacy + new). | Continue ignoring `components/` per CLAUDE.md rule 7 — "naye features components/ mein NAHI jayenge". Don't touch legacy. |

---

## Part F — Missing Assets

| Asset | Needed for | Blocking phase |
|---|---|---|
| General Sans `.woff2` / `.ttf` | Display font (currently substituted with Inter Tight) | None — Inter Tight is correct fallback per DESIGN.md |
| Brand logo SVG | Topbar mark (currently text wordmark "Buildrik") | Phase 3 Topbar touch. Non-blocking. |

No other asset gaps. 54 SVG icons in drop sufficient for rail/blocks/layers.

---

## Part G — Gates per Phase

Every phase must pass these before commit. Gate failure = halt, not override.

### Phase 1 Gates (Token Bridge)

1. `npx tsc --noEmit` green in `packages/editor`.
2. `bash packages/editor/scripts/ds-grep-gates.sh` exit 0.
3. Grep `^\s*--bd-[a-z0-9-]+:` across `packages/editor/src` — **match only** `bd-aliases.css` (definitions). Everywhere else is consumer (`var(--bd-...)`) usage.
4. `--buildrick-accent` value at `themes/design-system/color.css` unchanged = `#2D6DFF`.
5. TokenRegistryProvider ancestor check — `StudioPanels.tsx:367` untouched.
6. Import order in `themes/design-system/index.css`: canonical files FIRST, aliases file LAST.

### Phase 2 Gates (Primitive Port — per primitive)

1. `npx tsc --noEmit` green.
2. `npx vitest run` green (new primitive has co-located `__tests__/*.test.tsx`).
3. No new `.css` file under `shared/ui/`.
4. No `import * from "*.css"` in the new primitive (Emotion only).
5. Hex baseline (`.hex-baseline`) stays ≤ 1498. If primitive removes hex, ratchet down.
6. `.chrome-axioms-baseline` ratchets down from `118 / 179 / 508 / 528`, never up.
7. Primitive file added to `.ds-green-panels.json` strict-zero allowlist.

### Phase 3 Gates (Low-risk panels — per tab)

1. Phase 2 gates (for any newly added primitive used inside the tab).
2. Tab's prop interface unchanged (`TabRouter.tsx` switch branch compiles).
3. Composer event subscriptions preserved (grep for `composer.on(` in tab file).
4. Tab's old CSS file deleted. Git shows `- packages/editor/src/editor/sidebar/tabs/<name>/*.css` in diff.
5. No `.css` file remains under `editor/sidebar/tabs/<name>/`.
6. Green-panel adds all tab source files strict-zero.

### Phase 4 Gates (Fullpage — per tab)

1. Phase 3 gates.
2. `FullPageView.tsx` error boundary + suspense preserved.
3. Settings-specific: `usePanelNavigation` storageKey unchanged, 10 screens still routable, `SettingsNavGuard` still fires on dirty back, `onDirtyChange` bubbles to shell.

### Phase 5 Gates (High-risk — Media + History)

1. Phase 4 gates.
2. Media-specific: `onOpenLibrary` dual-mode toggle works (panel ↔ fullpage `LibraryManager`). `setMediaFullPage(false)` on tab change preserved. Shell callbacks (`onOpenImageEditor`, `onOpenIconPicker`) unchanged.
3. History-specific: `mode: "panel"`, `panelWidth: 280` unchanged in `tabsConfig.ts`. `TimeTravelScrubber` still mounts body-level overlay, not inside panel. Ctrl+Shift+T shortcut works. `localStorage` view persist works.

---

## Part H — Phase 0 Exit Criteria

All must be true to move to Phase 1:

- [ ] This matrix reviewed by Codex (`/codex review`).
- [ ] Token verification grep run against canonical — every "verify" row resolved Y/N.
- [ ] Q1–Q3 decisions above pending → resolved OR explicitly deferred with blocking-phase noted.
- [ ] User confirms brand logo + General Sans strategy (can be deferred to Phase 3 surface).
- [ ] Panel width change (D1) confirmed not blocked by composer/LayoutShell internals.

Phase 1 start unblocked when these 5 items tick.

---

## Part I — Rollback Contract (applies to every phase)

- Phase 1 rollback: delete `bd-aliases.css`, drop import from `themes/design-system/index.css`. Canonical tokens remain SSOT. Editor compiles unchanged.
- Phase 2 rollback (per primitive): revert the one primitive file; existing shared/ui continues. Consumers still work because they still target `--buildrick-*` through the alias.
- Phase 3 rollback (per tab): revert tab file + delete new primitive if only used by that tab. Restore old `.css` file from git.
- Phase 4 rollback (per fullpage tab): revert tab file only. `FullPageView` shell unchanged.
- Phase 5 rollback: per-surface immediate revert. Do NOT let Media or History force a shell rewrite.

No phase rollback touches `StudioPanels.tsx` shell structure. Shell is invariant.
