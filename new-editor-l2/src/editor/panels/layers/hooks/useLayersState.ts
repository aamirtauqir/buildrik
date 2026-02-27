/**
 * useLayersState - State management for LayersPanel
 * Handles tree state, expanded nodes, drag state, visibility toggles
 *
 * PERSISTENCE: Hidden/locked states are persisted to localStorage per-page
 * to survive page refreshes. Storage keys: `aqb-layers-{pageId}-{type}`
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { Element } from "../../../../engine/elements/Element";
import type { LayerItem, DragState } from "../types";
import {
  loadSetFromStorage,
  loadMapFromStorage,
  saveSetToStorage,
  saveMapToStorage,
  applyStoredStatesToDOM,
} from "./layersPersistence";

export interface UseLayersStateOptions {
  composer: Composer | null;
  /** Currently hovered element ID on canvas - auto-expands tree to show it */
  canvasHoveredId?: string | null;
}

export interface UseLayersStateReturn {
  // Core state
  layers: LayerItem[];
  search: string;
  setSearch: (value: string) => void;
  expandedIds: Set<string>;
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;

  // Editing state
  editingId: string | null;
  editingName: string;
  setEditingName: (value: string) => void;

  // Layer attributes
  hiddenIds: Set<string>;
  lockedIds: Set<string>;
  customNames: Map<string, string>;
  hoveredLayerId: string | null;

  // Refs
  treeContainerRef: React.RefObject<HTMLDivElement>;
  editInputRef: React.RefObject<HTMLInputElement>;

  // Actions
  toggleExpand: (id: string) => void;
  toggleVisibility: (id: string, e: React.MouseEvent) => void;
  toggleLock: (id: string, e: React.MouseEvent) => void;
  startEditing: (id: string, currentName: string, e: React.MouseEvent) => void;
  saveEditedName: () => void;
  handleLayerMouseEnter: (id: string) => void;
  handleLayerMouseLeave: () => void;
  getVisibleLayerIds: () => string[];
  filterTree: (items: LayerItem[]) => LayerItem[];
}

export function useLayersState({
  composer,
  canvasHoveredId,
}: UseLayersStateOptions): UseLayersStateReturn {
  const [layers, setLayers] = React.useState<LayerItem[]>([]);
  const [search, setSearch] = React.useState("");
  // Note: expandedIds is initialized lazily below after currentPageId is set
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(["root"]));
  const [dragState, setDragState] = React.useState<DragState>({
    draggedId: null,
    targetId: null,
    position: null,
  });
  const [hoveredLayerId, setHoveredLayerId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());
  const [lockedIds, setLockedIds] = React.useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = React.useState<Map<string, string>>(new Map());

  // Track current page ID for persistence
  const [currentPageId, setCurrentPageId] = React.useState<string | null>(null);
  const isHydrated = React.useRef(false);

  const hasAutoExpandedRoot = React.useRef(false);
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  // Scroll position persistence (Gap 2 - UX Strategy Master)
  // Stores scroll position per page to restore when switching back
  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map());
  const previousPageIdRef = React.useRef<string | null>(null);

  // ══════════════════════════════════════════════════════════════════════════
  // PERSISTENCE: Hydrate state from localStorage when page changes
  // ══════════════════════════════════════════════════════════════════════════
  const hydrateFromStorage = React.useCallback((pageId: string) => {
    isHydrated.current = false;

    const storedHidden = loadSetFromStorage(pageId, "hidden");
    const storedLocked = loadSetFromStorage(pageId, "locked");
    const storedExpanded = loadSetFromStorage(pageId, "expanded");
    const storedNames = loadMapFromStorage(pageId);

    setHiddenIds(storedHidden);
    setLockedIds(storedLocked);
    setCustomNames(storedNames);

    // Restore expanded state (default to root expanded if no stored state)
    if (storedExpanded.size > 0) {
      setExpandedIds(storedExpanded);
    } else {
      // Default: expand root on first load
      setExpandedIds(new Set(["root"]));
    }

    // Apply stored states to canvas elements (delay for DOM ready)
    setTimeout(() => applyStoredStatesToDOM(storedHidden, storedLocked), 100);

    isHydrated.current = true;
  }, []);

  // Initial hydration + page change listener
  React.useEffect(() => {
    if (!composer) return;

    const handlePageChange = () => {
      const page = composer.elements.getActivePage();
      const pageId = page?.id;
      if (!pageId) return;

      if (pageId !== currentPageId) {
        setCurrentPageId(pageId);
        hydrateFromStorage(pageId);
      }
    };

    // Initial hydration
    handlePageChange();

    // Listen for page changes
    composer.on("page:changed", handlePageChange);
    composer.on("project:loaded", handlePageChange);
    composer.on("project:imported", handlePageChange);

    return () => {
      composer.off("page:changed", handlePageChange);
      composer.off("project:loaded", handlePageChange);
      composer.off("project:imported", handlePageChange);
    };
  }, [composer, currentPageId, hydrateFromStorage]);

  // ══════════════════════════════════════════════════════════════════════════
  // PERSISTENCE: Save to localStorage when state changes
  // ══════════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveSetToStorage(currentPageId, "hidden", hiddenIds);
  }, [hiddenIds, currentPageId]);

  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveSetToStorage(currentPageId, "locked", lockedIds);
  }, [lockedIds, currentPageId]);

  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveMapToStorage(currentPageId, customNames);
  }, [customNames, currentPageId]);

  // Persist expanded state to localStorage
  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveSetToStorage(currentPageId, "expanded", expandedIds);
  }, [expandedIds, currentPageId]);

  // ══════════════════════════════════════════════════════════════════════════
  // SCROLL POSITION PERSISTENCE (Gap 2 - UX Strategy Master)
  // Saves scroll position when switching pages, restores when switching back
  // ══════════════════════════════════════════════════════════════════════════

  // Save scroll position when page changes
  React.useEffect(() => {
    const container = treeContainerRef.current;
    const prevPageId = previousPageIdRef.current;

    // Save scroll position for the previous page before switching
    if (prevPageId && container) {
      scrollPositionsRef.current.set(prevPageId, container.scrollTop);
    }

    // Update the previous page reference
    previousPageIdRef.current = currentPageId;

    // Restore scroll position for the new page (if we have one saved)
    if (currentPageId && container) {
      const savedPosition = scrollPositionsRef.current.get(currentPageId);
      if (savedPosition !== undefined) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          container.scrollTop = savedPosition;
        });
      }
    }
  }, [currentPageId]);

  // Track scroll position continuously (passive for performance)
  React.useEffect(() => {
    const container = treeContainerRef.current;
    if (!container || !currentPageId) return;

    const handleScroll = () => {
      scrollPositionsRef.current.set(currentPageId, container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentPageId]);

  // Build layers from Composer element tree
  const buildLayersFromEngine = React.useCallback(() => {
    if (!composer) {
      setLayers([]);
      return;
    }

    const page = composer.elements.getActivePage();
    if (!page) {
      setLayers([]);
      return;
    }

    const rootElement = composer.elements.getElement(page.root.id);
    if (!rootElement) {
      setLayers([]);
      return;
    }

    const buildTreeFromElement = (element: Element, depth: number = 0): LayerItem => {
      const id = element.getId();
      const type = element.getType() || "element";
      const tagName = element.getTagName() || "div";

      const children = element
        .getChildren()
        .map((child: Element) => buildTreeFromElement(child, depth + 1));

      return { id, type, tagName: tagName.toLowerCase(), depth, children };
    };

    const rootLayer = buildTreeFromElement(rootElement, 0);
    setLayers([rootLayer]);
  }, [composer]);

  // Update layers when engine content changes
  React.useEffect(() => {
    if (composer) {
      buildLayersFromEngine();

      const events = [
        "project:imported",
        "project:loaded",
        "page:created",
        "page:deleted",
        "page:changed",
        "element:created",
        "element:deleted",
        "element:moved",
        "element:duplicated",
        "element:updated",
      ] as const;

      const handler = () => buildLayersFromEngine();
      events.forEach((event) => composer.on(event, handler));
      return () => {
        events.forEach((event) => composer.off(event, handler));
      };
    }
  }, [composer, buildLayersFromEngine]);

  // Auto-expand root on first load (only if not already hydrated from storage)
  React.useEffect(() => {
    if (!hasAutoExpandedRoot.current && layers.length > 0 && !isHydrated.current) {
      hasAutoExpandedRoot.current = true;
      setExpandedIds(new Set([layers[0].id]));
    }
  }, [layers]);

  // Auto-expand ancestors when canvas hover changes
  React.useEffect(() => {
    if (!canvasHoveredId || !composer) return;

    // Get all ancestor IDs of the hovered element
    const ancestorIds: string[] = [];
    let current = composer.elements.getElement(canvasHoveredId);
    while (current) {
      const parent = current.getParent?.();
      if (parent) {
        ancestorIds.push(parent.getId());
      }
      current = parent ?? undefined;
    }

    // Expand all ancestors to reveal the hovered element
    if (ancestorIds.length > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        ancestorIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [canvasHoveredId, composer]);

  const toggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleVisibility = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenIds((prev) => {
      const next = new Set(prev);
      const isNowHidden = !next.has(id);
      if (isNowHidden) next.add(id);
      else next.delete(id);
      const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement;
      if (el) el.setAttribute("data-hidden", String(isNowHidden));
      return next;
    });
  }, []);

  const toggleLock = React.useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const isNowLocked = !lockedIds.has(id);
      setLockedIds((prev) => {
        const next = new Set(prev);
        if (isNowLocked) next.add(id);
        else next.delete(id);
        return next;
      });
      // Sync DOM attribute for CSS cursor feedback
      const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement;
      if (el) el.setAttribute("data-locked", String(isNowLocked));
      // Sync engine SSOT so canvas selection behavior reads correct locked state
      composer?.elements.getElement(id)?.setLocked(isNowLocked);
    },
    [composer, lockedIds]
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
    if (editingId && editingName.trim()) {
      setCustomNames((prev) => {
        const next = new Map(prev);
        next.set(editingId, editingName.trim());
        return next;
      });
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName]);

  const handleLayerMouseEnter = React.useCallback((id: string) => {
    setHoveredLayerId(id);
    const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement;
    if (el) el.classList.add("aqb-layer-hover-highlight");
  }, []);

  const handleLayerMouseLeave = React.useCallback(() => {
    if (hoveredLayerId) {
      const el = document.querySelector(`[data-aqb-id="${hoveredLayerId}"]`) as HTMLElement;
      if (el) el.classList.remove("aqb-layer-hover-highlight");
    }
    setHoveredLayerId(null);
  }, [hoveredLayerId]);

  const getVisibleLayerIds = React.useCallback((): string[] => {
    const result: string[] = [];
    const walk = (items: LayerItem[]) => {
      items.forEach((item) => {
        result.push(item.id);
        if (expandedIds.has(item.id) && item.children.length > 0) {
          walk(item.children);
        }
      });
    };
    walk(layers);
    return result;
  }, [expandedIds, layers]);

  // Minimal Tree: Search-only filtering (no category filters)
  const matchesSearch = React.useCallback(
    (layer: LayerItem): boolean => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        layer.type.toLowerCase().includes(q) ||
        layer.tagName.toLowerCase().includes(q) ||
        layer.id.toLowerCase().includes(q)
      );
    },
    [search]
  );

  const filterTree = React.useCallback(
    (items: LayerItem[]): LayerItem[] => {
      if (!search.trim()) return items;

      const next: LayerItem[] = [];
      for (const item of items) {
        const filteredChildren = filterTree(item.children);
        // Include if item matches OR if any child matches (to preserve tree structure)
        if (matchesSearch(item) || filteredChildren.length > 0) {
          next.push({ ...item, children: filteredChildren });
        }
      }
      return next;
    },
    [matchesSearch, search]
  );

  return {
    layers,
    search,
    setSearch,
    expandedIds,
    dragState,
    setDragState,
    editingId,
    editingName,
    setEditingName,
    hiddenIds,
    lockedIds,
    customNames,
    hoveredLayerId,
    treeContainerRef,
    editInputRef,
    toggleExpand,
    toggleVisibility,
    toggleLock,
    startEditing,
    saveEditedName,
    handleLayerMouseEnter,
    handleLayerMouseLeave,
    getVisibleLayerIds,
    filterTree,
  };
}
