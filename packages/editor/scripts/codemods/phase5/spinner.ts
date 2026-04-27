/**
 * Phase 5 codemod — Spinner shim deletion.
 *
 * Rewrites `import { Spinner } from "@/shared/ui/Spinner"` (and relative variants)
 * to `import { Spinner } from "@/editor/shared/vibcoder/Spinner"`.
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Spinner",
  fromPathPatterns: [
    "@/shared/ui/Spinner",
    /\.\.\/.*shared\/ui\/Spinner$/,
  ],
  toPath: "@/editor/shared/vibcoder/Spinner",
});
