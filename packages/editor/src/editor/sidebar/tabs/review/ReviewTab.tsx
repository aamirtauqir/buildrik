/**
 * ReviewTab (P0) — the editor-side review loop.
 *
 * Thread-list-first (the design's locked v1: pins render only where coords
 * exist; the canvas pin overlay is the fast-follow). The designer sees the
 * client's comments, replies, resolves, re-sends the round, or revokes the
 * link — all without leaving the editor.
 *
 * Load model honours DF5: a failed load shows an explicit "couldn't load ·
 * Retry", never the empty "no feedback yet" state (fake-empty). Reads throw
 * (ReviewService), so the catch here is what distinguishes error from empty.
 *
 * Styling is chrome-ui components + `tw:` utilities. The comment rows, group
 * headings, empty states and the overflow menu are NOT rebuilt here — they are
 * CommentRow, SectionHeader, EmptyState and Popover/Menu, which is what stops
 * this panel drifting from every other list surface in the editor.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, History } from "lucide-react";
import {
  CommentRow,
  ConfirmDialog,
  EmptyState,
  Menu,
  MenuItem,
  PanelHeader,
  Popover,
  SectionHeader,
  Spinner,
  Badge,
  Button,
  Textarea,
  ToggleSwitch,
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
/** Review's own status words onto flowbite Badge color + text-color override
 *  (flowbite's badge color presets don't hex-match --bk-success-text/
 *  --bk-warning-tint/--bk-error-text exactly — see docs/plans/
 *  flowbite-bigbang-inventory.md "Task 5" Badge mapping). Named, not
 *  inlined, so a new status shows up as a type error instead of silently
 *  rendering neutral. */
const BADGE_KIND: Record<string, { color: string; className?: string }> = {
  published: { color: "success", className: "tw:text-green-600" },
  syncing: { color: "warning", className: "tw:bg-yellow-50" },
  issues: { color: "failure", className: "tw:text-red-700" },
};
const BADGE_NEUTRAL = { color: "gray" } as const;

/* Layout classes. Named once because six of these appeared verbatim at
   multiple call sites when they were inline style objects. */
const BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
const HEADER = "tw:p-3 tw:border-b tw:border-gray-200 tw:flex tw:flex-col tw:gap-2";
const HEAD_ROW = "tw:flex tw:items-center tw:gap-2 tw:justify-between";
const META = "tw:text-xs tw:text-gray-500 tw:leading-[1.4]";
const ACTIONS = "tw:flex tw:items-center tw:gap-1.5";
const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:py-2";
const COMPOSER = "tw:border-t tw:border-gray-200 tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-2";
const BAR = "tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:border-b tw:border-gray-200";
/** The ghost-button look, previously copy-pasted onto six separate Buttons. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";

export interface ReviewTabProps {
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Full re-send (re-renders the snapshot, mints a fresh token) — provided by
   *  the shell so ReviewTab stays decoupled from the composer/export path. */
  onResend?: () => Promise<void>;
  /** Live-render the current site to pages for the §3 Compare — same decoupling
   *  as onResend (the shell owns the composer/export path). Absent → no Compare. */
  onExportCurrentPages?: () => Promise<PublishPage[]>;
  /** Composer for the orphan-comment events (Detached group + reattach). */
  composer?: import("@/engine").Composer | null;
}

type LoadState = "loading" | "ready" | "error";

function relTime(iso: string | Date): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const STATUS_TONE: Record<string, { label: string; variant: "syncing" | "published" | "issues" }> = {
  PENDING: { label: "In review", variant: "syncing" },
  APPROVED: { label: "Approved", variant: "published" },
  CHANGES_REQUESTED: { label: "Changes requested", variant: "issues" },
};

interface Group { key: string; label: string; comments: ReviewComment[]; }

function groupByPage(comments: ReviewComment[]): Group[] {
  const map = new Map<string, ReviewComment[]>();
  for (const c of comments) {
    const key = c.pageId ?? "__none__";
    (map.get(key) ?? map.set(key, []).get(key)!).push(c);
  }
  return [...map.entries()].map(([key, cs]) => ({
    key,
    label: key === "__none__" ? "General" : key,
    comments: cs,
  }));
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
  onResend,
  onExportCurrentPages,
  composer,
}) => {
  const [state, setState] = React.useState<LoadState>("loading");
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  const [comments, setComments] = React.useState<ReviewComment[]>([]);
  const [showResolved, setShowResolved] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [replyError, setReplyError] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [confirmRevoke, setConfirmRevoke] = React.useState(false);
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

  const reload = React.useCallback(async () => {
    try {
      setComments(await fetchReviewComments());
      setRound(await fetchCurrentRound());
    } catch {
      /* keep the current view; the next explicit load surfaces errors */
    }
  }, []);

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
    setMoreOpen(false);
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

  const header = (
    <PanelHeader
      title="Review"
      isPinned={isPinned}
      onPinToggle={onPinToggle}
      onHelpClick={onHelpClick}
      onClose={onClose}
    />
  );

  if (state === "loading") {
    return (
      <div className={BODY}>
        {header}
        <EmptyState className="tw:flex-1" icon={<Spinner size="lg" />} body="Loading review…" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={BODY}>
        {header}
        <EmptyState
          className="tw:flex-1"
          icon={<AlertCircle size={24} aria-hidden="true" />}
          title="Couldn't load the review"
          body="The dashboard didn't answer. Your feedback is safe — this is just the panel."
          action={<Button color="light" size="xs" onClick={() => void load()}>Retry</Button>}
        />
      </div>
    );
  }

  if (!round) {
    return (
      <div className={BODY}>
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
      <div className={BODY}>
        <div className={BAR}>
          <Button color="light" size="xs" onClick={() => setCompareOpen(false)} className={GHOST}>
            <ChevronLeft size={14} aria-hidden="true" /> Back
          </Button>
          <span className="tw:text-xs tw:font-semibold tw:text-gray-900">Compare with approved</span>
        </div>
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
                ? () => { setCurrentPages(null); void onExportCurrentPages().then(setCurrentPages).catch(() => setCurrentPages([])); }
                : undefined
            }
          />
        )}
      </div>
    );
  }

  const tone = STATUS_TONE[round.status] ?? { label: round.status, variant: "syncing" as const };
  const visible = showResolved ? comments : comments.filter((c) => c.status === "OPEN");
  // Detached group first (board 157:2 / 184:56): orphaned pins surface at the
  // top with a Reattach action; everything else groups by page as before.
  const detached = visible.filter((c) => detachedIds.has(c.id));
  const attached = visible.filter((c) => !detachedIds.has(c.id));
  const groups = groupByPage(attached);

  const resolveButton = (c: ReviewComment) => (
    <Button color="light" size="xs" onClick={() => void onResolve(c)} className={GHOST}>
      {c.status === "RESOLVED" ? "Reopen" : "Resolve"}
    </Button>
  );

  return (
    <div className={BODY}>
      {header}

      <div className={HEADER}>
        <div className={HEAD_ROW}>
          <div className={ACTIONS}>
            <Badge {...(BADGE_KIND[round.revoked ? "issues" : tone.variant] ?? BADGE_NEUTRAL)}>{round.revoked ? "Link revoked" : tone.label}</Badge>
            {round.openCommentCount > 0 && <Badge color="gray">{round.openCommentCount} open</Badge>}
          </div>
          <div className={ACTIONS}>
            {round.status === "APPROVED" && onExportCurrentPages && (
              <Button color="light" size="xs" onClick={() => void openCompare()} className={GHOST}>
                <History size={14} aria-hidden="true" /> Compare
              </Button>
            )}
            <Button size="xs" disabled={resending} onClick={() => void doResend()} aria-busy={resending || undefined}>Re-send</Button>
            <Popover
              open={moreOpen}
              onClose={() => setMoreOpen(false)}
              placement="bottom-end"
              label="Review options"
              trigger={
                <Button color="light" size="xs" aria-label="More options" onClick={() => setMoreOpen((v) => !v)} className={GHOST}>⋯</Button>
              }
            >
              <Menu label="Review options">
                <MenuItem danger onClick={() => { setConfirmRevoke(true); setMoreOpen(false); }}>
                  Revoke link
                </MenuItem>
              </Menu>
            </Popover>
          </div>
        </div>
        <div className={META}>
          {round.invitedEmail ? `Sent to ${round.invitedEmail}` : "Not yet sent to a client"} · Round {round.roundNumber} of {round.totalRounds}
        </div>
        {notice && <div className={META}>{notice}</div>}
      </div>

      <div className={`${BAR} tw:justify-between`}>
        <span className={META}>{visible.length} comment{visible.length === 1 ? "" : "s"}</span>
        <span className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1.5">
          Show resolved
          <ToggleSwitch checked={showResolved} aria-label="Show resolved" onChange={() => setShowResolved((v) => !v)} />
        </span>
      </div>

      <div className={SCROLL}>
        {visible.length === 0 ? (
          <EmptyState
            className="tw:flex-1"
            icon={<CheckCircle2 size={24} aria-hidden="true" />}
            title="No feedback yet"
            body={`When ${round.reviewerName ?? "the client"} leaves a comment, it shows up here.`}
          />
        ) : (
          <>
          {detached.length > 0 && (
            <div className="tw:mb-3" data-detached-group>
              {/* SectionHeader's own colour is a utility of the same specificity
                  as any className override, so the one genuinely varying value
                  goes through `style` — the deterministic channel (VersionRow /
                  CommentRow precedent). */}
              <SectionHeader style={{ color: "var(--bk-warning-text)" }} count={detached.length}>
                Detached
              </SectionHeader>
              {detached.map((c) => (
                <CommentRow
                  key={c.id}
                  interactive={false}
                  style={{ background: "var(--bk-warning-tint)" }}
                  author={c.authorKind === "client" ? (c.authorName ?? "Client") : "You"}
                  authorKind={c.authorKind === "client" ? "client" : "internal"}
                  body={c.body}
                  meta={`element deleted · ${relTime(c.createdAt)}`}
                  resolved={c.status === "RESOLVED"}
                  data-comment-row
                  data-comment-id={c.id}
                  actions={
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
                  }
                />
              ))}
            </div>
          )}
          {groups.map((g) => (
            <div className="tw:mb-3" key={g.key}>
              <SectionHeader>{g.label}</SectionHeader>
              {g.comments.map((c) => (
                <CommentRow
                  key={c.id}
                  interactive={false}
                  style={c.status === "RESOLVED" ? { opacity: 0.6 } : undefined}
                  author={c.authorKind === "client" ? (c.authorName ?? "Client") : "You"}
                  authorKind={c.authorKind === "client" ? "client" : "internal"}
                  body={c.body}
                  meta={`${c.x != null && c.y != null ? "pinned" : "note"} · ${relTime(c.createdAt)}`}
                  resolved={c.status === "RESOLVED"}
                  data-comment-row
                  data-comment-id={c.id}
                  actions={resolveButton(c)}
                />
              ))}
            </div>
          ))}
          </>
        )}
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
        <div className={HEAD_ROW}>
          <span className={META}>Replies are internal notes on the thread.</span>
          <Button size="xs" disabled={!draft.trim() || sending} onClick={() => void send()} aria-busy={sending || undefined}>Send</Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={() => void onRevoke()}
        destructive
        title="Revoke the review link?"
        message="The client's link stops working immediately. Their comments stay. Send a new link any time with Re-send."
        confirmLabel="Revoke link"
        cancelLabel="Keep it live"
      />
    </div>
  );
};

export default ReviewTab;
