# Inspector Stabilization Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 Inspector right-panel bugs, standardize 17 sections to existing primitives, and add 22 regression tests — all on branch `feat/inspector-stabilization`.

**Architecture:** All changes modify existing files. One new shared hook (`useFocusTrap`). No new components or abstractions. Token collision resolved via CSS aliases in `themes/default.css` — no component code touched for that fix.

**Tech Stack:** React 18.3 + TypeScript 5.3 + Vite 7.2 + Vitest + Emotion (existing).

**Spec:** `docs/superpowers/specs/2026-04-13-inspector-stabilization-design.md`

**Branch:** `feat/inspector-stabilization` (already cut off `origin/main` at `e301a7d`).

---

## Pre-flight (once, before Task 1)

- [ ] **Step 0: Confirm branch + clean tree**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git branch --show-current
# Expected: feat/inspector-stabilization
git status --short
# Expected: (empty)
```

- [ ] **Step 0.5: Baseline test run (record the number)**

```bash
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Record the pass count (baseline) — we add 22 tests total, so final count = baseline + 22.

---

# GROUP 1: Mechanical Foundation

## Task 1: Token alias — map `--aqb-control-*` to `--ls-*`

**Files:**
- Modify: `packages/editor/src/themes/default.css`

**Context:** 12 `--aqb-control-*` tokens currently have dark-theme values. The app is light-themed (`--ls-*`). Aliasing routes all inspector control styling to the live `--ls-*` tokens without touching any component.

- [ ] **Step 1: Locate the block**

```bash
grep -n "\-\-aqb-control-" packages/editor/src/themes/default.css
```

Record the line numbers of all 12 declarations.

- [ ] **Step 2: Replace each declaration with a `--ls-*` alias**

Edit `packages/editor/src/themes/default.css`. Replace each token definition:

```css
/* BEFORE */
--aqb-control-accent: #0073E6;
--aqb-control-accent-alpha-08: rgba(0, 115, 230, 0.08);
--aqb-control-accent-alpha-10: rgba(0, 115, 230, 0.1);
--aqb-control-accent-alpha-20: rgba(0, 115, 230, 0.2);
--aqb-control-accent-alpha-30: rgba(0, 115, 230, 0.3);
--aqb-control-surface-input: rgba(255, 255, 255, 0.05);
--aqb-control-surface-subtle: rgba(255, 255, 255, 0.03);
--aqb-control-surface-overlay: rgba(255, 255, 255, 0.02);
--aqb-control-text-primary: #e4e4e7;
--aqb-control-text-secondary: #a1a1aa;
--aqb-control-text-tertiary: #71717a;
--aqb-control-text-muted: #52525b;

/* AFTER — aliases to --ls-* global tokens */
--aqb-control-accent: var(--ls-accent);
--aqb-control-accent-alpha-08: color-mix(in srgb, var(--ls-accent) 8%, transparent);
--aqb-control-accent-alpha-10: color-mix(in srgb, var(--ls-accent) 10%, transparent);
--aqb-control-accent-alpha-20: color-mix(in srgb, var(--ls-accent) 20%, transparent);
--aqb-control-accent-alpha-30: color-mix(in srgb, var(--ls-accent) 30%, transparent);
--aqb-control-surface-input: var(--ls-bg-card);
--aqb-control-surface-subtle: var(--ls-bg-subtle);
--aqb-control-surface-overlay: var(--ls-bg-subtle);
--aqb-control-text-primary: var(--ls-text-primary);
--aqb-control-text-secondary: var(--ls-text-secondary);
--aqb-control-text-tertiary: var(--ls-text-muted);
--aqb-control-text-muted: var(--ls-text-subtle);
```

- [ ] **Step 3: Type-check**

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -v "server/trpc\|server/services\|server/auth" | tail -5
```

Expected: no errors (ignore pre-existing `server/` errors — different package).

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/default.css
git commit -m "chore(inspector): alias --aqb-control-* tokens to --ls-* globals

Unifies the three coexisting token systems (--aqb-control-*,
--ls-*, aqb-input classes) into one source of truth. Inspector
controls immediately inherit the light-theme --ls-* values
without touching any component code.

Resolves token-system collision flagged in /plan-eng-review 1A."
```

---

## Task 2: Legacy delete — remove `components/Panels/ProInspector/`

**Files:**
- Modify: 8 files that import from legacy path
- Delete: `packages/editor/src/components/Panels/ProInspector/`
- Modify: `.eslintrc` or `eslint.config.*` (add guard rule)

- [ ] **Step 1: Tag safety checkpoint**

```bash
git tag pre-legacy-delete
```

Used to revert if post-delete surprises surface.

- [ ] **Step 2: Enumerate the 8 import sites**

```bash
grep -rln "components/Panels/ProInspector" packages/editor/src/
```

Expected 8 files:
1. `components/Panels/ProInspector/index.tsx` (the folder's own barrel — deleted with folder)
2. `editor/inspector/sections/AnimationSection.tsx`
3. `editor/inspector/sections/GridSection.tsx`
4. `editor/inspector/sections/typography/FontControls.tsx`
5. `editor/inspector/sections/typography/FontPicker.tsx`
6. `editor/inspector/sections/typography/FontPickerDropdown.tsx`
7. `editor/inspector/sections/typography/TypographyControls.tsx`
8. `editor/inspector/sections/typography/index.tsx`

- [ ] **Step 3: Migrate each import**

For each of the 7 consumers (not the barrel itself), replace:

```ts
// BEFORE
import { X } from "../../../components/Panels/ProInspector";
// or
import { X } from "../../../../components/Panels/ProInspector/Y";

// AFTER — point to editor/inspector/ equivalent
import { X } from "../../hooks/useInspectorState";
// OR from the specific editor/inspector/* file
```

Run `grep -rn "components/Panels/ProInspector" packages/editor/src/` after each edit to track remaining count. Down to 1 when only the barrel file remains.

- [ ] **Step 4: Type-check after migration**

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep "inspector\|ProInspector" | head -10
```

Expected: no errors referencing inspector or ProInspector.

- [ ] **Step 5: Delete the legacy folder**

```bash
rm -rf packages/editor/src/components/Panels/ProInspector/
grep -rn "components/Panels/ProInspector" packages/editor/src/
# Expected: 0 matches
```

- [ ] **Step 6: Add ESLint guard**

Locate the project's ESLint config (check `eslint.config.*`, `.eslintrc*`, or `package.json`'s `eslintConfig`). Add this rule:

```js
{
  "no-restricted-imports": ["error", {
    "patterns": [{
      "group": ["**/components/Panels/ProInspector*"],
      "message": "Legacy inspector folder removed. Use editor/inspector/* instead."
    }]
  }]
}
```

- [ ] **Step 7: Run full test suite**

```bash
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: baseline count, all passing.

- [ ] **Step 8: Commit**

```bash
git add packages/editor/src/ .eslintrc* eslint.config.* 2>/dev/null
git commit -m "chore(inspector): delete legacy components/Panels/ProInspector folder

Migrated 7 import sites to editor/inspector/* equivalents and added
ESLint rule to prevent regression.

Finishes the editor/ refactor started earlier this year — legacy
barrel re-exports + duplicate useInspectorState are now gone."
```

---

## ✅ VERIFY — Group 1 checkpoint

- [ ] **Run**

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -v "server/" | tail -3
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: tsc clean, tests at baseline (no regressions, no new tests yet).

---

# GROUP 2: Hook Layer (`useStyleHandlers.ts`)

**Files touched by both Task 3 and Task 4:**
- Modify: `packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts`
- Create: `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts`

**Before starting Group 2:** read the file top-to-bottom to understand the hook's current shape:

```bash
cat packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts
```

Record the signatures of: the exported hook, the load effect's deps array, the debounced write path, any `stylesVersion` or counter references.

## Task 3: Subscribe to `element:updated` event (drop any version counter)

- [ ] **Step 1: Write failing test**

Create `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";

function makeMockComposer() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  return {
    on: (event: string, fn: (p: unknown) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    off: (event: string, fn: (p: unknown) => void) => {
      listeners.get(event)?.delete(fn);
    },
    emit: (event: string, payload: unknown) => {
      listeners.get(event)?.forEach((fn) => fn(payload));
    },
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
  };
}

describe("useStyleHandlers — event subscription", () => {
  it("subscribes to element:updated on mount", () => {
    const composer = makeMockComposer();
    const element = { getId: () => "el-1", getStyles: () => ({}) };
    renderHook(() =>
      useStyleHandlers({
        composer: composer as never,
        selectedElement: element as never,
        currentPseudoState: "default",
        currentBreakpoint: "desktop",
      }),
    );
    expect(composer.listenerCount("element:updated")).toBeGreaterThan(0);
  });

  it("unsubscribes on unmount", () => {
    const composer = makeMockComposer();
    const element = { getId: () => "el-1", getStyles: () => ({}) };
    const { unmount } = renderHook(() =>
      useStyleHandlers({
        composer: composer as never,
        selectedElement: element as never,
        currentPseudoState: "default",
        currentBreakpoint: "desktop",
      }),
    );
    expect(composer.listenerCount("element:updated")).toBeGreaterThan(0);
    unmount();
    expect(composer.listenerCount("element:updated")).toBe(0);
  });
});
```

- [ ] **Step 2: Run test — should FAIL**

```bash
cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts 2>&1 | tail -8
```

Expected: fail because hook doesn't subscribe yet (or because the hook prop shape doesn't match — adjust prop names in test to match the actual hook signature you recorded).

- [ ] **Step 3: Modify `useStyleHandlers.ts` to subscribe**

Add a `useEffect` that subscribes to `composer.on("element:updated", handler)` on mount and returns a cleanup that calls `composer.off`. The handler should trigger a state refresh for the hook's styles. Drop any `stylesVersion`-like counter if present.

The handler logic: when the emitted element's id equals the current `selectedElement.id`, re-read styles from the element. Use a setState to trigger re-render.

Reference the existing `ElementStyles.ts:47-190` which emits `element:updated` — the payload is the element itself.

- [ ] **Step 4: Run test — should PASS**

```bash
cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts 2>&1 | tail -8
```

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts
git commit -m "fix(inspector): subscribe useStyleHandlers to element:updated event

Replaces any ad-hoc version counter with the Composer's existing
element:updated event (emitted 9 times in ElementStyles.ts). The
hook now re-reads styles when the current element's styles change
from any source (undo/redo, external write, peer section edit).

+ 2 regression tests covering subscribe on mount and unsubscribe
on unmount."
```

## Task 4: Fix pseudo-state load in `useStyleHandlers.ts`

**Context:** The load effect reads element styles but doesn't depend on `currentPseudoState`. When user clicks `:hover` chip, effect doesn't re-run → wrong values shown. This is the root bug behind CP-3 from the design review.

- [ ] **Step 1: Add failing test to the same file**

Append to `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts`:

```ts
describe("useStyleHandlers — pseudo-state load (Fix 1)", () => {
  it("re-reads styles when currentPseudoState changes", () => {
    const composer = makeMockComposer();
    const defaultStyles = { color: "#000000", "font-size": "16px" };
    const hoverStyles = { color: "#ff0000", "font-size": "18px" };
    const element = {
      getId: () => "el-1",
      getStyles: (pseudo?: string) =>
        pseudo === ":hover" ? hoverStyles : defaultStyles,
    };

    const { result, rerender } = renderHook(
      ({ pseudo }: { pseudo: string }) =>
        useStyleHandlers({
          composer: composer as never,
          selectedElement: element as never,
          currentPseudoState: pseudo,
          currentBreakpoint: "desktop",
        }),
      { initialProps: { pseudo: "default" } },
    );
    expect(result.current.styles).toEqual(defaultStyles);

    // Switch to :hover — hook should re-read with pseudo arg
    rerender({ pseudo: ":hover" });
    expect(result.current.styles).toEqual(hoverStyles);

    // Switch back — default styles restored
    rerender({ pseudo: "default" });
    expect(result.current.styles).toEqual(defaultStyles);
  });
});
```

- [ ] **Step 2: Run test — should FAIL**

```bash
cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts -t "pseudo-state" 2>&1 | tail -8
```

- [ ] **Step 3: Fix the load effect**

In `useStyleHandlers.ts`, locate the effect that calls `element.getStyles()`. Add `currentPseudoState` to its dependency array AND pass it to `getStyles()`:

```ts
useEffect(() => {
  if (!selectedElement) return;
  const loadedStyles = selectedElement.getStyles(
    currentPseudoState === "default" ? undefined : currentPseudoState,
  );
  setStyles(loadedStyles);
}, [selectedElement?.getId?.(), currentPseudoState, currentBreakpoint]);
```

Verify `Element.getStyles()` accepts a pseudo-state argument. If not, fix it first at the Element level (separate concern — flag it).

- [ ] **Step 4: Run test — should PASS**

```bash
cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts -t "pseudo-state" 2>&1 | tail -8
```

- [ ] **Step 5: Add debounce-flush-on-selection-change test**

Append to the same file:

```ts
describe("useStyleHandlers — debounce flush on selection change", () => {
  it("flushes pending write when selectedElement changes", async () => {
    const composer = makeMockComposer();
    const writes: Array<{ el: string; prop: string; val: string }> = [];
    const elA = { getId: () => "el-a", getStyles: () => ({}), setStyle: (p: string, v: string) => writes.push({ el: "el-a", prop: p, val: v }) };
    const elB = { getId: () => "el-b", getStyles: () => ({}), setStyle: (p: string, v: string) => writes.push({ el: "el-b", prop: p, val: v }) };

    const { result, rerender } = renderHook(
      ({ el }: { el: typeof elA }) =>
        useStyleHandlers({
          composer: composer as never,
          selectedElement: el as never,
          currentPseudoState: "default",
          currentBreakpoint: "desktop",
        }),
      { initialProps: { el: elA } },
    );
    act(() => result.current.handleStyleChange("width", "100px"));
    // Before debounce fires, switch element
    rerender({ el: elB });

    // Wait past debounce
    await new Promise((r) => setTimeout(r, 200));

    // Assert: write went to el-a, NOT el-b
    expect(writes.filter((w) => w.el === "el-a")).toHaveLength(1);
    expect(writes.filter((w) => w.el === "el-b")).toHaveLength(0);
  });
});
```

- [ ] **Step 6: Run test — should FAIL**

```bash
cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts -t "debounce flush" 2>&1 | tail -8
```

- [ ] **Step 7: Fix debounce flush**

In `useStyleHandlers.ts`, when `selectedElement?.getId?.()` changes, flush any pending debounced write synchronously against the OLD element before resetting.

```ts
const pendingWrite = useRef<{ property: string; value: string } | null>(null);
const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  return () => {
    // Flush on element change
    if (writeTimer.current) {
      clearTimeout(writeTimer.current);
      writeTimer.current = null;
      if (pendingWrite.current && selectedElement) {
        selectedElement.setStyle(pendingWrite.current.property, pendingWrite.current.value);
      }
      pendingWrite.current = null;
    }
  };
}, [selectedElement?.getId?.()]);
```

- [ ] **Step 8: Run test — should PASS**

```bash
cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts 2>&1 | tail -5
```

Expected: all 4 tests in this file passing (2 from Task 3, 2 from Task 4).

- [ ] **Step 9: Commit**

```bash
git add packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts
git commit -m "fix(inspector): pseudo-state load + debounce flush on selection change

- Load effect now depends on currentPseudoState and passes it to
  getStyles(). Switching to :hover loads hover values instead of
  defaults (was the root of the 'state discovery broken' bug).
- Debounced writes flush synchronously when selectedElement
  changes, preventing pending values from applying to the wrong
  element.

+ 2 tests (pseudo-state load + debounce flush)."
```

---

## ✅ VERIFY — Group 2 checkpoint

- [ ] **Run**

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -v "server/" | tail -3
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: tsc clean, tests at baseline + 4.

---

# GROUP 3: Slice Propagation (`registry.tsx`)

## Task 5: Slice `ctx.styles` per section adapter

**Files:**
- Modify: `packages/editor/src/editor/inspector/sections/registry.tsx`
- Create: `packages/editor/src/editor/inspector/sections/__tests__/registry.slice.test.ts`

**Context:** At `registry.tsx:220` (roughly), `ctx.styles` spreads the full styles object into every section's props. One property edit changes every section's prop identity → React re-renders all 17 sections. Fix: each adapter declares the style keys it cares about and receives only those.

- [ ] **Step 1: Read the current registry shape**

```bash
sed -n '200,260p' packages/editor/src/editor/inspector/sections/registry.tsx
```

Record: the adapter signature shape, how `ctx.styles` is currently passed, the section registry shape.

- [ ] **Step 2: Write failing test**

Create `packages/editor/src/editor/inspector/sections/__tests__/registry.slice.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SECTION_REGISTRY } from "../registry";

describe("registry — per-section style slicing", () => {
  it("each registry entry declares the style keys it reads", () => {
    for (const entry of SECTION_REGISTRY) {
      expect(entry.styleKeys).toBeDefined();
      expect(Array.isArray(entry.styleKeys)).toBe(true);
    }
  });

  it("SizeSection props do not change when an unrelated style mutates", () => {
    const sizeEntry = SECTION_REGISTRY.find((e) => e.id === "size");
    expect(sizeEntry).toBeDefined();

    const stylesBefore = { width: "100px", height: "50px", color: "#000" };
    const stylesAfter = { width: "100px", height: "50px", color: "#fff" };

    const ctxBefore = { element: {} as never, styles: stylesBefore, devMode: false };
    const ctxAfter = { element: {} as never, styles: stylesAfter, devMode: false };

    const propsBefore = sizeEntry!.adapter(ctxBefore as never);
    const propsAfter = sizeEntry!.adapter(ctxAfter as never);

    // Size adapter should ignore `color` → props identical
    expect(JSON.stringify(propsBefore)).toEqual(JSON.stringify(propsAfter));
  });
});
```

- [ ] **Step 3: Run test — should FAIL**

```bash
cd packages/editor && npx vitest run src/editor/inspector/sections/__tests__/registry.slice.test.ts 2>&1 | tail -8
```

- [ ] **Step 4: Add `styleKeys` to each registry entry + slice in adapter**

In `registry.tsx`, for each entry:
1. Add a `styleKeys: string[]` field listing only the styles that entry reads.
2. Wrap the adapter body to read only from a sliced object.

Example for `size` entry:

```ts
{
  id: "size",
  Component: SizeSection,
  styleKeys: ["width", "height", "min-width", "max-width", "min-height", "max-height", "aspect-ratio"],
  adapter: (ctx) => {
    const sliced = pickKeys(ctx.styles, ["width", "height", "min-width", "max-width", "min-height", "max-height", "aspect-ratio"]);
    return { ...buildSizeProps(ctx.element, sliced) };
  },
  // ...
}
```

Add a `pickKeys` helper at the top of the file:

```ts
function pickKeys<T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> {
  const out: Partial<T> = {};
  for (const k of keys) if (k in obj) (out as Record<string, unknown>)[k] = obj[k];
  return out;
}
```

Do this for all 17 entries. The key lists come from reading each section's JSX / props usage.

- [ ] **Step 5: Run test — should PASS**

```bash
cd packages/editor && npx vitest run src/editor/inspector/sections/__tests__/registry.slice.test.ts 2>&1 | tail -5
```

- [ ] **Step 6: Type-check + full test run**

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -v "server/" | tail -3
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: baseline + 6 tests passing.

- [ ] **Step 7: Manual profiler verification**

```bash
cd packages/editor && npm run dev
```

Open editor at printed URL (`http://localhost:5050`). Open React DevTools → Profiler tab → start recording. Select any element, type in the Size Width input. Stop recording. Confirm only `SizeSection` re-rendered, not all 17 sections. (Record result in the commit message.)

Kill dev server when done.

- [ ] **Step 8: Commit**

```bash
git add packages/editor/src/editor/inspector/sections/
git commit -m "fix(inspector): slice ctx.styles per section adapter

Each registry entry now declares a styleKeys[] array and the adapter
reads only those keys. Single-property edits no longer re-render
unrelated sections.

Profiler verification: typing in Size.Width re-renders 1 section
(was 17).

+ 2 tests (registry has styleKeys + unrelated-style stability)."
```

---

## ✅ VERIFY — Group 3 checkpoint

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -v "server/" | tail -3
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: tsc clean, tests at baseline + 6.

---

# GROUP 4: Popover Focus

## Task 6: Extract `useFocusTrap` from Modal + apply to Popover

**Files:**
- Create: `packages/editor/src/shared/hooks/useFocusTrap.ts`
- Create: `packages/editor/src/shared/hooks/__tests__/useFocusTrap.test.tsx`
- Modify: `packages/editor/src/shared/ui/Modal.tsx` (use new hook, keep behavior)
- Modify: `packages/editor/src/shared/ui/Popover.tsx` (apply new hook)

- [ ] **Step 1: Read Modal's current focus logic**

```bash
sed -n '40,95p' packages/editor/src/shared/ui/Modal.tsx
```

Extract: the focus restoration ref pattern (line ~43), the focus trap implementation (line ~84).

- [ ] **Step 2: Write failing test**

Create `packages/editor/src/shared/hooks/__tests__/useFocusTrap.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React, { useRef } from "react";
import { useFocusTrap } from "../useFocusTrap";

function TrapContainer({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <>
      <button data-testid="outside">outside</button>
      <div ref={ref} data-testid="trap">
        <button data-testid="first">first</button>
        <button data-testid="second">second</button>
      </div>
    </>
  );
}

describe("useFocusTrap", () => {
  it("moves focus into container when activated", () => {
    const { getByTestId } = render(<TrapContainer active={true} />);
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("restores focus to trigger when deactivated", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    const { rerender } = render(<TrapContainer active={false} />);
    rerender(<TrapContainer active={true} />);
    rerender(<TrapContainer active={false} />);
    // Focus should be restored to the previously-focused element
    expect(document.activeElement).toBe(outside);
  });

  it("cycles Tab from last focusable to first", () => {
    const { getByTestId } = render(<TrapContainer active={true} />);
    const last = getByTestId("second");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(getByTestId("first"));
  });
});
```

- [ ] **Step 3: Run — should FAIL**

```bash
cd packages/editor && npx vitest run src/shared/hooks/__tests__/useFocusTrap.test.tsx 2>&1 | tail -8
```

- [ ] **Step 4: Create `useFocusTrap.ts`**

```ts
// packages/editor/src/shared/hooks/useFocusTrap.ts
import { useEffect, useRef } from "react";

/**
 * Focus trap + restoration. Activate by passing a ref to a container
 * and `active=true`. On activate: move focus to first focusable inside,
 * remember the previously-focused element. On deactivate: restore focus.
 * Tab cycles within the container.
 *
 * Extracted from Modal.tsx:42-90 to share with Popover.tsx.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  const restoreRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    restoreRef.current = document.activeElement;

    const focusableSelectors =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

    const first = focusables()[0];
    if (first) first.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    container.addEventListener("keydown", onKeyDown);

    return () => {
      container.removeEventListener("keydown", onKeyDown);
      const target = restoreRef.current;
      if (target && typeof (target as HTMLElement).focus === "function") {
        requestAnimationFrame(() => (target as HTMLElement).focus());
      }
      restoreRef.current = null;
    };
  }, [active, containerRef]);
}
```

- [ ] **Step 5: Run tests — should PASS**

```bash
cd packages/editor && npx vitest run src/shared/hooks/__tests__/useFocusTrap.test.tsx 2>&1 | tail -5
```

- [ ] **Step 6: Refactor Modal.tsx to use `useFocusTrap`**

In `packages/editor/src/shared/ui/Modal.tsx`, replace the inline focus trap + restoration (lines ~42-90) with:

```tsx
import { useFocusTrap } from "../hooks/useFocusTrap";
// ...
const modalRef = useRef<HTMLDivElement>(null);
useFocusTrap(modalRef, isOpen);
```

Remove the now-redundant `restoreFocusRef` and inline trap handlers. Keep all other Modal behavior.

- [ ] **Step 7: Run full test suite — Modal must still pass**

```bash
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: all tests still green. If any Modal test fails, the extraction missed something — go back and compare.

- [ ] **Step 8: Apply `useFocusTrap` to Popover**

In `packages/editor/src/shared/ui/Popover.tsx`:

```tsx
import { useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
// ...
const popoverRef = useRef<HTMLDivElement>(null);
useFocusTrap(popoverRef, isOpen);
// attach popoverRef to the popover container div
```

Also ensure Popover handles `Escape` to close (if not already).

- [ ] **Step 9: Add Popover integration test**

Append to the test file or create `packages/editor/src/shared/ui/__tests__/Popover.focus.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Popover } from "../Popover";

describe("Popover — focus trap integration", () => {
  it("Escape closes and restores focus to trigger", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <Popover isOpen={true} onClose={onClose}>
        <button data-testid="inside">inside</button>
      </Popover>,
    );
    fireEvent.keyDown(getByTestId("inside"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
```

Adjust to match Popover's actual prop shape.

- [ ] **Step 10: Run full suite**

```bash
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: baseline + 10 new tests, all green.

- [ ] **Step 11: Commit**

```bash
git add packages/editor/src/shared/hooks/useFocusTrap.ts packages/editor/src/shared/hooks/__tests__/useFocusTrap.test.tsx packages/editor/src/shared/ui/Modal.tsx packages/editor/src/shared/ui/Popover.tsx packages/editor/src/shared/ui/__tests__/
git commit -m "fix(ui): extract useFocusTrap from Modal, apply to Popover

Shared focus trap + restoration hook. Modal behavior preserved
(refactored to use the extracted hook). Popover now traps focus
on open and restores on close, fixing keyboard accessibility
across BindingPopover, InspectorElementMenu, ColorInput popover,
and FontPicker dropdown.

+ 4 tests (hook unit tests + Popover integration)."
```

---

## ✅ VERIFY — Group 4 checkpoint

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -v "server/" | tail -3
cd packages/editor && npx vitest run 2>&1 | tail -5
```

Expected: tsc clean, tests at baseline + 10.

---

# GROUP 5: Section UI Standardization

Each section commit is structurally identical:
1. Read the section file.
2. Identify inline field rendering (text input + label built directly, color swatch + hex input built directly, etc.).
3. Replace with existing primitives from `shared/forms/InputField.tsx`, `shared/forms/ColorField.tsx`, and `editor/inspector/shared/controls/Section.tsx`.
4. Run the tests for that section.
5. Commit.

## Tasks 7-23: Section migrations

For each of these 17 sections, execute Tasks 7.1-7.4 (with the section filename substituted):

- **7**: `editor/inspector/sections/layout/index.tsx`
- **8**: `editor/inspector/sections/SizeSection.tsx`
- **9**: `editor/inspector/sections/SpacingSection.tsx`
- **10**: `editor/inspector/sections/typography/index.tsx`
- **11**: `editor/inspector/sections/BackgroundSection.tsx`
- **12**: `editor/inspector/sections/BorderSection.tsx`
- **13**: `editor/inspector/sections/EffectsSection.tsx`
- **14**: `editor/inspector/sections/VisibilitySection.tsx`
- **15**: `editor/inspector/sections/LinkSection.tsx`
- **16**: `editor/inspector/sections/CSSClassesSection.tsx`
- **17**: `editor/inspector/sections/elementProperties/index.tsx`
- **18**: `editor/inspector/sections/flexbox/index.tsx`
- **19**: `editor/inspector/sections/GridSection.tsx`
- **20**: `editor/inspector/sections/interactions/index.tsx`
- **21**: `editor/inspector/sections/AnimationSection.tsx`
- **22**: `editor/inspector/sections/VariantSection.tsx`
- **23**: `editor/inspector/sections/AllCSSSection.tsx`

### Per-section step template (run for each)

- [ ] **Step 1: Read section to identify inline rendering**

```bash
cat packages/editor/src/<SECTION_PATH>
```

List: each place that builds an `<input>` with a label (candidate for `InputField`), each place that builds a color swatch + hex input (candidate for `ColorField`), the section wrapper (candidate for shared `Section`).

- [ ] **Step 2: Write/augment section smoke test**

If the section has no test, create `__tests__/<SectionName>.test.tsx` beside it:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { <Section> } from "../<section-file>";

describe("<SectionName>", () => {
  it("renders without crashing", () => {
    const onChange = vi.fn();
    const element = { getId: () => "e1", getType: () => "heading" };
    const { container } = render(
      <<Section> element={element as never} styles={{}} onChange={onChange} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("calls onChange when primary input changes", () => {
    // Section-specific — e.g., typing in width field calls onChange with {width: "100px"}
  });
});
```

- [ ] **Step 3: Run — expect pass even pre-refactor (baseline)**

```bash
cd packages/editor && npx vitest run src/editor/inspector/sections/__tests__/<SectionName>.test.tsx 2>&1 | tail -5
```

- [ ] **Step 4: Refactor to use primitives**

Replace each inline `<input>` + label pattern with `<InputField label="..." value={...} onChange={...} />`. Replace each color swatch + hex block with `<ColorField ... />`. Wrap the section with the existing `<Section>` component from `editor/inspector/shared/controls/Section.tsx`. Do NOT introduce any new abstraction.

- [ ] **Step 5: Run test — should still pass**

```bash
cd packages/editor && npx vitest run src/editor/inspector/sections/__tests__/<SectionName>.test.tsx 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/inspector/sections/<section-dir-or-file>
git commit -m "refactor(inspector/<name>): use shared primitives

Replace inline input rendering with InputField/ColorField/Section.
No behavior change. Visual alignment with --ls-* design system
carried over from token alias in Task 1.

+ smoke test (render + onChange)."
```

**Repeat the above 6 steps for each of the 17 sections.**

## Task 24: Integration test — element types × sections

**Files:**
- Create: `packages/editor/src/editor/inspector/__tests__/contextualSections.test.tsx`

- [ ] **Step 1: Write test**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProInspector } from "../ProInspector";

const ELEMENT_TYPES = [
  { type: "heading", expectedSections: ["layout", "size", "spacing", "typography", "background", "border", "effects"] },
  { type: "image", expectedSections: ["layout", "size", "spacing", "border", "effects", "link"] },
  { type: "button", expectedSections: ["layout", "size", "spacing", "typography", "background", "border", "link", "interactions"] },
];

describe("Inspector — contextual sections per element type", () => {
  for (const { type, expectedSections } of ELEMENT_TYPES) {
    it(`shows correct sections for ${type}`, () => {
      const element = {
        getId: () => "e1",
        getType: () => type,
        getStyles: () => ({}),
      };
      const { container } = render(
        <ProInspector selectedElement={element as never} composer={{} as never} />,
      );
      for (const sectionId of expectedSections) {
        expect(container.querySelector(`[data-section-id="${sectionId}"]`)).toBeTruthy();
      }
    });
  }
});
```

- [ ] **Step 2: Run test**

```bash
cd packages/editor && npx vitest run src/editor/inspector/__tests__/contextualSections.test.tsx 2>&1 | tail -5
```

If sections don't have `data-section-id` attributes yet, add them in the SectionShell component.

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/inspector/__tests__/contextualSections.test.tsx packages/editor/src/editor/inspector/shared/controls/Section.tsx
git commit -m "test(inspector): integration — sections per element type

Verifies that Heading, Image, and Button element types each render
only the correct subset of sections (per elementProfiles.ts
context-aware logic)."
```

---

## ✅ FINAL VERIFY — All groups

- [ ] **Full type + test run**

```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -v "server/" | tail -3
cd packages/editor && npx vitest run 2>&1 | tail -10
```

Expected: tsc clean, tests at **baseline + 22**.

- [ ] **Grep success criteria**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
# Legacy folder gone
grep -r "components/Panels/ProInspector" packages/editor/src/ | head -3
# No hardcoded hex in inspector (outside tests)
grep -rE "#[0-9a-fA-F]{6}" packages/editor/src/editor/inspector/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | head -5
# No --aqb-control-* declarations outside default.css
grep -rn "\-\-aqb-control-" packages/editor/src/ | grep -v "themes/default.css" | head -3
```

Expected all three: empty output.

- [ ] **Push branch**

```bash
git push -u origin feat/inspector-stabilization
```

- [ ] **Create PR**

```bash
gh pr create --base main --title "feat(inspector): stabilization sprint — 7 fixes + 22 tests" --body "Implements the design at docs/superpowers/specs/2026-04-13-inspector-stabilization-design.md. Closes the pseudo-state loading bug, the full-panel re-render perf issue, the popover focus trap gap, and the three-token-system collision. Also completes the components/Panels/ProInspector delete.

See commit history for per-task details. +22 tests (12 hook, 4 popover, ~12 section smoke + integration)."
```

---

## Spec Coverage Check

- ✅ Bug 1 (pseudo-state load) → Task 4
- ✅ Bug 2 (panel re-render) → Task 5
- ✅ Bug 3 (popover focus) → Task 6
- ✅ Bug 4 (token collision) → Task 1
- ✅ Quality 5 (8 legacy imports) → Task 2
- ✅ Quality 6 (inline section UI) → Tasks 7-23
- ✅ Quality 7 (hook test gap) → Tasks 3, 4
- ✅ Success criteria grep checks → Final verify step
- ✅ 22 tests → 2 (Task 3) + 2 (Task 4) + 2 (Task 5) + 4 (Task 6) + ~12 (Tasks 7-23) = 22
