/**
 * applyInterpretedTree — recursive Canvas applier for an InterpretedNode tree.
 *
 * Walks the tree depth-first. For each InterpretedElement node:
 *   1. Map its tag to an ElementType (HTML tag → engine ElementType union)
 *   2. composer.elements.createElement(type, { content, attributes })
 *   3. parent.addChild(element[, index])
 *   4. Recurse into children
 *
 * Slots become empty container elements with `data-slot={name}` attrs so
 * the user can drop content into them later. Whole insertion wraps in a
 * single composer transaction — failures roll back cleanly.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { ElementType } from "@/shared/types/element";
import type { InterpretedElement, InterpretedNode } from "./schemaInterpreter";

interface ApplyResult {
  rootElementId: string | undefined;
}

/**
 * Map an HTML tag from a SchemaNode to the engine's ElementType union.
 * Conservative: unmapped tags fall back to "container" so unknown structure
 * still inserts something the user can edit.
 */
function tagToElementType(tag: string): ElementType {
  switch (tag.toLowerCase()) {
    case "button":   return "button";
    case "input":    return "input";
    case "select":   return "select";
    case "textarea": return "textarea";
    case "label":    return "text";
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
      return "heading";
    case "p":        return "paragraph";
    case "a":        return "link";
    case "img":      return "image";
    case "svg":      return "svg";
    case "section":  return "section";
    case "header":   return "header";
    case "form":     return "form";
    case "table":    return "table";
    case "ul": case "ol": case "li":
      return "list";
    case "span":     return "text";
    default:         return "container";
  }
}

function applyNode(
  composer: Composer,
  parentId: string,
  node: InterpretedNode,
  index?: number,
): string | undefined {
  // Slot → empty container with data-slot marker. Becomes the user's
  // drop target after the catalog component is placed.
  if (node.kind === "slot") {
    return applyElementShape(
      composer,
      parentId,
      {
        kind: "element",
        tag: "div",
        attrs: { "data-slot": node.name },
        children: [],
      },
      index,
    );
  }
  return applyElementShape(composer, parentId, node, index);
}

function applyElementShape(
  composer: Composer,
  parentId: string,
  node: InterpretedElement,
  index?: number,
): string | undefined {
  const parent = composer.elements.getElement(parentId);
  if (!parent) return undefined;

  const element = composer.elements.createElement(tagToElementType(node.tag), {
    content: node.content ?? "",
    attributes: node.attrs,
  } as Parameters<typeof composer.elements.createElement>[1]);

  parent.addChild(element, index);

  for (const child of node.children) {
    applyNode(composer, element.getId(), child);
  }

  return element.getId();
}

export function applyInterpretedTree(
  composer: Composer,
  parentId: string,
  root: InterpretedNode,
  index?: number,
): ApplyResult {
  composer.beginTransaction("apply-interpreted-tree");
  try {
    const id = applyNode(composer, parentId, root, index);
    if (!id) {
      composer.rollbackTransaction();
      return { rootElementId: undefined };
    }
    composer.endTransaction();
    return { rootElementId: id };
  } catch {
    composer.rollbackTransaction();
    return { rootElementId: undefined };
  }
}
