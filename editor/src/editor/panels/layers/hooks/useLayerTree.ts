/**
 * useLayerTree - Manages the layer tree structure, expansion state, and scroll position.
 *
 * Responsibilities:
 * - Build LayerItem tree from Composer engine elements
 * - Persist/restore expanded IDs per page
 * - Persist/restore scroll position per page
 * - Auto-expand ancestors when canvas hover changes
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { Element } from "../../../../engine/elements/Element";
import type { LayerItem } from "../types";
import { loadSetFromStorage, saveSetToStorage } from "./layersPersistence";

export interface UseLayerTreeReturn {
  layers: LayerItem[];
  expandedIds: Set<string>;
  currentPageId: string | null;
  treeContainerRef: React.RefObject<HTMLDivElement>;
  toggleExpand: (id: string) => void;
  expandIds: (ids: string[]) => void;
  expandAll: () => void;
  collapseAll: () => void;
  getVisibleLayerIds: () => string[];
  totalCount: number;
}

export function useLayerTree(
  composer: Composer | null,
  canvasHoveredId?: string | null
): UseLayerTreeReturn {
  const [layers, setLayers] = React.useState<LayerItem[]>([]);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(["root"]));
  const [currentPageId, setCurrentPageId] = React.useState<string | null>(null);
  const isHydrated = React.useRef(false);
  const hasAutoExpandedRoot = React.useRef(false);
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map());
  const previousPageIdRef = React.useRef<string | null>(null);

  const hydrateExpandedFromStorage = React.useCallback((pageId: string) => {
    const stored = loadSetFromStorage(pageId, "expanded");
    if (stored.size > 0) {
      setExpandedIds(stored);
    } else {
      setExpandedIds(new Set(["root"]));
    }
  }, []);

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

    const buildTree = (element: Element, depth = 0): LayerItem => ({
      id: element.getId(),
      type: element.getType() || "element",
      tagName: (element.getTagName() || "div").toLowerCase(),
      depth,
      isComponent: element.isComponentInstance(),
      children: element.getChildren().map((child: Element) => buildTree(child, depth + 1)),
    });

    setLayers([buildTree(rootElement, 0)]);
  }, [composer]);

  // Initial hydration + page change listener
  React.useEffect(() => {
    if (!composer) return;
    const handlePageChange = () => {
      const page = composer.elements.getActivePage();
      const pageId = page?.id ?? null;
      if (!pageId) return;
      if (pageId !== currentPageId) {
        setCurrentPageId(pageId);
        isHydrated.current = false;
        hydrateExpandedFromStorage(pageId);
        isHydrated.current = true;
      }
    };
    handlePageChange();
    composer.on("page:changed", handlePageChange);
    composer.on("project:loaded", handlePageChange);
    composer.on("project:imported", handlePageChange);
    return () => {
      composer.off("page:changed", handlePageChange);
      composer.off("project:loaded", handlePageChange);
      composer.off("project:imported", handlePageChange);
    };
  }, [composer, currentPageId, hydrateExpandedFromStorage]);

  // Update layers when engine content changes
  React.useEffect(() => {
    if (!composer) return;
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
    events.forEach((e) => composer.on(e, handler));
    return () => {
      events.forEach((e) => composer.off(e, handler));
    };
  }, [composer, buildLayersFromEngine]);

  // Persist expanded state to localStorage
  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveSetToStorage(currentPageId, "expanded", expandedIds);
  }, [expandedIds, currentPageId]);

  // Auto-expand root on first load (only if not hydrated from storage)
  React.useEffect(() => {
    if (!hasAutoExpandedRoot.current && layers.length > 0 && !isHydrated.current) {
      hasAutoExpandedRoot.current = true;
      setExpandedIds(new Set([layers[0].id]));
    }
  }, [layers]);

  // Auto-expand ancestors when canvas hover changes
  React.useEffect(() => {
    if (!canvasHoveredId || !composer) return;
    const ancestorIds: string[] = [];
    let current = composer.elements.getElement(canvasHoveredId);
    while (current) {
      const parent = current.getParent?.();
      if (parent) ancestorIds.push(parent.getId());
      current = parent ?? undefined;
    }
    if (ancestorIds.length > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        ancestorIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [canvasHoveredId, composer]);

  // Save scroll position when page changes, restore for new page
  React.useEffect(() => {
    const container = treeContainerRef.current;
    const prevPageId = previousPageIdRef.current;
    if (prevPageId && container) {
      scrollPositionsRef.current.set(prevPageId, container.scrollTop);
    }
    previousPageIdRef.current = currentPageId;
    if (currentPageId && container) {
      const saved = scrollPositionsRef.current.get(currentPageId);
      if (saved !== undefined) {
        requestAnimationFrame(() => {
          container.scrollTop = saved;
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

  const toggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandIds = React.useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    const allIds = new Set<string>();
    const walk = (items: LayerItem[]) => {
      items.forEach((item) => {
        allIds.add(item.id);
        walk(item.children);
      });
    };
    walk(layers);
    setExpandedIds(allIds);
  }, [layers]);

  const collapseAll = React.useCallback(() => {
    setExpandedIds(layers.length > 0 ? new Set([layers[0].id]) : new Set());
  }, [layers]);

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

  const totalCount = React.useMemo(() => {
    const count = (items: LayerItem[]): number =>
      items.reduce((acc, item) => acc + 1 + count(item.children), 0);
    return count(layers);
  }, [layers]);

  return {
    layers,
    expandedIds,
    currentPageId,
    treeContainerRef,
    toggleExpand,
    expandIds,
    expandAll,
    collapseAll,
    getVisibleLayerIds,
    totalCount,
  };
}
