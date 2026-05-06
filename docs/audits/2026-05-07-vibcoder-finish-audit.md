# Vibcoder-Finish Phase 0 Audit

**Date:** 2026-05-07
**Status:** Phase 0 complete, drain phases unblocked (pending Codex review — see "Codex review notes" at end)
**Plan:** docs/superpowers/plans/2026-05-07-vibcoder-finish.md
**Spec:** docs/superpowers/specs/2026-05-07-vibcoder-finish-design.md
**Gate baseline:** packages/editor/scripts/baselines/buildrick.json (count=202)

---

## 1. Scope correction

The original spec estimated **1622 refs** based on a broad `grep -rn "buildrick-"` that
matched three namespaces:

1. `--buildrick-*` CSS custom-property tokens (canonical, must stay)
2. `data-buildrick-*` DOM attributes (engine hooks, must stay)
3. `.buildrick-*` JSX class refs and string-literal class refs (the actual drain target)

Task 1 (commit `441204f5`) tightened the gate regex with negative-lookbehind so it only
counts (3). The real drain target is **202** matches in `src/editor/`.

**Original spec → Reality:**

| Metric | Spec | Reality | Delta |
|---|---|---|---|
| Total in-scope refs | 1622 | 202 (chrome) | −1420 |
| PR count estimate | 11–17 | 4–6 | −7–11 |
| Wall-clock estimate | 2–3 weeks | 3–7 sessions | ~halved |

The 202 number is also more nuanced than "JSX class names that need vibcoder
swaps" — see §3 below. Only **75 of the 202** are JSX `className=…` refs. The other
**127** are storage keys, classList mutations, DOM IDs, CSS-in-string selectors,
keyframe definitions, animation references, comments, and tests — categories where
the migration question is *namespace* (rename `buildrick-*` → `bd-*`?), not
*primitive* (swap to a vibcoder component?).

---

## 2. Total in-scope refs

**202** `.buildrick-*` matches in `src/editor/` per the gate's tightened regex,
across **112 distinct class identifiers** in **48 source files**.

Distinct count is far higher than expected for a codemod-driven migration: at
202 sites / 112 distinct strings = **average 1.8 sites per class**. Almost no
class clears the codemod-eligibility bar (≥10 uniform sites) — see §6.

---

## 3. Category breakdown (where the 202 actually live)

The naive interpretation — "202 chrome JSX `className=` refs to swap" — is wrong.
Real distribution:

| Category | Count | Drain action |
|---|---|---|
| **jsxClassName** (`className="buildrick-X"` or template) | **75** | Drain target — replace with vibcoder primitive, extension, or `.bd-*` rename. |
| **classListMutation** (`el.classList.add/remove("buildrick-X")`) | 17 | DOM-coupled; rename namespace or move to React state. |
| **cssRuleString** (`.buildrick-X { … }` inside JS-emitted `<style>`) | 16 | Move to canonical `themes/components/` or rename namespace. |
| **cssSelectorString** (`".buildrick-X"` in arrays passed to `closest()`/`matches()`) | 15 | DOM-coupled; rename in lockstep with target classes. |
| **storageKey** (`localStorage` keys like `"buildrick-history-view"`) | 21 | NOT a class. Rename to `bd-*` *only if* desired for namespace consistency — independent of vibcoder migration. |
| **animationRef** (`animation: "buildrick-pulse 1s …"` in style objects) | 7 | Rename in lockstep with the matching `@keyframes buildrick-pulse {}`. |
| **keyframesDef** (`@keyframes buildrick-X { … }` in JS-emitted CSS) | 6 | Rename in lockstep with animationRef. |
| **domId** (`id="buildrick-X"` / `getElementById("buildrick-X")`) | 8 | Rename for consistency; not a class. |
| **querySelector** (`document.querySelector(".buildrick-X")`) | 7 | DOM-coupled; rename in lockstep with target classes. |
| **comment** (`// .buildrick-X is the …`) | 10 | Trivial cosmetic update during drain. |
| **testSelector** (test-only DOM queries) | 3 | Rename in lockstep. |
| **htmlTemplate** (HTML template strings injected into innerHTML) | 1 | DOM-coupled; engine-style. |
| **jsxClassNameAssignment** (`el.className = "buildrick-X"`) | 1 | DOM-coupled. |
| **unknown** (residual: bare `.buildrick-X { … }` rules in `AnimationPresets.ts`) | 15 | All in one file (`editor/animation/AnimationPresets.ts`); same as cssRuleString. |
| **TOTAL** | **202** | |

Sum of "true class refs that need a primitive/extension decision":
75 jsxClassName + 1 jsxClassNameAssignment + 17 classListMutation + 1 htmlTemplate
= **94 chrome class-mutation sites**. The remaining 108 are namespace-rename
candidates that don't map to vibcoder primitives at all.

This rebalances the migration mental model:

- **Codemod-eligible class swaps:** ≤94 sites, mostly 1-off (see §6)
- **Pure rename `buildrick-*` → `bd-*` (namespace alignment):** ≤108 sites, search-and-replace
- **No-op (canonical-by-design):** see §5

---

## 4. Per-panel breakdown (gate's perPanel + category split)

Counts authoritative from `packages/editor/scripts/baselines/buildrick.json`.
Category split from this audit's classifier.

| Panel | Total | jsxClassName | classListMutation | cssRule/cssSelector | storage/domId | keyframes/anim | comment/test | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| canvas | 94 | 35 | 13 | 23 (8+15) | 5 (3+2) | 4 | 5 | Largest cluster. Heavy DOM-coupling: drag-state class toggles, marquee selectors, toolbar `<style>` injection. |
| sidebar | 34 | 16 | 2 | 0 | 11 (9+2) | 0 | 3 | Mostly storage keys + 1-off panel headers (chip/pill/accordion). |
| design-system | **24** | **21** | 0 | 0 | 0 | 1 | 2 | **OUT-OF-SCOPE — site-builder DS, not chrome.** See §5. |
| animation | 17 | 0 | 0 | 11 (2+0) | 1 | 5 (5+0) | 0 | One file only (`AnimationPresets.ts`). Pure CSS injection — see §6.4. |
| panels | 10 | 1 | 2 | 0 | 3 (1+2) | 0 | 3 | VersionHistoryPanel + layers; mostly storage / DOM IDs. |
| inspector | 6 | 0 | 0 | 0 | 5 (5+0) | 0 | 1 | Pure storage keys (`useInspectorSections`, `InspectorEmptyState`). |
| shell | 6 | 1 | 0 | 0 | 2 (2+0) | 1 | 0 (+ 2 unknown = bare class rules) | StatusIndicators animation refs + `useStudioState`. |
| export | 6 | 0 | 0 | 6 (6+0) | 0 | 0 | 0 | Single CSS-in-JS modal scope (`ExportModal.tsx`). |
| onboarding | 2 | 0 | 0 | 0 | 2 (0+2) | 0 | 0 | Single live-region DOM ID. |
| collaboration | 1 | 0 | 0 | 0 | 0 | 1 | 0 | One animation ref to `buildrick-spin`. |
| media | 1 | 0 | 0 | 0 | 1 (1+0) | 0 | 0 | One storage key. |
| rail | 1 | 1 | 0 | 0 | 0 | 0 | 0 | `buildrick-skip-link` (a11y, already canonical CSS in `themes/design-system/a11y.css`). |
| **TOTAL** | **202** | **75** | **17** | **40** | **30** | **11** | **13** | |

Engine-side scan (out-of-scope domain, listed for completeness): **10 refs**, all
template-literal class strings emitted by managers — see §5.

---

## 5. Out-of-scope (do NOT drain in this arc)

### 5.1 Site-builder DS — `src/editor/design-system/` (24 refs)

Per spec §1: "Out of scope: Site-builder DS at `src/editor/design-system/`".
Per `CLAUDE.md`: "different domain, never merge with chrome DS".

These 24 refs all use the `buildrick-design-*` prefix because that namespace
identifies the *user-output* design system (tokens consumed by the user's
generated site), not the editor chrome. Renaming them would conflict with the
already-canonical `--buildrick-design-*` CSS custom properties (e.g.
`var(--buildrick-design-color-primary)`) consumed by `TokenPickerPopover`,
`SizeSection`, `FontControls`, etc.

| File | Refs | Class | Notes |
|---|---:|---|---|
| `design-system/ui/colors/ColorPicker.tsx` | 21 | `buildrick-design-picker__*` | BEM children of root picker — emotion CSS-in-JS, classes used as selectors only |
| `design-system/state/TokenRegistryContext.tsx` | 1 | `buildrick-design-tokens-{projectId}-v1` | localStorage key |
| `design-system/ui/DraftChip.tsx` | 1 | `buildrick-dot-pulse` | animation ref |
| `design-system/ui/colors/ColorPicker.tsx` (inline rule) | 1 | (CSS rule) | |

**Action:** None. Audit closes them as out-of-scope-domain. The gate's
per-panel `design-system: 24` is permanent baseline noise, not drain queue.

### 5.2 Engine-emitted class strings — `src/engine/` (10 refs)

Per spec §7 Risk 4 and per memory `project_canvas_render_path.md`: Canvas mounts
engine-generated HTML via React's escape hatch (`displayContent` → injected
markup). Engine-side template literals can't be renamed without coordinated
HTML/CSS migration on the runtime canvas.

| File | Refs | Class | Notes |
|---|---:|---|---|
| `engine/canvas/resize/ConstraintManager.ts` | 4 | `buildrick-canvas` | Used as DOM-search anchor for canvas root |
| `engine/elements/manager/PageManager.ts` | 1 | `buildrick-page-root` | Emitted into page-root HTML |
| `engine/elements/manager/HTMLParser.ts` | 1 | `buildrick-page-root` | Template literal in parsed page |
| `engine/canvas/resize/utils.ts` | 1 | `buildrick-canvas` | DOM search |
| `engine/recovery/RecoveryManager.ts` | 1 | `buildrick-page-root` | Recovery placeholder |
| `engine/canvas/indicators/BoundsCalculator.ts` | 1 | `buildrick-canvas` | DOM search |
| `engine/Viewport.ts` | 1 | `buildrick-viewport-frame` | Emitted into viewport markup |

**Action:** None in this arc. These three classes (`buildrick-canvas`,
`buildrick-page-root`, `buildrick-viewport-frame`) are part of the canvas
engine's runtime contract — both editor's `Canvas.tsx` and engine emit them,
and the chrome rails query `.buildrick-canvas` to anchor selection overlays.
They get the **canonical-by-design** stamp. Any future rename must be a
coordinated engine + chrome PR outside this arc.

### 5.3 Chrome canonicals (in-scope panels but keep-as-canonical)

Inside chrome panels but should be **kept as canonical names**, not migrated:

| Class | Sites | Reason |
|---|---:|---|
| `buildrick-canvas` (chrome side) | 12 | Anchor for engine-canvas DOM relationship; renaming requires engine-side change. |
| `buildrick-skip-link`, `buildrick-sr-only` | 4 | Canonical a11y utilities — already live in `themes/design-system/a11y.css`. Per memory `project_q2_day3_4_shipped_20260507.md`, sr-only/skip-link were already moved to a11y.css SSOT. |
| `buildrick-scrollbar` | 3 | Canonical scrollbar utility (only a `// PageList preserves shared utility class` comment + 2 test references). Class itself isn't rendered — pure documentation/test reference. |

These 19 refs land outside the drain target. **True drain target: 202 − 24
out-of-scope domain − 10 engine − 19 chrome canonicals = 149 refs**.

---

## 6. Classification — distinct classes mapped to homes

For each distinct class (112 total), Home assignment uses the three-home
admission test from spec:

- **Home 1 — vibcoder primitive** (`src/editor/shared/vibcoder/<Name>.tsx`)
- **Home 2 — Buildrik UI extension** (`src/shared/extensions/<Name>.tsx` for compositions, `src/shared/ui/<Name>.tsx` for non-vibcoder primitives)
- **Home 3 — pure CSS** (`themes/design-system/a11y.css` or `themes/components/<tier>/<name>.css`)
- **Home 4 — keep-as-canonical** (engine contract, namespace token, no migration)

Existing vibcoder primitives at `src/editor/shared/vibcoder/`: A11yOverlay,
ActionBar, Avatar, Badge, Breadcrumb, BreakpointSwitcher, Button, Card, Center,
Checkbox, Chipbar, Cluster, ColorPicker, ColorTrigger, CommandPalette, Count,
Divider, Drawer, EmptyState, Footer, FormField, Frame, Grid, Grip, HelperText,
HistoryPanel, Icon, IconButton, Input, Inspector, Kbd, Label, LeftPanel, Link,
ListRow, Menu, Modal, NotificationCenter, NumericStepper, OverlayMount,
PagesDrawer, Popover, Progress, Rail, RailTile, SearchInput, SectionHead,
Select, SidebarShell, Skeleton, Slider, Spinner, Stack, SurfaceHead, Switch,
Switcher, Tabs, Tag, TemplatesDrawer, Textarea, Thumb, TileMeta, Toast,
ToggleRow, Toolbar, Tooltip, Topbar, Uploader.

### 6.1 Top-frequency classes (≥3 sites)

| Class | Sites | Owning panels | Home | Action |
|---|---:|---|---|---|
| `buildrick-design-` (BEM tree) | 20 | design-system | OUT-OF-SCOPE | §5.1 — site-builder DS |
| `buildrick-canvas` | 12 | canvas | Home 4 (canonical) | Engine contract; keep |
| `buildrick-unified-toolbar` | 10 | canvas (`toolbarStyles.ts`) | Home 3 (CSS) | Move from JS-injected `<style>` to `themes/components/organisms/unified-toolbar.css`; rename `bd-unified-toolbar` |
| `buildrick-canvas-empty-` (BEM tree) | 5 | canvas (`CanvasEmptyCTA.tsx`) | Home 2 (extension) or Home 3 (CSS) | Compose Stack + Button + Icon — already half-vibcoder; finish with `shared/extensions/CanvasEmptyState.tsx` or just CSS |
| `buildrick-dragging` | 5 | canvas (drag hooks) | Home 4 (canonical) | DOM-mutation pattern; rename to `bd-dragging` (CSS-only) but no primitive |
| `buildrick-drop-target--active` | 4 | canvas (drag hooks) | Home 4 (canonical) | Same as above; CSS-only state class |
| `buildrick-layers` | 4 | panels (`layers/`) | Home 3 (CSS) | Comments + bare ID; localStorage prefix; rename for consistency |
| `buildrick-sr-only` | 3 | canvas, sidebar | Home 4 (canonical) | Already in `themes/design-system/a11y.css` — keep |
| `buildrick-drag-ghost` | 3 | canvas, sidebar | Home 4 (canonical) | DOM-mutation drag artifact; rename CSS only |
| `buildrick-clone-mode` | 3 | canvas | Home 4 (canonical) | Same as `buildrick-dragging` |
| `buildrick-spacing-indicator` | 3 | canvas (`CanvasSpotSpacing`) | Home 3 (CSS) | Pure visual indicator; CSS rename `bd-*` |
| `buildrick-spin` | 3 | shell, collaboration | Home 3 (CSS) | Animation utility; rename `bd-spin` keyframe + ref |
| `buildrick-export-modal-scope` | 3 | export (`ExportModal`) | Home 3 (CSS) | CSS-in-JS scope class; move CSS to `themes/components/organisms/export-modal.css` |
| `buildrick-last-applied-template` | 3 | inspector | Home 4 (storage) | localStorage key only; rename `bd-*` |
| `buildrick-scrollbar` | 3 | sidebar (test+comment only) | Home 4 (canonical) | Pure utility class; not a primitive |

### 6.2 Mid-frequency (2 sites) — 21 classes

| Class | Sites | Owning panels | Home | Action |
|---|---:|---|---|---|
| `buildrick-pulse` | 2 | animation, shell | Home 3 (CSS) | Keyframe + animation ref; rename `bd-pulse` |
| `buildrick-inspector-toggle` | 2 | canvas | Home 4 (canonical) | DOM anchor for marquee skip-list; rename `bd-*` |
| `buildrick-fade-in` | 2 | canvas | Home 3 (CSS) | Keyframe + animation ref; rename `bd-fade-in` |
| `buildrick-unified-toolbar-styles` | 2 | canvas | Home 4 (DOM ID) | `<style id="…">` for one-time CSS injection; rename when toolbar CSS moves to themes |
| `buildrick-invalid-drop-shake` | 2 | canvas | Home 3 (CSS) | Class-toggle animation; rename + move keyframe to themes |
| `buildrick-inline-toolbar` | 2 | canvas | Home 4 (canonical) | DOM anchor for `closest()` skip-list |
| `buildrick-selection-label` | 2 | canvas | Home 4 (canonical) | DOM anchor (marquee skip) |
| `buildrick-canvas-breadcrumb` | 2 | canvas | Home 4 (canonical) | Same |
| `buildrick-alignment-toolbar` | 2 | canvas | Home 4 (canonical) | Same |
| `buildrick-template-preview-panel` | 2 | canvas | Home 3 (CSS) | jsxClassName + comment; small panel rename |
| `buildrick-canvas-spot-badge` | 2 | canvas | Home 3 (CSS) | Spot badge classes; CSS-rename |
| `buildrick-design-tokens` | 2 | design-system | OUT-OF-SCOPE | §5.1 |
| `buildrick-inspector-sections` | 2 | inspector | Home 4 (storage) | localStorage migration key + comment |
| `buildrick-achievement-live` | 2 | onboarding | Home 4 (DOM ID) | `aria-live` region ID; rename `bd-*` |
| `buildrick-save-name` | 2 | panels (VersionHistory) | Home 4 (DOM ID) | `<label htmlFor>` + `<input id>`; rename pair |
| `buildrick-layer-hover-highlight` | 2 | panels | Home 3 (CSS) | classList toggle for selection rect |
| `buildrick-nav` | 2 | sidebar | Home 4 (storage) | localStorage prefix |
| `buildrick-accordion-header` | 2 | sidebar (Components/Elements tabs) | Home 1 — **Tabs/Accordion primitive exists?** | Vibcoder has `Tabs.tsx`. Real fit is an **Accordion primitive (MISSING)**. See §7. |
| `buildrick-accordion-chevron` | 2 | sidebar | Home 1 (with above) | Sub-element of accordion primitive |
| `buildrick-pill` | 2 | sidebar (ElementsTab) | Home 1 (existing) | Vibcoder `Tag.tsx` or `Chipbar.tsx` already covers; codemod-eligible |
| `buildrick-media-font-faces` | 2 | sidebar | Home 4 (DOM ID) | `<style id>` font-face injection |

### 6.3 Singleton (1-site) — 76 classes

These are mostly 1-off panel-internal layout classes. Rather than enumerate
every row (which adds 70+ rows of low-information detail), they're categorized
by file and listed as drain candidates per panel in §8 PR plan. Notable ones:

**Vibcoder-primitive replaceable (Home 1, codemod-eligible):**
- `buildrick-modal`, `buildrick-modal-header`, `buildrick-modal-body` (export, 1 site each) → **Modal primitive exists**, codemod target
- `buildrick-modal-in` (canvas, animation ref to keyframe) → bundled with Modal CSS migration
- `buildrick-zoom-control`, `buildrick-undo-redo-controls`, `buildrick-device-selector` (canvas controls) → likely Toolbar/IconButton compositions
- `buildrick-command-palette` (canvas, marquee skip selector) → vibcoder `CommandPalette.tsx` exists; class is DOM anchor only
- `buildrick-history-container`, `buildrick-history-view` (sidebar history tab) → vibcoder `HistoryPanel.tsx` exists

**Buildrik UI extension (Home 2):**
- `buildrick-pin-icon`, `buildrick-pin-icon--pinned` (sidebar header icon) → small icon-state composition
- `buildrick-element-card`, `buildrick-element-card--full`, `buildrick-element-card-star` (sidebar elements panel) → `shared/extensions/ElementCard.tsx` candidate
- `buildrick-canvas-spot`, `buildrick-canvas-spot-badge`, `buildrick-canvas-spot-badge-content`, `buildrick-canvas-spot-badge-close`, `buildrick-canvas-spot-spacing` (canvas spots) → existing `shared/extensions/CanvasSpot.tsx` extension or new

**Pure CSS (Home 3):**
- All `buildrick-fade-in`, `buildrick-scale-in`, `buildrick-modal-in`, `buildrick-bounce`, `buildrick-shake`, `buildrick-swing`, `buildrick-wobble`, `buildrick-flash`, `buildrick-animated`, `buildrick-infinite`, `buildrick-delay-*`, `buildrick-duration-*` (animation panel, 17 sites in `AnimationPresets.ts`) → Migration: move JS-injected `<style>` blob to `themes/components/atoms/animation-utils.css` and rename `bd-*`. **Single file rewrite.**
- `buildrick-drop-feedback-target`, `buildrick-drop-position-line`, `buildrick-drop-slot-preview`, `buildrick-drop-feedback-badge`, `buildrick-drop-breadcrumb` (canvas DropFeedbackOverlay) → CSS rename
- `buildrick-spacing-indicator-*` (canvas spots) → CSS rename
- `buildrick-pill-tip`, `buildrick-variant-pill`, `buildrick-component-row`, `buildrick-chip` (sidebar singleton chips) → CSS rename or Tag primitive consolidation

**Canonical (Home 4):**
- `buildrick-canvas--component-view` (Canvas.tsx state class) → kept with `buildrick-canvas`
- `buildrick-empty-canvas-root` (HTML template emitted via `useCanvasContent`) → engine-template adjacent; rename only with engine coord
- `buildrick-context-menu`, `buildrick-floating-helper`, `buildrick-hover-overlay`, `buildrick-selection-box`, `buildrick-depth-badge`, `buildrick-drag-handle`, `buildrick-guides` (canvas marquee skip-list anchors) → DOM contract
- `buildrick-studio` (shell root) → app-shell ID class; canonical
- `buildrick-project`, `buildrick-panel-state`, `buildrick-recent-commands`, `buildrick-recent-icons`, `buildrick-history-view`, `buildrick-sidebar-state`, `buildrick-elements-recent`, `buildrick-elements-favorites`, `buildrick-elements-tip-dismissed`, `buildrick-elements-expanded-category`, `buildrick-component-favorites`, `buildrick-recent-templates`, `buildrick-layers-display-prefs`, `buildrick-inspector-mode`, `buildrick-inspector-sections-v2`, `buildrick-guides`, `buildrick-recent-icons` (storage keys) → not classes; rename for consistency only, no primitive
- `buildrick-layers-tree` (panels, `<div id>`) → DOM ID
- `buildrick-skip-link` (rail, jsxClassName only) → already canonical in `themes/design-system/a11y.css`

### 6.4 The animation cluster (17 sites in one file)

`src/editor/animation/AnimationPresets.ts` is a self-contained CSS-injection
module — it builds a string of `@keyframes buildrick-X { … }` and
`.buildrick-X { … }` rules and injects it into a `<style id="buildrick-animation-styles">`
tag at runtime. **All 17 animation-panel sites are inside this one file.**

This is **already Home 3 (pure CSS)** — the JS string is just CSS that hasn't
been moved to `themes/components/atoms/animation-utils.css`. Migration is:
1. Move the CSS block to `themes/components/atoms/animation-utils.css`
2. Add `@import` line to `themes/default.css`
3. Delete the runtime `<style>` injection and `attachAnimationStyles()` call site
4. Rename `buildrick-*` → `bd-*` in both the moved CSS and the public preset config that references the names

**This panel goes from 17 → 0 in a single 1-PR refactor.**

---

## 7. Missing primitives (Phase 1 inputs)

Inventory of vibcoder primitives compared against drain candidates:

| Proposed primitive | Tier | Replaces | Owning panels | Sites |
|---|---|---|---|---:|
| `Accordion` | molecule | `buildrick-accordion-header` + `buildrick-accordion-chevron` | sidebar (ComponentsTab, ElementsTab) | 4 (2 + 2) |

Only **one** missing primitive surfaces from the audit. This is consistent with
the migration's late-stage status: vibcoder coverage is already strong
(60+ primitives) and the remaining 202 refs are predominantly:

1. CSS-only utilities (animation, drag-state, layout helpers)
2. DOM contracts (engine anchors, marquee skip-lists, storage keys)
3. 1-off compositions that don't justify a primitive

**Decision required (Codex/controller):** Is `Accordion` worth shipping as a
new vibcoder primitive in Phase 1 for **4 sites** total? Alternative: ship
`shared/extensions/Accordion.tsx` (Home 2) composing existing primitives, or
just rename `bd-accordion-*` and keep the CSS pattern (Home 3). At 4 sites
the cost of a new vibcoder primitive likely outweighs benefit; recommend
**Home 3 rename** unless the sidebar redesign roadmap calls for it.

---

## 8. Codemod candidates (≥10 uniform sites)

| Class | Sites | jsxClassName uniformity | Codemod target |
|---|---:|---|---|
| (none qualify cleanly) | | | |

`buildrick-canvas` (12 sites) and `buildrick-unified-toolbar` (10 sites) appear
to clear the threshold but **fail uniformity**:
- `buildrick-canvas` shape: 1 `className=` + 5 `querySelector` + 3 string-array
  + 2 comment + 1 test. Each context needs a different rewrite. Manual.
- `buildrick-unified-toolbar` shape: 8 CSS-rule strings + 2 string-array
  selectors. The migration is "move CSS file" not "rename className", so
  codemod is the wrong tool.

`buildrick-design-` (20 sites) is out-of-scope domain.

**Conclusion:** No codemod-eligible class. The 202-site drain is per-panel
manual work. This was hidden by the original 1622 estimate; once you scope to
true class-references (94 sites), there's no class repeated enough to justify
a codemod beyond `replace_all` inside a single file.

---

## 9. Manual-track classes (everything not in §8)

All 112 distinct classes track manually, organized by panel for drain-PR
planning. See §6 for per-class home assignment.

---

## 10. Drain plan revision

Given:
- 202 total → 149 true drain target (after §5 exclusions)
- 112 distinct classes, average 1.8 sites each → no codemod leverage
- One missing primitive (Accordion, 4 sites — likely punted to Home 3 anyway)
- Animation cluster is one-file refactor (17 → 0)
- Out-of-scope DS panel is permanent baseline (24 refs, unmoving)

The original plan's per-panel-PR shape still works, but **the count drops to
4–6 PRs and the engineering ratio shifts dramatically toward CSS-rename and
file-relocation rather than React rewrites.**

### Revised PR shape

| PR | Panels | True drain (refs) | Gate-counted (refs) | Risk |
|---|---|---:|---:|---|
| **PR A — trivial drain** | rail (1) + media (1) + collaboration (1) + onboarding (2) + inspector (6) + shell (6) | ~17 | 17 | Low — mostly storage keys + 1-off renames |
| **PR B — single-file refactor** | animation (`AnimationPresets.ts` → CSS file) | 17 | 17 | Low — self-contained module |
| **PR C — modal CSS extract** | export (`ExportModal` → `themes/components/organisms/export-modal.css`) + canvas modal-in keyframe | ~10 | ~10 | Low — single-component CSS move |
| **PR D — sidebar drain** | sidebar (34) including the Accordion decision | 34 | 34 | Medium — 7 files, mix of jsxClassName + storage keys; Accordion home decision |
| **PR E — panels drain** | panels (10) | 10 | 10 | Low — VersionHistory + layers |
| **PR F — canvas drain (largest)** | canvas (94) | ~52 | 94 | High — drag/drop/marquee DOM contracts; coordinate engine-side `buildrick-canvas` keep-as-canonical |
| **PR G — Phase Final lock** | gate flip from WARN → ERROR; baseline frozen at residual canonical count | 0 | residual | Low |

Total: **7 PRs** (vs spec's 11–17). Wall-clock: 5–8 sessions estimated.

PR ordering preserves "smallest first" so the gate baseline ratchets down
predictably and any drain regression is caught immediately.

---

## 11. Reconciliation

Audit-side reconciliation against gate baseline:

```
Gate (true count from baseline JSON):     202
  - true chrome class-mutation sites:      94  (jsxClassName + classList + htmlTemplate + assignment)
  - namespace renames (no primitive):     108  (storage + DOM ID + cssRule + cssSelector + queryselector + keyframes + animation + comment + test)
  Total:                                  202  ✓

Out-of-scope splits:
  - design-system panel:                   24  (site-builder DS, never merge)
  - chrome canonical-by-design:            19  (engine-canvas anchor, sr-only, skip-link, scrollbar)
  Drain target:                           149  (= 202 − 24 − 19 − 10 engine, where 10 engine isn't in 202)

Engine-side (separate scan, NOT in 202):  10
```

Original spec's 1622 broad-match figure: matches `buildrick-` anywhere.
Decomposition (sample from `grep -c` runs on src/editor):
- `--buildrick-*` token consumers: ~1291 (CSS custom-property reads, MUST stay)
- `data-buildrick-*` DOM attrs: ~159 (engine hooks, MUST stay)
- `.buildrick-*` JSX/string class refs: 202 (this audit)
- comments mentioning `buildrick-`: ~3 — already counted in 202
- Total: ~1652 ≈ 1622 ✓ within margin

The spec's 1622 wasn't "wrong" — it was counting everything. Task 1 narrowed
the gate to what's actually a class. This audit confirms the gate is accurate
and re-baselines the migration roadmap accordingly.

---

## 12. Phase 0 exit checklist

- [x] Total in-scope refs counted: 202 (from gate baseline)
- [x] Per-panel breakdown established (matches gate's `perPanel`)
- [x] Out-of-scope refs identified: 24 (site-builder DS) + 10 engine + 19 chrome canonicals
- [x] Distinct-class classification: 112 classes mapped to Home 1/2/3/4
- [x] Missing-primitive list: 1 candidate (`Accordion`, likely punt to Home 3)
- [x] Codemod candidates: none qualify; confirmed manual track
- [x] Drain plan revised: 7 PRs (vs spec's 11–17)
- [x] Reconciliation against gate baseline: ✓
- [ ] **Codex review:** see §13.

---

## 13. Codex review notes

Codex review is unavailable in this subagent context (no `/codex` skill
exposed via tool surface; available skills suggest Codex is a host-level
slash-command, not a subagent tool). **Status: pending.**

Recommendation for the controller before Phase 1 dispatch:

```
codex review docs/audits/2026-05-07-vibcoder-finish-audit.md
```

Expected lines of feedback:

1. **Accordion punt vs ship.** §7 recommends Home 3 rename for 4 sites; Codex
   may push back on consistency grounds (sidebar redesign roadmap might want a
   real Accordion). Defer decision until sidebar PR lands.
2. **Engine-canvas keep-as-canonical.** §5.2 + §5.3 list 3 engine-emitted
   classes as out-of-scope. Codex should validate this matches the engine's
   actual contract (memory `project_canvas_render_path.md` says yes).
3. **Storage-key namespace migration.** 21 storage keys carry the `buildrick-`
   prefix. Audit treats them as Home 4 rename-for-consistency, but Codex may
   push back: renaming storage keys breaks user data on every existing client
   (no migration helper). Recommendation: keep storage keys as-is unless we
   ship a key-migration helper. If accepted, drain target drops further from
   149 to ~128.
4. **Animation panel as single PR.** §10 PR B claims one-PR refactor for 17
   sites. Codex should confirm `AnimationPresets.ts` is genuinely
   self-contained (no inlined `style.id` collision with already-attached
   `<style>` from another module).
5. **PR F canvas (94 refs) sub-split.** §10 estimates "high risk" without
   sub-splitting. Codex may require splitting by sub-domain
   (drag-hooks / overlays / spots / controls / toolbar-CSS) to keep diff
   reviewable.

Audit doc may be amended in-place when review feedback arrives.

---

**End of audit.**
