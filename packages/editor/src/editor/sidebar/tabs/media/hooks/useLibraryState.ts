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
import type { LibraryItem, LibraryStateResult, MediaBucket, MediaTypeFilter } from "../data/mediaTypes";
import {
  countByType,
  filterByFmt,
  filterBySearch,
  filterByType,
  toLibraryItem,
} from "../data/mediaUtils";

export function useLibraryState(composer: Composer): LibraryStateResult {
  const [rawAssets, setRawAssets] = useState(() => composer.media.getAssets());
  /**
   * "Unknown", not "empty". `MediaManager.init()` reads storage asynchronously,
   * so an empty `getAssets()` before it resolves means nothing — and the board
   * draws the two as different screens (`777:4093` skeletons vs `145:359` "Your
   * library is empty"). Seeded from the manager so a tab mounted after init
   * never flashes a skeleton it has no reason to show.
   */
  const [libraryLoading, setLibraryLoading] = useState(() => !composer.media.isInitialized);
  const [libraryError, setLibraryError] = useState<string | null>(() => composer.media.initFailure);
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
  // Board 145:2 caption: "Type pills are a multi-select filter" — the Set is
  // the SSOT; empty = everything. The old single-value key migrates once.
  const [activeTypes, setActiveTypes_] = useState<ReadonlySet<MediaBucket>>(() => {
    const csv = localStorage.getItem(STORAGE_KEYS.MEDIA_ACTIVE_TYPES);
    if (csv != null) return new Set(csv.split(",").filter(Boolean) as MediaBucket[]);
    const old = localStorage.getItem(STORAGE_KEYS.MEDIA_ACTIVE_TYPE) as MediaTypeFilter | null;
    return old && old !== "all" ? new Set([old]) : new Set();
  });
  /** Single-type view for the fullpage manager's per-type sections. */
  const activeType: MediaTypeFilter = activeTypes.size === 1 ? [...activeTypes][0] : "all";
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

    const onInitialized = () => {
      reload();
      reloadFolders();
      setLibraryError(null);
      setLibraryLoading(false);
    };
    const onInitFailed = (payload: unknown) => {
      const message = (payload as { error?: string } | undefined)?.error;
      setLibraryError(message ?? "Could not read local media storage");
      setLibraryLoading(false);
    };

    composer.media.on(MEDIA_EVENTS.INITIALIZED, onInitialized);
    composer.media.on(MEDIA_EVENTS.INIT_FAILED, onInitFailed);
    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_UPDATED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, reload);
    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, reload);

    composer.media.on(MEDIA_EVENTS.FOLDER_CREATED, reloadFolders);
    composer.media.on(MEDIA_EVENTS.FOLDER_DELETED, reloadFolders);

    return () => {
      composer.media.off(MEDIA_EVENTS.INITIALIZED, onInitialized);
      composer.media.off(MEDIA_EVENTS.INIT_FAILED, onInitFailed);
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

    const byType = activeTypes.size
      ? inFolder.filter((i) => activeTypes.has(i.type as MediaBucket))
      : inFolder;
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
    activeTypes,
    fmtFilter,
    librarySearch,
    sort,
    sortDir,
  ]);

  /*
    Pills carry the LIBRARY's totals, in every state. Boards 145:2 (a type
    filter on), 145:49 (a folder scoped) and 782:4353 (a search matching
    nothing) all draw the same `image 128 · video 6 · svg 24 · icon 370`.

    They used to switch to counts-of-the-filtered-list whenever a search or
    format filter was active, so searching for something absent zeroed every
    pill — the row that tells you what you own reported that you own nothing.
    It also left the drawer with no truthful "is the library empty" signal,
    which is what made a fruitless search render the empty-library screen.
  */
  const counts = useMemo(() => countByType(allLibraryItems), [allLibraryItems]);
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

  const persistTypes = (s: ReadonlySet<MediaBucket>) =>
    localStorage.setItem(STORAGE_KEYS.MEDIA_ACTIVE_TYPES, [...s].join(","));

  const setActiveType = useCallback((t: MediaTypeFilter) => {
    const next: Set<MediaBucket> = t === "all" ? new Set() : new Set([t]);
    setActiveTypes_(next);
    setFmtFilter_("");
    persistTypes(next);
  }, []);

  const toggleType = useCallback((t: MediaBucket) => {
    setActiveTypes_((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      persistTypes(next);
      return next;
    });
    setFmtFilter_("");
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

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      await composer.media.renameFolder(id, name);
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

  const retryLibraryLoad = useCallback(() => {
    setLibraryError(null);
    setLibraryLoading(true);
    void composer.media.retryInit();
  }, [composer]);

  return {
    rawAssets,
    libraryLoading,
    libraryError,
    retryLibraryLoad,
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
    activeTypes,
    librarySearch,
    setLibrarySearch,
    setSort,
    setGridN,
    setFmtFilter,
    setActiveType,
    toggleType,
    renameItem,
    renameFolder,
    updateItem,
  };
}
