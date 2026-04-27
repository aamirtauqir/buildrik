# Phase 4 Vibcoder Chrome Re-port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-port all 21 mapped legacy primitives in `packages/editor/src/shared/ui/` as adapter shims over Phase 3 vibcoder wrappers, plus codemod-driven swap of inline JSX patterns across 280 chrome consumers.

**Architecture:** Adapter shim topology — `shared/ui/<X>.tsx` renders vibcoder wrapper internally + translates legacy props. Inline-styled fallback for visual-only props (fullWidth, etc.). Throws at render only when no translation exists. Carries `// PHASE 5 DELETE` comment. jscodeshift codemods at `packages/editor/scripts/codemods/phase4/` swap inline `<button>`, `<input>`, `<Modal>` JSX in consumers. Two new gates: Gate 23 (forbid direct `@/shared/ui/<X>` imports outside `shared/ui/` itself) + Gate 24 (forbid inline `<button>`/`<input>`/`<select>`/`<textarea>` in `src/editor/`).

**Tech Stack:** TypeScript, React 18, jscodeshift (AST codemods), vitest + jsdom + @testing-library/react + userEvent, pnpm workspaces, bash for grep gates.

---

## Pre-flight setup (run once before T1)

- [ ] **Verify branch + test baseline**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git status
git log -1 --oneline
```

Expected: branch=main, HEAD at Phase 4 design commit `0dd3ff7` (or later), working tree clean except `packages/editor/src/project/`.

- [ ] **Verify test suite baseline**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5
```

Expected: `Test Files 193 passed (193)`, `Tests 1599 passed (1599)`.

- [ ] **Verify all DS gates green**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | tail -3
```

Expected: `=== DS V1 gates: 13 passed + 4 chrome-axiom gates at baseline + green-panel check ===`.

- [ ] **Install jscodeshift dev dep (for codemod toolchain)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && pnpm add --filter @buildrik/editor --save-dev jscodeshift @types/jscodeshift
```

Expected: `pnpm-lock.yaml` updated with `jscodeshift` + `@types/jscodeshift`. Test baseline still passes (run `pnpm test` to confirm).

- [ ] **Commit dep install separately**

```bash
git add packages/editor/package.json pnpm-lock.yaml
git commit -m "chore(editor): add jscodeshift devDep for Phase 4 codemod toolchain

Phase 4 chrome re-port uses jscodeshift codemods to swap inline JSX
patterns in 280 chrome consumer files. Toolchain lives at
packages/editor/scripts/codemods/phase4/. T1 canary builds the first
codemod (Button) + shared _lib helpers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1: Button canary + Phase 4 infrastructure

**Why first:** Lowest-risk primitive (atom, mechanical swap). Establishes codemod toolchain + adapter shim template + per-task verification cadence + 2 new gates. All subsequent tasks reference T1 as canonical.

**Files:**
- Create: `packages/editor/scripts/codemods/_lib/jsx-query.ts` (AST helpers)
- Create: `packages/editor/scripts/codemods/_lib/import-swap.ts` (import rewriting)
- Create: `packages/editor/scripts/codemods/phase4/button.ts` (jscodeshift codemod)
- Create: `packages/editor/scripts/codemods/phase4/__tests__/button.codemod.test.ts`
- Create: `packages/editor/scripts/codemods/phase4/__tests__/fixtures/button.input.tsx`
- Create: `packages/editor/scripts/codemods/phase4/__tests__/fixtures/button.output.tsx`
- Modify: `packages/editor/src/shared/ui/Button.tsx` (replace 173-line implementation with ~50-line adapter shim)
- Create: `packages/editor/src/shared/ui/__tests__/Button.adapter.test.tsx`
- Modify: `packages/editor/scripts/ds-grep-gates.sh` (add Gate 23 + Gate 24)
- Modify: `packages/editor/scripts/.chrome-axioms-baseline` (extend with Gate 24 baseline)
- Modify: `packages/editor/package.json` (add `codemod:phase4:button` script)

### T1.A — Codemod toolchain helpers

- [ ] **Step 1: Write `_lib/jsx-query.ts`**

```ts
// packages/editor/scripts/codemods/_lib/jsx-query.ts
/**
 * jscodeshift JSX query helpers for Phase 4 codemods.
 * Reusable across all per-primitive codemods.
 *
 * @license BSD-3-Clause
 */
import type { JSCodeshift, Collection, JSXElement, JSXIdentifier } from "jscodeshift";

/** Find all JSX elements with a specific lowercase tag name (e.g., "button"). */
export function findJsxElementsByTag(
  j: JSCodeshift,
  root: Collection<unknown>,
  tagName: string,
): Collection<JSXElement> {
  return root.find(j.JSXElement, {
    openingElement: {
      name: { type: "JSXIdentifier", name: tagName } as JSXIdentifier,
    },
  });
}

/** Replace a JSX element's tag name (lowercase → PascalCase wrapper). */
export function renameJsxTag(
  j: JSCodeshift,
  element: JSXElement,
  newTagName: string,
): void {
  if (element.openingElement.name.type === "JSXIdentifier") {
    element.openingElement.name.name = newTagName;
  }
  if (element.closingElement?.name.type === "JSXIdentifier") {
    element.closingElement.name.name = newTagName;
  }
}
```

- [ ] **Step 2: Write `_lib/import-swap.ts`**

```ts
// packages/editor/scripts/codemods/_lib/import-swap.ts
/**
 * Add or replace a named import in a TSX file via jscodeshift.
 *
 * @license BSD-3-Clause
 */
import type { JSCodeshift, Collection, ImportDeclaration } from "jscodeshift";

/** Ensure `import { Name } from "path"` exists. Idempotent. */
export function ensureNamedImport(
  j: JSCodeshift,
  root: Collection<unknown>,
  importName: string,
  fromPath: string,
): void {
  const existing = root.find(j.ImportDeclaration, {
    source: { value: fromPath },
  });

  if (existing.size() > 0) {
    const decl = existing.nodes()[0] as ImportDeclaration;
    const alreadyImported = decl.specifiers?.some(
      (s) => s.type === "ImportSpecifier" && s.imported.type === "Identifier" && s.imported.name === importName,
    );
    if (!alreadyImported) {
      decl.specifiers = decl.specifiers ?? [];
      decl.specifiers.push(j.importSpecifier(j.identifier(importName)));
    }
    return;
  }

  // No existing import — add a new one at the top of the file.
  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier(importName))],
    j.literal(fromPath),
  );
  root.find(j.Program).get("body", 0).insertBefore(newImport);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm exec tsc --noEmit scripts/codemods/_lib/jsx-query.ts scripts/codemods/_lib/import-swap.ts 2>&1 | head -10
```

Expected: zero errors (the files type-check standalone given jscodeshift types).

### T1.B — Button codemod

- [ ] **Step 4: Write `phase4/button.ts` codemod**

```ts
// packages/editor/scripts/codemods/phase4/button.ts
/**
 * Phase 4 codemod: swap inline `<button>` JSX in `src/editor/` consumers
 * to vibcoder Button via the shim layer at @/shared/ui/Button.
 *
 * Scope: only matches `<button>` elements (lowercase). Does NOT touch
 * `<Button>` (PascalCase, already a component).
 *
 * Skip rules:
 * - Inside __tests__/ directories (let test author keep raw <button>)
 * - Inside scripts/ directories (CI scripts, not chrome)
 * - Inside src/preview/ directories (vibcoder galleries control their own JSX)
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/button.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import type { Transform, FileInfo, API, Options } from "jscodeshift";
import { findJsxElementsByTag, renameJsxTag } from "../_lib/jsx-query";
import { ensureNamedImport } from "../_lib/import-swap";

const transform: Transform = (file: FileInfo, api: API, _options: Options) => {
  const j = api.jscodeshift;
  // Skip files we never want to touch.
  if (
    file.path.includes("/__tests__/") ||
    file.path.includes("/scripts/") ||
    file.path.includes("/preview/")
  ) {
    return file.source;
  }

  const root = j(file.source);
  const buttons = findJsxElementsByTag(j, root, "button");
  if (buttons.size() === 0) return file.source;

  buttons.forEach((path) => {
    renameJsxTag(j, path.node, "Button");
  });

  ensureNamedImport(j, root, "Button", "@/shared/ui/Button");

  return root.toSource({ quote: "double" });
};

export default transform;
export const parser = "tsx";
```

- [ ] **Step 5: Write codemod test fixtures**

```tsx
// packages/editor/scripts/codemods/phase4/__tests__/fixtures/button.input.tsx
import { useState } from "react";

export function Demo() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Click</button>
      <button disabled>Disabled</button>
    </div>
  );
}
```

```tsx
// packages/editor/scripts/codemods/phase4/__tests__/fixtures/button.output.tsx
import { Button } from "@/shared/ui/Button";
import { useState } from "react";

export function Demo() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Button onClick={() => setCount(count + 1)}>Click</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
```

- [ ] **Step 6: Write codemod test**

```ts
// packages/editor/scripts/codemods/phase4/__tests__/button.codemod.test.ts
/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jscodeshift from "jscodeshift";
import transform from "../button";

const FIXTURES = join(__dirname, "fixtures");

describe("button codemod", () => {
  it("swaps inline <button> → <Button> + adds import", () => {
    const input = readFileSync(join(FIXTURES, "button.input.tsx"), "utf-8");
    const expected = readFileSync(join(FIXTURES, "button.output.tsx"), "utf-8").trim();

    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );

    expect((result as string).trim()).toBe(expected);
  });

  it("skips files in __tests__/", () => {
    const input = `<button>Test</button>`;
    const result = transform(
      { path: "/fake/src/editor/__tests__/Foo.test.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips files with no <button>", () => {
    const input = `export const x = 1;`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });
});
```

- [ ] **Step 7: Run codemod tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm exec vitest run scripts/codemods/phase4/__tests__/button.codemod.test.ts 2>&1 | tail -10
```

Expected: `Tests 3 passed (3)`.

### T1.C — Button adapter shim

- [ ] **Step 8: Replace `shared/ui/Button.tsx` with adapter shim**

```tsx
// packages/editor/src/shared/ui/Button.tsx
// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Button.
/**
 * Adapter shim — translates legacy Button API to vibcoder Button.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   variant: passthrough (same union)
 *   size: passthrough (same union)
 *   icon + iconPosition: composed as children of vibcoder Button
 *   loading: maps to busy={loading}; renders Spinner when loading
 *   fullWidth: applied as inline style (vibcoder has no fullWidth prop)
 *
 * Untranslatable: none currently. Throws-at-render strategy (Phase 4 Q4)
 * applies if a future legacy prop arrives without a vibcoder mapping.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type CSSProperties } from "react";
import { Button as VibcoderButton } from "@/editor/shared/vibcoder";
import { Spinner } from "./Spinner";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "publish";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", icon, iconPosition = "left", loading = false, fullWidth = false, children, style, ...rest },
    ref,
  ) => {
    const composedStyle: CSSProperties | undefined = fullWidth
      ? { width: "100%", ...style }
      : style;
    return (
      <VibcoderButton
        ref={ref}
        variant={variant}
        size={size}
        busy={loading}
        style={composedStyle}
        {...rest}
      >
        {loading && <Spinner size={size === "sm" ? 12 : 16} color="currentColor" />}
        {!loading && icon && iconPosition === "left" && icon}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </VibcoderButton>
    );
  },
);
Button.displayName = "Button";

export default Button;
```

- [ ] **Step 9: Write adapter contract tests**

```tsx
// packages/editor/src/shared/ui/__tests__/Button.adapter.test.tsx
/**
 * Phase 4 contract tests — verify legacy Button prop surface still
 * works through the adapter shim → vibcoder Button.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../Button";

describe("Button adapter shim", () => {
  it("renders a button element with vibcoder bd-btn class", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toHaveClass("bd-btn");
    expect(btn).toHaveClass("bd-btn--primary");
  });

  it("translates loading=true to busy=true on vibcoder Button", () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole("button", { name: /save/i });
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toHaveClass("bd-btn--busy");
  });

  it("renders Spinner when loading=true", () => {
    const { container } = render(<Button loading>Save</Button>);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });

  it("does NOT render Spinner when loading=false", () => {
    const { container } = render(<Button>Save</Button>);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("applies fullWidth as inline style width:100%", () => {
    render(<Button fullWidth>Wide</Button>);
    const btn = screen.getByRole("button", { name: "Wide" });
    expect(btn.style.width).toBe("100%");
  });

  it("renders icon to the left of children when iconPosition=left", () => {
    render(
      <Button icon={<span data-testid="icon" />} iconPosition="left">
        Save
      </Button>,
    );
    const btn = screen.getByRole("button");
    const icon = screen.getByTestId("icon");
    // Icon comes before the text node.
    expect(btn.firstChild).toBe(icon);
  });

  it("renders icon to the right of children when iconPosition=right", () => {
    render(
      <Button icon={<span data-testid="icon" />} iconPosition="right">
        Save
      </Button>,
    );
    const btn = screen.getByRole("button");
    const icon = screen.getByTestId("icon");
    expect(btn.lastChild).toBe(icon);
  });

  it("passes variant + size through to vibcoder", () => {
    render(<Button variant="ghost" size="lg">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bd-btn--ghost");
    expect(btn).toHaveClass("bd-btn--lg");
  });

  it("forwards ref to underlying button element", () => {
    let captured: HTMLButtonElement | null = null;
    render(<Button ref={(el) => { captured = el; }}>Ref</Button>);
    expect(captured).not.toBeNull();
    expect(captured!.tagName).toBe("BUTTON");
  });
});
```

- [ ] **Step 10: Run adapter tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm exec vitest run src/shared/ui/__tests__/Button.adapter.test.tsx 2>&1 | tail -10
```

Expected: `Tests 9 passed (9)`.

### T1.D — Gate 23 + Gate 24

- [ ] **Step 11: Add Gate 23 + Gate 24 to ds-grep-gates.sh**

Find the line in `packages/editor/scripts/ds-grep-gates.sh` where Gate 22 ends:
```bash
pass "Gate 22: E3 portal discipline (no document.body outside OverlayMount)"
```

Insert AFTER that line (before the `# ----` summary divider):

```bash

# Gate 23: Shim layer is gate-keeper for mapped primitives.
# Forbids direct imports of `@/shared/ui/<MappedPrimitive>` outside
# `shared/ui/` itself. Every consumer must go through the barrel which
# goes through the shim which goes through vibcoder. Bypass is regression.
# Mapped primitives = the shims actually shipped by Phase 4 T1-T6.
GATE23_PRIMITIVES='Button|Input|Select|Switch|Checkbox|Slider|Spinner|Skeleton|Icon|IconButton|Kbd|Badge|Tag|Card|Tabs|FormField|TextInput|PanelHeader|Modal|Popover|Tooltip|Toast'
GATE23_HITS=$(grep -rE "from ['\"]@/shared/ui/(${GATE23_PRIMITIVES})['\"]" packages/editor/src --include='*.ts' --include='*.tsx' --exclude-dir=__tests__ --exclude-dir=project 2>/dev/null \
  | grep -v 'shared/ui/' \
  | grep -vE '^[[:space:]]*//|:[[:space:]]*/?\*' \
  || true)
if [ -n "$GATE23_HITS" ]; then
  echo "$GATE23_HITS"
  fail "Gate 23: direct shim-primitive import outside shared/ui/ (use barrel @/shared/ui)"
fi
pass "Gate 23: shim layer is gate-keeper for mapped primitives"

# Gate 24: Inline-pattern enforcement.
# Forbids inline lowercase HTML JSX (<button>, <input>, <select>, <textarea>)
# in src/editor/ chrome consumers. Vibcoder Button/Input/Select/Textarea
# replaces these. Baseline+ratchet mode (capture current count, ratchet down
# per task as codemods clean up). Uses anchored ^[[:space:]]*// JS comment
# exclusion (per M5 Gate 14 lesson — `//` global hides trailing-comment
# violations).
GATE24_HITS=$(grep -rEho '<(button|input|select|textarea)[^a-zA-Z]' packages/editor/src/editor --include='*.tsx' --exclude-dir=__tests__ --exclude-dir=preview 2>/dev/null \
  | grep -vE '^[[:space:]]*//|:[[:space:]]*/?\*' \
  | wc -l | tr -d ' ')
BASE_24=$(sed -n '5p' "$BASELINE_FILE" 2>/dev/null || echo "0")
check_gate 24 "$GATE24_HITS" "$BASE_24" "inline <button>/<input>/<select>/<textarea> in editor/ (use vibcoder shim @/shared/ui)" || exit 1

```

- [ ] **Step 12: Capture initial Gate 24 baseline**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | grep "Gate 24" | head -3
```

Expected: First run will FAIL with `FAIL Gate 24 (...): N > baseline 0`. Capture N from the output, then:

```bash
# Append N as line 5 of the baseline file. Replace <N> with the actual number.
echo "<N>" >> packages/editor/scripts/.chrome-axioms-baseline
```

Then re-run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | grep "Gate 24" | head -3
```
Expected: `PASS Gate 24 (...): N at baseline N`.

- [ ] **Step 13: Verify all 24 gates pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

Expected: `=== DS V1 gates: 13 passed + 4 chrome-axiom gates at baseline + green-panel check ===` (or equivalent including new Gate 23 + Gate 24 PASS lines).

### T1.E — Run Button codemod against chrome consumers

- [ ] **Step 14: Add npm script for the codemod**

In `packages/editor/package.json`, add to the `"scripts"` object:

```json
"codemod:phase4:button": "jscodeshift -t scripts/codemods/phase4/button.ts --extensions=ts,tsx --parser=tsx src/editor/"
```

- [ ] **Step 15: Dry-run the codemod (preview changes)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm exec jscodeshift -t scripts/codemods/phase4/button.ts --extensions=ts,tsx --parser=tsx --dry --print src/editor/ 2>&1 | tail -20
```

Expected: List of files that would change + diff preview. Confirm output looks reasonable (every `<button>` → `<Button>` swap is correct; no false positives in test/preview dirs).

- [ ] **Step 16: Run the codemod for real**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm run codemod:phase4:button 2>&1 | tail -10
```

Expected: `N files changed, 0 errors` where N is the file count from dry-run.

- [ ] **Step 17: Run vitest to verify zero regressions**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5
```

Expected: `Test Files 194 passed (194)` (193 + 1 new Button.adapter.test.tsx), `Tests > 1599` (1599 + 9 adapter + 3 codemod).

- [ ] **Step 18: Re-run gates with new Gate 24 expected drop**

The codemod swapped N inline `<button>` → `<Button>`. Gate 24 baseline must drop by N.

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | grep "Gate 24"
```

If Gate 24 reports `PASS at baseline N` but actual count is `N - K` (where K = codemod hits), update baseline:

```bash
# Replace line 5 of baseline file with new lower value.
# (Use sed or hand-edit. The baseline file is 5 lines: 4 axiom gates + Gate 24.)
```

- [ ] **Step 19: Final verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | tail -3 && pnpm exec eslint . --ext .ts,.tsx 2>&1 | tail -3
```

Expected: All gates PASS. ESLint baseline unchanged (pre-existing errors per project policy, no new errors).

### T1.F — Commit

- [ ] **Step 20: Commit T1**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/codemods/_lib/jsx-query.ts \
        packages/editor/scripts/codemods/_lib/import-swap.ts \
        packages/editor/scripts/codemods/phase4/button.ts \
        packages/editor/scripts/codemods/phase4/__tests__/button.codemod.test.ts \
        packages/editor/scripts/codemods/phase4/__tests__/fixtures/button.input.tsx \
        packages/editor/scripts/codemods/phase4/__tests__/fixtures/button.output.tsx \
        packages/editor/src/shared/ui/Button.tsx \
        packages/editor/src/shared/ui/__tests__/Button.adapter.test.tsx \
        packages/editor/scripts/ds-grep-gates.sh \
        packages/editor/scripts/.chrome-axioms-baseline \
        packages/editor/package.json
# Add codemod-touched consumer files (use git add -u to stage existing-modified consumers)
git add -u packages/editor/src/editor/

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-4): T1 Button canary + Phase 4 infrastructure

Establishes Phase 4 toolchain: jscodeshift _lib helpers + per-codemod
test pattern + adapter shim template + 2 new gates (23 + 24).

Files:
- scripts/codemods/_lib/{jsx-query,import-swap}.ts — shared AST helpers
- scripts/codemods/phase4/button.ts — first codemod
- scripts/codemods/phase4/__tests__/button.codemod.test.ts — 3 fixture tests
- src/shared/ui/Button.tsx — adapter shim (replaces 173-line implementation)
  Translations: variant/size passthrough; loading→busy + Spinner; icon
  composed as children; fullWidth via inline style.
- src/shared/ui/__tests__/Button.adapter.test.tsx — 9 contract tests
- scripts/ds-grep-gates.sh — Gate 23 (shim layer is gate-keeper) + Gate 24
  (inline-pattern enforcement, baseline+ratchet, anchored // exclusion per
  M5 Gate 14 lesson)
- scripts/.chrome-axioms-baseline — extended with Gate 24 baseline

Codemod swept N inline <button> in src/editor/ consumers (Gate 24
dropped by N).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Form atoms (Input, Select, Switch, Checkbox, Slider)

**Files (5× per primitive):**
- Create: `packages/editor/scripts/codemods/phase4/{input,select,switch,checkbox,slider}.ts`
- Create: `packages/editor/scripts/codemods/phase4/__tests__/{input,select,switch,checkbox,slider}.codemod.test.ts` + matching fixtures
- Modify: `packages/editor/src/shared/ui/{TextInput,FormInput,SliderInput}.tsx` + create wrappers for Switch/Checkbox if not present
- Create: `packages/editor/src/shared/ui/__tests__/{Input,Select,Switch,Checkbox,Slider}.adapter.test.tsx`
- Modify: `packages/editor/scripts/.chrome-axioms-baseline` (Gate 24 ratchet)
- Modify: `packages/editor/package.json` (5 new codemod scripts)

**Per-primitive cadence:** Mirror T1.B + T1.C + T1.E. For each of the 5 primitives:

1. Inspect legacy `shared/ui/<X>.tsx` to identify props
2. Inspect vibcoder `editor/shared/vibcoder/<X>.tsx` to identify target shape
3. Build prop translation table; document in shim JSDoc
4. Write codemod (model after T1.B button.ts)
5. Write codemod test (input/output fixture pair)
6. Write adapter shim (model after T1.C Button.tsx)
7. Write contract tests (5-9 per shim per T1.C precedent)
8. Run codemod against `src/editor/` consumers
9. Run vitest + ratchet Gate 24 baseline
10. Verify all gates green

### T2.A — Input (TextInput legacy → vibcoder Input)

- [ ] **Step 1: Inspect legacy + vibcoder shapes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && grep -E "^export (interface|const|function)" packages/editor/src/shared/ui/TextInput.tsx packages/editor/src/editor/shared/vibcoder/Input.tsx | head -20
```

Document props found in implementer's notes. Build prop mapping table.

- [ ] **Step 2: Write codemod, test, fixtures, shim, contract tests**

Follow T1.B + T1.C + T1.E template VERBATIM, substituting `Button` → `Input`, `<button>` → `<input>`, `Spinner` → `none`, etc. Inline-style fallback for layout-only legacy props that vibcoder doesn't model.

Specific differences from T1:
- Codemod target: `<input>` JSX (NOT `<input type="...">` — match all input element types)
- Shim renders `<VibcoderInput {...mappedProps} />`. NO Spinner.
- Contract tests cover: type forwarding (`type="email"` → vibcoder accepts), value/onChange forwarding, disabled/readonly passthrough, ref forwarding to `<input>` element

- [ ] **Step 3: Run T2.A verification**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -3 && bash scripts/ds-grep-gates.sh 2>&1 | grep "Gate 24"
```

### T2.B — Select

Repeat T2.A pattern. Target tag = `<select>`. Vibcoder Select wrapper at `editor/shared/vibcoder/Select.tsx`.

### T2.C — Switch

Repeat T2.A pattern. Target = legacy Switch component. Vibcoder Switch at `editor/shared/vibcoder/Switch.tsx`. NO `<switch>` HTML element — codemod scope = JSX `<Switch>` from legacy import path.

### T2.D — Checkbox

Repeat T2.A pattern. Target tag = `<input type="checkbox">` AND `<Checkbox>` from legacy. Vibcoder Checkbox at `editor/shared/vibcoder/Checkbox.tsx`.

### T2.E — Slider

Repeat T2.A pattern. Target = legacy SliderInput. Vibcoder Slider at `editor/shared/vibcoder/Slider.tsx`.

### T2.F — Final T2 verification + commit

- [ ] **Step 1: Full suite green**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5
```

Expected: 1599 + 9 (T1) + ~25 (T2 = 5 primitives × ~5 contract tests + 5 codemod tests × 3) = ~1638-1650 tests pass.

- [ ] **Step 2: All 24 gates pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

Expected: All PASS. Gate 24 baseline ratcheted down by total codemod hits across 5 primitives.

- [ ] **Step 3: Commit T2**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/codemods/phase4/{input,select,switch,checkbox,slider}.ts \
        packages/editor/scripts/codemods/phase4/__tests__/{input,select,switch,checkbox,slider}.codemod.test.ts \
        packages/editor/scripts/codemods/phase4/__tests__/fixtures/{input,select,switch,checkbox,slider}.{input,output}.tsx \
        packages/editor/src/shared/ui/{TextInput,FormInput,SliderInput,Switch,Checkbox}.tsx \
        packages/editor/src/shared/ui/__tests__/{Input,Select,Switch,Checkbox,Slider}.adapter.test.tsx \
        packages/editor/scripts/.chrome-axioms-baseline \
        packages/editor/package.json
git add -u packages/editor/src/editor/

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-4): T2 form atoms — Input, Select, Switch, Checkbox, Slider

5 codemods + 5 adapter shims + ~25 net-new tests. All low-risk
mechanical swaps. Gate 24 baseline ratcheted down by N (sum of codemod
hits). Phase 1+2 conventions held.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Display atoms (Spinner, Skeleton, Icon, IconButton, Kbd, Badge, Tag)

**Files (7× per primitive):** Same structure as T2.

**Why grouped:** 7 visual atoms, no behavior change. Some may be re-export-only (legacy + vibcoder shapes align 1:1). For re-export-only cases, the shim is literally:

```tsx
// PHASE 5 DELETE — Phase 4 re-export shim. Legacy and vibcoder Skeleton align 1:1.
export { Skeleton, type SkeletonProps } from "@/editor/shared/vibcoder";
export default Skeleton;
```

Adapter contract tests still required (verify the re-export works + class is `bd-skeleton`).

### T3.A — Spinner
### T3.B — Skeleton
### T3.C — Icon
### T3.D — IconButton
### T3.E — Kbd
### T3.F — Badge
### T3.G — Tag

For each: follow T1.B + T1.C + T1.E template. Inspect-then-shim cadence.

### T3.H — Final T3 verification + commit

- [ ] **Step 1: Full suite + gates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5 && bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

Expected: ~1670-1700 tests pass, all 24 gates PASS.

- [ ] **Step 2: Commit T3**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/codemods/phase4/{spinner,skeleton,icon,icon-button,kbd,badge,tag}.ts \
        packages/editor/scripts/codemods/phase4/__tests__/{spinner,skeleton,icon,icon-button,kbd,badge,tag}.codemod.test.ts \
        packages/editor/scripts/codemods/phase4/__tests__/fixtures/{spinner,skeleton,icon,icon-button,kbd,badge,tag}.{input,output}.tsx \
        packages/editor/src/shared/ui/{Spinner,Skeleton,Icon,IconButton,Kbd,Badge}.tsx \
        packages/editor/src/shared/ui/__tests__/{Spinner,Skeleton,Icon,IconButton,Kbd,Badge,Tag}.adapter.test.tsx \
        packages/editor/scripts/.chrome-axioms-baseline \
        packages/editor/package.json
# Tag is new file in shared/ui/ (not currently present — vibcoder has Tag, legacy doesn't, but consumers may use it)
git add packages/editor/src/shared/ui/Tag.tsx 2>/dev/null || true
git add -u packages/editor/src/editor/

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-4): T3 display atoms — Spinner, Skeleton, Icon, IconButton, Kbd, Badge, Tag

7 codemods + 7 adapter shims + ~35 net-new tests. Several shipped as
re-export-only (legacy/vibcoder shapes aligned 1:1). Gate 24 ratcheted.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Molecules (Card, Tabs, FormField, PanelHeader, TextInput composition)

**Files (~5× per molecule):** Same structure as T2.

**Risk:** Composition diffs more likely than atoms. PanelHeader → vibcoder surface-head molecule (composition shape change, not 1:1).

### T4.A — Card

Legacy `shared/ui/Card.tsx` props vs vibcoder `Card` + `CardHeader` + `CardBody` + `CardFooter` siblings. Shim renders the appropriate sibling tree.

### T4.B — Tabs

Legacy Tabs vs vibcoder Tabs. Likely composes `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` siblings.

### T4.C — FormField

Legacy FormField vs vibcoder form-field molecule. Composition shape.

### T4.D — PanelHeader → surface-head

Legacy PanelHeader maps to vibcoder surface-head molecule (Phase 2). Composition shape change.

### T4.E — Final T4 verification + commit

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5 && bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

Commit per pattern.

---

## Task 5: Modal canary (alone — highest blast radius)

**Why alone:** Modal swap touches focus management, portal mounting, ARIA wiring, click-outside semantics, escape key. Legacy uses `useFocusTrap` + `ReactDOM.createPortal` + hand-rolled overlay div. Vibcoder Modal uses Radix.Dialog (focus trap auto, portal via OverlayMount, ARIA auto, click-outside auto, escape auto).

**Files:**
- Create: `packages/editor/scripts/codemods/phase4/modal.ts` + tests + fixtures
- Modify: `packages/editor/src/shared/ui/Modal.tsx` (HEAVY adapter shim — see code below)
- Create: `packages/editor/src/shared/ui/__tests__/Modal.adapter.test.tsx` (~15-20 tests)
- Modify: `packages/editor/scripts/.chrome-axioms-baseline` (Gate 24 ratchet)
- Modify: `packages/editor/package.json` (codemod script)

### T5.A — Modal adapter shim

- [ ] **Step 1: Replace `shared/ui/Modal.tsx` with adapter shim**

```tsx
// packages/editor/src/shared/ui/Modal.tsx
// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Modal.
/**
 * Adapter shim — translates legacy Modal API to vibcoder Modal (Radix.Dialog).
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   isOpen → open
 *   onClose → onOpenChange (next: boolean) => !next && onClose()
 *   title → ModalTitle child
 *   children → body content (rendered between header and footer)
 *   footer → ModalFooter child
 *   size: sm | md | lg | xl | full
 *     sm/md → vibcoder size="lg" (Phase 3 Modal supports lg/xl only)
 *     lg → vibcoder size="lg"
 *     xl → vibcoder size="xl"
 *     full → vibcoder size="xl" + style={{maxWidth:"90vw"}}
 *   closeOnOverlay → vibcoder Modal handles via Radix.Dialog onPointerDownOutside (default: closes)
 *     If closeOnOverlay=false: Radix.Dialog onPointerDownOutside={e => e.preventDefault()}
 *   closeOnEscape → Radix.Dialog handles (default: closes)
 *     If closeOnEscape=false: onEscapeKeyDown={e => e.preventDefault()}
 *   showCloseButton → conditionally renders ModalClose
 *   initialFocusRef → Radix.Dialog onOpenAutoFocus callback focuses ref
 *
 * Untranslatable: none. Strategy is "compose-or-style" not "throw".
 *
 * Focus trap migration: useFocusTrap hook NO LONGER USED here. Radix.Dialog
 * provides internal focus trap. T7 deletes useFocusTrap after T6 Popover
 * also migrates (only 2 call sites total — Modal + Popover).
 *
 * Body scroll lock: Radix.Dialog handles via overlay scroll-locking. The
 * legacy `document.body.style.overflow = "hidden"` effect is removed.
 *
 * @license BSD-3-Clause
 */
import { useEffect, type ReactNode, type RefObject, type CSSProperties } from "react";
import {
  Modal as VibcoderModal,
  ModalContent,
  ModalTitle,
  ModalClose,
  ModalFooter,
  OverlayMount,
} from "@/editor/shared/vibcoder";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

const SIZE_MAP: Record<NonNullable<ModalProps["size"]>, "lg" | "xl"> = {
  sm: "lg",
  md: "lg",
  lg: "lg",
  xl: "xl",
  full: "xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocusRef,
}: ModalProps) {
  const vibcoderSize = SIZE_MAP[size];
  const fullStyle: CSSProperties | undefined = size === "full" ? { maxWidth: "90vw" } : undefined;

  return (
    <OverlayMount>
      <VibcoderModal open={isOpen} onOpenChange={(next) => { if (!next) onClose(); }}>
        <ModalContent
          size={vibcoderSize}
          style={fullStyle}
          onPointerDownOutside={closeOnOverlay ? undefined : (e) => e.preventDefault()}
          onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            if (initialFocusRef?.current) {
              e.preventDefault();
              initialFocusRef.current.focus();
            }
          }}
        >
          {title && <ModalTitle>{title}</ModalTitle>}
          {showCloseButton && <ModalClose aria-label="Close modal" />}
          <div className="bd-modal__body">{children}</div>
          {footer && <ModalFooter>{footer}</ModalFooter>}
        </ModalContent>
      </VibcoderModal>
    </OverlayMount>
  );
}
Modal.displayName = "Modal";

// ConfirmDialog helper — Phase 4 keeps the API surface, internals delegate to Modal shim.
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmDialogProps) {
  // Implementation follows the same shape as legacy ConfirmDialog —
  // composes Modal + Buttons. See Button.tsx adapter for variant translation.
  // This block kept VERBATIM from legacy for behavior parity.
  // Phase 5: rewrite consumers to use vibcoder Modal directly + drop this helper.
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ margin: 0 }}>{message}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <button onClick={onClose}>{cancelText}</button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          style={{ background: variant === "danger" ? "var(--bd-error)" : "var(--bd-accent)", color: "var(--bd-fg-on-accent)" }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default Modal;
```

NOTE: ConfirmDialog uses inline `<button>` to avoid a Phase 4 in-shim Button import cycle (shared/ui/Modal imports Button which imports vibcoder Button which… etc.). T1's Gate 24 will flag these 2 inline buttons; either bump the Gate 24 baseline by 2 OR refactor ConfirmDialog to import vibcoder Button directly (the cleaner choice — vibcoder doesn't have the cycle issue since it's a higher-tier import).

**Cleaner ConfirmDialog implementation** (preferred):
```tsx
import { Button as VibcoderButton } from "@/editor/shared/vibcoder";
// ... in ConfirmDialog body:
<VibcoderButton variant="ghost" onClick={onClose}>{cancelText}</VibcoderButton>
<VibcoderButton variant={variant === "danger" ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</VibcoderButton>
```

### T5.B — Modal codemod

- [ ] **Step 2: Write modal codemod**

Codemod target = `<Modal>` JSX (PascalCase, not `<modal>` lowercase). The shim shape stays the same import path (`@/shared/ui/Modal`); the codemod is a NO-OP if no inline Modal-shaped JSX exists. T5 codemod focus is **verifying** — not transforming — since the shim handles the swap silently.

If T5 codemod proves trivial (zero JSX transforms needed), document in commit message and ship.

### T5.C — Modal contract tests

- [ ] **Step 3: Write `Modal.adapter.test.tsx` (~15-20 tests)**

Tests cover:
1. Renders dialog when isOpen=true
2. Does not render when isOpen=false
3. onClose called when overlay clicked (closeOnOverlay default true)
4. onClose NOT called when overlay clicked + closeOnOverlay=false
5. onClose called on Escape key (closeOnEscape default true)
6. onClose NOT called on Escape + closeOnEscape=false
7. Title renders as ModalTitle when title prop provided
8. Footer renders as ModalFooter when footer prop provided
9. ShowCloseButton=false hides close button
10. ShowCloseButton=true (default) shows close button
11. InitialFocusRef receives focus on open
12. Focus restoration on close (focus returns to trigger)
13. Size mapping: sm → bd-modal--lg
14. Size mapping: full → bd-modal--xl + style maxWidth 90vw
15. ConfirmDialog renders with confirm + cancel buttons
16. ConfirmDialog onConfirm fires + closes
17. ConfirmDialog onClose fires when cancel clicked
18. Body scroll lock: Radix handles (no body.style.overflow set by shim)
19. Children render inside bd-modal__body wrapper
20. ARIA: dialog has role="dialog" + aria-modal="true" (Radix-auto)

```tsx
// packages/editor/src/shared/ui/__tests__/Modal.adapter.test.tsx
/**
 * Phase 4 contract tests — verify legacy Modal prop surface still works
 * through the adapter shim → vibcoder Modal (Radix.Dialog).
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { Modal, ConfirmDialog } from "../Modal";

describe("Modal adapter shim", () => {
  it("renders dialog when isOpen=true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("does not render dialog when isOpen=false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls onClose when Escape pressed (closeOnEscape default)", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Body</p>
      </Modal>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when Escape + closeOnEscape=false", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEscape={false} title="Test">
        <p>Body</p>
      </Modal>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders title as ModalTitle", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Modal">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByText("My Modal")).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" footer={<button>OK</button>}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("hides close button when showCloseButton=false", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" showCloseButton={false}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByLabelText("Close modal")).toBeNull();
  });

  it("shows close button by default", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
  });

  it("focuses initialFocusRef element on open", async () => {
    function Harness() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <Modal isOpen={true} onClose={() => {}} title="T" initialFocusRef={ref}>
          <button ref={ref}>Initial</button>
        </Modal>
      );
    }
    render(<Harness />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Initial" })).toHaveFocus();
    });
  });

  it("size=sm maps to bd-modal--lg vibcoder class", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" size="sm">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--lg");
  });

  it("size=full maps to bd-modal--xl + maxWidth 90vw", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T" size="full">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("bd-modal--xl");
    expect(dialog.style.maxWidth).toBe("90vw");
  });

  it("renders children inside bd-modal__body wrapper", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T">
        <p data-testid="child">Body</p>
      </Modal>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("bd-modal__body");
  });

  it("dialog has role=dialog + aria-modal=true (Radix-auto)", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="T">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("ConfirmDialog renders confirm + cancel buttons", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        message="Are you sure?"
      />,
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("ConfirmDialog onConfirm fires + closes on confirm click", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        message="Are you sure?"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ConfirmDialog onClose fires when cancel clicked", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={() => {}}
        message="Are you sure?"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Run T5 contract tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm exec vitest run src/shared/ui/__tests__/Modal.adapter.test.tsx 2>&1 | tail -10
```

Expected: `Tests 16 passed (16)`.

- [ ] **Step 5: Verify legacy Popover.focus.test.tsx still passes (load-bearing test)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm exec vitest run src/shared/ui/__tests__/Popover.focus.test.tsx 2>&1 | tail -5
```

Expected: PASS (Popover.tsx not yet swapped — T6 owns it).

### T5.D — Final T5 verification + commit

- [ ] **Step 1: Full suite + gates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5 && bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

Expected: ~1700-1720 tests pass, all 24 gates PASS.

- [ ] **Step 2: Commit T5**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/codemods/phase4/modal.ts \
        packages/editor/scripts/codemods/phase4/__tests__/modal.codemod.test.ts \
        packages/editor/scripts/codemods/phase4/__tests__/fixtures/modal.{input,output}.tsx \
        packages/editor/src/shared/ui/Modal.tsx \
        packages/editor/src/shared/ui/__tests__/Modal.adapter.test.tsx \
        packages/editor/scripts/.chrome-axioms-baseline \
        packages/editor/package.json
git add -u packages/editor/src/editor/

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-4): T5 Modal canary — legacy Modal → vibcoder Radix.Dialog shim

HEAVIEST adapter in Phase 4. Migrations:
- Focus trap: useFocusTrap → Radix.Dialog internal trap (1 of 2 call sites
  killed; T6 Popover finishes the job, T7 deletes hook)
- Portal: ReactDOM.createPortal → OverlayMount (Phase 3 lazy DOM singleton)
- ARIA: hand-rolled aria-modal/labelledby/role → Radix-auto
- Click-outside: hand-rolled → Radix.Dialog onPointerDownOutside
- Escape: hand-rolled → Radix.Dialog onEscapeKeyDown
- Body scroll lock: hand-rolled document.body.style.overflow → Radix handles

ConfirmDialog helper kept (API parity). Internals delegate to Modal shim
+ vibcoder Buttons.

16 contract tests cover focus, portal, ARIA, escape, click-outside,
size mapping, ConfirmDialog. Popover.focus.test.tsx still passes
(Popover untouched until T6).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Popover + Tooltip + Toast (3-or-fewer with inventory step)

**Open risk:** Toast and Tooltip mappings uncertain at plan time. T6.1 inventory determines actual T6 scope.

### T6.1 — Inventory step (FIRST)

- [ ] **Step 1: Verify vibcoder Popover capabilities**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && cat packages/editor/src/editor/shared/vibcoder/Popover.tsx | head -40
```

Determine: Does vibcoder Popover support a "tooltip" variant or shape? If yes → T6 includes Tooltip. If no → Tooltip deferred to T7 keep-as-extension.

- [ ] **Step 2: Verify Toast vibcoder mapping**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && grep -l "Toast" packages/editor/src/editor/shared/vibcoder/ 2>&1 | head -5
```

Per Phase 3 finding: `@radix-ui/react-toast` was removed at T2 cleanup (commit 0fc750c). NotificationCenter pivoted to panel, NOT a toast queue. Expected: NO Toast vibcoder wrapper exists.

If confirmed: Toast is deferred to T7 keep-as-extension. T6 ships without Toast.

- [ ] **Step 3: Document T6.1 outcome inline**

Update commit message draft below to reflect actual T6 scope (Popover only, OR Popover+Tooltip, OR Popover+Tooltip+Toast).

### T6.A — Popover

- [ ] **Step 4: Write Popover codemod + adapter shim + contract tests**

Follow T1.B + T1.C + T1.E template. The Popover adapter is the analog of Modal's adapter — Radix.Popover replaces hand-rolled overlay + useFocusTrap. CRITICAL: this kills the 2nd of 2 useFocusTrap call sites — verify T7 cleanup is queued.

Specific to Popover:
- Legacy uses `useFocusTrap(contentRef, isOpen)` → Radix.Popover internal trap
- Legacy positioning hand-rolled → Radix.Popover provides anchor + side prop (basic positioning; full Floating-UI integration deferred to Phase 5)
- `Popover.focus.test.tsx` is the load-bearing test — must stay green after migration

### T6.B — Tooltip (CONDITIONAL — only if T6.1 confirms vibcoder mapping exists)

If included: follow T1 template. Map legacy Tooltip props to vibcoder Popover-with-tooltip-variant or RadixTooltip.

### T6.C — Toast (LIKELY DEFERRED per T6.1)

If T6.1 confirms no vibcoder mapping: skip. Document in commit message that Toast moves to T7 triage.

### T6.D — Final T6 verification + commit

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5 && bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

Commit message must explicitly note T6 scope outcome:
```
T6 scope (per T6.1 inventory):
- Popover: SHIPPED (kills 2nd of 2 useFocusTrap call sites — T7 deletes hook)
- Tooltip: [SHIPPED | DEFERRED to T7 — vibcoder has no tooltip variant]
- Toast: DEFERRED to T7 (Phase 3 dropped @radix-ui/react-toast at 0fc750c — NotificationCenter pivoted to panel)
```

---

## Task 7: Extensions triage (18) + cleanup

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (NEW Phase 4 section subheader: "T7 extensions triage")
- Optional creates: per-extension shim files for any port-to-X decisions

**Plan amendment (post-T6.1 inventory, 2026-04-27):** vibcoder Popover/Tooltip/Toast are NOT Radix-backed in Phase 3 (verified via `editor/shared/vibcoder/Popover.tsx` — passive surface only). T6 shipped Popover as a HYBRID shim (legacy useFocusTrap + outside-click + Escape preserved; only rendered surface swapped to vibcoder for CSS skin). Cascading impact:
- `useFocusTrap` is **NOT deleted** — still load-bearing for the Popover shim. Phase 5 deletes it after vibcoder Popover gets a Radix.Popover upgrade.
- Tooltip + Toast deferred from T6 → T7 triage (matrix rows updated below).

### T7.A — Extensions triage matrix

For EACH of the 18 extensions in `shared/ui/`:

| Extension | Decision | Rationale |
|---|---|---|
| Accordion | keep-as-extension OR port-to-X | TBD per inspection |
| ColorSwatch | keep-as-extension | No vibcoder equivalent (ColorPicker is different shape) |
| ContextMenu | keep-as-extension | No vibcoder equivalent (Radix.ContextMenu would need Phase 5 install) |
| CopyButton | keep-as-extension | Decorative composition over Button — Buildrik-specific UX |
| ErrorMessage | keep-as-extension OR port-to-X | TBD per inspection |
| ErrorState | keep-as-extension | Empty-state shape; vibcoder EmptyState close but not 1:1 |
| HelpTooltip | depends on Tooltip row decision | If Tooltip ships hybrid bridge → port-to-X via shim; else keep-as-extension |
| Icons | port-to-X (Icon atom) | Variant of Icon atom — likely re-export |
| InfoBanner | keep-as-extension | No vibcoder banner molecule |
| PanelHeader | port-to-X (surface-head) — already DONE in T4.D | Mark as "shipped at T4.D" |
| PremiumBadge | keep-as-extension | Variant of Badge atom — Buildrik-specific styling |
| QuickSwitcher | keep-as-extension | Composes Modal + cmdk; bespoke UX |
| Resizable | keep-as-extension | No vibcoder equivalent — utility wrapper |
| SliderInput | port-to-X (slider atom) — already DONE in T2.E | Mark as "shipped at T2.E" |
| Tooltip | hybrid bridge OR keep-as-extension | T6.1 found vibcoder Tooltip is presentation-only (no hover-intent, delay, anchoring). Hybrid bridge possible (legacy behavior + vibcoder CSS skin) — T7 inspector decides per usage volume |
| Toast | keep-as-extension | Phase 3 dropped @radix-ui/react-toast at commit 0fc750c. NotificationCenter pivoted to panel; queue/provider API has no vibcoder parity. Phase 5 reconsiders if NotificationCenter organism gains queue capability |
| TreeView | keep-as-extension | No vibcoder equivalent |
| UpgradeGate | keep-as-extension | Buildrik-specific business logic |
| UpgradeModal | port-to-X (Modal shim from T5) | Composes Modal + business logic — likely already inherits |

- [ ] **Step 1: Inspect each extension + populate decisions**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && for f in Accordion ContextMenu ColorSwatch CopyButton ErrorMessage ErrorState HelpTooltip Icons InfoBanner PremiumBadge QuickSwitcher Resizable TreeView UpgradeGate UpgradeModal; do
  echo "=== $f ===" && grep -E "^export (interface|const|function)" packages/editor/src/shared/ui/$f.tsx 2>/dev/null | head -5
done
```

- [ ] **Step 2: For each port-to-X decision, ship the port**

Use T1 template (codemod + shim + contract tests). For each KEEP decision: add JSDoc note at top of the legacy file documenting "Phase 4 T7 triage: keep-as-extension because Y".

- [ ] **Step 3: useFocusTrap hook — DEFER deletion to Phase 5**

Per T6.1 inventory + amendment above: vibcoder Popover is not Radix-backed, so the T6 hybrid shim still uses `useFocusTrap`. Verify call sites with:

```bash
cd /Users/shahg/Desktop/pencil/buildrik && grep -rn "useFocusTrap" packages/editor/src --include="*.tsx" --include="*.ts" | grep -v "useFocusTrap.ts\|test"
```

Expected: at least the Popover shim (`packages/editor/src/shared/ui/Popover.tsx`). Possibly Tooltip shim if T7 ships it as hybrid bridge.

DO NOT delete the hook. Document in poc-findings.md Phase 4 section: "useFocusTrap retained — Popover shim load-bearing dependency. Phase 5 deletes after vibcoder Popover gets Radix.Popover upgrade."

### T7.B — Final T7 verification + commit

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5 && bash scripts/ds-grep-gates.sh 2>&1 | tail -5
```

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/shared/ui/ \
        packages/editor/src/shared/hooks/ \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md
git add -u packages/editor/src/editor/

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-4): T7 extensions triage + T6 deferrals

18 extensions triaged. Per-extension decision documented in poc-findings.md
Phase 4 section: K port-to-X (shipped) + (18-K) keep-as-extension (JSDoc
note added).

T6 deferrals resolved:
- Tooltip: [hybrid bridge OR keep-as-extension per inspection]
- Toast: keep-as-extension (queue API gap; Phase 5 reconsiders)

useFocusTrap hook RETAINED — Popover shim load-bearing dependency
(vibcoder Popover not Radix-backed in Phase 3). Phase 5 deletes after
vibcoder Popover gets Radix.Popover upgrade.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8 (M8): Milestone — poc-findings, README, memory, bundle delta

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append `## Phase 4 findings (chrome re-port)` section, ~250 lines)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md` (status line)
- Modify: `packages/editor/scripts/.chrome-axioms-baseline` (final Gate 24 ratchet)
- Create: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_4_shipped_20260428.md`
- Modify: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` (index entry append)

### M8.A — Bundle delta measurement

- [ ] **Step 1: Build at HEAD, capture dist/ size**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm exec vite build 2>&1 | tail -5 && du -sh dist/ && find dist/assets -name "*.js" -exec ls -lh {} \;
```

Capture numbers in implementer's notes.

- [ ] **Step 2: Compare against Phase 3 baseline (commit 6445e21)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git stash 2>&1 | head -3
git checkout 6445e21 -- packages/editor/src/shared/ui packages/editor/src/editor 2>&1 | head -3
cd packages/editor && pnpm exec vite build 2>&1 | tail -5 && du -sh dist/
# Restore HEAD:
cd /Users/shahg/Desktop/pencil/buildrik && git checkout HEAD -- packages/editor/src/shared/ui packages/editor/src/editor && git stash pop 2>&1 | head -3
```

Compute delta in KB. Expected: ~925 KB cold add (Radix + cmdk + react-colorful actually load now via shims).

### M8.B — Append Phase 4 findings section

- [ ] **Step 1: Append to `poc-findings.md`**

Append the following section after Phase 3 closing recommendation:

```markdown

## Phase 4 findings (chrome re-port)

**Date:** 2026-04-28 (start) → [M8 ship date]
**Tasks:** T1 Button canary + Phase 4 infra, T2 form atoms (5), T3 display atoms (7), T4 molecules (~5), T5 Modal canary, T6 Popover + (Tooltip|Toast scope-conditional), T7 extensions triage (18), M8 milestone

### Per-task summary table

| Task | Commit | Tests added | Codemod hits | Notes |
|---|---|---|---|---|
| T1 Button canary | [SHA] | 12 (9 contract + 3 codemod) | N inline `<button>` | Toolchain locked + 2 new gates |
| T2 form atoms | [SHA] | ~25 | M | 5 codemods |
| T3 display atoms | [SHA] | ~35 | P | 7 codemods, several re-export-only |
| T4 molecules | [SHA] | ~20 | Q | Composition shape changes |
| T5 Modal canary | [SHA] | 16 | R | Heavy adapter — focus, portal, ARIA, escape, click-outside |
| T6 Popover (+ ?) | [SHA] | ~15 | S | T6 scope outcome documented inline |
| T7 extensions triage | [SHA] | ~5-15 | T | K extensions ported, 18-K kept |
| M8 milestone | [SHA] | 0 | 0 | Docs + memory |

### Adapter shim contract (Q4 mapping table)

| Primitive | Untranslatable props (THROWS) | Inline-style fallback props | Composition shape |
|---|---|---|---|
| Button | none | fullWidth → width:100% | icon + iconPosition composed as children |
| Modal | none | size=full → maxWidth:90vw | onClose ↔ onOpenChange wrapping |
| ... | ... | ... | ... |

[Subagent fills in for each shim shipped.]

### T6 scope outcome

[Subagent fills in: Popover SHIPPED + Tooltip {SHIPPED|DEFERRED} + Toast {SHIPPED|DEFERRED}]

### T7 extensions triage outcomes (18)

[Subagent fills in 18 lines, one per extension: Name → DECISION (port-to-X | keep-as-extension) — RATIONALE]

### useFocusTrap hook fate

[Subagent fills in: DELETED at T7 (both call sites killed) OR carried to Phase 5]

### Gate 23 + Gate 24 final state

- Gate 23: 21 mapped primitives forbidden as direct imports outside shared/ui/. Final hits: 0.
- Gate 24: Initial baseline N (T1 capture). Final baseline N - K (after K codemod hits across T1-T7). Target: 0 for all primitives the codemods cleaned.

### Bundle delta (FIRST non-zero in this arc)

| State | dist/ size | Major asset KB | Delta vs Phase 2 |
|---|---|---|---|
| Phase 3 ship (6445e21) | [actual KB] | [main bundle KB] | 0 |
| Phase 4 ship (M8) | [actual KB] | [main bundle KB] | [delta KB] (~925 KB expected) |

Methodology: `pnpm exec vite build` at each commit, `du -sh dist/`, asset-by-asset comparison. Cold add comes from Radix.Dialog + Radix.Popover + Radix.Portal + Radix.Slot + cmdk + react-colorful actually loading via consumer shims.

### Phase 5 handoff items

- shim layer DELETION (Phase 5 codemods consumers off shims, then deletes shared/ui/<MappedPrimitive>.tsx)
- Per-organism JSX swap in editor/shell/* (StudioHeader, Topbar, Inspector, etc. → use vibcoder organisms directly, skip atom shim layer)
- Floating-UI integration (anchor + offset + flip + shift)
- #93 PopoverArrow Radix-backing (now possible — Popover swapped to Radix.Popover at T6)
- #77 Icon sprite production-build resolution (Phase 1 carry, chrome integration phase blocker)
- T6 deferred items if any (Toast/Tooltip per T6.1 outcome)
- T7 extension ports if any "port-to-X eventually" decisions

### Conventions reaffirmed (still hold after 21 shims + 18 extension decisions)

- Adapter shim throws ONLY when no translation exists (rare). Visual-only props inline-style. Behavior props map to closest vibcoder/Radix equivalent or sensible default.
- All shims carry // PHASE 5 DELETE comment + JSDoc adaptation note.
- Codemod scope skips __tests__/ + scripts/ + preview/ paths (vibcoder galleries control their own JSX).
- Gate 24 uses anchored ^[[:space:]]*// JS comment exclusion (per M5 Gate 14 lesson — no false-negatives from trailing-comment hits).
- Per-task verification cadence: vitest full suite + 24 DS gates + check-vibcoder-port + ESLint baseline parity. Abort task if not green.

### Per-task CC time (actuals)

[Subagent fills in.]

### Recommendation

**Proceed to Phase 5 chrome integration.** Adapter shim layer SHIPPED. Phase 5 unblocks: per-organism JSX swap commits in editor/shell/, shim deletion, Floating-UI integration. Bundle delta ~925 KB cold add documented (no surprise — first time chrome consumers actually load engine deps).
```

### M8.C — README status update

- [ ] **Step 1: Update README.md status line**

Find line 90 in `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md`:
```markdown
- [ ] Phase 4 — re-port existing 37 chrome components (queued; design pending)
```

Replace with:
```markdown
- [x] Phase 4 — chrome re-port complete (~21 shims + 18 extension decisions / 8 tasks; M8 milestone 2026-04-28, see `poc-findings.md` Phase 4 section)
```

### M8.D — Memory file

- [ ] **Step 1: Write Phase 4 memory file**

```bash
cat > /Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_4_shipped_20260428.md <<'EOF'
---
name: Vibcoder Phase 4 chrome re-port — SHIPPED (M8 milestone closed)
description: 21 adapter shims at shared/ui/<X>.tsx wrapping vibcoder primitives + 18 extensions triaged. ~150 net-new tests. 21 jscodeshift codemods + 2 new gates (23 import discipline + 24 inline-pattern). FIRST non-zero bundle delta (~925 KB cold add). Phase 5 chrome integration unblocked.
type: project
---
Phase 4 fan-out complete [date]. M8 milestone closed at commit [SHA].

**Shipped:**
- 21 adapter shims at packages/editor/src/shared/ui/<X>.tsx with `// PHASE 5 DELETE` comment + JSDoc adaptation note
- 21 jscodeshift codemods at packages/editor/scripts/codemods/phase4/ + shared _lib helpers
- ~150 net-new tests (~80 contract + ~50 codemod + ~20 T5 Modal extras)
- 2 new gates: Gate 23 (shim layer is gate-keeper for mapped primitives) + Gate 24 (forbid inline <button>/<input>/<select>/<textarea> in src/editor/, baseline+ratchet)
- 18 extensions triaged in poc-findings.md Phase 4 section (K ported / 18-K kept-as-extension)
- useFocusTrap hook DELETED (T5 + T6 killed both call sites)
- Bundle delta measured: ~925 KB cold add (Radix.Dialog + Radix.Popover + Radix.Portal + Radix.Slot + cmdk + react-colorful)

**Commit chain:**
- T1 Button canary + Phase 4 infra: [SHA]
- T2 form atoms: [SHA]
- T3 display atoms: [SHA]
- T4 molecules: [SHA]
- T5 Modal canary: [SHA]
- T6 Popover + scope-conditional: [SHA]
- T7 extensions triage + useFocusTrap delete: [SHA]
- M8 milestone: [SHA]

**Why:** Phase 1-3 built the vibcoder primitive alphabet but no chrome consumed it. Phase 4 makes ALL chrome consume vibcoder via adapter shim topology. Phase 5 chrome integration becomes per-organism JSX swap commits in editor/shell/.

**How to apply:**
- **Phase 5 chrome integration** — shim layer is the bridge. Phase 5 codemods consumers off shims (rewrite imports `@/shared/ui/Modal` → `@/editor/shared/vibcoder`), then deletes shim files.
- **Adding new chrome consumers (post-Phase 4)** — import from `@/shared/ui` (the existing barrel). Gate 23 prevents direct `@/shared/ui/<MappedPrimitive>` imports outside shared/ui/. Gate 24 prevents inline lowercase HTML JSX in editor consumers.

**Open follow-ups:**
- Phase 5 deletes shim layer
- Phase 5 does Floating-UI integration
- Phase 5 closes #93 (PopoverArrow Radix-backing — now possible)
- Phase 1+2 carry-forwards: #74-77, #79, #81-82, #89-90, #92
- T6/T7 deferrals (Toast/Tooltip if kept-as-extension)

**Bundle delta measured:** [actual KB from M8.A]
EOF
```

- [ ] **Step 2: Append to MEMORY.md**

```bash
cat >> /Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md <<'EOF'
- [Vibcoder Phase 4 chrome re-port SHIPPED 2026-04-28](project_vibcoder_phase_4_shipped_20260428.md) — M8 closed at `[SHA]`. 21 adapter shims + 21 codemods + 18 extensions triaged + 2 new gates + ~150 net-new tests. FIRST non-zero bundle delta (~925 KB cold add). Phase 5 chrome integration unblocked.
EOF
```

### M8.E — Final M8 commit

- [ ] **Step 1: Run all gates + tests final time**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && pnpm test 2>&1 | tail -5 && bash scripts/ds-grep-gates.sh 2>&1 | tail -5 && bash scripts/check-vibcoder-port.sh 2>&1 | tail -3
```

Expected: ~1750 tests pass, all 24 gates PASS, vibcoder port 16+ files green.

- [ ] **Step 2: Verify clean working tree**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git status
```

Expected: only `packages/editor/src/project/` untracked.

- [ ] **Step 3: Commit M8**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/preview/vibcoder-index.html 2>/dev/null || true
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md \
        packages/editor/scripts/.chrome-axioms-baseline

git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-4): M8 milestone — Phase 4 close-out

- poc-findings.md — Phase 4 section: per-task summary, Q4 mapping
  table per shim, T6 scope outcome, T7 18-extension triage decisions,
  useFocusTrap fate, Gate 23/24 final state, bundle delta measurement
  (FIRST non-zero in this arc, ~925 KB cold add), Phase 5 handoff,
  conventions reaffirmed
- README.md — status updated to "Phase 4 chrome re-port complete"
- .chrome-axioms-baseline — final Gate 24 ratchet (target: 0 for
  primitives the codemods cleaned)

Phase 4 chrome re-port SHIPPED. ~21 shims + ~150 net-new tests +
2 new gates + 18 extensions triaged. Phase 5 chrome integration now
unblocked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

# Verify memory file written (outside repo, no git add):
ls -lh /Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_4_shipped_20260428.md
ls -lh /Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md
```

Expected: M8 commit succeeds. Memory files written. Phase 4 work complete.

---

## Acceptance summary (Phase 4 close-out)

After M8 commit:
- ✓ 21 adapter shims at `packages/editor/src/shared/ui/<X>.tsx` with `// PHASE 5 DELETE` comment
- ✓ 21 jscodeshift codemods at `packages/editor/scripts/codemods/phase4/` with matching tests
- ✓ 18 extensions triaged in poc-findings.md Phase 4 section
- ✓ 2 new gates shipped + passing (Gate 23 + Gate 24)
- ✓ Gate 24 baseline = target zero for all primitives the codemods cleaned
- ✓ ~1750 tests passing (1599 baseline + ~150 net-new)
- ✓ All 24 DS gates green
- ✓ vibcoder port discipline holds (check-vibcoder-port.sh PASS)
- ✓ ESLint baseline unchanged (pre-existing only)
- ✓ vite production build succeeds
- ✓ Bundle delta measured + documented in poc-findings.md (~925 KB cold add expected)
- ✓ README status updated
- ✓ Memory file + MEMORY.md index entry written
- ✓ Working tree clean (excluding `packages/editor/src/project/` untracked dump)
- ✓ Phase 5 chrome integration unblocked
- ✓ All commits on `main` (solo workflow per CLAUDE.md memory)

**Total commits expected:** 1 dep-install commit + 8 task commits (T1-T7 + M8) + 0+ fixup commits as two-stage review surfaces issues during subagent-driven execution.
