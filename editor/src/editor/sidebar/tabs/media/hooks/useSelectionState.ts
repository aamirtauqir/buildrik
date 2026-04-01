/**
 * Media Tab — Selection State Hook
 * Single responsibility: selMode, selectedKeys, confirmDelete.
 * @license BSD-3-Clause
 */

import { useCallback, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import type { ConfirmDeletePayload, LibraryItem, SelectionStateResult } from "../data/mediaTypes";

type ShowToast = (msg: string, type: "success" | "error" | "info") => void;

export function useSelectionState(
  composer: Composer,
  libraryItems: LibraryItem[],
  showToast: ShowToast
): SelectionStateResult {
  const [selMode, setSelMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeletePayload | null>(null);

  const checkInUse = useCallback(
    (keys: string[]): number => {
      if (typeof (composer.elements as { findByMediaSrc?: unknown })?.findByMediaSrc !== "function")
        return 0;
      const findFn = (
        composer.elements as unknown as { findByMediaSrc: (src: string) => unknown[] }
      ).findByMediaSrc;
      return keys.filter((key) => {
        const asset = composer.media.getAsset(key);
        if (!asset) return false;
        return findFn(asset.src).length > 0;
      }).length;
    },
    [composer]
  );

  const toggleSelMode = useCallback(() => {
    setSelMode((v) => {
      if (v) setSelectedKeys(new Set());
      return !v;
    });
  }, []);

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback((allKeys: string[]) => {
    setSelectedKeys(new Set(allKeys));
  }, []);

  const requestDelete = useCallback(
    (key: string) => {
      const item = libraryItems.find((i) => i.key === key);
      if (!item) return;
      const inUseCount = checkInUse([key]);
      setConfirmDelete({ keys: [key], names: [item.name], inUseCount, isBulk: false });
    },
    [libraryItems, checkInUse]
  );

  const requestBulkDelete = useCallback(
    (items: LibraryItem[]) => {
      const keys = items.map((i) => i.key);
      const names = items.map((i) => i.name);
      const inUseCount = checkInUse(keys);
      setConfirmDelete({ keys, names, inUseCount, isBulk: true });
    },
    [checkInUse]
  );

  const executeDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const { keys } = confirmDelete;
    for (const key of keys) {
      try {
        await composer.media.deleteAsset(key);
      } catch {
        const item = libraryItems.find((i) => i.key === key);
        showToast(`Could not delete "${item?.name ?? key}"`, "error");
      }
    }
    setConfirmDelete(null);
    setSelectedKeys(new Set());
    if (keys.length > 1) setSelMode(false);
  }, [composer, confirmDelete, libraryItems, showToast]);

  const cancelDelete = useCallback(() => setConfirmDelete(null), []);

  return {
    selMode,
    selectedKeys,
    confirmDelete,
    toggleSelMode,
    toggleSelect,
    selectAll,
    requestDelete,
    requestBulkDelete,
    executeDelete,
    cancelDelete,
  };
}
