// packages/editor/scripts/codemods/phase4/icon-button.ts
/**
 * Phase 4 codemod: ensure `<IconButton>` JSX in `src/editor/` consumers
 * resolves to the canonical IconButton shim at `@/shared/ui/IconButton`.
 *
 * Scope NOTE — there is NO `<iconbutton>` HTML element. The legacy
 * implementation lives at `shared/ui/IconButton.tsx`; the codemod only
 * gates the import path so any new `<IconButton>` JSX in chrome routes
 * through the canonical shim, keeping Gate 23 honest.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/icon-button.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "IconButton",
  toName: "IconButton",
  toImport: "@/shared/ui/IconButton",
});

export const parser = "tsx";
