/**
 * Phase 5 codemod — Switch shim deletion.
 *
 * Rewrites `import { Switch } from "@/shared/ui/Switch"` (and relative variants)
 * to `import { Switch } from "@/editor/shared/vibcoder/Switch"`.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local Switch (collision guard via factory)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Switch",
  fromPathPatterns: [
    "@/shared/ui/Switch",
    /\.\.\/.*shared\/ui\/Switch$/,
  ],
  toPath: "@/editor/shared/vibcoder/Switch",
});
