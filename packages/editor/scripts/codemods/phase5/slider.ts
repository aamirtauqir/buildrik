/**
 * Phase 5 codemod — Slider shim deletion.
 *
 * Rewrites `import { Slider } from "@/shared/ui/Slider"` (and relative variants)
 * to `import { Slider } from "@/editor/shared/vibcoder/Slider"`.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local Slider (collision guard via factory)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Slider",
  fromPathPatterns: [
    "@/shared/ui/Slider",
    /\.\.\/.*shared\/ui\/Slider$/,
  ],
  toPath: "@/editor/shared/vibcoder/Slider",
});
