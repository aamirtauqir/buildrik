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

  // Sync canvas content from Composer element tree
  const syncFromComposer = React.useCallback(() => {
    if (!composer) return;
    try {
      const html = composer.elements.toHTML();
      setContent(html);
    } catch {
      // Sync error handled silently - composer may not be ready yet
    }
  }, [composer]);

  // Subscribe to composer events for content sync
  React.useEffect(() => {
    if (!composer) return;

    // Initial sync when composer is ready or immediately if already ready
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

    events.forEach((event) => composer.on(event, syncFromComposer));

    return () => {
      composer.off(EVENTS.COMPOSER_READY, syncFromComposer);
      events.forEach((event) => composer.off(event, syncFromComposer));
    };
  }, [composer, syncFromComposer]);

  return {
    content,
    syncFromComposer,
  };
}
