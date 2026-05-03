/**
 * useSpacingTokens — spacing token state + preset logic
 * No JSX — pure state management.
 * @license BSD-3-Clause
 */

import { useState, useCallback } from "react";
import type { DesignToken } from "../types";
import { useTokenBase } from "./useTokenBase";

export type SpacingPreset = "compact" | "normal" | "spacious";

/** Explicit pixel values per preset — all values on the 4px grid */
const PRESET_VALUES: Record<SpacingPreset, Record<string, number>> = {
  compact: {
    "space-1": 2, "space-2": 6, "space-3": 8, "space-4": 12,
    "space-5": 16, "space-6": 20, "space-8": 24, "space-10": 32, "space-12": 40,
  },
  normal: {
    "space-1": 4, "space-2": 8, "space-3": 12, "space-4": 16,
    "space-5": 20, "space-6": 24, "space-8": 32, "space-10": 40, "space-12": 48,
  },
  spacious: {
    "space-1": 6, "space-2": 12, "space-3": 16, "space-4": 20,
    "space-5": 24, "space-6": 32, "space-8": 40, "space-10": 48, "space-12": 64,
  },
};

function applyPresetToTokens(tokens: DesignToken[], preset: SpacingPreset): DesignToken[] {
  const values = PRESET_VALUES[preset];
  return tokens.map((t) => {
    const px = values[t.id];
    if (px === undefined) return t;
    return { ...t, value: `${px}px` };
  });
}

export interface SpacingTokensState {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  isDirty: boolean;
  activePreset: SpacingPreset | null;
  savedPreset: SpacingPreset | null;
}

export interface SpacingTokensActions {
  updateToken: (id: string, value: string) => void;
  applyPreset: (preset: SpacingPreset) => void;
  markSaved: () => void;
  discardAll: () => void;
  resetFromSaved: (newTokens: DesignToken[]) => void;
  stageDefaults: (defaultTokens: DesignToken[]) => void;
  undoToken: (id: string) => void;
  canUndo: (id: string) => boolean;
  redoToken: (id: string) => void;
  canRedo: (id: string) => boolean;
}

export function useSpacingTokens(
  initialTokens: DesignToken[]
): SpacingTokensState & SpacingTokensActions {
  const base = useTokenBase(initialTokens, "spacing");
  const {
    setTokens,
    setUndoStack,
    setRedoStack,
    updateToken: baseUpdateToken,
    markSaved: baseMarkSaved,
    discardAll: baseDiscardAll,
  } = base;
  const [activePreset, setActivePreset] = useState<SpacingPreset | null>("normal");
  const [savedPreset, setSavedPreset] = useState<SpacingPreset | null>("normal");

  // Spacing-specific: clear preset when a token is manually edited
  const updateToken = useCallback(
    (id: string, value: string) => {
      setActivePreset(null);
      baseUpdateToken(id, value);
    },
    [baseUpdateToken]
  );

  const applyPreset = useCallback(
    (preset: SpacingPreset) => {
      setActivePreset(preset);
      setUndoStack({});
      setRedoStack({});
      setTokens((prev) => {
        const next = applyPresetToTokens(prev, preset);
        next.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
        return next;
      });
    },
    [setTokens, setUndoStack, setRedoStack]
  );

  const markSaved = useCallback(() => {
    baseMarkSaved();
    setSavedPreset(activePreset);
  }, [baseMarkSaved, activePreset]);

  const discardAll = useCallback(() => {
    baseDiscardAll();
    setActivePreset(savedPreset);
  }, [baseDiscardAll, savedPreset]);

  const stageDefaults = useCallback(
    (defaultTokens: DesignToken[]) => {
      const spacingDefaults = defaultTokens.filter((t) => t.category === "spacing");
      setTokens(spacingDefaults);
      setActivePreset("normal");
      setUndoStack({});
      setRedoStack({});
      spacingDefaults.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
    },
    [setTokens, setUndoStack, setRedoStack]
  );

  return {
    tokens: base.tokens,
    savedTokens: base.savedTokens,
    isDirty: base.isDirty,
    activePreset,
    savedPreset,
    updateToken,
    applyPreset,
    undoToken: base.undoToken,
    canUndo: base.canUndo,
    redoToken: base.redoToken,
    canRedo: base.canRedo,
    markSaved,
    discardAll,
    resetFromSaved: base.resetFromSaved,
    stageDefaults,
  };
}
