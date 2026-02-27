/**
 * useCanvasDOM - Centralized DOM Query Hook
 * Single source of truth for all canvas DOM operations with caching
 *
 * Why this exists:
 * - Eliminates 40+ scattered querySelector calls across hooks
 * - Provides consistent null handling (no more "element might be null" bugs)
 * - Caches frequently accessed elements to avoid layout thrashing
 * - Normalizes element lookups across different selector patterns
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useRef, useMemo } from "react";

/** DOM element reference with type info */
export interface CanvasElement {
  element: HTMLElement;
  id: string;
  type: string | null;
  rect: DOMRect;
  isRoot: boolean;
}

/** Options for canvas DOM queries */
export interface UseCanvasDOMOptions {
  /** The canvas container ref */
  canvasRef: React.RefObject<HTMLElement | null>;
}

/** Result from useCanvasDOM hook */
export interface UseCanvasDOMResult {
  /** Get element by aquibra ID */
  getElement: (id: string) => HTMLElement | null;
  /** Get element info with rect (cached per frame) */
  getElementInfo: (id: string) => CanvasElement | null;
  /** Get element from point coordinates */
  getElementFromPoint: (x: number, y: number) => HTMLElement | null;
  /** Get all selected elements */
  getSelectedElements: () => HTMLElement[];
  /** Get canvas content area element */
  getContentArea: () => HTMLElement | null;
  /** Get canvas root element */
  getCanvasRoot: () => HTMLElement | null;
  /** Get parent aquibra element */
  getParentElement: (element: HTMLElement) => HTMLElement | null;
  /** Get all children aquibra elements */
  getChildElements: (element: HTMLElement) => HTMLElement[];
  /** Query elements matching selector within canvas */
  queryElements: (selector: string) => HTMLElement[];
  /** Clear element cache (call after DOM changes) */
  clearCache: () => void;
}

/**
 * Centralized DOM operations for canvas with caching
 */
export function useCanvasDOM(options: UseCanvasDOMOptions): UseCanvasDOMResult {
  const { canvasRef } = options;

  // Element cache - cleared on demand or after frame
  const elementCache = useRef<Map<string, HTMLElement | null>>(new Map());
  const rectCache = useRef<Map<string, DOMRect>>(new Map());

  /**
   * Clear all caches - call after DOM mutations
   */
  const clearCache = useCallback(() => {
    elementCache.current.clear();
    rectCache.current.clear();
  }, []);

  /**
   * Get element by aquibra ID with caching
   */
  const getElement = useCallback(
    (id: string): HTMLElement | null => {
      if (!canvasRef.current) return null;

      // Check cache first
      if (elementCache.current.has(id)) {
        return elementCache.current.get(id) ?? null;
      }

      // Query and cache
      const element = canvasRef.current.querySelector<HTMLElement>(`[data-aqb-id="${id}"]`);
      elementCache.current.set(id, element);

      return element;
    },
    [canvasRef]
  );

  /**
   * Get element info with cached rect
   */
  const getElementInfo = useCallback(
    (id: string): CanvasElement | null => {
      const element = getElement(id);
      if (!element) return null;

      // Get or compute rect
      let rect = rectCache.current.get(id);
      if (!rect) {
        rect = element.getBoundingClientRect();
        rectCache.current.set(id, rect);
      }

      return {
        element,
        id,
        type: element.getAttribute("data-aqb-type"),
        rect,
        isRoot: element.hasAttribute("data-aqb-root"),
      };
    },
    [getElement]
  );

  /**
   * Get element from viewport coordinates
   */
  const getElementFromPoint = useCallback(
    (x: number, y: number): HTMLElement | null => {
      // Use document.elementFromPoint and find closest aquibra element
      const elementAtPoint = document.elementFromPoint(x, y);
      if (!elementAtPoint) return null;

      // Find closest aquibra element
      const aqbElement = elementAtPoint.closest<HTMLElement>("[data-aqb-id]");

      // Verify it's within our canvas
      if (aqbElement && canvasRef.current?.contains(aqbElement)) {
        return aqbElement;
      }

      return null;
    },
    [canvasRef]
  );

  /**
   * Get all currently selected elements
   */
  const getSelectedElements = useCallback((): HTMLElement[] => {
    if (!canvasRef.current) return [];

    return Array.from(canvasRef.current.querySelectorAll<HTMLElement>('[data-selected="true"]'));
  }, [canvasRef]);

  /**
   * Get the canvas content area (where elements live)
   */
  const getContentArea = useCallback((): HTMLElement | null => {
    if (!canvasRef.current) return null;

    return (
      canvasRef.current.querySelector<HTMLElement>(".aqb-canvas") ??
      canvasRef.current.querySelector<HTMLElement>("[data-aqb-root]") ??
      canvasRef.current
    );
  }, [canvasRef]);

  /**
   * Get the canvas root element
   */
  const getCanvasRoot = useCallback((): HTMLElement | null => {
    return canvasRef.current;
  }, [canvasRef]);

  /**
   * Get parent aquibra element
   */
  const getParentElement = useCallback((element: HTMLElement): HTMLElement | null => {
    const parent = element.parentElement;
    if (!parent) return null;

    // Find closest aquibra parent
    return parent.closest<HTMLElement>("[data-aqb-id]");
  }, []);

  /**
   * Get direct children that are aquibra elements
   */
  const getChildElements = useCallback((element: HTMLElement): HTMLElement[] => {
    return Array.from(element.querySelectorAll<HTMLElement>(":scope > [data-aqb-id]"));
  }, []);

  /**
   * Query elements within canvas
   */
  const queryElements = useCallback(
    (selector: string): HTMLElement[] => {
      if (!canvasRef.current) return [];

      return Array.from(canvasRef.current.querySelectorAll<HTMLElement>(selector));
    },
    [canvasRef]
  );

  return useMemo(
    () => ({
      getElement,
      getElementInfo,
      getElementFromPoint,
      getSelectedElements,
      getContentArea,
      getCanvasRoot,
      getParentElement,
      getChildElements,
      queryElements,
      clearCache,
    }),
    [
      getElement,
      getElementInfo,
      getElementFromPoint,
      getSelectedElements,
      getContentArea,
      getCanvasRoot,
      getParentElement,
      getChildElements,
      queryElements,
      clearCache,
    ]
  );
}

export default useCanvasDOM;
