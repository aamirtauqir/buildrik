/**
 * Build Tab catalog types — ElEntry, CatEntry, FlatElEntry, SearchGroup
 * @license BSD-3-Clause
 */

export interface ElEntry {
  /** Display name */
  name: string;
  /** SVG inner HTML (rendered inside <svg viewBox="0 0 24 24">) */
  iconHtml: string;
  /** Block registry ID for canvas insertion */
  blockId: string;
  /** One-line description shown in tooltip and search */
  description: string;
  /** Semantic search aliases (lowercase) */
  tags: string[];
  /**
   * If true, card is non-interactive with a "Coming Soon" tooltip.
   * Used when blockId has no matching registry entry yet.
   */
  disabled?: boolean;
}

export interface CatEntry {
  id: string;
  name: string;
  sub: string;
  iconHtml: string;
  elements: ElEntry[];
}

/** Flat element with its parent category info — computed once from catalog */
export type FlatElEntry = ElEntry & {
  catId: string;
  catName: string;
};

/** Grouped search result for a single category */
export interface SearchGroup {
  catId: string;
  catName: string;
  elements: FlatElEntry[];
}
