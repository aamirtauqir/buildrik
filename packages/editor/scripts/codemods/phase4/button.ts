// packages/editor/scripts/codemods/phase4/button.ts
/**
 * Phase 4 codemod: swap inline `<button>` JSX in `src/editor/` consumers
 * to vibcoder Button via the shim layer at @/shared/ui/Button.
 *
 * Scope: only matches `<button>` elements (lowercase). Does NOT touch
 * `<Button>` (PascalCase, already a component).
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/button.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "button",
  toName: "Button",
  toImport: "@/shared/ui/Button",
});

export const parser = "tsx";
