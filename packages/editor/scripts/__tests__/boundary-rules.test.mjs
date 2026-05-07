/**
 * Self-tests for layer-boundary ESLint rules added in Audit Remediation
 * (docs/plans/2026-05-07-audit-remediation-approach-b.md, PR2).
 *
 * Runs the actual eslint.config.mjs against fixture code paths and asserts
 * that @typescript-eslint/no-restricted-imports fires (or correctly skips)
 * for each layer scenario:
 *   - engine/ → editor/ value import     → BLOCK
 *   - engine/ → editor/ type-only import → ALLOW (allowTypeImports)
 *   - shared/ui/ → editor/ value import  → BLOCK
 *   - shared/extensions/ → editor/       → ALLOW (whitelist via ignores)
 *   - services/ → editor/ value import   → BLOCK
 *
 * If these tests break, the boundary rules silently stopped enforcing —
 * which is exactly the failure mode the audit-remediation plan called out.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const editorRoot = path.resolve(__dirname, "../../");

const BOUNDARY_RULE_ID = "@typescript-eslint/no-restricted-imports";

async function lintFixture(filename, code) {
  const eslint = new ESLint({ cwd: editorRoot });
  const results = await eslint.lintText(code, { filePath: filename });
  return results[0]?.messages ?? [];
}

function hasBoundaryViolation(messages) {
  return messages.some((m) => m.ruleId === BOUNDARY_RULE_ID);
}

describe("layer-boundary lint — engine/", () => {
  it("blocks engine/ → editor/ value import", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/engine/__fixture__.ts"),
      `import { stockService } from "../editor/sidebar/tabs/media/api/StockService";\nstockService();\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(true);
  });

  it("allows engine/ → editor/ type-only import (allowTypeImports)", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/engine/__fixture__.ts"),
      `import type { HandlePosition } from "../editor/canvas/ResizeHandler";\nconst x: HandlePosition = "n";\nconsole.log(x);\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(false);
  });
});

describe("layer-boundary lint — shared/", () => {
  it("blocks shared/ui/ → editor/ value import", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/shared/ui/__fixture__.tsx"),
      `import { Button } from "@/editor/shared/vibcoder";\nButton;\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(true);
  });

  it("allows shared/extensions/ → editor/shared/vibcoder (whitelist)", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/shared/extensions/__fixture__.tsx"),
      `import { Button } from "@/editor/shared/vibcoder";\nButton;\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(false);
  });

  it("allows shared/ui/ → editor/ type-only import", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/shared/ui/__fixture__.tsx"),
      `import type { ButtonProps } from "@/editor/shared/vibcoder";\nconst _: ButtonProps = null as unknown as ButtonProps;\n_;\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(false);
  });
});

describe("layer-boundary lint — services/", () => {
  it("blocks services/ → editor/ value import", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/services/__fixture__.ts"),
      `import { somethingFromEditor } from "@/editor/sidebar/tabs/media/api/StockService";\nsomethingFromEditor();\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(true);
  });

  it("allows services/ → editor/ type-only import", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/services/__fixture__.ts"),
      `import type { StockPhoto } from "@/editor/sidebar/tabs/media/api/StockService";\nconst _: StockPhoto = null as unknown as StockPhoto;\n_;\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(false);
  });
});

describe("layer-boundary lint — out-of-scope files", () => {
  it("does not fire on editor/ → engine/ imports (engine→editor is the banned direction)", async () => {
    const msgs = await lintFixture(
      path.join(editorRoot, "src/editor/canvas/__fixture__.ts"),
      `import { something } from "@/engine/canvas/AlignmentHandler";\nsomething;\n`
    );
    expect(hasBoundaryViolation(msgs)).toBe(false);
  });
});
