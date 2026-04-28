# Vibcoder Phase 4 (Revival) — Layout Primitives — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 7 layout primitives (Stack, Cluster, Center, Grid, Frame, Switcher, SidebarShell) that were deferred from original Phase 4 and never landed during Phase 5 chrome integration. Manifest CSS already exists in `docs/reference/vibcoder/components/layouts/`. Vendor pipeline brings CSS to `src/themes/components/layouts/`. Per-primitive: write React forwardRef wrapper + test + gallery preview + barrel export. Chrome consumer migration deferred to follow-up arcs (touch-as-needed pattern).

**Architecture:** Manifest source = `docs/reference/vibcoder/components/layouts/{name}.css` (`bdr-*` classes). Vendoring pipeline (`bash scripts/vibcoder-vendor.sh`) runs 4 steps: bundle pin → codemod 1 (`bdr-*` → `bd-*`) → codemod 2 (token folds) → codemod 3 (alias bridge). Output lands at `src/themes/components/layouts/{name}.css` with `bd-*` classes. Wrappers at `src/editor/shared/vibcoder/{Component}.tsx` follow established forwardRef + className-compose pattern (see `Divider.tsx` for canonical reference). Galleries at `src/preview/vibcoder-{component}.tsx`.

**Tech Stack:** React 18 + TypeScript + Emotion (existing chrome). NO new external deps — layouts are pure CSS+React. Vibcoder vendoring pipeline already in repo.

---

## Pre-flight context

**Why now:** Phase 5 chrome integration shipped 2026-04-28 plus all Buckets A/B1/B2/B3 closed 2026-04-30. Editor inline `display:flex; flexDirection: column; gap: 8` patterns repeat in 100+ files. Stack/Cluster alone replace the 50 most common cases. Highest-leverage remaining DS gap before Phase 6 visual regression locks baselines.

**Inventory verified 2026-04-29:**
- 7 layout CSS files in manifest source (`docs/reference/vibcoder/components/layouts/`): center, cluster, frame, grid, sidebar-shell, stack, switcher
- 0 CSS files vendored (`src/themes/components/layouts/` empty)
- 0 wrappers in `src/editor/shared/vibcoder/` for Stack, Cluster, Center, Grid, Frame, Switcher, SidebarShell
- Vendor pipeline at `packages/editor/scripts/vibcoder-vendor.sh` (proven across atoms/molecules/organisms phases)
- Manifest classes use `bdr-*` prefix; codemod 1 in pipeline renames to `bd-*` (Gate 19 enforces no `bdr-*` leaks)

**Open contract questions (resolve in T1 before code):**
- **Q1:** Does manifest layout CSS need additional codemod handling beyond the standard 3? **Default answer:** No — atoms/molecules/organisms used same pipeline, layouts should slot in identically. T1 verifies by running pipeline and checking output.
- **Q2:** SidebarShell grammar lock — does the wrapper enforce zone widths via CSS variables (advisable, allows tokens) or hardcoded numeric props? **Default answer:** CSS variables `--bd-rail-w`, `--bd-sidebar-w`, `--bd-inspector-w` with chrome-axiom defaults; wrapper props for slot content only (rail, sidebar, main, inspector). DESIGN.md §Color/Token namespace contract applies.
- **Q3:** Switcher breakpoint — fixed 640px or token-driven? **Default answer:** vendored CSS likely defines via `@container` query or CSS variable. Read manifest CSS in T1 and follow whatever it ships.
- **Q4:** Does Phase 4 revival include a chrome consumer migration codemod? **Default answer:** NO — codemod scope risk + drift trap per prior bucket lessons. Chrome migration deferred to "touch-as-needed" pattern. Inline-flex sites get migrated when files are edited for other reasons.

---

## Task breakdown

### Task 1: Run vendor pipeline + verify CSS lands

**Files:**
- Run: `packages/editor/scripts/vibcoder-vendor.sh`
- Verify: `packages/editor/src/themes/components/layouts/{stack,cluster,center,grid,frame,switcher,sidebar-shell}.css`
- Verify: `packages/editor/src/themes/components/_aliases.generated.css` (alias bridge updated)

- [ ] **Step 1: Pre-flight check pipeline tooling**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
ls scripts/vibcoder-vendor.sh scripts/vibcoder-bundle-pin.mjs scripts/vibcoder-codemod-1.mjs scripts/vibcoder-codemod-2.mjs scripts/vibcoder-codemod-3.mjs
```

All 5 files must exist. If any missing, STOP and escalate.

- [ ] **Step 2: Run vibcoder vendor pipeline**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && bash packages/editor/scripts/vibcoder-vendor.sh
```

Expected output: 4 step banners (bundle pin → codemod 1 → 2 → 3) + final "vibcoder-vendor: complete". Non-zero exit = STOP, report.

- [ ] **Step 3: Verify 7 layout CSS files landed**

```bash
ls /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/themes/components/layouts/
```

Expected: `center.css`, `cluster.css`, `frame.css`, `grid.css`, `sidebar-shell.css`, `stack.css`, `switcher.css`. If any missing, the pipeline does not yet handle layouts — escalate.

- [ ] **Step 4: Verify no `bdr-*` leaks**

```bash
grep -rEn "bdr-(stack|cluster|center|grid|frame|switcher|sidebar-shell)" packages/editor/src/themes/components/layouts/
```

Expected: empty (codemod 1 renames `bdr-*` → `bd-*`). If hits, codemod 1 has a gap for layouts — fix codemod or escalate.

- [ ] **Step 5: Run gates to confirm baselines stable**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | tail -10
```

Expected: 25/25 green. New CSS may shift Gate 19 count (should still pass if codemod 1 worked).

- [ ] **Step 6: Commit pipeline output**

```bash
git add packages/editor/src/themes/components/layouts/ packages/editor/src/themes/components/_aliases.generated.css packages/editor/scripts/.bundle-version 2>/dev/null
git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-4): T1 vendor 7 layout primitive CSS files

Brings manifest layout CSS (Stack, Cluster, Center, Grid, Frame, Switcher,
SidebarShell) into src/themes/components/layouts/ via existing vendor
pipeline. Codemod 1 applied bdr-* → bd-* renames; alias bridge regenerated.
Wrappers + tests + galleries follow in T2-T6.

Refs: docs/superpowers/plans/2026-04-29-vibcoder-phase-4-layouts.md
EOF
)"
```

---

### Task 2: Stack wrapper + test + gallery (PILOT)

**Files:**
- Create: `packages/editor/src/editor/shared/vibcoder/Stack.tsx`
- Create: `packages/editor/src/editor/shared/vibcoder/Stack.test.tsx`
- Create: `packages/editor/src/preview/vibcoder-stack.tsx`
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts`

**Pattern reference:** `src/editor/shared/vibcoder/Divider.tsx` (forwardRef + className compose).

- [ ] **Step 1: Read vendored CSS**

```bash
cat /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/themes/components/layouts/stack.css
```

Note exact class names + modifiers shipped (e.g., `bd-stack`, `bd-stack--xs/sm/md/lg/xl`, `bd-stack--separator`, `bd-stack--horizontal` if present).

- [ ] **Step 2: Write the wrapper**

Create `Stack.tsx`:

```tsx
/**
 * Vibcoder Stack — vertical/horizontal layout primitive.
 *
 * Renders the `bd-stack` rule from src/themes/components/layouts/stack.css.
 * Replaces inline `display:flex; flex-direction:column; gap:Npx` patterns
 * across editor chrome.
 *
 * Default direction = vertical (no modifier emitted).
 * `direction="horizontal"` emits `bd-stack--horizontal` (only if vendored CSS
 * ships it — verify in stack.css).
 *
 * Gap modifiers: xs/sm/md/lg/xl map to vendored bd-stack--{size} classes.
 * Default = "md" (omits modifier — matches vendored .bd-stack base gap).
 *
 * `separator` enables hairline divider between adjacent children via
 * `bd-stack--separator > * + *` selector in vendored CSS.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type StackDirection = "vertical" | "horizontal";
export type StackGap = "xs" | "sm" | "md" | "lg" | "xl";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Layout direction. Default = vertical (no modifier). */
  direction?: StackDirection;
  /** Token gap. Default = "md" (no modifier — matches CSS base). */
  gap?: StackGap;
  /** When true, draws hairline border between adjacent children. */
  separator?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ direction = "vertical", gap = "md", separator = false, className, children, ...rest }, ref) => {
    const classes = [
      "bd-stack",
      direction === "horizontal" && "bd-stack--horizontal",
      gap !== "md" && `bd-stack--${gap}`,
      separator && "bd-stack--separator",
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
Stack.displayName = "Stack";
```

- [ ] **Step 3: Write tests**

Create `Stack.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stack } from "./Stack";

describe("vibcoder Stack wrapper", () => {
  it("renders <div> with bd-stack class", () => {
    const { container } = render(<Stack>child</Stack>);
    const el = container.firstElementChild!;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-stack");
  });

  it("OMITS modifier classes for all defaults (vertical/md/no-separator)", () => {
    const { container } = render(<Stack>x</Stack>);
    const cls = container.firstElementChild!.className;
    expect(cls).not.toContain("bd-stack--horizontal");
    expect(cls).not.toContain("bd-stack--md");
    expect(cls).not.toContain("bd-stack--separator");
  });

  it("emits bd-stack--horizontal when direction=horizontal", () => {
    const { container } = render(<Stack direction="horizontal">x</Stack>);
    expect(container.firstElementChild!.className).toContain("bd-stack--horizontal");
  });

  it("emits bd-stack--{size} for non-default gaps", () => {
    for (const g of ["xs", "sm", "lg", "xl"] as const) {
      const { container } = render(<Stack gap={g}>x</Stack>);
      expect(container.firstElementChild!.className).toContain(`bd-stack--${g}`);
    }
  });

  it("emits bd-stack--separator when separator=true", () => {
    const { container } = render(<Stack separator>x</Stack>);
    expect(container.firstElementChild!.className).toContain("bd-stack--separator");
  });

  it("merges caller className", () => {
    const { container } = render(<Stack className="custom-class">x</Stack>);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain("bd-stack");
    expect(cls).toContain("custom-class");
  });

  it("forwards ref", () => {
    let captured: HTMLDivElement | null = null;
    render(<Stack ref={(el) => (captured = el)}>x</Stack>);
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it("renders children", () => {
    const { getByText } = render(<Stack><span>hello</span></Stack>);
    expect(getByText("hello")).toBeTruthy();
  });
});
```

- [ ] **Step 4: Write gallery preview**

Create `vibcoder-stack.tsx` (follow `vibcoder-divider.tsx` shape — read it as reference if needed):

```tsx
import { Stack } from "@/editor/shared/vibcoder";
import { galleryStyles } from "./_galleryStyles";

const Tile = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "var(--bd-surface-2)", padding: 8, borderRadius: 4 }}>
    {children}
  </div>
);

export default function VibcoderStackGallery() {
  return (
    <div style={galleryStyles.page}>
      <h1 style={galleryStyles.h1}>Stack — vertical/horizontal layout primitive</h1>

      <h2 style={galleryStyles.h2}>Vertical (default)</h2>
      <Stack>
        <Tile>One</Tile>
        <Tile>Two</Tile>
        <Tile>Three</Tile>
      </Stack>

      <h2 style={galleryStyles.h2}>Horizontal</h2>
      <Stack direction="horizontal">
        <Tile>One</Tile>
        <Tile>Two</Tile>
        <Tile>Three</Tile>
      </Stack>

      <h2 style={galleryStyles.h2}>Gap variants</h2>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((g) => (
        <div key={g}>
          <h3 style={galleryStyles.h3}>gap={g}</h3>
          <Stack gap={g}>
            <Tile>One</Tile>
            <Tile>Two</Tile>
            <Tile>Three</Tile>
          </Stack>
        </div>
      ))}

      <h2 style={galleryStyles.h2}>With separator</h2>
      <Stack separator>
        <Tile>One</Tile>
        <Tile>Two</Tile>
        <Tile>Three</Tile>
      </Stack>
    </div>
  );
}
```

- [ ] **Step 5: Update barrel export**

In `packages/editor/src/editor/shared/vibcoder/index.ts`, add (alphabetic order):

```ts
export { Stack, type StackProps, type StackDirection, type StackGap } from "./Stack";
```

- [ ] **Step 6: Verify**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/shared/vibcoder/Stack.test.tsx
npx tsc --noEmit 2>&1 | grep -E "^src/" | wc -l | tr -d ' '
bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

Expected: vitest 8/8 pass, tsc baseline 71 stable, 25/25 gates green.

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/editor/shared/vibcoder/Stack.tsx packages/editor/src/editor/shared/vibcoder/Stack.test.tsx packages/editor/src/editor/shared/vibcoder/index.ts packages/editor/src/preview/vibcoder-stack.tsx
git commit -m "feat(vibcoder-phase-4): T2 Stack wrapper + tests + gallery

Stack primitive — vertical/horizontal layout with token gap modifiers
and optional separator. forwardRef + className compose pattern matches
Divider.tsx canonical shape.

Refs: docs/superpowers/plans/2026-04-29-vibcoder-phase-4-layouts.md"
```

---

### Task 3: Cluster wrapper + test + gallery

**Files:** Same shape as T2 — `Cluster.tsx`, `Cluster.test.tsx`, `vibcoder-cluster.tsx`, barrel update.

**API:**

```ts
export type ClusterAlign = "start" | "center" | "end" | "baseline";
export type ClusterGap = "xs" | "sm" | "md" | "lg" | "xl";

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  gap?: ClusterGap;            // default "md"
  align?: ClusterAlign;        // default "center" (matches vendored base)
}
```

**Class composition:**
- Base: `bd-cluster`
- `gap !== "md"` → `bd-cluster--{gap}`
- `align !== "center"` → `bd-cluster--align-{align}`

**Tests cover:** default class, gap variants, align variants, ref forwarding, className merge.

**Steps:**
- [ ] Read vendored CSS to confirm class shapes
- [ ] Write wrapper using same pattern as Stack
- [ ] Write tests (≥6 cases, mirror Stack test structure)
- [ ] Write gallery showing default + 4 gap variants + 4 align variants
- [ ] Update barrel
- [ ] Verify (vitest, tsc, gates)
- [ ] Commit: `feat(vibcoder-phase-4): T3 Cluster wrapper + tests + gallery`

---

### Task 4: Center + Grid + Frame batch (3 simpler primitives)

**Why batched:** All 3 are mechanically simpler than Stack/Cluster (smaller modifier surface, no align/gap matrix). Batch shippable.

**Files:** 3 wrappers + 3 tests + 3 galleries + 1 barrel update commit.

**Center API:**
```ts
export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  page?: boolean;              // bd-center--page (min-height 100vh)
  inline?: boolean;            // bd-center--inline (inline-flex)
}
```

**Grid API:**
```ts
export type GridGap = "xs" | "sm" | "md" | "lg" | "xl";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: number | "auto-fit" | "auto-fill";  // numeric → bd-grid--cols-N (verify CSS); auto-* → bd-grid--auto-fit/-fill
  minColWidth?: "xs" | "sm" | "md" | "lg";    // for auto-fit/-fill
  gap?: GridGap;
}
```

**Frame API:**
```ts
export type FrameRatio = "1:1" | "4:3" | "16:9" | "21:9";
export type FrameFit = "cover" | "contain";

export interface FrameProps extends HTMLAttributes<HTMLDivElement> {
  ratio: FrameRatio;           // required, no default — composition requires explicit ratio
  fit?: FrameFit;              // default "cover"
}
```

**Note for Frame:** vendored CSS uses CSS variables `--bd-frame-ratio` or class modifiers — read CSS first and follow whatever it ships.

**Steps:**
- [ ] Read vendored CSS for all 3
- [ ] Write 3 wrappers
- [ ] Write 3 test files (≥5 cases each)
- [ ] Write 3 gallery files
- [ ] Update barrel (3 exports)
- [ ] Verify
- [ ] Commit: `feat(vibcoder-phase-4): T4 Center + Grid + Frame wrappers + tests + galleries`

---

### Task 5: Switcher wrapper + test + gallery

**Why separate task:** Switcher is breakpoint-aware (wraps to vertical at narrow widths). Vendored CSS likely uses `@container` query or `@media` query. Testing requires verifying the *class* output, not the rendered breakpoint behavior (that's CSS engine concern).

**API:**
```ts
export interface SwitcherProps extends HTMLAttributes<HTMLDivElement> {
  threshold?: "sm" | "md" | "lg";   // breakpoint at which to switch direction
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
}
```

**Steps:**
- [ ] Read vendored CSS — note breakpoint mechanism
- [ ] Write wrapper (class compose only — rendering behavior is CSS)
- [ ] Write tests (≥4 cases — class output, no DOM-resize testing)
- [ ] Write gallery with 3-4 example groups
- [ ] Update barrel
- [ ] Verify
- [ ] Commit: `feat(vibcoder-phase-4): T5 Switcher wrapper + tests + gallery`

---

### Task 6: SidebarShell wrapper + test + gallery (most complex)

**Why separate + most complex:** SidebarShell composes 4 named slots (rail, sidebar, main, inspector). Grammar is locked per DESIGN.md — caller cannot override zone widths. Wrapper enforces via CSS variables, props are slot content only.

**API:**
```ts
export interface SidebarShellProps {
  rail?: React.ReactNode;        // 60px column
  sidebar?: React.ReactNode;     // 240/320px column (controlled via bd-sidebar-shell--wide)
  inspector?: React.ReactNode;   // 300px column
  children: React.ReactNode;     // main canvas content
  /** When true, sidebar is 320px instead of 240. Default false. */
  wideSidebar?: boolean;
}
```

**Render shape:**
```tsx
<div className={`bd-sidebar-shell${wideSidebar ? ' bd-sidebar-shell--wide' : ''}`}>
  {rail && <div className="bd-sidebar-shell__rail">{rail}</div>}
  {sidebar && <div className="bd-sidebar-shell__sidebar">{sidebar}</div>}
  <div className="bd-sidebar-shell__main">{children}</div>
  {inspector && <div className="bd-sidebar-shell__inspector">{inspector}</div>}
</div>
```

**Test coverage:**
- All slots populated → 4 child elements
- Optional slots omitted → corresponding element absent (rail/sidebar/inspector are conditional)
- main always renders
- wideSidebar prop emits modifier class
- Slot ordering preserved (rail, sidebar, main, inspector — left to right)

**Steps:**
- [ ] Read vendored `sidebar-shell.css` — confirm grid template structure + wide modifier
- [ ] Write wrapper (no forwardRef — composition wrapper, refs targeted at slots if needed later)
- [ ] Write tests (≥6 cases — each slot, all-slots, wide modifier, no-slots fallback)
- [ ] Write gallery showing default + wide-sidebar + minimal (no rail/inspector) variants
- [ ] Update barrel
- [ ] Verify
- [ ] Commit: `feat(vibcoder-phase-4): T6 SidebarShell wrapper + tests + gallery`

#### SHIPPED (2026-04-29) — implementation note

> The original T6 spec above described a 4-slot grammar (rail / sidebar / main /
> inspector + `wideSidebar` modifier) anticipating a full editor shell. The
> vendored CSS at `packages/editor/src/themes/components/layouts/sidebar-shell.css`
> ships a simpler **2-slot primitive** (sidebar + main) with width / side /
> bordered modifiers. The shipped wrapper at
> `packages/editor/src/editor/shared/vibcoder/SidebarShell.tsx` (commit
> `a9bfdbb`) follows the vendored grammar:
>
> ```ts
> export interface SidebarShellProps extends HTMLAttributes<HTMLDivElement> {
>   sidebar: ReactNode;             // required
>   children: ReactNode;            // required (main slot)
>   width?: "sm" | "md" | "lg";     // 220 / 280 / 320 px, default "md"
>   side?: "left" | "right";        // default "left"
>   bordered?: boolean;              // hairline divider sidebar↔main
> }
> ```
>
> 4-zone editor shell remains an open follow-up. AquibraStudio.tsx stays a
> hand-rolled 4-zone CSS Grid (rail + sidebar + main + inspector) — could
> compose `SidebarShell` + `Stack` + a top rail later if the migration value
> outweighs the grammar lock-in. The 2-slot primitive is sufficient for asset
> library, history panel, settings, and inspector use cases that motivated the
> task.

---

### Task 7: Manifest + roadmap + verification

**Files:**
- Modify: `docs/reference/vibcoder/components/COMPONENTS.md` (mark 7 layouts SHIPPED)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md` (Phase 4 status DEFERRED → SHIPPED)
- Verify: full editor test suite passes

- [ ] **Step 1: Update manifest**

Edit COMPONENTS.md to mark each layout as shipped (status column). Search for the table row per component and flip status.

- [ ] **Step 2: Update roadmap Phase 4 section**

Edit `roadmap.md` lines around 305-316. Change "DEFERRED" header to "SHIPPED 2026-04-29" + add commit table.

- [ ] **Step 3: Run full editor verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit 2>&1 | grep -E "^src/" | wc -l | tr -d ' '
bash scripts/ds-grep-gates.sh 2>&1 | tail -10
npx vitest run src/editor/shared/vibcoder/ 2>&1 | tail -10
```

Expected: tsc 71, gates 25/25, all vibcoder tests pass.

- [ ] **Step 4: Ratchet any improved gate baselines**

If Gate 11/12/13/14 dropped (likely no impact since wrappers don't replace inline-flex — that's a follow-up arc), update `.chrome-axioms-baseline`.

- [ ] **Step 5: Commit doc updates**

```bash
git add docs/reference/vibcoder/components/COMPONENTS.md docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md packages/editor/scripts/.chrome-axioms-baseline
git commit -m "docs(vibcoder-phase-4): T7 manifest + roadmap status flip

7 layout primitives shipped: Stack, Cluster, Center, Grid, Frame,
Switcher, SidebarShell. Phase 4 status DEFERRED → SHIPPED 2026-04-29.

Refs: docs/superpowers/plans/2026-04-29-vibcoder-phase-4-layouts.md"
```

---

### Task 8: Phase 4 close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append Phase 4 revival section)
- Create: memory file at home-dir
- Modify: MEMORY.md index

- [ ] **Step 1: Append findings to poc-findings.md**

Section structure:
- "What shipped" table (T1-T7 commits + LOC delta)
- "Why now" (Phase 5 closure + leverage rationale)
- "API design decisions" (default modifier omission for compactness, forwardRef pattern, SidebarShell grammar lock)
- "Inventory undercount note" (5th potential recurrence — verify pre-flight grep matches actual CSS files vendored)
- "Recommendation" (chrome consumer migration deferred to touch-as-needed)

- [ ] **Step 2: Write memory file**

Path: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_4_layouts_shipped_20260429.md`

Frontmatter:
```yaml
---
name: Vibcoder Phase 4 layouts shipped 2026-04-29
description: 7 layout primitives (Stack/Cluster/Center/Grid/Frame/Switcher/SidebarShell) shipped — biggest editor inline-flex replacement gap closed
type: project
---
```

Body covers: ship state, why deferred originally, why revived, API patterns, follow-up arcs (chrome consumer migration via touch-as-needed).

- [ ] **Step 3: Update MEMORY.md index**

Add line after the B3 entry:

```markdown
- [Vibcoder Phase 4 layouts shipped 2026-04-29](project_vibcoder_phase_4_layouts_shipped_20260429.md) — 7 layout primitives (Stack/Cluster/Center/Grid/Frame/Switcher/SidebarShell). Closes biggest editor inline-flex gap. Chrome consumer migration deferred to touch-as-needed.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md
git commit -m "docs(vibcoder-phase-4): T8 close-out — Phase 4 layouts SHIPPED

7 layout primitives shipped + manifest/roadmap updated + memory written.
Chrome consumer migration of inline-flex sites deferred to touch-as-needed
pattern (codemod scope risk avoided per Bucket B3 lesson on shorthand
expansion vs skip-with-warn).

Refs: docs/superpowers/plans/2026-04-29-vibcoder-phase-4-layouts.md"
```

---

## Risk register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vendor pipeline does not handle layouts/ subfolder | Low | T1 Step 4 verifies; if gap, escalate to fix codemod 1 before continuing |
| `bdr-*` → `bd-*` rename misses some classes | Low | Codemod 1 has been validated across atoms/molecules/organisms — same pattern. T1 Step 4 grep confirms. |
| Wrappers tsc-fail due to Emotion or React 18 typing | Low | Pattern matches Divider.tsx canonical shape — proven |
| SidebarShell grammar lock conflicts with current AquibraStudio.tsx CSS | Med | T6 verifies wrapper renders standalone; AquibraStudio migration is a follow-up arc, not in scope |
| Switcher tests are flaky due to viewport-resize logic | Low | Test class output, not rendered breakpoint behavior — viewport resize is CSS engine concern |
| Gallery files break dev preview index | Low | Existing pattern (`vibcoder-divider.tsx` etc.) proven; index auto-discovery if any |
| Naming collision: `Center`/`Frame` already exist somewhere in editor | Low | Pre-flight grep before T4 confirms |
| 5th inventory undercount recurrence | Med | T1 Step 3 grep shows actual files vendored; cross-check against expected 7 |

---

## Success conditions

- [ ] All 7 layout CSS files vendored at `src/themes/components/layouts/`
- [ ] All 7 React wrappers shipped at `src/editor/shared/vibcoder/`
- [ ] All 7 wrappers have ≥4 tests passing each
- [ ] All 7 gallery preview files at `src/preview/`
- [ ] Barrel exports updated (7 new exports + types)
- [ ] tsc 71 stable
- [ ] All 25 DS gates green (Gate 19 verifies no `bdr-*` leaks)
- [ ] Vibcoder vitest suite passes
- [ ] COMPONENTS.md manifest reflects SHIPPED status for all 7
- [ ] Roadmap Phase 4 flipped DEFERRED → SHIPPED 2026-04-29
- [ ] poc-findings.md has Phase 4 revival section
- [ ] Memory file written; MEMORY.md updated

---

## Out of scope (explicit deferrals)

- **Chrome consumer migration of inline-flex sites.** Codemod scope risk per B3 lesson. Migration happens organically when files are touched for other reasons.
- **Phase 6 visual regression infra.** Layouts ship without snapshots; Phase 6 picks up the full primitive set including layouts when it runs next.
- **Domain components (Canvas, AssetLibrary, EdgeTab, Fab, WorkspaceChip).** Manifest gap, not part of Phase 4. Separate arc as needed.
- **Tables (Table, TableFrame).** Manifest gap, no current consumer. Defer until product need.
- **Editor-chrome rollout Week 2-7 (PanelShell, InspectorRenderer).** Separate plan thread; layouts unblock that work but don't subsume it.
