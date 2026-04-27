// packages/editor/scripts/codemods/phase4/select.ts
/**
 * Phase 4 codemod: swap inline `<select>` JSX in `src/editor/` consumers
 * to vibcoder Select via the shim layer at `@/shared/ui/Select`.
 *
 * Scope: only matches `<select>` elements (lowercase). Does NOT touch
 * `<Select>` (PascalCase, already a component).
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/select.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "select",
  toName: "Select",
  toImport: "@/shared/ui/Select",
});

export const parser = "tsx";
