/**
 * Phase 5 codemod — IconButton shim deletion.
 *
 * Rewrites `import { IconButton } from "@/shared/ui/IconButton"` (and relative variants)
 * to `import { IconButton } from "@/editor/shared/vibcoder/IconButton"`.
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "IconButton",
  fromPathPatterns: [
    "@/shared/ui/IconButton",
    /\.\.\/.*shared\/ui\/IconButton$/,
  ],
  toPath: "@/editor/shared/vibcoder/IconButton",
});
