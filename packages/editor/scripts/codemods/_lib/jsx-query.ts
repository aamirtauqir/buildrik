// packages/editor/scripts/codemods/_lib/jsx-query.ts
/**
 * jscodeshift JSX query helpers for Phase 4 codemods.
 * Reusable across all per-primitive codemods.
 *
 * @license BSD-3-Clause
 */
import type { JSCodeshift, Collection, JSXElement, JSXIdentifier } from "jscodeshift";

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
