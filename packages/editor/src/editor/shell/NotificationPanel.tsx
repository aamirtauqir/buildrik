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
import { Button, EmptyState, Row, Spinner, StatusDot } from "@/editor/ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import {
  fetchRecentNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type EditorNotification,
} from "../../services/NotificationService";

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
}

type LoadState = "loading" | "ready" | "error";

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, onRead, onNavigate }) => {
  const [state, setState] = React.useState<LoadState>("loading");
  const [rows, setRows] = React.useState<EditorNotification[]>([]);

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
      /* leave the rows as they are; the button can be pressed again */
    }
  };

  // Unread first, then newest — the reason you opened the panel is at the top.
  const ordered = [...rows].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bk-notifications" role="dialog" aria-label="Notifications">
      <div className="bk-notifications__head">
        <span className="bk-notifications__title">Notifications</span>
        <Button kind="ghost" size="sm" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>

      {state === "loading" ? (
        <div className="bk-notifications__center">
          <Spinner size="lg" />
        </div>
      ) : null}

      {state === "error" ? (
        <EmptyState
          title="Couldn't load notifications"
          body="The list didn't come back. Nothing was lost."
          action={
            <Button kind="secondary" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {state === "ready" && ordered.length === 0 ? (
        <EmptyState title="You're all caught up" body="New activity on this site shows up here." />
      ) : null}

      {state === "ready" &&
        ordered.map((n) => {
          // A notification whose target was deleted has nothing to jump to.
          // It stays as information rather than becoming a dead button.
          const jumpable = n.actionUrl != null;
          return (
            <Row
              key={n.id}
              size="comment"
              interactive={jumpable}
              className={n.read ? "bk-notif-row" : "bk-notif-row bk-notif-row--unread"}
              data-jump-gone={jumpable ? undefined : "true"}
              onClick={jumpable ? () => void openRow(n) : undefined}
            >
              {n.read ? <span className="bk-notif-row__spacer" /> : <StatusDot state="review" label="unread" />}
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
                <span className="bk-row__meta">
                  {n.type} · {relTime(n.createdAt)}
                </span>
              </span>
            </Row>
          );
        })}
    </div>
  );
};

export default NotificationPanel;
