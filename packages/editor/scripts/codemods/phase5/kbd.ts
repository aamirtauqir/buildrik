/**
 * Phase 5 codemod — Kbd shim deletion.
 *
 * Rewrites `import { Kbd } from "@/shared/ui/Kbd"` (and relative variants)
 * to `import { Kbd } from "@/editor/shared/vibcoder/Kbd"`.
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Kbd",
  fromPathPatterns: [
    "@/shared/ui/Kbd",
    /\.\.\/.*shared\/ui\/Kbd$/,
  ],
  toPath: "@/editor/shared/vibcoder/Kbd",
});
