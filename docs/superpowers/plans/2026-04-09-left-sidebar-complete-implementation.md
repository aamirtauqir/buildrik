# Left Sidebar — Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the left sidebar redesign against `new.left.pen` — all 8 tabs pixel-perfect, plus global light theme for Canvas/Topbar/Inspector.

**Architecture:** Each tab is a self-contained component under `editor/sidebar/tabs/<tab>/`. Shared primitives live in `editor/sidebar/shared/`. Design tokens (`--ls-*`) are already extracted in `LeftSidebar.css`. The process for each tab is: read pencil screens → compare to code → patch CSS/JSX gaps → commit.

**Tech Stack:** React 18, TypeScript, Emotion/CSS Modules (ls-* CSS custom properties), Vitest + React Testing Library, Pencil MCP for screenshots.

**Source of truth:** `/Users/shahg/Desktop/codex/new.left.pen` — 36 screens, 61 components.

---

## Status Snapshot (as of 2026-04-09)

| Tab | Route | Status |
|-----|-------|--------|
| Add/Build | `add` → `BuildTab` | ✓ Done (pixel-perfect) |
| Media | `assets` → `MediaTab` | ⚠ Partial — shell exists, 15 states need audit |
| Layers | `layers` → `LayersTab` | ⚠ Partial — tree exists, search/multi-select/drag states need audit |
| Pages | `pages` → `PagesTab` | ⚠ Partial — list exists, create/rename/reorder/settings states need audit |
| Components | `components` → `ComponentsTab` | ⚠ Partial — list exists, detail + empty state need audit |
| Templates | `templates` → `TemplatesTab` (fullpage) | ⚠ Partial — shell exists, filtered/detail/apply states need audit |
| History | `history` → `HistoryTab` (fullpage) | ⚠ Partial — ViewSwitcher wired, versions/activity detail states need audit |
| Settings | `settings` → `SettingsTab` (fullpage) | ⚠ Partial — screens exist, dirty rail/validation states need audit |
| Canvas/Topbar/Inspector | global | ✗ Light theme not applied |

**Shared foundation — already done:**
- `editor/sidebar/LeftSidebar.tsx` — rail + panel shell
- `editor/sidebar/LeftSidebar.css` — all `--ls-*` tokens
- `editor/sidebar/shared/` — PanelHeader, SearchBar, EmptyStates, Skeleton, ViewSwitcher, DrillInHeader
- `editor/rail/LayoutShell.tsx` + `LayoutShell.css` — CSS grid

---

## Pencil Screen Reference Map

| Tab | Pencil Screen IDs |
|-----|------------------|
| Add | `asCNI` (root), `QFUVG` (search) |
| Media | `aPaxB` (root), `hoPrk` (upload complete), `pd04L` (partial failure), `COb2m` (detail error) |
| Layers | `R6Odi` (root), `IR82U` (search), `R4Pf4` (multi-select), `uHSyK` (selection sync) |
| Pages | `VIyme` (list), `XFv6P` (settings form), `c0ad1` (popover focus), `QHkn0` (creating), `SnsIA` (success), `GoEJk` (name conflict) |
| Components | `gIKXw` (list), `E2jan` (detail), `65J2Q` (empty) |
| Templates | `2ihz1` (root), `foBlu` (filtered), `cV3OT` (card detail), `3pR56` (apply states) |
| History | `vpidT`/`n04gR` (activity), `TA4V8`/`2FPM5` (error), `KP3Z7`/`pdRIP` (snapshot rename) |
| Settings | `3hXGN` (root), `HxI21` (unsaved), `ZqKTV` (save error), `6FT65` (validation+dirty), `Caq8k` (save success) |

---

## Task 1: Media Tab — Full Pencil Alignment

**Pencil screens:** `aPaxB` (root), `hoPrk` (upload complete), `pd04L` (partial failure), `COb2m` (detail error)

**Files:**
- Modify: `editor/sidebar/tabs/media/MediaTab.tsx`
- Modify: `editor/sidebar/tabs/media/MediaTab.css`
- Modify: `editor/sidebar/tabs/media/components/LibraryView.tsx`
- Modify: `editor/sidebar/tabs/media/components/UploadZone.tsx`
- Modify: `editor/sidebar/tabs/media/components/SelectionBanner.tsx`
- Test: `editor/sidebar/tabs/media/__tests__/MediaTab.test.tsx`

- [ ] **Step 1.1: Screenshot all Media pencil screens**

```bash
# Use Pencil MCP to capture each screen
# In Claude Code session: read screens aPaxB, hoPrk, pd04L, COb2m
# Document gaps between screenshots and current MediaTab.tsx render
```

- [ ] **Step 1.2: Audit UploadZone against pencil Screen 8 (root)**

Read `editor/sidebar/tabs/media/components/UploadZone.tsx`. The pencil design shows:
- Upload zone: dashed border, `--ls-border-soft` color, centered upload icon + "Drag files or click to browse" text
- Height: ~80px when collapsed, full panel when empty library
- Background: `--ls-bg-subtle` (`#F1F5F9`)

Patch `UploadZone.tsx` and `MediaTab.css` so it matches. Key classes:

```css
/* In MediaTab.css */
.med-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  border: 1.5px dashed var(--ls-border-soft, #CBD5E1);
  border-radius: 8px;
  background: var(--ls-bg-subtle, #F1F5F9);
  cursor: pointer;
  min-height: 80px;
  transition: border-color 150ms ease, background 150ms ease;
}
.med-upload-zone:hover,
.med-upload-zone--drag-active {
  border-color: var(--ls-accent, #1D4ED8);
  background: var(--ls-accent-bg, #DBEAFE);
}
.med-upload-zone__label {
  font-size: 12px;
  color: var(--ls-text-muted, #475569);
  text-align: center;
}
```

- [ ] **Step 1.3: Audit LibraryView grid against pencil**

Pencil shows 3-column thumbnail grid. Verify `LibraryView.tsx` uses:

```css
/* In MediaTab.css */
.med-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 12px;
}
.med-thumb {
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: var(--ls-bg-subtle, #F1F5F9);
  cursor: pointer;
  position: relative;
}
.med-thumb:hover .med-thumb__overlay {
  opacity: 1;
}
.med-thumb__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 150ms ease;
}
.med-thumb__name {
  font-size: 10px;
  color: var(--ls-text-muted, #475569);
  margin-top: 4px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
```

- [ ] **Step 1.4: Implement upload progress state (Screen 8m)**

Pencil Screen `hoPrk` shows upload progress bar in `SelectionBanner` area. Add to `SelectionBanner.tsx`:

```tsx
// In SelectionBanner.tsx — add upload progress variant
interface UploadProgressBannerProps {
  fileName: string;
  progress: number; // 0-100
  onCancel: () => void;
}

export function UploadProgressBanner({ fileName, progress, onCancel }: UploadProgressBannerProps) {
  return (
    <div className="med-banner med-banner--upload">
      <span className="med-banner__label">{fileName}</span>
      <div className="med-progress">
        <div className="med-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <button className="med-banner__cancel" onClick={onCancel} aria-label="Cancel upload">✕</button>
    </div>
  );
}
```

```css
/* In MediaTab.css */
.med-banner--upload {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ls-bg-subtle, #F1F5F9);
  border-bottom: 1px solid var(--ls-border-light, #E2E8F0);
}
.med-progress {
  flex: 1;
  height: 4px;
  background: var(--ls-border-light, #E2E8F0);
  border-radius: 2px;
  overflow: hidden;
}
.med-progress__bar {
  height: 100%;
  background: var(--ls-accent, #1D4ED8);
  border-radius: 2px;
  transition: width 200ms ease;
}
```

- [ ] **Step 1.5: Implement partial failure state (Screen 8n)**

Screen `pd04L` shows a "3 uploads failed · Retry All" strip above the grid:

```tsx
// In MediaTab.tsx — add failure strip
{failedCount > 0 && (
  <div className="med-failure-strip">
    <span>{failedCount} upload{failedCount > 1 ? 's' : ''} failed</span>
    <button onClick={onRetryAll}>Retry All</button>
  </div>
)}
```

```css
/* In MediaTab.css */
.med-failure-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #FEF2F2;
  border-bottom: 1px solid #FECACA;
  font-size: 12px;
  color: #DC2626;
}
.med-failure-strip button {
  font-size: 12px;
  color: var(--ls-accent, #1D4ED8);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
}
```

- [ ] **Step 1.6: Write tests**

```tsx
// editor/sidebar/tabs/media/__tests__/MediaTab.test.tsx
import { render, screen } from '@testing-library/react';
import { MediaTab } from '../MediaTab';

describe('MediaTab', () => {
  it('renders upload zone when library is empty', () => {
    render(<MediaTab composer={null} />);
    expect(screen.getByText(/drag files or click to browse/i)).toBeInTheDocument();
  });

  it('shows failure strip when uploads have failed', () => {
    // Mock composer with failed uploads state
    // Verify strip text and retry button appear
  });
});
```

Run: `npx vitest run editor/sidebar/tabs/media`

- [ ] **Step 1.7: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/media/
git commit -m "feat(editor): align Media tab to pencil screens 8a-8o"
```

---

## Task 2: Layers Tab — Full Pencil Alignment

**Pencil screens:** `R6Odi` (root), `IR82U` (search active), `R4Pf4` (multi-select), `uHSyK` (selection sync reveal)

**Files:**
- Modify: `editor/sidebar/tabs/layers/LayersTab.tsx`
- Modify: `editor/panels/layers/styles/layers.css`
- Modify: `editor/panels/layers/LayerTreeItem.tsx`
- Test: `editor/panels/layers/__tests__/LayersTab.test.tsx`

- [ ] **Step 2.1: Screenshot all Layers pencil screens**

```bash
# Use Pencil MCP: read screens R6Odi, IR82U, R4Pf4, uHSyK
# Document gaps vs current LayersTab render
```

- [ ] **Step 2.2: Verify LayerRow states match pencil component library**

Pencil has 6 LayerRow states: Default, Hover, Selected, Hidden, Locked, Rename.
Read `editor/panels/layers/LayerTreeItem.tsx`. Apply these CSS rules:

```css
/* In editor/panels/layers/styles/layers.css */
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
.lyr-row:hover {
  background: var(--ls-bg-subtle, #F1F5F9);
}
.lyr-row--selected {
  background: var(--ls-accent-bg, #DBEAFE);
  color: var(--ls-accent-txt, #1E40AF);
}
.lyr-row--hidden {
  opacity: 0.45;
}
.lyr-row--locked .lyr-row__drag-handle {
  display: none;
}
.lyr-row--rename .lyr-row__name {
  display: none;
}
.lyr-row--rename .lyr-row__rename-input {
  display: block;
}
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

- [ ] **Step 2.3: Add search active state (Screen IR82U)**

Pencil Screen `IR82U` shows a search bar inside the Layers panel header area. Verify `LayersTab.tsx` renders SearchBar when search is active and filters the tree. If not wired:

```tsx
// In LayersTab.tsx — add search state
const [searchQuery, setSearchQuery] = React.useState('');

// Pass to LayersPanel:
<LayersPanel
  composer={composer}
  searchQuery={searchQuery}
  onElementSelect={onElementSelect}
  canvasHoveredId={canvasHoveredId}
/>

// In the panel header area, add search bar:
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search layers..."
  className="lyr-search"
/>
```

- [ ] **Step 2.4: Add multi-select action bar (Screen R4Pf4)**

Pencil Screen `R4Pf4` shows a bottom action bar when multiple layers are selected:

```tsx
// In LayersTab.tsx — add selection action bar
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
/* In layers.css */
.lyr-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--ls-border-light, #E2E8F0);
  background: var(--ls-bg-card, #FFFFFF);
  font-size: 12px;
}
.lyr-action-bar__count {
  color: var(--ls-text-muted, #475569);
  font-weight: 500;
}
.lyr-action-bar__actions {
  display: flex;
  gap: 8px;
}
.lyr-action-bar__delete {
  color: #DC2626;
}
```

- [ ] **Step 2.5: Add selection sync reveal banner (Screen uHSyK)**

Screen `uHSyK` shows a "Selection synced from canvas" banner at top:

```tsx
// In LayersTab.tsx
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

- [ ] **Step 2.6: Write tests**

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

- [ ] **Step 2.7: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/layers/ packages/editor/src/editor/panels/layers/
git commit -m "feat(editor): align Layers tab to pencil screens 9-11"
```

---

## Task 3: Pages Tab — Full Pencil Alignment

**Pencil screens:** `VIyme` (list), `XFv6P` (settings form), `c0ad1` (popover focus), `QHkn0` (creating state), `SnsIA` (success), `GoEJk` (name conflict)

**Files:**
- Modify: `editor/sidebar/tabs/pages/PagesTab.tsx`
- Modify: `editor/sidebar/tabs/pages/PagesTab.css`
- Modify: `editor/sidebar/tabs/pages/components/PageRow.tsx`
- Modify: `editor/sidebar/tabs/pages/components/PageList.tsx`
- Modify: `editor/sidebar/tabs/pages/components/AddPageButton.tsx`
- Test: `editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx`

- [ ] **Step 3.1: Screenshot Pages pencil screens**

```bash
# Use Pencil MCP: read screens VIyme, XFv6P, c0ad1, QHkn0, SnsIA, GoEJk
```

- [ ] **Step 3.2: Verify PageRow states match pencil**

Pencil `VIyme` shows:
- Page row: left icon, page name, right settings gear (visible on hover)
- Context menu: Duplicate + Delete
- Active page: blue left border indicator

```css
/* In PagesTab.css */
.pg-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 36px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  color: var(--ls-text-primary, #0F172A);
  position: relative;
  transition: background 100ms ease;
}
.pg-row:hover {
  background: var(--ls-bg-subtle, #F1F5F9);
}
.pg-row--active {
  background: var(--ls-accent-bg, #DBEAFE);
  color: var(--ls-accent-txt, #1E40AF);
  font-weight: 500;
}
.pg-row--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--ls-accent, #1D4ED8);
  border-radius: 0 2px 2px 0;
}
.pg-row__gear {
  margin-left: auto;
  opacity: 0;
  transition: opacity 100ms ease;
  color: var(--ls-text-muted, #475569);
}
.pg-row:hover .pg-row__gear {
  opacity: 1;
}
```

- [ ] **Step 3.3: Implement Add Page popover (Screens c0ad1, QHkn0)**

Screen `c0ad1` shows an inline popover below the "Add Page" button with options:
- "Blank page"
- "From template" (→ switches to Templates tab)

Screen `QHkn0` shows a "Creating..." loading state inside the row.

```tsx
// In AddPageButton.tsx
export function AddPageButton({ onAddBlank, onFromTemplate }: AddPageButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="pg-add-wrapper">
      <button className="pg-add-btn" onClick={() => setOpen(!open)}>
        + Add Page
      </button>
      {open && (
        <div className="pg-add-popover">
          <button className="pg-add-option" onClick={() => { onAddBlank(); setOpen(false); }}>
            Blank page
          </button>
          <button className="pg-add-option" onClick={() => { onFromTemplate(); setOpen(false); }}>
            From template
          </button>
        </div>
      )}
    </div>
  );
}
```

```css
.pg-add-btn {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--ls-accent, #1D4ED8);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pg-add-popover {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 12px;
  right: 12px;
  background: var(--ls-bg-card, #FFFFFF);
  border: 1px solid var(--ls-border-card, #D1D9E6);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 10;
  overflow: hidden;
}
.pg-add-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ls-text-primary, #0F172A);
}
.pg-add-option:hover {
  background: var(--ls-bg-subtle, #F1F5F9);
}
```

- [ ] **Step 3.4: Implement name conflict error state (Screen GoEJk)**

When a new page name conflicts with an existing page, show inline error:

```tsx
// In PagesTab.tsx / usePages.ts — handle name conflict
const [nameError, setNameError] = React.useState<string | null>(null);

const handleAddPage = async (name: string) => {
  const exists = pages.some(p => p.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    setNameError('A page with this name already exists');
    return;
  }
  setNameError(null);
  await createPage(name);
};

// Render:
{nameError && (
  <div className="pg-name-error">{nameError}</div>
)}
```

```css
.pg-name-error {
  padding: 6px 12px;
  font-size: 12px;
  color: #DC2626;
  background: #FEF2F2;
  border-top: 1px solid #FECACA;
}
```

- [ ] **Step 3.5: Write tests**

```tsx
// editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx
describe('PagesTab', () => {
  it('shows active indicator on current page', () => {
    // render with activePage set
    // verify --active class on correct row
  });

  it('shows name conflict error when adding duplicate page name', () => {
    // render with existing pages
    // attempt to add page with same name
    // verify error message appears
  });

  it('shows popover with Blank/Template options on Add Page click', () => {
    // click Add Page
    // verify both options in popover
  });
});
```

Run: `npx vitest run editor/sidebar/tabs/pages`

- [ ] **Step 3.6: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/
git commit -m "feat(editor): align Pages tab to pencil screens 12-13"
```

---

## Task 4: Components Tab — Full Pencil Alignment

**Pencil screens:** `gIKXw` (list), `E2jan` (detail), `65J2Q` (empty state)

**Files:**
- Modify: `editor/sidebar/tabs/ComponentsTab.tsx`
- Modify: `editor/sidebar/tabs/component-library/ComponentRow.tsx`
- Modify: `editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx`
- Modify: `editor/sidebar/tabs/component-library/styles.ts`
- Test: `editor/sidebar/tabs/component-library/__tests__/ComponentsTab.test.tsx`

- [ ] **Step 4.1: Screenshot Components pencil screens**

```bash
# Use Pencil MCP: read screens gIKXw, E2jan, 65J2Q
```

- [ ] **Step 4.2: Align ComponentRow to pencil list (Screen gIKXw)**

Pencil shows: component name left, usage count badge right (e.g. "6x", "1x"), hover → edit icon.

```css
/* In component-library/styles.ts — update containerStyles */
export const rowStyles = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 36px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 100ms ease;
  font-size: 13px;
  color: var(--ls-text-primary, #0F172A);

  &:hover {
    background: var(--ls-bg-subtle, #F1F5F9);
  }
`;

export const countBadgeStyles = css`
  margin-left: auto;
  padding: 2px 6px;
  background: var(--ls-bg-subtle, #F1F5F9);
  border-radius: 999px;
  font-size: 11px;
  color: var(--ls-text-muted, #475569);
  font-weight: 500;
`;
```

- [ ] **Step 4.3: Verify empty state (Screen 65J2Q)**

Pencil `65J2Q` shows centered empty state: icon + "No components yet" + "Select an element and save it as a component" text + CTA button.

In `ComponentsTab.tsx`, verify empty state renders when `components.length === 0`:

```tsx
// In ComponentsTab.tsx
if (components.length === 0 && !isLoading) {
  return (
    <div className="comp-empty">
      <div className="comp-empty__icon">◇</div>
      <p className="comp-empty__title">No components yet</p>
      <p className="comp-empty__body">Select an element on the canvas and save it as a reusable component.</p>
    </div>
  );
}
```

```css
/* Add to component styles */
.comp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 20px;
  text-align: center;
}
.comp-empty__icon {
  font-size: 32px;
  color: var(--ls-text-ghost, #CBD5E1);
}
.comp-empty__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
  margin: 0;
}
.comp-empty__body {
  font-size: 12px;
  color: var(--ls-text-muted, #475569);
  margin: 0;
  max-width: 200px;
  line-height: 1.5;
}
```

- [ ] **Step 4.4: Write tests**

```tsx
describe('ComponentsTab', () => {
  it('shows empty state when no components exist', () => {
    render(<ComponentsTab composer={mockComposerWithNoComponents} />);
    expect(screen.getByText(/no components yet/i)).toBeInTheDocument();
  });

  it('renders usage count badge per component', () => {
    render(<ComponentsTab composer={mockComposerWithComponents} />);
    expect(screen.getByText('6x')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run editor/sidebar/tabs/component-library`

- [ ] **Step 4.5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/ComponentsTab.tsx packages/editor/src/editor/sidebar/tabs/component-library/
git commit -m "feat(editor): align Components tab to pencil screens 14-16"
```

---

## Task 5: Templates Tab — Full Pencil Alignment

**Pencil screens:** `2ihz1` (root), `foBlu` (filtered), `cV3OT` (card detail), `3pR56` (apply states: confirm, progress, error, success)

**Files:**
- Modify: `editor/sidebar/tabs/templates/TemplatesTab.tsx`
- Modify: `editor/sidebar/tabs/templates/TemplatesTab.css`
- Modify: `editor/sidebar/tabs/templates/components/TemplateCard.tsx`
- Modify: `editor/sidebar/tabs/templates/components/TemplateDetail.tsx`
- Test: `editor/sidebar/tabs/templates/__tests__/TemplatesTab.test.tsx`

- [ ] **Step 5.1: Screenshot all Templates pencil screens**

```bash
# Use Pencil MCP: read screens 2ihz1, foBlu, cV3OT, 3pR56 (all 4 state sub-frames)
```

- [ ] **Step 5.2: Align root view (Screen 2ihz1)**

Pencil shows fullpage layout: left filter sidebar + right template grid.
- Filter sidebar: category pills (All, Hero, Landing, Blog, etc.)
- Grid: 3-column card grid, each card has preview thumbnail + name + "Use" button

Verify `TemplatesTab.tsx` renders this layout. Key CSS:

```css
/* In TemplatesTab.css */
.tmpl-root {
  display: flex;
  height: 100%;
  background: var(--ls-bg-panel, #F8FAFC);
}
.tmpl-filters {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--ls-border-light, #E2E8F0);
  padding: 16px 12px;
  overflow-y: auto;
}
.tmpl-grid-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.tmpl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.tmpl-card {
  border-radius: 10px;
  border: 1px solid var(--ls-border-card, #D1D9E6);
  overflow: hidden;
  background: var(--ls-bg-card, #FFFFFF);
  cursor: pointer;
  transition: box-shadow 150ms ease, border-color 150ms ease;
}
.tmpl-card:hover {
  border-color: var(--ls-accent, #1D4ED8);
  box-shadow: 0 4px 16px rgba(29, 78, 216, 0.12);
}
.tmpl-card__thumb {
  aspect-ratio: 4/3;
  background: var(--ls-bg-subtle, #F1F5F9);
  overflow: hidden;
}
.tmpl-card__body {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tmpl-card__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--ls-text-primary, #0F172A);
}
```

- [ ] **Step 5.3: Implement apply flow states (Screen 3pR56)**

Pencil `3pR56` has 4 sub-states shown as separate frames: Confirm dialog, Progress, Error, Success toast.

In `TemplatesTab.tsx`, add apply state machine:

```tsx
type ApplyState = 'idle' | 'confirm' | 'applying' | 'error' | 'success';
const [applyState, setApplyState] = React.useState<ApplyState>('idle');
const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);

const handleUseTemplate = (id: string) => {
  setSelectedTemplate(id);
  setApplyState('confirm');
};

const handleConfirmApply = async () => {
  setApplyState('applying');
  try {
    await applyTemplate(selectedTemplate!);
    setApplyState('success');
    setTimeout(() => setApplyState('idle'), 2000);
  } catch {
    setApplyState('error');
  }
};

// Render overlay based on state:
{applyState === 'confirm' && (
  <div className="tmpl-overlay">
    <div className="tmpl-dialog">
      <h3>Apply this template?</h3>
      <p>This will replace your current page content.</p>
      <div className="tmpl-dialog__actions">
        <button onClick={() => setApplyState('idle')}>Cancel</button>
        <button onClick={handleConfirmApply} className="tmpl-dialog__confirm">Apply Template</button>
      </div>
    </div>
  </div>
)}
{applyState === 'applying' && (
  <div className="tmpl-overlay">
    <div className="tmpl-progress">
      <div className="tmpl-progress__spinner" />
      <span>Applying template...</span>
    </div>
  </div>
)}
{applyState === 'error' && (
  <div className="tmpl-overlay">
    <div className="tmpl-dialog tmpl-dialog--error">
      <h3>Something went wrong</h3>
      <p>Template could not be applied. Please try again.</p>
      <button onClick={() => setApplyState('idle')}>Dismiss</button>
    </div>
  </div>
)}
```

- [ ] **Step 5.4: Write tests**

```tsx
describe('TemplatesTab', () => {
  it('renders template grid with cards', () => {
    render(<TemplatesTab composer={null} onTemplateUsed={jest.fn()} onClose={jest.fn()} onHelpClick={jest.fn()} />);
    // verify grid renders
  });

  it('shows confirm dialog when Use is clicked', async () => {
    // click Use on a card
    // verify confirm dialog appears
  });

  it('shows error state when apply fails', async () => {
    // mock applyTemplate to throw
    // confirm → applying → error
    // verify error dialog
  });
});
```

Run: `npx vitest run editor/sidebar/tabs/templates`

- [ ] **Step 5.5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/
git commit -m "feat(editor): align Templates tab to pencil screens 4-7"
```

---

## Task 6: History Tab — Full Pencil Alignment

**Pencil screens:** `vpidT`/`n04gR` (activity root), `TA4V8`/`2FPM5` (activity error), `KP3Z7`/`pdRIP` (snapshot rename), `0cU0a`/`pdRIP` (rename duplicate error)

**Files:**
- Modify: `editor/sidebar/tabs/history/HistoryTab.tsx`
- Modify: `editor/sidebar/tabs/history/styles/history.css`
- Modify: `editor/sidebar/tabs/history/components/ActivityView.tsx`
- Modify: `editor/sidebar/tabs/history/components/DiffRow.tsx`
- Test: `editor/sidebar/tabs/history/__tests__/HistoryTab.test.tsx`

- [ ] **Step 6.1: Screenshot all History pencil screens**

```bash
# Use Pencil MCP: read screens n04gR (activity), 2FPM5 (error), pdRIP (snapshot rename), and sub-frames
```

- [ ] **Step 6.2: Align activity view to pencil**

Pencil shows Activity view as a chronological list of edit events, grouped by day:
- Day header: "Today", "Yesterday", "Apr 7"
- Each row: avatar + action text + timestamp

Verify `ActivityView.tsx` groups entries by date:

```tsx
// In ActivityView.tsx
interface ActivityGroup {
  label: string; // "Today", "Yesterday", "Apr 7"
  events: ActivityEvent[];
}

function groupByDate(events: ActivityEvent[]): ActivityGroup[] {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const dateStr = new Date(event.timestamp).toDateString();
    const label = dateStr === today ? 'Today'
      : dateStr === yesterday ? 'Yesterday'
      : new Date(event.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(event);
  }

  return Array.from(groups.entries()).map(([label, events]) => ({ label, events }));
}
```

```css
/* In history.css */
.hist-group-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-subtle, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.hist-event-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
  transition: background 100ms ease;
}
.hist-event-row:hover {
  background: var(--ls-bg-subtle, #F1F5F9);
}
.hist-event-row__text {
  flex: 1;
  color: var(--ls-text-secondary, #334155);
  line-height: 1.4;
}
.hist-event-row__time {
  font-size: 11px;
  color: var(--ls-text-lighter, #94A3B8);
  flex-shrink: 0;
}
```

- [ ] **Step 6.3: Add activity error state (Screen 2FPM5)**

```tsx
// In ActivityView.tsx — add error state
if (error) {
  return (
    <div className="hist-error">
      <span className="hist-error__icon">⚠</span>
      <p>Failed to load activity</p>
      <button onClick={onRetry} className="hist-error__retry">Retry</button>
    </div>
  );
}
```

```css
.hist-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
  text-align: center;
  color: var(--ls-text-muted, #475569);
  font-size: 13px;
}
.hist-error__retry {
  color: var(--ls-accent, #1D4ED8);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
}
```

- [ ] **Step 6.4: Add snapshot rename + duplicate error (Screens KP3Z7, 0cU0a)**

```tsx
// In HistoryTab.tsx — snapshot rename with duplicate detection
const [renameError, setRenameError] = React.useState<string | null>(null);

const handleSnapshotRename = (id: string, newName: string) => {
  const isDuplicate = snapshots.some(s => s.id !== id && s.name === newName);
  if (isDuplicate) {
    setRenameError('A snapshot with this name already exists');
    return;
  }
  setRenameError(null);
  renameSnapshot(id, newName);
};
```

- [ ] **Step 6.5: Write tests**

```tsx
describe('HistoryTab', () => {
  it('groups activity events by date', () => {
    // render with events from today + yesterday
    // verify "Today" and "Yesterday" group headers
  });

  it('shows error state when activity load fails', () => {
    // mock composer to throw on activity load
    // verify error message + retry button
  });

  it('shows duplicate name error on snapshot rename conflict', () => {
    // rename snapshot to existing name
    // verify error message
  });
});
```

Run: `npx vitest run editor/sidebar/tabs/history`

- [ ] **Step 6.6: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/history/
git commit -m "feat(editor): align History tab to pencil screens 33-36"
```

---

## Task 7: Settings Tab — Full Pencil Alignment

**Pencil screens:** `3hXGN` (root), `HxI21` (unsaved changes), `ZqKTV` (save error), `6FT65` (validation + dirty rail dot), `Caq8k` (save success), `uv1ly` (inline edit duplicate error)

**Files:**
- Modify: `editor/sidebar/tabs/settings/SettingsTab.tsx`
- Modify: `editor/sidebar/tabs/settings/styles/`
- Modify: `editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx`
- Test: `editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx`

- [ ] **Step 7.1: Screenshot all Settings pencil screens**

```bash
# Use Pencil MCP: read screens 3hXGN, HxI21, ZqKTV, 6FT65, Caq8k, uv1ly
```

- [ ] **Step 7.2: Verify dirty state rail dot (Screen 6FT65)**

Pencil `6FT65` shows a small red dot on the Settings rail icon when there are unsaved changes. In `LeftSidebar.tsx`, the Settings rail button needs a dirty indicator:

```tsx
// In RailZone / LeftSidebar.tsx — add dirty dot
<button
  key={tab.id}
  className={`ls-btn${isActive ? " ls-btn--active" : ""}`}
  onClick={() => onBtnClick(tab.id)}
>
  {isActive && <div className="ls-btn-bar" />}
  <Icon size={20} />
  {tab.id === 'settings' && settingsDirty && (
    <span className="ls-btn__dirty-dot" aria-label="Unsaved changes" />
  )}
</button>
```

```css
/* In LeftSidebar.css */
.ls-btn__dirty-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #EF4444;
  border-radius: 50%;
  border: 1.5px solid var(--ls-bg-card, #FFFFFF);
}
```

- [ ] **Step 7.3: Add unsaved changes guard (Screen HxI21)**

Settings already has `ConfirmDialog` for tab switch. Verify it matches pencil:
- Title: "Unsaved Changes"
- Message: "You have unsaved settings. Leaving will discard them."
- Primary: "Discard & Leave" (red)
- Secondary: "Keep Editing"

Check `LeftSidebar.tsx` ConfirmDialog props and update if needed.

- [ ] **Step 7.4: Add save error state (Screen ZqKTV)**

In settings screen forms, add save error inline:

```tsx
// In SiteSettingsScreen.tsx — add save error
{saveError && (
  <div className="sett-save-error">
    <span>⚠ Settings could not be saved.</span>
    <button onClick={handleSave}>Try again</button>
  </div>
)}
```

```css
/* In settings styles */
.sett-save-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 6px;
  font-size: 13px;
  color: #DC2626;
  margin-bottom: 16px;
}
.sett-save-error button {
  color: #DC2626;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
}
```

- [ ] **Step 7.5: Write tests**

```tsx
describe('SettingsTab', () => {
  it('shows dirty dot on rail when settings are unsaved', () => {
    // render with settingsDirty=true
    // verify dirty-dot span is visible
  });

  it('shows confirm dialog on tab switch with unsaved changes', () => {
    // set dirty, click different tab
    // verify confirm dialog appears
  });

  it('shows save error strip when save fails', () => {
    // mock save to throw
    // submit form
    // verify error message
  });
});
```

Run: `npx vitest run editor/sidebar/tabs/settings`

- [ ] **Step 7.6: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/settings/
git commit -m "feat(editor): align Settings tab to pencil screens 17-28"
```

---

## Task 8: Global Light Theme — Canvas, Topbar, Inspector

**Goal:** Apply `--ls-*` light tokens to the canvas background, topbar bar, and right inspector panel so the entire editor is light-themed.

**Files:**
- Modify: `editor/rail/LayoutShell.css`
- Modify: `themes/default.css`
- Modify: `editor/inspector/` (inspector panel CSS)
- Test: Visual regression check (run dev server, screenshot)

- [ ] **Step 8.1: Update LayoutShell canvas background**

In `LayoutShell.css`, change canvas area from dark to light:

```css
/* In LayoutShell.css — replace existing canvas styles */
.layout-shell {
  background: var(--ls-bg-panel, #F8FAFC); /* was #0f1115 */
  color: var(--ls-text-primary, #0F172A);  /* was #ffffff */
}

.layout-shell__canvas {
  background: #EEF2F7; /* light canvas viewport bg */
}

/* Update canvas dot pattern for light theme */
.layout-shell__canvas::before {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(0, 0, 0, 0.06) 1px,
    transparent 0
  );
  background-size: 24px 24px;
}

.layout-shell__topbar {
  background: var(--ls-bg-card, #FFFFFF);
  border-bottom: 1px solid var(--ls-border-light, #E2E8F0);
}

.layout-shell__inspector {
  background: var(--ls-bg-panel, #F8FAFC);
  border-left: 1px solid var(--ls-border-light, #E2E8F0);
}
```

- [ ] **Step 8.2: Update aqb-* tokens in default.css to light values**

In `themes/default.css`, update the core tokens that the inspector and other components use:

```css
/* In themes/default.css — replace dark theme values */
:root {
  --aqb-bg-dark: #FFFFFF;         /* was #0c0c14 */
  --aqb-bg-darker: #F8FAFC;       /* was #08080e */
  --aqb-bg-panel: #F8FAFC;        /* was #14141f */
  --aqb-bg-input: #FFFFFF;        /* was rgba(255,255,255,0.06) */
  --aqb-border: #E2E8F0;          /* was rgba(255,255,255,0.08) */
  --aqb-text-primary: #0F172A;    /* was #ffffff */
  --aqb-text-secondary: #334155;  /* was rgba(255,255,255,0.7) */
  --aqb-text-muted: #64748B;      /* was rgba(255,255,255,0.4) */
}
```

- [ ] **Step 8.3: Run dev server and visual check**

```bash
cd packages/editor && npm run dev
# Open http://localhost:5050
# Verify:
# [ ] Canvas viewport is light gray
# [ ] Topbar is white with subtle border
# [ ] Inspector panel is light
# [ ] Rail and all tabs match pencil screenshots
```

- [ ] **Step 8.4: Fix any token leaks**

Search for any hardcoded dark hex values that didn't pick up the new tokens:

```bash
grep -r '#0f1115\|#14141f\|#08080e\|#0c0c14' packages/editor/src --include="*.css" --include="*.ts" --include="*.tsx"
```

Replace any found values with the appropriate `--ls-*` or `--aqb-*` token.

- [ ] **Step 8.5: Commit**

```bash
git add packages/editor/src/editor/rail/LayoutShell.css packages/editor/src/themes/default.css packages/editor/src/editor/inspector/
git commit -m "feat(editor): apply global light theme to canvas, topbar, inspector"
```

---

## Task 9: Final Audit & Pixel-Perfect Pass

**Goal:** Run all tabs side-by-side with pencil screenshots and fix remaining visual gaps.

**Files:** Any file that has a visual mismatch.

- [ ] **Step 9.1: Take screenshot of each tab in dev browser**

```bash
# Run dev server: npm run dev (port 5050)
# For each tab: screenshot current state
# Compare to: packages/editor/dontTouch/queue/ reference screenshots
```

- [ ] **Step 9.2: Diff against pencil reference screenshots**

Reference screenshots are in:
```
packages/editor/dontTouch/queue/L1-build-tab.png      # Add ✓
packages/editor/dontTouch/queue/L2-templates-tab.png  # Templates
packages/editor/dontTouch/queue/L3-layers-tab.png     # Layers
packages/editor/dontTouch/queue/L4-pages-tab.png      # Pages
packages/editor/dontTouch/queue/L5-components-tab.png # Components
packages/editor/dontTouch/queue/L6-media-tab.png      # Media
packages/editor/dontTouch/queue/L7-design-system-tab.png # Design
packages/editor/dontTouch/queue/L8-settings-tab.png   # Settings
packages/editor/dontTouch/queue/L9-publish-tab.png    # Publish
packages/editor/dontTouch/queue/L10-history-tab.png   # History
```

- [ ] **Step 9.3: Fix any remaining gaps**

For each visual gap found: identify which CSS token or JSX element is wrong, patch it, verify visually.

- [ ] **Step 9.4: Run full test suite**

```bash
npx vitest run
```

Expected: All 76+ tests pass. Fix any regressions before proceeding.

- [ ] **Step 9.5: Final commit**

```bash
git add packages/editor/src/
git commit -m "feat(editor): final pixel-perfect pass — left sidebar complete redesign"
```

---

## Execution Order

```
Task 1 (Media) → Task 2 (Layers) → Task 3 (Pages) → Task 4 (Components)
     → Task 5 (Templates) → Task 6 (History) → Task 7 (Settings)
     → Task 8 (Global Light Theme) → Task 9 (Final Audit)
```

Each task produces a working, testable, committed state. Do not begin Task N+1 until Task N's tests pass and commit is made.
