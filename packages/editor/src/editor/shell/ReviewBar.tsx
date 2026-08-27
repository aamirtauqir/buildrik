/**
 * ReviewBar — board 200:213 (Shell state 8 · Review active).
 *
 * A tinted strip under the topbar, present only while a review round is open:
 * the open-comment count, a way to step through those comments on the canvas,
 * Compare, and Re-send. The topbar pill says a review EXISTS; this bar is what
 * you work through while it does, which is why the board gives it its own row
 * rather than more chips in the topbar.
 *
 * "Next ›" walks the OPEN comments in the order the server returns them,
 * switching page when the next one lives on another page and selecting its
 * anchor element so the canvas scrolls to it. A comment with no anchor
 * (`targetSelector` null — the board's "unpinned" case) still counts and still
 * gets its turn; it just moves the page rather than the selection.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import {
  fetchCurrentRound,
  fetchReviewComments,
  type CurrentRound,
  type ReviewComment,
} from "@/services/ReviewService";

export interface ReviewBarProps {
  composer: Composer | null;
  /** Opens the Review panel's Compare — the same one the panel's own foot opens. */
  onCompare: () => void;
  /** Re-send the round. The shell owns it (it re-renders the snapshot). */
  onResend?: (clientEmail?: string) => Promise<{ inviteEmailSent: boolean | null } | void>;
}

const BAR =
  "tw:flex tw:items-center tw:gap-4 tw:h-12 tw:px-4 tw:bg-[var(--bk-accent-tint)] " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[13px]";
const LINK =
  "tw:h-7 tw:px-2 tw:rounded tw:border-0 tw:bg-transparent tw:text-[13px] tw:font-normal " +
  "tw:text-gray-600 tw:enabled:hover:bg-white tw:enabled:hover:text-gray-900";
const ACCENT_LINK =
  "tw:h-7 tw:px-2 tw:rounded tw:border-0 tw:bg-transparent tw:text-[13px] tw:font-normal " +
  "tw:text-[var(--bk-accent-text)] tw:enabled:hover:bg-white";

/** `ReviewRequest.status` is `PENDING | APPROVED | CHANGES_REQUESTED`
 *  (prisma/schema.prisma:513) — there is no OPENED, whatever the pill's
 *  "opened-not-acted" state suggests; that one is derived from `openedAt`.
 *  APPROVED is a finished round, so the bar is not part of it. */
const ACTIVE = new Set(["PENDING", "CHANGES_REQUESTED"]);

export const ReviewBar: React.FC<ReviewBarProps> = ({ composer, onCompare, onResend }) => {
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  const [open, setOpen] = React.useState<ReviewComment[]>([]);
  const [cursor, setCursor] = React.useState(0);
  const [resending, setResending] = React.useState(false);

  const load = React.useCallback(() => {
    void fetchCurrentRound()
      .then((r) => {
        setRound(r);
        if (!r || r.revoked || !ACTIVE.has(r.status)) {
          setOpen([]);
          return;
        }
        return fetchReviewComments("OPEN").then((cs) => setOpen(cs));
      })
      .catch(() => {
        /* The bar is a shortcut, not a source of truth — a failed fetch hides
           it rather than shouting. The Review panel owns the error state. */
        setRound(null);
        setOpen([]);
      });
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!composer) return;
    composer.on("comments:reattached", load);
    return () => {
      composer.off("comments:reattached", load);
    };
  }, [composer, load]);

  const next = () => {
    if (!open.length) return;
    const i = cursor % open.length;
    const c = open[i];
    setCursor(i + 1);
    if (!composer) return;
    if (c.pageId && composer.elements.getActivePage()?.id !== c.pageId) {
      composer.elements.setActivePage(c.pageId);
    }
    /* `select` takes the element, not its id — the same shape ContentTab
       uses. A comment whose anchor was deleted simply selects nothing; the
       Review panel's Detached group is what reports that. */
    const el = c.targetSelector ? composer.elements.getElement(c.targetSelector) : null;
    if (el) composer.selection.select(el);
  };

  const resend = async () => {
    if (!onResend || resending) return;
    setResending(true);
    try {
      await onResend();
      load();
    } finally {
      setResending(false);
    }
  };

  // No round, a revoked one, or a closed one: the bar is not part of that state.
  if (!round || round.revoked || !ACTIVE.has(round.status)) return null;

  const count = round.openCommentCount;

  return (
    <div className={BAR} role="region" aria-label="Review in progress" data-testid="review-bar">
      {/* A zero here was a count where a sentence belongs. The bar renders only
          while a round is live, so `0 open` meant "your client has not replied
          yet" — and printed a number that says none of that. The count earns
          its place the moment there IS one. */}
      <span className="tw:font-medium tw:text-[var(--bk-accent-text)]">
        {count > 0
          ? `${count} open`
          : round.status === "CHANGES_REQUESTED"
            ? "Changes requested — nothing left open"
            : "Sent — waiting on your client"}
      </span>
      <Button
        color="light"
        size="xs"
        className={LINK}
        onClick={next}
        disabled={!open.length}
        /* Disabled without a reason is a bug, not a state (wireframes §5.8). */
        title={open.length ? undefined : "No open comments to step through"}
      >
        Next ›
      </Button>
      <Button color="light" size="xs" className={LINK} onClick={onCompare}>
        Compare
      </Button>
      <span className="tw:flex-1" />
      {onResend ? (
        <Button
          color="light"
          size="xs"
          className={ACCENT_LINK}
          onClick={resend}
          disabled={resending}
          aria-busy={resending || undefined}
        >
          {resending ? "Re-sending…" : "Re-send"}
        </Button>
      ) : null}
    </div>
  );
};

export default ReviewBar;
