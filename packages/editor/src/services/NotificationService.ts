/**
 * NotificationService — editor → dashboard notifications bridge (P3, contract §4).
 *
 * The bell lives in the editor topbar and reads the same per-user rows the
 * dashboard shows, narrowed to the open site (decision 9); the editor reads
 * them cross-origin via the dashboard tRPC client (same pattern as
 * ReviewService). The badge count and "Mark all read" use the same scope as
 * the list, so the three always agree.
 *
 * The unread COUNT fails closed to 0 (it's an ambient badge — a dead dashboard
 * should not break the topbar). The panel LIST throws on error so the panel can
 * show "couldn't load · Retry" instead of a fake-empty list (DF5).
 *
 * @license BSD-3-Clause
 */

import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { currentSiteId } from "./ReviewService";

/** The bell lists this site only (decision 9). No site in the URL (the
 *  standalone demo) = every notification, as the dashboard bell shows. */
function siteScope(): { siteId: string } | undefined {
  const siteId = currentSiteId();
  return siteId ? { siteId } : undefined;
}

export interface EditorNotification {
  id: string;
  type: string;
  actorName: string | null;
  message: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: string | Date;
}

/** Recent notifications for the bell panel. Throws on error (DF5). */
export async function fetchRecentNotifications(): Promise<EditorNotification[]> {
  const rows = await getBuildrikClient(DASHBOARD_URL).notifications.recent.query(siteScope());
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    actorName: r.actorName ?? null,
    message: r.message,
    actionUrl: r.actionUrl ?? null,
    read: r.read,
    createdAt: r.createdAt,
  }));
}

/** Unread badge count. Fails closed to 0 — an ambient signal, never a crash. */
export async function fetchUnreadCount(): Promise<number> {
  try {
    return await getBuildrikClient(DASHBOARD_URL).notifications.unreadCount.query(siteScope());
  } catch {
    return 0;
  }
}

/** Mark one notification read. Throws so the row can show a retry. */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await getBuildrikClient(DASHBOARD_URL).notifications.markRead.mutate({ notificationId, read: true });
}

/** Mark every notification read. Throws on failure. */
export async function markAllNotificationsRead(): Promise<void> {
  await getBuildrikClient(DASHBOARD_URL).notifications.markAllRead.mutate(siteScope());
}
