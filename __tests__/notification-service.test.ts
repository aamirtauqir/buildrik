import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Notification Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listNotifications", () => {
    it("returns paginated notifications with all filter", async () => {
      const { listNotifications } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.count).mockResolvedValue(3);
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        { id: "n1", type: "comment", actorName: "Alice", message: "commented on your site", actionUrl: "/sites/1", read: false, priority: "medium", createdAt: new Date() },
        { id: "n2", type: "invite", actorName: "Bob", message: "invited you to team", actionUrl: null, read: true, priority: "high", createdAt: new Date() },
      ] as any);

      const result = await listNotifications("user1", { page: 1, perPage: 20, filter: "all" });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user1" },
          skip: 0,
          take: 20,
        }),
      );
    });

    it("returns only unread notifications when filter is unread", async () => {
      const { listNotifications } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.count).mockResolvedValue(1);
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        { id: "n1", type: "comment", actorName: "Alice", message: "commented", actionUrl: null, read: false, priority: "medium", createdAt: new Date() },
      ] as any);

      const result = await listNotifications("user1", { page: 1, perPage: 20, filter: "unread" });
      expect(result.data).toHaveLength(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user1", read: false },
        }),
      );
    });

    it("returns mention notifications when filter is mentions", async () => {
      const { listNotifications } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.count).mockResolvedValue(1);
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        { id: "n1", type: "mention", actorName: "Carol", message: "mentioned you", actionUrl: null, read: false, priority: "medium", createdAt: new Date() },
      ] as any);

      await listNotifications("user1", { page: 1, perPage: 20, filter: "mentions" });
      // mentions filter applies `type: { in: [...MENTION_NOTIFICATION_TYPES] }`
      // (one of: mention / reply / reaction). Test originally asserted
      // `type: "mention"` literal — pre-multi-mention-types refactor.
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user1",
            type: expect.objectContaining({ in: expect.any(Array) }),
          }),
        }),
      );
    });
  });

  describe("getUnreadCount", () => {
    it("returns count of unread notifications", async () => {
      const { getUnreadCount } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.count).mockResolvedValue(7);

      const count = await getUnreadCount("user1");
      expect(count).toBe(7);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: "user1", read: false },
      });
    });
  });

  describe("markAsRead", () => {
    it("updates notification read to true", async () => {
      const { markAsRead } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 } as any);

      const result = await markAsRead("n1", "user1");
      expect(result.count).toBe(1);
      // Scoped by userId so one user cannot mark another's notification read.
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: "n1", userId: "user1" },
        data: { read: true },
      });
    });
  });

  describe("markAllAsRead", () => {
    it("updates all unread notifications for user", async () => {
      const { markAllAsRead } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

      const result = await markAllAsRead("user1");
      expect(result.count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user1", read: false },
        data: { read: true },
      });
    });
  });

  describe("getRecentNotifications", () => {
    it("returns last 5 notifications by default", async () => {
      const { getRecentNotifications } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        { id: "n1", type: "comment", actorName: "Alice", message: "commented", actionUrl: null, read: false, priority: "medium", createdAt: new Date() },
        { id: "n2", type: "invite", actorName: "Bob", message: "invited", actionUrl: null, read: true, priority: "low", createdAt: new Date() },
      ] as any);

      const result = await getRecentNotifications("user1");
      expect(result).toHaveLength(2);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    });

    it("respects custom limit parameter", async () => {
      const { getRecentNotifications } = await import("@/server/services/notification.service");
      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);

      await getRecentNotifications("user1", 10);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    });
  });
});
