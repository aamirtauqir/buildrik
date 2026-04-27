/**
 * Phase 5 codemod — Badge shim deletion.
 *
 * Rewrites `import { Badge } from "@/shared/ui/Badge"` (and relative variants)
 * to `import { Badge } from "@/editor/shared/vibcoder/Badge"`.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local Badge (collision guard via factory)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Badge",
  fromPathPatterns: [
    "@/shared/ui/Badge",
    /\.\.\/.*shared\/ui\/Badge$/,
  ],
  toPath: "@/editor/shared/vibcoder/Badge",
});
