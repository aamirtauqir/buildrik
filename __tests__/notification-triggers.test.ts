import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { create: vi.fn() },
    workspace: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Notification Triggers", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("exports createNotification function", async () => {
    const mod = await import("@/server/services/notification.trigger");
    expect(mod.createNotification).toBeDefined();
    expect(typeof mod.createNotification).toBe("function");
  });

  it("exports notifyWorkspaceOwner function", async () => {
    const mod = await import("@/server/services/notification.trigger");
    expect(mod.notifyWorkspaceOwner).toBeDefined();
    expect(typeof mod.notifyWorkspaceOwner).toBe("function");
  });

  it("creates notification with correct data", async () => {
    const { createNotification } = await import("@/server/services/notification.trigger");
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: "n1" } as any);

    await createNotification({
      userId: "u1",
      type: "SITE_PUBLISHED",
      message: "Site published",
      actorId: "u2",
      actorName: "Ali",
      actionUrl: "/dashboard/sites/s1",
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        type: "SITE_PUBLISHED",
        message: "Site published",
        actorId: "u2",
        actorName: "Ali",
        actionUrl: "/dashboard/sites/s1",
        priority: "medium",
      }),
    });
  });

  it("sets high priority for security events", async () => {
    const { createNotification } = await import("@/server/services/notification.trigger");
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: "n1" } as any);

    await createNotification({
      userId: "u1",
      type: "PAYMENT_FAILED",
      message: "Payment failed",
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ priority: "high" }),
    });
  });

  it("notifyWorkspaceOwner looks up owner and creates notification", async () => {
    const { notifyWorkspaceOwner } = await import("@/server/services/notification.trigger");
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ id: "ws1", ownerId: "u1" } as any);
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: "n1" } as any);

    await notifyWorkspaceOwner("ws1", "SITE_PUBLISHED", "Site published", "/sites/s1");

    expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
      where: { id: "ws1" },
      select: { ownerId: true },
    });
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it("does not throw if notification create fails", async () => {
    const { createNotification } = await import("@/server/services/notification.trigger");
    vi.mocked(prisma.notification.create).mockRejectedValue(new Error("DB error"));

    // Should not throw — notifications should never block the primary operation
    await expect(createNotification({
      userId: "u1",
      type: "SITE_PUBLISHED",
      message: "test",
    })).resolves.not.toThrow();
  });
});
