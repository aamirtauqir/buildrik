/**
 * NotificationService — the editor bell lists the open site only (decision 9,
 * C5 G1-033). The list, the badge count and "Mark all read" carry the same
 * scope so they agree; with no site in the URL they stay user-wide.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const recent = vi.fn();
const unreadCount = vi.fn();
const markAllRead = vi.fn();
const siteId = vi.fn<() => string | null>();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    notifications: {
      recent: { query: (...a: unknown[]) => recent(...a) },
      unreadCount: { query: (...a: unknown[]) => unreadCount(...a) },
      markAllRead: { mutate: (...a: unknown[]) => markAllRead(...a) },
    },
  }),
}));
vi.mock("../ReviewService", () => ({ currentSiteId: () => siteId() }));

import { fetchRecentNotifications, fetchUnreadCount, markAllNotificationsRead } from "../NotificationService";

beforeEach(() => {
  [recent, unreadCount, markAllRead, siteId].forEach((m) => m.mockReset());
  recent.mockResolvedValue([]);
  unreadCount.mockResolvedValue(0);
  markAllRead.mockResolvedValue({ count: 0 });
});

describe("site-scoped bell", () => {
  it("list, count and mark-all-read all ask for the open site", async () => {
    siteId.mockReturnValue("s1");
    await fetchRecentNotifications();
    await fetchUnreadCount();
    await markAllNotificationsRead();
    expect(recent).toHaveBeenCalledWith({ siteId: "s1" });
    expect(unreadCount).toHaveBeenCalledWith({ siteId: "s1" });
    expect(markAllRead).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("with no site in the URL they stay user-wide", async () => {
    siteId.mockReturnValue(null);
    await fetchRecentNotifications();
    expect(recent).toHaveBeenCalledWith(undefined);
  });
});
