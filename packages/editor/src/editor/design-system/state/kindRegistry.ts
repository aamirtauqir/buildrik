/**
 * kindRegistry — one kind's tokens as the project holds them, and the edits
 * Brand makes to them. Every edit is one write of the whole set through the
 * provider's commit (useSessionEdits → `composer.designSystem.setTokens`), so
 * Brand and the canvas share one undo stack (spec §4) and every write is a
 * Review-changes row. Nothing is staged and nothing is kept locally.
 *
 * Writes return false when refused (read-only tokens, a set that does not
 * validate — e.g. deleting a token another one aliases — or no composer).
 *
 * @license BSD-3-Clause
 */
import { setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken, TokenKind } from "../types";

type Commit = (next: DesignToken[], label: string) => boolean;

/** One kind's read + edit surface over the whole set. Pure: the provider builds
 *  every kind from ONE project read and ONE (logged) commit. */
export function kindRegistry(kind: TokenKind, all: DesignToken[], commit: Commit) {
  const tokens = all.filter((t) => t.kind === kind);
  return {
    tokens,
    updateToken: (id: string, value: string, mode: "light" | "dark" = "light") =>
      commit(setTokenLiteral(all, id, mode, value), "Edit token"),
    addToken: (token: DesignToken) =>
      !all.some((t) => t.id === token.id) && commit([...all, token], "Add token"),
    /** `replaceWith` soft-deletes through the B1 `replacedBy` bridge (B4):
     *  the token stays and resolvers follow it to the replacement. */
    deleteToken: (id: string, opts?: { replaceWith?: string }) =>
      commit(
        opts?.replaceWith !== undefined
          ? all.map((t) => (t.id === id ? { ...t, replacedBy: opts.replaceWith } : t))
          : all.filter((t) => t.id !== id),
        "Delete token",
      ),
    /** B1 rename: the new id joins as a copy and the old one bridges to it
     *  (`replacedBy`), so every binding to the old id keeps resolving. */
    renameToken: (oldId: string, newId: string) => {
      const old = all.find((t) => t.id === oldId);
      if (!old || all.some((t) => t.id === newId)) return false;
      const renamed: DesignToken = { ...old, id: newId, cssVar: `--buildrick-design-${newId}`, replacedBy: undefined };
      return commit(
        [...all.map((t) => (t.id === oldId ? { ...t, replacedBy: newId } : t)), renamed],
        "Rename token",
      );
    },
    filterTokens: (q: string) => {
      const s = q.trim().toLowerCase();
      return s ? tokens.filter((t) => t.name.toLowerCase().includes(s) || t.id.includes(s)) : tokens;
    },
  };
}

export type TokensForKindRegistry = ReturnType<typeof kindRegistry>;
