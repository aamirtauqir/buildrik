// packages/editor/scripts/codemods/phase4/badge.ts
/**
 * Phase 4 codemod: ensure `<Badge>` JSX in `src/editor/` consumers
 * resolves to the canonical Badge shim at `@/shared/ui/Badge`.
 *
 * Scope NOTE — there is NO `<badge>` HTML element. Today there are zero
 * `<Badge>` JSX occurrences inside `src/editor/`; consumers live in
 * `src/ai/` and `src/templates/` (outside this codemod's path scope and
 * still on the legacy variant union). This codemod is therefore a 0-hit
 * forward-guard for any future chrome `<Badge>` usage.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/badge.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Badge",
  toName: "Badge",
  toImport: "@/shared/ui/Badge",
});

export const parser = "tsx";
