# Vibcoder Phase 1 — Atoms Fan-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the remaining 23 atom-tier vibcoder primitives end-to-end through the Phase A pipeline, following the locked per-component template, in 6 batches that each ship a coherent commit and pass all gates.

**Architecture:** Each atom = one vendored CSS file at `packages/editor/src/themes/components/atoms/<name>.css` (codemod output) + one React wrapper at `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` (className + props mapping) + one unit test (`<Name>.test.tsx`) + one gallery entry (`packages/editor/src/preview/vibcoder-<name>.{html,tsx}`). All wrappers exported through the `editor/shared/vibcoder/` barrel.

**Tech Stack:** Bun (codemod runtime + variants helper), React 18 + TypeScript (wrappers), Vite (preview), Vitest + React Testing Library (unit tests), browser visual diff (manual eyeball — automated visual regression lands in Phase 6).

**Prerequisites (all from prior plans):**
- Plan 1 (Phase A infrastructure) shipped — codemod orchestrator + bundle pin + gates 19+21+vibcoder-port live
- Plan 2 (Phase 0 POC) shipped — `Button` wrapper, gallery scaffolding, `poc-findings.md` per-component template locked, B1 variants discovery helper landed (`packages/editor/scripts/vibcoder-variants.mjs`)
- Working tree clean, on `main`

**Per-component template (DO NOT DUPLICATE — read once, apply per primitive):** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` § "Per-component port template (locked)", 9 steps. Plan 3 tasks call out deviations only.

**Out of scope:** Molecules (Phase 2), organisms (Phase 3), layouts (Phase 4), re-port of existing 37 (Phase 5), visual regression infra (Phase 6). Atoms classified `DASHBOARD/MOBILE` per SCOPE.md (`edge-tab`, `fab`) are deliberately skipped — they re-enter the arc in their own dashboard track.

**Phase 0 scope correction:** Roadmap claims POC pre-shipped `tag.css`. It did not — only `button.css` shipped. Task 1 of this plan catches up by porting `tag` as a single-primitive warmup before fan-out begins.

---

## Atom inventory (23 total)

| Batch | Category | Count | Primitives |
|---|---|---:|---|
| 0 | Catch-up | 1 | tag |
| 1 | Form | 5 | input, select, textarea, checkbox, switch |
| 2 | Display | 5 | avatar, badge, count, thumb, icon |
| 3 | Interactive | 3 | icon-button, slider, link |
| 4 | Status | 4 | progress, skeleton, spinner, helper-text |
| 5 | Structural | 5 | divider, grip, breakpoint-switcher, label, kbd |

**Excluded (per SCOPE.md):** edge-tab, fab (DASHBOARD/MOBILE bucket). **Already shipped:** button (Phase 0).

---

## File Structure

For each primitive `<name>` with PascalCase wrapper `<Name>`:

| File | Purpose |
|---|---|
| `docs/reference/vibcoder/components/atoms/<name>.css` | Source (vendored bundle, gitignored) — read-only input |
| `packages/editor/src/themes/components/atoms/<name>.css` | Codemod output — generated, NOT hand-edited |
| `packages/editor/src/themes/components/_aliases.generated.css` | Auto-extended by codemod 3 with `<name>`'s tokens |
| `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` | React wrapper |
| `packages/editor/src/editor/shared/vibcoder/<Name>.test.tsx` | Unit test (≥3 cases per `poc-findings.md` minimum contract) |
| `packages/editor/src/editor/shared/vibcoder/index.ts` | Barrel — append `export { <Name> } from "./<Name>";` per primitive |
| `packages/editor/src/preview/vibcoder-<name>.html` | Gallery HTML side |
| `packages/editor/src/preview/vibcoder-<name>.tsx` | Gallery React side |

---

## Conventions reaffirmed (from POC)

These rules govern every wrapper in this plan. Violation = re-do the wrapper.

1. **Filename != classname.** Always run `vibcoder-variants.mjs` to discover the actual base class. `select.css` may define `.bd-select`, `.bd-sel`, or something else.
2. **Default value of any prop = NO modifier class.** If `vibcoder-variants.mjs` lists `sm, lg` for sizes, then `md` is the base default and the wrapper omits `bd-X--md`. Same for variants — pick the most-common as default and omit its modifier ONLY IF the CSS confirms the base rule covers it. When uncertain, emit the modifier.
3. **State props (boolean) → `bd-X--state` + matching `aria-*`.** `busy={true}` → `bd-X--busy` + `aria-busy="true"`. `disabled={true}` is a native HTML attr — let it through, do NOT add a `bd-X--disabled` class unless CSS targets that selector specifically (check via `grep '--disabled' <name>.css`).
4. **Use `forwardRef`** for any wrapper rendering a focusable HTML element (button, input, select, textarea, anchor) — chrome consumers need ref access for focus management.
5. **Spread `...rest` after named props** so caller can override `aria-*`, `data-*`, event handlers without wrapper interference.
6. **Use the variants helper output verbatim** for type unions. Do not hand-edit unions to "look cleaner" — drift = bug.

---

## Task 1: Catch up — port `tag` (single-primitive warmup)

**Files:**
- Read: `docs/reference/vibcoder/components/atoms/tag.css`
- Generate: `packages/editor/src/themes/components/atoms/tag.css`
- Create: `packages/editor/src/editor/shared/vibcoder/Tag.tsx`, `Tag.test.tsx`
- Create: `packages/editor/src/preview/vibcoder-tag.html`, `vibcoder-tag.tsx`
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (append `Tag` export)

This task = the per-component template applied once, fully written out. Subsequent batches assume the implementer has done Task 1 and follows the same shape.

- [ ] **Step 1: Vendor**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
cp docs/reference/vibcoder/components/atoms/tag.css \
   packages/editor/src/themes/components/atoms/tag.css
npm --prefix packages/editor run vibcoder:vendor
```

Expected: orchestrator prints 4 numbered steps, ends `vibcoder-vendor: complete`. Codemod 1 reports `2/2 files rewritten` (button.css from POC + tag.css). Codemod 3 may extend `_aliases.generated.css`.

- [ ] **Step 2: Gates**

```bash
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
```

Expected: ALL PASS. `check-vibcoder-port` reports `2 file(s) checked`.

- [ ] **Step 3: Discover variants**

```bash
bun packages/editor/scripts/vibcoder-variants.mjs atoms/tag
```

Capture the output. The wrapper's type unions and the gallery cell list both derive from this output verbatim.

- [ ] **Step 4: Write the wrapper**

```tsx
// packages/editor/src/editor/shared/vibcoder/Tag.tsx
/**
 * Vibcoder Tag wrapper.
 * Renders the base class from src/themes/components/atoms/tag.css with
 * variant + size + state BEM modifiers. Type unions sourced from
 * `vibcoder-variants.mjs atoms/tag`.
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

// REPLACE these unions with the actual output of `vibcoder-variants.mjs atoms/tag`.
// Pick the most-common variant as default; pick the size that appears as base in CSS as default.
export type TagVariant = "neutral" | "accent" | "success" | "warning" | "error";
export type TagSize = "sm" | "md";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: TagSize;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ variant = "neutral", size = "md", className, children, ...rest }, ref) => {
    // CHECK: is `md` the base default size in tag.css? If variants script lists
    // `md` explicitly, emit `bd-tag--md`. If only `sm` appears, omit on default.
    const classes = [
      "bd-tag", // CHECK: confirm base class name from variants script output
      `bd-tag--${variant}`,
      size !== "md" && `bd-tag--${size}`,
      className,
    ].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  }
);
Tag.displayName = "Tag";
```

If the variants script output disagrees with the placeholder unions above, prefer the script — fix the unions, re-check the rendering.

- [ ] **Step 5: Append to barrel**

Edit `packages/editor/src/editor/shared/vibcoder/index.ts` to add:

```ts
export { Tag } from "./Tag";
export type { TagVariant, TagSize, TagProps } from "./Tag";
```

- [ ] **Step 6: Write the test (minimum contract per `poc-findings.md`)**

```tsx
// packages/editor/src/editor/shared/vibcoder/Tag.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Tag } from "./Tag";

describe("vibcoder Tag wrapper", () => {
  it("renders base class + default variant; omits default-size modifier", () => {
    const { container } = render(<Tag>x</Tag>);
    const el = container.firstElementChild!;
    expect(el.className).toContain("bd-tag");
    expect(el.className).toContain("bd-tag--neutral"); // adjust to actual default
    expect(el.className).not.toContain("bd-tag--md"); // assert base-default omission
  });

  it("emits explicit size class for non-default", () => {
    const { container } = render(<Tag size="sm">x</Tag>);
    expect(container.firstElementChild!.className).toContain("bd-tag--sm");
  });

  it("supports all variants from manifest", () => {
    for (const v of ["neutral", "accent", "success", "warning", "error"] as const) {
      const { container } = render(<Tag variant={v}>x</Tag>);
      expect(container.firstElementChild!.className).toContain(`bd-tag--${v}`);
    }
  });

  it("merges caller className", () => {
    const { container } = render(<Tag className="extra">x</Tag>);
    expect(container.firstElementChild!.className).toContain("extra");
  });
});
```

Run:

```bash
cd packages/editor && npx vitest run src/editor/shared/vibcoder/Tag.test.tsx
```

Expected: all PASS. If a variant fails because the actual CSS uses a different name, fix the union in `Tag.tsx`, then re-run.

- [ ] **Step 7: Gallery — HTML side**

```html
<!-- packages/editor/src/preview/vibcoder-tag.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Vibcoder Tag — gallery</title>
  <link rel="stylesheet" href="/src/themes/components/_layer.css" />
  <link rel="stylesheet" href="/src/themes/default.css" />
  <link rel="stylesheet" href="/src/themes/components/_aliases.generated.css" />
  <link rel="stylesheet" href="/src/themes/components/atoms/tag.css" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    h1 { font-size: 16px; margin: 0 0 16px; }
    h2 { font-size: 12px; margin: 16px 0 8px; opacity: .6; text-transform: uppercase; letter-spacing: .04em; }
    .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .col { border: 1px solid #ccc3; padding: 16px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Vibcoder Tag — side-by-side</h1>
  <div class="grid">
    <div class="col">
      <h2>Vendored HTML</h2>
      <h2>variants</h2>
      <div class="row">
        <span class="bd-tag bd-tag--neutral">neutral</span>
        <span class="bd-tag bd-tag--accent">accent</span>
        <span class="bd-tag bd-tag--success">success</span>
        <span class="bd-tag bd-tag--warning">warning</span>
        <span class="bd-tag bd-tag--error">error</span>
      </div>
      <h2>sizes</h2>
      <div class="row">
        <span class="bd-tag bd-tag--neutral bd-tag--sm">sm</span>
        <span class="bd-tag bd-tag--neutral">md (base)</span>
      </div>
    </div>
    <div class="col">
      <h2>React wrapper</h2>
      <div id="react-root"></div>
    </div>
  </div>
  <script type="module" src="./vibcoder-tag.tsx"></script>
</body>
</html>
```

Adjust the cell list if the variants script output differs.

- [ ] **Step 8: Gallery — React side**

```tsx
// packages/editor/src/preview/vibcoder-tag.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Tag } from "../editor/shared/vibcoder/Tag";

const H = (s: string) => (
  <h2 style={{ fontSize: 12, margin: "16px 0 8px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s}</h2>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
);

function Demo() {
  return (
    <>
      {H("variants")}
      <Row>
        <Tag variant="neutral">neutral</Tag>
        <Tag variant="accent">accent</Tag>
        <Tag variant="success">success</Tag>
        <Tag variant="warning">warning</Tag>
        <Tag variant="error">error</Tag>
      </Row>
      {H("sizes")}
      <Row>
        <Tag size="sm">sm</Tag>
        <Tag>md (base)</Tag>
      </Row>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
```

- [ ] **Step 9: Visual diff**

```bash
cd packages/editor && npm run dev
# In browser: http://localhost:5050/src/preview/vibcoder-tag.html
# Verify HTML side matches React side, cell-by-cell.
# Stop dev server (Ctrl+C) when done.
```

If any cell drifts, capture the diff in a note and treat it as a Phase 1 finding (see Task 7).

- [ ] **Step 10: Type check + commit**

```bash
cd packages/editor && npx tsc --noEmit
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/atoms/tag.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/Tag.tsx \
        packages/editor/src/editor/shared/vibcoder/Tag.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-tag.html \
        packages/editor/src/preview/vibcoder-tag.tsx
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder Tag atom (Phase 1 catch-up)

Phase 1 Task 1. Catches up the tag.css that roadmap claimed POC shipped
but didn't. End-to-end via vibcoder-vendor pipeline: codemod 1 (rename)
+ codemod 2 (token fold) + codemod 3 (alias extend). Wrapper, test (4
cases), barrel export, side-by-side gallery. Gates 19+21+vibcoder-port
green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Tasks 2–6: Batches 1–5

Each batch task follows the **same 4-phase structure**:

**A. Canary the first primitive** — Vendor + variants discovery + wrapper + test + gallery + visual-diff for primitive #1 only. If gates or visual-diff fail, halt the batch and surface the failure (per roadmap canary protocol, Pass 6 finding #7).

**B. Apply per-component template to remaining primitives** — Loop the locked template (Plan 2's `poc-findings.md`) for primitives #2..N. Each gets its own wrapper + test + gallery files. Append each to the barrel as you go.

**C. Batch-level gate sweep** — Run gates against the full batch output. Run `npx vitest run src/editor/shared/vibcoder/` to verify nothing regressed. Type check.

**D. Single batch commit** — One commit per batch with all primitives. Body lists each primitive ported.

**Per-primitive execution checklist** (apply for every primitive, including the canary):

```
1. cp source.css → vendored location
2. npm run vibcoder:vendor
3. bun vibcoder-variants.mjs atoms/<name>  ← capture output
4. Write <Name>.tsx (forwardRef, type unions from step 3, default-omit rule)
5. Append `export { <Name> } from "./<Name>";` to barrel
6. Write <Name>.test.tsx (≥4 cases: base+default-omit, explicit modifier, all-variants, className-merge; +1 per state prop)
7. Write vibcoder-<name>.html + vibcoder-<name>.tsx (3 sections: variants / sizes / states)
8. Visual diff in browser
9. (Tag at end of batch only:) batch commit
```

If any step fails for a primitive, fix it before moving to the next — do NOT defer to "I'll come back to it."

---

## Task 2: Batch 1 — Form atoms (5)

**Primitives:** `input`, `select`, `textarea`, `checkbox`, `switch`

**Notes specific to form atoms:**

- `input`, `select`, `textarea` wrappers MUST use `forwardRef` (focus management is critical for chrome).
- `checkbox` and `switch` are typically rendered around a hidden native `<input type="checkbox">` for a11y. Inspect the vendored CSS to see what DOM structure it expects (e.g., does CSS target `.bd-checkbox > input` or `.bd-checkbox__input`?). Mirror exactly.
- Native HTML attrs (`type`, `name`, `value`, `placeholder`, `checked`, `onChange`) should pass through via `...rest`. Do NOT redeclare them as wrapper props.
- For `select`, render `<select>` directly with `<option>` children — do NOT abstract into an items array (YAGNI).

**Canary:** Start with `input` (highest variant count among form atoms, per vibcoder bundle).

- [ ] **Step 1: Canary `input`** — execute the per-primitive checklist (1–8) for `input`. Halt + surface if gates fail or visual diff drifts.

- [ ] **Step 2: Apply checklist to `select`** (1–8)

- [ ] **Step 3: Apply checklist to `textarea`** (1–8)

- [ ] **Step 4: Apply checklist to `checkbox`** (1–8) — pay special attention to native input wrapping; verify CSS selector targets

- [ ] **Step 5: Apply checklist to `switch`** (1–8) — same wrapping concern as checkbox

- [ ] **Step 6: Batch-level verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor && npx vitest run src/editor/shared/vibcoder/ && npx tsc --noEmit
```

Expected: gates PASS (`check-vibcoder-port` reports 7 file(s) checked: button + tag + 5 form atoms). All wrapper tests PASS. Type check clean.

- [ ] **Step 7: Batch commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/atoms/{input,select,textarea,checkbox,switch}.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/{Input,Select,Textarea,Checkbox,Switch}.tsx \
        packages/editor/src/editor/shared/vibcoder/{Input,Select,Textarea,Checkbox,Switch}.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-{input,select,textarea,checkbox,switch}.{html,tsx}
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder form atoms — input, select, textarea, checkbox, switch (Phase 1 Batch 1)

5 atoms vendored end-to-end via vibcoder-vendor pipeline. forwardRef
wrappers, type unions sourced from vibcoder-variants.mjs, default-size
omission rule honored. Native HTML attrs passed through via ...rest.
checkbox + switch wrap native inputs per vendored CSS expectations.
Per-primitive tests + side-by-side galleries shipped.

Gates 19+21+vibcoder-port green. 7 vendored files checked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Batch 2 — Display atoms (5)

**Primitives:** `avatar`, `badge`, `count`, `thumb`, `icon`

**Notes specific to display atoms:**

- `icon` is the **special case**: it consumes the sprite at `docs/reference/vibcoder/components/atoms/icons.svg` via `<svg><use href="..." /></svg>`. The wrapper accepts `name` (icon ID) + `size` props. Vendor the sprite into `packages/editor/src/themes/components/atoms/icons.svg` (raw copy — no codemod transform on SVG). Wrapper renders `<svg><use href={`/src/themes/components/atoms/icons.svg#i-${name}`} /></svg>`. Type union for `name`: enumerate from sprite via `grep -oE 'id="i-[a-z-]+"' icons.svg | sort -u`.
- `avatar`, `thumb` are media-display atoms — they accept `src`/`alt` (pass through to `<img>`).
- `badge`, `count` are status indicators — typically wrap a number or short string; check CSS for max-width / truncation rules.

**Canary:** Start with `icon` (the structural deviation — gets the sprite logic right early).

- [ ] **Step 1: Canary `icon` — sprite handling**

  1a. Copy the sprite (no codemod):
  ```bash
  cp docs/reference/vibcoder/components/atoms/icons.svg \
     packages/editor/src/themes/components/atoms/icons.svg
  ```
  1b. Vendor the icon CSS via the orchestrator (codemods 1+2+3 run on `icon.css` only; sprite is opaque to them).
  1c. Discover icon names:
  ```bash
  grep -oE 'id="i-[a-z-]+"' packages/editor/src/themes/components/atoms/icons.svg | sed 's/id="i-//; s/"//' | sort -u
  ```
  Capture output. The wrapper's `IconName` type is the union of these names.
  1d. Write wrapper:
  ```tsx
  // packages/editor/src/editor/shared/vibcoder/Icon.tsx
  /**
   * Vibcoder Icon wrapper. Renders an SVG <use> from the vendored sprite.
   * @license BSD-3-Clause
   */
  import { type SVGAttributes, forwardRef } from "react";

  // Generated from icons.svg by hand: replace this union with the grep output.
  export type IconName = "chevron-up" | "chevron-down" | "chevron-left" | "chevron-right" | "x" | "check" | "plus" | "minus" /* ... | full list from grep */;
  export type IconSize = "sm" | "md" | "lg";

  export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, "name"> {
    name: IconName;
    size?: IconSize;
  }

  const SPRITE = "/src/themes/components/atoms/icons.svg";

  export const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ name, size = "md", className, ...rest }, ref) => {
      const classes = [
        "bd-icon",
        size !== "md" && `bd-icon--${size}`,
        className,
      ].filter(Boolean).join(" ");
      return (
        <svg ref={ref} className={classes} aria-hidden="true" {...rest}>
          <use href={`${SPRITE}#i-${name}`} />
        </svg>
      );
    }
  );
  Icon.displayName = "Icon";
  ```
  1e–1h. Write test, append to barrel, gallery (HTML + React), visual diff. Gallery must render every icon name to confirm sprite resolves correctly.

- [ ] **Step 2: Apply checklist to `avatar`** (1–8) — accepts `src`, `alt`, falls back to initial when missing

- [ ] **Step 3: Apply checklist to `badge`** (1–8)

- [ ] **Step 4: Apply checklist to `count`** (1–8)

- [ ] **Step 5: Apply checklist to `thumb`** (1–8)

- [ ] **Step 6: Batch-level verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor && npx vitest run src/editor/shared/vibcoder/ && npx tsc --noEmit
```

Expected: gates PASS (12 files: 7 prior + 5 display). Note: sprite SVG should NOT be counted by `check-vibcoder-port` (it scans CSS only). If the sprite triggers a false positive, fix the script — do NOT skip the sprite.

- [ ] **Step 7: Batch commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/atoms/{avatar,badge,count,thumb,icon}.css \
        packages/editor/src/themes/components/atoms/icons.svg \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/{Avatar,Badge,Count,Thumb,Icon}.tsx \
        packages/editor/src/editor/shared/vibcoder/{Avatar,Badge,Count,Thumb,Icon}.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-{avatar,badge,count,thumb,icon}.{html,tsx}
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder display atoms — avatar, badge, count, thumb, icon (Phase 1 Batch 2)

5 atoms vendored. Icon = special case: sprite copied raw (no codemod
transform), IconName union enumerated from icons.svg id attrs, wrapper
renders <svg><use href> against the vendored sprite path.
avatar/thumb pass src/alt through. badge/count truncation rules
honored per vendored CSS.

Gates green. 12 vendored files checked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Batch 3 — Interactive atoms (3)

**Primitives:** `icon-button`, `slider`, `link`

**Notes specific to interactive atoms:**

- `icon-button` composes `Icon` from Batch 2 + button affordance. Wrapper accepts `name` (icon name) + `variant` + `size` + standard button HTML attrs. Use `forwardRef<HTMLButtonElement>`.
- `slider` is a native `<input type="range">` wrapped with custom-styled track. Pass through `min`, `max`, `step`, `value`, `onChange`. forwardRef to the underlying input.
- `link` wraps `<a>`. Pass through `href`, `target`, `rel`. forwardRef to anchor.

**Canary:** Start with `icon-button` (composes Batch 2's Icon — verifies the cross-batch dependency works).

- [ ] **Step 1: Canary `icon-button`** — execute checklist; the wrapper imports `Icon` from `./Icon`

- [ ] **Step 2: Apply checklist to `slider`** (1–8)

- [ ] **Step 3: Apply checklist to `link`** (1–8)

- [ ] **Step 4: Batch-level verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor && npx vitest run src/editor/shared/vibcoder/ && npx tsc --noEmit
```

Expected: gates PASS (15 files).

- [ ] **Step 5: Batch commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/atoms/{icon-button,slider,link}.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/{IconButton,Slider,Link}.tsx \
        packages/editor/src/editor/shared/vibcoder/{IconButton,Slider,Link}.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-{icon-button,slider,link}.{html,tsx}
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder interactive atoms — icon-button, slider, link (Phase 1 Batch 3)

3 atoms vendored. icon-button composes Icon (Batch 2) + button
affordance. slider wraps native <input type=range>; pass-through min/
max/step/value/onChange. link wraps <a>; pass-through href/target/rel.
All three forwardRef to their respective HTML elements.

Gates green. 15 vendored files checked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Batch 4 — Status atoms (4)

**Primitives:** `progress`, `skeleton`, `spinner`, `helper-text`

**Notes specific to status atoms:**

- `progress`: a `<progress>` element or `<div role="progressbar">` per vendored CSS. If `<progress>`, pass `value` + `max` props. If role-based, accept `value` (0–100) + render width via inline style.
- `skeleton`: pure decorative — accepts `width`, `height` as inline-style overrides. No interaction.
- `spinner`: pure decorative — accepts `size`. Renders `<span aria-hidden="true">` with CSS animation.
- `helper-text`: text container — accepts `tone` (neutral/error/warning/success) prop mapping to `bd-helper-text--<tone>`. Use `<span>` wrapping caller's text node.

**Canary:** Start with `progress` (touches the most native HTML semantics — verifies wrapper handles HTML5 `<progress>` correctly if that's the chosen DOM).

- [ ] **Step 1: Canary `progress`** — execute checklist

- [ ] **Step 2: Apply checklist to `skeleton`** (1–8)

- [ ] **Step 3: Apply checklist to `spinner`** (1–8)

- [ ] **Step 4: Apply checklist to `helper-text`** (1–8)

- [ ] **Step 5: Batch-level verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor && npx vitest run src/editor/shared/vibcoder/ && npx tsc --noEmit
```

Expected: gates PASS (19 files).

- [ ] **Step 6: Batch commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/atoms/{progress,skeleton,spinner,helper-text}.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/{Progress,Skeleton,Spinner,HelperText}.tsx \
        packages/editor/src/editor/shared/vibcoder/{Progress,Skeleton,Spinner,HelperText}.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-{progress,skeleton,spinner,helper-text}.{html,tsx}
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder status atoms — progress, skeleton, spinner, helper-text (Phase 1 Batch 4)

4 atoms vendored. progress uses HTML5 <progress> or role=progressbar
per vendored CSS expectation. skeleton/spinner are decorative
(aria-hidden). helper-text accepts tone prop mapping to BEM modifier.

Gates green. 19 vendored files checked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Batch 5 — Structural atoms (5)

**Primitives:** `divider`, `grip`, `breakpoint-switcher`, `label`, `kbd`

**Notes specific to structural atoms:**

- `divider`: `<hr>` or `<div role="separator">`. Accepts `orientation` (horizontal/vertical) prop.
- `grip`: drag-handle visual. Decorative `<span aria-hidden="true">` with grip icon class — no behavior, consumers wire up drag handlers.
- `breakpoint-switcher`: chrome-specific composite — segmented control showing desktop/tablet/mobile. Accepts `value` + `onChange`. Renders 3 buttons.
- `label`: form-label `<label>`. Accepts `htmlFor`. Pass-through children.
- `kbd`: `<kbd>` element styling for keyboard shortcut display. Pass-through children.

**Canary:** Start with `breakpoint-switcher` (most logic among the structurals — value/onChange semantics).

- [ ] **Step 1: Canary `breakpoint-switcher`** — execute checklist

- [ ] **Step 2: Apply checklist to `divider`** (1–8)

- [ ] **Step 3: Apply checklist to `grip`** (1–8)

- [ ] **Step 4: Apply checklist to `label`** (1–8)

- [ ] **Step 5: Apply checklist to `kbd`** (1–8)

- [ ] **Step 6: Batch-level verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor && npx vitest run src/editor/shared/vibcoder/ && npx tsc --noEmit
```

Expected: gates PASS (24 files = 19 prior + 5 structural).

- [ ] **Step 7: Batch commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/components/atoms/{divider,grip,breakpoint-switcher,label,kbd}.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version \
        packages/editor/src/editor/shared/vibcoder/{Divider,Grip,BreakpointSwitcher,Label,Kbd}.tsx \
        packages/editor/src/editor/shared/vibcoder/{Divider,Grip,BreakpointSwitcher,Label,Kbd}.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-{divider,grip,breakpoint-switcher,label,kbd}.{html,tsx}
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder structural atoms — divider, grip, breakpoint-switcher, label, kbd (Phase 1 Batch 5)

5 atoms vendored. breakpoint-switcher = composite segmented control
with value+onChange. divider as <hr>/separator with orientation prop.
grip is decorative drag-handle. label forwards htmlFor. kbd wraps
native element.

Gates green. 24 vendored files checked. Phase 1 atoms complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Phase 1 milestone — gallery index, findings, status update

**Files:**
- Create: `packages/editor/src/preview/vibcoder-index.html` (master gallery index linking all 24 atom galleries)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md` (Status section)
- Append: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (Phase 1 findings section)

- [ ] **Step 1: Build the master gallery index**

```html
<!-- packages/editor/src/preview/vibcoder-index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Vibcoder gallery index</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; max-width: 720px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 12px; margin: 24px 0 8px; opacity: .6; text-transform: uppercase; letter-spacing: .04em; }
    ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 4px; }
    a { display: block; padding: 8px 12px; border: 1px solid #ccc3; border-radius: 4px; text-decoration: none; color: inherit; font-size: 13px; }
    a:hover { background: #0001; }
  </style>
</head>
<body>
  <h1>Vibcoder gallery index</h1>
  <p style="opacity:.6;font-size:13px;">Phase 1 atoms (24/24 ported). Each link opens a side-by-side gallery for that primitive.</p>

  <h2>Phase 0</h2>
  <ul><li><a href="./vibcoder-button.html">button</a></li></ul>

  <h2>Phase 1 — atoms (24)</h2>
  <ul>
    <li><a href="./vibcoder-tag.html">tag</a></li>
    <li><a href="./vibcoder-input.html">input</a></li>
    <li><a href="./vibcoder-select.html">select</a></li>
    <li><a href="./vibcoder-textarea.html">textarea</a></li>
    <li><a href="./vibcoder-checkbox.html">checkbox</a></li>
    <li><a href="./vibcoder-switch.html">switch</a></li>
    <li><a href="./vibcoder-avatar.html">avatar</a></li>
    <li><a href="./vibcoder-badge.html">badge</a></li>
    <li><a href="./vibcoder-count.html">count</a></li>
    <li><a href="./vibcoder-thumb.html">thumb</a></li>
    <li><a href="./vibcoder-icon.html">icon</a></li>
    <li><a href="./vibcoder-icon-button.html">icon-button</a></li>
    <li><a href="./vibcoder-slider.html">slider</a></li>
    <li><a href="./vibcoder-link.html">link</a></li>
    <li><a href="./vibcoder-progress.html">progress</a></li>
    <li><a href="./vibcoder-skeleton.html">skeleton</a></li>
    <li><a href="./vibcoder-spinner.html">spinner</a></li>
    <li><a href="./vibcoder-helper-text.html">helper-text</a></li>
    <li><a href="./vibcoder-divider.html">divider</a></li>
    <li><a href="./vibcoder-grip.html">grip</a></li>
    <li><a href="./vibcoder-breakpoint-switcher.html">breakpoint-switcher</a></li>
    <li><a href="./vibcoder-label.html">label</a></li>
    <li><a href="./vibcoder-kbd.html">kbd</a></li>
  </ul>

  <p style="opacity:.5;font-size:12px;margin-top:32px;">edge-tab + fab classified DASHBOARD/MOBILE per SCOPE.md — out of chrome scope.</p>
</body>
</html>
```

- [ ] **Step 2: Append Phase 1 findings to `poc-findings.md`**

```markdown
## Phase 1 — Atoms findings (appended after Phase 0 section)

**Date:** [today]
**Scope:** 23 atoms (tag catch-up + 5 batches × 3-5 primitives) + 1 reused (button)
**Outcome:** [PASS | PASS-with-tuning | FAIL]

### Per-batch summary

| Batch | Primitives | Canary result | Visual diff result | Gates |
|---|---|---|---|---|
| 0 | tag | n/a | [✓ / drift in cell X] | PASS |
| 1 | input, select, textarea, checkbox, switch | [pass / fail-on-checkbox] | [...] | PASS |
| 2 | icon, avatar, badge, count, thumb | [...] | [...] | PASS |
| 3 | icon-button, slider, link | [...] | [...] | PASS |
| 4 | progress, skeleton, spinner, helper-text | [...] | [...] | PASS |
| 5 | breakpoint-switcher, divider, grip, label, kbd | [...] | [...] | PASS |

### New tuning needed for Phase 2

(List anything Phase 2 must address before molecules start. Examples:)
- [ ] codemod 2 fold table missing `--buildrick-X-Y` surfaced by `<primitive>`
- [ ] sprite mounting strategy (icon) — does `<use href>` resolve in dev vs prod build? Check before molecules consume Icon.
- [ ] `<input type="range">` styling cross-browser drift — Chromium vs Firefox may need `-moz-` prefixes preserved; verify codemod 1 didn't strip them.

### Conventions reaffirmed (still hold after 23 atom ports)

- Filename != classname (verified 23×)
- Default-prop-value omits modifier class (verified 23×)
- forwardRef on focusable elements (verified — every form, interactive atom)
- State props pair with aria-* (verified — busy, etc.)
- Variants helper as ground truth (zero drift incidents when followed)

### Per-batch CC time (actuals vs roadmap estimate)

| Batch | Estimate | Actual | Notes |
|---|---|---|---|
| 0 | n/a (added) | [...] | Catch-up of roadmap mis-claim |
| 1 | ~3 hr | [...] | |
| 2 | ~3 hr | [...] | Icon sprite added complexity |
| 3 | ~3 hr | [...] | |
| 4 | ~3 hr | [...] | |
| 5 | ~3 hr | [...] | |
```

- [ ] **Step 3: Update spec README status**

Edit `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md` Status section:

```markdown
- [x] Phase A infrastructure landed
- [x] Phase 0 POC dispatched
- [x] Phase 0 POC complete (button atom, findings captured at poc-findings.md)
- [x] Phase 1 atoms — fan-out complete (23 atoms across 6 batches)
- [ ] Phase 2 molecules — fan-out (unblocked once Phase 1 findings reviewed)
```

- [ ] **Step 4: Final verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor
npx vitest run src/editor/shared/vibcoder/ scripts/__tests__/vibcoder-codemod.test.mjs
npx tsc --noEmit
```

Expected: gates PASS (24 files), all tests PASS, type check clean.

- [ ] **Step 5: Smoke-test the master gallery**

```bash
cd packages/editor && npm run dev &
sleep 3
curl -sI http://localhost:5050/src/preview/vibcoder-index.html | head -3
kill %1 2>/dev/null || true
```

Expected: `HTTP/1.1 200`. Then manually visit and click through 3-4 random links to confirm they load.

- [ ] **Step 6: Milestone commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/preview/vibcoder-index.html \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md
git commit -m "$(cat <<'EOF'
docs(spec): Phase 1 atoms complete — milestone M3

23 atoms ported across 6 batches (tag catch-up + 5 category batches).
Master gallery index links all 24 atom galleries (button + 23 Phase 1).
Phase 1 findings appended to poc-findings.md. Spec status updated.

Roadmap estimate: ~5 commits at ~3 hr each. Actuals captured in
findings doc.

Phase 2 molecules unblocked pending findings review.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

**Spec coverage:** Roadmap Phase 1 calls for 22 atoms in 5 batches, grouped by category, each batch shipped per the canary protocol. This plan ships 23 (added `tag` catch-up) in 6 batches (added catch-up batch). edge-tab + fab deliberately excluded per SCOPE.md DASHBOARD/MOBILE classification.

**Why 6 batches not 5:** Tag catch-up makes the warmup explicit and surfaces the fact that Phase 0 didn't actually ship tag. Better to land tag deliberately than to silently include it in a category batch where its skip would hide a roadmap drift.

**Per-component template DRY:** Tasks 2–6 reference the locked template (`poc-findings.md`) instead of duplicating it 22 times. Each batch task spells out:
- The canary primitive (in full, when first encountered in the batch)
- Compact "apply checklist (1–8)" lines for the rest
- Batch-specific notes (e.g., sprite handling for `icon`, native input wrapping for `checkbox`/`switch`)
- A complete batch commit step with all paths spelled out

**Canary protocol baked in:** Each batch's first step IS the canary. If gates or visual diff fail on the canary primitive, the batch halts before consuming time on the rest.

**Type consistency:** Wrapper PascalCase names (`Tag`, `IconButton`, `BreakpointSwitcher`, `HelperText`, `Kbd`) match the barrel exports. Filename mapping is consistent: `kebab-case.css` → `PascalCase.tsx` (e.g., `helper-text.css` → `HelperText.tsx`). Gallery files mirror the source filename: `vibcoder-helper-text.html`.

**Failure modes Phase 1 will deliberately surface:**
- Codemod fold-table coverage gaps at scale (only 1 file in POC; 23 files here)
- Cross-batch dependency wiring (Batch 3 `icon-button` consumes Batch 2 `Icon`)
- Sprite SVG handling outside the codemod transform path
- Native HTML element semantics under the wrapper layer (`<progress>`, `<input type="range">`, `<select>`)
- Vibcoder convention edge cases for state props (e.g., `<details open>`, `<dialog open>`-style attributes that overlap with HTML defaults)

**No placeholders that block execution:** Type unions in Tag.tsx and Icon.tsx are explicitly marked "REPLACE with variants script output" — the implementer KNOWS to swap them. Bracketed placeholders in `poc-findings.md` Phase 1 section appear only in the human-fillable findings table.

**Subagent-driven workflow (recommended):** Each task is one subagent dispatch. Implementer dispatches per batch, two-stage reviews per batch (spec compliance: did all primitives get all 8 steps? code quality: are wrappers idiomatic, tests strong, no leaky coupling?). Estimated ~3-3.5 hr CC per batch + ~10 min review per batch.

**Scope guardian:** Plan does NOT include any code outside the atom port surface. No engine integration, no consumer migration of existing chrome to use new wrappers, no design.md edits beyond the spec README status update. Those land in Phase 5 (re-port) or fall out of new feature work.
