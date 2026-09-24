/**
 * ReviewTab — the editor-side review loop, rebuilt to its own 13 boards
 * (156:2 open · 157:221 empty · 157:58 all-resolved · 157:109
 * resolved-expanded · 157:2 detached-present · 157:169 older-round · 158:2
 * re-send-confirm · 158:57 re-sending · 158:105 revoke-confirm · 158:162
 * revoked · 158:213 review-closed · 453:3974 load-error · 1138:4527 loading).
 *
 * The frame every state shares, top to bottom: the panel header (its ⋯ holds
 * Compare rounds and Round history, board 7071:79114), one status line
 * ("2 open · 1 resolved · Awaiting Sara", board 4418:115784), the thread, then
 * a fixed foot — the note composer. The 4418 Review boards (116040–118896)
 * draw no primary under it, so the re-send ("Re-send review link" · "Send a new
 * link") is a ⋯ row and a re-send in flight reads under the status line.
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
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";
import {
  Button,
  CommentRow,
  EmptyState,
  ConfirmDialog,
  Menu,
  MenuItem,
  PanelHeader,
  Popover,
  SkeletonBlock,
  Spinner,
  Textarea,
  Toolbar,
  useToast,
} from "@/editor/chrome-ui";
import { SendForReview } from "@/editor/shell/SendForReview";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { EVENTS } from "@/shared/constants/events";
import { anchorId, locateComment } from "./locate";
import { ReattachModal, reattachCandidates } from "./ReattachModal";
import { RoundHistoryModal } from "./RoundHistoryModal";
import { BackToActivityRow } from "../activity/BackToActivityRow";
import { anchorSelector } from "@/editor/canvas/comments/commentAnchors";
import { elementDeepLink } from "@/editor/shell/hooks/useDeepLink";
import {
  fetchCurrentRound,
  fetchRounds,
  fetchReviewComments,
  postReply,
  reattachReviewComment,
  resolveReviewComment,
  revokeReview,
  type CurrentRound,
  type RoundListRow,
  type ReviewComment,
} from "../../../../services/ReviewService";

export interface ReviewTabProps {
  /** Opened from a History › Activity row: draw the "‹ Activity" row. */
  fromActivity?: boolean;
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
  /** Composer for the orphan-comment events (Detached group + reattach) and
   *  for page names — the boards label groups "OPEN · HOME", not by page id. */
  composer?: import("@/engine").Composer | null;
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
const COMPOSER =
  "tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-2";
/* Board 4418:115784's "Locate ›": accent text, no chrome, 12/18. */
const LOCATE =
  "tw:h-auto tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent)] tw:hover:underline";
/* Boards 4418:120052 / 120059 / 6879:67202: the confirm body is 13/20 ink and
   its fact lines 12px ink — not the modal's 14px default, not muted. */
const DIALOG_BODY = "tw:flex tw:flex-col tw:gap-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const DIALOG_LINE = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]";
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

/** "3 open · 9 resolved · Awaiting Sara" — board 4418:115784's status line.
 *  The tail is where the round stands: "Round 3" once its link is revoked
 *  (4418:116040), "Not sent yet" for a round no client link was minted for
 *  (6879:66771), and a detached count slots in before it (4418:116906). */
function statusLine(round: CurrentRound | null, open: number, resolved: number, detached = 0): string {
  const counts = `${open} open · ${resolved} resolved${detached > 0 ? ` · ${detached} detached` : ""}`;
  if (!round) return counts;
  const st = round.status?.toLowerCase();
  const who = round.reviewerName ?? round.invitedEmail ?? "the reviewer";
  const tail = round.revoked
    ? `Round ${round.roundNumber}`
    : st === "changes_requested"
      ? "Changes requested"
      : st === "approved"
        ? "Approved"
        : round.invitedEmail === null
          ? "Not sent yet"
          : `Awaiting ${who}`;
  return `${counts} · ${tail}`;
}

interface Group {
  key: string;
  label: string;
  comments: ReviewComment[];
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  fromActivity = false,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
  onResend,
  composer,
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
  /* Board 4418:116264 — a failed resolve names the comment that is still
     open and offers the retry in place. */
  const [resolveFailed, setResolveFailed] = React.useState<ReviewComment | null>(null);
  /* Boards 4418:117140–118407: a comment resolved in this panel stays where it
     was, under a "RESOLVED · <page>" band, instead of jumping into the
     collapsed group — the older ones sit under "Earlier resolved". */
  const [sessionResolved, setSessionResolved] = React.useState<ReadonlySet<string>>(new Set());
  const [confirmRevoke, setConfirmRevoke] = React.useState(false);
  const [confirmResend, setConfirmResend] = React.useState(false);
  const [roundMenuOpen, setRoundMenuOpen] = React.useState(false);
  // Orphaned pins (element deleted) — announced by the canvas CommentLayer.
  const [detachedIds, setDetachedIds] = React.useState<ReadonlySet<string>>(new Set());
  /* Board 4418:115766 — the comment being re-attached through the picker. */
  const [reattaching, setReattaching] = React.useState<ReviewComment | null>(null);
  const [resending, setResending] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  /* The banner's walk (retired ReviewBar's "Next ›"): steps through the OPEN
     comments in server order, switching page and selecting each anchor via
     `locateComment` (C2, #39). */
  const [walkCursor, setWalkCursor] = React.useState(0);

  /* Round history — board 4418:172775's modal. Lazy: fetched the first time
     it is opened, because most sessions never look back. `null` means not
     asked yet; an error keeps the modal usable with a retry line (DF5 — a
     failed read must not impersonate "no history"). */
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
    const next = c.status === "RESOLVED" ? "OPEN" : "RESOLVED";
    setResolveFailed(null);
    try {
      await resolveReviewComment(c.id, next);
      setSessionResolved((prev) => {
        const s = new Set(prev);
        if (next === "RESOLVED") s.add(c.id);
        else s.delete(c.id);
        return s;
      });
      await reload();
    } catch {
      setResolveFailed(c);
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

  /* The one Compare (B8): the shell's CompareHost renders it full-canvas. */
  const openCompare = () =>
    composer?.emit(EVENTS.UI_COMPARE_OPEN, {
      left: { kind: "approved" },
      right: { kind: "current" },
      from: "Review",
    });

  /* Board 7071:79114 — the round's own actions live in a panel ⋯ menu
     (G1-058/059). Only the rows this code can back are drawn: "Open current
     review link" needs the token the dashboard does not send (needs
     dashboard). Compare rounds and Round history live here, not in the body. */
  const roundMenu =
    round ? (
      <Popover
        open={roundMenuOpen}
        onClose={() => setRoundMenuOpen(false)}
        placement="bottom-end"
        label="Review actions"
        trigger={
          <Button
            color="light"
            size="xs"
            className={GHOST}
            aria-label="Review actions"
            aria-haspopup="menu"
            aria-expanded={roundMenuOpen}
            onClick={() => setRoundMenuOpen((v) => !v)}
            data-testid="review-round-menu"
          >
            <MoreHorizontal size={14} aria-hidden="true" />
          </Button>
        }
      >
        <Menu label="Review actions">
          <MenuItem
            disabled={!composer}
            onClick={() => {
              setRoundMenuOpen(false);
              openCompare();
            }}
          >
            Compare rounds
          </MenuItem>
          <MenuItem
            onClick={() => {
              setRoundMenuOpen(false);
              toggleRounds();
            }}
            data-testid="review-menu-round-history"
          >
            Round history ›
          </MenuItem>
          {/* The re-send is a menu row, not a footer button: no 4418 Review
              board draws a primary under the composer. It always asks first —
              4418:120052 for a live round (the re-send kills the client's
              current link), 4418:120059 after a revoke. */}
          {onResend ? (
            <MenuItem
              disabled={resending}
              onClick={() => {
                setRoundMenuOpen(false);
                setConfirmResend(true);
              }}
              data-testid="review-menu-resend"
            >
              {round.revoked
                ? round.invitedEmail !== null
                  ? "Send a new link"
                  : "Send for review again"
                : "Re-send review link"}
            </MenuItem>
          ) : null}
          {!round.revoked ? (
            <MenuItem
              danger
              onClick={() => {
                setRoundMenuOpen(false);
                setConfirmRevoke(true);
              }}
            >
              {round.invitedEmail !== null ? "Revoke link" : "Withdraw request"}
            </MenuItem>
          ) : null}
        </Menu>
      </Popover>
    ) : null;

  const header = (
    <>
      <PanelHeader
        title="Review"
        actions={roundMenu}
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {fromActivity ? (
        <BackToActivityRow onBack={() => composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "activity" })} />
      ) : null}
    </>
  );

  /* Locate › (B3, board rows of 4418:115784): `locateComment` is the one
     page-then-select seam (C2, #39). An anchor deleted since the list loaded
     moves the row into the Detached group — where it has Reattach, not
     Locate (#27) — and a toast says why nothing was selected. */
  const { addToast } = useToast();
  const locate = React.useCallback(
    (c: ReviewComment) => {
      if (!composer) return;
      if (locateComment(composer, c) !== "gone") return;
      setDetachedIds((prev) => new Set(prev).add(c.id));
      addToast({
        tone: "warning",
        description: "This comment lost its anchor — the element it was on has been removed.",
      });
    },
    [composer, addToast],
  );

  /* Copy link (G1-031) — the `?el=&page=` deep link `useDeepLink` opens:
     the editor on this comment's page with its element selected. An
     unanchored comment links to its page. */
  const copyLink = React.useCallback(async (c: ReviewComment) => {
    try {
      await navigator.clipboard.writeText(elementDeepLink(c.targetSelector ? anchorId(c.targetSelector) : null, c.pageId));
      setNotice("Link copied");
    } catch {
      setNotice("Couldn't copy the link — copy it from the address bar.");
    }
  }, []);

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
  const detachedCount = openComments.filter((c) => detachedIds.has(c.id)).length;

  /* Board 4418:115784: one mono status line under the header — counts and
     where the round stands. No progress bar, no sent line. */
  const progress = (
    <div className="tw:flex tw:min-h-9 tw:w-full tw:flex-none tw:flex-col tw:justify-center tw:px-4" data-testid="review-status">
      <span
        className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-soft)]"
        data-testid="review-status-line"
      >
        {/* Board 4418:116906 counts a detached comment once — "3 open · 2
            detached", not five open. */}
        {statusLine(round, openComments.length - detachedCount, resolvedComments.length, detachedCount)}
      </span>
      {resending && round ? (
        <span className={META}>Sending round {round.roundNumber + 1}…</span>
      ) : notice ? (
        <span className={META}>{notice}</span>
      ) : null}
    </div>
  );

  /* Board 4418:116264 (its PROGRESS band is the retired bar, not rebuilt):
     which comment is still open, and the retry beside it. */
  const resolveFailedBlock = resolveFailed ? (
    <div className="tw:flex tw:flex-col tw:items-start tw:gap-2 tw:px-4 tw:pb-3" role="alert" data-testid="review-resolve-failed">
      <span className={META}>Could not update this comment. It is still open.</span>
      <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
        {pageName(resolveFailed.pageId)} · {"“"}
        {resolveFailed.body}
        {"”"} is still open.
      </span>
      <span className="tw:flex tw:flex-col tw:items-start tw:gap-1">
        <Button size="xs" onClick={() => void onResolve(resolveFailed)}>
          Retry resolve
        </Button>
        <Button color="light" size="xs" className={GHOST} onClick={() => setResolveFailed(null)}>
          Dismiss
        </Button>
      </span>
    </div>
  ) : null;

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

  const detached = openComments.filter((c) => detachedIds.has(c.id));
  const attached = comments.filter(
    (c) => (c.status !== "RESOLVED" && !detachedIds.has(c.id)) || (c.status === "RESOLVED" && sessionResolved.has(c.id)),
  );
  const earlierResolved = resolvedComments.filter((c) => !sessionResolved.has(c.id));

  /* One id per row across the WHOLE list, in render order (detached, then the
     page groups, then resolved), so a probe or recipe can address the third row
     without knowing which group it fell into. */
  const rowIndex = new Map(
    [...detached, ...attached, ...earlierResolved].map((c, i) => [c.id, i]),
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
    if (c.status === "RESOLVED" && c.resolvedByName && !sessionResolved.has(c.id)) {
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
    extra?: { detachedNote?: string; footer?: React.ReactNode },
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
      /* B3 flow: clicking the comment itself locates it, as Locate › does.
         Clicks on the row's own buttons (Locate ›, Resolve, Copy link,
         Reattach) are theirs, not the row's. */
      onClick={
        c.targetSelector && (c.status !== "RESOLVED" || sessionResolved.has(c.id)) && !extra?.detachedNote
          ? (e: React.MouseEvent) => {
              if ((e.target as HTMLElement).closest("button")) return;
              locate(c);
            }
          : undefined
      }
      /* Board 4418:115784: the trailing slot is Locate › alone (accent);
         Resolve sits on its own line under the row, Copy link beside it. */
      actions={
        extra?.detachedNote
          ? undefined
          : (c.targetSelector && (c.status !== "RESOLVED" || sessionResolved.has(c.id)) ? (
          <Button color="light" size="xs" onClick={() => locate(c)} className={LOCATE} data-row-locate>
            Locate ›
          </Button>
        ) : undefined)
      }
      footer={
        extra?.footer ?? (
          <>
            {resolveButton(c)}
            {/* Not on board 4418:115784, kept by the owner rule (never
                silently remove a capability): the only door to a comment's
                deep link. Logged in designer-notes.md. */}
            <Button
              color="light"
              size="xs"
              onClick={() => void copyLink(c)}
              className={GHOST}
              data-row-copy-link
            >
              Copy link
            </Button>
          </>
        )
      }
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
      <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error)]">
        {hasClientLink ? "This review link was revoked." : "This review request was withdrawn."}
      </span>
      <span className={META}>
        {hasClientLink
          ? `${round.reviewerName ?? "The reviewer"} can no longer open this link. All ${total} comment${total === 1 ? " is" : "s are"} kept, including ${openComments.length} open comment${openComments.length === 1 ? "" : "s"}.`
          : `Nobody is waiting on it now. All ${total} comment${total === 1 ? " is" : "s are"} kept.`}
      </span>
    </div>
  );

  /* Board 157:58 — the round is finished; the next one is the obvious move. */
  const allResolvedBody = (
    <div className="tw:px-6 tw:py-8 tw:text-center tw:flex tw:flex-col tw:gap-2">
      <span className="tw:text-[13px] tw:text-[var(--bk-success-text)]">Everything is resolved.</span>
      <span className={META}>All comments are resolved. Client approval is shown above.</span>
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

  return (
    <div className={BODY} data-review-state={round.revoked ? "revoked" : "open"}>
      {header}
      {roundBanner}

      {/* Board 6879:67202 — revoke is a modal, opened from the ⋯ menu. */}
      <ConfirmDialog
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={() => void onRevoke()}
        title={hasClientLink ? "Revoke this review link?" : "Withdraw this review request?"}
        confirmLabel={hasClientLink ? "Revoke link" : "Withdraw request"}
        testId="review-revoke-confirm"
        message={
          <div className={DIALOG_BODY}>
            <span>
              {hasClientLink
                ? `${round.reviewerName ?? "The reviewer"} will lose access immediately. Existing comments keep their current status. You can send a new link any time.`
                : "The request stops waiting for a reply. Existing comments keep their current status. You can send it again any time."}
            </span>
            <span className={DIALOG_LINE}>
              {hasClientLink ? "Current link" : "Current request"} · Round {round.roundNumber}
              {round.reviewerName ? ` · ${round.reviewerName}` : ""}
            </span>
            <span className={DIALOG_LINE}>Revoking does not change the approval lock or any comment.</span>
          </div>
        }
      />

      {progress}
      {resolveFailedBlock}

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
                footer: (
                  <>
                    <Button
                      color="light"
                      size="xs"
                      onClick={() => {
                        /* The list is the comment's page, and the registry
                           holds the active page only — so go there first. */
                        const active = composer?.elements.getActivePage()?.id;
                        if (composer && c.pageId && c.pageId !== active) composer.elements.setActivePage(c.pageId);
                        setReattaching(c);
                      }}
                      className={GHOST}
                    >
                      Reattach comment
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
              {/* Boards 4418:117140–118407: every group names its state
                  and page — "OPEN · CONTACT", and "RESOLVED · CONTACT" once
                  everything in it was resolved here. */}
              <span data-testid={`review-band-label-${i}`}>
                {g.comments.every((c) => c.status === "RESOLVED") ? "Resolved" : "Open"} · {g.label}
              </span>
              <span className={BAND_COUNT} data-testid={`review-band-count-${i}`}>
                {g.comments.length}
              </span>
            </div>
            {g.comments.map((c) => row(c))}
          </div>
        ))}

        {earlierResolved.length > 0 && (
          <div data-resolved-group>
            {/* Boards 4418:116040 / 117140: a white disclosure row with a
                chevron and no count — the status line already carries it. */}
            <Button
              color="light"
              className={`${BAND} tw:h-9 tw:bg-transparent tw:border-b tw:border-[var(--bk-border)]`}
              aria-expanded={resolvedOpen}
              aria-label={`${sessionResolved.size > 0 ? "Earlier resolved" : "Resolved"} (${earlierResolved.length})`}
              onClick={() => setResolvedOpen((v) => !v)}
              data-testid="review-resolved-band"
            >
              <span>{sessionResolved.size > 0 ? "Earlier resolved" : "Resolved"}</span>
              {resolvedOpen ? (
                <ChevronDown size={12} aria-hidden="true" />
              ) : (
                <ChevronRight size={12} aria-hidden="true" />
              )}
            </Button>
            {resolvedOpen && earlierResolved.map((c) => row(c))}
          </div>
        )}
      </div>

      <RoundHistoryModal
        open={roundsOpen}
        onClose={() => setRoundsOpen(false)}
        rounds={rounds}
        error={roundsError}
        onRetry={() => void loadRounds()}
        current={round}
        siteName={composer?.getProjectMetadata?.()?.name ?? "This site"}
        onCompare={composer ? openCompare : undefined}
        age={shortAge}
      />

      <div className={COMPOSER}>
        <Textarea
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          /* Board 4418:115784: the composer is a page comment — the page it
             lands on is named under it. It stays team-only (the client's
             review page lists only the client's own notes), so the board's
             "Shared" is not claimed; designer note logged. */
          placeholder={`Comment on ${pageName(activePage ?? null)}…`}
          rows={2}
          maxLength={2000}
        />
        {replyError && (
          <span className={META} role="alert">
            Comment not sent. Your draft is still here.
          </span>
        )}
        <span className={META} data-testid="review-composer-meta">Page comment · {pageName(activePage ?? null)} · team only</span>
        <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
          <Button
            size="xs"
            /* Board 4418:115784: Send is the blue primary — disabled is the
               same blue, dimmed, not the grey the theme gives. */
            className="tw:disabled:bg-[var(--bk-accent)] tw:disabled:text-[var(--bk-accent-on)] tw:disabled:opacity-50"
            disabled={!draft.trim() || sending}
            onClick={() => void send()}
            aria-busy={sending || undefined}
          >
            {replyError ? "Retry send" : "Send"}
          </Button>
        </div>
      </div>

      <ReattachModal
        open={reattaching !== null}
        body={reattaching?.body ?? ""}
        pageName={reattaching ? pageName(reattaching.pageId) : null}
        candidates={
          reattaching && composer
            ? reattachCandidates(
                ((rootId) => (rootId ? composer.elements.getElement(rootId) : null))(
                  composer.elements.getActivePage()?.root.id,
                ),
              )
            : []
        }
        onClose={() => setReattaching(null)}
        onReattach={async (elementId) => {
          const c = reattaching;
          if (!c) return;
          try {
            await reattachReviewComment(c.id, { targetSelector: anchorSelector(elementId), pageId: c.pageId });
          } catch (err) {
            addToast({ tone: "error", description: "Couldn't re-attach the comment. Try again." });
            throw err;
          }
          addToast({ tone: "success", description: "Comment re-attached." });
          composer?.emit("comments:reattached", { id: c.id });
          composer?.emit("comments:refresh", {});
        }}
        onPickOnCanvas={reattaching ? () => composer?.emit("comments:reattach-start", { id: reattaching.id }) : undefined}
      />

      {/* Board 4418:120052 — the re-send confirm is a modal (G1-058), from the
          footer's primary and the ⋯ menu alike. */}
      <ConfirmDialog
        open={confirmResend}
        onClose={() => setConfirmResend(false)}
        onConfirm={() => void doResend()}
        title={`Send a new review to ${round.reviewerName ?? "your reviewer"}?`}
        confirmLabel="Send new review"
        testId="review-resend-confirm"
        message={
          <div className={DIALOG_BODY}>
            <span>
              {composer?.getProjectMetadata?.()?.name ?? "This site"} · Current draft snapshot
              <br />
              Existing comments keep their current statuses.
              {hasClientLink
                ? ` ${round.reviewerName ?? "Your reviewer"} receives a new link; the previous link stops working.`
                : ""}
            </span>
            <span className={DIALOG_LINE}>Round {round.roundNumber + 1}</span>
            <span className={DIALOG_LINE}>
              {round.revoked
                ? `The previous link was revoked. Sending creates a fresh link and starts Round ${round.roundNumber + 1}.`
                : "Sending starts the next review round."}
            </span>
          </div>
        }
      />
      {!round.revoked && !hasClientLink && (
        <div className="tw:px-3 tw:pb-3 tw:flex tw:flex-col tw:gap-2 tw:bg-[var(--bk-bg-subtle)]">
          {/* D1-half-B: `SendForReview` — the only control in the product with a
              "Client email" field — rendered under `if (!round)` and nowhere
              else, so once ANY round existed there was no way to invite a
              client to this site again, ever. A round with no client link gets
              the control back here. Reused rather than reimplemented: it
              already owns the snapshot render, the submit and the pill
              refresh. */}
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
        </div>
      )}
    </div>
  );
};

export default ReviewTab;
