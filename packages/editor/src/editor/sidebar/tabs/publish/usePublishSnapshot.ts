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
import { fetchPublishHistory } from "../../../../services/PublishService";
import type { PublishHistoryRow } from "../../../../services/PublishService";

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
  lastDeploy: { version: number; when: string; isLive: boolean } | null;
  loading: boolean;
}

/** "2m" / "41m" / "3h" / "2 Jul" — the board's own scale. */
export function relativeShort(ts: number | string | null | undefined): string {
  if (ts === null || ts === undefined) return "";
  const then = typeof ts === "number" ? ts : Date.parse(ts);
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
export function deployStamp(ts: Date | string | null): string {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${d.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit", hour12: false },
  )}`;
}

/** Domain only — the board prints "bellacucina.com", never the scheme. */
function domainOf(url: string | null): string | null {
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
): PublishSnapshot {
  const [rows, setRows] = React.useState<PublishHistoryRow[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    if (!siteId) {
      setRows(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPublishHistory(siteId)
      .then((r) => alive && setRows(r))
      /* A history that will not load must not read as "never deployed" — the
         section simply does not claim a last deploy. */
      .catch(() => alive && setRows(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [siteId]);

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
  }, [composer, lastDeployAt]);

  const pageCount = composer?.elements?.getAllPages?.().length ?? 0;

  return {
    production: { label: "Production", value: domainOf(publishedUrl) },
    /* Preview deployments are a Vercel concept this editor does not read yet.
       The row stays — the board draws the pair, and an environment list that
       hides Preview would say the site has none. */
    preview: { label: "Preview", value: null },
    changes,
    changeCount: changes.length,
    pageCount,
    lastDeploy: latest
      ? { version: latest.version, when: deployStamp(latest.completedAt), isLive: true }
      : null,
    loading,
  };
}
