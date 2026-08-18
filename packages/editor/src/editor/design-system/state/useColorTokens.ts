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
  /** Stage a color change + apply to :root for live preview. Optional
   *  darkValue carries the dark-mode variant (used by token import so a
   *  dark-complete export isn't stripped on the modify path). */
  updateToken: (id: string, value: string, darkValue?: string) => void;
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
  /** Load a token set as a PENDING change — what applying a starter does. */
  stageTokens: (newTokens: DesignToken[]) => void;
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
  /**
   * Rename a token id while preserving consumer references via the B1
   * `replacedBy` bridge. Appends a new token carrying `newId` (cssVar
   * derived from `--buildrick-design-${newId}`) and writes `replacedBy:
   * newId` on the old token. Both stay in the registry; resolver redirects
   * old → new for all consumers.
   *
   * No-op when `oldId` is missing or `newId` already exists (collision).
   * B1 follow-up 2026-05-17.
   */
  renameToken: (oldId: string, newId: string) => void;
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
  // §2-B13 (2026-07): match savedTokens BY ID, not by array index. Once
  // addToken / hard deleteToken shifts the array, index pairing misattributes
  // a change to the wrong token (and discardAll would then overwrite an
  // untouched token with a different token's saved value). Mirrors
  // useTokensForKind's id-keyed lookup.
  // B4 (2026-05-16): replacedBy soft-delete also counts as a change.
  const pendingDiff: Record<string, TokenDiff> = {};
  tokens.forEach((token) => {
    const saved = savedTokens.find((s) => s.id === token.id);
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
  const updateToken = useCallback((id: string, value: string, darkValue?: string) => {
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;

      const old = prev[idx];
      const darkChanged = darkValue !== undefined && darkValue !== old.darkValue;
      // No-op guard: skip if neither the light nor the dark value changes.
      if (old.value === value && !darkChanged) return prev;

      // Undo history tracks the light value only — push an entry only when the
      // light value actually changes (a dark-only edit is not its own step).
      if (old.value !== value) {
        setUndoStack((prevStack) => {
          const existing = prevStack[id] ?? [];
          return { ...prevStack, [id]: [...existing, { tokenId: id, snapshot: old.value }] };
        });
        setRedoStack((prevRedo) => ({ ...prevRedo, [id]: [] }));
      }

      const next = prev.map((t, i) =>
        i === idx ? { ...t, value, ...(darkValue !== undefined ? { darkValue } : {}) } : t
      );
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
    // §2-B13 (2026-07): revert wholesale to savedTokens (id-keyed truth),
    // matching useTokensForKind. The prior index-paired revert corrupted
    // untouched tokens after an add/delete shifted the array. CSS-var
    // re-application is centralized in TokenRegistryProvider's effect, which
    // re-resolves on this tokens change.
    setTokens(savedTokens);
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

  /* Same load, but savedTokens is left alone so the change is PENDING and the
     panel offers Review & Apply. CSS vars are re-applied by the provider's
     effect on this tokens change, as with every other edit here. */
  const stageTokens = useCallback((newTokens: DesignToken[]) => {
    setTokens(newTokens.filter((t) => t.category === "colors"));
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

  const renameToken = useCallback((oldId: string, newId: string) => {
    setTokens((prev) => {
      const src = prev.find((t) => t.id === oldId);
      if (!src) return prev;
      if (prev.some((t) => t.id === newId)) return prev;
      const fresh: DesignToken = {
        ...src,
        id: newId,
        cssVar: `--buildrick-design-${newId}`,
        replacedBy: undefined,
      };
      return prev.map((t) => (t.id === oldId ? { ...t, replacedBy: newId } : t)).concat(fresh);
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
    stageTokens,
    filterTokens,
    addToken,
    deleteToken,
    renameToken,
  };
}
