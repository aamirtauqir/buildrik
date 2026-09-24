/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * useCanvasGuides Hook
 * Ruler guides, saved with the site (G2-033): they live in the project
 * settings (`canvasGuides`), which round-trip through the site's
 * projectSettings — not in this browser's localStorage, where they were lost
 * on another machine and shared across every site on this one.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { CanvasGuide } from "../../../shared/types/canvas";
import { devLogger } from "../../../shared/utils/devLogger";

/** A guide drag updates on every pointer move; the site is written once it rests. */
const PERSIST_DELAY_MS = 300;

export interface UseCanvasGuidesOptions {
  composer: Composer | null;
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
}

const savedGuides = (composer: Composer | null): CanvasGuide[] =>
  composer?.getProjectSettings().canvasGuides ?? [];

export function useCanvasGuides({ composer, enabled }: UseCanvasGuidesOptions): UseCanvasGuidesReturn {
  const [guides, setGuides] = React.useState<CanvasGuide[]>(() => savedGuides(composer));
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read on mount and whenever a project (re)loads — never written back here,
  // so opening a site does not mark it dirty.
  React.useEffect(() => {
    if (!composer) return;
    const read = () => setGuides(savedGuides(composer));
    read();
    composer.on(EVENTS.PROJECT_LOADED, read);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, read);
    };
  }, [composer]);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const commit = React.useCallback(
    (change: (prev: CanvasGuide[]) => CanvasGuide[]) => {
      setGuides((prev) => {
        const next = change(prev);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          timer.current = null;
          if (composer) composer.setProjectSettings({ ...composer.getProjectSettings(), canvasGuides: next });
        }, PERSIST_DELAY_MS);
        return next;
      });
    },
    [composer]
  );

  const addGuide = React.useCallback(
    (type: "horizontal" | "vertical", position: number) => {
      const newGuide: CanvasGuide = {
        id: crypto.randomUUID(),
        type,
        position,
        locked: false,
        // No colour: GuidesOverlay draws the one accent (#89b4fa was a
        // leftover dark-theme blue).
      };
      devLogger.guides("add", { type, position, id: newGuide.id });
      commit((prev) => [...prev, newGuide]);
    },
    [commit]
  );

  const removeGuide = React.useCallback(
    (id: string) => {
      devLogger.guides("remove", { id });
      commit((prev) => prev.filter((g) => g.id !== id));
    },
    [commit]
  );

  const updateGuide = React.useCallback(
    (id: string, position: number) => {
      devLogger.guides("update", { id, position });
      commit((prev) => prev.map((g) => (g.id === id ? { ...g, position } : g)));
    },
    [commit]
  );

  return {
    guides: enabled ? guides : [],
    addGuide,
    removeGuide,
    updateGuide,
  };
}

export default useCanvasGuides;
