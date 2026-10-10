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

import { flatCatalog } from "./catalog";
import { getBlockDefinitions, type BlockDefinition } from "@/blocks/blockRegistry";

export type InsertGroupId = "favourites" | "recent" | "elements" | "blocks" | "mine";

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
    { id: "mine", label: "SAVED COMPONENTS", count: mineCount, kind: "inline" },
  ];
}
