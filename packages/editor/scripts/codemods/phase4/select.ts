// packages/editor/scripts/codemods/phase4/select.ts
/**
 * Phase 4 codemod: swap inline `<select>` JSX in `src/editor/` consumers
 * to vibcoder Select via the shim layer at `@/shared/ui/Select`.
 *
 * Scope: only matches `<select>` elements (lowercase). Does NOT touch
 * `<Select>` (PascalCase, already a component).
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/select.ts \
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
  const selects = findJsxElementsByTag(j, root, "select");
  if (selects.size() === 0) return file.source;

  selects.forEach((path) => {
    renameJsxTag(j, path.node, "Select");
  });

  ensureNamedImport(j, root, "Select", "@/shared/ui/Select");

  return root.toSource({ quote: "double" });
};

export default transform;
export const parser = "tsx";
