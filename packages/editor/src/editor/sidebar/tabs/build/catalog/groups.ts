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
 * COMPONENTS expands INLINE too (board 1069:4790): its catalog is the
 * registry's Components-folder subset (Card, Slider, Modal, Tabs, …) —
 * BLOCKS carries the rest of the registry. The Components management
 * surface stays reachable from the rail.
 *
 * @license BSD-3-Clause
 */

import { flatCatalog } from "./catalog";
import type { FlatElEntry } from "./types";
import { getBlockDefinitions, componentBlockDefinitions, type BlockDefinition } from "../../../../../blocks/blockRegistry";

export type InsertGroupId = "elements" | "blocks" | "components" | "mine";

export interface InsertGroup {
  id: InsertGroupId;
  /** Board group-header label — caps, 11/500, tracking .5. */
  label: string;
  /** Live count, or null when the source cannot say without a composer. */
  count: number | null;
  /** Every group expands inline and inserts directly. */
  kind: "inline";
}

/** ELEMENTS — every element def, flat, exactly as the board lists them. */
export const elementRows: FlatElEntry[] = flatCatalog;

/** COMPONENTS — the registry's Components-folder subset (board 1069:4790). */
export const componentRows: BlockDefinition[] = componentBlockDefinitions;

const componentIds = new Set(componentRows.map((c) => c.id));

/** BLOCKS — the rest of the registry, inserted via the existing insertBlock path. */
export const blockRows: BlockDefinition[] = getBlockDefinitions().filter((b) => !componentIds.has(b.id));

export function buildInsertGroups(mineCount: number | null): InsertGroup[] {
  return [
    { id: "elements", label: "ELEMENTS", count: elementRows.length, kind: "inline" },
    { id: "blocks", label: "BLOCKS", count: blockRows.length, kind: "inline" },
    { id: "components", label: "COMPONENTS", count: componentRows.length, kind: "inline" },
    { id: "mine", label: "MINE", count: mineCount, kind: "inline" },
  ];
}
