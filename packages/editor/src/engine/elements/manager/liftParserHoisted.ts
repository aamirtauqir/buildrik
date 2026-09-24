/**
 * liftParserHoisted — repair saved element trees the HTML parser breaks up.
 *
 * The canvas renders a page by setting innerHTML. When the saved tree holds a
 * nesting the parser will not keep — a heading inside a heading, a block
 * inside a <p> — the browser closes the parent and puts the child after it,
 * so the DOM and the model disagree: section reorder, selection and Layers
 * then act on different trees (walk, /edit/:id, 2026-09-24: 159 top-level
 * nodes in the DOM, 149 in the model). This lifts those children to siblings
 * right after their parent, in order — nested cases cascade the same way the
 * parser's do. Mutates `root`; returns how many elements moved. Idempotent.
 *
 * @license BSD-3-Clause
 */

import type { ElementData } from "../../../shared/types";
import { getDefaultTagName } from "../../../shared/utils/html";
import { parserHoists } from "../../../shared/utils/nesting";

const tagOf = (data: ElementData): string => data.tagName || getDefaultTagName(data.type);

export function liftParserHoisted(root: ElementData): number {
  const moved = new Set<ElementData>();
  /* The nodes that occupy `node`'s slot in its parent: node itself, then
     whatever the parser pushes out of it. */
  const slot = (node: ElementData): ElementData[] => {
    const children = (node.children ?? []).flatMap(slot);
    const kept: ElementData[] = [];
    const out: ElementData[] = [];
    for (const child of children) {
      if (parserHoists(tagOf(node), tagOf(child))) {
        out.push(child);
        moved.add(child);
      } else kept.push(child);
    }
    if (node.children) node.children = kept;
    return [node, ...out];
  };
  if (root.children) root.children = root.children.flatMap(slot);
  return moved.size;
}
