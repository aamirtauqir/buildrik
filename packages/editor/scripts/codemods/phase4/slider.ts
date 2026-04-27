// packages/editor/scripts/codemods/phase4/slider.ts
/**
 * Phase 4 codemod: route `<SliderInput>` JSX in `src/editor/` consumers
 * through the vibcoder Slider via the shim layer at
 * `@/shared/ui/SliderInput`.
 *
 * Scope: PascalCase `<SliderInput>` JSX. Legacy filename
 * `SliderInput.tsx` is preserved so existing barrel re-exports / IDE
 * history stay stable.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/slider.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "SliderInput",
  toName: "SliderInput",
  toImport: "@/shared/ui/SliderInput",
});

export const parser = "tsx";
