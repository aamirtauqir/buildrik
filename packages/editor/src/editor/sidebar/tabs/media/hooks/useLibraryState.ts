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
import type { LibraryItem, LibraryStateResult, MediaTypeFilter } from "../data/mediaTypes";
import {
  countByType,
  filterByFmt,
  filterBySearch,
  filterByType,
  toLibraryItem,
} from "../data/mediaUtils";

export function useLibraryState(composer: Composer): LibraryStateResult {
  const [rawAssets, setRawAssets] = useState(() => composer.media.getAssets());
  const [folders, setFolders] = useState(() => composer.media.getFolders());
  const [allFolders, setAllFolders] = useState(() => composer.media.getAllFolders());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
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
    const reloadFolders = () => {
      setFolders([...composer.media.getFolders()]);
      setAllFolders([...composer.media.getAllFolders()]);
    };

    reload();
    reloadFolders();

    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_UPDATED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, reload);
    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, reload);

    composer.media.on(MEDIA_EVENTS.FOLDER_CREATED, reloadFolders);
    composer.media.on(MEDIA_EVENTS.FOLDER_DELETED, reloadFolders);

    return () => {
      composer.media.off(MEDIA_EVENTS.MEDIA_ADDED, reload);
      composer.media.off(MEDIA_EVENTS.MEDIA_UPDATED, reload);
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, reload);
      composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, reload);

      composer.media.off(MEDIA_EVENTS.FOLDER_CREATED, reloadFolders);
      composer.media.off(MEDIA_EVENTS.FOLDER_DELETED, reloadFolders);
    };
  }, [composer]);

  const allLibraryItems = useMemo(() => rawAssets.map(toLibraryItem), [rawAssets]);

  // Folder lookup map — avoids O(n*m) `rawAssets.find` per item per render.
  // Keyed by asset id, value is folderId or null for root.
  const folderByAssetId = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const a of rawAssets) m.set(a.id, a.folderId || null);
    return m;
  }, [rawAssets]);

  const libraryItems = useMemo(() => {
    const d = sortDir === "asc" ? 1 : -1;

    // Filter by folder first — O(n) lookup via Map (was O(n*m) via .find)
    const inFolder = allLibraryItems.filter(
      (i) => folderByAssetId.get(i.key) === currentFolderId,
    );

    const byType = filterByType(inFolder, activeType);
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
  }, [
    allLibraryItems,
    folderByAssetId,
    currentFolderId,
    activeType,
    fmtFilter,
    librarySearch,
    sort,
    sortDir,
  ]);

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

  const createFolder = useCallback(async (name: string) => {
    await composer.media.createFolder(name, currentFolderId);
  }, [composer, currentFolderId]);

  /**
   * Inspect a folder before deleting. Returns counts so the caller (component
   * layer) can prompt the user via a real dialog, then call `deleteFolder`
   * with `force: true` to commit the deletion.
   *
   * Pure read — no side effects, safe to call in render.
   */
  const inspectFolder = useCallback(
    (id: string): { assetCount: number; subFolderCount: number } => {
      const assetsInFolder = composer.media.getAssets({ folderId: id });
      const subFolders = composer.media.getFolders(id);
      return { assetCount: assetsInFolder.length, subFolderCount: subFolders.length };
    },
    [composer],
  );

  /**
   * Delete a folder. If the folder is non-empty and `force` is not true, the
   * call is rejected — caller should call `inspectFolder` first, prompt the
   * user with their preferred dialog, and re-call with `force: true` on confirm.
   * This keeps UI dialog logic out of the hook (testable, SSR-safe).
   */
  const deleteFolder = useCallback(
    async (id: string, opts: { force?: boolean } = {}) => {
      if (!opts.force) {
        const { assetCount, subFolderCount } = inspectFolder(id);
        if (assetCount > 0 || subFolderCount > 0) {
          throw new Error(
            "FOLDER_NOT_EMPTY: call inspectFolder first, prompt the user, retry with force:true",
          );
        }
      }
      await composer.media.deleteFolder(id);
    },
    [composer, inspectFolder],
  );

  const moveAsset = useCallback(async (assetId: string, folderId: string | null) => {
    await composer.media.updateAsset(assetId, { folderId: folderId ?? undefined });
  }, [composer]);

  const bulkMoveAssets = useCallback(async (assetIds: string[], folderId: string | null) => {
    await Promise.all(
      assetIds.map((id) =>
        composer.media.updateAsset(id, { folderId: folderId ?? undefined })
      )
    );
  }, [composer]);

  const renameItem = useCallback(
    async (key: string, name: string) => {
      await composer.media.updateAsset(key, { name });
    },
    [composer]
  );

  const updateItem = useCallback(
    async (key: string, updates: Partial<LibraryItem>) => {
      const assetUpdates: any = {};
      if (updates.name) assetUpdates.name = updates.name;
      if (updates.altText !== undefined) assetUpdates.altText = updates.altText;
      await composer.media.updateAsset(key, assetUpdates);
    },
    [composer]
  );

  return {
    rawAssets,
    libraryItems,
    folders,
    allFolders,
    currentFolderId,
    setCurrentFolderId,
    createFolder,
    inspectFolder,
    deleteFolder,
    moveAsset,
    bulkMoveAssets,
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
    updateItem,
  };
}
