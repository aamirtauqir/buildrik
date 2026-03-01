/**
 * useLayersState - ORCHESTRATOR ONLY
 *
 * Composes 5 focused sub-hooks and returns a unified state object.
 * Contains NO state, NO effects, NO business logic of its own
 * (exception: displayPrefs and contextMenu, which are panel-level UI state).
 *
 * Sub-hooks:
 *   useLayerTree       – tree build, expand, scroll
 *   useLayerActions    – visibility, lock, rename, delete, duplicate
 *   useLayerSearch     – search query + tree filtering
 *   useLayerSelection  – single/multi/range select, hover
 *   useLayerDrag       – HTML5 drag-and-drop state
 *
 * Backward-compatible flat aliases keep index.tsx compiling unchanged
 * until it is updated in a later task.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { findById, countDescendants } from "../data/layerUtils";
import type { LayerContextMenuState, LayerDisplayPrefs, LayerItem } from "../types";
import { useLayerActions, type UseLayerActionsReturn } from "./useLayerActions";
import { useLayerDrag, type UseLayerDragReturn } from "./useLayerDrag";
import { useLayerSearch, type UseLayerSearchReturn } from "./useLayerSearch";
import { useLayerSelection, type UseLayerSelectionReturn } from "./useLayerSelection";
import { useLayerTree, type UseLayerTreeReturn } from "./useLayerTree";

const DISPLAY_PREFS_KEY = "aqb-layers-display-prefs";

const defaultPrefs: LayerDisplayPrefs = {
  showHtmlBadges: false,
  showElementIds: false,
  treeDensity: "comfortable",
};

function loadDisplayPrefs(): LayerDisplayPrefs {
  try {
    const raw = localStorage.getItem(DISPLAY_PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<LayerDisplayPrefs>) };
  } catch {
    // ignore parse errors
  }
  return defaultPrefs;
}

export interface UseLayersStateOptions {
  composer: Composer | null;
  /** Currently hovered element ID on canvas - auto-expands tree to show it */
  canvasHoveredId?: string | null;
}

/** Shape returned by useLayersState — intentionally wide to cover both legacy and new API */
export interface UseLayersStateReturn {
  // Sub-hook namespaces (new API)
  treeHook: UseLayerTreeReturn;
  actionsHook: UseLayerActionsReturn;
  searchHook: UseLayerSearchReturn;
  selectionHook: UseLayerSelectionReturn;
  dragHook: UseLayerDragReturn;

  // Display settings
  displayPrefs: LayerDisplayPrefs;
  updateDisplayPrefs: (partial: Partial<LayerDisplayPrefs>) => void;
  displaySettingsOpen: boolean;
  setDisplaySettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Context menu
  contextMenu: LayerContextMenuState | null;
  openContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  closeContextMenu: () => void;

  // Legacy flat aliases (backward compat with index.tsx)
  layers: LayerItem[];
  expandedIds: Set<string>;
  dragState: import("../types").DragState;
  setDragState: React.Dispatch<React.SetStateAction<import("../types").DragState>>;
  editingId: string | null;
  editingName: string;
  setEditingName: (value: string) => void;
  hiddenIds: Set<string>;
  lockedIds: Set<string>;
  customNames: Map<string, string>;
  hoveredLayerId: string | null;
  treeContainerRef: React.RefObject<HTMLDivElement>;
  editInputRef: React.RefObject<HTMLInputElement>;
  toggleExpand: (id: string) => void;
  toggleVisibility: (id: string, e: React.MouseEvent) => void;
  toggleLock: (id: string, e: React.MouseEvent) => void;
  startEditing: (id: string, currentName: string, e: React.MouseEvent) => void;
  saveEditedName: () => void;
  cancelEditing: () => void;
  handleLayerMouseEnter: (id: string) => void;
  handleLayerMouseLeave: () => void;
  getVisibleLayerIds: () => string[];
  filterTree: (items: LayerItem[]) => LayerItem[];
  // search as string (legacy) — index.tsx reads state.search as string
  search: string;
  setSearch: (value: string) => void;
}

export function useLayersState({
  composer,
  canvasHoveredId,
}: UseLayersStateOptions): UseLayersStateReturn {
  const treeHook = useLayerTree(composer, canvasHoveredId);
  const actionsHook = useLayerActions(composer, treeHook.currentPageId);
  const searchHook = useLayerSearch();
  const selectionHook = useLayerSelection(composer, treeHook.layers, treeHook.expandedIds);
  const dragHook = useLayerDrag(composer);

  const [displayPrefs, setDisplayPrefs] = React.useState<LayerDisplayPrefs>(loadDisplayPrefs);
  const [contextMenu, setContextMenu] = React.useState<LayerContextMenuState | null>(null);
  const [displaySettingsOpen, setDisplaySettingsOpen] = React.useState(false);

  // Hydrate actions from storage when page changes
  React.useEffect(() => {
    if (treeHook.currentPageId) {
      actionsHook.hydrateFromStorage(treeHook.currentPageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeHook.currentPageId]);

  const updateDisplayPrefs = React.useCallback((partial: Partial<LayerDisplayPrefs>) => {
    setDisplayPrefs((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const openContextMenu = React.useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const node = findById(treeHook.layers, nodeId);
      setContextMenu({
        x: Math.min(e.clientX, window.innerWidth - 200),
        y: Math.min(e.clientY, window.innerHeight - 320),
        nodeId,
        nodeName: actionsHook.customNames.get(nodeId) ?? node?.type ?? "Element",
        isHidden: actionsHook.hiddenIds.has(nodeId),
        isLocked: actionsHook.lockedIds.has(nodeId),
        childCount: node ? countDescendants(node) : 0,
      });
    },
    [treeHook.layers, actionsHook.customNames, actionsHook.hiddenIds, actionsHook.lockedIds]
  );

  const closeContextMenu = React.useCallback(() => {
    setContextMenu(null);
  }, []);

  // Legacy flat alias: filterTree(items) — delegates to searchHook with customNames
  const filterTree = React.useCallback(
    (items: LayerItem[]) => searchHook.filterTree(items, actionsHook.customNames),
    [searchHook.filterTree, actionsHook.customNames]
  );

  return {
    // Sub-hook namespaces (new API)
    treeHook,
    actionsHook,
    searchHook,
    selectionHook,
    dragHook,

    // Display settings
    displayPrefs,
    updateDisplayPrefs,
    displaySettingsOpen,
    setDisplaySettingsOpen,

    // Context menu
    contextMenu,
    openContextMenu,
    closeContextMenu,

    // Legacy flat aliases
    layers: treeHook.layers,
    expandedIds: treeHook.expandedIds,
    dragState: dragHook.dragState,
    setDragState: dragHook.setDragState,
    editingId: actionsHook.editingId,
    editingName: actionsHook.editingName,
    setEditingName: actionsHook.setEditingName,
    hiddenIds: actionsHook.hiddenIds,
    lockedIds: actionsHook.lockedIds,
    customNames: actionsHook.customNames,
    hoveredLayerId: selectionHook.hoveredLayerId,
    treeContainerRef: treeHook.treeContainerRef,
    editInputRef: actionsHook.editInputRef,
    toggleExpand: treeHook.toggleExpand,
    toggleVisibility: actionsHook.toggleVisibility,
    toggleLock: actionsHook.toggleLock,
    startEditing: actionsHook.startEditing,
    saveEditedName: actionsHook.saveEditedName,
    cancelEditing: actionsHook.cancelEditing,
    handleLayerMouseEnter: selectionHook.handleLayerMouseEnter,
    handleLayerMouseLeave: selectionHook.handleLayerMouseLeave,
    getVisibleLayerIds: treeHook.getVisibleLayerIds,
    filterTree,
    // search string alias (index.tsx reads state.search as string, state.setSearch)
    search: searchHook.search,
    setSearch: searchHook.setSearch,
  };
}
