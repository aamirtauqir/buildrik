/**
 * useActivePageId — the engine's active page id, as React state. ONE copy
 * (DQ-013): the shell, the page tab bar and the Pages panel each held their
 * own, subscribed to different events, and the shell's missed a delete of the
 * active page (PageManager reassigns it and announces only PROJECT_CHANGED
 * `page:deleted`).
 *
 * Every event that can move it: PAGE_CHANGED (a switch), PROJECT_CHANGED with
 * a `page:*` type (create/delete/reorder), PROJECT_LOADED (load, undo/redo,
 * version restore — all through importProject).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export function useActivePageId(composer: Composer | null): string | null {
  const [activePageId, setActivePageId] = React.useState<string | null>(
    () => composer?.elements.getActivePage()?.id ?? null,
  );
  React.useEffect(() => {
    if (!composer) {
      setActivePageId(null);
      return;
    }
    const read = () => setActivePageId(composer.elements.getActivePage()?.id ?? null);
    const onProjectChanged = (payload?: { type?: string }) => {
      if (payload?.type?.startsWith("page:")) read();
    };
    read();
    composer.on(EVENTS.PAGE_CHANGED, read);
    composer.on(EVENTS.PROJECT_LOADED, read);
    composer.on(EVENTS.PROJECT_CHANGED, onProjectChanged);
    return () => {
      composer.off(EVENTS.PAGE_CHANGED, read);
      composer.off(EVENTS.PROJECT_LOADED, read);
      composer.off(EVENTS.PROJECT_CHANGED, onProjectChanged);
    };
  }, [composer]);
  return activePageId;
}
