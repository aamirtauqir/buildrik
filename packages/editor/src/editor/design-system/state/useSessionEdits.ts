/**
 * useSessionEdits — Brand's "Review changes" (spec §4): every token write
 * made through the registries this session, each with Revert. Recorded at the
 * ONE commit point the registries share, so value edits, add / delete /
 * rename, starters, import, spacing presets, the Colour-mode pair and lint
 * fixes all land here alike.
 *
 * A row keeps the whole set before and after its write. Revert writes
 * `before` back as one transaction — exactly, so a `custom-*` primitive the
 * edit created goes too — and only while the site still holds that row's
 * `after`. Once anything moved past it (a later edit, ⌘Z) the row is stale:
 * reverting it would also throw away that later change, so ⌘Z is the tool.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { DesignToken } from "../types";
import { readTokens, type ProjectTokens } from "./useProjectTokens";

export interface SessionEdit {
  label: string;
  before: DesignToken[];
  after: DesignToken[];
  at: number;
  /** The site no longer holds `after` — Revert is off. */
  stale: boolean;
}

const sameTokens = (a: readonly DesignToken[], b: readonly DesignToken[]) =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

export function useSessionEdits(composer: Composer | null, project: ProjectTokens) {
  const [log, setLog] = React.useState<Omit<SessionEdit, "stale">[]>([]);
  const { commit: write, all } = project;

  /* Reads the project at the moment of the write, never React state — two
     writes in one handler must each see the other's result. */
  const commit = React.useCallback(
    (next: DesignToken[], label: string) => {
      const before = readTokens(composer);
      if (!write(next, label)) return false;
      const after = readTokens(composer);
      setLog((prev) => [{ label, before, after, at: Date.now() }, ...prev]);
      return true;
    },
    [composer, write],
  );

  /** False when the row is stale or the write is refused (read-only). */
  const revert = React.useCallback(
    (index: number) => {
      const row = log[index];
      if (!row || !sameTokens(readTokens(composer), row.after)) return false;
      if (!write(row.before, "Revert brand edit")) return false;
      setLog((prev) => prev.filter((r) => r !== row));
      return true;
    },
    [composer, log, write],
  );

  const edits = React.useMemo<SessionEdit[]>(
    () => log.map((r) => ({ ...r, stale: !sameTokens(all, r.after) })),
    [log, all],
  );

  return { commit, edits, revert };
}
