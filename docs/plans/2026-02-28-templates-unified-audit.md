# Templates Feature — Unified Audit & Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate structural debt, dead code, and UX defects across the Templates feature and its shell integration.

**Architecture:** Bottom-up fix order — structural violations first (root causes), then code anti-patterns (symptoms), then UX improvements (surface layer). Each phase builds on a cleaner foundation from the previous.

**Tech Stack:** React 18, TypeScript strict, Vite, CSS custom properties (`--aqb-*`), `createPortal`, `composer.elements.importHTMLToActivePage`, `composer.history.undo`

---

## PART 1 — PROJECT STRUCTURE AUDIT

### Annotated Folder Tree (`src/editor/`)

```
src/editor/
├── shell/                      ← App shell — layout, header, panels
│   ├── AquibraStudio.tsx       ← Root editor component (512 lines)
│   ├── StudioPanels.tsx        ← GOD COMPONENT (659 lines) ⚠️ VIOLATION
│   ├── hooks/
│   │   ├── useTemplateManager.ts  ← DEAD — wraps composer.templates, never used ⚠️ L0
│   │   └── ...
│   └── modals/
├── sidebar/
│   └── tabs/
│       └── templates/
│           ├── TemplatesTab.tsx       ← MIXED RESPONSIBILITY (560 lines) ⚠️
│           ├── TemplatePreviewModal.tsx
│           ├── TemplateUseDrawer.tsx  ← ORPHANED APPLY FLOW ⚠️
│           ├── TemplatesTabModals.tsx
│           ├── ApplyProgressOverlay.tsx
│           ├── templatesData.ts       ← HARDCODED template list (SSOT violation) ⚠️
│           ├── templatesIcons.tsx     ← DEAD FILE (337 lines, zero consumers) ⚠️ L0
│           └── index.ts
├── canvas/                     ← Canvas UI (/drago domain)
├── inspector/                  ← Right panel (/shadow domain)
├── media/                      ← Unclear purpose, separate from sidebar/tabs/media/
└── ...
```

### Structural Violations

| #   | Condition                                                         | Location                                                                                 | Severity | Cost                                                                                      |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| V1  | SSOT violation — 3 parallel template systems                      | `templatesData.ts` / `useTemplateManager.ts` / `src/templates/`                          | CRITICAL | Any template feature change requires updating 3 places                                    |
| V2  | Dual apply flows — two complete paths to `importHTMLToActivePage` | `TemplatesTab.tsx` vs `StudioPanels.tsx:handleTemplateApply`                             | CRITICAL | The StudioPanels flow is unreachable from normal navigation; dead logic that will diverge |
| V3  | L0 dead files                                                     | `templatesIcons.tsx` (337 lines), `useTemplateManager.ts`                                | CRITICAL | Misleads future devs; upward import in templatesIcons crosses domain boundary             |
| V4  | God component — 6+ mixed responsibilities                         | `StudioPanels.tsx` (659 lines)                                                           | MEDIUM   | Every feature touches it; impossible to test independently                                |
| V5  | Upward domain import                                              | `templatesIcons.tsx` imports `SectionType` from `../../../../templates/SectionTemplates` | MEDIUM   | `editor/` layer depends on root `src/templates/` — inverted dependency direction          |
| V6  | Ambiguous ownership                                               | `src/editor/media/` vs `src/editor/sidebar/tabs/media/`                                  | LOW      | Two media folders, unclear which is authoritative                                         |

### Target Structure

```
src/editor/sidebar/tabs/templates/
├── TemplatesTab.tsx          ← UI only (no business logic)
├── useTemplatesState.ts      ← NEW: all state + handlers extracted here
├── TemplatePreviewModal.tsx  ← unchanged
├── TemplatesTabModals.tsx    ← unchanged
├── ApplyProgressOverlay.tsx  ← unchanged
├── templatesData.ts          ← data only (no localStorage logic)
├── templatesStorage.ts       ← NEW: localStorage read/write isolated here
└── index.ts                  ← clean barrel

DELETED:
├── templatesIcons.tsx        ← L0, zero consumers
```

```
src/editor/shell/
├── AquibraStudio.tsx         ← unchanged
├── StudioPanels.tsx          ← SLIMMED: layout only (~200 lines)
├── hooks/
│   ├── useBlockInsertion.ts  ← EXTRACTED from StudioPanels
│   ├── useTemplateApply.ts   ← EXTRACTED — single apply path (replaces handleTemplateApply)
│   └── ...

DELETED:
├── hooks/useTemplateManager.ts  ← L0, unused
```

### Migration Phases

**Phase 1 — No-risk deletions (no functionality change)**

- Delete `templatesIcons.tsx` (0 consumers)
- Delete `useTemplateManager.ts` (0 consumers)
- Remove `TemplateUseDrawer` + `TemplateApplyConfig` and related types from `StudioPanels.tsx` — the TemplatesTab apply flow replaces it

**Phase 2 — Extract and isolate**

- Extract localStorage logic from `TemplatesTab.tsx` into `templatesStorage.ts`
- Extract all state + handler logic from `TemplatesTab.tsx` into `useTemplatesState.ts`
- `TemplatesTab.tsx` becomes pure JSX consuming the hook

**Phase 3 — Unify the apply path**

- Delete `StudioPanels.tsx:handleTemplateApply` (the unreachable path)
- Delete `showUseTemplateDrawer`, `drawerTemplate`, `handleDrawerClose` state from `StudioPanels.tsx`
- Delete `<TemplateUseDrawer>` render from `StudioPanels.tsx`
- `TemplatesTab.tsx` is the single apply path

**Phase 4 — Establish guard rails**

- Add ESLint `no-restricted-imports` rule: `src/editor/` cannot import from `src/templates/`
- Add barrel policies: `templates/index.ts` exports only `TemplatesTab` and data types

---

## PART 2 — CODE QUALITY AUDIT

### Summary Table

| Anti-Pattern          | Instances                                  |
| --------------------- | ------------------------------------------ |
| Pass-through wrappers | 5 (all methods in `useTemplateManager.ts`) |
| Middle-man            | 1 (`useTemplateManager.ts` as a whole)     |
| Duplicate logic       | 3                                          |
| SSOT violations       | 2                                          |
| Mixed responsibility  | 2                                          |
| Dead code             | 4                                          |
| Over-fragmented flow  | 1                                          |
| Hidden side effects   | 2                                          |
| High coupling         | 2                                          |

### Detailed Findings

---

**PATTERN:** Pass-through wrappers + Middle-man
**LOCATION:** `src/editor/shell/hooks/useTemplateManager.ts` lines 62–115 (all 5 methods)
**INSTANCE:** Every method delegates directly to `composer.templates.*` with no transformation. The hook exists only to hold a `isLoading` boolean that no consumer reads.
**HARM:** Dead abstraction layer. Any call to `composer.templates` looks like it needs to go through this hook. New devs will use it thinking it's the canonical path — it's not. TemplatesTab bypasses it entirely.
**REFACTORED:** Delete the file. If loading state is needed later, add it at the call site.
**EFFORT:** Low

---

**PATTERN:** Duplicate logic
**LOCATION A:** `TemplatesTab.tsx:201–248` (`handleProgressComplete`)
**LOCATION B:** `StudioPanels.tsx:279–386` (`handleTemplateApply`)
**INSTANCE:** Both functions call `composer.elements.importHTMLToActivePage(template.html)`, both call `addRecentTemplate()`, both show success toast with undo action. The StudioPanels version additionally handles `create-page`, `replace-current`, `new-site`, `insert-page` modes that are unreachable in normal flow.
**HARM:** Bug fix in one place never reaches the other. The StudioPanels path has a bug: it calls `composer.elements.createPage()` but doesn't call `composer.endTransaction()` in the page creation paths — only in the outer finally.
**REFACTORED:** Single function in `useTemplatesState.ts`:

```typescript
function applyTemplate(template: TemplateItem): void {
  if (!composer) return;
  composer.beginTransaction("apply-template");
  try {
    if (resetStyles) composer.styles.clear();
    composer.elements.importHTMLToActivePage(template.html);
    addRecentTemplate({
      id: template.id,
      name: template.name,
      icon: template.icon,
      html: template.html,
    });
    setAppliedId(template.id);
    addToast({
      message: `"${template.name}" applied`,
      variant: "success",
      action: { label: "Undo", onClick: () => composer.history?.undo?.() },
    });
  } catch (err) {
    setApplyError(err instanceof Error ? err.message : "Failed to apply");
  } finally {
    composer.endTransaction();
  }
}
```

**EFFORT:** Medium

---

**PATTERN:** SSOT violation
**LOCATION:** `src/editor/sidebar/tabs/templates/templatesData.ts` vs `src/editor/shell/hooks/useTemplateManager.ts` vs `src/templates/SectionTemplates.tsx`
**INSTANCE:** Three separate template data systems. `templatesData.ts` has 10 hardcoded site templates. `useTemplateManager.ts` wraps `composer.templates` (engine-backed). `src/templates/SectionTemplates.tsx` has section-level templates. None are connected.
**HARM:** Adding a template requires knowing which system is active. Currently hardcoded list cannot be extended without code changes.
**REFACTORED:** `templatesData.ts` stays as the source for UI-layer hardcoded site templates (intentional for v1 without backend). `useTemplateManager.ts` deleted. `src/templates/` is a separate domain — do not import from it in `editor/`.
**EFFORT:** Low (delete, don't merge)

---

**PATTERN:** Mixed responsibility
**LOCATION:** `TemplatesTab.tsx` (560 lines)
**INSTANCE:** Combines: filter/search state, keyboard shortcuts, template selection, apply orchestration, localStorage writes (onboarding dismissal), toast management, undo countdown timer, history integration, card grid rendering, nudge bar rendering, modal orchestration.
**HARM:** Cannot unit test apply logic without rendering the full component. Keyboard handler at line 124 references `handleUseThis` which is defined at line 171 — implicit ordering dependency.
**REFACTORED:** Extract to `useTemplatesState.ts` hook (all state + handlers). `TemplatesTab.tsx` becomes:

```typescript
export const TemplatesTab: React.FC<TemplatesTabProps> = ({ composer, onTemplateUsed }) => {
  const state = useTemplatesState({ composer, onTemplateUsed });
  return <TemplatesTabView {...state} />;
};
```

**EFFORT:** High

---

**PATTERN:** Dead code
**LOCATION:** `src/editor/sidebar/tabs/templates/templatesIcons.tsx`
**INSTANCE:** 337-line file with `WireframeIcon`, `TemplatePreviewPlaceholder`, `PreviewIcon`, `PagesIcon`, `SectionsIcon`, `BookmarkIcon`, `TemplateChevronIcon`, `GroupIcon`, `TemplateCheckIcon`, `highlightMatch`. Zero imports in `src/editor/`. Also imports from `../../../../templates/SectionTemplates` — an upward domain violation.
**HARM:** Dead code that has an upward import — if `SectionTemplates.tsx` changes its `SectionType`, this file will break TypeScript compilation for no reason.
**REFACTORED:** Delete the file.
**EFFORT:** Low

---

**PATTERN:** Dead code — deprecated props
**LOCATION:** `TemplatesTab.tsx:57–66` (TemplatesTabProps)
**INSTANCE:** `onPagesOpen`, `searchQuery`, `flatMode`, `onTemplateSelect`, `selectedTemplateId` — all marked `@deprecated`, all ignored in implementation.
**HARM:** API surface that will be passed by callers who don't read deprecation notices, silently doing nothing.
**REFACTORED:**

```typescript
export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
}
```

**EFFORT:** Low (verify callers don't rely on them first)

---

**PATTERN:** Hidden side effects
**LOCATION A:** `TemplatesTab.tsx:197` inside `startApply()`
**LOCATION B:** `TemplatesTab.tsx:232` inside `handleProgressComplete()`
**INSTANCE A:** `localStorage.setItem(STORAGE_KEYS.ONBOARDING, ...)` fires silently during template apply — nothing in the function name signals this.
**INSTANCE B:** `addRecentTemplate()` writes to `localStorage` without declaration in the function contract.
**HARM:** Testing requires mocking localStorage. Side effects in apply path can cause failures unrelated to template apply.
**REFACTORED:** Extract to dedicated `templatesStorage.ts`:

```typescript
// src/editor/sidebar/tabs/templates/templatesStorage.ts
export function dismissOnboarding(): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING,
      JSON.stringify({ dismissed: true, reason: "template-applied" })
    );
  } catch {
    /* ignore */
  }
}
export function recordApplied(template: Pick<TemplateItem, "id" | "name" | "icon" | "html">): void {
  addRecentTemplate(template); // delegates to templatesData.ts
}
```

Both called explicitly by name at the apply callsite.
**EFFORT:** Low

---

**PATTERN:** High coupling
**LOCATION:** `StudioPanels.tsx`
**INSTANCE:** Directly imports and uses: `composer.elements` (3 methods), `composer.selection` (2 methods), `composer.history`, `composer.styles`, `composer.emit`, `composer.on/off` (5 event subscriptions), `TemplateUseDrawer`, `TemplatePreviewPanel`, `getBlockDefinitions`, `insertBlock`, `canNestElement`, `useToast`, `addRecentTemplate`, Canvas, ProInspector, LeftSidebar, LayoutShell, LeftRail, PageTabBar, CanvasFooterToolbar.
**HARM:** Changing any of 15+ dependencies requires opening StudioPanels. 659 lines means merge conflicts happen weekly.
**REFACTORED:** Extract `useBlockInsertion.ts` (lines 400–486), remove template apply logic (use TemplatesTab's own path). StudioPanels becomes a layout orchestrator only.
**EFFORT:** High

---

### Dependency Map

```
V3 (dead files with upward imports)
  ↓ causes
V5 (domain boundary violation)
  ↓ causes
V1 (SSOT — 3 template systems)
  ↓ causes
Anti-pattern 3 (duplicate logic)
  ↓ causes
Anti-pattern 9 (high coupling in StudioPanels)
  ↓ causes
Anti-pattern 5 (mixed responsibility in TemplatesTab and StudioPanels)
  ↓ causes
UX Issue #U4 (applied state lost on tab close — hard to fix without clean state layer)
```

### Refactor Priority Order

1. Delete dead files (L0 cleanup — unblocks all else)
2. Remove deprecated props from TemplatesTabProps
3. Delete StudioPanels apply flow + TemplateUseDrawer usage
4. Extract `templatesStorage.ts`
5. Extract `useTemplatesState.ts` hook
6. Slim `TemplatesTab.tsx` to JSX-only
7. Extract `useBlockInsertion.ts` from StudioPanels

---

## PART 3 — UX/UI AUDIT

### Mental Model Summary

1. Users expect clicking a template card to "preview" it — but nothing happens on canvas; the panel nudge bar changes instead. The canvas-level preview only exists inside `TemplatePreviewModal`.
2. "Select" (click card) and "Applied" (green border after use) look similar enough that users will re-apply an already-applied template thinking they need to "confirm" their selection.
3. The 30-second undo countdown is the ONLY recovery path. After it expires, there is no UI to get back to the previous state. Users assume undo is always available.
4. "Auto-saved" text in the ReplaceModal creates false confidence — the system uses undo history, not a persistent save point.
5. PRO templates have a different click behavior (opens preview directly) vs FREE templates (selects card) — inconsistent interaction model that confuses keyboard and screen reader users.

### Journey Audit Table

| Stage                    | Status      | Issue                                                                                                                                                          |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open Tab                 | ⚠️ MEDIUM   | `appliedId` is local React state — resets on tab close. User has no way to know what template is currently applied to their canvas                             |
| Browse / Select          | ⚠️ MEDIUM   | `tcard--sel` (blue) and `tcard--applied` (green) borders look similar at a glance. "Selected" = I clicked it; "Applied" = it's on canvas. Users confuse these. |
| Preview                  | ✅ PASS     | TemplatePreviewModal renders correctly. D/T/M toggle works. Dark background gap fixed.                                                                         |
| Apply — empty canvas     | ✅ PASS     | Skips ReplaceModal, goes directly to progress overlay                                                                                                          |
| Apply — existing content | ⚠️ MEDIUM   | ReplaceModal shows "✓ Auto-saved" which is false — undo history is not a save                                                                                  |
| Reset / Undo             | 🔴 CRITICAL | After 30s countdown, no recovery UI exists. Composer's undo is available but no entry point shown                                                              |
| Error handling           | ✅ PASS     | Error banner + retry shown correctly                                                                                                                           |
| Success confirmation     | ⚠️ MEDIUM   | Applied banner disappears on tab close. No session persistence of applied state                                                                                |
| Unsaved changes guard    | N/A         | Browse-only tab, no editable fields                                                                                                                            |

### Gap Analysis by Dimension

**Information Hierarchy — MEDIUM**
Problem: Nudge bar (primary CTA) is the same visual weight as filter pills and search.
Fix: Increase nudge bar's visual distinctiveness — thicker top border or raised shadow.

**Grouping & Proximity — LOW**
Problem: Quick-action buttons (Customize styles, View history) appear between the applied banner and the card grid — no visual group separator.
Fix: Add `tpl-quick-actions` a clear 8px gap + section label "Next steps".

**Editing Flow — N/A**
This is browse-only; no editing flow applies.

**Preview Experience — MEDIUM**
Problem: FREE card click = card selected (no canvas change). Preview only available inside full-screen modal. Users don't know clicking the card does anything until they see the nudge bar change.
Fix: Show tooltip on first card click: "Click 'Apply Template →' below to use this on your canvas".

**Apply / Reset Behavior — CRITICAL**
Problem: No reset path after undo expires.
Fix: Make undo persistent while the applied banner is visible (no countdown — just always available while banner is shown). Banner is dismissible manually; dismissing it = user accepts the applied state.

**Feedback States — MEDIUM**
Problem: "Auto-saved" is a false promise.
Fix: Replace with: "Undo available immediately after applying" or simply remove the line and add undo affordance in the modal footer.

**Microcopy & Labels — MEDIUM**
Problem: "Replace with This →" doesn't convey scope (sections + layout + optionally styles).
Fix: "Apply & Replace Canvas →" with a "(changes layout & content)" subtitle.

**Accessibility — MEDIUM (2 issues)**
Problem 1: Cards use `role="option"` without a `role="listbox"` parent container. Invalid ARIA.
Fix: Add `role="listbox" aria-label="Available templates" aria-multiselectable="false"` to `.tpl-cards-grid`.

Problem 2: Focus not trapped in TemplatePreviewModal on open.
Fix: Add focus trap effect:

```typescript
React.useEffect(() => {
  const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}, []);
```

**Responsive / Small Screen — LOW**
Problem: At panel width 280px, nudge bar buttons may overflow on long template names.
Fix: Nudge bar `flex-wrap: wrap` with name on first line, buttons on second.

**Non-Technical User Usability — MEDIUM**
Problem: "Selected" state (card click) produces no visible canvas change, causing confusion.
Fix: Update nudge bar hint text to: "Selected: click the button below to apply" (currently shows "Hover to preview" which appears after selection, not before).

### Edge Case Matrix

| Edge Case                | Current Behavior                                         | Required Fix                                           |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Invalid input            | N/A — browse only                                        | ✅ Not applicable                                      |
| No changes               | N/A                                                      | ✅ Not applicable                                      |
| Unsaved nav              | N/A                                                      | ✅ Not applicable                                      |
| Failed apply             | Error banner + retry toast                               | ✅ Handled                                             |
| Long template names      | `title` attr + CSS truncation                            | ✅ Handled                                             |
| Concurrent edits         | No handling — canvas silently stale                      | MEDIUM: No action needed unless multi-user is in scope |
| Partial save / timeout   | 15s timeout → error path                                 | ✅ Handled                                             |
| Reset after undo expires | No UI — trapped                                          | 🔴 CRITICAL: Persistent undo in banner                 |
| Small screen             | May overflow at 280px                                    | LOW: flex-wrap nudge bar                               |
| Keyboard-only            | Arrow nav works, Enter applies                           | MEDIUM: Focus trap missing in modals                   |
| Screen reader            | `aria-label` on cards ✓, but state changes not announced | MEDIUM: `aria-live="polite"` wrapper                   |

### Prioritized Issue List

```
SEVERITY: Critical
ISSUE: No undo path after 30-second countdown expires
WHY IT MATTERS: User applies wrong template, timer runs out, canvas is permanently changed with no recovery UI
CURRENT STATE: 30s countdown; after expiry, undo button and banner both disappear
RECOMMENDED FIX: Remove countdown from Undo button. Make banner dismissible manually. Undo available any time banner is visible.

SEVERITY: Critical
ISSUE: role="option" cards without role="listbox" parent — invalid ARIA
WHY IT MATTERS: Screen readers will not announce card selection correctly; AT may crash or skip cards
CURRENT STATE: .tpl-cards-grid has no ARIA role; cards have role="option"
RECOMMENDED FIX: Add role="listbox" aria-label="Available templates" aria-multiselectable="false" to .tpl-cards-grid div

SEVERITY: Medium
ISSUE: "Auto-saved" in ReplaceModal is false — no save system exists
WHY IT MATTERS: Users proceed with false confidence that their canvas is saved; they can't get it back after undo expires
CURRENT STATE: "✓ Auto-saved — your current version is saved before applying"
RECOMMENDED FIX: Replace with "Undo will be available immediately after applying"

SEVERITY: Medium
ISSUE: Applied template state lost on tab close
WHY IT MATTERS: Users re-open templates tab and can't see which template is applied to their canvas
CURRENT STATE: appliedId is local React state, resets on unmount
RECOMMENDED FIX: Store appliedId in sessionStorage. Re-hydrate in useTemplatesState init.

SEVERITY: Medium
ISSUE: Focus not moved or trapped when TemplatePreviewModal opens
WHY IT MATTERS: Keyboard and screen reader users do not enter the modal on open
CURRENT STATE: createPortal renders to body but no focus management
RECOMMENDED FIX: useEffect on mount: focus first focusable element inside modal

SEVERITY: Medium
ISSUE: Nudge bar hint "Hover to preview" shown after card is selected
WHY IT MATTERS: After clicking a card, user sees "Hover to preview" — suggests they need to hover, not that they should click the button below
CURRENT STATE: nudgeMeta shows "Hover to preview" when no template selected; this never updates on selection
RECOMMENDED FIX: Show "Click 'Apply Template →' to use this" when a card is selected

SEVERITY: Low
ISSUE: PRO card click (opens preview) vs FREE card click (selection) — inconsistent behavior
WHY IT MATTERS: Users learn "clicking = selecting" on FREE cards; PRO cards break that mental model
CURRENT STATE: isLocked → setPreviewId(id); else → setSelectedId()
RECOMMENDED FIX: All card clicks → setSelectedId() (or preview); keep PRO gate at the nudge bar CTA level

SEVERITY: Low
ISSUE: INSIGHTS bar has no credibility signal
WHY IT MATTERS: "SaaS templates most used in your niche" reads as made-up data to sophisticated users
CURRENT STATE: Hardcoded strings per category
RECOMMENDED FIX: Rewrite as tips/suggestions: "Tip: Landing pages with video hero convert 3× better (Source: HubSpot)"
```

### Recommended Interaction Model

**Button hierarchy:**

- Primary (filled, purple): "Apply Template →"
- Secondary (ghost): "Preview →", "Cancel", "← Back"
- Destructive (no standalone button — destructive actions gated behind ReplaceModal confirmation)

**Confirmation pattern for Apply to existing content:**

```
ReplaceModal changes:
- REMOVE: "✓ Auto-saved — your current version is saved before applying"
- ADD:    "↩ You can undo this immediately after applying"
- Keep all other content unchanged
```

**Persistent undo pattern:**

```
Applied banner: show ↩ Undo button (no countdown text, no timer)
Banner stays until user dismisses it with × button
Dismissing = "I accept this applied state"
```

**Applied state persistence:**

```typescript
// On successful apply:
sessionStorage.setItem("aqb-applied-template-id", id);
// On tab mount:
const persisted = sessionStorage.getItem("aqb-applied-template-id");
if (persisted) setAppliedId(persisted);
```

---

## PART 4 — IMPLEMENTATION PLAN

---

### Task 1: Delete L0 dead file — templatesIcons.tsx

**Files:**

- Delete: `src/editor/sidebar/tabs/templates/templatesIcons.tsx`

**Step 1: Verify zero imports**

```bash
grep -r "templatesIcons" src/editor/
```

Expected: no output

**Step 2: Delete the file**

```bash
rm src/editor/sidebar/tabs/templates/templatesIcons.tsx
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no new errors from this deletion

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(templates): delete L0 dead file templatesIcons.tsx (337 lines, zero consumers)"
```

---

### Task 2: Delete L0 dead hook — useTemplateManager.ts

**Files:**

- Delete: `src/editor/shell/hooks/useTemplateManager.ts`
- Check: `src/editor/shell/hooks/index.ts`

**Step 1: Verify zero imports**

```bash
grep -r "useTemplateManager" src/
```

Expected: only the file itself (or index.ts re-export)

**Step 2: Remove re-export from hooks/index.ts if present**
Open `src/editor/shell/hooks/index.ts`, remove any line referencing `useTemplateManager`.

**Step 3: Delete the file**

```bash
rm src/editor/shell/hooks/useTemplateManager.ts
```

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no new errors

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(shell): delete L0 useTemplateManager hook (never consumed by TemplatesTab)"
```

---

### Task 3: Remove deprecated props from TemplatesTabProps

**Files:**

- Modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`

**Step 1: Check all callers of TemplatesTab**

```bash
grep -r "TemplatesTab" src/ --include="*.tsx" --include="*.ts" -l
```

**Step 2: For each caller, confirm no deprecated props are passed**
Look for: `onPagesOpen`, `searchQuery`, `flatMode`, `onTemplateSelect`, `selectedTemplateId` passed at call sites.

**Step 3: Remove deprecated props from the interface**

In `TemplatesTab.tsx`, replace the `TemplatesTabProps` interface:

```typescript
export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
}
```

Remove the destructured deprecated params from the component signature:

```typescript
export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer,
  onTemplateUsed,
}) => {
```

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: callers with deprecated props now show TS errors — fix each caller by removing those props.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(templates): remove 5 deprecated props from TemplatesTabProps"
```

---

### Task 4: Delete the unreachable TemplateUseDrawer apply flow from StudioPanels

**Files:**

- Modify: `src/editor/shell/StudioPanels.tsx`

**Step 1: Identify the dead block**

In `StudioPanels.tsx`, find and remove:

- Line: `import { TemplateUseDrawer, type TemplateApplyConfig } from "../sidebar/tabs/templates/TemplateUseDrawer";`
- State: `showUseTemplateDrawer`, `drawerTemplate`
- Handlers: `handleUseTemplate`, `handleDrawerClose`, `handleTemplateApply` (lines ~267–386)
- Render: `<TemplateUseDrawer ... />` (lines ~649–654)

**Step 2: Check onTemplateSelect prop** (passed from StudioPanels → LeftSidebar)

```typescript
onTemplateSelect = { handleTemplateSelect };
```

`handleTemplateSelect` sets `selectedTemplate` for `TemplatePreviewPanel`. This is NOT the apply flow — keep it.

Only remove `handleUseTemplate` (which opened the drawer) and the drawer itself.

**Step 3: Verify TemplatePreviewPanel.onUseTemplate**

In `StudioPanels.tsx` at the `TemplatePreviewPanel` render:

```typescript
<TemplatePreviewPanel
  template={selectedTemplate}
  composer={composer}
  onUseTemplate={handleUseTemplate}   // ← THIS CALLS THE DRAWER
  onClose={() => setSelectedTemplate(null)}
  visible={!!selectedTemplate}
/>
```

Check `TemplatePreviewPanel`'s `onUseTemplate` prop type — if it's required, stub it:

```typescript
onUseTemplate={() => {}} // TemplatesTab handles apply; preview panel is read-only here
```

Or better: confirm `TemplatePreviewPanel` is for the canvas-side preview (not the sidebar), so it may need its own apply path or the prop can be removed if unused.

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(shell): remove unreachable TemplateUseDrawer apply flow from StudioPanels"
```

---

### Task 5: Extract localStorage operations into templatesStorage.ts

**Files:**

- Create: `src/editor/sidebar/tabs/templates/templatesStorage.ts`
- Modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`

**Step 1: Create the storage module**

```typescript
// src/editor/sidebar/tabs/templates/templatesStorage.ts
import { STORAGE_KEYS } from "../../../../shared/constants/storageKeys";
import { addRecentTemplate } from "./templatesData";
import type { TemplateItem } from "./templatesData";

/** Dismiss onboarding when user applies a template */
export function dismissOnboarding(): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING,
      JSON.stringify({ dismissed: true, reason: "template-applied" })
    );
  } catch {
    /* ignore storage errors */
  }
}

/** Record template as recently used */
export function recordTemplateApplied(
  template: Pick<TemplateItem, "id" | "name" | "icon" | "html">
): void {
  addRecentTemplate(template);
}

/** Persist applied template ID across tab opens */
export function saveAppliedId(id: string): void {
  try {
    sessionStorage.setItem("aqb-applied-template-id", id);
  } catch {
    /* ignore */
  }
}

/** Restore applied template ID from session */
export function loadAppliedId(): string | null {
  try {
    return sessionStorage.getItem("aqb-applied-template-id");
  } catch {
    return null;
  }
}
```

**Step 2: Update TemplatesTab.tsx imports and call sites**

Replace in `startApply()`:

```typescript
// BEFORE:
try {
  localStorage.setItem(
    STORAGE_KEYS.ONBOARDING,
    JSON.stringify({ dismissed: true, reason: "template-applied" })
  );
} catch {
  /* ignore storage errors */
}

// AFTER:
dismissOnboarding();
```

Replace in `handleProgressComplete()`:

```typescript
// BEFORE:
addRecentTemplate({ id: t.id, name: t.name, icon: t.icon, html: t.html });

// AFTER:
recordTemplateApplied(t);
saveAppliedId(id);
```

**Step 3: Hydrate appliedId on mount**

In `TemplatesTab.tsx`, add after state declarations:

```typescript
// Restore applied ID from session (survives tab close within same browser session)
React.useEffect(() => {
  const persisted = loadAppliedId();
  if (persisted) setAppliedId(persisted);
}, []);
```

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(templates): extract localStorage ops into templatesStorage.ts + persist appliedId"
```

---

### Task 6: Fix UX — Persistent undo (remove countdown, keep banner)

**Files:**

- Modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`

**Step 1: Remove undo countdown state and timer**

Remove:

- `const [undoCountdown, setUndoCountdown] = React.useState(0);`
- `const undoTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);`
- `React.useEffect(() => () => { if (undoTimerRef.current) clearInterval(undoTimerRef.current); }, []);`
- The entire `setUndoCountdown(30); if (undoTimerRef.current) clearInterval...; undoTimerRef.current = setInterval(...)` block in `handleProgressComplete`

**Step 2: Simplify applied banner**

Replace the conditional undo button:

```tsx
// BEFORE (countdown-based):
{
  undoCountdown > 0 && (
    <button
      className="tpl-undo-btn"
      onClick={() => {
        composer?.history?.undo?.();
        setAppliedId(null);
        setUndoCountdown(0);
        if (undoTimerRef.current) {
          clearInterval(undoTimerRef.current);
          undoTimerRef.current = null;
        }
      }}
      aria-label={`Undo template apply (${undoCountdown} seconds remaining)`}
    >
      ↩ {undoCountdown}s
    </button>
  );
}

// AFTER (persistent, no countdown):
<button
  className="tpl-undo-btn"
  onClick={() => {
    composer?.history?.undo?.();
    setAppliedId(null);
    try {
      sessionStorage.removeItem("aqb-applied-template-id");
    } catch {
      /* ignore */
    }
  }}
  aria-label="Undo template apply"
>
  ↩ Undo
</button>;
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Verify no undoTimerRef or undoCountdown references remain**

```bash
grep -n "undoCountdown\|undoTimerRef" src/editor/sidebar/tabs/templates/TemplatesTab.tsx
```

Expected: no output

**Step 5: Commit**

```bash
git add -A
git commit -m "fix(templates): make undo persistent — remove 30s countdown, keep banner until dismissed"
```

---

### Task 7: Fix ARIA — add role="listbox" to card grid

**Files:**

- Modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`

**Step 1: Find the card grid div**

Locate: `<div className="tpl-cards-grid">` (inside the `filtered.length > 0` branch).

**Step 2: Add ARIA role**

```tsx
// BEFORE:
<div className="tpl-cards-grid">

// AFTER:
<div
  className="tpl-cards-grid"
  role="listbox"
  aria-label="Available templates"
  aria-multiselectable="false"
>
```

**Step 3: Verify card role is still "option"**
Cards already have `role="option"` — this is now valid with the listbox parent. ✓

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add -A
git commit -m "fix(a11y): add role=listbox to template card grid — WCAG 2.1 fix"
```

---

### Task 8: Fix ARIA — focus trap in TemplatePreviewModal

**Files:**

- Modify: `src/editor/sidebar/tabs/templates/TemplatePreviewModal.tsx`

**Step 1: Add a ref to the modal container**

After `const iframeRef = React.useRef<HTMLIFrameElement>(null);`, add:

```typescript
const modalRef = React.useRef<HTMLDivElement>(null);
```

**Step 2: Focus first element on mount**

```typescript
React.useEffect(() => {
  const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
    'button, [href], input, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}, []); // empty deps — runs once on mount
```

**Step 3: Attach ref to modal div**

```tsx
// BEFORE:
<div
  className={`tmpl-preview ${isClosing ? "tmpl-preview--closing" : ""}`}

// AFTER:
<div
  ref={modalRef}
  className={`tmpl-preview ${isClosing ? "tmpl-preview--closing" : ""}`}
```

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add -A
git commit -m "fix(a11y): focus trap in TemplatePreviewModal — move focus to first button on open"
```

---

### Task 9: Fix microcopy — ReplaceModal "Auto-saved" false promise

**Files:**

- Modify: `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx`

**Step 1: Find the misleading copy**

Line ~49–51 in `TemplatesTabModals.tsx`:

```tsx
<div className="tpl-modal-info-text">
  ✓ Auto-saved — your current version is saved before applying
</div>
```

**Step 2: Replace with truthful copy**

```tsx
<div className="tpl-modal-info-text">↩ You can undo this immediately after applying</div>
```

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx
git commit -m "fix(templates): replace false 'Auto-saved' microcopy with accurate undo promise"
```

---

### Task 10: Fix UX — nudge bar hint text when card is selected

**Files:**

- Modify: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`

**Step 1: Find nudgeMeta**

Lines ~117–121:

```typescript
const nudgeMeta = !selectedTpl
  ? "Hover to preview"
  : isAppliedSel
    ? "Applied · want to change?"
    : `${selectedTpl.pageCount ?? 1} pages · ${selectedTpl.status === "premium" ? "Pro" : "Free"}`;
```

**Step 2: Update the unselected hint**

```typescript
const nudgeMeta = !selectedTpl
  ? "Select a template to get started"
  : isAppliedSel
    ? "Applied · want to replace it?"
    : `${selectedTpl.pageCount ?? 1} pages · ${selectedTpl.status === "premium" ? "Pro" : "Free"} · click the button to apply`;
```

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/templates/TemplatesTab.tsx
git commit -m "fix(templates): improve nudge bar hint text to guide user to click Apply"
```

---

### Task 11: Extract useBlockInsertion hook from StudioPanels

**Files:**

- Create: `src/editor/shell/hooks/useBlockInsertion.ts`
- Modify: `src/editor/shell/StudioPanels.tsx`

**Step 1: Create the hook**

```typescript
// src/editor/shell/hooks/useBlockInsertion.ts
import * as React from "react";
import { getBlockDefinitions, insertBlock } from "../../../blocks/blockRegistry";
import type { Composer } from "../../../engine";
import type { BlockData } from "../../../shared/types";
import { canNestElement } from "../../../shared/utils/nesting";
import { useToast } from "../../../shared/ui/Toast";

export function useBlockInsertion(composer: Composer | null) {
  const { addToast } = useToast();
  const [isInsertingBlock, setIsInsertingBlock] = React.useState(false);

  const handleBlockClick = React.useCallback(
    (block: BlockData) => {
      if (isInsertingBlock) return;
      if (!composer) {
        addToast({ message: "Editor not ready. Please wait.", variant: "warning" });
        return;
      }
      setIsInsertingBlock(true);
      composer.beginTransaction("insert-block-sidebar");
      try {
        const page = composer.elements.getActivePage();
        if (!page) {
          addToast({ message: "No active page. Please select a page first.", variant: "error" });
          return;
        }
        const root = composer.elements.getElement(page.root.id);
        if (!root) {
          addToast({ message: "Page root element not found.", variant: "error" });
          return;
        }
        const def = getBlockDefinitions().find((b) => b.id === block.id);
        if (!def) {
          addToast({ message: `Block "${block.label}" not found in registry.`, variant: "error" });
          return;
        }
        const selectedIds = composer.selection.getSelectedIds();
        let parentId = root.getId();
        let insertIndex: number | undefined = root.getChildCount();
        if (selectedIds.length === 1) {
          const selectedEl = composer.elements.getElement(selectedIds[0]);
          if (selectedEl) {
            const selectedType = selectedEl.getType();
            const canContain = canNestElement(def.elementType, selectedType);
            if (canContain) {
              parentId = selectedEl.getId();
              insertIndex = selectedEl.getChildCount?.() ?? 0;
            } else {
              const parentEl = selectedEl.getParent();
              if (parentEl) {
                const siblingIndex = parentEl
                  .getChildren()
                  .findIndex((c) => c.getId() === selectedEl.getId());
                parentId = parentEl.getId();
                insertIndex = siblingIndex >= 0 ? siblingIndex + 1 : undefined;
              }
            }
          }
        }
        const insertedId = insertBlock(composer, def, parentId, insertIndex);
        if (insertedId) {
          const el = composer.elements.getElement(insertedId);
          if (el) composer.selection.select(el);
          addToast({ message: `Inserted: ${block.label}`, variant: "success", duration: 2000 });
        } else {
          addToast({ message: `Failed to insert "${block.label}".`, variant: "error" });
        }
      } catch (err) {
        addToast({
          message: `Error inserting block: ${err instanceof Error ? err.message : "Unknown error"}`,
          variant: "error",
        });
      } finally {
        composer.endTransaction();
        setTimeout(() => setIsInsertingBlock(false), 150);
      }
    },
    [composer, addToast, isInsertingBlock]
  );

  return { handleBlockClick, isInsertingBlock };
}
```

**Step 2: Update StudioPanels.tsx**

Replace the inline block insertion logic (lines ~170–172 and ~400–486) with:

```typescript
const { handleBlockClick } = useBlockInsertion(composer);
```

Remove `isInsertingBlock` state and the entire `handleBlockClick` function from StudioPanels.

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(shell): extract useBlockInsertion hook — StudioPanels no longer owns insertion logic"
```

---

### Task 12: Add ESLint guard — prevent editor/ from importing src/templates/

**Files:**

- Modify: `.eslintrc.*` or `eslint.config.*` (whichever exists at repo root or package root)

**Step 1: Find the ESLint config**

```bash
ls -la /Users/shahg/Desktop/aquibra-opencode/packages/new-editor-l2/ | grep eslint
```

**Step 2: Add import restriction rule**

In the ESLint config's `rules` section:

```json
"no-restricted-imports": ["error", {
  "patterns": [{
    "group": ["**/src/templates/**"],
    "message": "editor/ must not import from src/templates/ — use editor/sidebar/tabs/templates/ data instead"
  }]
}]
```

**Step 3: Verify the rule fires on a test case**

```bash
npx eslint src/editor/sidebar/tabs/templates/templatesIcons.tsx --rule '{"no-restricted-imports": ["error", {"patterns": [{"group": ["**/templates/SectionTemplates"], "message": "test"}]}]}'
```

Expected: would have reported the violation (file is now deleted so this is historical verification)

**Step 4: Commit**

```bash
git add .eslintrc.*
git commit -m "chore(lint): add no-restricted-imports rule preventing editor/ → src/templates/ upward import"
```

---

## Execution Notes

**Total tasks:** 12
**Estimated phases:**

- Tasks 1–4: L0 deletions + dead code removal (1–2 hours)
- Tasks 5–6: Storage + undo fixes (1 hour)
- Tasks 7–10: UX + a11y fixes (1 hour)
- Tasks 11–12: Refactor + guard rails (1–2 hours)

**Run after each task:**

```bash
npx tsc --noEmit
```

**Run after all tasks complete:**

```bash
npm run test
```
