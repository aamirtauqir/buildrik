/**
 * PublishConfirmFacts — the four rows board 914:4507 puts before the
 * irreversible button: where it goes, how much, whether the client has seen
 * it, and what a rollback would return to.
 *
 * ONE implementation, two entry points. The shell's PublishConfirmModal (the
 * topbar path) and the publish wizard's Confirm step (the panel path) both
 * render this; before it existed the wizard had its own copy that guessed the
 * approval line from the publish job's block reason instead of reading the
 * review round, so the same board said two different things depending on which
 * button you pressed.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { fetchApprovedSnapshot, fetchCurrentRound, type CurrentRound } from "@/services/ReviewService";
import { fetchPrePublishChecks } from "@/services/PublishService";
import { exportPublishPages, type PublishPage } from "@/editor/shell/exportPublishPages";
import { saveStatusStore } from "@/editor/shell/saveStatusStore";
import { Checkbox } from "@/editor/chrome-ui";

/* Board B3-10 (7574:193972) draws the four facts as a two-column table on a
   25 pitch: the KEY in a fixed left column at 12 ink-muted, the VALUE beside
   it at 13 ink, LEFT-aligned — a ledger, read top to bottom. The older board
   (914:4507) right-aligned the values at gap 10; both doors now open this
   dialog, so it follows the newer board.

   `min-h`, not `h`: two of the four values are sentences (the approval line,
   the Vercel block) and wrap at this width; a fixed pitch would clip them. */
const ROW = "tw:flex tw:items-start tw:gap-3 tw:min-h-[41px] tw:py-[10px] tw:border-b tw:border-[var(--bk-border)]";
const KEY = "tw:w-[120px] tw:flex-none tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
/* `min-w-0` is the whole fix for ledger row R12 ("the value column runs into
   the right border and clips — 'your connected Vercel projec[t]'"). A flex
   item's min-width defaults to `auto`, which is its CONTENT width, so a long
   value refuses to shrink and overflows the row instead. With the floor
   removed it shrinks, and `overflow-wrap: anywhere` lets it wrap rather than
   truncate — these are facts someone is reading before they publish, so
   nothing here may be hidden behind an ellipsis. */
const VAL =
  "tw:min-w-0 tw:flex-1 tw:[overflow-wrap:anywhere] tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";

/** Board 914:4507 prints "Approved 2 Jul"; the real line names who, too. */
function approvalLine(round: CurrentRound | null, loading: boolean): string {
  if (loading) return "Checking review status…";
  if (!round || round.revoked) return "Not sent for review.";
  if (round.status?.toLowerCase() === "approved") {
    const when = round.resolvedAt
      ? new Date(round.resolvedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
      : null;
    const who = round.reviewerName ?? round.invitedEmail ?? "the client";
    return when ? `Approved by ${who} on ${when}.` : `Approved by ${who}.`;
  }
  // The schema has three statuses — PENDING | APPROVED | CHANGES_REQUESTED —
  // and this line had two branches. A round the client CLOSED by asking for
  // changes took the "still open" fallthrough: the right decision (publish
  // stays blocked) given for the wrong reason.
  if (round.status?.toLowerCase() === "changes_requested") {
    const who = round.reviewerName ?? round.invitedEmail ?? "the client";
    return round.openCommentCount > 0
      ? `${who} asked for changes — ${round.openCommentCount} unresolved comment${round.openCommentCount === 1 ? "" : "s"}.`
      : `${who} asked for changes on round ${round.roundNumber}.`;
  }
  if (round.openCommentCount > 0) {
    return `Round ${round.roundNumber} open — ${round.openCommentCount} unresolved comment${round.openCommentCount === 1 ? "" : "s"}.`;
  }
  return `Round ${round.roundNumber} is still open.`;
}

/* The blocker a failed checks request reports — label and detail render in
   the caller's band like any server check. */
const CHECKS_UNAVAILABLE = {
  label: "Pre-publish checks",
  detail: "Couldn't run the pre-publish checks, so this publish stays blocked. Close this and try again.",
};

export interface PublishConfirmFactsProps {
  /** Gates the reads: neither entry point should fetch while closed. */
  active: boolean;
  composer: Composer | null;
  /** Live URL when a deployment is serving — the publish REPLACES it. */
  publishedUrl?: string | null;
  isPublished: boolean;
  /** The version a rollback would return to, when the panel knows it. */
  rollbackTo?: number | null;
  /** Reports the exporter's page count so a caller can refuse a zero-page
      publish — the count is read here, and the guard belongs to the button. */
  onPageCount?(count: number | null): void;
  /** The site whose readiness to check. Without it the Target row can only
      assert a connection it has not looked for. */
  siteId?: string | null;
  /** Every FAILING check (server checklist, `runPrePublishChecks`), empty
   *  when nothing blocks — same contract as onPageCount: read here, enforced
   *  and rendered by the caller. v3 FC-8: the confirm modal used to read only
   *  the FIRST failing check (`.find`), so a site with two blocking checks
   *  showed one and hid the other; the Publish panel's own PrePublishChecks
   *  list has always shown every row. Same server call, same list, both doors. */
  onBlockingChecks?(checks: Array<{ label: string; detail: string }>): void;
  /** How many non-blocking checks warned. Same read-here-render-there
      contract as onBlocked, so both publish doors can say the same thing. */
  onWarnings?(count: number): void;
  /** Advisory rows to acknowledge (B8-PB04 "2 Tips · I’ve seen these"):
      the server's warnings plus the site's own tips, counted by the caller. */
  tips?: number;
  tipsSeen?: boolean;
  onTipsSeen?(seen: boolean): void;
  /** The approval is older than the edits (B8-PB05/PB06): the Approval row
   *  says how much changed since, and carries `staleControl` at its end. */
  stale?: boolean;
  staleControl?: React.ReactNode;
}

/** Pages that differ between what the client approved and what would ship. */
function changedSince(approved: readonly PublishPage[], current: readonly PublishPage[]): number {
  const a = new Map(approved.map((p) => [p.path, p.html]));
  let n = 0;
  for (const p of current) if (a.get(p.path) !== p.html) n++;
  const now = new Set(current.map((p) => p.path));
  for (const path of a.keys()) if (!now.has(path)) n++;
  return n;
}

export const PublishConfirmFacts: React.FC<PublishConfirmFactsProps> = ({
  active,
  composer,
  publishedUrl,
  isPublished,
  rollbackTo = null,
  onPageCount,
  siteId,
  onBlockingChecks,
  onWarnings,
  tips = 0,
  tipsSeen = false,
  onTipsSeen,
  stale = false,
  staleControl,
}) => {
  const [changes, setChanges] = React.useState<number | null>(null);
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  const [loadingRound, setLoadingRound] = React.useState(true);
  /* `runPrePublishChecks` is the only thing that knows whether this workspace
     can deploy at all. The topbar path never asked it: the row asserted "your
     connected Vercel project", the button published, the job queued, and the
     deploy died at the last step on VERCEL_NOT_CONNECTED — which is the exact
     failure that check exists to prevent (publish.service.ts:36). Every
     failing check, not just the first — v3 FC-8. */
  const [blockers, setBlockers] = React.useState<Array<{ label: string; detail: string }>>([]);

  React.useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setPageCount(null);
    setLoadingRound(true);
    void (async () => {
      /* The page count is the EXPORT's count, not the page list's: what ships
         is what the exporter produces. */
      const [pages, r, checks, approved] = await Promise.all([
        composer ? exportPublishPages(composer).catch(() => null) : Promise.resolve(null),
        fetchCurrentRound().catch(() => null),
        siteId ? fetchPrePublishChecks(siteId).catch(() => null) : Promise.resolve(null),
        stale ? fetchApprovedSnapshot().catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setChanges(approved && pages ? changedSince(approved, pages) : null);
      /* A checks call that fails is not a pass (DQ-001). It used to collapse
         into "nothing failed" through `null?.checks ?? []`, which cleared the
         blockers and enabled Publish on any transient error. It now blocks,
         and says why; the next open runs the checks again. */
      const failed =
        siteId && !checks
          ? [CHECKS_UNAVAILABLE]
          : (checks?.checks ?? [])
              .filter((c) => c.status === "fail")
              .map((c) => ({ label: c.label, detail: c.detail }));
      setBlockers(failed);
      onBlockingChecks?.(failed);
      /* Warnings do not block, which is exactly why they went missing: the
         topbar confirm asked only whether it was blocked. A user publishing
         from the fast path was never told the site had unresolved warnings
         the wizard would have shown them. */
      onWarnings?.((checks?.checks ?? []).filter((c) => c.status === "warning").length);
      const count = pages ? pages.length : null;
      setPageCount(count);
      onPageCount?.(count);
      setRound(r);
      setLoadingRound(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, composer, onPageCount, siteId, onBlockingChecks, stale]);

  /* Board B8-PB04 `233:1802`: a numbered ledger — the number is the row's
     place in the publish checklist, so a row that does not apply leaves its
     number out (3 is the blocking checks, which never reach this dialog —
     they shut the tray's CTA, OD-1). */
  const savedAt = saveStatusStore.get()?.savedAt ?? null;
  const release = [
    savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}` : null,
    rollbackTo !== null
      ? `v${rollbackTo} stays restorable in publish history`
      : isPublished
        ? "the current live release stays available to republish"
        : "the last 20 versions stay restorable",
  ]
    .filter(Boolean)
    .join(" · ");
  const showApproval = loadingRound || (round !== null && !round.revoked);

  return (
    <div data-testid="publish-facts">
      <div className={ROW}>
        <span className={KEY} data-testid="publish-fact-key-pages">1 Changes</span>
        <span className={VAL} data-testid="publish-fact-val-pages">
          {pageCount == null ? "Preparing…" : `${pageCount} page${pageCount === 1 ? "" : "s"}`}
        </span>
      </div>
      {tips > 0 ? (
        <div className={ROW}>
          <span className={KEY} data-testid="publish-fact-key-tips">2 Tips</span>
          <span className={VAL}>{`${tips} advisory check${tips === 1 ? "" : "s"}`}</span>
          <label className="tw:flex tw:w-[200px] tw:flex-none tw:items-center tw:gap-1.5 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
            <Checkbox
              checked={tipsSeen}
              onChange={(e) => onTipsSeen?.(e.currentTarget.checked)}
              data-testid="publish-fact-tips-seen"
            />
            I’ve seen these
          </label>
        </div>
      ) : null}
      {showApproval ? (
        <div className={ROW}>
          {/* "Approval", the board's word; the value still names who. */}
          <span className={KEY} data-testid="publish-fact-key-approval">4 Approval</span>
          <span className={VAL} data-testid="publish-fact-val-approval">
            {stale && round?.resolvedAt
              ? `Approved ${new Date(round.resolvedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · edited since${
                  changes !== null ? ` (${changes} change${changes === 1 ? "" : "s"})` : ""
                }`
              : approvalLine(round, loadingRound)}
          </span>
          {stale && staleControl ? <span className="tw:w-[200px] tw:flex-none">{staleControl}</span> : null}
        </div>
      ) : null}
      <div className={ROW}>
        <span className={KEY} data-testid="publish-fact-key-rollback">5 Release</span>
        <span className={VAL} data-testid="publish-fact-val-rollback">{release}</span>
      </div>
    </div>
  );
};

export default PublishConfirmFacts;
