# Vibcoder Phase 2 — Molecules Fan-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port 18 vibcoder chrome molecules end-to-end through the Phase A pipeline, applying the locked Phase 2 contracts (slot composition, always-controlled state, sibling exports, cross-atom imports), in 6 tasks that each ship a coherent commit and pass all gates.

**Architecture:** Each molecule = one vendored CSS file at `packages/editor/src/themes/components/molecules/<name>.css` (codemod output) + one or more React wrappers at `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` (className + props mapping; compound molecules ship sibling exports in same file) + one unit test (`<Name>.test.tsx`) + one gallery entry (`packages/editor/src/preview/vibcoder-<name>.{html,tsx}`). All wrappers exported through the `editor/shared/vibcoder/` barrel.

**Tech Stack:** Bun (codemod runtime + variants helper), React 18 + TypeScript (wrappers), Vite (preview), Vitest + React Testing Library (unit tests), browser visual diff (manual eyeball).

**Prerequisites (all from prior plans):**
- Plan 1 (Phase A infrastructure) shipped — codemod orchestrator + bundle pin + gates 19+21+vibcoder-port live
- Plan 2 (Phase 0 POC) shipped — Button wrapper, gallery scaffolding, `poc-findings.md` template locked
- Plan 3 (Phase 1 atoms) shipped at `bcfeda1` — 23 atom CSS + 25 wrappers, 233 tests, master gallery at `vibcoder-index.html`
- Working tree clean, on `main`

**Per-component template (DO NOT DUPLICATE — read once, apply per molecule):** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` § "Per-component port template (locked)" + "Phase 1 conventions reaffirmed" section.

**Phase 2 design spec (READ FIRST — this plan implements it):** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/phase-2-molecules-design.md`

**Out of scope:** Organisms (Phase 3), layouts (Phase 4), re-port of existing 37 (Phase 5), visual regression infra (Phase 6). Molecules classified `DASHBOARD/MOBILE` per SCOPE.md (`workspace-chip`) and `CMS` (`table`, `table-frame`) deliberately skipped — they re-enter the arc in their own dashboard/CMS tracks.

**Phase 0 scope correction:** Roadmap claims POC pre-shipped `list-row.css`. It did not — only `button.css` shipped. Task 1 of this plan catches up by porting `list-row` as a single-molecule canary before fan-out begins. Same pattern as Phase 1 Task 1 (tag catch-up).

---

## Molecule inventory (18 total)

| Batch | Category | Count | Molecules |
|---|---|---:|---|
| 0 (T1) | Catch-up | 1 | list-row |
| 1 (T2) | Navigation/composition | 4 | card, form-field, section-head, surface-head |
| 2 (T3) | Interactive | 5 | actionbar, breadcrumb, chipbar, color-trigger, tabs |
| 3 (T4) | Notification | 4 | popover, toast, toggle-row, tile-meta |
| 4 (T5) | Specialized | 4 | rail-tile, search-input, toolbar, uploader |

**Excluded (per SCOPE.md):** workspace-chip (DASHBOARD/MOBILE), table + table-frame (CMS).

---

## File Structure

For each molecule `<name>` with PascalCase wrapper `<Name>`:

| File | Purpose |
|---|---|
| `docs/reference/vibcoder/components/molecules/<name>.css` | Source (vendored bundle, gitignored) — read-only input |
| `packages/editor/src/themes/components/molecules/<name>.css` | Codemod output — generated, NOT hand-edited |
| `packages/editor/src/themes/components/_aliases.generated.css` | Auto-extended by codemod 3 with `<name>`'s tokens |
| `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` | React wrapper (may export multiple sibling components) |
| `packages/editor/src/editor/shared/vibcoder/<Name>.test.tsx` | Unit test (≥3 cases per `poc-findings.md` minimum contract) |
| `packages/editor/src/editor/shared/vibcoder/index.ts` | Barrel — append `export { <Name>, ...siblings } from "./<Name>";` |
| `packages/editor/src/preview/vibcoder-<name>.html` | Gallery HTML side |
| `packages/editor/src/preview/vibcoder-<name>.tsx` | Gallery React side |

The `packages/editor/src/themes/components/molecules/` directory does NOT exist yet — Task 1 creates it.

---

## Phase 2 contracts (locked from spec)

### Contract A: Slot composition (5 molecules use this)

For: form-field, surface-head, section-head, toggle-row, tile-meta.

**Required structural slots → flat props.** TS-required (`label`, `title`, `count`).
**Variable content slot → React children.** Caller passes the input/action/badge.
**Optional decorative slots → flat-prop boolean OR object discriminator** (mirror Phase 1 Label `info?: boolean | {…}`).

```tsx
// Canonical shape
interface FormFieldProps {
  label: string;          // required slot, flat prop
  required?: boolean;     // decorative, flat boolean
  helper?: string;        // optional slot, flat prop
  error?: string;         // optional slot, flat prop
  disabled?: boolean;     // state
  children: ReactNode;    // content slot — caller passes the input
}
```

### Contract B: Always-controlled state (5 molecules use this)

For: popover, tabs, toast, color-trigger, search-input.

- `value` + `onChange` (or `open` + `onOpenChange`) are **REQUIRED** props
- **No** `defaultValue` / `defaultOpen` (no uncontrolled mode)
- Internal `useState` is **forbidden** in molecule wrappers
- Wrapper renders state-derived classes + ARIA attrs from controlled value

### Contract C: Sibling exports for compound molecules

For compound molecules with multiple sub-elements: ship sibling exports in same file (mirrors Phase 1 Spinner+StatusDot, Kbd+KbdSeq).

Known compound molecules:
- **Card** ships: Card, CardHeader, CardBody, CardFooter (+ CardTitle, CardDesc for flush variant)
- **Tabs** ships: Tabs, Tab (no TabPanel — tab bar only, panels live outside)
- **Tabs file** also contains `bd-pillgroup` — ships PillGroup, PillButton as additional siblings
- **Popover.tsx** ships: Popover, PopoverArrow
- **Tooltip.tsx** (separate file from popover.tsx, despite source CSS grouping) ships: Tooltip, TooltipTitle, TooltipDesc, TooltipKbd
- **Menu.tsx** (also separate file) ships: Menu, MenuItem, MenuGroup, MenuLabel
- **Other compound molecules** decided by implementer per molecule

### Contract D: Cross-atom imports (new pattern)

Molecule wrappers import constituent atoms from sibling files:

```tsx
// FormField.tsx
import { Label } from "./Label";
import { HelperText } from "./HelperText";

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, helper, children, ...rest }, ref) => (
    <div ref={ref} className="bd-form-field" {...rest}>
      <Label required={required}>{label}</Label>
      {children}
      {helper && <HelperText>{helper}</HelperText>}
    </div>
  ),
);
```

Phase 1 precedent: IconButton imports Icon. Phase 2 exercises heavily — at least 7 molecules import siblings.

### Per-batch deferred decisions (no spec preset)

**Polymorphism** (toolbar, actionbar, chipbar, breadcrumb, tabs):
- Default: composition (`<Wrapper><Item />…</Wrapper>`)
- Choose data-driven (`items={[{kind, ...}]}`) only if source CSS docstring or HTML demo shows clear config-driven intent
- Implementer flags choice in JSDoc + status report

**Trigger element wiring** (popover, color-trigger):
- Implementer picks `asChild` + cloneElement, render-prop, OR ref-forwarding
- Whatever picked must wire ARIA correctly (aria-expanded, aria-controls, aria-haspopup)
- Document choice in wrapper JSDoc

---

## Conventions reaffirmed (from POC + Phase 1 — verified across 25 wrappers)

These rules govern every wrapper in this plan. Violation = re-do the wrapper.

1. **Filename != classname.** Always run `vibcoder-variants.mjs` to discover actual base class.
2. **Default value of any prop = NO modifier class.** When uncertain, emit the modifier.
3. **State props (boolean) → `bd-X--state` + matching `aria-*`.** `disabled` is native HTML; use `data-disabled` + `[data-disabled]` selector if CSS targets that.
4. **`forwardRef`** for any wrapper rendering a focusable element (button, input, select, textarea, anchor) OR returning the root container of a compound molecule.
5. **Spread `...rest` after named props** so caller can override aria/data/event handlers.
6. **Use the variants helper output verbatim** for type unions. No hand-editing.
7. **`Number.isFinite(value) ? value : fallback`** guard for any value-driven primitive (Phase 1 Slider/Progress idiom — relevant if any molecule takes a numeric value).
8. **`displayName` set on every `forwardRef` export** including siblings.
9. **Defensive `Omit<…>` for native HTML attr clashes** (Phase 1 Switch/Checkbox/Select pattern).

---

## Task 1: Catch up — port `list-row` (single-molecule canary)

**Files:**
- Read: `docs/reference/vibcoder/components/molecules/list-row.css`
- Generate: `packages/editor/src/themes/components/molecules/list-row.css`
- Create: `packages/editor/src/editor/shared/vibcoder/ListRow.tsx`, `ListRow.test.tsx`
- Create: `packages/editor/src/preview/vibcoder-list-row.html`, `vibcoder-list-row.tsx`
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (append `ListRow` export)

This task = the per-component template applied once for molecules, fully written out. Subsequent batches assume the implementer has done Task 1 and follows the same shape.

**Why list-row is the canary:** richest slot composition in the entire molecule set (8 slot positions: `__lead`, `__body`, `__title`, `__meta`, `__path`, `__tail`, `__bullet`, `__unread`, `__check`). If the slot composition contract has a hole, this molecule surfaces it. CSS docstring even lists explicit cross-atom composition: "Compose with bdr-icon, bdr-icon-btn, bdr-avatar, bdr-tag, bdr-count, bdr-kbd, bdr-badge, bdr-checkbox" — perfect canary for cross-atom imports too.

- [ ] **Step 1: Vendor**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
mkdir -p packages/editor/src/themes/components/molecules
cp docs/reference/vibcoder/components/molecules/list-row.css \
   packages/editor/src/themes/components/molecules/list-row.css
npm --prefix packages/editor run vibcoder:vendor
```

Expected: orchestrator prints 4 numbered steps, ends `vibcoder-vendor: complete`. Codemod 1 reports rewrites including the new molecule. Codemod 3 may extend `_aliases.generated.css`. Bundle pin updates.

- [ ] **Step 2: Gates**

```bash
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
```

Expected: ALL PASS. `check-vibcoder-port` reports the new molecule in its file count.

- [ ] **Step 3: Discover variants**

```bash
bun packages/editor/scripts/vibcoder-variants.mjs molecules/list-row
```

Capture the output. The wrapper's type unions and the gallery cell list both derive from this output verbatim.

Expected output (verify against actual):
```
bd-list-row:
  variants: bordered, inline, timeline, ghost, check, unread
  sizes: sm, lg
  states: (none — uses CSS .is-selected / .is-active / [aria-selected] / [aria-current] / [disabled])
```

- [ ] **Step 4: Write the wrapper**

```tsx
// packages/editor/src/editor/shared/vibcoder/ListRow.tsx
/**
 * Vibcoder ListRow wrapper.
 * Renders the bd-list-row composite from src/themes/components/molecules/list-row.css.
 *
 * Slots (from CSS):
 *   __lead    leading icon/avatar/swatch (22×22 default)
 *   __body    flex column for title + meta + path
 *   __title   primary label (required)
 *   __meta    secondary muted line
 *   __path    monospace breadcrumb
 *   __tail    right cluster (kbd, count, chevron, etc.)
 *   __bullet  timeline indicator (gated by --timeline)
 *   __unread  notification dot (gated by --unread)
 *   __check   leading checkbox slot (gated by --check)
 *
 * Renders as <button> (CSS sets cursor:pointer, text-align:left, border:none).
 *
 * State boolean → caller-owned ARIA pair:
 *   selected  → applies .is-selected; caller adds aria-selected="true"
 *   active    → applies .is-active;   caller adds aria-current="page" or "step"
 *
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

export type ListRowSize = "sm" | "lg";

export interface ListRowProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  title: string;                // required slot
  meta?: string;                // optional slot
  path?: string;                // optional monospace slot
  lead?: ReactNode;             // leading slot (icon/avatar/etc.)
  tail?: ReactNode;             // trailing slot (kbd/count/chevron)
  size?: ListRowSize;
  bordered?: boolean;
  inline?: boolean;
  timeline?: boolean;
  unread?: boolean;
  ghost?: boolean;
  check?: boolean;              // adds __check slot
  selected?: boolean;
  active?: boolean;
}

export const ListRow = forwardRef<HTMLButtonElement, ListRowProps>(
  (
    {
      title,
      meta,
      path,
      lead,
      tail,
      size,
      bordered,
      inline,
      timeline,
      unread,
      ghost,
      check,
      selected,
      active,
      className,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-list-row",
      size && `bd-list-row--${size}`,
      bordered && "bd-list-row--bordered",
      inline && "bd-list-row--inline",
      timeline && "bd-list-row--timeline",
      unread && "bd-list-row--unread",
      ghost && "bd-list-row--ghost",
      check && "bd-list-row--check",
      selected && "is-selected",
      active && "is-active",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        {lead && <span className="bd-list-row__lead">{lead}</span>}
        {timeline && <span className="bd-list-row__bullet" aria-hidden="true" />}
        {unread && <span className="bd-list-row__unread" aria-hidden="true" />}
        <span className="bd-list-row__body">
          <span className="bd-list-row__title">{title}</span>
          {meta && <span className="bd-list-row__meta">{meta}</span>}
          {path && <span className="bd-list-row__path">{path}</span>}
        </span>
        {tail && <span className="bd-list-row__tail">{tail}</span>}
      </button>
    );
  },
);
ListRow.displayName = "ListRow";
```

- [ ] **Step 5: Write the test**

```tsx
// packages/editor/src/editor/shared/vibcoder/ListRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ListRow } from "./ListRow";

describe("vibcoder ListRow wrapper", () => {
  it("renders <button> with bd-list-row base class + title", () => {
    const { container } = render(<ListRow title="Hello" />);
    const root = container.querySelector("button.bd-list-row");
    expect(root).toBeTruthy();
    expect(root!.querySelector(".bd-list-row__title")!.textContent).toBe("Hello");
  });

  it("OMITS size modifier class when size is undefined (default)", () => {
    const { container } = render(<ListRow title="x" />);
    const cls = container.querySelector(".bd-list-row")!.className;
    expect(cls).not.toContain("bd-list-row--sm");
    expect(cls).not.toContain("bd-list-row--lg");
  });

  it("emits each variant modifier when its boolean prop is true", () => {
    const { container } = render(
      <ListRow
        title="x"
        size="sm"
        bordered
        inline
        timeline
        unread
        ghost
        check
      />,
    );
    const cls = container.querySelector(".bd-list-row")!.className;
    expect(cls).toContain("bd-list-row--sm");
    expect(cls).toContain("bd-list-row--bordered");
    expect(cls).toContain("bd-list-row--inline");
    expect(cls).toContain("bd-list-row--timeline");
    expect(cls).toContain("bd-list-row--unread");
    expect(cls).toContain("bd-list-row--ghost");
    expect(cls).toContain("bd-list-row--check");
  });

  it("applies is-selected / is-active classes from boolean state props", () => {
    const { container } = render(<ListRow title="x" selected active />);
    const cls = container.querySelector(".bd-list-row")!.className;
    expect(cls).toContain("is-selected");
    expect(cls).toContain("is-active");
  });

  it("renders lead + tail slots when provided", () => {
    const { container } = render(
      <ListRow
        title="x"
        lead={<span data-testid="lead-x">L</span>}
        tail={<span data-testid="tail-x">T</span>}
      />,
    );
    expect(container.querySelector(".bd-list-row__lead [data-testid='lead-x']")).toBeTruthy();
    expect(container.querySelector(".bd-list-row__tail [data-testid='tail-x']")).toBeTruthy();
  });

  it("renders meta + path slots when provided", () => {
    const { container } = render(<ListRow title="t" meta="m" path="p" />);
    expect(container.querySelector(".bd-list-row__meta")!.textContent).toBe("m");
    expect(container.querySelector(".bd-list-row__path")!.textContent).toBe("p");
  });

  it("OMITS bullet/unread/check sub-elements when their gates are false", () => {
    const { container } = render(<ListRow title="x" />);
    expect(container.querySelector(".bd-list-row__bullet")).toBeNull();
    expect(container.querySelector(".bd-list-row__unread")).toBeNull();
  });

  it("forwards onClick to the underlying button", () => {
    const onClick = vi.fn();
    const { container } = render(<ListRow title="x" onClick={onClick} />);
    fireEvent.click(container.querySelector("button")!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges caller className", () => {
    const { container } = render(<ListRow title="x" className="extra" />);
    expect(container.querySelector(".bd-list-row")!.className).toContain("extra");
  });

  it("forwards aria-selected via spread (caller-owned ARIA pair)", () => {
    const { container } = render(<ListRow title="x" selected aria-selected />);
    const root = container.querySelector(".bd-list-row")!;
    expect(root.getAttribute("aria-selected")).toBe("true");
    expect(root.className).toContain("is-selected");
  });
});
```

- [ ] **Step 6: Run tests**

```bash
cd packages/editor && npx vitest run src/editor/shared/vibcoder/ListRow.test.tsx
```

Expected: 10 passed.

- [ ] **Step 7: Update barrel**

Append to `packages/editor/src/editor/shared/vibcoder/index.ts`:

```ts
export { ListRow } from "./ListRow";
export type { ListRowProps, ListRowSize } from "./ListRow";
```

- [ ] **Step 8: Build the gallery**

```html
<!-- packages/editor/src/preview/vibcoder-list-row.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Vibcoder ListRow gallery</title>
  <link rel="stylesheet" href="/src/themes/components/_base.css" />
  <link rel="stylesheet" href="/src/themes/components/molecules/list-row.css" />
  <link rel="stylesheet" href="/src/themes/components/atoms/icon.css" />
  <link rel="stylesheet" href="/src/themes/components/atoms/badge.css" />
  <link rel="stylesheet" href="/src/themes/components/atoms/count.css" />
  <link rel="stylesheet" href="/src/themes/components/atoms/kbd.css" />
  <style>body { font-family: system-ui; padding: 24px; max-width: 720px; }</style>
</head>
<body>
  <div id="react-root"></div>
  <script type="module" src="./vibcoder-list-row.tsx"></script>
</body>
</html>
```

```tsx
// packages/editor/src/preview/vibcoder-list-row.tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ListRow } from "../editor/shared/vibcoder/ListRow";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { Count } from "../editor/shared/vibcoder/Count";
import { Kbd } from "../editor/shared/vibcoder/Kbd";
import { sectionLabel, stack } from "./_galleryStyles";

const stackP = { ...stack, gap: 4 };

function Demo() {
  const [selected, setSelected] = useState<string | null>("layout");
  return (
    <>
      <h2 style={sectionLabel}>default</h2>
      <div style={stackP}>
        <ListRow title="Hero section" />
        <ListRow title="Features grid" meta="3 columns" />
        <ListRow title="Footer" path="components/footer.tsx" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>with slots</h2>
      <div style={stackP}>
        <ListRow
          title="Pages"
          lead={<Icon name="pages" />}
          tail={<Count value={12} />}
        />
        <ListRow
          title="Open command palette"
          lead={<Icon name="search" />}
          tail={<Kbd>K</Kbd>}
        />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>selected (controlled)</h2>
      <div style={stackP}>
        {["layout", "design", "settings"].map((id) => (
          <ListRow
            key={id}
            title={id[0].toUpperCase() + id.slice(1)}
            selected={selected === id}
            aria-selected={selected === id}
            onClick={() => setSelected(id)}
          />
        ))}
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>variants</h2>
      <div style={stackP}>
        <ListRow title="Small" size="sm" />
        <ListRow title="Large" size="lg" />
        <ListRow title="Bordered" bordered />
        <ListRow title="Inline" inline meta="meta inline with title" />
        <ListRow title="Timeline entry" timeline meta="2 hours ago" />
        <ListRow title="Unread notification" unread meta="3 minutes ago" />
        <ListRow title="Ghost row" ghost meta="no hover background" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>disabled</h2>
      <div style={stackP}>
        <ListRow title="Disabled item" disabled meta="cannot click" />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
```

- [ ] **Step 9: Smoke-test gallery**

```bash
cd packages/editor && npm run dev &
sleep 3
curl -sI http://localhost:5050/src/preview/vibcoder-list-row.html | head -3
kill %1 2>/dev/null || true
```

Expected: `HTTP/1.1 200`. Then manually visit the URL and eyeball the gallery — verify slots render, hover/focus/selected states work, all variants show the expected visual.

- [ ] **Step 10: Verify all gates + tests + types**

```bash
cd packages/editor
npx vitest run src/editor/shared/vibcoder/
npx tsc --noEmit
bash scripts/ds-grep-gates.sh
bash scripts/check-vibcoder-port.sh
```

Expected: 233 + 10 = 243 tests pass, no new TS errors above 188 baseline, all gates exit 0, port-check reports 25 vendored files (24 atoms + 1 molecule).

- [ ] **Step 11: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/molecules/list-row.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/ListRow.tsx \
        packages/editor/src/editor/shared/vibcoder/ListRow.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-list-row.html \
        packages/editor/src/preview/vibcoder-list-row.tsx
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder list-row catch-up (Phase 2 Task 1 canary)

Catches up the list-row molecule that the roadmap claimed shipped in Phase 0
POC (only button.css actually shipped — same over-claim pattern as Phase 1
tag.css). Validates the Phase 2 slot composition contract on the richest
slot-composition molecule in the bundle (8 slot positions + cross-atom
composition with icon/icon-btn/avatar/tag/count/kbd/badge/checkbox).

Wrapper renders <button> root with named slots (lead, body{title/meta/path},
tail, bullet, unread). State props (selected, active) apply CSS classes;
caller owns the matching ARIA attrs (aria-selected, aria-current).

Tests: 233 → 243 (+10 ListRow). Gates green. Bundle pin updates.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Batch 1 — Navigation/composition (4 molecules)

**Molecules:** card, form-field, section-head, surface-head.

**Per-molecule workflow** (apply to each, in this order):

1. Vendor: copy upstream CSS to `packages/editor/src/themes/components/molecules/<name>.css`, run `npm --prefix packages/editor run vibcoder:vendor`.
2. Gates check: `ds-grep-gates.sh` + `check-vibcoder-port.sh`.
3. Variants discovery: `bun packages/editor/scripts/vibcoder-variants.mjs molecules/<name>` — capture output, use unions verbatim.
4. Wrapper at `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` (forwardRef, displayName, default-omit, conventions reaffirmed above).
5. Test at `<Name>.test.tsx` (≥3 cases — variant emit, default omit, ARIA wiring, slot composition assertions).
6. Gallery `.tsx` + `.html` pair at `packages/editor/src/preview/vibcoder-<name>.{tsx,html}`. Galleries import shared layout from `_galleryStyles.ts` — NO local declarations of `darkSurface`/`sectionLabel`/`flexRow`/`stack`/`field`.
7. Append exports to `index.ts` (including all sibling exports for compound molecules).
8. Run `npx vitest run src/editor/shared/vibcoder/<Name>.test.tsx` — verify pass.

After all 4 molecules are shipped:
9. Run full gate + test sweep: `bash packages/editor/scripts/ds-grep-gates.sh && bash packages/editor/scripts/check-vibcoder-port.sh && cd packages/editor && npx vitest run src/editor/shared/vibcoder/ && npx tsc --noEmit`.
10. Smoke-test all 4 galleries via `curl -sI` against dev server (expect `HTTP/1.1 200`).
11. Commit batch.

### card (compound — 4-6 sibling exports)

**Per source CSS** (`docs/reference/vibcoder/components/molecules/card.css`):
- Two top-level shapes: elevated (`.bd-card` with shadow) + flush (`.bd-card--flush` panel)
- Elevated has structure: `__head` + `__head-meta` + `__body` + `__foot`
- Flush has alternative content elements: `__title` + `__desc`

**Sibling exports** (Contract C):
```tsx
// Card.tsx
export const Card = forwardRef<HTMLDivElement, CardProps>(...)         // base; flush prop toggles variant
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(...)  // bd-card__head
export const CardHeaderMeta = forwardRef<HTMLSpanElement, ...>(...)         // bd-card__head-meta (optional sibling)
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(...)      // bd-card__body
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(...)  // bd-card__foot
export const CardTitle = forwardRef<HTMLHeadingElement, ...>(...)            // bd-card__title (used in flush)
export const CardDesc = forwardRef<HTMLParagraphElement, ...>(...)           // bd-card__desc (used in flush)
```

Wrapper API:
```tsx
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  flush?: boolean;  // toggles --flush variant
}
```

Render:
```tsx
// Caller usage
<Card>
  <CardHeader>Page settings <CardHeaderMeta>updated 2h ago</CardHeaderMeta></CardHeader>
  <CardBody>…content…</CardBody>
  <CardFooter><Button>Save</Button></CardFooter>
</Card>

// Flush variant
<Card flush>
  <CardTitle>Tip</CardTitle>
  <CardDesc>Use Cmd+K to open the command palette.</CardDesc>
</Card>
```

Tests: 6+ cases — base render + flush variant + each sibling renders correct class + caller className merge + forwardRef on each sibling.

### form-field (slot composition canary, Contract A — cross-atom imports)

**Per source CSS** (`docs/reference/vibcoder/components/molecules/form-field.css`):
- 3 variants: `--inline` (label+control row), `--row` (3-column grid), `--required` (auto asterisk)
- 1 state: `.is-disabled` (dims label + helper)
- Slot shape: `<label class=bd-label>` + control + `<p class=bd-helper-text>` (per CSS docstring)

**Wrapper imports** (Contract D): `Label`, `HelperText` from sibling files.

```tsx
// FormField.tsx
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";
import { Label } from "./Label";
import { HelperText, type HelperTextTone } from "./HelperText";

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;            // required slot
  htmlFor?: string;         // forwarded to <Label htmlFor>
  required?: boolean;       // toggles --required variant + Label's required prop
  helper?: string;          // optional muted-tone helper
  error?: string;           // optional error-tone helper (mutex with helper — error wins)
  inline?: boolean;
  row?: boolean;
  disabled?: boolean;       // adds is-disabled class
  children: ReactNode;      // content slot — caller passes Input/Select/Textarea
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, htmlFor, required, helper, error, inline, row, disabled, children, className, ...rest }, ref) => {
    const classes = [
      "bd-form-field",
      required && "bd-form-field--required",
      inline && "bd-form-field--inline",
      row && "bd-form-field--row",
      disabled && "is-disabled",
      className,
    ].filter(Boolean).join(" ");
    const helperToneAndText: { tone?: HelperTextTone; text?: string } =
      error ? { tone: "error", text: error } : helper ? { text: helper } : {};
    return (
      <div ref={ref} className={classes} {...rest}>
        <Label htmlFor={htmlFor} required={required}>{label}</Label>
        {children}
        {helperToneAndText.text && (
          <HelperText tone={helperToneAndText.tone}>{helperToneAndText.text}</HelperText>
        )}
      </div>
    );
  },
);
FormField.displayName = "FormField";
```

Tests: 7+ cases — base, each variant, error/helper precedence, required forwards to Label, disabled adds is-disabled, htmlFor forwards, content slot renders.

### section-head (slot composition, Contract A)

Per source CSS (`section-head.css` — read at vendor-time): expect `.bd-section-head` base with `__title` + `__count` + `__actions` slots. Apply Contract A:

```tsx
interface SectionHeadProps {
  title: string;        // required slot
  count?: number;       // optional decorative slot — renders inside __count
  children?: ReactNode; // content slot — caller passes action buttons
}
```

Tests: 4+ cases — base, count omitted when undefined, caller actions render, className merge.

### surface-head (slot composition, Contract A)

Per source CSS (`surface-head.css` — read at vendor-time): expect `.bd-surface-head` base. Similar to section-head but typically with subtitle/back/close affordances. Apply Contract A:

```tsx
interface SurfaceHeadProps {
  title: string;        // required slot
  subtitle?: string;    // optional slot if CSS supports
  children?: ReactNode; // content slot — actions
}
```

Tests: 4+ cases.

### Task 2 commit

```bash
git add packages/editor/src/themes/components/molecules/{card,form-field,section-head,surface-head}.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/{Card,FormField,SectionHead,SurfaceHead}.tsx \
        packages/editor/src/editor/shared/vibcoder/{Card,FormField,SectionHead,SurfaceHead}.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-{card,form-field,section-head,surface-head}.html \
        packages/editor/src/preview/vibcoder-{card,form-field,section-head,surface-head}.tsx
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder navigation/composition molecules — card, form-field, section-head, surface-head (Phase 2 Batch 1)

4 molecules vendored. Card ships 7 sibling exports (Card + CardHeader +
CardHeaderMeta + CardBody + CardFooter + CardTitle + CardDesc) for the
elevated + flush content models. FormField is the slot composition
canary — imports Label + HelperText from sibling atoms; error overrides
helper tone. SectionHead + SurfaceHead apply the same Contract A slot
shape (required title flat-prop + optional decorative count + children
content slot).

Tests: 243 → ~280 (+37 across 4 test files, exact count varies with
sibling export coverage). Gates green. Bundle pin updates.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Batch 2 — Interactive (5 molecules)

**Molecules:** actionbar, breadcrumb, chipbar, color-trigger, tabs.

Apply the per-molecule workflow from Task 2 (vendor → gates → variants → wrapper → test → gallery → barrel → tests).

### actionbar (polymorphism — per-batch decision)

Read `actionbar.css`. Likely a horizontal cluster of action buttons with optional separators. Per Contract D guidance:
- Default: composition (`<ActionBar><Button>Save</Button>...</ActionBar>`)
- If CSS docstring shows config-driven intent (item kind enum), pick data-driven
- Implementer flags choice in JSDoc + status report

Wrapper most likely:
```tsx
interface ActionBarProps extends HTMLAttributes<HTMLDivElement> {
  // children: caller composes Button / IconButton / separator
}
```

Optional sibling: `ActionBarSeparator` if CSS has dedicated separator selector.

### breadcrumb (polymorphism — uniform children)

Read `breadcrumb.css`. Crumbs are uniform (text or icon, with separator between). Default: composition with sibling exports for crumb + separator:

```tsx
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(...)        // <nav>
export const BreadcrumbItem = forwardRef<HTMLAnchorElement, BreadcrumbItemProps>(...)
export const BreadcrumbSeparator = forwardRef<HTMLSpanElement, ...>(...)        // optional, styles "/"
```

A11y: container is `<nav aria-label="Breadcrumb">`. Last item gets `aria-current="page"`.

### chipbar (polymorphism — uniform children)

Read `chipbar.css`. Cluster of `Tag` atoms with horizontal scroll/wrap. Default: composition; implementer just renders `<div className="bd-chipbar">{children}</div>`.

```tsx
interface ChipbarProps extends HTMLAttributes<HTMLDivElement> {
  // children: caller composes <Tag /> instances
}
```

### color-trigger (Contract B always-controlled + Contract D trigger wiring)

Read `color-trigger.css`. Likely a small swatch button that opens a color picker popover. Apply Contract B:
- `value: string` (hex/rgba) required
- `onChange: (value: string) => void` required
- `open?: boolean` + `onOpenChange?: (open: boolean) => void` (controlled trigger state)

Per Contract D trigger wiring: implementer picks asChild / render-prop / ref-forwarding for the trigger element. Document choice in JSDoc.

Note: actual color-picker organism lands in Phase 3. ColorTrigger here = button that displays current color and reports open state. Phase 3 wires it to ColorPicker.

### tabs (Contract B always-controlled + Contract C sibling exports + polymorphism)

Read `tabs.css` — file ships TWO molecules:
- `.bd-tabs` (underlined panel tabs) — sibling exports: Tabs + Tab
- `.bd-pillgroup` (segmented control) — sibling exports: PillGroup + PillButton

Apply Contract B (always controlled):
```tsx
interface TabsProps {
  value: string;
  onValueChange: (next: string) => void;
  children: ReactNode;  // caller passes <Tab id="...">label</Tab> children
}

interface TabProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}
// Tab consumes Tabs' value via context — internal context API only
```

Implementer creates a tiny internal React context for Tabs ↔ Tab to avoid prop drilling. The context is wrapper-internal — not exported.

PillGroup mirrors the same shape (controlled value + PillButton children).

JSDoc: NO TabPanel — caller renders panel content separately based on the same `value` they own.

### Task 3 commit

```bash
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder interactive molecules — actionbar, breadcrumb, chipbar, color-trigger, tabs (Phase 2 Batch 2)

5 molecules vendored. tabs.css ships 2 segmented patterns (bd-tabs +
bd-pillgroup) — 4 sibling exports (Tabs + Tab + PillGroup + PillButton)
with internal context for parent↔child controlled-state wiring. NO
TabPanel — caller renders panel content separately. Color-trigger is the
first Contract D trigger-wiring decision; implementer picked
[asChild|render-prop|ref-fwd] (see JSDoc).

Polymorphism judgement-call summary (per Contract D guidance):
- actionbar: composition / data-driven [implementer flags]
- breadcrumb: composition with siblings (Breadcrumb + BreadcrumbItem + BreadcrumbSeparator)
- chipbar: uniform composition (caller renders <Tag />)

Tests: ~280 → ~330 (exact count varies with sibling coverage). Gates green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Batch 3 — Notification (4 molecules)

**Molecules:** popover, toast, toggle-row, tile-meta.

### popover + tooltip + menu (3 wrapper files from 1 source CSS file)

Source CSS at `docs/reference/vibcoder/components/molecules/popover.css` ships THREE conceptually distinct molecules:
- `.bd-popover` (+ `--with-arrow`)
- `.bd-tooltip` (+ `--multiline` + `__title` + `__desc` + `__kbd`)
- `.bd-menu` (+ `__group` + `__label` + `__item` + `__icon` + `__text` + `__kbd` + `__chevron`)

**Implementer choice:** SPLIT into 3 wrapper files:
- `Popover.tsx` ships: Popover, PopoverArrow (Contract B + Contract D)
- `Tooltip.tsx` ships: Tooltip, TooltipTitle, TooltipDesc, TooltipKbd (Contract C, simpler always-render)
- `Menu.tsx` ships: Menu, MenuItem, MenuGroup, MenuLabel (Contract C, action list)

Vendoring is still ONE source file (popover.css copies once to molecules/popover.css), but 3 wrapper files import from it.

**Popover.tsx (Contract B + Contract D):**
```tsx
interface PopoverProps {
  open: boolean;                      // required (Contract B)
  onOpenChange: (open: boolean) => void;  // required
  withArrow?: boolean;
  children: ReactNode;                // trigger + content (or just content if asChild trigger)
}
```

Implementer picks one of: asChild + cloneElement, render-prop, OR ref-forwarding. Document choice in JSDoc. Required ARIA: aria-expanded on trigger, aria-controls + id on content.

Note: Popover here is just the SURFACE. Positioning (anchor, offset, flip) is hand-wired by the caller using ref + style for now. A full positioning library (floating-ui) integration is Phase 3 organism work (CommandPalette, Inspector menus).

**Tooltip.tsx:** Always-rendered (caller controls visibility via show/hide CSS or conditional render). Sub-elements as siblings.

**Menu.tsx:** Action list — caller wires keyboard nav externally. MenuItem accepts `selected` (renders is-on + aria-checked) and `danger` (variant).

### toast (Contract B always-controlled — but toast queue lives in Phase 3 organism)

Read `toast.css`. Apply Contract B at the toast level (single toast controls own dismiss state via `open` + `onOpenChange`):

```tsx
type ToastTone = "info" | "success" | "warning" | "error";
interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;  // typically called by auto-dismiss timer
  tone?: ToastTone;
  title: string;
  description?: string;
  action?: ReactNode;  // optional action slot (typically <Button>)
}
```

Note: queue management (multiple concurrent toasts, stacking, ordering) is Phase 3 organism (NotificationCenter). Phase 2 ships the single-toast component only.

### toggle-row (Contract A slot composition)

Read `toggle-row.css`. Settings row with label + helper + control (typically Switch or Checkbox). Apply Contract A:

```tsx
interface ToggleRowProps {
  label: string;        // required slot
  helper?: string;      // optional slot
  disabled?: boolean;
  children: ReactNode;  // content slot — caller passes <Switch /> or <Checkbox />
}
```

### tile-meta (Contract A slot composition)

Read `tile-meta.css`. Bottom-of-tile metadata footer (template tile, project tile, asset tile). Apply Contract A:

```tsx
interface TileMetaProps {
  title: string;        // required slot
  meta?: string;        // optional slot
  children?: ReactNode; // optional decorative slot — Badge / IconButton
}
```

### Task 4 commit

```bash
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder notification molecules — popover, tooltip, menu, toast, toggle-row, tile-meta (Phase 2 Batch 3)

4 molecule CSS files vendored, 6 wrapper files shipped. popover.css splits
into 3 React wrapper files (Popover.tsx + Tooltip.tsx + Menu.tsx) since
the source ships 3 conceptually distinct molecules in one CSS file.
Sibling export counts: Popover (2), Tooltip (4), Menu (4), Toast (1),
ToggleRow (1), TileMeta (1).

Popover Contract D trigger wiring: implementer picked
[asChild|render-prop|ref-fwd] (see JSDoc). Toast queue management
deferred to Phase 3 NotificationCenter organism — Phase 2 ships single
toast component with controlled open state.

Tests: ~330 → ~380. Gates green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Batch 4 — Specialized (4 molecules)

**Molecules:** rail-tile, search-input, toolbar, uploader.

### rail-tile

Read `rail-tile.css`. Left rail icon item with label + active state + tooltip pairing. Apply standard wrapper conventions:

```tsx
interface RailTileProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;     // required — caller passes <Icon />
  label: string;       // required (also used as aria-label)
  active?: boolean;    // → is-active class + caller-owned aria-current
  tooltip?: string;    // optional tooltip text (renders via Tooltip sibling — cross-molecule import from Phase 2 Batch 3)
}
```

Note: rail-tile + Tooltip cross-molecule import — works because Batch 3 (Tooltip) lands before Batch 4. Phase 1 already proved cross-atom imports; Phase 2 here proves cross-molecule imports.

### search-input (Contract B always-controlled)

Read `search-input.css`. Likely an Input wrapper with leading search icon + clear button.

```tsx
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string;                              // required (Contract B)
  onChange: (value: string) => void;          // required
  placeholder?: string;
  clearable?: boolean;                        // shows clear button when value not empty
}
```

Cross-atom imports: Icon (search glyph) + IconButton (clear button).

### toolbar (polymorphism — likely composition)

Read `toolbar.css`. Canvas toolbar / inspector toolbar with mixed item types (button, icon-button, separator, dropdown, search). Per Contract D guidance: default is composition.

```tsx
interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  // children: caller composes Button / IconButton / Toolbar.Separator / SearchInput / etc.
}
```

Optional sibling: `ToolbarSeparator` if CSS has dedicated separator selector.

### uploader (Contract A slot composition + drag-drop hooks)

Read `uploader.css`. Media upload zone — drag-drop area with prompt text + browse button.

```tsx
interface UploaderProps extends HTMLAttributes<HTMLDivElement> {
  prompt: string;             // required slot — primary CTA text
  hint?: string;              // optional slot — secondary text
  onFiles: (files: FileList) => void;  // required — fires on drop or browse
  accept?: string;            // forwarded to input[type=file]
  multiple?: boolean;
  disabled?: boolean;
}
```

Internal: hidden `<input type="file">` covers the drop zone. CSS handles dragover state via `[data-dragover]` attr (set/unset in onDragOver/onDragLeave handlers).

Note: this is the FIRST molecule with non-trivial event handling. Implementer must wire drag-drop carefully — no `e.preventDefault()` on dragover means browser navigates away when user drops. Document this in JSDoc.

### Task 5 commit

```bash
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder specialized molecules — rail-tile, search-input, toolbar, uploader (Phase 2 Batch 4)

4 molecules vendored. rail-tile cross-molecule imports Tooltip (proves
Phase 2 cross-molecule pattern). search-input applies Contract B
(always-controlled value) with cross-atom Icon + IconButton imports.
toolbar uses composition pattern (per Contract D default). uploader is
the first molecule with non-trivial event handling (drag-drop) — JSDoc
documents the preventDefault contract.

Tests: ~380 → ~420. Gates green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Phase 2 milestone (M4) — gallery index, findings, status, polish pass

**Files:**
- Modify: `packages/editor/src/preview/vibcoder-index.html` (add Phase 2 section)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append Phase 2 section)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md` (status update)
- Polish #1: Modify `packages/editor/eslint.config.*` (Gate-72 ESLint rule)
- Polish #2: Modify `packages/editor/scripts/__tests__/*.test.mjs` (Gate 7 negative test, #79)
- Polish #3: Conditional — `packages/editor/scripts/vibcoder-codemod-2.mjs` if any Phase 2 molecule triggered fold-table (#73)

- [ ] **Step 1: Polish #1 — Gallery convention sweep ESLint rule (#72)**

Add an ESLint rule that prevents local declarations of `_galleryStyles` exports inside `packages/editor/src/preview/vibcoder-*.tsx`. Pattern to forbid:

```ts
// in vibcoder-*.tsx
const sectionLabel = { ... };  // FORBIDDEN — must import from "./_galleryStyles"
const darkSurface = { ... };   // FORBIDDEN
const stack = { ... };         // FORBIDDEN
const flexRow = { ... };       // FORBIDDEN
const field = { ... };         // FORBIDDEN
```

Implementation approach: custom ESLint rule under `packages/editor/eslint-rules/` (or whatever convention this project uses — verify by reading existing custom rules; Phase 1 added ESLint rules per `project_ds_week1_20260425.md` memory). Rule scope: `preview/vibcoder-*.tsx`. Rule message: "Local declaration of '{name}' shadows _galleryStyles.{name} — import from './_galleryStyles' instead."

If custom-rule infra is too heavy, fall back to a `forbidden-imports` config or a script-based check (`scripts/check-gallery-shadow.sh`) wired into `npm run lint`.

- [ ] **Step 2: Polish #2 — Gate 7 negative test (#79)**

Add a vitest test for `ds-grep-gates.sh` Gate 7 (vendored prefers-reduced-motion exemption). Test verifies that Gate 7 does NOT pass when a non-vendored CSS file ships `@media (prefers-reduced-motion)` outside the universal `themes/design-system/a11y.css` location.

```ts
// packages/editor/scripts/__tests__/ds-grep-gates.test.mjs (or extend existing)
import { test, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

test("Gate 7 fires when non-vendored CSS ships @media prefers-reduced-motion", () => {
  // Use a fixed, hardcoded fixture path inside this repo. No user input.
  const planted = resolve(
    __dirname,
    "../../src/themes/design-system/test-gate7-fixture.css",
  );
  writeFileSync(
    planted,
    "@media (prefers-reduced-motion: reduce) { .x { transition: none; } }\n",
  );
  try {
    // spawnSync with explicit argv array — no shell, no injection surface.
    const result = spawnSync(
      "bash",
      [resolve(__dirname, "../ds-grep-gates.sh")],
      { encoding: "utf8" },
    );
    // Gate 7 should fail (non-zero exit) because the planted file violates it.
    expect(result.status).not.toBe(0);
  } finally {
    unlinkSync(planted);
  }
});
```

- [ ] **Step 3: Polish #3 — Codemod 2 fold-table (conditional, #73)**

Check whether any Phase 2 molecule triggered the codemod 2 fold table:

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -r "FOLD" packages/editor/scripts/vibcoder-codemod-2.mjs.log 2>/dev/null || echo "no folds logged"
```

- If folds were logged: extend the fold table per the documented `--buildrick-X-Y` shapes that surfaced. Document each fold in the codemod 2 source comments.
- If no folds were logged: document in Phase 2 findings: "No Phase 2 molecule triggered the fold table. Defer #73 to Phase 3."

- [ ] **Step 4: Build the master gallery Phase 2 section**

Edit `packages/editor/src/preview/vibcoder-index.html`. Add a new section after the Phase 1 atoms list:

```html
  <h2>Phase 2 — molecules (18)</h2>
  <ul>
    <li><a href="./vibcoder-list-row.html">list-row</a></li>
    <li><a href="./vibcoder-card.html">card</a></li>
    <li><a href="./vibcoder-form-field.html">form-field</a></li>
    <li><a href="./vibcoder-section-head.html">section-head</a></li>
    <li><a href="./vibcoder-surface-head.html">surface-head</a></li>
    <li><a href="./vibcoder-actionbar.html">actionbar</a></li>
    <li><a href="./vibcoder-breadcrumb.html">breadcrumb</a></li>
    <li><a href="./vibcoder-chipbar.html">chipbar</a></li>
    <li><a href="./vibcoder-color-trigger.html">color-trigger</a></li>
    <li><a href="./vibcoder-tabs.html">tabs</a></li>
    <li><a href="./vibcoder-popover.html">popover</a></li>
    <li><a href="./vibcoder-tooltip.html">tooltip</a></li>
    <li><a href="./vibcoder-menu.html">menu</a></li>
    <li><a href="./vibcoder-toast.html">toast</a></li>
    <li><a href="./vibcoder-toggle-row.html">toggle-row</a></li>
    <li><a href="./vibcoder-tile-meta.html">tile-meta</a></li>
    <li><a href="./vibcoder-rail-tile.html">rail-tile</a></li>
    <li><a href="./vibcoder-search-input.html">search-input</a></li>
    <li><a href="./vibcoder-toolbar.html">toolbar</a></li>
    <li><a href="./vibcoder-uploader.html">uploader</a></li>
  </ul>
```

Note: 20 entries (popover ships 3 separate galleries: popover + tooltip + menu).

Update header text from "Phase 1 atoms (24/24 ported)" to "Phase 1+2 (24 atoms + 18 molecules ported, 20 molecule galleries)".

- [ ] **Step 5: Append Phase 2 findings to `poc-findings.md`**

Append after the existing Phase 1 findings section:

```markdown
## Phase 2 — Molecules findings (M4 milestone)

**Date:** [YYYY-MM-DD when commit lands]
**Scope:** 18 chrome molecules (list-row catch-up + 4 batches × 4-5 molecules)
**Outcome:** [PASS | PASS-with-tuning] — list shipped + open follow-ups

### Per-batch summary

| Batch | Molecules | Sibling exports | Wrappers shipped | Tests | Notes |
|---|---|---|---|---|---|
| T1 (catch-up) | list-row | none | 1 | [N] | slot composition canary |
| T2 (nav/comp) | card, form-field, section-head, surface-head | Card×7 | 10 | [N] | first cross-atom imports (FormField → Label + HelperText) |
| T3 (interactive) | actionbar, breadcrumb, chipbar, color-trigger, tabs | Breadcrumb×3 + Tabs×4 | 12 | [N] | first Contract B controlled state (color-trigger, tabs); first Contract D trigger wiring |
| T4 (notification) | popover, toast, toggle-row, tile-meta | Popover→3 wrapper files (Popover×2, Tooltip×4, Menu×4) | 13 | [N] | popover.css splits into 3 wrapper files |
| T5 (specialized) | rail-tile, search-input, toolbar, uploader | Toolbar×2 | 6 | [N] | rail-tile proves cross-molecule import (Tooltip); uploader first non-trivial event handling |

Total wrappers shipped: ~42 (vs 18 source CSS files — sibling exports + popover-split account for the multiplier).

### Polish pass folded into M4

1. **#72 Gallery convention ESLint rule** — added rule preventing local declarations of `_galleryStyles` exports in `preview/vibcoder-*.tsx`. Locks the convention; future galleries can't shadow.
2. **#79 Gate 7 negative test** — added vitest test that fires when non-vendored CSS ships `@media (prefers-reduced-motion)` outside the universal a11y.css location.
3. **#73 Codemod 2 fold-table** — [either: extended for {tokens that surfaced}; or: no Phase 2 trigger, defer to Phase 3].

### Per-batch CC time (actuals)

| Batch | Estimate (Phase 1 ratio) | Actual | Notes |
|---|---|---|---|
| T1 (catch-up) | ~30 min | [actual] | Slot composition canary; richest molecule first |
| T2 (nav/comp) | ~50 min | [actual] | Card sibling exports + FormField cross-atom imports |
| T3 (interactive) | ~60 min | [actual] | First Contract B + first Contract D — judgment-call density |
| T4 (notification) | ~70 min | [actual] | popover.css triple-split |
| T5 (specialized) | ~50 min | [actual] | uploader event handling |

Total Phase 2 molecule port: ~5-7 hr CC including review fixups (Phase 1 was ~4 hr for 23 atoms; Phase 2 has fewer items but richer APIs).

### New tuning needed for Phase 3

(Carve-outs Phase 3 must address before organisms start.)

- [ ] Floating-UI integration for popover positioning (anchor + offset + flip + shift)
- [ ] Toast queue manager (NotificationCenter organism scope)
- [ ] Tabs keyboard navigation (arrow keys, Home/End)
- [ ] Color-picker organism wires ColorTrigger
- [ ] [Any new items surfaced during Phase 2 batches]

### Conventions reaffirmed (still hold after 18 molecule ports + ~24 sibling exports)

- All Phase 1 conventions still hold (filename != classname, default-omit, forwardRef + displayName, state→aria, sibling exports, Number.isFinite guards, defensive Omit<…>)
- Slot composition contract held across 5 molecules (form-field, surface-head, section-head, toggle-row, tile-meta + list-row canary)
- Always-controlled state contract held across 5 molecules (popover, tabs, toast, color-trigger, search-input)
- Cross-atom imports proved scalable (~7 molecules import sibling atoms; bundle-size impact negligible)
- Cross-molecule imports proved (rail-tile imports Tooltip from Batch 3 — first cross-batch dependency)

### Recommendation

**Proceed to Phase 3 organisms.** Molecule alphabet complete (18 source files + ~42 wrappers, all gates green, [N] tests passing, type-check clean against 188 baseline). API contracts (slot composition + always-controlled state + sibling exports + cross-atom imports) held without re-write across all 18 molecules. Deferred items (#73, #74-#76, #77, #81) remain open; none block organism fan-out.

Master gallery index updated at `packages/editor/src/preview/vibcoder-index.html` for visual review.
```

- [ ] **Step 6: Update spec README status**

Edit `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md` Status section. Replace:

```markdown
- [x] Phase 1 atoms — fan-out complete (23 atoms across 6 batches)
- [ ] Phase 2 molecules — fan-out (unblocked once Phase 1 findings reviewed)
```

With:

```markdown
- [x] Phase 1 atoms — fan-out complete (23 atoms across 6 batches)
- [x] Phase 2 molecules — fan-out complete (18 molecules / ~42 wrappers across 5 batches)
- [ ] Phase 3 organisms — fan-out (unblocked once Phase 2 findings reviewed)
```

- [ ] **Step 7: Final verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor
npx vitest run src/editor/shared/vibcoder/ scripts/__tests__/
npx tsc --noEmit
```

Expected: all gates PASS, all tests PASS (counts match findings doc), type check at 188 baseline (no new errors), port-check reports 24 atoms + 18 molecules = 42 vendored files.

- [ ] **Step 8: Smoke-test the master gallery**

```bash
cd packages/editor && npm run dev &
sleep 3
curl -sI http://localhost:5050/src/preview/vibcoder-index.html | head -3
# Spot-check 4-5 random molecule galleries
for g in list-row form-field tabs popover uploader; do
  curl -sI "http://localhost:5050/src/preview/vibcoder-$g.html" | head -1
done
kill %1 2>/dev/null || true
```

Expected: every URL returns `HTTP/1.1 200`. Then manually visit the master index and click 5+ random molecule links to confirm visual rendering.

- [ ] **Step 9: M4 milestone commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/preview/vibcoder-index.html \
        packages/editor/src/eslint-rules/* \
        packages/editor/eslint.config.* \
        packages/editor/scripts/__tests__/*.test.mjs \
        packages/editor/scripts/vibcoder-codemod-2.mjs \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md
git commit -m "$(cat <<'EOF'
docs(spec): Phase 2 molecules complete — milestone M4

18 molecules ported across 5 batches (list-row catch-up + 4 category
batches). Master gallery index expanded with Phase 2 section linking 20
molecule galleries (popover splits into 3: popover + tooltip + menu).
Phase 2 findings appended to poc-findings.md. Spec status updated.

Polish pass folded into M4:
- #72 Gallery convention ESLint rule prevents local declaration of
  _galleryStyles exports in preview/vibcoder-*.tsx.
- #79 Gate 7 negative test added — fires when non-vendored CSS ships
  @media (prefers-reduced-motion) outside themes/design-system/a11y.css.
- #73 Codemod 2 fold-table: [extended for {tokens} | no Phase 2
  trigger, deferred to Phase 3].

Total Phase 2 atom + molecule wrapper count: 25 + ~42 = ~67 components.
Tests: 233 → [N]. Gates green. Bundle pin: [SHA].

Phase 3 organisms unblocked pending findings review.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Open follow-ups carrying forward to Phase 3

These items remain pending after Phase 2 — not blockers, captured for Phase 3 planning:

| # | Item | Status |
|---|------|--------|
| #74 | Switch button-reset footgun (chrome consumer prep) | Open — re-capture in Phase 3 spec |
| #75 | Switch preventDefault test (lock contract) | Open — re-capture in Phase 3 spec |
| #76 | Thumb discriminated union refactor | Open — re-capture in Phase 3 spec |
| #77 | Icon sprite production-build resolution | Open — blocks chrome integration phase, not Phase 3 |
| #81 | Forward grip.css comment-prefix fix upstream | Open transparency hole |
| #82 | Vendoring fix-policy doc full version | Interim 2-paragraph in poc-findings.md; full doc deferred |

Plus any new items surfaced during Phase 2 batches (mirrors Phase 1 #80 Slider NaN, #71 variants script fix).

---

## Self-review checklist (run before T1 dispatch)

- [ ] Spec coverage: every section in `phase-2-molecules-design.md` has a corresponding task or step
- [ ] Placeholder scan: no TBD/TODO/FIXME/XXX strings in this plan
- [ ] Type consistency: `ListRowProps`, `FormFieldProps`, `CardProps`, etc. — naming consistent across tasks
- [ ] Slot composition contract examples in T2 + T4 + T5 use the same FormField-canonical shape
- [ ] Always-controlled examples in T3 + T4 + T5 use the same value+onChange shape
- [ ] Sibling exports list in T2 (Card) + T3 (Tabs, Breadcrumb) + T4 (Popover/Tooltip/Menu) + T5 (Toolbar) is consistent
- [ ] Cross-atom imports note in T2 FormField, T5 SearchInput + Uploader matches Contract D
- [ ] Polymorphism + render-prop deferred-decisions called out in JSDoc per Contract D guidance

---

## Execution

After dispatch, the implementer subagent for each task:

1. Reads this plan's task section in full
2. Reads `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` § "Per-component port template (locked)" + "Phase 1 conventions reaffirmed"
3. Reads `docs/superpowers/specs/2026-04-26-vibcoder-position-3/phase-2-molecules-design.md` § contracts A/B/C/D
4. Vendors the molecule(s), runs codemods, captures variants, writes wrapper + tests + gallery, commits
5. Reports DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED with judgment-call summary

Two-stage review per task: spec compliance → code quality. Fix loop on Important findings (Phase 1 cadence). Polish pass items (Minors) bundle into M4.

Solo workflow direct to main per CLAUDE.md memory. No PRs.
