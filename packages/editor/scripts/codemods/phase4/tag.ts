// packages/editor/scripts/codemods/phase4/tag.ts
/**
 * Phase 4 codemod: ensure `<Tag>` JSX in `src/editor/` consumers resolves
 * to the vibcoder Tag via the shim layer at `@/shared/ui/Tag`.
 *
 * Scope NOTE — there is NO `<tag>` HTML element. The legacy world had no
 * hand-rolled `<Tag>` primitive in `shared/ui/` either; the file is brand
 * new at `shared/ui/Tag.tsx` (re-export of vibcoder Tag). The codemod is
 * a forward-guard: today consumers have zero `<Tag>` JSX inside
 * `src/editor/`, but any future occurrence gets the import routed through
 * the shim — keeping Gate 23 (shim layer is gate-keeper) honest.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/tag.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Tag",
  toName: "Tag",
  toImport: "@/shared/ui/Tag",
});

export const parser = "tsx";
