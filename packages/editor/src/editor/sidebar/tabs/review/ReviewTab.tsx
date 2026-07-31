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
 * Styling follows the chrome convention (inline style objects + DS primitives,
 * as in Topbar) — the editor tsconfig uses react-jsx, not the Emotion pragma.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, History } from "lucide-react";
import { ConfirmDialog, PanelHeader, Spinner } from "@/editor/chrome-ui";
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
import { Badge, Button, Textarea, ToggleSwitch } from "flowbite-react";

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

const S: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  header: { padding: 12, borderBottom: "1px solid var(--bk-border)", display: "flex", flexDirection: "column", gap: 8 },
  headRow: { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" },
  meta: { fontSize: 12, color: "var(--bk-ink-muted)", lineHeight: 1.4 },
  actions: { display: "flex", alignItems: "center", gap: 6 },
  more: { position: "relative" },
  menu: { position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 10, background: "var(--bk-bg-panel)", border: "1px solid var(--bk-border)", borderRadius: 8, padding: 4, minWidth: 160 },
  scroll: { flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 12px" },
  group: { marginBottom: 12 },
  groupHead: { fontSize: 11, fontWeight: 600, letterSpacing: ".4px", textTransform: "uppercase", color: "var(--bk-ink-muted)", margin: "6px 0" },
  row: { display: "flex", flexDirection: "column", gap: 4, padding: 8, border: "1px solid var(--bk-border)", borderRadius: 8, marginBottom: 6 },
  rowResolved: { opacity: 0.6 },
  rowTop: { display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" },
  who: { fontSize: 12, fontWeight: 600, color: "var(--bk-ink)" },
  when: { fontSize: 11, color: "var(--bk-ink-muted)" },
  text: { fontSize: 13, color: "var(--bk-ink)", lineHeight: 1.4 },
  composer: { borderTop: "1px solid var(--bk-border)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, textAlign: "center", color: "var(--bk-ink-muted)" },
  centerTitle: { fontSize: 14, fontWeight: 600, color: "var(--bk-ink)" },
  centerHint: { fontSize: 12, color: "var(--bk-ink-muted)", maxWidth: 240 },
  toolbar: { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--bk-border)" },
  toggle: { fontSize: 12, color: "var(--bk-ink-muted)", display: "flex", alignItems: "center", gap: 6 },
  compareBar: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--bk-border)" },
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
      <div style={S.body}>
        {header}
        <div style={S.center}><Spinner size="lg" /><span>Loading review…</span></div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={S.body}>
        {header}
        <div style={S.center}>
          <AlertCircle size={24} aria-hidden="true" />
          <div style={S.centerTitle}>Couldn't load the review</div>
          <div style={S.centerHint}>The dashboard didn't answer. Your feedback is safe — this is just the panel.</div>
          <Button color="light" size="xs" onClick={() => void load()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div style={S.body}>
        {header}
        <div style={S.center}>
          <CheckCircle2 size={24} aria-hidden="true" />
          <div style={S.centerTitle}>No review yet</div>
          <div style={S.centerHint}>This site hasn't been sent for review yet. Use “Send for review” in the top bar to invite a client.</div>
        </div>
      </div>
    );
  }

  if (compareOpen) {
    return (
      <div style={S.body}>
        <div style={S.compareBar}>
          <Button color="light" size="xs" onClick={() => setCompareOpen(false)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
            <ChevronLeft size={14} aria-hidden="true" /> Back
          </Button>
          <span style={S.who}>Compare with approved</span>
        </div>
        {compareState === "loading" ? (
          <div style={S.center}><Spinner size="lg" /><span>Loading approved snapshot…</span></div>
        ) : compareState === "error" ? (
          <div style={S.center}>
            <AlertCircle size={24} aria-hidden="true" />
            <div style={S.centerTitle}>Couldn't load the approved snapshot</div>
            <div style={S.centerHint}>The dashboard didn't answer. Try again.</div>
            <Button color="light" size="xs" onClick={() => void openCompare()}>Retry</Button>
          </div>
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

  return (
    <div style={S.body}>
      {header}

      <div style={S.header}>
        <div style={S.headRow}>
          <div style={S.actions}>
            <Badge {...(BADGE_KIND[round.revoked ? "issues" : tone.variant] ?? BADGE_NEUTRAL)}>{round.revoked ? "Link revoked" : tone.label}</Badge>
            {round.openCommentCount > 0 && <Badge color="gray">{round.openCommentCount} open</Badge>}
          </div>
          <div style={S.actions}>
            {round.status === "APPROVED" && onExportCurrentPages && (
              <Button color="light" size="xs" onClick={() => void openCompare()} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                <History size={14} aria-hidden="true" /> Compare
              </Button>
            )}
            <Button size="xs" disabled={resending} onClick={() => void doResend()} aria-busy={resending || undefined}>Re-send</Button>
            <div style={S.more}>
              <Button color="light" size="xs" aria-label="More options" onClick={() => setMoreOpen((v) => !v)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">⋯</Button>
              {moreOpen && (
                <div style={S.menu} role="menu">
                  <Button
                    color="red"
                    size="xs"
                    onClick={() => { setConfirmRevoke(true); setMoreOpen(false); }}
                  >
                    Revoke link
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={S.meta}>
          {round.invitedEmail ? `Sent to ${round.invitedEmail}` : "Not yet sent to a client"} · Round {round.roundNumber} of {round.totalRounds}
        </div>
        {notice && <div style={S.meta}>{notice}</div>}
      </div>

      <div style={S.toolbar}>
        <span style={S.meta}>{visible.length} comment{visible.length === 1 ? "" : "s"}</span>
        <span style={S.toggle}>
          Show resolved
          <ToggleSwitch checked={showResolved} aria-label="Show resolved" onChange={() => setShowResolved((v) => !v)} />
        </span>
      </div>

      <div style={S.scroll}>
        {visible.length === 0 ? (
          <div style={S.center}>
            <CheckCircle2 size={24} aria-hidden="true" />
            <div style={S.centerTitle}>No feedback yet</div>
            <div style={S.centerHint}>When {round.reviewerName ?? "the client"} leaves a comment, it shows up here.</div>
          </div>
        ) : (
          <>
          {detached.length > 0 && (
            <div style={S.group} data-detached-group>
              <div style={{ ...S.groupHead, color: "var(--bk-warning-text)" }}>
                Detached · {detached.length}
              </div>
              {detached.map((c) => (
                <div
                  style={{ ...S.row, background: "var(--bk-warning-tint)" }}
                  key={c.id}
                  data-comment-row
                  data-comment-id={c.id}
                >
                  <div style={S.rowTop}>
                    <span style={S.who}>
                      {c.authorKind === "client" ? `${c.authorName ?? "Client"} · client` : "You"}
                    </span>
                    <span style={S.when}>element deleted · {relTime(c.createdAt)}</span>
                  </div>
                  <div style={S.text}>{c.body}</div>
                  <div style={S.actions}>
                    <Button
                      color="light"
                      size="xs"
                      onClick={() => composer?.emit("comments:reattach-start", { id: c.id })} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                    >
                      Reattach
                    </Button>
                    <Button color="light" size="xs" onClick={() => void onResolve(c)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                      {c.status === "RESOLVED" ? "Reopen" : "Resolve"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {groups.map((g) => (
            <div style={S.group} key={g.key}>
              <div style={S.groupHead}>{g.label}</div>
              {g.comments.map((c) => {
                const who = c.authorKind === "client" ? `${c.authorName ?? "Client"} · client` : "You";
                const where = c.x != null && c.y != null ? "pinned" : "note";
                return (
                  <div
                    style={c.status === "RESOLVED" ? { ...S.row, ...S.rowResolved } : S.row}
                    key={c.id}
                    data-comment-row
                    data-comment-id={c.id}
                  >
                    <div style={S.rowTop}>
                      <span style={S.who}>{who}</span>
                      <span style={S.when}>{where} · {relTime(c.createdAt)}</span>
                    </div>
                    <div style={S.text}>{c.body}</div>
                    <div style={S.actions}>
                      <Button color="light" size="xs" onClick={() => void onResolve(c)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                        {c.status === "RESOLVED" ? "Reopen" : "Resolve"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          </>
        )}
      </div>

      <div style={S.composer}>
        <Textarea
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply to the client…"
          rows={2}
          maxLength={2000}
        />
        {replyError && <span style={S.meta}>Couldn't send that reply. Try again.</span>}
        <div style={S.headRow}>
          <span style={S.meta}>Replies are internal notes on the thread.</span>
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
