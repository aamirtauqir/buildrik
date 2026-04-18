# Layers Tab Theme Migration — Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the editor's sidebar + canvas + inspector + topbar to the DESIGN.md spec (dark chrome + cobalt accent). Fix the indigo/light-theme drift that shipped in `LeftSidebar.css` without updating the spec.

**Architecture:** Token-layer flip. `--ls-*` tokens in `editor/sidebar/LeftSidebar.css` are redefined as aliases of the existing (already-correct) `--aqb-*`/`--accent` tokens. Every one of the 29 consuming files inherits the fix via the CSS custom property cascade — no per-file refactor needed. Selected-row CSS is adjusted to use white text (not cobalt text) to hit WCAG AA on dark. `lyr-row` transitional class family is removed in favor of the canonical `aqb-layer-row`. Dead legacy CSS (`components/Panels/LayersPanel/styles/layers.css`, 651 lines, zero imports) is deleted.

**Tech Stack:** React 18, TypeScript, Emotion CSS-in-JS, Vite 7, Vitest, CSS custom properties. Editor at `packages/editor/`.

**Source plan (reviewed):** `docs/superpowers/plans/2026-04-17-layers-tab-plan.md` — contains CEO + eng + design review findings and the approved scope.

**Branch:** `feat/page-tab-phase-2-visuals`

**Design spec references:**
- Selected row: **white text** (`--aqb-text-primary`) + cobalt-tint bg + 2px cobalt left-border. NOT cobalt text on cobalt bg (4.0:1 contrast — fails WCAG AA).
- Focus ring: `outline: 2px solid var(--aqb-primary); outline-offset: 2px;`
- Modal overlay: `rgba(0, 0, 0, 0.7)` (darker for dark chrome).
- Sync banner: honor `prefers-reduced-motion`.
- Hover-reveal icons: `transition: opacity 100ms ease;`

**Effort:** human ~1.5 days / CC ~1.5 hrs.

---

## File Structure

### Files to delete
- `packages/editor/src/components/Panels/LayersPanel/styles/layers.css` (651 lines, zero imports — dead)

### Files to modify
- `packages/editor/src/themes/default.css` — add canonical `--accent` token (line ~32)
- `packages/editor/src/editor/sidebar/LeftSidebar.css:42-91` — token aliases, delete "light surface overrides" block
- `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx:112-121` — drop `lyr-row*` dual classes
- `packages/editor/src/editor/panels/layers/components/LayerSelectionBanner.tsx:35,40,41,49` — drop `lyr-action-bar*` dual classes
- `packages/editor/src/editor/panels/layers/styles/layers.css:886-986` — delete entire `lyr-*` block
- `packages/editor/src/editor/panels/layers/styles/layers.css` — add selected-row WCAG-safe styles, add focus-ring, add `prefers-reduced-motion`, add hover-icon transition
- `TODOS.md` — already updated with 3 TODOs by plan-eng-review

### Files to read (reference only, no edits)
- `DESIGN.md` — single source of truth for tokens and rules
- `packages/editor/CLAUDE.md` — architecture rules
- `docs/superpowers/plans/2026-04-17-layers-tab-plan.md` — full review history

---

## Task 0: Pre-flight — baseline, screenshots, branch

**Files:**
- No code changes

- [ ] **Step 0.1: Verify branch and uncommitted state**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git branch --show-current
git status --short
```
Expected:
- Current branch prints `feat/page-tab-phase-2-visuals`
- `status --short` may show the plan markdown files + some `.png` screenshots + editor.zip — all fine, not part of this work.

- [ ] **Step 0.2: Install deps + verify baseline tests pass**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx
```
Expected: `Test Files  1 passed (1)`, `Tests   14+ passed` (currently 14 tests in the file).

If any baseline test fails, STOP. Fix or investigate before proceeding. Every subsequent task assumes green baseline.

- [ ] **Step 0.3: Start dev server in a second terminal**

In a separate terminal:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run dev
```
Expected: Vite starts on `http://localhost:5050`. Open the URL in a browser.

- [ ] **Step 0.4: Capture before-screenshots of every sidebar tab**

In the browser, click through every sidebar tab (Layers, Build, Design, Pages, Templates, History, Settings, Media) plus topbar, inspector (click a canvas element), and rail. Take a screenshot of each using Cmd+Shift+4 on macOS (or OS equivalent).

Save them into `/Users/shahg/Desktop/pencil/buildrik/.design-audit/before/`:
```bash
mkdir -p /Users/shahg/Desktop/pencil/buildrik/.design-audit/before
# Drag/save screenshots into this folder. Name them: layers-before.png, build-before.png, etc.
```

These are evidence for the PR description. The migration is globally visible — before/after comparison is the QA.

- [ ] **Step 0.5: Checkpoint commit** (before any changes)

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git status --short
```
Nothing to commit (screenshots are untracked, plan files are untracked — both fine). Continue to Task 1.

---

## Task 1: Pencil visual gap audit

**Files:**
- Modify: `docs/superpowers/plans/2026-04-17-layers-tab-plan.md` (append gap list)

**Prereq:** Pencil desktop app must be running. If unavailable, skip this task and note "Pencil app unavailable; Task 10 (Manual QA) will catch visual gaps by direct comparison against existing implementation."

- [ ] **Step 1.1: Open pencil file in Pencil desktop app**

Launch Pencil app manually (not from Claude). Then open:
```
/Users/shahg/Desktop/codex/new.left.pen
```

- [ ] **Step 1.2: Screenshot pencil screens R6Odi, IR82U, R4Pf4, uHSyK**

For each screen ID, navigate to it in Pencil and export to PNG. Save to:
```
/Users/shahg/Desktop/pencil/buildrik/.design-audit/pencil/R6Odi.png
/Users/shahg/Desktop/pencil/buildrik/.design-audit/pencil/IR82U.png
/Users/shahg/Desktop/pencil/buildrik/.design-audit/pencil/R4Pf4.png
/Users/shahg/Desktop/pencil/buildrik/.design-audit/pencil/uHSyK.png
```

- [ ] **Step 1.3: Produce gap list**

Open each pencil screen next to the current Layers tab render (from Task 0.4). For each of the 7 audit rows (from the source plan's Design Review section), note: MATCH, MINOR, or GAP with a one-line description.

Append this block to `/Users/shahg/Desktop/pencil/buildrik/docs/superpowers/plans/2026-04-17-layers-tab-plan.md` (end of file):

```markdown

## Pencil Audit Gap List (populated during Task 1 of execution)

| # | Area | Pencil says | Current renders | Status | Fix |
|---|------|-------------|-----------------|--------|-----|
| 1 | Selection row color | (fill in) | Indigo `#1D4ED8` | GAP | Task 4/7 cobalt alias |
| 2 | Search placeholder | (fill in) | "Search layers..." | (fill in) | (fill in) |
| 3 | Multi-select button order | (fill in) | Group · Hide · Delete · Done | (fill in) | (fill in) |
| 4 | Sync banner styling | (fill in) | Text only, cobalt-tint | (fill in) | (fill in) |
| 5 | Row font family | (fill in) | Inherited | (fill in) | Task 6 |
| 6 | Row height | (fill in) | 32px | (fill in) | Task 6 |
| 7 | Icon sizes | (fill in) | Default `IconSearch size="sm"` | (fill in) | (fill in) |
```

Replace each `(fill in)` with observed values. Every GAP becomes a follow-up commit in Task 9.

- [ ] **Step 1.4: Commit the gap list**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add docs/superpowers/plans/2026-04-17-layers-tab-plan.md
git commit -m "docs(plans): pencil gap list for layers tab migration"
```

---

## Task 2: Delete dead legacy CSS

**Files:**
- Delete: `packages/editor/src/components/Panels/LayersPanel/styles/layers.css`

- [ ] **Step 2.1: Confirm file has zero imports**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rn "components/Panels/LayersPanel/styles\|Panels/LayersPanel.*\\.css" packages/editor/src --include="*.ts" --include="*.tsx"
```
Expected: no output (zero imports).

If any hit appears, STOP. The file is live. Do NOT delete — add to TODOs.md instead and skip this task.

- [ ] **Step 2.2: Delete the file**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git rm packages/editor/src/components/Panels/LayersPanel/styles/layers.css
```

- [ ] **Step 2.3: Re-run Layers tests to prove nothing broke**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx
```
Expected: All tests PASS (same count as Task 0.2).

- [ ] **Step 2.4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git commit -m "chore(editor): delete dead legacy LayersPanel CSS (651 lines, zero imports)"
```

---

## Task 3: Define canonical `--accent` token in default.css

**Files:**
- Modify: `packages/editor/src/themes/default.css:27-32` (add new line after)

**Context:** `--aqb-primary` is already cobalt `#2d6dff`. DESIGN.md says the canonical name is `--accent`. Add `--accent` as an alias so downstream tokens can reference the DESIGN.md name.

- [ ] **Step 3.1: Read current token block**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
sed -n '25,35p' packages/editor/src/themes/default.css
```
Expected output (approximately):
```
  /* Primary accent (cobalt per DESIGN.md) */
  --aqb-primary: #2d6dff;
  --aqb-primary-hover: #4B8DFF;
  --aqb-primary-active: #1E58D9;
  --aqb-primary-light: rgba(45, 109, 255, 0.12);
  --aqb-primary-muted: rgba(45, 109, 255, 0.08);
  --aqb-primary-subtle: rgba(45, 109, 255, 0.06);
```

- [ ] **Step 3.2: Add `--accent` alias block after line 32**

Use the Edit tool to add these lines IMMEDIATELY after `--aqb-primary-subtle: rgba(45, 109, 255, 0.06);`:

```css
  /* Canonical aliases per DESIGN.md (use --accent everywhere going forward) */
  --accent: var(--aqb-primary);
  --accent-hover: var(--aqb-primary-hover);
  --accent-pressed: var(--aqb-primary-active);
  --accent-tint: var(--aqb-primary-light);
  --accent-subtle: var(--aqb-primary-subtle);
```

- [ ] **Step 3.3: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run
```
Expected: All tests PASS. CSS changes don't affect tests directly but we run the full suite to catch any snapshot tests.

- [ ] **Step 3.4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/default.css
git commit -m "feat(theme): add canonical --accent token (alias for --aqb-primary cobalt) per DESIGN.md"
```

---

## Task 4: Alias `--ls-*` tokens in LeftSidebar.css

**Files:**
- Modify: `packages/editor/src/editor/sidebar/LeftSidebar.css:42-91` (full block replacement)

**This is the load-bearing change.** 29 files consuming `--ls-*` inherit the fix automatically.

- [ ] **Step 4.1: Read current block**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
sed -n '42,91p' packages/editor/src/editor/sidebar/LeftSidebar.css
```
Take note of the current shape. You will replace this entire block.

- [ ] **Step 4.2: Replace `:root { --ls-* }` block with aliases**

Use the Edit tool on `packages/editor/src/editor/sidebar/LeftSidebar.css`. Replace the OLD block (lines 42 through 91) with this NEW block:

```css
:root {
  /* ────────────────────────────────────────────────
     --ls-* tokens now ALIAS the canonical --aqb-* and --accent
     per DESIGN.md: editor chrome is dark-only, cobalt accent only.
     Do not redefine as literal hex values. Use var() aliasing.
     ──────────────────────────────────────────────── */

  /* Surfaces */
  --ls-bg-panel: var(--aqb-bg-panel);
  --ls-bg-card: var(--aqb-surface-2);
  --ls-bg-subtle: rgba(255, 255, 255, 0.04);

  /* Accent — cobalt only */
  --ls-accent: var(--accent);
  --ls-accent-bg: var(--accent-tint);
  --ls-accent-txt: var(--aqb-text-primary); /* WCAG AA: white text, not cobalt (4.0:1 fails) */
  --ls-accent-border: var(--accent);
  --ls-accent-bg-hover: var(--accent-tint);

  /* Text */
  --ls-text-primary: var(--aqb-text-primary);
  --ls-text-secondary: var(--aqb-text-secondary);
  --ls-text-medium: var(--aqb-text-secondary);
  --ls-text-muted: var(--aqb-text-tertiary);
  --ls-text-subtle: var(--aqb-text-muted);
  --ls-text-lighter: var(--aqb-text-muted);
  --ls-text-ghost: var(--aqb-text-muted);

  /* Borders */
  --ls-border-card: var(--aqb-border);
  --ls-border-light: var(--aqb-border);
  --ls-border-soft: var(--aqb-border);

  /* Status (DESIGN.md keeps these) */
  --ls-danger: #DC2626;
  --ls-danger-dark: #991B1B;
  --ls-danger-bg: rgba(220, 38, 38, 0.12);
  --ls-danger-border: rgba(220, 38, 38, 0.4);
  --ls-dirty: #F59E0B;

  /* Status — dark-mode appropriate */
  --ls-success-bg: rgba(34, 197, 94, 0.12);
  --ls-success-text: #4ADE80;
  --ls-success-text-dark: #22C55E;
  --ls-warning-bg: rgba(245, 158, 11, 0.12);
  --ls-warning-text: #FBBF24;
  --ls-error-bg: rgba(239, 68, 68, 0.12);
  --ls-error-text: #F87171;
  --ls-destructive: #EF4444;
  --ls-green-check: #22C55E;

  /* Layout surfaces — dark chrome */
  --ls-topbar-bg: var(--aqb-bg-panel);
  --ls-topbar-border: var(--aqb-border);
  --ls-inspector-bg: var(--aqb-bg-panel);
  --ls-inspector-border: var(--aqb-border);
  --ls-border-dialog: var(--aqb-border);
  --ls-canvas-dot: rgba(255, 255, 255, 0.06);

  /* Modal overlay — darker for dark chrome (was rgba 0.4, now 0.7 per design review) */
  --ls-overlay: rgba(0, 0, 0, 0.7);
  --ls-shadow-menu: 0 4px 12px rgba(0, 0, 0, 0.5);
  --ls-shadow-dialog: 0 4px 24px rgba(0, 0, 0, 0.5);
}
```

**IMPORTANT:** The OLD block's lines 67-91 (the "Global light surface overrides" comment + `--surface-base`, `--surface-canvas` etc) must be DELETED — do NOT carry them into the new block. Those overrides caused the light theme. If any of those `--surface-*` tokens are referenced elsewhere, they should fall back to the `--aqb-*` defaults in `themes/default.css`.

- [ ] **Step 4.3: Verify `--surface-*` tokens still resolve**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rn "\\-\\-surface-base\\|\\-\\-surface-canvas" packages/editor/src --include="*.css" | head -5
```
If hits exist, check that `themes/default.css` or `LayoutShell.css` defines them (or has a sensible fallback). If not, add them back in the new block as `var(--aqb-bg-panel)` aliases.

- [ ] **Step 4.4: Visual sanity check in browser**

With the dev server still running (Task 0.3), refresh `http://localhost:5050`. The editor chrome should now look dark across:
- Topbar
- Sidebar panel background
- Inspector
- Canvas background (dot grid visible)

If anything still looks light, search for stray `--surface-*` or hardcoded hex values in LayoutShell.css and related files.

- [ ] **Step 4.5: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run
```
Expected: All tests PASS.

- [ ] **Step 4.6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/sidebar/LeftSidebar.css
git commit -m "feat(theme): alias --ls-* to --aqb-*/--accent — dark + cobalt chrome per DESIGN.md"
```

---

## Task 5: Dual-class cutover — delete `lyr-row` family

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx:112-121`
- Modify: `packages/editor/src/editor/panels/layers/components/LayerSelectionBanner.tsx:35,40,41,49`
- Modify: `packages/editor/src/editor/panels/layers/styles/layers.css:886-986` (delete block)

Keep `aqb-layer-row` family (canonical). Delete `lyr-row`/`lyr-action-bar`/`lyr-sync-banner` (pencil-spec transitional).

- [ ] **Step 5.1: Read current LayerTreeItem class list**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
sed -n '108,125p' packages/editor/src/editor/panels/layers/LayerTreeItem.tsx
```
Expected output:
```tsx
  const rowClasses = [
    "aqb-layer-row",
    isSelected ? "is-selected lyr-row--selected" : "",
    isDragging ? "is-dragging" : "",
    ...
    isHidden ? "is-hidden lyr-row--hidden" : "",
    isLocked ? "is-locked lyr-row--locked" : "",
    isEditing ? "lyr-row--rename" : "",
    isCanvasHovered ? "is-canvas-hovered" : "",
    isLayerHovered ? "is-layer-hovered" : "",
    selectedIds.has(layer.id) && layer.id !== selectedElementId ? "is-multi-selected" : "",
  ]
```

- [ ] **Step 5.2: Remove `lyr-row--*` suffix from each class line**

Use the Edit tool. For EACH of these lines, remove the space + `lyr-row--*` substring:
- `"is-selected lyr-row--selected"` → `"is-selected"`
- `"is-hidden lyr-row--hidden"` → `"is-hidden"`
- `"is-locked lyr-row--locked"` → `"is-locked"`
- `"lyr-row--rename"` → `""` (removes the whole line — it was only `lyr-row--rename`)

Actually re-check: the last one `isEditing ? "lyr-row--rename" : ""` is only `lyr-row--rename`. Replace with:
```tsx
isEditing ? "is-editing" : "",
```
(we need SOME class for `.is-editing` styling — add it in layers.css Task 6 if not already present).

- [ ] **Step 5.3: Read LayerSelectionBanner class usage**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
sed -n '30,60p' packages/editor/src/editor/panels/layers/components/LayerSelectionBanner.tsx
```
Expected: 4 spots with `lyr-action-bar*`.

- [ ] **Step 5.4: Strip `lyr-action-bar*` from LayerSelectionBanner**

Use the Edit tool. Make these exact replacements in `packages/editor/src/editor/panels/layers/components/LayerSelectionBanner.tsx`:

- `className="aqb-layer-sel-banner lyr-action-bar"` → `className="aqb-layer-sel-banner"`
- `className="aqb-sel-count lyr-action-bar__count"` → `className="aqb-sel-count"`
- `className="lyr-action-bar__actions"` → `className="aqb-layer-sel-actions"` (new class; add in CSS Task 6)
- `className="aqb-sel-btn aqb-sel-btn--danger lyr-action-bar__delete"` → `className="aqb-sel-btn aqb-sel-btn--danger"`

- [ ] **Step 5.5: Delete the `lyr-*` CSS block**

Use the Edit tool. In `packages/editor/src/editor/panels/layers/styles/layers.css`, delete everything from line 886 (`/* ─────────────────────────────────────────────` the `LYR-*` section comment) through the end of the `lyr-fade-in` keyframes (around line 986).

Approximate span to delete — open the file, find the exact section:
```css
/* ─────────────────────────────────────────────
   LYR-* — Pencil component-library spec classes
   ...
   ───────────────────────────────────────────── */
/* ... entire lyr-row, lyr-action-bar, lyr-sync-banner block ... */
@keyframes lyr-fade-in { ... }
```

DO NOT delete anything above line 886 (those are the canonical `aqb-layer-row` styles we're keeping).

Also rename the animation references: the sync banner in `LayersTab.tsx:163` uses `className="lyr-sync-banner"`. After deletion, rename it:
- In `LayersTab.tsx:163`, change `className="lyr-sync-banner"` → `className="aqb-sync-banner"`
- Add corresponding `.aqb-sync-banner` rule in layers.css during Task 6.

- [ ] **Step 5.6: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx
```
Expected: All tests PASS. Behavior didn't change; only class names.

- [ ] **Step 5.7: Visual check in browser**

Refresh the editor. Layers panel should render identically to before Task 5 (still themed via `aqb-layer-row` styles). If any row looks unstyled, there was a `.lyr-row--X` rule that did NOT have an `.aqb-layer-row` equivalent — port that rule over.

- [ ] **Step 5.8: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/panels/layers/LayerTreeItem.tsx \
        packages/editor/src/editor/panels/layers/components/LayerSelectionBanner.tsx \
        packages/editor/src/editor/panels/layers/styles/layers.css \
        packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx
git commit -m "refactor(layers): cutover from lyr-row to canonical aqb-layer-row class family"
```

---

## Task 6: Add design-spec CSS to layers.css

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/styles/layers.css`

Adds: WCAG-safe selected row, focus ring, prefers-reduced-motion, hover-icon transition, `aqb-sync-banner` rule (replaces deleted `.lyr-sync-banner`).

- [ ] **Step 6.1: Append design-spec rules to `layers.css`**

Use the Edit tool. Find the end of the `.aqb-layer-row` related rules (just before the deleted `lyr-*` block's former location). Append:

```css
/* ─────────────────────────────────────────────
   Selected row — WCAG AA compliant (design review Pass 5)
   White text on cobalt-tint bg with cobalt left-border.
   Do NOT use cobalt text on cobalt bg (4.0:1 fails AA).
   ───────────────────────────────────────────── */
.aqb-layer-row.is-selected {
  background: var(--accent-tint);
  color: var(--aqb-text-primary);
  border-left: 2px solid var(--accent);
}

.aqb-layer-row.is-hidden {
  opacity: 0.45;
}

.aqb-layer-row.is-locked .aqb-layer-row__drag-handle {
  display: none;
}

.aqb-layer-row.is-editing .aqb-layer-name {
  display: none;
}

.aqb-layer-row.is-editing .aqb-layer-name-input {
  display: block;
}

/* ─────────────────────────────────────────────
   Focus rings — universal 2px cobalt outline (design review Pass 2)
   ───────────────────────────────────────────── */
.aqb-layer-row:focus-visible,
.aqb-layers-settings-btn:focus-visible,
.aqb-search-input:focus-visible,
.aqb-layer-name-input:focus-visible,
.aqb-sel-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ─────────────────────────────────────────────
   Hover-reveal icons — smooth 100ms opacity (design review Pass 7)
   Eye/lock icons fade in on row hover.
   ───────────────────────────────────────────── */
.aqb-layer-row__icon--reveal {
  opacity: 0;
  transition: opacity 100ms ease;
}
.aqb-layer-row:hover .aqb-layer-row__icon--reveal {
  opacity: 1;
}

/* ─────────────────────────────────────────────
   Sync banner — cobalt translucent fade-in
   (replaces deleted lyr-sync-banner)
   ───────────────────────────────────────────── */
.aqb-sync-banner {
  padding: 6px 12px;
  background: var(--accent-tint);
  color: var(--aqb-text-primary);
  font-size: 12px;
  border-bottom: 1px solid var(--aqb-border);
  animation: aqb-sync-fade-in 200ms ease;
}

@keyframes aqb-sync-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─────────────────────────────────────────────
   Multi-select action bar container (replaces deleted lyr-action-bar__actions)
   ───────────────────────────────────────────── */
.aqb-layer-sel-actions {
  display: flex;
  gap: 8px;
}

/* ─────────────────────────────────────────────
   Accessibility — honor prefers-reduced-motion (design review Pass 6)
   ───────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .aqb-sync-banner {
    animation: none;
  }
  .aqb-layer-row__icon--reveal {
    transition: none;
  }
  .aqb-layer-row {
    transition: none;
  }
}
```

- [ ] **Step 6.2: Remove hex fallbacks from existing tokens in layers.css**

This pass scans for `var(--TOKEN, #HEXFALLBACK)` patterns and strips the hex fallbacks, so a missing token fails loudly (invisible UI) rather than silently rendering the old light-theme color.

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -n "var(--ls-\|var(--aqb-" packages/editor/src/editor/panels/layers/styles/layers.css | grep -E ", #[0-9A-Fa-f]" | head -20
```
This lists every line with a hex fallback. For each line, open in editor and manually edit: `var(--ls-foo, #ABCDEF)` → `var(--ls-foo)`.

Don't worry about every file — this task is scoped to `panels/layers/styles/layers.css` only.

- [ ] **Step 6.3: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx
```
Expected: All tests PASS.

- [ ] **Step 6.4: Visual check selected row contrast**

In the browser:
1. Select a layer in the Layers tab.
2. The row should show: white text + cobalt-tint background + thin cobalt left border.
3. Open DevTools → Accessibility → Contrast ratio. Target the row's text.
4. Expected: contrast ≥ 4.5:1 (WCAG AA body text).

If contrast is still below AA, verify `--aqb-text-primary` resolves to `#F5F5F0` and `--accent-tint` resolves to `rgba(45, 109, 255, 0.12)` in the computed styles pane.

- [ ] **Step 6.5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/panels/layers/styles/layers.css
git commit -m "feat(layers): WCAG-safe selected row, 2px cobalt focus rings, reduced-motion, hover-icon transition"
```

---

## Task 7: Verify test suite stays green

**Files:**
- No code changes

- [ ] **Step 7.1: Run the full editor test suite**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run
```
Expected: All tests PASS with the same count as Task 0.2 (plus any regression tests added below).

- [ ] **Step 7.2: Run type-check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit
```
Expected: zero errors.

If errors appear, they're likely from the Task 5.4 `is-editing` class rename if a test or component was still referring to `lyr-row--rename`. Grep:
```bash
grep -rn "lyr-row\|lyr-action-bar\|lyr-sync-banner" packages/editor/src
```
Should output NOTHING. Any hits are missed cutover spots — fix and commit.

- [ ] **Step 7.3: If anything failed, commit the fix**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add <fixed files>
git commit -m "fix(layers): clean up residual lyr-* references missed in cutover"
```

---

## Task 8: Manual visual QA across all sidebar tabs

**Files:**
- No code changes (observation + screenshots)

- [ ] **Step 8.1: Refresh the editor in browser**

`http://localhost:5050` — hard refresh (Cmd+Shift+R).

- [ ] **Step 8.2: Walk every tab and capture after-screenshots**

For each area:
- Layers tab (select a layer, hover a layer, multi-select 2 layers, search, rename, right-click)
- Build tab
- Design tab
- Pages tab
- Templates tab
- History tab
- Settings tab
- Media tab
- Topbar (breadcrumb, publish button, presence cluster)
- Inspector (select a canvas element)
- Canvas (dot grid visible on dark? modal overlays if any)
- Rail (left 60px icon bar)

Save screenshots to `/Users/shahg/Desktop/pencil/buildrik/.design-audit/after/`:
```bash
mkdir -p /Users/shahg/Desktop/pencil/buildrik/.design-audit/after
# Drag/save, naming: layers-after.png, build-after.png, etc.
```

- [ ] **Step 8.3: Compare before/after**

Open `.design-audit/before/` and `.design-audit/after/` side by side in Finder. For each tab:
- Should be DARK background (previously light or mixed)
- Cobalt accent (not indigo)
- White text (readable)
- No obvious contrast failures

If any regression is found (e.g., invisible text, broken layout, wrong color), file it as the next task and fix it.

- [ ] **Step 8.4: Commit screenshots to PR artifacts (NOT to git)**

Screenshots live in `.design-audit/` — add to the PR description later, NOT commit to the repo. The `.design-audit/` dir should already be gitignored or untracked. Verify:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git status --short | grep design-audit
```
If files show up, add `.design-audit/` to `.gitignore`:
```bash
echo "" >> .gitignore
echo "# Design audit artifacts (local only)" >> .gitignore
echo ".design-audit/" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore .design-audit/ (local visual QA artifacts)"
```

- [ ] **Step 8.5: If regressions found, fix + commit each**

For each visual regression:
1. Identify the file + rule.
2. Fix it.
3. Re-screenshot the affected tab.
4. Commit: `fix(theme): <specific regression description>`.

---

## Task 9: Pencil gap fixes

**Files:**
- Various (based on gap list from Task 1)

- [ ] **Step 9.1: Read the gap list**

Open `/Users/shahg/Desktop/pencil/buildrik/docs/superpowers/plans/2026-04-17-layers-tab-plan.md` and scroll to the "Pencil Audit Gap List" section (added in Task 1.3).

- [ ] **Step 9.2: For each GAP row, implement the fix**

For each row with status `GAP`:
1. Read the Fix column (e.g., "Task 4/7 cobalt alias" — already done; skip).
2. For genuine new fixes (e.g., "Row height should be 28px, not 32px"), open the relevant file and make the change.
3. Re-screenshot the affected area.
4. Commit: `fix(layers): <gap description>` — one commit per fix.

Skip rows marked MINOR unless they're trivial.

- [ ] **Step 9.3: Update the gap list table to show status**

Mark each row as FIXED or DEFERRED as you go. At end, no row should still say GAP — either FIXED or moved to a TODO.

---

## Task 10: Final guard — grep for residual indigo

**Files:**
- No code changes (inspection)

- [ ] **Step 10.1: Grep for banned indigo/violet hex values**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rnE "#1[Dd]4[Ee][Dd]8|#1[Ee]40[Aa][Ff]|#6366[Ff]1|#4[Ff]46[Ee]5|#818[Cc][Ff]8|#8[Bb]5[Cc][Ff]6|#7[Cc]3[Aa][Ee][Dd]|indigo|violet" packages/editor/src --include="*.css" --include="*.ts" --include="*.tsx" | head -30
```

Expected: a few hits remain in:
- `themes/default.css` `--media-img`, `--rail-*`, `--aqb-gradient-*` tokens (out of scope for THIS PR — log as TODO)
- Component modal templates if any

Anything in `editor/sidebar/` or `editor/panels/` should now be ZERO.

- [ ] **Step 10.2: For any in-scope hit, fix it**

If the grep surfaces indigo in `editor/sidebar/*`, `editor/panels/layers/*`, or `shared/ui/*`, fix those. Out-of-scope hits (rail, media gradients) are tracked by the post-migration TODO in TODOS.md.

- [ ] **Step 10.3: Final commit**

If any fixes were made:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add <files>
git commit -m "fix(theme): purge residual indigo hex from in-scope files"
```

- [ ] **Step 10.4: Dev server stop**

Stop the dev server (Ctrl+C in the terminal from Task 0.3). Migration is complete.

---

## Task 11: Ready-to-ship check

**Files:**
- No code changes

- [ ] **Step 11.1: Verify test suite green**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run
npx tsc --noEmit
```
Both must pass.

- [ ] **Step 11.2: Verify no stale `lyr-*` references**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rn "lyr-row\|lyr-action-bar\|lyr-sync-banner" packages/editor/src
```
Expected: no output.

- [ ] **Step 11.3: Verify commit history is clean**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git log --oneline feat/page-tab-phase-2-visuals..HEAD
```
You should see approximately one commit per Task (0 is a checkpoint with no changes; 1-10 each produce commits).

- [ ] **Step 11.4: Ready for /ship**

At this point the branch is ready:
- Token migration complete (29 files inherit via alias)
- Dual-class cutover done
- Design review specs implemented
- Tests green
- Type-check green
- Manual QA captured in `.design-audit/before/` vs `after/`
- Pencil gaps fixed or logged

Run `/ship` (gstack skill) to create the PR. The PR description should reference:
- Before/after screenshots from `.design-audit/`
- Design review score: 5/10 → 9/10
- 3 TODOs added (Playwright infra, CI grep, post-migration indigo audit)

---

## Notes for the executor

- **If Task 1 (Pencil audit) is skipped** (Pencil app unavailable), Task 9 (Pencil gap fixes) also skips. That's acceptable — manual QA in Task 8 still catches most visual issues. Note in the PR description that the pencil audit was deferred.
- **If a test fails at any Task N**, STOP. Investigate whether it's a regression from Task N's code or a pre-existing flake. Never commit with a failing test. If you can't identify the cause, escalate.
- **Per `packages/editor/CLAUDE.md`:** no new code in `components/Panels/`. All edits in this plan respect that rule.
- **Manual QA IS the regression gate.** There is no automated visual regression infra (see TODOS.md for the deferred Playwright setup). Your eyes + the before/after screenshots are the safety net. Take Task 8 seriously.

---

## Required sub-skill reminder

This plan is designed for superpowers execution:
- **Subagent-driven** (recommended): dispatch a fresh subagent per task. Fast iteration with review between each.
- **Inline**: execute in the current session using `superpowers:executing-plans`. Batch with checkpoints for review.
