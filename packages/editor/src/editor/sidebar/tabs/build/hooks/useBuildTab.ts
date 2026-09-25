/**
 * useBuildTab — all state and handlers for the Build Tab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { BlockData } from "../../../../../shared/types";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";
import { CATALOG, flatCatalog } from "../catalog/catalog";
import type { FlatElEntry } from "../catalog/types";
import { searchInsert, type InsertSearchHit } from "../utils/search";
import type { ComponentDefinition } from "@/shared/types/components";
import { blockRows, componentRows } from "../catalog/groups";
import { getBlockDefinitions } from "../../../../../blocks";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";
import { MAX_RECENT } from "@/shared/constants/ui";
import { EVENTS } from "@/shared/constants/events";
import { announceInsertDrag } from "@/editor/canvas/insertDrag";

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
export type BlockDragStartFn = (e: React.DragEvent, block: BlockDefinition) => void;

/** The one payload the canvas drop reads (`dropOperations.handleBlockDrop`
 *  → `getBlockById(id)`); an element row and a block card write the same. */
const NO_SAVED: ComponentDefinition[] = [];

function setBlockPayload(e: React.DragEvent, payload: { id: string; label: string; category?: string }) {
  e.dataTransfer.setData("block", JSON.stringify(payload));
  e.dataTransfer.setData("text/plain", payload.id);
  e.dataTransfer.effectAllowed = "copy";
}
export type ElClickFn = (el: FlatElEntry) => void;
export type ToggleFavFn = (name: string) => void;

export interface UseBuildTabReturn {
  // State
  favs: Set<string>;
  /** Recently inserted element names, newest first (G2-115). */
  recents: string[];
  openCats: Set<string>;
  searchQuery: string;
  favOpen: boolean;
  searchResults: InsertSearchHit[];
  allElements: FlatElEntry[];
  composer: Composer | null;
  // Handlers
  setSearchQuery: (q: string) => void;
  toggleFav: ToggleFavFn;
  toggleCat: (catId: string) => void;
  setFavOpen: (open: boolean) => void;
  clearFavs: () => void;
  restoreFavs: (snapshot: Set<string>) => void;
  favsInformed: boolean;
  markFavsInformed: () => void;
  handleDragStart: DragStartFn;
  /** Board 4428:140817's `grip/⠿ drag to place` — a block card is a drag source too. */
  handleBlockDragStart: BlockDragStartFn;
  handleElClick: ElClickFn;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBuildTab(
  composer: Composer | null,
  onBlockClick?: (data: BlockData) => void,
  saved: ComponentDefinition[] = NO_SAVED
): UseBuildTabReturn {
  const [favs, setFavs] = React.useState<Set<string>>(() =>
    ls.getSet(STORAGE_KEYS.BUILD_FAVORITES)
  );
  const [openCats, setOpenCats] = React.useState<Set<string>>(() => {
    const stored = ls.sessionGetSet(STORAGE_KEYS.BUILD_OPEN_CATS);
    // Exclusive-accordion invariant: at most one category open at a time.
    // Legacy sessions may have persisted multiple open categories from an
    // earlier version; collapse to just "basic" to restore the invariant.
    // First-session default is also "basic" only.
    if (stored.size !== 1) {
      return new Set(["basic"]);
    }
    return stored;
  });
  const [searchQuery, setSearchQueryRaw] = React.useState("");
  // Track which categories were open before a search started
  const preClearCatsRef = React.useRef<Set<string> | null>(null);
  const [favsInformed, setFavsInformed] = React.useState<boolean>(() =>
    ls.getBool(STORAGE_KEYS.BUILD_FAVS_INFORMED)
  );
  const [favOpen, setFavOpen] = React.useState(false);
  const [recents, setRecents] = React.useState<string[]>(() => [...ls.getSet(STORAGE_KEYS.BUILD_RECENT)]);
  const noteRecent = React.useCallback((name: string) => {
    setRecents((prev) => {
      const next = [name, ...prev.filter((n) => n !== name)].slice(0, MAX_RECENT);
      ls.saveSet(STORAGE_KEYS.BUILD_RECENT, new Set(next));
      return next;
    });
  }, []);

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
      // Exclusive accordion: clicking the already-open category is a no-op
      // (can't collapse the active one via its own chevron). Clicking a
      // closed category opens it and closes whichever was previously open.
      if (prev.has(catId)) return prev;
      return new Set([catId]);
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

  /* Board 4418:100890: the held row is announced for the canvas cue, the
     footer readout and the drawer note; dragend (drop or Esc) ends it. */
  const announceDrag = React.useCallback(
    (label: string) => {
      if (!composer) return;
      announceInsertDrag(composer, label);
      window.addEventListener("dragend", () => announceInsertDrag(composer, null), { once: true });
    },
    [composer],
  );

  const handleDragStart: DragStartFn = React.useCallback((e, el) => {
    setBlockPayload(e, { id: el.blockId, label: el.name, category: el.catId });
    noteRecent(el.name);
    announceDrag(el.name);
  }, [noteRecent, announceDrag]);

  const handleBlockDragStart: BlockDragStartFn = React.useCallback((e, block) => {
    setBlockPayload(e, { id: block.id, label: block.label, category: block.category });
    announceDrag(block.label);
  }, [announceDrag]);

  const handleElClick: ElClickFn = React.useCallback(
    (el) => {
      // Dev-mode validation: warn if catalog blockId has no registry entry
      if (IS_DEV_BUILD) {
        const def = getBlockDefinitions().find((b) => b.id === el.blockId);
        if (!def) {
          console.warn(`[useBuildTab] blockId "${el.blockId}" (${el.name}) has no registry entry. Catalog may be out of sync with blockRegistry.`);
        }
      }
      onBlockClick?.({ id: el.blockId, label: el.name, category: el.catId });
      noteRecent(el.name);
    },
    [onBlockClick, noteRecent]
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

  // Board 138:53: search is flat and cross-source — elements, blocks AND
  // components (the board's third tag).
  const searchResults = React.useMemo(
    () => searchInsert(searchQuery, flatCatalog, blockRows, componentRows, saved),
    [searchQuery, saved]
  );

  return {
    favs,
    recents,
    openCats,
    searchQuery,
    favOpen,
    searchResults,
    allElements: flatCatalog,
    composer,
    setSearchQuery,
    toggleFav,
    toggleCat,
    setFavOpen,
    clearFavs,
    restoreFavs,
    favsInformed,
    markFavsInformed,
    handleDragStart,
    handleBlockDragStart,
    handleElClick,
  };
}
