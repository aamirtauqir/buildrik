// packages/editor/scripts/codemods/phase4/skeleton.ts
/**
 * Phase 4 codemod: ensure `<Skeleton>` JSX in `src/editor/` consumers
 * resolves to the canonical Skeleton shim at `@/shared/ui/Skeleton`.
 *
 * Scope NOTE — there is NO `<skeleton>` HTML element. The legacy file
 * ships the base `Skeleton` plus several compound siblings (`SkeletonText`,
 * `StudioSkeleton`, etc.) — those are NOT touched here; this codemod only
 * gates the bare `<Skeleton>` form. Compound names (`SkeletonText` etc.)
 * are not vibcoder primitives and remain legacy until Phase 5 decomposes
 * them.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/skeleton.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Skeleton",
  toName: "Skeleton",
  toImport: "@/shared/ui/Skeleton",
});

export const parser = "tsx";
