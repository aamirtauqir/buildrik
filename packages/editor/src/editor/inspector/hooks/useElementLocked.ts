/**
 * useElementLocked — is this element locked, kept current by the engine's
 * own ELEMENT_UPDATED (a lock from Layers, the canvas menu or the ⋯ lands
 * here without a selection change). Read-only: it never writes.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export function useElementLocked(composer: Composer | null | undefined, elementId: string | null | undefined): boolean {
  const read = React.useCallback(
    () => Boolean(elementId && composer?.elements.getElement(elementId)?.isLocked?.()),
    [composer, elementId],
  );
  const [locked, setLocked] = React.useState(read);
  React.useEffect(() => {
    setLocked(read());
    if (typeof composer?.on !== "function") return;
    const sync = () => setLocked(read());
    composer.on(EVENTS.ELEMENT_UPDATED, sync);
    composer.on(EVENTS.HISTORY_UNDO, sync);
    composer.on(EVENTS.HISTORY_REDO, sync);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, sync);
      composer.off(EVENTS.HISTORY_UNDO, sync);
      composer.off(EVENTS.HISTORY_REDO, sync);
    };
  }, [composer, read]);
  return locked;
}
