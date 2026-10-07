/**
 * useImportTokens — writes incoming DesignTokens into the site's tokens, as
 * ONE `setTokens` write (one ⌘Z, refused while read-only). Rule per token:
 *   1. Its id already exists → that token takes the incoming light (and dark)
 *      value, whatever kind the incoming row claims.
 *   2. Otherwise → it joins under its kind (`kind`, else the `category`
 *      fallback); type and spacing are fixed sets, so new ids there are
 *      recorded in `skipped`, as are rows with no routable kind.
 *
 * Returns a `Stats` object so the UI can show "n modified, m added, k skipped".
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken, TokenKind } from "../types";
import { useProjectTokenStore } from "./TokenRegistryContext";

export interface ImportStats {
  modified: number;
  added: number;
  skipped: string[];
  /** The write was refused (read-only tokens, or the result does not
   *  validate): nothing was imported, whatever the counts say. */
  refused: boolean;
}

/* Type and spacing are fixed sets: an import may change their values, never add to them. */
const NO_ADD: readonly TokenKind[] = ["type", "spacing"];

/**
 * Which registry a token belongs to. `kind` is authoritative; `category` is a
 * COARSER taxonomy (9 values against 14 kinds — radius, shadow, motion and
 * border can all be "effects"), so it can only resolve the three kinds that
 * happen to have a category of their own. Everything else needs `kind`.
 *
 * Exported because the import preflight has to apply exactly this rule: a token
 * this returns null for cannot be applied, and counting it as "valid" is what
 * produced "Valid tokens 3 / Errors 0" followed by a silent "2 skipped".
 */
export function inferKind(t: { kind?: TokenKind; category: string }): TokenKind | null {
  if (t.kind) return t.kind;
  switch (t.category) {
    case "colors":     return "color";
    case "typography": return "type";
    case "spacing":    return "spacing";
    default:           return null;
  }
}

/** The import over the site's tokens: an existing id takes the incoming
 *  light (and dark) value; a new id joins under its inferred kind. */
function importInto(all: DesignToken[], incoming: DesignToken[]): { next: DesignToken[]; stats: Omit<ImportStats, "refused"> } {
  const stats = { modified: 0, added: 0, skipped: [] as string[] };
  let next = all;
  for (const t of incoming) {
    if (next.some((x) => x.id === t.id)) {
      next = setTokenLiteral(next, t.id, "light", resolveTokenLiteral(incoming, t.id, "light") ?? "");
      const dark = t.modes.dark ? resolveTokenLiteral(incoming, t.id, "dark") : null;
      if (dark !== null) next = setTokenLiteral(next, t.id, "dark", dark);
      stats.modified++;
      continue;
    }
    const kind = inferKind(t);
    if (!kind || NO_ADD.includes(kind)) {
      stats.skipped.push(t.id);
      continue;
    }
    next = [...next, { ...t, kind }];
    stats.added++;
  }
  return { next, stats };
}

/** One write for the whole import — one ⌘Z undoes it. */
export function useImportTokens(): (incoming: DesignToken[]) => ImportStats {
  const { all, commit } = useProjectTokenStore();
  return React.useCallback(
    (incoming: DesignToken[]): ImportStats => {
      const { next, stats } = importInto(all, incoming);
      const changed = stats.modified + stats.added > 0;
      return { ...stats, refused: changed && !commit(next, "Import tokens") };
    },
    [all, commit],
  );
}
