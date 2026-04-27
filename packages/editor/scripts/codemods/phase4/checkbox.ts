// packages/editor/scripts/codemods/phase4/checkbox.ts
/**
 * Phase 4 codemod: route checkbox JSX in `src/editor/` consumers through
 * the vibcoder Checkbox via the shim layer at `@/shared/ui/Checkbox`.
 *
 * Two scopes:
 *   (a) `<input type="checkbox">` → `<Checkbox>` (with `type` attribute
 *       removed, since Checkbox sets it internally)
 *   (b) `<Checkbox>` (PascalCase) — adds the shim import if no existing
 *       Checkbox binding is in scope (so future hand-written `<Checkbox>`
 *       JSX outside the vibcoder folder gets routed correctly)
 *
 * Note: `<input>` JSX elements with no `type` attr OR with a different
 * `type` (text, email, etc.) are owned by the input codemod (T2.A).
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/checkbox.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import type { Transform, FileInfo, API, Options, JSXAttribute, Literal } from "jscodeshift";
import { findJsxElementsByTag, renameJsxTag } from "../_lib/jsx-query";
import { ensureNamedImport } from "../_lib/import-swap";
import { shouldSkipPath } from "../_lib/skip-rules";

/** True when the JSX element has a literal `type="checkbox"` attribute. */
function isCheckboxInput(element: { openingElement: { attributes?: unknown[] } }): boolean {
  const attrs = (element.openingElement.attributes ?? []) as JSXAttribute[];
  for (const attr of attrs) {
    if (attr.type !== "JSXAttribute") continue;
    if (!attr.name || attr.name.name !== "type") continue;
    const v = attr.value as Literal | null | undefined;
    if (v && v.type === "Literal" && typeof v.value === "string" && v.value === "checkbox") {
      return true;
    }
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

/** Strip the `type` attribute (Checkbox component sets it internally). */
function stripTypeAttr(element: {
  openingElement: { attributes?: unknown[] };
}): void {
  const attrs = element.openingElement.attributes;
  if (!Array.isArray(attrs)) return;
  element.openingElement.attributes = attrs.filter((attr) => {
    const a = attr as JSXAttribute;
    if (a.type !== "JSXAttribute") return true;
    if (!a.name) return true;
    return a.name.name !== "type";
  });
}

const transform: Transform = (file: FileInfo, api: API, _options: Options) => {
  const j = api.jscodeshift;
  if (shouldSkipPath(file.path)) return file.source;

  const root = j(file.source);

  // Scope (a): <input type="checkbox"> → <Checkbox>
  const inputs = findJsxElementsByTag(j, root, "input");
  let aHits = 0;
  inputs.forEach((path) => {
    if (!isCheckboxInput(path.node)) return;
    stripTypeAttr(path.node);
    renameJsxTag(j, path.node, "Checkbox");
    aHits++;
  });

  // Scope (b): <Checkbox> (PascalCase, no rename — but ensure import).
  const checkboxes = findJsxElementsByTag(j, root, "Checkbox");
  const bHits = checkboxes.size();

  if (aHits === 0 && bHits === 0) return file.source;

  ensureNamedImport(j, root, "Checkbox", "@/shared/ui/Checkbox");

  return root.toSource({ quote: "double" });
};

export default transform;
export const parser = "tsx";
