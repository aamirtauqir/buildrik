/**
 * placement — may a child of type X sit inside a parent of type Y?
 *
 * One rule for every door that puts an element inside another: the canvas
 * drop (dragDrop/dropValidation.ts) and the engine's own writes (insert, move,
 * paste, duplicate — ElementCRUD). The engine used to skip it, so a heading
 * could be saved inside a heading; the browser then hoists the inner one out
 * when the canvas sets innerHTML, and the model and the DOM disagree (walk,
 * /edit/:id, 2026-09-24: 159 top-level nodes in the DOM against 149 in the
 * model).
 *
 * `parserHoists` is the other half: which nestings the HTML parser itself
 * breaks up, so a load can repair saved data the way the browser renders it.
 *
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";
import { canNestElement } from "./validator";
import { canHaveChildren, isInteractiveType, isVoidType } from "./typeChecks";
import { CAN_HAVE_CHILDREN_SET, ELEMENT_CATEGORIES } from "./derived";

export const TEXT_ELEMENT_TYPES: ReadonlySet<string> = new Set(["text", "span", "paragraph", "heading", "label"]);

export type InsideRefusal = "VOID_ELEMENT" | "TEXT_ELEMENT" | "INTERACTIVE_NESTING" | "NESTING_FORBIDDEN";

/** Why `childType` may not go inside `parentType`, or null when it may. */
export function insideRefusal(childType: ElementType, parentType: ElementType): InsideRefusal | null {
  if (isVoidType(parentType)) return "VOID_ELEMENT";
  if (TEXT_ELEMENT_TYPES.has(parentType) && !canHaveChildren(parentType)) return "TEXT_ELEMENT";
  if (isInteractiveType(childType) && isInteractiveType(parentType)) return "INTERACTIVE_NESTING";
  if (!canNestElement(childType, parentType)) return "NESTING_FORBIDDEN";
  return null;
}

/** The engine's write guard: `insideRefusal`, applied only to types the rules
 *  know — an unknown or custom type is left alone rather than moved. */
export function engineMayPlaceInside(childType: string, parentType: string): boolean {
  if (!ELEMENT_CATEGORIES[childType as ElementType] || !CAN_HAVE_CHILDREN_SET.has(parentType as ElementType)) {
    return !isVoidType(parentType as ElementType);
  }
  return insideRefusal(childType as ElementType, parentType as ElementType) === null;
}

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
/* HTML parsing, "in body" insertion mode: these start tags close an open <p>. */
const CLOSES_P = new Set([
  "address", "article", "aside", "blockquote", "center", "details", "dialog", "dir", "div", "dl",
  "fieldset", "figcaption", "figure", "footer", "form", "header", "hgroup", "hr", "main", "menu",
  "nav", "ol", "p", "pre", "section", "summary", "table", "ul", ...HEADING_TAGS,
]);

/** True when the HTML parser will not keep `<childTag>` inside `<parentTag>`:
 *  it closes the parent and the child lands after it. */
export function parserHoists(parentTag: string, childTag: string): boolean {
  const p = parentTag.toLowerCase();
  const c = childTag.toLowerCase();
  if (p === "p") return CLOSES_P.has(c);
  if (HEADING_TAGS.has(p)) return HEADING_TAGS.has(c);
  if (p === "a") return c === "a";
  if (p === "button") return c === "button";
  return false;
}
