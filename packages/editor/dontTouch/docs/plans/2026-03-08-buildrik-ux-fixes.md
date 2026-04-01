# Buildrik UX Fixes — Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all 31 UX and code-quality fixes from the March 2026 left-panel audit across three phases: 13 Quick Wins, 11 Medium Effort items, and 7 Refactors.

**Architecture:** Phased plan — complete Phase 1 entirely before starting Phase 2, and Phase 2 before Phase 3. Each task is one independent Claude Code session. All Phase 1 tasks have exact file:line references and complete code. Phase 2 manual tasks include investigation steps before code. Phase 3 tasks start with file-reading steps.

**Tech Stack:** React 18.3, TypeScript 5.3 (strict), Vite 7.2, Emotion CSS-in-JS. Verify after every task: `npx tsc --noEmit`. Dev server: `npm run dev` (port 5050).

---

## PHASE GATE RULES

1. Complete **all 13 Phase 1 tasks** before starting Phase 2
2. Complete **all 11 Phase 2 tasks** before starting Phase 3
3. Each task = one Claude Code session
4. Always run `npx tsc --noEmit` after every change — fix any errors before committing
5. Phase 2: ME-1 depends on QW-9 being done first
6. Phase 3: RF-5 and RF-6 depend on RF-1 being done first

---

## ARCHITECTURE CONSTRAINTS (embed in every implementation)

From `CLAUDE.md`:
- New code → `editor/` not `components/` (legacy)
- No pass-through wrappers or middle-man classes
- Styling: Emotion + CSS variables only — no Tailwind, no inline objects except dynamic values
- SSOT: constants in `shared/constants/`, types in `shared/types/`
- Import direction: `editor/ → engine/, shared/, features/` only
- `shared/` must never import from `editor/`

---

# PHASE 1 — QUICK WINS

All 13 tasks are [VERIFIED] — exact file paths and lines confirmed in audit.

---

### Task QW-1: Rail Label "Config" → "Settings"

**Files:**
- Modify: `src/editor/rail/tabsConfig.ts:209-217`

**Step 1: Baseline type check**
```bash
npx tsc --noEmit 2>&1 | wc -l
```
Note the count. Your change must not increase it.

**Step 2: Make the change**

Open `src/editor/rail/tabsConfig.ts`. Find the settings slot (around line 209):
```ts
// BEFORE
{
  tabId: "settings",
  label: "Config",          // ← WRONG
  iconName: "SvgSettings",
  ariaLabel: "Settings",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Site settings and SEO",
},

// AFTER
{
  tabId: "settings",
  label: "Settings",        // ← CORRECT
  iconName: "SvgSettings",
  ariaLabel: "Settings",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Site settings and SEO",
},
```

**Step 3: Verify**
```bash
npx tsc --noEmit 2>&1 | wc -l
# Must be same or fewer than baseline
```

**Step 4: Visual check**
```bash
grep 'label:.*"Config"' src/editor/rail/tabsConfig.ts
# Expected: empty output (no more "Config" label)
grep 'label:.*"Settings"' src/editor/rail/tabsConfig.ts
# Expected: one match on the settings slot
```

**Step 5: Commit**
```bash
git add src/editor/rail/tabsConfig.ts
git commit -m "fix(rail): rename Config label to Settings"
```

---

### Task QW-2: Add Publish to Left Rail + SvgRocket Icon

**Files:**
- Modify: `src/editor/rail/tabsConfig.ts` (add BOTTOM slot)
- Modify: `src/editor/rail/LeftRail.tsx` (add SvgRocket to ICON_MAP)

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Add Publish slot in tabsConfig.ts**

Find the BOTTOM zone section (after the `settings` slot, around line 217). Add after the settings object:
```ts
{
  tabId: "publish",
  label: "Publish",
  iconName: "SvgRocket",
  ariaLabel: "Publish Site",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Publish and deploy your site",
},
```

**Step 3: Check if SvgRocket exists in shared icons**
```bash
grep -r "SvgRocket" src/shared/ui/ --include="*.tsx" --include="*.ts"
```

**Step 4a: If SvgRocket EXISTS in shared/ui/Icons** — add to import in LeftRail.tsx:
```ts
// Find the existing icons import block in src/editor/rail/LeftRail.tsx
// Add SvgRocket to the destructured imports from "../../shared/ui/Icons"
```

**Step 4b: If SvgRocket does NOT exist** — add inline component to LeftRail.tsx, before the ICON_MAP:
```tsx
const SvgRocket: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="17" height="17" fill="none"
    stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
  </svg>
);
```

**Step 5: Add SvgRocket to ICON_MAP in LeftRail.tsx**

Find `const ICON_MAP` (around line 50). Add entry:
```ts
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  SvgPlus: SvgPlusCircle,
  SvgPlusCircle: SvgPlusCircle,
  SvgLayers: SvgLayers,
  SvgPages: SvgPages,
  SvgImage: SvgImage,
  SvgClock: SvgClock,
  SvgSettings: SvgSettings,
  SvgShapes: SvgShapes,
  SvgGlobe: SvgGlobe,
  SvgTemplates: SvgTemplates,
  SvgRocket: SvgRocket,    // ← ADD THIS
};
```

**Step 6: Verify**
```bash
npx tsc --noEmit
# Expected: 0 new errors
```

**Step 7: Behavioral check**
- Start dev server: `npm run dev`
- Open editor — Publish button should appear in the bottom rail zone after Settings
- Click it → Publish panel opens
- Hover → tooltip reads "Publish Site [U]"

**Step 8: Commit**
```bash
git add src/editor/rail/tabsConfig.ts src/editor/rail/LeftRail.tsx
git commit -m "fix(rail): add Publish tab to left rail with SvgRocket icon"
```

---

### Task QW-3: Wire onTemplateUsed in TabRouter

**Files:**
- Modify: `src/editor/sidebar/TabRouter.tsx:61`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Find the templates case in TabRouter.tsx**
```bash
grep -n "templates" src/editor/sidebar/TabRouter.tsx
```
Expected: a `case "templates":` around line 61.

**Step 3: Make the change**

Find:
```tsx
case "templates":
  return <TemplatesTab composer={composer} />;
```

Replace with:
```tsx
case "templates":
  return (
    <TemplatesTab
      composer={composer}
      onTemplateUsed={onSwitchToAdd}
    />
  );
```

`onSwitchToAdd` already exists in `TabRouterProps` — no new props needed. It switches the active tab to "add" (Build tab), which is exactly what should happen after a template is applied.

**Step 4: Verify**
```bash
npx tsc --noEmit
# Expected: 0 new errors
```
```bash
grep -n "onTemplateUsed" src/editor/sidebar/TabRouter.tsx
# Expected: one line showing the prop being passed
```

**Step 5: Commit**
```bash
git add src/editor/sidebar/TabRouter.tsx
git commit -m "fix(sidebar): wire onTemplateUsed in TabRouter — post-apply navigation now works"
```

---

### Task QW-4: Wire onRequestTemplates to PagesTab

**Files:**
- Modify: `src/editor/sidebar/TabRouter.tsx`
- Modify: `src/editor/sidebar/LeftSidebar.tsx`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Add onSwitchToTemplates to TabRouterProps**

In `src/editor/sidebar/TabRouter.tsx`, find the `TabRouterProps` interface (around line 28). Add:
```ts
export interface TabRouterProps {
  activeTab: GroupedTabId;
  composer: Composer | null;
  commonTabProps: { ... };
  onBlockClick?: (data: BlockData) => void;
  onElementSelect?: (id: string) => void;
  canvasHoveredId?: string | null;
  onSwitchToAdd: () => void;
  onSwitchToTemplates?: () => void;  // ← ADD THIS
  onCreateComponent: () => void;
  onReplayTour?: () => void;
}
```

**Step 3: Destructure onSwitchToTemplates in TabRouter**

Find the TabRouter function signature. Add `onSwitchToTemplates` to destructuring.

**Step 4: Wire to PagesTab in the cases switch**

Find:
```tsx
case "pages":
  return <PagesTab composer={composer} {...commonTabProps} />;
```

Replace with:
```tsx
case "pages":
  return (
    <PagesTab
      composer={composer}
      {...commonTabProps}
      onRequestTemplates={onSwitchToTemplates}
    />
  );
```

**Step 5: Pass onSwitchToTemplates from LeftSidebar.tsx**

In `src/editor/sidebar/LeftSidebar.tsx`, find where `<TabRouter ... />` is rendered (around line 137). Add:
```tsx
<TabRouter
  activeTab={state.activePrimaryTab}
  composer={composer}
  commonTabProps={commonTabProps}
  onBlockClick={onBlockClick}
  onElementSelect={onElementSelect}
  canvasHoveredId={canvasHoveredId}
  onSwitchToAdd={() => state.handlePrimaryTabChange("add")}
  onSwitchToTemplates={() => state.handlePrimaryTabChange("templates")}  // ← ADD
  onCreateComponent={handleCreateComponent}
  onReplayTour={onReplayTour}
/>
```

**Step 6: Verify**
```bash
npx tsc --noEmit
# Expected: 0 new errors
```

**Step 7: Commit**
```bash
git add src/editor/sidebar/TabRouter.tsx src/editor/sidebar/LeftSidebar.tsx
git commit -m "fix(sidebar): wire onRequestTemplates to PagesTab — From Template button navigates correctly"
```

---

### Task QW-5: Fix Media Discovery Dead Link

**Files:**
- Modify: `src/editor/sidebar/tabs/media/components/OnboardingEmptyState.tsx:65-73`
- Modify: `src/editor/sidebar/tabs/media/MediaTab.tsx`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Update OnboardingEmptyState.tsx**

Open `src/editor/sidebar/tabs/media/components/OnboardingEmptyState.tsx`.

Find the interface (near top). Remove `onDiscovery` prop:
```ts
// BEFORE
interface OnboardingEmptyStateProps {
  activeType: MediaTypeFilter;
  onUpload(files: File[]): void;
  onDiscovery: () => void;
}

// AFTER
interface OnboardingEmptyStateProps {
  activeType: MediaTypeFilter;
  onUpload(files: File[]): void;
  // onDiscovery removed — Discovery tab not ready
}
```

Remove `onDiscovery` from the component's destructured props.

Find lines 65-73 (the Browse free stock photos button):
```tsx
// BEFORE
{activeType === "all" && (
  <button
    className="med-disc-cta"
    onClick={onDiscovery}
    aria-label="Browse free stock photos"
  >
    Browse free stock photos →
  </button>
)}

// AFTER
{activeType === "all" && (
  <a
    className="med-disc-cta"
    href="https://unsplash.com"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Browse free stock photos on Unsplash (opens in new tab)"
  >
    Browse free stock photos →
  </a>
)}
```

**Step 3: Update MediaTab.tsx**

Find where `OnboardingEmptyState` is rendered. Remove the `onDiscovery` prop:
```tsx
// BEFORE
<OnboardingEmptyState
  activeType={state.activeType}
  onUpload={state.upload}
  onDiscovery={() => state.setSource("disc")}
/>

// AFTER
<OnboardingEmptyState
  activeType={state.activeType}
  onUpload={state.upload}
/>
```

**Step 4: Verify**
```bash
npx tsc --noEmit
# The onDiscovery removal will cause a TS error if any call site was missed
# Expected: 0 errors after fixing all call sites
```
```bash
grep -rn "onDiscovery" src/editor/sidebar/tabs/media/
# Expected: empty (all references removed)
```

**Step 5: Commit**
```bash
git add src/editor/sidebar/tabs/media/components/OnboardingEmptyState.tsx \
        src/editor/sidebar/tabs/media/MediaTab.tsx
git commit -m "fix(media): replace dead Discovery link with Unsplash external link in empty state"
```

---

### Task QW-6: Reset TypePills Filter on Media Source Switch

**Files:**
- Modify: `src/editor/sidebar/tabs/media/MediaTab.tsx:149-164`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Find setType in useMediaState**
```bash
grep -n "setType\|setSource" src/editor/sidebar/tabs/media/MediaTab.tsx | head -20
```
Confirm `state.setType` and `state.setSource` both exist.

**Step 3: Add wrapper handler in MediaTab.tsx**

Find the component body (after the `state = useMediaState(...)` call). Add:
```tsx
const handleSetSource = React.useCallback(
  (source: "mine" | "disc") => {
    state.setSource(source);
    state.setType("all");  // reset filter on every source switch
  },
  [state]
);
```

**Step 4: Update source bar onClick calls**

Find the source bar (around line 149):
```tsx
// BEFORE
<button onClick={() => state.setSource("mine")} ...>My Library</button>
<button onClick={() => state.setSource("disc")} ...>Discovery</button>

// AFTER
<button onClick={() => handleSetSource("mine")} ...>My Library</button>
<button onClick={() => handleSetSource("disc")} ...>Discovery</button>
```

**Step 5: Verify**
```bash
npx tsc --noEmit
```

**Step 6: Behavioral check**
- Select "Images" filter in My Library
- Click Discovery → TypePills resets to "All"
- Click My Library → TypePills resets to "All" again

**Step 7: Commit**
```bash
git add src/editor/sidebar/tabs/media/MediaTab.tsx
git commit -m "fix(media): reset TypePills filter to 'all' when switching between Library and Discovery"
```

---

### Task QW-7: Add PanelHeader to TemplatesTab

**Files:**
- Modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`
- Modify: `src/editor/sidebar/TabRouter.tsx`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Find current TemplatesTabProps**
```bash
grep -n "TemplatesTabProps\|interface.*Props" src/editor/sidebar/tabs/templates/TemplatesTab.tsx | head -10
```

**Step 3: Update TemplatesTabProps in TemplatesTab.tsx**

Find the interface (around line 59):
```ts
// BEFORE
export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
}

// AFTER
export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}
```

**Step 4: Update component destructuring**

Find the component function signature. Add the new props:
```tsx
export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer,
  onTemplateUsed,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
```

**Step 5: Add PanelHeader import**
```bash
grep -n "PanelHeader" src/editor/sidebar/tabs/build/BuildTab.tsx | head -3
# Use the same import path that BuildTab uses
```

Add to TemplatesTab.tsx imports:
```tsx
import { PanelHeader } from "../../shared/PanelHeader";
```

**Step 6: Replace the custom header**

Find (around line 330):
```tsx
{/* ① Header */}
<div className="tpl-header">
  <span className="tpl-title">
    Templates
    <small className="tpl-count">{headerCount}</small>
  </span>
</div>
```

Replace with:
```tsx
<PanelHeader
  title="Templates"
  subtitle={`${headerCount}`}
  isPinned={isPinned}
  onPinToggle={onPinToggle}
  onHelpClick={onHelpClick}
  onClose={onClose}
/>
```

**Step 7: Wire commonTabProps in TabRouter.tsx**

Find the templates case (now with onTemplateUsed from QW-3):
```tsx
// BEFORE (after QW-3)
case "templates":
  return (
    <TemplatesTab
      composer={composer}
      onTemplateUsed={onSwitchToAdd}
    />
  );

// AFTER
case "templates":
  return (
    <TemplatesTab
      composer={composer}
      onTemplateUsed={onSwitchToAdd}
      {...commonTabProps}
    />
  );
```

**Step 8: Verify**
```bash
npx tsc --noEmit
```

**Step 9: Visual check**
- Open Templates tab → should show pin (📌), help (?), close (✕) in header — same chrome as Build tab
- Template count still appears next to title
- Pin and close buttons functional

**Step 10: Commit**
```bash
git add src/editor/sidebar/tabs/templates/TemplatesTab.tsx \
        src/editor/sidebar/TabRouter.tsx
git commit -m "fix(templates): add shared PanelHeader — templates tab now has pin/help/close like all other tabs"
```

---

### Task QW-8: History Clear Confirmation → Centered Modal

**Files:**
- Modify: `src/editor/sidebar/tabs/HistoryTab.tsx:172-184`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Confirm ConfirmDialog import path**
```bash
grep -n "ConfirmDialog" src/editor/sidebar/tabs/PagesTab.tsx
```
Note the exact import path (e.g., `"../../../shared/ui/Modal"`).

**Step 3: Add ConfirmDialog import to HistoryTab.tsx**
```tsx
import { ConfirmDialog } from "../../../shared/ui/Modal";
```

**Step 4: Find and remove the inline confirm block**

Find (around lines 172-184):
```tsx
{showClearConfirm && (
  <div style={confirmDialogStyles}>
    <p style={confirmTextStyles}>Clear all saved versions? You won&apos;t be able to undo recent changes.</p>
    <div style={confirmButtonsStyles}>
      <button onClick={() => setShowClearConfirm(false)} style={confirmCancelStyles}>
        Cancel
      </button>
      <button onClick={handleClearHistory} style={confirmDeleteStyles}>
        Clear
      </button>
    </div>
  </div>
)}
```

Remove this block entirely.

**Step 5: Add ConfirmDialog after the main return div**

In the JSX return, add as a sibling inside the outer wrapper (or at the bottom of the return):
```tsx
<ConfirmDialog
  isOpen={showClearConfirm}
  onClose={() => setShowClearConfirm(false)}
  onConfirm={handleClearHistory}
  title="Clear version history?"
  message="All saved versions will be deleted. You cannot undo this. Your current canvas is unaffected."
  confirmText="Clear History"
  variant="danger"
/>
```

**Step 6: Remove now-unused inline style constants**
```bash
grep -n "confirmDialogStyles\|confirmTextStyles\|confirmButtonsStyles\|confirmCancelStyles\|confirmDeleteStyles" src/editor/sidebar/tabs/HistoryTab.tsx
```
Delete any of these style constants that are no longer referenced.

**Step 7: Verify**
```bash
npx tsc --noEmit
```

**Step 8: Behavioral check**
- Click "Clear history" → centered overlay modal appears (not inline in panel)
- Cancel → modal closes, history preserved
- Clear History → history cleared, modal closes
- History panel has no layout shift when modal triggers

**Step 9: Commit**
```bash
git add src/editor/sidebar/tabs/HistoryTab.tsx
git commit -m "fix(history): replace inline clear-confirm with centered ConfirmDialog modal"
```

---

### Task QW-9: Wire PublishTab Props Through TabRouter

**Files:**
- Modify: `src/editor/sidebar/TabRouter.tsx`
- Modify: `src/editor/sidebar/LeftSidebar.tsx`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Check current PublishTab props**
```bash
grep -n "interface PublishTabProps\|onPublish\|onUnpublish\|projectId" src/editor/sidebar/tabs/PublishTab.tsx | head -20
```
Note what props PublishTab accepts.

**Step 3: Add props to TabRouterProps**

In `src/editor/sidebar/TabRouter.tsx`, find `TabRouterProps`. Add:
```ts
export interface TabRouterProps {
  // ... existing props ...
  projectId?: string | null;
  onPublish?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
}
```

**Step 4: Destructure new props in TabRouter**

Find the TabRouter function. Add to destructuring:
```tsx
function TabRouter({
  // ... existing ...
  projectId,
  onPublish,
  onUnpublish,
}: TabRouterProps) {
```

**Step 5: Pass to PublishTab**

Find:
```tsx
case "publish":
  return <PublishTab composer={composer} {...commonTabProps} />;
```

Replace with:
```tsx
case "publish":
  return (
    <PublishTab
      composer={composer}
      {...commonTabProps}
      projectId={projectId}
      onPublish={onPublish}
      onUnpublish={onUnpublish}
    />
  );
```

**Step 6: Add props to LeftSidebarProps**

In `src/editor/sidebar/LeftSidebar.tsx`, find `LeftSidebarProps`. Add:
```ts
export interface LeftSidebarProps {
  // ... existing ...
  projectId?: string | null;
  onPublish?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
}
```

**Step 7: Destructure and pass to TabRouter in LeftSidebar.tsx**

Add to component destructuring:
```tsx
export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  // ... existing ...
  projectId,
  onPublish,
  onUnpublish,
}) => {
```

Pass to TabRouter:
```tsx
<TabRouter
  // ... existing props ...
  projectId={projectId}
  onPublish={onPublish}
  onUnpublish={onUnpublish}
/>
```

**Step 8: Verify**
```bash
npx tsc --noEmit
```

**Step 9: Commit**
```bash
git add src/editor/sidebar/TabRouter.tsx src/editor/sidebar/LeftSidebar.tsx
git commit -m "fix(publish): wire projectId/onPublish/onUnpublish through TabRouter to PublishTab"
```

---

### Task QW-10: Remove Dead showIconRail Prop

**Files:**
- Modify: `src/editor/sidebar/LeftSidebar.tsx:46`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Find all usages of showIconRail**
```bash
grep -rn "showIconRail" src/ --include="*.tsx" --include="*.ts"
```
Note all files that reference it. You need to remove the prop from all of them.

**Step 3: Remove from LeftSidebarProps**

In `src/editor/sidebar/LeftSidebar.tsx`, find and delete:
```ts
/** @deprecated No longer used — LeftRail handles icons */
showIconRail?: boolean;
```

**Step 4: Remove from any call sites**

For each file found in Step 2, remove the `showIconRail={...}` prop pass. Do NOT remove the caller — just the prop.

**Step 5: Verify**
```bash
npx tsc --noEmit
# TypeScript will catch any missed call sites — fix them all
```
```bash
grep -rn "showIconRail" src/
# Expected: empty
```

**Step 6: Commit**
```bash
git add src/editor/sidebar/LeftSidebar.tsx
# Add any other files you edited in Step 4
git commit -m "chore: remove deprecated showIconRail prop from LeftSidebar"
```

---

### Task QW-11: Gate Component Creation Behind hasApi Check

**Files:**
- Modify: `src/editor/sidebar/LeftSidebar.tsx:86-93`
- Modify: `src/editor/sidebar/tabs/build/components/MyComponents.tsx:18-22`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Update handleCreateComponent in LeftSidebar.tsx**

Find (lines 86-93):
```tsx
const handleCreateComponent = React.useCallback(() => {
  if (!composer) return;
  const selectedIds = composer.selection.getSelectedIds();
  const elementId = selectedIds[0];
  if (elementId) {
    composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId });
  }
}, [composer]);
```

Replace with:
```tsx
const handleCreateComponent = React.useCallback(() => {
  if (!composer) return;
  const hasComponentsApi =
    typeof (composer?.elements as unknown as Record<string, unknown> | undefined)?.[
      "getComponents"
    ] === "function";
  if (!hasComponentsApi) {
    // Components API not ready — do not create orphaned data
    return;
  }
  const selectedIds = composer.selection.getSelectedIds();
  const elementId = selectedIds[0];
  if (elementId) {
    composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId });
  }
}, [composer]);
```

**Step 3: Update MyComponents.tsx**

Open `src/editor/sidebar/tabs/build/components/MyComponents.tsx`.

Find (lines 18-22):
```tsx
const hasApi =
  composer !== null &&
  typeof (composer?.elements as unknown as Record<string, unknown> | undefined)?.[
    "getComponents"
  ] === "function";
```

Find the return statement. Add an early return:
```tsx
if (!hasApi) return null;
```
Add it BEFORE the existing return statement.

Find the "coming soon" conditional inside the JSX:
```tsx
{!hasApi ? (
  <span>Components feature coming soon.</span>
) : (
  <span>No saved components yet. Select an element → right-click → Save as Component.</span>
)}
```

Replace with (now that `!hasApi` returns null above, this branch is unreachable):
```tsx
<span>No saved components yet. Select an element → right-click → Save as Component.</span>
```

**Step 4: Verify**
```bash
npx tsc --noEmit
```

**Step 5: Behavioral check**
- When `composer.elements.getComponents` is not a function: MY COMPONENTS section does not appear
- When it IS a function: section appears with "No saved components yet" message

**Step 6: Commit**
```bash
git add src/editor/sidebar/LeftSidebar.tsx \
        src/editor/sidebar/tabs/build/components/MyComponents.tsx
git commit -m "fix(components): gate component creation and display behind hasApi check"
```

---

### Task QW-12: Fix Design Tab Icon — SvgGlobe → SvgPalette

**Files:**
- Modify: `src/editor/rail/tabsConfig.ts:199-208`
- Modify: `src/editor/rail/LeftRail.tsx`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Update tabsConfig.ts**

Find the design slot (around line 199):
```ts
// BEFORE
{
  tabId: "design",
  label: "Design",
  iconName: "SvgGlobe",      // ← WRONG: globe icon for design system tab
  ariaLabel: "Design System",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Colors, typography, and spacing",
},

// AFTER
{
  tabId: "design",
  label: "Design",
  iconName: "SvgPalette",    // ← CORRECT: palette for design system
  ariaLabel: "Design System",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Colors, typography, and spacing",
},
```

**Step 3: Check if SvgPalette exists**
```bash
grep -rn "SvgPalette" src/shared/ui/ --include="*.tsx" --include="*.ts"
```

**Step 4a: If SvgPalette EXISTS** — add to import in LeftRail.tsx from shared/ui/Icons.

**Step 4b: If SvgPalette does NOT exist** — add inline in LeftRail.tsx before ICON_MAP:
```tsx
const SvgPalette: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="17" height="17" fill="none"
    stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="8" cy="14" r="1" fill="currentColor"/>
    <circle cx="12" cy="9" r="1" fill="currentColor"/>
    <circle cx="16" cy="14" r="1" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);
```

**Step 5: Add SvgPalette to ICON_MAP**

Find ICON_MAP in LeftRail.tsx. Add:
```ts
SvgPalette: SvgPalette,   // ← ADD THIS
```

Note: Keep `SvgGlobe` in ICON_MAP — it may be used elsewhere. Do NOT remove it.

**Step 6: Verify**
```bash
npx tsc --noEmit
```
```bash
grep "SvgGlobe\|SvgPalette" src/editor/rail/tabsConfig.ts
# Expected: SvgPalette for design tab, SvgGlobe gone from design slot
```

**Step 7: Commit**
```bash
git add src/editor/rail/tabsConfig.ts src/editor/rail/LeftRail.tsx
git commit -m "fix(rail): fix Design tab icon — SvgGlobe replaced with SvgPalette (SSOT alignment)"
```

---

### Task QW-13: Remove Dead onOpenTemplates + onExportForDeploy Props

**Files:**
- Modify: `src/editor/sidebar/LeftSidebar.tsx:33-43`
- Modify: any call sites (AquibraStudio.tsx, StudioPanels.tsx)

**Step 1: Find all call sites**
```bash
grep -rn "onOpenTemplates\|onExportForDeploy" src/ --include="*.tsx" --include="*.ts"
```
Note every file that passes these props.

**Step 2: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 3: Remove from LeftSidebarProps in LeftSidebar.tsx**

Find and delete these two prop declarations (around lines 33-43):
```ts
onOpenTemplates?: () => void;
onExportForDeploy?: () => Promise<{
  files: Array<{ path: string; content: string }>;
  projectName?: string;
}>;
```

**Step 4: Remove from all call sites**

For each file found in Step 1 (likely AquibraStudio.tsx and StudioPanels.tsx), remove the prop being passed. Do NOT remove the handler functions themselves — only the prop pass into LeftSidebar.

Example:
```tsx
// BEFORE
<LeftSidebar
  ...
  onOpenTemplates={modals.openTemplates}
  onExportForDeploy={handleExportForDeploy}
/>

// AFTER
<LeftSidebar
  ...
  // onOpenTemplates and onExportForDeploy removed — not consumed by sidebar
/>
```

**Step 5: Verify**
```bash
npx tsc --noEmit
# TypeScript will flag any missed call sites with "Object literal may only specify known properties"
```
```bash
grep -rn "onOpenTemplates\|onExportForDeploy" src/editor/sidebar/
# Expected: empty — no references in sidebar
```

**Step 6: Commit**
```bash
git add src/editor/sidebar/LeftSidebar.tsx
# Add any other edited call site files
git commit -m "chore: remove dead onOpenTemplates and onExportForDeploy props from LeftSidebar"
```

---

# PHASE 2 — MEDIUM EFFORT

> **Prerequisite:** All 13 Phase 1 tasks must be committed before starting Phase 2.
> **Special dependency:** ME-1 requires QW-9 to be done first.

---

### Task ME-1: PublishTab Checklist — Dynamic Data from Composer

**Prerequisite:** QW-9 must be complete (PublishTab props wired).

**Files:**
- Modify: `src/editor/sidebar/tabs/PublishTab.tsx:293-307`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Read the current hardcoded checklist**
```bash
grep -n "ChecklistItem\|hardcoded\|ok={true}\|ok={false}" src/editor/sidebar/tabs/PublishTab.tsx
```

**Step 3: Add dynamic checks using composer**

In `PublishTab.tsx`, find where `_composer` (or `composer`) is available. Add a `React.useMemo` above the return statement:
```tsx
const checks = React.useMemo(() => {
  // Template applied / content check: canvas has elements
  const hasContent = (() => {
    try {
      const page = _composer?.elements?.getActivePage?.();
      if (!page) return false;
      const root = _composer?.elements?.getElement?.(page.root?.id);
      return (root?.getChildCount?.() ?? 0) > 0;
    } catch { return false; }
  })();

  // SEO/Social data: mark false as conservative default until composer exposes these
  const hasSeoTitle = false;   // TODO: wire when composer.getSeoData() is available
  const hasMetaDesc = false;   // TODO: wire when composer.getSeoData() is available
  const hasSocialImg = false;  // TODO: wire when composer.getSeoData() is available

  return { hasContent, hasSeoTitle, hasMetaDesc, hasSocialImg };
}, [_composer]);
```

**Step 4: Replace hardcoded ChecklistItem values**
```tsx
// BEFORE
<ChecklistItem label="Template applied" ok={true} required />
<ChecklistItem label="Content edited" ok={true} required />
<ChecklistItem label="SEO title set" ok={false} hint="Pages → SEO" />
<ChecklistItem label="Meta description added" ok={false} hint="Pages → SEO" />
<ChecklistItem label="Social preview configured" ok={false} hint="Pages → Social" />

// AFTER
<ChecklistItem label="Template applied" ok={checks.hasContent} required />
<ChecklistItem label="Content edited" ok={checks.hasContent} required />
<ChecklistItem label="SEO title set" ok={checks.hasSeoTitle} hint="Pages → SEO" />
<ChecklistItem label="Meta description added" ok={checks.hasMetaDesc} hint="Pages → SEO" />
<ChecklistItem label="Social preview configured" ok={checks.hasSocialImg} hint="Pages → Social" />
```

**Step 5: Add unconfigured state message**

Find the Publish button (around line 319). Replace:
```tsx
<Button
  variant="primary"
  onClick={handlePublish}
  disabled={isPublishing || !projectId || !onPublish}
  style={{ width: "100%" }}
>
  {isPublishing ? "Publishing..." : "Publish Site"}
</Button>
```

With:
```tsx
{(!projectId || !onPublish) ? (
  <div style={{
    padding: "12px",
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: "var(--aqb-radius-md, 8px)",
    fontSize: 12,
    color: "var(--aqb-text-secondary)",
    lineHeight: 1.5,
  }}>
    Publishing not configured. Contact your administrator to link this project.
  </div>
) : (
  <Button
    variant="primary"
    onClick={handlePublish}
    disabled={isPublishing}
    style={{ width: "100%" }}
  >
    {isPublishing ? "Publishing..." : "Publish Site"}
  </Button>
)}
```

**Step 6: Verify**
```bash
npx tsc --noEmit
```

**Step 7: Behavioral check**
- On blank canvas: "Template applied" shows ○ (not ✓)
- After adding content: shows ✓
- Without projectId prop: info banner shown instead of greyed button

**Step 8: Commit**
```bash
git add src/editor/sidebar/tabs/PublishTab.tsx
git commit -m "fix(publish): replace hardcoded checklist with dynamic composer data + unconfigured state"
```

---

### Task ME-2: Scope usePanelNavigation localStorage to Project

**Files:**
- Modify: `src/editor/sidebar/tabs/HistoryTab.tsx`
- Modify: `src/editor/sidebar/tabs/SettingsTab.tsx`
- Modify: `src/editor/sidebar/TabRouter.tsx`
- Modify: `src/editor/sidebar/LeftSidebar.tsx`

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Read current storage keys**
```bash
grep -n "localStorage\|storageKey\|aqb-history\|settings-panel" \
  src/editor/sidebar/tabs/HistoryTab.tsx \
  src/editor/sidebar/tabs/SettingsTab.tsx
```

**Step 3: Check if LeftSidebar already has projectId prop**

(QW-9 added it — confirm it's there)
```bash
grep -n "projectId" src/editor/sidebar/LeftSidebar.tsx src/editor/sidebar/TabRouter.tsx
```

**Step 4: Pass projectId to HistoryTab and SettingsTab in TabRouter.tsx**

Find history and settings cases:
```tsx
// BEFORE
case "history":
  return <HistoryTab composer={composer} {...commonTabProps} />;

case "settings":
  return <SettingsTab composer={composer} {...commonTabProps} />;

// AFTER
case "history":
  return <HistoryTab composer={composer} {...commonTabProps} projectId={projectId} />;

case "settings":
  return <SettingsTab composer={composer} {...commonTabProps} projectId={projectId} />;
```

**Step 5: Add projectId prop to HistoryTab types**

Find `HistoryTabProps` in `src/editor/sidebar/tabs/history/types.ts` (or HistoryTab.tsx). Add:
```ts
export interface HistoryTabProps {
  composer: Composer | null;
  projectId?: string | null;    // ← ADD
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}
```

**Step 6: Scope the storage key in HistoryTab.tsx**

Find the `activeView` state initializer (around line 60):
```tsx
// BEFORE
const [activeView, setActiveView] = React.useState<HistoryView>(() => {
  if (typeof window === "undefined") return "versions";
  try {
    const stored = window.localStorage.getItem("aqb-history-view");
    if (stored === "versions" || stored === "activity") return stored;
  } catch { }
  return "versions";
});

// AFTER
const storageKey = `aqb-history-view${props.projectId ? `-${props.projectId}` : ""}`;

const [activeView, setActiveView] = React.useState<HistoryView>(() => {
  if (typeof window === "undefined") return "versions";
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "versions" || stored === "activity") return stored;
  } catch { }
  return "versions";
});
```

Also find the effect that persists activeView and update the key:
```tsx
React.useEffect(() => {
  try { window.localStorage.setItem(storageKey, activeView); } catch { }
}, [activeView, storageKey]);
```

**Step 7: Scope Settings storage key**

In `src/editor/sidebar/tabs/SettingsTab.tsx`, find `usePanelNavigation`:
```tsx
// BEFORE
const { currentScreen, navigateTo, goBack, canGoBack, breadcrumb } = usePanelNavigation({
  storageKey: "settings-panel",
  screens: SETTINGS_SCREENS,
  defaultScreen: "home",
});

// AFTER
const { currentScreen, navigateTo, goBack, canGoBack, breadcrumb } = usePanelNavigation({
  storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
  screens: SETTINGS_SCREENS,
  defaultScreen: "home",
});
```

Also add `projectId` to `SettingsTabProps`:
```ts
projectId?: string | null;
```

**Step 8: Verify**
```bash
npx tsc --noEmit
```

**Step 9: Behavioral check**
- Open History in Project A → switch to Activity view
- Open Project B → History opens in Versions view (not Activity)
- Open Settings in Project A → navigate to Domains
- Open Project B → Settings opens on home screen (not Domains)

**Step 10: Commit**
```bash
git add src/editor/sidebar/tabs/HistoryTab.tsx \
        src/editor/sidebar/tabs/SettingsTab.tsx \
        src/editor/sidebar/TabRouter.tsx
git commit -m "fix(sidebar): scope History and Settings localStorage keys to projectId"
```

---

### Task ME-3: Hide FavZone During Active Search

**Files:**
- Investigate and modify: Build tab favorites zone component

**Step 1: Find the FavZone component**
```bash
grep -rn "FavZone\|fav-zone\|favorites\|favs" src/editor/sidebar/tabs/build/ --include="*.tsx" --include="*.ts" | head -20
```

**Step 2: Find where search query state lives**
```bash
grep -rn "searchQuery\|search.*query\|query.*search\|isSearching" src/editor/sidebar/tabs/build/ --include="*.tsx" --include="*.ts" | head -20
```

**Step 3: Read the file containing FavZone render**
Read the file found in Step 1 where FavZone is rendered.

**Step 4: Add conditional hide**

Find where FavZone renders. Wrap with a search-active check:
```tsx
// Only show FavZone when not searching
{!searchQuery && <FavZone ... />}
```

The exact variable name for the search query comes from Step 2.

**Step 5: Verify**
```bash
npx tsc --noEmit
```

**Step 6: Behavioral check**
- Type in Build tab search → FavZone (favorites section) disappears
- Clear search → FavZone reappears

**Step 7: Commit**
```bash
git add [files you modified]
git commit -m "fix(build): hide favorites zone when search is active"
```

---

### Task ME-4: Unify Template Click Behavior

**Files:**
- Investigate and modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`

**Step 1: Find current click handlers**
```bash
grep -n "onClick\|handleClick\|onSelect\|PRO\|isPro\|locked" src/editor/sidebar/tabs/templates/TemplatesTab.tsx | head -30
```

**Step 2: Understand current flow**

Read the relevant section of TemplatesTab.tsx where template cards are rendered. Note:
- What happens when a free template is clicked?
- What happens when a PRO template is clicked?
- Is there a preview modal?

**Step 3: Identify the divergent paths**
```bash
grep -n "preview\|previewId\|selectedId\|modal" src/editor/sidebar/tabs/templates/TemplatesTab.tsx | head -20
```

**Step 4: Unify click behavior**

Both free and PRO template cards should open the preview modal on first click. The Apply button lives inside the modal. Find the card click handler and ensure:
```tsx
// Single handler for all cards:
const handleCardClick = (templateId: string) => {
  setPreviewId(templateId);  // opens preview modal for ALL cards
};
```

PRO gating moves to inside the preview modal's Apply button:
```tsx
// Inside preview modal:
{isPro && !userHasPro ? (
  <button onClick={onUpgradeClick}>Upgrade to apply</button>
) : (
  <button onClick={() => startApply(templateId)}>Apply Template</button>
)}
```

**Step 5: Verify**
```bash
npx tsc --noEmit
```

**Step 6: Behavioral check**
- Click any free template → preview modal opens
- Click any PRO template → preview modal opens (not upgrade modal directly)
- Apply button inside modal handles PRO gating

**Step 7: Commit**
```bash
git add src/editor/sidebar/tabs/templates/TemplatesTab.tsx
git commit -m "fix(templates): unify click behavior — all templates open preview modal first"
```

---

### Task ME-5: Page Settings Auto-Save on Blur

**Files:**
- Modify: `src/editor/sidebar/tabs/pages/components/PageRow.tsx:82-136`
- Investigate: `src/editor/sidebar/tabs/pages/settings/usePageSettings.ts`

**Step 1: Read usePageSettings to understand save model**
```bash
grep -n "save\|isDirty\|onBlur\|onChange\|debounce" src/editor/sidebar/tabs/pages/settings/usePageSettings.ts | head -30
```

**Step 2: Read current save row in PageRow.tsx**

Open `src/editor/sidebar/tabs/pages/components/PageRow.tsx` lines 82-136.

**Step 3: Replace manual save button with auto-save**

In `InlineSettings` component in PageRow.tsx, replace the save-row:
```tsx
// REMOVE the Save button:
<button
  className={`pg-row-settings__save...`}
  onClick={s.save}
  disabled={saveBtnDisabled}
>
  {saveBtnLabel}
</button>

// REPLACE with status indicator only:
<div className="pg-row-settings__status">
  {s.saveState === "saving" && <span>Saving...</span>}
  {s.saveState === "clean" && !s.isDirty && <span>Saved ✓</span>}
  {s.saveState === "error" && (
    <button onClick={s.save} className="pg-row-settings__retry">
      Retry
    </button>
  )}
</div>
```

**Step 4: Wire auto-save on blur**

If `usePageSettings` does not auto-save, add a debounced effect:
```tsx
React.useEffect(() => {
  if (!s.isDirty) return;
  const timer = setTimeout(() => { s.save(); }, 500);
  return () => clearTimeout(timer);
}, [s.isDirty]);
```

**Step 5: Remove showCloseConfirm if isDirty can never be true on close**

If auto-save fires on blur before user can click close, the unsaved-changes dialog becomes unnecessary. Verify this and remove if safe.

**Step 6: Verify**
```bash
npx tsc --noEmit
```

**Step 7: Behavioral check**
- Open page settings → type in SEO title → click outside field
- "Saved ✓" appears automatically — no Save button click needed
- On error: "Retry" button appears

**Step 8: Commit**
```bash
git add src/editor/sidebar/tabs/pages/components/PageRow.tsx
git commit -m "fix(pages): replace manual Save button in inline settings with auto-save on blur"
```

---

### Task ME-6: Remove Non-Functional Drag Handle from Page Rows

**Files:**
- Modify: `src/editor/sidebar/tabs/pages/components/PageRow.tsx:311-323`
- Modify: `src/editor/sidebar/tabs/pages/PagesTab.css` (or wherever `.pg-row__drag` is defined)

**Step 1: Baseline**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 2: Find the drag handle**
```bash
grep -n "pg-row__drag\|drag\|reordering" src/editor/sidebar/tabs/pages/components/PageRow.tsx
```

**Step 3: Delete the drag handle div**

Find and remove (lines 311-323):
```tsx
{/* Drag handle */}
<div
  className="pg-row__drag"
  aria-hidden="true"
  title="Page reordering coming soon"
  style={{ cursor: "default" }}
>
  <span />
  <span />
  <span />
</div>
```

Delete this entire block. Nothing replaces it.

**Step 4: Remove dead CSS**
```bash
grep -rn "pg-row__drag" src/editor/sidebar/tabs/pages/
```

Find the CSS file and delete the `.pg-row__drag` rule block.

**Step 5: Verify**
```bash
npx tsc --noEmit
```

**Step 6: Behavioral check**
- Page rows show: page icon, name, homepage badge, status, settings gear, ··· menu
- No 3-bar drag icon visible
- All existing interactions still work (click to select, rename, context menu)

**Step 7: Commit**
```bash
git add src/editor/sidebar/tabs/pages/components/PageRow.tsx
# Add CSS file if modified
git commit -m "fix(pages): remove non-functional drag handle — reorder ships when ready"
```

---

### Task ME-7: Settings Dirty-State Guard on Tab Switch

**Files:**
- Investigate: `src/editor/sidebar/tabs/SettingsTab.tsx`
- Investigate: `src/editor/sidebar/useSidebarState.ts`

**Step 1: Understand current dirty guard**
```bash
grep -n "isDirty\|dirty\|guard\|unsaved\|handleBack\|onBack" src/editor/sidebar/tabs/SettingsTab.tsx | head -20
```

**Step 2: Find where tab switching happens**
```bash
grep -n "handlePrimaryTabChange\|activePrimaryTab\|onTabChange" src/editor/sidebar/useSidebarState.ts | head -20
```

**Step 3: Read SettingsTab's dirty detection**

Read the relevant section of SettingsTab.tsx. Understand:
- How is `isDirty` determined?
- The guard fires on "back" button — does it also fire on rail click?

**Step 4: Wire dirty guard to tab switch**

The sidebar's `handlePrimaryTabChange` is called when rail buttons are clicked. Intercept it in SettingsTab or pass it down:

Option: In SettingsTab, listen for before-tab-change and prompt:
```tsx
// Expose an onBeforeTabChange prop or use a beforeunload-style pattern
// If isDirty when rail clicked → show ConfirmDialog
// Cancel → stay on Settings; Confirm → discard and switch
```

The exact approach depends on how tab switching flows. Follow the existing pattern for the back-button guard.

**Step 5: Verify**
```bash
npx tsc --noEmit
```

**Step 6: Behavioral check**
- Make a change in Settings (don't save)
- Click another rail tab → confirmation dialog appears
- Cancel → stays on Settings
- Confirm → discards changes, switches tab

**Step 7: Commit**
```bash
git add src/editor/sidebar/tabs/SettingsTab.tsx
git commit -m "fix(settings): dirty-state guard fires on rail tab switch, not just back button"
```

---

### Task ME-8: Publish Disabled State — Show Why

**Files:**
- Modify: `src/editor/sidebar/tabs/PublishTab.tsx`

> Note: ME-1 already added the "not configured" banner for when projectId is missing. This task adds tooltip/message for other disabled reasons.

**Step 1: Find remaining disabled conditions**
```bash
grep -n "disabled\|tooltip\|title=" src/editor/sidebar/tabs/PublishTab.tsx | head -20
```

**Step 2: Check what disables the publish button beyond projectId**

Read the publish flow. Look for conditions like:
- Domain not connected
- Checklist items failing
- Active publishing in progress

**Step 3: Add explanatory message for each disabled reason**

For each condition that disables the button, add a small explanatory note below it:
```tsx
{isPublishing && (
  <p style={{ fontSize: 11, color: "var(--aqb-text-secondary)", marginTop: 4 }}>
    Publishing in progress...
  </p>
)}
```

**Step 4: Verify**
```bash
npx tsc --noEmit
```

**Step 5: Commit**
```bash
git add src/editor/sidebar/tabs/PublishTab.tsx
git commit -m "fix(publish): disabled state now shows explanation for why publishing is unavailable"
```

---

### Task ME-9: Rail Keyboard Navigation — Roving Tabindex

**Files:**
- Modify: `src/editor/rail/LeftRail.tsx`

**Step 1: Read current keyboard handling**
```bash
grep -n "tabIndex\|onKeyDown\|ArrowUp\|ArrowDown\|role=" src/editor/rail/LeftRail.tsx | head -30
```

**Step 2: Understand current focus model**

Read the LeftRail render. Note:
- What role do buttons have?
- Is there any aria-selected?
- How does Tab currently move focus through the rail?

**Step 3: Implement roving tabindex**

The rail buttons form a tab list. Only one should be in the tab order at a time:
```tsx
// Each rail button:
role="tab"
aria-selected={slot.tabId === activeTab}
tabIndex={slot.tabId === activeTab ? 0 : -1}
onKeyDown={(e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    // Focus next rail button
  }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    // Focus previous rail button
  }
}}
```

**Step 4: Add keyboard handler to move focus between slots**

Add a ref array or use `document.querySelectorAll` to find the next/prev focusable rail button and call `.focus()` on it.

**Step 5: Verify**
```bash
npx tsc --noEmit
```

**Step 6: Keyboard check**
- Tab into rail → focus lands on active button
- Arrow Down → focus moves to next rail button
- Arrow Up → focus moves to previous rail button
- Tab from rail → focus leaves rail into panel content

**Step 7: Commit**
```bash
git add src/editor/rail/LeftRail.tsx
git commit -m "fix(rail): implement roving tabindex for keyboard navigation between rail buttons"
```

---

### Task ME-10: Rename tabs/components/ → tabs/component-library/

**Files:**
- Rename directory: `src/editor/sidebar/tabs/components/` → `src/editor/sidebar/tabs/component-library/`
- Update all import paths

**Step 1: Find all importers**
```bash
grep -rn "tabs/components\|from.*['\"]\.\.\/components['\"]" src/editor/sidebar/ --include="*.tsx" --include="*.ts"
```

**Step 2: Rename the directory**
```bash
mv src/editor/sidebar/tabs/components src/editor/sidebar/tabs/component-library
```

**Step 3: Update all import paths found in Step 1**

For each file, change:
```ts
import ... from "../components/...";
// or
import ... from "./tabs/components/...";
```
To:
```ts
import ... from "../component-library/...";
// or
import ... from "./tabs/component-library/...";
```

**Step 4: Update TabRouter.tsx**
```bash
grep -n "ComponentsTab\|component" src/editor/sidebar/TabRouter.tsx
```
Update the import path for ComponentsTab.

**Step 5: Verify**
```bash
npx tsc --noEmit
# All import errors should be resolved
```

**Step 6: Commit**
```bash
git add -A
git commit -m "refactor(structure): rename tabs/components/ to tabs/component-library/ — avoids naming collision with shared UI components"
```

---

### Task ME-11: Rename pages/settings/ → pages/page-settings/

**Files:**
- Rename directory: `src/editor/sidebar/tabs/pages/settings/` → `src/editor/sidebar/tabs/pages/page-settings/`
- Update all import paths

**Step 1: Find all importers**
```bash
grep -rn "pages/settings\|from.*settings" src/editor/sidebar/tabs/pages/ --include="*.tsx" --include="*.ts"
```

**Step 2: Rename the directory**
```bash
mv src/editor/sidebar/tabs/pages/settings src/editor/sidebar/tabs/pages/page-settings
```

**Step 3: Update all import paths**

For each file found in Step 1, update the path from `./settings/...` to `./page-settings/...`.

**Step 4: Verify**
```bash
npx tsc --noEmit
```
```bash
grep -rn "pages/settings" src/
# Expected: empty
```

**Step 5: Commit**
```bash
git add -A
git commit -m "refactor(structure): rename pages/settings/ to pages/page-settings/ — avoids collision with Settings tab name"
```

---

# PHASE 3 — REFACTORS

> **Prerequisite:** All Phase 1 and Phase 2 tasks must be committed before starting Phase 3.
> **RF-5 and RF-6 depend on RF-1 being done first.**

---

### Task RF-1: Decompose TemplatesTab.tsx — Extract Hooks + Components

**Files:**
- Read: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx` (763 lines)
- Read: `src/editor/sidebar/tabs/build/useBuildTab.ts` (pattern reference)
- Create: `src/editor/sidebar/tabs/templates/hooks/useTemplateApply.ts`
- Create: `src/editor/sidebar/tabs/templates/hooks/useTemplateSelection.ts`
- Create: `src/editor/sidebar/tabs/templates/hooks/useTemplatePersistence.ts`
- Modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx` (slim to <200 lines)

**Step 1: Read the full file and pattern reference**
```bash
wc -l src/editor/sidebar/tabs/templates/TemplatesTab.tsx
# Should be ~763 lines
```
Read TemplatesTab.tsx fully. Then read `useBuildTab.ts` for the established extraction pattern.

**Step 2: Baseline type check**
```bash
npx tsc --noEmit 2>&1 | wc -l
```

**Step 3: Create hooks/ directory**
```bash
mkdir -p src/editor/sidebar/tabs/templates/hooks
```

**Step 4: Extract useTemplatePersistence.ts**

Create `src/editor/sidebar/tabs/templates/hooks/useTemplatePersistence.ts`:
```ts
// Responsibilities: appliedId, localStorage save/load
export function useTemplatePersistence() {
  // Move: appliedId state + localStorage read/write from TemplatesTab
  // Return: { appliedId, setAppliedId }
}
```

**Step 5: Extract useTemplateApply.ts**

Create `src/editor/sidebar/tabs/templates/hooks/useTemplateApply.ts`:
```ts
// Responsibilities: apply logic, progress, error handling, retry, canvas count tracking
export function useTemplateApply(composer, addToast, onTemplateUsed) {
  // Move: startApply(), handleProgressComplete(), handleRetry()
  // Move: canvas element count tracking (composer event subscriptions)
  // Move: applyError state, canRetry state, progress state
  // Return: { startApply, handleProgressComplete, handleRetry, applyError, canRetry, canvasElementCount, isApplying }
}
```

**Step 6: Extract useTemplateSelection.ts**

Create `src/editor/sidebar/tabs/templates/hooks/useTemplateSelection.ts`:
```ts
// Responsibilities: selected template, keyboard navigation, filtered list
export function useTemplateSelection(templates, filtered) {
  // Move: selectedId state, keyboard handler logic
  // Return: { selectedId, setSelectedId, handleKeyDown }
}
```

**Step 7: Slim TemplatesTab.tsx**

Import the three hooks. Replace the extracted code with hook calls. Target: <200 lines.

```tsx
export const TemplatesTab = ({ composer, onTemplateUsed, ...headerProps }) => {
  const persistence = useTemplatePersistence();
  const apply = useTemplateApply(composer, addToast, onTemplateUsed);
  const selection = useTemplateSelection(templates, filtered);
  // ... UI rendering only
};
```

**Step 8: Type check after each extraction**
```bash
npx tsc --noEmit
# Run after each hook file is created and wired
```

**Step 9: Verify behavior unchanged**
- Apply a template → progress shows, template applies, Build tab opens
- Cancel mid-apply → apply stopped
- Retry on error → retry works
- Template count in header updates

**Step 10: Commit each hook separately**
```bash
git add src/editor/sidebar/tabs/templates/hooks/useTemplatePersistence.ts
git commit -m "refactor(templates): extract useTemplatePersistence hook"

git add src/editor/sidebar/tabs/templates/hooks/useTemplateApply.ts
git commit -m "refactor(templates): extract useTemplateApply hook"

git add src/editor/sidebar/tabs/templates/hooks/useTemplateSelection.ts
git commit -m "refactor(templates): extract useTemplateSelection hook"

git add src/editor/sidebar/tabs/templates/TemplatesTab.tsx
git commit -m "refactor(templates): slim TemplatesTab.tsx to <200 lines — UI only, composes hooks"
```

---

### Task RF-2: Normalize Tab Entry-Point Convention (All Pattern B)

**Goal:** All tab entry files live inside their module directory. No loose .tsx files at `tabs/` root.

**Files to move:**
```
tabs/HistoryTab.tsx   → tabs/history/HistoryTab.tsx
tabs/SettingsTab.tsx  → tabs/settings/SettingsTab.tsx
tabs/LayersTab.tsx    → tabs/layers/LayersTab.tsx   (create dir)
tabs/PublishTab.tsx   → tabs/publish/PublishTab.tsx  (create dir)
tabs/PagesTab.tsx     → tabs/pages/PagesTab.tsx
tabs/BuildTab.css     → tabs/build/BuildTab.css
tabs/PagesTab.css     → tabs/pages/PagesTab.css
```

**Step 1: Check which files exist at tabs/ root**
```bash
ls src/editor/sidebar/tabs/*.tsx src/editor/sidebar/tabs/*.css 2>/dev/null
```

**Step 2: Create missing module directories**
```bash
mkdir -p src/editor/sidebar/tabs/layers
mkdir -p src/editor/sidebar/tabs/publish
```

**Step 3: Move files one at a time**
```bash
# Example for LayersTab:
mv src/editor/sidebar/tabs/LayersTab.tsx src/editor/sidebar/tabs/layers/LayersTab.tsx
```

**Step 4: Update TabRouter.tsx imports after each move**
```bash
grep -n "LayersTab\|HistoryTab\|SettingsTab\|PublishTab\|PagesTab" src/editor/sidebar/TabRouter.tsx
```
Update each import path to point inside the module dir.

**Step 5: Update CSS imports after each move**

Find where `BuildTab.css` and `PagesTab.css` are imported and update paths.

**Step 6: Type check after each move**
```bash
npx tsc --noEmit
```

**Step 7: Commit each move separately**
```bash
git add -A
git commit -m "refactor(structure): move LayersTab into layers/ module dir"
# Repeat for each file
```

---

### Task RF-3: Reorganize design/ Module — Add components/ hooks/ utils/ Subdirs

**Step 1: Read current design/ structure**
```bash
find src/editor/sidebar/tabs/design/ -type f | sort
```

**Step 2: Create subdirectories**
```bash
mkdir -p src/editor/sidebar/tabs/design/components
mkdir -p src/editor/sidebar/tabs/design/hooks
mkdir -p src/editor/sidebar/tabs/design/utils
```

**Step 3: Move UI components into components/**

Move files like: `ColorPicker.tsx`, `ColorTokenList.tsx`, `ColorTokenRow.tsx`, `TypeTokenList.tsx`, `SpacingTokenList.tsx`, `DesignTabFooter.tsx`, `DraftChip.tsx`, `ExportDropdown.tsx`

**Step 4: Move hooks into hooks/**

Move files from `state/` dir and any root-level hooks into `hooks/`. Rename `state/` → `hooks/`.

Move test files co-located with hooks:
```bash
mv src/editor/sidebar/tabs/design/__tests__/useColorTokens.test.ts \
   src/editor/sidebar/tabs/design/hooks/useColorTokens.test.ts
```

**Step 5: Move utils into utils/**

Move: `colorUtils.ts`, `exportUtils.ts` (or equivalent)

**Step 6: Update all import paths**
```bash
grep -rn "from.*design/" src/editor/sidebar/ --include="*.tsx" --include="*.ts"
```
Update each import to the new paths.

**Step 7: Type check**
```bash
npx tsc --noEmit
```

**Step 8: Commit**
```bash
git add -A
git commit -m "refactor(structure): reorganize design/ module — add components/ hooks/ utils/ subdirs per CLAUDE.md pattern"
```

---

### Task RF-4: Eliminate Dual Style Files in history/ + settings/

**Step 1: Audit current dual style files**
```bash
find src/editor/sidebar/tabs/history src/editor/sidebar/tabs/settings \
  -name "styles.ts" -o -name "*.css" | sort
```

**Step 2: For each module, check which style file is actually used**
```bash
grep -rn "from.*styles\|import.*styles" src/editor/sidebar/tabs/history/ src/editor/sidebar/tabs/settings/
grep -rn "\.css" src/editor/sidebar/tabs/history/ src/editor/sidebar/tabs/settings/
```

**Step 3: Consolidate to CSS only**

For each module:
- If both `styles.ts` (JS style objects) and a `.css` file exist, migrate JS styles to CSS
- Keep CSS file, delete styles.ts
- Update all imports

**Step 4: Verify no visual regressions**
```bash
npx tsc --noEmit
npm run dev  # Visual check
```

**Step 5: Commit each module separately**
```bash
git add src/editor/sidebar/tabs/history/
git commit -m "refactor(history): consolidate to CSS-only styles — remove duplicate styles.ts"

git add src/editor/sidebar/tabs/settings/
git commit -m "refactor(settings): consolidate to CSS-only styles — remove duplicate styles.ts"
```

---

### Task RF-5: Replace Composer as UI Event Bus in TemplatesTab

**Prerequisite:** RF-1 must be complete.

**Step 1: Find all ui:switch-tab emissions in TemplatesTab hooks**
```bash
grep -rn "ui:switch-tab\|emit.*tab" src/editor/sidebar/tabs/templates/
```

**Step 2: Read the hook containing these emissions**

After RF-1, these should be in `useTemplateApply.ts` or the slimmed `TemplatesTab.tsx`.

**Step 3: Replace emissions with callback props**

Instead of:
```ts
composer?.emit?.("ui:switch-tab", { tab: "design" });
```

Use a callback prop:
```ts
// In useTemplateApply hook:
export function useTemplateApply(composer, addToast, onTemplateUsed, onSwitchTab) {
  // ...
  onSwitchTab?.("design");  // ← callback instead of composer emit
}

// In TemplatesTab.tsx, pass the callback:
const apply = useTemplateApply(
  composer,
  addToast,
  onTemplateUsed,
  (tab) => onSwitchTab?.(tab)  // ← prop from parent
);
```

**Step 4: Add onSwitchTab to TemplatesTabProps and wire through TabRouter + LeftSidebar**

```ts
// TemplatesTabProps
onSwitchTab?: (tab: GroupedTabId) => void;
```

In LeftSidebar.tsx, wire:
```tsx
onSwitchTab={(tab) => state.handlePrimaryTabChange(tab)}
```

**Step 5: Verify StudioPanels.tsx composer listener is no longer needed**
```bash
grep -n "ui:switch-tab" src/editor/shell/StudioPanels.tsx
```
If the listener is now dead, remove it.

**Step 6: Verify**
```bash
npx tsc --noEmit
```

**Step 7: Commit**
```bash
git add -A
git commit -m "refactor(templates): replace composer UI event bus with callback prop — engine no longer knows about tab routing"
```

---

### Task RF-6: Full Tab Consolidation per Section C Architecture

**Prerequisite:** RF-1 must be complete.

**Goal:** Implement the Section C architecture recommendations:
- Build tab absorbs Add tab content (or they merge into one expanded view)
- Design + Assets tabs consolidated where overlap exists
- History surfaced in rail (already done via QW-2 pattern)
- Settings + Config consolidated (Config renamed to Settings in QW-1)

**Step 1: Read Section C from the audit file**
```bash
grep -A 100 "## Section C" /path/to/ux-audit-20260308.md | head -120
```
Note the exact before/after architecture proposed.

**Step 2: Read current tabsConfig.ts fully**
```bash
cat src/editor/rail/tabsConfig.ts
```

**Step 3: Read TabRouter.tsx fully**
```bash
cat src/editor/sidebar/TabRouter.tsx
```

**Step 4: Plan the specific consolidation changes**

Based on Section C, identify:
- Which tabs merge?
- What are the new tab IDs?
- How does the routing change?

**Step 5: Update tabsConfig.ts**

Remove merged tabs, update remaining tabs.

**Step 6: Update TabRouter.tsx**

Update routing logic to match new tab structure.

**Step 7: Update LeftRail.tsx**

Rail slots should reflect the new consolidated structure.

**Step 8: Type check**
```bash
npx tsc --noEmit
```

**Step 9: Behavioral check**

Walk through all user journeys:
- Adding elements
- Managing pages
- Applying design tokens
- Publishing

**Step 10: Commit**
```bash
git add -A
git commit -m "refactor(ia): tab consolidation per Section C audit recommendations — reduced cognitive load"
```

---

### Task RF-7: Remove Dead styles.ts Files from history/ + settings/

**Note:** This task completes the cleanup from RF-4 — after RF-4 migrates styles to CSS, any remaining empty or unreferenced `styles.ts` files get deleted.

**Step 1: Check for remaining styles.ts files**
```bash
find src/editor/sidebar/tabs/history src/editor/sidebar/tabs/settings \
  -name "styles.ts" | xargs ls -la 2>/dev/null
```

**Step 2: Confirm they have no remaining importers**
```bash
grep -rn "from.*history/styles\|from.*settings/styles" src/ --include="*.tsx" --include="*.ts"
# Expected: empty
```

**Step 3: Delete them**
```bash
rm src/editor/sidebar/tabs/history/styles.ts 2>/dev/null || true
rm src/editor/sidebar/tabs/settings/styles.ts 2>/dev/null || true
```

**Step 4: Verify**
```bash
npx tsc --noEmit
```

**Step 5: Commit**
```bash
git add -A
git commit -m "chore: delete dead styles.ts files from history/ and settings/ — CSS files are the only style source"
```

---

## DEPENDENCY MAP (Quick Reference)

```
PHASE 1 (any order):
QW-1 → QW-2 → QW-3 → QW-4 → QW-5 → QW-6 → QW-7
QW-8 → QW-9 → QW-10 → QW-11 → QW-12 → QW-13

PHASE 2:
ME-1 ← MUST have QW-9 done first
ME-2 through ME-11 ← independent of each other

PHASE 3:
RF-1 first (always)
RF-2, RF-3, RF-4, RF-7 ← independent of each other
RF-5 ← REQUIRES RF-1
RF-6 ← REQUIRES RF-1
```

## PROGRESS TRACKER

| ID | Task | Status |
|----|------|--------|
| QW-1 | Rail "Config" → "Settings" | 🔲 |
| QW-2 | Add Publish to rail | 🔲 |
| QW-3 | Wire onTemplateUsed | 🔲 |
| QW-4 | Wire onRequestTemplates | 🔲 |
| QW-5 | Media dead link fix | 🔲 |
| QW-6 | TypePills reset | 🔲 |
| QW-7 | TemplatesTab PanelHeader | 🔲 |
| QW-8 | History ConfirmDialog | 🔲 |
| QW-9 | PublishTab props wired | 🔲 |
| QW-10 | Remove showIconRail | 🔲 |
| QW-11 | Gate component creation | 🔲 |
| QW-12 | Fix design icon SSOT | 🔲 |
| QW-13 | Remove dead props | 🔲 |
| ME-1 | Publish checklist dynamic | 🔲 |
| ME-2 | localStorage scoped | 🔲 |
| ME-3 | FavZone during search | 🔲 |
| ME-4 | Template click unified | 🔲 |
| ME-5 | Page settings auto-save | 🔲 |
| ME-6 | Remove drag handle | 🔲 |
| ME-7 | Settings dirty guard | 🔲 |
| ME-8 | Publish disabled state | 🔲 |
| ME-9 | Rail keyboard roving | 🔲 |
| ME-10 | Rename component-library/ | 🔲 |
| ME-11 | Rename page-settings/ | 🔲 |
| RF-1 | Decompose TemplatesTab | 🔲 |
| RF-2 | Normalize entry-points | 🔲 |
| RF-3 | Reorganize design/ | 🔲 |
| RF-4 | Eliminate dual styles | 🔲 |
| RF-5 | Replace composer bus | 🔲 |
| RF-6 | Tab consolidation | 🔲 |
| RF-7 | Delete dead styles.ts | 🔲 |
