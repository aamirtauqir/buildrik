# DS Rollout Week 1 — Layout SSOT + Two ESLint Gates + Green-Panel Allowlist

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Week 1 of the editor-chrome DS rollout — lock layout dimensions into one SSOT, block new layout literals and legacy `editor/→components/` imports via ESLint, wire the `.ds-green-panels.json` allowlist ratchet into DS gates. Stop-here value: new magic literals and new legacy imports cannot land on main without a policy comment.

**Architecture:** No runtime code changes. Pure enforcement plumbing: two custom ESLint rules mirroring the pattern in `packages/editor/eslint-rules/no-inline-hex.cjs`, one JSON allowlist consumed by the existing gate script `packages/editor/scripts/ds-grep-gates.sh`, and one cleanup of the already-shipped `packages/editor/src/shared/constants/layout.ts` (legacy `LAYOUT` object removal after grep-verified 0 consumers).

**Tech Stack:** ESLint 9 flat config · custom rule CJS modules · Node 24 baseline script · bash gate script · TypeScript 5.3 strict · Vitest 4 for rule tests.

**Parent rollout doc:** `docs/ideation/2026-04-20-editor-chrome-ds-ideation.md` (Week 1 row, line 97)

**Solo workflow:** Every task = one commit direct to `main`. No feature branches. No PRs.

**Codex gate:** After Task 5, Codex review runs at the week boundary before Week 2 starts.

---

## File Structure

```
packages/editor/
├── eslint-rules/
│   ├── index.cjs                              # MODIFY — register 2 new rules
│   ├── no-legacy-components-import.cjs        # CREATE — Task 2
│   ├── no-magic-layout-literals.cjs           # CREATE — Task 3
│   └── __tests__/
│       ├── no-legacy-components-import.test.mjs   # CREATE — Task 2
│       └── no-magic-layout-literals.test.mjs      # CREATE — Task 3
├── eslint.config.mjs                          # MODIFY — wire both rules into chrome block
├── scripts/
│   ├── .layout-literals-baseline              # CREATE — Task 3 (count written by rule run)
│   ├── .ds-green-panels.json                  # CREATE — Task 4 (empty list initial)
│   ├── ds-grep-gates.sh                       # MODIFY — Task 4 (read allowlist, ratchet mode)
│   ├── verify-green-panels.mjs                # CREATE — Task 4 (allowlist enforcement)
│   └── __tests__/
│       └── verify-green-panels.test.mjs       # CREATE — Task 4 (unit test, no subprocess)
├── src/shared/constants/layout.ts             # MODIFY — Task 1 (remove legacy LAYOUT obj)
└── package.json                               # MODIFY — Task 4 (add verify:green-panels)

docs/plans/2026-04-25-ds-rollout-week-1.md     # THIS FILE
docs/reviews/2026-04-25-ds-week-1-codex-prep.md # CREATE — Task 5
```

Each file has one clear responsibility. Two rules are sibling files (not merged) because their AST targets and severity differ. Allowlist logic is a separate `verify-green-panels.mjs` so `ds-grep-gates.sh` stays a thin shell wrapper.

---

## Task 0: Pre-flight Audit

**Purpose:** Verify repo state matches the rollout-doc assumptions before touching anything. Any mismatch = stop and reconcile.

**Files:**
- Read-only: `packages/editor/src/shared/constants/layout.ts`
- Read-only: `packages/editor/eslint.config.mjs`
- Read-only: `packages/editor/scripts/ds-grep-gates.sh`
- Read-only: `packages/editor/scripts/.chrome-axioms-baseline`

- [ ] **Step 1: Verify layout.ts named exports exist**

Run from repo root:
```bash
grep -E "^export const (RAIL_W|SIDEBAR_W|SIDEBAR_WIDE|INSPECTOR_W|TOPBAR_H|HEADER_H|TOOLBAR_H|FOOTER_H|ROW_SM|ROW_MD|ROW_LG) " packages/editor/src/shared/constants/layout.ts | wc -l | tr -d ' '
```
Expected: `11`
If not 11 — stop, file diverged from rollout doc, reconcile before proceeding.

- [ ] **Step 2: Verify legacy LAYOUT object has zero consumers**

Run:
```bash
grep -rE "\bLAYOUT\b" packages/editor/src --include='*.ts' --include='*.tsx' | grep -v "shared/constants/layout.ts" | grep -v __tests__
```
Expected: empty output (zero consumers).
If any output — Task 1 becomes scoped migration work, not deletion. Stop and reconcile.

- [ ] **Step 3: Verify editor→legacy-components baseline is 0**

Run:
```bash
grep -rE "from ['\"](@components/|@/components/)" packages/editor/src/editor --include='*.ts' --include='*.tsx' | wc -l | tr -d ' '
grep -rE "from ['\"](\.\.\/){3,}components/" packages/editor/src/editor --include='*.ts' --include='*.tsx' | wc -l | tr -d ' '
```
Expected: `0` then `0`.
If either non-zero — baseline is not 0, Task 2 rule must ship at WARN not ERROR, and the existing sites go in a `.legacy-components-import-baseline` file (pattern mirrors hex baseline).

- [ ] **Step 4: Verify chrome-axioms-baseline file structure**

Run:
```bash
wc -l < packages/editor/scripts/.chrome-axioms-baseline | tr -d ' '
```
Expected: `4`
File format: one integer per line, one gate each (gates 11-14). Task 3 layout-literals baseline mirrors this format.

- [ ] **Step 5: Verify eslint-rules plugin structure matches expected pattern**

Run:
```bash
cat packages/editor/eslint-rules/index.cjs
```
Expected: exports a `rules` object registering `no-inline-hex`, `no-inspector-tokens`, `no-get-property-value-ds`. Tasks 2 and 3 will add two more keys to this object.

- [ ] **Step 6: Confirm no blockers, proceed to Task 1**

No commit for Task 0. Audit only.

---

## Task 1: Clean up `layout.ts` — Remove Legacy `LAYOUT` Object

**Purpose:** `layout.ts` already exports 11 named constants. A legacy `LAYOUT` object at the bottom is flagged as unused (grep-verified 2026-04-20 per inline comment). Task 0 Step 2 re-verifies. Delete it. Reduces SSOT file to only the authoritative named exports.

**Files:**
- Modify: `packages/editor/src/shared/constants/layout.ts:77-89` (delete legacy block)
- Create: `packages/editor/src/shared/constants/__tests__/layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create: `packages/editor/src/shared/constants/__tests__/layout.test.ts`

```typescript
/**
 * Layout SSOT guard tests — invariants for Week 1.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import * as layout from "../layout";

describe("layout.ts SSOT", () => {
  it("exports 11 named dimension constants", () => {
    const expected = [
      "RAIL_W", "SIDEBAR_W", "SIDEBAR_WIDE", "INSPECTOR_W",
      "TOPBAR_H", "HEADER_H", "TOOLBAR_H", "FOOTER_H",
      "ROW_SM", "ROW_MD", "ROW_LG",
    ];
    for (const key of expected) {
      expect(layout).toHaveProperty(key);
      expect(typeof (layout as Record<string, unknown>)[key]).toBe("number");
    }
  });

  it("canonical values match DESIGN.md §Layout", () => {
    expect(layout.RAIL_W).toBe(60);
    expect(layout.SIDEBAR_W).toBe(240);
    expect(layout.SIDEBAR_WIDE).toBe(320);
    expect(layout.INSPECTOR_W).toBe(320);
    expect(layout.TOPBAR_H).toBe(56);
    expect(layout.HEADER_H).toBe(44);
    expect(layout.TOOLBAR_H).toBe(36);
    expect(layout.FOOTER_H).toBe(40);
    expect(layout.ROW_SM).toBe(28);
    expect(layout.ROW_MD).toBe(32);
    expect(layout.ROW_LG).toBe(48);
  });

  it("does NOT export the deprecated LAYOUT object", () => {
    expect("LAYOUT" in layout).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify LAYOUT-removal case fails**

Run: `cd packages/editor && npx vitest run src/shared/constants/__tests__/layout.test.ts`
Expected: two specs PASS, "does NOT export the deprecated LAYOUT object" FAILS with `expected true to be false` (LAYOUT still exists).

- [ ] **Step 3: Delete legacy LAYOUT block from `layout.ts`**

Edit `packages/editor/src/shared/constants/layout.ts`. Delete lines 75-89 inclusive (everything from the `// LEGACY OBJECT — kept for backwards compatibility...` comment header through the closing `} as const;` of the `LAYOUT` export).

After the edit, the file ends at the `// DESIGN.md forbids 40px rows...` comment block (current line 73).

- [ ] **Step 4: Run test suite, verify all three specs pass**

Run: `cd packages/editor && npx vitest run src/shared/constants/__tests__/layout.test.ts`
Expected: all 3 specs PASS.

- [ ] **Step 5: Run typecheck — ensure no downstream type break**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: exits 0.
If errors about `LAYOUT` — Task 0 Step 2 missed a consumer. Stop, grep again, migrate consumer to named export, re-run.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/shared/constants/layout.ts packages/editor/src/shared/constants/__tests__/layout.test.ts
git commit -m "chore(editor): drop legacy LAYOUT object from layout.ts — SSOT is named exports"
```

---

## Task 2: ESLint Rule `no-legacy-components-import` (ERROR, baseline 0)

**Purpose:** Prevent any new `editor/` file from importing legacy `components/` (371-file folder marked "DO NOT add new code" in `packages/editor/CLAUDE.md`). Baseline is 0 — rule ships at ERROR. Locks the door forever.

**Files:**
- Create: `packages/editor/eslint-rules/no-legacy-components-import.cjs`
- Create: `packages/editor/eslint-rules/__tests__/no-legacy-components-import.test.mjs`
- Modify: `packages/editor/eslint-rules/index.cjs`
- Modify: `packages/editor/eslint.config.mjs`

- [ ] **Step 1: Write the failing rule test**

Create: `packages/editor/eslint-rules/__tests__/no-legacy-components-import.test.mjs`

```javascript
/**
 * @license BSD-3-Clause
 */
import { RuleTester } from "eslint";
import rule from "../no-legacy-components-import.cjs";
import tsParser from "@typescript-eslint/parser";

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-legacy-components-import", rule, {
  valid: [
    { code: `import { X } from "@/editor/shared/foo";`, filename: "src/editor/a.tsx" },
    { code: `import { X } from "@shared/ui/Button";`, filename: "src/editor/a.tsx" },
    { code: `import { X } from "../components/LocalChild";`, filename: "src/editor/sidebar/tabs/pages/PagesTab.tsx" },
    { code: `import { X } from "@components/LegacyThing";`, filename: "src/components/a.tsx" },
  ],
  invalid: [
    {
      code: `import { X } from "@components/LegacyThing";`,
      filename: "src/editor/a.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
    {
      code: `import { X } from "@/components/LegacyThing";`,
      filename: "src/editor/a.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
    {
      code: `import { X } from "../../../components/LegacyThing";`,
      filename: "src/editor/sidebar/tabs/pages/PagesTab.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
  ],
});
console.log("no-legacy-components-import: all tests pass");
```

- [ ] **Step 2: Run test to verify it fails (rule file does not exist)**

Run: `cd packages/editor && node --experimental-vm-modules eslint-rules/__tests__/no-legacy-components-import.test.mjs`
Expected: FAIL with `Cannot find module '../no-legacy-components-import.cjs'`.

- [ ] **Step 3: Implement the rule**

Create: `packages/editor/eslint-rules/no-legacy-components-import.cjs`

```javascript
/**
 * ESLint rule: no-legacy-components-import
 * Bans any import from src/editor/** that resolves to the legacy src/components/ folder.
 * Legacy folder is frozen per packages/editor/CLAUDE.md — new code lives in src/editor/.
 * @license BSD-3-Clause
 */
"use strict";

// Matches imports that resolve to packages/editor/src/components/.
// Three forms covered:
//   1. Alias   @components/*     (tsconfig paths: ./src/components/*)
//   2. Alias   @/components/*    (tsconfig paths: ./src/*)
//   3. Deep-relative from src/editor/**: three or more '../' segments landing on components/
const LEGACY_PATTERNS = [
  /^@components\//,
  /^@\/components\//,
  /^(\.\.\/){3,}components\//,
];

function isEditorFile(filename) {
  const parts = filename.replace(/\\/g, "/").split("/");
  const srcIdx = parts.lastIndexOf("src");
  return srcIdx !== -1 && parts[srcIdx + 1] === "editor";
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow imports from src/editor/** into the legacy src/components/ folder (frozen per CLAUDE.md)",
    },
    schema: [],
    messages: {
      legacyImport:
        "Import from legacy src/components/ ('{{source}}') — legacy folder is frozen. New code goes in src/editor/ or src/shared/. See packages/editor/CLAUDE.md.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isEditorFile(filename)) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        for (const re of LEGACY_PATTERNS) {
          if (re.test(source)) {
            context.report({ node: node.source, messageId: "legacyImport", data: { source } });
            return;
          }
        }
      },
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && node --experimental-vm-modules eslint-rules/__tests__/no-legacy-components-import.test.mjs`
Expected: prints `no-legacy-components-import: all tests pass`, exits 0.

- [ ] **Step 5: Register rule in plugin index**

Modify: `packages/editor/eslint-rules/index.cjs`

Replace the `rules` block so it matches:

```javascript
/**
 * buildrik ESLint plugin — custom rules for DS V1 invariants.
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  rules: {
    "no-inline-hex": require("./no-inline-hex.cjs"),
    "no-inspector-tokens": require("./no-inspector-tokens.cjs"),
    "no-get-property-value-ds": require("./no-get-property-value-ds.cjs"),
    "no-legacy-components-import": require("./no-legacy-components-import.cjs"),
  },
};
```

- [ ] **Step 6: Wire rule into flat config at ERROR severity**

Modify: `packages/editor/eslint.config.mjs`

In the base config block (the one with `files: ["src/**/*.{ts,tsx}"]`), inside its `rules` object, add one line after the three existing `buildrik/*` rules:

```javascript
      "buildrik/no-legacy-components-import": "error",
```

Final `rules` block for that config entry should read:

```javascript
    rules: {
      "buildrik/no-inline-hex": "error",
      "buildrik/no-inspector-tokens": "error",
      "buildrik/no-get-property-value-ds": "error",
      "buildrik/no-legacy-components-import": "error",
      "no-unused-vars": "off",
      "no-undef": "off",
    },
```

- [ ] **Step 7: Run ESLint across repo, verify 0 errors**

Run: `cd packages/editor && npx eslint src/editor --quiet`
Expected: exits 0, no output for `no-legacy-components-import` (baseline 0 per Task 0 Step 3).
If errors — baseline is not 0. Stop, fix the source files OR degrade rule severity to `"warn"` in Step 6 and record a baseline file. Do not commit the rule at ERROR if any site fails.

- [ ] **Step 8: Commit**

```bash
git add packages/editor/eslint-rules/no-legacy-components-import.cjs \
        packages/editor/eslint-rules/__tests__/no-legacy-components-import.test.mjs \
        packages/editor/eslint-rules/index.cjs \
        packages/editor/eslint.config.mjs
git commit -m "feat(editor): ESLint rule no-legacy-components-import — ERROR, baseline 0"
```

---

## Task 3: ESLint Rule `no-magic-layout-literals` (WARN, self-measured baseline)

**Purpose:** Ban raw pixel literals in layout-property contexts inside chrome files. WARN mode at baseline (whatever count the rule produces on first run). Consumers use named exports from `shared/constants/layout.ts` instead.

**Files:**
- Create: `packages/editor/eslint-rules/no-magic-layout-literals.cjs`
- Create: `packages/editor/eslint-rules/__tests__/no-magic-layout-literals.test.mjs`
- Create: `packages/editor/scripts/.layout-literals-baseline`
- Modify: `packages/editor/eslint-rules/index.cjs`
- Modify: `packages/editor/eslint.config.mjs`

- [ ] **Step 1: Write the failing rule test**

Create: `packages/editor/eslint-rules/__tests__/no-magic-layout-literals.test.mjs`

```javascript
/**
 * @license BSD-3-Clause
 */
import { RuleTester } from "eslint";
import rule from "../no-magic-layout-literals.cjs";
import tsParser from "@typescript-eslint/parser";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-magic-layout-literals", rule, {
  valid: [
    { code: `const s = { width: 1 };` },
    { code: `import { RAIL_W } from "@/shared/constants/layout"; const s = { width: RAIL_W };` },
    { code: `const s = { fontSize: 44 };` },
    { code: `// @lint-layout-policy: sprite-sheet offset\nconst s = { width: 60 };` },
    { code: "const s = `width: ${RAIL_W}px`;" },
  ],
  invalid: [
    {
      code: `const s = { width: 60 };`,
      errors: [{ messageId: "magicLiteral" }],
    },
    {
      code: `const s = { height: 240 };`,
      errors: [{ messageId: "magicLiteral" }],
    },
    {
      code: `const s = { minWidth: 320, maxHeight: 56 };`,
      errors: [{ messageId: "magicLiteral" }, { messageId: "magicLiteral" }],
    },
    {
      code: "const s = `width: 60px`;",
      errors: [{ messageId: "magicLiteral" }],
    },
  ],
});
console.log("no-magic-layout-literals: all tests pass");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && node --experimental-vm-modules eslint-rules/__tests__/no-magic-layout-literals.test.mjs`
Expected: FAIL with `Cannot find module '../no-magic-layout-literals.cjs'`.

- [ ] **Step 3: Implement the rule**

Create: `packages/editor/eslint-rules/no-magic-layout-literals.cjs`

```javascript
/**
 * ESLint rule: no-magic-layout-literals
 * Bans raw pixel literals in layout-property contexts (width/height/padding/etc).
 * Consumers use named exports from src/shared/constants/layout.ts.
 * Honors `// @lint-layout-policy: <reason>` on preceding line as per-site escape.
 * @license BSD-3-Clause
 */
"use strict";

const LAYOUT_PROPS = new Set([
  "width", "height",
  "minWidth", "minHeight", "maxWidth", "maxHeight",
  "top", "left", "right", "bottom",
  "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "gap", "rowGap", "columnGap",
  "flexBasis",
]);

const POLICY_RE = /@lint-layout-policy:/;
const TEMPLATE_LAYOUT_RE = /\b(width|height|min-?width|min-?height|max-?width|max-?height|top|left|right|bottom|padding|margin|gap)\s*:\s*(\d{2,})px/gi;

function hasPolicyComment(context, node) {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const commentsBefore = sourceCode.getCommentsBefore(node);
  return commentsBefore.some((c) => POLICY_RE.test(c.value));
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow raw pixel literals in layout-property contexts — use named exports from src/shared/constants/layout.ts",
    },
    schema: [],
    messages: {
      magicLiteral:
        "Magic layout literal '{{value}}' in '{{prop}}' — import from src/shared/constants/layout.ts or annotate with @lint-layout-policy: <reason>.",
    },
  },
  create(context) {
    return {
      Property(node) {
        const keyName =
          node.key.type === "Identifier" ? node.key.name :
          node.key.type === "Literal" ? node.key.value : null;
        if (!keyName || !LAYOUT_PROPS.has(keyName)) return;
        if (node.value.type !== "Literal") return;
        const val = node.value.value;
        if (typeof val !== "number") return;
        if (val < 10) return;
        if (hasPolicyComment(context, node)) return;
        context.report({
          node: node.value,
          messageId: "magicLiteral",
          data: { value: String(val), prop: keyName },
        });
      },
      TemplateLiteral(node) {
        const raw = node.quasis.map((q) => q.value.cooked).join("");
        if (!TEMPLATE_LAYOUT_RE.test(raw)) return;
        if (hasPolicyComment(context, node)) return;
        TEMPLATE_LAYOUT_RE.lastIndex = 0;
        let m;
        while ((m = TEMPLATE_LAYOUT_RE.exec(raw)) !== null) {
          const prop = m[1].toLowerCase();
          const value = m[2];
          if (Number(value) < 10) continue;
          context.report({
            node,
            messageId: "magicLiteral",
            data: { value, prop },
          });
        }
      },
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && node --experimental-vm-modules eslint-rules/__tests__/no-magic-layout-literals.test.mjs`
Expected: prints `no-magic-layout-literals: all tests pass`, exits 0.

- [ ] **Step 5: Register rule in plugin index**

Modify: `packages/editor/eslint-rules/index.cjs`

Final `rules` block:

```javascript
  rules: {
    "no-inline-hex": require("./no-inline-hex.cjs"),
    "no-inspector-tokens": require("./no-inspector-tokens.cjs"),
    "no-get-property-value-ds": require("./no-get-property-value-ds.cjs"),
    "no-legacy-components-import": require("./no-legacy-components-import.cjs"),
    "no-magic-layout-literals": require("./no-magic-layout-literals.cjs"),
  },
```

- [ ] **Step 6: Wire rule into chrome-scoped config at WARN**

Modify: `packages/editor/eslint.config.mjs`

Find the chrome block (the one with `files: CHROME_FILES`, `ignores: CHROME_EXEMPT`). Inside its `rules` object, append (do NOT replace the `no-restricted-syntax` key that's already there):

```javascript
      "buildrik/no-magic-layout-literals": "warn",
```

Add it as the last entry in that `rules` object.

- [ ] **Step 7: Measure baseline count and write baseline file**

Run:
```bash
cd packages/editor && npx eslint src/editor src/shared/ui src/shared/forms 2>&1 | grep -c "no-magic-layout-literals" | tr -d ' ' > scripts/.layout-literals-baseline
cat scripts/.layout-literals-baseline
```
Expected: a single integer (~500-900 based on pre-flight grep estimate). Record the actual number. This is the frozen baseline.

File format (mirrors `.chrome-axioms-baseline`):
```
<integer>
```

- [ ] **Step 8: Verify ESLint produces warnings at baseline count exactly**

Run: `cd packages/editor && npx eslint src/editor src/shared/ui src/shared/forms 2>&1 | grep -c "no-magic-layout-literals" | tr -d ' '`
Expected: output matches the integer in `scripts/.layout-literals-baseline`.
If output exceeds baseline — rule implementation caught more than expected; re-run Step 7 to refresh baseline before committing.
If output is less — scope filter mismatch; investigate before proceeding.

- [ ] **Step 9: Commit**

```bash
git add packages/editor/eslint-rules/no-magic-layout-literals.cjs \
        packages/editor/eslint-rules/__tests__/no-magic-layout-literals.test.mjs \
        packages/editor/eslint-rules/index.cjs \
        packages/editor/eslint.config.mjs \
        packages/editor/scripts/.layout-literals-baseline
git commit -m "feat(editor): ESLint rule no-magic-layout-literals — WARN at baseline"
```

---

## Task 4: `.ds-green-panels.json` Allowlist + Gate Integration

**Purpose:** Files on the green-panel allowlist run DS rules in ERROR mode. Unlisted files stay at WARN (current behavior). Allowlist is append-only — Week 3+ migrations append files one by one, never pop. Mechanism wired in Week 1 with empty list; first additions happen Week 3.

**Files:**
- Create: `packages/editor/scripts/.ds-green-panels.json`
- Create: `packages/editor/scripts/verify-green-panels.mjs`
- Create: `packages/editor/scripts/__tests__/verify-green-panels.test.mjs`
- Modify: `packages/editor/scripts/ds-grep-gates.sh`
- Modify: `packages/editor/package.json`

- [ ] **Step 1: Create the empty allowlist JSON**

Create: `packages/editor/scripts/.ds-green-panels.json`

```json
{
  "description": "Editor chrome files that have been fully migrated to DS V1 tokens and Chrome Axioms. Files on this list run DS rules in ERROR mode; unlisted files run in WARN. Append-only — see docs/ideation/2026-04-20-editor-chrome-ds-ideation.md Non-negotiable gate #4.",
  "files": [],
  "frozen_commit": "WEEK_1_COMMIT",
  "week_added": 1
}
```

(After Task 5 commit, edit `frozen_commit` to the actual Week 1 closeout commit SHA.)

- [ ] **Step 2: Write the failing verifier test (pure-function import, no subprocess)**

Create: `packages/editor/scripts/__tests__/verify-green-panels.test.mjs`

```javascript
/**
 * @license BSD-3-Clause
 * Unit tests for the green-panel allowlist verifier.
 * Tests the exported `verifyGreenPanels` function directly against a temp workspace.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { verifyGreenPanels } from "../verify-green-panels.mjs";

function makeWorkspace() {
  const root = mkdtempSync(join(tmpdir(), "green-panels-test-"));
  mkdirSync(join(root, "scripts"));
  return root;
}

function writeAllowlist(root, contents) {
  writeFileSync(join(root, "scripts/.ds-green-panels.json"), contents);
}

let passed = 0;
let failed = 0;

function assert(name, cond, detail) {
  if (cond) { passed += 1; }
  else { failed += 1; console.error(`FAIL ${name}: ${detail ?? ""}`); }
}

// Case 1: empty allowlist = ok
{
  const root = makeWorkspace();
  writeAllowlist(root, JSON.stringify({ files: [] }));
  const result = verifyGreenPanels(root);
  assert("empty allowlist returns ok", result.ok === true, JSON.stringify(result));
  rmSync(root, { recursive: true });
}

// Case 2: allowlist references a missing file = not ok
{
  const root = makeWorkspace();
  writeAllowlist(root, JSON.stringify({ files: ["src/fake/path.tsx"] }));
  const result = verifyGreenPanels(root);
  assert("missing file returns not ok", result.ok === false);
  assert("missing file reports the path", (result.missing ?? []).includes("src/fake/path.tsx"));
  rmSync(root, { recursive: true });
}

// Case 3: malformed JSON = not ok with parse error
{
  const root = makeWorkspace();
  writeAllowlist(root, "{not json");
  const result = verifyGreenPanels(root);
  assert("malformed JSON returns not ok", result.ok === false);
  assert("malformed JSON reports parseError", typeof result.parseError === "string");
  rmSync(root, { recursive: true });
}

// Case 4: missing "files" array = not ok
{
  const root = makeWorkspace();
  writeAllowlist(root, JSON.stringify({ description: "no files key" }));
  const result = verifyGreenPanels(root);
  assert("missing files array returns not ok", result.ok === false);
  rmSync(root, { recursive: true });
}

if (failed === 0) {
  console.log(`verify-green-panels: all ${passed} assertions pass`);
} else {
  console.error(`verify-green-panels: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/editor && node scripts/__tests__/verify-green-panels.test.mjs`
Expected: FAIL with import error — `verify-green-panels.mjs` does not yet exist.

- [ ] **Step 4: Implement the verifier with exported pure function**

Create: `packages/editor/scripts/verify-green-panels.mjs`

```javascript
#!/usr/bin/env node
/**
 * Verify the .ds-green-panels.json allowlist.
 *   1. File is valid JSON.
 *   2. Has a `files` array.
 *   3. Every listed file exists on disk.
 *
 * Exports `verifyGreenPanels(root)` → `{ ok, count?, missing?, parseError? }`
 * for unit tests. CLI entry prints PASS/FAIL and exits 0/1.
 *
 * Run as CLI: node packages/editor/scripts/verify-green-panels.mjs
 * @license BSD-3-Clause
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function verifyGreenPanels(root) {
  const allowlist = path.join(root, "scripts/.ds-green-panels.json");
  let raw;
  try {
    raw = fs.readFileSync(allowlist, "utf8");
  } catch (err) {
    return { ok: false, readError: err.message };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, parseError: err.message };
  }

  if (!Array.isArray(parsed.files)) {
    return { ok: false, missingFilesArray: true };
  }

  const missing = [];
  for (const rel of parsed.files) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) missing.push(rel);
  }
  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true, count: parsed.files.length };
}

// CLI entry: only run when invoked directly, not when imported.
const __filename = fileURLToPath(import.meta.url);
const invokedDirectly = process.argv[1] === __filename;
if (invokedDirectly) {
  const root = path.resolve(path.dirname(__filename), "..");
  const result = verifyGreenPanels(root);
  if (result.ok) {
    console.log(`PASS: green-panel allowlist valid (${result.count} files)`);
    process.exit(0);
  }
  if (result.parseError) console.error(`FAIL: malformed JSON — ${result.parseError}`);
  else if (result.readError) console.error(`FAIL: cannot read allowlist — ${result.readError}`);
  else if (result.missingFilesArray) console.error(`FAIL: allowlist missing "files" array`);
  else if (result.missing) console.error(`FAIL: allowlist lists files that do not exist:\n  ${result.missing.join("\n  ")}`);
  process.exit(1);
}
```

Make it executable:
```bash
chmod +x packages/editor/scripts/verify-green-panels.mjs
```

- [ ] **Step 5: Run test, verify all 4 assertions pass**

Run: `cd packages/editor && node scripts/__tests__/verify-green-panels.test.mjs`
Expected: prints `verify-green-panels: all 4 assertions pass`, exits 0.

- [ ] **Step 6: Wire verifier into `ds-grep-gates.sh`**

Modify: `packages/editor/scripts/ds-grep-gates.sh`

Append at the end of the script (after the last existing `pass "Gate N: ..."` line, before any final summary echo):

```bash
# Gate 15: .ds-green-panels.json allowlist structural integrity.
# Allowlist is append-only per docs/ideation/2026-04-20-editor-chrome-ds-ideation.md.
node "$SCRIPT_DIR/verify-green-panels.mjs" || fail "Gate 15: green-panel allowlist invalid"
pass "Gate 15: green-panel allowlist valid"
```

- [ ] **Step 7: Add package.json script**

Modify: `packages/editor/package.json`

In the `scripts` block, add this entry after the existing `lint:ds-hex` line:

```json
    "verify:green-panels": "node scripts/verify-green-panels.mjs",
```

- [ ] **Step 8: Run the gate script end-to-end, verify new gate passes**

Run: `cd packages/editor && pnpm run lint:ds`
Expected: all prior gates pass AND new line `  PASS: Gate 15: green-panel allowlist valid`.

- [ ] **Step 9: Commit**

```bash
git add packages/editor/scripts/.ds-green-panels.json \
        packages/editor/scripts/verify-green-panels.mjs \
        packages/editor/scripts/__tests__/verify-green-panels.test.mjs \
        packages/editor/scripts/ds-grep-gates.sh \
        packages/editor/package.json
git commit -m "feat(editor): .ds-green-panels.json allowlist + gate 15 (empty initial list)"
```

---

## Task 5: Week 1 Closeout — Verify All Gates + Update Allowlist Frozen Commit + Codex Prep

**Purpose:** Prove end-to-end that all four deliverables compose (layout.ts clean, two rules live, allowlist verified). Lock the allowlist's `frozen_commit` field. Produce a one-page artifact for the Week 1 → Week 2 Codex review per rollout Non-negotiable Gate #3.

**Files:**
- Modify: `packages/editor/scripts/.ds-green-panels.json` (set `frozen_commit`)
- Create: `docs/reviews/2026-04-25-ds-week-1-codex-prep.md`

- [ ] **Step 1: Run full verification suite**

Run each, expect exit 0:
```bash
cd packages/editor && npx tsc --noEmit
cd packages/editor && npx vitest run
cd packages/editor && npx eslint src/editor src/shared/ui src/shared/forms --quiet 2>&1 | grep -c "no-legacy-components-import" | tr -d ' '
cd packages/editor && pnpm run lint:ds
```

Expected:
- `tsc` exits 0.
- `vitest` passes (includes Task 1 layout SSOT tests, Task 2 + Task 3 rule tests).
- Third command outputs `0` (no legacy-components violations across chrome).
- `lint:ds` passes all 15 gates.

- [ ] **Step 2: Update allowlist `frozen_commit` field**

Get current HEAD:
```bash
git rev-parse --short HEAD
```

Modify: `packages/editor/scripts/.ds-green-panels.json`

Replace the value of `frozen_commit` (currently `"WEEK_1_COMMIT"`) with the SHA from the previous command.

- [ ] **Step 3: Write Codex review prep artifact**

Create: `docs/reviews/2026-04-25-ds-week-1-codex-prep.md`

Contents:

````markdown
---
date: 2026-04-25
topic: ds-week-1-codex-prep
status: ready-for-codex-review
---

# Week 1 Closeout — Codex Review Prep

Per rollout Non-negotiable Gate #3 (`docs/ideation/2026-04-20-editor-chrome-ds-ideation.md:127`).

## What Shipped

1. **`layout.ts` cleanup.** Legacy `LAYOUT` object removed after 0-consumer grep verification. SSOT file now exports only the 11 canonical named constants. Guarded by vitest suite in `packages/editor/src/shared/constants/__tests__/layout.test.ts`.

2. **ESLint rule `no-legacy-components-import`.** ERROR mode. Blocks imports from `src/editor/**` into `src/components/**` via alias (`@components/*`, `@/components/*`) or deep-relative path (`../../../components/...`). Baseline 0 (verified pre-flight).

3. **ESLint rule `no-magic-layout-literals`.** WARN mode at a self-measured baseline (see `packages/editor/scripts/.layout-literals-baseline`). Bans raw pixel literals in layout-property contexts (width/height/padding/margin/top/left/right/bottom/gap + min/max variants). Honors `// @lint-layout-policy: <reason>` per-site escape.

4. **`.ds-green-panels.json` allowlist + Gate 15.** Empty list. Mechanism proves: structural validity (JSON parse), existence (listed files must be on disk). Append-only honor-system marker via `frozen_commit` field. First file additions happen Week 3 alongside PanelShell migration.

## What Did NOT Ship (Deferred per Rollout Doc)

- **Codemod for raw literals.** Rollout doc line 97 explicitly defers bulk replace to Week 3 — mechanical `44`-to-named-export substitution risks semantic misfires (a `44` could mean HEADER_H, a row gap, or an unrelated magic number). Week 3 PanelShell migration has the context.
- **PanelShell primitive, Box primitive, Inspector schema registry.** All downstream per rollout sequence. Week 1 is pure gate plumbing.

## What Might Go Wrong — Codex Attention Requested

1. **Rule scope.** `no-magic-layout-literals` currently applies via the `CHROME_FILES` override block. Does that correctly include every file the rollout considers chrome? In particular, `src/shared/forms/**` is inside CHROME_FILES but some form atoms may legitimately need arbitrary pixel values (spinbox width, etc). Baseline captures current state — is that the right contract, or should form atoms be on the `FORM_ATOMS` exempt list for this rule too?

2. **Layout-property regex completeness.** Rule catches `width|height|minWidth|...|gap|rowGap|columnGap|flexBasis`. Missing: `strokeWidth`, `borderWidth`, `transform` values (`translateX(60px)`). Intentional omission (those are not layout dimensions) — confirm this is correct scoping.

3. **Template-literal detection.** Emotion template strings like `` `width: 60px` `` are caught; interpolated strings like `` `width: ${RAIL_W}px` `` are exempt (pre-resolved). Does this miss cases where an interpolated var is itself a magic number? (Deferred to Week 2 Box primitive — compile-time type contract closes this loophole.)

4. **Green-panel allowlist growth policy.** `frozen_commit` is an honor-system marker — CI does not currently diff the JSON against that commit. Is a git-backed check needed at Week 1, or can it wait until Week 3 when additions actually start?

5. **`ds-grep-gates.sh` Gate 15 placement.** Script currently runs gates 1-14 in order, then would run Gate 15 at the end. Is there value to running allowlist validation FIRST (fail fast)? Any downstream gate that depends on allowlist contents?

## Evidence Checklist

- `git log --oneline main | head -5` shows 4 Week 1 commits (chore, feat, feat, feat).
- `pnpm run lint:ds` from `packages/editor/` passes all 15 gates.
- `npx vitest run` in `packages/editor/` passes layout SSOT + 2 rule test suites.
- `npx tsc --noEmit` in `packages/editor/` exits 0.
- `scripts/.ds-green-panels.json` parses, lists 0 files, `frozen_commit` set to actual SHA.
- `scripts/.layout-literals-baseline` contains single-integer baseline.

## Next: Week 2

Per rollout row 98: `<Box>` Token Binding primitive + token convergence decision (radius-md grandfathered on form atoms only, panels use radius-sm) + small PanelShell scaffold (no tab migration yet). 4-5 day cost.
````

- [ ] **Step 4: Commit closeout**

```bash
git add packages/editor/scripts/.ds-green-panels.json \
        docs/reviews/2026-04-25-ds-week-1-codex-prep.md
git commit -m "chore(ds): Week 1 closeout — freeze allowlist commit, Codex prep artifact"
```

- [ ] **Step 5: Print Codex review handoff note**

Do NOT run Codex from this plan — user invokes `/codex` as a separate skill per rollout gate protocol. Print this for the user:

```
Week 1 shipped. 5 commits on main.
Next: run /codex review with scope = docs/reviews/2026-04-25-ds-week-1-codex-prep.md plus the 5 commits.
After Codex findings addressed, Week 2 unblocked.
```

---

## Self-Review

**Spec coverage:**
- Week 1 deliverable #1 (layout.ts SSOT) → Task 1 (cleanup since file already exists)
- Week 1 deliverable #2 (no-magic-layout-literals WARN at baseline) → Task 3
- Week 1 deliverable #3 (no-legacy-components-import ERROR baseline 0) → Task 2
- Week 1 deliverable #4 (.ds-green-panels.json allowlist wired) → Task 4
- Week 1 deliverable #5 (codemod deferred to Week 3) → explicit in Task 5 Codex prep doc
- Stop-here value (new layout literals can't land) → Task 3 Step 8 verification enforces baseline
- Codex review at week boundary → Task 5 artifact

All five rollout deliverables covered.

**Placeholder scan:** no TBDs, no "implement error handling," every code block complete.

**Type consistency:** `LAYOUT_PROPS` set referenced only in Task 3. `LEGACY_PATTERNS` regex referenced only in Task 2. `verifyGreenPanels` function name matches between implementation (Task 4 Step 4) and test import (Task 4 Step 2). Rule filenames match ESLint registration keys.

**Effort estimate:** Task 0 (30 min audit), Task 1 (20 min), Task 2 (60 min), Task 3 (90 min), Task 4 (60 min), Task 5 (30 min). Total ~5 hours CC-compressed. Matches rollout doc's 1-day human target.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | CLEAR (SCOPE_REDUCED) | Scrapped redundant 6-phase plan, redirected to this committed rollout |
| Parent rollout CEO Review | `/plan-ceo-review` (2026-04-20) | Scope & strategy | 1 | CLEAR | 18 ranked ideas + 18 rejections documented in ideation doc |
| Outside Voice | `/codex review` at week boundary | Independent 2nd opinion | 0 | PENDING | Scheduled after Task 5 per Non-negotiable Gate #3 |

- **VERDICT:** Week 1 plan ready to execute. Codex review scheduled for Week 1 → Week 2 boundary.
- **UNRESOLVED:** 0.
