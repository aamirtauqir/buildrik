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
import { EVENTS } from "../../../../shared/constants/events";
import type { LayerItem } from "../types";
import { getLayerPreview } from "../data/layerUtils";
import { hasStoredSet, loadSetFromStorage, saveSetToStorage } from "./layersPersistence";

export interface UseLayerTreeReturn {
  layers: LayerItem[];
  expandedIds: Set<string>;
  currentPageId: string | null;
  treeContainerRef: React.RefObject<HTMLDivElement | null>;
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
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [currentPageId, setCurrentPageId] = React.useState<string | null>(null);
  const isHydrated = React.useRef(false);
  /* A page's first visit (nothing stored) opens like board 4418:81300: the
     first top-level layer down to depth 3, everything else closed. Seeded
     once the tree for that page exists. */
  const seedDefaultRef = React.useRef(false);
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map());
  const previousPageIdRef = React.useRef<string | null>(null);

  /* With no stored state, nothing is expanded. This used to seed the ROOT id,
     which was the same "make the top level visible" trick as the auto-expand
     effect — and with the root excluded from the tree (B6) it seeded an id that
     is no longer a row at all, so it expanded nothing while making the panel
     look like it had state. The `rootId` argument went with it. */
  const hydrateExpandedFromStorage = React.useCallback((pageId: string) => {
    setExpandedIds(loadSetFromStorage(pageId, "expanded"));
    seedDefaultRef.current = !hasStoredSet(pageId, "expanded");
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
      preview: getLayerPreview(element),
      children: element.getChildren().map((child: Element) => buildTree(child, depth + 1)),
    });

    /* The page root is EXCLUDED from the tree (founder call 2026-09-08,
       BLOCKERS.md B6, matching PRD 04:7 "Root excluded everywhere" over the
       contradicting 05:12).
       It used to be `[buildTree(rootElement, 0)]`, so the root was itself a row:
       an empty page read "1 layer" and the Layers empty-state board (143:355)
       was unreachable — there was no state in which `layers.length === 0`.
       The root is a container the user never selects, names, hides or locks;
       counting it leaked an implementation detail into a user-facing number.
       Its children become the top level at depth 0. */
    setLayers(rootElement.getChildren().map((child: Element) => buildTree(child, 0)));
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
    /* The engine has no bare "page:changed" / "project:imported" — switching
       the active page emits PROJECT_CHANGED with type "page:activated"
       (PageManager:225), and importProject re-emits PROJECT_LOADED. Listening
       for the bare names meant this never ran again after mount, so switching
       pages left the tree — and the expanded-node state keyed to the old page
       — exactly as it was. */
    composer.on(EVENTS.PROJECT_CHANGED, handlePageChange);
    composer.on(EVENTS.PROJECT_LOADED, handlePageChange);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, handlePageChange);
      composer.off(EVENTS.PROJECT_LOADED, handlePageChange);
    };
  }, [composer, currentPageId, hydrateExpandedFromStorage]);

  // Update layers when engine content changes
  React.useEffect(() => {
    if (!composer) return;
    buildLayersFromEngine();
    /* PROJECT_CHANGED carries every page create/delete/activate as a typed
       payload; the four bare page/import names it replaces were never emitted. */
    const events = [
      EVENTS.PROJECT_CHANGED,
      EVENTS.PROJECT_LOADED,
      EVENTS.ELEMENT_CREATED,
      EVENTS.ELEMENT_DELETED,
      EVENTS.ELEMENT_MOVED,
      EVENTS.ELEMENT_DUPLICATED,
      EVENTS.ELEMENT_UPDATED,
    ] as const;
    const handler = () => buildLayersFromEngine();
    events.forEach((e) => composer.on(e, handler));
    return () => {
      events.forEach((e) => composer.off(e, handler));
    };
  }, [composer, buildLayersFromEngine]);

  React.useEffect(() => {
    if (!seedDefaultRef.current || layers.length === 0) return;
    seedDefaultRef.current = false;
    const open = new Set<string>();
    const walk = (item: LayerItem) => {
      if (item.children.length === 0 || item.depth > 2) return;
      open.add(item.id);
      item.children.forEach(walk);
    };
    walk(layers[0]);
    setExpandedIds(open);
  }, [layers]);

  // Persist expanded state to localStorage
  React.useEffect(() => {
    if (!currentPageId || !isHydrated.current) return;
    saveSetToStorage(currentPageId, "expanded", expandedIds);
  }, [expandedIds, currentPageId]);

  /* There is no longer anything to auto-expand, and that is the correct port
     rather than an omission.
     This used to expand the root on arrival, whose ONLY effect was to make the
     page's top-level elements visible — with the root excluded (B6) those
     elements are the top level and are visible with nothing expanded at all.
     Expanding `layers[0]` instead would open one level DEEPER than the old
     behaviour ever did, which is a change nobody asked for; a rewritten test
     caught exactly that. Storage-hydrated expansion is unaffected. */

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

  /* Collapse to nothing. This kept `layers[0]` — the root — expanded, because
     collapsing the root hid the entire page. With the root no longer a row,
     every top-level layer is a real element and "collapse all" should collapse
     all of them. */
  const collapseAll = React.useCallback(() => {
    setExpandedIds(new Set());
  }, []);

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
