/**
 * Insert board taxonomy — founder-final 2026-08-07: ELEMENTS · BLOCKS ·
 * MINE (saved components; L1-022 retired BUILT-IN COMPONENTS). TEMPLATES is OUT of Insert — "template ka apna poora
 * flow hai, wahan adjust nahi ho raha": its surfaces are the rail Templates
 * tab (gallery board 641:2487), Pages new-page (S1.3b) and first-run
 * (S1.1b), never the Insert panel.
 *
 * The board groups by SOURCE (where a thing comes from), not by element
 * type. Counts are live from each source — the board's sample numbers are
 * data, not contract.
 *
 * MINE expands INLINE (board 1069:4970) with the user's own components.
 * The Components management surface stays reachable from the rail.
 *
 * @license BSD-3-Clause
 */

import { CATALOG, flatCatalog } from "./catalog";
import type { FlatElEntry } from "./types";
import { getBlockDefinitions, type BlockDefinition } from "@/blocks/blockRegistry";

export type InsertGroupId = "favourites" | "recent" | "elements" | "blocks" | "mine" | `cat-${string}`;

/** The Add panel's three tabs (board 7:18981: Elements · Blocks · Components). */
export type AddTabId = "elements" | "blocks" | "components";

/** Which tab a group lives under — a door that asks for a group opens its tab. */
export function addTabOf(group: InsertGroupId): AddTabId {
  if (group === "blocks") return "blocks";
  if (group === "mine") return "components";
  return "elements";
}

export interface InsertGroup {
  id: InsertGroupId;
  /** Board group-header label — caps, 11/500, tracking .5. */
  label: string;
  /** Live count, or null when the source cannot say without a composer. */
  count: number | null;
  /** Every group expands inline and inserts directly. */
  kind: "inline";
}

/** BLOCKS — sections (board 4428:140817, G2-110 / G2-107): the registry's
 *  `Sections` folder plus the Pricing table, inserted via the insertBlock
 *  path. L1-022 (owner 2026-10-10): one name per concept. The board's
 *  BUILT-IN COMPONENTS group listed the registry's Components folder, every
 *  row of which ELEMENTS already offered under another name (Slider/Carousel,
 *  Accordion / FAQ, Modal / Dialog, Contact Form = Form …); the one section
 *  among them, Pricing, moved here. */
export const blockRows: BlockDefinition[] = getBlockDefinitions().filter(
  (b) => b.category === "Sections" || b.id === "pricing",
);

/** ★ FAVOURITES (board 4418:103353) and RECENT lead the list only while they
 *  have rows. */
export function buildInsertGroups(
  mineCount: number | null,
  favCount = 0,
  recentCount = 0,
  /** ELEMENTS' rows — the catalog less what the site does not offer (BRP1-M12). */
  elementCount = flatCatalog.length,
): InsertGroup[] {
  return [
    ...(favCount ? [{ id: "favourites" as const, label: "★ FAVOURITES", count: favCount, kind: "inline" as const }] : []),
    ...(recentCount ? [{ id: "recent" as const, label: "RECENT", count: recentCount, kind: "inline" as const }] : []),
    { id: "elements", label: "ELEMENTS", count: elementCount, kind: "inline" },
    { id: "blocks", label: "BLOCKS", count: blockRows.length, kind: "inline" },
    /* 215:43556 (B6-K01): "Saved components · This site". */
    { id: "mine", label: "Saved components · This site", count: mineCount, kind: "inline" },
  ];
}

/** Board 7:18981 names the first category "Basic elements"; the rest keep
 *  their catalog names. */
const CATEGORY_LABEL: Partial<Record<string, string>> = { basic: "Basic elements" };

/** The Elements tab: the catalog's categories, in catalog order, each with
 *  the rows the site offers (an emptied category is dropped). No count —
 *  board 7:18981 heads each category with its name alone. */
export function elementCategoryGroups(elements: readonly FlatElEntry[]): Array<InsertGroup & { elements: FlatElEntry[] }> {
  return CATALOG.flatMap((cat) => {
    const rows = elements.filter((el) => el.catId === cat.id);
    return rows.length
      ? [{ id: `cat-${cat.id}` as const, label: CATEGORY_LABEL[cat.id] ?? cat.name, count: null, kind: "inline" as const, elements: rows }]
      : [];
  });
}
