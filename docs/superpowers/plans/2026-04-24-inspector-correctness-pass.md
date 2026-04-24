# Inspector Correctness Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix correctness bugs surfaced by Codex deep audit of the right inspector panel (session `019dc01e-4e74-7110-8203-766a75323003`, 18 findings, health 41/100). Restore responsive-state integrity, end style-map slicing defects, end stale-memo renders, trim dead UI, update stale tests.

**Architecture:** Bug-fix pass against existing module. Changes stay inside `packages/editor/src/editor/inspector/` + narrow touch of `shared/constants/breakpoints.ts` import wiring. Each task is one defect with a failing regression test first (TDD bug-fix). Commit per task to main (solo workflow, no feature branches per user memory). Run `npx tsc --noEmit` + targeted `npx vitest run` after every task.

**Tech Stack:** React 18 + TypeScript 5.3 + Vitest + React Testing Library + Emotion. Engine: `Composer` orchestrator with `StyleEngine` (breakpoint + pseudo CSS rule store).

**Out of scope (explicit deferrals):**
- M4 AllCSS raw editor unreachable — `devMode=false` hardcoding is intentional per user's DEV-toggle removal. Keep dead-code delete.
- M5 "Create Collection" binding flow — out of inspector scope.
- L4 token drift in inspector.css — polish pass, separate work.
- SchemaBorderSection sync with radius split — feature-flagged path, owner can catch up later.

---

## File Structure

**Modified:**
- `packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts` — pseudo-state read/write gets breakpoint mediaQuery; debounce flush on cleanup; batch handler gets breakpoint+pseudo routing.
- `packages/editor/src/editor/inspector/hooks/useInspectorState.ts` — reset pseudoState on element change; tab effect deps narrow to scalar id/type.
- `packages/editor/src/editor/inspector/config/cssContext.ts` — accept effective `styles` map; compute `display`/`position` from it instead of fresh `el.getStyles()`.
- `packages/editor/src/editor/inspector/ProInspector.tsx` — pass `styles_state` into `deriveCssContext`; remove dead Lock button.
- `packages/editor/src/editor/inspector/sections/registry.tsx` — widen `styleKeys` exhaustively per section.
- `packages/editor/src/editor/inspector/sections/CSSClassesSection.tsx` — subscribe to composer `element:updated` events.
- `packages/editor/src/editor/inspector/sections/AllCSSSection.tsx` — subscribe + wrap raw CSS edits in `runTransaction`.
- `packages/editor/src/editor/inspector/hooks/useBatchStyleHandler.ts` — subscribe to composer updates; route through breakpoint/pseudo paths.
- `packages/editor/src/editor/inspector/sections/LinkSection.tsx` — gate `updateHref` behind validator for every link type.
- `packages/editor/src/editor/inspector/sections/SizeSection.tsx` — delete fake aspect-ratio lock button.

**Deleted:**
- `packages/editor/src/editor/inspector/__tests__/ElementIdCopy.test.tsx` — copy-ID feature removed per user's page-feedback direction.

**Updated tests:**
- `packages/editor/src/editor/inspector/__tests__/Section.test.tsx` — preview renders when open (new behavior).
- `packages/editor/src/editor/inspector/__tests__/CSSClassesSection.test.tsx` — empty state + inline add chip assertions; title "Classes" not "CSS Classes".

**New tests:**
- `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts`
- `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.debounce.test.ts`
- `packages/editor/src/editor/inspector/hooks/__tests__/useInspectorState.pseudoReset.test.ts`
- `packages/editor/src/editor/inspector/config/__tests__/cssContext.effectiveStyles.test.ts`
- `packages/editor/src/editor/inspector/sections/__tests__/CSSClassesSection.refresh.test.tsx`
- `packages/editor/src/editor/inspector/sections/__tests__/registry.styleKeys.test.ts`
- `packages/editor/src/editor/inspector/hooks/__tests__/useBatchStyleHandler.responsive.test.ts`

---

## Task 1: Breakpoint-aware pseudo-state read/write (Blocker #1)

**Files:**
- Modify: `packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts:100-107, 147-165, 214-238`
- Create: `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts`

**Why it blocks:** On tablet/mobile, `:hover`/`:focus`/`:active`/`:disabled` edits write to the desktop pseudo rule because `setRule` is called without `mediaQuery`. Reads hit desktop too. Every non-desktop pseudo state is unreachable.

- [ ] **Step 1: Write failing test**

```ts
// packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";
import { getBreakpointQuery } from "../../../../shared/constants/breakpoints";

function makeMockComposer() {
  const rules = new Map<string, { properties: Record<string, string>; mediaQuery?: string; pseudo?: string }>();
  const key = (sel: string, mq?: string) => `${mq ?? ""}::${sel}`;
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: {
      getElement: vi.fn(() => ({ getStyles: () => ({}), setStyle: vi.fn(), removeStyle: vi.fn() })),
    },
    styles: {
      getRule: vi.fn((sel: string, mq?: string) => rules.get(key(sel, mq))),
      setRule: vi.fn((sel: string, props: Record<string, string>, opts?: { mediaQuery?: string; pseudo?: string }) => {
        const full = opts?.pseudo ? `${sel}${opts.pseudo}` : sel;
        rules.set(key(full, opts?.mediaQuery), { properties: props, mediaQuery: opts?.mediaQuery, pseudo: opts?.pseudo });
        return rules.get(key(full, opts?.mediaQuery));
      }),
      getBreakpointStyle: vi.fn(() => ({})),
      setBreakpointStyle: vi.fn(),
      removeBreakpointStyleProperty: vi.fn(),
    },
    _rules: rules,
  } as any;
}

describe("useStyleHandlers responsive pseudo integrity", () => {
  const selEl = { id: "el1", type: "box" };

  it("writes mobile :hover under mobile mediaQuery, not desktop", () => {
    vi.useFakeTimers();
    const composer = makeMockComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(selEl, composer, "mobile", "hover")
    );
    act(() => { result.current.handleStyleChange("color", "#f00"); });
    act(() => { vi.advanceTimersByTime(310); });
    vi.useRealTimers();

    const mobileQ = getBreakpointQuery("mobile");
    const call = composer.styles.setRule.mock.calls.find(
      (args: any[]) => args[2]?.mediaQuery === mobileQ && args[2]?.pseudo === ":hover"
    );
    expect(call).toBeTruthy();
  });

  it("reads mobile :hover with mobile mediaQuery", () => {
    const composer = makeMockComposer();
    const mobileQ = getBreakpointQuery("mobile");
    composer.styles.setRule('[data-buildrick-id="el1"]', { color: "#0f0" }, { mediaQuery: mobileQ, pseudo: ":hover" });
    renderHook(() => useStyleHandlers(selEl, composer, "mobile", "hover"));
    expect(composer.styles.getRule).toHaveBeenCalledWith('[data-buildrick-id="el1"]:hover', mobileQ);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts`
Expected: FAIL — `setRule` called without `mediaQuery`; `getRule` called without second arg.

- [ ] **Step 3: Fix read path (load effect)**

Edit `packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts`:

Add import at top:
```ts
import { getBreakpointQuery } from "../../../shared/constants/breakpoints";
```

Replace lines 100-107 with:
```ts
    if (currentPseudoState !== "normal" && composer?.styles) {
      const pseudoSelector = `[data-buildrick-id="${selectedElement.id}"]:${currentPseudoState}`;
      const mq = currentBreakpoint === "desktop" ? undefined : getBreakpointQuery(currentBreakpoint);
      const pseudoRule = composer.styles.getRule(pseudoSelector, mq);
      if (pseudoRule) {
        setStyles((prev) => ({ ...prev, ...pseudoRule.properties }));
      }
    }
```

- [ ] **Step 4: Fix single-prop write path**

Replace the pseudo-state write block in `handleStyleChange`'s timeout (the `if (currentPseudoState !== "normal" && composer?.styles)` inside setTimeout, lines 147-165) with:
```ts
          if (currentPseudoState !== "normal" && composer?.styles) {
            const mq = currentBreakpoint === "desktop" ? undefined : getBreakpointQuery(currentBreakpoint);
            const pseudoSelector = `${selector}:${currentPseudoState}`;
            if (value === "" || value == null) {
              const existingRule = composer.styles.getRule(pseudoSelector, mq);
              if (existingRule) {
                const props = { ...existingRule.properties };
                delete props[property];
                composer.styles.setRule(selector, props, {
                  pseudo: `:${currentPseudoState}`,
                  mediaQuery: mq,
                });
              }
            } else {
              composer.styles.setRule(
                selector,
                { [property]: value },
                { pseudo: `:${currentPseudoState}`, mediaQuery: mq }
              );
            }
          } else if (value === "" || value == null) {
```

- [ ] **Step 5: Fix batch-change pseudo write path**

Replace the pseudo-state batch block (lines 214-238):
```ts
        if (currentPseudoState !== "normal" && composer?.styles) {
          const selector = `[data-buildrick-id="${selectedElement.id}"]`;
          const pseudoSelector = `${selector}:${currentPseudoState}`;
          const mq = currentBreakpoint === "desktop" ? undefined : getBreakpointQuery(currentBreakpoint);
          const existingRule = composer.styles.getRule(pseudoSelector, mq);
          const existing = existingRule ? { ...existingRule.properties } : {};

          Object.entries(changes).forEach(([prop, val]) => {
            if (val === "" || val == null) {
              delete existing[prop];
            } else {
              existing[prop] = val;
            }
          });

          composer.styles.setRule(selector, existing, { pseudo: `:${currentPseudoState}`, mediaQuery: mq });
          setStyles((prev) => {
            const merged = { ...prev };
            Object.entries(changes).forEach(([prop, val]) => {
              if (val === "" || val == null) delete merged[prop];
              else merged[prop] = val;
            });
            return merged;
          });
          return;
        }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "useStyleHandlers|hooks/__tests__"`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts
git commit -m "fix(inspector): route pseudo-state styles through breakpoint mediaQuery

useStyleHandlers read/write/batch paths now pass getBreakpointQuery(currentBreakpoint)
to StyleEngine getRule/setRule, so mobile/tablet :hover etc no longer collide with
desktop pseudo rules.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Reset pseudo-state on element change (High #6)

**Files:**
- Modify: `packages/editor/src/editor/inspector/hooks/useInspectorState.ts:64-78`
- Create: `packages/editor/src/editor/inspector/hooks/__tests__/useInspectorState.pseudoReset.test.ts`

**Why:** Selecting element A in `:hover`, then element B, keeps `:hover` active for B unintentionally.

- [ ] **Step 1: Write failing test**

```ts
// packages/editor/src/editor/inspector/hooks/__tests__/useInspectorState.pseudoReset.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInspectorState } from "../useInspectorState";

describe("useInspectorState pseudo reset", () => {
  it("resets pseudoState to 'normal' when element id changes", () => {
    const { result, rerender } = renderHook(
      ({ el }) => useInspectorState(el),
      { initialProps: { el: { id: "el1", type: "box" } } }
    );
    act(() => { result.current.setCurrentPseudoState("hover"); });
    expect(result.current.currentPseudoState).toBe("hover");

    rerender({ el: { id: "el2", type: "box" } });
    expect(result.current.currentPseudoState).toBe("normal");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useInspectorState.pseudoReset.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add reset effect**

Edit `packages/editor/src/editor/inspector/hooks/useInspectorState.ts`. After the existing tab effect (line 78), add:

```ts
  useEffect(() => {
    setCurrentPseudoState("normal");
  }, [elementId]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useInspectorState.pseudoReset.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/inspector/hooks/useInspectorState.ts packages/editor/src/editor/inspector/hooks/__tests__/useInspectorState.pseudoReset.test.ts
git commit -m "fix(inspector): reset pseudo-state to normal on element change

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: cssContext from effective styles (High #1)

**Files:**
- Modify: `packages/editor/src/editor/inspector/config/cssContext.ts:74-110`
- Modify: `packages/editor/src/editor/inspector/ProInspector.tsx:305-319`
- Create: `packages/editor/src/editor/inspector/config/__tests__/cssContext.effectiveStyles.test.ts`

**Why:** `deriveCssContext` reads `el.getStyles()` (base only), so flex/grid/position branches render wrong under breakpoint or pseudo overrides.

- [ ] **Step 1: Write failing test**

```ts
// packages/editor/src/editor/inspector/config/__tests__/cssContext.effectiveStyles.test.ts
import { describe, it, expect } from "vitest";
import { deriveCssContext } from "../cssContext";

describe("deriveCssContext respects effective styles", () => {
  it("treats overlay display:flex as flex container even when base is block", () => {
    const composer = {
      elements: {
        getElement: () => ({
          getStyles: () => ({ display: "block" }),
          getParent: () => null,
        }),
      },
    } as any;
    const ctx = deriveCssContext(
      { id: "e1", type: "box" },
      composer,
      false,
      { display: "flex" }
    );
    expect(ctx.isFlexContainer).toBe(true);
    expect(ctx.display).toBe("flex");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/inspector/config/__tests__/cssContext.effectiveStyles.test.ts`
Expected: FAIL.

- [ ] **Step 3: Accept effective styles in deriveCssContext**

Edit `packages/editor/src/editor/inspector/config/cssContext.ts`. Add optional 4th param to `deriveCssContext`:

```ts
export function deriveCssContext(
  selectedElement: { id: string; type: string } | null,
  composer: Composer | null | undefined,
  devMode: boolean,
  effectiveStyles?: Record<string, string>,
): CssContext {
```

Inside the function, replace `const styles = el?.getStyles?.() || {};` with:
```ts
  const baseStyles = el?.getStyles?.() || {};
  const styles = effectiveStyles ?? baseStyles;
```

Leave `parentStyles` as base (parent isn't subject to this element's overrides).

- [ ] **Step 4: Pass effective styles from ProInspector**

Edit `packages/editor/src/editor/inspector/ProInspector.tsx`:

Replace line 305-306:
```tsx
  const [contextState, setContextState] = React.useState(() =>
    deriveCssContext(selectedElement, composer, devMode, styles_state)
  );
```

Replace line 318:
```tsx
    setContextState(deriveCssContext(selectedElement, composer, devMode, styles_state));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/inspector/config/__tests__/cssContext.effectiveStyles.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "cssContext|ProInspector"`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/editor/inspector/config/cssContext.ts packages/editor/src/editor/inspector/ProInspector.tsx packages/editor/src/editor/inspector/config/__tests__/cssContext.effectiveStyles.test.ts
git commit -m "fix(inspector): derive CSS context from effective styles (bp + pseudo merged)

deriveCssContext now accepts the merged style map so flex/grid/position detection
reflects the overlay the user is actually editing, not the base rule.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Flush debounced edit on cleanup (High #2)

**Files:**
- Modify: `packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts:51-61, 139-190`
- Create: `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.debounce.test.ts`

**Why:** Changing selection/breakpoint/pseudo within 300ms clears the debounce timer and drops the pending write. Last edit is silently lost.

- [ ] **Step 1: Write failing test**

```ts
// packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.debounce.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";

describe("useStyleHandlers flushes pending edit on element change", () => {
  it("commits pending debounced edit when selection changes before 300ms", () => {
    vi.useFakeTimers();
    const el = { getStyles: () => ({}), setStyle: vi.fn(), removeStyle: vi.fn() };
    const composer = {
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      elements: { getElement: vi.fn(() => el) },
      styles: { getBreakpointStyle: vi.fn(() => ({})) },
    } as any;

    const { result, rerender } = renderHook(
      ({ sel }) => useStyleHandlers(sel, composer, "desktop", "normal"),
      { initialProps: { sel: { id: "e1", type: "box" } } }
    );

    act(() => { result.current.handleStyleChange("color", "#abc"); });
    rerender({ sel: { id: "e2", type: "box" } });

    expect(el.setStyle).toHaveBeenCalledWith("color", "#abc");
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.debounce.test.ts`
Expected: FAIL.

- [ ] **Step 3: Store pending operation ref + flush on cleanup**

Edit `packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts`.

Add below `debounceTimerRef`:
```ts
  const pendingFlushRef = useRef<(() => void) | null>(null);
```

Replace the cleanup effect (lines 53-61) with:
```ts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        if (pendingFlushRef.current) {
          pendingFlushRef.current();
          pendingFlushRef.current = null;
        }
      }
    };
  }, [selectedElement?.id, currentBreakpoint, currentPseudoState]);
```

Inside `handleStyleChange`, extract the setTimeout callback into a named `flush` closure. Replace lines 139-190 with:

```ts
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      const flush = () => {
        const el = composer?.elements.getElement(selectedElement.id);
        if (!el) return;
        composer?.beginTransaction?.("style-change");
        try {
          if (currentPseudoState !== "normal" && composer?.styles) {
            const mq = currentBreakpoint === "desktop" ? undefined : getBreakpointQuery(currentBreakpoint);
            const pseudoSelector = `${selector}:${currentPseudoState}`;
            if (value === "" || value == null) {
              const existingRule = composer.styles.getRule(pseudoSelector, mq);
              if (existingRule) {
                const props = { ...existingRule.properties };
                delete props[property];
                composer.styles.setRule(selector, props, {
                  pseudo: `:${currentPseudoState}`,
                  mediaQuery: mq,
                });
              }
            } else {
              composer.styles.setRule(
                selector,
                { [property]: value },
                { pseudo: `:${currentPseudoState}`, mediaQuery: mq }
              );
            }
          } else if (value === "" || value == null) {
            if (currentBreakpoint === "desktop") {
              el.removeStyle?.(property);
            } else if (composer?.styles) {
              composer.styles.removeBreakpointStyleProperty(
                selectedElement.id,
                currentBreakpoint,
                property
              );
            }
          } else {
            if (currentBreakpoint === "desktop") {
              el.setStyle?.(property, value);
            } else if (composer?.styles) {
              composer.styles.setBreakpointStyle(selectedElement.id, currentBreakpoint, {
                [property]: value,
              });
            }
          }
        } finally {
          composer?.endTransaction?.();
        }
      };
      pendingFlushRef.current = flush;
      debounceTimerRef.current = setTimeout(() => {
        flush();
        pendingFlushRef.current = null;
      }, 300);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.debounce.test.ts`
Expected: PASS.

- [ ] **Step 5: Re-run Task 1 test (regression check)**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.debounce.test.ts
git commit -m "fix(inspector): flush pending debounced style edit on cleanup

Prior: cleanup cleared the timer and silently dropped the last keystroke
when selection/breakpoint/pseudo changed within 300ms. Now we flush the
pending mutation before clearing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Batch handler breakpoint/pseudo routing fix (High #5)

**Files:**
- Modify: `packages/editor/src/editor/inspector/hooks/useBatchStyleHandler.ts`
- Modify callers (`MultiSelectToolbar.tsx`, `BatchStylePanel.tsx`)
- Create: `packages/editor/src/editor/inspector/hooks/__tests__/useBatchStyleHandler.responsive.test.ts`

**Why:** Multi-select batch edits skip breakpoint + pseudo routing entirely, so bulk operations overwrite base styles regardless of active state.

- [ ] **Step 1: Read current handler**

Run: `cat packages/editor/src/editor/inspector/hooks/useBatchStyleHandler.ts`
Identify write paths that call `element.setStyle` / `setStyles` directly without consulting `currentBreakpoint` / `currentPseudoState`.

- [ ] **Step 2: Write failing test**

```ts
// packages/editor/src/editor/inspector/hooks/__tests__/useBatchStyleHandler.responsive.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBatchStyleHandler } from "../useBatchStyleHandler";

describe("useBatchStyleHandler routes through breakpoint+pseudo", () => {
  it("mobile base batch edit uses setBreakpointStyle not el.setStyle", () => {
    const setBp = vi.fn();
    const el = { getStyles: () => ({}), setStyle: vi.fn() };
    const composer = {
      beginTransaction: vi.fn(), endTransaction: vi.fn(),
      elements: { getElement: vi.fn(() => el) },
      styles: { setBreakpointStyle: setBp, getBreakpointStyle: () => ({}) },
    } as any;
    const { result } = renderHook(() =>
      useBatchStyleHandler({
        composer, selectedIds: ["e1", "e2"],
        currentBreakpoint: "mobile", currentPseudoState: "normal",
      } as any)
    );
    act(() => { result.current.applyBatch({ color: "#f00" }); });
    expect(setBp).toHaveBeenCalledTimes(2);
    expect(el.setStyle).not.toHaveBeenCalled();
  });
});
```

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useBatchStyleHandler.responsive.test.ts`
Expected: FAIL.

- [ ] **Step 3: Thread breakpoint/pseudo into handler**

Add `currentBreakpoint: BreakpointId` and `currentPseudoState: PseudoStateId` to the hook's params interface. Replace the write loop with the same 3-way decision tree as `useStyleHandlers.handleStyleChange`:
- pseudo !== "normal" → `composer.styles.setRule(selector, props, { pseudo, mediaQuery })`
- breakpoint !== "desktop" → `composer.styles.setBreakpointStyle(id, bp, changes)`
- else → `el.setStyle(prop, val)` per entry

Wire the two new params from the caller — grep for `useBatchStyleHandler(` and pass the values (likely `MultiSelectToolbar.tsx` / `BatchStylePanel.tsx`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/inspector/hooks/__tests__/useBatchStyleHandler.responsive.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + full inspector suite**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "inspector"`
Run: `cd packages/editor && npx vitest run src/editor/inspector`
Expected: no new TS errors; all inspector tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/inspector/hooks/useBatchStyleHandler.ts packages/editor/src/editor/inspector/hooks/__tests__/useBatchStyleHandler.responsive.test.ts packages/editor/src/editor/inspector/components/MultiSelectToolbar.tsx packages/editor/src/editor/inspector/components/BatchStylePanel.tsx
git commit -m "fix(inspector): batch style edits honor active breakpoint + pseudo

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: SSOT subscriptions for class + raw CSS panels (High #3)

**Files:**
- Modify: `packages/editor/src/editor/inspector/sections/CSSClassesSection.tsx:40-52`
- Modify: `packages/editor/src/editor/inspector/sections/AllCSSSection.tsx` (memo + write path)
- Create: `packages/editor/src/editor/inspector/sections/__tests__/CSSClassesSection.refresh.test.tsx`

**Why:** `useMemo` cached against `[composer, selectedElement.id]` doesn't invalidate when composer mutates the element in place. Stale chips rerender after add/remove; raw CSS panel shows stale text; subsequent edit overwrites newer state.

- [ ] **Step 1: Read current memo shape in CSSClassesSection**

Run: `sed -n '35,55p' packages/editor/src/editor/inspector/sections/CSSClassesSection.tsx`

- [ ] **Step 2: Subscribe to element:updated event**

Replace the `classes` memo with subscribed state:

```ts
  const [classes, setClasses] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!composer || !selectedElement?.id) {
      setClasses([]);
      return;
    }
    const read = () => {
      const el = composer.elements.getElement(selectedElement.id);
      setClasses(el?.getClasses?.() ?? []);
    };
    read();
    const handler = (payload: unknown) => {
      const id = (payload as { id?: string } | undefined)?.id;
      if (!id || id === selectedElement.id) read();
    };
    composer.on("element:updated", handler);
    return () => { composer.off("element:updated", handler); };
  }, [composer, selectedElement?.id]);
```

- [ ] **Step 3: Repeat for AllCSSSection**

Read file first. Convert the memo for the style-text readout to the same subscribe pattern. Wrap raw CSS write in `runTransaction(composer, "raw-css-edit", () => { ... })` to fix undo/redo integrity. Drop the manual `element:updated` emit Codex flagged.

- [ ] **Step 4: Regression test for class list refresh**

```ts
// packages/editor/src/editor/inspector/sections/__tests__/CSSClassesSection.refresh.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CSSClassesSection } from "../CSSClassesSection";

describe("CSSClassesSection refreshes on composer update", () => {
  it("reflects addClass call made via composer after mount", () => {
    const listeners = new Map<string, (p: unknown) => void>();
    const el = {
      _classes: [] as string[],
      getClasses() { return [...this._classes]; },
      addClass(c: string) { this._classes.push(c); },
      removeClass() { /* noop */ },
    };
    const composer = {
      elements: { getElement: () => el },
      styles: { getGlobalClasses: () => [] },
      on: vi.fn((evt: string, cb: any) => { listeners.set(evt, cb); }),
      off: vi.fn((evt: string) => { listeners.delete(evt); }),
    } as any;

    const { queryByText } = render(
      <CSSClassesSection selectedElement={{ id: "e1", type: "box" }} composer={composer} isOpen={true} />
    );
    expect(queryByText(".btn-primary")).toBeNull();

    el.addClass("btn-primary");
    listeners.get("element:updated")?.({ id: "e1" });

    expect(queryByText(".btn-primary")).toBeTruthy();
  });
});
```

Run: `cd packages/editor && npx vitest run src/editor/inspector/sections/__tests__/CSSClassesSection.refresh.test.tsx`
Expected: FAIL before Step 2 fix, PASS after.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/inspector/sections/CSSClassesSection.tsx packages/editor/src/editor/inspector/sections/AllCSSSection.tsx packages/editor/src/editor/inspector/sections/__tests__/CSSClassesSection.refresh.test.tsx
git commit -m "fix(inspector): subscribe class + raw CSS panels to composer events

useMemo cached live element data against static deps, causing stale UI after
add/remove and eventual overwrite of newer state. Now we listen for
element:updated and invalidate. Raw CSS edits also wrap in runTransaction
for proper undo/redo.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: styleKeys slicing audit (Blocker #2)

**Files:**
- Modify: `packages/editor/src/editor/inspector/sections/registry.tsx`
- Create: `packages/editor/src/editor/inspector/sections/__tests__/registry.styleKeys.test.ts`

**Why:** `defineSection` slices `ctx.styles` to each section's declared `styleKeys`. Multiple sections read keys they don't declare (object-fit, grid gaps/alignment, typography white-space/font-style, effects transition fields, layout overflow-x/y). Controls render blank while real styles exist → user edits → real values get overwritten.

**Decision:** Widen `styleKeys` exhaustively per section. Slicing stays for memo equality; the plan is to make declarations accurate.

- [ ] **Step 1: Discover consumed keys per section**

For each section file Codex named, run:
```bash
cd packages/editor
for f in \
  src/editor/inspector/sections/SizeSection.tsx \
  src/editor/inspector/sections/GridSection.tsx \
  src/editor/inspector/sections/EffectsSection.tsx \
  src/editor/inspector/sections/typography/TypographyControls.tsx \
  src/editor/inspector/sections/typography/FontControls.tsx \
  src/editor/inspector/sections/layout/OverflowVisibilityControls.tsx \
  src/editor/inspector/sections/BorderSection.tsx ; do
  echo "=== $f ==="
  grep -oE "styles\\[['\"][a-zA-Z-]+['\"]\\]" "$f" | sort -u
done
```

Record the full key list per section.

- [ ] **Step 2: Update each section's styleKeys in registry.tsx**

Likely additions (confirm from grep output in Step 1):
- `size`: `"object-fit"`
- `border`: `"border-top"`, `"border-right"`, `"border-bottom"`, `"border-left"`, `"outline"`, `"outline-width"`, `"outline-style"`, `"outline-color"`, `"outline-offset"`
- `grid`: every `grid-*` key read
- `typography`: `"white-space"`, `"font-style"`, `"text-decoration"` family
- `effects`: `"transition"` family, `"transform"`, `"filter"`, `"backdrop-filter"`, `"mix-blend-mode"`
- `layout`: `"overflow-x"`, `"overflow-y"`, `"visibility"`, `"z-index"`, `"top"`, `"right"`, `"bottom"`, `"left"`, `"inset"`

- [ ] **Step 3: Add registry integrity test**

```ts
// packages/editor/src/editor/inspector/sections/__tests__/registry.styleKeys.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { SECTION_REGISTRY } from "../registry";
import path from "node:path";

const sectionFileMap: Record<string, string[]> = {
  size: ["../SizeSection.tsx"],
  border: ["../BorderSection.tsx"],
  "corner-radius": ["../CornerRadiusSection.tsx"],
  grid: ["../GridSection.tsx"],
  typography: [
    "../typography/TypographyControls.tsx",
    "../typography/FontControls.tsx",
  ],
  effects: ["../EffectsSection.tsx"],
  layout: ["../layout/OverflowVisibilityControls.tsx"],
};

function styleKeysRead(file: string): Set<string> {
  const src = readFileSync(path.join(__dirname, file), "utf8");
  const keys = new Set<string>();
  for (const m of src.matchAll(/styles\[['"]([a-zA-Z-]+)['"]\]/g)) {
    keys.add(m[1]);
  }
  return keys;
}

describe("SECTION_REGISTRY styleKeys exhaustiveness", () => {
  for (const [id, files] of Object.entries(sectionFileMap)) {
    it(`${id} declares every key its files read`, () => {
      const declared = new Set((SECTION_REGISTRY as any)[id]?.styleKeys ?? []);
      const read = new Set<string>();
      for (const f of files) for (const k of styleKeysRead(f)) read.add(k);
      const missing = [...read].filter((k) => !declared.has(k));
      expect(missing).toEqual([]);
    });
  }
});
```

Run: `cd packages/editor && npx vitest run src/editor/inspector/sections/__tests__/registry.styleKeys.test.ts`
Expected: FAIL listing missing keys per section; iterate `styleKeys` arrays in registry.tsx until PASS.

- [ ] **Step 4: Full inspector suite**

Run: `cd packages/editor && npx vitest run src/editor/inspector`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/inspector/sections/registry.tsx packages/editor/src/editor/inspector/sections/__tests__/registry.styleKeys.test.ts
git commit -m "fix(inspector): widen SECTION_REGISTRY styleKeys to match consumed keys

Sections read keys like object-fit, white-space, transition, overflow-x/y that
weren't in their styleKeys slice; controls rendered blank over real values and
user edits overwrote them. Added registry integrity test that greps
styles[...] reads per section file and asserts declared keys cover them.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Tab auto-select stability (Medium #6)

**Files:**
- Modify: `packages/editor/src/editor/inspector/hooks/useInspectorState.ts:72-78`

**Why:** Effect dep array includes the whole `selectedElement` object, so unstable parent props reset the user's tab choice on every re-render.

- [ ] **Step 1: Narrow deps to scalar keys**

Replace lines 72-78 with:
```ts
  const elementType = selectedElement?.type;
  const elementTagName = selectedElement?.tagName;

  useEffect(() => {
    if (!elementType) return;
    const recommendedTab = getRecommendedTab(elementType, elementTagName);
    setActiveTab(recommendedTab);
  }, [elementId, elementType, elementTagName]);
```

- [ ] **Step 2: Run existing useInspectorState tests**

Run: `cd packages/editor && npx vitest run src/editor/inspector/__tests__/useInspectorState.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/inspector/hooks/useInspectorState.ts
git commit -m "fix(inspector): stabilize tab auto-select deps (no object identity)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: LinkSection validation consistency (Medium #3)

**Files:**
- Modify: `packages/editor/src/editor/inspector/sections/LinkSection.tsx:193-220`
- Create: `packages/editor/src/editor/inspector/sections/__tests__/LinkSection.validation.test.tsx`

**Why:** Only URL type blocks invalid input. Email/phone/anchor still commit invalid strings to `href`.

- [ ] **Step 1: Read current validators**

Run: `sed -n '180,230p' packages/editor/src/editor/inspector/sections/LinkSection.tsx`

- [ ] **Step 2: Extract uniform validator + gate write**

Add at top of file:
```ts
const VALIDATORS: Record<string, (v: string) => boolean> = {
  url: (v) => v === "" || /^https?:\/\/[^\s]+/.test(v),
  email: (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => v === "" || /^\+?[0-9\s\-().]{4,}$/.test(v),
  anchor: (v) => v === "" || /^#[A-Za-z][\w-]*$/.test(v),
};
```

At every `updateHref(value)` call (email/phone/anchor branches), wrap with:
```ts
if (VALIDATORS[linkType]?.(value) ?? true) updateHref(value);
```

- [ ] **Step 3: Regression test**

```ts
// packages/editor/src/editor/inspector/sections/__tests__/LinkSection.validation.test.tsx
// Drives LinkSection with linkType="email" and verifies that an invalid
// input string does NOT trigger the update callback.
```

Write a minimal render + fireEvent scenario after reading the actual LinkSection prop shape. Run, expect FAIL before gate, PASS after.

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/editor/inspector/sections/LinkSection.tsx packages/editor/src/editor/inspector/sections/__tests__/LinkSection.validation.test.tsx
git commit -m "fix(inspector): gate every link-type write behind validation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Remove dead UI controls (Medium #4 + Low #3)

**Files:**
- Modify: `packages/editor/src/editor/inspector/ProInspector.tsx` — delete Lock button block at line 501-510
- Modify: `packages/editor/src/editor/inspector/sections/SizeSection.tsx` — delete fake aspect-ratio lock

**Why:** Interactive-looking controls with no behavior mislead users. Ratio lock especially — implies aspect-ratio locking that doesn't happen. Pick button is preserved (local state + event emission is a wired API seam, not dead UI).

- [ ] **Step 1: Remove Lock button from ProInspector.tsx**

Delete the `<button ... title="Lock element" ...>` block that renders `<Lock size={12} ... />`. Also remove `Lock` from the lucide-react import line at the top if unused elsewhere.

- [ ] **Step 2: Remove aspect-ratio lock from SizeSection.tsx**

Delete the `const [aspectLocked, setAspectLocked] = React.useState(false);` line. Delete the `.bdi-link` button between the W and H cells. Replace that cell with `<span className="bdi-pair-sep" aria-hidden="true" />` so the grid columns still align. Remove `Link2` / `Link2Off` imports if unused after this.

- [ ] **Step 3: Typecheck**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "ProInspector|SizeSection"`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/editor/inspector/ProInspector.tsx packages/editor/src/editor/inspector/sections/SizeSection.tsx
git commit -m "chore(inspector): remove dead UI (Lock button, fake aspect-ratio lock)

Both were interactive-looking with no engine wiring. Real aspect-ratio
support is a separate feature; until wired, don't ship a misleading toggle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Update stale tests

**Files:**
- Delete: `packages/editor/src/editor/inspector/__tests__/ElementIdCopy.test.tsx`
- Modify: `packages/editor/src/editor/inspector/__tests__/Section.test.tsx`
- Modify: `packages/editor/src/editor/inspector/__tests__/CSSClassesSection.test.tsx`

**Why:** Copy-ID removed per user. Section preview now renders when open. CSSClasses empty state + add-chip inline differ from asserted DOM.

- [ ] **Step 1: Delete ElementIdCopy test**

```bash
git rm packages/editor/src/editor/inspector/__tests__/ElementIdCopy.test.tsx
```

- [ ] **Step 2: Update Section.test.tsx preview assertions**

Run: `sed -n '25,55p' packages/editor/src/editor/inspector/__tests__/Section.test.tsx`
Replace any assertion of the form "preview not rendered when isOpen=true" with "preview rendered when isOpen=true". Keep the collapsed case (preview also rendered).

- [ ] **Step 3: Update CSSClassesSection.test.tsx**

Run: `sed -n '25,80p' packages/editor/src/editor/inspector/__tests__/CSSClassesSection.test.tsx`
Update: section title `"CSS Classes"` → `"Classes"`. Replace expectations about the standalone text input + Add button with expectations about the inline `+` chip that toggles to an inline input. Empty state no longer shows the "No classes — add one below" text.

- [ ] **Step 4: Run full suite**

Run: `cd packages/editor && npx vitest run src/editor/inspector`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/inspector/__tests__/Section.test.tsx packages/editor/src/editor/inspector/__tests__/CSSClassesSection.test.tsx
git commit -m "test(inspector): align tests with current Section preview + Classes anatomy

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Verification checklist (run after all tasks)

- [ ] `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "inspector"` — no inspector errors
- [ ] `cd packages/editor && npx vitest run src/editor/inspector` — all pass
- [ ] `npm run dev` at repo root — inspector renders for box/text/button/image without console errors
- [ ] Manual smoke: select element → switch to tablet → edit color on `:hover` → switch breakpoint back to desktop → confirm desktop `:hover` unaffected
- [ ] Manual smoke: select element A → enter `:hover` → select element B → confirm pseudo resets to `normal`
- [ ] Manual smoke: select a flex element → add `display:flex` via mobile override → confirm flex-specific sections show
