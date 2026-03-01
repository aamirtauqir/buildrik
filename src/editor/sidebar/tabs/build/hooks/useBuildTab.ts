/**
 * useBuildTab — all state and handlers for the Build Tab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { BlockData } from "../../../../../shared/types";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";
import { flatCatalog } from "../catalog/catalog";
import { TIPS } from "../catalog/tips";
import type { FlatElEntry, SearchGroup } from "../catalog/types";
import { searchElements } from "../utils/search";

// ─── Storage helpers ─────────────────────────────────────────────────────────

const ls = {
  getSet(key: string): Set<string> {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
    } catch {
      return new Set<string>();
    }
  },
  saveSet(key: string, value: Set<string>): void {
    try {
      localStorage.setItem(key, JSON.stringify([...value]));
    } catch {
      // storage may be full
    }
  },
  getBool(key: string): boolean {
    return localStorage.getItem(key) === "true";
  },
  saveBool(key: string, value: boolean): void {
    try {
      localStorage.setItem(key, value ? "true" : "false");
    } catch {
      // storage may be full
    }
  },
  sessionGetSet(key: string): Set<string> {
    try {
      return new Set<string>(JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[]);
    } catch {
      return new Set<string>();
    }
  },
  sessionSaveSet(key: string, value: Set<string>): void {
    try {
      sessionStorage.setItem(key, JSON.stringify([...value]));
    } catch {
      // storage may be full
    }
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type DragStartFn = (e: React.DragEvent, el: FlatElEntry) => void;
export type ElClickFn = (el: FlatElEntry) => void;
export type ToggleFavFn = (name: string) => void;

export interface UseBuildTabReturn {
  // State
  favs: Set<string>;
  openCats: Set<string>;
  searchQuery: string;
  tipDismissed: boolean;
  myCompOpen: boolean;
  favOpen: boolean;
  searchResults: SearchGroup[];
  allElements: FlatElEntry[];
  composer: Composer | null;
  tipIdx: number;
  // Handlers
  setSearchQuery: (q: string) => void;
  toggleFav: ToggleFavFn;
  toggleCat: (catId: string) => void;
  setMyCompOpen: (open: boolean) => void;
  setFavOpen: (open: boolean) => void;
  clearFavs: () => void;
  restoreFavs: (snapshot: Set<string>) => void;
  favsInformed: boolean;
  markFavsInformed: () => void;
  dismissTip: () => void;
  tipPrev: () => void;
  tipNext: () => void;
  tipSetAt: (i: number) => void;
  handleDragStart: DragStartFn;
  handleElClick: ElClickFn;
  /** Describes where the next clicked element will be inserted */
  insertionContext: { type: string; label: string } | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBuildTab(
  composer: Composer | null,
  onBlockClick?: (data: BlockData) => void
): UseBuildTabReturn {
  const [favs, setFavs] = React.useState<Set<string>>(() =>
    ls.getSet(STORAGE_KEYS.BUILD_FAVORITES)
  );
  const [openCats, setOpenCats] = React.useState<Set<string>>(() =>
    ls.sessionGetSet(STORAGE_KEYS.BUILD_OPEN_CATS)
  );
  const [searchQuery, setSearchQueryRaw] = React.useState("");
  // Track which categories were open before a search started
  const preClearCatsRef = React.useRef<Set<string> | null>(null);
  const [tipDismissed, setTipDismissed] = React.useState<boolean>(() =>
    ls.getBool(STORAGE_KEYS.BUILD_TIP_DISMISSED)
  );
  const [favsInformed, setFavsInformed] = React.useState<boolean>(() =>
    ls.getBool(STORAGE_KEYS.BUILD_FAVS_INFORMED)
  );
  const [myCompOpen, setMyCompOpen] = React.useState(false);
  const [favOpen, setFavOpen] = React.useState(false);
  const [tipIdx, setTipIdx] = React.useState(0);

  // Persist favs
  React.useEffect(() => {
    ls.saveSet(STORAGE_KEYS.BUILD_FAVORITES, favs);
  }, [favs]);

  // Persist openCats to sessionStorage
  React.useEffect(() => {
    ls.sessionSaveSet(STORAGE_KEYS.BUILD_OPEN_CATS, openCats);
  }, [openCats]);

  const toggleFav = React.useCallback((name: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const toggleCat = React.useCallback((catId: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const clearFavs = React.useCallback(() => setFavs(new Set<string>()), []);

  const restoreFavs = React.useCallback((snapshot: Set<string>) => {
    setFavs(new Set(snapshot));
  }, []);

  const markFavsInformed = React.useCallback(() => {
    setFavsInformed(true);
    ls.saveBool(STORAGE_KEYS.BUILD_FAVS_INFORMED, true);
  }, []);

  const dismissTip = React.useCallback(() => {
    setTipDismissed(true);
    ls.saveBool(STORAGE_KEYS.BUILD_TIP_DISMISSED, true);
  }, []);

  const tipPrev = React.useCallback(() => {
    setTipIdx((prev) => (prev - 1 + TIPS.length) % TIPS.length);
  }, []);

  const tipNext = React.useCallback(() => {
    setTipIdx((prev) => (prev + 1) % TIPS.length);
  }, []);

  const tipSetAt = React.useCallback((i: number) => {
    setTipIdx(i);
  }, []);

  const handleDragStart: DragStartFn = React.useCallback((e, el) => {
    e.dataTransfer.setData(
      "block",
      JSON.stringify({ id: el.blockId, label: el.name, category: el.catId })
    );
    e.dataTransfer.setData("text/plain", el.blockId);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleElClick: ElClickFn = React.useCallback(
    (el) => {
      onBlockClick?.({ id: el.blockId, label: el.name, category: el.catId });
    },
    [onBlockClick]
  );

  const setSearchQuery = React.useCallback(
    (q: string) => {
      const trimmed = q.trim();
      const prevTrimmed = searchQuery.trim();

      // Entering search: capture current open cats
      if (prevTrimmed.length === 0 && trimmed.length > 0) {
        preClearCatsRef.current = new Set(openCats);
      }

      // Leaving search (clearing): restore cats
      if (prevTrimmed.length > 0 && trimmed.length === 0) {
        if (preClearCatsRef.current !== null) {
          setOpenCats(preClearCatsRef.current);
          preClearCatsRef.current = null;
        }
      }

      setSearchQueryRaw(q);
    },
    [searchQuery, openCats]
  );

  const searchResults = React.useMemo(
    () => searchElements(searchQuery, flatCatalog),
    [searchQuery]
  );

  const insertionContext = React.useMemo((): { type: string; label: string } | null => {
    if (!composer) return null;
    const selectedIds = composer.selection.getSelectedIds();
    if (selectedIds.length !== 1) return null;
    const el = composer.elements.getElement(selectedIds[0]);
    if (!el) return null;
    const type = el.getType();
    // Capitalize first letter for display
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    return { type, label };
  }, [composer]);

  return {
    favs,
    openCats,
    searchQuery,
    tipDismissed,
    myCompOpen,
    favOpen,
    tipIdx,
    searchResults,
    allElements: flatCatalog,
    composer,
    setSearchQuery,
    toggleFav,
    toggleCat,
    setMyCompOpen,
    setFavOpen,
    clearFavs,
    restoreFavs,
    favsInformed,
    markFavsInformed,
    dismissTip,
    tipPrev,
    tipNext,
    tipSetAt,
    handleDragStart,
    handleElClick,
    insertionContext,
  };
}
