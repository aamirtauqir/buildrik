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
import { findById, countDescendants } from "../data/layerUtils";
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
  editInputRef: React.RefObject<HTMLInputElement>;
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
  const isHydrated = React.useRef(false);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  const hydrateFromStorage = React.useCallback((pageId: string) => {
    // Set flag BEFORE state setters so persistence effects see it during the commit
    isHydrated.current = false;
    const storedHidden = loadSetFromStorage(pageId, "hidden");
    const storedLocked = loadSetFromStorage(pageId, "locked");
    const storedNames = loadMapFromStorage(pageId);
    setHiddenIds(storedHidden);
    setLockedIds(storedLocked);
    setCustomNames(storedNames);
    setTimeout(() => applyStoredStatesToDOM(storedHidden, storedLocked), 100);
    // NOTE: isHydrated.current is reset to true in the useEffect below, AFTER commit
  }, []);

  // Re-enable persistence after the hydration state commits to DOM
  React.useEffect(() => {
    if (!isHydrated.current) {
      isHydrated.current = true;
    }
  }, [hiddenIds, lockedIds, customNames]);

  // Persist hidden state
  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveSetToStorage(currentPageId, "hidden", hiddenIds);
  }, [hiddenIds, currentPageId]);

  // Persist locked state
  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveSetToStorage(currentPageId, "locked", lockedIds);
  }, [lockedIds, currentPageId]);

  // Persist custom names
  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveMapToStorage(currentPageId, customNames);
  }, [customNames, currentPageId]);

  const toggleVisibility = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenIds((prev) => {
      const next = new Set(prev);
      const isNowHidden = !next.has(id);
      if (isNowHidden) next.add(id);
      else next.delete(id);
      const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement | null;
      if (el) el.setAttribute("data-hidden", String(isNowHidden));
      return next;
    });
  }, []);

  const toggleLock = React.useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setLockedIds((prev) => {
        const next = new Set(prev);
        const isNowLocked = !prev.has(id);
        if (isNowLocked) next.add(id);
        else next.delete(id);
        const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement | null;
        if (el) el.setAttribute("data-locked", String(isNowLocked));
        composer?.elements.getElement(id)?.setLocked(isNowLocked);
        return next;
      });
    },
    [composer]
  );

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
      setCustomNames((prev) => {
        const next = new Map(prev);
        if (editingName.trim()) {
          next.set(editingId, editingName.trim());
        } else {
          // Empty input → remove custom name, revert to type label
          next.delete(editingId);
        }
        return next;
      });
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName]);

  const cancelEditing = React.useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  const deleteLayer = React.useCallback(
    (id: string, layers: LayerItem[], onConfirm: () => void) => {
      if (!composer) return;
      const node = findById(layers, id);
      const childCount = node ? countDescendants(node) : 0;
      const name = customNames.get(id) ?? node?.type ?? "element";
      const message =
        childCount > 0
          ? `Delete "${name}"? This will also delete ${childCount} child element${childCount === 1 ? "" : "s"}.`
          : `Delete "${name}"?`;
      if (!window.confirm(message)) return;
      composer.beginTransaction("delete-layer");
      composer.elements.removeElement(id);
      composer.endTransaction();
      onConfirm();
    },
    [composer, customNames]
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
        const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement | null;
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
