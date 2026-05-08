# DS Arc · Phase B.1 — applyToRoot Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `composer.colorMode` + `composer.darkResolver` into the running editor's CSS-variable application path. When the user toggles dark mode (or the system preference changes), all color tokens re-apply to `:root` with their `darkValue` (with D16 fallback to `value`).

**Architecture:**
- `TokenRegistryProvider` accepts an optional `composer` prop. When present, an internal `useEffect` subscribes to `composer.colorMode` `colorMode:changed` events. On change, walks `colorState.tokens` and re-applies each via `composer.darkResolver.resolve(token, resolved)` → `document.documentElement.style.setProperty(cssVar, resolved)`.
- The effect also runs once on mount with the current `composer.colorMode.resolved()` to apply the initial dark/light state.
- `StudioPanels` passes its existing `composer` prop into `TokenRegistryProvider`.
- useColorTokens stays unchanged — live edit still calls `applyToRoot(cssVar, value)` directly. The B.1 effect re-runs because `colorState.tokens` is in its dep array, immediately overwriting the live-edit light value with the dark-resolved value when in dark mode. Brief flash possible during edit; acceptable for B.1.

**Tech Stack:** TypeScript 5.3 (strict) · Vitest · React 18.3 · @testing-library/react

---

## File Structure

| Path | Responsibility | Status |
|---|---|---|
| `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx` | Add optional `composer` prop + dark-mode applier effect | MODIFY |
| `packages/editor/src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx` | Effect coverage | NEW |
| `packages/editor/src/editor/shell/StudioPanels.tsx:355` | Pass `composer` prop to TokenRegistryProvider | MODIFY |

---

## Pre-flight verification

- [ ] **Step P.1: Confirm Phase B.0 tag exists locally**

Run: `git tag -l 'ds-phase-b0-complete'`
Expected: `ds-phase-b0-complete` printed.

- [ ] **Step P.2: Confirm StudioPanels.tsx has composer prop**

Run: `grep -n "composer: Composer | null" packages/editor/src/editor/shell/StudioPanels.tsx`
Expected: a single match on the `StudioPanelsProps` interface.

- [ ] **Step P.3: Confirm TokenRegistryProvider mount site**

Run: `grep -n "TokenRegistryProvider projectId" packages/editor/src/editor/shell/StudioPanels.tsx`
Expected: one match on line ~355.

If any pre-flight fails, STOP — verify B.0 baseline.

---

## Task 1: Extend TokenRegistryProvider with `composer` prop + dark-mode applier effect

**Files:**
- Modify: `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx`
- Test: `packages/editor/src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`

- [ ] **Step 1.1: Write the failing test**

Create `packages/editor/src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`:

```typescript
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { TokenRegistryProvider } from "../TokenRegistryContext";

type Listener = (payload: unknown) => void;

function makeFakeComposer() {
  const listeners = new Map<string, Listener[]>();
  const colorMode = {
    get: vi.fn(() => "dark"),
    set: vi.fn(),
    resolved: vi.fn(() => "dark" as "light" | "dark"),
  };
  const darkResolver = {
    resolve: vi.fn((token: { value: string; darkValue?: string }, mode: "light" | "dark") =>
      mode === "dark" && token.darkValue !== undefined ? token.darkValue : token.value
    ),
    resolveAll: vi.fn(),
  };
  return {
    on: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      arr.push(cb);
      listeners.set(evt, arr);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      listeners.set(evt, arr.filter((x) => x !== cb));
    }),
    emit: vi.fn((evt: string, payload?: unknown) => {
      (listeners.get(evt) ?? []).forEach((c) => c(payload));
    }),
    colorMode,
    darkResolver,
  };
}

describe("TokenRegistryProvider · dark-mode applier", () => {
  let setPropertySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    setPropertySpy = vi.spyOn(document.documentElement.style, "setProperty");
    setPropertySpy.mockClear();
  });

  it("on mount: walks color tokens and applies darkResolver-resolved value when colorMode is 'dark'", () => {
    const composer = makeFakeComposer();
    // Seed localStorage with one color token that has a darkValue.
    localStorage.setItem(
      "buildrick-design-tokens-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    render(
      <TokenRegistryProvider projectId="test" composer={composer as any}>
        <div />
      </TokenRegistryProvider>
    );

    expect(composer.darkResolver.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ id: "color-primary", darkValue: "#000" }),
      "dark"
    );
    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-primary", "#000");
  });

  it("on colorMode:changed event: re-walks tokens and re-applies", () => {
    const composer = makeFakeComposer();
    localStorage.setItem(
      "buildrick-design-tokens-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    render(
      <TokenRegistryProvider projectId="test" composer={composer as any}>
        <div />
      </TokenRegistryProvider>
    );
    setPropertySpy.mockClear();

    // Flip composer to "light" and emit changed event.
    composer.colorMode.resolved.mockReturnValue("light");
    act(() => {
      composer.emit("colorMode:changed", { mode: "light", resolved: "light" });
    });

    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-primary", "#fff");
  });

  it("when composer prop is omitted: no-op (legacy behavior preserved)", () => {
    localStorage.setItem(
      "buildrick-design-tokens-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    render(
      <TokenRegistryProvider projectId="test">
        <div />
      </TokenRegistryProvider>
    );
    // useColorTokens internally applies token.value at mount — verify NO dark-resolved override.
    expect(setPropertySpy).not.toHaveBeenCalledWith("--bd-color-primary", "#000");
  });

  it("unsubscribes on unmount", () => {
    const composer = makeFakeComposer();
    const { unmount } = render(
      <TokenRegistryProvider projectId="test" composer={composer as any}>
        <div />
      </TokenRegistryProvider>
    );
    unmount();
    expect(composer.off).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });
});
```

- [ ] **Step 1.2: Run test to confirm FAIL**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`
Expected: FAIL — `composer` prop not yet supported.

- [ ] **Step 1.3: Extend TokenRegistryProvider**

Modify `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx`:

Add the prop to the interface:

```typescript
export interface TokenRegistryProviderProps {
  projectId?: string;
  /** Phase B.1: if present, dark-mode applier subscribes to composer.colorMode. */
  composer?: {
    on: (evt: string, cb: (payload: unknown) => void) => void;
    off: (evt: string, cb: (payload: unknown) => void) => void;
    colorMode: { resolved: () => "light" | "dark" };
    darkResolver: { resolve: (token: import("../types").DesignToken, resolved: "light" | "dark") => string };
  };
  children: React.ReactNode;
}
```

Update the component signature + add the effect:

```typescript
export const TokenRegistryProvider: React.FC<TokenRegistryProviderProps> = ({
  projectId,
  composer,
  children,
}) => {
  // ... existing initialTokens logic ...
  const colorState = useColorTokens(initialTokens);
  // ... other states ...

  // Phase B.1: dark-mode applier. When composer is wired, listen for
  // colorMode:changed and re-apply each color token via darkResolver.
  React.useEffect(() => {
    if (!composer) return;

    const apply = () => {
      const resolved = composer.colorMode.resolved();
      colorState.tokens.forEach((t) => {
        const value = composer.darkResolver.resolve(t, resolved);
        document.documentElement.style.setProperty(t.cssVar, value);
      });
    };

    apply();
    const handler = () => apply();
    composer.on("colorMode:changed", handler);
    return () => composer.off("colorMode:changed", handler);
  }, [composer, colorState.tokens]);

  // ... rest unchanged ...
};
```

- [ ] **Step 1.4: Run test, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`
Expected: PASS · 4 tests.

- [ ] **Step 1.5: Commit**

```bash
git add packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx \
  packages/editor/src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx
git commit -m "feat(ds-phase-b1): TokenRegistryProvider dark-mode applier subscribes to composer.colorMode"
```

---

## Task 2: Wire composer through StudioPanels

**Files:**
- Modify: `packages/editor/src/editor/shell/StudioPanels.tsx:355`

- [ ] **Step 2.1: Pass composer to TokenRegistryProvider**

Modify `packages/editor/src/editor/shell/StudioPanels.tsx` — locate the existing `<TokenRegistryProvider projectId={projectId}>` (line ~355) and add `composer={composer}`:

```tsx
<TokenRegistryProvider projectId={projectId} composer={composer ?? undefined}>
```

(The `composer ?? undefined` cast avoids passing `null` when the composer is not yet ready — TypeScript's optional prop wants `undefined`, not `null`.)

- [ ] **Step 2.2: TSC check**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "StudioPanels|TokenRegistryProvider" | head`
Expected: empty output (no errors in touched files).

- [ ] **Step 2.3: Run B.1 path-scoped tests + adjacent**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx src/engine/darkResolver src/engine/colorMode`
Expected: PASS · 18+ tests.

- [ ] **Step 2.4: Commit**

```bash
git add packages/editor/src/editor/shell/StudioPanels.tsx
git commit -m "feat(ds-phase-b1): thread composer to TokenRegistryProvider in StudioPanels"
```

---

## Task 3: Closure baseline + tag

**Files:** none (verification only)

- [ ] **Step 3.1: Run B.0 + B.1 path-scoped tests**

Run: `cd packages/editor && pnpm vitest run src/engine/darkResolver src/engine/colorMode src/engine/__tests__/Composer.darkResolver.test.ts src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx --reporter=dot 2>&1 | tail -5`
Expected: all pass.

- [ ] **Step 3.2: Tag the phase locally** (do NOT push without explicit user OK per `feedback_solo_workflow`)

Run:
```bash
git tag ds-phase-b1-complete
git tag --list 'ds-phase-*'
```

---

## Phase B.1 Closure Checklist

- [ ] All 3 tasks complete with passing tests
- [ ] TokenRegistryProvider applies darkResolver-resolved values on mount when composer present
- [ ] colorMode:changed event re-walks tokens
- [ ] Legacy mount (no composer prop) preserves existing behavior
- [ ] Tag `ds-phase-b1-complete` exists locally
- [ ] CLAUDE.md memory entry written for the phase

## Out-of-Scope (deferred)

- Live-edit dark-aware behavior (user editing color in dark mode briefly sees light value before B.1 effect re-applies dark) — full live-edit dark awareness deferred until applyToRoot moves OUT of useColorTokens entirely.
- Inspector warn chip on `tokens:dark-missing` — UI sub-phase.
- Migration to seed `darkValue` for shipped color tokens — deferred.
- CI gate `gate:ds-dark` — wires when first real dark-mode fixture lands in catalog.
