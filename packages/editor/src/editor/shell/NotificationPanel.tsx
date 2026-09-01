/**
 * Notifications — the count and the panel, separated.
 *
 * The bell itself now belongs to the `Topbar` component (Figma 681:122), so
 * what lives here is the part the design system cannot own: fetching, ordering,
 * and what a row does when you click it.
 *
 * Count fails closed to 0 — an ambient badge must never take the topbar down.
 * The list fails loud, because a caught-up state the user did not earn is worse
 * than an error they can retry (DF5).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EmptyState, PanelHeader, ROW_META_CLASS, Row, SkeletonBlock, StatusDot, Button, type ToastInput } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import {
  fetchRecentNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type EditorNotification,
} from "../../services/NotificationService";

/** U1: one relative-time SSOT — shared/utils/relativeTime, days fallback. */
function relTime(iso: string | Date): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  return formatRelativeTime(Math.min(then, Date.now()), {
    fallback: "days",
    justNowLabel: "just now",
  });
}

/** Board 165:2 bands the list by day — TODAY, YESTERDAY, then the date. A
 *  flat list made "2h" and "1d" sit in the same column with nothing saying
 *  where one day ended. */
/* Board component 220:919 ("Section header"), the band both the loading
   skeleton and the loaded list render: 28h, inset 16, bg-subtle, Inter Medium
   11/16 at 0.5px tracking in ink-muted. It is ONE constant because the two
   states have to draw it identically — that identity is what keeps the swap
   from moving anything above the rows, which is the whole point of board
   165:51's note. It was 24.5h at a 12px inset with Tailwind's own `wide`
   tracking (0.275px at this size). */
const DAY_BAND_CLASS =
  "tw:flex tw:h-7 tw:items-center tw:bg-[var(--bk-bg-subtle)] tw:px-4 " +
  "tw:text-[11px] tw:font-medium tw:leading-4 tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]";

function dayBand(iso: string | Date): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "EARLIER";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - then.getTime()) / 86_400_000);
  if (days < 0) return "TODAY";
  if (days === 0) return "YESTERDAY";
  return then
    .toLocaleDateString(undefined, { day: "numeric", month: "short" })
    .toUpperCase();
}

/** The dot carries the kind, the way the board colours it: a publish failure
 *  is not the same event as an approval. */
function dotState(type: string): "live" | "review" | "changes" | "failed" {
  const t = type.toLowerCase();
  if (t.includes("fail") || t.includes("error")) return "failed";
  if (t.includes("approve") || t.includes("publish")) return "live";
  if (t.includes("change") || t.includes("request")) return "changes";
  return "review";
}

/** Unread badge count, refreshable after a read lands. */
export function useUnreadCount(): { count: number; refresh: () => void } {
  const [count, setCount] = React.useState(0);
  const refresh = React.useCallback(() => {
    fetchUnreadCount()
      .then(setCount)
      .catch(() => setCount(0));
  }, []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);
  return { count, refresh };
}

export interface NotificationPanelProps {
  onClose: () => void;
  /** Called after a row is read, so the bell count can catch up. */
  onRead?: () => void;
  /** Injectable navigation (tests / custom routing). */
  onNavigate?: (url: string) => void;
  /** F5 — a failed mark-all must say so, not silently do nothing. */
  addToast?: (input: ToastInput) => string;
}

type LoadState = "loading" | "ready" | "error";

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, onRead, onNavigate, addToast }) => {
  const [state, setState] = React.useState<LoadState>("loading");
  const [rows, setRows] = React.useState<EditorNotification[]>([]);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // F9: keyboard users land inside the dialog they opened, and get put back on
  // the bell when it closes — otherwise Escape strands focus on <body>.
  React.useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => opener?.focus();
  }, []);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      setRows(await fetchRecentNotifications());
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openRow = async (n: EditorNotification) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
      } catch {
        /* jump anyway — a failed read flag is not worth blocking the jump */
      }
      onRead?.();
    }
    if (!n.actionUrl) return;
    if (onNavigate) onNavigate(n.actionUrl);
    else window.location.href = /^https?:\/\//.test(n.actionUrl) ? n.actionUrl : `${DASHBOARD_URL}${n.actionUrl}`;
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setRows((rs) => rs.map((r) => ({ ...r, read: true })));
      onRead?.();
    } catch {
      // F5: rows stay as they are AND the user hears about it — a button that
      // silently does nothing teaches distrust (finding S3).
      addToast?.({ title: "Couldn't mark read", description: "Try again in a moment.", tone: "error" });
    }
  };

  /** The full grouped list, reached the same way a row's own jump is. */
  const seeAll = () => {
    const url = "/dashboard/notifications";
    if (onNavigate) onNavigate(url);
    else window.location.href = `${DASHBOARD_URL}${url}`;
    onClose();
  };

  // Unread first, then newest — the reason you opened the panel is at the top.
  const ordered = [...rows].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div ref={panelRef} tabIndex={-1} className="bk-notifications" role="dialog" aria-label="Notifications">
      {/* Board 165:52 is the same 48-pixel bar Issues draws, down to the x=16
          title and the close glyph at x=332 — so it is PanelHeader's `panel`
          size, not a second hand-built header. The panel had neither the
          height nor the ✕ before. Only the sticky behaviour is local. */}
      <PanelHeader
        title="Notifications"
        size="panel"
        onClose={onClose}
        className="bk-notifications__head"
        actions={
          /* F5: no mark-all while there is nothing to mark. This gated on
             `state === "ready"` alone, but "loaded" is not "non-empty" — the
             button rendered directly above the "You're all caught up" empty
             state, offering to mark zero rows read. */
          state === "ready" && ordered.length > 0 ? (
            <Button color="light" size="xs" onClick={() => void markAll()} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
              Mark all read
            </Button>
          ) : null
        }
      />

      {state === "loading" ? (
        /* Board 165:51 draws four 44h skeleton rows under a live day band,
           and carries its own note: "Rows keep their 44h so the panel does
           not jump when they fill." A centred spinner did the opposite —
           it collapsed the panel to one short row and the list shoved it
           down 421px on arrival. The band is the same markup the loaded
           list renders, which is what makes the swap free of movement. */
        <div role="status" aria-label="Loading notifications">
          <div aria-hidden="true" className={DAY_BAND_CLASS}>
            {dayBand(new Date())}
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="tw:flex tw:h-11 tw:items-center tw:gap-2 tw:pl-4">
              <SkeletonBlock circle className="tw:h-2 tw:w-2 tw:shrink-0" />
              <SkeletonBlock className="tw:h-2.5 tw:w-[220px]" />
            </div>
          ))}
        </div>
      ) : null}

      {state === "error" ? (
        /* Board 453:4055 — two CENTRED lines then a LEFT-anchored link at the
           panel's 24 gutter. EmptyState ships `center` and `start`; this is
           neither, so it is built here the way board 164:35 was.

           The body copy is the board's and it earns its place: "the list
           didn't come back, nothing was lost" reassures about the wrong
           thing. What a user needs to know is what they might be missing
           while it is down — the same error-fact / harm-scope / recovery
           shape the layers and templates blocks already use. */
        <div className="tw:pt-10" role="alert">
          <p className="tw:m-0 tw:px-6 tw:text-center tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]">
            Couldn&rsquo;t load notifications.
          </p>
          <p className="tw:m-0 tw:mt-1 tw:px-6 tw:text-center tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
            Client replies and publish results may be waiting.
          </p>
          <Button
            color="light"
            size="xs"
            variant="link"
            className="tw:mt-2 tw:ml-6 tw:h-4 tw:px-0 tw:text-[13px] tw:leading-4 tw:font-normal tw:text-[var(--bk-accent-text)]"
            onClick={() => void load()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {state === "ready" && ordered.length === 0 ? (
        <EmptyState title="You're all caught up" body="New activity on this site shows up here." />
      ) : null}

      {state === "ready" &&
        ordered.map((n, index) => {
          const band = dayBand(n.createdAt);
          const showBand = index === 0 || dayBand(ordered[index - 1].createdAt) !== band;
          // A notification whose target was deleted has nothing to jump to.
          // It stays as information rather than becoming a dead button.
          const jumpable = n.actionUrl != null;
          return (
            <React.Fragment key={n.id}>
            {showBand && (
              <div className={DAY_BAND_CLASS}>{band}</div>
            )}
            <Row
              size="comment"
              interactive={jumpable}
              className={n.read ? "bk-notif-row" : "bk-notif-row bk-notif-row--unread"}
              data-jump-gone={jumpable ? undefined : "true"}
              onClick={jumpable ? () => void openRow(n) : undefined}
            >
              {n.read ? (
                <span className="bk-notif-row__spacer" />
              ) : (
                <StatusDot state={dotState(n.type)} label="unread" />
              )}
              <span className="bk-notif-row__body">
                <span className="bk-notif-row__text">
                  {n.actorName ? `${n.actorName} ` : ""}
                  {n.message}
                </span>
                {jumpable ? null : (
                  <span className="bk-notif-row__gone">
                    The target is gone — the note is kept, but there&rsquo;s nothing to jump to.
                  </span>
                )}
              </span>
              {/* Board 165:2 puts the age at the right of its own row, not on
                  a second line under the text with the type repeated. */}
              <span className={ROW_META_CLASS}>{relTime(n.createdAt)}</span>
            </Row>
            </React.Fragment>
          );
        })}

      {/* The panel is the five most recent (`getRecentNotifications` takes 5)
          while the bell counts every unread one — 25 against 5 on the site
          this was walked on. Without a route to the full list, twenty of them
          were counted in the badge and reachable from nowhere in the editor.
          `/dashboard/notifications` already renders them grouped. */}
      {state === "ready" && ordered.length > 0 ? (
        <div className="tw:border-t tw:border-[var(--bk-border)] tw:px-3 tw:py-2">
          <Button
            color="light"
            size="xs"
            className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[var(--bk-accent)]"
            onClick={seeAll}
          >
            See all notifications
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationPanel;
