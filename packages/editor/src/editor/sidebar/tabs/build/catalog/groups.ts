/**
 * Insert board taxonomy — board 137:2 (re-fetched 2026-08-06 after founder
 * edits): ELEMENTS · BLOCKS · COMPONENTS · TEMPLATES · MINE.
 *
 * The board groups by SOURCE (where a thing comes from), not by element type.
 * The old BASIC/LAYOUT/FORMS/… categories were a different IA and are the
 * "inner sections totally mismatch" the founder named. Categories survive
 * only inside search grouping (SearchResults), not in the default view.
 *
 * Counts are live from each source — the board's 48/63/27/10/4 are sample
 * data; a hardcoded count is a lie the moment a block ships.
 *
 * @license BSD-3-Clause
 */

import { flatCatalog } from "./catalog";
import type { FlatElEntry } from "./types";
import { getBlockDefinitions, type BlockDefinition } from "../../../../../blocks/blockRegistry";

export type InsertGroupId = "elements" | "blocks" | "components" | "templates" | "mine";

export interface InsertGroup {
  id: InsertGroupId;
  /** Board group-header label — caps, 11/500, tracking .5. */
  label: string;
  /** Live count, or null when the source cannot say without a composer. */
  count: number | null;
  /**
   * inline  — rows render inside this panel and insert directly
   * navigate — the group's home is another tab; expanding navigates there
   *            (real behaviour, not a stub: COMPONENTS/TEMPLATES/MINE own
   *            full tabs with create/preview flows this panel cannot host)
   */
  kind: "inline" | "navigate";
  /** For kind:"navigate" — the GroupedTabId to switch to. */
  targetTab?: "components" | "templates";
}

/** ELEMENTS — every element def, flat, exactly as the board lists them. */
export const elementRows: FlatElEntry[] = flatCatalog;

/** BLOCKS — the block registry, inserted via the existing insertBlock path. */
export const blockRows: BlockDefinition[] = getBlockDefinitions();

export function buildInsertGroups(): InsertGroup[] {
  return [
    { id: "elements", label: "ELEMENTS", count: elementRows.length, kind: "inline" },
    { id: "blocks", label: "BLOCKS", count: blockRows.length, kind: "inline" },
    { id: "components", label: "COMPONENTS", count: null, kind: "navigate", targetTab: "components" },
    { id: "templates", label: "TEMPLATES", count: null, kind: "navigate", targetTab: "templates" },
    { id: "mine", label: "MINE", count: null, kind: "navigate", targetTab: "components" },
  ];
}
