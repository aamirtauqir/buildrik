import * as React from "react";
import type { DesignToken, TokenKind } from "../types";

/**
 * Apply a token value to :root so the canvas live-previews the change
 * via CSS variables. Mirrors useColorTokens' applyToRoot. SSR-safe via
 * typeof guard; cssVar is required and validated by Zod regex
 * (`/^--[a-z0-9-]+$/`).
 */
function applyToRoot(cssVar: string, value: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(cssVar, value);
}

interface TokensForKindState {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  pendingDiff: Record<string, string>;
  isDirty: boolean;
}

interface TokensForKindActions {
  updateToken: (id: string, value: string) => void;
  undoToken: (id: string) => void;
  redoToken: (id: string) => void;
  canUndo: (id: string) => boolean;
  canRedo: (id: string) => boolean;
  markSaved: () => void;
  discardAll: () => void;
  resetFromSaved: () => void;
  /** Replace tokens + savedTokens for THIS kind from an external multi-kind set.
      Filters by kind; no-op when no entries match. Closes S1 C1 persistence gap. */
  hydrateFromExternal: (allTokens: DesignToken[]) => void;
  filterTokens: (q: string) => DesignToken[];
  addToken: (token: DesignToken) => void;
  deleteToken: (id: string) => void;
}

export type TokensForKindRegistry = TokensForKindState & TokensForKindActions;

export function useTokensForKind(
  kind: TokenKind,
  initialTokens: DesignToken[]
): TokensForKindRegistry {
  const seed = React.useMemo(
    () => initialTokens.filter((t) => t.kind === kind),
    [initialTokens, kind]
  );

  const [tokens, setTokens] = React.useState<DesignToken[]>(seed);
  const [savedTokens, setSavedTokens] = React.useState<DesignToken[]>(seed);
  const undoStackRef = React.useRef<Map<string, string[]>>(new Map());
  const redoStackRef = React.useRef<Map<string, string[]>>(new Map());

  const pendingDiff = React.useMemo<Record<string, string>>(() => {
    const diff: Record<string, string> = {};
    for (const t of tokens) {
      const saved = savedTokens.find((s) => s.id === t.id);
      if (!saved || saved.value !== t.value) {
        diff[t.id] = t.value;
      }
    }
    return diff;
  }, [tokens, savedTokens]);

  const isDirty = Object.keys(pendingDiff).length > 0;

  const updateToken = React.useCallback((id: string, value: string) => {
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const old = prev[idx];
      // No-op guard: setting the same value should not push an undo entry
      // (mirrors useColorTokens contract).
      if (old.value === value) return prev;
      const stack = undoStackRef.current.get(id) ?? [];
      stack.push(old.value);
      undoStackRef.current.set(id, stack);
      redoStackRef.current.set(id, []);
      const next = [...prev];
      next[idx] = { ...old, value };
      applyToRoot(old.cssVar, value);
      return next;
    });
  }, []);

  const undoToken = React.useCallback((id: string) => {
    const stack = undoStackRef.current.get(id);
    if (!stack || stack.length === 0) return;
    const prev = stack.pop()!;
    setTokens((cur) => {
      const idx = cur.findIndex((t) => t.id === id);
      if (idx === -1) return cur;
      const redoStack = redoStackRef.current.get(id) ?? [];
      redoStack.push(cur[idx].value);
      redoStackRef.current.set(id, redoStack);
      const next = [...cur];
      next[idx] = { ...next[idx], value: prev };
      applyToRoot(next[idx].cssVar, prev);
      return next;
    });
  }, []);

  const redoToken = React.useCallback((id: string) => {
    const stack = redoStackRef.current.get(id);
    if (!stack || stack.length === 0) return;
    const next = stack.pop()!;
    setTokens((cur) => {
      const idx = cur.findIndex((t) => t.id === id);
      if (idx === -1) return cur;
      const undoStack = undoStackRef.current.get(id) ?? [];
      undoStack.push(cur[idx].value);
      undoStackRef.current.set(id, undoStack);
      const out = [...cur];
      out[idx] = { ...out[idx], value: next };
      applyToRoot(out[idx].cssVar, next);
      return out;
    });
  }, []);

  const canUndo = React.useCallback(
    (id: string) => (undoStackRef.current.get(id) ?? []).length > 0,
    []
  );

  const canRedo = React.useCallback(
    (id: string) => (redoStackRef.current.get(id) ?? []).length > 0,
    []
  );

  const markSaved = React.useCallback(() => {
    setSavedTokens(tokens);
    undoStackRef.current.clear();
    redoStackRef.current.clear();
  }, [tokens]);

  const discardAll = React.useCallback(() => {
    setTokens(savedTokens);
    // Restore :root CSS vars to saved values so canvas snaps back.
    for (const t of savedTokens) {
      applyToRoot(t.cssVar, t.value);
    }
    undoStackRef.current.clear();
    redoStackRef.current.clear();
  }, [savedTokens]);

  const resetFromSaved = discardAll;

  const hydrateFromExternal = React.useCallback(
    (allTokens: DesignToken[]) => {
      const filtered = allTokens.filter((t) => t.kind === kind);
      if (filtered.length === 0) return;
      setTokens(filtered);
      setSavedTokens(filtered);
      for (const t of filtered) applyToRoot(t.cssVar, t.value);
      undoStackRef.current.clear();
      redoStackRef.current.clear();
    },
    [kind]
  );

  const filterTokens = React.useCallback(
    (q: string) =>
      tokens.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())),
    [tokens]
  );

  const addToken = React.useCallback((token: DesignToken) => {
    setTokens((prev) => [...prev, token]);
  }, []);

  const deleteToken = React.useCallback((id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
    undoStackRef.current.delete(id);
    redoStackRef.current.delete(id);
  }, []);

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
    hydrateFromExternal,
    filterTokens,
    addToken,
    deleteToken,
  };
}
