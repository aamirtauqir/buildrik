/**
 * Element conversion — an element becomes another type IN PLACE (2L9 BD-29,
 * B4-A12 `247:27113` / A13 `247:27602`): the same element id, so selection,
 * history, CMS bindings and anything that names the element keep pointing
 * at it; its classes, styles at every breakpoint, lock and layer data; its
 * children and place. Only the type, the tag and what the caller replaces
 * change. Callers own the lock gate and the transaction (one Undo).
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import type { ElementData } from "@/shared/types/element";

/** Swap `el` for a `type` element with the same identity. `next` sets the
 *  tag, attributes and content the new type needs; children are kept unless
 *  `dropChildren`. Returns the element now in its place (same id). */
export function replaceInPlace(
  composer: Composer,
  el: Element,
  type: ElementData["type"],
  next: Pick<ElementData, "tagName" | "attributes" | "content" | "contentFormat">,
  dropChildren = false,
): Element | null {
  const parent = el.getParent();
  if (!parent) return null;
  const id = el.getId();
  const identity: Partial<ElementData> = el.getData();
  for (const key of ["type", "tagName", "content", "contentFormat", "children", "attributes"] as const) delete identity[key];
  const index = parent.getChildIndex(el);
  /* Children step out to the page root while the element is swapped, then
     come back in order — removing the element would take them with it. */
  const kids = dropChildren ? [] : el.getChildren().map((c) => c.getId());
  const page = composer.elements.getActivePage?.()?.root.id;
  if (kids.length && !page) return null;
  for (const kid of kids) composer.elements.moveElement(kid, page!);
  composer.elements.removeElement(id);
  const made = composer.elements.createElement(type, { ...identity, ...next });
  composer.elements.addElement(made, parent.getId(), index);
  kids.forEach((kid, i) => composer.elements.moveElement(kid, id, i));
  return made;
}

/** A tag change that changes what the element IS (heading ↔ paragraph),
 *  reviewed before it applies (A12). Within a type the tag just changes. */
export interface SemanticConversion {
  type: ElementData["type"];
  tag: string;
  /** "Change to paragraph", "Heading changed to paragraph." */
  noun: string;
  /** What survives and what does not (A12's impact line). */
  impact: string;
}

const TO_PARAGRAPH: SemanticConversion = {
  type: "paragraph",
  tag: "p",
  noun: "paragraph",
  impact: "Text, nested emphasis, ID, styles and links can be preserved. Heading semantics will change.",
};

const TO_HEADING: SemanticConversion = {
  type: "heading",
  tag: "h2",
  noun: "heading",
  impact: "Text, nested emphasis, ID, styles and links can be preserved. It joins the page outline as a level-2 heading.",
};

/** The cross-type tag a type may convert to from its Tag row. */
export function semanticConversionFor(type: string): SemanticConversion | null {
  if (type === "heading") return TO_PARAGRAPH;
  if (type === "text" || type === "paragraph") return TO_HEADING;
  return null;
}

/** Apply a reviewed conversion: same node, same text and children. */
export function convertSemantic(composer: Composer, el: Element, to: SemanticConversion): Element | null {
  const data = el.getData();
  return replaceInPlace(composer, el, to.type, {
    tagName: to.tag,
    attributes: { ...(data.attributes ?? {}) },
    content: data.content,
    contentFormat: data.contentFormat,
  });
}
