/**
 * Phase 5 codemod — Checkbox shim deletion.
 *
 * Rewrites `import { Checkbox } from "@/shared/ui/Checkbox"` (and relative variants)
 * to `import { Checkbox } from "@/editor/shared/vibcoder/Checkbox"`.
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Checkbox",
  fromPathPatterns: [
    "@/shared/ui/Checkbox",
    /\.\.\/.*shared\/ui\/Checkbox$/,
  ],
  toPath: "@/editor/shared/vibcoder/Checkbox",
});
