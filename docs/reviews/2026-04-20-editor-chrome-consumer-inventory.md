---
date: 2026-04-20
topic: editor-chrome-consumer-inventory
status: Week 0 gate — prerequisite for editor-chrome DS rollout
supersedes: none
companion: /docs/ideation/2026-04-20-editor-chrome-ds-ideation.md
baseline: packages/editor/scripts/.chrome-axioms-baseline
---

# Editor Chrome Consumer Inventory

**Purpose.** Week 0 gate for the editor-chrome DS rollout. Documents the CURRENT STATE of every chrome consumer, quantitatively, before any primitive-design work begins. Every subsequent PR in the rollout references a row in this file.

**Protection clause.** Prior theme-unification specs (V1 + V2) were killed in Codex review for skipping exactly this step. This document exists to prevent repeating that failure.

**Post-Codex-review revision (2026-04-20, same day).** An initial version of this document used editor-only grep scopes (`editor/` only) while the gate script measured `editor/ + shared/ui/ + shared/forms/`. The two scopes produced different numbers mislabeled as one. Codex flagged this as CRITICAL. This revision uses ONE scope — the gate-script scope — throughout. Baselines are now file-backed in `scripts/.chrome-axioms-baseline` (same pattern as `.hex-baseline` for Gate 10).

---

## Section 1 — Canonical Scope

**"Chrome" = these paths, enforced by gates 11-14 and ESLint chrome overrides:**

- `packages/editor/src/editor/**`
- `packages/editor/src/shared/ui/**`
- `packages/editor/src/shared/forms/**`

**LOCAL_SHADOW — files that legitimately render or edit USER-site content, exempted from chrome enforcement:**

- `editor/sidebar/tabs/design/**` — user-site token editor (reads/mutates `--buildrick-design-*`)
- `editor/inspector/sections/BackgroundSection.tsx` — user-site gradient editor
- `editor/media/VideoPreview.tsx`, `editor/export/PreviewFrame.tsx`, `editor/wizard/sectionData.ts` — user-content preview renderers
- `shared/forms/GradientPicker.tsx` — user-site gradient picker
- `shared/utils/parsers/**` — user-content CSS parsers
- `**/__tests__/**`, `**/*.test.*`, `**/*.stories.*`

**IN scope (chrome) — do NOT treat as LOCAL_SHADOW:**

- `features/design-system/ui/**` — this is the Design tab's OWN chrome (header, footer, modals, dropdowns). Enforced like any other sidebar chrome.

**Form atoms — exempt from Gate 13 (border-radius > 4) ONLY. Gates 11, 12 still apply:**

- `shared/ui/Button.tsx`, `IconButton.tsx`, `Tooltip.tsx`, `Toast.tsx`, `Modal.tsx`, `Badge.tsx`, `PremiumBadge.tsx`, `Kbd.tsx`, `SharedDialogs.tsx`
- `shared/forms/*.tsx`

These are atomic primitives inside panel chrome, not panel chrome themselves. They may use `--buildrick-radius-md` (8px) and other non-sm radius tokens per DESIGN.md §Chrome Axioms → Chrome vs form atoms.

---

## Section 2 — Baseline: What DS V1 Already Holds

All 10 DS V1 grep gates PASS as of this commit (`bash packages/editor/scripts/ds-grep-gates.sh`):

| Gate | Status | Holds |
|---|---|---|
| 1 | PASS | No self-referential CSS var defs |
| 2 | PASS | `--buildrick-design-*` defs only in `design-system/design.css` |
| 3 | PASS | No `--buildrick-design-*` consumers in editor chrome |
| 4 | PASS | No deprecated alias consumers (`--ls-*`, `--rail-*`, etc.) |
| 5 | PASS | No legacy `--aqb-*` / `data-aqb-*` |
| 6 | PASS | No duplicate keys in any DS file |
| 7 | WARN | `@media (prefers-*)` leaks outside a11y.css — 14 legacy CSS files (backlog) |
| 8 | PASS | No bare deprecated defs |
| 9 | PASS | INSPECTOR_TOKENS fully removed |
| 10 | PASS | Hex count at or below baseline (**1498**) |

**Takeaway:** the token layer is clean. The component layer and layout/decoration invariants are what this rollout adds.

---

## Section 3 — Chrome CSS File Landscape

**21 per-tab/chrome CSS files under `packages/editor/src/editor/`, totaling ~11,000 lines.** These files must be DELETED by Survivor #1 (PanelShell Primitive) as panels migrate:

| File | Lines | Priority |
|---|---|---|
| `editor/sidebar/tabs/pages/PagesTab.css` | 3426 | **HIGH** (largest) |
| `editor/canvas/Canvas.css` | 1298 | HIGH |
| `editor/sidebar/tabs/build/BuildTab.css` | 1066 | HIGH |
| `editor/panels/layers/styles/layers.css` | 978 | HIGH |
| `editor/media/LibraryManager.css` | 974 | HIGH |
| `editor/sidebar/tabs/templates/TemplatesTab.css` | 717 | HIGH |
| `editor/sidebar/tabs/media/MediaTab.css` | 628 | HIGH |
| `editor/rail/LayoutShell.css` | 401 | HIGH |
| `editor/sidebar/LeftSidebar.css` | 342 | HIGH |
| `editor/media/ImageEditorModal.css` | 332 | MEDIUM |
| `editor/sidebar/tabs/templates/TemplatePreviewModal.css` | 220 | MEDIUM |
| `editor/sidebar/tabs/templates/ApplyProgressOverlay.css` | 154 | MEDIUM |
| `editor/rail/DrawerPanel.css` | 137 | MEDIUM |
| `editor/sidebar/shared/SkeletonStates.css` | 115 | MEDIUM |
| `editor/canvas/spots/CanvasSpotSpacing.css` | 84 | LOW |
| `editor/sidebar/tabs/component-library/ComponentsTab.css` | 74 | LOW |
| `editor/sidebar/shared/EmptyStates.css` | 57 | LOW |
| `editor/canvas/spots/CanvasSpotBadge.css` | 50 | LOW |
| `editor/sidebar/tabs/settings/styles/settings.css` | present | HIGH |
| `editor/sidebar/tabs/history/styles/history.css` | present | HIGH |
| `editor/sidebar/tabs/design/styles/design-tokens.css` | 283 | **LOCAL_SHADOW** — user-token editor |

**Plus legacy chrome CSS in `src/components/`** (separate migration via Survivor #6):

- `components/Panels/LeftSidebar/LeftSidebar.css` — still imported by some editor/ paths
- `components/Canvas/Canvas.css`, `components/Layout/LayoutShell.css`, `components/Layout/LeftRail.css`
- `themes/components.css` (5100+ lines of legacy class rules)
- `themes/ux-fixes.css` (legacy overrides)

---

## Section 4 — Inspector Section Landscape (Survivor #4 target)

**17 section IDs** in `packages/editor/src/editor/inspector/sections/registry.tsx:82`, not 41 as an earlier version of this document claimed. The 42 `.tsx` files under `inspector/sections/` (40 excluding tests) compose into the 17 section IDs via sub-folder helpers.

### The 17 sections (`registry.tsx` `SectionId` union)

**Style tab (9):** `quick-actions`, `layout`, `size`, `spacing`, `flex`, `grid`, `typography`, `background`, `border`

**Element tab (4):** `link`, `element-properties`, `css-classes`, `all-css`

**Effects tab (4):** `effects`, `animation`, `interactions`, `visibility`

### Adapter-fit split (`registry.tsx:254-257`)

The existing registry already documents: **two base shapes (`BaseStyleSectionProps` + one effect-tab shape) cover ~9 of the 17**. The other **8 need bespoke adapters** because their props are genuinely unique:

- `flex` — pulls `isFlexItem` state from parent
- `animation` — wires live composer data and preview callbacks
- `interactions` — needs preview/timeline callbacks (`InteractionEditor.tsx`)
- `element-properties` — transaction-heavy, element-type-specific
- `typography` — font loading and preview state
- `background` — sub-edits user-site gradients (also LOCAL_SHADOW for A1.1)
- `link` — navigation-state sensitive
- `quick-actions` — explicitly non-Section, non-collapsible (`QuickActionsSection.tsx:12`)

### Migration order (Week 4 → Week 6)

The pilot list must come from the 9 adapter-fit sections, not arbitrarily from "simple-looking" filenames. `QuickActionsSection` and `VisibilitySection` are NOT good pilots — they have custom behaviors that don't fit base shape.

**Week 4 (5 adapter-fit sections):** `size`, `spacing`, `border`, `layout`, `css-classes`

**Week 5 (4 remaining adapter-fit):** `grid`, `effects`, `all-css`, `visibility`

**Week 6 (8 bespoke adapters):** `flex`, `typography`, `animation`, `interactions`, `element-properties`, `background`, `link`, `quick-actions`

**Week 6 leading indicator the schema is wrong:** if a bespoke adapter in Week 6 requires more than ~40 lines of extra prop-mapping beyond the base shape, the schema is under-designed. Stop and revisit.

---

## Section 5 — Layout Constant Violations (Survivor #3 target)

**566 magic layout literals** across chrome paths (scope per §1). Split:

- **CSS files (`px` literals):** 389
- **TSX files (camelCase bare numbers in layout properties):** 177

Pattern: `(height|width|min*|max*|padding*|margin*|top|bottom|left|right|gap|rowGap|columnGap): (28|32|36|40|44|48|56|60|240|300|320)` in `.ts`/`.tsx`, or `\b(28|32|36|40|44|48|56|60|240|300|320)px\b` in `.css`.

Top offender files — see `grep` details via `bash scripts/ds-grep-gates.sh` Gate 14.

**Target after codemod:** 0 raw literals outside `src/shared/constants/layout.ts`, enforced by new ESLint rule (Survivor #3 + #6 ratchet).

---

## Section 6 — Chrome Decoration Violations (Survivor #7 target)

All three gates count in one unified scope (per §1). Baselines frozen in `scripts/.chrome-axioms-baseline`.

### 6a. Chrome gradients (Gate 11)
**129 chrome sites.** Top offender: `sidebar/tabs/build/BuildTab.css` (~58 sites — chrome-decorative gradients in Build tab chrome). `sidebar/tabs/pages/PagesTab.css` (~8), plus scattered through sidebar/templates and shell.

### 6b. Raw box-shadow in chrome (Gate 12)
**212 total box-shadow sites, 8 use `--buildrick-shadow-*` tokens, 204 use raw rgba/hex literals.** Target after Week 3 Token Binding rollout: 0 raw shadows; all must route through `--buildrick-shadow-*` (sm/md/lg/xl/dropdown/modal/hover/inner) or `--buildrick-glow-*` families.

Notable: `Button.tsx:66` has `boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)"` — inline raw rgba shadow on a form atom. Flagged by ESLint A1.2 rule (verified by `npx eslint src/shared/ui/Button.tsx`).

### 6c. Panel-chrome border-radius > 4 (Gate 13)
**592 sites in panel chrome.** Form atoms (Button, Input, Toast, Tooltip, Modal, Badge, Kbd, SharedDialogs, shared/forms/*) excluded — they may use `--buildrick-radius-md` (8px). Panel containers (headers, toolbars, footers, rows, sidebar sections, inspector sections, rail zones) must cap at `--buildrick-radius-sm` (4px).

### 6d. Transition / hover drift (MEDIUM — addressed in Week 3 PanelShell)
Existing count from earlier scan: **353 sites** across 12 sidebar CSS files. Most absorb into PanelShell's single hover-state token when tabs migrate.

---

## Section 7 — Priority Summary

### HIGH (must be addressed in rollout weeks 1-6)

1. **21 per-tab chrome CSS files (~11,000 lines)** → Survivor #1 deletes these as panels migrate.
2. **17 inspector section IDs** (9 adapter-fit, 8 bespoke) → Survivor #4 schema-registry migration, ordered by adapter fit.
3. **566 magic layout literals** → Survivor #3 codemods + ESLint-bans.
4. **204 raw box-shadow literals + 129 gradients + 592 panel-chrome radii > 4** → Survivor #7 axiom enforcement + Survivor #1/#4 migration co-fixes.
5. **Legacy `components/**` chrome files still imported by editor/** → Survivor #6 ESLint rule.

### MEDIUM (ratcheted via gates, cleaned up opportunistically)

- 1498 inline hex sites (DS V1 baseline, already ratcheting via Gate 10)
- 1033 ESLint violations (DS V1 WARN mode, already ratcheting — editor-ci.yml currently non-blocking on `pnpm run lint`; see §9)
- `@media (prefers-*)` leaks across 14 legacy CSS files (DS V1 Gate 7 WARN)
- `components.css` 5100+ lines of legacy class rules
- `themes/ux-fixes.css` legacy overrides

### LOW (stylistic, once primitives land)

- 353 transition/hover drift sites in sidebar CSS
- Scattered non-standard pseudo-state styling

### LOCAL_SHADOW (valid — exempt from chrome gates)

See §1 for the canonical list. All LOCAL_SHADOW paths are excluded from gates 11-14 and the ESLint chrome-files overrides.

---

## Section 8 — Rollout Gate Mapping

| Rollout Week | Survivor | Inventory sections consumed |
|---|---|---|
| Week 0 | #2 (this doc), #7 axioms | This document + `.chrome-axioms-baseline` + DESIGN.md §Chrome Axioms + eslint.config.mjs chrome overrides |
| Week 1 | #3 layout constants + #6 hex ratchet | §5 (layout literals) + §2 baselines |
| Week 2-3 | #1 PanelShell + #5 Token Binding | §3 (21 chrome CSS files), §6 (decoration cleanup co-migrates), token convergence |
| Week 4-6 | #4 Inspector schema | §4 (17 sections, adapter-fit split drives migration order) |

---

## Section 9 — Ratcheting Metrics (Week-by-Week)

Baselines frozen in `packages/editor/scripts/.chrome-axioms-baseline` (one number per line for gates 11-14) and `.hex-baseline` (gate 10). Re-run `bash packages/editor/scripts/ds-grep-gates.sh` at the end of each rollout week. Numbers can only go down; if they do, lower the baseline in the same PR.

**Authoritative Week 0 baseline (frozen 2026-04-20, from `ds-grep-gates.sh` run):**

| Gate | Metric | Week 0 baseline | Goal by Week 6 |
|---|---|---|---|
| 10 | Hex sites (DS V1) | **1498** | ≤ 1200 (attrition) |
| 11 | Chrome gradients (A1.1) | **129** | ≤ 20 (LOCAL_SHADOW-only by end) |
| 12 | Raw box-shadow (A1.2; token-bound excluded) | **204** | ≤ 10 (all via `--buildrick-shadow-*`) |
| 13 | Panel-chrome border-radius > 4 (A1.3; form atoms exempt) | **592** | ≤ 40 |
| 14 | Magic layout literals (#3 target) | **566** | 0 outside `shared/constants/layout.ts` |
| — | Chrome CSS files under `editor/` | **21** (~11,000 lines) | ≤ 3 (< 500 lines total) |
| — | Inspector section IDs | **17** (9 adapter-fit, 8 bespoke) | 17 registry entries, 0 bespoke JSX |
| — | ESLint DS V1 WARN violations | 1033 | ≤ 500 |

**CI status:** `verify:ds` (gates 1-14) is blocking in `.github/workflows/editor-ci.yml:74-76`. `lint:ds-hex` is blocking. `pnpm run lint` (ESLint) runs with `|| true` (advisory). Chrome Axiom enforcement real-teeth is the grep gates; ESLint is IDE feedback only.

---

### Known Limitation — Emotion interpolation coverage

Gates 13 and 14 grep for literal numeric tokens (`borderRadius: 10`, `height: 44px`). They do NOT resolve interpolated token references like `border-radius: ${radius.md}px` or `width: ${w}px` in Emotion tagged-template literals. A chrome file that imports a TS constants module and writes `${radius.md}` (which resolves to 8px) is a real panel-chrome A1.3 violation that grep cannot see without AST-level token resolution.

**Current coverage:** literal CSS + literal TSX camelCase — sufficient for the dominant case (most chrome debt is raw literals, not token interpolation).

**Addressed in Week 2 token convergence:** when the `<Box>` Token Binding primitive lands (Survivor #5), all `${radius.*}` / `${spacing.*}` usage in chrome files gets mechanically migrated through the codemod. The grep gates catch the RESULT (no interpolated layout literals after migration), not the interpolation itself.

**Escape hatch before Week 2:** manual audit during panel migration. `SelectionStyles.ts:101` (`border-radius: ${radius.md}`) and `TemplatePreviewModal.tsx:122` (`width: ${w}px`) are already known via this inventory — fold into Week 3 PanelShell migration.

## Section 10 — Script Reproduction

```bash
# DS V1 baselines (gates 1-10, authoritative)
bash packages/editor/scripts/ds-grep-gates.sh
node packages/editor/scripts/find-inline-hex-v2.mjs

# Chrome axiom baselines (gates 11-14)
# Baselines live in packages/editor/scripts/.chrome-axioms-baseline
# (one number per line: gate 11, 12, 13, 14).
# Gates auto-compare current count to baseline and fail on regression.
bash packages/editor/scripts/ds-grep-gates.sh | tail -8

# Manual recompute for each gate (used when updating baseline):
CHROME='packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms'
EXCL='__tests__|\.test\.|\.stories\.|sidebar/tabs/design/|inspector/sections/BackgroundSection\.tsx|shared/utils/parsers/|editor/export/PreviewFrame\.tsx|editor/media/VideoPreview\.tsx|editor/wizard/sectionData\.ts|shared/forms/GradientPicker\.tsx'
grep -rE '(linear-gradient|radial-gradient|conic-gradient)' $CHROME --include='*.ts' --include='*.tsx' --include='*.css' | grep -vE "$EXCL" | wc -l
```

---

## Section 11 — What Week 0 Delivers

1. ✅ This document (committed inventory with reconciled single scope).
2. ✅ Chrome Axioms A1/A2/A3 added to `packages/editor/../../DESIGN.md` with form-atom vs panel-chrome distinction, real enforcement path (no-restricted-syntax + grep gates, no fake plugin names).
3. ✅ ESLint Chrome Axiom overrides merged into `packages/editor/eslint.config.mjs` (the flat config — dead `.eslintrc.buildrik-ds.js` removed). Verified firing via `npx eslint src/shared/ui/Button.tsx` → flags `Button.tsx:66` raw rgba shadow.
4. ✅ Four new grep gates (11-14) in `packages/editor/scripts/ds-grep-gates.sh`, file-backed by `scripts/.chrome-axioms-baseline`, fail on regression.
5. ⏭ Week 1 next: Survivor #3 layout constants SSOT + codemod + ESLint-ban, and Survivor #6 green-panel allowlist with `editor/ → components/` import ban.

Per the committed rollout in `docs/ideation/2026-04-20-editor-chrome-ds-ideation.md`, Week 1 starts after this document is committed.
