/**
 * Phase 5 codemod — Icon shim deletion.
 *
 * Rewrites `import { Icon } from "@/shared/ui/Icon"` (and relative variants)
 * to `import { Icon } from "@/editor/shared/vibcoder/Icon"`.
 *
 * NOTE: This codemod targets Icon.tsx (the Lucide-react wrapper atom).
 * It does NOT affect Icons.tsx (the Buildrik domain glyph palette — keep-as-extension).
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local Icon (collision guard via factory)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Icon",
  fromPathPatterns: [
    "@/shared/ui/Icon",
    /\.\.\/.*shared\/ui\/Icon$/,
  ],
  toPath: "@/editor/shared/vibcoder/Icon",
});
