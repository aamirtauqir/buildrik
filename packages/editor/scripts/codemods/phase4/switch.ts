// packages/editor/scripts/codemods/phase4/switch.ts
/**
 * Phase 4 codemod: ensure `<Switch>` JSX in `src/editor/` consumers
 * resolves to the vibcoder Switch via the shim layer at
 * `@/shared/ui/Switch`.
 *
 * Scope NOTE — this codemod differs from the lowercase-tag pattern used
 * by button/input/select/textarea: there is NO `<switch>` HTML element.
 * The legacy world had no hand-rolled `<Switch>` primitive in
 * `shared/ui/` either, so today's `<Switch>` JSX only lives inside the
 * vibcoder folder (which `shouldSkipPath` skips). The codemod is shipped
 * here so that future Phase 5 cleanup or accidental new `<Switch>` JSX
 * outside the vibcoder folder gets routed through the shim — keeping
 * Gate 23 (shim layer is gate-keeper) honest as the bundle evolves.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/switch.ts \
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
  const switches = findJsxElementsByTag(j, root, "Switch");
  if (switches.size() === 0) return file.source;

  switches.forEach((path) => {
    renameJsxTag(j, path.node, "Switch");
  });

  ensureNamedImport(j, root, "Switch", "@/shared/ui/Switch");

  return root.toSource({ quote: "double" });
};

export default transform;
export const parser = "tsx";
