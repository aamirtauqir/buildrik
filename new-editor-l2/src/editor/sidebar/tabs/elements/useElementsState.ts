/**
 * useElementsState - All state, effects, and computed values for ElementsTab
 * Extracted from ElementsTab.tsx to keep the main component under 500 lines.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getBlockDefinitions, getBlockById } from "../../../../blocks/blockRegistry";
import type { BlockData } from "../../../../shared/types";
import { useToast } from "../../../../shared/ui/Toast";
import { trackSidebar } from "../../../../shared/utils/sidebarAnalytics";
import {
  RECENT_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  TIP_DISMISSED_KEY,
  EXPANDED_CATEGORY_KEY,
  MAX_RECENT,
  MOST_USED_IDS,
  NEW_CATEGORY_ORDER,
  CATEGORY_REMAP,
} from "./constants";
import type { ElementsTabProps } from "./types";

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseElementsStateReturn {
  expandedCategory: string;
  recentIds: string[];
  favorites: string[];
  showTip: boolean;
  showRecentsOverlay: boolean;
  showFavoritesOverlay: boolean;
  setShowRecentsOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFavoritesOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  toggleFavorite: (id: string, e?: React.MouseEvent) => void;
  isFavorite: (id: string) => boolean;
  dismissTip: () => void;
  toggleCategory: (cat: string) => void;
  handleClick: (block: BlockData) => void;
  handleDragStart: (e: React.DragEvent, block: BlockData, isCard?: boolean) => void;
  recentBlocks: BlockData[];
  favoriteBlocks: BlockData[];
  sortedCategories: string[];
  filtered: Record<string, BlockData[]>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useElementsState({
  searchQuery,
  categoryFilter,
  onBlockClick,
}: Pick<
  ElementsTabProps,
  "searchQuery" | "categoryFilter" | "onBlockClick"
>): UseElementsStateReturn {
  const { addToast } = useToast();
  const blocks = React.useMemo(() => getBlockDefinitions(), []);

  const [expandedCategory, setExpandedCategory] = React.useState<string>(() => {
    try {
      return localStorage.getItem(EXPANDED_CATEGORY_KEY) || "Most Used";
    } catch {
      return "Most Used";
    }
  });
  const [recentIds, setRecentIds] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [favorites, setFavorites] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [showTip, setShowTip] = React.useState(() => !localStorage.getItem(TIP_DISMISSED_KEY));
  const [showRecentsOverlay, setShowRecentsOverlay] = React.useState(false);
  const [showFavoritesOverlay, setShowFavoritesOverlay] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentIds));
  }, [recentIds]);
  React.useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);
  React.useEffect(() => {
    localStorage.setItem(EXPANDED_CATEGORY_KEY, expandedCategory);
  }, [expandedCategory]);

  const addRecent = React.useCallback((id: string) => {
    setRecentIds((prev) => [id, ...prev.filter((i) => i !== id)].slice(0, MAX_RECENT));
  }, []);

  const toggleFavorite = React.useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const isFavorite = React.useCallback((id: string) => favorites.includes(id), [favorites]);

  const dismissTip = React.useCallback(() => {
    setShowTip(false);
    localStorage.setItem(TIP_DISMISSED_KEY, "true");
  }, []);

  const categories = React.useMemo(() => {
    const cats: Record<string, BlockData[]> = { "Most Used": [] };
    blocks.forEach((b) => {
      if (MOST_USED_IDS.includes(b.id)) cats["Most Used"].push(b as BlockData);
      const newCat = CATEGORY_REMAP[b.category || "Other"] || "Advanced";
      if (!cats[newCat]) cats[newCat] = [];
      cats[newCat].push(b as BlockData);
    });
    return cats;
  }, [blocks]);

  const filtered = React.useMemo(() => {
    if (!searchQuery) return categories;
    const q = searchQuery.toLowerCase();
    const result: Record<string, BlockData[]> = {};
    Object.entries(categories).forEach(([cat, list]) => {
      const matches = list.filter(
        (b) => b.label.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
      );
      if (matches.length) result[cat] = matches;
    });
    return result;
  }, [categories, searchQuery]);

  const recentBlocks = React.useMemo(
    () =>
      recentIds
        .map((id) => getBlockById(id))
        .filter((b): b is NonNullable<typeof b> => !!b) as BlockData[],
    [recentIds]
  );

  const favoriteBlocks = React.useMemo(
    () =>
      favorites
        .map((id) => getBlockById(id))
        .filter((b): b is NonNullable<typeof b> => !!b) as BlockData[],
    [favorites]
  );

  const handleClick = React.useCallback(
    (block: BlockData) => {
      trackSidebar("element_insert", {
        element_type: block.id,
        label: block.label,
        source: "click",
      });
      addToast({ message: `Added ${block.label} to canvas`, variant: "success", duration: 2000 });
      addRecent(block.id);
      onBlockClick?.(block);
    },
    [addRecent, onBlockClick, addToast]
  );

  const handleDragStart = (e: React.DragEvent, block: BlockData, isCard = false) => {
    addRecent(block.id);
    const def = getBlockById(block.id);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "block",
      JSON.stringify({ ...block, elementType: def?.elementType || "container" })
    );
    e.dataTransfer.setData("text/plain", block.id);
    if (isCard) {
      const target = e.currentTarget as HTMLElement;
      const ghost = target.cloneNode(true) as HTMLElement;
      ghost.classList.add("aqb-drag-ghost");
      ghost.style.cssText = "position:absolute;top:-1000px;";
      ghost.style.width = `${target.offsetWidth}px`;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 40, 40);
      requestAnimationFrame(() => ghost.remove());
    }
  };

  const toggleCategory = (cat: string) => setExpandedCategory((prev) => (prev === cat ? "" : cat));

  const categoryFilters = categoryFilter ? categoryFilter.split(",").map((c) => c.trim()) : [];
  const sortedCategories = Object.keys(filtered)
    .filter((cat) => categoryFilters.length === 0 || categoryFilters.includes(cat))
    .sort((a, b) => NEW_CATEGORY_ORDER.indexOf(a) - NEW_CATEGORY_ORDER.indexOf(b));

  return {
    expandedCategory,
    recentIds,
    favorites,
    showTip,
    showRecentsOverlay,
    showFavoritesOverlay,
    setShowRecentsOverlay,
    setShowFavoritesOverlay,
    toggleFavorite,
    isFavorite,
    dismissTip,
    toggleCategory,
    handleClick,
    handleDragStart,
    recentBlocks,
    favoriteBlocks,
    sortedCategories,
    filtered,
  };
}
