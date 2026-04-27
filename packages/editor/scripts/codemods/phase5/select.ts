/**
 * Phase 5 codemod — Select shim deletion.
 *
 * Rewrites `import { Select } from "@/shared/ui/Select"` (and relative variants)
 * to `import { Select } from "@/editor/shared/vibcoder/Select"`.
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Select",
  fromPathPatterns: [
    "@/shared/ui/Select",
    /\.\.\/.*shared\/ui\/Select$/,
  ],
  toPath: "@/editor/shared/vibcoder/Select",
});
