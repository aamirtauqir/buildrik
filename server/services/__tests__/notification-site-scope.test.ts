/**
 * Site-scoped notifications (post-Oct-1, C5 G1-033 / decision 9): the editor's
 * bell lists one site. Writers that know their site record it; the three bell
 * reads narrow to it when asked and are unchanged when not (the dashboard).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    notification: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    notificationPref: { findUnique: vi.fn() },
    workspace: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getRecentNotifications, getUnreadCount, markAllAsRead } from "@server/services/notification.service";
import { createNotification, notifyWorkspaceOwner } from "@server/services/notification.trigger";

beforeEach(() => {
  Object.values(db).forEach((m) => Object.values(m).forEach((f) => f.mockReset()));
  db.notificationPref.findUnique.mockResolvedValue(null);
});

describe("bell reads", () => {
  it("recent narrows to the site when given one", async () => {
    db.notification.findMany.mockResolvedValue([]);
    await getRecentNotifications("u1", "s1");
    expect(db.notification.findMany.mock.calls[0][0]).toMatchObject({
      where: { userId: "u1", siteId: "s1" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  });

  it("recent without a site is every notification the user has (dashboard unchanged)", async () => {
    db.notification.findMany.mockResolvedValue([]);
    await getRecentNotifications("u1");
    expect(db.notification.findMany.mock.calls[0][0].where).toEqual({ userId: "u1" });
  });

  it("unread count follows the same scope as the list", async () => {
    db.notification.count.mockResolvedValue(2);
    await getUnreadCount("u1", "s1");
    await getUnreadCount("u1");
    expect(db.notification.count.mock.calls[0][0].where).toEqual({ userId: "u1", read: false, siteId: "s1" });
    expect(db.notification.count.mock.calls[1][0].where).toEqual({ userId: "u1", read: false });
  });

  it("mark all read from the editor marks only that site's rows", async () => {
    db.notification.updateMany.mockResolvedValue({ count: 1 });
    await markAllAsRead("u1", "s1");
    expect(db.notification.updateMany.mock.calls[0][0]).toEqual({
      where: { userId: "u1", read: false, siteId: "s1" },
      data: { read: true },
    });
  });
});

describe("writers record the site", () => {
  it("createNotification stores siteId", async () => {
    db.notification.create.mockResolvedValue({});
    await createNotification({ userId: "u1", type: "SITE_PUBLISHED", message: "live", siteId: "s1" });
    expect(db.notification.create.mock.calls[0][0].data).toMatchObject({ userId: "u1", siteId: "s1" });
  });

  it("notifyWorkspaceOwner passes the site through to the owner's row", async () => {
    db.workspace.findUnique.mockResolvedValue({ ownerId: "owner1" });
    db.notification.create.mockResolvedValue({});
    await notifyWorkspaceOwner("w1", "FORM_SUBMISSION_RECEIVED", "New form submission", "/dashboard/sites/s1", "s1");
    expect(db.notification.create.mock.calls[0][0].data).toMatchObject({ userId: "owner1", siteId: "s1" });
  });

  it("a notification about no site stores none", async () => {
    db.notification.create.mockResolvedValue({});
    await createNotification({ userId: "u1", type: "SECURITY_PASSWORD_CHANGED", message: "pw" });
    expect(db.notification.create.mock.calls[0][0].data.siteId).toBeUndefined();
  });
});
