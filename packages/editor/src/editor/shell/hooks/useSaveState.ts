/**
 * useSaveState - Hook for managing document save, dirty, and undo/redo state
 *
 * Tracks whether the project has unsaved changes, the current save operation
 * status, and whether undo/redo are available.
 *
 * @module Editor/hooks/useSaveState
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SaveState } from "./useStudioState";

/** Hook return type for save state */
export interface UseSaveStateReturn {
  saveState: SaveState;
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  markDirty: () => void;
  markClean: () => void;
  canUndo: boolean;
  setCanUndo: React.Dispatch<React.SetStateAction<boolean>>;
  canRedo: boolean;
  setCanRedo: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Manages document save status, dirty flag, and undo/redo availability
 */
function useSaveState(): UseSaveStateReturn {
  const [saveState, setSaveState] = React.useState<SaveState>({
    status: "idle",
    lastSavedAt: undefined,
  });
  const [isDirty, setIsDirty] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const markDirty = React.useCallback(() => setIsDirty(true), []);
  const markClean = React.useCallback(() => setIsDirty(false), []);

  return {
    saveState,
    setSaveState,
    isDirty,
    setIsDirty,
    markDirty,
    markClean,
    canUndo,
    setCanUndo,
    canRedo,
    setCanRedo,
  };
}
