/**
 * Insert board taxonomy — founder-final 2026-08-07: ELEMENTS · BLOCKS ·
 * COMPONENTS · MINE. TEMPLATES is OUT of Insert — "template ka apna poora
 * flow hai, wahan adjust nahi ho raha": its surfaces are the rail Templates
 * tab (gallery board 641:2487), Pages new-page (S1.3b) and first-run
 * (S1.1b), never the Insert panel.
 *
 * The board groups by SOURCE (where a thing comes from), not by element
 * type. Counts are live from each source — the board's sample numbers are
 * data, not contract.
 *
 * MINE expands INLINE (board 1069:4970) with the user's own components.
 * COMPONENTS navigates to the Components surface: its expanded board
 * (1069:4790) draws a curated UI catalog that has no live source yet —
 * rendering MINE's registry there would just duplicate MINE.
 *
 * @license BSD-3-Clause
 */

import { flatCatalog } from "./catalog";
import type { FlatElEntry } from "./types";
import { getBlockDefinitions, type BlockDefinition } from "../../../../../blocks/blockRegistry";

export type InsertGroupId = "elements" | "blocks" | "components" | "mine";

export interface InsertGroup {
  id: InsertGroupId;
  /** Board group-header label — caps, 11/500, tracking .5. */
  label: string;
  /** Live count, or null when the source cannot say without a composer. */
  count: number | null;
  /**
   * inline  — rows render inside this panel and insert directly
   * navigate — the group's home is another tab; expanding navigates there
   */
  kind: "inline" | "navigate";
  /** For kind:"navigate" — the GroupedTabId to switch to. */
  targetTab?: "components";
}

/** ELEMENTS — every element def, flat, exactly as the board lists them. */
export const elementRows: FlatElEntry[] = flatCatalog;

/** BLOCKS — the block registry, inserted via the existing insertBlock path. */
export const blockRows: BlockDefinition[] = getBlockDefinitions();

export function buildInsertGroups(mineCount: number | null): InsertGroup[] {
  return [
    { id: "elements", label: "ELEMENTS", count: elementRows.length, kind: "inline" },
    { id: "blocks", label: "BLOCKS", count: blockRows.length, kind: "inline" },
    { id: "components", label: "COMPONENTS", count: null, kind: "navigate", targetTab: "components" },
    { id: "mine", label: "MINE", count: mineCount, kind: "inline" },
  ];
}
