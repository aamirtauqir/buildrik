// packages/editor/scripts/codemods/phase4/input.ts
/**
 * Phase 4 codemod: swap inline `<input>` JSX in `src/editor/` consumers
 * to vibcoder Input via the shim layer at `@/shared/ui/TextInput`.
 *
 * Note on file alias: legacy file is `shared/ui/TextInput.tsx`; consumers
 * keep importing from there. The codemod points new imports at the same
 * legacy filename so existing barrel exports / IDE history stay stable.
 *
 * Scope: only matches `<input>` elements (lowercase). Does NOT touch
 * `<input type="checkbox">` — checkbox primitives are owned by the
 * dedicated Checkbox codemod (T2.D), where they are rewritten to
 * `<Checkbox>`.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/input.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import type { Transform, FileInfo, API, Options, JSXAttribute, Literal } from "jscodeshift";
import { findJsxElementsByTag, renameJsxTag } from "../_lib/jsx-query";
import { ensureNamedImport } from "../_lib/import-swap";
import { shouldSkipPath } from "../_lib/skip-rules";

/**
 * True when the JSX element has `type="checkbox"` as a literal-string attribute.
 * Only matches the static-literal form. JSX-expression `type` values
 * (e.g. `type={dynamic}`) are conservatively NOT skipped — a dynamic type
 * value is rare and the swap-to-TextInput case is benign even if some
 * branch sets type=checkbox at runtime (TextInput passes type through).
 */
function isCheckboxInput(element: { openingElement: { attributes?: unknown[] } }): boolean {
  const attrs = (element.openingElement.attributes ?? []) as JSXAttribute[];
  for (const attr of attrs) {
    if (attr.type !== "JSXAttribute") continue;
    if (!attr.name || attr.name.name !== "type") continue;
    const v = attr.value as Literal | null | undefined;
    if (v && v.type === "Literal" && typeof v.value === "string" && v.value === "checkbox") {
      return true;
    }
    // StringLiteral form (some parser variants)
    if (
      v &&
      (v as { type?: string; value?: unknown }).type === "StringLiteral" &&
      (v as { value?: unknown }).value === "checkbox"
    ) {
      return true;
    }
  }
  return false;
}

const transform: Transform = (file: FileInfo, api: API, _options: Options) => {
  const j = api.jscodeshift;
  if (shouldSkipPath(file.path)) return file.source;

  const root = j(file.source);
  const inputs = findJsxElementsByTag(j, root, "input");
  if (inputs.size() === 0) return file.source;

  let swapped = 0;
  inputs.forEach((path) => {
    if (isCheckboxInput(path.node)) return; // owned by checkbox codemod
    renameJsxTag(j, path.node, "TextInput");
    swapped++;
  });

  if (swapped === 0) return file.source;
  ensureNamedImport(j, root, "TextInput", "@/shared/ui/TextInput");

  return root.toSource({ quote: "double" });
};

export default transform;
export const parser = "tsx";
