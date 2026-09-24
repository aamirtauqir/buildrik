/**
 * notifications.recent / unreadCount / markAllRead take an optional siteId
 * (post-Oct-1, C5 G1-033 / decision 9). Rows stay the caller's own either way.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const recentMock = vi.fn();
const unreadMock = vi.fn();
const markAllMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/notification.service", () => ({
  listNotifications: vi.fn(),
  getUnreadCount: (...a: unknown[]) => unreadMock(...a),
  markAsRead: vi.fn(),
  markAllAsRead: (...a: unknown[]) => markAllMock(...a),
  getRecentNotifications: (...a: unknown[]) => recentMock(...a),
  listGroupedNotifications: vi.fn(),
  deleteNotification: vi.fn(),
  muteNotificationType: vi.fn(),
}));

import { notificationsRouter } from "@/server/trpc/routers/notifications";

const caller = () => notificationsRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

beforeEach(() => [recentMock, unreadMock, markAllMock].forEach((m) => m.mockReset().mockResolvedValue([])));

describe("notifications site scope", () => {
  it("recent passes the caller and the site", async () => {
    await caller().recent({ siteId: "s1" });
    expect(recentMock).toHaveBeenCalledWith("u_1", "s1");
  });

  it("recent with no input stays user-wide (the dashboard bell)", async () => {
    await caller().recent();
    expect(recentMock).toHaveBeenCalledWith("u_1", undefined);
  });

  it("unreadCount and markAllRead take the same scope", async () => {
    await caller().unreadCount({ siteId: "s1" });
    await caller().markAllRead({ siteId: "s1" });
    await caller().markAllRead();
    expect(unreadMock).toHaveBeenCalledWith("u_1", "s1");
    expect(markAllMock).toHaveBeenNthCalledWith(1, "u_1", "s1");
    expect(markAllMock).toHaveBeenNthCalledWith(2, "u_1", undefined);
  });

  it("rejects an empty siteId", async () => {
    await expect(caller().recent({ siteId: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(recentMock).not.toHaveBeenCalled();
  });

  it("is UNAUTHORIZED without a session", async () => {
    const anon = notificationsRouter.createCaller({ session: null, prisma: {} } as never);
    await expect(anon.recent({ siteId: "s1" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
