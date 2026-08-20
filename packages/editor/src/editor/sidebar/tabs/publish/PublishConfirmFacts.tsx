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
import { fetchCurrentRound, type CurrentRound } from "@/services/ReviewService";
import { fetchPrePublishChecks } from "@/services/PublishService";
import { VERCEL_CHECK_LABEL } from "@buildrik/shared/schemas/publish";
import { exportPublishPages } from "@/editor/shell/exportPublishPages";

const ROW = "tw:flex tw:justify-between tw:items-baseline tw:gap-[16px] tw:py-[7px] tw:text-[12px]";
const KEY = "tw:flex-none tw:text-[var(--bk-ink-muted)]";
const VAL = "tw:text-right tw:font-medium tw:text-[var(--bk-ink)]";

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
  if (round.openCommentCount > 0) {
    return `Round ${round.roundNumber} open — ${round.openCommentCount} unresolved comment${round.openCommentCount === 1 ? "" : "s"}.`;
  }
  return `Round ${round.roundNumber} is still open.`;
}

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
  /** The blocking check's detail, or null when nothing blocks — same contract
      as onPageCount: read here, enforced by the button. */
  onBlocked?(reason: string | null): void;
}

export const PublishConfirmFacts: React.FC<PublishConfirmFactsProps> = ({
  active,
  composer,
  publishedUrl,
  isPublished,
  rollbackTo = null,
  onPageCount,
  siteId,
  onBlocked,
}) => {
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  const [loadingRound, setLoadingRound] = React.useState(true);
  /* `runPrePublishChecks` is the only thing that knows whether this workspace
     can deploy at all. The topbar path never asked it: the row asserted "your
     connected Vercel project", the button published, the job queued, and the
     deploy died at the last step on VERCEL_NOT_CONNECTED — which is the exact
     failure that check exists to prevent (publish.service.ts:36). */
  const [blocker, setBlocker] = React.useState<{ label: string; detail: string } | null>(null);

  React.useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setPageCount(null);
    setLoadingRound(true);
    void (async () => {
      /* The page count is the EXPORT's count, not the page list's: what ships
         is what the exporter produces. */
      const [pages, r, checks] = await Promise.all([
        composer ? exportPublishPages(composer).catch(() => null) : Promise.resolve(null),
        fetchCurrentRound().catch(() => null),
        siteId ? fetchPrePublishChecks(siteId).catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      /* A checks call that fails is not a pass: it leaves the row saying what
         it said before and the button alone, rather than inventing a verdict. */
      const failed = checks?.checks.find((c) => c.status === "fail") ?? null;
      setBlocker(failed ? { label: failed.label, detail: failed.detail } : null);
      onBlocked?.(failed ? failed.detail : null);
      const count = pages ? pages.length : null;
      setPageCount(count);
      onPageCount?.(count);
      setRound(r);
      setLoadingRound(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, composer, onPageCount, siteId, onBlocked]);

  const target = publishedUrl
    ? `Production · ${publishedUrl.replace(/^https?:\/\//, "")}`
    : blocker?.label === VERCEL_CHECK_LABEL
      /* The row states the fact; the sentence that explains it belongs to the
         band under the rows, which has the width for it. Both carrying the
         same sentence printed it twice and ran it to the modal's edge. */
      ? "No Vercel connection"
      : "your connected Vercel project";

  return (
    <div>
      <div className={ROW}>
        <span className={KEY}>Target</span>
        <span className={VAL}>{target}</span>
      </div>
      <div className={ROW}>
        <span className={KEY}>Pages</span>
        <span className={VAL}>
          {pageCount == null ? "Preparing…" : `${pageCount} page${pageCount === 1 ? "" : "s"}`}
        </span>
      </div>
      <div className={ROW}>
        <span className={KEY}>Client approval</span>
        <span className={VAL}>{approvalLine(round, loadingRound)}</span>
      </div>
      <div className={ROW}>
        <span className={KEY}>Rollback</span>
        <span className={VAL}>
          {/* "Every version stays restorable" was the first-publish line, and
              publish history keeps twenty: `runPublishJob` nulls the stored
              payload on COMPLETED jobs beyond the 20 most recent
              (PUBLISH_HISTORY_RETAINED), and a job with no payload is not
              rollbackable. The panel next door already says "the last 20" —
              this said something the retention cannot keep. */}
          {rollbackTo !== null
            ? `v${rollbackTo} stays restorable in publish history`
            : isPublished
              ? "The current version stays restorable"
              : "The last 20 versions stay restorable"}
        </span>
      </div>
    </div>
  );
};

export default PublishConfirmFacts;
