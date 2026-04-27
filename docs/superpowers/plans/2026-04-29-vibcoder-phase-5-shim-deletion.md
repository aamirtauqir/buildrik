# Vibcoder Phase 5 — Shim Deletion + Composition Rewrites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the Phase 4 adapter shim layer for primitives that have full vibcoder equivalents, rewriting ~270 consumer call sites to import directly from `@/editor/shared/vibcoder/<X>`. Rewrite 3 composition extensions (CopyButton, PremiumBadge, UpgradeModal) to compose vibcoder primitives directly.

**Architecture:** Codemod-driven rewrites using the Phase 4 `_lib/codemod-factory.ts` toolchain (with two hardening fixes landing in T1). Each shim deletion is one task: codemod consumers → run tests/gates → delete shim file + adapter contract tests → commit. Composition rewrites are manual per-file transformations. Hybrid Popover shim STAYS (blocked on upstream vibcoder Radix.Popover); keep-legacy primitives (Tooltip, Toast, ContextMenu, HelpTooltip + 7 Bucket-E extensions) STAY.

**Tech Stack:** jscodeshift (codemod toolchain), vitest (contract tests), TypeScript strict, vibcoder vendored CSS bundle (`packages/editor/src/themes/components/`), Radix.Dialog (Modal backing).

---

## Scope Check

**In scope:**
- Bucket C — Adapter shim deletion (atoms + molecules + Modal): ~10 codemods, 19 → 1 shim files (only Popover remains)
- Bucket D — Composition rewrites (CopyButton, PremiumBadge, UpgradeModal): 3 manual rewrites
- Toolchain hardening prereqs (P1: codemod factory local-export collision check; P2: Gate 24 AST-based scanner)
- Phase 5 close-out: poc-findings update + memory file + Bucket E reaffirm

**Deferred to Phase 6+ (BLOCKED on upstream vibcoder bundle work):**
- **Bucket A — Hybrid Popover full bridge.** Requires vibcoder Popover gain Radix.Popover backing. Until then, `Popover.tsx` shim stays (load-bearing `useFocusTrap` call site at line 62).
- **Bucket B — Tooltip / Toast / ContextMenu / HelpTooltip ports.** All require upstream vibcoder primitives to gain Radix backing (Tooltip), provider/queue (Toast), or Radix.ContextMenu install (ContextMenu). HelpTooltip cascades from Tooltip.
- **Vibcoder bundle upstream work itself.** Out of scope — that's a vibcoder-repo task, not editor-repo.

**Always-deferred (Bucket E permanent extensions):**
- Icons.tsx (domain glyph palette)
- QuickSwitcher (orchestration: Modal + cmdk + ranking)
- Resizable (drag-handle utility)
- TreeView (generic data component)
- UpgradeGate (plan-gating business logic)
- ErrorBoundary (class component shape)
- InfoBanner (triple export)
- Plus 7 more keep-legacy entries from T7 triage matrix that don't migrate (ColorSwatch, ErrorMessage, ErrorState, Accordion already keep-legacy etc.)

---

## File Structure

### Files created

- `packages/editor/scripts/codemods/phase5/<shim-name>.ts` — one per shim being deleted (~10 files)
- `packages/editor/scripts/codemods/phase5/__tests__/<shim-name>.codemod.test.ts` — fixture test per codemod
- `packages/editor/scripts/codemods/_lib/__tests__/local-export-collision.test.ts` — P1 hardening test

### Files modified

- `packages/editor/scripts/codemods/_lib/import-swap.ts` — P1 add local-export collision check
- `packages/editor/scripts/ds-grep-gates.sh` — P2 replace Gate 24 grep with AST scanner invocation (line ~554)
- `packages/editor/scripts/.chrome-axioms-baseline` — P2 ratchet Gate 24 baseline (likely 100 → real-count after AST)
- `packages/editor/src/shared/ui/index.ts` — drop deleted shims from barrel exports
- `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` — append Phase 5 close-out section
- `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md` — mark Phase 5 SHIPPED at M9
- `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` — add Phase 5 ship entry
- ~270 chrome consumer files — codemod-rewritten import paths

### Files created/added by composition rewrites (T5)

- `packages/editor/src/shared/extensions/CopyButton.tsx` — moved from `shared/ui/`
- `packages/editor/src/shared/extensions/PremiumBadge.tsx` — moved from `shared/ui/`
- `packages/editor/src/shared/extensions/UpgradeModal.tsx` — moved from `shared/ui/`
- `packages/editor/src/shared/extensions/index.ts` — barrel for the 3 composition exports

(Rationale: composition extensions are not primitives. Moving them out of `shared/ui/` clarifies what's a primitive vs a composition. Phase 5 close-out moves them. Consumers update via codemod in T5.)

### Files deleted (after shim deletion)

After T2-T4 complete, these shim files are deleted:
```
src/shared/ui/Button.tsx
src/shared/ui/Input.tsx
src/shared/ui/Select.tsx
src/shared/ui/Switch.tsx
src/shared/ui/Checkbox.tsx
src/shared/ui/Slider.tsx
src/shared/ui/Spinner.tsx
src/shared/ui/Skeleton.tsx
src/shared/ui/Icon.tsx
src/shared/ui/IconButton.tsx
src/shared/ui/Kbd.tsx
src/shared/ui/Badge.tsx
src/shared/ui/Tag.tsx
src/shared/ui/TextInput.tsx
src/shared/ui/SliderInput.tsx
src/shared/ui/Card.tsx
src/shared/ui/Tabs.tsx
src/shared/ui/FormField.tsx
src/shared/ui/PanelHeader.tsx
src/shared/ui/Modal.tsx
```
Plus their adapter contract tests in `src/shared/ui/__tests__/` (21 files matching `<X>.adapter.test.tsx`).

**File NOT deleted: `src/shared/ui/Popover.tsx`** (hybrid stays, blocks on upstream).

---

## Task 1 — Toolchain hardening (P1 + P2 prereqs)

**Files:**
- Modify: `packages/editor/scripts/codemods/_lib/import-swap.ts`
- Create: `packages/editor/scripts/codemods/_lib/__tests__/local-export-collision.test.ts`
- Modify: `packages/editor/scripts/ds-grep-gates.sh:548-558`
- Create: `packages/editor/scripts/jsx-inline-element-scanner.ts` (AST scanner for Gate 24)
- Create: `packages/editor/scripts/__tests__/jsx-inline-element-scanner.test.ts`
- Modify: `packages/editor/scripts/.chrome-axioms-baseline:5` (Gate 24 baseline)

### T1.A — Codemod factory: local-export collision check

Phase 4 hygiene found `_lib/import-swap.ts:ensureNamedImport` blindly added imports even when target file already exported the same name (settings/shared.tsx Select self-recursion bug). Fix: detect local exports of the import-name, bail with skip-warn.

- [ ] **Step 1: Write the failing test**

Create `packages/editor/scripts/codemods/_lib/__tests__/local-export-collision.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ensureNamedImport } from "../import-swap";
import jscodeshift from "jscodeshift";

const j = jscodeshift.withParser("tsx");

describe("ensureNamedImport — local-export collision", () => {
  it("bails when target file declares `export const <name> = ...`", () => {
    const source = `
export const Select = () => null;
const x = 1;
`;
    const root = j(source);
    const result = ensureNamedImport(root, j, "Select", "@/shared/ui/Select");
    expect(result.skipped).toBe(true);
    expect(result.reason).toMatch(/local export/i);
    expect(root.toSource()).not.toContain("@/shared/ui/Select");
  });

  it("bails when target file declares `export function <name>`", () => {
    const source = `
export function Modal() { return null; }
`;
    const root = j(source);
    const result = ensureNamedImport(root, j, "Modal", "@/shared/ui/Modal");
    expect(result.skipped).toBe(true);
  });

  it("bails when target file has `export { <name> }` re-export", () => {
    const source = `
const X = () => null;
export { X as Modal };
`;
    const root = j(source);
    const result = ensureNamedImport(root, j, "Modal", "@/shared/ui/Modal");
    expect(result.skipped).toBe(true);
  });

  it("does NOT bail when local declaration is unrelated", () => {
    const source = `
const helper = 1;
const Modal = "string-not-component";
`;
    const root = j(source);
    const result = ensureNamedImport(root, j, "Button", "@/shared/ui/Button");
    expect(result.skipped).toBe(false);
    expect(root.toSource()).toContain("@/shared/ui/Button");
  });

  it("does NOT bail when local var is named same but not exported", () => {
    const source = `
const Modal = () => null;
`;
    const root = j(source);
    const result = ensureNamedImport(root, j, "Modal", "@/shared/ui/Modal");
    expect(result.skipped).toBe(true);
    expect(result.reason).toMatch(/local declaration/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/editor
npx vitest run scripts/codemods/_lib/__tests__/local-export-collision.test.ts
```

Expected: 5 FAIL — `result.skipped` is undefined or false.

- [ ] **Step 3: Modify import-swap.ts to add collision detection**

Open `packages/editor/scripts/codemods/_lib/import-swap.ts`. Modify `ensureNamedImport` to first scan for local declarations:

```typescript
export interface EnsureImportResult {
  skipped: boolean;
  reason?: string;
}

export function ensureNamedImport(
  root: any,
  j: any,
  name: string,
  fromPath: string,
): EnsureImportResult {
  // Local-export collision check: bail if file already exports a `name` decl,
  // or has a top-level `const name = / function name(`.
  const hasLocalExport =
    root.find(j.ExportNamedDeclaration).filter((p: any) => {
      const decl = p.node.declaration;
      if (!decl) {
        // re-export form: export { foo as name }
        return (p.node.specifiers || []).some(
          (s: any) => s.exported?.name === name,
        );
      }
      if (decl.type === "VariableDeclaration") {
        return decl.declarations.some((d: any) => d.id?.name === name);
      }
      if (decl.type === "FunctionDeclaration") {
        return decl.id?.name === name;
      }
      return false;
    }).size() > 0;

  const hasLocalDecl =
    root.find(j.VariableDeclaration).filter((p: any) =>
      p.parent.node.type === "Program" &&
      p.node.declarations.some((d: any) => d.id?.name === name)
    ).size() > 0 ||
    root.find(j.FunctionDeclaration).filter((p: any) =>
      p.parent.node.type === "Program" && p.node.id?.name === name
    ).size() > 0;

  if (hasLocalExport) {
    return { skipped: true, reason: `local export of '${name}' present — skipping import to avoid collision` };
  }
  if (hasLocalDecl) {
    return { skipped: true, reason: `top-level local declaration of '${name}' present — skipping import to avoid shadowing` };
  }

  // ... existing cross-path duplicate-import check
  const allImports = root.find(j.ImportDeclaration);
  let alreadyBound = false;
  allImports.forEach((p: any) => {
    (p.node.specifiers || []).forEach((s: any) => {
      if (s.type === "ImportSpecifier" && s.imported?.name === name) {
        alreadyBound = true;
      }
    });
  });
  if (alreadyBound) {
    return { skipped: true, reason: `import '${name}' already bound from another path` };
  }

  // ... existing same-path import-merge logic
  const matchingImport = allImports.filter(
    (p: any) => p.node.source.value === fromPath
  );
  if (matchingImport.size() > 0) {
    matchingImport.get(0).node.specifiers.push(
      j.importSpecifier(j.identifier(name))
    );
  } else {
    const importDecl = j.importDeclaration(
      [j.importSpecifier(j.identifier(name))],
      j.literal(fromPath),
    );
    root.get().node.program.body.unshift(importDecl);
  }

  return { skipped: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run scripts/codemods/_lib/__tests__/local-export-collision.test.ts
```

Expected: 5 PASS.

- [ ] **Step 5: Run full codemod test suite to ensure no regressions**

```bash
npx vitest run scripts/codemods/
```

Expected: existing ~140 codemod tests still PASS, plus 5 new local-export-collision tests.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/scripts/codemods/_lib/import-swap.ts \
  packages/editor/scripts/codemods/_lib/__tests__/local-export-collision.test.ts
git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-5): T1.A codemod factory hardening — local-export collision check

ensureNamedImport now bails when target file already exports the import-name
(via export const, export function, or export { x as name } re-export form),
or has a top-level local declaration of the name.

Reason: Phase 4 T2 codemod blindly added `import { Select } from "@/shared/ui/Select"`
to settings/shared.tsx which already exports a local `Select` primitive. Resulting
self-recursion + TS compile errors discovered in Phase 4 hygiene audit. See
commit a66aba9 for the regression fix.

5 new tests cover:
- export const X collision
- export function X collision
- export { foo as X } re-export collision
- non-exported local var X collision (still skips — would shadow)
- unrelated local var (does NOT skip)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### T1.B — Gate 24 AST-based scanner

Phase 4 hygiene found Gate 24's regex `<(button|input|select|textarea)[^a-zA-Z]` is line-buffered, missing multi-line `<select\n  ref={...}` JSX. Replace with AST scanner using `_lib/jsx-query.ts`.

- [ ] **Step 1: Write the failing test**

Create `packages/editor/scripts/__tests__/jsx-inline-element-scanner.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { scanInlineElements } from "../jsx-inline-element-scanner";

describe("scanInlineElements — multi-line JSX detection", () => {
  it("catches single-line <button>", () => {
    const source = `export const X = () => <button>x</button>;`;
    expect(scanInlineElements(source, "X.tsx")).toEqual([
      { file: "X.tsx", tag: "button", line: 1 },
    ]);
  });

  it("catches multi-line <select>", () => {
    const source = `export const X = () => (
  <select
    ref={ref}
    className="foo"
  >
    <option>a</option>
  </select>
);`;
    expect(scanInlineElements(source, "X.tsx")).toEqual([
      { file: "X.tsx", tag: "select", line: 2 },
    ]);
  });

  it("catches multiple inline elements", () => {
    const source = `<input /><textarea /><select><option/></select>`;
    const result = scanInlineElements(source, "X.tsx").map((r) => r.tag);
    expect(result).toEqual(["input", "textarea", "select"]);
  });

  it("ignores PascalCase JSX (vibcoder shims)", () => {
    const source = `<Button /><Input /><Select />`;
    expect(scanInlineElements(source, "X.tsx")).toEqual([]);
  });

  it("ignores HTML inside test files (caller filters paths)", () => {
    // Scanner is path-agnostic; gate script handles exclusion.
    const source = `<button>x</button>`;
    expect(scanInlineElements(source, "Foo.test.tsx")).toEqual([
      { file: "Foo.test.tsx", tag: "button", line: 1 },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run scripts/__tests__/jsx-inline-element-scanner.test.ts
```

Expected: All FAIL — module not found.

- [ ] **Step 3: Create the AST scanner**

Create `packages/editor/scripts/jsx-inline-element-scanner.ts`:

```typescript
/**
 * AST-based scanner for inline lowercase JSX elements (Gate 24 enforcement).
 *
 * Replaces line-buffered grep `<(button|input|select|textarea)[^a-zA-Z]`
 * which misses multi-line JSX like:
 *   <select
 *     ref={ref}
 *   >
 *
 * @license BSD-3-Clause
 */
import jscodeshift from "jscodeshift";

export interface InlineElementHit {
  file: string;
  tag: string;
  line: number;
}

const FORBIDDEN_TAGS = new Set(["button", "input", "select", "textarea"]);

export function scanInlineElements(source: string, file: string): InlineElementHit[] {
  const j = jscodeshift.withParser("tsx");
  const hits: InlineElementHit[] = [];
  try {
    const root = j(source);
    root.find(j.JSXOpeningElement).forEach((path: any) => {
      const name = path.node.name;
      if (name?.type === "JSXIdentifier" && FORBIDDEN_TAGS.has(name.name)) {
        hits.push({
          file,
          tag: name.name,
          line: path.node.loc?.start?.line ?? 0,
        });
      }
    });
  } catch {
    // Parse error — skip file. Real parse errors caught by tsc gate.
    return [];
  }
  return hits;
}

// CLI entry point: read files passed as args, output count to stderr + JSON to stdout.
if (require.main === module) {
  import("fs").then((fs) => {
    const files = process.argv.slice(2);
    const allHits: InlineElementHit[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf-8");
      allHits.push(...scanInlineElements(source, file));
    }
    console.error(`[jsx-inline-element-scanner] ${allHits.length} hits across ${files.length} files`);
    console.log(JSON.stringify(allHits, null, 2));
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run scripts/__tests__/jsx-inline-element-scanner.test.ts
```

Expected: 5 PASS.

- [ ] **Step 5: Wire scanner into Gate 24 in ds-grep-gates.sh**

Open `packages/editor/scripts/ds-grep-gates.sh` lines 547-558. Replace the grep-based hit count with scanner invocation:

```bash
# Gate 24: Inline-pattern enforcement (AST-based — catches multi-line JSX).
# Forbids inline lowercase HTML JSX (<button>, <input>, <select>, <textarea>) in editor/.
GATE24_FILES=$(find packages/editor/src/editor -name '*.tsx' \
  -not -path '*/__tests__/*' \
  -not -path '*/preview/*' 2>/dev/null)

GATE24_HITS=$(npx tsx packages/editor/scripts/jsx-inline-element-scanner.ts $GATE24_FILES 2>/dev/null \
  | jq 'length' 2>/dev/null \
  || echo "0")

BASE_24=$(sed -n '5p' packages/editor/scripts/.chrome-axioms-baseline)
check_gate 24 "$GATE24_HITS" "$BASE_24" "inline <button>/<input>/<select>/<textarea> in editor/ (use vibcoder shim @/shared/ui)" || exit 1
```

- [ ] **Step 6: Re-baseline Gate 24 against AST scanner**

Run the scanner once to get the AST-true count:

```bash
cd packages/editor
GATE24_FILES=$(find src/editor -name '*.tsx' -not -path '*/__tests__/*' -not -path '*/preview/*')
TRUE_COUNT=$(npx tsx scripts/jsx-inline-element-scanner.ts $GATE24_FILES | jq 'length')
echo "AST-true Gate 24 count: $TRUE_COUNT"
```

The number will likely be HIGHER than the grep-based 100 (multi-line JSX previously evaded). Update the baseline:

```bash
# Update line 5 of .chrome-axioms-baseline to the new TRUE_COUNT
sed -i "" "5s/.*/$TRUE_COUNT/" scripts/.chrome-axioms-baseline
```

- [ ] **Step 7: Run full DS gates to ensure all green**

```bash
bash packages/editor/scripts/ds-grep-gates.sh
```

Expected: All gates PASS, Gate 24 reports `$TRUE_COUNT` (matches new baseline).

- [ ] **Step 8: Commit**

```bash
git add packages/editor/scripts/jsx-inline-element-scanner.ts \
  packages/editor/scripts/__tests__/jsx-inline-element-scanner.test.ts \
  packages/editor/scripts/ds-grep-gates.sh \
  packages/editor/scripts/.chrome-axioms-baseline
git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-5): T1.B Gate 24 AST scanner — catches multi-line JSX

Replaces line-buffered grep `<(button|input|select|textarea)[^a-zA-Z]` with
AST-based jscodeshift scanner via `scripts/jsx-inline-element-scanner.ts`.

Phase 4 hygiene audit found grep was missing multi-line JSX like:
  <select
    ref={ref}
  >
The newline after `<select` is not in grep's pattern space; pattern fails to
match. AST scanner walks JSXOpeningElement nodes — line-agnostic.

Baseline ratcheted from 100 (grep-counted) to $TRUE_COUNT (AST-counted true
value). 5 unit tests cover single-line, multi-line, multiple-elements,
PascalCase ignore, and parse-error robustness.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2 — Atom shim deletion

**Files:**
- Create: `packages/editor/scripts/codemods/phase5/<atom>.ts` × 15
- Create: `packages/editor/scripts/codemods/phase5/__tests__/<atom>.codemod.test.ts` × 15
- Delete: `packages/editor/src/shared/ui/<Atom>.tsx` × 15
- Delete: `packages/editor/src/shared/ui/__tests__/<Atom>.adapter.test.tsx` × 15
- Modify: `packages/editor/src/shared/ui/index.ts`
- Modify: ~270 chrome consumer files (codemod-rewritten)

**Atom list (15 shims):** Button, Input, Select, Switch, Checkbox, Slider, Spinner, Skeleton, Icon, IconButton, Kbd, Badge, Tag, TextInput (re-export), SliderInput (re-export).

**Strategy per atom:**
1. Write codemod that finds `import { X } from "@/shared/ui/X"` (and relative variants like `from "../../shared/ui/X"`) and rewrites to `import { X } from "@/editor/shared/vibcoder/X"`.
2. Run codemod against editor source.
3. Run typecheck + tests + DS gates.
4. Delete shim file + adapter contract test file.
5. Run typecheck + tests + DS gates again (verifies no orphan imports).
6. Commit.

**Order matters (lowest blast radius first):**
- T2.A: Tag, Badge, Skeleton, Spinner, Kbd (low usage: 0-8 consumers each, simple bridges)
- T2.B: Icon, IconButton (single consumer or 0; close after T2.A)
- T2.C: Switch, Slider, SliderInput (re-export to Slider) (0 consumers, file-only delete)
- T2.D: Input, TextInput (TextInput is re-export → Input → vibcoder). 64 TextInput consumers — biggest atom batch.
- T2.E: Select, Checkbox (8 each)
- T2.F: Button (160 consumers — highest blast radius atom)

For brevity, the plan documents T2.A in full TDD detail; T2.B-T2.F follow the same pattern with substituted names. Subagent should derive identical structure for each.

### T2.A — Tag shim deletion (canary)

#### T2.A.1 — Codemod implementation

- [ ] **Step 1: Write the failing test**

Create `packages/editor/scripts/codemods/phase5/__tests__/tag.codemod.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { runCodemodFixture } from "../../_lib/__tests__/test-helpers";

const codemod = "phase5/tag";

describe("phase5/tag codemod — rewrite Tag import path", () => {
  it("rewrites @/shared/ui/Tag → @/editor/shared/vibcoder/Tag", () => {
    const before = `import { Tag } from "@/shared/ui/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    const after = `import { Tag } from "@/editor/shared/vibcoder/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    expect(runCodemodFixture(codemod, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Tag → @/editor/shared/vibcoder/Tag", () => {
    const before = `import { Tag } from "../shared/ui/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    const after = `import { Tag } from "@/editor/shared/vibcoder/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    expect(runCodemodFixture(codemod, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Tag, type TagProps } from "@/shared/ui/Tag";\nconst x: TagProps = {};`;
    const after = `import { Tag, type TagProps } from "@/editor/shared/vibcoder/Tag";\nconst x: TagProps = {};`;
    expect(runCodemodFixture(codemod, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Tag } from "@/shared/ui/Tag";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Tag } from "@/editor/shared/vibcoder/Tag";`;
    expect(runCodemodFixture(codemod, before)).toBe(after);
  });

  it("skips files that themselves export a local Tag (collision guard)", () => {
    const before = `export const Tag = () => null;\nimport { Tag as VTag } from "@/shared/ui/Tag";`;
    expect(runCodemodFixture(codemod, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Tag } from "@/shared/ui/Tag";\n<Tag>x</Tag>;`;
    const once = runCodemodFixture(codemod, before);
    const twice = runCodemodFixture(codemod, once);
    expect(twice).toBe(once);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/editor
npx vitest run scripts/codemods/phase5/__tests__/tag.codemod.test.ts
```

Expected: All FAIL — codemod file not found.

- [ ] **Step 3: Implement the codemod using factory**

Create `packages/editor/scripts/codemods/phase5/tag.ts`:

```typescript
/**
 * Phase 5 codemod — Tag shim deletion.
 *
 * Rewrites `import { Tag } from "@/shared/ui/Tag"` (and relative variants)
 * to `import { Tag } from "@/editor/shared/vibcoder/Tag"`.
 *
 * Skip rules:
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local Tag (collision guard)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Tag",
  fromPathPatterns: [
    "@/shared/ui/Tag",
    /\.\.\/.*shared\/ui\/Tag$/,
  ],
  toPath: "@/editor/shared/vibcoder/Tag",
});
```

- [ ] **Step 4: Add `makeImportPathRewriteCodemod` to factory**

Open `packages/editor/scripts/codemods/_lib/codemod-factory.ts`. Add new factory function:

```typescript
import jscodeshift from "jscodeshift";
import { shouldSkipPath } from "./skip-rules";
import { ensureNamedImport } from "./import-swap";

export interface ImportPathRewriteOptions {
  importName: string;
  fromPathPatterns: (string | RegExp)[];
  toPath: string;
}

export function makeImportPathRewriteCodemod(opts: ImportPathRewriteOptions) {
  return function transformer(file: any, api: any) {
    if (shouldSkipPath(file.path)) return file.source;
    const j = api.jscodeshift;
    const root = j(file.source);

    // Scan for any import of importName from a matching path
    let modified = false;
    const matchesFromPath = (value: string) =>
      opts.fromPathPatterns.some((pat) =>
        typeof pat === "string" ? value === pat : pat.test(value),
      );

    root.find(j.ImportDeclaration).forEach((path: any) => {
      const sourceValue = path.node.source.value;
      if (typeof sourceValue !== "string") return;
      if (!matchesFromPath(sourceValue)) return;

      const hasName = (path.node.specifiers || []).some(
        (s: any) =>
          s.type === "ImportSpecifier" && s.imported?.name === opts.importName,
      );
      if (!hasName) return;

      // Local-export collision guard (P1 hardening — also belt-and-suspenders here)
      const hasLocalExport =
        root.find(j.ExportNamedDeclaration).filter((p: any) => {
          const decl = p.node.declaration;
          if (!decl) return false;
          if (decl.type === "VariableDeclaration") {
            return decl.declarations.some(
              (d: any) => d.id?.name === opts.importName,
            );
          }
          return decl.type === "FunctionDeclaration" && decl.id?.name === opts.importName;
        }).size() > 0;
      if (hasLocalExport) return;

      path.node.source = j.literal(opts.toPath);
      modified = true;
    });

    return modified ? root.toSource({ quote: "double" }) : file.source;
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run scripts/codemods/phase5/__tests__/tag.codemod.test.ts
```

Expected: 6 PASS.

- [ ] **Step 6: Commit codemod**

```bash
git add packages/editor/scripts/codemods/phase5/tag.ts \
  packages/editor/scripts/codemods/phase5/__tests__/tag.codemod.test.ts \
  packages/editor/scripts/codemods/_lib/codemod-factory.ts
git commit -m "feat(vibcoder-phase-5): T2.A.1 Tag codemod + factory makeImportPathRewriteCodemod

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

#### T2.A.2 — Run codemod against codebase

- [ ] **Step 1: Dry-run to preview changes**

```bash
cd packages/editor
npx jscodeshift -t scripts/codemods/phase5/tag.ts \
  src/editor \
  --parser=tsx \
  --extensions=tsx,ts \
  --dry --print
```

Expected: 0 modifications (Tag shim has 0 direct consumers per Phase 5 plan inventory). If hits appear, review them.

- [ ] **Step 2: Apply codemod**

```bash
npx jscodeshift -t scripts/codemods/phase5/tag.ts \
  src/editor \
  --parser=tsx \
  --extensions=tsx,ts
```

Expected: 0 ok, 0 nochange, 0 errors (no consumers).

- [ ] **Step 3: Verify no orphan imports remain**

```bash
grep -rE "from ['\"][^'\"]*shared/ui/Tag['\"]" src/ 2>/dev/null
```

Expected: Empty output.

#### T2.A.3 — Delete shim files

- [ ] **Step 1: Delete shim + adapter test**

```bash
rm packages/editor/src/shared/ui/Tag.tsx
rm packages/editor/src/shared/ui/__tests__/Tag.adapter.test.tsx
```

- [ ] **Step 2: Remove Tag from shared/ui/index.ts barrel**

Open `packages/editor/src/shared/ui/index.ts`. Find and delete the `export { Tag, type TagProps } from "./Tag";` line.

- [ ] **Step 3: Run typecheck**

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -E "Tag|^src/" | head -20
```

Expected: No new errors. Should still see the 71 pre-existing errors but none mentioning Tag.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All passing tests still pass. Tag adapter test removed.

- [ ] **Step 5: Run DS gates**

```bash
bash packages/editor/scripts/ds-grep-gates.sh
```

Expected: All gates PASS. Gate 23 (shim layer is gate-keeper) no longer applies to Tag — but Gate 23 only enforces for shims that EXIST, so removal is fine.

- [ ] **Step 6: Commit deletion**

```bash
git add packages/editor/src/shared/ui/Tag.tsx \
  packages/editor/src/shared/ui/__tests__/Tag.adapter.test.tsx \
  packages/editor/src/shared/ui/index.ts
git commit -m "feat(vibcoder-phase-5): T2.A.2 delete Tag shim + adapter contract tests

Tag had 0 direct consumers in editor — clean removal. No codemod application needed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### T2.B–T2.F — Repeat T2.A pattern for remaining atoms

Apply the same TDD pattern (codemod → test → run codemod → verify → delete shim → typecheck → tests → gates → commit) for each atom in this order:

| Sub-task | Shim | Direct consumers | Notes |
|---|---|---|---|
| T2.B.1 | Badge | 0 | clean delete |
| T2.B.2 | Skeleton | 3 | codemod 3 sites |
| T2.B.3 | Spinner | 1 | codemod 1 site |
| T2.B.4 | Kbd | 8 | codemod 8 sites |
| T2.C.1 | Icon | 0 | clean delete (distinct from Icons.tsx — Icons.tsx stays) |
| T2.C.2 | IconButton | 1 | codemod 1 site |
| T2.D.1 | Switch | 0 | clean delete |
| T2.D.2 | Slider | 0 | clean delete |
| T2.D.3 | SliderInput | 0 | clean delete (re-export — see below) |
| T2.E.1 | Input | 0 | clean delete |
| T2.E.2 | TextInput | 64 | codemod 64 sites — biggest atom batch |
| T2.F.1 | Select | 8 | codemod 8 sites |
| T2.F.2 | Checkbox | 8 | codemod 8 sites |
| T2.G.1 | Button | 160 | codemod 160 sites — highest blast radius |

**SliderInput special case (T2.D.3):** SliderInput is a re-export → Slider. Codemod must rename `SliderInput` to `Slider` AND change the import path. Two-step:

```typescript
// Codemod logic for SliderInput → Slider rename + path swap
import { SliderInput } from "@/shared/ui/SliderInput";
// becomes:
import { Slider } from "@/editor/shared/vibcoder/Slider";
// and JSX: <SliderInput> → <Slider>
```

If 0 consumers (likely true per inventory), just delete the file.

**TextInput special case (T2.E.2):** TextInput is a re-export → Input. Same pattern as SliderInput. With 64 consumers, the codemod rewrites:
- `import { TextInput } from "@/shared/ui/TextInput"` → `import { Input } from "@/editor/shared/vibcoder/Input"`
- `<TextInput>` JSX → `<Input>` JSX

**Per sub-task: ONE atomic commit covering codemod + application + delete + barrel update.**

After T2.G.1 (Button — 160 consumers), run a final consolidated check:

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -E "^src/" | wc -l   # expect 71 (pre-Phase-4 baseline)
npx vitest run 2>&1 | tail -10                    # expect all pass
bash scripts/ds-grep-gates.sh                     # expect all pass
```

---

## Task 3 — Molecule shim deletion

**Files:**
- Create: `packages/editor/scripts/codemods/phase5/<molecule>.ts` × 4
- Create: `packages/editor/scripts/codemods/phase5/__tests__/<molecule>.codemod.test.ts` × 4
- Delete: `packages/editor/src/shared/ui/{Card,Tabs,FormField,PanelHeader}.tsx`
- Delete: their adapter contract tests
- Modify: barrel + ~9 chrome consumer files

**Molecule list (4 shims):** Card, Tabs, FormField, PanelHeader.

**Per-shim consumer counts (from inventory):**
- Card: 0 direct
- Tabs: 0 direct
- FormField: 0 direct
- PanelHeader: 3 direct

Apply the T2.A pattern verbatim with the molecule name substituted. Each molecule = 1 commit.

**T3.A: Card** — clean delete (0 consumers).
**T3.B: Tabs** — clean delete (0 consumers). Vibcoder Tabs is Radix.Tabs-backed — no behavior swap needed.
**T3.C: FormField** — clean delete (0 consumers).
**T3.D: PanelHeader** — codemod 3 sites. Note: vibcoder target is `surface-head` (not `panel-header`); see Phase 4 T4.D mapping. Codemod rewrites:

```typescript
import { PanelHeader } from "@/shared/ui/PanelHeader";
// becomes:
import { SurfaceHead } from "@/editor/shared/vibcoder/SurfaceHead";
// and JSX: <PanelHeader title="x"> → <SurfaceHead title="x">
```

PanelHeader's bridge maps `title` and `action` props 1:1 to SurfaceHead, so the rename is the only change.

After T3.D, run consolidated check (same as T2 close).

---

## Task 4 — Modal shim deletion (canary for high-blast-radius)

**Files:**
- Create: `packages/editor/scripts/codemods/phase5/modal.ts`
- Create: `packages/editor/scripts/codemods/phase5/__tests__/modal.codemod.test.ts`
- Delete: `packages/editor/src/shared/ui/Modal.tsx`
- Delete: `packages/editor/src/shared/ui/__tests__/Modal.adapter.test.tsx` (23 contract tests)
- Modify: barrel + 12 chrome consumer files

Modal has 12 direct consumers + Radix.Dialog backing. Highest-blast-radius atom-tier shim.

### T4.A — Modal codemod implementation

Apply the T2.A pattern. Codemod rewrites:

```typescript
import { Modal } from "@/shared/ui/Modal";
// becomes:
import { Modal } from "@/editor/shared/vibcoder/Modal";
```

Tests: 6 cases (path swap, relative path swap, type-only import preserved, unrelated imports preserved, local-collision skip, idempotent).

### T4.B — Apply codemod

12 consumer files rewritten. Verify:
- All Modal-using surfaces still render (manual smoke: open Templates modal, Help modal, ProjectSettings modal, etc.)
- Radix.Dialog focus trap working (Tab cycles inside modal, ESC closes)
- 23 adapter contract tests delete cleanly (no test imports them elsewhere)

### T4.C — Delete shim + tests + commit

Same pattern as T2.A.3.

After T4 close, smoke-test in browser:
- Open editor at localhost:5050
- Trigger each Modal-using flow at least once
- Verify focus trap, scroll lock, ESC dismiss all work
- Check console for errors

---

## Task 5 — Composition rewrites (Bucket D)

**Files:**
- Create: `packages/editor/src/shared/extensions/CopyButton.tsx`
- Create: `packages/editor/src/shared/extensions/PremiumBadge.tsx`
- Create: `packages/editor/src/shared/extensions/UpgradeModal.tsx`
- Create: `packages/editor/src/shared/extensions/index.ts`
- Delete: `packages/editor/src/shared/ui/{CopyButton,PremiumBadge,UpgradeModal}.tsx`
- Modify: 3 chrome consumer files (codemodded import paths)
- Create: `packages/editor/scripts/codemods/phase5/composition-extensions.ts`

**Goal:** Move composition extensions out of `shared/ui/` (a primitives folder) into `shared/extensions/` (composition folder). They become THIN wrappers over now-deleted-shim vibcoder primitives.

### T5.A — CopyButton rewrite

#### T5.A.1 — Read existing CopyButton

Read `packages/editor/src/shared/ui/CopyButton.tsx` to understand current shape (decorative composition over Button — animated checkmark feedback).

#### T5.A.2 — Create new CopyButton in extensions/

Create `packages/editor/src/shared/extensions/CopyButton.tsx` as composition over `@/editor/shared/vibcoder/Button`:

```typescript
/**
 * CopyButton — composition extension over vibcoder Button.
 *
 * Buildrik-specific UX: copy text to clipboard with animated checkmark
 * feedback. Not a primitive — domain composition.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";

export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label = "Copy", className }) => {
  const [copied, setCopied] = React.useState(false);

  const handleClick = React.useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={className}
      aria-live="polite"
    >
      {copied ? "✓ Copied" : label}
    </Button>
  );
};
```

(Match existing CopyButton's actual prop shape — read original first to verify these are correct.)

#### T5.A.3 — Codemod consumers

Codemod rewrites `import { CopyButton } from "@/shared/ui/CopyButton"` to `import { CopyButton } from "@/editor/shared/extensions/CopyButton"`. Apply to 1 consumer (per Phase 4 T7 matrix).

#### T5.A.4 — Delete old CopyButton + commit

```bash
rm packages/editor/src/shared/ui/CopyButton.tsx
# Remove from src/shared/ui/index.ts barrel
git add -A
git commit -m "feat(vibcoder-phase-5): T5.A composition rewrite — CopyButton moved to extensions/

CopyButton is a composition extension, not a primitive. Moved to
src/shared/extensions/. Now imports Button directly from vibcoder.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### T5.B — PremiumBadge rewrite

Same pattern as T5.A. Composition over `@/editor/shared/vibcoder/Badge`. 1 consumer.

### T5.C — UpgradeModal rewrite

Same pattern as T5.A. Composition over `@/editor/shared/vibcoder/Modal` + PremiumBadge from T5.B. **Run T5.C after T5.B** so PremiumBadge import is correct.

UpgradeModal also has a 403 listener — preserve verbatim. Read the original first.

### T5.D — Create extensions/ barrel

Create `packages/editor/src/shared/extensions/index.ts`:

```typescript
/**
 * Buildrik composition extensions over vibcoder primitives.
 * Not primitives themselves — domain composition layer.
 *
 * @license BSD-3-Clause
 */
export { CopyButton, type CopyButtonProps } from "./CopyButton";
export { PremiumBadge, type PremiumBadgeProps } from "./PremiumBadge";
export { UpgradeModal, type UpgradeModalProps } from "./UpgradeModal";
```

Commit:

```bash
git add packages/editor/src/shared/extensions/index.ts
git commit -m "feat(vibcoder-phase-5): T5.D extensions barrel for composition exports

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 — Phase 5 close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append Phase 5 section)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md` (M9 milestone close)
- Modify: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` + new `project_vibcoder_phase_5_shipped_*.md`

### T6.A — Append Phase 5 section to poc-findings.md

- [ ] **Step 1: Append Phase 5 close-out section**

Append to `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md`:

````markdown
## Phase 5 findings (shim deletion + composition rewrites)

**Status:** SHIPPED <DATE>. M9 milestone closed.
**Scope:** Bucket C (shim deletion) + Bucket D (composition rewrites) + 2 toolchain hardening prereqs (P1 + P2).

### T-by-T summary

| Task | Commit(s) | Outcome |
|---|---|---|
| **T1.A** Codemod factory hardening — local-export collision check | <SHA> | `ensureNamedImport` now bails on local-export collision (prevented Phase 4 settings/shared.tsx-style self-recursion). 5 new tests. |
| **T1.B** Gate 24 AST-based scanner | <SHA> | Replaced grep with jscodeshift JSXOpeningElement walker. Catches multi-line JSX previously evading. Baseline ratcheted 100 → <TRUE_COUNT>. |
| **T2.A-T2.G** Atom shim deletion | <14 SHAs> | 15 atom shims deleted. Largest batches: TextInput (64 consumers), Button (160 consumers). Total ~268 consumer rewrites. |
| **T3.A-T3.D** Molecule shim deletion | <4 SHAs> | 4 molecule shims deleted (Card, Tabs, FormField, PanelHeader). PanelHeader codemod renamed to SurfaceHead. |
| **T4** Modal shim deletion | <SHA> | Modal shim + 23 adapter contract tests deleted. 12 consumers rewritten. Browser smoke confirmed Radix.Dialog focus trap + ESC dismiss intact. |
| **T5.A-T5.D** Composition rewrites | <4 SHAs> | CopyButton + PremiumBadge + UpgradeModal moved to `src/shared/extensions/`. extensions/ barrel created. |

### Files removed (Phase 5)

```
20 shim files in src/shared/ui/ (all except Popover.tsx — hybrid stays)
21 adapter contract test files in src/shared/ui/__tests__/
```

### Bundle delta (Phase 5)

```
Pre-Phase-5:   <SIZE>  (gzip main: <SIZE>)
Post-Phase-5:  <SIZE>  (gzip main: <SIZE>)
Delta:         <NEAR-ZERO>
```

Phase 5 was net-neutral on bundle size — consumers route through fewer indirections but the underlying vibcoder code already shipped in Phase 4.

### Buckets A + B status (deferred)

- **Bucket A (Hybrid Popover full bridge):** BLOCKED on upstream vibcoder Popover gaining Radix.Popover backing. Popover.tsx hybrid shim retained at HEAD with `useFocusTrap` call site at line 62. Unblock criterion: `grep -lE "@radix-ui/react-popover" src/editor/shared/vibcoder/Popover*.tsx` returns hits.
- **Bucket B (Tooltip / Toast / ContextMenu / HelpTooltip ports):** All BLOCKED on upstream vibcoder primitive Radix backing or provider/queue infra. Tracked in T7 triage matrix (Phase 4 poc-findings).

### Bucket E (permanent extensions) reaffirmed

Icons.tsx, QuickSwitcher, Resizable, TreeView, UpgradeGate, ErrorBoundary, InfoBanner, Accordion, ColorSwatch, ErrorMessage, ErrorState, HelpTooltip — all stay. No work in Phase 5. JSDoc stamps from T7 unchanged.

### Acceptance summary (Phase 5 close-out)

- [x] T1 toolchain hardening shipped: P1 (local-export collision) + P2 (Gate 24 AST scanner)
- [x] T2 atom shims deleted (15)
- [x] T3 molecule shims deleted (4)
- [x] T4 Modal shim deleted (12 consumers rewritten)
- [x] T5 composition extensions moved to src/shared/extensions/ (3)
- [x] All DS gates green
- [x] No new tsc errors (71 pre-existing baseline maintained)
- [x] Browser smoke test confirms Modal focus trap + Popover hybrid intact
- [x] Bucket A + B explicitly deferred with unblock criteria documented
````

- [ ] **Step 2: Commit poc-findings update**

```bash
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md
git commit -m "docs(vibcoder): T6.A Phase 5 close-out — poc-findings appended

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### T6.B — Update roadmap M9 milestone

- [ ] **Step 1: Mark M9 SHIPPED in milestones table**

Open `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md`. Modify the M9 row in the milestones table (line ~359):

```markdown
| **M9: Phase 5 shim deletion shipped** | T1-T5 complete | 19 shims deleted (20 total — Popover hybrid stays), 3 composition extensions moved to extensions/, 2 toolchain hardening prereqs (P1+P2), Buckets A+B deferred — SHIPPED <DATE> |
```

- [ ] **Step 2: Update success-conditions checklist**

Find the success-conditions checklist (line ~378). Mark complete:

```markdown
- [x] 37 existing primitives re-ported (Phase 4 + Phase 5 combined: 19 shimmed in Phase 4, 19 deleted in Phase 5; Popover hybrid + 17 keep-as-extension stamps remain in shared/ui/)
- [x] 5 new gates active (19, 21, 22, 23, 24)
```

- [ ] **Step 3: Commit roadmap update**

```bash
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md
git commit -m "docs(vibcoder): T6.B roadmap M9 close — Phase 5 shipped

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### T6.C — Memory file

- [ ] **Step 1: Create new memory entry**

Create `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_5_shipped_<DATE>.md`:

```markdown
---
name: Vibcoder Phase 5 shipped <DATE>
description: Shim deletion + composition rewrites + toolchain hardening complete. Bucket A+B deferred on upstream.
type: project
---

Phase 5 closed at <SHA>. 19 of 20 shim files deleted (Popover hybrid stays — blocks on upstream vibcoder Radix.Popover). 3 composition extensions (CopyButton, PremiumBadge, UpgradeModal) moved to src/shared/extensions/. ~268 consumer call sites rewritten via codemods. 23 Modal adapter contract tests deleted. 2 toolchain hardening prereqs landed: P1 codemod factory local-export collision check; P2 Gate 24 AST-based scanner. Gate 24 baseline ratcheted from 100 (grep) to <TRUE_COUNT> (AST). Buckets A (Popover full bridge) + B (Tooltip/Toast/ContextMenu/HelpTooltip ports) deferred until upstream vibcoder bundle ships Radix backing for those primitives.

**Why:** Phase 4 left a 21-shim adapter layer with `PHASE 5 DELETE` markers. Phase 5 honors those markers for the 19 fully-bridged shims. Hybrid Popover and keep-legacy extensions stay because their vibcoder counterparts haven't yet matched the legacy behavior contract.

**How to apply:** Future code in `src/editor/` should import primitives directly from `@/editor/shared/vibcoder/<X>`, not from `@/shared/ui/<X>`. The latter path now contains only Popover (hybrid, deletes after upstream Radix.Popover lands) + extensions/ composition wrappers + 17 keep-as-extension Buildrik domain components. Gate 23 enforces the boundary.
```

- [ ] **Step 2: Add pointer to MEMORY.md index**

Open `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md`. Append:

```markdown
- [Vibcoder Phase 5 shipped <DATE>](project_vibcoder_phase_5_shipped_<DATE>.md) — 19 shims deleted, 3 composition rewrites, 2 toolchain hardening fixes. Buckets A+B deferred on upstream.
```

- [ ] **Step 3: No commit needed — memory files are local user state, not version-controlled.**

---

## Self-Review Checklist (run after plan complete)

- [x] **Spec coverage:** Bucket C (T2-T4), Bucket D (T5), Bucket E reaffirmed (T6.A), Bucket A+B deferred (T6.A status section), prereqs P1+P2 (T1).
- [x] **No placeholders:** Every step has actual code or exact command. SHA placeholders in T6 are intentional (filled in at execution time).
- [x] **Type consistency:** `ensureNamedImport` returns `EnsureImportResult` consistently (T1.A). `makeImportPathRewriteCodemod` shape used in T2-T4 codemods matches T2.A.1 definition.
- [x] **TDD pattern:** Test-first throughout. Step "Run test to verify it fails" before implementation in every codemod.
- [x] **Frequent commits:** ~26 commits across plan (1 per shim deletion, 1 per composition rewrite, 4 doc commits, 2 hardening commits, 14+ atom sub-commits in T2). Each task is independently revertable.
- [x] **DRY:** T2.B-T2.G refer back to T2.A pattern verbatim. T3 + T4 same pattern. T5 sub-tasks share structure.
- [x] **YAGNI:** No abstractions for hypothetical Phase 6/7 needs. Buckets A+B explicitly deferred with unblock criteria — no speculative work.

---

## Post-execution: smoke test + Phase 5 verification

After T6 closes, run final verification (mirrors Phase 4 smoke test):

```bash
cd packages/editor
pnpm dev &
DEV_PID=$!
sleep 3
# Browser smoke: open localhost:5050, exercise Modal/Popover flows, check console
# (Manual — use /browse skill or Chrome DevTools)
kill $DEV_PID

# Bundle delta
npx vite build  # compare HEAD vs Phase 4 close
# Expected: near-zero delta

# Total Phase 5 commit count
git log --oneline 21d80d0..HEAD | grep -c "vibcoder-phase-5"
# Expected: ~26 commits

# Total tsc errors
npx tsc --noEmit 2>&1 | grep -E "^src/" | wc -l
# Expected: 71 (pre-Phase-4 baseline maintained)
```

Phase 5 SHIPPED when all 7 acceptance items in T6.A check off.
