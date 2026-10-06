import * as React from "react";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken, TokenKind } from "../types";

const lightOf = (tokens: readonly DesignToken[], id: string): string =>
  resolveTokenLiteral(tokens, id, "light") ?? "";

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
  /** Delete a token. Pass `{ replaceWith }` for soft-delete via replacedBy bridge (B4 lock 2026-05-16). */
  deleteToken: (id: string, options?: { replaceWith?: string }) => void;
  /** Rename a token via B1 replacedBy bridge. Appends a new token with `newId` and
   *  writes replacedBy on the old. No-op on missing oldId or duplicate newId. */
  renameToken: (oldId: string, newId: string) => void;
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
      const value = lightOf(tokens, t.id);
      // B4 (2026-05-16): replacedBy soft-delete also counts as a change so
      // isDirty fires for soft-deletes that don't touch the token's value.
      if (!saved || lightOf(savedTokens, t.id) !== value || saved.replacedBy !== t.replacedBy) {
        diff[t.id] = value;
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
      const oldValue = lightOf(prev, id);
      // No-op guard: setting the same value should not push an undo entry
      // (mirrors useColorTokens contract).
      if (oldValue === value) return prev;
      const stack = undoStackRef.current.get(id) ?? [];
      stack.push(oldValue);
      undoStackRef.current.set(id, stack);
      redoStackRef.current.set(id, []);
      applyToRoot(old.cssVar, value);
      return setTokenLiteral(prev, id, "light", value);
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
      redoStack.push(lightOf(cur, id));
      redoStackRef.current.set(id, redoStack);
      applyToRoot(cur[idx].cssVar, prev);
      return setTokenLiteral(cur, id, "light", prev);
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
      undoStack.push(lightOf(cur, id));
      undoStackRef.current.set(id, undoStack);
      applyToRoot(cur[idx].cssVar, next);
      return setTokenLiteral(cur, id, "light", next);
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
      applyToRoot(t.cssVar, lightOf(savedTokens, t.id));
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
      for (const t of filtered) applyToRoot(t.cssVar, lightOf(filtered, t.id));
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

  const renameToken = React.useCallback((oldId: string, newId: string) => {
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

  const deleteToken = React.useCallback((id: string, options?: { replaceWith?: string }) => {
    // B4 (2026-05-16): soft-delete via replacedBy bridge — token stays,
    // resolver redirects to replaceWith. Hard delete only when no replacement.
    if (options?.replaceWith !== undefined) {
      setTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, replacedBy: options.replaceWith } : t))
      );
      return;
    }
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
    renameToken,
  };
}
