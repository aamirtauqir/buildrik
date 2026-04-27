/**
 * Phase 5 codemod — SliderInput shim deletion.
 *
 * Rewrites `import { SliderInput } from "@/shared/ui/SliderInput"` (and relative variants)
 * to `import { Slider as SliderInput } from "@/editor/shared/vibcoder/Slider"`.
 *
 * Note: SliderInput was a full adapter shim (wrapping vibcoder Slider with disabled
 * style composition). Since 0 consumers exist in src/editor/, the rewrite target
 * preserves the SliderInput alias at the call site in case any future consumer
 * is introduced during Phase 5 transition.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test.tsx
 *   - files exporting a local SliderInput (collision guard via factory)
 *
 * @license BSD-3-Clause
 */
import { makeImportPathRewriteCodemod } from "../_lib/codemod-factory";

export default makeImportPathRewriteCodemod({
  importName: "SliderInput",
  fromPathPatterns: [
    "@/shared/ui/SliderInput",
    /\.\.\/.*shared\/ui\/SliderInput$/,
  ],
  toPath: "@/editor/shared/vibcoder/Slider",
});
