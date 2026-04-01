# UX Audit v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the top 8 UX issues identified in the March 7 audit across onboarding, navigation labels, Build panel, Media panel, and save state.

**Architecture:** All changes are surgical edits to existing files — no new components needed. Wave 1 (Tasks 1–6) are quick string/logic fixes (<1 day each). Wave 2 (Tasks 7–8) are medium-effort consolidations.

**Tech Stack:** React 18, TypeScript, Emotion CSS-in-JS, localStorage persistence, Composer event system.

---

## Issue Map

| Task | Audit ID | File | Change |
|------|----------|------|--------|
| 1 | P-07 | `useOnboarding.ts` | Fix "Export" checklist copy → "Publish" |
| 2 | P-03 | `tabsConfig.ts` | Rail label "Config" → "Settings" |
| 3 | P-06 | `HistoryTab.tsx` | Panel title "Versions" → "History" |
| 4 | P-04 | `BuildTab.tsx` | Move MyComponents to bottom; hide when coming-soon |
| 5 | P-09 | `MediaTab.tsx` | Hide UploadZone when OnboardingEmptyState is showing |
| 6 | P-13 | `OnboardingModal.tsx` | Fix "custom domain" copy to be honest |
| 7 | P-01 | `AquibraStudio.tsx` + `useOnboarding.ts` | Remove redundant center modal; reduce checklist 9→5 |
| 8 | P-02 | `StatusIndicators.tsx` | Always show "Last saved X ago" in idle state |

---

## Task 1: Fix Onboarding Checklist "Export" Copy (P-07)

**Files:**
- Modify: `src/shared/hooks/useOnboarding.ts:88-95`

**Context:** The last checklist item (id: "export") says "Go to Settings to export or publish your site" — this is wrong. Publish is in the topbar, not Settings. This actively misdirects users on the core task.

**Step 1: Edit the DEFAULT_STEPS export step**

In `src/shared/hooks/useOnboarding.ts`, find the last item in `DEFAULT_STEPS`:

```ts
// CURRENT (lines 88-94):
{
  id: "export",
  label: "Export your work",
  description: "Go to Settings to export or publish your site",
  completed: false,
},
```

Change to:

```ts
// FIXED:
{
  id: "publish",
  label: "Publish your site",
  description: "Click the Publish button at the top right to make your site live",
  completed: false,
},
```

**Step 2: Verify it renders correctly**

```bash
npm run dev
```

Open the app, open the "Get started" checklist widget. The last item should read "Publish your site" with description "Click the Publish button at the top right to make your site live". The old "Export your work" copy should be gone.

**Step 3: Commit**

```bash
git add src/shared/hooks/useOnboarding.ts
git commit -m "fix(onboarding): correct checklist 'Export' step → 'Publish your site' (P-07)"
```

---

## Task 2: Rename Rail Label "Config" → "Settings" (P-03)

**Files:**
- Modify: `src/editor/rail/tabsConfig.ts` — RAIL_SLOTS array, settings entry

**Context:** The rail icon for `settings` tab is labeled "Config" but the panel it opens is titled "Settings". This creates a mismatch: users who look for "Settings" in the rail can't find it. Single string change, zero risk.

**Step 1: Edit the settings RAIL_SLOT**

In `src/editor/rail/tabsConfig.ts`, find the settings entry in `RAIL_SLOTS` (around line 209):

```ts
// CURRENT:
{
  tabId: "settings",
  label: "Config",
  iconName: "SvgSettings",
  ariaLabel: "Config & Launch",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Site settings and SEO",
},
```

Change to:

```ts
// FIXED:
{
  tabId: "settings",
  label: "Settings",
  iconName: "SvgSettings",
  ariaLabel: "Settings",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Site settings and SEO",
},
```

**Step 2: Verify**

```bash
npm run dev
```

The rail button previously labeled "Config" should now show "Settings". The tooltip should say "Settings" (no longer "Config & Launch"). The panel title already reads "Settings" — they now match.

**Step 3: Commit**

```bash
git add src/editor/rail/tabsConfig.ts
git commit -m "fix(rail): rename 'Config' label → 'Settings' to match panel title (P-03)"
```

---

## Task 3: Rename HistoryTab Panel Title "Versions" → "History" (P-06)

**Files:**
- Modify: `src/editor/sidebar/tabs/HistoryTab.tsx:144`

**Context:** The rail label is "History" (correct, matches user mental model). But the panel `PanelHeader` title reads "Versions". These must match. The fix: change the panel title to "History".

**Step 1: Edit the PanelHeader title**

In `src/editor/sidebar/tabs/HistoryTab.tsx`, find the `PanelHeader` usage (around line 144):

```tsx
// CURRENT:
title="Versions"
```

Change to:

```tsx
// FIXED:
title="History"
```

**Step 2: Verify**

```bash
npm run dev
```

Click the "History" rail icon. The panel header at the top should read "History" (not "Versions"). The view switcher inside the panel still shows "Versions" tab — that's OK and can stay (it's the view mode label, not the panel title).

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/HistoryTab.tsx
git commit -m "fix(history): rename panel title 'Versions' → 'History' to match rail label (P-06)"
```

---

## Task 4: Move MyComponents to Bottom of Build Panel (P-04)

**Files:**
- Modify: `src/editor/sidebar/tabs/build/BuildTab.tsx:111-116`

**Context:** `MyComponents` renders at the TOP of the elements list, above all useful elements. It shows "Components feature coming soon." for all users. This wastes the most valuable panel real estate. Fix: move it to the bottom, after all real elements.

**Step 1: Move MyComponents after the CATALOG.map block**

In `src/editor/sidebar/tabs/build/BuildTab.tsx`, the current layout (lines ~111–128) is:

```tsx
// CURRENT — MyComponents is FIRST, before catalog items:
<MyComponents
  open={tab.myCompOpen}
  onToggle={() => tab.setMyCompOpen(!tab.myCompOpen)}
  composer={composer}
/>
{CATALOG.map((cat) => (
  <CatAccordion ... />
))}
```

Change to:

```tsx
// FIXED — MyComponents is LAST, after catalog items:
{CATALOG.map((cat) => (
  <CatAccordion ... />
))}
<MyComponents
  open={tab.myCompOpen}
  onToggle={() => tab.setMyCompOpen(!tab.myCompOpen)}
  composer={composer}
/>
```

**Step 2: Verify**

```bash
npm run dev
```

Open the Build panel. "My Components" should now appear at the BOTTOM, after Text & Buttons, Structure & Grids, etc. The "coming soon" message should still show when clicked, but no longer blocks access to real elements.

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/build/BuildTab.tsx
git commit -m "fix(build): move MyComponents section to bottom of element list (P-04)"
```

---

## Task 5: Remove Duplicate Upload Files Button in Media Panel (P-09)

**Files:**
- Modify: `src/editor/sidebar/tabs/media/MediaTab.tsx:259-267`

**Context:** When the media library is empty, BOTH `OnboardingEmptyState` (which has an "Upload files" button inside it) AND `UploadZone` (another "Upload files" button at the bottom) render simultaneously. Two buttons for the same action = confusing. Fix: hide UploadZone when the empty state is already showing.

**Step 1: Add condition to UploadZone rendering**

In `src/editor/sidebar/tabs/media/MediaTab.tsx`, find the UploadZone render block (lines ~259-267):

```tsx
// CURRENT:
{/* Zone 7: Upload zone (Library only) */}
{!isDisc && (
  <UploadZone
    storage={state.storage}
    onUpload={state.upload}
    uploadQueue={state.uploadQueue}
    disabled={isFull}
  />
)}
```

Change to:

```tsx
// FIXED: hide when OnboardingEmptyState is already showing (it has its own upload button)
{!isDisc && !(isEmpty && !state.selMode) && (
  <UploadZone
    storage={state.storage}
    onUpload={state.upload}
    uploadQueue={state.uploadQueue}
    disabled={isFull}
  />
)}
```

**Step 2: Verify**

```bash
npm run dev
```

Open the Media panel on a fresh project (empty library). You should see ONLY the `OnboardingEmptyState` card with one "Upload files" button — no second button below it. After uploading at least one file, the `UploadZone` should reappear at the bottom (since `isEmpty` is now false).

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/media/MediaTab.tsx
git commit -m "fix(media): hide duplicate UploadZone when empty-state already shows upload button (P-09)"
```

---

## Task 6: Fix Onboarding "Custom Domain" Copy (P-13)

**Files:**
- Modify: `src/editor/onboarding/OnboardingModal.tsx:29-32`

**Context:** Step 3 of OnboardingModal says "Your site goes live instantly on your custom domain." Custom domains are "Coming Soon" in the product. This is a false promise that erodes trust when users try to connect a domain. Fix the copy to be honest.

**Step 1: Update step 3 body copy**

In `src/editor/onboarding/OnboardingModal.tsx`, find step 3 in the `STEPS` array (lines ~29-32):

```ts
// CURRENT:
{
  title: "Preview & Publish",
  body: "Preview your site across devices, then publish with one click. Your site goes live instantly on your custom domain.",
  icon: "🚀",
},
```

Change to:

```ts
// FIXED — honest about free domain, custom domain coming soon:
{
  title: "Preview & Publish",
  body: "Preview your site across devices, then publish with one click. Your site gets a free Buildrik URL. Custom domain support coming soon.",
  icon: "🚀",
},
```

**Step 2: Verify**

```bash
npm run dev
```

Clear `localStorage` (DevTools → Application → Storage → Clear site data) to re-trigger onboarding. Step 3 of the modal should now show the corrected copy — no mention of "instantly on your custom domain".

**Step 3: Commit**

```bash
git add src/editor/onboarding/OnboardingModal.tsx
git commit -m "fix(onboarding): remove false 'custom domain' promise, reference free Buildrik URL (P-13)"
```

---

## Task 7: Remove Redundant Center Modal + Reduce Checklist 9→5 (P-01)

**Files:**
- Modify: `src/editor/shell/AquibraStudio.tsx` — remove OnboardingModal render
- Modify: `src/shared/hooks/useOnboarding.ts` — reduce DEFAULT_STEPS to 5 core items

**Context:** Three onboarding systems run simultaneously:
1. `TourOverlay` — 3-step spotlight tour (Templates → Canvas → Publish) — KEEP
2. `OnboardingModal` — 3-step center modal (Pick template → Customize → Publish) — REMOVE (duplicate of TourOverlay)
3. `OnboardingProgress` — 9-item "Get started" checklist — REDUCE to 5 core items

`OnboardingModal` and `TourOverlay` are functionally identical. Keep TourOverlay (it's the better, more contextual implementation). Remove the center modal.

For the checklist, 9 items is overwhelming. The core task is "build and publish a page" — 5 items cover this. Remove "Save a component" (power user), "Use undo/redo" (discoverable), "Use a shortcut" (P1 concern), "Create a page" (not Day 1 critical for P2).

**Step 1: Remove OnboardingModal from AquibraStudio.tsx**

In `src/editor/shell/AquibraStudio.tsx`, find and remove:

```tsx
// REMOVE these lines:
const [showOnboarding, setShowOnboarding] = React.useState(() => !isOnboardingComplete());
```

Also remove the `handleOnboardingDone` callback (grep for it) and the render block:

```tsx
// REMOVE:
{showOnboarding && (
  <OnboardingModal onComplete={handleOnboardingDone} onSkip={handleOnboardingDone} />
)}
```

Also remove the now-unused import at the top:

```tsx
// REMOVE:
import { OnboardingModal, isOnboardingComplete, markOnboardingComplete } from "../onboarding/OnboardingModal";
```

**Step 2: Verify import cleanup**

After removing, check if `isOnboardingComplete` or `markOnboardingComplete` are used anywhere else:

```bash
grep -r "isOnboardingComplete\|markOnboardingComplete\|OnboardingModal\|handleOnboardingDone\|showOnboarding" src/editor/shell/AquibraStudio.tsx
```

Expected: 0 results. If any remain, remove them.

**Step 3: Reduce DEFAULT_STEPS from 9 to 5**

In `src/shared/hooks/useOnboarding.ts`, replace `DEFAULT_STEPS` (lines 40-95) with:

```ts
const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "add-element",
    label: "Add an element",
    description: "Drag an element from the Build panel to your canvas",
    completed: false,
  },
  {
    id: "edit-text",
    label: "Edit text",
    description: "Double-click any text element to edit its content",
    completed: false,
  },
  {
    id: "change-style",
    label: "Change a style",
    description: "Select an element and modify its styles in the inspector",
    completed: false,
  },
  {
    id: "preview",
    label: "Preview your site",
    description: "Click Preview to see your site across devices",
    completed: false,
  },
  {
    id: "publish",
    label: "Publish your site",
    description: "Click the Publish button at the top right to make your site live",
    completed: false,
  },
];
```

**Step 4: Verify**

```bash
npm run dev
```

On first load (clear localStorage first): only the TourOverlay spotlight tour should appear (no center modal overlay). The "Get started" checklist at the bottom should show "0 of 5 complete!" (not "0 of 9"). The last checklist item should be "Publish your site".

**Step 5: Commit**

```bash
git add src/editor/shell/AquibraStudio.tsx src/shared/hooks/useOnboarding.ts
git commit -m "fix(onboarding): remove redundant center modal; reduce checklist 9→5 core steps (P-01)"
```

---

## Task 8: Always Show Save Status Label in Idle State (P-02)

**Files:**
- Modify: `src/editor/shell/StatusIndicators.tsx:55`

**Context:** `SaveStatusIndicator` hides itself when `status === "idle" && !justSaved` (line 55). This means users can never confirm their work is saved unless a save just happened. The cloud icon badge "1" is the only persistent indicator but is ambiguous. Fix: always show "Last saved X ago" in idle state.

**Step 1: Remove the early return that hides idle state**

In `src/editor/shell/StatusIndicators.tsx`, find and modify line ~55:

```tsx
// CURRENT — hides indicator in idle state:
if (status === "idle" && !justSaved) return null;
```

Change to:

```tsx
// FIXED — always show (even when idle, show last saved time):
// Remove this line entirely (delete the early return)
```

**Step 2: Update the idle statusConfig label**

Still in `StatusIndicators.tsx`, the `statusConfig.idle` entry (around line 57-62):

```tsx
// CURRENT:
idle: {
  color: "var(--status-saved, #22c55e)",
  bg: "rgba(34, 197, 94, 0.1)",
  label: "Saved ✓",
  icon: <SvgCheck />,
},
```

Change to:

```tsx
// FIXED — show relative time in idle, brief "Saved ✓" when justSaved:
idle: {
  color: justSaved ? "var(--status-saved, #22c55e)" : "var(--aqb-text-secondary, #94a3b8)",
  bg: justSaved ? "rgba(34, 197, 94, 0.1)" : "transparent",
  label: justSaved ? "Saved ✓" : `Saved ${formatLastSaved(lastSavedAt)}`,
  icon: justSaved ? <SvgCheck /> : <SvgSave />,
},
```

**Step 3: Verify**

```bash
npm run dev
```

In the topbar, a save status label should always be visible. When idle and not just saved, it should show something like "Saved 3m ago" in muted text. After a save completes, it should briefly flash "Saved ✓" in green, then revert to "Saved X ago". When `lastSavedAt` is undefined (project never saved), it should show "Not saved yet".

**Step 4: Commit**

```bash
git add src/editor/shell/StatusIndicators.tsx
git commit -m "fix(topbar): always show save status label in idle state (P-02)"
```

---

## Verification Checklist

After all 8 tasks, verify:

```bash
npm run dev
```

| # | Test | Expected |
|---|------|----------|
| 1 | Open "Get started" checklist | Last item: "Publish your site — Click the Publish button..." |
| 2 | Look at rail bottom section | Second label reads "Settings" (not "Config") |
| 3 | Click History rail icon | Panel header reads "History" (not "Versions") |
| 4 | Open Build panel | "My Components" is at the BOTTOM, below all element categories |
| 5 | Open Media panel (empty library) | Only ONE "Upload files" button visible |
| 6 | Clear localStorage, reload | Step 3 of onboarding says "free Buildrik URL...Custom domain support coming soon" |
| 7 | Clear localStorage, reload | No center modal appears — only TourOverlay spotlight tour |
| 7b | Open "Get started" checklist | Shows "0 of 5 complete!" |
| 8 | Look at topbar | Save status always visible ("Saved X ago" or "Saved ✓") |
