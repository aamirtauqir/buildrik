/**
 * useSessionEdits — Brand's "Review changes" (spec §4): every token write
 * made through the registries this session, one row per token it changed,
 * each with its own Revert. Recorded at the ONE commit point the registries
 * share, so value edits, add / delete / rename, starters, import, spacing
 * presets, the Colour-mode pair and lint fixes all land here alike.
 *
 * A row is a token (plus what the same write changed on its behalf: its own
 * `custom-*` primitive, the other half of a rename). It is stale only when
 * one of THOSE tokens moved after the write — a later edit to a different
 * token leaves it revertable. Revert is one write (one ⌘Z step) that puts
 * those tokens back as they were before the edit and touches nothing else.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { DesignToken } from "../types";
import type { TokenRef } from "@/engine/designSystem/types";
import { readTokens, type ProjectTokens } from "./useProjectTokens";

export interface SessionEdit {
  /** Stable row id — what `revert` takes. */
  key: string;
  /** The token the row is about. */
  tokenId: string;
  /** The write's label (`"Edit token"`, `"Apply starter"` …). */
  label: string;
  /** The whole set before and after the write the row came from. */
  before: DesignToken[];
  after: DesignToken[];
  at: number;
  /** One of the row's tokens changed since — Revert is off. */
  stale: boolean;
}

interface LoggedWrite {
  seq: number;
  label: string;
  before: DesignToken[];
  after: DesignToken[];
  at: number;
}

interface Row {
  key: string;
  tokenId: string;
  /** Every id the row restores. */
  ids: Set<string>;
  write: LoggedWrite;
}

const sameJson = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
const sameTokens = (a: readonly DesignToken[], b: readonly DesignToken[]) => sameJson(a, b);

const isOwnPrimitive = (t: DesignToken) => t.layer === "primitive" && t.id.startsWith("custom-");
const aliasesOf = (t: DesignToken | undefined): string[] =>
  t ? [t.modes.light, t.modes.dark].flatMap((r?: TokenRef) => (r && "alias" in r ? [r.alias] : [])) : [];

/** The rows one write produces: each changed token, grouped with the
 *  `custom-*` primitives it aliases and the token it was renamed into. */
function rowsOf(write: LoggedWrite): Row[] {
  const was = new Map(write.before.map((t) => [t.id, t]));
  const now = new Map(write.after.map((t) => [t.id, t]));
  const changed = [...new Set([...was.keys(), ...now.keys()])].filter((id) => !sameJson(was.get(id), now.get(id)));
  const rows: Row[] = [];
  const owner = new Map<string, Row>();
  for (const id of changed) {
    const t = (now.get(id) ?? was.get(id))!;
    if (isOwnPrimitive(t)) continue;
    const renamedFrom = changed.find((o) => o !== id && now.get(o)?.replacedBy === id && was.get(o)?.replacedBy !== id);
    const host = renamedFrom ? owner.get(renamedFrom) : undefined;
    if (host) {
      host.ids.add(id);
      owner.set(id, host);
      continue;
    }
    const row: Row = { key: `${write.seq}:${id}`, tokenId: id, ids: new Set([id]), write };
    rows.push(row);
    owner.set(id, row);
  }
  /* A semantic edit usually lands on its own `custom-*` primitive alone (the
     token already aliases it), so the row belongs to the token that aliases
     it, changed or not. */
  const aliasHost = (id: string) =>
    [...changed, ...now.keys()].find(
      (o) => !isOwnPrimitive((now.get(o) ?? was.get(o))!) &&
        (aliasesOf(now.get(o)).includes(id) || aliasesOf(was.get(o)).includes(id)),
    );
  for (const id of changed) {
    const t = (now.get(id) ?? was.get(id))!;
    if (!isOwnPrimitive(t)) continue;
    const host = aliasHost(id);
    if (!host) continue;
    let row = owner.get(host);
    if (!row) {
      row = { key: `${write.seq}:${host}`, tokenId: host, ids: new Set([host]), write };
      rows.push(row);
      owner.set(host, row);
    }
    row.ids.add(id);
  }
  return rows;
}

/** `current` with the row's tokens put back as they were in `before`. A
 *  `custom-*` primitive the edit created stays when something outside the
 *  row has come to alias it since. */
function restored(current: readonly DesignToken[], row: Row): DesignToken[] {
  const prev = new Map(row.write.before.map((t) => [t.id, t]));
  const aliasedElsewhere = new Set(current.filter((t) => !row.ids.has(t.id)).flatMap((t) => aliasesOf(t)));
  const out = current
    .filter((t) => !row.ids.has(t.id) || prev.has(t.id) || aliasedElsewhere.has(t.id))
    .map((t) => (row.ids.has(t.id) && prev.has(t.id) ? prev.get(t.id)! : t));
  row.write.before.forEach((t, i) => {
    if (row.ids.has(t.id) && !out.some((o) => o.id === t.id)) out.splice(Math.min(i, out.length), 0, t);
  });
  return out;
}

const isStale = (row: Row, current: readonly DesignToken[]) => {
  const now = new Map(current.map((t) => [t.id, t]));
  const after = new Map(row.write.after.map((t) => [t.id, t]));
  return [...row.ids].some((id) => !sameJson(now.get(id), after.get(id)));
};

export function useSessionEdits(composer: Composer | null, project: ProjectTokens) {
  const [log, setLog] = React.useState<LoggedWrite[]>([]);
  const [reverted, setReverted] = React.useState<ReadonlySet<string>>(() => new Set());
  const seq = React.useRef(0);
  const { commit: write, all } = project;

  /* Reads the project at the moment of the write, never React state — two
     writes in one handler must each see the other's result. */
  const commit = React.useCallback(
    (next: DesignToken[], label: string) => {
      const before = readTokens(composer);
      if (!write(next, label)) return false;
      const after = readTokens(composer);
      /* A write that changed nothing (re-applying the starter you are on) is
         not an edit — no row. */
      if (!sameTokens(before, after)) {
        const entry = { seq: ++seq.current, label, before, after, at: Date.now() };
        setLog((prev) => [entry, ...prev]);
      }
      return true;
    },
    [composer, write],
  );

  const rows = React.useMemo(
    () => log.flatMap(rowsOf).filter((r) => !reverted.has(r.key)),
    [log, reverted],
  );

  /** False when the row is stale or the write is refused (read-only, or the
   *  result would break the token graph). */
  const revert = React.useCallback(
    (key: string) => {
      const row = rows.find((r) => r.key === key);
      const current = readTokens(composer);
      if (!row || isStale(row, current)) return false;
      if (!write(restored(current, row), "Revert brand edit")) return false;
      setReverted((prev) => new Set(prev).add(key));
      return true;
    },
    [composer, rows, write],
  );

  const edits = React.useMemo<SessionEdit[]>(
    () =>
      rows.map((r) => ({
        key: r.key,
        tokenId: r.tokenId,
        label: r.write.label,
        before: r.write.before,
        after: r.write.after,
        at: r.write.at,
        stale: isStale(r, all),
      })),
    [rows, all],
  );

  return { commit, edits, revert };
}
