# Vibcoder Phase 0 POC — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port one vibcoder atom (`button`) end-to-end through the Phase A infrastructure to prove the loop, surface tuning needs, and lock the per-component port template before fanning out to the rest of the atoms.

**Architecture:** Vendored CSS lives at `packages/editor/src/themes/components/atoms/button.css` (codemod output, generated). A thin React wrapper at `packages/editor/src/editor/shared/vibcoder/Button.tsx` renders the `bd-button` className with variant/size props. Side-by-side gallery at `packages/editor/src/preview/vibcoder-button.html` proves the React render is visually identical to the vendored HTML demo.

**Tech Stack:** Bun (codemod runtime), React 18 + TypeScript (wrapper), Vite (preview), browser visual diff (manual eyeball — automated visual regression lands in Phase 6).

**Why button first:** Smallest surface (single CSS file in vibcoder bundle), highest variant count among atoms (good stress test for variant + state coverage), zero engine coupling (pure presentation), already exists in the bundle as `bdr-button`.

**Prerequisites:** Plan 1 (Phase A infrastructure) complete. All 15 Phase A tasks merged. Pipeline runs green.

**Out of scope for this plan:** Any other atom port (Phase 1 fans out). Tuning the codemod 2 fold table beyond what `button.css` requires (additive in Phase 1). Automated visual regression (Phase 6).

---

## File Structure

| File | Purpose |
|---|---|
| `docs/reference/vibcoder/components/atoms/button.css` | Source (vendored bundle, gitignored) — read-only input |
| `packages/editor/src/themes/components/atoms/button.css` | Codemod output — generated, NOT hand-edited |
| `packages/editor/src/themes/components/_aliases.generated.css` | Codemod 3 output, auto-extended with button's tokens |
| `packages/editor/src/editor/shared/vibcoder/Button.tsx` | React wrapper rendering `bd-button` className with props |
| `packages/editor/src/editor/shared/vibcoder/Button.test.tsx` | Wrapper unit test |
| `packages/editor/src/editor/shared/vibcoder/index.ts` | Barrel export for the namespace |
| `packages/editor/src/preview/vibcoder-button.html` | Side-by-side gallery: vendored HTML demo + React wrapper render |
| `packages/editor/src/preview/vibcoder-button.tsx` | Vite entry that mounts the React side of the gallery |
| `packages/editor/vite.config.ts` | Add preview HTML entry point (only if not auto-discovered) |
| `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` | Captured tuning needs / surprises for Phase 1 input |

---

## Task 1: Run vendoring pipeline against the button source

**Files:**
- Read: `docs/reference/vibcoder/components/atoms/button.css`
- Generated: `packages/editor/src/themes/components/atoms/button.css`

- [ ] **Step 1:** Confirm source exists

```bash
cd /Users/shahg/Desktop/pencil/buildrik
ls -la docs/reference/vibcoder/components/atoms/button.css
```
Expected: file exists. If missing, the bundle was not vendored — STOP and ask the user how to obtain it.

- [ ] **Step 2:** Copy source into vendored location

The orchestrator does NOT copy from `docs/reference/`; it transforms in-place under `packages/editor/src/themes/components/`. So this step is a manual copy that simulates "bundle vendoring" until Phase 1 automates it.

```bash
cp docs/reference/vibcoder/components/atoms/button.css \
   packages/editor/src/themes/components/atoms/button.css
```

- [ ] **Step 3:** Run the orchestrator

```bash
npm --prefix packages/editor run vibcoder:vendor
```
Expected: 4 numbered steps print, ends with `vibcoder-vendor: complete`. Codemod 1 reports `1/1 files rewritten` (button.css). Codemod 2 reports a non-zero rewrite count if the source uses any folded tokens. Codemod 3 reports the alias count.

- [ ] **Step 4:** Inspect the output

```bash
head -40 packages/editor/src/themes/components/atoms/button.css
grep -E '\.bdr-' packages/editor/src/themes/components/atoms/button.css || echo "no bdr-* survivors"
grep -E 'var\(--buildrick-color-' packages/editor/src/themes/components/atoms/button.css || echo "no vibcoder-shape token consumers"
```
Expected: top of file shows `.bd-button` selector(s); no `bdr-*` survivors; no `--buildrick-color-*` consumers (all folded).

- [ ] **Step 5:** Run gates

```bash
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
```
Expected: all gates PASS, including Gate 19 + Gate 21. `check-vibcoder-port` reports `1 file(s) checked`.

- [ ] **Step 6:** Commit the vendored output

```bash
git add packages/editor/src/themes/components/atoms/button.css \
        packages/editor/src/themes/components/_aliases.generated.css \
        packages/editor/src/themes/components/.bundle-version
git commit -m "$(cat <<'EOF'
feat(editor): vendor vibcoder button atom (POC)

Phase 0 Task 1. Button.css transformed via vibcoder-vendor pipeline:
codemod 1 (class rename) + codemod 2 (token fold) + codemod 3 (alias
extension). Bundle pin updated. Gates 19+21 + check-vibcoder-port green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: React wrapper namespace setup

**Files:**
- Create: `packages/editor/src/editor/shared/vibcoder/index.ts`

The `editor/shared/vibcoder/` directory is the ONLY place chrome JSX imports vendored components from. Future atoms/molecules/organisms each get one file in this namespace.

- [ ] **Step 1:** Create the directory + barrel

```ts
// packages/editor/src/editor/shared/vibcoder/index.ts
/**
 * Vibcoder vendored React wrappers. Each export renders a className from
 * the vendored CSS in src/themes/components/. Wrappers are thin: prop →
 * className mapping only. No business logic, no state, no engine coupling.
 *
 * Source: docs/reference/vibcoder/components/COMPONENTS.md (manifest).
 * @license BSD-3-Clause
 */
export { Button } from "./Button";
```

- [ ] **Step 2:** Commit (Button.tsx lands in Task 3)

```bash
mkdir -p packages/editor/src/editor/shared/vibcoder
# write index.ts as above using the Write tool
git add packages/editor/src/editor/shared/vibcoder/index.ts
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder React wrapper namespace

Phase 0 Task 2. shared/vibcoder/ is the single import surface for
chrome JSX consuming vendored components. Barrel ready; Button lands
next.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Button wrapper component

**Files:**
- Create: `packages/editor/src/editor/shared/vibcoder/Button.tsx`

- [ ] **Step 1:** Read the manifest to confirm Button's variants + sizes

```bash
grep -A 8 '^| `bdr-button`' docs/reference/vibcoder/components/COMPONENTS.md
```
Expected: a row showing variants (e.g., `primary | secondary | ghost`) and sizes (e.g., `sm | md | lg`). If the manifest format differs, adapt the props to whatever it specifies.

- [ ] **Step 2:** Write the wrapper

```tsx
// packages/editor/src/editor/shared/vibcoder/Button.tsx
/**
 * Vibcoder Button wrapper.
 * Renders the `bd-button` class from src/themes/components/atoms/button.css
 * with `--variant` and `--size` BEM modifiers.
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...rest }, ref) => {
    const classes = [
      "bd-button",
      `bd-button--${variant}`,
      `bd-button--${size}`,
      className,
    ].filter(Boolean).join(" ");
    return (
      <button ref={ref} className={classes} {...rest}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
```

- [ ] **Step 3:** Type check

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4:** Commit

```bash
git add packages/editor/src/editor/shared/vibcoder/Button.tsx
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder Button wrapper

Phase 0 Task 3. forwardRef wrapper renders bd-button + variant + size
modifier classes. Pure className mapping; no logic, no state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Wrapper unit test

**Files:**
- Create: `packages/editor/src/editor/shared/vibcoder/Button.test.tsx`

- [ ] **Step 1:** Write failing tests

```tsx
// packages/editor/src/editor/shared/vibcoder/Button.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "./Button";

describe("vibcoder Button wrapper", () => {
  it("renders default variant + size classes", () => {
    const { container } = render(<Button>Click</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bd-button");
    expect(btn.className).toContain("bd-button--primary");
    expect(btn.className).toContain("bd-button--md");
  });

  it("respects variant + size props", () => {
    const { container } = render(<Button variant="ghost" size="lg">x</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bd-button--ghost");
    expect(btn.className).toContain("bd-button--lg");
  });

  it("merges caller className", () => {
    const { container } = render(<Button className="extra">x</Button>);
    expect(container.querySelector("button")!.className).toContain("extra");
  });

  it("forwards type + onClick", () => {
    let clicked = false;
    const { container } = render(
      <Button type="submit" onClick={() => { clicked = true; }}>x</Button>
    );
    const btn = container.querySelector("button")!;
    expect(btn.type).toBe("submit");
    btn.click();
    expect(clicked).toBe(true);
  });
});
```

- [ ] **Step 2:** Run

```bash
cd packages/editor && npx vitest run src/editor/shared/vibcoder/Button.test.tsx
```
Expected: 4 passing.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/src/editor/shared/vibcoder/Button.test.tsx
git commit -m "$(cat <<'EOF'
test(editor): vibcoder Button wrapper unit tests (4 cases)

Phase 0 Task 4. Default classes, variant + size, className merge,
event forwarding.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Side-by-side gallery — HTML side

**Files:**
- Create: `packages/editor/src/preview/vibcoder-button.html`

- [ ] **Step 1:** Confirm preview dir exists; create if missing

```bash
mkdir -p packages/editor/src/preview
ls packages/editor/src/preview/
```

- [ ] **Step 2:** Write the HTML page that loads vendored CSS + renders all variants statically

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Vibcoder Button — POC gallery</title>
  <link rel="stylesheet" href="/src/themes/components/_layer.css" />
  <link rel="stylesheet" href="/src/themes/_base.css" />
  <link rel="stylesheet" href="/src/themes/components/_aliases.generated.css" />
  <link rel="stylesheet" href="/src/themes/components/atoms/button.css" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; background: var(--bd-bg-panel, #fff); color: var(--bd-fg-primary, #000); }
    h1 { font-size: 16px; margin: 0 0 16px; }
    h2 { font-size: 12px; margin: 24px 0 8px; opacity: .6; text-transform: uppercase; letter-spacing: .04em; }
    .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .col { border: 1px solid #ccc3; padding: 16px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Vibcoder Button — POC side-by-side</h1>
  <div class="grid">
    <div class="col">
      <h2>Vendored HTML (raw className)</h2>

      <h2>variants × sizes</h2>
      <div class="row">
        <button class="bd-button bd-button--primary bd-button--sm">primary sm</button>
        <button class="bd-button bd-button--primary bd-button--md">primary md</button>
        <button class="bd-button bd-button--primary bd-button--lg">primary lg</button>
      </div>
      <div class="row">
        <button class="bd-button bd-button--secondary bd-button--md">secondary</button>
        <button class="bd-button bd-button--ghost bd-button--md">ghost</button>
        <button class="bd-button bd-button--primary bd-button--md" disabled>disabled</button>
      </div>
    </div>

    <div class="col">
      <h2>React wrapper</h2>
      <div id="react-root"></div>
    </div>
  </div>
  <script type="module" src="./vibcoder-button.tsx"></script>
</body>
</html>
```

- [ ] **Step 3:** Commit

```bash
git add packages/editor/src/preview/vibcoder-button.html
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder POC gallery — HTML side

Phase 0 Task 5. Static HTML demo with raw className usage. React
mount placeholder ready. Layered CSS imports verify cascade order.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Side-by-side gallery — React side

**Files:**
- Create: `packages/editor/src/preview/vibcoder-button.tsx`

- [ ] **Step 1:** Write the entry that mounts the React side

```tsx
// packages/editor/src/preview/vibcoder-button.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../editor/shared/vibcoder/Button";

function Demo() {
  return (
    <>
      <h2 style={{ fontSize: 12, margin: "0 0 8px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        variants × sizes
      </h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button variant="primary" size="sm">primary sm</Button>
        <Button variant="primary" size="md">primary md</Button>
        <Button variant="primary" size="lg">primary lg</Button>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button disabled>disabled</Button>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
```

- [ ] **Step 2:** Commit

```bash
git add packages/editor/src/preview/vibcoder-button.tsx
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder POC gallery — React side

Phase 0 Task 6. Mounts Button wrapper into the gallery's react-root,
mirroring the HTML side's variant + size matrix for visual diff.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Wire preview into Vite (if needed)

**Files:**
- Modify: `packages/editor/vite.config.ts` (only if Vite doesn't auto-discover preview HTML files)

- [ ] **Step 1:** Inspect current Vite config

```bash
cat packages/editor/vite.config.ts
```

- [ ] **Step 2:** Decide

If `rollupOptions.input` is already configured with multi-page entries, add `vibcoderButton: 'src/preview/vibcoder-button.html'`. If Vite is configured single-entry (default `index.html`), the simplest fix is to start the dev server with the file path appended in the URL — no config change needed.

- [ ] **Step 3:** Smoke test

```bash
cd packages/editor && npm run dev &
sleep 3
curl -sI http://localhost:5050/src/preview/vibcoder-button.html | head -3
kill %1 2>/dev/null || true
```
Expected: `HTTP/1.1 200 OK` (or 304). If 404, add the entry point per Step 2.

- [ ] **Step 4:** Commit (only if vite.config.ts changed)

```bash
git add packages/editor/vite.config.ts 2>/dev/null && \
  git commit -m "$(cat <<'EOF'
chore(editor): expose vibcoder POC preview to Vite multi-page input

Phase 0 Task 7. Adds preview/vibcoder-button.html to rollupOptions.input
so the side-by-side gallery is reachable via the dev server.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" || echo "no vite.config change needed; skip commit"
```

---

## Task 8: Visual diff in browser

**Files:** none — this is observation, not code.

- [ ] **Step 1:** Start dev server

```bash
cd packages/editor && npm run dev
```
Expected: Vite prints `Local: http://localhost:5050/`.

- [ ] **Step 2:** Open the gallery

```
http://localhost:5050/src/preview/vibcoder-button.html
```

- [ ] **Step 3:** Compare both columns side-by-side

For each variant + size pair, the HTML side and the React side must be **pixel-identical**:
- Same background color, border, radius
- Same padding + height
- Same font, weight, letter-spacing
- Same hover, focus, active states (manually hover/focus each)
- `disabled` state on both renders the same opacity + cursor

- [ ] **Step 4:** Capture findings

If anything differs, write the diff to a findings doc (Task 9 commits it). Common surprises to look for:
- Codemod 2 fold table missed a token → button has wrong color
- Codemod 1 missed a class form → some selectors didn't rewrite
- Cascade order wrong → Emotion's `<button>` reset overrides vendored styles
- Size variant naming mismatch → vibcoder uses `--small` not `--sm`

- [ ] **Step 5:** Stop dev server (Ctrl+C)

---

## Task 9: Capture POC findings → spec input for Phase 1

**Files:**
- Create: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md`

- [ ] **Step 1:** Write the findings doc

```markdown
# Vibcoder Phase 0 POC — Findings

**Date:** [today]
**POC component:** atoms/button
**Outcome:** [PASS | PASS-with-tuning | FAIL]

## Pipeline observations

- Codemod 1 rewrites: <N>/1 files
- Codemod 2 rewrites: <N>/1 files
- Codemod 3 alias count: <N>
- All gates PASS: yes/no
- Bundle pin stable: yes/no

## Visual diff

| Variant + size | HTML | React | Match? | Notes |
|---|---|---|---|---|
| primary sm | ✓ | ✓ | yes | |
| primary md | ✓ | ✓ | yes | |
| primary lg | ✓ | ✓ | yes | |
| secondary md | ✓ | ✓ | yes | |
| ghost md | ✓ | ✓ | yes | |
| disabled | ✓ | ✓ | yes | |

## Tuning needed for Phase 1

(List anything Phase 1 must address. Examples below — replace with actual findings.)

- [ ] codemod 2 fold table missing token `--buildrick-color-foo` → add mapping
- [ ] codemod 1 didn't rewrite `:where(.bdr-button)` selector form → extend regex
- [ ] vendored `:focus-visible` ring conflicts with Emotion default → add to overrides layer

## Per-component port template (locked)

For each future atom/molecule/organism port, the steps are:

1. `cp docs/reference/vibcoder/components/<tier>/<name>.css packages/editor/src/themes/components/<tier>/<name>.css`
2. `npm run vibcoder:vendor`
3. Verify gates: `bash packages/editor/scripts/ds-grep-gates.sh && bash packages/editor/scripts/check-vibcoder-port.sh`
4. Write wrapper at `packages/editor/src/editor/shared/vibcoder/<Name>.tsx` mirroring the manifest's variant + state matrix
5. Add wrapper unit test at `<Name>.test.tsx`
6. Add gallery entry at `packages/editor/src/preview/vibcoder-<name>.html` + `.tsx`
7. Visual diff in browser
8. Commit per-component (one PR per batch of N components — see roadmap)

## Recommendation

[Proceed to Phase 1 / Iterate POC / Reopen design.md Section X]
```

- [ ] **Step 2:** Fill in the findings table from observations in Task 8. Replace bracketed placeholders.

- [ ] **Step 3:** Commit

```bash
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md
git commit -m "$(cat <<'EOF'
docs(spec): vibcoder Phase 0 POC findings + per-component template

Phase 0 Task 9. Captures pipeline observations, visual diff results,
and any tuning needed before Phase 1 fans out. Locks the per-component
port template for atoms/molecules/organisms.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Update spec status + Phase 0 summary

- [ ] **Step 1:** Edit `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md`. Update the Status section to add:

```markdown
- [x] Phase A infrastructure landed
- [x] Phase 0 POC dispatched
- [x] Phase 0 POC complete (button atom, findings captured)
- [ ] Phase 1 atoms — fan-out (blocked on poc-findings tuning)
```

- [ ] **Step 2:** If `poc-findings.md` flagged any codemod tuning, update `design.md` Section 3 (Data Flow) inline with the additions to the codemod 2 fold table or codemod 1 regex extensions. Each tuning becomes a Phase 1 Task 0 input.

- [ ] **Step 3:** Final verification

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor && npx vitest run src/editor/shared/vibcoder/ scripts/__tests__/vibcoder-codemod.test.mjs
npx tsc --noEmit
```
Expected: gates PASS, all tests PASS, type check clean.

- [ ] **Step 4:** Commit status update

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/design.md 2>/dev/null
git commit -m "$(cat <<'EOF'
docs(spec): mark Phase 0 POC complete + fold-table tuning (if any)

POC: button atom ported end-to-end. Pipeline + gates + wrapper +
gallery all green. Findings captured in poc-findings.md. Phase 1
atoms unblocked once tuning lands.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

**Spec coverage:** Phase 0 in `roadmap.md` calls for: pick atom, vendor + transform via pipeline, write wrapper, validate visually, capture findings, lock per-component template. All covered.

**Why no end-to-end commit at the end of Plan 1:** Plan 1 ends with infrastructure but no port (gates run against zero files = trivially PASS). Plan 2 is the first time the pipeline runs against real input — that's the actual "infrastructure works" proof.

**STOP point baked in:** Task 8 is manual visual diff. The plan deliberately does not automate this in Phase 0 — Phase 6 is where automated visual regression lands. The POC's value is **discovering tuning needs cheaply** before Phase 1 fans out.

**No placeholders:** Every code block compiles. Every command is concrete. Bracketed placeholders (`[today]`, `<N>`) appear only in the `poc-findings.md` template, which is the human's job to fill in from observations.

**Type consistency:** `Button` exports `ButtonVariant` and `ButtonSize` types reused by tests. Wrapper className matches what `button.css` emits after codemod 1. Gallery HTML uses the same class strings the React wrapper builds.

**Failure modes Plan 2 deliberately surfaces (so Phase 1 can fix them once, not 26 times):**
- Codemod fold table coverage gaps
- Cascade-order conflicts with Emotion
- Variant/size naming mismatches between manifest and wrapper props
- Vite preview entry-point wiring assumptions
- Per-component port ergonomics (does the template feel right?)
