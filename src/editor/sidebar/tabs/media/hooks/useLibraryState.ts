/**
 * Media Tab — Library State Hook
 * Single responsibility: rawAssets, sort, filter, librarySearch, counts.
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { MEDIA_EVENTS } from "../../../../../shared/constants/media";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";
import type { MediaSortBy, SortDirection } from "../../../../../shared/types/media";
import type { LibraryStateResult, MediaTypeFilter } from "../data/mediaTypes";
import {
  countByType,
  filterByFmt,
  filterBySearch,
  filterByType,
  toLibraryItem,
} from "../data/mediaUtils";

export function useLibraryState(composer: Composer): LibraryStateResult {
  const [rawAssets, setRawAssets] = useState(() => composer.media.getAssets());
  const [sort, setSort_] = useState<MediaSortBy>(
    () => (localStorage.getItem(STORAGE_KEYS.MEDIA_SORT) as MediaSortBy | null) ?? "date"
  );
  const [sortDir, setSortDir_] = useState<SortDirection>(
    () => (localStorage.getItem(STORAGE_KEYS.MEDIA_SORT_DIR) as SortDirection | null) ?? "desc"
  );
  const [gridN, setGridN_] = useState<2 | 3 | 4>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.MEDIA_GRID_N);
    return v === "2" ? 2 : v === "4" ? 4 : 3;
  });
  const [activeType, setActiveType_] = useState<MediaTypeFilter>(
    () => (localStorage.getItem(STORAGE_KEYS.MEDIA_ACTIVE_TYPE) as MediaTypeFilter | null) ?? "all"
  );
  const [fmtFilter, setFmtFilter_] = useState("");
  const [librarySearch, setLibrarySearch_] = useState("");

  // Subscribe to engine events
  useEffect(() => {
    const reload = () => setRawAssets([...composer.media.getAssets()]);
    reload();
    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_UPDATED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, reload);
    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, reload);
    return () => {
      composer.media.off(MEDIA_EVENTS.MEDIA_ADDED, reload);
      composer.media.off(MEDIA_EVENTS.MEDIA_UPDATED, reload);
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, reload);
      composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, reload);
    };
  }, [composer]);

  const allLibraryItems = useMemo(() => rawAssets.map(toLibraryItem), [rawAssets]);

  const libraryItems = useMemo(() => {
    const d = sortDir === "asc" ? 1 : -1;
    const byType = filterByType(allLibraryItems, activeType);
    const byFmt = filterByFmt(byType, fmtFilter);
    const bySearch = filterBySearch(byFmt, librarySearch);
    return [...bySearch].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name) * d;
        case "date":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * d;
        case "size":
          return (a.size - b.size) * d;
        case "type":
          return a.type.localeCompare(b.type) * d;
        default:
          return 0;
      }
    });
  }, [allLibraryItems, activeType, fmtFilter, librarySearch, sort, sortDir]);

  // Counts from ALL items (for pills when no filter active)
  const totalCounts = useMemo(() => countByType(allLibraryItems), [allLibraryItems]);
  // Counts from filtered items (for pills when search/format filter is active)
  const filteredCounts = useMemo(() => countByType(libraryItems), [libraryItems]);
  // Use filtered counts when search or format filter is active
  const counts = useMemo(
    () => (librarySearch || fmtFilter ? filteredCounts : totalCounts),
    [librarySearch, fmtFilter, filteredCounts, totalCounts]
  );
  const setSort = useCallback((by: MediaSortBy, dir: SortDirection) => {
    setSort_(by);
    setSortDir_(dir);
    localStorage.setItem(STORAGE_KEYS.MEDIA_SORT, by);
    localStorage.setItem(STORAGE_KEYS.MEDIA_SORT_DIR, dir);
  }, []);

  const setGridN = useCallback((n: 2 | 3 | 4) => {
    setGridN_(n);
    localStorage.setItem(STORAGE_KEYS.MEDIA_GRID_N, String(n));
  }, []);

  const setFmtFilter = useCallback((f: string) => setFmtFilter_(f), []);

  const setActiveType = useCallback((t: MediaTypeFilter) => {
    setActiveType_(t);
    setFmtFilter_("");
    localStorage.setItem(STORAGE_KEYS.MEDIA_ACTIVE_TYPE, t);
  }, []);

  const setLibrarySearch = useCallback((q: string) => setLibrarySearch_(q), []);

  const renameItem = useCallback(
    async (key: string, name: string) => {
      await composer.media.updateAsset(key, { name });
    },
    [composer]
  );

  return {
    rawAssets,
    libraryItems,
    counts,
    sort,
    sortDir,
    gridN,
    fmtFilter,
    activeType,
    librarySearch,
    setLibrarySearch,
    setSort,
    setGridN,
    setFmtFilter,
    setActiveType,
    renameItem,
  };
}
