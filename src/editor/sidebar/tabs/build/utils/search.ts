/**
 * search.ts — pure search function for Build Tab element catalog
 * Groups results by category, preserving catalog order
 * @license BSD-3-Clause
 */

import type { FlatElEntry, SearchGroup } from "../catalog/types";

/**
 * Filter elements by query against name, description, tags, and category name.
 * Returns results grouped by category, preserving catalog order.
 */
export function searchElements(query: string, catalog: FlatElEntry[]): SearchGroup[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const matched = catalog.filter(
    (el) =>
      el.name.toLowerCase().includes(q) ||
      el.description.toLowerCase().includes(q) ||
      el.tags.some((tag) => tag.includes(q)) ||
      el.catName.toLowerCase().includes(q)
  );

  // Group by category, preserving catalog insertion order
  const groupMap = new Map<string, SearchGroup>();
  for (const el of matched) {
    if (!groupMap.has(el.catId)) {
      groupMap.set(el.catId, { catId: el.catId, catName: el.catName, elements: [] });
    }
    groupMap.get(el.catId)!.elements.push(el);
  }

  return Array.from(groupMap.values());
}
