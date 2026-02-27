/**
 * useTypeTokens — typography scale state + mutations
 * No JSX — pure state management.
 * @license BSD-3-Clause
 */

import { useState, useCallback } from "react";
import type { DesignToken } from "./types";

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
}

export function useTypeTokens(initialTokens: DesignToken[]): TypeTokensState & TypeTokensActions {
  const typeOnly = initialTokens.filter((t) => t.category === "typography");

  const [tokens, setTokens] = useState<DesignToken[]>(typeOnly);
  const [savedTokens, setSavedTokens] = useState<DesignToken[]>(typeOnly);
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>("desktop");

  const isDirty = tokens.some((t, i) => t.value !== savedTokens[i]?.value);

  const updateToken = useCallback((id: string, value: string) => {
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = prev.map((t, i) => (i === idx ? { ...t, value } : t));
      document.documentElement.style.setProperty(next[idx].cssVar, value);
      return next;
    });
  }, []);

  const markSaved = useCallback(() => {
    setTokens((t) => { setSavedTokens([...t]); return t; });
  }, []);

  const discardAll = useCallback(() => {
    setTokens(savedTokens);
    savedTokens.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
  }, [savedTokens]);

  const resetFromSaved = useCallback((newTokens: DesignToken[]) => {
    const typeOnly2 = newTokens.filter((t) => t.category === "typography");
    setTokens(typeOnly2);
    setSavedTokens(typeOnly2);
    typeOnly2.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
  }, []);

  return {
    tokens,
    savedTokens,
    isDirty,
    responsiveMode,
    updateToken,
    markSaved,
    discardAll,
    resetFromSaved,
    setResponsiveMode,
  };
}
