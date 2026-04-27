// packages/editor/scripts/codemods/phase4/spinner.ts
/**
 * Phase 4 codemod: ensure `<Spinner>` JSX in `src/editor/` consumers
 * resolves to the canonical Spinner shim at `@/shared/ui/Spinner`.
 *
 * Scope NOTE — there is NO `<spinner>` HTML element. The legacy Spinner
 * lives at `shared/ui/Spinner.tsx` (kept during Phase 4; vibcoder
 * translation deferred). The codemod's job is to ensure new occurrences
 * of `<Spinner>` in chrome JSX route through the canonical shim path,
 * keeping Gate 23 (shim layer is gate-keeper) honest.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/spinner.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Spinner",
  toName: "Spinner",
  toImport: "@/shared/ui/Spinner",
});

export const parser = "tsx";
