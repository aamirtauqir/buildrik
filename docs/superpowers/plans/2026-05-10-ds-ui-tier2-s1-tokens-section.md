# DS UI Tier-2 · S1 — TokensSection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Design tab from a 3-tab horizontal switcher (Colors / Type / Spacing) into a 4-section vertical workspace (Tokens / Styles / Components / Export) with the **Tokens** section live as a 14-card collapsible accordion that exposes editors for all 14 `TokenKind`s — preserving every existing dirty/undo/apply/discard/persist behavior.

**Architecture:** All 14 token-state hooks already ship (Phase A.0 went wider than memory recorded). This plan is **UI-only** with one type-shape extension. Existing bespoke editors for color/type/spacing render verbatim inside their `TokenKindCard`s; the 11 new string-value kinds (radius/shadow/motion/border/opacity/zindex/breakpoint/grid/sizing/icon/imagery) share a single parametrized `GenericTokenList`. Top-level shell switches from inline-tabs+activeTab state to a `<TokensSection>` / `<StylesSection>` / `<ComponentsSection>` / `<ExportSection>` partition; only Tokens has content this phase, the other three are placeholder stubs that the next sub-phases will fill.

**Tech Stack:** React 18.3, TypeScript 5.3 strict, Emotion (existing styled), Vitest 4 + React Testing Library 16, jsdom 28, Vite 7.2 (port 5050 dev).

---

## Spec Reference

- Spec: `docs/superpowers/specs/2026-05-07-design-system-components-design.md`
  - §6.2 Design tab — 4-section workspace
  - §5.1 Folder layout (deviation: keep existing `colors/` `type/` `spacing/` dirs; add `tokens/` for new generic only — see Task 4 deviation note)
  - §5.3 Token shape (TokenKind enum; `DesignToken` value union)
  - §5.7 SSOT contract (TokenRegistryContext is single home for 14 kinds)
- Memory: `project_ds_phase_0_a0_shipped_20260508` (Phase A.0 already landed all 14 hooks)
- Today's commits inheriting on: `00ee0b2c..2233deef` (DS Phase D1 inspector chips just shipped)

**Out of scope this phase:** StylesSection content (S2), ComponentsSection content (S3), ExportSection content (S5) — all three render placeholder text only. Catalog wiring (S6) is its own phase. Beginner/Pro mode toggle is already shipped (`DSModeToggle.tsx`); this plan only **consumes** it for empty-kind muting.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `packages/editor/src/shared/types/project.ts:247` | Modify (1 line) | Extend `DesignTokenRecord["category"]` union to include `"theme"` so imagery tokens persist |
| `packages/editor/src/editor/design-system/state/useTokensForKind.ts` | Modify (add 1 method) | Add `hydrateFromExternal(allTokens: DesignToken[])` — filters by kind, replaces `tokens` + `savedTokens` atomically. Used to load server-persisted values into the 11 new kinds. |
| `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx` | Modify (add 1 export) | Add `useResetAllKinds()` — returns `(allTokens) => void` that fans out to color/type/spacing `resetFromSaved` + 11 new kinds' `hydrateFromExternal`. Closes the C1 persistence gap. |
| `packages/editor/src/editor/design-system/ui/sections/TokenKindCard.tsx` | Create | Collapsible card primitive: header (title, count, chevron), body slot, persists open/closed per-kind to `localStorage` |
| `packages/editor/src/editor/design-system/ui/sections/__tests__/TokenKindCard.test.tsx` | Create | Open/close behavior, persistence, header rendering |
| `packages/editor/src/editor/design-system/ui/tokens/GenericTokenList.tsx` | Create | String-value editor list for the 11 new kinds (label / input / restore-default-button). Beginner mode hides token id + cssVar; Pro mode shows them. |
| `packages/editor/src/editor/design-system/ui/tokens/__tests__/GenericTokenList.test.tsx` | Create | Render rows, value edit fires `updateToken`, beginner-mode hides ID line, restore button calls undo |
| `packages/editor/src/editor/design-system/ui/sections/TokensSection.tsx` | Create | Orchestrator: renders 14 `TokenKindCard`s. 3 cards wrap the existing bespoke lists; 11 cards wrap `GenericTokenList`. Beginner mode reorders empty foundation kinds to the bottom. |
| `packages/editor/src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx` | Create | 14 cards render, beginner-mode reorder, dirty markers per card |
| `packages/editor/src/editor/design-system/ui/sections/StylesSection.tsx` | Create | Stub: `<EmptyState>` placeholder for S2 |
| `packages/editor/src/editor/design-system/ui/sections/ComponentsSection.tsx` | Create | Stub: `<EmptyState>` placeholder for S3, plus "Open Components panel" button |
| `packages/editor/src/editor/design-system/ui/sections/ExportSection.tsx` | Create | Stub: `<EmptyState>` placeholder for S5 — preserves existing `ExportDropdown` reference for continuity |
| `packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx` | Modify (full rewrite of the JSX shell + handler aggregation) | Switch from 3-tab horizontal to 4-section vertical workspace; aggregate dirty/apply/discard across all 14 registries |
| `packages/editor/src/editor/design-system/ui/__tests__/DesignSystemTab.aggregation.test.tsx` | Create | Aggregation correctness: edit a radius token → totalDirty=1, apply persists 14-kind merged record set |
| `docs/superpowers/plans/2026-05-10-ds-ui-tier2-s1-tokens-section.md` | This file | Plan record |

**Net new files: 9 source + 5 test. Modified: 4. No deletes.**

---

## Cross-Cutting Conventions (read before any task)

1. **Imports** — relative paths within `editor/design-system/`; `@/shared/extensions/`, `@/editor/shared/vibcoder` for primitives. No `../../../` chains crossing 2 dirs (covered by `no-restricted-paths` ESLint rule).
2. **Style approach** — inline `React.CSSProperties` objects (matching existing `DesignSystemTab.tsx` pattern, lines 46–57). Use `var(--bd-*)` tokens; never inline hex (Gate 24 zero-tolerance).
3. **Persistence keys** — card open/close uses `buildrik:design-tab:card-open:<kind>` (boolean). Default state: open = true for kinds with tokens, false for empty foundation kinds in beginner mode.
4. **Test runner** — `cd packages/editor && npx vitest run <path> --reporter=verbose`. Always pass an explicit path to keep run scoped (jsdom is healthy per Phase 0 verification).
5. **Commits** — direct to `main` (solo workflow per memory). Conventional Commits: `feat(ds-ui-s1): ...`, `refactor(ds-ui-s1): ...`, `test(ds-ui-s1): ...`. End with the task number where relevant: `(T3)`.
6. **No mid-task `git stash`** — `feedback_no_stash_mid_execution.md`. Read baseline state before editing.

---

## Task 1: Extend `DesignTokenRecord.category` union to include `"theme"`

**Why first:** `imagery` tokens (constants.ts:643) declare `category: "theme"`. Without this extension, `handleApply` cannot serialize the imagery card's pending diff. One-line type change with zero behavioral risk; lands clean before any UI work.

**Files:**
- Modify: `packages/editor/src/shared/types/project.ts:241-258`

- [ ] **Step 1: Read the existing union (no edit yet)**

Run: `sed -n '240,258p' packages/editor/src/shared/types/project.ts`

Expected: 8-member union (`colors | typography | spacing | effects | layout | icons | buttons | forms`).

- [ ] **Step 2: Add `"theme"` to the union**

Edit `packages/editor/src/shared/types/project.ts`. Replace the category union block:

```ts
  category:
    | "colors"
    | "typography"
    | "spacing"
    | "effects"
    | "layout"
    | "icons"
    | "buttons"
    | "forms";
```

with:

```ts
  category:
    | "colors"
    | "typography"
    | "spacing"
    | "effects"
    | "layout"
    | "icons"
    | "buttons"
    | "forms"
    | "theme";
```

- [ ] **Step 3: Type-check**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | tail -20`

Expected: no new errors. Pre-existing errors (if any) unchanged.

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/shared/types/project.ts
git commit -m "feat(ds-ui-s1): extend DesignTokenRecord category to include theme (T1)"
```

---

## Task 1.5: `hydrateFromExternal` + `useResetAllKinds` (closes C1 persistence gap)

**Why:** `loadFromComposer` currently calls `resetFromSaved(merged)` only on color/type/spacing (the bespoke 3 hooks accept a tokens array). The 11 new kinds use `useTokensForKind` whose `resetFromSaved` is no-arg and only reverts `tokens` to `savedTokens`. Without this task, server-persisted values for the 11 new kinds silently revert to `DEFAULT_TOKENS` on project reload (P1 silent-data-loss).

**Files:**
- Modify: `packages/editor/src/editor/design-system/state/useTokensForKind.ts`
- Modify: `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx`
- Create: `packages/editor/src/editor/design-system/state/__tests__/useResetAllKinds.test.tsx`

- [ ] **Step 1: Read existing `useTokensForKind` shape**

Run: `sed -n '20,50p' packages/editor/src/editor/design-system/state/useTokensForKind.ts`

Expected: `TokensForKindActions` interface lists `resetFromSaved: () => void` (no args).

- [ ] **Step 2: Add `hydrateFromExternal` to `useTokensForKind`**

Edit `packages/editor/src/editor/design-system/state/useTokensForKind.ts`. Add a new field to the actions interface and implement it.

In the `TokensForKindActions` interface, add:

```ts
  hydrateFromExternal: (allTokens: DesignToken[]) => void;
```

In the hook body (after the existing `resetFromSaved` implementation), add:

```ts
  const hydrateFromExternal = React.useCallback((allTokens: DesignToken[]) => {
    const filtered = allTokens.filter((t) => t.kind === kind);
    if (filtered.length === 0) return; // no-op when external set has nothing for this kind
    setTokens(filtered);
    setSavedTokens(filtered);
  }, [kind]);
```

In the returned object, add:

```ts
    hydrateFromExternal,
```

(Match the style of the existing `markSaved`, `discardAll` entries — alphabetical or grouped, whichever the file already does.)

- [ ] **Step 3: Add `useResetAllKinds` hook to `TokenRegistryContext.tsx`**

Edit `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx`. After the existing `useImageryRegistry` export (search for the last `useXxxRegistry` definition), add:

```ts
/**
 * Replaces both `tokens` and `savedTokens` for ALL 14 kinds atomically from a
 * single external source (typically `composer.getProjectSettings().designTokens`
 * after migration merge). Closes the C1 persistence gap from S1: without this,
 * the 11 new-kind hooks silently revert to DEFAULT_TOKENS on project reload.
 *
 * Color/Type/Spacing keep their bespoke `resetFromSaved(merged)` API; the 11
 * new kinds use `hydrateFromExternal(merged)` from `useTokensForKind`.
 */
export function useResetAllKinds(): (allTokens: DesignToken[]) => void {
  const color      = useColorRegistry();
  const type       = useTypeRegistry();
  const spacing    = useSpacingRegistry();
  const radius     = useRadiusRegistry();
  const shadow     = useShadowRegistry();
  const motion     = useMotionRegistry();
  const border     = useBorderRegistry();
  const opacity    = useOpacityRegistry();
  const zindex     = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid       = useGridRegistry();
  const sizing     = useSizingRegistry();
  const icon       = useIconRegistry();
  const imagery    = useImageryRegistry();

  return React.useCallback((allTokens: DesignToken[]) => {
    color.resetFromSaved(allTokens);
    type.resetFromSaved(allTokens);
    spacing.resetFromSaved(allTokens);
    radius.hydrateFromExternal(allTokens);
    shadow.hydrateFromExternal(allTokens);
    motion.hydrateFromExternal(allTokens);
    border.hydrateFromExternal(allTokens);
    opacity.hydrateFromExternal(allTokens);
    zindex.hydrateFromExternal(allTokens);
    breakpoint.hydrateFromExternal(allTokens);
    grid.hydrateFromExternal(allTokens);
    sizing.hydrateFromExternal(allTokens);
    icon.hydrateFromExternal(allTokens);
    imagery.hydrateFromExternal(allTokens);
  }, [color, type, spacing, radius, shadow, motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery]);
}
```

- [ ] **Step 4: Write a focused test**

Create `packages/editor/src/editor/design-system/state/__tests__/useResetAllKinds.test.tsx`:

```tsx
import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import {
  TokenRegistryProvider,
  useResetAllKinds,
  useRadiusRegistry,
  useColorRegistry,
} from "../TokenRegistryContext";
import type { DesignToken } from "../../types";

const externalTokens: DesignToken[] = [
  {
    id: "color-brand-500",
    name: "Brand 500",
    value: "#FF0000",
    category: "colors",
    cssVar: "--bd-color-brand-500",
    type: "color",
    kind: "color",
    friendlyName: "Brand 500",
  },
  {
    id: "radius-sm",
    name: "Small radius",
    value: "99px",
    category: "layout",
    cssVar: "--bd-radius-sm",
    type: "length",
    kind: "radius",
    friendlyName: "Small radius",
  },
];

const Probe: React.FC<{ apply: { current: ((t: DesignToken[]) => void) | null } }> = ({ apply }) => {
  const reset = useResetAllKinds();
  const radius = useRadiusRegistry();
  const color = useColorRegistry();
  apply.current = reset;
  return (
    <div>
      <span data-testid="radius-sm">{radius.tokens.find((t) => t.id === "radius-sm")?.value ?? "?"}</span>
      <span data-testid="color-brand-500">{color.tokens.find((t) => t.id === "color-brand-500")?.value ?? "?"}</span>
    </div>
  );
};

describe("useResetAllKinds", () => {
  beforeEach(() => localStorage.clear());

  it("hydrates color/type/spacing AND the 11 new kinds from a single external token array", () => {
    const apply: { current: ((t: DesignToken[]) => void) | null } = { current: null };
    const { getByTestId } = render(
      <TokenRegistryProvider projectId="reset-test">
        <Probe apply={apply} />
      </TokenRegistryProvider>
    );

    // Pre-condition: defaults are loaded.
    expect(getByTestId("radius-sm").textContent).not.toBe("99px");

    act(() => { apply.current!(externalTokens); });

    expect(getByTestId("radius-sm").textContent).toBe("99px");
    expect(getByTestId("color-brand-500").textContent).toBe("#FF0000");
  });

  it("is a no-op for kinds whose entries are absent from the external set", () => {
    const apply: { current: ((t: DesignToken[]) => void) | null } = { current: null };
    const { getByTestId } = render(
      <TokenRegistryProvider projectId="reset-noop">
        <Probe apply={apply} />
      </TokenRegistryProvider>
    );
    const radiusBefore = getByTestId("radius-sm").textContent;

    // External set has only color tokens — radius must keep its default.
    act(() => { apply.current!([externalTokens[0]]); });

    expect(getByTestId("radius-sm").textContent).toBe(radiusBefore);
  });
});
```

- [ ] **Step 5: Run the test**

Run: `cd packages/editor && npx vitest run src/editor/design-system/state/__tests__/useResetAllKinds.test.tsx --reporter=verbose`

Expected: `Tests  2 passed (2)`.

If the assertion in test 1 fails because `useColorRegistry`'s `resetFromSaved` ignores tokens not present in its current `tokens` array, inspect the existing implementation: `resetFromSaved` may only refresh `savedTokens` for known IDs. If so, additionally extend the test color sample to use a token id already in DEFAULT_TOKENS (e.g. `color-fg-primary`). The hook contract here is "match-and-update by id", not "wholesale replace".

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/design-system/state/useTokensForKind.ts packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx packages/editor/src/editor/design-system/state/__tests__/useResetAllKinds.test.tsx
git commit -m "feat(ds-ui-s1): hydrateFromExternal + useResetAllKinds for 14-kind reload (T1.5)"
```

---

## Task 2: `TokenKindCard` collapsible primitive (TDD)

**Files:**
- Create: `packages/editor/src/editor/design-system/ui/sections/TokenKindCard.tsx`
- Create: `packages/editor/src/editor/design-system/ui/sections/__tests__/TokenKindCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/editor/src/editor/design-system/ui/sections/__tests__/TokenKindCard.test.tsx`:

```tsx
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { TokenKindCard } from "../TokenKindCard";

describe("TokenKindCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders title, count and child body when open", () => {
    const { getByText } = render(
      <TokenKindCard kindId="color" title="Color" count={12} defaultOpen>
        <div>color body</div>
      </TokenKindCard>
    );
    expect(getByText("Color")).toBeTruthy();
    expect(getByText("12 tokens")).toBeTruthy();
    expect(getByText("color body")).toBeTruthy();
  });

  it("hides body when collapsed and re-shows on header click", () => {
    const { getByRole, queryByText } = render(
      <TokenKindCard kindId="radius" title="Radius" count={5} defaultOpen={false}>
        <div>radius body</div>
      </TokenKindCard>
    );
    expect(queryByText("radius body")).toBeNull();
    fireEvent.click(getByRole("button", { name: /Radius/ }));
    expect(queryByText("radius body")).toBeTruthy();
  });

  it("persists open state per kindId across remounts", () => {
    const { getByRole, unmount } = render(
      <TokenKindCard kindId="shadow" title="Shadow" count={3} defaultOpen={false}>
        <div>shadow body</div>
      </TokenKindCard>
    );
    fireEvent.click(getByRole("button", { name: /Shadow/ }));
    unmount();
    const { queryByText } = render(
      <TokenKindCard kindId="shadow" title="Shadow" count={3} defaultOpen={false}>
        <div>shadow body</div>
      </TokenKindCard>
    );
    expect(queryByText("shadow body")).toBeTruthy();
  });

  it("renders dirty dot when isDirty is true", () => {
    const { getByLabelText } = render(
      <TokenKindCard kindId="motion" title="Motion" count={6} defaultOpen isDirty>
        <div>motion body</div>
      </TokenKindCard>
    );
    expect(getByLabelText("unsaved changes in this kind")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokenKindCard.test.tsx --reporter=verbose`

Expected: FAIL with `Cannot find module '../TokenKindCard'`.

- [ ] **Step 3: Implement `TokenKindCard.tsx`**

Create `packages/editor/src/editor/design-system/ui/sections/TokenKindCard.tsx`:

```tsx
import * as React from "react";

interface TokenKindCardProps {
  kindId: string;
  title: string;
  count: number;
  defaultOpen?: boolean;
  isDirty?: boolean;
  children: React.ReactNode;
}

const STORAGE_PREFIX = "buildrik:design-tab:card-open:";

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--bd-border)",
  borderRadius: 8,
  background: "var(--bd-bg-elevated)",
  marginBottom: 8,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--bd-fg-primary)",
  textAlign: "left",
};

const bodyStyle: React.CSSProperties = {
  padding: "8px 12px 12px",
  borderTop: "1px solid var(--bd-border)",
};

const countStyle: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  fontWeight: 400,
};

const dirtyDotStyle: React.CSSProperties = {
  marginLeft: 8,
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "var(--bd-warning)",
  flexShrink: 0,
};

const chevronStyle = (open: boolean): React.CSSProperties => ({
  marginLeft: "auto",
  transition: "transform 0.15s",
  transform: open ? "rotate(90deg)" : "rotate(0deg)",
  color: "var(--bd-fg-muted)",
});

export const TokenKindCard: React.FC<TokenKindCardProps> = ({
  kindId,
  title,
  count,
  defaultOpen = true,
  isDirty = false,
  children,
}) => {
  const storageKey = STORAGE_PREFIX + kindId;
  const [open, setOpen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return defaultOpen;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "true") return true;
    if (stored === "false") return false;
    return defaultOpen;
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // localStorage unavailable (private mode / quota) — ignore
      }
      return next;
    });
  };

  return (
    <div style={cardStyle}>
      <button
        type="button"
        onClick={toggle}
        style={headerStyle}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span style={countStyle}>{count} tokens</span>
        {isDirty && (
          <span aria-label="unsaved changes in this kind" style={dirtyDotStyle} />
        )}
        <span style={chevronStyle(open)} aria-hidden>›</span>
      </button>
      {open && <div style={bodyStyle}>{children}</div>}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokenKindCard.test.tsx --reporter=verbose`

Expected: `Test Files  1 passed (1)  · Tests  4 passed (4)`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/design-system/ui/sections/TokenKindCard.tsx packages/editor/src/editor/design-system/ui/sections/__tests__/TokenKindCard.test.tsx
git commit -m "feat(ds-ui-s1): TokenKindCard collapsible primitive (T2)"
```

---

## Task 3: `GenericTokenList` for 11 string-value kinds (TDD)

**Why parametrize:** Spec §5.3 shows the 11 new `TokenKind`s all carry a single string value (or trivially-stringified shape). The 3 bespoke editors stay (color/type/spacing) because they have rich UX (color picker, font picker, scale presets). Building 11 separate near-identical list components would violate the project's no-duplicate-logic rule (CLAUDE.md §3).

**Deviation from spec §5.1:** Spec lists `RadiusTokenList.tsx`, `ShadowTokenList.tsx`, ... `ImageryTokenList.tsx` as 11 individual files. Folding into one `GenericTokenList` accepting `kind` prop is the more honest expression of the duplication; if a single kind grows bespoke UX later, split it out then. Documented at the call site.

**Files:**
- Create: `packages/editor/src/editor/design-system/ui/tokens/GenericTokenList.tsx`
- Create: `packages/editor/src/editor/design-system/ui/tokens/__tests__/GenericTokenList.test.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/editor/src/editor/design-system/ui/tokens/__tests__/GenericTokenList.test.tsx`:

```tsx
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { GenericTokenList } from "../GenericTokenList";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { DesignToken } from "../../../types";

const sampleTokens: DesignToken[] = [
  {
    id: "radius-sm",
    name: "Small radius",
    value: "4px",
    category: "layout",
    cssVar: "--bd-radius-sm",
    type: "length",
    kind: "radius",
    friendlyName: "Small radius",
  },
  {
    id: "radius-md",
    name: "Medium radius",
    value: "8px",
    category: "layout",
    cssVar: "--bd-radius-md",
    type: "length",
    kind: "radius",
    friendlyName: "Medium radius",
  },
];

const wrap = (children: React.ReactNode, mode: "beginner" | "pro" = "beginner") => (
  <DSModeProvider initialMode={mode}>{children}</DSModeProvider>
);

describe("GenericTokenList", () => {
  it("renders one row per token with friendlyName + value", () => {
    const { getByDisplayValue, getByText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />
      )
    );
    expect(getByText("Small radius")).toBeTruthy();
    expect(getByDisplayValue("4px")).toBeTruthy();
    expect(getByDisplayValue("8px")).toBeTruthy();
  });

  it("fires onTokenChange when input value changes", () => {
    const onTokenChange = vi.fn();
    const { getByDisplayValue } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={onTokenChange}
          onUndo={() => {}}
          canUndo={() => false}
        />
      )
    );
    fireEvent.change(getByDisplayValue("4px"), { target: { value: "6px" } });
    expect(onTokenChange).toHaveBeenCalledWith("radius-sm", "6px");
  });

  it("hides id and cssVar in beginner mode", () => {
    const { queryByText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />,
        "beginner"
      )
    );
    expect(queryByText("radius-sm")).toBeNull();
    expect(queryByText("--bd-radius-sm")).toBeNull();
  });

  it("shows id and cssVar in pro mode", () => {
    const { getByText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />,
        "pro"
      )
    );
    expect(getByText("radius-sm")).toBeTruthy();
    expect(getByText("--bd-radius-sm")).toBeTruthy();
  });

  it("calls onUndo when Restore button is clicked on a dirty row", () => {
    const onUndo = vi.fn();
    const { getByLabelText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{ "radius-sm": "4px" }}
          onTokenChange={() => {}}
          onUndo={onUndo}
          canUndo={(id) => id === "radius-sm"}
        />
      )
    );
    fireEvent.click(getByLabelText("Restore Small radius"));
    expect(onUndo).toHaveBeenCalledWith("radius-sm");
  });

  it("renders an empty hint when token array is empty", () => {
    const { getByText } = render(
      wrap(
        <GenericTokenList
          tokens={[]}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />
      )
    );
    expect(getByText(/No tokens yet/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/tokens/__tests__/GenericTokenList.test.tsx --reporter=verbose`

Expected: FAIL with `Cannot find module '../GenericTokenList'`.

- [ ] **Step 3: Implement `GenericTokenList.tsx`**

Create `packages/editor/src/editor/design-system/ui/tokens/GenericTokenList.tsx`:

```tsx
import * as React from "react";
import type { DesignToken } from "../../types";
import { useDSModeOptional } from "../../state/DSModeContext";

interface GenericTokenListProps {
  tokens: DesignToken[];
  pendingDiff: Record<string, string>;
  onTokenChange: (id: string, value: string) => void;
  onUndo: (id: string) => void;
  canUndo: (id: string) => boolean;
}

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 140px auto",
  gap: 8,
  alignItems: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bd-fg-primary)",
};

const metaStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  fontFamily: "var(--bd-font-mono, monospace)",
  marginTop: 2,
};

const inputStyle: React.CSSProperties = {
  height: 28,
  padding: "0 8px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  background: "var(--bd-bg-elevated)",
  color: "var(--bd-fg-primary)",
  fontSize: 12,
  fontFamily: "var(--bd-font-mono, monospace)",
};

const restoreButtonStyle: React.CSSProperties = {
  height: 28,
  padding: "0 8px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  background: "transparent",
  color: "var(--bd-fg-muted)",
  fontSize: 11,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: "16px 0",
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  textAlign: "center",
};

export const GenericTokenList: React.FC<GenericTokenListProps> = ({
  tokens,
  pendingDiff,
  onTokenChange,
  onUndo,
  canUndo,
}) => {
  const dsMode = useDSModeOptional();
  const isPro = dsMode?.mode === "pro";

  if (tokens.length === 0) {
    return <div style={emptyStyle}>No tokens yet — defaults will appear once seeded.</div>;
  }

  return (
    <div style={listStyle}>
      {tokens.map((t) => {
        const friendly = t.friendlyName ?? t.name;
        const isDirty = pendingDiff[t.id] !== undefined;
        return (
          <div key={t.id} style={rowStyle}>
            <div>
              <div style={labelStyle}>{friendly}</div>
              {isPro && (
                <div style={metaStyle}>
                  {t.id} · {t.cssVar}
                </div>
              )}
            </div>
            <input
              type="text"
              value={t.value}
              onChange={(e) => onTokenChange(t.id, e.target.value)}
              style={{
                ...inputStyle,
                borderColor: isDirty ? "var(--bd-warning)" : "var(--bd-border)",
              }}
              aria-label={`${friendly} value`}
            />
            <button
              type="button"
              disabled={!canUndo(t.id)}
              onClick={() => onUndo(t.id)}
              style={{
                ...restoreButtonStyle,
                opacity: canUndo(t.id) ? 1 : 0.4,
                cursor: canUndo(t.id) ? "pointer" : "not-allowed",
              }}
              aria-label={`Restore ${friendly}`}
            >
              Restore
            </button>
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 4: Verify `useDSModeOptional` exists**

Run: `grep -n "export function useDSModeOptional\|export const useDSModeOptional" packages/editor/src/editor/design-system/state/DSModeContext.tsx`

Expected: one match. (Per memory `DSBindingChip` already uses it.)

If missing: open `DSModeContext.tsx` and add right after `useDSMode`:

```ts
export function useDSModeOptional(): DSModeContextValue | null {
  return React.useContext(DSModeContext);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/tokens/__tests__/GenericTokenList.test.tsx --reporter=verbose`

Expected: `Tests  6 passed (6)`.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/design-system/ui/tokens/GenericTokenList.tsx packages/editor/src/editor/design-system/ui/tokens/__tests__/GenericTokenList.test.tsx
git commit -m "feat(ds-ui-s1): GenericTokenList parametrized editor for 11 string-value kinds (T3)"
```

---

## Task 4: Stub sections (Styles, Components, Export)

**Files:**
- Create: `packages/editor/src/editor/design-system/ui/sections/StylesSection.tsx`
- Create: `packages/editor/src/editor/design-system/ui/sections/ComponentsSection.tsx`
- Create: `packages/editor/src/editor/design-system/ui/sections/ExportSection.tsx`

No tests — stubs only. They'll get real coverage when their respective phases (S2/S3/S5) ship.

- [ ] **Step 1: Confirm `EmptyState` import path**

Run: `find packages/editor/src/shared -name "EmptyState*" -type f`

Expected: hit at `packages/editor/src/shared/ui/EmptyState.tsx` or similar. If missing, use a plain `<div>` with the same shape (existing code uses inline EmptyStates already).

- [ ] **Step 2: Create `StylesSection.tsx`**

```tsx
import * as React from "react";

const containerStyle: React.CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--bd-fg-muted)",
  fontSize: 13,
};

export const StylesSection: React.FC = () => (
  <div style={containerStyle}>
    <strong style={{ display: "block", marginBottom: 4, color: "var(--bd-fg-primary)" }}>
      Styles
    </strong>
    Reusable preset styles (buttons, cards, forms…) ship in the next phase.
  </div>
);
```

- [ ] **Step 3: Create `ComponentsSection.tsx`**

```tsx
import * as React from "react";

const containerStyle: React.CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--bd-fg-muted)",
  fontSize: 13,
};

export const ComponentsSection: React.FC = () => (
  <div style={containerStyle}>
    <strong style={{ display: "block", marginBottom: 4, color: "var(--bd-fg-primary)" }}>
      Components
    </strong>
    Component catalog summary lands when the Components panel ships.
    <div style={{ marginTop: 12, fontSize: 12 }}>
      Use the <strong>Components</strong> rail tab to browse existing components.
    </div>
  </div>
);
```

- [ ] **Step 4: Create `ExportSection.tsx`**

```tsx
import * as React from "react";

const containerStyle: React.CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--bd-fg-muted)",
  fontSize: 13,
};

export const ExportSection: React.FC = () => (
  <div style={containerStyle}>
    <strong style={{ display: "block", marginBottom: 4, color: "var(--bd-fg-primary)" }}>
      Export
    </strong>
    Token import/export modals are still reachable via the header dropdown.
    Dedicated workspace lands in S5.
  </div>
);
```

- [ ] **Step 5: Type-check**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | tail -10`

Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/design-system/ui/sections/StylesSection.tsx packages/editor/src/editor/design-system/ui/sections/ComponentsSection.tsx packages/editor/src/editor/design-system/ui/sections/ExportSection.tsx
git commit -m "feat(ds-ui-s1): placeholder StylesSection / ComponentsSection / ExportSection stubs (T4)"
```

---

## Task 5: `TokensSection` orchestrator (TDD)

**Files:**
- Create: `packages/editor/src/editor/design-system/ui/sections/TokensSection.tsx`
- Create: `packages/editor/src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/editor/src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { TokensSection } from "../TokensSection";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";

const wrap = (children: React.ReactNode, mode: "beginner" | "pro" = "beginner") => (
  <DSModeProvider initialMode={mode}>
    <TokenRegistryProvider projectId="test">
      {children}
    </TokenRegistryProvider>
  </DSModeProvider>
);

beforeEach(() => localStorage.clear());

describe("TokensSection", () => {
  it("renders a card for each of the 14 token kinds", () => {
    const { getAllByRole } = render(wrap(<TokensSection />));
    // Each TokenKindCard header is a button with aria-expanded; expect 14.
    const headers = getAllByRole("button").filter((b) => b.hasAttribute("aria-expanded"));
    expect(headers.length).toBe(14);
  });

  it("renders the existing Color, Type, Spacing bespoke editors inside their cards", () => {
    const { getByText } = render(wrap(<TokensSection />));
    expect(getByText("Color")).toBeTruthy();
    expect(getByText("Type")).toBeTruthy();
    expect(getByText("Spacing")).toBeTruthy();
  });

  it("renders all 11 new kinds with their friendly titles", () => {
    const { getByText } = render(wrap(<TokensSection />));
    const expected = [
      "Radius", "Shadow", "Motion", "Border",
      "Opacity", "Z-index", "Breakpoint", "Grid",
      "Sizing", "Icon", "Imagery",
    ];
    for (const title of expected) {
      expect(getByText(title)).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Verify `TokenRegistryProvider` accepts `initialTokens`**

Run: `grep -n "initialTokens\|TokenRegistryProviderProps" packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx | head -10`

If `initialTokens` is not the prop name, adjust the test accordingly (the provider hydrates from `DEFAULT_TOKENS` automatically; the prop may be named differently). Check the exact signature before running the test.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx --reporter=verbose`

Expected: FAIL with `Cannot find module '../TokensSection'`.

- [ ] **Step 4: Implement `TokensSection.tsx`**

Create `packages/editor/src/editor/design-system/ui/sections/TokensSection.tsx`:

```tsx
import * as React from "react";
import { TokenKindCard } from "./TokenKindCard";
import { GenericTokenList } from "../tokens/GenericTokenList";
import { ColorTokenList } from "../colors/ColorTokenList";
import { TypeTokenList } from "../type/TypeTokenList";
import { SpacingTokenList } from "../spacing/SpacingTokenList";
import {
  useColorRegistry,
  useTypeRegistry,
  useSpacingRegistry,
  useRadiusRegistry,
  useShadowRegistry,
  useMotionRegistry,
  useBorderRegistry,
  useOpacityRegistry,
  useZindexRegistry,
  useBreakpointRegistry,
  useGridRegistry,
  useSizingRegistry,
  useIconRegistry,
  useImageryRegistry,
} from "../../state/TokenRegistryContext";
import { useDSModeOptional } from "../../state/DSModeContext";
import type { TokenKind } from "../../types";

interface TokensSectionProps {
  /** C2 fix: clicking "+" inside ColorTokenList must open the parent's AddTokenModal. */
  onAddTokenClick?: () => void;
  /** C3 fix: SpacingTokenList's "Reset to defaults" must call stageDefaults at parent scope. */
  onResetSpacingToDefaults?: () => void;
}

interface KindEntry {
  kindId: TokenKind;
  title: string;
  isFoundation: boolean; // true = often empty in a fresh project; muted in beginner mode
}

const KIND_ORDER: KindEntry[] = [
  { kindId: "color",      title: "Color",      isFoundation: false },
  { kindId: "type",       title: "Type",       isFoundation: false },
  { kindId: "spacing",    title: "Spacing",    isFoundation: false },
  { kindId: "radius",     title: "Radius",     isFoundation: false },
  { kindId: "shadow",     title: "Shadow",     isFoundation: false },
  { kindId: "motion",     title: "Motion",     isFoundation: false },
  { kindId: "border",     title: "Border",     isFoundation: true  },
  { kindId: "opacity",    title: "Opacity",    isFoundation: true  },
  { kindId: "zindex",     title: "Z-index",    isFoundation: true  },
  { kindId: "breakpoint", title: "Breakpoint", isFoundation: true  },
  { kindId: "grid",       title: "Grid",       isFoundation: true  },
  { kindId: "sizing",     title: "Sizing",     isFoundation: true  },
  { kindId: "icon",       title: "Icon",       isFoundation: true  },
  { kindId: "imagery",    title: "Imagery",    isFoundation: true  },
];

export const TokensSection: React.FC<TokensSectionProps> = ({
  onAddTokenClick,
  onResetSpacingToDefaults,
}) => {
  const dsMode = useDSModeOptional();
  const isBeginner = dsMode?.mode !== "pro";

  const color      = useColorRegistry();
  const type       = useTypeRegistry();
  const spacing    = useSpacingRegistry();
  const radius     = useRadiusRegistry();
  const shadow     = useShadowRegistry();
  const motion     = useMotionRegistry();
  const border     = useBorderRegistry();
  const opacity    = useOpacityRegistry();
  const zindex     = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid       = useGridRegistry();
  const sizing     = useSizingRegistry();
  const icon       = useIconRegistry();
  const imagery    = useImageryRegistry();

  const colorDirty = Object.keys(color.pendingDiff).length > 0;
  const typeDirty = type.tokens.some((t) => {
    const saved = type.savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });
  const spacingDirty = spacing.tokens.some((t) => {
    const saved = spacing.savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });

  const renderBespoke = (kindId: TokenKind): React.ReactNode => {
    if (kindId === "color") {
      return (
        <ColorTokenList
          tokens={color.tokens}
          pendingDiff={color.pendingDiff}
          onColorChange={color.updateToken}
          onUndo={color.undoToken}
          onRedo={color.redoToken}
          canUndo={color.canUndo}
          canRedo={color.canRedo}
          onAddToken={() => onAddTokenClick?.()}
        />
      );
    }
    if (kindId === "type") {
      return (
        <TypeTokenList
          tokens={type.tokens}
          responsiveMode={type.responsiveMode}
          onTokenChange={type.updateToken}
          onResponsiveModeChange={type.setResponsiveMode}
          onUndo={type.undoToken}
          canUndo={type.canUndo}
          onRedo={type.redoToken}
          canRedo={type.canRedo}
        />
      );
    }
    if (kindId === "spacing") {
      return (
        <SpacingTokenList
          tokens={spacing.tokens}
          activePreset={spacing.activePreset}
          savedPreset={spacing.savedPreset}
          isDirty={spacing.isDirty}
          onTokenChange={spacing.updateToken}
          onPresetApply={spacing.applyPreset}
          onResetToDefaults={() => onResetSpacingToDefaults?.()}
          onUndo={spacing.undoToken}
          canUndo={spacing.canUndo}
          onRedo={spacing.redoToken}
          canRedo={spacing.canRedo}
        />
      );
    }
    return null;
  };

  const registryFor = (kindId: TokenKind) => {
    switch (kindId) {
      case "radius":     return radius;
      case "shadow":     return shadow;
      case "motion":     return motion;
      case "border":     return border;
      case "opacity":    return opacity;
      case "zindex":     return zindex;
      case "breakpoint": return breakpoint;
      case "grid":       return grid;
      case "sizing":     return sizing;
      case "icon":       return icon;
      case "imagery":    return imagery;
      default:           return null;
    }
  };

  // Beginner mode: foundation kinds with zero tokens move to the bottom.
  const ordered = React.useMemo(() => {
    if (!isBeginner) return KIND_ORDER;
    const populated: KindEntry[] = [];
    const muted: KindEntry[] = [];
    for (const k of KIND_ORDER) {
      const r = k.kindId === "color"   ? color
              : k.kindId === "type"    ? type
              : k.kindId === "spacing" ? spacing
              : registryFor(k.kindId);
      const count = r?.tokens.length ?? 0;
      if (k.isFoundation && count === 0) {
        muted.push(k);
      } else {
        populated.push(k);
      }
    }
    return [...populated, ...muted];
  }, [isBeginner, color, type, spacing, radius, shadow, motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery]);

  return (
    <div>
      {ordered.map((entry) => {
        if (entry.kindId === "color") {
          return (
            <TokenKindCard key={entry.kindId} kindId={entry.kindId} title={entry.title} count={color.tokens.length} isDirty={colorDirty}>
              {renderBespoke("color")}
            </TokenKindCard>
          );
        }
        if (entry.kindId === "type") {
          return (
            <TokenKindCard key={entry.kindId} kindId={entry.kindId} title={entry.title} count={type.tokens.length} isDirty={typeDirty}>
              {renderBespoke("type")}
            </TokenKindCard>
          );
        }
        if (entry.kindId === "spacing") {
          return (
            <TokenKindCard key={entry.kindId} kindId={entry.kindId} title={entry.title} count={spacing.tokens.length} isDirty={spacingDirty}>
              {renderBespoke("spacing")}
            </TokenKindCard>
          );
        }
        const r = registryFor(entry.kindId);
        if (!r) return null;
        const dirty = Object.keys(r.pendingDiff).length > 0;
        return (
          <TokenKindCard
            key={entry.kindId}
            kindId={entry.kindId}
            title={entry.title}
            count={r.tokens.length}
            isDirty={dirty}
            defaultOpen={r.tokens.length > 0}
          >
            <GenericTokenList
              tokens={r.tokens}
              pendingDiff={r.pendingDiff}
              onTokenChange={r.updateToken}
              onUndo={r.undoToken}
              canUndo={r.canUndo}
            />
          </TokenKindCard>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 5: Run test**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx --reporter=verbose`

Expected: `Tests  3 passed (3)`.

If `getByText("Spacing")` matches both the card title and another DOM node, refine the assertion to scope by role (e.g., `getAllByRole("button")` filtered by `aria-expanded` and inspected by `textContent`).

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/design-system/ui/sections/TokensSection.tsx packages/editor/src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx
git commit -m "feat(ds-ui-s1): TokensSection orchestrator with 14 collapsible kind cards (T5)"
```

---

## Task 6: `DesignSystemTab` shell restructure (3 tabs → 4 sections)

This is the largest single task. The tab switcher state and per-tab dirty branching collapse into a section switcher (Tokens / Styles / Components / Export). Apply / discard aggregation now spans 14 registries instead of 3. Existing footer, modals, header, lint banner, dark-mode wiring, and persistence all stay.

**Files:**
- Modify: `packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx` (full JSX rewrite + handler aggregation)

- [ ] **Step 1: Re-read the current file end-to-end (no edit)**

Run: `wc -l packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx`

Expected: 593 lines. Read it in your editor to keep behaviors you're preserving in head: `loadFromComposer`, `EVENTS.PROJECT_LOADED` subscription, `handleApply` persistence, `handleDiscard` undo-toast, `handleExport`, `handleAddToken`, all three modals.

- [ ] **Step 2: Rewrite the file**

Replace `packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx` with the version below. Hit-list of changes vs. current file:

- Add imports: 11 new registry hooks, `TokensSection`, `StylesSection`, `ComponentsSection`, `ExportSection`.
- Replace `type DesignTab = "colors" | "type" | "spacing"` with `type DesignSection = "tokens" | "styles" | "components" | "export"`.
- Replace `TABS` array with `SECTIONS` array.
- Aggregate dirty count across 14 registries (helper function).
- `handleApply` builds `tokenRecords` from all 14 registries' `tokens`; persists via `setProjectSettings`; calls `markSaved` on all 14.
- `handleDiscard` collects unsaved across 14 registries; calls `discardAll` on each; undo toast restores to all 14.
- Section body switches between four section components instead of three lists.
- Tab guard modal still works (now triggered on section switch when dirty); footer + lint mount unchanged.

```tsx
/**
 * DesignSystemTab v12 — Tokens / Styles / Components / Export
 * 4-section workspace. Aggregates dirty state across all 14 token registries.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelHeader } from "@/shared/extensions/PanelHeader";
import { PanelErrorState } from "../../../editor/sidebar/shared/PanelErrorState";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import type { DesignTokenRecord } from "../../../shared/types/project";
import { useToast } from "@/editor/shared/vibcoder";
import { DEFAULT_TOKENS } from "../constants";
import {
  useColorRegistry,
  useTypeRegistry,
  useSpacingRegistry,
  useRadiusRegistry,
  useShadowRegistry,
  useMotionRegistry,
  useBorderRegistry,
  useOpacityRegistry,
  useZindexRegistry,
  useBreakpointRegistry,
  useGridRegistry,
  useSizingRegistry,
  useIconRegistry,
  useImageryRegistry,
  useRegistryConfig,
  useResetAllKinds,
} from "../state/TokenRegistryContext";
import { useTokenUsageMap } from "../state/useTokenUsageMap";
import type { DesignToken } from "../types";
import { CURRENT_SCHEMA_VERSION, migrateDesignTokens } from "../migrations";
import {
  buildExport,
  downloadFile,
  generateColorTokenId,
  generateColorCssVar,
} from "../utils/exportUtils";
import type { ExportFormat } from "../utils/exportUtils";
import { DesignTabFooter } from "./DesignTabFooter";
import { DraftChip } from "./DraftChip";
import { DSLintMount } from "./DSLintMount";
import { DSModeToggle } from "./DSModeToggle";
import { ExportDropdown } from "./ExportDropdown";
import { AddTokenModal } from "./modals/AddTokenModal";
import { ReviewModal } from "./modals/ReviewModal";
import { TabGuardModal } from "./modals/TabGuardModal";
import { TokensSection } from "./sections/TokensSection";
import { StylesSection } from "./sections/StylesSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { ExportSection } from "./sections/ExportSection";

// ─── Layout ───────────────────────────────────────────────────────────────────

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--bd-bg-subtle)",
};

const sectionBodyStyles: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: 12,
};

// ─── Section types ────────────────────────────────────────────────────────────

type DesignSection = "tokens" | "styles" | "components" | "export";

const SECTIONS: Array<{ id: DesignSection; label: string }> = [
  { id: "tokens",     label: "Tokens" },
  { id: "styles",     label: "Styles" },
  { id: "components", label: "Components" },
  { id: "export",     label: "Export" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface KindRegistryLike {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  pendingDiff: Record<string, string>;
  updateToken: (id: string, value: string) => void;
  markSaved: () => void;
  discardAll: () => void;
}

function dirtyCount(reg: KindRegistryLike): number {
  // pendingDiff covers undo-redo aware kinds (color); fall back to value-vs-saved
  const fromDiff = Object.keys(reg.pendingDiff).length;
  if (fromDiff > 0) return fromDiff;
  return reg.tokens.filter((t) => {
    const saved = reg.savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  }).length;
}

// ─── DesignSystemTab ──────────────────────────────────────────────────────────

interface DesignSystemTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const DesignSystemTab: React.FC<DesignSystemTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = React.useState<DesignSection>("tokens");
  const [pendingSection, setPendingSection] = React.useState<DesignSection | null>(null);
  const [showSectionGuard, setShowSectionGuard] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);
  const [showAddToken, setShowAddToken] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = React.useState(false);

  const hasLoadedRef = React.useRef(false);

  const [usageVersion, setUsageVersion] = React.useState(0);
  const usageMap = useTokenUsageMap(composer, usageVersion);
  const totalUsageCount = React.useMemo(() => {
    let n = 0;
    for (const set of usageMap.values()) n += set.size;
    return n;
  }, [usageMap]);

  const color      = useColorRegistry();
  const type       = useTypeRegistry();
  const spacing    = useSpacingRegistry();
  const radius     = useRadiusRegistry();
  const shadow     = useShadowRegistry();
  const motion     = useMotionRegistry();
  const border     = useBorderRegistry();
  const opacity    = useOpacityRegistry();
  const zindex     = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid       = useGridRegistry();
  const sizing     = useSizingRegistry();
  const icon       = useIconRegistry();
  const imagery    = useImageryRegistry();
  const { persistAll } = useRegistryConfig();
  const resetAllKinds = useResetAllKinds();

  const allRegistries: KindRegistryLike[] = [
    color, type, spacing, radius, shadow, motion, border,
    opacity, zindex, breakpoint, grid, sizing, icon, imagery,
  ];

  const totalDirty = allRegistries.reduce((n, r) => n + dirtyCount(r), 0);
  const isDirty = totalDirty > 0;

  const isDirtyRef = React.useRef(isDirty);
  React.useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  // ─ Load from Composer ─
  const loadFromComposer = React.useCallback(() => {
    if (!composer) return;
    try {
      const settings = composer.getProjectSettings();
      const storedVersion = settings.designTokensSchemaVersion ?? 1;

      if (storedVersion > CURRENT_SCHEMA_VERSION) {
        console.warn(
          `project was saved with designTokensSchemaVersion=${storedVersion} ` +
          `(editor supports up to ${CURRENT_SCHEMA_VERSION}); loading tokens as-is`
        );
      }

      if (settings.designTokens && settings.designTokens.length > 0) {
        let incoming = settings.designTokens;
        if (storedVersion < CURRENT_SCHEMA_VERSION) {
          incoming = migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION);
        }
        const merged = DEFAULT_TOKENS.map((def) => {
          const saved = incoming.find((t) => (t.id ? t.id === def.id : t.name === def.name));
          return saved ? { ...def, value: saved.value } : def;
        });
        // C1 fix: single fan-out resets all 14 kinds atomically. Internally:
        // color/type/spacing get resetFromSaved(merged), the 11 new kinds get
        // hydrateFromExternal(merged) (filters by kind, replaces tokens+saved).
        resetAllKinds(merged);
        hasLoadedRef.current = true;
        setIsFirstLoad(false);
      } else {
        setIsFirstLoad(true);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load design tokens");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composer, resetAllKinds]);

  React.useEffect(() => {
    if (!composer) return;
    loadFromComposer();

    const handleProjectLoaded = () => { if (!hasLoadedRef.current) loadFromComposer(); };
    const handleSettingsChange = () => {
      if (isDirtyRef.current) {
        addToast({
          description: "Design tokens changed from another window. Your edits may conflict.",
          tone: "warning",
        });
      } else {
        loadFromComposer();
      }
    };
    const handleUndoRedo = () => loadFromComposer();
    const bumpUsage = () => setUsageVersion((v) => v + 1);

    composer.on(EVENTS.PROJECT_LOADED, handleProjectLoaded);
    composer.on(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
    composer.on("undo:applied", handleUndoRedo);
    composer.on("redo:applied", handleUndoRedo);
    composer.on(EVENTS.ELEMENT_CREATED, bumpUsage);
    composer.on(EVENTS.ELEMENT_UPDATED, bumpUsage);
    composer.on(EVENTS.ELEMENT_DELETED, bumpUsage);
    composer.on(EVENTS.STYLE_CHANGED, bumpUsage);
    composer.on(EVENTS.STYLE_APPLIED, bumpUsage);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, handleProjectLoaded);
      composer.off(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
      composer.off("undo:applied", handleUndoRedo);
      composer.off("redo:applied", handleUndoRedo);
      composer.off(EVENTS.ELEMENT_CREATED, bumpUsage);
      composer.off(EVENTS.ELEMENT_UPDATED, bumpUsage);
      composer.off(EVENTS.ELEMENT_DELETED, bumpUsage);
      composer.off(EVENTS.STYLE_CHANGED, bumpUsage);
      composer.off(EVENTS.STYLE_APPLIED, bumpUsage);
    };
  }, [composer, loadFromComposer, addToast]);

  // ─ Section switching with guard ─
  const handleSectionClick = (s: DesignSection) => {
    if (s === activeSection) return;
    if (isDirty) {
      setPendingSection(s);
      setShowSectionGuard(true);
    } else {
      setActiveSection(s);
    }
  };

  const handleGuardDiscard = () => {
    allRegistries.forEach((r) => r.discardAll());
    setShowSectionGuard(false);
    if (pendingSection) { setActiveSection(pendingSection); setPendingSection(null); }
  };

  const handleGuardKeep = () => {
    setShowSectionGuard(false);
    setPendingSection(null);
  };

  const handleGuardSaveAndSwitch = () => {
    handleApply();
    setShowSectionGuard(false);
    if (pendingSection) { setActiveSection(pendingSection); setPendingSection(null); }
  };

  // ─ Apply ─
  const handleApply = () => {
    if (!composer) return;
    const allTokens: DesignToken[] = allRegistries.flatMap((r) => r.tokens);
    const tokenRecords: DesignTokenRecord[] = allTokens
      .filter((t): t is DesignToken & { category: DesignTokenRecord["category"] } => {
        const valid: DesignTokenRecord["category"][] = [
          "colors", "typography", "spacing", "effects",
          "layout", "icons", "buttons", "forms", "theme",
        ];
        return valid.includes(t.category as DesignTokenRecord["category"]);
      })
      .map((t) => ({
        id: t.id,
        name: t.name,
        value: t.value,
        cssVar: t.cssVar,
        category: t.category,
        type: t.type,
        group: t.group,
      }));

    try {
      const current = composer.getProjectSettings();
      composer.setProjectSettings({
        ...current,
        designTokens: tokenRecords,
        designTokensSchemaVersion: CURRENT_SCHEMA_VERSION,
      });
      persistAll();
      allRegistries.forEach((r) => r.markSaved());
      setShowReview(false);
      setIsFirstLoad(false);
      addToast({ description: "Design tokens applied successfully", tone: "success" });
    } catch {
      addToast({ description: "Failed to apply tokens. Try again.", tone: "error" });
    }
  };

  // ─ Discard ─
  const handleDiscard = () => {
    const snapshots = allRegistries.map((r) =>
      r.tokens
        .filter((t) => {
          const saved = r.savedTokens.find((s) => s.id === t.id);
          return saved !== undefined && t.value !== saved.value;
        })
        .map((t) => ({ id: t.id, value: t.value, registry: r }))
    );
    const flat = snapshots.flat();
    const count = totalDirty;

    allRegistries.forEach((r) => r.discardAll());

    addToast({
      description: `${count} change${count !== 1 ? "s" : ""} discarded`,
      tone: "info",
      action: {
        label: "Undo",
        onClick: () => {
          flat.forEach(({ id, value, registry }) => registry.updateToken(id, value));
        },
      },
    });
  };

  const handleExport = (format: ExportFormat) => {
    const allTokens: DesignToken[] = allRegistries.flatMap((r) => r.tokens);
    const { content, filename } = buildExport(allTokens, format);
    downloadFile(content, filename);
    addToast({ description: `Exported ${filename}`, tone: "success" });
  };

  // C3 fix: factory-reset spacing tokens (stages defaults for Review/Apply, not discardAll).
  const handleResetSpacingToDefaults = () => {
    spacing.stageDefaults(DEFAULT_TOKENS);
    addToast({ description: "Spacing reset to defaults — review and Apply to save.", tone: "info" });
  };

  const handleAddToken = (name: string, hex: string) => {
    const newToken: DesignToken = {
      id: generateColorTokenId(name),
      name,
      value: hex,
      category: "colors",
      cssVar: generateColorCssVar(name),
      type: "color",
      group: "brand",
    };
    color.addToken(newToken);
    setShowAddToken(false);
    addToast({ description: `Token "${name}" added`, tone: "success" });
  };

  const headerTitle =
    activeSection === "tokens"     ? "Design · Tokens"
  : activeSection === "styles"     ? "Design · Styles"
  : activeSection === "components" ? "Design · Components"
  :                                  "Design · Export";

  const changedSectionLabels = isDirty ? ["Tokens"] : [];

  return (
    <div style={{ ...containerStyles, position: "relative" }}>
      <PanelHeader
        title={headerTitle}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        <div aria-live="polite" aria-atomic="true" style={{ marginRight: 4 }}>
          <DraftChip state={isDirty ? "dirty" : "saved"} count={totalDirty} />
        </div>
        <DSModeToggle />
        <ExportDropdown
          onExport={handleExport}
          isDirty={isDirty}
          onSaveFirst={() => setShowReview(true)}
        />
      </PanelHeader>

      <DSLintMount composer={composer} />

      {/* Section switcher */}
      <div
        style={{
          display: "flex",
          padding: "8px 12px 0",
          gap: 2,
          borderBottom: "1px solid var(--bd-border)",
          background: "var(--bd-bg-subtle)",
          flexShrink: 0,
        }}
      >
        {SECTIONS.map((s) => {
          const dirtyHere = s.id === "tokens" && isDirty;
          return (
            <button
              key={s.id}
              onClick={() => handleSectionClick(s.id)}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: "6px 6px 0 0",
                border: "none",
                background: "transparent",
                color: activeSection === s.id ? "var(--bd-fg-primary)" : "var(--bd-fg-muted)",
                fontSize: 13,
                fontWeight: activeSection === s.id ? 500 : 400,
                cursor: "pointer",
                borderBottom:
                  activeSection === s.id ? "2px solid var(--bd-accent)" : "2px solid transparent",
                transition: "color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {s.label}
              {dirtyHere && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--bd-warning)",
                    flexShrink: 0,
                  }}
                  aria-label="unsaved changes"
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "5px 12px",
          fontSize: 12,
          color: "var(--bd-fg-muted)",
          background: "var(--bd-bg-subtle)",
          borderBottom: "1px solid var(--bd-border)",
          flexShrink: 0,
        }}
      >
        Changes here apply to every page on your site
        {totalUsageCount > 0 && (
          <span style={{ marginLeft: 6 }}>
            · {totalUsageCount} token binding{totalUsageCount === 1 ? "" : "s"} in use
          </span>
        )}
      </div>

      {error ? (
        <PanelErrorState
          message={error}
          onRetry={() => { setError(null); loadFromComposer(); }}
        />
      ) : (
        <div style={sectionBodyStyles}>
          {isFirstLoad && activeSection === "tokens" && (
            <div
              style={{
                margin: "10px 10px 0",
                padding: "8px 12px",
                background: "var(--bd-info-bg, rgba(45,109,255,0.07))",
                border: "1px solid var(--bd-info-border, rgba(45,109,255,0.2))",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "var(--bd-fg-primary)", lineHeight: 1.6 }}>
                These are your site's default design tokens. Customize them and click{" "}
                <strong>Review &amp; Apply</strong> to go live.
              </span>
            </div>
          )}

          {activeSection === "tokens"     && (
            <TokensSection
              onAddTokenClick={() => setShowAddToken(true)}
              onResetSpacingToDefaults={handleResetSpacingToDefaults}
            />
          )}
          {activeSection === "styles"     && <StylesSection />}
          {activeSection === "components" && <ComponentsSection />}
          {activeSection === "export"     && <ExportSection />}
        </div>
      )}

      <DesignTabFooter
        isDirty={isDirty}
        dirtyCount={totalDirty}
        onDiscard={handleDiscard}
        onReview={() => setShowReview(true)}
      />

      {showSectionGuard && (
        <TabGuardModal
          changedTabs={changedSectionLabels}
          onDiscard={handleGuardDiscard}
          onKeep={handleGuardKeep}
          onSaveAndSwitch={handleGuardSaveAndSwitch}
        />
      )}
      {showReview && (
        <ReviewModal
          colorTokens={color.tokens}
          colorDiff={color.pendingDiff}
          typeTokens={type.tokens}
          typeSavedTokens={type.savedTokens}
          spacingTokens={spacing.tokens}
          spacingSavedTokens={spacing.savedTokens}
          onConfirm={handleApply}
          onClose={() => setShowReview(false)}
        />
      )}
      {showAddToken && (
        <AddTokenModal
          existingIds={color.tokens.map((t) => t.id)}
          onAdd={handleAddToken}
          onClose={() => setShowAddToken(false)}
        />
      )}
    </div>
  );
};

export default DesignSystemTab;
```

- [ ] **Step 3: Type-check**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | tail -20`

Expected: zero new errors. If any of the 11 registry hooks have a slightly different prop signature than `useTokensForKind`'s return (e.g. spacing has `applyPreset` extras), the strict typing of `KindRegistryLike` will fail — narrow `allRegistries` typing using the structural shape (already done above with `KindRegistryLike` interface) and assert via casting only at registration: `[color, type, spacing, ...] as KindRegistryLike[]`.

- [ ] **Step 4: Run the existing DSLintMount test to confirm we didn't break anything**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/__tests__/DSLintMount.test.tsx --reporter=verbose`

Expected: pre-existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx
git commit -m "refactor(ds-ui-s1): DesignSystemTab 3-tab horizontal -> 4-section workspace + 14-kind aggregation (T6)"
```

---

## Task 7: Aggregation regression test for `DesignSystemTab`

**Files:**
- Create: `packages/editor/src/editor/design-system/ui/__tests__/DesignSystemTab.aggregation.test.tsx`

- [ ] **Step 1: Write the failing test (then make it pass with code that already exists)**

Create `packages/editor/src/editor/design-system/ui/__tests__/DesignSystemTab.aggregation.test.tsx`:

```tsx
import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/shared/vibcoder";

function makeFakeComposer() {
  const settings: any = { designTokens: [], designTokensSchemaVersion: 2 };
  const handlers = new Map<string, Set<(...a: any[]) => void>>();
  return {
    getProjectSettings: () => settings,
    setProjectSettings: (next: any) => { Object.assign(settings, next); },
    on: (e: string, h: any) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: any) => { handlers.get(e)?.delete(h); },
    elements: { getAll: () => [] },
    settings,
  } as any;
}

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="agg-test">
        {ui}
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => localStorage.clear());

describe("DesignSystemTab — 14-kind aggregation", () => {
  it("renders all four sections in the section switcher", () => {
    const composer = makeFakeComposer();
    const { getByText } = render(wrap(<DesignSystemTab composer={composer} />));
    expect(getByText("Tokens")).toBeTruthy();
    expect(getByText("Styles")).toBeTruthy();
    expect(getByText("Components")).toBeTruthy();
    expect(getByText("Export")).toBeTruthy();
  });

  it("editing a radius token bumps the totalDirty count and DraftChip", async () => {
    const composer = makeFakeComposer();
    const { getByLabelText, container } = render(wrap(<DesignSystemTab composer={composer} />));
    const radiusInput = await waitFor(() => getByLabelText("Small radius value") as HTMLInputElement);
    fireEvent.change(radiusInput, { target: { value: "10px" } });
    const chip = container.querySelector('[role="status"], [aria-live="polite"]');
    expect(chip?.textContent ?? "").toMatch(/1/);
  });

  it("clicking Apply persists tokens including non-color/type/spacing kinds", async () => {
    const composer = makeFakeComposer();
    const setSpy = vi.spyOn(composer, "setProjectSettings");
    const { getByLabelText, getByRole } = render(wrap(<DesignSystemTab composer={composer} />));
    const radiusInput = await waitFor(() => getByLabelText("Small radius value") as HTMLInputElement);
    fireEvent.change(radiusInput, { target: { value: "10px" } });
    fireEvent.click(getByRole("button", { name: /Review/i }));
    fireEvent.click(getByRole("button", { name: /^Apply$|^Confirm$|Apply changes/i }));
    await waitFor(() => {
      expect(setSpy).toHaveBeenCalled();
      const arg = setSpy.mock.calls[0][0];
      const radiusRecord = arg.designTokens.find((t: any) => t.id === "radius-sm");
      expect(radiusRecord?.value).toBe("10px");
    });
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd packages/editor && npx vitest run src/editor/design-system/ui/__tests__/DesignSystemTab.aggregation.test.tsx --reporter=verbose`

Expected: all 3 pass. If the ReviewModal button label differs from "Apply" / "Confirm" / "Apply changes", inspect the rendered output (use `console.log(container.innerHTML)`) and adjust the regex once.

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/design-system/ui/__tests__/DesignSystemTab.aggregation.test.tsx
git commit -m "test(ds-ui-s1): DesignSystemTab aggregates dirty + apply across 14 kinds (T7)"
```

---

## Task 8: Browser smoke test + path-scoped suite + tag

This task does no code editing — it verifies the live editor renders the new shell and that nothing in the path-scoped DS test set regresses.

- [ ] **Step 1: Run the path-scoped DS test set**

Run:

```bash
cd packages/editor
npx vitest run src/editor/design-system --reporter=verbose 2>&1 | tail -25
```

Expected: all DS tests pass. Note total `Tests N passed` count — record it. The new tests added by this plan should account for: TokenKindCard (4) + GenericTokenList (6) + TokensSection (3) + DesignSystemTab.aggregation (3) = **16 new tests**.

- [ ] **Step 2: Start dev server + smoke check the Design tab manually**

Run in a second terminal:

```bash
cd packages/editor && npm run dev
```

Open `http://localhost:5050`. Click Design tab in the rail. Verify:

1. Section switcher shows **Tokens / Styles / Components / Export** (not the old Colors / Type / Spacing tabs).
2. Tokens section renders 14 collapsible cards. Click each chevron — body opens / closes; refresh page; previously-open cards stay open.
3. Color / Type / Spacing cards still render their bespoke editors (color picker, font controls, spacing scale).
4. Edit a Radius value via its input. DraftChip in the header increments. Discard button restores. Apply persists (open DevTools → Application → localStorage → `buildrik:design-tokens-*` includes the radius row).
5. Switch to Styles / Components / Export sections — placeholder copy renders without console errors.
6. DSModeToggle still works: in Pro mode the GenericTokenList rows show `radius-sm · --bd-radius-sm` meta lines; in Beginner mode the meta line disappears.
7. Lint banner (DSLintMount) still appears when applicable.

If any check fails, fix in the file the symptom points to (don't bandage in `DesignSystemTab`).

- [ ] **Step 3: Tag locally (no push — solo workflow per memory)**

```bash
git tag ds-ui-tier2-s1-tokens-section-complete
git tag --list | grep ds-ui-tier2
```

Expected: tag prints. Do **not** push (memory: `feedback_solo_workflow.md` keeps tags local-first; push later as a batch).

- [ ] **Step 4: Update MEMORY.md index**

Add one line under the existing DS UI Tier-2 entry. Edit `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` — append after the most recent `DS UI Tier-2 partial 2026-05-08` entry:

```
- DS UI Tier-2 S1 TokensSection shipped 2026-05-10 — 4-section workspace (Tokens live; Styles/Components/Export stubs); 14-card collapsible accordion; GenericTokenList parametrized for 11 string-value kinds; DesignSystemTab restructured with 14-kind aggregation. 16 new tests (4+6+3+3). Tag ds-ui-tier2-s1-tokens-section-complete LOCAL ONLY.
```

Then create the topic file at `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ds_ui_tier2_s1_shipped_20260510.md` with full detail (commits, deviations from spec, test counts, what S2/S3/S5 inherit).

- [ ] **Step 5: Done — write the closing summary**

Single-message terminal report to the user with:
- Commits landed (T1–T7)
- Test count delta
- Tag
- What's next: S2 (StylesSection content) or S6 (Components panel)

---

## Self-Review

**1. Spec coverage** (§6.2 — 4-section workspace + 14-card Tokens accordion + Beginner-mode muting + Pro-mode metadata):

| Spec requirement | Where covered |
|---|---|
| 4 top-level sections (Tokens / Styles / Components / Export) | T6 SECTIONS array + section body switch |
| Tokens active by default | T6 `useState<DesignSection>("tokens")` |
| 14 collapsible cards in Tokens | T5 KIND_ORDER × `TokenKindCard` |
| Per-kind count + dirty marker | T2 `count` + `isDirty` props on `TokenKindCard` |
| Beginner mode mutes empty foundation kinds to bottom | T5 `ordered` `useMemo` reorder |
| Pro mode shows token IDs + CSS variables inline | T3 `isPro && metaStyle` block in `GenericTokenList` |
| StylesSection placeholder | T4 stub |
| ComponentsSection summary + button | T4 stub (button copy says "Use the Components rail tab") |
| ExportSection placeholder | T4 stub |
| Persist open/close per kind | T2 `localStorage.setItem(STORAGE_PREFIX + kindId, ...)` |
| Aggregate dirty/apply/discard across 14 registries | T6 `allRegistries` + `dirtyCount` + `handleApply`/`handleDiscard` |
| `DesignTokenRecord["category"]` accepts new kinds' categories | T1 union extension to add `"theme"` |

**2. Placeholder scan:** No `TBD` / "appropriate error handling" / "similar to" left in the plan. Every code block is complete.

**3. Type consistency:** `KindRegistryLike` defined once in T6 and used everywhere. `TokenKindCard` props identical between T2 (definition), T5 (TokensSection), and T6 callers. `GenericTokenList` props identical between T3 and T5.

**4. Deviations from spec, documented:**
- Spec §5.1 wants 11 separate `RadiusTokenList.tsx` ... `ImageryTokenList.tsx` files. Plan ships one parametrized `GenericTokenList.tsx`. Documented in T3.
- Spec §5.1 also moves existing `colors/`, `type/`, `spacing/` into a `tokens/` subfolder. Plan keeps existing dirs; only new `tokens/GenericTokenList.tsx` + new `sections/` are created. Less risk, no behavioral diff. Documented in File Structure table.
- Spec §6.3 (Components panel dual-section) is **not** in scope; this phase only changes the Design tab.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-10-ds-ui-tier2-s1-tokens-section.md`. Two execution options:

**1. Subagent-Driven** — fresh subagent per task, review between tasks, fast iteration. Good if you want T1–T8 to each get an independent sanity check.

**2. Inline Execution (recommended)** — execute T1–T8 in this session using `superpowers:executing-plans`, batched with checkpoints after T2 (type extension landed), T5 (TokensSection orchestrator landed), and T6 (DesignSystemTab restructure landed). Past DS phases all shipped inline; pattern works and avoids subagent context churn.

**Which approach?**
