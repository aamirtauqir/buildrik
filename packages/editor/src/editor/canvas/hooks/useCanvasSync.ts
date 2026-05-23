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

  // RAF-coalesced sync — used by the event subscriptions below.
  // `project:changed` is the authoritative content-changed signal: every
  // mutation in the engine calls `composer.markDirty()` which emits it,
  // so a single subscriber catches element/page/style changes alike.
  // Coalescing to one regen per animation frame collapses drag-tick
  // storms without changing perceived behavior. (Codex editor audit P2
  // #10. Prior arc subscribed to 12 specific events — 5 were dead
  // listeners with zero emitters in engine source, and the live 6 were
  // structurally redundant since markDirty() always follows the
  // specific-event emit. Verified via engine audit 2026-05-23.)
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

    // PROJECT_LOADED fires once per fresh project (cloud load / import /
    // open-file). PROJECT_CHANGED fires after every mutation via
    // markDirty. Both go through scheduleSync for RAF coalescing.
    composer.on(EVENTS.PROJECT_LOADED, scheduleSync);
    composer.on(EVENTS.PROJECT_CHANGED, scheduleSync);

    return () => {
      composer.off(EVENTS.COMPOSER_READY, syncFromComposer);
      composer.off(EVENTS.PROJECT_LOADED, scheduleSync);
      composer.off(EVENTS.PROJECT_CHANGED, scheduleSync);
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
