/**
 * The field "+ Add field" just made (2L9 F06, 156:3684): its body reads
 * "Added to {form}." with the way back under it, and only the rows a new
 * field needs, until anything else happens — any newer history step (an
 * edit to it, an Undo) ends the state, as does selecting something else.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

let added: { elementId: string; undoCount: number } | null = null;
const listeners = new Set<() => void>();

/** Called right after the add's write, with the new field's id. */
export function markJustAdded(composer: Composer, elementId: string): void {
  composer.history.flushPending?.();
  added = { elementId, undoCount: composer.history.getUndoCount() };
  listeners.forEach((l) => l());
}

const MOVES = [EVENTS.HISTORY_RECORDED, EVENTS.HISTORY_UNDO, EVENTS.HISTORY_REDO, EVENTS.HISTORY_CLEARED] as const;

/** Whether this element is the field just added, still untouched. */
export function isJustAdded(composer: Composer | null | undefined, elementId: string): boolean {
  return !!composer && added?.elementId === elementId && composer.history.getUndoCount() === added.undoCount;
}

/** `isJustAdded`, kept current. */
export function useJustAdded(composer: Composer | null | undefined, elementId: string): boolean {
  const subscribe = React.useCallback(
    (l: () => void) => {
      listeners.add(l);
      for (const ev of MOVES) composer?.on?.(ev, l);
      return () => {
        listeners.delete(l);
        for (const ev of MOVES) composer?.off?.(ev, l);
      };
    },
    [composer],
  );
  return React.useSyncExternalStore(subscribe, () => isJustAdded(composer, elementId));
}
