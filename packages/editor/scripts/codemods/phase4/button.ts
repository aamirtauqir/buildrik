// packages/editor/scripts/codemods/phase4/button.ts
/**
 * Phase 4 codemod: swap inline `<button>` JSX in `src/editor/` consumers
 * to vibcoder Button via the shim layer at @/shared/ui/Button.
 *
 * Scope: only matches `<button>` elements (lowercase). Does NOT touch
 * `<Button>` (PascalCase, already a component).
 *
 * Skip rules:
 * - Inside __tests__/ directories (let test author keep raw <button>)
 * - `.test.tsx` / `.spec.tsx` co-located test files (test author owns JSX)
 * - Inside scripts/ directories (CI scripts, not chrome)
 * - Inside src/preview/ directories (vibcoder galleries control their own JSX)
 * - Inside shared/vibcoder/ directories (the wrapper layer itself — these
 *   files render the underlying primitive `<button>` and would self-recurse
 *   if rewritten to `<Button>`)
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/button.ts \
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
  // Skip files we never want to touch (see _lib/skip-rules.ts).
  if (shouldSkipPath(file.path)) return file.source;

  const root = j(file.source);
  const buttons = findJsxElementsByTag(j, root, "button");
  if (buttons.size() === 0) return file.source;

  buttons.forEach((path) => {
    renameJsxTag(j, path.node, "Button");
  });

  ensureNamedImport(j, root, "Button", "@/shared/ui/Button");

  return root.toSource({ quote: "double" });
};

export default transform;
export const parser = "tsx";
