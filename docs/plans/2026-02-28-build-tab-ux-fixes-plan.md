# Build Tab UX Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 critical bugs and 6 medium UX issues in the Build Tab element insertion panel across 3 phases.

**Architecture:** Phase 1 fixes data-only mismatches in `catalog/catalog.ts`. Phase 2 adds UX feedback to `useBlockInsertion.ts`, `BuildTab.tsx`, `TipsFooter.tsx`, `FavZone.tsx`, and `useBuildTab.ts`. Phase 3 removes dead code and adds test coverage.

**Tech Stack:** React 18 · TypeScript strict · Vitest (jsdom) · localStorage

**Design doc:** `docs/plans/2026-02-28-build-tab-ux-audit-design.md`

---

## Pre-flight check

Before starting any task, run from `packages/new-editor-l2/`:

```bash
npx tsc --noEmit
npx vitest run
```

Both must pass cleanly before you touch anything.

---

## PHASE 1 — Data Correctness

### Task 1: Add `disabled` field to ElEntry type

**Files:**

- Modify: `src/editor/sidebar/tabs/build/catalog/types.ts`

**Context:** `ElEntry` defines the shape of every element card in the catalog. We need a `disabled` flag so "Custom Code" and "Analytics" cards can be rendered as grayed-out stubs with "Coming Soon" tooltip, instead of inserting a plain `text` element.

**Step 1: Modify `ElEntry` to add optional `disabled` field**

In `src/editor/sidebar/tabs/build/catalog/types.ts`, add `disabled` to `ElEntry`:

```typescript
export interface ElEntry {
  /** Display name */
  name: string;
  /** SVG inner HTML (rendered inside <svg viewBox="0 0 24 24">) */
  iconHtml: string;
  /** Block registry ID for canvas insertion */
  blockId: string;
  /** One-line description shown in tooltip and search */
  description: string;
  /** Semantic search aliases (lowercase) */
  tags: string[];
  /**
   * If true, card is non-interactive with a "Coming Soon" tooltip.
   * Used when blockId has no matching registry entry yet.
   */
  disabled?: boolean;
}
```

**Step 2: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/build/catalog/types.ts
git commit -m "feat(build-tab): add disabled field to ElEntry type"
```

---

### Task 2: Fix blockId mismatches in catalog.ts

**Files:**

- Modify: `src/editor/sidebar/tabs/build/catalog/catalog.ts`

**Context:** 6 elements have incorrect `blockId` values that insert the wrong element on click. This task fixes them using data-only changes — no new block configs needed yet.

Issues to fix:

- **Wishlist** (E-Commerce) → `blockId: "social-icons"` — remove from catalog (no wishlist block exists)
- **Label** (Text & Buttons) → `blockId: "text"` → change to `"label"` (`labelBlockConfig` exists in Forms)
- **Custom Code** (Advanced) → `blockId: "text"` → add `disabled: true`
- **Analytics** (Advanced) → `blockId: "text"` → add `disabled: true`
- **Badge** (Text & Buttons) → `blockId: "text"` — keep but add comment noting registry gap
- **iFrame** (Advanced) → `blockId: "video-embed"` — keep as acceptable proxy, add comment

**Step 1: Fix Label blockId**

In `catalog.ts`, under the `basic` category, find the Label entry and change:

```typescript
// BEFORE
{
  name: "Label",
  blockId: "text",
  description: "Tag-style label for categorizing content",
  tags: ["tag", "category", "metadata", "chip"],
},

// AFTER
{
  name: "Label",
  // labelBlockConfig exists in src/blocks/Forms/
  blockId: "label",
  description: "Tag-style label for categorizing content",
  tags: ["tag", "category", "metadata", "chip"],
},
```

**Step 2: Add `disabled: true` to Custom Code and Analytics**

In `catalog.ts`, under the `advanced` category:

```typescript
{
  name: "Custom Code",
  iconHtml: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  // TODO(C2): custom-code block not in registry yet — tracked in Phase 3
  blockId: "text",
  disabled: true,
  description: "Raw HTML, CSS or JavaScript code block",
  tags: ["html", "css", "javascript", "code", "script", "raw"],
},
```

```typescript
{
  name: "Analytics",
  iconHtml:
    '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  // TODO(C2): analytics/custom-code block not in registry yet — tracked in Phase 3
  blockId: "text",
  disabled: true,
  description: "Analytics or tracking script snippet",
  tags: ["tracking", "google analytics", "metrics", "pixel", "tag"],
},
```

**Step 3: Remove Wishlist from E-Commerce**

In the `ecom` category, delete the entire Wishlist entry (the one with `blockId: "social-icons"`).

**Step 4: Add comment to Badge and iFrame**

Badge (Text & Buttons category):

```typescript
{
  name: "Badge",
  // TODO(C2): badge block not in registry yet; "text" is a placeholder — tracked in Phase 3
  blockId: "text",
  description: "Small pill label for status or counts",
  tags: ["tag", "chip", "label", "pill", "status", "count"],
},
```

iFrame (Advanced category):

```typescript
{
  name: "iFrame",
  // Using video-embed as proxy for MVP. Create dedicated iframe block in Phase 3.
  blockId: "video-embed",
  description: "Inline frame to embed any external URL",
  tags: ["iframe", "embed url", "external page", "widget"],
},
```

**Step 5: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/editor/sidebar/tabs/build/catalog/catalog.ts
git commit -m "fix(build-tab): fix 6 blockId mismatches in catalog — remove Wishlist, fix Label, disable Custom Code/Analytics"
```

---

### Task 3: Render disabled state in ElCard

**Files:**

- Modify: `src/editor/sidebar/tabs/build/components/ElCard.tsx`

**Context:** When `el.disabled` is true, the card should look grayed out, not be draggable, not respond to click, and show "Coming Soon" in its title tooltip.

**Step 1: Write the test**

Create `src/editor/sidebar/tabs/build/components/ElCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ElCard } from "./ElCard";
import type { FlatElEntry } from "../catalog/types";

const baseEl: FlatElEntry = {
  name: "Button",
  blockId: "button",
  description: "Clickable action button",
  tags: [],
  iconHtml: "",
  catId: "basic",
  catName: "Text & Buttons",
};

const disabledEl: FlatElEntry = {
  ...baseEl,
  name: "Custom Code",
  blockId: "text",
  disabled: true,
  description: "Raw HTML/CSS/JS code block",
};

describe("ElCard — disabled state", () => {
  it("disabled card does not call onClick when clicked", async () => {
    const onClick = vi.fn();
    const onDragStart = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <ElCard
        el={disabledEl}
        isFav={false}
        onDragStart={onDragStart}
        onClick={onClick}
        onToggleFav={onToggleFav}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Custom Code/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disabled card shows Coming Soon in title", () => {
    render(
      <ElCard
        el={disabledEl}
        isFav={false}
        onDragStart={vi.fn()}
        onClick={vi.fn()}
        onToggleFav={vi.fn()}
      />
    );

    const card = screen.getByRole("button", { name: /Custom Code/i });
    expect(card.title).toContain("Coming Soon");
  });

  it("enabled card calls onClick when clicked", async () => {
    const onClick = vi.fn();

    render(
      <ElCard
        el={baseEl}
        isFav={false}
        onDragStart={vi.fn()}
        onClick={onClick}
        onToggleFav={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Button/i }));
    expect(onClick).toHaveBeenCalledWith(baseEl);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npx vitest run src/editor/sidebar/tabs/build/components/ElCard.test.tsx
```

Expected: FAIL — `onClick` is called even for disabled cards.

**Step 3: Update ElCard to handle disabled**

In `src/editor/sidebar/tabs/build/components/ElCard.tsx`, update the component:

```typescript
export const ElCard: React.FC<ElCardProps> = ({
  el,
  isFav,
  onDragStart,
  onClick,
  onToggleFav,
  showRemove = false,
}) => {
  const [dragging, setDragging] = React.useState(false);
  const isDisabled = el.disabled === true;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(el);
    }
  };

  const handleClick = () => {
    if (!isDisabled) onClick(el);
  };

  const titleText = isDisabled
    ? `${el.name} — Coming Soon`
    : `${el.name} — ${el.description}\nDrag to canvas or click to add below selection`;

  return (
    <div
      className={`bld-el-card${dragging ? " bld-el-card--dragging" : ""}${isDisabled ? " bld-el-card--disabled" : ""}`}
      draggable={!isDisabled}
      onDragStart={(e) => {
        if (isDisabled) { e.preventDefault(); return; }
        setDragging(true);
        onDragStart(e, el);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={isDisabled
        ? `${el.name} — Coming Soon`
        : `${el.name} — ${el.description}. Drag to canvas or click to add.`
      }
      aria-disabled={isDisabled || undefined}
      title={titleText}
    >
      <div className="bld-el-drag-handle" aria-hidden="true">⠿</div>
      <div className="bld-el-icon">
        <SvgIcon html={el.iconHtml} />
      </div>
      <span className="bld-el-name">{el.name}</span>

      {isDisabled ? (
        <span className="bld-el-soon" aria-hidden="true">Soon</span>
      ) : showRemove ? (
        <button
          className="bld-fav-remove"
          onClick={(e) => { e.stopPropagation(); onToggleFav(el.name); }}
          aria-label={`Remove ${el.name} from favorites`}
        >
          <svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" /></svg>
        </button>
      ) : (
        <button
          className={`bld-el-fav${isFav ? " bld-el-fav--on" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFav(el.name); }}
          aria-label={isFav ? `Remove ${el.name} from favorites` : `Add ${el.name} to favorites`}
          aria-pressed={isFav}
        >
          <svg viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      )}
    </div>
  );
};
```

Add CSS for the disabled state in `src/editor/sidebar/tabs/BuildTab.css` (find the file first, append these rules):

```css
/* Disabled element card (Coming Soon state) */
.bld-el-card--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: auto; /* keep so title tooltip shows */
}

.bld-el-card--disabled:hover {
  background: inherit;
}

.bld-el-soon {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--aqb-text-muted);
  text-transform: uppercase;
  line-height: 1;
  flex-shrink: 0;
}
```

**Step 4: Run tests**

```bash
cd packages/new-editor-l2 && npx vitest run src/editor/sidebar/tabs/build/components/ElCard.test.tsx
```

Expected: 3 PASS.

**Step 5: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/editor/sidebar/tabs/build/components/ElCard.tsx \
        src/editor/sidebar/tabs/build/components/ElCard.test.tsx \
        src/editor/sidebar/tabs/BuildTab.css
git commit -m "feat(build-tab): render disabled cards as Coming Soon, non-interactive"
```

---

## PHASE 2 — Feedback Quality

### Task 4: Add `getSuggestedParents` to validator.ts

**Files:**

- Modify: `src/shared/utils/nesting/validator.ts`
- Create: `src/shared/utils/nesting/validator.test.ts`

**Context:** `getSuggestedParents(childType, limit)` returns the most useful container types that can hold a given child element. It filters `getValidDropTargets` to prefer common container types. This is the prerequisite for the C1 nesting error toast.

**Step 1: Write the test**

Create `src/shared/utils/nesting/validator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getSuggestedParents } from "./validator";

describe("getSuggestedParents", () => {
  it("returns container-like types for a heading element", () => {
    const suggestions = getSuggestedParents("heading");
    // heading can go in container, section, flex, grid, etc.
    expect(suggestions.length).toBeGreaterThan(0);
    // should prioritize container types
    const hasContainer = suggestions.some((t) =>
      ["container", "section", "flex", "grid"].includes(t)
    );
    expect(hasContainer).toBe(true);
  });

  it("respects limit parameter", () => {
    const suggestions = getSuggestedParents("heading", 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array for a type that has no valid parents", () => {
    // "page" or "root" types have no parents
    // Use a type that can't be nested anywhere — if none, just verify no throws
    expect(() =>
      getSuggestedParents("section" as Parameters<typeof getSuggestedParents>[0])
    ).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npx vitest run src/shared/utils/nesting/validator.test.ts
```

Expected: FAIL — `getSuggestedParents is not a function`.

**Step 3: Add `getSuggestedParents` to validator.ts**

In `src/shared/utils/nesting/validator.ts`, add this export after the `getValidChildren` function (around line 114):

```typescript
/**
 * Get the most useful container parents for a child element type.
 * Filters valid drop targets to prefer common container types.
 * Used for nesting error feedback to suggest where an element can go.
 *
 * @param childType - The element type being inserted
 * @param limit - Max results to return (default 3)
 * @returns ElementType[] sorted by priority (container, section, flex, grid first)
 */
export function getSuggestedParents(childType: ElementType, limit = 3): ElementType[] {
  const PREFERRED_PARENTS = ["container", "section", "flex", "grid", "card", "columns", "form"];
  const validTargets = getValidDropTargets(childType);

  const preferred = validTargets.filter((t) => PREFERRED_PARENTS.includes(t));
  const others = validTargets.filter((t) => !PREFERRED_PARENTS.includes(t));

  return [...preferred, ...others].slice(0, limit);
}
```

**Step 4: Run tests**

```bash
cd packages/new-editor-l2 && npx vitest run src/shared/utils/nesting/validator.test.ts
```

Expected: 3 PASS.

**Step 5: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/shared/utils/nesting/validator.ts \
        src/shared/utils/nesting/validator.test.ts
git commit -m "feat(nesting): add getSuggestedParents() for nesting error feedback"
```

---

### Task 5: Fix C1 — nesting error toast in useBlockInsertion.ts

**Files:**

- Modify: `src/editor/shell/hooks/useBlockInsertion.ts`

**Context:** When `insertBlock()` returns `undefined` (nesting failure), the current toast says "Failed to insert 'X'." with no reason. This task replaces that with an actionable message using `getSuggestedParents`.

**Step 1: Update imports in useBlockInsertion.ts**

Add `getSuggestedParents` to the nesting import:

```typescript
import { canNestElement, getSuggestedParents } from "../../../shared/utils/nesting";
```

**Step 2: Replace the failure toast with contextual message**

Find the existing failure toast (line 88):

```typescript
addToast({ message: `Failed to insert "${block.label}".`, variant: "error" });
```

Replace with:

```typescript
// Build contextual nesting error message
const parentEl = composer.elements.getElement(parentId);
const parentType = parentEl?.getType?.() ?? "this element";
const suggestions = getSuggestedParents(def.elementType);
const suggestionText =
  suggestions.length > 0
    ? `Try selecting a ${suggestions.slice(0, 2).join(" or ")} first.`
    : "Select a container element and try again.";
addToast({
  message: `Can't add ${block.label} — ${parentType} doesn't allow it. ${suggestionText}`,
  variant: "warning",
  duration: 5000,
});
```

**Step 3: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/editor/shell/hooks/useBlockInsertion.ts
git commit -m "fix(build-tab): C1 — show nesting error reason and parent suggestions in toast"
```

---

### Task 6: Add insertion context indicator to BuildTab

**Files:**

- Modify: `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`
- Modify: `src/editor/sidebar/tabs/build/BuildTab.tsx`
- Modify: `src/editor/sidebar/tabs/BuildTab.css`

**Context:** Users don't know where a clicked element will land before they click. This task adds a small indicator strip between the search bar and the catalog showing the current selection context.

**Step 1: Add `insertionContext` to useBuildTab**

In `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`, add this to the `UseBuildTabReturn` interface:

```typescript
/** Describes where the next clicked element will be inserted */
insertionContext: { type: string; label: string } | null;
```

Add the computed value inside the hook body, before the `return`:

```typescript
const insertionContext = React.useMemo((): { type: string; label: string } | null => {
  if (!composer) return null;
  const selectedIds = composer.selection.getSelectedIds();
  if (selectedIds.length !== 1) return null;
  const el = composer.elements.getElement(selectedIds[0]);
  if (!el) return null;
  const type = el.getType();
  // Capitalize first letter for display
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return { type, label };
}, [composer]);
```

Add `insertionContext` to the return object:

```typescript
return {
  // ... existing fields
  insertionContext,
};
```

**Step 2: Render the context pill in BuildTab.tsx**

In `src/editor/sidebar/tabs/build/BuildTab.tsx`, add the context pill between the search wrapper and `bld-shell`:

```tsx
{
  tab.insertionContext && (
    <div className="bld-insert-ctx" aria-live="polite">
      <span className="bld-insert-ctx-icon">📍</span>
      <span className="bld-insert-ctx-text">
        Adding inside: <strong>{tab.insertionContext.label}</strong>
      </span>
    </div>
  );
}
```

Place it after `</div>` closing `searchWrapStyles` and before `<div className="bld-shell">`.

**Step 3: Add CSS for the context pill**

In `src/editor/sidebar/tabs/BuildTab.css`, append:

```css
/* Insertion context indicator */
.bld-insert-ctx {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px 2px;
  font-size: var(--aqb-font-xs, 12px);
  color: var(--aqb-text-muted);
  flex-shrink: 0;
}

.bld-insert-ctx-icon {
  font-size: 10px;
  line-height: 1;
}

.bld-insert-ctx-text strong {
  color: var(--aqb-text-secondary);
  font-weight: 500;
}
```

**Step 4: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/build/hooks/useBuildTab.ts \
        src/editor/sidebar/tabs/build/BuildTab.tsx \
        src/editor/sidebar/tabs/BuildTab.css
git commit -m "feat(build-tab): add insertion context indicator showing selected element"
```

---

### Task 7: Wire TipsFooter dismissal

**Files:**

- Modify: `src/editor/sidebar/tabs/build/components/TipsFooter.tsx`
- Modify: `src/editor/sidebar/tabs/build/BuildTab.tsx`
- Modify: `src/editor/sidebar/tabs/BuildTab.css`

**Context:** `tipDismissed` state and `dismissTip` handler already exist in `useBuildTab.ts` and persist to `BUILD_TIP_DISMISSED` storage key. But `TipsFooter.tsx` never receives them. This task connects the plumbing.

**Step 1: Add `dismissed` and `onDismiss` to TipsFooterProps**

In `src/editor/sidebar/tabs/build/components/TipsFooter.tsx`, update the interface:

```typescript
export interface TipsFooterProps {
  tipIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (i: number) => void;
  dismissed?: boolean;
  onDismiss?: () => void;
}
```

Update the component signature and add dismiss button + early return:

```typescript
export const TipsFooter: React.FC<TipsFooterProps> = ({
  tipIdx,
  onPrev,
  onNext,
  onDotClick,
  dismissed = false,
  onDismiss,
}) => {
  if (dismissed) return null;

  const tip = TIPS[tipIdx];

  return (
    <>
      <div className="bld-tips-hd">
        <span className="bld-tips-lbl">💡 Pro Tip</span>
        <div className="bld-tips-nav">
          <button className="bld-tip-arr" onClick={onPrev} aria-label="Previous tip">
            ‹
          </button>
          <button className="bld-tip-arr" onClick={onNext} aria-label="Next tip">
            ›
          </button>
          {onDismiss && (
            <button
              className="bld-tip-arr bld-tip-dismiss"
              onClick={onDismiss}
              aria-label="Dismiss tips"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="bld-tip-card">
        <strong>{tip.bold}</strong>
        {tip.body}
      </div>
      <div className="bld-tip-dots">
        {TIPS.map((_, i) => (
          <button
            key={i}
            className={`bld-tip-dot${i === tipIdx ? " on" : ""}`}
            onClick={() => onDotClick(i)}
            aria-label={`Tip ${i + 1}`}
          />
        ))}
      </div>
    </>
  );
};
```

**Step 2: Pass `dismissed` and `onDismiss` in BuildTab.tsx**

In `src/editor/sidebar/tabs/build/BuildTab.tsx`, update the `TipsFooter` usage:

```tsx
<TipsFooter
  tipIdx={tab.tipIdx}
  onPrev={tab.tipPrev}
  onNext={tab.tipNext}
  onDotClick={tab.tipSetAt}
  dismissed={tab.tipDismissed}
  onDismiss={tab.dismissTip}
/>
```

**Step 3: Add CSS transition for the tips container**

In `src/editor/sidebar/tabs/BuildTab.css`, find `.bld-tips` and add transition (or append if not present):

```css
.bld-tips {
  flex-shrink: 0;
  overflow: hidden;
  transition: max-height 200ms ease;
}
```

**Step 4: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/build/components/TipsFooter.tsx \
        src/editor/sidebar/tabs/build/BuildTab.tsx \
        src/editor/sidebar/tabs/BuildTab.css
git commit -m "feat(build-tab): wire TipsFooter dismiss button to existing tipDismissed state"
```

---

### Task 8: Fix Tip 4 text + FavZone clear undo toast

**Files:**

- Modify: `src/editor/sidebar/tabs/build/catalog/tips.ts`
- Modify: `src/editor/sidebar/tabs/build/BuildTab.tsx`
- Modify: `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`

**Context (Tip 4):** Tip 4 currently says "right-click → Save as Component" but `MyComponents` shows "coming soon" for all users. The tip creates false expectations.

**Context (FavZone clear):** "Clear All" in FavZone instantly deletes all favorites with no recovery. This task replaces it with an undo toast pattern.

**Step 1: Fix Tip 4 text in tips.ts**

In `src/editor/sidebar/tabs/build/catalog/tips.ts`, update the 4th tip (index 3):

```typescript
{
  bold: "My Components",
  body: " — Once available, save any element as a reusable component from the right-click menu.",
},
```

**Step 2: Expose `restoreFavs` from useBuildTab**

In `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`, add to `UseBuildTabReturn`:

```typescript
restoreFavs: (snapshot: Set<string>) => void;
```

Inside the hook body, add:

```typescript
const restoreFavs = React.useCallback((snapshot: Set<string>) => {
  setFavs(new Set(snapshot));
}, []);
```

Add `restoreFavs` to the return object.

**Step 3: Add undo-toast handler in BuildTab.tsx**

In `src/editor/sidebar/tabs/build/BuildTab.tsx`, add `useToast` import and build a wrapped handler:

```typescript
import { useToast } from "../../../../shared/ui/Toast";
```

Inside the `BuildTab` component body (after `const tab = useBuildTab(...)`):

```typescript
const { addToast } = useToast();

const handleClearFavs = React.useCallback(() => {
  const snapshot = new Set(tab.favs);
  tab.clearFavs();
  addToast({
    message: "Favorites cleared",
    variant: "info",
    duration: 5000,
    action: {
      label: "Undo",
      onClick: () => tab.restoreFavs(snapshot),
    },
  });
}, [tab, addToast]);
```

Pass `handleClearFavs` to `FavZone` instead of `tab.clearFavs`:

```tsx
<FavZone
  // ... other props
  onClearAll={handleClearFavs}
/>
```

**Step 4: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/build/catalog/tips.ts \
        src/editor/sidebar/tabs/build/hooks/useBuildTab.ts \
        src/editor/sidebar/tabs/build/BuildTab.tsx
git commit -m "fix(build-tab): fix Tip 4 text; add undo toast for Clear All Favorites"
```

---

### Task 9: Restore open categories after search clear

**Files:**

- Modify: `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`

**Context:** When a user types in the search bar, the category accordion hides. When they clear the search, all categories collapse (they see whatever was persisted to sessionStorage, which may be nothing). This task remembers which categories were open before the search started and restores them on clear.

**Step 1: Write the test**

Create `src/editor/sidebar/tabs/build/hooks/useBuildTab.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuildTab } from "./useBuildTab";

// Mock localStorage + sessionStorage
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useBuildTab — search clear restores categories", () => {
  it("restores open categories after clearing search", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined));

    // Open a category
    act(() => {
      result.current.toggleCat("basic");
    });
    expect(result.current.openCats.has("basic")).toBe(true);

    // Start searching — this should remember the open cats
    act(() => {
      result.current.setSearchQuery("button");
    });
    expect(result.current.searchQuery).toBe("button");

    // Clear search
    act(() => {
      result.current.setSearchQuery("");
    });

    // Open cats should be restored
    expect(result.current.openCats.has("basic")).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npx vitest run src/editor/sidebar/tabs/build/hooks/useBuildTab.test.ts
```

Expected: FAIL — categories do not restore after search clear.

**Step 3: Update useBuildTab to capture and restore categories**

In `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`, add a ref to capture pre-search state:

```typescript
// Track which categories were open before a search started
const preClearCatsRef = React.useRef<Set<string> | null>(null);
```

Replace the existing `setSearchQuery` (currently just a plain state setter) with a wrapped handler. Since the `setSearchQuery` is directly returned from `useState`, intercept it in the hook:

Replace:

```typescript
const [searchQuery, setSearchQuery] = React.useState("");
```

With:

```typescript
const [searchQuery, setSearchQueryRaw] = React.useState("");

const setSearchQuery = React.useCallback(
  (q: string) => {
    const trimmed = q.trim();
    const prevTrimmed = searchQuery.trim();

    // Entering search: capture current open cats
    if (prevTrimmed.length === 0 && trimmed.length > 0) {
      preClearCatsRef.current = new Set(openCats);
    }

    // Leaving search (clearing): restore cats
    if (prevTrimmed.length > 0 && trimmed.length === 0) {
      if (preClearCatsRef.current !== null) {
        setOpenCats(preClearCatsRef.current);
        preClearCatsRef.current = null;
      }
    }

    setSearchQueryRaw(q);
  },
  [searchQuery, openCats]
);
```

> **Note:** `setSearchQuery` now depends on `searchQuery` and `openCats`. This is intentional.

**Step 4: Run tests**

```bash
cd packages/new-editor-l2 && npx vitest run src/editor/sidebar/tabs/build/hooks/useBuildTab.test.ts
```

Expected: PASS.

**Step 5: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/editor/sidebar/tabs/build/hooks/useBuildTab.ts \
        src/editor/sidebar/tabs/build/hooks/useBuildTab.test.ts
git commit -m "fix(build-tab): restore open categories when search is cleared"
```

---

## PHASE 3 — Code Health

### Task 10: Delete dead `recentIds` state

**Files:**

- Modify: `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`

**Context:** `recentIds` state tracks recently used element IDs and persists them to `BUILD_RECENT` localStorage. No component in the UI renders a "Recent" section. This is dead code creating unnecessary localStorage writes on every element click.

**Step 1: Remove `recentIds` from `UseBuildTabReturn` interface**

In `useBuildTab.ts`, remove from `UseBuildTabReturn`:

```typescript
recentIds: string[];  // DELETE THIS LINE
```

**Step 2: Remove state declaration and effect**

Delete:

```typescript
const [recentIds, setRecentIds] = React.useState<string[]>(() =>
  ls.getArray(STORAGE_KEYS.BUILD_RECENT)
);
```

Delete:

```typescript
// Persist recentIds
React.useEffect(() => {
  ls.saveArray(STORAGE_KEYS.BUILD_RECENT, recentIds);
}, [recentIds]);
```

**Step 3: Remove recentIds update from handleElClick**

In `handleElClick`, remove the `setRecentIds` call. The simplified handler becomes:

```typescript
const handleElClick: ElClickFn = React.useCallback(
  (el) => {
    onBlockClick?.({ id: el.blockId, label: el.name, category: el.catId });
  },
  [onBlockClick]
);
```

**Step 4: Remove `recentIds` from the return object**

Delete `recentIds,` from the returned object at the bottom of the hook.

**Step 5: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors. (Any consumers of `recentIds` will surface as type errors here — fix them if found.)

**Step 6: Run all tests**

```bash
cd packages/new-editor-l2 && npx vitest run
```

Expected: All PASS.

**Step 7: Commit**

```bash
git add src/editor/sidebar/tabs/build/hooks/useBuildTab.ts
git commit -m "refactor(build-tab): remove dead recentIds state — no Recent section exists"
```

---

### Task 11: Add first-time favorites localStorage warning

**Files:**

- Modify: `src/shared/constants/storageKeys.ts`
- Modify: `src/editor/sidebar/tabs/build/BuildTab.tsx`
- Modify: `src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`

**Context:** Users don't know favorites are browser-local only. On the first star action of their lifetime, show a one-time info toast.

**Step 1: Add `BUILD_FAVS_INFORMED` to storageKeys.ts**

In `src/shared/constants/storageKeys.ts`, under the `// ─── Build Tab ─────` section, add:

```typescript
/** Whether the user has been informed that favorites are browser-local only */
BUILD_FAVS_INFORMED: "aqb-build-favs-informed",
```

**Step 2: Track informed state in useBuildTab**

In `useBuildTab.ts`, add initialized state:

```typescript
const [favsInformed, setFavsInformed] = React.useState<boolean>(() =>
  ls.getBool(STORAGE_KEYS.BUILD_FAVS_INFORMED)
);
```

Expose in `UseBuildTabReturn`:

```typescript
favsInformed: boolean;
markFavsInformed: () => void;
```

Add handler:

```typescript
const markFavsInformed = React.useCallback(() => {
  setFavsInformed(true);
  ls.saveBool(STORAGE_KEYS.BUILD_FAVS_INFORMED, true);
}, []);
```

Return both from the hook.

**Step 3: Show one-time toast in BuildTab.tsx**

In `BuildTab.tsx`, wrap the `toggleFav` call to show the informed toast on first use:

```typescript
const handleToggleFav = React.useCallback(
  (name: string) => {
    tab.toggleFav(name);
    if (!tab.favsInformed) {
      tab.markFavsInformed();
      addToast({
        message: "Favorites are saved in this browser only.",
        variant: "info",
        duration: 4000,
      });
    }
  },
  [tab, addToast]
);
```

Pass `handleToggleFav` in place of `tab.toggleFav` to all child components in `BuildTab.tsx`:

- `SearchResults onToggleFav={handleToggleFav}`
- `CatAccordion onToggleFav={handleToggleFav}`
- `FavZone onRemoveFav={handleToggleFav}`

**Step 4: Typecheck**

```bash
cd packages/new-editor-l2 && npx tsc --noEmit
```

Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/shared/constants/storageKeys.ts \
        src/editor/sidebar/tabs/build/hooks/useBuildTab.ts \
        src/editor/sidebar/tabs/build/BuildTab.tsx
git commit -m "feat(build-tab): show one-time info toast on first favorites action"
```

---

### Task 12: Add catalog blockId validation test

**Files:**

- Create: `src/editor/sidebar/tabs/build/catalog/catalog.test.ts`

**Context:** The C2 bugs (wrong blockIds) were silent because there was no test asserting catalog entries match registry entries. This test catches future mismatches at CI time.

**Step 1: Write the test**

Create `src/editor/sidebar/tabs/build/catalog/catalog.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { CATALOG, flatCatalog } from "./catalog";
import { getBlockDefinitions } from "../../../../blocks/blockRegistry";

describe("Build Tab Catalog — blockId integrity", () => {
  const registryIds = new Set(getBlockDefinitions().map((b) => b.id));

  it("every non-disabled catalog entry has a blockId that exists in blockRegistry", () => {
    const violations: string[] = [];

    for (const el of flatCatalog) {
      if (el.disabled) continue; // disabled = known gap, explicitly acknowledged
      if (!registryIds.has(el.blockId)) {
        violations.push(`${el.catName} › "${el.name}": blockId "${el.blockId}" not in registry`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Catalog has ${violations.length} blockId mismatch(es):\n${violations.join("\n")}\n\n` +
          `Fix: update blockId in catalog/catalog.ts or add block config to blockRegistry.`
      );
    }
  });

  it("CATALOG array is non-empty with 7 categories", () => {
    expect(CATALOG).toHaveLength(7);
  });

  it("flatCatalog has no duplicate element names within the same category", () => {
    for (const cat of CATALOG) {
      const names = cat.elements.map((e) => e.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    }
  });
});
```

**Step 2: Run test**

```bash
cd packages/new-editor-l2 && npx vitest run src/editor/sidebar/tabs/build/catalog/catalog.test.ts
```

Expected: All PASS. (If any FAIL, fix the remaining blockId mismatches from Task 2.)

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/build/catalog/catalog.test.ts
git commit -m "test(build-tab): add catalog blockId integrity test — catches C2-class bugs at CI"
```

---

## Final verification

After all tasks complete:

```bash
cd packages/new-editor-l2
npx tsc --noEmit
npx vitest run
```

Expected:

- TypeScript: 0 errors
- Vitest: All tests PASS (catalog integrity, validator, ElCard, useBuildTab)

Then open the editor in browser and verify:

1. Custom Code card is grayed out with "Coming Soon" tooltip
2. Clicking a Button then clicking Heading shows: "Can't add Heading — button doesn't allow it. Try selecting a Container or Section first."
3. Tips footer has a ✕ button that dismisses it
4. Clearing search restores previously open category
5. "Clear All" favorites shows undo toast

---

## Not in scope (deferred)

These were identified in the audit but require new block configs or product decisions:

- `custom-code` block config (Phase 3 registry gap)
- `badge` block config (Phase 3 registry gap)
- E-Commerce gating for non-commerce sites (product decision)
- My Components State 3 renderer (requires `getComponents` API implementation)
