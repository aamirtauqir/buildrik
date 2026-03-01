/**
 * useTypeTokens — typography scale state + mutations
 * No JSX — pure state management.
 * @license BSD-3-Clause
 */

import { useState } from "react";
import type { DesignToken } from "../types";
import { useTokenBase } from "./useTokenBase";

export type ResponsiveMode = "desktop" | "mobile";

export interface TypeTokensState {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  isDirty: boolean;
  responsiveMode: ResponsiveMode;
}

export interface TypeTokensActions {
  updateToken: (id: string, value: string) => void;
  markSaved: () => void;
  discardAll: () => void;
  resetFromSaved: (newTokens: DesignToken[]) => void;
  setResponsiveMode: (mode: ResponsiveMode) => void;
  undoToken: (id: string) => void;
  canUndo: (id: string) => boolean;
  redoToken: (id: string) => void;
  canRedo: (id: string) => boolean;
}

export function useTypeTokens(initialTokens: DesignToken[]): TypeTokensState & TypeTokensActions {
  const base = useTokenBase(initialTokens, "typography");
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>("desktop");

  return {
    tokens: base.tokens,
    savedTokens: base.savedTokens,
    isDirty: base.isDirty,
    responsiveMode,
    updateToken: base.updateToken,
    undoToken: base.undoToken,
    canUndo: base.canUndo,
    redoToken: base.redoToken,
    canRedo: base.canRedo,
    markSaved: base.markSaved,
    discardAll: base.discardAll,
    resetFromSaved: base.resetFromSaved,
    setResponsiveMode,
  };
}
