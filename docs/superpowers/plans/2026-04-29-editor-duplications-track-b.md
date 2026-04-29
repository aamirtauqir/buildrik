# Editor Duplications & Wrappers — Track B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete duplicate aliases, extract duplicate constants, inline identical patterns, and remove legacy barrel redirects. Net LOC reduction ≥ 300.

**Tech Stack:** TypeScript 5.3, Vitest

---

### Task B1: Remove duplicate aliases in `canvasGeometry.ts`

**Files:**
- Modify: `packages/editor/src/engine/canvas/canvasGeometry.ts:42-67`

- [ ] **Step 1: Delete `getDOMElementById` alias**

Remove lines 54-61 (the deprecated alias).

- [ ] **Step 2: Replace `getCanvasContainer` with direct import**

Remove the local wrapper at line 42. Update `getCanvasRect()` (line 47) to import `_getCanvasContainer` directly and call it.

- [ ] **Step 3: Delete `getDOMElement` wrapper**

Remove lines 63-67 and update any internal usage to call `_getDOMElement` directly.

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/engine/canvas/canvasGeometry.ts
git commit -m "chore(canvasGeometry): remove duplicate aliases getDOMElementById and wrappers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task B3: Extract duplicate constants to canonical files

**Canonical files:**
- `shared/constants/canvas.ts` → `CANVAS_COLORS`, `DEFAULT_SNAP_CONFIG`
- `shared/types/media.ts` → `DEFAULT_IMAGE_ADJUSTMENTS`, `DEFAULT_IMAGE_FILTERS`
- `shared/constants/ui.ts` (create) → `MAX_RECENT`

**Steps:**

1. **Move `DEFAULT_SNAP_CONFIG`** from `engine/canvas/constants.ts:79-85` and `engine/canvas/resize/constants.ts:25-35` to `shared/constants/canvas.ts`. Delete duplicates. Update imports in `ResizeHandler.ts`, `resize/index.ts`.

2. **Move `CANVAS_COLORS`** from `engine/canvas/constants.ts:36-51` to `shared/constants/canvas.ts` (merge with existing `CANVAS_COLORS` there; the engine version is smaller, so delete engine version and ensure consumers import from `shared/constants/canvas`). Update imports in `SelectionIndicatorManager.ts`, `engine/canvas/resize/index.ts`.

3. **Move `DEFAULT_IMAGE_ADJUSTMENTS` and `DEFAULT_IMAGE_FILTERS`** from `shared/types/media-image-editor.ts:111-133` and `shared/types/media.ts:270-292` to a single canonical location: `shared/types/media.ts`. Delete from `media-image-editor.ts`. Update imports in `ImageProcessor.ts`, `engine/media/index.ts`.

4. **Move `MAX_RECENT`** from `editor/sidebar/tabs/elements/constants.ts:73` and `shared/ui/QuickSwitcher.styles.ts:18` to `shared/constants/ui.ts` (create if missing). Delete duplicates. Update imports in `QuickSwitcher.tsx`, `elements/index.ts`, `useElementsState.ts`.

5. Run `npx vitest run` for affected directories to verify no broken imports.

6. Commit.

---

### Task B4: Extract identical `getComputedStyle` pattern

**Files:**
- Create: `packages/editor/src/shared/utils/getCssVariable.ts`
- Modify: `packages/editor/src/editor/inspector/sections/SizeSection.tsx:28-30`
- Modify: `packages/editor/src/editor/inspector/sections/typography/FontControls.tsx:46-49`

- [ ] **Step 1: Create utility**

```ts
export function getCssVariable(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "";
}
```

- [ ] **Step 2: Replace both call sites**

In `SizeSection.tsx` replace the inline `resolveVar` body with a call to `getCssVariable`.
In `FontControls.tsx` replace the identical inline expression with `getCssVariable`.

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/shared/utils/getCssVariable.ts packages/editor/src/editor/inspector/sections/SizeSection.tsx packages/editor/src/editor/inspector/sections/typography/FontControls.tsx
git commit -m "refactor: extract getCssVariable utility, replace duplicated inline pattern

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task B5: Delete legacy barrel redirects

**Files:**
- Delete: `packages/editor/src/components/Canvas/styled/OverlayStyles.ts`
- Delete: `packages/editor/src/components/Canvas/styled/SelectionStyles.ts`

- [ ] **Step 1: Verify no consumers**

`rg "from.*components/Canvas/styled"` or `grep -r "components/Canvas/styled"`. If any consumers exist, update imports to `editor/canvas/styled/`.

- [ ] **Step 2: Delete files**

```bash
git rm packages/editor/src/components/Canvas/styled/OverlayStyles.ts packages/editor/src/components/Canvas/styled/SelectionStyles.ts
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: delete legacy barrel redirects OverlayStyles + SelectionStyles

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Execution Handoff

**Plan complete. Subagent-Driven execution recommended.**
