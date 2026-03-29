/**
 * useTokenBase — shared token lifecycle: tokens, savedTokens, isDirty, undo/redo
 * Eliminates duplicated code across useTypeTokens and useSpacingTokens.
 * @license BSD-3-Clause
 */

import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DesignToken, UndoEntry } from "../types";

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
    return saved !== undefined && t.value !== saved.value;
  });

  const updateToken = useCallback((id: string, value: string) => {
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const oldValue = prev[idx].value;
      if (oldValue === value) return prev;
      setUndoStack((s) => ({
        ...s,
        [id]: [...(s[id] ?? []), { tokenId: id, snapshot: oldValue }],
      }));
      setRedoStack((s) => ({ ...s, [id]: [] }));
      const next = prev.map((t, i) => (i === idx ? { ...t, value } : t));
      document.documentElement.style.setProperty(next[idx].cssVar, value);
      return next;
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
          [id]: [...(r[id] ?? []), { tokenId: id, snapshot: prev[idx].value }],
        }));
        const next = prev.map((t, i) => (i === idx ? { ...t, value: entry.snapshot } : t));
        document.documentElement.style.setProperty(next[idx].cssVar, entry.snapshot);
        return next;
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
          [id]: [...(s[id] ?? []), { tokenId: id, snapshot: prev[idx].value }],
        }));
        const next = prev.map((t, i) => (i === idx ? { ...t, value: entry.snapshot } : t));
        document.documentElement.style.setProperty(next[idx].cssVar, entry.snapshot);
        return next;
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
    savedTokens.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
    setUndoStack({});
    setRedoStack({});
  }, [savedTokens]);

  const resetFromSaved = useCallback(
    (newTokens: DesignToken[]) => {
      const next = newTokens.filter((t) => t.category === category);
      setTokens(next);
      setSavedTokens(next);
      setUndoStack({});
      setRedoStack({});
      next.forEach((t) => document.documentElement.style.setProperty(t.cssVar, t.value));
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
    setTokens,
    setUndoStack,
    setRedoStack,
  };
}
