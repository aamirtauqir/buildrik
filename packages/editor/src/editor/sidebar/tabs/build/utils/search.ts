/**
 * search.ts — Insert panel search (board 138:53).
 *
 * The board draws search as ONE flat list across every source group — label
 * left, source tag (ELEMENTS/BLOCKS/…) right — no category grouping, no
 * results header. Element matching keeps the four-branch contract (name,
 * description, tags, category name); blocks match on label and id.
 * COMPONENTS/TEMPLATES/MINE join here when their sources go async.
 * @license BSD-3-Clause
 */

import type { FlatElEntry } from "../catalog/types";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";

/** One flat search hit — the payload field matches `group`. */
export type InsertSearchHit =
  | { key: string; label: string; group: "ELEMENTS"; el: FlatElEntry }
  | { key: string; label: string; group: "BLOCKS"; block: BlockDefinition };

export function searchInsert(
  query: string,
  elements: FlatElEntry[],
  blocks: BlockDefinition[]
): InsertSearchHit[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const elHits: InsertSearchHit[] = elements
    .filter(
      (el) =>
        el.name.toLowerCase().includes(q) ||
        el.description.toLowerCase().includes(q) ||
        el.tags.some((tag) => tag.includes(q)) ||
        el.catName.toLowerCase().includes(q)
    )
    .map((el) => ({
      key: `el-${el.catId}-${el.name}`,
      label: el.name,
      group: "ELEMENTS" as const,
      el,
    }));

  const blockHits: InsertSearchHit[] = blocks
    .filter((b) => b.label.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
    .map((b) => ({
      key: `block-${b.id}`,
      label: b.label,
      group: "BLOCKS" as const,
      block: b,
    }));

  return [...elHits, ...blockHits];
}
