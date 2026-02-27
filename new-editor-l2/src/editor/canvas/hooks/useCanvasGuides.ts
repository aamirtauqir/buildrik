/**
 * useCanvasGuides Hook
 * Manages canvas guides with localStorage persistence
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CanvasGuide } from "../../../shared/types/canvas";
import { devLogger } from "../../../shared/utils/devLogger";

const STORAGE_KEY = "aqb-guides";

export interface UseCanvasGuidesOptions {
  /** Enable/disable guides */
  enabled: boolean;
}

export interface UseCanvasGuidesReturn {
  /** Current guides */
  guides: CanvasGuide[];
  /** Add a new guide */
  addGuide: (type: "horizontal" | "vertical", position: number) => void;
  /** Remove a guide by ID */
  removeGuide: (id: string) => void;
  /** Update guide position */
  updateGuide: (id: string, position: number) => void;
  /** Clear all guides */
  clearGuides: () => void;
}

/**
 * Load guides from localStorage
 */
function loadGuides(): CanvasGuide[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as CanvasGuide[];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save guides to localStorage
 */
function saveGuides(guides: CanvasGuide[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing canvas guides
 */
export function useCanvasGuides({ enabled }: UseCanvasGuidesOptions): UseCanvasGuidesReturn {
  const [guides, setGuides] = React.useState<CanvasGuide[]>(() => {
    if (!enabled) return [];
    return loadGuides();
  });

  // Load guides when enabled changes
  React.useEffect(() => {
    if (enabled) {
      setGuides(loadGuides());
    }
  }, [enabled]);

  // Save guides when they change
  React.useEffect(() => {
    if (enabled) {
      saveGuides(guides);
    }
  }, [guides, enabled]);

  const addGuide = React.useCallback((type: "horizontal" | "vertical", position: number) => {
    const newGuide: CanvasGuide = {
      id: crypto.randomUUID(),
      type,
      position,
      locked: false,
      color: "#89b4fa",
    };
    devLogger.guides("add", { type, position, id: newGuide.id });
    setGuides((prev) => [...prev, newGuide]);
  }, []);

  const removeGuide = React.useCallback((id: string) => {
    devLogger.guides("remove", { id });
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const updateGuide = React.useCallback((id: string, position: number) => {
    devLogger.guides("update", { id, position });
    setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, position } : g)));
  }, []);

  const clearGuides = React.useCallback(() => {
    devLogger.guides("clear-all");
    setGuides([]);
  }, []);

  return {
    guides: enabled ? guides : [],
    addGuide,
    removeGuide,
    updateGuide,
    clearGuides,
  };
}

export default useCanvasGuides;
