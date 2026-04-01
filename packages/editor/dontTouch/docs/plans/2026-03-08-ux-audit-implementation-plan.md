# UX Audit Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all UX + Code fixes identified in the March 2026 audit across 3 tiers: Quick Wins (done/verify), Sprint Work, and Refactors.

**Architecture:** Fixes span tabsConfig (SSOT), sidebar tabs (Settings, History, Templates, Pages), inspector (PositionControls, MoreSettingsToggle), shared constants (storageKeys, layout), and dead-code removal across onboarding + shared/ui.

**Tech Stack:** React 18, TypeScript 5.3, Vite 7.2, Emotion CSS-in-JS — `npx tsc --noEmit` to verify, `npm run dev` on port 5050.

---

## STATUS KEY
- ✅ Implemented in audit session (verify only)
- 🔲 Not yet implemented (do now)

---

## TIER 1 — Quick Wins (Verify + Remaining Deletes)

---

### Task 1: Verify All Already-Implemented Fixes

**Files to inspect:**
- `src/editor/rail/tabsConfig.ts`
- `src/editor/sidebar/tabs/HistoryTab.tsx`
- `src/editor/sidebar/tabs/SettingsTab.tsx`
- `src/editor/sidebar/tabs/settings/types.ts`
- `src/editor/sidebar/shared/FeatureCard.tsx`
- `src/editor/inspector/sections/layout/PositionControls.tsx`
- `src/editor/inspector/sections/layout/index.tsx`

**Step 1: Type check — zero new errors**
```bash
npx tsc --noEmit 2>&1 | grep -E "SettingsTab|FeatureCard|tabsConfig|HistoryTab|PositionControls|settings/types"
```
Expected: empty output (no errors in our changed files)

**Step 2: Verify label fixes in tabsConfig.ts**
```bash
grep -E '"label"' src/editor/rail/tabsConfig.ts | grep -E '"add"|"assets"|"history"'
```
Expected output:
```
    label: "Build",      # was "Add"
    label: "Media",      # was "Assets"
    label: "History",    # was "Versions"
```

**Step 3: Verify Settings has no FilterChips**
```bash
grep "FilterChips\|categoryFilter\|CATEGORY_CHIPS" src/editor/sidebar/tabs/SettingsTab.tsx
```
Expected: empty output (all removed)

**Step 4: Verify History panel title**
```bash
grep 'title=' src/editor/sidebar/tabs/HistoryTab.tsx | grep -i "history\|version"
```
Expected: `title="Version History"` — not just "History"

**Step 5: Verify Position labels**
```bash
grep 'label:' src/editor/inspector/sections/layout/PositionControls.tsx
```
Expected: `"Auto"`, `"Rel"`, `"Abs"`, `"Fixed"`, `"Sticky"` — no STA/REL/ABS/FIX/STI

**Step 6: Verify MoreSettingsToggle label**
```bash
grep 'collapsedLabel\|advancedCount' src/editor/inspector/sections/layout/index.tsx
```
Expected: `collapsedLabel="Overflow & Visibility"` — no `advancedCount`

**Step 7: Commit all verified quick wins**
```bash
git add src/editor/rail/tabsConfig.ts \
        src/editor/sidebar/tabs/HistoryTab.tsx \
        src/editor/sidebar/tabs/SettingsTab.tsx \
        src/editor/sidebar/tabs/settings/types.ts \
        src/editor/sidebar/shared/FeatureCard.tsx \
        src/editor/inspector/sections/layout/PositionControls.tsx \
        src/editor/inspector/sections/layout/index.tsx
git commit -m "fix(ux): label alignment, settings filter tabs removed, position labels, history cleanup"
```

---

### Task 2: Delete Dead Code — Phase 1 (7 files) 🔲

**Why:** ~1,100 lines of code never used in production. Causes 6 TypeScript errors. Confuses developers.

**Files to DELETE:**
```
src/editor/onboarding/OnboardingModal.tsx
src/editor/onboarding/__tests__/OnboardingModal.test.tsx
src/editor/onboarding/OnboardingProgress.tsx
src/shared/ui/TourOverlay.tsx
src/components/ui/TourOverlay.tsx
src/components/Layout/railV16Config.ts
src/shared/hooks/useOnboarding.ts
```

**Step 1: Confirm zero production importers before deleting**
```bash
grep -r "OnboardingModal\b" src/ --include="*.tsx" --include="*.ts" | grep -v "__tests__"
# Expected: only OnboardingModal.tsx itself (the file being deleted)

grep -r "TourOverlay" src/editor/ src/features/ --include="*.tsx" --include="*.ts"
# Expected: empty — no editor files import TourOverlay

grep -r "railV16Config" src/ --include="*.tsx" --include="*.ts"
# Expected: only the file itself

grep -r "useOnboarding()" src/ --include="*.tsx" --include="*.ts"
# Expected: empty — hook never called
```

**Step 2: Delete the files**
```bash
rm src/editor/onboarding/OnboardingModal.tsx
rm src/editor/onboarding/__tests__/OnboardingModal.test.tsx
rm src/editor/onboarding/OnboardingProgress.tsx
rm src/shared/ui/TourOverlay.tsx
rm src/components/ui/TourOverlay.tsx
rm src/components/Layout/railV16Config.ts
rm src/shared/hooks/useOnboarding.ts
```

**Step 3: Remove TourOverlay export from shared/ui/index.tsx**

Open `src/shared/ui/index.tsx`. Find and remove the line:
```ts
export * from "./TourOverlay";
```

**Step 4: Remove useOnboarding exports from shared/hooks/index.ts**

Open `src/shared/hooks/index.ts`. Remove these lines:
```ts
export { useOnboarding } from "./useOnboarding";
export type { OnboardingStep, OnboardingState } from "./useOnboarding";
```

**Step 5: Fix OnboardingProgress type import in remaining files**
```bash
grep -r "OnboardingProgress\|from.*useOnboarding" src/ --include="*.tsx" --include="*.ts"
```
If any remaining file imports `OnboardingStep` from `useOnboarding`, update it to:
```ts
import type { OnboardingStep } from "../onboarding/useOnboardingOrchestrator";
// or from shared/constants/onboardingSteps
```

**Step 6: Type check — expect FEWER errors than before (OnboardingModal TS errors gone)**
```bash
npx tsc --noEmit 2>&1 | wc -l
# Should be LESS than the baseline count
npx tsc --noEmit 2>&1 | grep -v "OnboardingModal\|TourOverlay\|useOnboarding" | head -20
# Any remaining errors should be pre-existing ones unrelated to our changes
```

**Step 7: Commit**
```bash
git add -A
git commit -m "chore: delete dead code — OnboardingModal, OnboardingProgress, TourOverlay, useOnboarding, railV16Config (~1100 lines)"
```

---

## TIER 2 — Sprint Work

---

### Task 3: Fix Import Direction — Delete `shared/constants/tabs.ts` 🔲

**Why:** `shared/constants/tabs.ts` re-exports from `editor/rail/tabsConfig` — violates CLAUDE.md rule that `shared/` must never import from `editor/`. Every importer goes through 2 redirect hops.

**Files to update (6 importers):**
```
src/editor/rail/LeftRail.tsx
src/editor/shell/StudioPanels.tsx
src/editor/sidebar/useSidebarState.ts
src/editor/sidebar/TabRouter.tsx
src/editor/sidebar/LeftSidebar.tsx
src/editor/sidebar/useSidebarKeyboard.ts
```

**Step 1: Update each importer — change the import path**

For each file, change:
```ts
import type { GroupedTabId } from "../../shared/constants/tabs";
// or
import { GROUPED_TABS_CONFIG } from "../../shared/constants/tabs";
```

To the correct relative path pointing at `editor/rail/tabsConfig`:

```ts
// src/editor/rail/LeftRail.tsx (already IN rail/ — just local import)
import type { GroupedTabId } from "./tabsConfig";

// src/editor/shell/StudioPanels.tsx
import type { GroupedTabId } from "../rail/tabsConfig";

// src/editor/sidebar/useSidebarState.ts
import type { GroupedTabId } from "../rail/tabsConfig";

// src/editor/sidebar/TabRouter.tsx
import type { GroupedTabId } from "../rail/tabsConfig";

// src/editor/sidebar/LeftSidebar.tsx
import type { GroupedTabId } from "../rail/tabsConfig";

// src/editor/sidebar/useSidebarKeyboard.ts
import { GROUPED_TABS_CONFIG } from "../rail/tabsConfig";
import type { GroupedTabId } from "../rail/tabsConfig";
```

**Step 2: Type check after each file update**
```bash
npx tsc --noEmit 2>&1 | grep -E "useSidebarState|TabRouter|LeftSidebar|StudioPanels|LeftRail|useSidebarKeyboard"
# Expected: empty — no errors in updated files
```

**Step 3: Check shared/constants/index.ts for GroupedTabId re-export**
```bash
grep "GroupedTabId" src/shared/constants/index.ts
```
If found, remove that line (GroupedTabId is editor-scoped, not shared).

**Step 4: Delete the barrel file**
```bash
rm src/shared/constants/tabs.ts
```

**Step 5: Final type check — no new errors**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Should be same or fewer than before Task 3
```

**Step 6: Commit**
```bash
git add src/editor/rail/LeftRail.tsx \
        src/editor/shell/StudioPanels.tsx \
        src/editor/sidebar/useSidebarState.ts \
        src/editor/sidebar/TabRouter.tsx \
        src/editor/sidebar/LeftSidebar.tsx \
        src/editor/sidebar/useSidebarKeyboard.ts \
        src/shared/constants/tabs.ts \
        src/shared/constants/index.ts
git commit -m "fix(arch): remove shared/constants/tabs.ts barrel — import GroupedTabId directly from editor/rail/tabsConfig"
```

---

### Task 4: Fix STORAGE_KEYS Alias Pairs 🔲

**Why:** `MY_TEMPLATES = "aqb-my-templates"` and `SAVED_TEMPLATES = "aqb-saved-templates"` are different localStorage key strings but mean the same thing — live bug risk.

**File:** `src/shared/constants/storageKeys.ts`

**Step 1: Find all callers of the three alias keys**
```bash
grep -rn "STORAGE_KEYS\.PROJECT_DATA\|STORAGE_KEYS\.PREFERENCES\b\|STORAGE_KEYS\.SAVED_TEMPLATES" src/
```
Note every file + line number returned.

**Step 2: Update each caller**
- `STORAGE_KEYS.PROJECT_DATA` → `STORAGE_KEYS.CURRENT_PROJECT`
- `STORAGE_KEYS.PREFERENCES` → `STORAGE_KEYS.USER_PREFERENCES`
- `STORAGE_KEYS.SAVED_TEMPLATES` → `STORAGE_KEYS.MY_TEMPLATES`

**Step 3: Remove the alias entries from storageKeys.ts**

In `src/shared/constants/storageKeys.ts`, remove these three lines:
```ts
/** Alias for CURRENT_PROJECT */
PROJECT_DATA: "aqb-project",

/** Alias for PREFERENCES */
PREFERENCES: "aqb-preferences",

/** Alias for SAVED_TEMPLATES */
SAVED_TEMPLATES: "aqb-saved-templates",
```

**Step 4: Type check**
```bash
npx tsc --noEmit 2>&1 | grep "storageKeys\|PROJECT_DATA\|SAVED_TEMPLATES\|PREFERENCES"
# Expected: empty
```

**Step 5: Verify no remaining alias references**
```bash
grep -r "PROJECT_DATA\|\.PREFERENCES\b\|SAVED_TEMPLATES" src/ --include="*.ts" --include="*.tsx"
# Expected: empty
```

**Step 6: Commit**
```bash
git add src/shared/constants/storageKeys.ts
git commit -m "fix(ssot): remove STORAGE_KEYS alias pairs — PROJECT_DATA, PREFERENCES, SAVED_TEMPLATES"
```

---

### Task 5: Create `shared/constants/layout.ts` — PANEL_WIDTH SSOT 🔲

**Why:** `PANEL_WIDTH = 280` is hardcoded in `LeftSidebar.tsx` as a JS constant disconnected from the CSS variable `--layout-drawer-width: 280px` in `LayoutShell.css`.

**Step 1: Create the new constants file**

Create `src/shared/constants/layout.ts`:
```ts
/**
 * Layout dimension constants — Single Source of Truth
 * These values mirror CSS variables in editor/rail/LayoutShell.css.
 * When changing dimensions, update BOTH this file AND the CSS variables.
 *
 * CSS vars: --layout-rail-width, --layout-drawer-width, --layout-inspector-width
 *
 * @license BSD-3-Clause
 */
export const LAYOUT = {
  /** Left icon rail width in pixels */
  RAIL_WIDTH: 60,
  /** Sliding drawer panel width in pixels */
  DRAWER_WIDTH: 280,
  /** Right inspector panel width in pixels */
  INSPECTOR_WIDTH: 300,
  /** Top header bar height in pixels */
  HEADER_HEIGHT: 48,
} as const;
```

**Step 2: Update LeftSidebar.tsx to use the constant**

In `src/editor/sidebar/LeftSidebar.tsx`:

Remove:
```ts
// Panel dimensions
const PANEL_WIDTH = 280;
```

Add import at top (with other imports):
```ts
import { LAYOUT } from "../../shared/constants/layout";
```

Replace usage:
```ts
// BEFORE:
width: state.isPanelExpanded ? PANEL_WIDTH : 0,
// AFTER:
width: state.isPanelExpanded ? LAYOUT.DRAWER_WIDTH : 0,
```

**Step 3: Export from shared/constants/index.ts**
```bash
grep "LAYOUT\|layout" src/shared/constants/index.ts
```
If not already exported, add:
```ts
export { LAYOUT } from "./layout";
```

**Step 4: Type check**
```bash
npx tsc --noEmit 2>&1 | grep "LeftSidebar\|layout"
# Expected: empty
```

**Step 5: Commit**
```bash
git add src/shared/constants/layout.ts \
        src/editor/sidebar/LeftSidebar.tsx \
        src/shared/constants/index.ts
git commit -m "fix(ssot): extract PANEL_WIDTH to shared/constants/layout.ts LAYOUT constant"
```

---

### Task 6: Fix `leftPanelTab` Loose Type → `GroupedTabId` 🔲

**Why:** `leftPanelTab?: string` in `useStudioState.ts` with comment `// Now stores GroupedTabId` is a loose type. Any string can be passed, catching errors only at runtime.

**File:** `src/editor/shell/hooks/useStudioState.ts`

**Step 1: Add GroupedTabId import to useStudioState.ts**
```ts
import type { GroupedTabId } from "../../rail/tabsConfig";
```

**Step 2: Update PanelState interface**
```ts
// BEFORE:
export interface PanelState {
  leftPanelTab?: string; // Now stores GroupedTabId
  ...
}

// AFTER:
export interface PanelState {
  leftPanelTab?: GroupedTabId;
  ...
}
```

**Step 3: Update UseStudioStateReturn interface**
```ts
// Find: leftPanelTab: string;
// Replace: leftPanelTab: GroupedTabId;

// Find: setLeftPanelTab: (tab: string) => void;
// Replace: setLeftPanelTab: (tab: GroupedTabId) => void;
```

**Step 4: Run type check — TypeScript will surface call sites that pass plain strings**
```bash
npx tsc --noEmit 2>&1 | grep -E "leftPanelTab|GroupedTabId|string.*GroupedTabId"
```

**Step 5: Fix any reported call sites**

Likely locations — check each:
```bash
grep -n "leftPanelTab\|onLeftPanelTabChange\|setLeftPanelTab" \
  src/editor/shell/AquibraStudio.tsx \
  src/editor/shell/StudioPanels.tsx \
  src/editor/shell/hooks/useStudioHandlers.ts
```

For any `as GroupedTabId` cast — now that the type is correct, the cast can be removed:
```ts
// BEFORE (StudioPanels.tsx):
activeTab={(leftPanelTab as GroupedTabId) || "add"}
activePrimaryTab={leftPanelTab as GroupedTabId}

// AFTER:
activeTab={leftPanelTab || "add"}
activePrimaryTab={leftPanelTab}
```

**Step 6: Final type check — zero new errors**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Must be same or fewer than before
```

**Step 7: Commit**
```bash
git add src/editor/shell/hooks/useStudioState.ts \
        src/editor/shell/StudioPanels.tsx \
        src/editor/shell/AquibraStudio.tsx
git commit -m "fix(types): leftPanelTab typed as GroupedTabId instead of string"
```

---

### Task 7: Design System — Role-Based Typography Labels 🔲

**Why:** Labels "Small/Body/Large/Subtitle/Heading" mix CSS concept names with usage roles. Non-technical users ("what's a Subtitle?") can't find what they need.

**Step 1: Find where type token names are defined**
```bash
grep -rn "\"Small\"\|\"Body\"\|\"Subtitle\"\|\"Heading\"\|font.*name\|name.*font" \
  src/features/design-system/ --include="*.ts" --include="*.tsx" | head -20
```

**Step 2: Find the token name constants file**
```bash
grep -rn "Small\|Subtitle" src/features/design-system/constants.ts | head -20
grep -rn "Small\|Subtitle" src/features/design-system/state/useTypeTokens.ts | head -20
```

**Step 3: Update label names only (NOT CSS variable names)**

Map:
```
"Small"    → "Caption"      (10-12px, timestamps, meta)
"Body"     → "Body"         (keep — universally understood)
"Large"    → "Body LG"      (17px body variant)
"Subtitle" → "Sub-heading"  (20px section headers)
"Heading"  → keep as-is OR split into "Heading 3 / Heading 2 / Heading 1" if multiple
```

**Step 4: Verify CSS variable names unchanged**
```bash
grep "cssVar\|--aqb-font" src/features/design-system/constants.ts | head -10
# CSS var names like --aqb-font-body, --aqb-font-small must NOT change
# Only the .name display label field changes
```

**Step 5: Check Design panel renders updated labels**
```bash
npm run dev
# Open Design tab → Type sub-tab
# Verify new role-based labels appear
```

**Step 6: Commit**
```bash
git add src/features/design-system/
git commit -m "fix(design): role-based typography labels — Caption, Body, Sub-heading instead of CSS concept names"
```

---

### Task 8: Template Panel — Replace Hover Dark Overlay with Card Actions 🔲

**Why (B-01, Critical):** Preview card shows as tiny ~100px card in large dark overlay on hover. Users can't evaluate templates. Pro templates blocked from preview before paywall.

**File:** `src/editor/sidebar/tabs/templates/TemplatesTab.tsx` (and TemplatesTab.css)

**Step 1: Find the hover overlay mechanism**
```bash
grep -n "overlay\|onMouseEnter\|onMouseLeave\|hover.*preview\|preview.*hover" \
  src/editor/sidebar/tabs/templates/TemplatesTab.tsx | head -20
grep -n "overlay\|hover" src/editor/sidebar/tabs/templates/TemplatesTab.css | head -20
```

**Step 2: Find the template card component**
```bash
grep -n "TemplateCard\|tcard\|template.*card" \
  src/editor/sidebar/tabs/templates/TemplatesTab.tsx | head -10
```

**Step 3: Add always-visible action buttons to each card**

Find the card render function. Add action buttons that are visible on hover via CSS (no JS state):

```tsx
{/* Action bar — appears on hover via CSS, no JS state needed */}
<div className="tcard-actions">
  <button
    className="tcard-action-btn tcard-action-preview"
    onClick={(e) => { e.stopPropagation(); onPreview(template); }}
    aria-label={`Preview ${template.name}`}
  >
    Preview
  </button>
  {template.isPro && !hasProAccess ? (
    <button
      className="tcard-action-btn tcard-action-upgrade"
      onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
      aria-label="Upgrade to use this template"
    >
      Upgrade
    </button>
  ) : (
    <button
      className="tcard-action-btn tcard-action-use"
      onClick={(e) => { e.stopPropagation(); onUse(template); }}
      aria-label={`Use ${template.name}`}
    >
      Use this
    </button>
  )}
</div>
```

**Step 4: Add CSS for hover-reveal actions (no JS state)**

In `TemplatesTab.css`, add:
```css
/* Card must be position:relative — verify or add */
.tcard {
  position: relative;
  overflow: hidden;
}

/* Action bar — hidden by default, revealed on hover/focus */
.tcard-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 6px;
  padding: 8px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tcard:hover .tcard-actions,
.tcard:focus-within .tcard-actions {
  opacity: 1;
  transform: translateY(0);
}

.tcard-action-btn {
  flex: 1;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.tcard-action-preview {
  background: rgba(255,255,255,0.15);
  color: #fff;
}

.tcard-action-use {
  background: var(--aqb-accent, #3b82f6);
  color: #fff;
}

.tcard-action-upgrade {
  background: var(--aqb-gold, #f59e0b);
  color: #000;
}
```

**Step 5: Remove the old hover overlay mechanism**

Find and remove the JS overlay state and the overlay div:
```bash
grep -n "overlayVisible\|showOverlay\|previewOverlay\|hovered" \
  src/editor/sidebar/tabs/templates/TemplatesTab.tsx
```
Remove: the `useState` for hover, `onMouseEnter`/`onMouseLeave` handlers, and the overlay `div` element.

**Step 6: Ensure Preview still works for Pro templates**

Verify: clicking `[Preview]` on a Pro template opens the preview modal (not the upgrade modal).
The upgrade modal should only appear when clicking `[Upgrade]` or `[Use this]`.

```bash
grep -n "isPro\|isLocked\|LockedOverlay\|upgrade" \
  src/editor/sidebar/tabs/templates/TemplatesTab.tsx | head -20
```

**Step 7: Visual check**
```bash
npm run dev
# Open Templates panel
# Hover over a free template → [Preview] [Use this] appear
# Hover over a Pro template → [Preview] [Upgrade] appear
# Click Preview on Pro template → preview modal opens (not paywall)
```

**Step 8: Commit**
```bash
git add src/editor/sidebar/tabs/templates/TemplatesTab.tsx \
        src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "fix(templates): replace hover dark overlay with CSS card action buttons (B-01)"
```

---

### Task 9: Pages Panel — Inline Page Settings (Progressive Disclosure) 🔲

**Why (B-03):** SEO/Social/Advanced appear as peer-level sub-tabs below the pages list — users don't expect tabs within tabs in this context.

**File:** `src/editor/sidebar/tabs/PagesTab.tsx`

**Step 1: Understand current pages settings flow**
```bash
grep -n "PageSettingsDrawer\|onSettings\|openSettings\|settingsOpen" \
  src/editor/sidebar/tabs/PagesTab.tsx
grep -n "PageSettingsDrawer\|SeoTab\|SocialTab\|AdvancedTab" \
  src/editor/sidebar/tabs/pages/ -r --include="*.tsx" | head -20
```

**Step 2: Move SEO/Social/Advanced to accordion inside page row expansion**

In `src/editor/sidebar/tabs/pages/components/PageRow.tsx`, when a page is selected/active, render an expanded section below the row:

```tsx
{isExpanded && (
  <div className="pg-row-expanded">
    {/* Quick fields */}
    <div className="pg-row-field">
      <label>URL</label>
      <input value={page.slug} onChange={...} />
    </div>
    <div className="pg-row-field">
      <label>Title</label>
      <input value={page.name} onChange={...} />
    </div>

    {/* Accordion sections */}
    <details className="pg-row-section">
      <summary>SEO</summary>
      <SeoTab page={page} onChange={...} />
    </details>
    <details className="pg-row-section">
      <summary>Social</summary>
      <SocialTab page={page} onChange={...} />
    </details>
    <details className="pg-row-section">
      <summary>Advanced</summary>
      <AdvancedTab page={page} onChange={...} />
    </details>
  </div>
)}
```

**Step 3: Track expanded page in PagesTab state**

In `PagesTab.tsx`:
```tsx
const [expandedPageId, setExpandedPageId] = React.useState<string | null>(null);

// Pass to each PageRow:
<PageRow
  page={page}
  isExpanded={expandedPageId === page.id}
  onToggleExpand={() => setExpandedPageId(
    expandedPageId === page.id ? null : page.id
  )}
  ...
/>
```

**Step 4: Move Delete action to [⋮] context menu only**
```bash
grep -n "Delete\|delete.*button\|onDelete" \
  src/editor/sidebar/tabs/pages/components/PageRow.tsx | head -20
```
Ensure Delete only appears in the `[⋮]` menu — not as a standalone visible button in the row.

**Step 5: Verify type check**
```bash
npx tsc --noEmit 2>&1 | grep "PagesTab\|PageRow\|PageSettings"
```

**Step 6: Commit**
```bash
git add src/editor/sidebar/tabs/PagesTab.tsx \
        src/editor/sidebar/tabs/pages/
git commit -m "fix(pages): inline accordion settings per page row — remove tab-within-tab anti-pattern (B-03)"
```

---

## TIER 3 — Refactors

---

### Task 10: Split `useStudioState.ts` (433 lines → 4 focused hooks) 🔲

**Why (F-5b):** Single file handles device/zoom, panel state, overlay toggles, and save state — 4 unrelated concerns. Hard to test or modify in isolation.

**Strategy:** Extract one hook at a time. After each extraction, run `npx tsc --noEmit` before proceeding. Public API of `useStudioState` stays identical throughout — callers don't change.

**Step 1: Create `useDeviceZoom.ts`**

Create `src/editor/shell/hooks/useDeviceZoom.ts`:
```ts
/**
 * useDeviceZoom — device type + zoom level state
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { DeviceType } from "../../../shared/types";

export function useDeviceZoom() {
  const [device, setDevice] = React.useState<DeviceType>("desktop");
  const [zoom, setZoom] = React.useState(100);
  return { device, setDevice, zoom, setZoom };
}
```

In `useStudioState.ts`:
- Remove the `device`, `setDevice`, `zoom`, `setZoom` useState calls
- Import and spread: `const deviceZoom = useDeviceZoom();`
- In the return: `...deviceZoom,`

Run: `npx tsc --noEmit` — must pass before continuing.

**Step 2: Create `useOverlayState.ts`**

Create `src/editor/shell/hooks/useOverlayState.ts`:
```ts
/**
 * useOverlayState — canvas overlay toggles (grid, xray, badges, etc.)
 * Persists to localStorage.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { STORAGE_KEYS } from "../../../shared/constants/storageKeys";

// Extract initial loader from useStudioState.ts (the overlay localStorage read)
function loadOverlays() { /* copy from useStudioState */ }

export function useOverlayState() {
  // Move all overlay state + persistence logic here
  // showComponentView, showXRay, showSpacingIndicators, showBadges,
  // showGuides, showGrid, devMode, showSuggestions
}
```

Run: `npx tsc --noEmit` after wiring into `useStudioState`.

**Step 3: Create `usePanelState.ts`**

Create `src/editor/shell/hooks/usePanelState.ts`:
```ts
/**
 * usePanelState — left panel tab, open/closed, pinned state + localStorage
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { GroupedTabId } from "../../rail/tabsConfig";
import { STORAGE_KEYS } from "../../../shared/constants/storageKeys";

export function usePanelState() {
  // Move: leftPanelTab (typed as GroupedTabId), setLeftPanelTab,
  //       leftPanelSubTabs, setLeftPanelSubTabs,
  //       isLeftPanelOpen, setIsLeftPanelOpen,
  //       isLeftPanelPinned, setIsLeftPanelPinned
  //       + all localStorage persistence logic for these
}
```

Run: `npx tsc --noEmit`.

**Step 4: Create `useSaveState.ts`**

Create `src/editor/shell/hooks/useSaveState.ts`:
```ts
/**
 * useSaveState — save operation status tracking
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { SaveState } from "./useStudioState";

export function useSaveState() {
  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });
  return { saveState, setSaveState };
}
```

Run: `npx tsc --noEmit`.

**Step 5: Simplify useStudioState.ts to composition hook**

After all 4 extractions, `useStudioState.ts` should reduce to ~40 lines:
```ts
import { useDeviceZoom } from "./useDeviceZoom";
import { useOverlayState } from "./useOverlayState";
import { usePanelState } from "./usePanelState";
import { useSaveState } from "./useSaveState";
// ... keep types, panelStateMigration usage, PANEL_STATE_KEY

export function useStudioState() {
  const deviceZoom = useDeviceZoom();
  const overlayState = useOverlayState();
  const panelState = usePanelState();
  const saveState = useSaveState();

  return {
    ...deviceZoom,
    ...overlayState,
    ...panelState,
    ...saveState,
  };
}
```

**Step 6: Final verification**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Same or fewer errors than before Task 10
wc -l src/editor/shell/hooks/useStudioState.ts
# Should be < 60 lines
```

**Step 7: Commit**
```bash
git add src/editor/shell/hooks/
git commit -m "refactor: split useStudioState (433L) into 4 focused hooks — useDeviceZoom, useOverlayState, usePanelState, useSaveState"
```

---

### Task 11: Add WelcomeModal — Single-Screen Onboarding Entry 🔲

**Why (B-02):** Users land on blank canvas + floating checklist simultaneously. Need a single welcome moment (pick template or start blank) before checklist becomes active.

**Step 1: Create WelcomeModal component**

Create `src/editor/onboarding/WelcomeModal.tsx`:
```tsx
/**
 * WelcomeModal — first-time welcome screen
 * Single step: pick a template or start blank.
 * Replaces the old 3-step OnboardingModal (now deleted).
 * @license BSD-3-Clause
 */
import * as React from "react";

export interface WelcomeModalProps {
  /** Called when user picks a template ID */
  onSelectTemplate: (templateId: string) => void;
  /** Called when user chooses to start from blank canvas */
  onStartBlank: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  onSelectTemplate,
  onStartBlank,
}) => {
  // 3 featured template cards (hardcoded IDs — pick popular ones from templatesData)
  const FEATURED = [
    { id: "saas-landing", name: "SaaS Landing", tag: "Free" },
    { id: "portfolio", name: "Portfolio", tag: "Free" },
    { id: "blog", name: "Blog", tag: "Free" },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="welcome-title"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "var(--aqb-surface-elevated, #1a1b1e)",
        borderRadius: 16, padding: 40, maxWidth: 640, width: "90%",
      }}>
        <h1 id="welcome-title" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Welcome to Buildrik
        </h1>
        <p style={{ color: "var(--aqb-text-muted)", marginBottom: 32 }}>
          Start with a template — or build from scratch.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {FEATURED.map((t) => (
            <button key={t.id}
              onClick={() => onSelectTemplate(t.id)}
              style={{
                background: "var(--aqb-surface-2, #2a2b2e)",
                border: "1px solid var(--aqb-border)", borderRadius: 10,
                padding: "16px 12px", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ height: 80, background: "var(--aqb-surface-3, #3a3b3e)",
                borderRadius: 6, marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--aqb-text-muted)" }}>{t.tag}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onStartBlank}
            style={{ flex: 1, padding: "12px 24px", borderRadius: 8,
              background: "var(--aqb-accent, #3b82f6)", color: "#fff",
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Start with blank canvas →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
```

**Step 2: Add to onboarding barrel**

In `src/editor/onboarding/index.ts`, add:
```ts
export { WelcomeModal } from "./WelcomeModal";
export type { WelcomeModalProps } from "./WelcomeModal";
```

**Step 3: Wire WelcomeModal into AquibraStudio.tsx**

In `src/editor/shell/AquibraStudio.tsx`:

Add state:
```tsx
// Show welcome modal only on very first visit (0 steps completed, phase active)
const showWelcome = orchestrator.phase === "active" &&
  orchestrator.completedCount === 0;
```

Add handlers:
```tsx
const handleWelcomeTemplate = React.useCallback((templateId: string) => {
  // Apply the template via existing handler
  handlers.handleSelectTemplate?.({ id: templateId });
  // Mark first step complete so welcome doesn't show again
  orchestrator.completeStep("choose-template");
}, [handlers, orchestrator]);

const handleWelcomeBlank = React.useCallback(() => {
  orchestrator.completeStep("choose-template");
}, [orchestrator]);
```

Render (before OnboardingChecklist):
```tsx
{showWelcome && (
  <WelcomeModal
    onSelectTemplate={handleWelcomeTemplate}
    onStartBlank={handleWelcomeBlank}
  />
)}
```

**Step 4: Start checklist minimized (not expanded) when welcome closes**

In `useOnboardingOrchestrator.ts`, initialize `isMinimized` based on `completedCount > 0`:
```ts
const [isMinimized, setIsMinimized] = React.useState(
  () => loadInitialSteps().filter(s => s.completed).length > 0
);
```
This ensures: first visit → welcome modal shows, checklist hidden. After welcome → checklist starts minimized (pill in topbar).

**Step 5: Type check**
```bash
npx tsc --noEmit 2>&1 | grep "WelcomeModal\|AquibraStudio\|orchestrator"
# Expected: empty
```

**Step 6: Visual check**
```bash
# Clear onboarding state to simulate first visit:
# In browser console: localStorage.removeItem("aqb-onboarding-phase"); localStorage.removeItem("aqb-onboarding-progress"); location.reload();
# Expected: WelcomeModal appears — no checklist overlay
# Click "Start blank canvas" → WelcomeModal closes → blank canvas, checklist minimized
```

**Step 7: Commit**
```bash
git add src/editor/onboarding/WelcomeModal.tsx \
        src/editor/onboarding/index.ts \
        src/editor/shell/AquibraStudio.tsx \
        src/editor/onboarding/useOnboardingOrchestrator.ts
git commit -m "feat(onboarding): add WelcomeModal — single-screen entry before checklist (B-02)"
```

---

## FINAL VERIFICATION

### Task 12: Full Regression Check 🔲

**Step 1: TypeScript — baseline error count**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Must be FEWER than before audit (old errors from OnboardingModal are gone)
```

**Step 2: Dead code check**
```bash
# Verify no remaining references to deleted files
grep -r "OnboardingModal\|OnboardingProgress\|TourOverlay\|railV16Config\|useOnboarding\b" \
  src/ --include="*.ts" --include="*.tsx" | grep -v "__tests__\|node_modules"
# Expected: empty
```

**Step 3: Import direction check**
```bash
# shared/ must not import from editor/
grep -r "from.*editor/" src/shared/ --include="*.ts" --include="*.tsx"
# Expected: empty (tabs.ts is deleted)
```

**Step 4: SSOT check**
```bash
# No remaining alias keys
grep -r "PROJECT_DATA\|\.PREFERENCES\b\|SAVED_TEMPLATES\|PANEL_WIDTH" \
  src/editor/ src/shared/ --include="*.ts" --include="*.tsx"
# Expected: empty
```

**Step 5: Dev server smoke test**
```bash
npm run dev
# Visit http://localhost:5050
# Check: left rail labels match panel titles
# Check: Settings opens without filter tabs
# Check: History panel has no Undo/Redo buttons
# Check: Position controls show Auto/Rel/Abs/Fixed/Sticky
# Check: Templates panel shows action buttons on hover (no dark overlay)
```

**Step 6: Final commit**
```bash
git add -A
git commit -m "chore: final verification pass — all audit fixes implemented and verified"
```

---

## CHECKLIST SUMMARY

### Tier 1 — Quick Wins
- [ ] Task 1: Verify all implemented fixes (labels, settings, history, position, a11y)
- [ ] Task 2: Delete 7 dead code files + clean barrel exports

### Tier 2 — Sprint Work
- [ ] Task 3: Delete shared/constants/tabs.ts + update 6 importers
- [ ] Task 4: Fix STORAGE_KEYS alias pairs (MY_TEMPLATES, CURRENT_PROJECT, USER_PREFERENCES)
- [ ] Task 5: Create shared/constants/layout.ts (PANEL_WIDTH SSOT)
- [ ] Task 6: Type leftPanelTab as GroupedTabId (remove string cast)
- [ ] Task 7: Design system — role-based typography labels
- [ ] Task 8: Templates — CSS card actions replace hover dark overlay
- [ ] Task 9: Pages — inline accordion settings (no tab-within-tab)

### Tier 3 — Refactors
- [ ] Task 10: Split useStudioState (433L) into 4 focused hooks
- [ ] Task 11: Add WelcomeModal (single-screen onboarding entry)

### Final
- [ ] Task 12: Full regression check (TS, dead code, import direction, smoke test)

---

## EFFORT ESTIMATE

| Tier | Tasks | Estimate |
|------|-------|----------|
| Quick Wins | 1-2 | 1-2 hours |
| Sprint Work | 3-9 | 2-3 days |
| Refactors | 10-11 | 3-4 days |
| **Total** | **12** | **~1 week** |
