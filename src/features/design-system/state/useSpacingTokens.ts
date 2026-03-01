/**
 * useSpacingTokens — spacing token state + preset logic
 * No JSX — pure state management.
 * @license BSD-3-Clause
 */

import { useState, useCallback } from "react";
import type { DesignToken } from "../types";
import { useTokenBase } from "./useTokenBase";

export type SpacingPreset = "compact" | "normal" | "spacious";

const PRESET_MULTIPLIERS: Record<SpacingPreset, number> = {
  compact: 0.75,
  normal: 1,
  spacious: 1.375,
};

/** Base pixel values for spacing scale (at "normal" = 1x multiplier) */
const BASE_VALUES: Record<string, number> = {
  "space-1": 4,
  "space-2": 8,
  "space-3": 12,
  "space-4": 16,
  "space-5": 20,
  "space-6": 24,
  "space-8": 32,
  "space-10": 40,
  "space-12": 48,
};

function applyPresetToTokens(tokens: DesignToken[], preset: SpacingPreset): DesignToken[] {
  const multiplier = PRESET_MULTIPLIERS[preset];
  return tokens.map((t) => {
    const base = BASE_VALUES[t.id];
    if (base === undefined) return t;
    const newValue = `${Math.round(base * multiplier)}px`;
    return { ...t, value: newValue };
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
