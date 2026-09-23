/**
 * ReviewTab — the editor-side review loop, rebuilt to its own 13 boards
 * (156:2 open · 157:221 empty · 157:58 all-resolved · 157:109
 * resolved-expanded · 157:2 detached-present · 157:169 older-round · 158:2
 * re-send-confirm · 158:57 re-sending · 158:105 revoke-confirm · 158:162
 * revoked · 158:213 review-closed · 453:3974 load-error · 1138:4527 loading).
 *
 * The frame every state shares, top to bottom: the panel header, a progress
 * bar with "resolved of total", who it was sent to and when, the thread, then
 * a fixed foot — the round line, Compare, and one primary button whose label
 * IS the state ("Re-send for review" · "Sending round 3…" · "Send a new link"
 * · "Try again").
 *
 * What the rebuild replaced: a status badge + open-count chip + Re-send +
 * overflow row, a "Show resolved" toggle, avatar-led rows, and page groups
 * labelled with raw page IDs. None of it is on any board, and the last one was
 * a real defect — a group header read "PAGE-CMFX3K9Q0001" for anyone whose
 * pages have generated ids.
 *
 * Load model honours DF5: a failed load says so and offers Try again; it never
 * renders as the empty "no feedback yet" state.
 *
 * Two deliberate deviations, both named in the ledger: the round line has no
 * ‹ › pager (no endpoint returns an older round's comments — `comments.list`
 * is site-scoped and `reviews.list` is workspace-admin-scoped, so the arrows
 * would be dead controls), and Compare is labelled "Compare with approved"
 * rather than the board's "Compare with v3" (nothing here knows a version
 * number). The reply composer is kept though no board draws one: `postReply`
 * is live, and deleting a working capability to match a drawing is the one
 * thing this arc has consistently refused to do.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import {
  Button,
  CommentRow,
  EmptyState,
  PanelHeader,
  SkeletonBlock,
  Spinner,
  Textarea,
  Toolbar,
  OverlayMount,
} from "@/editor/chrome-ui";
import { SendForReview } from "@/editor/shell/SendForReview";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { ApprovedCompareView } from "@/editor/panels/version-history/ApprovedCompareView";
import type { PublishPage } from "@/editor/shell/exportPublishPages";
import { locateComment } from "./locate";
import {
  fetchCurrentRound,
  fetchRounds,
  fetchReviewComments,
  fetchApprovedSnapshot,
  postReply,
  resolveReviewComment,
  revokeReview,
  type CurrentRound,
  type RoundListRow,
  type ReviewComment,
} from "../../../../services/ReviewService";

export interface ReviewTabProps {
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Full re-send (re-renders the snapshot, mints a fresh token) — provided by
   *  the shell so ReviewTab stays decoupled from the composer/export path. */
  /** A re-send goes to whoever the round was sent to. The panel passes the
   *  round's `invitedEmail`; without it `submitReview` mints no token and the
   *  new round is invisible to the client — measured 2026-08-25. */
  onResend?: (clientEmail?: string) => Promise<{ inviteEmailSent: boolean | null } | void>;
  /** Live-render the current site to pages for the §3 Compare — same decoupling
   *  as onResend (the shell owns the composer/export path). Absent → no Compare. */
  onExportCurrentPages?: () => Promise<PublishPage[]>;
  /** Composer for the orphan-comment events (Detached group + reattach) and
   *  for page names — the boards label groups "OPEN · HOME", not by page id. */
  composer?: import("@/engine").Composer | null;
  /** Open Compare on mount — a deep link (`openLeftPanelToTab("review",
   *  "compare")`), the way the history tab deep-links to its Published view. */
  initialCompare?: boolean;
}

type LoadState = "loading" | "ready" | "error";

const BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto";
const META = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/** The grey band over each page's comments, and over RESOLVED / DETACHED.
 *  Figma component 16:16 ("28h. The right-aligned count is mono so the numbers
 *  do not jitter as a list filters"), drawn on 157:2 as 220:855. */
const BAND =
  "tw:flex tw:items-center tw:gap-2 tw:w-full tw:px-4 tw:h-7 tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[11px] tw:leading-4 tw:font-medium tw:uppercase tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)] " +
  "tw:border-0 tw:justify-between";
/** The band's trailing count — data/11 · mono, not the band's own Inter. */
const BAND_COUNT =
  "tw:[font-family:var(--bk-font-mono)] tw:tabular-nums tw:text-[11px] tw:leading-4 tw:font-medium";
const FOOT = "tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:py-3 tw:flex tw:flex-col tw:gap-2";
const ROUND_STRIP =
  "tw:flex tw:items-center tw:justify-center tw:h-8 tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]";
/** Both confirms (revoke, re-send) are inline panels on the boards, not modals. */
const CONFIRM =
  "tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-3 tw:bg-[var(--bk-warning-tint)] " +
  "tw:border-b tw:border-[var(--bk-border)]";
const COMPOSER = "tw:border-t tw:border-[var(--bk-border)] tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-2";
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

/** "2d" / "3h" / "12m" — the boards' scale, which is shorter than relTime's. */
function shortAge(iso: string | Date): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/** "Sent 2d ago · Sara" — board 156:2's subtitle. */
function sentLine(round: CurrentRound): string {
  const age = shortAge(round.createdAt);
  const who = round.reviewerName ?? round.invitedEmail;
  return `Sent ${age === "just now" ? "just now" : `${age} ago`}${who ? ` · ${who}` : ""}`;
}

interface Group {
  key: string;
  label: string;
  comments: ReviewComment[];
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
  onResend,
  onExportCurrentPages,
  composer,
  initialCompare,
}) => {
  const [state, setState] = React.useState<LoadState>("loading");
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  /* The viewer gating did not move with the control — see the props below. */
  const isViewer = useEditorRole() === "VIEWER";
  const [comments, setComments] = React.useState<ReviewComment[]>([]);
  const [resolvedOpen, setResolvedOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [replyError, setReplyError] = React.useState(false);
  const [confirmRevoke, setConfirmRevoke] = React.useState(false);
  const [confirmResend, setConfirmResend] = React.useState(false);
  // Orphaned pins (element deleted) — announced by the canvas CommentLayer.
  const [detachedIds, setDetachedIds] = React.useState<ReadonlySet<string>>(new Set());
  const [resending, setResending] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [compareOpen, setCompareOpen] = React.useState(false);
  /* The banner's walk (retired ReviewBar's "Next ›"): steps through the OPEN
     comments in server order, switching page and selecting each anchor via
     `locateComment` (C2, #39). */
  const [walkCursor, setWalkCursor] = React.useState(0);
  /* Compare's mode is lifted here because it decides WHERE the view renders:
     list in the 280 drawer, split and overlay at 1080 in an OverlayMount
     (B1, founder call 2026-09-08). Defaults to "split", matching what
     ApprovedCompareView opened with before the mode moved out. */
  const [compareMode, setCompareMode] = React.useState<"split" | "overlay" | "list">("split");
  const [compareState, setCompareState] = React.useState<LoadState>("loading");
  const [approvedSnap, setApprovedSnap] = React.useState<PublishPage[] | null>(null);
  const [currentPages, setCurrentPages] = React.useState<PublishPage[] | null>(null);

  /* Previous rounds — board 157:169's buildable half. Lazy: fetched the first
     time the strip is opened, because most sessions never look back. `null`
     means not asked yet; an error keeps the strip usable with a retry line
     (DF5 — a failed read must not impersonate "no history"). */
  const [roundsOpen, setRoundsOpen] = React.useState(false);
  const [rounds, setRounds] = React.useState<RoundListRow[] | null>(null);
  const [roundsError, setRoundsError] = React.useState(false);
  const loadRounds = React.useCallback(async () => {
    setRoundsError(false);
    try {
      setRounds(await fetchRounds());
    } catch {
      setRoundsError(true);
    }
  }, []);
  const toggleRounds = React.useCallback(() => {
    setRoundsOpen((open) => {
      const next = !open;
      if (next && rounds === null) void loadRounds();
      return next;
    });
  }, [rounds, loadRounds]);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const [r, cs] = await Promise.all([fetchCurrentRound(), fetchReviewComments()]);
      setRound(r);
      setComments(cs);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  React.useEffect(() => {
    if (!composer) return;
    const onOrphans = (p: { ids?: string[] }) => setDetachedIds(new Set(p?.ids ?? []));
    const onReattached = () => void load();
    composer.on("comments:orphans", onOrphans);
    composer.on("comments:reattached", onReattached);
    // The canvas layer detected orphans before this panel mounted — ask for a
    // replay of the current set.
    composer.emit("comments:orphans-request", {});
    return () => {
      composer.off("comments:orphans", onOrphans);
      composer.off("comments:reattached", onReattached);
    };
  }, [composer, load]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /* Every mutation in this panel — reply, resolve, reopen — lands here. The
     canvas draws the same comments as pins and refetches them on
     "comments:refresh". */
  const reload = React.useCallback(async () => {
    try {
      setComments(await fetchReviewComments());
      setRound(await fetchCurrentRound());
      composer?.emit("comments:refresh", {});
    } catch {
      /* keep the current view; the next explicit load surfaces errors */
    }
  }, [composer]);

  /* Board 156:2 labels a group "OPEN · HOME" — the page's NAME. The engine is
     the only thing that knows it; without this the panel printed the raw
     pageId, which is a cuid on any real site. */
  const pageName = React.useCallback(
    (pageId: string | null): string => {
      if (!pageId) return "General";
      const pages = composer?.elements?.getAllPages?.() ?? [];
      return pages.find((p) => p.id === pageId)?.name ?? pageId;
    },
    [composer],
  );

  const activePage = round && comments[0]?.pageId ? comments[0].pageId : undefined;

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setReplyError(false);
    try {
      await postReply(body, activePage);
      setDraft("");
      await reload();
    } catch {
      setReplyError(true);
    } finally {
      setSending(false);
    }
  };

  const onResolve = async (c: ReviewComment) => {
    try {
      await resolveReviewComment(c.id, c.status === "RESOLVED" ? "OPEN" : "RESOLVED");
      await reload();
    } catch {
      setNotice("Couldn't update that comment. Try again.");
    }
  };

  const onRevoke = async () => {
    setConfirmRevoke(false);
    if (!round) return;
    const res = await revokeReview(round.id, round.revision);
    if (res.revoked) {
      setNotice(hasClientLink ? "Review link revoked." : "Review request withdrawn.");
      await reload();
    } else if (res.reason === "token-changed") {
      setNotice("This round changed (a re-send happened) — reloading.");
      await reload();
    } else if (res.reason === "already-revoked") {
      setNotice(hasClientLink ? "This link was already revoked." : "This request was already withdrawn.");
      await reload();
    } else {
      setNotice(hasClientLink ? "Couldn't revoke the link. Try again." : "Couldn't withdraw the request. Try again.");
    }
  };

  const doResend = async () => {
    setConfirmResend(false);
    if (!onResend) return;
    setResending(true);
    try {
      // Carry the round's client forward. `submitReview` only mints a token
      // when it is given an email, so a re-send without this produced a round
      // with `token: null` that the client could never open.
      const outcome = await onResend(round?.invitedEmail ?? undefined);
      await reload();
      /* The round lands either way — a mail failure must never fail the
         re-send. Saying nothing is what made a misconfigured SMTP look
         identical to a client who simply had not opened the link. */
      setNotice(
        outcome && outcome.inviteEmailSent === false
          ? "Round created — but the invite email didn't go out. Send your client the link yourself."
          : null,
      );
    } finally {
      setResending(false);
    }
  };

  const openCompare = React.useCallback(async () => {
    if (!onExportCurrentPages) return;
    setCompareOpen(true);
    setCompareState("loading");
    setCurrentPages(null);
    // Export the current side in parallel — it can resolve after the approved
    // side (the per-side loading asymmetry the view is built for).
    void onExportCurrentPages().then(setCurrentPages).catch(() => setCurrentPages([]));
    try {
      // The approved read throws on transport failure (DF5) → error state,
      // never a fake "nothing changed". A real null = no stored snapshot.
      setApprovedSnap(await fetchApprovedSnapshot());
      setCompareState("ready");
    } catch {
      setCompareState("error");
    }
  }, [onExportCurrentPages]);

  /* The Compare deep link. Fires once — reopening Compare after the user
     closes it would trap them in it while the deep-link prop is still true. */
  const compareRequested = React.useRef(false);
  React.useEffect(() => {
    if (!initialCompare || compareRequested.current || !onExportCurrentPages) return;
    compareRequested.current = true;
    void openCompare();
  }, [initialCompare, onExportCurrentPages, openCompare]);

  const header = (
    <PanelHeader
      title="Review"
      isExpanded={isExpanded}
      onExpandToggle={onExpandToggle}
      onHelpClick={onHelpClick}
      onClose={onClose}
    />
  );

  /* Board 1138:4527: the loading state is the shape of the list to come, not a
     spinner in an empty panel. */
  if (state === "loading") {
    return (
      <div className={BODY} data-review-state="loading">
        {header}
        <div className="tw:flex tw:flex-col tw:gap-3 tw:p-3" aria-busy="true" aria-label="Loading review">
          {/* Board 1138:4527's own rhythm: a full-width row, then indented
              shorter ones — the shape of a grouped thread list, not four
              identical bars. */}
          {[
            { indent: 0, width: "70%" },
            { indent: 16, width: "55%" },
            { indent: 32, width: "85%" },
            { indent: 32, width: "62%" },
            { indent: 16, width: "45%" },
          ].map((r, i) => (
            <div key={i} className="tw:flex tw:items-start tw:gap-2" style={{ paddingLeft: r.indent }}>
              <SkeletonBlock className="tw:size-3 tw:flex-none tw:rounded" />
              <SkeletonBlock className="tw:h-3" style={{ width: r.width }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = comments.length;
  const resolvedComments = comments.filter((c) => c.status === "RESOLVED");
  const openComments = comments.filter((c) => c.status !== "RESOLVED");
  const pct = total === 0 ? 0 : Math.round((resolvedComments.length / total) * 100);

  /* The progress row and the sent line are the frame — every board carries
     them, including the error one. The BAR itself only renders once there is
     something to measure: "0 of 0" over an empty thread was a gauge with no
     quantity (designer walk 2026-08-28). The sent line stays either way. */
  const progress = (
    <>
      {total > 0 && (
        /* Board 157:8 — a 44-tall block, the 140 track at x16 and the mono
           count at x170. The track is FIXED, not flex-1: the count is mono and
           tabular precisely so it does not move as the numbers change, which a
           flexible track would undo. */
        <div
          className="tw:flex tw:h-11 tw:w-full tw:flex-none tw:items-center tw:gap-[14px] tw:px-4"
          data-testid="review-progress"
        >
          <span
            className="tw:h-1.5 tw:w-[140px] tw:flex-none tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:overflow-hidden"
            role="progressbar"
            aria-valuenow={resolvedComments.length}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Comments resolved"
            data-testid="review-progress-track"
          >
            <span
              className="tw:block tw:h-full tw:rounded-[4px] tw:bg-[var(--bk-success)]"
              style={{ width: `${pct}%` }}
              data-testid="review-progress-fill"
            />
          </span>
          <span
            className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink)]"
            data-testid="review-progress-count"
          >
            {resolvedComments.length} of {total}
          </span>
        </div>
      )}
      {/* Board 157:12 — a 28-tall block of its own, so the sent line keeps its
          place whether or not there is a bar above it. */}
      {round || notice ? (
        <div
          className="tw:flex tw:h-7 tw:w-full tw:flex-none tw:flex-col tw:justify-center tw:px-4"
          data-testid="review-sent-meta"
        >
          {round ? (
            <span className={META} data-testid="review-sent-line">
              {sentLine(round)}
            </span>
          ) : null}
          {notice ? <span className={META}>{notice}</span> : null}
        </div>
      ) : null}
    </>
  );

  const compareButton = (
    <Button
      color="light"
      size="xs"
      onClick={() => void openCompare()}
      disabled={!onExportCurrentPages}
      title={!onExportCurrentPages ? "Compare isn't available here" : undefined}
      /* Board 229:1090: `--size/row-dense` (28) with 12/6 padding and an 8
         radius — the dense secondary, not the 40-tall default a bare
         `<Button>` renders. `tw:h-7` and not `tw:min-h-7`: on a flowbite
         component only a SAME-property utility survives twMerge. */
      /* --color/border and gray-700, not flowbite `light`'s gray-300 border and
         gray-900 label — the same call-site override DrawerGallery's
         `tpl-browse-all` carries for board 1138:13422. See the report:
         the secondary Button has now been corrected at the call site six
         times, which is a theme's job, not a call site's. */
      className={
        "tw:h-7 tw:w-full tw:justify-center tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-[13px] tw:leading-[18px] " +
        "tw:border-[var(--bk-border)] tw:text-[var(--bk-gray-700)]"
      }
      data-testid="review-compare"
    >
      Compare with approved
    </Button>
  );

  if (state === "error") {
    return (
      <div className={BODY} data-review-state="error">
        {header}
        {progress}
        <div className={SCROLL}>
          {/* Board 453:3974 puts the failure in red and the reassurance in
              grey under it — EmptyState's title is ink-coloured, and the
              distinction is the whole point of the state. */}
          <div className="tw:px-6 tw:py-8 tw:text-center tw:flex tw:flex-col tw:gap-2" role="alert">
            <span className="tw:text-[13px] tw:text-[var(--bk-error-text)]">
              Couldn&apos;t load this review round.
            </span>
            <span className={META}>Your work is safe — only the review list failed to load.</span>
          </div>
        </div>
        <div className={FOOT}>
          {compareButton}
          <Button onClick={() => void load()} className="tw:w-full tw:justify-center">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className={BODY} data-review-state="never-sent">
        {header}
        <EmptyState
          className="tw:flex-1"
          icon={<CheckCircle2 size={24} aria-hidden="true" />}
          title="No review yet"
          /* This used to read "Open client view from the Site menu, then use
             'Send for review' there" — accurate at the time, because
             StudioHeader rendered that control under viewMode.readOnlyView and
             nowhere else. View mode is a VIEW now (founder, 2026-08-23), so
             that door is shut and the instruction would point at nothing.
             Inviting a client is the owner's act and this panel already owns
             the review lifecycle, so the control lives here instead of being
             described somewhere else. */
          body="Send this site to a client and they get a link to comment on it."
        />
        <div className="tw:px-[16px] tw:pb-[16px]">
          {/* Three things this line lost when the control moved off the topbar,
              all of them in the props the topbar used to pass:
              · disabledReason — a VIEWER got a live button and a silent failure
              · onSent — the topbar's review pill never refreshed after a send,
                and this panel kept saying "No review yet" under a button that
                said it had been sent
              · reviewStatus={null} — SendForReview unlocks "Sent ✓" into "Send
                again" only when the round's `at` moves, so a literal null
                wedged the button forever. */}
          <SendForReview
            composer={composer ?? null}
            disabledReason={isViewer ? "Viewers can't send for review — ask an editor" : undefined}
            reviewStatus={round ?? null}
            onSent={(outcome) => {
                  /* The panel keeps this, not SendForReview — that component is
                     unmounted by the very reload this triggers. */
                  setNotice(
                    outcome?.inviteEmailSent === false
                      ? "Round created — but the invite email didn't go out. Send your client the link yourself."
                      : null,
                  );
                  void load();
                }}
          />
        </div>
      </div>
    );
  }

  if (compareOpen) {
    const compareView = (
      <ApprovedCompareView
        approvedPages={approvedSnap}
        currentPages={currentPages}
        mode={compareMode}
        onModeChange={setCompareMode}
        onBack={() => setCompareOpen(false)}
        onRefreshCurrent={
          onExportCurrentPages
            ? () => {
                setCurrentPages(null);
                void onExportCurrentPages().then(setCurrentPages).catch(() => setCurrentPages([]));
              }
            : undefined
        }
      />
    );
    return (
      <div className={BODY} data-review-state="compare">
        {/* No strip of our own: every Compare board draws ONE 48-tall bar, and
            the way back is a hotspot at its left end. ApprovedCompareView owns
            that bar and takes `onBack`; this used to stack a second Toolbar
            above it, so the panel showed two rules and two titles. The loading
            and error states keep a bar because there is no compare view yet to
            carry one. */}
        {compareState === "loading" ? (
          <>
          <Toolbar>
            <Button color="light" size="xs" onClick={() => setCompareOpen(false)} className={GHOST}>
              <ChevronLeft size={14} aria-hidden="true" /> Back
            </Button>
            <span className="tw:text-xs tw:font-semibold tw:text-[var(--bk-ink)]">Compare with approved</span>
          </Toolbar>
          <EmptyState className="tw:flex-1" icon={<Spinner size="lg" />} body="Loading approved snapshot…" />
          </>
        ) : compareState === "error" ? (
          <>
          <Toolbar>
            <Button color="light" size="xs" onClick={() => setCompareOpen(false)} className={GHOST}>
              <ChevronLeft size={14} aria-hidden="true" /> Back
            </Button>
            <span className="tw:text-xs tw:font-semibold tw:text-[var(--bk-ink)]">Compare with approved</span>
          </Toolbar>
          <EmptyState
            className="tw:flex-1"
            icon={<AlertCircle size={24} aria-hidden="true" />}
            title="Couldn't load the approved snapshot"
            body="The dashboard didn't answer. Try again."
            action={<Button color="light" size="xs" onClick={() => void openCompare()}>Retry</Button>}
          />
          </>
        ) : compareMode === "list" ? (
          /* LIST stays in the drawer: one column reads fine at 280, and the
             board draws it that way. */
          compareView
        ) : (
          /* SPLIT and OVERLAY open at 1080 (boards 168:2 / 168:26 / 168:48,
             founder call 2026-09-08 closing BLOCKERS.md B1). In the 280 drawer
             each pane was ~140px, so "Side by side" was only side-by-side on
             the board's own surface. `OverlayMount` is chrome-ui's overlay-root
             primitive, which is what Gate 22 requires — no bare createPortal.
             Closing the overlay drops back to list rather than leaving Compare
             entirely: the user asked for a comparison, not to leave one. */
          <>
            {compareView === null ? null : (
              <OverlayMount open onClose={() => setCompareMode("list")} labelledBy="compare-title">
                <div
                  className="tw:flex tw:h-[760px] tw:w-[1080px] tw:max-w-[95vw] tw:flex-col tw:overflow-hidden tw:rounded-lg tw:bg-[var(--bk-bg-panel)]"
                  data-testid="compare-overlay"
                >
                  {compareView}
                </div>
              </OverlayMount>
            )}
          </>
        )}
      </div>
    );
  }

  const detached = openComments.filter((c) => detachedIds.has(c.id));
  const attached = openComments.filter((c) => !detachedIds.has(c.id));

  /* One id per row across the WHOLE list, in render order (detached, then the
     page groups, then resolved), so a probe or recipe can address the third row
     without knowing which group it fell into. */
  const rowIndex = new Map(
    [...detached, ...attached, ...resolvedComments].map((c, i) => [c.id, i]),
  );

  const groups: Group[] = [];
  for (const c of attached) {
    const key = c.pageId ?? "__none__";
    const existing = groups.find((g) => g.key === key);
    if (existing) existing.comments.push(c);
    else groups.push({ key, label: pageName(c.pageId), comments: [c] });
  }

  /* Board 157:157 gives a RESOLVED row a different second line from an open
     one: not where the pin lives and how old it is, but who closed it and
     when. The panel had the resolver's id all along — `resolvedById` is
     written on every resolve — and no name to put with it, so every resolved
     row read the same as an open one. Falls back to the open-row meta when the
     resolver cannot be named (a comment resolved before this shipped). */
  const rowMeta = (c: ReviewComment) => {
    if (c.status === "RESOLVED" && c.resolvedByName) {
      return `resolved by ${c.resolvedByName} · ${shortAge(c.resolvedAt ?? c.createdAt)}`;
    }
    return `${pageName(c.pageId)} · ${shortAge(c.createdAt)}`;
  };

  const resolveButton = (c: ReviewComment) => (
    <Button color="light" size="xs" onClick={() => void onResolve(c)} className={GHOST}>
      {c.status === "RESOLVED" ? "Reopen" : "Resolve"}
    </Button>
  );

  const row = (
    c: ReviewComment,
    extra?: { detachedNote?: string; actions?: React.ReactNode },
  ) => (
    <CommentRow
      key={c.id}
      data-testid={`review-comment-row-${rowIndex.get(c.id)}`}
      index={rowIndex.get(c.id)}
      author={c.authorKind === "client" ? (c.authorName ?? "Client") : "You"}
      authorKind={c.authorKind === "client" ? "client" : "internal"}
      body={c.body}
      meta={rowMeta(c)}
      resolved={c.status === "RESOLVED"}
      detachedNote={extra?.detachedNote}
      data-comment-row
      data-comment-id={c.id}
      actions={extra?.actions ?? resolveButton(c)}
    />
  );

  /* Two kinds of round land here and the boards draw only one. A round
     submitted from the dashboard's "Send for Review" carries no clientEmail, so
     `review.service.ts` mints no token: there is no link to revoke, nobody to
     lose access, and nothing to re-send to. Every string below used to name a
     link anyway. It is also the round that can wedge publish, so the copy shown
     while the user digs out has to describe what actually happened. */
  const hasClientLink = round.invitedEmail !== null;

  /* Board 158:162 — the link is dead, the comments are not. */
  const revokedBody = (
    <div className="tw:px-6 tw:py-8 tw:text-center tw:flex tw:flex-col tw:gap-2">
      <span className="tw:text-[14px] tw:text-[var(--bk-error)]">
        {hasClientLink ? "This review link was revoked." : "This review request was withdrawn."}
      </span>
      <span className={META}>
        {hasClientLink
          ? `${round.reviewerName ?? "The reviewer"} can no longer open it. Earlier comments are kept below.`
          : "Nobody is waiting on it now. Earlier comments are kept below."}
      </span>
    </div>
  );

  /* Board 157:58 — the round is finished; the next one is the obvious move. */
  const allResolvedBody = (
    <div className="tw:px-6 tw:py-8 tw:text-center tw:flex tw:flex-col tw:gap-2">
      <span className="tw:text-[13px] tw:text-[var(--bk-success-text)]">Everything is resolved.</span>
      <span className={META}>
        {resolvedComments.length} of {total} — ready to send round {round.roundNumber + 1}.
      </span>
    </div>
  );

  /* ── The round banner (C2 · board B3-05 7571:191619) ─────────────────────
     Board 200:213's ReviewBar — a strip under the topbar with the open count,
     a walk through the comments, Compare and Re-send — is retired (owner
     decision D3): the topbar chip says WHERE the round stands and this
     panel is where it is worked. What the bar owned that the panel did not
     was the walk; it lives here now, in a band at the top of the drawer:
     warning-tinted when the client asked for changes (B3-05), neutral while
     the round is merely out. The re-send is the panel's own (confirm when
     comments are open). Absent for a finished or revoked round. */
  const changesRequested = round.status?.toLowerCase() === "changes_requested";
  const roundLive = !round.revoked && (round.status?.toLowerCase() === "pending" || changesRequested);
  const walk = () => {
    if (!composer || openComments.length === 0) return;
    const i = walkCursor % openComments.length;
    setWalkCursor(i + 1);
    locateComment(composer, openComments[i]);
  };
  const walkable = Boolean(composer) && openComments.length > 0;
  /* A zero here was a count where a sentence belongs: `0 open` meant "your
     client has not replied yet" and printed a number that says none of that.
     The count earns its place the moment there IS one. */
  const bannerLine =
    openComments.length > 0
      ? changesRequested
        ? `${round.reviewerName ?? "Your reviewer"} asked for changes · ${openComments.length} open`
        : `${openComments.length} open`
      : changesRequested
        ? "Changes requested — nothing left open"
        : "Sent — waiting on your client";
  const roundBanner = roundLive ? (
    <div
      className={`tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:border-b tw:border-[var(--bk-border)] ${
        changesRequested ? "tw:bg-[var(--bk-warning-tint)]" : "tw:bg-[var(--bk-bg-subtle)]"
      }`}
      role="region"
      aria-label={changesRequested ? "Changes requested" : "Review in progress"}
      data-testid="review-banner"
      data-tone={changesRequested ? "warning" : "neutral"}
    >
      <span
        className={`tw:min-w-0 tw:flex-1 tw:text-[12px] tw:leading-4 tw:font-medium ${
          changesRequested ? "tw:text-[var(--bk-warning-text)]" : "tw:text-[var(--bk-ink-soft)]"
        }`}
        data-testid="review-banner-line"
      >
        {bannerLine}
      </span>
      <Button
        color="light"
        size="xs"
        className={`${GHOST} tw:h-6 tw:px-1.5 tw:text-[12px]`}
        onClick={walk}
        disabled={!walkable}
        /* Disabled without a reason is a bug, not a state (wireframes §5.8). */
        title={walkable ? undefined : "No open comments to step through"}
        data-testid="review-banner-next"
      >
        Next ›
      </Button>
    </div>
  ) : null;

  /* Board 157:221 — sent, nothing back yet. */
  const emptyBody = (
    <div className="tw:px-6 tw:py-8 tw:text-center tw:flex tw:flex-col tw:gap-2">
      <span className="tw:text-[14px] tw:text-[var(--bk-ink)]">
        {round.reviewerName ?? "Your reviewer"} has not commented yet.
      </span>
      <span className={META}>You will be notified.</span>
    </div>
  );

  const primaryLabel = resending
    ? `Sending round ${round.roundNumber + 1}…`
    : round.revoked
      ? hasClientLink
        ? "Send a new link"
        : "Send for review again"
      : "Re-send for review";

  return (
    <div className={BODY} data-review-state={round.revoked ? "revoked" : "open"}>
      {header}
      {roundBanner}

      {/* Board 158:105: revoke asks at the top of the panel, in the panel. */}
      {confirmRevoke && (
        <div
          className={CONFIRM}
          role="alertdialog"
          aria-label={hasClientLink ? "Revoke this review link?" : "Withdraw this review request?"}
        >
          <span className="tw:text-[12px] tw:text-[var(--bk-error-text)]">
            {hasClientLink ? "Revoke this review link?" : "Withdraw this review request?"}
          </span>
          <span className={META}>
            {hasClientLink
              ? `${round.reviewerName ?? "The reviewer"} will lose access immediately. You can send a new link any time.`
              : "The request stops waiting for a reply. You can send it again any time."}
          </span>
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pt-1">
            <Button color="light" size="xs" className="tw:h-7" onClick={() => setConfirmRevoke(false)}>
              Cancel
            </Button>
            {/* `red`, not `failure` — ConfirmDialog:49 is the precedent, and
                flowbite's "failure" rendered a neutral grey button here. */}
            <Button color="red" size="xs" className="tw:h-7 tw:bg-[var(--bk-error)] tw:hover:bg-[var(--bk-error-text)]" onClick={() => void onRevoke()}>
              Revoke
            </Button>
          </div>
        </div>
      )}

      {progress}

      <div className={SCROLL}>
        {/* A CHANGES_REQUESTED round's own sentence is the banner above; its
            thread renders like any other (or the all-resolved close). */}
        {round.revoked
          ? revokedBody
          : total === 0
            ? changesRequested
              ? null
              : emptyBody
            : openComments.length === 0
              ? allResolvedBody
              : null}

        {detached.length > 0 && (
          <div data-detached-group>
            {/* Board 157:2 fills this band, it does not merely tint its words:
                measured off the frame at #FCFCEA on `var(--bk-yellow-800)`, against `var(--bk-gray-100)`
                for the OPEN/RESOLVED bands beside it. A detached comment is
                the one row in this list that lost its anchor, and a grey band
                with amber text reads as the same band as its neighbours. */}
            <div
              className={BAND}
              style={{ background: "var(--bk-warning-tint)", color: "var(--bk-warning-text)" }}
              data-testid="review-detached-band"
            >
              <span className="tw:flex tw:items-center tw:gap-1.5">
                <AlertCircle size={12} aria-hidden="true" /> Detached
              </span>
              <span className={BAND_COUNT}>{detached.length}</span>
            </div>
            {detached.map((c) =>
              row(c, {
                detachedNote: "element deleted",
                actions: (
                  <>
                    <Button
                      color="light"
                      size="xs"
                      onClick={() => composer?.emit("comments:reattach-start", { id: c.id })}
                      className={GHOST}
                    >
                      Reattach
                    </Button>
                    {resolveButton(c)}
                  </>
                ),
              }),
            )}
          </div>
        )}

        {groups.map((g, i) => (
          <div key={g.key}>
            <div className={BAND} data-testid={`review-band-${i}`}>
              {/* Board 156:2 marks where the open thread starts, then names
                  each page after it. */}
              <span data-testid={`review-band-label-${i}`}>
                {i === 0 ? `Open · ${g.label}` : g.label}
              </span>
              <span className={BAND_COUNT} data-testid={`review-band-count-${i}`}>
                {g.comments.length}
              </span>
            </div>
            {g.comments.map((c) => row(c))}
          </div>
        ))}

        {resolvedComments.length > 0 && (
          <div data-resolved-group>
            <Button
              color="light"
              className={BAND}
              aria-expanded={resolvedOpen}
              onClick={() => setResolvedOpen((v) => !v)}
              data-testid="review-resolved-band"
            >
              <span>Resolved</span>
              <span className={`${BAND_COUNT} tw:flex tw:items-center tw:gap-1`}>
                {resolvedComments.length}
                {resolvedOpen ? (
                  <ChevronDown size={12} aria-hidden="true" />
                ) : (
                  <ChevronRight size={12} aria-hidden="true" />
                )}
              </span>
            </Button>
            {resolvedOpen && resolvedComments.map((c) => row(c))}
          </div>
        )}
      </div>

      {/* The strip opens the history now (reviews.rounds, 2026-08-28). What it
          still does NOT do is open an older round's COMMENTS — those carry no
          round id by design (contracts §6.4, comments outlive rounds), so the
          history is header lines, which is everything the data can honestly
          say. */}
      <Button
        color="light"
        className={`${ROUND_STRIP} tw:w-full tw:rounded-none tw:border-0 tw:cursor-pointer`}
        aria-expanded={roundsOpen}
        data-testid="review-rounds-toggle"
        onClick={toggleRounds}
      >
        Round {round.roundNumber} of {round.totalRounds}
        {round.totalRounds > 1 ? (roundsOpen ? " ▾" : " ▸") : ""}
      </Button>
      {roundsOpen && (
        <div className="tw:bg-[var(--bk-bg-subtle)] tw:flex tw:flex-col" data-testid="review-rounds-list">
          {/* Board 1753:8422 — 12px lines on a 24 pitch, inset 12, which puts
              each line at the board's 256. The rows are their own block so the
              read-only note below can be the 32-tall block 157:219 draws. */}
          <div
            /* The colour is stated, not inherited. 1753:8422 says
               `--color/ink-soft`; this block set only a size, so it took
               whatever the host painted — #000000 in the probe, i.e. a black
               that no board asks for and that nothing in the panel matches.
               Same defect the Content panel's "Published" label carried. */
            className="tw:flex tw:flex-col tw:px-3 tw:py-1 tw:text-[12px] tw:text-[color:var(--bk-ink-soft)]"
            data-testid="review-rounds-rows"
          >
          {roundsError ? (
            <span className={META}>
              Couldn't load the history.{" "}
              <Button color="light" size="xs" variant="link" className="tw:text-[12px]" onClick={() => void loadRounds()}>
                Try again
              </Button>
            </span>
          ) : rounds === null ? (
            <span className={META}>Loading…</span>
          ) : rounds.length <= 1 ? (
            <span className={META}>This is the first round.</span>
          ) : (
            rounds
              .filter((r) => r.id !== round.id)
              .map((r) => (
                <span key={r.id} className="tw:flex tw:h-6 tw:items-center tw:text-[12px] tw:leading-5 tw:text-[var(--bk-ink-soft)]" data-testid={`review-round-${r.roundNumber}`}>
                  {/* Board 1753:8423-8429: "Round 6 · approved 3d ago" — the
                      outcome then a RELATIVE age, which is the scale the rest of
                      this panel uses ("Sent 2d ago · Sara"). It printed
                      `toLocaleDateString()` and the reviewer's name, so one
                      panel spoke in both "2d ago" and "9/5/2026", and repeated
                      a name already on the line above.
                      Outcome first, and outcome over revocation: a revoked link
                      does not undo an approval. Every previous round printed
                      "Revoked" while the DB said APPROVED or CHANGES_REQUESTED
                      (measured 2026-09-02), which is why the revocation is a
                      suffix and not the verb. */}
                  Round {r.roundNumber} ·{" "}
                  {r.status === "APPROVED"
                    ? "approved"
                    : r.status === "CHANGES_REQUESTED"
                      ? "changes requested"
                      : r.revoked
                        ? "revoked"
                        : "sent"}{" "}
                  {shortAge(r.resolvedAt ?? r.createdAt)} ago
                  {r.revoked && (r.status === "APPROVED" || r.status === "CHANGES_REQUESTED")
                    ? " · link revoked"
                    : ""}
                </span>
              ))
          )}
          </div>
          {/* Board 157:219. The list is header lines and nothing else — no
              endpoint returns an older round's comments (contracts §6.4:
              comments carry no round id) — so saying so is the difference
              between a deliberate limit and a list that looks broken. Only
              once there IS an older round to be read-only about. */}
          {rounds && rounds.length > 1 ? (
            <div className="tw:flex tw:h-8 tw:flex-none tw:items-center tw:px-4" data-testid="review-rounds-note">
              <span className={META} data-testid="review-rounds-note-text">
                Older rounds are read-only.
              </span>
            </div>
          ) : null}
        </div>
      )}

      <div className={COMPOSER}>
        <Textarea
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply to the client…"
          rows={2}
          maxLength={2000}
        />
        {replyError && <span className={META}>Couldn't send that reply. Try again.</span>}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <span className={META}>Replies are internal notes on the thread.</span>
          <Button size="xs" disabled={!draft.trim() || sending} onClick={() => void send()} aria-busy={sending || undefined}>
            Send
          </Button>
        </div>
      </div>

      {/* Board 157:48: 40 tall, the 28 button inset 16 — and no top rule; the
          tinted round strip above it is the separation. */}
      <div className="tw:flex tw:h-10 tw:w-full tw:flex-none tw:items-center tw:px-4" data-testid="review-compare-block">
        {compareButton}
      </div>

      {/* Board 158:2 — the confirm REPLACES the primary button rather than
          sitting above it. Two live re-send affordances at once is how you get
          a client's link invalidated by the wrong click. */}
      {confirmResend ? (
        <div className={CONFIRM} role="alertdialog" aria-label="Re-send anyway?">
          <span className="tw:text-[14px] tw:text-[var(--bk-warning-text)]">
            {openComments.length} comment{openComments.length === 1 ? " is" : "s are"} still open.
            Re-send anyway?
          </span>
          <span className={META}>
            {round.reviewerName ?? "The reviewer"} gets a NEW link. The old one stops working
            immediately.
          </span>
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pt-1">
            <Button color="light" size="sm" onClick={() => setConfirmResend(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void doResend()}>
              Re-send
            </Button>
          </div>
        </div>
      ) : (
        <div className="tw:px-3 tw:pb-3 tw:flex tw:flex-col tw:gap-2">
          <Button
            className="tw:w-full tw:justify-center"
            data-testid="review-primary"
            disabled={resending || !onResend}
            title={!onResend ? "Re-send isn't available here" : undefined}
            aria-busy={resending || undefined}
            onClick={() => {
              /* Open comments earn the confirm; a clean round does not — the
                 re-send invalidates the client's current link either way,
                 which is what the confirm says out loud. */
              if (openComments.length > 0 && !round.revoked) setConfirmResend(true);
              else void doResend();
            }}
          >
            {primaryLabel}
          </Button>
          {/* D1-half-B: `SendForReview` — the only control in the product with a
              "Client email" field — rendered under `if (!round)` and nowhere
              else, so once ANY round existed there was no way to invite a
              client to this site again, ever. A round with no client link gets
              the control back here. Reused rather than reimplemented: it
              already owns the snapshot render, the submit and the pill
              refresh. */}
          {!round.revoked && !hasClientLink && (
            <div className="tw:self-center">
              <SendForReview
                composer={composer ?? null}
                disabledReason={isViewer ? "Viewers can't send for review — ask an editor" : undefined}
                /* `revision` IS the round's updatedAt — the same "the at moved,
                   so OUR send landed" signal the pill passes. */
                reviewStatus={{ at: round.revision }}
                onSent={(outcome) => {
                  /* The panel keeps this, not SendForReview — that component is
                     unmounted by the very reload this triggers. */
                  setNotice(
                    outcome?.inviteEmailSent === false
                      ? "Round created — but the invite email didn't go out. Send your client the link yourself."
                      : null,
                  );
                  void load();
                }}
                idleLabel="Invite a client…"
              />
            </div>
          )}
          {!round.revoked && (
            <Button
              color="light"
              size="xs"
              className={`${GHOST} tw:self-center`}
              onClick={() => setConfirmRevoke(true)}
            >
              {hasClientLink ? "Revoke link" : "Withdraw request"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewTab;
