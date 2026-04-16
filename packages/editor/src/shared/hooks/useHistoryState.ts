/**
 * useHistoryState - Bridge between engine history events and React state
 * Part of Phase 2: Custom hooks for History Tab redesign
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { HistoryDisplayEntry } from "../../engine/HistoryManager";
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

    // Listen for history changes
    composer.on(EVENTS.HISTORY_RECORDED, updateState);
    composer.on(EVENTS.HISTORY_UNDO, updateState);
    composer.on(EVENTS.HISTORY_REDO, updateState);
    composer.on(EVENTS.HISTORY_CLEARED, updateState);

    return () => {
      composer.off(EVENTS.HISTORY_RECORDED, updateState);
      composer.off(EVENTS.HISTORY_UNDO, updateState);
      composer.off(EVENTS.HISTORY_REDO, updateState);
      composer.off(EVENTS.HISTORY_CLEARED, updateState);
    };
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
    if (composer?.history) {
      composer.history.clear();
      // Record initial state after clear so undo works again
      composer.history.forceCheckpoint("Cleared history");
    }
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