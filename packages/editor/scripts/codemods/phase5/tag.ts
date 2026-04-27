/**
 * Phase 5 codemod — Tag shim deletion.
 *
 * Rewrites `import { Tag } from "@/shared/ui/Tag"` (and relative variants)
 * to `import { Tag } from "@/editor/shared/vibcoder/Tag"`.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local Tag (collision guard via factory)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Tag",
  fromPathPatterns: [
    "@/shared/ui/Tag",
    /\.\.\/.*shared\/ui\/Tag$/,
  ],
  toPath: "@/editor/shared/vibcoder/Tag",
});
