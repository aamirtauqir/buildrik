/**
 * useTokenBase — shared token lifecycle: tokens, savedTokens, isDirty, undo/redo
 * Eliminates duplicated code across useTypeTokens and useSpacingTokens.
 * @license BSD-3-Clause
 */

import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken, UndoEntry } from "../types";

const lightOf = (tokens: readonly DesignToken[], id: string): string =>
  resolveTokenLiteral(tokens, id, "light") ?? "";

export interface TokenBaseState {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  isDirty: boolean;
}

export interface TokenBaseActions {
  updateToken: (id: string, value: string) => void;
  markSaved: () => void;
  discardAll: () => void;
  resetFromSaved: (newTokens: DesignToken[]) => void;
  /** Load a token set as a pending change (savedTokens untouched). */
  stageTokens: (newTokens: DesignToken[]) => void;
  undoToken: (id: string) => void;
  redoToken: (id: string) => void;
  canUndo: (id: string) => boolean;
  canRedo: (id: string) => boolean;
}

/** Escape hatch for hooks that need direct state access (preset logic, etc.) */
export interface TokenBaseInternals {
  setTokens: Dispatch<SetStateAction<DesignToken[]>>;
  setUndoStack: Dispatch<SetStateAction<Record<string, UndoEntry[]>>>;
  setRedoStack: Dispatch<SetStateAction<Record<string, UndoEntry[]>>>;
}

export function useTokenBase(
  initialTokens: DesignToken[],
  category: string
): TokenBaseState & TokenBaseActions & TokenBaseInternals {
  const filtered = initialTokens.filter((t) => t.category === category);
  const [tokens, setTokens] = useState<DesignToken[]>(filtered);
  const [savedTokens, setSavedTokens] = useState<DesignToken[]>(filtered);
  const [undoStack, setUndoStack] = useState<Record<string, UndoEntry[]>>({});
  const [redoStack, setRedoStack] = useState<Record<string, UndoEntry[]>>({});

  const isDirty = tokens.some((t) => {
    const saved = savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && lightOf(tokens, t.id) !== lightOf(savedTokens, t.id);
  });

  const updateToken = useCallback((id: string, value: string) => {
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const oldValue = lightOf(prev, id);
      if (oldValue === value) return prev;
      setUndoStack((s) => ({
        ...s,
        [id]: [...(s[id] ?? []), { tokenId: id, snapshot: oldValue }],
      }));
      setRedoStack((s) => ({ ...s, [id]: [] }));
      document.documentElement.style.setProperty(prev[idx].cssVar, value);
      return setTokenLiteral(prev, id, "light", value);
    });
  }, []);

  const undoToken = useCallback((id: string) => {
    setUndoStack((s) => {
      const stack = s[id];
      if (!stack?.length) return s;
      const entry = stack[stack.length - 1];
      setTokens((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        setRedoStack((r) => ({
          ...r,
          [id]: [...(r[id] ?? []), { tokenId: id, snapshot: lightOf(prev, id) }],
        }));
        document.documentElement.style.setProperty(prev[idx].cssVar, entry.snapshot);
        return setTokenLiteral(prev, id, "light", entry.snapshot);
      });
      return { ...s, [id]: stack.slice(0, -1) };
    });
  }, []);

  const canUndo = useCallback((id: string) => (undoStack[id]?.length ?? 0) > 0, [undoStack]);

  const redoToken = useCallback((id: string) => {
    setRedoStack((r) => {
      const stack = r[id];
      if (!stack?.length) return r;
      const entry = stack[stack.length - 1];
      setTokens((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        setUndoStack((s) => ({
          ...s,
          [id]: [...(s[id] ?? []), { tokenId: id, snapshot: lightOf(prev, id) }],
        }));
        document.documentElement.style.setProperty(prev[idx].cssVar, entry.snapshot);
        return setTokenLiteral(prev, id, "light", entry.snapshot);
      });
      return { ...r, [id]: stack.slice(0, -1) };
    });
  }, []);

  const canRedo = useCallback((id: string) => (redoStack[id]?.length ?? 0) > 0, [redoStack]);

  const markSaved = useCallback(() => {
    setTokens((t) => {
      setSavedTokens([...t]);
      return t;
    });
    setUndoStack({});
    setRedoStack({});
  }, []);

  const discardAll = useCallback(() => {
    setTokens(savedTokens);
    savedTokens.forEach((t) => document.documentElement.style.setProperty(t.cssVar, lightOf(savedTokens, t.id)));
    setUndoStack({});
    setRedoStack({});
  }, [savedTokens]);

  /**
   * Load a whole token set as an UNSAVED change: `tokens` moves, `savedTokens`
   * does not, so `pendingDiff` shows every difference and the panel's footer
   * offers Review & Apply.
   *
   * This is what applying a starter needs. `resetFromSaved` sets both halves,
   * which made the panel read "All changes saved" over tokens the project had
   * never been told about — the starter reached localStorage and the live CSS
   * vars and stopped there, so the site published its old palette.
   */
  const stageTokens = useCallback(
    (newTokens: DesignToken[]) => {
      const next = newTokens.filter((t) => t.category === category);
      setTokens(next);
      setUndoStack({});
      setRedoStack({});
      next.forEach((t) => document.documentElement.style.setProperty(t.cssVar, lightOf(next, t.id)));
    },
    [category]
  );

  const resetFromSaved = useCallback(
    (newTokens: DesignToken[]) => {
      const next = newTokens.filter((t) => t.category === category);
      setTokens(next);
      setSavedTokens(next);
      setUndoStack({});
      setRedoStack({});
      next.forEach((t) => document.documentElement.style.setProperty(t.cssVar, lightOf(next, t.id)));
    },
    [category]
  );

  return {
    tokens,
    savedTokens,
    isDirty,
    updateToken,
    undoToken,
    canUndo,
    redoToken,
    canRedo,
    markSaved,
    discardAll,
    resetFromSaved,
    stageTokens,
    setTokens,
    setUndoStack,
    setRedoStack,
  };
}
