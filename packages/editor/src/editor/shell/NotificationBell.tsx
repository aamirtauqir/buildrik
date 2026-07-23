/**
 * NotificationBell (P3, contract §4) — the editor topbar bell + panel.
 *
 * Badge count fails closed to 0 (ambient — never crashes the topbar). The panel
 * list throws on error so it shows "couldn't load · Retry", never a fake-empty
 * caught-up state (DF5). Rows are unread-first; clicking one marks it read and
 * jumps to its target (the dashboard route it points at).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Icon, Spinner } from "@/editor/shared/vibcoder";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import {
  fetchRecentNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type EditorNotification,
} from "../../services/NotificationService";

export interface NotificationBellProps {
  /** Injectable navigation (tests / custom routing). Defaults to a real
   *  navigation to the dashboard route the notification points at. */
  onNavigate?: (url: string) => void;
}

type LoadState = "loading" | "ready" | "error";

const BellIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

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

const S: Record<string, React.CSSProperties> = {
  wrap: { position: "relative" },
  bellBtn: { position: "relative", width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--bd-text-muted)" },
  badge: { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "var(--bd-accent)", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  panel: { position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 40, width: 360, maxHeight: 440, overflowY: "auto", background: "var(--bd-surface)", border: "1px solid var(--bd-border)", borderRadius: 10 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid var(--bd-border)", position: "sticky", top: 0, background: "var(--bd-surface)" },
  headTitle: { fontSize: 13, fontWeight: 600, color: "var(--bd-text)" },
  row: { display: "flex", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--bd-border)", cursor: "pointer", alignItems: "flex-start", background: "transparent", border: "none", width: "100%", textAlign: "left" },
  rowUnread: { background: "var(--bd-accent-subtle)" },
  dot: { width: 8, height: 8, borderRadius: 4, background: "var(--bd-accent)", marginTop: 5, flexShrink: 0 },
  dotSpacer: { width: 8, flexShrink: 0 },
  rowBody: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  rowText: { fontSize: 13, color: "var(--bd-text)", lineHeight: 1.4 },
  rowMeta: { fontSize: 11, color: "var(--bd-text-muted)" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 28, textAlign: "center", color: "var(--bd-text-muted)" },
  centerTitle: { fontSize: 13, fontWeight: 600, color: "var(--bd-text)" },
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [open, setOpen] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [state, setState] = React.useState<LoadState>("loading");
  const [rows, setRows] = React.useState<EditorNotification[]>([]);
  const bellRef = React.useRef<HTMLDivElement | null>(null);

  const refreshCount = React.useCallback(() => {
    fetchUnreadCount().then(setCount).catch(() => setCount(0));
  }, []);
  React.useEffect(() => { refreshCount(); }, [refreshCount]);

  const loadPanel = React.useCallback(async () => {
    setState("loading");
    try {
      setRows(await fetchRecentNotifications());
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadPanel();
    else bellRef.current?.focus();
  };

  const onRow = async (n: EditorNotification) => {
    if (!n.read) {
      try { await markNotificationRead(n.id); } catch { /* jump anyway */ }
      refreshCount();
    }
    if (!n.actionUrl) return;
    if (onNavigate) {
      onNavigate(n.actionUrl);
    } else {
      window.location.href = /^https?:\/\//.test(n.actionUrl) ? n.actionUrl : `${DASHBOARD_URL}${n.actionUrl}`;
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setRows((rs) => rs.map((r) => ({ ...r, read: true })));
      refreshCount();
    } catch { /* leave state; user can retry */ }
  };

  // unread first, then newest
  const ordered = [...rows].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={S.wrap}>
      <div
        ref={bellRef}
        role="button"
        tabIndex={0}
        aria-label="Notifications"
        style={S.bellBtn}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
      >
        <BellIcon />
        {count > 0 && <span style={S.badge}>{count > 9 ? "9+" : count}</span>}
      </div>

      {open && (
        <div style={S.panel} role="dialog" aria-label="Notifications">
          <div style={S.head}>
            <span style={S.headTitle}>Notifications</span>
            <Button variant="ghost" size="sm" onClick={() => void onMarkAll()}>Mark all read</Button>
          </div>

          {state === "loading" && <div style={S.center}><Spinner size="lg" /><span>Loading…</span></div>}
          {state === "error" && (
            <div style={S.center}>
              <Icon name="alert-circle" size="lg" />
              <div style={S.centerTitle}>Couldn't load notifications</div>
              <Button variant="secondary" size="sm" onClick={() => void loadPanel()}>Retry</Button>
            </div>
          )}
          {state === "ready" && ordered.length === 0 && (
            <div style={S.center}>
              <Icon name="check-circle" size="lg" />
              <div style={S.centerTitle}>You're all caught up</div>
            </div>
          )}
          {state === "ready" && ordered.map((n) => (
            <div
              role="button"
              tabIndex={0}
              key={n.id}
              style={n.read ? S.row : { ...S.row, ...S.rowUnread }}
              onClick={() => void onRow(n)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void onRow(n); } }}
            >
              {n.read ? <span style={S.dotSpacer} /> : <span style={S.dot} aria-label="unread" />}
              <span style={S.rowBody}>
                <span style={S.rowText}>{n.actorName ? `${n.actorName} ` : ""}{n.message}</span>
                <span style={S.rowMeta}>{n.type} · {relTime(n.createdAt)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
