/**
 * Canvas Sync Hook
 * Synchronizes canvas content from Composer element tree
 *
 * @module components/Canvas/hooks/useCanvasSync
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";

export interface UseCanvasSyncOptions {
  composer: Composer | null;
}

export interface UseCanvasSyncResult {
  content: string;
  syncFromComposer: () => void;
}

/**
 * Hook to sync canvas HTML content from Composer
 */
export function useCanvasSync({ composer }: UseCanvasSyncOptions): UseCanvasSyncResult {
  const [content, setContent] = React.useState("");

  // Immediate sync — exposed to imperative callers (keyboard actions in
  // useCanvasKeyboard need a synchronous refresh right after cut/paste/delete).
  const syncFromComposer = React.useCallback(() => {
    if (!composer) return;
    try {
      const html = composer.elements.toHTML();
      setContent(html);
    } catch {
      // Sync error handled silently - composer may not be ready yet
    }
  }, [composer]);

  // RAF-coalesced sync — used by the event subscriptions below. 12 composer
  // events each trigger a full `elements.toHTML()` regen; drag/resize/move
  // tick at native frame rate, fanning hundreds of full-tree serializations
  // per gesture. Coalescing to one regen per animation frame collapses the
  // storm without changing perceived behavior. (Codex editor audit P2 #10.)
  const pendingRafRef = React.useRef<number | null>(null);
  const scheduleSync = React.useCallback(() => {
    if (pendingRafRef.current != null) return;
    pendingRafRef.current = requestAnimationFrame(() => {
      pendingRafRef.current = null;
      syncFromComposer();
    });
  }, [syncFromComposer]);

  // Subscribe to composer events for content sync
  React.useEffect(() => {
    if (!composer) return;

    // Initial sync — fire IMMEDIATELY (not via scheduleSync). First paint
    // shouldn't wait for the next animation frame.
    if (typeof composer.isReady === "function" && composer.isReady()) {
      syncFromComposer();
    } else {
      composer.on(EVENTS.COMPOSER_READY, syncFromComposer);
    }

    const events = [
      "project:imported",
      "project:loaded",
      "project:changed",
      "page:created",
      "page:deleted",
      "page:changed",
      "element:created",
      "element:deleted",
      "element:duplicated",
      "element:updated",
      "element:moved",
      "element:resized",
    ];

    events.forEach((event) => composer.on(event, scheduleSync));

    return () => {
      composer.off(EVENTS.COMPOSER_READY, syncFromComposer);
      events.forEach((event) => composer.off(event, scheduleSync));
      if (pendingRafRef.current != null) {
        cancelAnimationFrame(pendingRafRef.current);
        pendingRafRef.current = null;
      }
    };
  }, [composer, syncFromComposer, scheduleSync]);

  return {
    content,
    syncFromComposer,
  };
}
