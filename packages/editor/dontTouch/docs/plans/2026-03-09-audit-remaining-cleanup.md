# Build Panel Audit — Remaining Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the two remaining open items from the Build Panel UX audit (ux-audit-20260309.md) that were not tracked in Section H.

**Architecture:** Both are isolated single-file or two-file changes. No new components, no new state. Task 1 is pure CSS. Task 2 is a constant extraction — remove a locally-duplicated Record and import the same values from the existing SSOT in `shared/constants/layout.ts`.

**Tech Stack:** TypeScript 5.3 strict, React 18, CSS (no Tailwind), Vite

**Audit status:** All 12 Section H items are ✅ done. This plan covers only F-3 and the Section G SSOT note.

---

## Context: What's Already Done

All of these are committed and complete — do NOT re-implement:

| Item | Status | Commit |
|------|--------|--------|
| QW-1 through QW-5 (5 quick wins) | ✅ | `7e39ff6` |
| ME-1 through ME-5 (5 medium items) | ✅ | `7e39ff6` |
| RF-1 (Layout rename) | ✅ | `7e39ff6` |
| RF-2 (Page Sections tier separator) | ✅ | `0f737a2` |

---

## Task 1: F-3 — FavZone "clear" button contrast fix

**Files:**
- Modify: `src/editor/sidebar/tabs/build/BuildTab.css` (one line)

**Context:** The "clear all favorites" button uses `rgba(239, 68, 68, 0.4)` — approximately 1.5:1 contrast on dark background. WCAG AA requires ≥4.5:1 for normal text. This is a destructive action button that users can barely see. An undo toast already exists (5s window in `BuildTab.tsx:59-71`) so the risk of accidental clear is managed — but the button still needs to be visually findable.

**Step 1: Locate the exact rule**

Open `src/editor/sidebar/tabs/build/BuildTab.css` and search for `.bld-favs-clear` or `rgba(239, 68, 68, 0.4)`. The rule should be around line 457 (may have shifted from earlier edits).

Expected to find:
```css
.bld-favs-clear {
  ...
  color: rgba(239, 68, 68, 0.4);
  ...
}
```

**Step 2: Apply the fix**

Change only the `color` value:
```css
/* BEFORE */
color: rgba(239, 68, 68, 0.4);

/* AFTER */
color: rgba(239, 68, 68, 0.65);
```

Do NOT change hover state, font-size, padding, or any other property.

**Step 3: Verify TypeScript still passes**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

**Step 4: Visual check**

Open the Add panel → expand My Favorites (or add one favorite) → look for the "clear" or "×" button in the Favorites zone header. It should now be a readable (though still subdued) red — not near-invisible.

**Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/build/BuildTab.css
git commit -m "fix(a11y): F-3 — improve FavZone clear button contrast 0.4→0.65 (WCAG AA)"
```

---

## Task 2: SSOT — Extract `DRAWER_SIZE_WIDTHS` from LayoutShell into shared/constants

**Files:**
- Modify: `src/editor/rail/LayoutShell.tsx` (remove local constant, import from shared)
- Modify: `src/shared/constants/layout.ts` (add `DRAWER_SIZE_WIDTHS` export)

**Context:** `shared/constants/layout.ts` already exports:
```ts
export const LAYOUT = {
  DRAWER_WIDTH_COMPACT: 280,
  DRAWER_WIDTH_NORMAL: 320,
  DRAWER_WIDTH_EXTENDED: 400,
  ...
} as const;
```

`LayoutShell.tsx:16-19` defines the EXACT same values locally as a string Record:
```ts
const DRAWER_SIZE_WIDTHS: Record<PanelSizeMode, string> = {
  compact: "280px",
  normal: "320px",
  extended: "400px",
};
```

This is a SSOT violation — two sources of truth for the same drawer dimensions. Fix: add `DRAWER_SIZE_WIDTHS` to `shared/constants/layout.ts` and remove the local definition from `LayoutShell.tsx`.

**Step 1: Add DRAWER_SIZE_WIDTHS to shared/constants/layout.ts**

Open `src/shared/constants/layout.ts`. Add the following export AFTER the existing `LAYOUT` object:

```ts
import type { PanelSizeMode } from "../types/ui";

/** Drawer width CSS strings keyed by size mode — use in inline styles / CSS var injection */
export const DRAWER_SIZE_WIDTHS: Record<PanelSizeMode, string> = {
  compact: `${LAYOUT.DRAWER_WIDTH_COMPACT}px`,
  normal: `${LAYOUT.DRAWER_WIDTH_NORMAL}px`,
  extended: `${LAYOUT.DRAWER_WIDTH_EXTENDED}px`,
};
```

> Note: `PanelSizeMode` is in `src/shared/types/ui.ts`. Check the import path is correct for `shared/types/ui`. If the import creates a circular dependency (shared/types → shared/constants → shared/types), use the string literal type inline instead: `Record<"compact" | "normal" | "extended", string>`.

**Step 2: Update LayoutShell.tsx import**

Open `src/editor/rail/LayoutShell.tsx`. Find the existing import from `../../shared/constants/layout` (or wherever it imports LAYOUT from). Add `DRAWER_SIZE_WIDTHS` to that import:

```ts
// BEFORE (example — check actual import line)
import { LAYOUT } from "../../shared/constants/layout";

// AFTER
import { LAYOUT, DRAWER_SIZE_WIDTHS } from "../../shared/constants/layout";
```

**Step 3: Remove the local DRAWER_SIZE_WIDTHS definition**

In `LayoutShell.tsx`, find and delete these lines:
```ts
const DRAWER_SIZE_WIDTHS: Record<PanelSizeMode, string> = {
  compact: "280px",
  normal: "320px",
  extended: "400px",
};
```

The rest of the file references `DRAWER_SIZE_WIDTHS[drawerSizeMode]` — that usage stays unchanged, it will now use the imported value.

**Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see a circular dependency error on the `PanelSizeMode` import in `layout.ts`, fall back to inline union type:
```ts
export const DRAWER_SIZE_WIDTHS: Record<"compact" | "normal" | "extended", string> = {
```

**Step 5: Verify runtime behavior (smoke test)**

Start the dev server:
```bash
npm run dev
```

- Open the editor → verify the drawer panel opens at 320px (normal mode)
- Click the resize icon in the sidebar footer → switch to compact → verify ~280px
- Switch to extended → verify ~400px

**Step 6: Commit**

```bash
git add src/shared/constants/layout.ts src/editor/rail/LayoutShell.tsx
git commit -m "refactor(ssot): extract DRAWER_SIZE_WIDTHS from LayoutShell into shared/constants/layout"
```

---

## Remaining Hardcoded 280px Audit (reference only — no action required)

From `grep -rn "280px\|: 280," src/editor/`, these are the 280px usages and their status:

| File | Usage | Action needed? |
|------|-------|----------------|
| `LayoutShell.tsx:17` | `DRAWER_SIZE_WIDTHS.compact` | ✅ Fixed by Task 2 |
| `LeftSidebar.tsx:230` | `"Compact (280px)"` string label | ⚠️ Minor — label for UI toggle, cosmetically references the pixel value. Can stay as-is or be `\`Compact (${LAYOUT.DRAWER_WIDTH_COMPACT}px)\`` — low priority |
| `LeftSidebar.css:3127` | `width: 280px` | ❌ Check context — if this is a popover/dropdown (not panel width), it's unrelated and correct. Do not change. |
| `ExportScreen.tsx:169,192` | `maxWidth: 280` | ❌ Export modal content width — not panel width, unrelated |
| `Canvas.css:764` | `max-width: 280px` | ❌ Tooltip or callout width — not panel width, unrelated |
| `KeyboardCheatSheet.tsx:278` | `minmax(280px, 1fr)` | ❌ Grid column min — not panel width, unrelated |
| `templatesData.ts:149,182` | In HTML template strings | ❌ Template content layout — not panel width, unrelated |
| `TemplatesTab.css:828` | `var(--layout-drawer-width, 280px)` | ✅ Already uses CSS var with 280px as fallback — correct pattern |

**Summary:** Only `LayoutShell.tsx:17` is a true SSOT violation (same semantic concept, duplicated constant). The rest are unrelated uses of the number 280.

---

## Verification Checklist (run after both tasks)

```bash
npx tsc --noEmit        # 0 errors required
```

- [ ] FavZone "clear" button is visibly readable red (not near-invisible)
- [ ] Drawer size presets still work: compact=280px, normal=320px, extended=400px
- [ ] No `DRAWER_SIZE_WIDTHS` local definition remains in `LayoutShell.tsx`
- [ ] `shared/constants/layout.ts` exports `DRAWER_SIZE_WIDTHS`

---

*Remaining from ux-audit-20260309.md: 2 items. All 12 Section H items are already ✅ done.*
