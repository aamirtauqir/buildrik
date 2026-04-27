// packages/editor/scripts/codemods/_lib/jsx-query.ts
/**
 * jscodeshift JSX query helpers for Phase 4 codemods.
 * Reusable across all per-primitive codemods.
 *
 * @license BSD-3-Clause
 */
import type {
  JSCodeshift,
  Collection,
  JSXElement,
  JSXIdentifier,
  JSXAttribute,
  Literal,
} from "jscodeshift";

/** Find all JSX elements with a specific lowercase tag name (e.g., "button"). */
export function findJsxElementsByTag(
  j: JSCodeshift,
  root: Collection<any>,
  tagName: string,
): Collection<JSXElement> {
  return root.find(j.JSXElement, {
    openingElement: {
      name: { type: "JSXIdentifier", name: tagName } as JSXIdentifier,
    },
  });
}

/** Replace a JSX element's tag name (lowercase → PascalCase wrapper). */
export function renameJsxTag(
  j: JSCodeshift,
  element: JSXElement,
  newTagName: string,
): void {
  if (element.openingElement.name.type === "JSXIdentifier") {
    element.openingElement.name.name = newTagName;
  }
  if (element.closingElement?.name.type === "JSXIdentifier") {
    element.closingElement.name.name = newTagName;
  }
}

/**
 * True if a JSX element has a string-literal attribute matching `attrValue`.
 * Only matches the static-literal form (both `Literal` and `StringLiteral`
 * AST shapes — different jscodeshift parsers emit different node types).
 * JSX-expression attribute values (e.g. `type={dynamic}`) return false.
 */
export function hasStringLiteralAttr(
  element: JSXElement,
  attrName: string,
  attrValue: string,
): boolean {
  const attrs = (element.openingElement.attributes ?? []) as JSXAttribute[];
  for (const attr of attrs) {
    if (attr.type !== "JSXAttribute") continue;
    if (!attr.name || attr.name.name !== attrName) continue;
    const v = attr.value as Literal | null | undefined;
    if (v && v.type === "Literal" && typeof v.value === "string" && v.value === attrValue) {
      return true;
    }
    // StringLiteral form (some parser variants).
    if (
      v &&
      (v as { type?: string; value?: unknown }).type === "StringLiteral" &&
      (v as { value?: unknown }).value === attrValue
    ) {
      return true;
    }
  }
  return false;
}
