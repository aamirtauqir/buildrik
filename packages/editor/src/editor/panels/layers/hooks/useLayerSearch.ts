/**
 * useLayerSearch - Manages search state and tree filtering.
 *
 * Responsibilities:
 * - Track search query string
 * - Filter tree recursively (matching nodes + ancestors preserved)
 * - Provide ancestor IDs for matched nodes (used to auto-expand)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getAncestors, getDisplayName } from "../data/layerUtils";
import type { LayerItem } from "../types";

function itemMatches(item: LayerItem, customNames: Map<string, string>, q: string): boolean {
  const displayName = getDisplayName(item.id, item.type, customNames).toLowerCase();
  return (
    displayName.includes(q) ||
    item.type.toLowerCase().includes(q) ||
    item.tagName.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q)
  );
}

/** Pure module-level function — avoids stale closure from recursive useCallback */
function filterTreeItems(
  items: LayerItem[],
  customNames: Map<string, string>,
  q: string
): LayerItem[] {
  const next: LayerItem[] = [];
  for (const item of items) {
    const filteredChildren = filterTreeItems(item.children, customNames, q);
    if (itemMatches(item, customNames, q) || filteredChildren.length > 0) {
      next.push({ ...item, children: filteredChildren });
    }
  }
  return next;
}

function countMatchesIn(
  items: LayerItem[],
  customNames: Map<string, string>,
  q: string
): number {
  let count = 0;
  for (const item of items) {
    if (itemMatches(item, customNames, q)) count += 1;
    count += countMatchesIn(item.children, customNames, q);
  }
  return count;
}

export interface UseLayerSearchReturn {
  search: string;
  setSearch: (value: string) => void;
  filterTree: (items: LayerItem[], customNames: Map<string, string>) => LayerItem[];
  countMatches: (items: LayerItem[], customNames: Map<string, string>) => number;
  getAncestorIdsForMatches: (matches: LayerItem[], tree: LayerItem[]) => string[];
  hasResults: boolean;
  isSearching: boolean;
}

export function useLayerSearch(): UseLayerSearchReturn {
  const [search, setSearch] = React.useState("");

  const filterTree = React.useCallback(
    (items: LayerItem[], customNames: Map<string, string>): LayerItem[] => {
      if (!search.trim()) return items;
      return filterTreeItems(items, customNames, search.toLowerCase());
    },
    [search]
  );

  const countMatches = React.useCallback(
    (items: LayerItem[], customNames: Map<string, string>): number => {
      if (!search.trim()) return 0;
      return countMatchesIn(items, customNames, search.toLowerCase());
    },
    [search]
  );

  const getAncestorIdsForMatches = React.useCallback(
    (matches: LayerItem[], tree: LayerItem[]): string[] => {
      const ancestorIds = new Set<string>();
      for (const match of matches) {
        getAncestors(tree, match.id).forEach((a) => ancestorIds.add(a.id));
      }
      return Array.from(ancestorIds);
    },
    []
  );

  const isSearching = search.trim().length > 0;

  return {
    search,
    setSearch,
    filterTree,
    countMatches,
    getAncestorIdsForMatches,
    hasResults: true,
    isSearching,
  };
}
