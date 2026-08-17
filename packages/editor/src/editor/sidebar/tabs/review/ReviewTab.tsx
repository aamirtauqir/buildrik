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
} from "@/editor/chrome-ui";
import { ApprovedCompareView } from "@/editor/panels/version-history/ApprovedCompareView";
import type { PublishPage } from "@/editor/shell/exportPublishPages";
import {
  fetchCurrentRound,
  fetchReviewComments,
  fetchApprovedSnapshot,
  postReply,
  resolveReviewComment,
  revokeReview,
  type CurrentRound,
  type ReviewComment,
} from "../../../../services/ReviewService";

export interface ReviewTabProps {
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Full re-send (re-renders the snapshot, mints a fresh token) — provided by
   *  the shell so ReviewTab stays decoupled from the composer/export path. */
  onResend?: () => Promise<void>;
  /** Live-render the current site to pages for the §3 Compare — same decoupling
   *  as onResend (the shell owns the composer/export path). Absent → no Compare. */
  onExportCurrentPages?: () => Promise<PublishPage[]>;
  /** Composer for the orphan-comment events (Detached group + reattach) and
   *  for page names — the boards label groups "OPEN · HOME", not by page id. */
  composer?: import("@/engine").Composer | null;
  /** Open Compare on mount — board 200:213's ReviewBar links straight to it,
   *  the way the history tab deep-links to its Published view. */
  initialCompare?: boolean;
}

type LoadState = "loading" | "ready" | "error";

const BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto";
const META = "tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/** The grey band over each page's comments, and over RESOLVED / DETACHED. */
const BAND =
  "tw:flex tw:items-center tw:gap-2 tw:w-full tw:px-3 tw:h-8 tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-[var(--bk-ink-muted)] " +
  "tw:border-0 tw:justify-between";
const FOOT = "tw:border-t tw:border-[var(--bk-border)] tw:px-3 tw:py-3 tw:flex tw:flex-col tw:gap-2";
const ROUND_STRIP =
  "tw:flex tw:items-center tw:justify-center tw:h-8 tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[12px] tw:text-[var(--bk-ink-soft)]";
/** Both confirms (revoke, re-send) are inline panels on the boards, not modals. */
const CONFIRM =
  "tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-3 tw:bg-[var(--bk-warning-tint)] " +
  "tw:border-b tw:border-[var(--bk-border)]";
const COMPOSER = "tw:border-t tw:border-[var(--bk-border)] tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-2";
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";

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
  const [compareState, setCompareState] = React.useState<LoadState>("loading");
  const [approvedSnap, setApprovedSnap] = React.useState<PublishPage[] | null>(null);
  const [currentPages, setCurrentPages] = React.useState<PublishPage[] | null>(null);

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
      setNotice("Review link revoked.");
      await reload();
    } else if (res.reason === "token-changed") {
      setNotice("This round changed (a re-send happened) — reloading.");
      await reload();
    } else if (res.reason === "already-revoked") {
      setNotice("This link was already revoked.");
      await reload();
    } else {
      setNotice("Couldn't revoke the link. Try again.");
    }
  };

  const doResend = async () => {
    setConfirmResend(false);
    if (!onResend) return;
    setResending(true);
    try {
      await onResend();
      await reload();
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

  /* Board 200:213's bar links here directly. Fires once — reopening Compare
     after the user closes it would trap them in it while the deep-link prop
     is still true. */
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
     them, including the error one. */
  const progress = (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pt-3 tw:pb-2">
      <div className="tw:flex tw:items-center tw:gap-3">
        <span
          className="tw:h-1.5 tw:flex-1 tw:rounded-full tw:bg-[var(--bk-bg-subtle)] tw:overflow-hidden"
          role="progressbar"
          aria-valuenow={resolvedComments.length}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Comments resolved"
        >
          <span
            className="tw:block tw:h-full tw:rounded-full tw:bg-[var(--bk-success)]"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="tw:font-mono tw:text-[12px] tw:tabular-nums tw:text-[var(--bk-ink)]">
          {resolvedComments.length} of {total}
        </span>
      </div>
      {round ? <span className={META}>{sentLine(round)}</span> : null}
      {notice ? <span className={META}>{notice}</span> : null}
    </div>
  );

  const compareButton = (
    <Button
      color="light"
      onClick={() => void openCompare()}
      disabled={!onExportCurrentPages}
      title={!onExportCurrentPages ? "Compare isn't available here" : undefined}
      className="tw:w-full tw:justify-center"
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
            <span className="tw:text-[14px] tw:text-[var(--bk-error)]">
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
          body="This site hasn't been sent for review yet. Use “Send for review” in the top bar to invite a client."
        />
      </div>
    );
  }

  if (compareOpen) {
    return (
      <div className={BODY} data-review-state="compare">
        <Toolbar>
          <Button color="light" size="xs" onClick={() => setCompareOpen(false)} className={GHOST}>
            <ChevronLeft size={14} aria-hidden="true" /> Back
          </Button>
          <span className="tw:text-xs tw:font-semibold tw:text-gray-900">Compare with approved</span>
        </Toolbar>
        {compareState === "loading" ? (
          <EmptyState className="tw:flex-1" icon={<Spinner size="lg" />} body="Loading approved snapshot…" />
        ) : compareState === "error" ? (
          <EmptyState
            className="tw:flex-1"
            icon={<AlertCircle size={24} aria-hidden="true" />}
            title="Couldn't load the approved snapshot"
            body="The dashboard didn't answer. Try again."
            action={<Button color="light" size="xs" onClick={() => void openCompare()}>Retry</Button>}
          />
        ) : (
          <ApprovedCompareView
            approvedPages={approvedSnap}
            currentPages={currentPages}
            onRefreshCurrent={
              onExportCurrentPages
                ? () => {
                    setCurrentPages(null);
                    void onExportCurrentPages().then(setCurrentPages).catch(() => setCurrentPages([]));
                  }
                : undefined
            }
          />
        )}
      </div>
    );
  }

  const detached = openComments.filter((c) => detachedIds.has(c.id));
  const attached = openComments.filter((c) => !detachedIds.has(c.id));

  const groups: Group[] = [];
  for (const c of attached) {
    const key = c.pageId ?? "__none__";
    const existing = groups.find((g) => g.key === key);
    if (existing) existing.comments.push(c);
    else groups.push({ key, label: pageName(c.pageId), comments: [c] });
  }

  const rowMeta = (c: ReviewComment) => `${pageName(c.pageId)} · ${shortAge(c.createdAt)}`;

  const resolveButton = (c: ReviewComment) => (
    <Button color="light" size="xs" onClick={() => void onResolve(c)} className={GHOST}>
      {c.status === "RESOLVED" ? "Reopen" : "Resolve"}
    </Button>
  );

  const row = (c: ReviewComment, extra?: { detachedNote?: string; actions?: React.ReactNode }) => (
    <CommentRow
      key={c.id}
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

  /* Board 158:162 — the link is dead, the comments are not. */
  const revokedBody = (
    <div className="tw:px-6 tw:py-8 tw:text-center tw:flex tw:flex-col tw:gap-2">
      <span className="tw:text-[14px] tw:text-[var(--bk-error)]">This review link was revoked.</span>
      <span className={META}>
        {round.reviewerName ?? "The reviewer"} can no longer open it. Earlier comments are kept below.
      </span>
    </div>
  );

  /* Board 157:58 — the round is finished; the next one is the obvious move. */
  const allResolvedBody = (
    <div className="tw:px-6 tw:py-8 tw:text-center tw:flex tw:flex-col tw:gap-2">
      <span className="tw:text-[14px] tw:text-[var(--bk-success-text)]">Everything is resolved.</span>
      <span className={META}>
        {resolvedComments.length} of {total} — ready to send round {round.roundNumber + 1}.
      </span>
    </div>
  );

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
      ? "Send a new link"
      : "Re-send for review";

  return (
    <div className={BODY} data-review-state={round.revoked ? "revoked" : "open"}>
      {header}

      {/* Board 158:105: revoke asks at the top of the panel, in the panel. */}
      {confirmRevoke && (
        <div className={CONFIRM} role="alertdialog" aria-label="Revoke this review link?">
          <span className="tw:text-[14px] tw:text-[var(--bk-error)]">Revoke this review link?</span>
          <span className={META}>
            {round.reviewerName ?? "The reviewer"} will lose access immediately. You can send a new
            link any time.
          </span>
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pt-1">
            <Button color="light" size="sm" onClick={() => setConfirmRevoke(false)}>
              Cancel
            </Button>
            {/* `red`, not `failure` — ConfirmDialog:49 is the precedent, and
                flowbite's "failure" rendered a neutral grey button here. */}
            <Button color="red" size="sm" onClick={() => void onRevoke()}>
              Revoke
            </Button>
          </div>
        </div>
      )}

      {progress}

      <div className={SCROLL}>
        {round.revoked
          ? revokedBody
          : total === 0
            ? emptyBody
            : openComments.length === 0
              ? allResolvedBody
              : null}

        {detached.length > 0 && (
          <div data-detached-group>
            <div className={BAND} style={{ color: "var(--bk-warning-text)" }}>
              <span className="tw:flex tw:items-center tw:gap-1.5">
                <AlertCircle size={12} aria-hidden="true" /> Detached
              </span>
              <span>{detached.length}</span>
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
            <div className={BAND}>
              {/* Board 156:2 marks where the open thread starts, then names
                  each page after it. */}
              <span>{i === 0 ? `Open · ${g.label}` : g.label}</span>
              <span>{g.comments.length}</span>
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
            >
              <span>Resolved</span>
              <span className="tw:flex tw:items-center tw:gap-1">
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

      <div className={ROUND_STRIP}>
        {/* No ‹ › arrows: nothing can fetch an older round's comments today. */}
        Round {round.roundNumber} of {round.totalRounds}
      </div>

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

      <div className="tw:border-t tw:border-[var(--bk-border)] tw:px-3 tw:py-3">{compareButton}</div>

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
          {!round.revoked && (
            <Button
              color="light"
              size="xs"
              className={`${GHOST} tw:self-center`}
              onClick={() => setConfirmRevoke(true)}
            >
              Revoke link
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewTab;
