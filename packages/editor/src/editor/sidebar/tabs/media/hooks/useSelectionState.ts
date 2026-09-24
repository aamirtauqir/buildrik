/**
 * Media Tab — Selection State Hook
 * Single responsibility: selMode, selectedKeys, confirmDelete.
 * @license BSD-3-Clause
 */

import { useCallback, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import type { AssetUsage, ConfirmDeletePayload, LibraryItem, SelectionStateResult } from "../data/mediaTypes";

type ShowToast = (
  msg: string,
  type: "success" | "error" | "info" | "warning",
  opts?: { action?: { label: string; onClick: () => void }; duration?: number },
) => void;

export function useSelectionState(
  composer: Composer,
  libraryItems: LibraryItem[],
  showToast: ShowToast,
  /** A file's family — the original and its saved versions (Clone 3695:45529),
   *  as `useLibraryState.versionsOf`. Delete takes the whole family and warns
   *  for every member's placements; absent, a key is its own family. */
  versionsOf: (key: string) => LibraryItem[] = () => [],
): SelectionStateResult {
  const [selMode, setSelMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeletePayload | null>(null);
  // §14 — last single-click anchor for shift-range select.
  const [anchorKey, setAnchorKey] = useState<string | null>(null);

  /* Returns WHICH assets break and where, not just how many. The elements were
     already being found and thrown away for a count — the modal could not name
     a single one, so a user with nine usages had a warning they could not act
     on. */
  const checkInUse = useCallback(
    (keys: string[]): AssetUsage[] => {
      type ElNode = { getParent?: () => ElNode | null; getId?: () => string; id?: string };
      const elements = composer.elements as unknown as {
        findByMediaSrc?: (src: string) => ElNode[];
      };
      if (typeof elements?.findByMediaSrc !== "function") return [];

      /* Page names by their root element id, so a found element can be traced
         home by walking parents. The registry is flat and holds every imported
         page, so "which page" is not otherwise recoverable from an element. */
      const pageOfRoot = new Map<string, string>();
      for (const p of composer.elements.getAllPages?.() ?? []) {
        const rootId = (p as { root?: { id?: string } }).root?.id;
        if (rootId) pageOfRoot.set(rootId, p.name ?? "Untitled page");
      }
      const pageFor = (el: ElNode): string | null => {
        let node: ElNode | null = el;
        /* Bounded: a cycle in the parent chain would hang the confirm dialog,
           and no tree in this product is anywhere near this deep. */
        for (let hops = 0; node && hops < 200; hops++) {
          /* The engine's Element answers getId(); its `id` is not a public
             field — reading it found no page for any live placement, so the
             confirms and the versions cards said "on the site" without a name
             (seen 2026-09-14). The test doubles carry a bare `id`. */
          const id = node.getId?.() ?? node.id;
          if (id && pageOfRoot.has(id)) return pageOfRoot.get(id)!;
          node = node.getParent?.() ?? null;
        }
        return null;
      };

      const usages: AssetUsage[] = [];
      for (const key of keys) {
        const asset = composer.media.getAsset(key);
        if (!asset) continue;
        /*
          Called ON the manager, not through a detached reference. The old code
          lifted the method out (`const findFn = composer.elements.findByMediaSrc`)
          and called it bare, so `this` was undefined and its first line —
          `this.elements.values()` — threw "Cannot read properties of undefined
          (reading 'elements')". That threw inside requestBulkDelete, so bulk
          Delete opened no confirm modal at all, and the in-use count that warns
          before deleting a referenced asset never ran.
        */
        const found = elements.findByMediaSrc!(asset.src);
        if (found.length === 0) continue;
        const pages = [...new Set(found.map(pageFor).filter((n): n is string => Boolean(n)))];
        usages.push({ key, name: asset.name ?? key, count: found.length, pages });
      }
      return usages;
    },
    [composer]
  );

  /* Clone 3695:19968 — the bulk bar's ✕ Clear empties the checked set and
     STAYS in select mode ("Assets · List · no selection"); leaving the mode
     is the toolbar's ☑. It used to leave, which threw the person back to the
     grid one click after they had asked for checkboxes. */
  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

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
    (key: string, fallbackAnchor?: string | null) => {
      setSelMode(true);
      /* The details rail's open asset is where a range starts when nothing
         was checked yet — plain click opens it without setting the anchor. */
      const anchor = anchorKey ?? fallbackAnchor ?? null;
      if (!anchor || anchor === key) {
        setSelectedKeys(new Set([key]));
        setAnchorKey(key);
        return;
      }
      const order = libraryItems.map((i) => i.key);
      const a = order.indexOf(anchor);
      const b = order.indexOf(key);
      if (a === -1 || b === -1) {
        setSelectedKeys(new Set([key]));
        setAnchorKey(key);
        return;
      }
      const [lo, hi] = a < b ? [a, b] : [b, a];
      setSelectedKeys(new Set(order.slice(lo, hi + 1)));
      setAnchorKey(anchor);
    },
    [anchorKey, libraryItems],
  );

  /* The rows a file's delete takes: its saved versions, then itself. A
     version is a hidden row (`versionOf`) that only `versionsOf` reaches, so
     deleting the original alone would strand every version in storage; and
     the site may be sitting on an APPLIED version (Clone 3697:20341), so the
     confirm counts the family's placements under the file's name — not the
     original's src alone, which would have called an in-use file unused. */
  const familyKeys = useCallback(
    (key: string): string[] => {
      const family = versionsOf(key).map((v) => v.key);
      return family.length > 0 ? [...family.slice(1), family[0]] : [key];
    },
    [versionsOf],
  );

  const familyUsage = useCallback(
    (items: LibraryItem[]): AssetUsage[] =>
      items.flatMap((item) => {
        const members = checkInUse(familyKeys(item.key));
        if (members.length === 0) return [];
        return [
          {
            key: item.key,
            name: item.name,
            count: members.reduce((n, m) => n + m.count, 0),
            pages: [...new Set(members.flatMap((m) => m.pages))],
          },
        ];
      }),
    [checkInUse, familyKeys],
  );

  const requestDelete = useCallback(
    (key: string) => {
      const item = libraryItems.find((i) => i.key === key);
      if (!item) return;
      const inUse = familyUsage([item]);
      setConfirmDelete({ keys: [key], names: [item.displayName ?? item.name], inUseCount: inUse.length, inUse, isBulk: false });
    },
    [libraryItems, familyUsage]
  );

  const requestBulkDelete = useCallback(
    (items: LibraryItem[]) => {
      const keys = items.map((i) => i.key);
      const names = items.map((i) => i.displayName ?? i.name);
      const inUse = familyUsage(items);
      setConfirmDelete({ keys, names, inUseCount: inUse.length, inUse, isBulk: true });
    },
    [familyUsage]
  );

  const executeDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const { keys, names } = confirmDelete;
    /* Every delete goes through the grace path, and the ones that could not
       be granted one (still uploading) have already happened the old way.
       A file's versions go with it; the toast and its Undo count FILES. */
    const graced: NonNullable<Awaited<ReturnType<typeof composer.mediaOps.deleteWithGrace>>>[] = [];
    let files = 0;
    let gracedName = "";
    for (const [i, key] of keys.entries()) {
      let deleted = false;
      for (const member of familyKeys(key)) {
        try {
          const g = await composer.mediaOps.deleteWithGrace(member);
          if (g) {
            graced.push(g);
            deleted = true;
          }
        } catch {
          showToast(`Could not delete "${names[i] ?? key}"`, "error");
        }
      }
      if (deleted) {
        files += 1;
        gracedName = names[i];
      }
    }
    if (graced.length > 0) {
      /* The toast names the file the way the confirm did — the full display
         name (Clone 3708:20446), not the engine's stem. */
      const what = files === 1 ? `"${gracedName}"` : `${files} files`;
      const broke = graced.reduce((n, g) => n + g.usageCount, 0);
      showToast(
        broke > 0
          ? `Deleted ${what} and cleared it from ${broke} element${broke === 1 ? "" : "s"}.`
          : `Deleted ${what}.`,
        "info",
        { action: { label: "Undo", onClick: () => graced.forEach((g) => g.undo()) }, duration: 8000 },
      );
    }
    setConfirmDelete(null);
    setSelectedKeys(new Set());
    if (keys.length > 1) setSelMode(false);
  }, [composer, confirmDelete, showToast, familyKeys]);

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
    checkInUse,
    clearSelection,
  };
}
