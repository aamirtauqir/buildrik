/**
 * useLayerActions - Manages visibility, lock, rename, delete, duplicate, and move operations.
 *
 * Responsibilities:
 * - Persist/restore hidden, locked, and custom name states per page
 * - Toggle visibility/lock with DOM attribute sync
 * - Inline rename editing
 * - Delete with child count confirmation
 * - Duplicate, moveToTop, moveToBottom, hideMultiple, groupLayers
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import type { LayerItem } from "../types";
import {
  loadSetFromStorage,
  loadMapFromStorage,
  saveSetToStorage,
  saveMapToStorage,
  applyStoredStatesToDOM,
} from "./layersPersistence";

export interface UseLayerActionsReturn {
  hiddenIds: Set<string>;
  lockedIds: Set<string>;
  customNames: Map<string, string>;
  editingId: string | null;
  editingName: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  setEditingName: (value: string) => void;
  hydrateFromStorage: (pageId: string) => void;
  toggleVisibility: (id: string, e: React.MouseEvent) => void;
  toggleLock: (id: string, e: React.MouseEvent) => void;
  startEditing: (id: string, currentName: string, e: React.MouseEvent) => void;
  saveEditedName: () => void;
  cancelEditing: () => void;
  deleteLayer: (id: string, layers: LayerItem[], onConfirm: () => void) => void;
  duplicateLayer: (id: string) => void;
  moveToTop: (id: string, layers: LayerItem[]) => void;
  moveToBottom: (id: string, layers: LayerItem[]) => void;
  hideMultiple: (ids: string[]) => void;
  groupLayers: (ids: string[], layers: LayerItem[]) => void;
}

export function useLayerActions(
  composer: Composer | null,
  currentPageId: string | null
): UseLayerActionsReturn {
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());
  const [lockedIds, setLockedIds] = React.useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = React.useState<Map<string, string>>(new Map());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  /* The page whose stored state has actually been loaded. Persistence is
     keyed off THIS, not off a "have we committed once" flag: the old ref was
     flipped to true by an effect on the first commit — before
     `hydrateFromStorage` had run for the page — so the persist effects wrote
     the initial empty Sets straight over the stored ids. Hiding a layer and
     reloading brought it back, because the reload wiped the record before
     reading it. */
  const hydratedPage = React.useRef<string | null>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const pendingVisibilityRef = React.useRef<{ id: string; hidden: boolean } | null>(null);
  const pendingLockRef = React.useRef<{ id: string; locked: boolean } | null>(null);
  const hydrateTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrateFromStorage = React.useCallback(
    (pageId: string) => {
      // Cancel any in-flight hydration from a prior page
      if (hydrateTimeoutRef.current !== null) {
        clearTimeout(hydrateTimeoutRef.current);
        hydrateTimeoutRef.current = null;
      }
      // Claim the page BEFORE the setters, so the persist effects that run on
      // this commit are writing hydrated state rather than the empty initial.
      hydratedPage.current = pageId;
      const storedHidden = loadSetFromStorage(pageId, "hidden");
      const storedLocked = loadSetFromStorage(pageId, "locked");
      const storedNames = loadMapFromStorage(pageId);
      setHiddenIds(storedHidden);
      setLockedIds(storedLocked);
      setCustomNames(storedNames);
      // Apply engine lock state immediately so transactions respect locks
      if (composer) {
        storedLocked.forEach((id) => {
          composer.elements.getElement(id)?.setLocked(true);
        });
      }
      hydrateTimeoutRef.current = setTimeout(() => {
        applyStoredStatesToDOM(storedHidden, storedLocked);
        hydrateTimeoutRef.current = null;
      }, 100);
    },
    [composer]
  );

  // Cancel pending DOM apply on unmount
  React.useEffect(() => {
    return () => {
      if (hydrateTimeoutRef.current !== null) {
        clearTimeout(hydrateTimeoutRef.current);
      }
    };
  }, []);

  // Persist hidden state
  React.useEffect(() => {
    if (!currentPageId || hydratedPage.current !== currentPageId) return;
    saveSetToStorage(currentPageId, "hidden", hiddenIds);
  }, [hiddenIds, currentPageId]);

  // Persist locked state
  React.useEffect(() => {
    if (!currentPageId || hydratedPage.current !== currentPageId) return;
    saveSetToStorage(currentPageId, "locked", lockedIds);
  }, [lockedIds, currentPageId]);

  // Persist custom names
  React.useEffect(() => {
    if (!currentPageId || hydratedPage.current !== currentPageId) return;
    saveMapToStorage(currentPageId, customNames);
  }, [customNames, currentPageId]);

  const toggleVisibility = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenIds((prev) => {
      const next = new Set(prev);
      const isNowHidden = !next.has(id);
      if (isNowHidden) next.add(id);
      else next.delete(id);
      pendingVisibilityRef.current = { id, hidden: isNowHidden };
      return next;
    });
  }, []);

  // Apply DOM visibility attribute after state commit (keeps side effects out of setState)
  React.useEffect(() => {
    const pending = pendingVisibilityRef.current;
    if (!pending) return;
    pendingVisibilityRef.current = null;
    const el = document.querySelector(`[data-buildrick-id="${pending.id}"]`) as HTMLElement | null;
    if (el) el.setAttribute("data-hidden", String(pending.hidden));
  }, [hiddenIds]);

  const toggleLock = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLockedIds((prev) => {
      const next = new Set(prev);
      const isNowLocked = !prev.has(id);
      if (isNowLocked) next.add(id);
      else next.delete(id);
      pendingLockRef.current = { id, locked: isNowLocked };
      return next;
    });
  }, []);

  // Apply DOM lock attribute + engine lock state after state commit
  React.useEffect(() => {
    const pending = pendingLockRef.current;
    if (!pending) return;
    pendingLockRef.current = null;
    const el = document.querySelector(`[data-buildrick-id="${pending.id}"]`) as HTMLElement | null;
    if (el) el.setAttribute("data-locked", String(pending.locked));
    composer?.elements.getElement(pending.id)?.setLocked(pending.locked);
  }, [lockedIds, composer]);

  const startEditing = React.useCallback(
    (id: string, currentName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(id);
      setEditingName(customNames.get(id) || currentName);
      setTimeout(() => editInputRef.current?.focus(), 0);
    },
    [customNames]
  );

  const saveEditedName = React.useCallback(() => {
    if (editingId) {
      const trimmed = editingName.trim();
      setCustomNames((prev) => {
        const next = new Map(prev);
        if (trimmed) {
          next.set(editingId, trimmed);
        } else {
          // Empty input → remove custom name, revert to type label
          next.delete(editingId);
        }
        return next;
      });
      /* The status bar names the selected element too (board 65:2 / 52:10),
         and these names live only in this panel's store — without an
         announcement it would keep showing the old one until something else
         happened to re-render it. */
      composer?.emit(EVENTS.ELEMENT_RENAMED, { id: editingId, name: trimmed || null });
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName, composer]);

  const cancelEditing = React.useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  const deleteLayer = React.useCallback(
    (id: string, _layers: LayerItem[], onConfirm: () => void) => {
      if (!composer) return;
      composer.beginTransaction("delete-layer");
      composer.elements.removeElement(id);
      composer.endTransaction();
      onConfirm();
    },
    [composer]
  );

  const duplicateLayer = React.useCallback(
    (id: string) => {
      if (!composer) return;
      composer.beginTransaction("duplicate-layer");
      composer.elements.duplicateElement(id);
      composer.endTransaction();
    },
    [composer]
  );

  const moveToTop = React.useCallback(
    (id: string, _layers: LayerItem[]) => {
      if (!composer) return;
      const el = composer.elements.getElement(id);
      const parent = el?.getParent?.();
      if (!el || !parent) return;
      composer.beginTransaction("move-layer-top");
      composer.elements.moveElement(id, parent.getId(), 0);
      composer.endTransaction();
    },
    [composer]
  );

  const moveToBottom = React.useCallback(
    (id: string, _layers: LayerItem[]) => {
      if (!composer) return;
      const el = composer.elements.getElement(id);
      const parent = el?.getParent?.();
      if (!el || !parent) return;
      const idx = parent.getChildCount();
      composer.beginTransaction("move-layer-bottom");
      composer.elements.moveElement(id, parent.getId(), idx);
      composer.endTransaction();
    },
    [composer]
  );

  const hideMultiple = React.useCallback((ids: string[]) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        next.add(id);
        const el = document.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement | null;
        if (el) el.setAttribute("data-hidden", "true");
      });
      return next;
    });
  }, []);

  const groupLayers = React.useCallback(
    (ids: string[], _layers: LayerItem[]) => {
      if (!composer || ids.length < 2) return;
      const firstEl = composer.elements.getElement(ids[0]);
      const parent = firstEl?.getParent?.();
      if (!parent) return;
      const parentId = parent.getId();
      const insertIndex = parent.getChildIndex(firstEl!);
      composer.beginTransaction("group-layers");
      const group = composer.elements.createElement("container");
      if (group) {
        composer.elements.moveElement(group.getId(), parentId, insertIndex);
        ids.forEach((id) => {
          composer.elements.moveElement(id, group.getId(), group.getChildCount());
        });
      }
      composer.endTransaction();
    },
    [composer]
  );

  return {
    hiddenIds,
    lockedIds,
    customNames,
    editingId,
    editingName,
    editInputRef,
    setEditingName,
    hydrateFromStorage,
    toggleVisibility,
    toggleLock,
    startEditing,
    saveEditedName,
    cancelEditing,
    deleteLayer,
    duplicateLayer,
    moveToTop,
    moveToBottom,
    hideMultiple,
    groupLayers,
  };
}
