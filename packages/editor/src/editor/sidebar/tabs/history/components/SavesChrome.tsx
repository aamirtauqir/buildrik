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
import { EVENTS } from "@/shared/constants/events";
import { Button } from "@/editor/chrome-ui";
import type { SavesFilter } from "../types";

/* Board 162:2 draws the approval band as a full-bleed strip with a 3px success
   rail on its left, weight 400 — not a rounded tinted card with a bold title. */
const BAND =
  "tw:rounded-none tw:border-l-[3px] tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)] tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-0.5 tw:mb-2";
const BAND_TITLE =
  "tw:flex tw:items-center tw:gap-1.5 tw:text-[12px] tw:font-normal tw:text-[var(--bk-success-text)]";
const BAND_META = "tw:text-[11px] tw:text-[var(--bk-ink-soft)]";
const NOW_ROW =
  "tw:flex tw:items-center tw:gap-2 tw:px-1 tw:text-[12px] tw:text-[var(--bk-ink)]";
const NOW_DOT = "tw:size-2 tw:rounded-full tw:bg-[var(--bk-accent)]";
const NOW_COL = "tw:flex tw:flex-col";
/* Aligned under the count, past the dot and its gap (8px + 8px). */
const NOW_SUMMARY =
  "tw:px-1 tw:pb-2 tw:pl-[calc(0.25rem+16px)] tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:truncate";
/* Board 163:44/163:45 — a bg-subtle block with the sentence inset 16 on both
   sides. Split in two because the board measures the TEXT (248 wide in a 280
   panel, 11/16), not the padded block: one element carrying both would report
   the block's 280 and there would be nothing to compare the type against. */
const PRUNE_NOTE = "tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:py-2";
const PRUNE_NOTE_TEXT = "tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* Boards 163:2 / 163:113 hang one action off the approval anchor. It sat
   unbuilt: "Compare with current" had ZERO occurrences in src/, while the view
   that renders exactly that comparison — ApprovedCompareView — was already
   built to its own eight boards and reachable only from ReviewTab. A finished
   surface with no door to it from the place the board draws the door. */
const BAND_ACTION =
  "tw:mt-1 tw:self-start tw:h-7 tw:px-3 tw:text-[13px] tw:font-normal " +
  "tw:text-[var(--bk-gray-700)] tw:border tw:border-[var(--bk-border)] tw:bg-white tw:no-underline";

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
  const since = React.useMemo(() => {
    if (approvedAt === null) return [];
    const stack = composer?.history?.getHistoryStack?.() ?? [];
    return stack.filter((e) => e.timestamp > approvedAt);
  }, [composer, approvedAt]);
  const changes = since.length;

  /* Board 163:2's Now row is two lines: the count, then WHAT changed —
     "hero copy · 2 images · menu". The count alone shipped, which answers "is
     there drift" but not "drift in what", and the second question is the one
     that decides whether to look. Distinct labels, newest first, capped at
     three because the board draws three and a fourth wraps the row. */
  const summary = React.useMemo(
    () =>
      [...new Set(since.map((e) => e.label).filter(Boolean))]
        .slice(0, 3)
        .join(" · "),
    [since],
  );

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
        {/* B8 — routed, not rebuilt: UI_PANEL_OPEN carries a `screen`, TabRouter
            maps `activeSubTab === "session"` to HistoryTab's `initialView="session"
            initialBaseline="approved"`, and SessionView's picker lands on
            Approved directly. A second copy of that view here would need its
            own snapshot + live-export plumbing and would drift from the one
            the boards describe. */}
        <Button
          color="light"
          size="xs"
          className={BAND_ACTION}
          onClick={() =>
            composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "session" })
          }
        >
          Compare with current
        </Button>
      </div>
      <div className={NOW_COL}>
        <div className={NOW_ROW}>
          <span className={NOW_DOT} aria-hidden="true" />
          <span>
            Now — {changes} change{changes === 1 ? "" : "s"} since approval
          </span>
        </div>
        {summary && <div className={NOW_SUMMARY}>{summary}</div>}
      </div>
    </>
  );
};

/**
 * The retention rule, under the list.
 *
 * TWO rules, because the two filters retain different things and the note sat
 * under both saying only the first. Milestones lists saved versions, which
 * survive a reload and prune oldest-first; "All changes" lists the UNDO stack,
 * which is capped at `maxHistory` and is gone the moment the page reloads.
 * Board 163:2 — the changes filter — spells that out: "This session only — the
 * last 100 steps, cleared when you reload. Save a version to keep a point."
 * The panel printed the versions sentence there instead, which is not merely
 * off-board: it promises durability for a list that has none.
 *
 * Both caps are read off their manager rather than written into the copy, so
 * neither can go on claiming a number the config has moved past — and nothing
 * is said at all when no cap can be read, because a number invented here is a
 * claim about retention that nothing backs.
 */
export const SavesPruneNote: React.FC<{ composer: Composer | null; filter: SavesFilter }> = ({
  composer,
  filter,
}) => {
  const cap = filter === "changes" ? composer?.history?.maxHistory : composer?.versions?.maxVersions;
  if (typeof cap !== "number") return null;
  return (
    <div className={PRUNE_NOTE} data-testid="history-prune-note">
      <p className={PRUNE_NOTE_TEXT} data-testid="history-prune-note-text">
        {filter === "changes"
          ? `This session only — the last ${cap} steps, cleared when you reload. Save a version to keep a point.`
          : `${cap} versions kept. Auto-saves prune oldest first; named ones never prune.`}
      </p>
    </div>
  );
};
