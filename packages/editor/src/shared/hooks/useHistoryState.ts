/**
 * useHistoryState - Bridge between engine history events and React state
 * Part of Phase 2: Custom hooks for History Tab redesign
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { HistoryDisplayEntry } from "@/engine/HistoryManager";
import { EVENTS } from "../constants/events";

export interface UseHistoryStateReturn {
  /** Current history stack (chronological, most recent first) */
  historyStack: HistoryDisplayEntry[];
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Perform undo */
  undo: () => void;
  /** Perform redo */
  redo: () => void;
  /** Clear all history */
  clear: () => void;
  /** Loading state */
  isLoading: boolean;
}

export function useHistoryState(composer: Composer | null): UseHistoryStateReturn {
  const [historyStack, setHistoryStack] = React.useState<HistoryDisplayEntry[]>([]);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!composer?.history) {
      setHistoryStack([]);
      setCanUndo(false);
      setCanRedo(false);
      setIsLoading(false);
      return;
    }

    const updateState = () => {
      setHistoryStack(composer.history.getHistoryStack());
      setCanUndo(composer.history.canUndo());
      setCanRedo(composer.history.canRedo());
      setIsLoading(false);
    };

    // Initial load
    updateState();

    /* Every event after which canUndo()/canRedo() may have changed.
       `importProject` (project load, undo/redo internals, version restore)
       emits only project:loaded, and version restore adds version:restored —
       neither is a history:* event, and without them the topbar's Undo kept
       whatever the last history event left it as. HISTORY_UNRECORDED: a
       change made outside history; HISTORY_CHANGED: the declared catch-all. */
    const events = [
      EVENTS.HISTORY_RECORDED,
      EVENTS.HISTORY_UNDO,
      EVENTS.HISTORY_REDO,
      EVENTS.HISTORY_CLEARED,
      EVENTS.HISTORY_CHANGED,
      EVENTS.HISTORY_UNRECORDED,
      EVENTS.PROJECT_LOADED,
      EVENTS.VERSION_RESTORED,
    ];
    events.forEach((e) => composer.on(e, updateState));

    return () => events.forEach((e) => composer.off(e, updateState));
  }, [composer]);

  const undo = React.useCallback(() => {
    if (composer?.history?.canUndo()) {
      composer.history.undo();
    }
  }, [composer]);

  const redo = React.useCallback(() => {
    if (composer?.history?.canRedo()) {
      composer.history.redo();
    }
  }, [composer]);

  const clear = React.useCallback(() => {
    // history.clear() now re-seeds its own baseline checkpoint, so the old
    // compensating forceCheckpoint here would leave TWO checkpoints — making
    // canUndo() true right after a clear (undo to an identical state).
    composer?.history?.clear();
  }, [composer]);

  return {
    historyStack,
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    isLoading,
  };
}