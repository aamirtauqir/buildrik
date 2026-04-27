/**
 * Phase 5 codemod — Input shim deletion.
 *
 * Rewrites `import { Input } from "@/shared/ui/Input"` (and relative variants)
 * to `import { Input } from "@/editor/shared/vibcoder/Input"`.
 *
 * Note: no Input.tsx shim existed in shared/ui/ (the phase4 input.ts codemod
 * routed lowercase <input> JSX to @/shared/ui/TextInput — a different concern).
 * This phase5 codemod is a forward-guard ensuring any @/shared/ui/Input import
 * that appears during Phase 5 migration is routed to the vibcoder barrel.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local Input (collision guard via factory)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "Input",
  fromPathPatterns: [
    "@/shared/ui/Input",
    /\.\.\/.*shared\/ui\/Input$/,
  ],
  toPath: "@/editor/shared/vibcoder/Input",
});
