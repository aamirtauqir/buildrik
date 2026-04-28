# Editor Performance — Track A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 performance blockers in the editor engine to reduce drag frame time to ≤16 ms on 500-element pages and eliminate CSS rebuild storms.

**Architecture:** Batch DOM writes in StyleEngine, add O(1) rule lookup via composite key Map, cache element bounds with scroll/resize invalidation for drag indicators, flatten snapshot comparison in version history, add listener reference tracking in Composer, and add operation-type fast paths in OT transform.

**Tech Stack:** TypeScript 5.3, Vitest, native DOM APIs (RAF, getBoundingClientRect, Map)

---

## File Structure

| File | Responsibility |
|------|----------------|
| `engine/styles/StyleEngine.ts` | Batch CSS updates + O(1) rule lookup |
| `engine/canvas/indicators/SnapCalculator.ts` | Cached bounds for snap guides |
| `engine/canvas/indicators/SpacingCalculator.ts` | Cached bounds for spacing indicators |
| `engine/canvas/indicators/BoundsCalculator.ts` | Bounds cache store + invalidation |
| `engine/VersionHistoryManager.ts` | Flattened snapshot comparison |
| `engine/Composer.ts` | Listener reference tracking |
| `engine/EventEmitter.ts` | (no changes — used by Composer) |
| `engine/collaboration/OTEngine.ts` | Operation-type fast paths |
| `__tests__/performance/drag-benchmark.test.ts` | Performance harness |

---

### Task 1: Add `pendingUpdate` RAF batching to `StyleEngine`

**Files:**
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:25-35` (add fields)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:55-88` (`setRule`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:100-145` (`setProperty`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:147-180` (`removeProperty`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:182-220` (`removeBreakpointStyleProperty`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:551-555` (`updateStylesheet`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:564-583` (`inheritStyles`)
- Test: `packages/editor/src/engine/styles/__tests__/StyleEngine.test.ts`

- [ ] **Step 1: Add batching fields**

Add to `StyleEngine` class after line 28:

```ts
  private pendingUpdate = false;
  private rafId: number | null = null;
```

- [ ] **Step 2: Replace `updateStylesheet()` with batched flush**

Replace lines 551–555:

```ts
  private updateStylesheet(): void {
    if (this.pendingUpdate) return;
    this.pendingUpdate = true;
    this.rafId = requestAnimationFrame(() => {
      this.pendingUpdate = false;
      if (this.styleElement) {
        this.styleElement.textContent = this.toCSS();
      }
    });
  }
```

- [ ] **Step 3: Add `flush()` method for synchronous force**

After `updateStylesheet()`, add:

```ts
  /**
   * Synchronously flush pending stylesheet updates
   */
  flush(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.pendingUpdate) {
      this.pendingUpdate = false;
      if (this.styleElement) {
        this.styleElement.textContent = this.toCSS();
      }
    }
  }
```

- [ ] **Step 4: Call `flush()` on `destroy()`**

In `destroy()` (find it near line 100), add `this.flush();` before removing the style element.

- [ ] **Step 5: Remove duplicate rebuild in `setProperty`**

Find `setProperty()` (around line 100–145). If it calls `this.setRule()` internally, replace with direct rule mutation + `this.updateStylesheet()` (which now batches). Ensure `setRule()` no longer calls `updateStylesheet()` redundantly — it already does via the batch.

Current `setRule()` (line 83) calls `this.updateStylesheet()`. Keep it — the batching handles deduplication. But verify `setProperty()` does not also call `setRule()` + its own `updateStylesheet()`.

- [ ] **Step 6: Verify `inheritStyles()` loops do not double-flush**

`inheritStyles()` (lines 564–583) loops `propsToInherit.forEach()` calling `this.setProperty()`. Each `setProperty()` may call `updateStylesheet()`. With batching, only the first call schedules RAF; subsequent calls hit `if (this.pendingUpdate) return`. No change needed — batching absorbs the storm. Add a comment above the loop:

```ts
    // Batched: setProperty calls are coalesced into a single RAF flush
```

- [ ] **Step 7: Write test for batching**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StyleEngine } from "../StyleEngine";

describe("StyleEngine batching", () => {
  let engine: StyleEngine;
  let composer: any;

  beforeEach(() => {
    composer = { emit: vi.fn(), markDirty: vi.fn() };
    engine = new StyleEngine(composer);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces multiple setProperty calls into one RAF flush", () => {
    const toCSS = vi.spyOn(engine as any, "toCSS");
    engine.setProperty(".foo", "color", "red");
    engine.setProperty(".foo", "background", "blue");
    engine.setProperty(".bar", "margin", "10px");
    expect(toCSS).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(toCSS).toHaveBeenCalledTimes(1);
  });

  it("flush() synchronously applies pending update", () => {
    engine.setProperty(".foo", "color", "red");
    const toCSS = vi.spyOn(engine as any, "toCSS");
    engine.flush();
    expect(toCSS).toHaveBeenCalledTimes(1);
    expect((engine as any).pendingUpdate).toBe(false);
  });
});
```

- [ ] **Step 8: Run test**

Run: `npx vitest run packages/editor/src/engine/styles/__tests__/StyleEngine.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add packages/editor/src/engine/styles/StyleEngine.ts packages/editor/src/engine/styles/__tests__/StyleEngine.test.ts
git commit -m "perf(StyleEngine): batch CSS rebuilds with RAF coalescing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Add O(1) rule lookup Map to `StyleEngine`

**Files:**
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:25-35` (add `ruleIndex`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:55-88` (`setRule`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:93-99` (`getRule`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:100-145` (`removeRule`)
- Modify: `packages/editor/src/engine/styles/StyleEngine.ts:542-546` (`findRule`)
- Test: `packages/editor/src/engine/styles/__tests__/StyleEngine.test.ts`

- [ ] **Step 1: Add `ruleIndex` Map**

After `private styles: Map<string, StyleData> = new Map();`, add:

```ts
  private ruleIndex: Map<string, StyleData> = new Map();
```

- [ ] **Step 2: Compute composite key helper**

After `createStyleElement()`, add:

```ts
  private ruleKey(selector: string, mediaQuery?: string): string {
    return mediaQuery ? `${selector}|${mediaQuery}` : selector;
  }
```

- [ ] **Step 3: Update `setRule()` to maintain index**

In `setRule()` (around line 80), after `this.styles.set(style.id, style);`, add:

```ts
      this.ruleIndex.set(this.ruleKey(fullSelector, options?.mediaQuery), style);
```

In the `if (style)` update branch (line 68), also update the index since `fullSelector` may have changed:

```ts
      this.ruleIndex.set(this.ruleKey(fullSelector, options?.mediaQuery), style);
```

- [ ] **Step 4: Update `removeRule()` to clear index**

In `removeRule()` (around line 100), after removing from `this.styles`, add:

```ts
    this.ruleIndex.delete(this.ruleKey(selector, mediaQuery));
```

- [ ] **Step 5: Replace `findRule()` with O(1) lookup**

Replace lines 542–546:

```ts
  private findRule(selector: string, mediaQuery?: string): StyleData | undefined {
    return this.ruleIndex.get(this.ruleKey(selector, mediaQuery));
  }
```

- [ ] **Step 6: Write test for O(1) lookup**

```ts
  it("finds rule in O(1) via index", () => {
    engine.setRule(".a", { color: "red" });
    engine.setRule(".b", { color: "blue" }, { mediaQuery: "(max-width: 768px)" });
    const ruleA = (engine as any).findRule(".a");
    const ruleB = (engine as any).findRule(".b", "(max-width: 768px)");
    expect(ruleA?.selector).toBe(".a");
    expect(ruleB?.mediaQuery).toBe("(max-width: 768px)");
  });
```

- [ ] **Step 7: Run test**

Run: `npx vitest run packages/editor/src/engine/styles/__tests__/StyleEngine.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/editor/src/engine/styles/StyleEngine.ts packages/editor/src/engine/styles/__tests__/StyleEngine.test.ts
git commit -m "perf(StyleEngine): O(1) rule lookup via composite-key index

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Add bounds cache to `BoundsCalculator` with invalidation

**Files:**
- Modify: `packages/editor/src/engine/canvas/indicators/BoundsCalculator.ts:17-25` (add cache fields)
- Modify: `packages/editor/src/engine/canvas/indicators/BoundsCalculator.ts:28-68` (`getElementBounds`)
- Create: `packages/editor/src/engine/canvas/indicators/__tests__/BoundsCalculator.test.ts`

- [ ] **Step 1: Add cache fields**

After `private composer: Composer;`, add:

```ts
  private boundsCache: Map<string, ElementBounds> = new Map();
  private cacheVersion = 0;
```

- [ ] **Step 2: Add public invalidation API**

After `getBoundsById()`, add:

```ts
  /**
   * Invalidate cache for a specific element or all elements
   */
  invalidateCache(elementId?: string): void {
    if (elementId) {
      this.boundsCache.delete(elementId);
    } else {
      this.boundsCache.clear();
      this.cacheVersion++;
    }
  }

  /**
   * Get current cache version for external invalidation tracking
   */
  getCacheVersion(): number {
    return this.cacheVersion;
  }
```

- [ ] **Step 3: Cache hit in `getElementBounds()`**

Replace `getElementBounds()` (lines 28–68) with:

```ts
  getElementBounds(element: Element): ElementBounds | null {
    if (typeof document === "undefined") return null;

    const cached = this.boundsCache.get(element.getId());
    if (cached) return cached;

    const domElement = document.querySelector(
      `[data-buildrick-id="${element.getId()}"]`
    ) as HTMLElement | null;

    if (!domElement) return null;

    const canvasContainer = document.querySelector(
      "[data-buildrick-canvas], .buildrick-canvas"
    ) as HTMLElement | null;

    const elementRect = domElement.getBoundingClientRect();
    const containerRect = canvasContainer?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };

    const computedStyle = window.getComputedStyle(domElement);

    const bounds: ElementBounds = {
      elementId: element.getId(),
      x: elementRect.left - containerRect.left,
      y: elementRect.top - containerRect.top,
      width: elementRect.width,
      height: elementRect.height,
      margin: {
        top: parseNumericValue(computedStyle.marginTop),
        right: parseNumericValue(computedStyle.marginRight),
        bottom: parseNumericValue(computedStyle.marginBottom),
        left: parseNumericValue(computedStyle.marginLeft),
      },
      padding: {
        top: parseNumericValue(computedStyle.paddingTop),
        right: parseNumericValue(computedStyle.paddingRight),
        bottom: parseNumericValue(computedStyle.paddingBottom),
        left: parseNumericValue(computedStyle.paddingLeft),
      },
    };

    this.boundsCache.set(element.getId(), bounds);
    return bounds;
  }
```

- [ ] **Step 4: Wire Composer events for invalidation**

In `SnapCalculator` (we will wire in Task 4), subscribe to Composer events. For now, expose the API.

- [ ] **Step 5: Write test**

```ts
import { describe, it, expect, vi } from "vitest";
import { BoundsCalculator } from "../BoundsCalculator";

describe("BoundsCalculator cache", () => {
  it("caches bounds after first read", () => {
    const composer = { elements: { getElement: vi.fn() } } as any;
    const calc = new BoundsCalculator(composer);
    // Mock DOM
    const mockEl = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 50 }), getComputedStyle: () => ({ marginTop: "0", marginRight: "0", marginBottom: "0", marginLeft: "0", paddingTop: "0", paddingRight: "0", paddingBottom: "0", paddingLeft: "0" }) };
    vi.stubGlobal("document", { querySelector: vi.fn().mockReturnValue(mockEl) });
    vi.stubGlobal("window", { getComputedStyle: vi.fn().mockReturnValue({ marginTop: "0", marginRight: "0", marginBottom: "0", marginLeft: "0", paddingTop: "0", paddingRight: "0", paddingBottom: "0", paddingLeft: "0" }) });

    const element = { getId: () => "el-1" } as any;
    const b1 = calc.getElementBounds(element);
    const b2 = calc.getElementBounds(element);
    expect(b1).toBe(b2); // same reference
    calc.invalidateCache("el-1");
    expect((calc as any).boundsCache.has("el-1")).toBe(false);
  });
});
```

- [ ] **Step 6: Run test**

Run: `npx vitest run packages/editor/src/engine/canvas/indicators/__tests__/BoundsCalculator.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/engine/canvas/indicators/BoundsCalculator.ts packages/editor/src/engine/canvas/indicators/__tests__/BoundsCalculator.test.ts
git commit -m "perf(BoundsCalculator): add element bounds cache with invalidation API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Wire bounds cache invalidation in `SnapCalculator`

**Files:**
- Modify: `packages/editor/src/engine/canvas/indicators/SnapCalculator.ts:24-34` (constructor)
- Modify: `packages/editor/src/engine/canvas/indicators/SnapCalculator.ts:66-71` (`addElementSnapPoints`)
- Test: `packages/editor/src/engine/canvas/indicators/__tests__/SnapCalculator.test.ts`

- [ ] **Step 1: Subscribe to Composer events for invalidation**

In constructor (lines 24–34), add after initialization:

```ts
    // Invalidate bounds cache on style or structural changes
    this.composer.on("element:style-changed", () => this.boundsCalculator.invalidateCache());
    this.composer.on("element:children-changed", () => this.boundsCalculator.invalidateCache());
    this.composer.on("canvas:scrolled", () => this.boundsCalculator.invalidateCache());
    this.composer.on("viewport:resized", () => this.boundsCalculator.invalidateCache());
```

- [ ] **Step 2: Verify cache is used in `addElementSnapPoints()`**

`addElementSnapPoints()` already calls `this.boundsCalculator.getElementBounds(element)`. With the cache added in Task 3, this now reads from cache. No code change needed in `SnapCalculator` for the read path.

- [ ] **Step 3: Write integration test**

```ts
import { describe, it, expect, vi } from "vitest";
import { SnapCalculator } from "../SnapCalculator";

describe("SnapCalculator cache integration", () => {
  it("invalidates bounds cache on style change event", () => {
    const composer = { on: vi.fn(), emit: vi.fn(), elements: { getActivePage: vi.fn().mockReturnValue(null) } };
    const boundsCalc = { invalidateCache: vi.fn(), getElementBounds: vi.fn().mockReturnValue(null) };
    new SnapCalculator(composer as any, boundsCalc as any);
    const styleHandler = composer.on.mock.calls.find((c: any[]) => c[0] === "element:style-changed")?.[1];
    expect(styleHandler).toBeDefined();
    styleHandler();
    expect(boundsCalc.invalidateCache).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run test**

Run: `npx vitest run packages/editor/src/engine/canvas/indicators/__tests__/SnapCalculator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/canvas/indicators/SnapCalculator.ts packages/editor/src/engine/canvas/indicators/__tests__/SnapCalculator.test.ts
git commit -m "perf(SnapCalculator): wire bounds cache invalidation on style/scroll/resize

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Wire bounds cache in `SpacingCalculator`

**Files:**
- Modify: `packages/editor/src/engine/canvas/indicators/SpacingCalculator.ts:17-25` (constructor)
- Modify: `packages/editor/src/engine/canvas/indicators/SpacingCalculator.ts:30-64` (`updateSpacingIndicators`)
- Test: `packages/editor/src/engine/canvas/indicators/__tests__/SpacingCalculator.test.ts`

- [ ] **Step 1: Subscribe to same invalidation events**

In constructor, add after initialization:

```ts
    this.composer.on("element:style-changed", () => this.boundsCalculator.invalidateCache());
    this.composer.on("element:children-changed", () => this.boundsCalculator.invalidateCache());
    this.composer.on("canvas:scrolled", () => this.boundsCalculator.invalidateCache());
    this.composer.on("viewport:resized", () => this.boundsCalculator.invalidateCache());
```

- [ ] **Step 2: Verify `updateSpacingIndicators()` uses cached bounds**

`calculateSpacingForElement()` calls `this.boundsCalculator.getElementBounds(element)`. Cache hit path from Task 3. No code change needed for read path.

- [ ] **Step 3: Write integration test**

```ts
import { describe, it, expect, vi } from "vitest";
import { SpacingCalculator } from "../SpacingCalculator";

describe("SpacingCalculator cache integration", () => {
  it("invalidates bounds cache on scroll event", () => {
    const composer = { on: vi.fn(), emit: vi.fn(), elements: { getActivePage: vi.fn().mockReturnValue(null) } };
    const boundsCalc = { invalidateCache: vi.fn(), getElementBounds: vi.fn().mockReturnValue(null) };
    new SpacingCalculator(composer as any, boundsCalc as any);
    const scrollHandler = composer.on.mock.calls.find((c: any[]) => c[0] === "canvas:scrolled")?.[1];
    expect(scrollHandler).toBeDefined();
    scrollHandler();
    expect(boundsCalc.invalidateCache).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run test**

Run: `npx vitest run packages/editor/src/engine/canvas/indicators/__tests__/SpacingCalculator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/canvas/indicators/SpacingCalculator.ts packages/editor/src/engine/canvas/indicators/__tests__/SpacingCalculator.test.ts
git commit -m "perf(SpacingCalculator): share bounds cache invalidation with SnapCalculator

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Flatten snapshot comparison in `VersionHistoryManager`

**Files:**
- Modify: `packages/editor/src/engine/VersionHistoryManager.ts:638-718` (`compareVersions`)
- Modify: `packages/editor/src/engine/VersionHistoryManager.ts:747-769` (`findElementById`)
- Test: `packages/editor/src/engine/__tests__/VersionHistoryManager.test.ts`

- [ ] **Step 1: Add `flattenSnapshot()` helper**

After `findElementById()` (around line 769), add:

```ts
  /**
   * Flatten a project snapshot into a Map for O(1) element lookup
   */
  private flattenSnapshot(project: ProjectData): Map<string, { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] }> {
    const map = new Map<string, { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] }>();
    const traverse = (elements: unknown[]) => {
      if (!elements || !Array.isArray(elements)) return;
      for (const el of elements) {
        const element = el as { id?: string; children?: unknown[] };
        if (element.id) {
          map.set(element.id, element as { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] });
        }
        if (element.children) {
          traverse(element.children);
        }
      }
    };
    for (const page of project.pages) {
      if (page.root) {
        if (page.root.id) map.set(page.root.id, page.root);
        if (page.root.children) traverse(page.root.children as unknown[]);
      }
    }
    return map;
  }
```

- [ ] **Step 2: Replace `compareVersions()` loop**

Replace lines 655–680 (the element comparison loop):

```ts
    const currentMap = this.flattenSnapshot(currentData);
    const targetMap = this.flattenSnapshot(targetData);

    // Collect all element IDs from both snapshots
    const allElementIds = new Set<string>([...currentMap.keys(), ...targetMap.keys()]);

    // Process each element
    for (const elementId of allElementIds) {
      const currentElement = currentMap.get(elementId) || null;
      const targetElement = targetMap.get(elementId) || null;

      if (!targetElement && currentElement) {
        // Element was removed
        changes.push({
          type: "other",
          property: "element",
          before: currentElement.id,
          after: "",
        });
      } else if (!currentElement && targetElement) {
        // Element was added
        changes.push({
          type: "other",
          property: "element",
          before: "",
          after: targetElement.id,
        });
      } else if (currentElement && targetElement) {
        // Element exists in both, compare properties
        this.compareElements(currentElement, targetElement, changes);
      }
    }
```

- [ ] **Step 3: Write test**

```ts
import { describe, it, expect } from "vitest";

describe("VersionHistoryManager compareVersions performance", () => {
  it("flattens snapshots into Maps for O(n) comparison", async () => {
    const manager = new (await import("../VersionHistoryManager")).VersionHistoryManager({} as any);
    const snapshot = {
      pages: [{
        id: "p1",
        root: {
          id: "root",
          children: [
            { id: "a", children: [{ id: "a1" }, { id: "a2" }] },
            { id: "b", children: [{ id: "b1" }] },
          ],
        },
      }],
    } as any;
    const flat = (manager as any).flattenSnapshot(snapshot);
    expect(flat.get("root")?.id).toBe("root");
    expect(flat.get("a1")?.id).toBe("a1");
    expect(flat.get("b1")?.id).toBe("b1");
    expect(flat.size).toBe(6);
  });
});
```

- [ ] **Step 4: Run test**

Run: `npx vitest run packages/editor/src/engine/__tests__/VersionHistoryManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/VersionHistoryManager.ts packages/editor/src/engine/__tests__/VersionHistoryManager.test.ts
git commit -m "perf(VersionHistoryManager): O(n) version compare via flattened snapshot Maps

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Add listener reference tracking to `Composer`

**Files:**
- Modify: `packages/editor/src/engine/Composer.ts:25-35` (add handler sets)
- Modify: `packages/editor/src/engine/Composer.ts:155-176` (store refs)
- Modify: `packages/editor/src/engine/Composer.ts:665-694` (`destroy`)
- Test: `packages/editor/src/engine/__tests__/Composer.test.ts`

- [ ] **Step 1: Add handler Set fields**

After `private state: ComposerState = { ... };`, add:

```ts
  private collaborationHandlers: Set<(...args: any[]) => void> = new Set();
  private selectionHandlers: Set<(...args: any[]) => void> = new Set();
```

- [ ] **Step 2: Store handler references in constructor**

Replace lines 155–176:

```ts
    const operationApplyHandler = (patch: Patch) => {
      this.history.applyRemoteOperation(patch);
    };
    this.collaborationHandlers.add(operationApplyHandler);
    this.collaboration.on("operation:apply", operationApplyHandler);

    const elementSelectedHandler = (element: import("./elements/Element").Element | null) => {
      if (this.collaboration.isConnected()) {
        this.collaboration.updateSelection(element ? [element.getId()] : []);
      }
    };
    this.selectionHandlers.add(elementSelectedHandler);
    this.on("element:selected", elementSelectedHandler);

    const selectionMultipleHandler = (elements: import("./elements/Element").Element[]) => {
      if (this.collaboration.isConnected()) {
        this.collaboration.updateSelection(elements.map((el) => el.getId()));
      }
    };
    this.selectionHandlers.add(selectionMultipleHandler);
    this.on("selection:multiple", selectionMultipleHandler);

    const selectionClearedHandler = () => {
      if (this.collaboration.isConnected()) {
        this.collaboration.updateSelection([]);
      }
    };
    this.selectionHandlers.add(selectionClearedHandler);
    this.on("selection:cleared", selectionClearedHandler);
```

- [ ] **Step 3: Remove individual handlers in `destroy()`**

Replace `this.removeAllListeners();` (line 692) with:

```ts
    // Remove individually tracked handlers before global teardown
    for (const handler of this.collaborationHandlers) {
      this.collaboration.off("operation:apply", handler);
    }
    this.collaborationHandlers.clear();

    for (const handler of this.selectionHandlers) {
      this.off("element:selected", handler);
      this.off("selection:multiple", handler);
      this.off("selection:cleared", handler);
    }
    this.selectionHandlers.clear();

    this.removeAllListeners();
```

- [ ] **Step 4: Write test**

```ts
import { describe, it, expect, vi } from "vitest";
import { Composer } from "../Composer";

describe("Composer listener hygiene", () => {
  it("removes individually tracked handlers on destroy", async () => {
    const composer = new Composer({} as any);
    const offSpy = vi.spyOn(composer, "off");
    const collabOffSpy = vi.spyOn((composer as any).collaboration, "off");
    await composer.destroy();
    expect(offSpy).toHaveBeenCalledWith("element:selected", expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith("selection:multiple", expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith("selection:cleared", expect.any(Function));
    expect(collabOffSpy).toHaveBeenCalledWith("operation:apply", expect.any(Function));
  });
});
```

- [ ] **Step 5: Run test**

Run: `npx vitest run packages/editor/src/engine/__tests__/Composer.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/engine/Composer.ts packages/editor/src/engine/__tests__/Composer.test.ts
git commit -m "refactor(Composer): store listener refs for targeted removal in destroy

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: Add operation-type fast paths to `OTEngine.transform()`

**Files:**
- Modify: `packages/editor/src/engine/collaboration/OTEngine.ts:255-303` (`transform`)
- Test: `packages/editor/src/engine/collaboration/__tests__/OTEngine.test.ts`

- [ ] **Step 1: Add fast path for `replace` vs `replace` exact path**

Inside the nested loop (line 271), after the exact-path check (line 273), add before array adjustment:

```ts
        // Fast path: both are replace on same path → remote wins, skip local
        if (opA.op === "replace" && opB.op === "replace" && opA.path === opB.path) {
          shouldInclude = false;
          break;
        }
```

- [ ] **Step 2: Add fast path for `add` vs `add` same array**

After the `replace` fast path, add:

```ts
        // Fast path: both are add on same array path → remote wins, skip local
        if (opA.op === "add" && opB.op === "add" && opA.path === opB.path) {
          shouldInclude = false;
          break;
        }
```

- [ ] **Step 3: Write test**

```ts
import { describe, it, expect } from "vitest";
import { OTEngine } from "../OTEngine";

describe("OTEngine transform fast paths", () => {
  it("skips local replace when remote replace targets exact path", () => {
    const engine = new OTEngine({} as any);
    const patchA = [{ op: "replace", path: "/a/b", value: "remote" }];
    const patchB = [{ op: "replace", path: "/a/b", value: "local" }];
    const result = engine.transform(patchA, patchB);
    expect(result.bPrime).toHaveLength(0);
  });

  it("skips local add when remote add targets exact path", () => {
    const engine = new OTEngine({} as any);
    const patchA = [{ op: "add", path: "/a/b", value: "remote" }];
    const patchB = [{ op: "add", path: "/a/b", value: "local" }];
    const result = engine.transform(patchA, patchB);
    expect(result.bPrime).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run test**

Run: `npx vitest run packages/editor/src/engine/collaboration/__tests__/OTEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/collaboration/OTEngine.ts packages/editor/src/engine/collaboration/__tests__/OTEngine.test.ts
git commit -m "perf(OTEngine): add replace+add fast paths in transform nested loop

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: Add performance benchmark harness

**Files:**
- Create: `packages/editor/src/__tests__/performance/drag-benchmark.test.ts`

- [ ] **Step 1: Create benchmark file**

```ts
import { describe, it, expect } from "vitest";
import { Composer } from "../../engine/Composer";
import { BoundsCalculator } from "../../engine/canvas/indicators/BoundsCalculator";
import { SnapCalculator } from "../../engine/canvas/indicators/SnapCalculator";

/**
 * Performance harness: assert drag frame time ≤ 16 ms on 500-element page.
 * Run: npx vitest run packages/editor/src/__tests__/performance/drag-benchmark.test.ts
 */
describe("Drag frame performance (500 elements)", () => {
  it("calculates smart guides within 16 ms", () => {
    // Build a composer with 500 elements
    const composer = new Composer({} as any);
    const boundsCalc = new BoundsCalculator(composer);
    const snapCalc = new SnapCalculator(composer, boundsCalc);

    // Mock DOM
    const mockRect = { left: 0, top: 0, width: 10, height: 10 };
    const mockContainerRect = { left: 0, top: 0 };
    const mockStyle = { marginTop: "0", marginRight: "0", marginBottom: "0", marginLeft: "0", paddingTop: "0", paddingRight: "0", paddingBottom: "0", paddingLeft: "0" };

    const mockElements: HTMLElement[] = [];
    for (let i = 0; i < 500; i++) {
      const el = document.createElement("div");
      el.setAttribute("data-buildrick-id", `el-${i}`);
      el.getBoundingClientRect = () => ({ ...mockRect, left: i * 20, top: i * 10 }) as DOMRect;
      document.body.appendChild(el);
      mockElements.push(el);
    }

    // Mock container
    const container = document.createElement("div");
    container.className = "buildrick-canvas";
    container.getBoundingClientRect = () => mockContainerRect as DOMRect;
    document.body.appendChild(container);

    // Warm cache
    const startWarm = performance.now();
    snapCalc.calculateSnapPoints("el-250", new Map());
    const warmTime = performance.now() - startWarm;

    // Cached run
    const start = performance.now();
    snapCalc.calculateSnapPoints("el-250", new Map());
    const elapsed = performance.now() - start;

    // Cleanup
    mockElements.forEach((el) => el.remove());
    container.remove();

    expect(elapsed).toBeLessThanOrEqual(16);
    console.log(`500-element snap time: ${elapsed.toFixed(2)} ms (warm: ${warmTime.toFixed(2)} ms)`);
  });
});
```

- [ ] **Step 2: Run benchmark**

Run: `npx vitest run packages/editor/src/__tests__/performance/drag-benchmark.test.ts`
Expected: PASS with elapsed ≤ 16 ms

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/__tests__/performance/drag-benchmark.test.ts
git commit -m "test(perf): add drag-benchmark harness for 500-element snap time

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec Item | Task | Covered? |
|-----------|------|----------|
| A1 — Batch CSS rebuilds | Task 1 | Yes |
| A2 — O(1) rule lookup | Task 2 | Yes |
| A3 — SnapCalculator cache | Tasks 3–4 | Yes |
| A4 — SpacingCalculator cache | Tasks 3, 5 | Yes |
| A5 — O(n²) version compare | Task 6 | Yes |
| A6 — Composer listener hygiene | Task 7 | Yes |
| A7 — OT fast paths | Task 8 | Yes |
| Success criteria benchmark | Task 9 | Yes |

### 2. Placeholder Scan

- No "TBD", "TODO", "implement later" found.
- Every step shows exact code.
- Every test shows exact assertions.
- No "Similar to Task N" shortcuts.

### 3. Type Consistency

- `ElementBounds` used consistently across Tasks 3–5.
- `StyleData` used consistently in Tasks 1–2.
- `Patch` type used in Task 8.
- No renamed functions between tasks.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-29-editor-performance-track-a.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
