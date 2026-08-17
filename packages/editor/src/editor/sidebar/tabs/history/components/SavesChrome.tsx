/**
 * Boards 162:2 / 163:2 / 163:64 — the chrome around the Saves list.
 *
 * All three draw the same two pieces: the approval band (with the "now" row
 * beneath it) above whatever list is showing, and the retention rule below.
 * 163:64 is the one that settles where they belong — it is the EMPTY state,
 * with no list at all, and it still carries the prune note. These are panel
 * chrome, not list chrome.
 *
 * They were first built inside VersionHistoryPanel, which is only the
 * Milestones filter, so the "All changes" filter (board 163:2, same band, same
 * note) and the empty state got neither. Lifted here, where both filters and
 * the empty state pass through.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { fetchReviewStatus, type ReviewStatus } from "@/services/ReviewService";

const BAND =
  "tw:rounded-md tw:bg-[var(--bk-success-tint)] tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-0.5 tw:mb-2";
const BAND_TITLE =
  "tw:flex tw:items-center tw:gap-1.5 tw:text-[12px] tw:font-semibold tw:tracking-[0.04em] tw:text-[var(--bk-success-text)]";
const BAND_META = "tw:text-[11px] tw:text-[var(--bk-ink-soft)]";
const NOW_ROW =
  "tw:flex tw:items-center tw:gap-2 tw:px-1 tw:pb-2 tw:text-[13px] tw:text-[var(--bk-ink)]";
const NOW_DOT = "tw:size-2 tw:rounded-full tw:bg-[var(--bk-accent)]";
const PRUNE_NOTE = "tw:m-0 tw:mt-2 tw:px-1 tw:text-[11px] tw:text-[var(--bk-ink-muted)]";

/** Board 162:2 stamps the approval "18 Jul, 15:42". */
function approvalStamp(at: string | Date): string {
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${d.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit", hour12: false },
  )}`;
}

/**
 * The approval band and the "now" row.
 *
 * Renders for `approved-edited-since` as well as `approved`: that is what the
 * server returns the moment anyone touches the site after sign-off, which is
 * exactly the situation the board draws — an APPROVED band with "Now — 12
 * changes since v3" beneath it. Gating on the pristine state alone would make
 * the band vanish on the first edit, i.e. when the list it heads becomes worth
 * reading.
 *
 * The board writes "· v3" and "since v3"; `reviews.status` carries state,
 * reviewer and time, not a version number, so that clause is absent rather
 * than invented. Same for a reviewer with no name on record — the band drops
 * the clause instead of printing a dash into a sentence.
 */
export const SavesApproval: React.FC<{ composer: Composer | null }> = ({ composer }) => {
  const [review, setReview] = React.useState<ReviewStatus | null>(null);
  React.useEffect(() => {
    let alive = true;
    void fetchReviewStatus().then((r) => alive && setReview(r));
    return () => {
      alive = false;
    };
  }, []);

  const isApproved = review?.state === "approved" || review?.state === "approved-edited-since";
  const approvedAt = isApproved && review?.at ? new Date(review.at).getTime() : null;

  /* Counted the same way the publish panel counts "since last deploy": the
     engine's own history stack, filtered to entries newer than the moment
     being measured from. */
  const changes = React.useMemo(() => {
    if (approvedAt === null) return 0;
    const stack = composer?.history?.getHistoryStack?.() ?? [];
    return stack.filter((e) => e.timestamp > approvedAt).length;
  }, [composer, approvedAt]);

  if (!isApproved || !review) return null;

  return (
    <>
      <div className={BAND} role="status">
        <div className={BAND_TITLE}>
          <span aria-hidden="true">⚑</span> APPROVED
        </div>
        {(review.reviewerName || review.at) && (
          <div className={BAND_META}>
            {[review.reviewerName, review.at ? approvalStamp(review.at) : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}
      </div>
      <div className={NOW_ROW}>
        <span className={NOW_DOT} aria-hidden="true" />
        <span>
          Now — {changes} change{changes === 1 ? "" : "s"} since approval
        </span>
      </div>
    </>
  );
};

/**
 * The retention rule, under the list.
 *
 * The cap is read off VersionTimelineManager rather than written into the
 * copy, so it cannot go on claiming 50 the day the config changes — and
 * nothing is said at all when no cap can be read, because a number invented
 * here is a claim about retention that nothing backs.
 */
export const SavesPruneNote: React.FC<{ composer: Composer | null }> = ({ composer }) => {
  const max = composer?.versions?.maxVersions;
  if (typeof max !== "number") return null;
  return (
    <p className={PRUNE_NOTE}>
      {max} versions kept. Auto-saves prune oldest first; named ones never prune.
    </p>
  );
};
