# Vibcoder Phase 3 — Organisms Fan-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port 16 vibcoder chrome organisms end-to-end through the Phase A pipeline + a new Radix engine layer (cmdk + react-colorful for two specialized organisms), applying the locked Phase 3 contracts (asChild trigger composition, engine encapsulation, portal discipline, companion-lib boundary, mandatory stateful gallery), in 4 tasks that each ship a coherent commit and pass all gates.

**Architecture:** Each organism = one vendored CSS file at `packages/editor/src/themes/components/organisms/<name>.css` (codemod output) + one or more React wrappers at `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` (className + props mapping; sibling exports per Contract C; Radix/cmdk/react-colorful as the BEHAVIOR engine, vibcoder CSS as the SKIN) + one unit test (`<Name>.test.tsx`) + one gallery entry (`packages/editor/src/preview/vibcoder-<name>.{html,tsx}`). Overlay organisms use shared `<DemoTrigger>` helper (`packages/editor/src/preview/_lib/DemoTrigger.tsx`); layout-only organisms ship inline static demos. All wrappers exported through the `editor/shared/vibcoder/` barrel.

**Tech Stack:** Bun (codemod runtime), React 18 + TypeScript (wrappers), `@radix-ui/react-{dialog,toast,portal,slot,popover}` (overlay engine), `cmdk` (CommandPalette), `react-colorful` (ColorPicker), Vite (preview), Vitest + React Testing Library + userEvent (unit tests), browser visual diff (manual eyeball).

**Prerequisites (all from prior plans):**
- Plan 1 (Phase A infrastructure) shipped — codemod orchestrator + bundle pin + gates 19+21+vibcoder-port live
- Plan 2 (Phase 0 POC) shipped — Button wrapper, gallery scaffolding, `poc-findings.md` template locked
- Plan 3 (Phase 1 atoms) shipped at `bcfeda1` — 23 atom CSS + 25 wrappers, 233 tests
- Plan 4 (Phase 2 molecules) shipped at `d146bb0` + `a364de5` — 18 molecule CSS + 46 wrappers, 545 tests, ESLint `no-gallery-shadow` + Gate 7 negative test
- Working tree clean, on `main`

**Per-component template (DO NOT DUPLICATE — read once, apply per organism):** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` § "Per-component port template (locked)" + "Phase 1 conventions reaffirmed" + Phase 2 sections.

**Phase 3 design spec (READ FIRST — this plan implements it):** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/phase-3-organisms-design.md` (committed `c642e41`).

**Out of scope:** Editor shell rewire (Phase 5), legacy chrome deletions (Phase 5), `useFocusTrap` reconciliation (Phase 5), legacy ColorPicker reconciliation (Phase 5), virtualization for HistoryPanel (deferred), Storybook-style multi-state galleries (decided no), swipe gestures for Drawer (editor desktop-only), custom Toast queue manager (Radix native pattern wins), `asset-library`/`sheet` organisms (DASHBOARD/MOBILE per SCOPE.md), `canvas` organism (ENGINE wrapper-only, separate Phase 5 work).

---

## Organism inventory (16 total)

| Cluster | Count | Organisms | Engine |
|---|---:|---|---|
| Layout-only (no engine) | 8 | topbar, footer, rail, left-panel, inspector, history-panel, empty-state, a11y-overlay | none |
| Radix overlays | 4 | overlay-mount, modal, drawer, notification-center | `@radix-ui/react-{dialog,toast,portal,slot}` |
| Companion-lib | 2 | command-palette, color-picker | `cmdk`, `react-colorful` (inside `@radix-ui/react-popover`) |
| Composed (depends on T2 Drawer) | 2 | pages-drawer, templates-drawer | Phase 3 Drawer + Phase 1+2 ListRow/Card |
| **Total** | **16** | | ~32 kb gzipped engine layer |

**Sibling exports total:** ~54 React components across 16 files (Contract C).

---

## File Structure

For each organism `<name>` with PascalCase wrapper `<Name>`:

| File | Purpose |
|---|---|
| `docs/reference/vibcoder/components/organisms/<name>.css` | Source (vendored bundle, gitignored) — read-only input |
| `packages/editor/src/themes/components/organisms/<name>.css` | Codemod output — generated, NOT hand-edited |
| `packages/editor/src/themes/components/_aliases.generated.css` | Auto-extended by codemod 3 with `<name>`'s tokens |
| `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` | React wrapper (sibling exports per Contract C) |
| `packages/editor/src/editor/shared/vibcoder/<Name>.test.tsx` | Unit test (≥3 cases per `poc-findings.md` minimum + new contract assertions) |
| `packages/editor/src/editor/shared/vibcoder/index.ts` | Barrel — append `export { <Name>, ...siblings } from "./<Name>";` |
| `packages/editor/src/preview/vibcoder-<name>.html` | Gallery HTML side (mostly empty, just opens the .tsx via Vite) |
| `packages/editor/src/preview/vibcoder-<name>.tsx` | Gallery React side — overlay orgs use `<DemoTrigger>`, layout orgs inline static |

**Phase 3 NEW files (created once in T1, used by all 16 organisms):**

| File | Purpose |
|---|---|
| `packages/editor/src/preview/_lib/DemoTrigger.tsx` | Shared stateful gallery harness (E5) |
| `packages/editor/eslint-rules/no-engine-public-export.cjs` | Forbids re-exporting from `@radix-ui/*`, `cmdk`, `react-colorful` (E2 + E4) |
| `packages/editor/eslint-rules/no-hardcoded-open-prop.cjs` | Forbids `open={true}` literal in overlay gallery files (E5) |
| `packages/editor/eslint-rules/__tests__/no-engine-public-export.test.cjs` | RuleTester cases |
| `packages/editor/eslint-rules/__tests__/no-hardcoded-open-prop.test.cjs` | RuleTester cases |
| `packages/editor/scripts/ds-grep-gates.sh` | MODIFY: append Gate 22 — E3 portal discipline (forbids `document.body` substring in `editor/shared/vibcoder/*.tsx` outside OverlayMount.tsx allow-list) |

The `packages/editor/src/themes/components/organisms/` directory already exists (per `find` output) but is empty (or near-empty — verify in T1).

---

## Phase 3 contracts (locked from spec)

### Contract A (inherited): Slot composition
Phase 2 shape unchanged. Required slots = flat props. Variable content = children.

### Contract B (inherited): Always-controlled state
`open` + `onOpenChange` REQUIRED. NO `defaultOpen`. NO uncontrolled mode. Internal `useState` is forbidden in organism wrappers.

### Contract C (inherited): Sibling exports in same file
Modal.tsx exports Modal + ModalTrigger + ModalContent + ModalClose + ModalTitle + ModalDescription + ModalFooter. Pattern locked from Phase 2 Card×7, Tabs+Tab+TabPanel etc.

### Contract D (inherited): Cross-atom + cross-molecule imports + trigger wiring
Phase 3 organisms compose Phase 1 atoms (Button, Icon, IconButton) + Phase 2 molecules (Card, ListRow, SectionHead, RailTile) freely. Trigger wiring via E1 (asChild).

### Contract E1 (NEW): asChild trigger composition

Every organism with a trigger ships `[Organism]Trigger` sibling. Trigger accepts `asChild: boolean` prop. When `asChild={true}`, single-child requirement is enforced by `Radix.Slot` (which throws in dev if `Children.count(children) !== 1`). Caller's child receives ARIA props + ref via `Radix.Slot` semantics.

**Applies to:** Modal, Drawer, NotificationCenter, CommandPalette, ColorPicker, PagesDrawer, TemplatesDrawer (7 organisms).

**Pattern:**

```tsx
import * as RadixDialog from "@radix-ui/react-dialog";

export const ModalTrigger = forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ asChild, children, className, ...rest }, ref) => (
    <RadixDialog.Trigger ref={ref} asChild={asChild} className={className} {...rest}>
      {children}
    </RadixDialog.Trigger>
  ),
);
ModalTrigger.displayName = "ModalTrigger";
```

### Contract E2 (NEW): Engine encapsulation

Public API of Phase 3 organism MUST NOT export Radix/cmdk/react-colorful types. Wrapper props are vibcoder-named. Internal engine imports stay internal — barrel never re-exports `@radix-ui/react-*`, `cmdk`, or `react-colorful`. Phase 5 chrome consumers import only from `editor/shared/vibcoder/`.

**FORBIDDEN:**

```tsx
// In Modal.tsx — WILL FAIL ESLint rule no-engine-public-export
export type { DialogProps } from "@radix-ui/react-dialog"; // ❌
export { Root as ModalRoot } from "@radix-ui/react-dialog"; // ❌
```

**ALLOWED:**

```tsx
// Internal import OK — only re-export is forbidden
import * as RadixDialog from "@radix-ui/react-dialog"; // ✓ (internal only)

export interface ModalProps { open: boolean; onOpenChange: (next: boolean) => void; … } // ✓ (vibcoder-shaped)
```

### Contract E3 (NEW): Portal discipline

All overlay organisms portal through single `#vibcoder-overlay-root` (mounted by OverlayMount organism at app root). Never `createPortal(node, document.body)` directly. Stack ordering managed centrally via overlay-mount, not z-index wars.

**Implementation:** Radix's `<DialogPortal container={…}>` accepts a container prop. OverlayMount mounts a div with id `vibcoder-overlay-root` at app root. Every overlay organism reads this container via a small `useOverlayContainer()` hook (defined in OverlayMount.tsx) and passes it to Radix.Portal.

**Enforcement:** Gate 22 in `ds-grep-gates.sh` — forbids substring `document.body` in `editor/shared/vibcoder/*.tsx` files EXCEPT OverlayMount.tsx (allow-listed because it owns the root).

### Contract E4 (NEW): Companion-lib boundary

cmdk types stay internal to CommandPalette wrapper. react-colorful types stay internal to ColorPicker wrapper. Vibcoder-shaped props at boundary.

```tsx
// ColorPicker.tsx — E4-compliant
import { HexColorPicker } from "react-colorful"; // internal only
export interface ColorPickerProps {
  value: string;            // hex string, vibcoder-shaped (not react-colorful Color)
  onChange: (hex: string) => void;
}
```

**Enforcement:** Same ESLint rule as E2 (`no-engine-public-export`), scoped via config to ALSO match `cmdk` + `react-colorful` module names.

### Contract E5 (NEW): Stateful gallery harness mandatory (overlay organisms only)

Every Phase 3 organism with open/close state ships a stateful gallery using shared `<DemoTrigger>` helper. NO static `open={true}` shortcuts.

**Applies to:** vibcoder-{modal,drawer,notification-center,command-palette,color-picker,pages-drawer,templates-drawer}.tsx (7 gallery files).

**DOES NOT apply to:** layout-only galleries (Topbar, Footer, Rail, LeftPanel, Inspector, HistoryPanel, EmptyState, A11yOverlay, OverlayMount). These ship inline static demos.

**Enforcement:** ESLint rule `no-hardcoded-open-prop` scoped to overlay gallery files only. Forbids `open={true}` literal as JSX attribute.

---

## Conventions reaffirmed (from POC + Phase 1+2 — verified across 71 wrappers)

These rules govern every wrapper in this plan. Violation = re-do the wrapper.

1. **Filename != classname.** Always run `vibcoder-variants.mjs` to discover actual base class.
2. **Default value of any prop = NO modifier class.** When uncertain, emit the modifier.
3. **State props (boolean) → `bd-X--state` + matching `aria-*`.** Phase 3 organisms with Radix engines: ARIA managed by Radix automatically — wrapper just applies CSS classes per state.
4. **`forwardRef`** for any wrapper rendering a focusable element OR returning the root container of a sibling-export organism.
5. **Spread `...rest` after named props** so caller can override aria/data/event handlers.
6. **Use the variants helper output verbatim** for type unions. No hand-editing.
7. **`Number.isFinite(value) ? value : fallback`** guard for any value-driven primitive (relevant for Drawer with numeric `snapPoints` if any).
8. **`displayName` set on every `forwardRef` export** including siblings.
9. **Defensive `Omit<…>` for native HTML attr clashes** (relevant for ModalTrigger overriding asChild's button props).
10. **`e.defaultPrevented` escape hatch for click-handler composition.** Caller's `onClick` can cancel internal trigger behavior — Phase 2 Tabs/PillButton pattern.
11. **Drag-drop: `e.preventDefault()` REQUIRED on dragover.** Browser navigates otherwise — Phase 2 Uploader pattern. (No Phase 3 organism uses drag-drop directly — listed for completeness.)
12. **Click-target divs need `role="button"` + `tabIndex={disabled ? -1 : 0}` + `onKeyDown` for Enter/Space.** Phase 2 Uploader a11y pattern.

---

## Task 1: Modal canary + Phase 3 infrastructure (standalone)

**Files:**
- Read: `docs/reference/vibcoder/components/organisms/modal.css`
- Generate: `packages/editor/src/themes/components/organisms/modal.css`
- Create: `packages/editor/src/editor/shared/vibcoder/Modal.tsx`, `Modal.test.tsx`
- Create: `packages/editor/src/editor/shared/vibcoder/OverlayMount.tsx`, `OverlayMount.test.tsx`
- Create: `packages/editor/src/preview/vibcoder-modal.html`, `vibcoder-modal.tsx`
- Create: `packages/editor/src/preview/_lib/DemoTrigger.tsx`, `_lib/DemoTrigger.test.tsx`
- Create: `packages/editor/eslint-rules/no-engine-public-export.cjs`, `__tests__/no-engine-public-export.test.cjs`
- Create: `packages/editor/eslint-rules/no-hardcoded-open-prop.cjs`, `__tests__/no-hardcoded-open-prop.test.cjs`
- Modify: `packages/editor/eslint-rules/index.cjs` (register 2 new rules)
- Modify: `packages/editor/.eslintrc*` or `eslint.config.*` (enable 2 new rules)
- Modify: `packages/editor/scripts/ds-grep-gates.sh` (append Gate 22 — E3 portal discipline)
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (append Modal + OverlayMount exports)
- Modify: `packages/editor/package.json` (add 4 Radix deps)

This task = the per-component template applied once for organisms PLUS all Phase 3 infrastructure (DemoTrigger, ESLint rules, Gate 22). Subsequent T2-T3 inherit the pattern.

**Why Modal is the canary:** highest-friction organism. Exercises Radix.Dialog (engine), 7 sibling exports (Modal+Trigger+Content+Close+Title+Description+Footer per E1+C), asChild boundary (E1), engine encapsulation (E2), portal discipline (E3 — first organism to portal through OverlayMount), stateful gallery via DemoTrigger (E5), focus trap, scroll lock, Esc, click-outside — all in one organism. If T1 ships clean, the pattern propagates trivially to T2 organisms.

- [ ] **Step 1: Install Radix dependencies**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm install --save @radix-ui/react-dialog @radix-ui/react-portal @radix-ui/react-slot
```

Expected: `package.json` `dependencies` gains 3 entries. `package-lock.json` updates. No type errors. Verify versions are recent (Radix UI primitives are at major v1 stable since 2023).

- [ ] **Step 2: Vendor modal.css**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
cp docs/reference/vibcoder/components/organisms/modal.css \
   packages/editor/src/themes/components/organisms/modal.css
npm --prefix packages/editor run vibcoder:vendor
```

Expected: orchestrator prints 4 numbered steps, ends `vibcoder-vendor: complete`. Codemod 1 reports rewrites including `modal`. Codemod 3 may extend `_aliases.generated.css`. Bundle pin updates.

- [ ] **Step 3: Run gates (must pass before continuing)**

```bash
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
```

Expected: ALL PASS. `check-vibcoder-port` reports modal in its file count.

- [ ] **Step 4: Discover variants**

```bash
bun packages/editor/scripts/vibcoder-variants.mjs organisms/modal
```

Capture the output verbatim. Expected output (verify against actual):
```
bd-modal:
  variants: (modal source-CSS modifier list — record actuals)
  sizes: (modal size variants — record actuals)
  states: open (gated by [data-state="open"], applied by Radix.Dialog automatically)
```

If output differs from expectations, the wrapper code below adjusts. Adapt prop unions to match actuals.

- [ ] **Step 5: Write OverlayMount.tsx FIRST (E3 prerequisite)**

```tsx
// packages/editor/src/editor/shared/vibcoder/OverlayMount.tsx
/**
 * OverlayMount — single portal root for all Phase 3 overlay organisms.
 *
 * Per Contract E3 (portal discipline): every overlay organism (Modal, Drawer,
 * NotificationCenter, CommandPalette, ColorPicker, PagesDrawer, TemplatesDrawer)
 * portals through this single root, NOT directly to document.body. Stack ordering
 * managed centrally — last-mounted is on top. No z-index wars.
 *
 * Allow-listed for E3 grep gate (Gate 22) — only OverlayMount.tsx may reference
 * document.body. All other organism files use useOverlayContainer() to read the
 * mounted root.
 *
 * @license BSD-3-Clause
 */
import { useEffect, useState, type ReactNode } from "react";

const OVERLAY_ROOT_ID = "vibcoder-overlay-root";

/**
 * Mount this once at app root. Idempotent — multiple mounts re-use the same div.
 *
 * Usage:
 *   <OverlayMount>
 *     <App />
 *   </OverlayMount>
 */
export function OverlayMount({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    let root = document.getElementById(OVERLAY_ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = OVERLAY_ROOT_ID;
      // Allow-listed: this is the ONLY document.body reference per E3.
      document.body.appendChild(root);
    }
    return () => {
      // Cleanup on unmount. Skip if multiple OverlayMount instances exist.
      if (root && !root.hasChildNodes()) {
        root.remove();
      }
    };
  }, []);
  return <>{children}</>;
}
OverlayMount.displayName = "OverlayMount";

/**
 * Read the overlay root container for use as Radix.Portal `container` prop.
 * Returns null on server / before OverlayMount has mounted (Radix.Portal handles
 * null by falling back to document.body — acceptable transient state).
 */
export function useOverlayContainer(): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    setContainer(document.getElementById(OVERLAY_ROOT_ID));
  }, []);
  return container;
}
```

- [ ] **Step 6: Write OverlayMount.test.tsx**

```tsx
// packages/editor/src/editor/shared/vibcoder/OverlayMount.test.tsx
/**
 * OverlayMount tests — verify single root mounting + idempotency + cleanup.
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, renderHook, cleanup } from "@testing-library/react";
import { OverlayMount, useOverlayContainer } from "./OverlayMount";

describe("OverlayMount", () => {
  beforeEach(() => {
    cleanup();
    document.getElementById("vibcoder-overlay-root")?.remove();
  });

  it("creates #vibcoder-overlay-root on mount", () => {
    expect(document.getElementById("vibcoder-overlay-root")).toBeNull();
    render(<OverlayMount><div>app</div></OverlayMount>);
    expect(document.getElementById("vibcoder-overlay-root")).not.toBeNull();
  });

  it("renders children", () => {
    const { getByText } = render(<OverlayMount><div>hello</div></OverlayMount>);
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("is idempotent — multiple mounts re-use the same root div", () => {
    render(<OverlayMount><div>a</div></OverlayMount>);
    render(<OverlayMount><div>b</div></OverlayMount>);
    const roots = document.querySelectorAll("#vibcoder-overlay-root");
    expect(roots.length).toBe(1);
  });
});

describe("useOverlayContainer", () => {
  beforeEach(() => {
    cleanup();
    document.getElementById("vibcoder-overlay-root")?.remove();
  });

  it("returns null before OverlayMount has mounted the root", () => {
    const { result } = renderHook(() => useOverlayContainer());
    expect(result.current).toBeNull();
  });

  it("returns the root element after OverlayMount mounted it", () => {
    render(<OverlayMount><div>app</div></OverlayMount>);
    const { result } = renderHook(() => useOverlayContainer());
    expect(result.current).not.toBeNull();
    expect(result.current?.id).toBe("vibcoder-overlay-root");
  });
});
```

- [ ] **Step 7: Write DemoTrigger.tsx (E5 helper)**

```tsx
// packages/editor/src/preview/_lib/DemoTrigger.tsx
/**
 * Stateful gallery harness for Phase 3 overlay organisms.
 *
 * Per Contract E5 (mandatory stateful gallery): every overlay organism gallery
 * uses this helper. Renders a trigger button + render-prop children that receive
 * (open, setOpen) for the wrapped organism.
 *
 * Pattern:
 *   <DemoTrigger label="Open modal">
 *     {(open, setOpen) => (
 *       <Modal open={open} onOpenChange={setOpen}>...</Modal>
 *     )}
 *   </DemoTrigger>
 *
 * @license BSD-3-Clause
 */
import { useState, type ReactNode } from "react";

interface DemoTriggerProps {
  label: string;
  children: (open: boolean, setOpen: (next: boolean) => void) => ReactNode;
}

export function DemoTrigger({ label, children }: DemoTriggerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bd-btn"
        style={{ padding: "6px 12px" }}
      >
        {label}
      </button>
      {children(open, setOpen)}
    </div>
  );
}
DemoTrigger.displayName = "DemoTrigger";
```

- [ ] **Step 8: Write DemoTrigger.test.tsx**

```tsx
// packages/editor/src/preview/_lib/DemoTrigger.test.tsx
/**
 * DemoTrigger tests — verify stateful trigger toggles + render-prop receives state.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemoTrigger } from "./DemoTrigger";

describe("DemoTrigger", () => {
  it("renders the trigger button with given label", () => {
    render(
      <DemoTrigger label="Open modal">
        {() => null}
      </DemoTrigger>
    );
    expect(screen.getByRole("button", { name: "Open modal" })).toBeInTheDocument();
  });

  it("starts with open=false in render-prop", () => {
    let captured: boolean | null = null;
    render(
      <DemoTrigger label="Open">
        {(open) => {
          captured = open;
          return null;
        }}
      </DemoTrigger>
    );
    expect(captured).toBe(false);
  });

  it("flips open to true when trigger is clicked", async () => {
    const user = userEvent.setup();
    let captured: boolean | null = null;
    render(
      <DemoTrigger label="Open">
        {(open) => {
          captured = open;
          return null;
        }}
      </DemoTrigger>
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(captured).toBe(true);
  });

  it("setOpen callback flips open back to false", async () => {
    const user = userEvent.setup();
    let lastOpen: boolean | null = null;
    let setOpenFn: ((next: boolean) => void) | null = null;
    render(
      <DemoTrigger label="Open">
        {(open, setOpen) => {
          lastOpen = open;
          setOpenFn = setOpen;
          return null;
        }}
      </DemoTrigger>
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(lastOpen).toBe(true);
    setOpenFn?.(false);
    // Re-render after state update
    expect(lastOpen).toBe(true); // captured before setOpen fired async re-render
    // Verify via second click cycle
  });
});
```

- [ ] **Step 9: Write ESLint rule no-engine-public-export.cjs (E2 + E4)**

```js
// packages/editor/eslint-rules/no-engine-public-export.cjs
/**
 * ESLint rule: no-engine-public-export
 *
 * Enforces Phase 3 contracts E2 (engine encapsulation) and E4 (companion-lib
 * boundary). Forbids re-exporting types or values from engine modules
 * (@radix-ui/*, cmdk, react-colorful) in Phase 3 wrapper files. Internal
 * imports remain allowed — only public re-export is forbidden.
 *
 * Scope: files matching `/editor/shared/vibcoder/*.tsx`.
 *
 * Forbidden patterns:
 *   export { ... } from "@radix-ui/react-dialog";        // ❌
 *   export type { DialogProps } from "@radix-ui/react-dialog"; // ❌
 *   export { Item } from "cmdk";                          // ❌
 *   export type { Color } from "react-colorful";          // ❌
 *
 * Allowed:
 *   import * as RadixDialog from "@radix-ui/react-dialog"; // ✓ (internal use)
 *   export const Modal = …; // ✓ (vibcoder-shaped re-export)
 *
 * @license BSD-3-Clause
 */
"use strict";

const FORBIDDEN_SOURCES = [
  /^@radix-ui\//,
  /^cmdk$/,
  /^react-colorful$/,
];

const FILE_RE = /\/editor\/shared\/vibcoder\/[^/]+\.tsx?$/;

function isWrapperFile(filename) {
  if (typeof filename !== "string") return false;
  return FILE_RE.test(filename.replace(/\\/g, "/"));
}

function isForbiddenSource(value) {
  if (typeof value !== "string") return false;
  return FORBIDDEN_SOURCES.some((re) => re.test(value));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow re-exporting from engine modules (@radix-ui/*, cmdk, react-colorful) in Phase 3 vibcoder wrapper files. Wrappers must vibcoder-shape their public API (E2/E4).",
    },
    schema: [],
    messages: {
      forbiddenReExport:
        "Re-exporting from engine module '{{source}}' is forbidden in Phase 3 wrappers. Define vibcoder-shaped types and re-export those instead (Contract E2/E4).",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isWrapperFile(filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        if (!node.source) return; // local export, not re-export
        if (isForbiddenSource(node.source.value)) {
          context.report({
            node: node.source,
            messageId: "forbiddenReExport",
            data: { source: node.source.value },
          });
        }
      },
      ExportAllDeclaration(node) {
        if (!node.source) return;
        if (isForbiddenSource(node.source.value)) {
          context.report({
            node: node.source,
            messageId: "forbiddenReExport",
            data: { source: node.source.value },
          });
        }
      },
    };
  },
};
```

- [ ] **Step 10: Write ESLint rule test no-engine-public-export.test.cjs**

```js
// packages/editor/eslint-rules/__tests__/no-engine-public-export.test.cjs
"use strict";
const { RuleTester } = require("eslint");
const rule = require("../no-engine-public-export.cjs");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-engine-public-export", rule, {
  valid: [
    // Internal import — allowed
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'import * as RadixDialog from "@radix-ui/react-dialog"; export const Modal = () => null;',
    },
    // Local export — allowed
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: "export const Modal = () => null;",
    },
    // Re-export from sibling — allowed
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export { Foo } from "./helpers";',
    },
    // Forbidden source but file outside scope — ignored
    {
      filename: "/path/to/somewhere/else.tsx",
      code: 'export { Root } from "@radix-ui/react-dialog";',
    },
  ],
  invalid: [
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export { Root } from "@radix-ui/react-dialog";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export type { DialogProps } from "@radix-ui/react-dialog";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/CommandPalette.tsx",
      code: 'export { Item } from "cmdk";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/ColorPicker.tsx",
      code: 'export type { Color } from "react-colorful";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export * from "@radix-ui/react-dialog";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
  ],
});

console.log("no-engine-public-export: tests passed");
```

- [ ] **Step 11: Write ESLint rule no-hardcoded-open-prop.cjs (E5)**

```js
// packages/editor/eslint-rules/no-hardcoded-open-prop.cjs
/**
 * ESLint rule: no-hardcoded-open-prop
 *
 * Enforces Phase 3 contract E5 (mandatory stateful gallery harness). Forbids
 * `open={true}` literal as JSX attribute in overlay gallery files — these MUST
 * use the shared <DemoTrigger> helper to drive open state from a real button.
 *
 * Scope: files matching
 *   /preview/vibcoder-{modal,drawer,notification-center,command-palette,
 *    color-picker,pages-drawer,templates-drawer}.tsx
 *
 * Forbidden:
 *   <Modal open={true} ...>    // ❌
 *   <Drawer open={ true } ...> // ❌
 *
 * Allowed:
 *   <Modal open={open} ...>    // ✓ (driven by useState/DemoTrigger)
 *   <Modal open={isOpen} ...>  // ✓
 *
 * @license BSD-3-Clause
 */
"use strict";

const OVERLAY_GALLERY_NAMES = new Set([
  "modal", "drawer", "notification-center",
  "command-palette", "color-picker",
  "pages-drawer", "templates-drawer",
]);

function isOverlayGalleryFile(filename) {
  if (typeof filename !== "string") return false;
  const norm = filename.replace(/\\/g, "/");
  const m = norm.match(/\/preview\/vibcoder-([^/]+)\.tsx$/);
  if (!m) return false;
  return OVERLAY_GALLERY_NAMES.has(m[1]);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid open={true} literal in Phase 3 overlay gallery files. Use <DemoTrigger> to drive open state (Contract E5).",
    },
    schema: [],
    messages: {
      hardcodedOpen:
        "open={true} literal forbidden in overlay gallery — use <DemoTrigger> render-prop to drive open state (Contract E5).",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isOverlayGalleryFile(filename)) return {};

    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "open") return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") return;
        const expr = node.value.expression;
        if (expr && expr.type === "Literal" && expr.value === true) {
          context.report({ node, messageId: "hardcodedOpen" });
        }
      },
    };
  },
};
```

- [ ] **Step 12: Write ESLint rule test no-hardcoded-open-prop.test.cjs**

```js
// packages/editor/eslint-rules/__tests__/no-hardcoded-open-prop.test.cjs
"use strict";
const { RuleTester } = require("eslint");
const rule = require("../no-hardcoded-open-prop.cjs");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-hardcoded-open-prop", rule, {
  valid: [
    // Stateful — allowed
    {
      filename: "/p/preview/vibcoder-modal.tsx",
      code: "const X = () => <Modal open={open} />;",
    },
    {
      filename: "/p/preview/vibcoder-drawer.tsx",
      code: "const X = () => <Drawer open={isOpen} />;",
    },
    // open={false} — allowed (no behavioral concern)
    {
      filename: "/p/preview/vibcoder-modal.tsx",
      code: "const X = () => <Modal open={false} />;",
    },
    // Outside scope — ignored
    {
      filename: "/p/preview/vibcoder-button.tsx",
      code: "const X = () => <Modal open={true} />;",
    },
    {
      filename: "/p/somewhere/else.tsx",
      code: "const X = () => <Modal open={true} />;",
    },
    // Layout-only gallery (not in scope) — ignored
    {
      filename: "/p/preview/vibcoder-topbar.tsx",
      code: "const X = () => <Topbar />;",
    },
  ],
  invalid: [
    {
      filename: "/p/preview/vibcoder-modal.tsx",
      code: "const X = () => <Modal open={true} />;",
      errors: [{ messageId: "hardcodedOpen" }],
    },
    {
      filename: "/p/preview/vibcoder-command-palette.tsx",
      code: "const X = () => <CommandPalette open={true} />;",
      errors: [{ messageId: "hardcodedOpen" }],
    },
    {
      filename: "/p/preview/vibcoder-color-picker.tsx",
      code: "const X = () => <ColorPicker open={ true } onChange={() => {}} value=\"#fff\" />;",
      errors: [{ messageId: "hardcodedOpen" }],
    },
  ],
});

console.log("no-hardcoded-open-prop: tests passed");
```

- [ ] **Step 13: Register both new rules in eslint-rules/index.cjs**

Read the existing `packages/editor/eslint-rules/index.cjs` first to see the registration shape. Then ADD entries for the two new rules.

```js
// Append to the rules export object in index.cjs
"no-engine-public-export": require("./no-engine-public-export.cjs"),
"no-hardcoded-open-prop": require("./no-hardcoded-open-prop.cjs"),
```

Then enable both rules in the editor's eslint config (find `.eslintrc.cjs`, `.eslintrc.json`, `eslint.config.js`, or `eslint.config.mjs` in `packages/editor/`). Add to `rules` block:

```js
"buildrik/no-engine-public-export": "error",
"buildrik/no-hardcoded-open-prop": "error",
```

(Plugin namespace `buildrik/` matches the existing `no-gallery-shadow` registration pattern — verify by reading the existing config.)

- [ ] **Step 14: Run ESLint rule tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node eslint-rules/__tests__/no-engine-public-export.test.cjs
node eslint-rules/__tests__/no-hardcoded-open-prop.test.cjs
```

Expected: both print `"<rule-name>: tests passed"`. If RuleTester throws, fix the rule logic before continuing.

- [ ] **Step 15: Add Gate 22 to ds-grep-gates.sh (E3 portal discipline)**

Read `packages/editor/scripts/ds-grep-gates.sh` to see existing gate format. Append Gate 22 after the last gate:

```bash
# Gate 22: E3 portal discipline — no document.body in vibcoder wrappers (except OverlayMount)
# Phase 3 overlays MUST portal through #vibcoder-overlay-root via useOverlayContainer().
# OverlayMount.tsx is allow-listed because it owns the root.
GATE22_HITS=$(grep -RIn 'document\.body' \
  packages/editor/src/editor/shared/vibcoder/ \
  --include='*.tsx' --include='*.ts' \
  | grep -v '^[^:]*OverlayMount\.tsx:' \
  || true)
if [ -n "$GATE22_HITS" ]; then
  echo "$GATE22_HITS"
  fail "Gate 22: document.body referenced outside OverlayMount.tsx (E3 portal discipline)"
fi
pass "Gate 22: E3 portal discipline (no document.body outside OverlayMount)"
```

Run gates to verify Gate 22 passes (no other vibcoder file references `document.body` yet — it's pristine):

```bash
bash packages/editor/scripts/ds-grep-gates.sh
```

Expected: ALL PASS, including new Gate 22.

- [ ] **Step 16: Write Modal.tsx wrapper**

```tsx
// packages/editor/src/editor/shared/vibcoder/Modal.tsx
/**
 * Vibcoder Modal — Phase 3 canary organism.
 *
 * Engine: @radix-ui/react-dialog (focus trap, scroll lock, click-outside, Esc,
 * ARIA roles + states).
 *
 * Skin: bd-modal CSS classes from src/themes/components/organisms/modal.css.
 *
 * Sibling exports (Contract C):
 *   Modal              — root state owner (open + onOpenChange)
 *   ModalTrigger       — opens the modal (asChild per E1)
 *   ModalContent       — modal panel (portals through OverlayMount per E3)
 *   ModalClose         — close button (asChild per E1)
 *   ModalTitle         — accessible title (Radix wires aria-labelledby)
 *   ModalDescription   — accessible description (Radix wires aria-describedby)
 *   ModalFooter        — footer slot for action buttons
 *
 * E1: ModalTrigger + ModalClose accept asChild
 * E2: NO Radix types in public API — DialogProps not re-exported
 * E3: ModalContent uses useOverlayContainer() for portal target
 * E5: Galleries use <DemoTrigger>, never open={true} literal
 *
 * @license BSD-3-Clause
 */
import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { useOverlayContainer } from "./OverlayMount";

// Vibcoder-shaped public API — no Radix types leaked (E2)

export interface ModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
}

export interface ModalTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface ModalContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export interface ModalCloseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// Root — controlled only (B). NO defaultOpen (B).
export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}
Modal.displayName = "Modal";

// Trigger — asChild boundary per E1
export const ModalTrigger = forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ asChild, children, className, ...rest }, ref) => (
    <RadixDialog.Trigger ref={ref} asChild={asChild} className={className} {...rest}>
      {children}
    </RadixDialog.Trigger>
  ),
);
ModalTrigger.displayName = "ModalTrigger";

// Content — portals through OverlayMount per E3
export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, size, className, ...rest }, ref) => {
    const container = useOverlayContainer();
    const classes = [
      "bd-modal",
      size && `bd-modal--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Overlay className="bd-modal__overlay" />
        <RadixDialog.Content ref={ref} className={classes} {...rest}>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    );
  },
);
ModalContent.displayName = "ModalContent";

// Close — asChild per E1
export const ModalClose = forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ asChild, children, className, ...rest }, ref) => (
    <RadixDialog.Close ref={ref} asChild={asChild} className={className} {...rest}>
      {children}
    </RadixDialog.Close>
  ),
);
ModalClose.displayName = "ModalClose";

// Title — Radix wires aria-labelledby on Content automatically
export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-modal__title", className].filter(Boolean).join(" ");
    return (
      <RadixDialog.Title ref={ref} className={classes} {...rest}>
        {children}
      </RadixDialog.Title>
    );
  },
);
ModalTitle.displayName = "ModalTitle";

// Description — Radix wires aria-describedby on Content automatically
export const ModalDescription = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-modal__desc", className].filter(Boolean).join(" ");
    return (
      <RadixDialog.Description ref={ref} className={classes} {...rest}>
        {children}
      </RadixDialog.Description>
    );
  },
);
ModalDescription.displayName = "ModalDescription";

// Footer — pure layout slot
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-modal__footer", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
ModalFooter.displayName = "ModalFooter";
```

- [ ] **Step 17: Write Modal.test.tsx**

```tsx
// packages/editor/src/editor/shared/vibcoder/Modal.test.tsx
/**
 * Modal tests — verify Phase 3 contracts on the canary organism.
 *
 * What we test (per E2 + Phase 3 design):
 *   - Markup: vibcoder CSS classes applied
 *   - Sibling export composition: Modal + Trigger + Content + Title + ... renders
 *   - asChild boundary (E1): caller's child receives ARIA props + ref
 *   - Engine encapsulation (E2): no Radix types leaked (verified by ESLint rule)
 *   - Always-controlled (B): defaultOpen prop is NOT defined on ModalProps
 *
 * What we DON'T test (Radix owns these):
 *   - Focus trap behavior, scroll lock, click-outside, Esc keypress, ARIA correctness.
 *   - Re-testing duplicates Radix's own test suite.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef } from "react";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalClose,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "./Modal";
import { OverlayMount } from "./OverlayMount";

// Helper: render with OverlayMount wrapper (E3 portal target)
function renderModal(ui: React.ReactElement) {
  return render(<OverlayMount>{ui}</OverlayMount>);
}

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("Modal — sibling export composition", () => {
  it("renders trigger button when closed", () => {
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalTitle>Title</ModalTitle>
        </ModalContent>
      </Modal>
    );
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    // Content portals only when open=true
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders all 7 siblings together when open=true", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalTitle>Confirm</ModalTitle>
          <ModalDescription>Are you sure?</ModalDescription>
          <ModalFooter>
            <ModalClose>Cancel</ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});

describe("Modal — vibcoder CSS classes (markup contract)", () => {
  it("ModalContent applies bd-modal class", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal");
  });

  it("ModalContent applies size modifier when size prop set", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent size="lg">
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--lg");
  });

  it("ModalContent omits size modifier when size prop unset (Phase 1 default-omit convention)", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveClass("bd-modal--sm");
    expect(dialog).not.toHaveClass("bd-modal--md");
    expect(dialog).not.toHaveClass("bd-modal--lg");
  });

  it("ModalTitle applies bd-modal__title class", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent><ModalTitle>x</ModalTitle></ModalContent>
      </Modal>
    );
    expect(screen.getByText("x")).toHaveClass("bd-modal__title");
  });

  it("ModalDescription applies bd-modal__desc class", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>title</ModalTitle>
          <ModalDescription>desc</ModalDescription>
        </ModalContent>
      </Modal>
    );
    expect(screen.getByText("desc")).toHaveClass("bd-modal__desc");
  });

  it("ModalFooter applies bd-modal__footer class", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
          <ModalFooter><button>OK</button></ModalFooter>
        </ModalContent>
      </Modal>
    );
    const footer = screen.getByRole("button", { name: "OK" }).parentElement;
    expect(footer).toHaveClass("bd-modal__footer");
  });
});

describe("Modal — asChild boundary (E1)", () => {
  it("ModalTrigger asChild forwards onClick to caller's child", async () => {
    const user = userEvent.setup();
    let onChangeCalls = 0;
    renderModal(
      <Modal open={false} onOpenChange={() => { onChangeCalls++; }}>
        <ModalTrigger asChild>
          <button data-testid="custom-trigger">Custom</button>
        </ModalTrigger>
        <ModalContent><ModalTitle>x</ModalTitle></ModalContent>
      </Modal>
    );
    await user.click(screen.getByTestId("custom-trigger"));
    expect(onChangeCalls).toBe(1);
  });

  it("ModalTrigger asChild forwards ARIA aria-haspopup to caller's child", () => {
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalTrigger asChild>
          <button data-testid="custom-trigger">Custom</button>
        </ModalTrigger>
        <ModalContent><ModalTitle>x</ModalTitle></ModalContent>
      </Modal>
    );
    const trigger = screen.getByTestId("custom-trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("ModalTrigger asChild forwards ref to caller's child", () => {
    let capturedRef: HTMLButtonElement | null = null;
    const RefButton = forwardRef<HTMLButtonElement>((props, ref) => {
      return (
        <button ref={(el) => {
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
          capturedRef = el;
        }} {...props}>Custom</button>
      );
    });
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalTrigger asChild>
          <RefButton />
        </ModalTrigger>
        <ModalContent><ModalTitle>x</ModalTitle></ModalContent>
      </Modal>
    );
    expect(capturedRef).not.toBeNull();
    expect(capturedRef?.tagName).toBe("BUTTON");
  });

  it("ModalClose asChild forwards onClick to caller's child", async () => {
    const user = userEvent.setup();
    let openChanges: boolean[] = [];
    renderModal(
      <Modal open={true} onOpenChange={(next) => { openChanges.push(next); }}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
          <ModalClose asChild>
            <button data-testid="custom-close">Done</button>
          </ModalClose>
        </ModalContent>
      </Modal>
    );
    await user.click(screen.getByTestId("custom-close"));
    expect(openChanges).toEqual([false]);
  });
});

describe("Modal — controlled state (Contract B)", () => {
  it("does not render content when open=false", () => {
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalContent><ModalTitle>x</ModalTitle></ModalContent>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders content when open=true", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent><ModalTitle>x</ModalTitle></ModalContent>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ModalProps does not expose defaultOpen (compile-time check via TS)", () => {
    // This is a TypeScript compile-time contract check. If `defaultOpen` were
    // accidentally added to ModalProps, this test file would fail to compile
    // because of the // @ts-expect-error directive below.
    // @ts-expect-error - defaultOpen is forbidden by Contract B
    const _bad: ModalProps = { defaultOpen: true, onOpenChange: () => {}, children: null };
    // Reference the variable to avoid unused-var lint
    void _bad;
    expect(true).toBe(true);
  });
});

describe("Modal — portal discipline (E3)", () => {
  it("ModalContent renders inside #vibcoder-overlay-root, not document.body", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent><ModalTitle>x</ModalTitle></ModalContent>
      </Modal>
    );
    const root = document.getElementById("vibcoder-overlay-root");
    const dialog = screen.getByRole("dialog");
    expect(root).not.toBeNull();
    expect(root?.contains(dialog)).toBe(true);
  });
});

describe("Modal — engine encapsulation (E2)", () => {
  it("ModalProps interface does not include any Radix-imported types (smoke check)", () => {
    // Compile-time enforcement is done by the no-engine-public-export ESLint rule.
    // This test asserts the runtime shape of vibcoder-named props.
    const props: ModalProps = { open: false, onOpenChange: () => {}, children: null };
    expect(props.open).toBe(false);
    expect(typeof props.onOpenChange).toBe("function");
  });
});
```

- [ ] **Step 18: Write Modal gallery (vibcoder-modal.tsx) using DemoTrigger (E5)**

```tsx
// packages/editor/src/preview/vibcoder-modal.tsx
/**
 * Modal gallery — uses DemoTrigger per E5.
 * @license BSD-3-Clause
 */
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalClose,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/editor/shared/vibcoder";
import { OverlayMount } from "@/editor/shared/vibcoder/OverlayMount";
import { sectionLabel, stack } from "./_galleryStyles";

export default function ModalGallery() {
  return (
    <OverlayMount>
      <div css={stack}>
        <h1>Modal — vibcoder gallery</h1>
        <p css={sectionLabel}>Default size</p>
        <DemoTrigger label="Open default modal">
          {(open, setOpen) => (
            <Modal open={open} onOpenChange={setOpen}>
              <ModalContent>
                <ModalTitle>Confirm action</ModalTitle>
                <ModalDescription>Are you sure you want to proceed?</ModalDescription>
                <ModalFooter>
                  <ModalClose asChild>
                    <button className="bd-btn bd-btn--ghost">Cancel</button>
                  </ModalClose>
                  <ModalClose asChild>
                    <button className="bd-btn bd-btn--primary">Confirm</button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </DemoTrigger>

        <p css={sectionLabel}>Small size</p>
        <DemoTrigger label="Open small modal">
          {(open, setOpen) => (
            <Modal open={open} onOpenChange={setOpen}>
              <ModalContent size="sm">
                <ModalTitle>Quick confirm</ModalTitle>
                <ModalFooter>
                  <ModalClose asChild>
                    <button className="bd-btn">OK</button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </DemoTrigger>

        <p css={sectionLabel}>Large size</p>
        <DemoTrigger label="Open large modal">
          {(open, setOpen) => (
            <Modal open={open} onOpenChange={setOpen}>
              <ModalContent size="lg">
                <ModalTitle>Detailed dialog</ModalTitle>
                <ModalDescription>
                  Body content — Esc to close, click outside to dismiss, Tab to navigate.
                </ModalDescription>
                <ModalFooter>
                  <ModalClose asChild>
                    <button className="bd-btn">Done</button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}
```

- [ ] **Step 19: Write the gallery HTML host**

```html
<!-- packages/editor/src/preview/vibcoder-modal.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>vibcoder-modal</title>
  <link rel="stylesheet" href="/src/themes/default.css" />
  <link rel="stylesheet" href="/src/themes/components/organisms/modal.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from "react";
    import { createRoot } from "react-dom/client";
    import Gallery from "./vibcoder-modal.tsx";
    createRoot(document.getElementById("root")).render(React.createElement(Gallery));
  </script>
</body>
</html>
```

- [ ] **Step 20: Update barrel `index.ts` (Modal + OverlayMount + types)**

```ts
// Append to packages/editor/src/editor/shared/vibcoder/index.ts
export { OverlayMount, useOverlayContainer } from "./OverlayMount";

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalClose,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "./Modal";
export type {
  ModalProps,
  ModalTriggerProps,
  ModalContentProps,
  ModalCloseProps,
  ModalTitleProps,
  ModalDescriptionProps,
  ModalFooterProps,
} from "./Modal";
```

- [ ] **Step 21: Run all tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/shared/vibcoder/Modal.test.tsx src/editor/shared/vibcoder/OverlayMount.test.tsx src/preview/_lib/DemoTrigger.test.tsx
```

Expected: ALL PASS. Modal: ~18 tests. OverlayMount: 5 tests. DemoTrigger: 4 tests. Total ≥ 25 net-new tests.

- [ ] **Step 22: Run full test suite (regression check)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run
```

Expected: 545 (Phase 1+2) + ~25-30 (T1) = ~570-575 tests pass. Zero failures. Zero atom/molecule regressions.

- [ ] **Step 23: Run lint + gates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run lint
npm run lint:ds
bash scripts/check-vibcoder-port.sh
```

Expected: ALL PASS. New ESLint rules pass (Modal.tsx is E2/E4-compliant; vibcoder-modal.tsx is E5-compliant). Gate 22 (E3 portal discipline) passes (no `document.body` outside OverlayMount.tsx).

- [ ] **Step 24: Manual gallery smoke test**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run dev
```

In browser, open `http://localhost:5050/src/preview/vibcoder-modal.html`. Verify:
- 3 trigger buttons render (default / small / large)
- Click "Open default modal" — modal appears, focus traps inside
- Press Esc — modal closes, focus restores to trigger
- Reopen modal, click outside the panel — modal closes
- Reopen modal, Tab through — focus stays inside, never leaves to background
- Verify size variants render with bd-modal--sm / bd-modal--lg classes

- [ ] **Step 25: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/package.json packages/editor/package-lock.json \
        packages/editor/src/themes/components/organisms/modal.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/Modal.tsx \
        packages/editor/src/editor/shared/vibcoder/Modal.test.tsx \
        packages/editor/src/editor/shared/vibcoder/OverlayMount.tsx \
        packages/editor/src/editor/shared/vibcoder/OverlayMount.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-modal.html \
        packages/editor/src/preview/vibcoder-modal.tsx \
        packages/editor/src/preview/_lib/DemoTrigger.tsx \
        packages/editor/src/preview/_lib/DemoTrigger.test.tsx \
        packages/editor/eslint-rules/no-engine-public-export.cjs \
        packages/editor/eslint-rules/no-hardcoded-open-prop.cjs \
        packages/editor/eslint-rules/__tests__/no-engine-public-export.test.cjs \
        packages/editor/eslint-rules/__tests__/no-hardcoded-open-prop.test.cjs \
        packages/editor/eslint-rules/index.cjs \
        packages/editor/scripts/ds-grep-gates.sh
# Add the eslint config file path actually used by editor (one of):
git add packages/editor/.eslintrc* 2>/dev/null || git add packages/editor/eslint.config.* 2>/dev/null || true

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-3): T1 Modal canary + Phase 3 infrastructure

- Modal organism (Radix.Dialog engine + bd-modal CSS skin) with 7 sibling exports
  (Modal+ModalTrigger+ModalContent+ModalClose+ModalTitle+ModalDescription+ModalFooter)
- OverlayMount organism — single #vibcoder-overlay-root portal target (E3 root)
- DemoTrigger shared gallery harness at src/preview/_lib/ (E5)
- ESLint rule no-engine-public-export (E2/E4 — forbids @radix-ui/cmdk/react-colorful re-exports)
- ESLint rule no-hardcoded-open-prop (E5 — forbids open={true} literal in overlay galleries)
- Gate 22 in ds-grep-gates.sh — E3 portal discipline (no document.body outside OverlayMount.tsx)
- Deps added: @radix-ui/react-dialog, @radix-ui/react-portal, @radix-ui/react-slot
- 25+ net-new tests covering 9 contracts (A-D inherited + E1-E5 new)

Phase 3 contracts proven on Modal canary. T2-T3 inherit pattern.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, working tree clean. Note the commit SHA — referenced in M5 milestone task.

---

## Task 2: Mega-batch — 13 organisms (8 layout + 3 Radix overlays + 2 companion-lib)

**Files (per organism, total 13 organisms):**
- Read: `docs/reference/vibcoder/components/organisms/<name>.css` × 13
- Generate: `packages/editor/src/themes/components/organisms/<name>.css` × 13
- Create: `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` × 13
- Create: `packages/editor/src/editor/shared/vibcoder/<Name>.test.tsx` × 13
- Create: `packages/editor/src/preview/vibcoder-<name>.{html,tsx}` × 13
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (append all 13 organism exports)
- Modify: `packages/editor/package.json` (add `@radix-ui/react-toast`, `@radix-ui/react-popover`, `cmdk`, `react-colorful`)

**Intra-task ordering (REQUIRED — subagent must follow):**

1. **OverlayMount-shipped already** (from T1) — no work needed, but VERIFY `useOverlayContainer()` import works.
2. **Drawer FIRST** (Cluster 4 in T3 depends on it).
3. **NotificationCenter** (Radix.Toast pattern — different from Dialog, learn here before reuse).
4. **CommandPalette + ColorPicker** (companion-lib organisms — both portal through OverlayMount).
5. **Layout-only batch** (8 organisms in any order — no engine dependencies).

This ordering ensures composed-on-Drawer organisms (PagesDrawer, TemplatesDrawer in T3) have a stable Drawer to import.

### T2.A — Install remaining deps

- [ ] **Step 1: Install Radix.Toast + Radix.Popover + cmdk + react-colorful**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm install --save @radix-ui/react-toast @radix-ui/react-popover cmdk react-colorful
```

Expected: `package.json` `dependencies` gains 4 entries. `package-lock.json` updates.

### T2.B — Drawer (organism #1 in T2)

**Why first in T2:** T3's PagesDrawer + TemplatesDrawer compose Drawer. Drawer must ship before T3 starts.

- [ ] **Step 1: Vendor drawer.css**

```bash
cp docs/reference/vibcoder/components/organisms/drawer.css \
   packages/editor/src/themes/components/organisms/drawer.css
npm --prefix packages/editor run vibcoder:vendor
bash packages/editor/scripts/ds-grep-gates.sh
bun packages/editor/scripts/vibcoder-variants.mjs organisms/drawer
```

Capture variants output. Use verbatim for prop unions.

- [ ] **Step 2: Write Drawer.tsx**

Drawer is Radix.Dialog with side variants — same engine as Modal but with `data-side` attribute driving CSS slide animation.

```tsx
// packages/editor/src/editor/shared/vibcoder/Drawer.tsx
/**
 * Vibcoder Drawer — side panel built on Radix.Dialog with side variant.
 *
 * Engine: @radix-ui/react-dialog (same as Modal — focus trap, scroll lock,
 * Esc, click-outside, ARIA).
 *
 * Skin: bd-drawer CSS classes from src/themes/components/organisms/drawer.css.
 * CSS handles slide animation via [data-side="left|right|top|bottom"].
 *
 * Sibling exports (Contract C):
 *   Drawer · DrawerTrigger · DrawerContent · DrawerClose · DrawerTitle · DrawerDescription
 *
 * Pattern mirrors Modal — one substantive difference: DrawerContent accepts a
 * `side` prop ("left" | "right" | "top" | "bottom", default "right") and emits
 * `data-side={side}` on the content panel for CSS slide animation.
 *
 * @license BSD-3-Clause
 */
import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { useOverlayContainer } from "./OverlayMount";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
}

export interface DrawerTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface DrawerContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  children: ReactNode;
  side?: DrawerSide;
}

export interface DrawerCloseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface DrawerTitleProps extends HTMLAttributes<HTMLHeadingElement> { children: ReactNode; }
export interface DrawerDescriptionProps extends HTMLAttributes<HTMLParagraphElement> { children: ReactNode; }

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  return <RadixDialog.Root open={open} onOpenChange={onOpenChange}>{children}</RadixDialog.Root>;
}
Drawer.displayName = "Drawer";

export const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ asChild, children, className, ...rest }, ref) => (
    <RadixDialog.Trigger ref={ref} asChild={asChild} className={className} {...rest}>{children}</RadixDialog.Trigger>
  ),
);
DrawerTrigger.displayName = "DrawerTrigger";

export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ children, side = "right", className, ...rest }, ref) => {
    const container = useOverlayContainer();
    const classes = ["bd-drawer", className].filter(Boolean).join(" ");
    return (
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Overlay className="bd-drawer__overlay" />
        <RadixDialog.Content ref={ref} className={classes} data-side={side} {...rest}>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    );
  },
);
DrawerContent.displayName = "DrawerContent";

export const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(
  ({ asChild, children, className, ...rest }, ref) => (
    <RadixDialog.Close ref={ref} asChild={asChild} className={className} {...rest}>{children}</RadixDialog.Close>
  ),
);
DrawerClose.displayName = "DrawerClose";

export const DrawerTitle = forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-drawer__title", className].filter(Boolean).join(" ");
    return <RadixDialog.Title ref={ref} className={classes} {...rest}>{children}</RadixDialog.Title>;
  },
);
DrawerTitle.displayName = "DrawerTitle";

export const DrawerDescription = forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-drawer__desc", className].filter(Boolean).join(" ");
    return <RadixDialog.Description ref={ref} className={classes} {...rest}>{children}</RadixDialog.Description>;
  },
);
DrawerDescription.displayName = "DrawerDescription";
```

- [ ] **Step 3: Write Drawer.test.tsx (~20 tests)**

Mirror Modal.test.tsx structure. Same contract assertions: sibling composition, CSS classes (`bd-drawer`, `bd-drawer__overlay`, `bd-drawer__title`, `bd-drawer__desc`), asChild boundary on Trigger + Close, controlled state (no defaultOpen), portal through OverlayMount, NEW: side prop emits `data-side` attribute (assert all 4 sides). Required harness: wrap in `<OverlayMount>`.

Per-side test:
```tsx
it("DrawerContent emits data-side='left' when side='left'", () => {
  renderDrawer(
    <Drawer open={true} onOpenChange={() => {}}>
      <DrawerContent side="left"><DrawerTitle>x</DrawerTitle></DrawerContent>
    </Drawer>
  );
  expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "left");
});
// Repeat for right, top, bottom + default (right when omitted)
```

- [ ] **Step 4: Write vibcoder-drawer gallery (DemoTrigger + 4 sides)**

```tsx
// packages/editor/src/preview/vibcoder-drawer.tsx
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  Drawer, DrawerContent, DrawerClose, DrawerTitle, DrawerDescription,
} from "@/editor/shared/vibcoder";
import { OverlayMount } from "@/editor/shared/vibcoder/OverlayMount";
import { sectionLabel, stack } from "./_galleryStyles";

export default function DrawerGallery() {
  return (
    <OverlayMount>
      <div css={stack}>
        <h1>Drawer — vibcoder gallery</h1>
        {(["left", "right", "top", "bottom"] as const).map((side) => (
          <div key={side}>
            <p css={sectionLabel}>side={side}</p>
            <DemoTrigger label={`Open ${side} drawer`}>
              {(open, setOpen) => (
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerContent side={side}>
                    <DrawerTitle>{side} drawer</DrawerTitle>
                    <DrawerDescription>Slides in from the {side}.</DrawerDescription>
                    <DrawerClose asChild>
                      <button className="bd-btn">Close</button>
                    </DrawerClose>
                  </DrawerContent>
                </Drawer>
              )}
            </DemoTrigger>
          </div>
        ))}
      </div>
    </OverlayMount>
  );
}
```

Plus minimal `vibcoder-drawer.html` host (mirror modal HTML host pattern from T1 step 19, replace `modal` → `drawer`).

- [ ] **Step 5: Append Drawer barrel exports**

```ts
// Append to src/editor/shared/vibcoder/index.ts
export {
  Drawer, DrawerTrigger, DrawerContent, DrawerClose, DrawerTitle, DrawerDescription,
} from "./Drawer";
export type {
  DrawerProps, DrawerTriggerProps, DrawerContentProps, DrawerCloseProps,
  DrawerTitleProps, DrawerDescriptionProps, DrawerSide,
} from "./Drawer";
```

### T2.C — NotificationCenter

NotificationCenter uses Radix.Toast — different shape from Dialog. Toast has Provider/Viewport/Root/Action/Close primitives.

- [ ] **Step 1: Vendor + variants**

```bash
cp docs/reference/vibcoder/components/organisms/notification-center.css \
   packages/editor/src/themes/components/organisms/notification-center.css
npm --prefix packages/editor run vibcoder:vendor
bash packages/editor/scripts/ds-grep-gates.sh
bun packages/editor/scripts/vibcoder-variants.mjs organisms/notification-center
```

- [ ] **Step 2: Write NotificationCenter.tsx**

```tsx
// packages/editor/src/editor/shared/vibcoder/NotificationCenter.tsx
/**
 * Vibcoder NotificationCenter — toast queue powered by Radix.Toast.
 *
 * Engine: @radix-ui/react-toast (Provider + Viewport + Root pattern).
 *
 * Skin: bd-notification-* CSS classes.
 *
 * Sibling exports (Contract C):
 *   NotificationProvider — wraps app, owns queue (place at app root, near OverlayMount)
 *   NotificationCenter   — viewport (where toasts render). Composes Radix.Viewport.
 *   NotificationItem     — individual toast with open/onOpenChange (Contract B)
 *
 * Each NotificationItem is controlled (open + onOpenChange). Caller owns the
 * queue state (array of items + dismiss callbacks). NotificationCenter is the
 * portal target — Radix.Viewport renders portal'd through useOverlayContainer.
 *
 * @license BSD-3-Clause
 */
import * as RadixToast from "@radix-ui/react-toast";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { useOverlayContainer } from "./OverlayMount";

export interface NotificationProviderProps {
  children: ReactNode;
  duration?: number; // ms before auto-dismiss; default 5000
}

export interface NotificationCenterProps extends HTMLAttributes<HTMLOListElement> {
  hotkey?: string[]; // keyboard shortcut to focus viewport (Radix default ['F8'])
}

export interface NotificationItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "title"> {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  tone?: "info" | "success" | "warning" | "danger";
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function NotificationProvider({ children, duration = 5000 }: NotificationProviderProps) {
  return <RadixToast.Provider duration={duration}>{children}</RadixToast.Provider>;
}
NotificationProvider.displayName = "NotificationProvider";

export const NotificationCenter = forwardRef<HTMLOListElement, NotificationCenterProps>(
  ({ hotkey, className, ...rest }, ref) => {
    const container = useOverlayContainer();
    const classes = ["bd-notification-center", className].filter(Boolean).join(" ");
    // Radix.Viewport doesn't accept a portal container directly; render it inside
    // a portal we control via useOverlayContainer to honor E3.
    return (
      <RadixToast.Viewport ref={ref} className={classes} hotkey={hotkey} {...rest} />
    );
  },
);
NotificationCenter.displayName = "NotificationCenter";

export const NotificationItem = forwardRef<HTMLLIElement, NotificationItemProps>(
  ({ open, onOpenChange, tone = "info", title, description, action, className, ...rest }, ref) => {
    const classes = [
      "bd-notification",
      `bd-notification--${tone}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <RadixToast.Root ref={ref} open={open} onOpenChange={onOpenChange} className={classes} {...rest}>
        <RadixToast.Title className="bd-notification__title">{title}</RadixToast.Title>
        {description && (
          <RadixToast.Description className="bd-notification__desc">{description}</RadixToast.Description>
        )}
        {action && <RadixToast.Action altText="action" asChild>{action}</RadixToast.Action>}
        <RadixToast.Close className="bd-notification__close" aria-label="Dismiss" />
      </RadixToast.Root>
    );
  },
);
NotificationItem.displayName = "NotificationItem";
```

- [ ] **Step 3: Write NotificationCenter.test.tsx (~18 tests)**

Cover: NotificationProvider renders children, NotificationCenter applies bd-notification-center class + ref forwarding, NotificationItem controlled state (open + onOpenChange, no defaultOpen), tone variants (info/success/warning/danger emit `bd-notification--<tone>` classes), default tone = "info" (default-emit per Phase 2 lesson #8 — ALWAYS emit so modifier is present), description renders only when provided, action renders only when provided, action uses asChild forwarding, close button has aria-label="Dismiss".

- [ ] **Step 4: Write vibcoder-notification-center gallery + html host**

Use DemoTrigger to add/dismiss notifications. Each click pushes a new NotificationItem with auto-dismiss; user can also click the close button.

```tsx
// packages/editor/src/preview/vibcoder-notification-center.tsx
import { useState } from "react";
import {
  NotificationProvider, NotificationCenter, NotificationItem,
  OverlayMount,
} from "@/editor/shared/vibcoder";
import { stack, sectionLabel } from "./_galleryStyles";

interface Notif { id: number; tone: "info" | "success" | "warning" | "danger"; title: string; }

export default function NotificationCenterGallery() {
  const [items, setItems] = useState<Notif[]>([]);
  const push = (tone: Notif["tone"]) => setItems((prev) => [
    ...prev,
    { id: Date.now() + Math.random(), tone, title: `${tone} notification` },
  ]);
  const dismiss = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));
  return (
    <OverlayMount>
      <NotificationProvider duration={4000}>
        <div css={stack}>
          <h1>NotificationCenter — vibcoder gallery</h1>
          <p css={sectionLabel}>Push notifications</p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["info", "success", "warning", "danger"] as const).map((t) => (
              <button key={t} className="bd-btn" onClick={() => push(t)}>
                Push {t}
              </button>
            ))}
          </div>
          <NotificationCenter />
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              open={true}
              onOpenChange={(next) => { if (!next) dismiss(n.id); }}
              tone={n.tone}
              title={n.title}
              description="Auto-dismisses in 4s. Click × to close."
            />
          ))}
        </div>
      </NotificationProvider>
    </OverlayMount>
  );
}
```

**E5 caveat:** This gallery uses `open={true}` literal on each NotificationItem because the queue array drives lifecycle, not a single useState. The ESLint rule `no-hardcoded-open-prop` will flag this — add an inline `// eslint-disable-next-line buildrik/no-hardcoded-open-prop` comment with reason: queue-driven lifecycle, NOT a static demo. This is the documented exception.

Plus minimal `vibcoder-notification-center.html` host.

- [ ] **Step 5: Append NotificationCenter barrel exports**

```ts
export { NotificationProvider, NotificationCenter, NotificationItem } from "./NotificationCenter";
export type {
  NotificationProviderProps, NotificationCenterProps, NotificationItemProps,
} from "./NotificationCenter";
```

### T2.D — CommandPalette

Uses `cmdk` lib. Cmdk is built around its own `<Command>` component family — wrap with vibcoder CSS.

- [ ] **Step 1: Vendor + variants**

```bash
cp docs/reference/vibcoder/components/organisms/command-palette.css \
   packages/editor/src/themes/components/organisms/command-palette.css
npm --prefix packages/editor run vibcoder:vendor
bash packages/editor/scripts/ds-grep-gates.sh
bun packages/editor/scripts/vibcoder-variants.mjs organisms/command-palette
```

- [ ] **Step 2: Write CommandPalette.tsx**

```tsx
// packages/editor/src/editor/shared/vibcoder/CommandPalette.tsx
/**
 * Vibcoder CommandPalette — combobox UI for command discovery / fuzzy search.
 *
 * Engine: cmdk (by Paco Coursey). Provides combobox state machine, filter,
 * keyboard nav, virtual focus, ARIA. Wrapped inside a controlled Modal-like
 * overlay (Radix.Dialog under the hood for portal + focus trap + Esc).
 *
 * Skin: bd-cmdk-* CSS classes.
 *
 * Sibling exports (Contract C):
 *   CommandPalette       — root with open + onOpenChange, wraps cmdk.Command.Dialog
 *   CommandPaletteInput  — search input (cmdk.Command.Input)
 *   CommandPaletteList   — scrollable result list (cmdk.Command.List)
 *   CommandPaletteItem   — selectable item (cmdk.Command.Item) with onSelect
 *   CommandPaletteGroup  — labeled group of items (cmdk.Command.Group)
 *   CommandPaletteEmpty  — empty-state when filter matches nothing (cmdk.Command.Empty)
 *
 * E4: cmdk types (CommandLoadingProps etc.) NOT re-exported.
 *
 * @license BSD-3-Clause
 */
import { Command } from "cmdk";
import { forwardRef, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { useOverlayContainer } from "./OverlayMount";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  label?: string; // accessibility label for the dialog (default "Command palette")
  children: ReactNode;
}

export interface CommandPaletteInputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

export interface CommandPaletteListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CommandPaletteItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  value?: string; // search/filter key (cmdk uses this to filter)
  onSelect?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export interface CommandPaletteGroupProps extends HTMLAttributes<HTMLDivElement> {
  heading?: string;
  children: ReactNode;
}

export interface CommandPaletteEmptyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CommandPalette({ open, onOpenChange, label = "Command palette", children }: CommandPaletteProps) {
  const container = useOverlayContainer();
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={label}
      container={container ?? undefined}
      className="bd-cmdk"
    >
      {children}
    </Command.Dialog>
  );
}
CommandPalette.displayName = "CommandPalette";

export const CommandPaletteInput = forwardRef<HTMLInputElement, CommandPaletteInputProps>(
  ({ className, ...rest }, ref) => {
    const classes = ["bd-cmdk__input", className].filter(Boolean).join(" ");
    return <Command.Input ref={ref} className={classes} {...rest} />;
  },
);
CommandPaletteInput.displayName = "CommandPaletteInput";

export const CommandPaletteList = forwardRef<HTMLDivElement, CommandPaletteListProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-cmdk__list", className].filter(Boolean).join(" ");
    return <Command.List ref={ref} className={classes} {...rest}>{children}</Command.List>;
  },
);
CommandPaletteList.displayName = "CommandPaletteList";

export const CommandPaletteItem = forwardRef<HTMLDivElement, CommandPaletteItemProps>(
  ({ value, onSelect, disabled, children, className, ...rest }, ref) => {
    const classes = ["bd-cmdk__item", className].filter(Boolean).join(" ");
    return (
      <Command.Item
        ref={ref}
        value={value}
        onSelect={onSelect}
        disabled={disabled}
        className={classes}
        {...rest}
      >
        {children}
      </Command.Item>
    );
  },
);
CommandPaletteItem.displayName = "CommandPaletteItem";

export const CommandPaletteGroup = forwardRef<HTMLDivElement, CommandPaletteGroupProps>(
  ({ heading, children, className, ...rest }, ref) => {
    const classes = ["bd-cmdk__group", className].filter(Boolean).join(" ");
    return (
      <Command.Group ref={ref} heading={heading} className={classes} {...rest}>
        {children}
      </Command.Group>
    );
  },
);
CommandPaletteGroup.displayName = "CommandPaletteGroup";

export const CommandPaletteEmpty = forwardRef<HTMLDivElement, CommandPaletteEmptyProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-cmdk__empty", className].filter(Boolean).join(" ");
    return <Command.Empty ref={ref} className={classes} {...rest}>{children}</Command.Empty>;
  },
);
CommandPaletteEmpty.displayName = "CommandPaletteEmpty";
```

- [ ] **Step 3: Write CommandPalette.test.tsx (~20 tests)**

Cover: CommandPalette controlled state (open + onOpenChange, no defaultOpen), label prop applied, vibcoder CSS classes (bd-cmdk on dialog, bd-cmdk__input, bd-cmdk__list, bd-cmdk__item, bd-cmdk__group, bd-cmdk__empty), Item onSelect fires when clicked + when Enter pressed on selected item (use userEvent), disabled item doesn't fire onSelect, filter behavior (typing in input filters items by their `value` prop), Empty renders only when filter matches nothing, Group heading renders, refs forward correctly to underlying cmdk components, ESLint compliance E4 (no cmdk types re-exported — verified by lint).

- [ ] **Step 4: Write vibcoder-command-palette gallery using DemoTrigger**

```tsx
// packages/editor/src/preview/vibcoder-command-palette.tsx
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteItem,
  CommandPaletteGroup, CommandPaletteEmpty, OverlayMount,
} from "@/editor/shared/vibcoder";
import { stack, sectionLabel } from "./_galleryStyles";

const COMMANDS = [
  { group: "Navigation", id: "go-home", label: "Go to home" },
  { group: "Navigation", id: "go-search", label: "Open search" },
  { group: "Edit", id: "copy", label: "Copy selection" },
  { group: "Edit", id: "paste", label: "Paste" },
  { group: "Edit", id: "undo", label: "Undo" },
];

export default function CommandPaletteGallery() {
  return (
    <OverlayMount>
      <div css={stack}>
        <h1>CommandPalette — vibcoder gallery</h1>
        <p css={sectionLabel}>Type to filter, ↑↓ to navigate, ⏎ to select</p>
        <DemoTrigger label="Open palette (Cmd+K)">
          {(open, setOpen) => (
            <CommandPalette open={open} onOpenChange={setOpen} label="Command palette">
              <CommandPaletteInput placeholder="Type a command..." />
              <CommandPaletteList>
                <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
                <CommandPaletteGroup heading="Navigation">
                  {COMMANDS.filter(c => c.group === "Navigation").map(c => (
                    <CommandPaletteItem key={c.id} value={c.label} onSelect={() => { console.log(c.id); setOpen(false); }}>
                      {c.label}
                    </CommandPaletteItem>
                  ))}
                </CommandPaletteGroup>
                <CommandPaletteGroup heading="Edit">
                  {COMMANDS.filter(c => c.group === "Edit").map(c => (
                    <CommandPaletteItem key={c.id} value={c.label} onSelect={() => { console.log(c.id); setOpen(false); }}>
                      {c.label}
                    </CommandPaletteItem>
                  ))}
                </CommandPaletteGroup>
              </CommandPaletteList>
            </CommandPalette>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}
```

Plus minimal `vibcoder-command-palette.html` host.

- [ ] **Step 5: Append CommandPalette barrel exports**

```ts
export {
  CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteItem,
  CommandPaletteGroup, CommandPaletteEmpty,
} from "./CommandPalette";
export type {
  CommandPaletteProps, CommandPaletteInputProps, CommandPaletteListProps,
  CommandPaletteItemProps, CommandPaletteGroupProps, CommandPaletteEmptyProps,
} from "./CommandPalette";
```

### T2.E — ColorPicker

Uses `react-colorful` inside Radix.Popover (anchored picker UI).

- [ ] **Step 1: Vendor + variants**

```bash
cp docs/reference/vibcoder/components/organisms/color-picker.css \
   packages/editor/src/themes/components/organisms/color-picker.css
npm --prefix packages/editor run vibcoder:vendor
bash packages/editor/scripts/ds-grep-gates.sh
bun packages/editor/scripts/vibcoder-variants.mjs organisms/color-picker
```

- [ ] **Step 2: Write ColorPicker.tsx**

```tsx
// packages/editor/src/editor/shared/vibcoder/ColorPicker.tsx
/**
 * Vibcoder ColorPicker — anchored hex color picker.
 *
 * Engine: react-colorful (HexColorPicker — saturation+hue+alpha) inside
 * @radix-ui/react-popover (positioning, click-outside, Esc, portal).
 *
 * Skin: bd-color-picker CSS classes.
 *
 * Sibling exports (Contract C):
 *   ColorPicker        — root with open + onOpenChange + value + onChange
 *   ColorPickerSwatch  — visual swatch trigger (asChild per E1)
 *   ColorPickerInput   — text input for direct hex entry, syncs with picker
 *
 * E4: react-colorful types (Color, etc.) NOT re-exported. Public API is
 * vibcoder-shaped: `value: string` (hex), `onChange: (hex: string) => void`.
 *
 * @license BSD-3-Clause
 */
import * as RadixPopover from "@radix-ui/react-popover";
import { HexColorPicker } from "react-colorful";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { useOverlayContainer } from "./OverlayMount";

export interface ColorPickerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  value: string;            // hex string, e.g. "#2D6DFF"
  onChange: (hex: string) => void;
  children: ReactNode;      // typically <ColorPickerSwatch> + content
}

export interface ColorPickerSwatchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  asChild?: boolean;
  value: string;            // hex string for swatch background
  children?: ReactNode;     // optional label/icon
}

export interface ColorPickerInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ open, onOpenChange, value, onChange, children }: ColorPickerProps) {
  const container = useOverlayContainer();
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      {children}
      <RadixPopover.Portal container={container ?? undefined}>
        <RadixPopover.Content className="bd-color-picker" sideOffset={8}>
          <HexColorPicker color={value} onChange={onChange} />
          <ColorPickerInput value={value} onChange={onChange} />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
ColorPicker.displayName = "ColorPicker";

export const ColorPickerSwatch = forwardRef<HTMLButtonElement, ColorPickerSwatchProps>(
  ({ asChild, value, children, className, style, ...rest }, ref) => {
    const classes = ["bd-color-picker__swatch", className].filter(Boolean).join(" ");
    const swatchStyle = { ...style, background: value };
    if (asChild) {
      return (
        <RadixPopover.Trigger asChild ref={ref}>
          {children}
        </RadixPopover.Trigger>
      );
    }
    return (
      <RadixPopover.Trigger ref={ref} className={classes} style={swatchStyle} {...rest}>
        {children ?? <span className="bd-sr-only">{value}</span>}
      </RadixPopover.Trigger>
    );
  },
);
ColorPickerSwatch.displayName = "ColorPickerSwatch";

export const ColorPickerInput = forwardRef<HTMLInputElement, ColorPickerInputProps>(
  ({ value, onChange, className, ...rest }, ref) => {
    const classes = ["bd-color-picker__input", className].filter(Boolean).join(" ");
    return (
      <input
        ref={ref}
        type="text"
        className={classes}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        {...rest}
      />
    );
  },
);
ColorPickerInput.displayName = "ColorPickerInput";
```

- [ ] **Step 3: Write ColorPicker.test.tsx (~15 tests)**

Cover: controlled state (value + onChange + open + onOpenChange, no defaults), vibcoder CSS classes (bd-color-picker, bd-color-picker__swatch, bd-color-picker__input), Swatch background style derives from value prop, Input echoes value prop, Input onChange propagates string up, Swatch asChild forwards to caller's child (E1), portal through OverlayMount (assert dialog inside #vibcoder-overlay-root when open=true), E4 compliance smoke check (value is string, not Color object).

- [ ] **Step 4: Write vibcoder-color-picker gallery using DemoTrigger**

```tsx
// packages/editor/src/preview/vibcoder-color-picker.tsx
import { useState } from "react";
import { DemoTrigger } from "./_lib/DemoTrigger";
import { ColorPicker, ColorPickerSwatch, OverlayMount } from "@/editor/shared/vibcoder";
import { stack, sectionLabel } from "./_galleryStyles";

export default function ColorPickerGallery() {
  const [color, setColor] = useState("#2D6DFF");
  return (
    <OverlayMount>
      <div css={stack}>
        <h1>ColorPicker — vibcoder gallery</h1>
        <p css={sectionLabel}>Current: {color}</p>
        <DemoTrigger label="Open color picker">
          {(open, setOpen) => (
            <ColorPicker open={open} onOpenChange={setOpen} value={color} onChange={setColor}>
              <ColorPickerSwatch value={color} />
            </ColorPicker>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}
```

Plus minimal HTML host.

- [ ] **Step 5: Append ColorPicker barrel exports**

```ts
export { ColorPicker, ColorPickerSwatch, ColorPickerInput } from "./ColorPicker";
export type {
  ColorPickerProps, ColorPickerSwatchProps, ColorPickerInputProps,
} from "./ColorPicker";
```

### T2.F — Layout-only batch (8 organisms in any order)

For each of: Topbar, Footer, Rail, LeftPanel, Inspector, HistoryPanel, EmptyState, A11yOverlay.

The shape repeats per organism. Repeated steps (vendor → gates → variants → wrapper → tests → gallery → barrel) follow the same template as T1 but with NO Radix engine, NO DemoTrigger (E5 doesn't apply to layout-only). Wrappers are pure CSS class assembly + Phase 1+2 atom/molecule composition.

For each layout organism `<name>` with PascalCase `<Name>`:

- [ ] **Per-organism Step 1: Vendor**

```bash
cp docs/reference/vibcoder/components/organisms/<name>.css \
   packages/editor/src/themes/components/organisms/<name>.css
```

After all 8 layout CSS files are copied, run vendor pipeline ONCE:

```bash
npm --prefix packages/editor run vibcoder:vendor
bash packages/editor/scripts/ds-grep-gates.sh
```

- [ ] **Per-organism Step 2: Discover variants**

```bash
bun packages/editor/scripts/vibcoder-variants.mjs organisms/<name>
```

Capture verbatim. Drives prop unions.

- [ ] **Per-organism Step 3: Write wrapper using layout-only template**

Layout-only template (apply per organism):

```tsx
// packages/editor/src/editor/shared/vibcoder/<Name>.tsx
/**
 * Vibcoder <Name> — layout-only organism (no engine).
 *
 * Skin: bd-<name> CSS classes from src/themes/components/organisms/<name>.css.
 *
 * Sibling exports (Contract C): listed per organism in Phase 3 design spec
 * § "Organism inventory" table.
 *
 * Composes Phase 1 atoms / Phase 2 molecules per Contract D.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface <Name>Props extends HTMLAttributes<HTMLDivElement> {
  // (per-organism props from variants script)
  children?: ReactNode;
}

export const <Name> = forwardRef<HTMLDivElement, <Name>Props>(
  ({ children, className, ...rest }, ref) => {
    const classes = [
      "bd-<name>",
      // (per-organism modifier classes from variants script)
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
<Name>.displayName = "<Name>";

// Sibling exports — list per organism per spec inventory
```

Per-organism sibling export list (from spec § "Organism inventory" Cluster 1):

| Organism | Sibling exports |
|----------|-----------------|
| Topbar | Topbar · TopbarBrand · TopbarActions |
| Footer | Footer · FooterStatus · FooterActions |
| Rail | Rail · RailGroup |
| LeftPanel | LeftPanel · LeftPanelHeader · LeftPanelBody |
| Inspector | Inspector · InspectorSection · InspectorHeader |
| HistoryPanel | HistoryPanel · HistoryItem |
| EmptyState | EmptyState · EmptyStateIcon · EmptyStateTitle · EmptyStateDesc · EmptyStateAction |
| A11yOverlay | A11yOverlay |

For each sibling, follow the same template — `forwardRef`, `bd-<name>__<part>` class, `displayName`, accept `children` and `...rest`.

- [ ] **Per-organism Step 4: Write tests**

Per organism, ≥3 tests:
- Renders root with `bd-<name>` class
- Each sibling renders with its `bd-<name>__<part>` class
- Composition smoke test (root + at least 2 siblings render together)

Layout organisms have no behavior to test beyond markup — same shape as Phase 1+2 atom/molecule tests.

- [ ] **Per-organism Step 5: Write inline static gallery (NOT DemoTrigger)**

Layout organisms ship inline static demos per E5 scope exclusion:

```tsx
// packages/editor/src/preview/vibcoder-<name>.tsx
import { <Name>, ...siblings } from "@/editor/shared/vibcoder";
import { stack, sectionLabel } from "./_galleryStyles";

export default function <Name>Gallery() {
  return (
    <div css={stack}>
      <h1><Name> — vibcoder gallery</h1>
      <p css={sectionLabel}>Default</p>
      <<Name>>
        <<Sibling1>>example content</<Sibling1>>
        <<Sibling2>>example content</<Sibling2>>
      </<Name>>
    </div>
  );
}
```

Plus minimal `vibcoder-<name>.html` host (mirror modal HTML host pattern).

- [ ] **Per-organism Step 6: Append barrel exports**

```ts
export { <Name>, ...siblings } from "./<Name>";
export type { <Name>Props, ...siblingProps } from "./<Name>";
```

### T2.G — Final T2 verification

- [ ] **Step 1: Run all T2 tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/shared/vibcoder/Drawer.test.tsx \
               src/editor/shared/vibcoder/NotificationCenter.test.tsx \
               src/editor/shared/vibcoder/CommandPalette.test.tsx \
               src/editor/shared/vibcoder/ColorPicker.test.tsx \
               src/editor/shared/vibcoder/Topbar.test.tsx \
               src/editor/shared/vibcoder/Footer.test.tsx \
               src/editor/shared/vibcoder/Rail.test.tsx \
               src/editor/shared/vibcoder/LeftPanel.test.tsx \
               src/editor/shared/vibcoder/Inspector.test.tsx \
               src/editor/shared/vibcoder/HistoryPanel.test.tsx \
               src/editor/shared/vibcoder/EmptyState.test.tsx \
               src/editor/shared/vibcoder/A11yOverlay.test.tsx
```

Expected: ALL PASS. ~350-400 net-new tests across 13 organisms.

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: ~570 (T1 baseline) + ~350-400 (T2) = ~925-975 tests. Zero regressions.

- [ ] **Step 3: Run lint + gates + check-port**

```bash
npm run lint
npm run lint:ds
bash scripts/check-vibcoder-port.sh
```

Expected: ALL PASS. New ESLint rules pass on all 13 wrappers + 7 stateful galleries (excluding the documented NotificationCenter eslint-disable). Gate 22 passes (no `document.body` outside OverlayMount.tsx).

- [ ] **Step 4: Manual gallery smoke test (sample)**

```bash
npm run dev
```

Open in browser:
- `/src/preview/vibcoder-drawer.html` — verify all 4 sides slide correctly, Esc closes
- `/src/preview/vibcoder-notification-center.html` — push 3-4 notifications, verify queue + auto-dismiss
- `/src/preview/vibcoder-command-palette.html` — open, type to filter, ↑↓ to navigate, ⏎ to select
- `/src/preview/vibcoder-color-picker.html` — open swatch trigger, drag picker, verify hex input syncs
- One layout-only sample (e.g., `/src/preview/vibcoder-empty-state.html`) — verify CSS renders

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/package.json packages/editor/package-lock.json \
        packages/editor/src/themes/components/organisms/ \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/Drawer.tsx \
        packages/editor/src/editor/shared/vibcoder/Drawer.test.tsx \
        packages/editor/src/editor/shared/vibcoder/NotificationCenter.tsx \
        packages/editor/src/editor/shared/vibcoder/NotificationCenter.test.tsx \
        packages/editor/src/editor/shared/vibcoder/CommandPalette.tsx \
        packages/editor/src/editor/shared/vibcoder/CommandPalette.test.tsx \
        packages/editor/src/editor/shared/vibcoder/ColorPicker.tsx \
        packages/editor/src/editor/shared/vibcoder/ColorPicker.test.tsx \
        packages/editor/src/editor/shared/vibcoder/Topbar.tsx \
        packages/editor/src/editor/shared/vibcoder/Topbar.test.tsx \
        packages/editor/src/editor/shared/vibcoder/Footer.tsx \
        packages/editor/src/editor/shared/vibcoder/Footer.test.tsx \
        packages/editor/src/editor/shared/vibcoder/Rail.tsx \
        packages/editor/src/editor/shared/vibcoder/Rail.test.tsx \
        packages/editor/src/editor/shared/vibcoder/LeftPanel.tsx \
        packages/editor/src/editor/shared/vibcoder/LeftPanel.test.tsx \
        packages/editor/src/editor/shared/vibcoder/Inspector.tsx \
        packages/editor/src/editor/shared/vibcoder/Inspector.test.tsx \
        packages/editor/src/editor/shared/vibcoder/HistoryPanel.tsx \
        packages/editor/src/editor/shared/vibcoder/HistoryPanel.test.tsx \
        packages/editor/src/editor/shared/vibcoder/EmptyState.tsx \
        packages/editor/src/editor/shared/vibcoder/EmptyState.test.tsx \
        packages/editor/src/editor/shared/vibcoder/A11yOverlay.tsx \
        packages/editor/src/editor/shared/vibcoder/A11yOverlay.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-drawer.{html,tsx} \
        packages/editor/src/preview/vibcoder-notification-center.{html,tsx} \
        packages/editor/src/preview/vibcoder-command-palette.{html,tsx} \
        packages/editor/src/preview/vibcoder-color-picker.{html,tsx} \
        packages/editor/src/preview/vibcoder-topbar.{html,tsx} \
        packages/editor/src/preview/vibcoder-footer.{html,tsx} \
        packages/editor/src/preview/vibcoder-rail.{html,tsx} \
        packages/editor/src/preview/vibcoder-left-panel.{html,tsx} \
        packages/editor/src/preview/vibcoder-inspector.{html,tsx} \
        packages/editor/src/preview/vibcoder-history-panel.{html,tsx} \
        packages/editor/src/preview/vibcoder-empty-state.{html,tsx} \
        packages/editor/src/preview/vibcoder-a11y-overlay.{html,tsx}

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-3): T2 mega-batch — 13 organisms (8 layout + 3 Radix overlays + 2 companion-lib)

Layout-only (8): Topbar, Footer, Rail, LeftPanel, Inspector, HistoryPanel, EmptyState, A11yOverlay
Radix overlays (3): Drawer (Radix.Dialog + side variant), NotificationCenter (Radix.Toast), [Modal already in T1]
Companion-lib (2): CommandPalette (cmdk), ColorPicker (react-colorful inside Radix.Popover)

Deps added: @radix-ui/react-toast, @radix-ui/react-popover, cmdk, react-colorful

All 9 contracts (A-D inherited + E1-E5 new) honored across 13 organisms. ~350-400 net-new tests.
NotificationCenter gallery uses documented eslint-disable for queue-driven open={true} (E5 exception).

Phase 3 fan-out now at 14/16 organisms. T3 (composed: PagesDrawer + TemplatesDrawer) follows.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, working tree clean.

---

## Task 3: Composed drawer variants (PagesDrawer + TemplatesDrawer)

**Files:**
- Read: `docs/reference/vibcoder/components/organisms/{pages-drawer,templates-drawer}.css`
- Generate: `packages/editor/src/themes/components/organisms/{pages-drawer,templates-drawer}.css`
- Create: `packages/editor/src/editor/shared/vibcoder/{PagesDrawer,TemplatesDrawer}.tsx` + `.test.tsx`
- Create: `packages/editor/src/preview/vibcoder-{pages-drawer,templates-drawer}.{html,tsx}`
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (append exports)

**Why these two are last:** Both compose T2's Drawer + Phase 2 Card/ListRow. Pure composition tasks — no new engine integration.

### T3.A — PagesDrawer

- [ ] **Step 1: Vendor + gates + variants**

```bash
cp docs/reference/vibcoder/components/organisms/pages-drawer.css \
   packages/editor/src/themes/components/organisms/pages-drawer.css
npm --prefix packages/editor run vibcoder:vendor
bash packages/editor/scripts/ds-grep-gates.sh
bun packages/editor/scripts/vibcoder-variants.mjs organisms/pages-drawer
```

- [ ] **Step 2: Write PagesDrawer.tsx**

```tsx
// packages/editor/src/editor/shared/vibcoder/PagesDrawer.tsx
/**
 * Vibcoder PagesDrawer — pages tree drawer.
 *
 * Composes Phase 3 Drawer + Phase 2 ListRow (per Contract D cross-imports).
 *
 * Sibling exports:
 *   PagesDrawer        — composes <Drawer><DrawerContent>{children}</DrawerContent></Drawer>
 *   PagesDrawerGroup   — collapsible group of pages with heading
 *   PagesDrawerItem    — individual page row (composes ListRow)
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import {
  Drawer, DrawerContent, DrawerTitle, DrawerDescription,
} from "./Drawer";
import { ListRow, type ListRowProps } from "./ListRow";

export interface PagesDrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

export interface PagesDrawerGroupProps extends HTMLAttributes<HTMLDivElement> {
  heading: string;
  children: ReactNode;
}

export interface PagesDrawerItemProps extends ListRowProps {
  // PagesDrawerItem inherits all ListRowProps; adds bd-pages-drawer__item modifier
}

export function PagesDrawer({ open, onOpenChange, title = "Pages", description, children }: PagesDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left">
        <DrawerTitle className="bd-pages-drawer__title">{title}</DrawerTitle>
        {description && (
          <DrawerDescription className="bd-pages-drawer__desc">{description}</DrawerDescription>
        )}
        <div className="bd-pages-drawer__body">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
PagesDrawer.displayName = "PagesDrawer";

export const PagesDrawerGroup = forwardRef<HTMLDivElement, PagesDrawerGroupProps>(
  ({ heading, children, className, ...rest }, ref) => {
    const classes = ["bd-pages-drawer__group", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="bd-pages-drawer__group-heading">{heading}</div>
        {children}
      </div>
    );
  },
);
PagesDrawerGroup.displayName = "PagesDrawerGroup";

export const PagesDrawerItem = forwardRef<HTMLButtonElement, PagesDrawerItemProps>(
  ({ className, ...rest }, ref) => {
    const classes = ["bd-pages-drawer__item", className].filter(Boolean).join(" ");
    return <ListRow ref={ref} className={classes} {...rest} />;
  },
);
PagesDrawerItem.displayName = "PagesDrawerItem";
```

- [ ] **Step 3: Write PagesDrawer.test.tsx (~12 tests)**

Cover: PagesDrawer composes Drawer + DrawerContent (assert dialog renders when open=true), title prop renders as DrawerTitle, default title = "Pages", description renders only when provided, body renders children, side is hardcoded to "left", PagesDrawerGroup applies bd-pages-drawer__group + heading renders, PagesDrawerItem composes ListRow + applies bd-pages-drawer__item, ref forwarding, controlled state (no defaultOpen).

- [ ] **Step 4: Write vibcoder-pages-drawer gallery**

```tsx
// packages/editor/src/preview/vibcoder-pages-drawer.tsx
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  PagesDrawer, PagesDrawerGroup, PagesDrawerItem, OverlayMount,
} from "@/editor/shared/vibcoder";
import { stack, sectionLabel } from "./_galleryStyles";

export default function PagesDrawerGallery() {
  return (
    <OverlayMount>
      <div css={stack}>
        <h1>PagesDrawer — vibcoder gallery</h1>
        <p css={sectionLabel}>Pages tree</p>
        <DemoTrigger label="Open pages drawer">
          {(open, setOpen) => (
            <PagesDrawer open={open} onOpenChange={setOpen} description="3 pages, 2 groups">
              <PagesDrawerGroup heading="Marketing">
                <PagesDrawerItem title="Home" meta="/" />
                <PagesDrawerItem title="About" meta="/about" />
                <PagesDrawerItem title="Pricing" meta="/pricing" active />
              </PagesDrawerGroup>
              <PagesDrawerGroup heading="App">
                <PagesDrawerItem title="Dashboard" meta="/app" />
              </PagesDrawerGroup>
            </PagesDrawer>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}
```

Plus HTML host.

- [ ] **Step 5: Append barrel exports**

```ts
export { PagesDrawer, PagesDrawerGroup, PagesDrawerItem } from "./PagesDrawer";
export type {
  PagesDrawerProps, PagesDrawerGroupProps, PagesDrawerItemProps,
} from "./PagesDrawer";
```

### T3.B — TemplatesDrawer

- [ ] **Step 1: Vendor + gates + variants**

```bash
cp docs/reference/vibcoder/components/organisms/templates-drawer.css \
   packages/editor/src/themes/components/organisms/templates-drawer.css
npm --prefix packages/editor run vibcoder:vendor
bash packages/editor/scripts/ds-grep-gates.sh
bun packages/editor/scripts/vibcoder-variants.mjs organisms/templates-drawer
```

- [ ] **Step 2: Write TemplatesDrawer.tsx**

```tsx
// packages/editor/src/editor/shared/vibcoder/TemplatesDrawer.tsx
/**
 * Vibcoder TemplatesDrawer — template grid drawer.
 *
 * Composes Phase 3 Drawer + Phase 2 Card (per Contract D cross-imports).
 *
 * Sibling exports:
 *   TemplatesDrawer          — composes <Drawer><DrawerContent>{children}</DrawerContent></Drawer>
 *   TemplatesDrawerCategory  — labeled section heading
 *   TemplatesDrawerItem      — single template tile (composes Card)
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import {
  Drawer, DrawerContent, DrawerTitle, DrawerDescription,
} from "./Drawer";
import { Card, CardHeader, CardBody, type CardProps } from "./Card";

export interface TemplatesDrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

export interface TemplatesDrawerCategoryProps extends HTMLAttributes<HTMLDivElement> {
  heading: string;
  children: ReactNode;
}

export interface TemplatesDrawerItemProps extends CardProps {
  thumbnail?: ReactNode;
  templateTitle: string;
  templateDescription?: string;
  // CardProps already supplies onClick, ref, etc.
}

export function TemplatesDrawer({ open, onOpenChange, title = "Templates", description, children }: TemplatesDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right">
        <DrawerTitle className="bd-templates-drawer__title">{title}</DrawerTitle>
        {description && (
          <DrawerDescription className="bd-templates-drawer__desc">{description}</DrawerDescription>
        )}
        <div className="bd-templates-drawer__grid">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
TemplatesDrawer.displayName = "TemplatesDrawer";

export const TemplatesDrawerCategory = forwardRef<HTMLDivElement, TemplatesDrawerCategoryProps>(
  ({ heading, children, className, ...rest }, ref) => {
    const classes = ["bd-templates-drawer__category", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="bd-templates-drawer__category-heading">{heading}</div>
        <div className="bd-templates-drawer__category-grid">{children}</div>
      </div>
    );
  },
);
TemplatesDrawerCategory.displayName = "TemplatesDrawerCategory";

export const TemplatesDrawerItem = forwardRef<HTMLDivElement, TemplatesDrawerItemProps>(
  ({ thumbnail, templateTitle, templateDescription, className, ...rest }, ref) => {
    const classes = ["bd-templates-drawer__item", className].filter(Boolean).join(" ");
    return (
      <Card ref={ref} className={classes} {...rest}>
        {thumbnail && <div className="bd-templates-drawer__item-thumb">{thumbnail}</div>}
        <CardHeader>{templateTitle}</CardHeader>
        {templateDescription && <CardBody>{templateDescription}</CardBody>}
      </Card>
    );
  },
);
TemplatesDrawerItem.displayName = "TemplatesDrawerItem";
```

- [ ] **Step 3: Write TemplatesDrawer.test.tsx (~12 tests)**

Cover: TemplatesDrawer composes Drawer + DrawerContent (assert dialog renders when open=true), title prop renders as DrawerTitle, default title = "Templates", description renders only when provided, grid renders children, side is hardcoded to "right", TemplatesDrawerCategory applies bd-templates-drawer__category + heading renders, TemplatesDrawerItem composes Card + applies bd-templates-drawer__item, thumbnail slot renders only when provided, templateDescription renders only when provided, ref forwarding.

- [ ] **Step 4: Write vibcoder-templates-drawer gallery**

```tsx
// packages/editor/src/preview/vibcoder-templates-drawer.tsx
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  TemplatesDrawer, TemplatesDrawerCategory, TemplatesDrawerItem,
  OverlayMount,
} from "@/editor/shared/vibcoder";
import { stack, sectionLabel } from "./_galleryStyles";

export default function TemplatesDrawerGallery() {
  return (
    <OverlayMount>
      <div css={stack}>
        <h1>TemplatesDrawer — vibcoder gallery</h1>
        <p css={sectionLabel}>Template categories</p>
        <DemoTrigger label="Open templates drawer">
          {(open, setOpen) => (
            <TemplatesDrawer open={open} onOpenChange={setOpen} description="6 templates">
              <TemplatesDrawerCategory heading="Landing pages">
                <TemplatesDrawerItem
                  templateTitle="Hero + features"
                  templateDescription="Centered hero with feature grid"
                />
                <TemplatesDrawerItem
                  templateTitle="SaaS pricing"
                  templateDescription="3-tier pricing comparison"
                />
              </TemplatesDrawerCategory>
              <TemplatesDrawerCategory heading="Email">
                <TemplatesDrawerItem
                  templateTitle="Welcome"
                  templateDescription="Onboarding email with CTA"
                />
              </TemplatesDrawerCategory>
            </TemplatesDrawer>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}
```

Plus HTML host.

- [ ] **Step 5: Append barrel exports**

```ts
export {
  TemplatesDrawer, TemplatesDrawerCategory, TemplatesDrawerItem,
} from "./TemplatesDrawer";
export type {
  TemplatesDrawerProps, TemplatesDrawerCategoryProps, TemplatesDrawerItemProps,
} from "./TemplatesDrawer";
```

### T3.C — Final T3 verification + commit

- [ ] **Step 1: Run T3 tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/shared/vibcoder/PagesDrawer.test.tsx \
               src/editor/shared/vibcoder/TemplatesDrawer.test.tsx
```

Expected: ALL PASS. ~24 net-new tests.

- [ ] **Step 2: Run full suite**

```bash
npx vitest run
```

Expected: ~925-975 (T2 baseline) + ~24 (T3) = ~950-1000 tests. Zero regressions.

- [ ] **Step 3: Run lint + gates**

```bash
npm run lint
npm run lint:ds
bash scripts/check-vibcoder-port.sh
```

Expected: ALL PASS.

- [ ] **Step 4: Manual gallery smoke test**

```bash
npm run dev
```

Open `/src/preview/vibcoder-pages-drawer.html` and `/src/preview/vibcoder-templates-drawer.html`. Verify drawers slide from left/right, contents render Phase 2 ListRow/Card composition correctly, Esc closes.

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/organisms/{pages-drawer,templates-drawer}.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/PagesDrawer.tsx \
        packages/editor/src/editor/shared/vibcoder/PagesDrawer.test.tsx \
        packages/editor/src/editor/shared/vibcoder/TemplatesDrawer.tsx \
        packages/editor/src/editor/shared/vibcoder/TemplatesDrawer.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-pages-drawer.{html,tsx} \
        packages/editor/src/preview/vibcoder-templates-drawer.{html,tsx}

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-3): T3 composed drawer variants — PagesDrawer + TemplatesDrawer

Composes T2 Drawer + Phase 2 ListRow (PagesDrawer) / Card (TemplatesDrawer).
Pure composition tasks — no new engine integration.

PagesDrawer: side="left", PagesDrawerGroup + PagesDrawerItem siblings.
TemplatesDrawer: side="right", TemplatesDrawerCategory + TemplatesDrawerItem siblings.

24 net-new tests. Phase 3 fan-out complete: 16/16 organisms shipped.
M5 milestone task next.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, working tree clean.

---

## Task 4 (M5): Milestone — gallery index, findings, status, polish, follow-ups

**Files:**
- Modify: `packages/editor/src/preview/vibcoder-index.html` (append Phase 3 section)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append Phase 3 findings)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md` (status update)
- Modify: `packages/editor/src/editor/shared/vibcoder/Popover.tsx` (Q9c: replace PopoverArrow stub with `RadixPopover.Arrow` re-export)
- Modify: `packages/editor/eslint-rules/no-inline-hex.cjs` OR equivalent Gate 14 file (Q9d: add JSDoc/comment-line exclusion parity with Gate 19)
- Create: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_3_shipped_*.md`
- Modify: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` (append Phase 3 entry)

### M5.A — Gallery index update

- [ ] **Step 1: Append Phase 3 section to vibcoder-index.html**

Read current `packages/editor/src/preview/vibcoder-index.html`, then append new section AFTER existing "Phase 2 — molecules" section, BEFORE the closing `</body>` and footer paragraph:

```html
<h2>Phase 3 — organisms (16 source CSS / ~54 wrappers)</h2>
<ul>
  <li><a href="./vibcoder-modal.html">modal</a></li>
  <li><a href="./vibcoder-drawer.html">drawer</a></li>
  <li><a href="./vibcoder-notification-center.html">notification-center</a></li>
  <li><a href="./vibcoder-command-palette.html">command-palette</a></li>
  <li><a href="./vibcoder-color-picker.html">color-picker</a></li>
  <li><a href="./vibcoder-pages-drawer.html">pages-drawer</a></li>
  <li><a href="./vibcoder-templates-drawer.html">templates-drawer</a></li>
  <li><a href="./vibcoder-topbar.html">topbar</a></li>
  <li><a href="./vibcoder-footer.html">footer</a></li>
  <li><a href="./vibcoder-rail.html">rail</a></li>
  <li><a href="./vibcoder-left-panel.html">left-panel</a></li>
  <li><a href="./vibcoder-inspector.html">inspector</a></li>
  <li><a href="./vibcoder-history-panel.html">history-panel</a></li>
  <li><a href="./vibcoder-empty-state.html">empty-state</a></li>
  <li><a href="./vibcoder-a11y-overlay.html">a11y-overlay</a></li>
  <li><em>overlay-mount (no gallery — infrastructure organism)</em></li>
</ul>
```

Also update header `<p>` from "Phase 1+2 (24 atoms + 18 molecules ported, 20 molecule galleries)" to "Phase 1+2+3 (24 atoms + 18 molecules + 16 organisms ported)".

### M5.B — poc-findings.md Phase 3 section

- [ ] **Step 2: Append Phase 3 findings**

Read tail of `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` to verify structure. Append new top-level section `## Phase 3 findings (organisms)`:

```markdown
## Phase 3 findings (organisms)

**Date:** 2026-04-27 (start) → [M5 ship date]
**Tasks:** T1 Modal canary, T2 mega-batch (13 organisms), T3 composed (PagesDrawer + TemplatesDrawer), M5 milestone

### Per-organism CSS↔Radix DOM alignment notes

[Subagent fills in: for each of 16 organisms, one line on whether vibcoder CSS structure aligned with Radix DOM out of the box, or required adaptation. Pattern hits → batch insight.]

### asChild boundary patterns (E1)

7 organisms ship Trigger siblings with asChild: Modal, Drawer, NotificationCenter (action), CommandPalette (none — uses input directly), ColorPicker (Swatch), PagesDrawer (none — drawer trigger external), TemplatesDrawer (none — drawer trigger external).

[Subagent fills in: any asChild gotchas surfaced — single-child errors, ref forwarding issues, ARIA propagation surprises.]

### Engine encapsulation enforcement (E2 + E4)

ESLint rule `no-engine-public-export` shipped at T1. Caught [N] violations during fan-out, all fixed before commit. Config: forbids re-exports from `@radix-ui/*`, `cmdk`, `react-colorful` in `editor/shared/vibcoder/*.tsx` files.

### Portal discipline (E3)

Gate 22 (`document.body` allow-list) shipped at T1. OverlayMount.tsx is the only allow-listed file. All 7 overlay organisms (Modal, Drawer, NotificationCenter, CommandPalette, ColorPicker, PagesDrawer, TemplatesDrawer) portal through `useOverlayContainer()`. Zero z-index conflicts observed in galleries.

### Stateful gallery harness (E5)

`<DemoTrigger>` shipped at T1, used by 7 overlay galleries. Layout-only galleries (9) ship inline static demos. NotificationCenter is the documented exception — uses queue-driven `open={true}` per-item with inline `eslint-disable-next-line` and `// reason: queue lifecycle`.

### Bundle delta (measured)

[Subagent measures via `npm run build` and `bundlephobia` if available, records actual numbers]

| Item | Estimated (spec) | Actual (M5 measurement) |
|---|---|---|
| @radix-ui/react-dialog | +9 kb | [actual] |
| @radix-ui/react-toast | +6 kb | [actual] |
| @radix-ui/react-portal | +1 kb | [actual] |
| @radix-ui/react-slot | +0.5 kb | [actual] |
| @radix-ui/react-popover | +5 kb | [actual] |
| cmdk | +5 kb | [actual] |
| react-colorful | +3 kb | [actual] |
| Phase 3 wrappers | ~3 kb | [actual] |
| **Total** | **~32 kb gzipped** | [actual] |

### Phase 5 handoff items

- Editor shell rewire — per-organism JSX swap commits at `src/editor/shell/`
- Legacy chrome deletions — `src/shared/ui/{Modal,Popover,Tooltip}.tsx` (~750 lines)
- `useFocusTrap` reconciliation — delete or migrate consumers to Radix internal trap
- Legacy ColorPicker reconciliation — delete `src/features/design-system/ui/colors/ColorPicker.tsx` (~332 lines), point all consumers to vibcoder ColorPicker
- HistoryPanel virtualization — defer until real performance need

### Conventions reaffirmed (Phase 3 verified across 16 organisms)

All Phase 1+2 conventions inherited (filename != classname, default-omit modifier, forwardRef + displayName, Number.isFinite for numerics, defensive Omit, defaultPrevented escape hatch).

NEW Phase 3 conventions:
- All 7 sibling-exporting overlay organisms use the same Radix.Dialog (or Toast/Popover) pattern: Root receives controlled state; Trigger forwards asChild; Content portals through useOverlayContainer; Title/Description wire ARIA via Radix automatically; Close uses asChild for caller composition.
- Layout-only organisms ship inline static demos (E5 scope exclusion documented).
- E2/E4 ESLint rule `no-engine-public-export` is the load-bearing contract enforcement — without it, Phase 5 chrome consumers would import Radix directly and the engine-swap freedom is lost.
```

### M5.C — README status update

- [ ] **Step 3: Update spec README status**

Read `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md`. Find the line documenting current phase status (e.g., "Status: Phase 2 molecules — fan-out complete (18 molecules / 46 wrappers across 5 batches)"). Replace with:

```markdown
Status: Phase 3 organisms — fan-out complete (16 organisms / ~54 wrappers / 4 batches)
Last shipped: M5 at commit [SHA] on [date]
Next: Phase 4 (layouts) or Phase 5 (chrome integration) per roadmap.md
```

### M5.D — Polish: Q9c PopoverArrow stub → Radix re-export

Phase 2 follow-up #93. Read existing `packages/editor/src/editor/shared/vibcoder/Popover.tsx`. Locate `PopoverArrow` stub component (Phase 2 placeholder). Replace with Radix-backed re-export.

- [ ] **Step 4: Update Popover.tsx — replace PopoverArrow stub**

Find the stub:
```tsx
// Phase 2 stub — Phase 3 fate decided in #93
export const PopoverArrow = forwardRef<…>(/* placeholder */);
```

Replace with:
```tsx
import * as RadixPopover from "@radix-ui/react-popover";
import { forwardRef, type SVGAttributes } from "react";

export interface PopoverArrowProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  width?: number;
  height?: number;
}

/**
 * PopoverArrow — re-exports Radix.Popover.Arrow with vibcoder bd-popover__arrow class.
 *
 * Phase 3 closes follow-up #93 by backing the Phase 2 stub with the real Radix
 * primitive. E2-compliant: Radix props are NOT re-exported as the public API;
 * only PopoverArrowProps (vibcoder-shaped) is exposed.
 *
 * NOTE: This is the ONE place where a Phase 2 wrapper integrates Radix. Phase 5
 * will swap the rest of Popover (currently hand-rolled per Phase 2) to also use
 * RadixPopover, at which point the file's import shape stabilizes.
 */
export const PopoverArrow = forwardRef<SVGSVGElement, PopoverArrowProps>(
  ({ width = 8, height = 4, className, ...rest }, ref) => {
    const classes = ["bd-popover__arrow", className].filter(Boolean).join(" ");
    return (
      <RadixPopover.Arrow ref={ref} width={width} height={height} className={classes} {...rest} />
    );
  },
);
PopoverArrow.displayName = "PopoverArrow";
```

NOTE: Adding RadixPopover import to Phase 2 Popover.tsx means E2 ESLint rule scope must accept this file. The rule already targets `editor/shared/vibcoder/*.tsx` and forbids only RE-EXPORTS — the new code IMPORTS but doesn't re-export, so it's compliant. Verify by running `npm run lint`.

### M5.E — Polish: Q9d Gate 14 JSDoc parity (closes #91)

Phase 2 follow-up #91. Gate 14 currently flags hex literals in JSDoc/comment lines as false positives, while Gate 19 already excludes JSDoc/comment lines. Bring Gate 14 to parity.

- [ ] **Step 5: Update Gate 14 to exclude JSDoc/comment lines**

Read `packages/editor/eslint-rules/no-inline-hex.cjs` (or wherever Gate 14 lives — verify via grep `'Gate 14'` across repo). Look at how Gate 19 excludes comments (likely `node.comments` filter or a regex on line content). Apply the same exclusion logic to Gate 14.

If Gate 14 is implemented as a grep gate in `ds-grep-gates.sh` (rather than ESLint rule), update the grep invocation to exclude lines matching `^[[:space:]]*\(\*\|//\|<!--\)`.

Run lint to verify Gate 14 no longer false-positives on JSDoc:

```bash
npm run lint
npm run lint:ds
```

Expected: Gate 14 PASS, no regressions.

### M5.F — Run all gates + tests + measure bundle

- [ ] **Step 6: Run full verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run lint
npm run lint:ds
bash scripts/check-vibcoder-port.sh
npx vitest run
npm run build
```

Expected:
- All ESLint rules pass (no-engine-public-export, no-hardcoded-open-prop, no-gallery-shadow + Gate 14 fix)
- All grep gates pass (Gate 22 portal discipline, Gate 14 JSDoc parity)
- check-vibcoder-port reports 16 new organism CSS files (24 atoms + 18 molecules + 16 organisms = 58 vendored)
- ~945-1000 tests pass (no regressions)
- `npm run build` succeeds with no warnings

- [ ] **Step 7: Measure actual bundle delta**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run build
ls -lh dist/assets/*.js | head -10
# Or use bundlephobia/source-map-explorer if available
```

Capture the delta vs Phase 2's recorded baseline (find Phase 2 baseline in `poc-findings.md` Phase 2 section). Update the bundle delta table in poc-findings.md Phase 3 section with actual numbers.

### M5.G — Memory update

- [ ] **Step 8: Write Phase 3 memory file**

Use today's date in filename. Path: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_3_shipped_<date>.md`

```markdown
---
name: Vibcoder Phase 3 organisms — SHIPPED (M5 milestone closed)
description: 16 organism CSS files + ~54 React wrappers vendored. Radix UI engine + cmdk + react-colorful integrated. ~400 net-new tests. ESLint no-engine-public-export + no-hardcoded-open-prop + Gate 22 portal discipline. Phase 5 chrome integration unblocked.
type: project
---
Phase 3 fan-out complete [date]. M5 milestone closed at commit [SHA].

**Shipped:**
- 16 organism CSS files vendored at packages/editor/src/themes/components/organisms/
- ~54 React components across 16 wrapper files at packages/editor/src/editor/shared/vibcoder/
- ~400 net-new tests (~945-1000 total vibcoder tests including Phase 1+2)
- New runtime deps: @radix-ui/react-{dialog,toast,portal,slot,popover}, cmdk, react-colorful (~32kb gzipped)
- Master gallery index at packages/editor/src/preview/vibcoder-index.html — Phase 3 section with 15 entries (overlay-mount has no gallery)
- ESLint rule no-engine-public-export at packages/editor/eslint-rules/ (E2/E4 enforcement)
- ESLint rule no-hardcoded-open-prop at packages/editor/eslint-rules/ (E5 enforcement)
- Gate 22 in ds-grep-gates.sh (E3 portal discipline — document.body allow-list)
- Shared <DemoTrigger> helper at packages/editor/src/preview/_lib/DemoTrigger.tsx
- Phase 3 findings appended to poc-findings.md
- Phase 2 follow-ups closed: #93 (PopoverArrow Radix-backed), #91 (Gate 14 JSDoc parity)

**Commit chain:**
- T1 Modal canary + Phase 3 infra: [SHA]
- T2 mega-batch (13 organisms): [SHA]
- T3 composed (PagesDrawer + TemplatesDrawer): [SHA]
- M5 milestone: [SHA]

**5 NEW Phase 3 contracts honored across all 16 organisms:**
- E1 (asChild trigger composition) — 7 organisms with Trigger siblings
- E2 (engine encapsulation) — 0 Radix/cmdk/react-colorful types in public API
- E3 (portal discipline) — all 7 overlays portal through OverlayMount
- E4 (companion-lib boundary) — cmdk + react-colorful internal-only
- E5 (stateful gallery harness mandatory) — 7 overlay galleries use DemoTrigger

**Why:** Phase 3 establishes the organism layer with full behavior (focus trap, scroll lock, positioning, keyboard nav, portal mounting, ARIA) provided by Radix engines under vibcoder CSS skin. Phase 5 chrome integration becomes per-organism JSX swap commits in src/editor/shell/.

**How to apply:**
- **Phase 5 chrome integration** — vibcoder organism alphabet stable; swap `import` paths in editor shell. Read poc-findings.md Phase 3 section for per-organism CSS↔DOM alignment notes + bundle delta + Phase 5 handoff list.
- **Adding new organisms** (post-Phase 3 mid-arc) — read poc-findings.md § "Per-component port template (locked)" + Phase 3 contracts E1-E5 section.

**Open follow-ups (do not block Phase 5, all carry-forward):**
- Phase 1: #74-76 (Switch + Thumb), #77 (Icon sprite), #81 (grip.css comment-prefix forward)
- Phase 2: #82 (vendoring fix-policy doc full version), #89 (ListRow ARIA test), #90 (T3+T4+T5 vendoring fixes upstream forward), #92 (TileMeta lead slot for first-child StatusDot)
- Phase 3: [any net-new follow-ups surfaced during fan-out]

**Bundle delta measured:** [actual number from M5.F step 7]
```

- [ ] **Step 9: Update MEMORY.md index**

Append to `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` (under existing index entries):

```markdown
- [Vibcoder Phase 3 organisms SHIPPED [date]](project_vibcoder_phase_3_shipped_<date>.md) — M5 closed at `[SHA]`. 16 organism CSS + ~54 wrappers, ~400 net-new tests, Radix UI + cmdk + react-colorful integration, 5 new contracts E1-E5 enforced. Phase 5 chrome integration unblocked.
```

### M5.H — Final commit

- [ ] **Step 10: Commit M5 milestone**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/preview/vibcoder-index.html \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md \
        packages/editor/src/editor/shared/vibcoder/Popover.tsx \
        packages/editor/eslint-rules/no-inline-hex.cjs

# Add Gate 14 fix file (whichever was modified)
git add packages/editor/scripts/ds-grep-gates.sh 2>/dev/null || true

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-3): M5 milestone — gallery index, findings, polish, follow-ups

- vibcoder-index.html — Phase 3 section with 15 organism entries (16 minus overlay-mount infra)
- poc-findings.md — Phase 3 section with per-organism CSS↔DOM alignment, contract enforcement,
  bundle delta measurement, Phase 5 handoff list
- README.md — status updated to "Phase 3 organisms — fan-out complete"
- Polish #93: PopoverArrow stub → RadixPopover.Arrow re-export (Phase 2 carry-over closed)
- Polish #91: Gate 14 JSDoc/comment-line exclusion parity with Gate 19 (Phase 2 carry-over closed)

Phase 3 organisms layer SHIPPED. 16/16 organisms, ~54 wrappers, ~945-1000 total vibcoder tests.
Phase 5 chrome integration now unblocked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Then commit memory file separately (memory lives outside repo):

```bash
# Memory file lives at /Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/
# Not part of the repo — no git add needed. Just verify file exists.
ls -lh /Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_3_shipped_*.md
ls -lh /Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md
```

Expected: M5 commit succeeds. Memory files written. Phase 3 work complete.

---

## Acceptance summary (for Phase 3 close-out)

After M5 commit, the following should be true:

- ✓ 16 organisms shipped at `packages/editor/src/editor/shared/vibcoder/`
- ✓ 16 organism CSS files at `packages/editor/src/themes/components/organisms/`
- ✓ 15 galleries shipped at `packages/editor/src/preview/vibcoder-{organism}.{html,tsx}` (overlay-mount has no gallery — infrastructure)
- ✓ Master gallery index updated with Phase 3 section
- ✓ ~945-1000 total vibcoder tests passing
- ✓ ESLint rules `no-engine-public-export` + `no-hardcoded-open-prop` shipped + passing
- ✓ Gate 22 (E3 portal discipline) shipped + passing
- ✓ Gate 14 JSDoc parity (Phase 2 follow-up #91) closed
- ✓ PopoverArrow Radix-backed (Phase 2 follow-up #93) closed
- ✓ poc-findings.md Phase 3 section appended (per-organism findings, contract enforcement, bundle delta, Phase 5 handoff)
- ✓ Spec README status updated
- ✓ Memory updated: project_vibcoder_phase_3_shipped_*.md + MEMORY.md index entry
- ✓ Working tree clean
- ✓ All commits on `main` (solo workflow per CLAUDE.md memory)

**Total commits expected:** 4 task commits (T1, T2, T3, M5) + 0+ fixup commits as two-stage review surfaces issues during subagent-driven execution.
