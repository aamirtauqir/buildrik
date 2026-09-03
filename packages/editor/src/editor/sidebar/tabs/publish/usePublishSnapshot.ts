/**
 * usePublishSnapshot — the three facts board 641:2652 puts above the CTA.
 *
 * The panel used to open on a Status chip and an inline checklist. The board
 * opens on what the user is about to change: where it goes (ENVIRONMENT), what
 * has moved since the site last went out (SINCE LAST DEPLOY), and what is
 * live right now (LAST DEPLOY).
 *
 * Every field is read from something the editor already owns. Where the board's
 * sample carries data this product has no source for — "Sara · 2m", an author
 * per change — the SHAPE is kept and the missing half is simply absent, per the
 * arc's rule that board sample data is the shape and not the literal.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { fetchPublishHistory } from "../../../../services/PublishService";
import type { PublishHistoryRow } from "../../../../services/PublishService";
import { isPageLive } from "@/engine/export";

export interface PublishChange {
  id: string;
  /** The history entry's own label — "Menu — price updates" on the board. */
  label: string;
  /** Relative time, already formatted ("2m", "41m", "3h"). */
  when: string;
  /** Present only when the entry carries attribution; the board draws it. */
  author?: string;
}

export interface PublishSnapshot {
  production: { label: string; value: string | null };
  preview: { label: string; value: string | null };
  changes: PublishChange[];
  changeCount: number;
  pageCount: number;
  /** `rawAt` is the timestamp itself — board 784:4326 prints it relatively
      ("just now"), board 641:2652 absolutely ("2 Jul, 14:22"). */
  lastDeploy: { version: number; when: string; rawAt: string | Date | null; isLive: boolean } | null;
  loading: boolean;
  /** The history read failed. Board 781:4489 — never the same as "no deploys
      yet", which is what a silent catch made it look like. */
  error: boolean;
  reload(): void;
}

/** "2m" / "41m" / "3h" / "2 Jul" — the board's own scale. */
export function relativeShort(ts: number | string | Date | null | undefined): string {
  if (ts === null || ts === undefined) return "";
  const then = ts instanceof Date ? ts.getTime() : typeof ts === "number" ? ts : Date.parse(ts);
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Board: "2 Jul, 14:22". */
function deployStamp(ts: Date | string | null): string {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${d.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit", hour12: false },
  )}`;
}

/** Domain only — the board prints "bellacucina.com", never the scheme.
    Exported because board 949:4474's LIVE banner prints the same thing and
    a second copy of this would be the duplication the DS contract bans. */
export function domainOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;
  }
}

export function usePublishSnapshot(
  composer: Composer | null,
  siteId: string | null,
  publishedUrl: string | null,
  /** Bump to re-read history — a finished publish changes every field here. */
  reloadKey: unknown = null,
): PublishSnapshot {
  const [rows, setRows] = React.useState<PublishHistoryRow[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [retry, setRetry] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    if (!siteId) {
      setRows(null);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    fetchPublishHistory(siteId)
      .then((r) => {
        if (!alive) return;
        setRows(r);
        setError(false);
      })
      /* A history that will not load must not read as "never deployed": the
         panel says it could not reach the service (board 781:4489), because
         "no deploys yet" and "we cannot tell" are different facts. */
      .catch(() => {
        if (!alive) return;
        setRows(null);
        setError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [siteId, reloadKey, retry]);

  /* The undo stack is mutable state this hook reads but does not own, so a
     memo keyed on [composer, lastDeployAt] never recomputed: the panel's
     "SINCE LAST DEPLOY" count froze at whatever it was when the panel opened,
     and the section's whole claim is "what would go out if you published
     NOW". Subscribe to the engine's own history events and re-read. */
  const [stackVersion, setStackVersion] = React.useState(0);
  React.useEffect(() => {
    if (!composer) return;
    const bump = () => setStackVersion((n) => n + 1);
    composer.on(EVENTS.HISTORY_RECORDED, bump);
    composer.on(EVENTS.HISTORY_UNDO, bump);
    composer.on(EVENTS.HISTORY_REDO, bump);
    composer.on(EVENTS.HISTORY_CLEARED, bump);
    return () => {
      composer.off(EVENTS.HISTORY_RECORDED, bump);
      composer.off(EVENTS.HISTORY_UNDO, bump);
      composer.off(EVENTS.HISTORY_REDO, bump);
      composer.off(EVENTS.HISTORY_CLEARED, bump);
    };
  }, [composer]);

  const latest = rows?.[0] ?? null;
  const lastDeployAt = latest?.completedAt ? new Date(latest.completedAt).getTime() : null;

  /* Changes SINCE the last deploy, not the whole undo stack: the section's
     entire claim is "what would go out if you published now". Without a deploy
     to measure from, everything on the stack qualifies. */
  const changes = React.useMemo<PublishChange[]>(() => {
    const stack = composer?.history?.getHistoryStack?.() ?? [];
    return stack
      .filter((e) => (lastDeployAt === null ? true : e.timestamp > lastDeployAt))
      .map((e) => ({
        id: e.id,
        label: e.label,
        when: relativeShort(e.timestamp),
        author: (e as { author?: string }).author,
      }));
  }, [composer, lastDeployAt, stackVersion]);

  /* What SHIPS, not what exists. The confirm modal already counts the export's
     pages ("what ships is what the exporter produces"); this counted the page
     list, so a site with one live page and one hidden read "2 pages" while the
     deploy carried one. */
  const pageCount = (composer?.elements?.getAllPages?.() ?? []).filter(isPageLive).length;

  return {
    production: { label: "Production", value: domainOf(publishedUrl) },
    /* Preview deployments are a Vercel concept this editor does not read yet.
       The row stays — the board draws the pair, and an environment list that
       hides Preview would say the site has none. */
    preview: { label: "Preview", value: null },
    changes,
    changeCount: changes.length,
    pageCount,
    /* `isLive` was hardcoded true whenever any COMPLETED job existed, which
       is a different question from whether the site is serving. On a site
       whose truth is DRAFT with no published URL, the panel said "never
       published" and "live" on the same load, and the louder green half was
       the wrong one. The published URL is the only fact about what is
       serving; a finished job only says a deploy once ran. */
    lastDeploy: latest
      ? {
          version: latest.version,
          when: deployStamp(latest.completedAt),
          rawAt: latest.completedAt,
          isLive: Boolean(publishedUrl),
        }
      : null,
    loading,
    error,
    reload: () => setRetry((n) => n + 1),
  };
}
