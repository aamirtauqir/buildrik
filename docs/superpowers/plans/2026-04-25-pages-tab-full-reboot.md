# Pages Tab Full Reboot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite Pages tab UI to match Figma design `Pages Tab - Buildrik.html` while preserving every feature in production (drawer, palette, context menu, bulk, folders, keyboard shortcuts).

**Architecture:** Restyle in-place under `packages/editor/src/editor/sidebar/tabs/pages/`. Keep all hooks (`usePages`, `useFolders`, `useBulkSelect`) and their public API untouched. Rewrite `PagesTab.css` from scratch using `--bd-*` bridge tokens and `.bd-pg-*` class namespace. Shift drag-drop indicator + bulk toolbar + drawer chrome to match design. Migrate 317 LOC of existing tests to new class assertions; author 72 new unit + integration tests.

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + @testing-library/react + Emotion CSS-in-JS. Existing utility class `.buildrick-scrollbar` retained as cross-tab shared exception.

**Source docs:**
- Design spec: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-20260424-222019.md`
- Test plan: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-eng-review-test-plan-20260425-025310.md`
- Figma reference: `file:///Users/shahg/Downloads/Buildrik%20Design%20System/ui_kits/Pages%20Tab%20-%20Buildrik.html`
- Interactive prototype CSS: `file:///Users/shahg/Downloads/Buildrik%20Design%20System/ui_kits/pages-tab-prototype.html`

**Workflow:** Solo, direct-to-main. Each task is one commit. No feature branch, no PR. Run `npm run dev` (port 5050) throughout for HMR validation.

**Reviews cleared:** /plan-ceo-review (16 inside + 6 cross-model issues resolved), /plan-eng-review (8 issues resolved), /plan-design-review (12 decisions, 1 deferred).

---

## File Structure

### Create
- `packages/editor/src/editor/sidebar/tabs/pages/utils/statusLabel.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/utils/__tests__/statusLabel.test.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageRow.test.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageFolder.test.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageList.test.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/BulkToolbar.test.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageCommandPalette.test.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageContextMenu.test.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/useBulkSelect.test.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/useFolders.test.ts`

### Modify (full rewrite)
- `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` (1843 → ~750 LOC)
- `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/components/PageFolder.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/components/BulkToolbar.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/components/AddPageButton.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/components/PageCommandPalette.tsx` (+ scheduled-label bug fix)
- `packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SocialTab.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx`
- `packages/editor/src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts` (className leak audit)
- `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SettingsErrorBoundary.tsx` (token sweep)
- `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx` (assertion migration)

### Untouched (verify only)
- `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/useFolders.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/useBulkSelect.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/types.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/utils/slug.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/utils/seoScore.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/utils/relativeTime.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/utils/keyboardShortcuts.ts`
- `packages/editor/src/editor/sidebar/tabs/pages/utils/thumbnailKey.ts` (verify unused; consider deletion in Task 9)

---

## Token Map

Use this table everywhere CSS values are written. No hex literals, no `--buildrick-*` directly. All consumers use `var(--bd-*)`.

| Prototype local | Project bridge | Notes |
|---|---|---|
| `--accent` | `var(--bd-accent)` | cobalt #2D6DFF |
| `--accent-h` | `var(--bd-accent-hover)` | |
| `--accent-tint` | `var(--bd-accent-tint)` | rgba(45,109,255,0.10) |
| `--fg-1` | `var(--bd-fg-heading)` | #334155 slate-700 |
| `--fg-2` | `var(--bd-fg-primary)` | |
| `--fg-3` | `var(--bd-fg-secondary)` | |
| `--fg-4` | `var(--bd-fg-muted)` | |
| `--bd` | `var(--bd-border)` | |
| `--bd-med` | `var(--bd-border-medium)` | |
| `--subtle` | `var(--bd-bg-subtle)` | |
| `--font-ui` | `var(--bd-font)` | "Inter Tight", sans-serif |
| `--font-mono` | `var(--bd-mono)` | "Geist Mono", monospace |
| `--ok` | `var(--bd-success)` | |
| `--warn` | `var(--bd-warning)` | |
| `--err` | `var(--bd-error)` | |
| `--hover` (no bridge) | literal `rgba(15,23,42,0.04)` | hover surface |
| `--pressed` (no bridge) | literal `rgba(15,23,42,0.06)` | pressed surface |

---

## Class Namespace

| Old | New |
|---|---|
| `.pg-panel` | `.bd-pg-panel` |
| `.pg-search` | `.bd-pg-search` |
| `.pg-list` | `.bd-pg-list` |
| `.pg-row-wrap` | `.bd-pg-row-wrap` |
| `.pg-row` | `.bd-pg-row` |
| `.pg-row.active` | `.bd-pg-row.active` |
| `.pg-row.nested` | `.bd-pg-row.nested` |
| `.pg-row.selected` | `.bd-pg-row.selected` |
| `.pg-row.folder-row` | `.bd-pg-row.folder-row` |
| `.pg-row.expanded-folder` | `.bd-pg-row.expanded-folder` |
| `.pg-row-checkbox` | `.bd-pg-row-checkbox` |
| `.pg-row-grip` | `.bd-pg-row-grip` |
| `.pg-row-disclosure` | `.bd-pg-row-disclosure` |
| `.pg-row-icon` | `.bd-pg-row-icon` |
| `.pg-row-name` | `.bd-pg-row-name` |
| `.pg-row-slug` | `.bd-pg-row-slug` |
| `.pg-row-updated` | `.bd-pg-row-updated` |
| `.pg-row-actions` | `.bd-pg-row-overflow` (single `...` button, NOT a strip) |
| `.pg-chip` | `.bd-pg-chip` |
| `.pg-home-chip` | `.bd-pg-home-chip` |
| `.pg-folder` | `.bd-pg-folder` |
| `.pg-drop-indicator` | `.bd-pg-drop-indicator` |
| `.pg-add` | `.bd-pg-add` |
| `.pg-footer` | `.bd-pg-footer` |
| `.pg-stats` | `.bd-pg-stats` |
| `.pg-bulk` | `.bd-pg-bulk-toolbar` (rewritten markup) |
| `.pg-palette*` | `.bd-pg-palette*` |
| `.pg-menu*` | `.bd-pg-menu*` |
| `.pg-empty` | `.bd-pg-empty` |

Shared utility class **retained as exception**: `.buildrick-scrollbar` (cross-tab shared, defined in `components/Panels/LeftSidebar/LeftSidebar.css:1276`).

---

## Task 0: Pre-flight Audits

**Files:**
- Read-only: search across `packages/editor/src/`. No file changes.

- [ ] **Step 1: Verify `isExternal` phantom field**

Run: `grep -rn "isExternal" packages/editor/src/editor/sidebar/tabs/pages/`
Expected: zero hits. If any, stop and reconcile — `PageItem` has no `isExternal` field (verified in `types.ts`).

- [ ] **Step 2: Enumerate `.buildrick-scrollbar` consumers in pages subtree**

Run: `grep -rn "buildrick-scrollbar" packages/editor/src/editor/sidebar/tabs/pages/`
Expected output: 2 hits — `components/PageList.tsx` and `components/PageCommandPalette.tsx`. These are retained AS-IS (cross-tab shared utility).

- [ ] **Step 3: Audit `usePageSettings.ts` for className leaks**

Run: `grep -nE "className|class=" packages/editor/src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts`
Expected: zero hits (hook should not emit className strings). If any present, note for Task 7 cleanup.

- [ ] **Step 4: Audit `SettingsErrorBoundary` external consumers**

Run: `grep -rn "SettingsErrorBoundary" packages/editor/src/ | grep -v "tabs/pages/"`
Expected: zero external consumers. Component is local to pages subtree. If external usage exists, token sweep in Task 7 must preserve compatibility.

- [ ] **Step 5: Inventory all `--buildrick-*` references in pages subtree**

Run: `grep -rn "buildrick-" packages/editor/src/editor/sidebar/tabs/pages/ | wc -l`
Expected: ~212 hits. Record this baseline number. Final count after Task 8 must be 0 except for the 2 `.buildrick-scrollbar` exceptions.

- [ ] **Step 6: Verify `--bd-*` bridge tokens are imported**

Run: `grep "bd-aliases" packages/editor/src/themes/default.css packages/editor/src/themes/design-system/index.css 2>/dev/null`
Expected: at least one match — `bd-aliases.css` is imported. If not, stop and add the import; the new CSS depends on it.

- [ ] **Step 7: Commit audit notes**

No code changes in this task. Skip the commit. Proceed to Task 1.

---

## Task 1: PagesTab.css Foundation

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` (consolidate + rewrite)

### Reality check (verified by Task 0)

The current `PagesTab.css` is in a **half-migrated state**:
- ✓ Tokens already use `--bd-*` aliases (no `--buildrick-*` references)
- ✗ Class naming is BEM-style `.pg-row__icon` / `.pg-row--active` (prototype uses kebab `.pg-row-icon` / `.pg-row.active`)
- ✗ Dark-theme hex literals remain: `#f5f5f0` cream fg defaults, `#1b2950` thumb gradients, `rgba(255,255,255,...)` hover surfaces
- ✗ Thumb variant rules `.pg-row__thumb--t-hero/t-about/t-blog/...` still present (must be deleted per design review)
- ✗ Per-row action strip rules `.pg-row__actions` still present (must collapse to single overflow per design review)
- 1843 LOC total; ~274 `.pg-*` class definitions

**Real work:** consolidate to clean `.bd-pg-*` kebab namespace, remove dark-theme leftovers, delete thumb-variant rules, replace BEM modifiers with state classes (`.pg-row--active` → `.bd-pg-row.active`), add new sections (dark bulk pill, drop indicator glow, 7-variant status chips, typographic empty state, loading skeleton). Net CSS shrinks ~1843 → ~750 LOC.

Reference the interactive prototype CSS at `file:///Users/shahg/Downloads/Buildrik%20Design%20System/ui_kits/pages-tab-prototype.html` lines 200-450 for the target visual vocabulary; the skeleton below is the destination state. CSS-only commit (no JSX changes yet).

- [ ] **Step 1: Back up existing CSS for reference**

```bash
cp packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css /tmp/PagesTab.css.bak
```

- [ ] **Step 2: Replace file with new content**

Write the complete new `PagesTab.css`. Skeleton sections (fill in from prototype, preserving prototype's exact dimensions but substituting tokens):

```css
/**
 * PagesTab.css — Buildrik DS V2
 * Pages tab full reboot — class namespace .bd-pg-*, tokens --bd-*
 * Source: Figma design `Pages Tab - Buildrik.html`
 *
 * @license BSD-3-Clause
 */

/* ─── PANEL SHELL ─────────────────────────────────────────────────────── */
.bd-pg-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bd-bg-panel);
  position: relative; /* for absolute-positioned bulk toolbar */
}

/* ─── HEADER ──────────────────────────────────────────────────────────── */
.bd-pg-header {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bd-pg-header-title {
  font: 600 13px var(--bd-font);
  color: var(--bd-fg-heading);
  letter-spacing: -0.01em;
}

/* ─── SEARCH ──────────────────────────────────────────────────────────── */
.bd-pg-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  background: var(--bd-bg-subtle);
  border: 1px solid transparent;
  border-radius: 4px;
  transition: background 100ms, border-color 100ms;
}
.bd-pg-search:focus-within {
  background: var(--bd-bg-card);
  border-color: var(--bd-accent);
  box-shadow: 0 0 0 3px var(--bd-accent-tint);
}
.bd-pg-search input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  font: 400 12.5px var(--bd-font);
  color: var(--bd-fg-primary);
}
.bd-pg-search input::placeholder { color: var(--bd-fg-muted); }
.bd-pg-search svg { width: 12px; height: 12px; color: var(--bd-fg-muted); flex-shrink: 0; }

/* ─── LIST ────────────────────────────────────────────────────────────── */
.bd-pg-list {
  flex: 1;
  overflow: auto;
  padding: 4px 6px 120px;
}

/* ─── ROW ─────────────────────────────────────────────────────────────── */
.bd-pg-row-wrap { position: relative; }
.bd-pg-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  color: var(--bd-fg-primary);
  transition: background 100ms;
  min-height: 28px;
}
.bd-pg-row:hover { background: rgba(15,23,42,0.04); color: var(--bd-fg-heading); }
.bd-pg-row.active {
  background: var(--bd-accent-tint);
  color: var(--bd-fg-heading);
  min-height: 32px;
}
.bd-pg-row.active::before {
  content: "";
  position: absolute;
  left: -6px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: var(--bd-accent);
  border-radius: 0 2px 2px 0;
}

/* ─── ROW VARIANTS ────────────────────────────────────────────────────── */
.bd-pg-row.nested { padding-left: 22px; }
.bd-pg-row.folder-row .bd-pg-row-icon { color: var(--bd-warning); }
.bd-pg-row.selected .bd-pg-row-checkbox { background: var(--bd-accent); border-color: var(--bd-accent); }
.bd-pg-row.expanded-folder .bd-pg-row-disclosure svg { transform: rotate(90deg); }

/* ─── ROW INTERNALS ───────────────────────────────────────────────────── */
.bd-pg-row-checkbox {
  width: 14px; height: 14px;
  border-radius: 3px;
  border: 1.5px solid var(--bd-border-medium);
  display: none;
  place-items: center;
  flex-shrink: 0;
  background: var(--bd-bg-card);
  transition: 100ms;
}
.bd-pg-panel.bulk-mode .bd-pg-row-checkbox { display: grid; }
.bd-pg-row-checkbox svg { width: 10px; height: 10px; color: var(--bd-fg-on-accent); opacity: 0; }
.bd-pg-row.selected .bd-pg-row-checkbox svg { opacity: 1; }

.bd-pg-row-grip {
  display: none;
  width: 10px;
  color: var(--bd-fg-muted);
  margin-right: -4px;
  cursor: grab;
  flex-shrink: 0;
}
.bd-pg-row:hover .bd-pg-row-grip { display: block; }

.bd-pg-row-disclosure {
  width: 12px; height: 12px;
  display: grid;
  place-items: center;
  color: var(--bd-fg-muted);
  flex-shrink: 0;
}
.bd-pg-row-disclosure svg {
  width: 10px; height: 10px;
  transition: transform 120ms;
}

.bd-pg-row-icon {
  flex-shrink: 0;
  color: var(--bd-fg-secondary);
  display: grid;
  place-items: center;
}
.bd-pg-row-icon svg { width: 12px; height: 12px; }
.bd-pg-row.active .bd-pg-row-icon { color: var(--bd-accent); }

.bd-pg-row-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font: 400 13px var(--bd-font);
}
.bd-pg-row-slug {
  font-family: var(--bd-mono);
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--bd-fg-muted);
  margin-left: 4px;
}
.bd-pg-row-updated {
  font-family: var(--bd-mono);
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--bd-fg-muted);
  flex-shrink: 0;
  min-width: 48px;
  text-align: right;
}

/* Single overflow button — replaces per-row action strip (DESIGN.md anti-slop #12) */
.bd-pg-row-overflow {
  width: 22px; height: 22px;
  display: none;
  place-items: center;
  border-radius: 4px;
  color: var(--bd-fg-muted);
  flex-shrink: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.bd-pg-row:hover .bd-pg-row-overflow { display: grid; }
.bd-pg-row-overflow:hover { background: rgba(15,23,42,0.06); color: var(--bd-fg-heading); }
.bd-pg-row-overflow svg { width: 12px; height: 12px; }

/* ─── HOME CHIP + STATUS CHIP ─────────────────────────────────────────── */
.bd-pg-home-chip,
.bd-pg-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 16px;
  padding: 0 6px;
  border-radius: 9999px;
  font: 500 10px var(--bd-font);
  flex-shrink: 0;
}

.bd-pg-home-chip {
  background: var(--bd-accent-tint);
  color: var(--bd-accent);
}

.bd-pg-chip.live      { background: #DCFCE7; color: #166534; }
.bd-pg-chip.draft     { background: #F1F5F9; color: #475569; }
.bd-pg-chip.scheduled { background: #FEF3C7; color: #92400E; }
.bd-pg-chip.hidden    { background: #F1F5F9; color: #475569; } /* contrast-fix per design review */
.bd-pg-chip.password  { background: #E0F2FE; color: #0369A1; }
.bd-pg-chip.external  { background: #F8FAFC; color: #64748B; }
.bd-pg-chip.error     { background: #FEE2E2; color: #991B1B; }
.bd-pg-chip .dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: currentColor;
}

/* ─── DROP INDICATOR ──────────────────────────────────────────────────── */
.bd-pg-drop-indicator {
  height: 2px;
  background: var(--bd-accent);
  border-radius: 1px;
  margin: 1px 8px;
  display: none;
  box-shadow: 0 0 0 2px var(--bd-accent-tint);
}
.bd-pg-drop-indicator.show { display: block; }

/* ─── FOLDER ──────────────────────────────────────────────────────────── */
.bd-pg-folder-children { padding-left: 0; }
.bd-pg-row--empty-folder {
  padding: 6px 8px 6px 30px;
  font: 400 11.5px var(--bd-font);
  color: var(--bd-fg-muted);
  font-style: italic;
}

/* ─── EMPTY STATES ────────────────────────────────────────────────────── */
.bd-pg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  text-align: center;
  gap: 6px;
}
.bd-pg-empty-title {
  font: 500 13px var(--bd-font);
  color: var(--bd-fg-muted);
}
.bd-pg-empty-body {
  font: 400 12px var(--bd-font);
  color: var(--bd-fg-muted);
  opacity: 0.8;
}
.bd-pg-empty-action { margin-top: 8px; }

/* ─── LOADING SKELETON ────────────────────────────────────────────────── */
.bd-pg-skeleton-row {
  height: 28px;
  margin: 2px 0;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--bd-bg-subtle) 0%,
    rgba(15,23,42,0.06) 50%,
    var(--bd-bg-subtle) 100%
  );
  background-size: 200% 100%;
  animation: bd-pg-skeleton-shimmer 1.4s ease-in-out infinite;
}
@keyframes bd-pg-skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── FOOTER ──────────────────────────────────────────────────────────── */
.bd-pg-footer {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: linear-gradient(to top, var(--bd-bg-panel) 80%, transparent);
}
.bd-pg-add {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--bd-accent);
  color: var(--bd-fg-on-accent);
  border: 0;
  border-radius: 8px;
  font: 600 12.5px var(--bd-font);
  cursor: pointer;
  transition: background 100ms;
}
.bd-pg-add:hover { background: var(--bd-accent-hover); }
.bd-pg-add svg { width: 12px; height: 12px; }
.bd-pg-stats {
  font-family: var(--bd-mono);
  font-size: 10.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--bd-fg-muted);
  text-align: center;
}

/* ─── BULK TOOLBAR (dark floating pill) ───────────────────────────────── */
.bd-pg-bulk-toolbar {
  position: absolute;
  bottom: 72px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bd-fg-heading); /* slate-700 — closest non-black per NO-BLACK rule */
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(15,23,42,0.18);
  z-index: 10;
}
.bd-pg-bulk-count {
  color: rgba(255,255,255,0.85);
  font: 500 12px var(--bd-font);
}
.bd-pg-bulk-count b { color: #fff; font-weight: 600; }
.bd-pg-bulk-spacer { flex: 1; }
.bd-pg-bulk-toolbar button {
  padding: 4px 8px;
  border-radius: 6px;
  background: transparent;
  color: rgba(255,255,255,0.85);
  border: 0;
  font: 500 11.5px var(--bd-font);
  cursor: pointer;
  transition: background 100ms;
}
.bd-pg-bulk-toolbar button:hover { background: rgba(255,255,255,0.10); color: #fff; }
.bd-pg-bulk-toolbar button.danger { color: #FCA5A5; }
.bd-pg-bulk-toolbar button.danger:hover { background: rgba(252,165,165,0.15); color: #fff; }
.bd-pg-bulk-close {
  width: 22px; height: 22px;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 50%;
}
.bd-pg-bulk-close svg { width: 12px; height: 12px; }

/* ─── COMMAND PALETTE ─────────────────────────────────────────────────── */
.bd-pg-palette-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.40);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 96px;
  z-index: 1000;
}
.bd-pg-palette {
  width: 560px;
  max-width: calc(100vw - 32px);
  background: var(--bd-bg-elevated);
  border: 1px solid var(--bd-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(15,23,42,0.12);
  overflow: hidden;
}
.bd-pg-palette-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 0;
  border-bottom: 1px solid var(--bd-border);
  background: transparent;
  font: 400 14px var(--bd-font);
  color: var(--bd-fg-heading);
  outline: 0;
}
.bd-pg-palette-list {
  max-height: 360px;
  overflow: auto;
  padding: 6px;
}
.bd-pg-palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  font: 400 13px var(--bd-font);
  color: var(--bd-fg-primary);
}
.bd-pg-palette-item.active,
.bd-pg-palette-item:hover {
  background: var(--bd-accent-tint);
  color: var(--bd-fg-heading);
}

/* ─── CONTEXT MENU ────────────────────────────────────────────────────── */
.bd-pg-menu {
  background: var(--bd-bg-elevated);
  border: 1px solid var(--bd-border);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(15,23,42,0.12);
  padding: 4px;
  min-width: 200px;
  z-index: 100;
}
.bd-pg-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  font: 500 12.5px var(--bd-font);
  color: var(--bd-fg-heading);
  cursor: pointer;
}
.bd-pg-menu-item:hover { background: var(--bd-bg-subtle); }
.bd-pg-menu-item.danger { color: var(--bd-error); }
.bd-pg-menu-divider {
  height: 1px;
  background: var(--bd-border);
  margin: 4px 0;
}

/* ─── REDUCED MOTION GUARD ────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .bd-pg-panel *,
  .bd-pg-panel *::before,
  .bd-pg-panel *::after {
    transition: none !important;
    animation: none !important;
  }
}

/* ─── A11Y FOCUS RING ─────────────────────────────────────────────────── */
.bd-pg-row:focus-visible,
.bd-pg-add:focus-visible,
.bd-pg-row-overflow:focus-visible,
.bd-pg-bulk-toolbar button:focus-visible {
  outline: 2px solid var(--bd-accent);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Run dev server, verify CSS loads**

```bash
cd packages/editor && npm run dev
```
Open `http://localhost:5050`, navigate to Pages tab. Markup still has old `.pg-*` classes so panel will look broken — expected. Goal here is verifying CSS file parses without errors. Check browser DevTools console for CSS errors. Expected: clean parse, no console errors.

- [ ] **Step 4: Run type check**

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: clean. CSS changes don't affect TS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css
git commit -m "feat(pages): rewrite PagesTab.css with --bd-* tokens and .bd-pg-* namespace"
```

---

## Task 2: PagesTab.tsx — className update only (revised post-Task-0)

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx`

### Reality (verified 2026-04-25)

The real `PagesTab.tsx` (287 LOC) is NOT a raw `<div>` shell — it wraps `PanelShell` (the DS primitive used across all 8 sidebar tabs) and integrates: usePages/useFolders/useBulkSelect hooks, ⌘K command palette, context menu, delete-confirm dialog, settings drawer (with SettingsErrorBoundary), name-conflict error state, loadError state. This integration is correct — every other tab follows the same PanelShell pattern, and replacing it would break tab chrome consistency (pin/help/close icons, header height contract, ARIA landmarks).

Real Task 2 = swap the className from `"pages-panel"` (legacy scoping) to `"bd-pg-panel"`, plus add `"bulk-mode"` toggle when bulk has selection so the new CSS's `.bd-pg-panel.bulk-mode .bd-pg-row-checkbox` rule activates.

The shell-rewrite framing in the original plan was naive. CSS sections in Task 1 for `.bd-pg-header` / `.bd-pg-header-title` are unused (PanelShell.Header owns those) — leave them in CSS as harmless dead rules; Task 10 will prune.

- [ ] **Step 1: Read existing PagesTab.tsx**

Run: `cat packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx`
Note current props, hook usage, sub-component imports. Goal: preserve all hook calls and prop wiring, replace markup only.

- [ ] **Step 2: Rewrite shell markup**

Replace the JSX return with this shell. Preserve all `usePages`, `useFolders`, `useBulkSelect` calls — only the JSX changes:

```tsx
return (
  <div
    className={`bd-pg-panel${bulk.isActive ? " bulk-mode" : ""}`}
    role="region"
    aria-label="Pages"
  >
    <div className="bd-pg-header">
      <div className="bd-pg-header-title">Pages</div>
      <div className="bd-pg-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search pages"
        />
      </div>
    </div>

    <PageList
      pages={visiblePages}
      folders={folders}
      activeId={activePageId}
      bulk={bulk}
      query={query}
      onSelect={handleSelect}
      onContextMenu={openContextMenu}
      onOverflow={openContextMenu}
    />

    {bulk.isActive && (
      <BulkToolbar
        count={bulk.selected.size}
        onMoveToFolder={handleBulkMove}
        onDuplicate={handleBulkDuplicate}
        onRemoveFromFolders={handleBulkRemoveFromFolders}
        onDelete={handleBulkDelete}
        onClear={bulk.clear}
      />
    )}

    <div className="bd-pg-footer">
      <AddPageButton onClick={handleAdd} />
      <div className="bd-pg-stats tabular">
        {pages.length} {pages.length === 1 ? "page" : "pages"}
      </div>
    </div>

    {paletteOpen && (
      <PageCommandPalette
        pages={pages}
        onSelect={handlePaletteSelect}
        onClose={closePalette}
      />
    )}

    {contextMenu && (
      <PageContextMenu
        page={contextMenu.page}
        x={contextMenu.x}
        y={contextMenu.y}
        onAction={handleContextAction}
        onClose={closeContextMenu}
      />
    )}

    {drawerOpen && drawerPageId && (
      <PageSettingsDrawer
        pageId={drawerPageId}
        onClose={closeDrawer}
      />
    )}
  </div>
);
```

If existing handlers `handleBulkMove` / `handleBulkRemoveFromFolders` don't exist in the current file, add minimal definitions wired to `useBulkSelect.selected` and `useFolders` operations. Keep behavior identical to current.

- [ ] **Step 3: Run type check**

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: clean. If errors about missing imports for sub-components, add them at top of file.

- [ ] **Step 4: Verify in browser**

Reload `http://localhost:5050`. Pages tab now shows the new shell. Sub-components still render with old class names — partial visual fix expected. No console errors.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx
git commit -m "feat(pages): shell rewrite to .bd-pg-panel + new layout structure"
```

---

## Task 3: PageRow + PageFolder — class rename + chip refactor (revised post-Task-2)

### Reality (verified 2026-04-25)

**PageRow.tsx** is 365 LOC with 15 props in active use by PageList:
`page, pages, composer, isRenaming, nameError, isContextMenuOpen, draggable, isSelected, onToggleSelect, onSelect, onRenameCommit, onRenameCancel, onRenameStart, onContextMenu, onSettingsClick`.
Drops include: F2 inline rename, settings gear (drawer entry), context menu open tracking, thumbnail gradient, "updated 2m ago" label.

**PageFolder.tsx** is 242 LOC with 18 props in active use by PageList:
`folder, pages, allPages, composer, renamingPageId, nameError, openContextMenuPageId, onToggle, onFolderRename, onFolderDelete, onSelectPage, onContextMenu, onSettingsClick, onRenameStart, onRenameCommit, onRenameCancel, onDrop, onPageRemove`.
Has: drag-target drop zone, inline folder rename, delete button, per-page eject button.

**Rewriting from scratch with the plan's naive 10-prop / 11-prop signatures would silently break:**
- F2 rename → name freeze
- Settings gear → no drawer entry from row
- Context menu open tracking → broken aria-expanded
- Folder rename/delete → folder management dies
- Per-page eject button → page stuck in folder

### Revised scope: additive class rename

**Goal:** preserve every prop, every behavior. Only:
1. Rename BEM `pg-row__*` / `pg-folder__*` classes to kebab `bd-pg-*` per Task 1's CSS namespace.
2. Delete dead UI per design: thumbnail gradient block, "updated 2m ago" label, dual action strip (settings+more) → single overflow button.
3. Add chip dot+label format: status chip (`<dot/> Live`), home chip (`<dot/> Home`).
4. Add `bd-pg-row-checkbox` slot (CSS-driven via `.bd-pg-panel.bulk-mode` parent).
5. Add `treeitem` role + `aria-expanded` on folder rows.

**Class rename map:**

| Old (BEM) | New (kebab) |
|-----------|-------------|
| `pg-row-wrap` | `bd-pg-row-wrap` |
| `pg-row` | `bd-pg-row` |
| `pg-row--active` (modifier) | `bd-pg-row.active` (variant class) |
| `pg-row__select-dot` | `bd-pg-row-checkbox` |
| `pg-row__grip` | `bd-pg-row-grip` |
| `pg-row__icon` | `bd-pg-row-icon` |
| `pg-row__thumb*` | DELETE |
| `pg-row__rename` | `bd-pg-row-rename` |
| `pg-row__name` | `bd-pg-row-name` |
| `pg-row__slug` | `bd-pg-row-slug` |
| `pg-row__updated` | DELETE |
| `pg-row__home-badge` | `bd-pg-home-chip` (with dot+label) |
| `pg-row__status pg-row__status--<x>` | `bd-pg-chip <status>` (with dot+label) |
| `pg-row__actions` + dual `pg-row__act` | single `bd-pg-row-overflow` |
| `pg-folder` | `bd-pg-folder` |
| `pg-folder__header` | `bd-pg-row folder-row` (+ `expanded-folder`) |
| `pg-folder__toggle` | `bd-pg-row-disclosure` |
| `pg-folder__chevron--open` (modifier) | parent `.expanded-folder` (CSS rotates child SVG) |
| `pg-folder__name` | `bd-pg-row-name` (reused) |
| `pg-folder__count` | folder count rendered as `bd-pg-folder-count` |
| `pg-folder__actions` + `pg-folder__act` | preserved with rename `bd-pg-folder-actions` (deferred to Task 8 context menu refactor) |
| `pg-folder__pages` | `bd-pg-folder-children` |
| `pg-folder__empty-drop` | `bd-pg-row--empty-folder` |
| `pg-folder__page-wrap` + `pg-folder__eject` | preserved with rename `bd-pg-page-wrap` + `bd-pg-page-eject` |

**Note on overflow button:** PageRow's old per-row action strip (settings gear + 3-dot more) collapses to a single overflow button. The settings gear's role becomes part of the context menu (already exists — `PageContextMenu` has `onSettings` action). Click on overflow → opens context menu, which contains "Settings" and other actions. This matches DESIGN.md anti-slop rule #12.

- [ ] **Step 1: Write failing PageRow tests**

Create `__tests__/PageRow.test.tsx`:

```tsx
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageRow } from "../components/PageRow";
import type { PageItem } from "../types";

const basePage: PageItem = {
  id: "p1",
  name: "Home",
  slug: "/",
  isHome: true,
  isActive: false,
  status: "live",
};

describe("PageRow", () => {
  it("renders name, slug, and row icon", () => {
    render(<PageRow page={basePage} depth={0} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("/")).toBeInTheDocument();
  });

  it("active variant adds .bd-pg-row.active", () => {
    const { container } = render(
      <PageRow page={{ ...basePage, isActive: true }} depth={0} />,
    );
    expect(container.querySelector(".bd-pg-row.active")).not.toBeNull();
  });

  it("nested variant adds .bd-pg-row.nested at depth >= 1", () => {
    const { container } = render(<PageRow page={basePage} depth={1} />);
    expect(container.querySelector(".bd-pg-row.nested")).not.toBeNull();
  });

  it("home page renders .bd-pg-home-chip", () => {
    const { container } = render(<PageRow page={basePage} depth={0} />);
    expect(container.querySelector(".bd-pg-home-chip")).not.toBeNull();
  });

  it("renders status chip with class .bd-pg-chip.live for live status", () => {
    const { container } = render(<PageRow page={basePage} depth={0} />);
    expect(container.querySelector(".bd-pg-chip.live")).not.toBeNull();
  });

  it.each([
    ["draft", "Draft"],
    ["scheduled", "Scheduled"],
    ["hidden", "Hidden"],
    ["password", "Password"],
    ["external", "External"],
    ["error", "Error"],
  ])("renders chip with correct class and label for %s", (status, label) => {
    render(
      <PageRow page={{ ...basePage, status: status as any, isHome: false }} depth={0} />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("unknown status renders no chip", () => {
    const { container } = render(
      <PageRow
        page={{ ...basePage, status: "fnord" as any, isHome: false }}
        depth={0}
      />,
    );
    expect(container.querySelector(".bd-pg-chip")).toBeNull();
  });

  it("long name shows title attribute for tooltip", () => {
    const longName = "A".repeat(50);
    render(<PageRow page={{ ...basePage, name: longName }} depth={0} />);
    const nameEl = screen.getByText(longName);
    expect(nameEl).toHaveAttribute("title", longName);
  });

  it("chip has aria-label matching status", () => {
    const { container } = render(<PageRow page={basePage} depth={0} />);
    const chip = container.querySelector(".bd-pg-chip");
    expect(chip?.getAttribute("aria-label")).toContain("live");
  });

  it("renders single overflow button (not action strip)", () => {
    const { container } = render(<PageRow page={basePage} depth={0} />);
    const overflows = container.querySelectorAll(".bd-pg-row-overflow");
    expect(overflows.length).toBe(1);
    // Old per-row action strip should NOT exist
    expect(container.querySelector(".bd-pg-row-actions")).toBeNull();
  });

  it("focus-visible class applies on tab focus", () => {
    const { container } = render(<PageRow page={basePage} depth={0} />);
    const row = container.querySelector(".bd-pg-row") as HTMLElement;
    row.focus();
    expect(row).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageRow.test.tsx
```
Expected: FAIL (component still uses old class names).

- [ ] **Step 3: Rewrite PageRow.tsx**

Replace the JSX with new structure:

```tsx
/**
 * PageRow — single row in pages tree
 * @license BSD-3-Clause
 */
import { useCallback } from "react";
import { ChevronRight, MoreHorizontal, GripVertical, FileText, Home as HomeIcon, ExternalLink } from "lucide-react";
import type { PageItem } from "../types";
import { getStatusLabel } from "../utils/statusLabel";

interface PageRowProps {
  page: PageItem;
  depth: number;
  isFolder?: boolean;
  isFolderExpanded?: boolean;
  onSelect?: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onOverflow?: (e: React.MouseEvent, id: string) => void;
  onToggleFolder?: (id: string) => void;
  inBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PageRow({
  page,
  depth,
  isFolder = false,
  isFolderExpanded = false,
  onSelect,
  onContextMenu,
  onOverflow,
  onToggleFolder,
  inBulkMode = false,
  isSelected = false,
  onToggleSelect,
}: PageRowProps) {
  const handleClick = useCallback(() => {
    if (inBulkMode) onToggleSelect?.(page.id);
    else onSelect?.(page.id);
  }, [inBulkMode, onToggleSelect, onSelect, page.id]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, page.id);
  }, [onContextMenu, page.id]);

  const handleOverflowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOverflow?.(e, page.id);
  }, [onOverflow, page.id]);

  const handleDisclosureClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) onToggleFolder?.(page.id);
  }, [isFolder, onToggleFolder, page.id]);

  const statusLabel = getStatusLabel(page.status);

  const Icon = page.status === "external" ? ExternalLink : page.isHome ? HomeIcon : FileText;

  const classes = [
    "bd-pg-row",
    page.isActive ? "active" : "",
    depth >= 1 ? "nested" : "",
    isSelected ? "selected" : "",
    isFolder ? "folder-row" : "",
    isFolder && isFolderExpanded ? "expanded-folder" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="bd-pg-row-wrap">
      <div
        className={classes}
        role="treeitem"
        tabIndex={0}
        aria-selected={page.isActive ?? false}
        aria-expanded={isFolder ? isFolderExpanded : undefined}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {inBulkMode && (
          <div className="bd-pg-row-checkbox" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
        )}
        <div className="bd-pg-row-grip" aria-hidden="true">
          <GripVertical />
        </div>
        {isFolder && (
          <button
            className="bd-pg-row-disclosure"
            type="button"
            aria-label={isFolderExpanded ? "Collapse folder" : "Expand folder"}
            onClick={handleDisclosureClick}
          >
            <ChevronRight />
          </button>
        )}
        <span className="bd-pg-row-icon" aria-hidden="true">
          <Icon />
        </span>
        <span className="bd-pg-row-name" title={page.name}>{page.name}</span>
        {page.slug && <span className="bd-pg-row-slug">{page.slug}</span>}
        <span style={{ flex: 1 }} />
        {page.isHome && (
          <span className="bd-pg-home-chip" aria-label="home page">
            <span className="dot" />
            Home
          </span>
        )}
        {statusLabel && (
          <span
            className={`bd-pg-chip ${page.status}`}
            aria-label={`${page.status} status`}
          >
            <span className="dot" />
            {statusLabel}
          </span>
        )}
        <button
          className="bd-pg-row-overflow"
          type="button"
          aria-label={`More actions for ${page.name}`}
          onClick={handleOverflowClick}
        >
          <MoreHorizontal />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write failing PageFolder tests**

Create `__tests__/PageFolder.test.tsx`:

```tsx
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageFolder } from "../components/PageFolder";
import type { FolderItem, PageItem } from "../types";

const folder: FolderItem = {
  id: "f1",
  name: "Marketing",
  pageIds: ["p1", "p2"],
  collapsed: false,
};

const pages: PageItem[] = [
  { id: "p1", name: "About", slug: "/about", status: "live" },
  { id: "p2", name: "Contact", slug: "/contact", status: "draft" },
];

describe("PageFolder (flat model)", () => {
  it("renders folder row + each child page", () => {
    render(<PageFolder folder={folder} pages={pages} depth={0} />);
    expect(screen.getByText("Marketing")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("collapsed folder hides children", () => {
    render(
      <PageFolder folder={{ ...folder, collapsed: true }} pages={pages} depth={0} />,
    );
    expect(screen.queryByText("About")).not.toBeInTheDocument();
  });

  it("empty folder shows .bd-pg-row--empty-folder when expanded", () => {
    const { container } = render(
      <PageFolder folder={{ ...folder, pageIds: [] }} pages={[]} depth={0} />,
    );
    expect(container.querySelector(".bd-pg-row--empty-folder")).not.toBeNull();
  });

  it("folder row has expanded-folder class when expanded", () => {
    const { container } = render(<PageFolder folder={folder} pages={pages} depth={0} />);
    expect(container.querySelector(".bd-pg-row.folder-row.expanded-folder")).not.toBeNull();
  });

  it("clicking disclosure invokes onToggleFolder", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <PageFolder folder={folder} pages={pages} depth={0} onToggleFolder={onToggle} />,
    );
    const disclosure = container.querySelector(".bd-pg-row-disclosure") as HTMLElement;
    fireEvent.click(disclosure);
    expect(onToggle).toHaveBeenCalledWith("f1");
  });
});
```

- [ ] **Step 5: Run failing tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageFolder.test.tsx
```
Expected: FAIL.

- [ ] **Step 6: Rewrite PageFolder.tsx**

```tsx
/**
 * PageFolder — folder row + flat list of child page rows
 * @license BSD-3-Clause
 */
import { PageRow } from "./PageRow";
import type { FolderItem, PageItem } from "../types";

interface PageFolderProps {
  folder: FolderItem;
  pages: PageItem[];
  depth: number;
  onToggleFolder?: (id: string) => void;
  onSelect?: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onOverflow?: (e: React.MouseEvent, id: string) => void;
  inBulkMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function PageFolder({
  folder,
  pages,
  depth,
  onToggleFolder,
  onSelect,
  onContextMenu,
  onOverflow,
  inBulkMode,
  selectedIds,
  onToggleSelect,
}: PageFolderProps) {
  const isExpanded = !folder.collapsed;
  const folderPages = folder.pageIds
    .map((pid) => pages.find((p) => p.id === pid))
    .filter((p): p is PageItem => p !== undefined);

  return (
    <div className="bd-pg-folder" role="group" aria-label={folder.name}>
      <PageRow
        page={{ id: folder.id, name: folder.name, slug: "" } as PageItem}
        depth={depth}
        isFolder
        isFolderExpanded={isExpanded}
        onToggleFolder={onToggleFolder}
      />
      {isExpanded && (
        <div className="bd-pg-folder-children">
          {folderPages.length === 0 ? (
            <div className="bd-pg-row--empty-folder">Empty folder</div>
          ) : (
            folderPages.map((p) => (
              <PageRow
                key={p.id}
                page={p}
                depth={depth + 1}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                onOverflow={onOverflow}
                inBulkMode={inBulkMode}
                isSelected={selectedIds?.has(p.id) ?? false}
                onToggleSelect={onToggleSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Run all new tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageRow.test.tsx src/editor/sidebar/tabs/pages/__tests__/PageFolder.test.tsx
```
Expected: PASS.

- [ ] **Step 8: Type check**

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/components/PageFolder.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageRow.test.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageFolder.test.tsx
git commit -m "feat(pages): rewrite PageRow + PageFolder to .bd-pg-* with treeitem semantics"
```

---

## Task 4: Status Label Util + Chip Coverage

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/pages/utils/statusLabel.ts`
- Create: `packages/editor/src/editor/sidebar/tabs/pages/utils/__tests__/statusLabel.test.ts`

- [ ] **Step 1: Write failing tests**

Create `utils/__tests__/statusLabel.test.ts`:

```ts
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { getStatusLabel } from "../statusLabel";

describe("getStatusLabel", () => {
  it.each([
    ["live", "Live"],
    ["draft", "Draft"],
    ["scheduled", "Scheduled"],
    ["hidden", "Hidden"],
    ["password", "Password"],
    ["external", "External"],
    ["error", "Error"],
  ])("maps %s to %s", (status, expected) => {
    expect(getStatusLabel(status as any)).toBe(expected);
  });

  it("returns null for unknown status", () => {
    expect(getStatusLabel("fnord" as any)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(getStatusLabel(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/utils/__tests__/statusLabel.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement statusLabel.ts**

```ts
/**
 * statusLabel — map PageStatus enum to human-readable label.
 * Returns null for unknown / undefined values (caller renders no chip).
 * @license BSD-3-Clause
 */
import type { PageStatus } from "../types";

const VALID_STATUSES = new Set<PageStatus>([
  "live", "draft", "scheduled", "hidden", "password", "external", "error",
]);

const LABELS: Record<PageStatus, string> = {
  live:      "Live",
  draft:     "Draft",
  scheduled: "Scheduled",
  hidden:    "Hidden",
  password:  "Password",
  external:  "External",
  error:     "Error",
};

export function getStatusLabel(status: PageStatus | undefined): string | null {
  if (!status) return null;
  if (!VALID_STATUSES.has(status)) return null;
  return LABELS[status];
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/utils/__tests__/statusLabel.test.ts
```
Expected: PASS (all 9 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/utils/statusLabel.ts \
        packages/editor/src/editor/sidebar/tabs/pages/utils/__tests__/statusLabel.test.ts
git commit -m "feat(pages): add statusLabel util with 7-variant + unknown-guard"
```

---

## Task 5: PageList — drop indicator + scroll container

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx`
- Test: `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageList.test.tsx` (new)

- [ ] **Step 1: Write failing tests**

Create `__tests__/PageList.test.tsx`:

```tsx
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageList } from "../components/PageList";
import type { FolderItem, PageItem } from "../types";

const pages: PageItem[] = [
  { id: "p1", name: "Home", slug: "/", isHome: true, status: "live", isActive: true },
  { id: "p2", name: "About", slug: "/about", status: "draft" },
];

const noFolders: FolderItem[] = [];

describe("PageList", () => {
  it("renders empty-tree state when pages array is empty", () => {
    render(<PageList pages={[]} folders={noFolders} query="" />);
    expect(screen.getByText("No pages yet")).toBeInTheDocument();
    expect(screen.getByText(/Add your first page/i)).toBeInTheDocument();
  });

  it("renders search-empty state when query has no matches", () => {
    render(<PageList pages={pages} folders={noFolders} query="zzznomatch" />);
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
  });

  it("renders loading skeleton when pages is undefined", () => {
    const { container } = render(
      <PageList pages={undefined as any} folders={noFolders} query="" />,
    );
    const skeletons = container.querySelectorAll(".bd-pg-skeleton-row");
    expect(skeletons.length).toBe(5);
  });

  it("active row has active class", () => {
    const { container } = render(<PageList pages={pages} folders={noFolders} query="" />);
    expect(container.querySelector(".bd-pg-row.active")).not.toBeNull();
  });

  it("scrollbar utility class .buildrick-scrollbar preserved (shared exception)", () => {
    const { container } = render(<PageList pages={pages} folders={noFolders} query="" />);
    expect(container.querySelector(".buildrick-scrollbar")).not.toBeNull();
  });

  it("drop indicator uses var(--bd-accent), not hardcoded #2D6DFF", () => {
    const { container } = render(<PageList pages={pages} folders={noFolders} query="" />);
    const indicator = container.querySelector(".bd-pg-drop-indicator");
    expect(indicator).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageList.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Rewrite PageList.tsx**

Replace JSX. Preserve drop logic but rename indicator class:

```tsx
/**
 * PageList — scroll container + tree rendering with drop indicator
 * @license BSD-3-Clause
 */
import { useState } from "react";
import { PageRow } from "./PageRow";
import { PageFolder } from "./PageFolder";
import type { FolderItem, PageItem } from "../types";

interface PageListProps {
  pages: PageItem[] | undefined;
  folders: FolderItem[];
  query: string;
  activeId?: string;
  bulk?: { isActive: boolean; selected: Set<string> };
  onSelect?: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onOverflow?: (e: React.MouseEvent, id: string) => void;
  onToggleFolder?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  onDropToFolder?: (pageId: string, folderId: string) => void;
}

export function PageList({
  pages,
  folders,
  query,
  bulk,
  onSelect,
  onContextMenu,
  onOverflow,
  onToggleFolder,
  onToggleSelect,
}: PageListProps) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  if (pages === undefined) {
    return (
      <div className="bd-pg-list buildrick-scrollbar" role="tree" aria-label="Pages" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bd-pg-skeleton-row" />
        ))}
      </div>
    );
  }

  const filtered = query
    ? pages.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.slug.toLowerCase().includes(query.toLowerCase()),
      )
    : pages;

  if (pages.length === 0) {
    return (
      <div className="bd-pg-list buildrick-scrollbar" role="tree" aria-label="Pages">
        <div className="bd-pg-empty">
          <div className="bd-pg-empty-title">No pages yet</div>
          <div className="bd-pg-empty-body">Add your first page to get started.</div>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="bd-pg-list buildrick-scrollbar" role="tree" aria-label="Pages">
        <div className="bd-pg-empty">
          <div className="bd-pg-empty-title">{`No results for "${query}"`}</div>
          <div className="bd-pg-empty-body">Try a different search.</div>
        </div>
      </div>
    );
  }

  // Compute which page IDs are in folders, vs top-level
  const pagesInFolders = new Set(folders.flatMap((f) => f.pageIds));
  const topLevel = filtered.filter((p) => !pagesInFolders.has(p.id));

  return (
    <div className="bd-pg-list buildrick-scrollbar" role="tree" aria-label="Pages">
      {folders.map((f) => (
        <PageFolder
          key={f.id}
          folder={f}
          pages={pages}
          depth={0}
          onToggleFolder={onToggleFolder}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          onOverflow={onOverflow}
          inBulkMode={bulk?.isActive}
          selectedIds={bulk?.selected}
          onToggleSelect={onToggleSelect}
        />
      ))}
      {topLevel.map((p, idx) => (
        <div key={p.id}>
          {dropIndex === idx && <div className="bd-pg-drop-indicator show" />}
          <PageRow
            page={p}
            depth={0}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            onOverflow={onOverflow}
            inBulkMode={bulk?.isActive}
            isSelected={bulk?.selected.has(p.id) ?? false}
            onToggleSelect={onToggleSelect}
          />
        </div>
      ))}
      <div className="bd-pg-drop-indicator" aria-hidden="true" />
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageList.test.tsx
```
Expected: PASS (6 cases).

- [ ] **Step 5: Type check**

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/components/PageList.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageList.test.tsx
git commit -m "feat(pages): rewrite PageList with empty/loading states + .bd-pg-drop-indicator"
```

---

## Task 6: BulkToolbar Rewrite

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/BulkToolbar.tsx`
- Test: `packages/editor/src/editor/sidebar/tabs/pages/__tests__/BulkToolbar.test.tsx` (new)

- [ ] **Step 1: Write failing tests**

Create `__tests__/BulkToolbar.test.tsx`:

```tsx
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkToolbar } from "../components/BulkToolbar";

describe("BulkToolbar", () => {
  const noop = () => {};
  const baseProps = {
    count: 3,
    onMoveToFolder: noop,
    onDuplicate: noop,
    onRemoveFromFolders: noop,
    onDelete: noop,
    onClear: noop,
  };

  it("renders count with tabular className", () => {
    render(<BulkToolbar {...baseProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/selected/)).toBeInTheDocument();
  });

  it("does NOT render disabled Publish or Unpublish buttons", () => {
    render(<BulkToolbar {...baseProps} />);
    expect(screen.queryByText(/^Publish$/)).toBeNull();
    expect(screen.queryByText(/^Unpublish$/)).toBeNull();
  });

  it("Move-to-folder click invokes handler", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onMoveToFolder={fn} />);
    fireEvent.click(screen.getByText(/Move to/));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("Duplicate click invokes handler", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onDuplicate={fn} />);
    fireEvent.click(screen.getByText(/Duplicate/));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("Remove-from-folders click invokes handler", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onRemoveFromFolders={fn} />);
    fireEvent.click(screen.getByText(/Remove from folders/));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("Delete button has danger class", () => {
    const { container } = render(<BulkToolbar {...baseProps} />);
    const danger = container.querySelector("button.danger");
    expect(danger?.textContent).toMatch(/Delete/);
  });

  it("Close (clear) click invokes onClear", () => {
    const fn = vi.fn();
    const { container } = render(<BulkToolbar {...baseProps} onClear={fn} />);
    const close = container.querySelector(".bd-pg-bulk-close") as HTMLElement;
    fireEvent.click(close);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("toolbar root has class .bd-pg-bulk-toolbar with role toolbar", () => {
    const { container } = render(<BulkToolbar {...baseProps} />);
    const toolbar = container.querySelector(".bd-pg-bulk-toolbar");
    expect(toolbar).not.toBeNull();
    expect(toolbar?.getAttribute("role")).toBe("toolbar");
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/BulkToolbar.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Rewrite BulkToolbar.tsx**

```tsx
/**
 * BulkToolbar — dark floating pill, absolute-positioned bottom of panel
 * @license BSD-3-Clause
 */
import { X } from "lucide-react";

interface BulkToolbarProps {
  count: number;
  onMoveToFolder: () => void;
  onDuplicate: () => void;
  onRemoveFromFolders: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkToolbar({
  count,
  onMoveToFolder,
  onDuplicate,
  onRemoveFromFolders,
  onDelete,
  onClear,
}: BulkToolbarProps) {
  return (
    <div className="bd-pg-bulk-toolbar" role="toolbar" aria-label="Bulk actions">
      <span className="bd-pg-bulk-count">
        <b className="tabular">{count}</b> selected
      </span>
      <span className="bd-pg-bulk-spacer" />
      <button type="button" onClick={onMoveToFolder}>Move to...</button>
      <button type="button" onClick={onDuplicate}>Duplicate</button>
      <button type="button" onClick={onRemoveFromFolders}>Remove from folders</button>
      <button type="button" className="danger" onClick={onDelete}>Delete</button>
      <button
        type="button"
        className="bd-pg-bulk-close"
        aria-label="Clear selection"
        onClick={onClear}
      >
        <X />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/BulkToolbar.test.tsx
```
Expected: PASS (8 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/components/BulkToolbar.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/__tests__/BulkToolbar.test.tsx
git commit -m "feat(pages): rewrite BulkToolbar to dark floating pill (.bd-pg-bulk-toolbar)"
```

---

## Task 7: AddPageButton + footer wiring

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/AddPageButton.tsx`

- [ ] **Step 1: Read existing AddPageButton.tsx**

Run: `cat packages/editor/src/editor/sidebar/tabs/pages/components/AddPageButton.tsx`

- [ ] **Step 2: Replace markup with `.bd-pg-add` cobalt CTA**

```tsx
/**
 * AddPageButton — primary CTA in pages footer
 * @license BSD-3-Clause
 */
import { Plus } from "lucide-react";

interface AddPageButtonProps {
  onClick: () => void;
}

export function AddPageButton({ onClick }: AddPageButtonProps) {
  return (
    <button type="button" className="bd-pg-add" onClick={onClick} aria-label="Add new page">
      <Plus />
      Add page
    </button>
  );
}
```

- [ ] **Step 3: Type check**

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 4: Visual verify in browser**

Reload `http://localhost:5050`. Pages tab footer now shows cobalt "Add page" button.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/components/AddPageButton.tsx
git commit -m "feat(pages): restyle AddPageButton to .bd-pg-add cobalt CTA"
```

---

## Task 8: Drawer + Palette + Context Menu (token sweep + IRON RULE fix)

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SocialTab.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SettingsErrorBoundary.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/PageCommandPalette.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx`
- Test: `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageCommandPalette.test.tsx` (new)
- Test: `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageContextMenu.test.tsx` (new)

This is a bundled task to keep drawer-chrome migration coherent. Sub-steps:

### 8a — PageCommandPalette IRON RULE regression test (write FAILING test FIRST)

- [ ] **Step 1: Write failing test for `scheduled` label bug**

Create `__tests__/PageCommandPalette.test.tsx`:

```tsx
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageCommandPalette } from "../components/PageCommandPalette";
import type { PageItem } from "../types";

const pages: PageItem[] = [
  { id: "p1", name: "Home", slug: "/", isHome: true, status: "live" },
  { id: "p2", name: "Launch", slug: "/launch", status: "scheduled" },
  { id: "p3", name: "About", slug: "/about", status: "draft" },
];

describe("PageCommandPalette", () => {
  it("opens and renders all pages by default", () => {
    render(<PageCommandPalette pages={pages} onSelect={() => {}} onClose={() => {}} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Launch")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("filters by name as user types", () => {
    render(<PageCommandPalette pages={pages} onSelect={() => {}} onClose={() => {}} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Lau" } });
    expect(screen.getByText("Launch")).toBeInTheDocument();
    expect(screen.queryByText("About")).toBeNull();
  });

  // IRON RULE: regression for pre-existing bug where scheduled status fell through to "Live"
  it("scheduled page renders 'Scheduled' label, NOT 'Live'", () => {
    render(<PageCommandPalette pages={pages} onSelect={() => {}} onClose={() => {}} />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    // Confirm Launch row does not also show "Live"
    const launchRow = screen.getByText("Launch").closest(".bd-pg-palette-item");
    expect(launchRow?.textContent).not.toMatch(/Live/);
  });

  it("Enter on highlighted item invokes onSelect", () => {
    const onSelect = vi.fn();
    render(<PageCommandPalette pages={pages} onSelect={onSelect} onClose={() => {}} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalled();
  });

  it("Escape invokes onClose", () => {
    const onClose = vi.fn();
    render(<PageCommandPalette pages={pages} onSelect={() => {}} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("results cap at 50 even with 100 pages", () => {
    const many: PageItem[] = Array.from({ length: 100 }, (_, i) => ({
      id: `p${i}`, name: `Page ${i}`, slug: `/p${i}`, status: "live",
    }));
    const { container } = render(
      <PageCommandPalette pages={many} onSelect={() => {}} onClose={() => {}} />,
    );
    const items = container.querySelectorAll(".bd-pg-palette-item");
    expect(items.length).toBeLessThanOrEqual(50);
  });

  it("uses class .bd-pg-palette (not legacy pg-palette)", () => {
    const { container } = render(
      <PageCommandPalette pages={pages} onSelect={() => {}} onClose={() => {}} />,
    );
    expect(container.querySelector(".bd-pg-palette")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — confirm FAIL on the scheduled-label assertion**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageCommandPalette.test.tsx
```
Expected: at least the IRON RULE test FAILS (scheduled rendered as "Live"). This proves the test catches the bug.

- [ ] **Step 3: Read existing PageCommandPalette.tsx for the bug**

Run: `sed -n '15,30p' packages/editor/src/editor/sidebar/tabs/pages/components/PageCommandPalette.tsx`
Locate the status-to-label mapping. Around line 20, find the missing `case "scheduled":` branch.

- [ ] **Step 4: Apply 2-line fix + class rename + use new util**

Replace status-label inlines with `getStatusLabel` from the new util. Rename top-level class to `.bd-pg-palette`. Cap results at 50:

```tsx
/**
 * PageCommandPalette — Cmd+K palette for page navigation
 * @license BSD-3-Clause
 */
import { useEffect, useRef, useState } from "react";
import type { PageItem } from "../types";
import { getStatusLabel } from "../utils/statusLabel";

interface Props {
  pages: PageItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

const MAX_RESULTS = 50;

export function PageCommandPalette({ pages, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = (
    query
      ? pages.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.slug.toLowerCase().includes(query.toLowerCase())
        )
      : pages
  ).slice(0, MAX_RESULTS);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      const target = filtered[highlight];
      if (target) onSelect(target.id);
    }
  };

  return (
    <div className="bd-pg-palette-overlay" onClick={onClose} role="presentation">
      <div className="bd-pg-palette" role="dialog" aria-label="Pages quick search" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="bd-pg-palette-input"
          type="text"
          placeholder="Jump to page..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
          onKeyDown={handleKeyDown}
        />
        <div className="bd-pg-palette-list" role="listbox">
          {filtered.map((p, i) => {
            const label = getStatusLabel(p.status);
            return (
              <div
                key={p.id}
                role="option"
                aria-selected={i === highlight}
                className={`bd-pg-palette-item${i === highlight ? " active" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => onSelect(p.id)}
              >
                <span style={{ flex: 1 }}>{p.name}</span>
                <span className="bd-pg-row-slug">{p.slug}</span>
                {label && <span className={`bd-pg-chip ${p.status}`}>{label}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run palette tests — confirm all PASS**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageCommandPalette.test.tsx
```
Expected: PASS (7 cases including IRON RULE).

### 8b — PageContextMenu

- [ ] **Step 6: Write failing tests**

Create `__tests__/PageContextMenu.test.tsx`:

```tsx
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageContextMenu } from "../components/PageContextMenu";
import type { PageItem } from "../types";

const page: PageItem = { id: "p1", name: "Home", slug: "/", status: "live" };

describe("PageContextMenu", () => {
  it("renders rename, duplicate, delete actions", () => {
    render(
      <PageContextMenu page={page} x={100} y={100} onAction={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText(/Rename/)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate/)).toBeInTheDocument();
    expect(screen.getByText(/Delete/)).toBeInTheDocument();
  });

  it("rename click invokes onAction with 'rename'", () => {
    const onAction = vi.fn();
    render(<PageContextMenu page={page} x={0} y={0} onAction={onAction} onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Rename/));
    expect(onAction).toHaveBeenCalledWith("rename", "p1");
  });

  it("uses class .bd-pg-menu", () => {
    const { container } = render(
      <PageContextMenu page={page} x={0} y={0} onAction={() => {}} onClose={() => {}} />,
    );
    expect(container.querySelector(".bd-pg-menu")).not.toBeNull();
  });
});
```

- [ ] **Step 7: Run failing tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageContextMenu.test.tsx
```
Expected: FAIL.

- [ ] **Step 8: Update PageContextMenu.tsx with new classnames**

Read the existing file, replace the wrapping `className` and item classNames to `.bd-pg-menu` / `.bd-pg-menu-item`. Add `danger` class to delete item. Preserve all action handlers and the action key strings (`rename` / `duplicate` / `delete` / etc.) the parent expects.

```tsx
/**
 * PageContextMenu — right-click + overflow menu for a page row
 * @license BSD-3-Clause
 */
import { useEffect, useRef } from "react";
import { Edit3, Copy, Trash2, FolderOpen, Settings as SettingsIcon } from "lucide-react";
import type { PageItem } from "../types";

type Action = "rename" | "duplicate" | "delete" | "moveToFolder" | "settings";

interface Props {
  page: PageItem;
  x: number;
  y: number;
  onAction: (action: Action, pageId: string) => void;
  onClose: () => void;
}

export function PageContextMenu({ page, x, y, onAction, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const fire = (action: Action) => {
    onAction(action, page.id);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="bd-pg-menu"
      style={{ position: "fixed", left: x, top: y }}
      role="menu"
    >
      <div className="bd-pg-menu-item" role="menuitem" onClick={() => fire("rename")}>
        <Edit3 size={12} /> Rename
      </div>
      <div className="bd-pg-menu-item" role="menuitem" onClick={() => fire("duplicate")}>
        <Copy size={12} /> Duplicate
      </div>
      <div className="bd-pg-menu-item" role="menuitem" onClick={() => fire("moveToFolder")}>
        <FolderOpen size={12} /> Move to folder
      </div>
      <div className="bd-pg-menu-item" role="menuitem" onClick={() => fire("settings")}>
        <SettingsIcon size={12} /> Settings
      </div>
      <div className="bd-pg-menu-divider" />
      <div className="bd-pg-menu-item danger" role="menuitem" onClick={() => fire("delete")}>
        <Trash2 size={12} /> Delete
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Run tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/PageContextMenu.test.tsx
```
Expected: PASS (3 cases).

### 8c — PageSettingsDrawer + tabs token sweep

- [ ] **Step 10: Token-sweep drawer files**

For each of these files, replace every `--buildrick-*` token reference with the corresponding `--bd-*` bridge token from the Token Map. Replace any inline `style={{ color: "#xxxxxx" }}` literals in chrome chunks with `var(--bd-fg-primary)` etc. Do NOT change behavior.

Files to sweep:
- `page-settings/PageSettingsDrawer.tsx`
- `page-settings/SeoTab.tsx`
- `page-settings/SocialTab.tsx`
- `page-settings/AdvancedTab.tsx`
- `page-settings/UnsavedWarningModal.tsx`
- `page-settings/SettingsErrorBoundary.tsx`

Verification: after each file, `grep buildrick- <file>` should show only `.buildrick-scrollbar` (the shared exception) or zero hits.

- [ ] **Step 11: Run all pages-related tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/
```
Expected: all PASS.

- [ ] **Step 12: Type check**

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 13: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/components/PageCommandPalette.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/page-settings/ \
        packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageCommandPalette.test.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/__tests__/PageContextMenu.test.tsx
git commit -m "feat(pages): drawer+palette+context-menu .bd-pg-* sweep + scheduled-label IRON RULE fix"
```

---

## Task 9: Hook Tests + Existing Test Migration

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/pages/__tests__/useBulkSelect.test.ts`
- Create: `packages/editor/src/editor/sidebar/tabs/pages/__tests__/useFolders.test.ts`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx`

- [ ] **Step 1: Write useBulkSelect tests**

Create `__tests__/useBulkSelect.test.ts`:

```ts
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBulkSelect } from "../useBulkSelect";

describe("useBulkSelect", () => {
  it("toggle adds id to selected set", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.toggle("p1"));
    expect(result.current.selected.has("p1")).toBe(true);
    expect(result.current.selected.size).toBe(1);
  });

  it("toggle twice removes the id", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => { result.current.toggle("p1"); result.current.toggle("p1"); });
    expect(result.current.selected.has("p1")).toBe(false);
  });

  it("isActive becomes true after first toggle", () => {
    const { result } = renderHook(() => useBulkSelect());
    expect(result.current.isActive).toBe(false);
    act(() => result.current.toggle("p1"));
    expect(result.current.isActive).toBe(true);
  });

  it("clear empties the set and exits bulk mode", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => { result.current.toggle("p1"); result.current.clear(); });
    expect(result.current.selected.size).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("selectAll seeds set with all provided ids", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.selectAll(["a", "b", "c"]));
    expect(result.current.selected.size).toBe(3);
  });

  it("selecting an empty set does NOT enter bulk mode", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.selectAll([]));
    expect(result.current.isActive).toBe(false);
  });
});
```

> If the actual hook signature differs (e.g., method named `toggleId` instead of `toggle`), adapt the test to match — the goal is asserting the contract that already exists.

- [ ] **Step 2: Write useFolders tests**

Create `__tests__/useFolders.test.ts`:

```ts
/**
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFolders } from "../useFolders";

describe("useFolders (flat model)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("createFolder produces folder with empty pageIds and not collapsed", () => {
    const { result } = renderHook(() => useFolders("project-test"));
    act(() => result.current.createFolder("Marketing"));
    expect(result.current.folders.length).toBe(1);
    expect(result.current.folders[0].pageIds).toEqual([]);
    expect(result.current.folders[0].collapsed).toBe(false);
    expect(result.current.folders[0].name).toBe("Marketing");
  });

  it("addPageToFolder appends to pageIds", () => {
    const { result } = renderHook(() => useFolders("project-test"));
    act(() => result.current.createFolder("M"));
    const fid = result.current.folders[0].id;
    act(() => result.current.addPageToFolder(fid, "p1"));
    expect(result.current.folders[0].pageIds).toEqual(["p1"]);
  });

  it("removePageFromFolder filters pageIds", () => {
    const { result } = renderHook(() => useFolders("project-test"));
    act(() => {
      result.current.createFolder("M");
      const fid = result.current.folders[0].id;
      result.current.addPageToFolder(fid, "p1");
      result.current.addPageToFolder(fid, "p2");
      result.current.removePageFromFolder(fid, "p1");
    });
    expect(result.current.folders[0].pageIds).toEqual(["p2"]);
  });

  it("toggleCollapsed flips boolean", () => {
    const { result } = renderHook(() => useFolders("project-test"));
    act(() => result.current.createFolder("M"));
    const fid = result.current.folders[0].id;
    act(() => result.current.toggleCollapsed(fid));
    expect(result.current.folders[0].collapsed).toBe(true);
    act(() => result.current.toggleCollapsed(fid));
    expect(result.current.folders[0].collapsed).toBe(false);
  });

  it("folders never contain other folders (flat-only invariant)", () => {
    const { result } = renderHook(() => useFolders("project-test"));
    act(() => {
      result.current.createFolder("Outer");
      result.current.createFolder("Inner");
    });
    // Each folder is its own top-level entity — there's no folder-into-folder API at all.
    expect(result.current.folders.length).toBe(2);
    expect(result.current.folders[0].pageIds).not.toContain(result.current.folders[1].id);
  });
});
```

> Adapt method names if the hook uses different verbs (e.g., `addToFolder` vs `addPageToFolder`). Goal: lock down the flat-model invariant.

- [ ] **Step 3: Run new hook tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/__tests__/useBulkSelect.test.ts src/editor/sidebar/tabs/pages/__tests__/useFolders.test.ts
```
Expected: PASS (or fail with hook-API mismatch — adapt names then re-run).

- [ ] **Step 4: Migrate PagesTab.test.tsx class assertions**

Open `__tests__/PagesTab.test.tsx`. For every `getByClassName("pg-…")` / `toHaveClass("pg-…")` / `querySelector(".pg-…")`, replace with `.bd-pg-…`. The Class Namespace table at top of this plan has the full mapping.

Run global replace on this single file:
```bash
sed -i.bak \
  -e 's/\.pg-row/.bd-pg-row/g' \
  -e 's/\.pg-list/.bd-pg-list/g' \
  -e 's/\.pg-chip/.bd-pg-chip/g' \
  -e 's/\.pg-bulk/.bd-pg-bulk-toolbar/g' \
  -e 's/\.pg-folder/.bd-pg-folder/g' \
  -e 's/\.pg-add/.bd-pg-add/g' \
  -e 's/\.pg-search/.bd-pg-search/g' \
  -e 's/\.pg-empty/.bd-pg-empty/g' \
  -e 's/\.pg-drop-indicator/.bd-pg-drop-indicator/g' \
  -e 's/\.pg-palette/.bd-pg-palette/g' \
  -e 's/\.pg-menu/.bd-pg-menu/g' \
  packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx
rm packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx.bak
```

Manually inspect the diff: `git diff packages/editor/src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx`. Verify no over-replacement (e.g., a string in a description that contained `.pg-row` should NOT have been changed if it wasn't a CSS class assertion — but those are rare).

- [ ] **Step 5: Run full pages test suite**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/
```
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/__tests__/
git commit -m "test(pages): hook tests + PagesTab.test.tsx class assertion migration"
```

---

## Task 10: Dead-Code Sweep + Final Verification

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` (delete legacy rules)
- Delete (if confirmed unused): `packages/editor/src/editor/sidebar/tabs/pages/utils/thumbnailKey.ts`

- [ ] **Step 1: Verify thumbnailKey.ts is unused**

```bash
grep -rn "thumbnailKey" packages/editor/src/ | grep -v "tabs/pages/utils/thumbnailKey.ts"
```
Expected: zero hits. If any external import exists, leave the file. If empty output, proceed to delete.

- [ ] **Step 2: Delete unused util (if Step 1 returned empty)**

```bash
git rm packages/editor/src/editor/sidebar/tabs/pages/utils/thumbnailKey.ts
```

- [ ] **Step 3: Final `--buildrick-*` baseline check**

```bash
grep -rn "buildrick-" packages/editor/src/editor/sidebar/tabs/pages/ | grep -v ".buildrick-scrollbar" | wc -l
```
Expected: 0. If non-zero, identify each remaining occurrence and rewrite to `--bd-*`. Re-run until 0.

- [ ] **Step 4: Final type check**

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 5: Run full editor test suite**

```bash
cd packages/editor && npx vitest run
```
Expected: ALL pass. If any unrelated test fails, investigate before committing.

- [ ] **Step 6: Visual verify against Figma**

Open Figma reference: `file:///Users/shahg/Downloads/Buildrik%20Design%20System/ui_kits/Pages%20Tab%20-%20Buildrik.html`
Open editor: `http://localhost:5050`. Open Pages tab.
Compare side-by-side:
- Active row cobalt-tint bg + 2px left bar ✓
- Row icon + name + chip alignment ✓
- Footer cobalt "Add page" button ✓
- Hover reveals overflow `...` button + grip ✓
- Bulk-select shows dark floating pill ✓
- Cmd+K opens palette with cobalt-tint highlight ✓
- Right-click opens menu with `.bd-pg-menu` styling ✓

- [ ] **Step 7: Commit**

```bash
git add -u packages/editor/src/editor/sidebar/tabs/pages/
git commit -m "refactor(pages): dead-code sweep + delete unused thumbnailKey util"
```

---

## Task 11: Manual QA Checklist (`/qa-only` deferred items)

**Files:**
- No code changes. Documentation pass only.

- [ ] **Step 1: Run manual checklist at 1280×800 viewport**

In the dev server (`http://localhost:5050`), Pages tab at 1280×800:

- [ ] Tab opens via rail click AND `P` keyboard shortcut
- [ ] Add a page → row appears, status defaults to "draft"
- [ ] Click row → becomes active (cobalt-tint + 2px bar)
- [ ] Right-click row → context menu opens at cursor
- [ ] `...` overflow button → same context menu opens
- [ ] Hover row → grip visible on left, overflow `...` visible on right
- [ ] Cmd+K → palette opens, type "home" → filters
- [ ] Palette: scheduled page shows "Scheduled" label (NOT "Live")
- [ ] Drag a page to the bottom → cobalt drop indicator appears
- [ ] Create folder, drag page into folder → folder.pageIds grows
- [ ] Collapse folder → children hide; expand → reappear
- [ ] Empty folder shows "Empty folder" muted row
- [ ] Search "zzznomatch" → "No results for..." empty state
- [ ] Delete all pages → "No pages yet" empty state with cobalt CTA
- [ ] Bulk-select 3 pages → dark pill toolbar appears at bottom
- [ ] Bulk-toolbar Delete → confirmation modal
- [ ] Bulk-toolbar Close → toolbar hides, selection clears
- [ ] Each chip variant visible at least once (use 7 different status pages)
- [ ] Settings drawer opens, all 3 tabs render with new tokens
- [ ] Reduced-motion: macOS System Settings → Accessibility → Reduce Motion → all panel transitions disabled
- [ ] Tab through rows with keyboard → focus-visible cobalt outline
- [ ] Screen-reader (VoiceOver): announces "tree, Pages, treeitem"

- [ ] **Step 2: Document `/qa-only` follow-up items**

Append to `~/.gstack/projects/aamirtauqir-buildrik/saqib-main-pages-tab-eng-review-test-plan.md` (or create if missing) the 8 deferred E2E items from `shahg-main-eng-review-test-plan-20260425-025310.md` for the next QA-only consumer.

- [ ] **Step 3: Final commit (manual QA notes)**

If any QA findings surfaced, fix them as separate commits (each one a Task 0-style audit + targeted fix). If clean:

```bash
echo "Manual QA pass complete on $(date +%Y-%m-%d)" >> packages/editor/src/editor/sidebar/tabs/pages/QA-LOG.md
git add packages/editor/src/editor/sidebar/tabs/pages/QA-LOG.md
git commit -m "docs(pages): manual QA pass complete — Pages tab full reboot ships"
```

---

## Done-When Audit

After Task 11:

- [ ] All 72 unit + integration tests pass
- [ ] `npx tsc --noEmit` clean
- [ ] Zero `--buildrick-*` token references in pages subtree (except `.buildrick-scrollbar` shared utility)
- [ ] Manual QA checklist 100% green
- [ ] Visual parity ≥ 90% with Figma `Pages Tab - Buildrik.html`
- [ ] All 11 commits land on main
- [ ] No regressions in adjacent tabs (Layers, Settings, Components — quick sanity browse)

If any item un-checked, that's the next thing to address.
