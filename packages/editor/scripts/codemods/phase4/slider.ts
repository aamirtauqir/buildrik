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
import type { Transform, FileInfo, API, Options } from "jscodeshift";
import { findJsxElementsByTag, renameJsxTag } from "../_lib/jsx-query";
import { ensureNamedImport } from "../_lib/import-swap";
import { shouldSkipPath } from "../_lib/skip-rules";

const transform: Transform = (file: FileInfo, api: API, _options: Options) => {
  const j = api.jscodeshift;
  if (shouldSkipPath(file.path)) return file.source;

  const root = j(file.source);
  const sliders = findJsxElementsByTag(j, root, "SliderInput");
  if (sliders.size() === 0) return file.source;

  sliders.forEach((path) => {
    renameJsxTag(j, path.node, "SliderInput");
  });

  ensureNamedImport(j, root, "SliderInput", "@/shared/ui/SliderInput");

  return root.toSource({ quote: "double" });
};

export default transform;
export const parser = "tsx";
