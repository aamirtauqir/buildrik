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
  // §14 — last single-click anchor for shift-range select.
  const [anchorKey, setAnchorKey] = useState<string | null>(null);

  const checkInUse = useCallback(
    (keys: string[]): number => {
      const elements = composer.elements as unknown as {
        findByMediaSrc?: (src: string) => unknown[];
      };
      if (typeof elements?.findByMediaSrc !== "function") return 0;
      return keys.filter((key) => {
        const asset = composer.media.getAsset(key);
        if (!asset) return false;
        /*
          Called ON the manager, not through a detached reference. The old code
          lifted the method out (`const findFn = composer.elements.findByMediaSrc`)
          and called it bare, so `this` was undefined and its first line —
          `this.elements.values()` — threw "Cannot read properties of undefined
          (reading 'elements')". That threw inside requestBulkDelete, so bulk
          Delete opened no confirm modal at all, and the in-use count that warns
          before deleting a referenced asset never ran.
        */
        return elements.findByMediaSrc!(asset.src).length > 0;
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
    setAnchorKey(key);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(libraryItems.map((i) => i.key)));
    /*
      Selecting has to ENTER selection mode, or nothing about it is visible:
      the cards only draw their checkbox in selMode and the bulk bar only
      mounts in selMode. Measured live in the fullpage manager — the toolbar's
      select-all filled `selectedKeys` and then rendered exactly nothing: no
      checks, no bulk bar, no count. Board 1163:4641 draws all three.
    */
    setSelMode(true);
  }, [libraryItems]);

  /**
   * §14 — Enter select mode + pre-select a single item. Used by
   * the right-click "Select" menu entry on an asset cell.
   */
  const enterSelectModeWith = useCallback((key: string) => {
    setSelMode(true);
    setSelectedKeys(new Set([key]));
    setAnchorKey(key);
  }, []);

  /**
   * §14 — Shift-click range select. If there's an existing anchor in
   * libraryItems, select every item between anchor and `key` inclusive
   * (display order). Otherwise treat as a single-item select + set anchor.
   * Turns on select mode if it wasn't on.
   */
  const shiftSelect = useCallback(
    (key: string) => {
      setSelMode(true);
      if (!anchorKey || anchorKey === key) {
        setSelectedKeys(new Set([key]));
        setAnchorKey(key);
        return;
      }
      const order = libraryItems.map((i) => i.key);
      const a = order.indexOf(anchorKey);
      const b = order.indexOf(key);
      if (a === -1 || b === -1) {
        setSelectedKeys(new Set([key]));
        setAnchorKey(key);
        return;
      }
      const [lo, hi] = a < b ? [a, b] : [b, a];
      setSelectedKeys(new Set(order.slice(lo, hi + 1)));
    },
    [anchorKey, libraryItems],
  );

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
    shiftSelect,
    enterSelectModeWith,
  };
}
