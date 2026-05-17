/**
 * useColorTokens — color diff state + per-token undo/redo
 * This hook is the SSOT for unsaved color changes in the Design tab.
 * No JSX — pure state management.
 * @license BSD-3-Clause
 */

import { useState, useCallback } from "react";
import type { DesignToken, TokenDiff, UndoEntry } from "../types";

export interface ColorTokensState {
  /** Current (possibly unsaved) token values */
  tokens: DesignToken[];
  /** Last-persisted token values (from Apply or initial load) */
  savedTokens: DesignToken[];
  /** Per-token diff map — tokens with unsaved changes */
  pendingDiff: Record<string, TokenDiff>;
  /** Whether any token differs from savedTokens */
  isDirty: boolean;
}

export interface ColorTokensActions {
  /** Stage a color change + apply to :root for live preview */
  updateToken: (id: string, value: string) => void;
  /** Undo the last change for a specific token */
  undoToken: (id: string) => void;
  /** Redo the last undone change for a specific token */
  redoToken: (id: string) => void;
  /** Check if undo is available for a token */
  canUndo: (id: string) => boolean;
  /** Check if redo is available for a token */
  canRedo: (id: string) => boolean;
  /** Mark current tokens as saved (called after Apply) */
  markSaved: () => void;
  /** Revert all changes to savedTokens */
  discardAll: () => void;
  /** Replace savedTokens with new array (called after Composer load) */
  resetFromSaved: (newTokens: DesignToken[]) => void;
  /** Filter tokens by search query */
  filterTokens: (query: string) => DesignToken[];
  /** Add a new token to the list */
  addToken: (token: DesignToken) => void;
  /**
   * Delete a token by id.
   *
   * Modes:
   *   - **Hard delete** `deleteToken(id)` — removes token from registry.
   *     Caller must ensure no consumers, else bindings break silently.
   *   - **Soft delete** `deleteToken(id, { replaceWith })` — token stays in
   *     registry with `replacedBy: replaceWith` set. Resolver follows the
   *     bridge so all consumer bindings transparently redirect to the
   *     replacement. B4 lock 2026-05-16. Sweep at v5 hard-removes the
   *     bridged token after 2-version retention window.
   */
  deleteToken: (id: string, options?: { replaceWith?: string }) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
//
// Phase B.2: applyToRoot removed. CSS-var application is centralized in
// TokenRegistryProvider's effect, which re-resolves through composer.darkResolver
// on every colorState.tokens change AND on colorMode:changed events.

export function useColorTokens(
  initialTokens: DesignToken[]
): ColorTokensState & ColorTokensActions {
  const colorOnly = initialTokens.filter((t) => t.category === "colors");

  const [tokens, setTokens] = useState<DesignToken[]>(colorOnly);
  const [savedTokens, setSavedTokens] = useState<DesignToken[]>(colorOnly);
  // undoStack[id] = stack of previous values (most recent last)
  const [undoStack, setUndoStack] = useState<Record<string, UndoEntry[]>>({});
  // redoStack[id] = stack of undone values
  const [redoStack, setRedoStack] = useState<Record<string, UndoEntry[]>>({});

  // Derive pendingDiff from tokens vs savedTokens.
  // B4 (2026-05-16): replacedBy soft-delete also counts as a change.
  const pendingDiff: Record<string, TokenDiff> = {};
  tokens.forEach((token, i) => {
    const saved = savedTokens[i];
    if (saved && (token.value !== saved.value || token.replacedBy !== saved.replacedBy)) {
      pendingDiff[token.id] = {
        tokenId: token.id,
        previousValue: saved.value,
        currentValue: token.value,
      };
    }
  });

  const isDirty = Object.keys(pendingDiff).length > 0 || tokens.length !== savedTokens.length;

  // ─ updateToken ─
  const updateToken = useCallback((id: string, value: string) => {
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;

      const oldValue = prev[idx].value;
      if (oldValue === value) return prev;

      // Push undo entry
      setUndoStack((prevStack) => {
        const existing = prevStack[id] ?? [];
        return { ...prevStack, [id]: [...existing, { tokenId: id, snapshot: oldValue }] };
      });
      // Clear redo stack for this token
      setRedoStack((prevRedo) => ({ ...prevRedo, [id]: [] }));

      const next = prev.map((t, i) => (i === idx ? { ...t, value } : t));
      return next;
    });
  }, []);

  // ─ undoToken ─
  const undoToken = useCallback((id: string) => {
    setUndoStack((prevStack) => {
      const stack = prevStack[id];
      if (!stack || stack.length === 0) return prevStack;

      const entry = stack[stack.length - 1];
      const newStack = stack.slice(0, -1);

      setTokens((prevTokens) => {
        const idx = prevTokens.findIndex((t) => t.id === id);
        if (idx === -1) return prevTokens;

        // Push current to redo
        setRedoStack((prevRedo) => {
          const redoList = prevRedo[id] ?? [];
          return {
            ...prevRedo,
            [id]: [...redoList, { tokenId: id, snapshot: prevTokens[idx].value }],
          };
        });

        const next = prevTokens.map((t, i) => (i === idx ? { ...t, value: entry.snapshot } : t));
        return next;
      });

      return { ...prevStack, [id]: newStack };
    });
  }, []);

  // ─ redoToken ─
  const redoToken = useCallback((id: string) => {
    setRedoStack((prevRedo) => {
      const stack = prevRedo[id];
      if (!stack || stack.length === 0) return prevRedo;

      const entry = stack[stack.length - 1];
      const newStack = stack.slice(0, -1);

      setTokens((prevTokens) => {
        const idx = prevTokens.findIndex((t) => t.id === id);
        if (idx === -1) return prevTokens;

        // Push current back to undo
        setUndoStack((prevUndo) => {
          const undoList = prevUndo[id] ?? [];
          return {
            ...prevUndo,
            [id]: [...undoList, { tokenId: id, snapshot: prevTokens[idx].value }],
          };
        });

        const next = prevTokens.map((t, i) => (i === idx ? { ...t, value: entry.snapshot } : t));
        return next;
      });

      return { ...prevRedo, [id]: newStack };
    });
  }, []);

  const canUndo = useCallback((id: string) => (undoStack[id]?.length ?? 0) > 0, [undoStack]);

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
    setTokens((prev) => {
      const reverted = prev.map((token, i) => {
        const saved = savedTokens[i];
        if (saved && token.value !== saved.value) {
          return { ...token, value: saved.value };
        }
        return token;
      });
      return reverted;
    });
    setUndoStack({});
    setRedoStack({});
  }, [savedTokens]);

  const resetFromSaved = useCallback((newTokens: DesignToken[]) => {
    const colorOnly2 = newTokens.filter((t) => t.category === "colors");
    setTokens(colorOnly2);
    setSavedTokens(colorOnly2);
    setUndoStack({});
    setRedoStack({});
  }, []);

  const addToken = useCallback((token: DesignToken) => {
    setTokens((prev) => [...prev, token]);
    setUndoStack((s) => ({ ...s, [token.id]: [] }));
    setRedoStack((s) => ({ ...s, [token.id]: [] }));
  }, []);

  const deleteToken = useCallback((id: string, options?: { replaceWith?: string }) => {
    // B4 (2026-05-16): soft-delete via B1 replacedBy bridge when replaceWith
    // provided. Token stays in registry; resolver redirects consumers.
    if (options?.replaceWith !== undefined) {
      setTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, replacedBy: options.replaceWith } : t))
      );
      return;
    }
    // Hard delete (caller asserts no consumers).
    setTokens((prev) => prev.filter((t) => t.id !== id));
    setUndoStack((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
    setRedoStack((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  }, []);

  const filterTokens = useCallback(
    (query: string): DesignToken[] => {
      if (!query.trim()) return tokens;
      const q = query.toLowerCase();
      return tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.value.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    },
    [tokens]
  );

  return {
    tokens,
    savedTokens,
    pendingDiff,
    isDirty,
    updateToken,
    undoToken,
    redoToken,
    canUndo,
    canRedo,
    markSaved,
    discardAll,
    resetFromSaved,
    filterTokens,
    addToken,
    deleteToken,
  };
}
