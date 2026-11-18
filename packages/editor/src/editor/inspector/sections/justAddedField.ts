/**
 * The field "+ Add field" just made (2L9 F06, 156:3684): its body reads
 * "Added to {form}." with the way back under it, and only the rows a new
 * field needs, until anything else happens — any newer history step (an
 * edit to it, an Undo) ends the state, as does selecting something else.
 *
 * The same receipt rule serves the other "just made" bodies, by kind: a
 * Tabs pair just repaired (C04 "{n} linked") and a local modal just inserted
 * from a component (C10 "Local modal created") and an element just converted
 * to another semantic tag (A13 "Content retained"), each with the element it
 * came from.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export type JustMadeKind = "field" | "tabs-linked" | "local-modal" | "semantic-converted";

let added: { elementId: string; undoCount: number; kind: JustMadeKind; fromId?: string } | null = null;
const listeners = new Set<() => void>();

/** Called right after the add's write, with the new element's id (and the one it came from). */
export function markJustAdded(composer: Composer, elementId: string, kind: JustMadeKind = "field", fromId?: string): void {
  composer.history.flushPending?.();
  added = { elementId, undoCount: composer.history.getUndoCount(), kind, fromId };
  listeners.forEach((l) => l());
}

const MOVES = [EVENTS.HISTORY_RECORDED, EVENTS.HISTORY_UNDO, EVENTS.HISTORY_REDO, EVENTS.HISTORY_CLEARED] as const;

/** Whether this element is the one just made (of this kind), still untouched. */
export function isJustAdded(composer: Composer | null | undefined, elementId: string, kind: JustMadeKind = "field"): boolean {
  return !!composer && added?.elementId === elementId && added.kind === kind && composer.history.getUndoCount() === added.undoCount;
}

/** The element a just-made one came from (C10 "Back to {component}"). */
export function justAddedFrom(composer: Composer | null | undefined, elementId: string, kind: JustMadeKind): string | undefined {
  return isJustAdded(composer, elementId, kind) ? added?.fromId : undefined;
}

/** `isJustAdded`, kept current. */
export function useJustAdded(composer: Composer | null | undefined, elementId: string, kind: JustMadeKind = "field"): boolean {
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
  return React.useSyncExternalStore(subscribe, () => isJustAdded(composer, elementId, kind));
}
