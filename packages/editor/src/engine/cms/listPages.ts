/**
 * Collection list "Pages" and "When empty" (B-30, engine-list-query.md
 * §Pages / §When empty; 2L9 B5-D75, D78, D80, D81, D82).
 *
 * - The pager is an ordinary, editable element placed right after the list
 *   (`data-bk-pager="<listId>"`): a Previous link, a "Page k of n" label and
 *   a Next link, each marked by `data-bk-pager-part`. The renderer fills the
 *   label and the two hrefs; the author styles and rewords it like any block.
 * - The "No items" block is a child of the list marked `data-bk-empty`; the
 *   renderer never repeats it and shows it only when no record is left.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";
import { applyCmsListQuery, CMS_LIST_EMPTY_ATTR } from "@buildrik/shared/schemas/cmsConditions";
import { CMS_COLLECTION_LIMIT_MAX } from "@buildrik/shared/schemas/sites";
import { pageFileNames, paginatedFileName, paginatedPath } from "../export/pageFiles";

export const LIST_PAGER_ATTR = "data-bk-pager";
export const LIST_PAGER_PART_ATTR = "data-bk-pager-part";

/** The pager placed for `listId`, if any (a sibling of the list). */
export function pagerOf(composer: Composer, listId: string): Element | null {
  const list = composer.elements.getElement(listId);
  return list?.getParent?.()?.getChildren().find((c) => c.getAttribute(LIST_PAGER_ATTR) === listId) ?? null;
}

/** The list's "No items" block, if it has one. */
export function emptySlotOf(composer: Composer, listId: string): Element | null {
  return composer.elements.getElement(listId)?.getChildren().find((c) => c.getAttribute(CMS_LIST_EMPTY_ATTR) === "true") ?? null;
}

/** Places the pager after the list when it has none. Caller's transaction. */
export function ensurePager(composer: Composer, listId: string): Element | null {
  const existing = pagerOf(composer, listId);
  if (existing) return existing;
  const list = composer.elements.getElement(listId);
  const parent = list?.getParent?.();
  if (!list || !parent) return null;
  const els = composer.elements;
  const nav = els.createElement("container", { tagName: "nav", attributes: { [LIST_PAGER_ATTR]: listId, "aria-label": "Pagination" } });
  els.addElement(nav, parent.getId(), parent.getChildIndex(list) + 1);
  els.addElement(els.createElement("link", { tagName: "a", content: "Previous", attributes: { [LIST_PAGER_PART_ATTR]: "prev" } }), nav.getId());
  els.addElement(els.createElement("text", { tagName: "span", content: "Page 1 of 1", attributes: { [LIST_PAGER_PART_ATTR]: "label" } }), nav.getId());
  els.addElement(els.createElement("link", { tagName: "a", content: "Next", attributes: { [LIST_PAGER_PART_ATTR]: "next" } }), nav.getId());
  return nav;
}

/** Removes the list's pager. Caller's transaction. */
export function removePager(composer: Composer, listId: string): void {
  const pager = pagerOf(composer, listId);
  if (pager) composer.elements.removeElement(pager.getId());
}

/** Adds the "No items" block when the list has none. Caller's transaction. */
export function ensureEmptySlot(composer: Composer, listId: string): Element | null {
  const existing = emptySlotOf(composer, listId);
  if (existing) return existing;
  if (!composer.elements.getElement(listId)) return null;
  const els = composer.elements;
  const slot = els.createElement("container", { tagName: "div", attributes: { [CMS_LIST_EMPTY_ATTR]: "true" } });
  els.addElement(slot, listId);
  els.addElement(els.createElement("text", { tagName: "p", content: "No items yet." }), slot.getId());
  return slot;
}

/** The page (by id) that holds `elementId`. */
function pageOf(composer: Composer, elementId: string): string | null {
  let el: Element | null = composer.elements.getElement(elementId) ?? null;
  while (el?.getParent?.()) el = el.getParent();
  const rootId = el?.getId();
  return composer.elements.getAllPages().find((p) => p.root?.id === rootId)?.id ?? null;
}

export interface ListPagination {
  /** Every page's path, page 1 first: "/", "/page/2", … */
  paths: string[];
  /** The first generated path another page already uses, with that page. */
  collision: { path: string; pageId: string } | null;
}

/**
 * What "Split into pages" will publish for a list: one page per Show records
 * of what its filter, sort and Skip leave (published records only), and the
 * first of those paths another page's file already takes. Null when the list
 * is not split or has no Show.
 */
export async function listPagination(composer: Composer, listId: string): Promise<ListPagination | null> {
  const binding = composer.cms.bindings.getCollectionBinding(listId);
  if (!binding || binding.repeat !== "children" || binding.pages !== "split" || !binding.limit) return null;
  const pageId = pageOf(composer, listId);
  const files = pageFileNames(composer.elements.getAllPages());
  const file = (pageId && files.get(pageId)) || "index.html";
  const { items } = await composer.cms.collections.queryContent({
    collectionId: binding.collectionId,
    status: binding.status === "all" ? undefined : (binding.status ?? "published"),
    limit: CMS_COLLECTION_LIMIT_MAX,
  });
  const matching = applyCmsListQuery(items, { filter: binding.filter, sort: binding.sort, skip: binding.skip }).length;
  const count = pageCount(matching, binding.limit);
  const paths = Array.from({ length: count }, (_, i) => paginatedPath(file, i + 1));
  let collision: ListPagination["collision"] = null;
  for (let k = 2; k <= count && !collision; k++) {
    const name = paginatedFileName(file, k);
    for (const [id, other] of files) if (other === name) collision = { path: paginatedPath(file, k), pageId: id };
  }
  return { paths, collision };
}

/** Pages needed for `matching` records at `size` per page — at least one. */
export function pageCount(matching: number, size: number): number {
  return Math.max(1, Math.ceil(matching / Math.max(1, size)));
}
