# Layers Tab — Standalone Implementation Plan

> **Source:** Extracted from `2026-04-09-left-sidebar-complete-implementation.md` (Task 2) as a standalone baseline for `/plan-ceo-review`.

**Goal:** Bring the Layers tab to pixel-perfect alignment with the `new.left.pen` pencil screens and close the four known gap states (search, multi-select, selection-sync reveal, LayerRow states).

**Tech Stack:** React 18, TypeScript, Emotion/CSS Modules (`--ls-*` CSS custom properties), Vitest + React Testing Library, Pencil MCP for screen references.

**Source of truth:** `/Users/shahg/Desktop/codex/new.left.pen` — Layers panel screens.

---

## Status Snapshot (as of 2026-04-17)

| Area | State |
|------|-------|
| Tree render | ⚠ Exists, but LayerRow state coverage incomplete |
| Search | ✗ Not wired in header |
| Multi-select action bar | ✗ Missing |
| Selection-sync reveal banner | ✗ Missing |
| Drag/reorder | ⚠ Needs audit |
| Light theme | ✗ Not applied globally yet |

## Pencil Screen Reference Map

| Screen ID | Purpose |
|-----------|---------|
| `R6Odi` | Root — default Layers panel |
| `IR82U` | Search active |
| `R4Pf4` | Multi-select action bar |
| `uHSyK` | Selection synced from canvas (reveal banner) |

**LayerRow states (6):** Default, Hover, Selected, Hidden, Locked, Rename.

---

## Files in Scope

- Modify: `editor/sidebar/tabs/layers/LayersTab.tsx`
- Modify: `editor/panels/layers/styles/layers.css`
- Modify: `editor/panels/layers/LayerTreeItem.tsx`
- Test: `editor/panels/layers/__tests__/LayersTab.test.tsx`

---

## Steps

- [ ] **Step 1: Screenshot all Layers pencil screens**

Use Pencil MCP to read screens `R6Odi`, `IR82U`, `R4Pf4`, `uHSyK`. Document gaps vs current `LayersTab` render.

- [ ] **Step 2: Verify LayerRow states match pencil component library**

Pencil has 6 LayerRow states: Default, Hover, Selected, Hidden, Locked, Rename. Read `editor/panels/layers/LayerTreeItem.tsx`. Apply these CSS rules:

```css
/* editor/panels/layers/styles/layers.css */
.lyr-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ls-text-primary, #0F172A);
  transition: background 100ms ease;
  user-select: none;
}
.lyr-row:hover        { background: var(--ls-bg-subtle, #F1F5F9); }
.lyr-row--selected    { background: var(--ls-accent-bg, #DBEAFE); color: var(--ls-accent-txt, #1E40AF); }
.lyr-row--hidden      { opacity: 0.45; }
.lyr-row--locked .lyr-row__drag-handle { display: none; }
.lyr-row--rename .lyr-row__name        { display: none; }
.lyr-row--rename .lyr-row__rename-input { display: block; }
.lyr-row__rename-input {
  display: none;
  width: 100%;
  font-size: 13px;
  border: 1px solid var(--ls-accent, #1D4ED8);
  border-radius: 4px;
  padding: 0 4px;
  outline: none;
  background: white;
  color: var(--ls-text-primary, #0F172A);
}
```

- [ ] **Step 3: Add search active state (Screen IR82U)**

Pencil screen `IR82U` shows a search bar inside the Layers panel header area. Wire it in `LayersTab.tsx`:

```tsx
const [searchQuery, setSearchQuery] = React.useState('');

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search layers..."
  className="lyr-search"
/>

<LayersPanel
  composer={composer}
  searchQuery={searchQuery}
  onElementSelect={onElementSelect}
  canvasHoveredId={canvasHoveredId}
/>
```

- [ ] **Step 4: Add multi-select action bar (Screen R4Pf4)**

Pencil screen `R4Pf4` shows a bottom action bar when multiple layers are selected:

```tsx
{selectedCount > 1 && (
  <div className="lyr-action-bar">
    <span className="lyr-action-bar__count">{selectedCount} selected</span>
    <div className="lyr-action-bar__actions">
      <button onClick={onGroupSelected} title="Group">Group</button>
      <button onClick={onDeleteSelected} title="Delete" className="lyr-action-bar__delete">Delete</button>
    </div>
  </div>
)}
```

```css
.lyr-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--ls-border-light, #E2E8F0);
  background: var(--ls-bg-card, #FFFFFF);
  font-size: 12px;
}
.lyr-action-bar__count   { color: var(--ls-text-muted, #475569); font-weight: 500; }
.lyr-action-bar__actions { display: flex; gap: 8px; }
.lyr-action-bar__delete  { color: #DC2626; }
```

- [ ] **Step 5: Add selection-sync reveal banner (Screen uHSyK)**

Screen `uHSyK` shows a "Selection synced from canvas" banner at top when the user picks an element on the canvas and the tree reveals it:

```tsx
{selectionSynced && (
  <div className="lyr-sync-banner" ref={syncBannerRef}>
    Selection synced from canvas
  </div>
)}
```

```css
.lyr-sync-banner {
  padding: 6px 12px;
  background: var(--ls-accent-bg, #DBEAFE);
  color: var(--ls-accent-txt, #1E40AF);
  font-size: 12px;
  border-bottom: 1px solid var(--ls-border-light, #E2E8F0);
  animation: lyr-fade-in 200ms ease;
}
@keyframes lyr-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 6: Write tests**

```tsx
// editor/panels/layers/__tests__/LayersTab.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LayersTab from '../LayersTab';

describe('LayersTab', () => {
  it('renders search bar and filters layers on input', () => {
    // render with mock composer
    // type in search bar
    // verify tree filters
  });

  it('shows action bar when multiple layers selected', () => {
    // render with 2+ selected
    // verify action bar with count + delete button
  });
});
```

Run: `npx vitest run editor/panels/layers`

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/layers/ packages/editor/src/editor/panels/layers/
git commit -m "feat(editor): align Layers tab to pencil screens 9–11"
```

---

## Open Questions for CEO Review

These are the premises this plan inherits without challenging — CEO review should revisit:

1. **Is a tree the right metaphor?** Figma/Framer use tree + outline hybrid; should we?
2. **Multi-select ceiling.** Only Group + Delete in the action bar — what about Align, Distribute, Lock, Hide, Duplicate, Wrap-in-container?
3. **Search scope.** Name-only? Or also type/tag/locked/hidden filters?
4. **Selection-sync direction.** Canvas → tree reveal is covered; what about tree → canvas scroll-to and zoom-to-fit?
5. **Drag/reorder model.** Single-level reorder or full hierarchy reparenting with drop indicators?
6. **Rename affordance.** Double-click only, or also F2 / Enter-on-selected?
7. **Performance ceiling.** How many layers before virtualization is required?
8. **Keyboard story.** Full keyboard nav (arrows, Enter, Esc, Cmd+A, Shift-click, Cmd-click)?
9. **Component/instance distinction.** How are component instances visually differentiated in the tree?
10. **Empty state.** What does an empty page look like in Layers?

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | **SCOPE REDUCTION** | Plan premise false — 90% of described work already built. 3 regressions identified. 7 items moved to NOT-in-scope. |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | **ISSUES OPEN (SCOPE_REDUCED)** | 6 issues resolved; 3 critical gaps (visual regression has no automated gate — manual QA only per user decision); scope expanded to cross-editor theme reconciliation |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | **CLEAN (score 5→9)** | 7 design decisions added: focus ring, drop color, selected-row contrast, modal overlay, reduced-motion, hover transition, pencil audit checklist |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

### CEO Review Findings (2026-04-17, commit 6f0c72e)

**Status snapshot was factually wrong.** Every "✗ missing" item in the original plan already exists in code:

- **Search** → `panels/layers/index.tsx:343-361` (`useLayerSearch` hook + input + live region + no-matches UI)
- **Multi-select action bar** → `LayerSelectionBanner.tsx` (Group/Hide/Delete/Exit + inline delete confirm)
- **Sync reveal banner** → `LayersTab.tsx:91-107, 161-166` (2.5s auto-dismiss, aria-live)
- **6 row states** → `LayerTreeItem.tsx:112-121` (all applied)
- **Drag/reorder** → `panels/layers/index.tsx:67-135` (nesting + locked-container + drop feedback)

**Executing the original plan as-written would regress live features:**
1. Reintroduce a P0 bug — duplicate search boxes (fix comment at `LayersTab.tsx:58-59`)
2. Drop Hide + Exit buttons from the multi-select action bar
3. Double down on a design-system violation — `--ls-*` tokens use indigo (`#1D4ED8`, `#1E40AF`) and light-theme backgrounds inside a dark-only editor chrome (per `editor/CLAUDE.md`: cobalt `#2D6DFF` only)

### Revised Scope (user-approved 2026-04-17)

1. **Visual audit** — Screenshot current Layers tab, diff against pencil `R6Odi`/`IR82U`/`R4Pf4`/`uHSyK`
2. **Fix every gap found** in the same PR (per user decision)
3. **Token migration** — `--ls-*` in `editor/sidebar/LeftSidebar.css:45-64` from indigo/light → cobalt/dark. Cascades across all sidebar tabs.
4. **Dual-class cutover** — Pick `aqb-layer-row` OR `lyr-row`, delete the loser + hex fallbacks in `layers.css:886-986`
5. **(TODO for later)** CI grep rule banning `#1D4ED8|#1E40AF|#4F46E5|indigo|violet` in `packages/editor/src`

**Effort:** human ~1.5 days / CC ~1.5 hrs. Risk: low-medium.

### NOT in scope (originally in plan)

- Build new search bar in `LayersTab.tsx` (would reintroduce P0 duplicate-search)
- Replace multi-select bar with Group+Delete only (loses Hide + Exit)
- Add new sync-reveal banner (exists)
- Rewrite LayerTreeItem row states (already applies all 6)
- Drag/reorder audit as greenfield (working, with validation)
- SearchBar wire in tab-level component (anti-pattern per P0 fix comment)
- The 10 "Open Questions" — each deferred to individual TODOs if pursued

### Critical gaps flagged

1. `--ls-*` hex fallbacks mask the migration if tokens are deleted — remove fallbacks so missing tokens fail loudly
2. No guardrail against indigo regression post-migration — deferred as TODO P2 (CI grep)
3. Migration cascades to all sidebar tabs, not just Layers — visual QA all tabs post-change

**VERDICT:** **ORIGINAL PLAN REJECTED.** Proceed with revised scope above. Recommend `/plan-eng-review` on the revised scope before implementation.

### Eng Review Findings (2026-04-17, commit 6f0c72e, branch feat/page-tab-phase-2-visuals)

**Scope expanded during eng review.** The CEO review scoped this as "Layers tab theme" — eng review found the actual scope is a cross-editor theme reconciliation:

- 29 files consume `var(--ls-*)` tokens (sidebar, inspector, canvas, shared UI, media library)
- ~400 token references across the editor
- `themes/ux-fixes.css` and `themes/default.css` also reference banned indigo (`--aqb-primary`)
- `DESIGN.md` says dark + cobalt; `LeftSidebar.css` ships light + indigo — newer git history proves code went light AFTER spec was written

**Final scope (user-approved 2026-04-17):**

1. **Alias `--ls-*` to canonical tokens** — `editor/sidebar/LeftSidebar.css:42-91` — e.g., `--ls-accent: var(--accent)`, `--ls-bg-panel: var(--aqb-bg-panel)`. Every consumer inherits automatically.
2. **Purge indigo from `themes/default.css`** — replace `--aqb-primary` indigo values with cobalt `#2D6DFF`.
3. **Migrate `themes/ux-fixes.css`** — `--aqb-primary` references → `--accent`.
4. **Delete `components/Panels/LayersPanel/styles/layers.css`** — 651 lines, zero imports, confirmed dead.
5. **Dual-class cutover: keep `aqb-layer-row`, delete `lyr-row`** — update `LayerTreeItem.tsx:112-121`, `LayerSelectionBanner.tsx:35,40,41,49`, `panels/layers/styles/layers.css:886-986`.
6. **Remove hex fallbacks** in `panels/layers/styles/layers.css:886-986` — force tokens to fail loudly if missing.
7. **Manual visual QA** across all 7 sidebar tabs + topbar + inspector + canvas.
8. **Visual gap audit Layers vs pencil** `R6Odi/IR82U/R4Pf4/uHSyK` — fix every gap found in this PR.

### Critical gaps (manual QA is the only mitigation — user chose A on Issue 3.1)

1. Token alias undefined → invisible element (no test)
2. Flip breaks light-bg assumption in some CSS rule → dark text on dark bg (no test)
3. Legacy CSS deletion misses an edge-case import → visual regression (no test)

### Parallelization

| Step | Module | Depends on |
|------|--------|------------|
| 1. Delete dead CSS | `components/Panels/LayersPanel/styles/` | — |
| 2. Token alias flip | `editor/sidebar/LeftSidebar.css` | — |
| 3. default.css indigo purge | `themes/default.css` | — |
| 4. ux-fixes.css migration | `themes/ux-fixes.css` | — |
| 5. Dual-class cutover | `editor/panels/layers/` | 2 |
| 6. Remove hex fallbacks | `editor/panels/layers/styles/` | 2 |
| 7. Manual visual QA | all tabs | 1-6 |
| 8. Pencil gap audit + fixes | `editor/panels/layers/`, `editor/sidebar/tabs/layers/` | 1-7 |

**Lanes:**
- Lane A (parallel, independent): Steps 1, 2, 3, 4
- Lane B (sequential, after A): Steps 5 → 6
- Lane C (sequential, after B): Steps 7 → 8

### TODOs (deferred to `TODOS.md`)

1. Playwright visual regression infra for all 7 sidebar tabs (P2, ~2 days / CC ~1 hr)
2. CI grep rule for banned indigo/violet hex (P2, ~30 min / CC ~10 min)
3. Post-migration hardcoded indigo audit (P2, ~1 hr / CC ~10 min)

### Test Plan Artifact

Written to `~/.gstack/projects/aamirtauqir-buildrik/shahg-feat-page-tab-phase-2-visuals-eng-review-test-plan-20260417-192529.md` for consumption by `/qa`.

### Design Review Findings (2026-04-17, commit 6f0c72e, branch feat/page-tab-phase-2-visuals)

**Initial design score: 5/10. Final: 9/10 after 7 passes.**

Design review added these specifications to the plan. Implementer follows these exactly.

#### Alias mapping table (Pass 5)

```
--ls-*              | Alias target            | Source
--------------------|-------------------------|---------------------------
--ls-bg-panel       | --aqb-bg-panel          | DESIGN.md "Backgrounds"
--ls-bg-card        | --aqb-surface-2 #1A1A22 | DESIGN.md 5-layer depth
--ls-bg-subtle      | rgba(255,255,255,0.04)  | Hover convention
--ls-accent         | --accent #2D6DFF        | DESIGN.md cobalt primary
--ls-accent-bg      | --accent-tint (12%)     | DESIGN.md selection bg
--ls-accent-txt     | --aqb-text-primary      | Pass 5 Issue 1 (contrast)
--ls-text-primary   | --aqb-text-primary      | 14.1:1 WCAG AAA
--ls-text-secondary | --aqb-text-secondary    | 6.5:1 WCAG AA
--ls-text-muted     | --aqb-text-tertiary     | 5.8:1 WCAG AA
--ls-border-light   | --aqb-border            | rgba white 0.08
--ls-danger         | keep #DC2626            | Pass 2 Issue 2
--ls-overlay        | rgba(0,0,0,0.7)         | Pass 5 Issue 2 (dark modal)
```

#### Interaction state matrix (Pass 2)

```
FEATURE          | DEFAULT     | HOVER        | FOCUS              | SELECTED              | DISABLED
-----------------|-------------|--------------|--------------------|-----------------------|-----------
Layer row        | transp bg   | white 4% bg  | 2px cobalt outline | cobalt-tint bg +      | 45% opacity
                 |             |              | + 2px offset       | 2px cobalt left-border| (hidden)
                 |             |              |                    | WHITE text            |
Search input     | dark bg     | same + border| 2px cobalt outline | caret cobalt          | N/A
Tab buttons      | icon only   | white 6% bg  | 2px cobalt outline | cobalt icon           | N/A
Rename input     | hidden      | N/A          | 2px cobalt outline | cobalt ring on focus  | N/A
```

**Critical spec:** selected rows use **white text** (`--aqb-text-primary`) + cobalt **background-tint** + cobalt **left-border**. NOT cobalt text on cobalt bg — that's a WCAG AA failure at 4.0:1.

#### Accessibility spec (Pass 6)

- Focus ring universal: `outline: 2px solid var(--accent); outline-offset: 2px;`
- Add `@media (prefers-reduced-motion: reduce) { .lyr-sync-banner { animation: none; } }` to `layers.css`
- Hover-reveal icons (eye/lock): `opacity: 0 → 1; transition: opacity 100ms ease;` on row:hover

#### Pencil audit checklist (Pass 7 Issue 1)

Implementer step 1 must complete this diff matrix. Pencil app required.

| # | Pencil screen | Verify |
|---|---|---|
| 1 | `R6Odi` (Root) | Selection row color = cobalt `#2D6DFF` tint (not indigo) |
| 2 | `IR82U` (Search) | Placeholder text + any keyboard shortcut hint |
| 3 | `R4Pf4` (Multi-select) | Button order + icons vs labels + any actions beyond Group/Hide/Delete/Done |
| 4 | `uHSyK` (Sync banner) | Background color exact hex, icon (if any), dismiss duration |
| 5 | All | Font family pinned (Inter Tight or Geist), not inherited |
| 6 | All | Row height (32px vs 36px vs 28px) |
| 7 | All | Icon sizes (14px vs 16px) |

Open `/Users/shahg/Desktop/codex/new.left.pen` in Pencil app. Run editor (`npm run dev` port 5050). Side-by-side diff. Fix every gap in this PR.

### Design Outputs

**NOT in scope:** visual mockup generation (OpenAI org verification required and not yet completed).

**Design decisions added to plan:** 7
- Focus ring: 2px cobalt + 2px offset (Pass 2)
- Drop feedback: keep `#DC2626` (Pass 2)
- Selected row: white text + cobalt bg-tint + left-border (Pass 5)
- Modal overlay: `rgba(0,0,0,0.7)` (Pass 5)
- Reduced-motion opt-out for sync banner (Pass 6)
- Hover icon transition: 100ms ease opacity (Pass 7)
- Pencil audit checklist added to implementer step 1 (Pass 7)

**Unresolved (deferred to pencil audit):** exact pencil screen visual diff — pending Pencil app availability during implementation.

### VERDICT: ENG REVIEW COMPLETE — SCOPE_REDUCED mode

- 6 issues surfaced, all resolved with user decisions
- 3 critical gaps flagged (visual regression has no automated safety net — manual QA gates this PR)
- Scope expanded from "Layers tab" to "cross-editor theme reconciliation" with user approval
- Ready to implement. Run `/ship` after completion.

**Required before ship:** manual visual QA per test plan above. Before/after screenshots in PR description.
