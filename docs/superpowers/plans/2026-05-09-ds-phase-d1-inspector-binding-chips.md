# DS Arc · Phase D.1 — Inspector Binding Chip Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the shipped `DSBindingChip` primitive (`editor/inspector/sections/DSBindingChip.tsx`) into the existing Inspector `ColorInput` + `SpacingControls` so a user editing element styles sees a green chip with the token id when a value is bound to a design-system token, or a yellow ⚠ chip with the raw value when it is off-DS. Click on a bound chip emits `EVENTS.UI_OPEN_DESIGN_PANEL` (existing event listened to by `StudioPanels`). Implements spec §6.4.

**Architecture:**
- Extract the inline token-detection helpers (`isTokenVar`, `extractVarName`, `cssVarToTokenId`) from `ColorInput.tsx` into a shared util `editor/inspector/shared/tokenBindingDetection.ts` so both ColorInput and SpacingControls (and any future inspector control) consume one canonical detector. The reverse-conversion `cssVarToTokenId` is new — it strips the `--buildrick-design-` prefix to produce the token id (`tokenToCssVar` from `editor/design-system/types.ts:126` is the existing forward conversion).
- For bound values: render `<DSBindingChip state="token" label={tokenId} onClick={openDesign} />` inline in the control row. For raw values that look like `#hex` / `Npx` / `1rem`, render `<DSBindingChip state="off-ds" label={rawValue} />`. Empty-string and inherited values render no chip.
- Click handler emits `composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {})` per the existing `InspectorEmptyState.tsx:56` pattern. Per-kind deep-linking (Tokens > kind tab) is OUT OF SCOPE for D.1 — opening the Design tab is enough; deep-link refinement lands when a Design > Tokens > kind sub-route ships.
- Preset state (`state="preset"`, blue chip) is OUT OF SCOPE — preset registry UI hasn't shipped, so no preset-bound values exist in the wild yet. Adding the detection branch now would be dead code. Spec §6.4 supports this: presets ship in Phase G with the editors.
- Beginner-mode "Bind to token" affordance (`onBindRequest` prop on `DSBindingChip`) is OUT OF SCOPE — the wiring point is `TokenPickerPopover` which has its own ergonomics. Defer to a follow-up D.1.1 if the user-test bears it out. The chip already renders the affordance when `onBindRequest` is supplied; passing it later is non-breaking.

**Tech Stack:** TypeScript 5.3 (strict) · React 18.3 · Vitest + React Testing Library · Buildrik EventEmitter · DOM CSS variable resolution

---

## File Structure

| Path | Responsibility | Status |
|---|---|---|
| `packages/editor/src/editor/inspector/shared/tokenBindingDetection.ts` | Shared detection: `isTokenVar`, `extractVarName`, `cssVarToTokenId`. Pure functions. | NEW |
| `packages/editor/src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts` | Coverage: var-pattern matching, extraction, id extraction, edge cases (empty, malformed, prefix-similar) | NEW |
| `packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx` | Use shared util + render `DSBindingChip` beside swatch | MODIFY |
| `packages/editor/src/editor/inspector/shared/controls/__tests__/ColorInput.bindingChip.test.tsx` | Coverage: green chip when bound, yellow chip off-DS, click emits UI_OPEN_DESIGN_PANEL, no chip when empty | NEW |
| `packages/editor/src/editor/inspector/shared/controls/SpacingControls.tsx` | Render `DSBindingChip` next to AxisInput when value is a token var | MODIFY |
| `packages/editor/src/editor/inspector/shared/controls/__tests__/SpacingControls.bindingChip.test.tsx` | Coverage: green chip when token-var, no chip for px/keyword/empty values, click emits UI_OPEN_DESIGN_PANEL | NEW |

No CI gate added. Existing path-scoped test runs cover the surface.

---

## Pre-flight verification

- [ ] **Step P.1: Confirm DSBindingChip primitive shipped + tested**

Run: `ls packages/editor/src/editor/inspector/sections/DSBindingChip.tsx packages/editor/src/editor/inspector/sections/__tests__/DSBindingChip.test.tsx`
Expected: both files print.

- [ ] **Step P.2: Confirm chip has 0 consumers today (green-field integration)**

Run: `grep -rn "DSBindingChip" packages/editor/src --include="*.tsx" | grep -v test | grep -v "DSBindingChip.tsx:"`
Expected: empty output.

- [ ] **Step P.3: Confirm `EVENTS.UI_OPEN_DESIGN_PANEL` exists**

Run: `grep -n "UI_OPEN_DESIGN_PANEL" packages/editor/src/shared/constants/events.ts`
Expected: a single match showing the event-name constant.

- [ ] **Step P.4: Confirm `tokenToCssVar` helper exists**

Run: `grep -n "export function tokenToCssVar" packages/editor/src/editor/design-system/types.ts`
Expected: matches at types.ts:126 returning `--buildrick-design-${id}`.

If any pre-flight fails, STOP — D.1 prerequisites are not in tree.

---

## Task 1: Extract token-binding detection helpers to shared util

**Files:**
- Create: `packages/editor/src/editor/inspector/shared/tokenBindingDetection.ts`
- Test: `packages/editor/src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts`

The detection helpers currently live as private constants inside `ColorInput.tsx:30-44`. SpacingControls will need the same logic. Pulling them into a shared util de-duplicates and gives a single test surface.

- [ ] **Step 1.1: Write the failing test**

```ts
// packages/editor/src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts
import { describe, it, expect } from "vitest";
import {
  isTokenVar,
  extractVarName,
  cssVarToTokenId,
} from "../tokenBindingDetection";

describe("isTokenVar", () => {
  it("matches var(--buildrick-design-...)", () => {
    expect(isTokenVar("var(--buildrick-design-color-primary)")).toBe(true);
    expect(isTokenVar("var(--buildrick-design-spacing-md)")).toBe(true);
  });

  it("rejects non-token var() and raw values", () => {
    expect(isTokenVar("#FF0000")).toBe(false);
    expect(isTokenVar("16px")).toBe(false);
    expect(isTokenVar("var(--bd-accent)")).toBe(false);
    expect(isTokenVar("var(--something-else)")).toBe(false);
    expect(isTokenVar("")).toBe(false);
  });
});

describe("extractVarName", () => {
  it("returns the CSS variable name from a token var()", () => {
    expect(extractVarName("var(--buildrick-design-color-primary)")).toBe(
      "--buildrick-design-color-primary"
    );
  });

  it("returns null for non-matching strings", () => {
    expect(extractVarName("#FF0000")).toBeNull();
    expect(extractVarName("var(--bd-accent)")).toBeNull();
    expect(extractVarName("")).toBeNull();
  });
});

describe("cssVarToTokenId", () => {
  it("strips the --buildrick-design- prefix to yield the token id", () => {
    expect(cssVarToTokenId("--buildrick-design-color-primary")).toBe("color-primary");
    expect(cssVarToTokenId("--buildrick-design-spacing-md")).toBe("spacing-md");
  });

  it("returns null when the prefix doesn't match", () => {
    expect(cssVarToTokenId("--bd-accent")).toBeNull();
    expect(cssVarToTokenId("color-primary")).toBeNull();
    expect(cssVarToTokenId("")).toBeNull();
  });

  it("round-trips with tokenToCssVar from design-system/types", async () => {
    const { tokenToCssVar } = await import("../../../design-system/types");
    expect(cssVarToTokenId(tokenToCssVar("color-primary"))).toBe("color-primary");
    expect(cssVarToTokenId(tokenToCssVar("radius-sm"))).toBe("radius-sm");
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `cd packages/editor && pnpm vitest run src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts`
Expected: FAIL — `Cannot find module '../tokenBindingDetection'`.

- [ ] **Step 1.3: Write minimal implementation**

```ts
// packages/editor/src/editor/inspector/shared/tokenBindingDetection.ts
/**
 * Token Binding Detection
 *
 * Pure helpers for detecting whether an Inspector control's value is bound to
 * a design-system token (rendered as `var(--buildrick-design-<id>)` in the
 * style payload) and recovering the token id. Mirrors the forward conversion
 * `tokenToCssVar(id)` in `editor/design-system/types.ts`.
 *
 * Used by `ColorInput`, `SpacingControls`, and any future inspector control
 * that participates in token binding (spec §6.4).
 *
 * @license BSD-3-Clause
 */

const TOKEN_VAR_PATTERN = /^var\((--buildrick-design-[^)]+)\)$/;
const TOKEN_VAR_PREFIX = "--buildrick-design-";

/** True when the value is a `var(--buildrick-design-...)` reference. */
export function isTokenVar(value: string): boolean {
  return TOKEN_VAR_PATTERN.test(value);
}

/**
 * Pull the CSS variable name out of a token `var()` expression.
 * Returns null when the input is not a token var().
 */
export function extractVarName(value: string): string | null {
  const m = value.match(TOKEN_VAR_PATTERN);
  return m ? m[1] : null;
}

/**
 * Convert a CSS variable name (e.g. `--buildrick-design-color-primary`) to
 * the token id (`color-primary`). Returns null when the prefix is missing.
 */
export function cssVarToTokenId(cssVar: string): string | null {
  if (!cssVar.startsWith(TOKEN_VAR_PREFIX)) return null;
  return cssVar.slice(TOKEN_VAR_PREFIX.length);
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

Run: `cd packages/editor && pnpm vitest run src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 1.5: Commit**

```bash
git add packages/editor/src/editor/inspector/shared/tokenBindingDetection.ts \
        packages/editor/src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts
git commit -m "feat(ds-phase-d1): extract tokenBindingDetection shared util"
```

---

## Task 2: Refactor ColorInput to use the shared util (no behavior change)

**Files:**
- Modify: `packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx`

ColorInput.tsx currently inlines `isTokenVar` + `extractVarName` at lines 30-44. Replace those with imports from the shared util. No new test needed — existing ColorInput tests cover the behavior.

- [ ] **Step 2.1: Replace inline helpers with shared imports**

Edit `packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx`. Find this block (around lines 28-44):

```ts
const isValidHexColor = (val: string): boolean =>
  /^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val);

const isTokenVar = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

const isKeywordValue = (val: string): boolean =>
  !!val && !isValidHexColor(val) && !isTokenVar(val);

const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return resolved || "#000000";
};

const extractVarName = (v: string) => {
  const m = v.match(/^var\((--buildrick-design-[^)]+)\)$/);
  return m ? m[1] : null;
};
```

Replace `isTokenVar` and `extractVarName` declarations with import + remove from this block:

```ts
import { isTokenVar, extractVarName } from "../tokenBindingDetection";

const isValidHexColor = (val: string): boolean =>
  /^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val);

const isKeywordValue = (val: string): boolean =>
  !!val && !isValidHexColor(val) && !isTokenVar(val);

const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return resolved || "#000000";
};
```

(The new `import` line goes near the top of the file, alongside the existing imports.)

- [ ] **Step 2.2: Run path-scoped tests to confirm no regression**

Run: `cd packages/editor && pnpm vitest run src/editor/inspector/shared/controls/__tests__/ColorInput`
Expected: all existing ColorInput tests pass (search the directory for the test file name pattern). If no ColorInput test file exists yet, run the broader inspector test set: `pnpm vitest run src/editor/inspector --reporter=dot 2>&1 | tail -5` and confirm no new failures vs. pre-change baseline.

- [ ] **Step 2.3: TypeScript typecheck**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep "ColorInput.tsx" | head`
Expected: empty output.

- [ ] **Step 2.4: Commit**

```bash
git add packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx
git commit -m "refactor(ds-phase-d1): ColorInput uses shared tokenBindingDetection util"
```

---

## Task 3: Add DSBindingChip rendering to ColorInput

**Files:**
- Modify: `packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx`
- Test: `packages/editor/src/editor/inspector/shared/controls/__tests__/ColorInput.bindingChip.test.tsx`

The chip renders inline with the existing color row. When the value is a token var → green chip with token id. When the value is a raw hex → yellow ⚠ chip with the raw hex. Empty/keyword values render no chip. Click on a chip emits `UI_OPEN_DESIGN_PANEL`.

- [ ] **Step 3.1: Write the failing test**

```tsx
// packages/editor/src/editor/inspector/shared/controls/__tests__/ColorInput.bindingChip.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorInput } from "../ColorInput";

// Mock the design system's color registry so the test doesn't need a full provider tree.
vi.mock("../../../design-system/state/TokenRegistryContext", () => ({
  useColorRegistry: () => ({
    tokens: [
      {
        id: "color-primary",
        name: "Primary",
        value: "#2D6DFF",
        cssVar: "--buildrick-design-color-primary",
      },
    ],
  }),
}));

// Mock the composer access used by chip click handlers.
const mockEmit = vi.fn();
vi.mock("../../../shell/hooks/useComposer", () => ({
  useComposer: () => ({ emit: mockEmit }),
}));

beforeEach(() => {
  mockEmit.mockClear();
});

describe("ColorInput · DSBindingChip integration", () => {
  it("renders green token chip when value is a token var", () => {
    render(<ColorInput label="Color" value="var(--buildrick-design-color-primary)" onChange={() => {}} />);
    const chip = screen.getByRole("button", { name: /Bound to token color-primary/i });
    expect(chip).toBeTruthy();
  });

  it("renders yellow off-DS chip when value is a raw hex", () => {
    render(<ColorInput label="Color" value="#FFAA22" onChange={() => {}} />);
    const chip = screen.getByLabelText(/Off design system #FFAA22/i);
    expect(chip).toBeTruthy();
  });

  it("renders no chip when value is empty", () => {
    render(<ColorInput label="Color" value="" onChange={() => {}} />);
    const chip = screen.queryByLabelText(/Bound to token|Off design system/i);
    expect(chip).toBeNull();
  });

  it("clicking a token chip emits UI_OPEN_DESIGN_PANEL", () => {
    render(<ColorInput label="Color" value="var(--buildrick-design-color-primary)" onChange={() => {}} />);
    const chip = screen.getByRole("button", { name: /Bound to token color-primary/i });
    fireEvent.click(chip);
    expect(mockEmit).toHaveBeenCalledWith("ui:open:design-panel", {});
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `cd packages/editor && pnpm vitest run src/editor/inspector/shared/controls/__tests__/ColorInput.bindingChip.test.tsx`
Expected: FAIL — chip not rendered (no DSBindingChip in ColorInput yet).

The mock `useComposer` import path will fail too if `useComposer` doesn't exist. If so, the consumer has to read the composer ref another way. Check first:

```bash
grep -rn "export.*useComposer" packages/editor/src/editor/shell/hooks/ packages/editor/src/shared/hooks/ 2>/dev/null | head -5
```

If `useComposer` doesn't exist, the chip click handler has to reach the composer through a different bridge — see Step 3.3a.

- [ ] **Step 3.3: Write the implementation**

Two integration shapes depending on whether `useComposer` exists.

**Step 3.3a — If `useComposer` exists** (pre-existing hook returns the active composer ref):

Add to `ColorInput.tsx` near the top imports:

```ts
import { DSBindingChip } from "../../sections/DSBindingChip";
import { cssVarToTokenId, extractVarName } from "../tokenBindingDetection";
import { useComposer } from "../../../shell/hooks/useComposer";
import { EVENTS } from "../../../../shared/constants/events";
```

Inside the `ColorInput` component, after the existing `boundToken` computation (around line 83), add:

```tsx
  const composer = useComposer();
  const tokenId = isBound
    ? (cssVarToTokenId(extractVarName(value) ?? "") ?? null)
    : null;
  const handleChipClick = React.useCallback(() => {
    composer?.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {});
  }, [composer]);

  const chip = isBound && tokenId ? (
    <DSBindingChip state="token" label={tokenId} onClick={handleChipClick} />
  ) : isValidHexColor(value) ? (
    <DSBindingChip state="off-ds" label={value} onClick={handleChipClick} />
  ) : null;
```

Find the existing JSX root return (around line 93):

```tsx
  return (
    <div className="bdi-row-ctrl">
```

Render the chip after the `<div className="bdi-row-content">` block but inside the same row container. Concretely, find the closing `</div>` of `bdi-row-content` and insert directly above it (still inside `bdi-row-ctrl`):

```tsx
        {chip ? <span style={{ marginLeft: 8 }}>{chip}</span> : null}
```

**Step 3.3b — If `useComposer` does NOT exist:** add a small local hook near the existing imports in ColorInput.tsx:

```ts
// Tiny inline reader: pulls the live composer ref off the global window
// (set by AquibraStudio's Composer init). This is a transitional shim; when
// a canonical ComposerContext ships, this hook collapses to a single import.
function useComposerRef(): { emit: (e: string, p?: unknown) => void } | null {
  // The composer instance attaches itself in `useComposerInit.ts:208` —
  // `setComposer(instance)`. Reading via Composer's own EventEmitter is
  // the existing event surface used elsewhere (e.g., InspectorEmptyState.tsx:56
  // does `composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {})` directly with a
  // composer prop that's threaded down). The Inspector control receives no
  // composer prop today; rather than thread one through every control, expose
  // a single read via window for the chip's click only.
  const c = (typeof window !== "undefined" ? (window as unknown as { __buildrikComposer?: { emit: (e: string, p?: unknown) => void } }).__buildrikComposer : null) ?? null;
  return c;
}
```

Then change `useComposer()` calls in Step 3.3a to `useComposerRef()`, and make sure that the bootstrap (`useComposerInit.ts`) sets `(window as unknown as { __buildrikComposer: typeof instance }).__buildrikComposer = instance;` after `setComposer(instance);` — this tiny edit lands as Step 3.3c if the global isn't already set.

**Implementer should pick 3.3a if `useComposer` exists; otherwise 3.3b + 3.3c.** Report which path was taken in the status report so the reviewer knows what wiring shipped.

- [ ] **Step 3.4: Run test to verify it passes**

Run: `cd packages/editor && pnpm vitest run src/editor/inspector/shared/controls/__tests__/ColorInput.bindingChip.test.tsx`
Expected: PASS — 4/4.

- [ ] **Step 3.5: Run a smoke type-check**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep "ColorInput\|tokenBindingDetection" | head`
Expected: empty output.

- [ ] **Step 3.6: Commit**

```bash
git add packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx \
        packages/editor/src/editor/inspector/shared/controls/__tests__/ColorInput.bindingChip.test.tsx
git commit -m "feat(ds-phase-d1): render DSBindingChip in ColorInput per spec §6.4"
```

If Step 3.3c was needed (global composer ref bootstrap), include `packages/editor/src/editor/shell/hooks/useComposerInit.ts` in the same commit and reference 3.3c in the message body.

---

## Task 4: Add DSBindingChip rendering to SpacingControls

**Files:**
- Modify: `packages/editor/src/editor/inspector/shared/controls/SpacingControls.tsx`
- Test: `packages/editor/src/editor/inspector/shared/controls/__tests__/SpacingControls.bindingChip.test.tsx`

SpacingControls renders 4-axis margin/padding inputs (`AxisInput` for top/right/bottom/left). When ANY axis has a token-var value, render a green `DSBindingChip` for that axis. Off-DS chip is OUT-OF-SCOPE for SpacingControls — raw `16px` is the canonical shape and yellow-warning every spacing input creates noise. Per spec §6.4 the off-DS chip is most valuable on color (where the visual is the chip), less so on spacing.

- [ ] **Step 4.1: Write the failing test**

```tsx
// packages/editor/src/editor/inspector/shared/controls/__tests__/SpacingControls.bindingChip.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { SpacingControls } from "../SpacingControls";

const mockEmit = vi.fn();
vi.mock("../../../shell/hooks/useComposer", () => ({
  useComposer: () => ({ emit: mockEmit }),
}));

beforeEach(() => {
  mockEmit.mockClear();
});

const baseStyles = {
  "margin-top": "0px",
  "margin-right": "0px",
  "margin-bottom": "0px",
  "margin-left": "0px",
  "padding-top": "0px",
  "padding-right": "0px",
  "padding-bottom": "0px",
  "padding-left": "0px",
};

describe("SpacingControls · DSBindingChip integration", () => {
  it("renders a green token chip on the axis bound to a token var", () => {
    const styles = { ...baseStyles, "padding-top": "var(--buildrick-design-spacing-md)" };
    render(<SpacingControls styles={styles} onChange={() => {}} />);
    const chip = screen.getByRole("button", { name: /Bound to token spacing-md/i });
    expect(chip).toBeTruthy();
  });

  it("renders no chip when all axes are raw values", () => {
    render(<SpacingControls styles={baseStyles} onChange={() => {}} />);
    const chip = screen.queryByLabelText(/Bound to token/i);
    expect(chip).toBeNull();
  });

  it("clicking a token chip emits UI_OPEN_DESIGN_PANEL", () => {
    const styles = { ...baseStyles, "margin-left": "var(--buildrick-design-spacing-lg)" };
    render(<SpacingControls styles={styles} onChange={() => {}} />);
    const chip = screen.getByRole("button", { name: /Bound to token spacing-lg/i });
    fireEvent.click(chip);
    expect(mockEmit).toHaveBeenCalledWith("ui:open:design-panel", {});
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

Run: `cd packages/editor && pnpm vitest run src/editor/inspector/shared/controls/__tests__/SpacingControls.bindingChip.test.tsx`
Expected: FAIL — chip not rendered.

If the test errors before the assertion (e.g., "props.styles is required"), the implementer needs to look at the actual `SpacingControls` props interface and adjust the test fixture to match. The `baseStyles` shape above mirrors what `parseValue` expects per `SpacingControls.tsx:35-43`; the prop name is `styles` per the SpacingBox prop pattern.

- [ ] **Step 4.3: Write the implementation**

Open `SpacingControls.tsx`. Locate the `AxisInput` component (search for `interface AxisInputProps` and `AxisInput: React.FC`). After the input element renders, add a chip render keyed off the value:

```tsx
import { DSBindingChip } from "../../sections/DSBindingChip";
import { cssVarToTokenId, extractVarName, isTokenVar } from "../tokenBindingDetection";
import { useComposer } from "../../../shell/hooks/useComposer";  // OR useComposerRef per Task 3.3b
import { EVENTS } from "../../../../shared/constants/events";
```

Inside `AxisInput` (or wherever the axis value is rendered), after the existing input markup, conditionally render:

```tsx
  const composer = useComposer();
  const tokenId = isTokenVar(value) ? (cssVarToTokenId(extractVarName(value) ?? "") ?? null) : null;
  const handleChipClick = React.useCallback(() => {
    composer?.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {});
  }, [composer]);

  // Render right after the AxisInput input element:
  {tokenId ? (
    <DSBindingChip
      state="token"
      label={tokenId}
      onClick={handleChipClick}
      ariaLabel={`Bound to token ${tokenId}`}
    />
  ) : null}
```

The exact insertion point depends on `AxisInput`'s JSX shape — match the pattern by inserting after the `<input>` element but inside the same wrapper container.

- [ ] **Step 4.4: Run test to verify it passes**

Run: `cd packages/editor && pnpm vitest run src/editor/inspector/shared/controls/__tests__/SpacingControls.bindingChip.test.tsx`
Expected: PASS — 3/3.

- [ ] **Step 4.5: Commit**

```bash
git add packages/editor/src/editor/inspector/shared/controls/SpacingControls.tsx \
        packages/editor/src/editor/inspector/shared/controls/__tests__/SpacingControls.bindingChip.test.tsx
git commit -m "feat(ds-phase-d1): render DSBindingChip in SpacingControls per spec §6.4"
```

---

## Task 5: Path-scoped baseline + closure tag

**Files:** none (verification only)

- [ ] **Step 5.1: Run all D.1 path-scoped tests**

Run:
```bash
cd packages/editor && pnpm vitest run \
  src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts \
  src/editor/inspector/shared/controls/__tests__/ColorInput.bindingChip.test.tsx \
  src/editor/inspector/shared/controls/__tests__/SpacingControls.bindingChip.test.tsx \
  src/editor/inspector/sections/__tests__/DSBindingChip.test.tsx
```
Expected: all pass · 19+ tests (detection 11 + ColorInput 4 + SpacingControls 3 + existing DSBindingChip suite).

- [ ] **Step 5.2: Verify path-scoped TSC clean**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "tokenBindingDetection|ColorInput|SpacingControls|DSBindingChip" | head`
Expected: empty output.

- [ ] **Step 5.3: Run full editor vitest as a regression check**

Run: `cd packages/editor && pnpm vitest run 2>&1 | tail -5`
Expected: `Tests N passed (N)` with no failures. If failures appear, diagnose vs. pre-existing flake. Sibling sessions ship continuously — a small flake count from non-D.1 work is acceptable. New failures introduced by D.1 must be fixed before tagging.

- [ ] **Step 5.4: Tag the phase locally**

Run:
```bash
git tag ds-phase-d1-complete
git tag --list 'ds-phase-d*'
```
Expected: `ds-phase-d1-complete` printed.

- [ ] **Step 5.5: Final commit (no-op marker if needed)**

```bash
git status
# if working tree clean: skip
# if files remain: stage explicit paths and commit:
# git add <explicit paths>
# git commit -m "chore(ds-phase-d1): closure"
```

---

## Phase D.1 Closure Checklist

- [ ] All 5 tasks complete with passing tests
- [ ] `tokenBindingDetection.test.ts` ≥ 11 tests green
- [ ] `ColorInput.bindingChip.test.tsx` 4/4 green
- [ ] `SpacingControls.bindingChip.test.tsx` 3/3 green
- [ ] Existing `DSBindingChip.test.tsx` still green
- [ ] No regression in full editor vitest baseline
- [ ] Tag `ds-phase-d1-complete` exists locally
- [ ] CLAUDE.md memory entry written for the phase (`project_ds_phase_d1_shipped_YYYYMMDD.md`)

## Out-of-Scope (deferred to later sub-phases)

- **Preset chip (state="preset", blue)** — preset registry UI hasn't shipped; no preset-bound values exist. Adding the detection branch now is dead code. Lands when preset editors ship in Phase G.
- **Per-kind deep-link** — click currently opens Design tab; spec §6.4 wants Tokens > kind tab specifically. Refines when a Design > Tokens > kind sub-route ships.
- **"Bind to token" affordance** — `DSBindingChip.onBindRequest` prop already supports it. Wiring requires `TokenPickerPopover` integration; defer to D.1.1 if user-test demand emerges.
- **TypographyControls direct chip** — TypographyControls already uses `ColorInput` for the text-color row, so the color chip lands transitively. Font-family / weight / size chips would need a separate token kind detection (typography tokens render via different CSS vars); scope after D.1 ships.
- **Other inspector controls** (border, shadow, radius, etc.) — Phase D.2 brings the chip to all 14 token kinds once the per-kind detection patterns shake out from D.1's color + spacing pair.

---

## Notes for the Implementer

- **TDD is required.** Every task starts with a failing test, then minimal implementation, then green. Skipping the failing-test step is a process bug, not a shortcut.
- **Stage paths explicitly in `git add`.** Per A.1 finding 4: subagent-driven implementers staged 7 unrelated files via `git add .` once. List paths in every `git add`.
- **Sibling-collision watch:** sibling sessions are sprinting on Phase 5 TabFrame UI work + DS Tier-2 components. Inspector files (`editor/inspector/shared/controls/`) have low recent-touch traffic, but verify with `git log --oneline -- <file>` before starting each task.
- **Path-scoped baselines first, full-suite as final regression check.** The full vitest takes ~7 min; don't run it between every task. Step 5.3 is the only full run.
- **`useComposer` decision:** if it exists, Task 3 takes path 3.3a. If not, 3.3b + 3.3c land the global-window shim. The shim is technical debt with a clear retire path (replace with ComposerContext when one ships); document it in the closure memory if 3.3c was needed.
- **No CSS changes.** D.1 ships zero CSS. The chip's colors come from `var(--bd-success-soft)` / `--bd-success-strong` etc., which are existing chrome tokens. If a token is missing, the chip's hardcoded fallbacks render — acceptable for D.1.
- **Phase D.1 is the foundation for D.2.** D.2 (Components panel) needs the same chip pattern in different contexts (catalog item state). Keep the integration shape simple in D.1 so D.2 can fan out cleanly.
