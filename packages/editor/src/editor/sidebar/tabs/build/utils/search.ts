/**
 * search.ts — Insert panel search (board 138:53).
 *
 * The board draws search as ONE flat list across every source group — label
 * left, source tag (ELEMENTS/BLOCKS/…) right — no category grouping, no
 * results header. Element matching keeps the four-branch contract (name,
 * description, tags, category name); blocks match on label and id.
 * Saved components (MINE) match on name, description and tags (G2-111).
 * @license BSD-3-Clause
 */

import type { FlatElEntry } from "../catalog/types";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import type { ComponentDefinition } from "@/shared/types/components";

/** One flat search hit — the payload field matches `group`. */
export type InsertSearchHit =
  | { key: string; label: string; group: "ELEMENTS"; el: FlatElEntry }
  | { key: string; label: string; group: "BLOCKS"; block: BlockDefinition }
  | { key: string; label: string; group: "COMPONENTS"; block: BlockDefinition }
  | { key: string; label: string; group: "SAVED"; component: ComponentDefinition };

/* Tag → the word a user types for it. Blocks carry no tags, so a block is
   found by what it inserts (4418:100087 answers "button" from every source). */
const TAG_WORDS: Record<string, string> = {
  a: "link", img: "image", h1: "heading", h2: "heading", h3: "heading", h4: "heading",
  p: "text", ul: "list", ol: "list", nav: "navigation", hr: "divider",
};

/** Searchable text for a block: label, id, description, tags, element type,
 *  and — for markup blocks — the element words it contains. */
function blockTerms(b: BlockDefinition): string {
  const parts = [b.label, b.id, b.description ?? "", ...(b.tags ?? []), b.elementType ?? ""];
  if (typeof b.content === "string") {
    for (const m of b.content.matchAll(/<([a-z][a-z0-9]*)/gi)) {
      const tag = m[1].toLowerCase();
      parts.push(tag, TAG_WORDS[tag] ?? "");
    }
  }
  return parts.join(" ").toLowerCase();
}

export function searchInsert(
  query: string,
  elements: FlatElEntry[],
  blocks: BlockDefinition[],
  components: BlockDefinition[] = [],
  saved: ComponentDefinition[] = []
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
    .filter((b) => blockTerms(b).includes(q))
    .map((b) => ({
      key: `block-${b.id}`,
      label: b.label,
      group: "BLOCKS" as const,
      block: b,
    }));

  const componentHits: InsertSearchHit[] = components
    .filter((b) => blockTerms(b).includes(q))
    .map((b) => ({
      key: `component-${b.id}`,
      label: b.label,
      group: "COMPONENTS" as const,
      block: b,
    }));

  const savedHits: InsertSearchHit[] = saved
    .filter((c) => [c.name, c.description ?? "", ...(c.tags ?? [])].join(" ").toLowerCase().includes(q))
    .map((c) => ({ key: `saved-${c.id}`, label: c.name, group: "SAVED" as const, component: c }));

  return [...elHits, ...blockHits, ...componentHits, ...savedHits];
}
