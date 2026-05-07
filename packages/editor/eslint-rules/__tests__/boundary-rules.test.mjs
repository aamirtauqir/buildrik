/**
 * Boundary-rule integration tests (PR2, audit-remediation 2026-05-08).
 *
 * Verifies the `@typescript-eslint/no-restricted-imports` config in
 * eslint.config.mjs catches the four scenarios called out in the
 * audit-remediation spec:
 *
 *   1. engine/   → editor/         value import → error
 *   2. engine/   → editor/         `import type` → allowed (allowTypeImports)
 *   3. shared/extensions/ → editor/shared/vibcoder/ → allowed (whitelist)
 *   4. shared/ui/<other>/ → editor/shared/vibcoder/ → error
 *   5. services/ → editor/         value import → error (parity)
 *   6. services/ → editor/         `import type` → allowed
 *   7. shared/forms/ → editor/shared/vibcoder/ → allowed (compositions tier)
 *
 * Pattern: instantiate ESLint with the project's flat config, lint
 * synthetic source files at synthetic paths under src/, assert the
 * expected `@typescript-eslint/no-restricted-imports` errors appear
 * (or don't). Runs via `node --test` to match existing rule tests
 * (no-magic-layout-literals.test.mjs etc.).
 *
 * @license BSD-3-Clause
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ESLint } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EDITOR_ROOT = path.resolve(__dirname, "../..");

const eslint = new ESLint({
  cwd: EDITOR_ROOT,
  overrideConfigFile: path.join(EDITOR_ROOT, "eslint.config.mjs"),
});

async function lintAt(filePath, code) {
  const absolute = path.join(EDITOR_ROOT, filePath);
  const [result] = await eslint.lintText(code, { filePath: absolute });
  return result;
}

function hasBoundaryError(result) {
  return result.messages.some(
    (m) =>
      m.ruleId === "@typescript-eslint/no-restricted-imports" &&
      m.severity === 2,
  );
}

test("engine/ → editor/ value import is an error", async () => {
  const result = await lintAt(
    "src/engine/synthetic/Test.ts",
    'import { Button } from "@/editor/shared/vibcoder/Button";\nexport const x = Button;',
  );
  assert.equal(hasBoundaryError(result), true);
});

test("engine/ → editor/ `import type` is allowed", async () => {
  const result = await lintAt(
    "src/engine/synthetic/Test.ts",
    'import type { ButtonProps } from "@/editor/shared/vibcoder/Button";\nexport type X = ButtonProps;',
  );
  assert.equal(hasBoundaryError(result), false);
});

test("shared/extensions/ → editor/shared/vibcoder/ is allowed (whitelist)", async () => {
  const result = await lintAt(
    "src/shared/extensions/SyntheticExt.tsx",
    'import { Button } from "@/editor/shared/vibcoder/Button";\nexport const X = Button;',
  );
  assert.equal(hasBoundaryError(result), false);
});

test("shared/ui/<other>/ → editor/shared/vibcoder/ is an error", async () => {
  // Use a synthetic file path NOT in the per-file ignore list (those
  // exempt ErrorState + HelpTooltip; the rule must still fire on a
  // fresh shared/ui file that imports vibcoder).
  const result = await lintAt(
    "src/shared/ui/SyntheticBoundaryProbe.tsx",
    'import { Button } from "@/editor/shared/vibcoder/Button";\nexport const X = Button;',
  );
  assert.equal(hasBoundaryError(result), true);
});

test("services/ → editor/ value import is an error", async () => {
  const result = await lintAt(
    "src/services/synthetic/Test.ts",
    'import { Button } from "@/editor/shared/vibcoder/Button";\nexport const x = Button;',
  );
  assert.equal(hasBoundaryError(result), true);
});

test("services/ → editor/ `import type` is allowed", async () => {
  const result = await lintAt(
    "src/services/synthetic/Test.ts",
    'import type { ButtonProps } from "@/editor/shared/vibcoder/Button";\nexport type X = ButtonProps;',
  );
  assert.equal(hasBoundaryError(result), false);
});

test("shared/forms/ → editor/shared/vibcoder/ is allowed (compositions tier)", async () => {
  // shared/forms/* are vibcoder-primitive compositions by design (Phase 4
  // keep-as-extension tier). Same intent as shared/extensions/, just
  // different physical home pending a future relocation arc.
  const result = await lintAt(
    "src/shared/forms/SyntheticField.tsx",
    'import { Button } from "@/editor/shared/vibcoder/Button";\nexport const X = Button;',
  );
  assert.equal(hasBoundaryError(result), false);
});

console.log("boundary-rules: all tests pass");
