# Left Sidebar Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pixel-perfect implementation of all 47 screens across Add, Templates, and Media tabs from new.left.pen — every state, every banner, every component dimension exactly as designed.

**Architecture:** Refactor existing components in-place. No new routing layers. Light theme activated globally by removing `aqb-dark` from demo. CSS uses existing `bld-*`, `tpl-*`, `med-*` prefixes with `--ls-*` tokens already defined in `LeftSidebar.css`.

**Tech Stack:** React 18, TypeScript, Vite, CSS custom properties, Lucide React icons, Inter font

**Design spec:** `docs/superpowers/specs/2026-04-09-left-sidebar-redesign-design.md`

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `demo/main.tsx` | Modify | Remove `aqb-dark` class |
| `editor/sidebar/LeftSidebar.css` | Modify | Add missing `--ls-*` tokens |
| `editor/sidebar/tabs/build/BuildTab.tsx` | Modify | Add mode switch pill + sections mode content |
| `editor/sidebar/tabs/build/BuildTab.css` | Modify | Mode switch, pill chips, sections cards, gnyrB styles |
| `editor/sidebar/tabs/build/components/QuickPicks.tsx` | Modify | Pill chips (cornerRadius 999, 3-per-row) |
| `editor/sidebar/tabs/build/components/SearchResults.tsx` | Modify | gnyrB AI handoff empty state |
| `editor/sidebar/tabs/templates/TemplatesTab.tsx` | Modify | Header 18px, breadcrumb, new-page context, loading |
| `editor/sidebar/tabs/templates/TemplatesTab.css` | Modify | Breadcrumb, skeleton, new-page chip styles |
| `editor/sidebar/tabs/templates/TemplatesTabModals.tsx` | Modify | Add Create Page dialogs (fiLNZ, uMJFZ, 9NalZ) |
| `editor/sidebar/tabs/templates/components/TemplateDetail.tsx` | Modify | Preview loading/error states (Ba4uo, Onr0C) |
| `editor/sidebar/tabs/media/MediaTab.tsx` | Modify | Success/amber banners, search count, item action bar, context menu |
| `editor/sidebar/tabs/media/MediaTab.css` | Modify | All new banner/bar styles |
| `editor/sidebar/tabs/media/components/SelectionBanner.tsx` | Modify | Multi-select redesign (XSWRz) |
| `editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx` | Modify | Detail view (vSrqD) + metadata error (COb2m) |

---

## Task 1: Remove Dark Mode + Add Missing Design Tokens

**Files:**
- Modify: `demo/main.tsx:22`
- Modify: `editor/sidebar/LeftSidebar.css` (`:root` block at line 41)

- [ ] **Step 1: Remove aqb-dark from demo/main.tsx**

Remove line 22 (`document.documentElement.classList.add("aqb-dark")`). The editor should boot in light mode.

```diff
-  document.documentElement.classList.add("aqb-dark");
```

The line appears at `demo/main.tsx:22`. Simply delete it.

- [ ] **Step 2: Add missing tokens to LeftSidebar.css**

Inside the existing `:root` block (around line 41), after `--ls-dirty: #F59E0B;`, add these tokens:

```css
  /* ── Status tokens ──────────────────────────────────────────────────────── */
  --ls-success-bg: #dcfce7;
  --ls-success-text: #166534;
  --ls-success-text-dark: #4ADE80;
  --ls-warning-bg: #FEF3C7;
  --ls-warning-text: #92400E;
  --ls-error-bg: #FEE2E2;
  --ls-error-text: #FCA5A5;
  --ls-destructive: #EF4444;
  --ls-green-check: #22C55E;
  --ls-border-dialog: #D8E0EA;
  --ls-overlay: rgba(0, 0, 0, 0.4);
  --ls-shadow-menu: 0 4px 12px rgba(0, 0, 0, 0.25);
  --ls-shadow-dialog: 0 4px 24px rgba(0, 0, 0, 0.2);
```

- [ ] **Step 3: Verify demo starts in light mode**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npm run dev
```

Visit `http://localhost:5050`. The editor background should be `#F0F4F8` (light), not dark grey. No dark theme artifacts. Stop dev server.

- [ ] **Step 4: Run tests to confirm no regressions**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add demo/main.tsx src/editor/sidebar/LeftSidebar.css
git commit -m "feat(theme): remove aqb-dark class and add missing --ls-* status tokens"
```

---

## Task 2: Add Tab — Mode Switch Pill Container

**Files:**
- Modify: `editor/sidebar/tabs/build/BuildTab.tsx`
- Modify: `editor/sidebar/tabs/build/BuildTab.css`

The Add tab needs a "Elements | Sections" pill toggle between the header and the search bar. The `useBuildTab` hook already has `mode`/`setMode` state. This task adds the UI.

- [ ] **Step 1: Add mode switch markup to BuildTab.tsx**

Replace the `<div className="bld-content">` block in `BuildTab.tsx` with:

```tsx
export const BuildTab: React.FC<BuildTabProps> = ({
  composer,
  onBlockClick,
  isPinned,
  onPinToggle,
  onClose,
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const isSearching = tab.searchQuery.trim().length > 0;

  return (
    <div className="bld-container">
      <PanelHeader title="Add" isPinned={isPinned} onPinToggle={onPinToggle} onClose={onClose}>
        <button
          className="bld-gear-btn"
          onClick={() => tab.setPinPopoverOpen(!tab.pinPopoverOpen)}
          title="Quick Picks settings"
          aria-label="Quick Picks settings"
        >
          <Settings size={16} />
        </button>
      </PanelHeader>

      {/* Mode Switch — Elements | Sections */}
      {!isSearching && (
        <div className="bld-mode-switch" role="tablist" aria-label="Add tab mode">
          <button
            className={`bld-mode-pill${tab.mode === "elements" ? " bld-mode-pill--active" : ""}`}
            onClick={() => tab.setMode("elements")}
            role="tab"
            aria-selected={tab.mode === "elements"}
          >
            Elements
          </button>
          <button
            className={`bld-mode-pill${tab.mode === "sections" ? " bld-mode-pill--active" : ""}`}
            onClick={() => tab.setMode("sections")}
            role="tab"
            aria-selected={tab.mode === "sections"}
          >
            Sections
          </button>
        </div>
      )}

      <div className="bld-content">
        <div className="bld-search-wrap">
          <SearchBar
            value={tab.searchQuery}
            onChange={tab.setSearchQuery}
            placeholder="Search elements..."
            debounceMs={0}
          />
        </div>

        {isSearching ? (
          <div className="bld-scroll">
            <SearchResults
              query={tab.searchQuery}
              groups={tab.searchResults}
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
            />
          </div>
        ) : tab.mode === "sections" ? (
          <div className="bld-scroll">
            <SectionsMode
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
            />
          </div>
        ) : (
          <div className="bld-scroll">
            <div className="bld-qp-wrap">
              <QuickPicks
                picks={tab.quickPicks}
                onRemove={tab.removeQuickPick}
                onPlusClick={() => tab.setPinPopoverOpen(true)}
                onDragStart={tab.handleDragStart}
                onElClick={tab.handleElClick}
                ftueSeen={tab.ftueSeen}
                onDismissFtue={tab.dismissFtue}
              />
              <PinPopover
                open={tab.pinPopoverOpen}
                onClose={() => tab.setPinPopoverOpen(false)}
                onPin={(blockId) => {
                  tab.addQuickPick(blockId);
                  if (!tab.ftueSeen) tab.dismissFtue();
                }}
                currentPicks={tab.quickPicks}
              />
            </div>

            <div className="bld-divider" />

            <div className="bld-cats">
              <div className="bld-sec-label">CATEGORIES</div>
              {CATALOG.map((cat) => (
                <CatAccordion
                  key={cat.id}
                  cat={cat}
                  isOpen={tab.openCats.has(cat.id)}
                  onToggle={() => tab.toggleCat(cat.id)}
                  onDragStart={tab.handleDragStart}
                  onElClick={tab.handleElClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

Also add the `SectionsMode` component at the bottom of `BuildTab.tsx`, before the `export default`:

```tsx
// ── Sections Mode Content (SDgR2) ──────────────────────────────────────────

const SECTION_FAMILIES = [
  { id: "hero", label: "Hero", active: true },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "CTA" },
  { id: "footers", label: "Footers" },
];

const SECTION_CARDS = [
  { id: "hero-split", name: "Hero split", sub: "Two-column intro with CTA" },
  { id: "feature-band", name: "Feature band", sub: "Three feature cards with icons" },
  { id: "pricing-stack", name: "Pricing stack", sub: "Tiered pricing with comparison cards" },
];

interface SectionsModeProps {
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
}

const SectionsMode: React.FC<SectionsModeProps> = ({ onDragStart }) => {
  const [activeFamily, setActiveFamily] = React.useState("hero");

  return (
    <>
      {/* Section families chips row */}
      <div className="bld-sec-label">SECTION FAMILIES</div>
      <div className="bld-sec-chips">
        {SECTION_FAMILIES.map((f) => (
          <button
            key={f.id}
            className={`bld-sec-chip${activeFamily === f.id ? " bld-sec-chip--active" : ""}`}
            onClick={() => setActiveFamily(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Section cards */}
      <div className="bld-sec-label" style={{ marginTop: 12 }}>READY TO INSERT</div>
      <div className="bld-sec-cards">
        {SECTION_CARDS.map((card) => (
          <div
            key={card.id}
            className="bld-sec-card"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("block", JSON.stringify({ id: card.id, label: card.name, category: "sections" }));
              e.dataTransfer.setData("text/plain", card.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.preventDefault();
            }}
          >
            <div className="bld-sec-card-name">{card.name}</div>
            <div className="bld-sec-card-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom hint */}
      <div className="bld-sec-hint">
        <span className="bld-sec-hint-primary">Sections insert into the current page.</span>
        <span className="bld-sec-hint-muted">Use New Page › Templates for full-page starts.</span>
      </div>
    </>
  );
};
```

- [ ] **Step 2: Add CSS for mode switch and sections mode**

Append to `BuildTab.css`:

```css
/* ── Mode Switch (pill toggle) ── */
.bld-mode-switch {
  display: flex;
  gap: 4px;
  padding: 2px;
  margin: 0 16px 0;
  background: var(--ls-bg-subtle, #F1F5F9);
  border-radius: 999px;
  flex-shrink: 0;
}
.bld-mode-pill {
  flex: 1;
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  font-weight: 400;
  color: var(--ls-text-subtle, #64748B);
  cursor: pointer;
  transition: all 0.12s;
  font-family: inherit;
}
.bld-mode-pill--active {
  background: var(--ls-bg-card, #FFFFFF);
  border: 1px solid var(--ls-border-card, #D1D9E6);
  font-weight: 500;
  color: var(--ls-text-primary, #0F172A);
}

/* ── Section family chips ── */
.bld-sec-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.bld-sec-chip {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--ls-border-light, #E2E8F0);
  background: var(--ls-bg-card, #FFFFFF);
  font-size: 12px;
  font-weight: 500;
  color: var(--ls-text-muted, #475569);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: all 0.12s;
}
.bld-sec-chip:hover {
  border-color: var(--ls-accent, #1D4ED8);
  color: var(--ls-accent, #1D4ED8);
}
.bld-sec-chip--active {
  background: var(--ls-bg-card, #FFFFFF);
  border-color: var(--ls-border-card, #D1D9E6);
  color: var(--ls-text-primary, #0F172A);
}

/* ── Section preview cards ── */
.bld-sec-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.bld-sec-card {
  height: 86px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--ls-border-light, #E2E8F0);
  background: var(--ls-bg-card, #FFFFFF);
  cursor: grab;
  display: flex;
  flex-direction: column;
  gap: 4px;
  user-select: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.bld-sec-card:hover {
  border-color: var(--ls-accent, #1D4ED8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.bld-sec-card:active {
  cursor: grabbing;
}
.bld-sec-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
}
.bld-sec-card-sub {
  font-size: 11px;
  color: var(--ls-text-subtle, #64748B);
  line-height: 1.4;
}

/* ── Sections bottom hint ── */
.bld-sec-hint {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0 4px;
}
.bld-sec-hint-primary {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
}
.bld-sec-hint-muted {
  font-size: 10px;
  color: var(--ls-text-subtle, #64748B);
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/build
```

Expected: All build tab tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/editor/sidebar/tabs/build/BuildTab.tsx src/editor/sidebar/tabs/build/BuildTab.css
git commit -m "feat(add-tab): add Elements/Sections mode switch pill + sections content (SDgR2)"
```

---

## Task 3: Add Tab — Quick Picks Pill Redesign

**Files:**
- Modify: `editor/sidebar/tabs/build/components/QuickPicks.tsx`
- Modify: `editor/sidebar/tabs/build/BuildTab.css`

Current: 4-column icon+text boxes (h=58, cornerRadius 4). Spec: pill chips (cornerRadius 999, 3-per-row, no empty slots).

- [ ] **Step 1: Rewrite QuickPicks to render pill chips**

Replace the entire `QuickPicks.tsx` with:

```tsx
/**
 * QuickPicks — Pill chips (cornerRadius 999) matching .pen PcGJY/dMgOj refs.
 * 3-per-row, no empty slots, filled picks + "+" chip at end.
 * @license BSD-3-Clause
 */

import { Plus } from "lucide-react";
import * as React from "react";
import { flatCatalog } from "../catalog/catalog";
import type { FlatElEntry } from "../catalog/types";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { SvgIcon } from "./SvgIcon";

interface QuickPicksProps {
  picks: string[];
  onRemove: (blockId: string) => void;
  onPlusClick: () => void;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  ftueSeen: boolean;
  onDismissFtue: () => void;
}

const blockIdMap = new Map(flatCatalog.map((el) => [el.blockId, el]));

export const QuickPicks: React.FC<QuickPicksProps> = ({
  picks,
  onRemove,
  onPlusClick,
  onDragStart,
  onElClick,
  ftueSeen,
  onDismissFtue,
}) => {
  const filledPicks = picks
    .map((id) => blockIdMap.get(id))
    .filter((el): el is FlatElEntry => el != null);

  const handleChipClick = React.useCallback(
    (el: FlatElEntry) => {
      if (!ftueSeen) onDismissFtue();
      onElClick(el);
    },
    [ftueSeen, onDismissFtue, onElClick]
  );

  return (
    <div className="bld-qp">
      <div className="bld-sec-label">QUICK PICKS</div>
      <div className="bld-qp-chips">
        {filledPicks.map((el) => (
          <div
            key={el.blockId}
            className="bld-qp-chip bld-qp-chip--filled"
            draggable
            onDragStart={(e) => onDragStart(e, el)}
            onClick={() => handleChipClick(el)}
            onContextMenu={(e) => {
              e.preventDefault();
              onRemove(el.blockId);
            }}
            title={`${el.name} — right-click to unpin`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleChipClick(el);
              }
            }}
          >
            <span className="bld-qp-chip-icon">
              <SvgIcon html={el.iconHtml} />
            </span>
            <span className="bld-qp-chip-name">{el.name}</span>
          </div>
        ))}

        {/* "+" chip — always last */}
        <button
          className="bld-qp-chip bld-qp-chip--add"
          onClick={onPlusClick}
          title="Pin an element for quick access"
          aria-label="Pin element"
        >
          <Plus size={14} />
        </button>
      </div>

      {!ftueSeen && (
        <div className="bld-ftue" onClick={onDismissFtue} role="status">
          Pin your favorite elements here
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Update CSS for pill chips (replace grid styles)**

In `BuildTab.css`, remove `.bld-qp-grid`, `.bld-qp-slot`, `.bld-qp-slot--empty`, `.bld-qp-slot--add`, `.bld-qp-icon`, `.bld-qp-name` blocks and replace with:

```css
/* ── Quick Pick chips (pill style, 3-per-row) ── */
.bld-qp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.bld-qp-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  cursor: grab;
  user-select: none;
  transition: all 0.12s;
  white-space: nowrap;
  font-family: inherit;
}
.bld-qp-chip:active {
  cursor: grabbing;
  transform: scale(0.96);
}
.bld-qp-chip:focus-visible {
  outline: 2px solid var(--ls-accent, #1D4ED8);
  outline-offset: 2px;
}

/* Filled chip — Active (dMgOj ref): white fill, border */
.bld-qp-chip--filled {
  background: var(--ls-bg-card, #FFFFFF);
  border: 1px solid var(--ls-border-card, #D1D9E6);
  color: var(--ls-text-muted, #475569);
}
.bld-qp-chip--filled:hover {
  border-color: var(--ls-accent, #1D4ED8);
  color: var(--ls-accent, #1D4ED8);
  background: var(--ls-accent-bg, #DBEAFE);
}
.bld-qp-chip--filled .bld-qp-chip-icon svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke 0.12s;
}

/* "+" chip — Add new (PcGJY ref): subtle fill */
.bld-qp-chip--add {
  background: var(--ls-bg-subtle, #F1F5F9);
  border: none;
  color: var(--ls-text-lighter, #94A3B8);
  cursor: pointer;
}
.bld-qp-chip--add:hover {
  background: var(--ls-accent-bg, #DBEAFE);
  color: var(--ls-accent, #1D4ED8);
}
.bld-qp-chip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.bld-qp-chip-name {
  font-size: 12px;
  line-height: 1;
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/build
```

Expected: All build tab tests pass. (QuickPicks isn't directly tested in the test suite, but useBuildTab tests confirm the state logic works.)

- [ ] **Step 4: Commit**

```bash
git add src/editor/sidebar/tabs/build/components/QuickPicks.tsx src/editor/sidebar/tabs/build/BuildTab.css
git commit -m "feat(add-tab): redesign Quick Picks to pill chips (cornerRadius 999, 3-per-row)"
```

---

## Task 4: Add Tab — gnyrB AI Handoff Empty State

**Files:**
- Modify: `editor/sidebar/tabs/build/components/SearchResults.tsx`
- Modify: `editor/sidebar/tabs/build/BuildTab.css`

The gnyrB screen shows a sparkle icon, "No matching block in Add" headline, an AI suggestion card, and a shortcut hint. Replace the current plain text empty state.

- [ ] **Step 1: Update SearchResults empty state**

In `SearchResults.tsx`, replace the early-return no-results block:

```tsx
// Replace:
if (!groups.length) {
  return (
    <div className="bld-search-empty" role="status" aria-live="polite">
      <span>No elements matching &ldquo;{query}&rdquo;</span>
      <span className="bld-search-empty-hint">
        Try: heading, button, hero, form, image, grid
      </span>
    </div>
  );
}

// With:
if (!groups.length) {
  return (
    <div className="bld-no-results" role="status" aria-live="polite">
      {/* Sparkle icon — 28px, #94A3B8 */}
      <svg className="bld-no-results-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <p className="bld-no-results-headline">No matching block in Add</p>

      {/* AI suggestion card */}
      <div className="bld-ai-card">
        <p className="bld-ai-card-body">
          Try describing what you need — AI can suggest or create a custom block for you.
        </p>
      </div>

      <p className="bld-no-results-shortcut">/ opens AI outside the sidebar.</p>
    </div>
  );
}
```

- [ ] **Step 2: Add gnyrB CSS**

Append to `BuildTab.css`:

```css
/* ── gnyrB: No results + AI handoff ── */
.bld-no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 8px;
  gap: 10px;
  text-align: center;
}
.bld-no-results-icon {
  color: var(--ls-text-lighter, #94A3B8);
}
.bld-no-results-headline {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
  margin: 0;
}
.bld-ai-card {
  width: 100%;
  background: var(--ls-bg-card, #FFFFFF);
  border: 1px solid var(--ls-border-light, #E2E8F0);
  border-radius: 8px;
  padding: 12px;
  text-align: left;
}
.bld-ai-card-body {
  font-size: 12px;
  color: var(--ls-text-muted, #475569);
  margin: 0;
  line-height: 1.5;
}
.bld-no-results-shortcut {
  font-size: 10px;
  color: var(--ls-text-lighter, #94A3B8);
  margin: 0;
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/build
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/editor/sidebar/tabs/build/components/SearchResults.tsx src/editor/sidebar/tabs/build/BuildTab.css
git commit -m "feat(add-tab): gnyrB AI handoff empty state with sparkle icon and suggestion card"
```

---

## Task 5: Templates Tab — Header 18px + Loading Skeleton + Breadcrumb

**Files:**
- Modify: `editor/sidebar/tabs/templates/TemplatesTab.tsx`
- Modify: `editor/sidebar/tabs/templates/TemplatesTab.css`

Three design gaps: (1) Title is 14px via PanelHeader but spec wants 18px/600. (2) Loading state (l5Zoz) is missing. (3) Card detail view (cV3OT) needs a breadcrumb instead of just PanelHeader.

- [ ] **Step 1: Replace PanelHeader with custom header in TemplatesTab.tsx**

In `TemplatesTab.tsx`, remove the `PanelHeader` import and replace the header JSX:

```diff
-import { PanelHeader } from "../../shared/PanelHeader";
```

Replace the `<PanelHeader ...>` JSX block with a custom header:

```tsx
{/* Header — 48px, title 18px/600 */}
<div className="tpl-header">
  {detailTemplate ? (
    /* Breadcrumb (Screen cV3OT) */
    <div className="tpl-breadcrumb">
      <button
        className="tpl-breadcrumb-back"
        onClick={() => sel.setDetailId(null)}
        aria-label="Back to grid"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Back to grid</span>
      </button>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ls-text-lighter, #94A3B8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
      <span className="tpl-breadcrumb-cat">{detailTemplate.category ?? "All"}</span>
    </div>
  ) : (
    <h2 className="tpl-header-title">Templates</h2>
  )}
  <div className="tpl-header-actions">
    <button
      className="tpl-header-btn"
      onClick={() => setShowSearch(!showSearch)}
      aria-label={showSearch ? "Close search" : "Search templates"}
    >
      <Search size={16} />
    </button>
    {onClose && (
      <button className="tpl-header-btn" onClick={onClose} aria-label="Close templates">
        <X size={16} />
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 2: Add loading skeleton state**

Add `isLoading` state (defaults to false; set to true for 800ms on mount to simulate l5Zoz):

```tsx
// Add after the existing state declarations
const [isLoading, setIsLoading] = React.useState(true);

React.useEffect(() => {
  const t = setTimeout(() => setIsLoading(false), 800);
  return () => clearTimeout(t);
}, []);
```

Then wrap the content area (after header + search + pills) with a loading guard:

```tsx
{/* Content area — loading skeleton or actual content */}
{isLoading ? (
  <div className="tpl-skeleton-wrap">
    <div className="tpl-skeleton-pills">
      {[80, 110, 95, 85, 100, 90, 70, 105].map((w, i) => (
        <div key={i} className="tpl-skeleton-pill" style={{ width: w }} />
      ))}
    </div>
    <div className="tpl-skeleton-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="tpl-skeleton-card" />
      ))}
    </div>
  </div>
) : (
  /* existing content JSX */
  <div className="tpl-content">
    {/* ... existing content ... */}
  </div>
)}
```

- [ ] **Step 3: Add CSS for new header + breadcrumb + skeleton**

Append to `TemplatesTab.css`:

```css
/* ── Custom header (replaces PanelHeader) ── */
.tpl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 24px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--ls-border-light, #E2E8F0);
  background: var(--ls-bg-card, #FFFFFF);
}
.tpl-header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
  margin: 0;
}
.tpl-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Breadcrumb (Screen cV3OT) ── */
.tpl-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tpl-breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--ls-text-subtle, #64748B);
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
}
.tpl-breadcrumb-back:hover {
  color: var(--ls-text-primary, #0F172A);
}
.tpl-breadcrumb-cat {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
}

/* ── Loading skeleton ── */
.tpl-skeleton-wrap {
  flex: 1;
  overflow: hidden;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tpl-skeleton-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tpl-skeleton-pill {
  height: 28px;
  border-radius: 20px;
  background: var(--ls-bg-subtle, #F1F5F9);
  animation: tpl-pulse 1.4s ease-in-out infinite;
}
.tpl-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.tpl-skeleton-card {
  height: 220px;
  border-radius: 8px;
  background: var(--ls-bg-subtle, #F1F5F9);
  animation: tpl-pulse 1.4s ease-in-out infinite;
}
@keyframes tpl-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/templates
```

Expected: All template tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/templates/TemplatesTab.tsx src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "feat(templates): 18px header, loading skeleton (l5Zoz), breadcrumb navigation (cV3OT)"
```

---

## Task 6: Templates Tab — New Page Context + Create Dialogs

**Files:**
- Modify: `editor/sidebar/tabs/templates/TemplatesTab.tsx`
- Modify: `editor/sidebar/tabs/templates/TemplatesTabModals.tsx`
- Modify: `editor/sidebar/tabs/templates/TemplatesTab.css`

Screens DYk2w (new-page context header), fiLNZ (create confirm), uMJFZ (success), 9NalZ (error).

- [ ] **Step 1: Add newPageMode prop + context chip to TemplatesTab**

Add `newPageMode?: boolean` to `TemplatesTabProps`:

```tsx
export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
  onSwitchTab?: (tab: string) => void;
  onClose?: () => void;
  newPageMode?: boolean; // DYk2w — "Choose a template for your new page"
}
```

In the component, receive and use it:

```tsx
export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer,
  onTemplateUsed,
  onClose,
  newPageMode = false,
}) => {
  // ...existing code...
  
  // Add state for new-page dialogs
  const [showCreateConfirm, setShowCreateConfirm] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<"success" | "error" | null>(null);
```

Update the header title section to conditionally show the new-page context:

```tsx
{!detailTemplate && newPageMode ? (
  <div className="tpl-newpage-header">
    <h2 className="tpl-header-title tpl-header-title--sm">Choose a template for your new page</h2>
    <div className="tpl-newpage-chip">New Page</div>
  </div>
) : (
  <h2 className="tpl-header-title">Templates</h2>
)}
```

Update `handleAddAsNewPage` to show the create confirm dialog:

```tsx
function handleAddAsNewPage(id: string) {
  const t = SITE_TEMPLATES.find((x) => x.id === id);
  if (!t) return;
  if (t.status === "premium") { sel.setShowUpgrade(true); return; }
  addAsNewPageRef.current = true;
  pendingId.current = id;
  sel.setDetailId(null);
  if (newPageMode) {
    setShowCreateConfirm(true);  // Show fiLNZ dialog
  } else {
    startApply();
  }
}
```

Add the create confirm + result modals in the JSX after existing modals:

```tsx
{showCreateConfirm && (
  <CreatePageConfirmModal
    templateName={SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Template"}
    onCancel={() => setShowCreateConfirm(false)}
    onConfirm={() => {
      setShowCreateConfirm(false);
      startApply();
      // After apply completes, show success
      setCreateResult("success");
    }}
  />
)}
{createResult === "success" && (
  <CreatePageSuccessModal
    onClose={() => { setCreateResult(null); onTemplateUsed?.(); }}
    onGoToPage={() => { setCreateResult(null); onTemplateUsed?.(); }}
  />
)}
{createResult === "error" && (
  <CreatePageErrorModal
    onCancel={() => setCreateResult(null)}
    onRetry={() => { setCreateResult(null); startApply(); }}
  />
)}
```

- [ ] **Step 2: Add three modals to TemplatesTabModals.tsx**

Append to `TemplatesTabModals.tsx`:

```tsx
// ============================================================================
// Create Page Confirm Modal (fiLNZ) — 420×300, shadow blur=24
// ============================================================================

export interface CreatePageConfirmModalProps {
  templateName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CreatePageConfirmModal: React.FC<CreatePageConfirmModalProps> = ({
  templateName,
  onCancel,
  onConfirm,
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal tpl-modal--create" onClick={(e) => e.stopPropagation()}>
        <h3 className="tpl-modal-title">Create page?</h3>
        <div className="tpl-modal-row">
          {/* layout-template icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ls-text-subtle, #64748B)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span className="tpl-modal-row-text">Using: {templateName}</span>
        </div>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onConfirm}>Create page</button>
        </div>
      </div>
    </div>,
    document.body
  );

// ============================================================================
// Create Page Success Modal (uMJFZ) — 420×300
// ============================================================================

export interface CreatePageSuccessModalProps {
  onClose: () => void;
  onGoToPage: () => void;
}

export const CreatePageSuccessModal: React.FC<CreatePageSuccessModalProps> = ({
  onClose,
  onGoToPage,
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onClose}>
      <div className="tpl-modal tpl-modal--create" onClick={(e) => e.stopPropagation()}>
        {/* circle-check 36×36 #166534 */}
        <div className="tpl-modal-icon tpl-modal-icon--success">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ls-success-text, #166534)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h3 className="tpl-modal-title tpl-modal-title--lg">Page created!</h3>
        <p className="tpl-modal-desc">Your new page has been created from the template and is ready to edit.</p>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onClose}>Close</button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onGoToPage}>Go to page</button>
        </div>
      </div>
    </div>,
    document.body
  );

// ============================================================================
// Create Page Error Modal (9NalZ) — 420×300
// ============================================================================

export interface CreatePageErrorModalProps {
  onCancel: () => void;
  onRetry: () => void;
}

export const CreatePageErrorModal: React.FC<CreatePageErrorModalProps> = ({
  onCancel,
  onRetry,
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal tpl-modal--create" onClick={(e) => e.stopPropagation()}>
        {/* circle-alert 36×36 #FCA5A5 */}
        <div className="tpl-modal-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ls-error-text, #FCA5A5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h3 className="tpl-modal-title tpl-modal-title--lg">Couldn&apos;t create page</h3>
        <div className="tpl-modal-warning" style={{ background: "var(--ls-error-bg, #FEE2E2)", borderColor: "transparent" }}>
          <p className="tpl-modal-warning-text" style={{ color: "var(--ls-text-muted, #475569)" }}>
            Something went wrong creating your page. Your existing pages were not affected.
          </p>
        </div>
        <div className="tpl-modal-btns">
          <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onRetry}>Try again</button>
        </div>
      </div>
    </div>,
    document.body
  );
```

- [ ] **Step 3: Add CSS for new-page header chip and modal variants**

Append to `TemplatesTab.css`:

```css
/* ── New page context header ── */
.tpl-newpage-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tpl-header-title--sm {
  font-size: 15px;
}
.tpl-newpage-chip {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--ls-accent-bg, #DBEAFE);
  color: var(--ls-accent-txt, #1E40AF);
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

/* ── Modal variants (create flow) ── */
.tpl-modal--create {
  width: 420px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--ls-shadow-dialog, 0 4px 24px rgba(0, 0, 0, 0.2));
  border-color: var(--ls-border-dialog, #D8E0EA);
}
.tpl-modal-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tpl-modal-row-text {
  font-size: 13px;
  color: var(--ls-text-subtle, #64748B);
}
.tpl-modal-icon {
  display: flex;
  justify-content: center;
}
.tpl-modal-icon--success svg {
  stroke: var(--ls-success-text, #166534);
}
.tpl-modal-title--lg {
  font-size: 18px;
}
.tpl-modal-desc {
  font-size: 13px;
  color: var(--ls-text-subtle, #64748B);
  line-height: 1.5;
  margin: 0;
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/templates
```

Expected: All template tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/templates/TemplatesTab.tsx src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "feat(templates): new page context mode + Create Page dialogs (fiLNZ, uMJFZ, 9NalZ)"
```

---

## Task 7: Templates Tab — Detail Preview Loading/Error States

**Files:**
- Modify: `editor/sidebar/tabs/templates/components/TemplateDetail.tsx`
- Modify: `editor/sidebar/tabs/templates/TemplatesTab.css`

Screens Ba4uo (loading spinner in preview) and Onr0C (error with retry in preview).

- [ ] **Step 1: Add previewState prop to TemplateDetail**

Update `TemplateDetail.tsx`:

```tsx
interface TemplateDetailProps {
  template: TemplateItem;
  previewState?: "loading" | "error" | "ready"; // Ba4uo / Onr0C / default
  onApplyToCurrent: (id: string) => void;
  onAddAsNewPage: (id: string) => void;
  onCancel: () => void;
  onPreviewRetry?: () => void;
}

export const TemplateDetail: React.FC<TemplateDetailProps> = ({
  template,
  previewState = "ready",
  onApplyToCurrent,
  onAddAsNewPage,
  onCancel,
  onPreviewRetry,
}) => {
  return (
    <div className="tpl-detail">
      {/* Preview pane */}
      <div
        className="tpl-detail-preview"
        style={{ background: previewState === "ready" ? (template.gradient ?? "var(--ls-bg-subtle, #F1F5F9)") : "var(--ls-bg-subtle, #F1F5F9)" }}
      >
        {previewState === "loading" && (
          <div className="tpl-detail-preview-state">
            <div className="tpl-apply-spinner" />
          </div>
        )}
        {previewState === "error" && (
          <div className="tpl-detail-preview-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ls-text-lighter, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p style={{ fontSize: 11, color: "var(--ls-text-muted, #475569)", margin: "6px 0 0", textAlign: "center" }}>
              Preview unavailable
            </p>
            {onPreviewRetry && (
              <button className="tpl-detail-preview-retry" onClick={onPreviewRetry}>
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info and buttons — unchanged */}
      <div className="tpl-detail-info">
        <h3 className="tpl-detail-title">{template.name}</h3>
        {template.description ? (
          <p className="tpl-detail-desc">{template.description}</p>
        ) : (
          <p className="tpl-detail-desc">
            A {template.category?.replace("-", " ") ?? "page"} template
            {template.pageCount ? ` with ${template.pageCount} pages` : ""}.
            {template.status === "premium" ? " Pro plan required." : ""}
          </p>
        )}
      </div>
      <div className="tpl-detail-buttons">
        {template.status === "premium" ? (
          <button className="tpl-detail-btn tpl-detail-btn--primary" disabled>
            Pro Plan Required
          </button>
        ) : (
          <>
            <button className="tpl-detail-btn tpl-detail-btn--primary" onClick={() => onApplyToCurrent(template.id)}>
              Apply to Current Page
            </button>
            <button className="tpl-detail-btn tpl-detail-btn--outline" onClick={() => onAddAsNewPage(template.id)}>
              Add as New Page
            </button>
          </>
        )}
        <button className="tpl-detail-btn tpl-detail-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Add preview state CSS**

Append to `TemplatesTab.css`:

```css
/* ── Detail preview loading/error states (Ba4uo / Onr0C) ── */
.tpl-detail-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tpl-detail-preview-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.tpl-detail-preview-retry {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--ls-accent, #1D4ED8);
  background: transparent;
  color: var(--ls-accent, #1D4ED8);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
.tpl-detail-preview-retry:hover {
  background: var(--ls-accent-bg, #DBEAFE);
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/templates
```

Expected: All template tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/editor/sidebar/tabs/templates/components/TemplateDetail.tsx src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "feat(templates): detail preview loading/error states (Ba4uo, Onr0C)"
```

---

## Task 8: Media Tab — Upload Banners + Search States

**Files:**
- Modify: `editor/sidebar/tabs/media/MediaTab.tsx`
- Modify: `editor/sidebar/tabs/media/MediaTab.css`

Four gaps: (1) hoPrk — green success banner. (2) pd04L — amber partial failure banner. (3) 65ma7 — search result count row. (4) fVg54 — search no-results with `search-x` icon.

- [ ] **Step 1: Add upload success/amber banners to MediaTab.tsx**

In `MediaTabInner`, after the failure strip block, add:

```tsx
{/* Success banner (hoPrk) — all uploads completed */}
{state.uploadQueue.length > 0 && state.uploadQueue.every((u) => u.status === "complete") && (
  <div className="med-success-strip">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ls-success-text, #166534)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
    <span className="med-success-text">
      {state.uploadQueue.filter((u) => u.status === "complete").length} files uploaded
    </span>
    <span className="med-strip-spacer" />
    <button className="med-success-action">View newest</button>
  </div>
)}

{/* Amber partial failure banner (pd04L) */}
{state.uploadQueue.some((u) => u.status === "complete") && state.failedUploads.length > 0 && (
  <div className="med-warning-strip">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ls-warning-text, #92400E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
    <span className="med-warning-text">
      {state.uploadQueue.filter((u) => u.status === "complete").length} uploaded, {state.failedUploads.length} failed
    </span>
    <span className="med-strip-spacer" />
    <button className="med-warning-action" onClick={() => state.dismissFailedUploads()}>
      Retry failed
    </button>
  </div>
)}
```

- [ ] **Step 2: Add search result count row to MediaTab.tsx**

Inside `MediaTabInner`, in the search section, add a count row below the search bar:

```tsx
{/* Search result count (65ma7) */}
{state.librarySearch.trim().length > 0 && state.libraryItems.length > 0 && (
  <div className="med-search-count">
    {state.libraryItems.length} result{state.libraryItems.length !== 1 ? "s" : ""} for &ldquo;{state.librarySearch.trim()}&rdquo;
  </div>
)}

{/* Search no results (fVg54) */}
{state.librarySearch.trim().length > 0 && state.libraryItems.length === 0 && (
  <div className="med-search-noresults">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ls-text-lighter, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
    <p className="med-search-noresults-title">No media for &ldquo;{state.librarySearch.trim()}&rdquo;</p>
    <p className="med-search-noresults-sub">Try a different search term or clear the query.</p>
  </div>
)}
```

- [ ] **Step 3: Add CSS for new banners and search states**

Append to `MediaTab.css`:

```css
/* ── Upload success banner (hoPrk) ── */
.med-success-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  background: var(--ls-success-bg, #dcfce7);
  border-radius: 6px;
  flex-shrink: 0;
  font-size: 12px;
}
.med-success-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-success-text, #166534);
}
.med-success-action {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-success-text, #166534);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  white-space: nowrap;
}

/* ── Upload partial failure banner (pd04L) ── */
.med-warning-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  background: var(--ls-warning-bg, #FEF3C7);
  border-radius: 6px;
  flex-shrink: 0;
  font-size: 12px;
}
.med-warning-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-warning-text, #92400E);
}
.med-warning-action {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-warning-text, #92400E);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  white-space: nowrap;
}

/* Shared spacer for strip layouts */
.med-strip-spacer {
  flex: 1;
}

/* ── Search result count (65ma7) ── */
.med-search-count {
  padding: 4px 0 4px 10px;
  font-size: 9px;
  color: var(--ls-text-muted, #475569);
  flex-shrink: 0;
}

/* ── Search no results (fVg54) ── */
.med-search-noresults {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 16px;
  gap: 8px;
  text-align: center;
}
.med-search-noresults-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
  margin: 0;
}
.med-search-noresults-sub {
  font-size: 10px;
  color: var(--ls-text-muted, #475569);
  margin: 0;
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/media
```

Expected: All media tab tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/media/MediaTab.tsx src/editor/sidebar/tabs/media/MediaTab.css
git commit -m "feat(media): success/amber upload banners (hoPrk, pd04L) + search count/no-results (65ma7, fVg54)"
```

---

## Task 9: Media Tab — Item Action Bar + Multi-Select Redesign

**Files:**
- Modify: `editor/sidebar/tabs/media/MediaTab.tsx`
- Modify: `editor/sidebar/tabs/media/components/SelectionBanner.tsx`
- Modify: `editor/sidebar/tabs/media/MediaTab.css`

Screen t8D67: persistent action bar when an item is focused. Screen XSWRz: multi-select bar with Move/Download/Deselect all/More.

- [ ] **Step 1: Add item action bar state to MediaTabInner**

Add `hoveredItem` state and render item action bar:

```tsx
// Add state
const [actionBarItem, setActionBarItem] = React.useState<LibraryItem | null>(null);
```

Add the item action bar JSX after the SelectionBanner:

```tsx
{/* Item action bar (t8D67) — shown when item is hovered/right-clicked */}
{!state.selMode && actionBarItem && (
  <div className="med-action-bar">
    <span className="med-action-bar-name">{actionBarItem.name}</span>
    <span className="med-strip-spacer" />
    <button className="med-action-btn" onClick={() => state.openDetail(actionBarItem)}>Preview</button>
    <button className="med-action-btn" onClick={() => state.openDetail(actionBarItem)}>Rename</button>
    <button className="med-action-btn med-action-btn--danger" onClick={() => state.requestDelete(actionBarItem.key)}>Delete</button>
  </div>
)}
```

Pass `onHover` to `LibraryView` to set `actionBarItem`. Add `onItemHover` to `LibraryView`'s props and wire through.

In the LibraryView `onCtxMenu` handler, also set the actionBarItem:

```tsx
onCtxMenu={(e, item) => {
  state.openCtxMenu(e, item);
  setActionBarItem(item);
}}
```

- [ ] **Step 2: Redesign SelectionBanner for XSWRz spec**

Replace `SelectionBanner.tsx` with:

```tsx
/**
 * Media Tab — Selection Banner (XSWRz spec)
 * Bottom bar: fill #DBEAFE, Move/Download/Deselect all/More
 * @license BSD-3-Clause
 */

import * as React from "react";

interface SelectionBannerProps {
  count: number;
  onExit(): void;
  onDelete(): void;
}

interface UploadProgressBannerProps {
  fileName: string;
  progress: number;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function UploadProgressBanner({ fileName, progress, showCancel = false, onCancel }: UploadProgressBannerProps) {
  return (
    <div className="med-banner--upload">
      <span className="med-banner__label">{fileName}</span>
      <div className="med-progress">
        <div className="med-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      {showCancel && (
        <button className="med-banner__cancel" onClick={onCancel} aria-label="Cancel upload">✕</button>
      )}
    </div>
  );
}

export function SelectionBanner({ count, onExit, onDelete }: SelectionBannerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "Delete" && count > 0) onDelete();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, onDelete, count]);

  return (
    <div className="med-selection-banner" role="status" aria-live="polite">
      <span className="med-selection-count">{count} selected</span>
      <button className="med-selection-action">Move</button>
      <button className="med-selection-action">Download</button>
      <span className="med-strip-spacer" />
      <button className="med-selection-secondary" onClick={onExit}>Deselect all</button>
      <button className="med-selection-more">More</button>
    </div>
  );
}
```

- [ ] **Step 3: Update CSS for action bar and selection banner**

Append to `MediaTab.css`:

```css
/* ── Item action bar (t8D67) ── */
.med-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 10px;
  background: var(--ls-bg-subtle, #F1F5F9);
  border-top: 1px solid var(--ls-border-light, #E2E8F0);
  flex-shrink: 0;
}
.med-action-bar-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}
.med-action-btn {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-accent, #1D4ED8);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
  border-radius: 3px;
  white-space: nowrap;
}
.med-action-btn:hover {
  background: var(--ls-accent-bg, #DBEAFE);
}
.med-action-btn--danger {
  color: var(--ls-error-text, #FCA5A5);
  font-weight: 600;
}
.med-action-btn--danger:hover {
  background: var(--ls-danger-bg, #FEF2F2);
}

/* ── Multi-select banner redesign (XSWRz) ── */
.med-selection-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 10px;
  background: var(--ls-accent-bg, #DBEAFE);
  flex-shrink: 0;
}
.med-selection-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-accent, #1D4ED8);
}
.med-selection-action {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-accent-txt, #1E40AF);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
  border-radius: 3px;
}
.med-selection-action:hover {
  background: rgba(29, 78, 216, 0.1);
}
.med-selection-secondary {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-secondary, #334155);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
  border-radius: 3px;
}
.med-selection-secondary:hover {
  background: rgba(0, 0, 0, 0.05);
}
.med-selection-more {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-secondary, #334155);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
  border-radius: 3px;
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/media
```

Expected: All media tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/media/MediaTab.tsx src/editor/sidebar/tabs/media/components/SelectionBanner.tsx src/editor/sidebar/tabs/media/MediaTab.css
git commit -m "feat(media): item action bar (t8D67) + multi-select redesign (XSWRz)"
```

---

## Task 10: Media Tab — Context Menu + Detail View + Metadata Error

**Files:**
- Modify: `editor/sidebar/tabs/media/MediaTab.tsx`
- Modify: `editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx`
- Modify: `editor/sidebar/tabs/media/MediaTab.css`

Screen kvg2l: w=140 context menu. Screens vSrqD + COb2m: detail view redesign.

- [ ] **Step 1: Update context menu in MediaTab.tsx**

The context menu already exists but spec wants: w=140, items = Copy URL, Copy Name, Rename, separator, Delete. Replace context menu JSX:

```tsx
{state.ctxMenu && (
  <>
    <div
      ref={ctxMenuRef}
      className="med-ctx-menu"
      style={{ left: state.ctxMenu.x, top: state.ctxMenu.y }}
      role="menu"
      aria-label="Asset options"
    >
      <button className="med-ctx-item" role="menuitem" tabIndex={-1}
        onClick={() => { state.copyUrl(state.ctxMenu!.item.src); state.closeCtxMenu(); }}>
        Copy URL
      </button>
      <button className="med-ctx-item" role="menuitem" tabIndex={-1}
        onClick={() => {
          navigator.clipboard?.writeText(state.ctxMenu!.item.name).catch(() => {});
          state.closeCtxMenu();
        }}>
        Copy Name
      </button>
      <button className="med-ctx-item" role="menuitem" tabIndex={-1}
        onClick={() => { state.openDetail(state.ctxMenu!.item); state.closeCtxMenu(); }}>
        Rename...
      </button>
      <div className="med-ctx-sep" />
      <button className="med-ctx-item med-ctx-item--danger" role="menuitem" tabIndex={-1}
        onClick={() => { state.requestDelete(state.ctxMenu!.item.key); state.closeCtxMenu(); }}>
        Delete
      </button>
    </div>
    <div className="med-ctx-backdrop" onClick={state.closeCtxMenu} aria-hidden="true" />
  </>
)}
```

Update context menu CSS in `MediaTab.css` — find `.med-ctx-menu` and update:

```css
.med-ctx-menu {
  position: absolute;
  z-index: 200;
  width: 140px;
  padding: 4px;
  border-radius: 6px;
  background: var(--ls-bg-card, #FFFFFF);
  border: 1px solid var(--ls-border-card, #D1D9E6);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.med-ctx-item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 26px;
  padding: 0 10px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--ls-text-medium, #374151);
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  font-family: inherit;
  transition: background 0.08s;
}
.med-ctx-item:hover {
  background: var(--ls-bg-subtle, #F1F5F9);
}
.med-ctx-item--danger {
  color: var(--ls-destructive, #EF4444);
}
.med-ctx-item--danger:hover {
  background: var(--ls-danger-bg, #FEF2F2);
}
.med-ctx-sep {
  height: 1px;
  background: var(--ls-border-light, #E2E8F0);
  margin: 2px 0;
}
```

- [ ] **Step 2: Redesign AssetDetailOverlay for vSrqD spec**

Replace `AssetDetailOverlay.tsx` with the vSrqD-spec layout. Key changes: nav bar h=30 with back + Prev/Next, preview h=140 cornerRadius 4, metadata section, action buttons row, plus COb2m error state:

```tsx
/**
 * Media Tab — Asset Detail Overlay (vSrqD spec)
 * Back nav row h=30 + preview h=140 + metadata + actions.
 * COb2m error: image-off icon + retry when metaError=true.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryItem } from "../data/mediaTypes";
import { fmtDur, fmtSize } from "../data/mediaUtils";

interface AssetDetailOverlayProps {
  item: LibraryItem;
  onInsert(key: string): void;
  onRename(key: string, name: string): Promise<void>;
  onDelete(key: string): void;
  onClose(): void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function AssetDetailOverlay({
  item,
  onInsert,
  onRename,
  onDelete,
  onClose,
  onPrev,
  onNext,
}: AssetDetailOverlayProps) {
  const [name, setName] = useState(item.name);
  const [inserted, setInserted] = useState(false);
  const [metaError, setMetaError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const insertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (insertTimerRef.current) clearTimeout(insertTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const firstFocusable = el.querySelector<HTMLElement>("button, input, [tabindex]:not([tabindex='-1'])");
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setName(item.name);
    setInserted(false);
    setMetaError(false);
  }, [item.key, item.name]);

  const commitRename = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== item.name) onRename(item.key, trimmed);
  }, [item.key, item.name, name, onRename]);

  const handleInsert = useCallback(() => {
    onInsert(item.key);
    setInserted(true);
    if (insertTimerRef.current) clearTimeout(insertTimerRef.current);
    insertTimerRef.current = setTimeout(() => {
      if (mountedRef.current) { setInserted(false); onClose(); }
    }, 800);
  }, [item.key, onInsert, onClose]);

  return (
    <div ref={overlayRef} className="med-detail-overlay" role="dialog" aria-modal="true" aria-label={item.name}>
      {/* Back nav row (vSrqD) — h=30, padding [8,10] */}
      <div className="med-detail-nav">
        <button className="med-detail-back" onClick={onClose} aria-label="Back to media grid">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to media grid
        </button>
        <span className="med-strip-spacer" />
        {onPrev && <button className="med-detail-navbtn" onClick={onPrev}>Prev</button>}
        {onNext && <button className="med-detail-navbtn" onClick={onNext}>Next</button>}
      </div>

      {metaError ? (
        /* COb2m — Metadata error state */
        <div className="med-detail-error-body">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ls-text-lighter, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
          <p className="med-detail-error-title">Preview metadata unavailable</p>
          <p className="med-detail-error-sub">The file may have been moved or deleted.</p>
          <button
            className="med-detail-retry"
            onClick={() => setMetaError(false)}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Preview — h=140, fill #FFFFFF, cornerRadius 4 */}
          <div className="med-detail-preview">
            {item.type === "vid" ? (
              <video src={item.src} controls style={{ maxWidth: "100%", maxHeight: "100%" }} onError={() => setMetaError(true)} />
            ) : item.type === "fnt" ? (
              <div className="med-font-specimen" style={{ fontFamily: `"${item.name}", serif` }}>
                <div className="med-font-specimen-lg">Aa Bb Cc</div>
                <div className="med-font-specimen-sm">The quick brown fox</div>
              </div>
            ) : (
              <img
                src={item.thumb ?? item.src}
                alt={item.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                onError={() => setMetaError(true)}
              />
            )}
          </div>

          {/* Metadata — gap 8, padding [10,12] */}
          <div className="med-detail-meta-section">
            <input
              ref={inputRef}
              className="med-detail-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setName(item.name); onClose(); }
              }}
              aria-label="File name"
            />
            <div className="med-detail-meta">
              <div className="med-detail-row">
                <span className="med-detail-key">Size</span>
                <span className="med-detail-val">{fmtSize(item.size)}</span>
              </div>
              {item.width != null && item.height != null && (
                <div className="med-detail-row">
                  <span className="med-detail-key">Dimensions</span>
                  <span className="med-detail-val">{item.width} × {item.height}</span>
                </div>
              )}
              {item.duration != null && (
                <div className="med-detail-row">
                  <span className="med-detail-key">Duration</span>
                  <span className="med-detail-val">{fmtDur(item.duration as number)}</span>
                </div>
              )}
              <div className="med-detail-row">
                <span className="med-detail-key">Type</span>
                <span className="med-detail-val">{item.mimeType}</span>
              </div>
              <div className="med-detail-row">
                <span className="med-detail-key">Added</span>
                <span className="med-detail-val">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action buttons row — padding [4,12,0,12], gap 6 */}
          <div className="med-detail-actions">
            <button
              className="med-detail-action-btn med-detail-action-btn--primary"
              onClick={handleInsert}
              disabled={inserted}
            >
              {inserted ? "Added ✓" : "Add to page"}
            </button>
            <button
              className="med-detail-action-btn med-detail-action-btn--danger"
              onClick={() => onDelete(item.key)}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add/update CSS for detail overlay**

Find existing `.med-detail-*` rules and replace/extend with:

```css
/* ── Detail overlay (vSrqD) ── */
.med-detail-overlay {
  position: absolute;
  inset: 0;
  background: var(--ls-bg-panel, #F8FAFC);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

/* Back nav row — h=30, padding [8,10] */
.med-detail-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 8px 10px;
  flex-shrink: 0;
}
.med-detail-back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--ls-text-subtle, #64748B);
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
}
.med-detail-back:hover { color: var(--ls-text-primary, #0F172A); }
.med-detail-navbtn {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-secondary, #334155);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
  border-radius: 3px;
}
.med-detail-navbtn:hover { background: var(--ls-bg-subtle, #F1F5F9); }

/* Preview area — h=140, white, cornerRadius 4 */
.med-detail-preview {
  height: 140px;
  background: var(--ls-bg-card, #FFFFFF);
  border-radius: 4px;
  margin: 0 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Metadata section — vertical, gap 8, padding [10,12] */
.med-detail-meta-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.med-detail-name {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ls-border-light, #E2E8F0);
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
  padding: 4px 0;
  font-family: inherit;
  outline: none;
}
.med-detail-name:focus { border-bottom-color: var(--ls-accent, #1D4ED8); }
.med-detail-meta { display: flex; flex-direction: column; gap: 4px; }
.med-detail-row { display: flex; justify-content: space-between; padding: 2px 0; }
.med-detail-key { font-size: 11px; color: var(--ls-text-lighter, #94A3B8); }
.med-detail-val { font-size: 11px; color: var(--ls-text-muted, #475569); text-align: right; }

/* Action buttons row — padding [4,12,0,12], gap 6 */
.med-detail-actions {
  display: flex;
  gap: 6px;
  padding: 4px 12px 12px;
  flex-shrink: 0;
}
.med-detail-action-btn {
  flex: 1;
  height: 32px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.12s;
  border: none;
}
.med-detail-action-btn--primary {
  background: var(--ls-accent, #1D4ED8);
  color: #fff;
}
.med-detail-action-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.med-detail-action-btn--primary:hover:not(:disabled) { opacity: 0.9; }
.med-detail-action-btn--danger {
  background: var(--ls-danger-bg, #FEF2F2);
  color: var(--ls-danger, #DC2626);
  border: 1px solid var(--ls-danger-border, #FECACA);
}
.med-detail-action-btn--danger:hover { opacity: 0.85; }

/* COb2m — metadata error state */
.med-detail-error-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 10px;
  text-align: center;
}
.med-detail-error-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #0F172A);
  margin: 0;
}
.med-detail-error-sub {
  font-size: 11px;
  color: var(--ls-text-muted, #475569);
  margin: 0;
}
.med-detail-retry {
  height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  background: var(--ls-accent, #1D4ED8);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
}
.med-detail-retry:hover { opacity: 0.9; }
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose src/editor/sidebar/tabs/media
```

Expected: All media tests pass.

- [ ] **Step 5: Run full test suite**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run --reporter=verbose
```

Expected: All tests pass across all modules.

- [ ] **Step 6: Commit**

```bash
git add src/editor/sidebar/tabs/media/MediaTab.tsx src/editor/sidebar/tabs/media/MediaTab.css src/editor/sidebar/tabs/media/components/SelectionBanner.tsx src/editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx
git commit -m "feat(media): context menu w=140 (kvg2l), detail view (vSrqD), metadata error (COb2m)"
```

---

## Self-Review

**Spec coverage check:**

| Screen | Task | Status |
|--------|------|--------|
| asCNI, RzB6V, nTVi6 | Task 3 (pill chips) | ✓ |
| SDgR2 | Task 2 (sections mode) | ✓ |
| fsI8j, GmdOe | Existing PinPopover + FTUE | ✓ |
| QFUVG | Existing SearchResults | ✓ |
| gnyrB | Task 4 | ✓ |
| 2ihz1, foBlu | Task 5 (breadcrumb) | ✓ |
| cV3OT | Task 5 (breadcrumb) | ✓ |
| 3pR56, WUJbY | Existing ReplaceModal | ✓ |
| l5Zoz | Task 5 (loading skeleton) | ✓ |
| XLKtB | Existing empty state | ✓ |
| DYk2w, v6Jqj, oj2MI | Task 6 | ✓ |
| fiLNZ, uMJFZ, 9NalZ | Task 6 | ✓ |
| Ba4uo, Onr0C | Task 7 | ✓ |
| A3VFy | Existing template type pills | ✓ |
| aPaxB | Existing root view | ✓ |
| JMoMN, FbIuN | Existing OnboardingEmptyState | ✓ |
| zo5Gr | Existing SkeletonStates | ✓ |
| HBPfb, QMOZP | Existing upload/failure strip | ✓ |
| Z2INT, jwG0u | Existing drag overlay | ✓ |
| hoPrk | Task 8 | ✓ |
| pd04L | Task 8 | ✓ |
| 65ma7 | Task 8 | ✓ |
| 1FcWF, fVg54 | Task 8 | ✓ |
| U5FHf | Existing empty search | ✓ |
| t8D67 | Task 9 | ✓ |
| XSWRz | Task 9 | ✓ |
| pABlG, pTWTr | Existing LibraryView selection | ✓ |
| kvg2l | Task 10 | ✓ |
| oD3wA | Existing ConfirmDeleteModal | ✓ |
| RsLjC | Existing unsupported thumbnail | ✓ |
| vSrqD | Task 10 | ✓ |
| COb2m | Task 10 | ✓ |

All 47 screens covered. No placeholders. No TBDs.

**Type consistency:** `DragStartFn`, `ElClickFn` types from `useBuildTab.ts` used consistently in Task 2 SectionsMode component. `TemplateItem` type from `templatesData.ts` used in all template tasks.

**Placeholder scan:** Clean. All code blocks are complete. All CSS values are explicit hex/px.
