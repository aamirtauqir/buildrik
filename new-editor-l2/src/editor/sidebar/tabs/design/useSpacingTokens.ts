/**
 * useSpacingTokens — spacing token state + preset logic
 * No JSX — pure state management.
 * @license BSD-3-Clause
 */

import { useState, useCallback } from "react";
import type { DesignToken } from "./types";

export type SpacingPreset = "compact" | "normal" | "spacious";

const PRESET_MULTIPLIERS: Record<SpacingPreset, number> = {
  compact: 0.75,
  normal: 1,
  spacious: 1.375,
};

/** Base pixel values for spacing scale (at "normal" = 1x multiplier) */
const BASE_VALUES: Record<string, number> = {
  "space-1":  4,
  "space-2":  8,
  "space-3":  12,
  "space-4":  16,
  "space-5":  20,
  "space-6":  24,
  "space-8":  32,
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
}

export interface SpacingTokensActions {
  updateToken: (id: string, value: string) => void;
  applyPreset: (preset: SpacingPreset) => void;
  markSaved: () => void;
  discardAll: () => void;
  resetFromSaved: (newTokens: DesignToken[]) => void;
}

export function useSpacingTokens(initialTokens: DesignToken[]): SpacingTokensState & SpacingTokensActions {
  const spacingOnly = initialTokens.filter((t) => t.category === "spacing");

  const [tokens, setTokens] = useState<DesignToken[]>(spacingOnly);
  const [savedTokens, setSavedTokens] = useState<DesignToken[]>(spacingOnly);
  const [activePreset, setActivePreset] = useState<SpacingPreset | null>("normal");

  const isDirty = tokens.some((t, i) => t.value !== savedTokens[i]?.value);

  const updateToken = useCallback((id: string, value: string) => {
    setActivePreset(null); // Custom value — clear preset
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = prev.map((t, i) => (i === idx ? { ...t, value } : t));
      document.documentElement.style.setProperty(next[idx].cssVar, value);
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: SpacingPreset) => {
    setActivePreset(preset);
    setTokens((prev) => {
      const next = applyPresetToTokens(prev, preset);
      next.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
      return next;
    });
  }, []);

  const markSaved = useCallback(() => {
    setTokens((t) => { setSavedTokens([...t]); return t; });
  }, []);

  const discardAll = useCallback(() => {
    setTokens(savedTokens);
    savedTokens.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
    setActivePreset(null);
  }, [savedTokens]);

  const resetFromSaved = useCallback((newTokens: DesignToken[]) => {
    const spacingOnly2 = newTokens.filter((t) => t.category === "spacing");
    setTokens(spacingOnly2);
    setSavedTokens(spacingOnly2);
    setActivePreset("normal");
    spacingOnly2.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
  }, []);

  return {
    tokens,
    savedTokens,
    isDirty,
    activePreset,
    updateToken,
    applyPreset,
    markSaved,
    discardAll,
    resetFromSaved,
  };
}
