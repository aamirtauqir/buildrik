import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    session: { findMany: vi.fn(), deleteMany: vi.fn(), delete: vi.fn() },
    loginAttempt: { findMany: vi.fn() },
    workspace: { findUnique: vi.fn(), update: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    wSSharingSettings: { upsert: vi.fn(), findUnique: vi.fn() },
    workspaceIntegration: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    notificationPref: { findMany: vi.fn(), upsert: vi.fn() },
    accountDeletionReq: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    exportJob: { create: vi.fn() },
    aIGenerationJob: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Account Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getProfile", () => {
    it("returns user profile", async () => {
      const { getProfile } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "u1", fullName: "Ali Khan", displayName: "Ali", email: "ali@test.com",
        avatar: null, bio: null, language: "en", timezone: "UTC",
        // Required by getProfile() since it destructures passwordHash + walks
        // accounts[]. Missing fields → "Cannot read properties of undefined
        // (reading 'filter')" at account.service.ts:70.
        passwordHash: null,
        accounts: [],
        twoFactorEnabled: false,
      } as any);
      const result = await getProfile("u1");
      expect(result?.fullName).toBe("Ali Khan");
    });
  });

  describe("updateProfile", () => {
    it("updates profile fields", async () => {
      const { updateProfile } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1", fullName: "Ali K" } as any);
      const result = await updateProfile("u1", { fullName: "Ali K" });
      expect(result.fullName).toBe("Ali K");
    });
  });

  describe("getActiveSessions", () => {
    it("returns user sessions", async () => {
      const { getActiveSessions } = await import("@/server/services/account.service");
      vi.mocked(prisma.session.findMany).mockResolvedValue([
        { id: "s1", device: "Chrome", ip: "1.2.3.4", location: "Karachi", current: true, createdAt: new Date(), expires: new Date() },
      ] as any);
      const result = await getActiveSessions("u1");
      expect(result).toHaveLength(1);
      expect(result[0].current).toBe(true);
    });
  });

  describe("revokeAllOtherSessions", () => {
    it("deletes non-current sessions", async () => {
      const { revokeAllOtherSessions } = await import("@/server/services/account.service");
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 3 });
      const result = await revokeAllOtherSessions("u1", "s1");
      expect(result.count).toBe(3);
    });
  });

  describe("getLoginHistory", () => {
    it("returns last 10 login attempts", async () => {
      const { getLoginHistory } = await import("@/server/services/account.service");
      vi.mocked(prisma.loginAttempt.findMany).mockResolvedValue([
        { id: "la1", email: "ali@test.com", ipAddress: "1.2.3.4", userAgent: "Chrome", result: "SUCCESS", createdAt: new Date() },
      ] as any);
      const result = await getLoginHistory("u1");
      expect(result).toHaveLength(1);
    });
  });

  describe("requestAccountDeletion", () => {
    it("creates deletion request with 30-day grace", async () => {
      const { requestAccountDeletion } = await import("@/server/services/account.service");
      vi.mocked(prisma.accountDeletionReq.create).mockResolvedValue({
        id: "del1", userId: "u1", scheduledAt: new Date(),
      } as any);
      const result = await requestAccountDeletion("u1", "Not using anymore");
      expect(result.userId).toBe("u1");
    });
  });

  describe("requestDataExport", () => {
    it("creates export job", async () => {
      const { requestDataExport } = await import("@/server/services/account.service");
      vi.mocked(prisma.exportJob.create).mockResolvedValue({
        id: "exp1", userId: "u1", status: "PENDING",
      } as any);
      const result = await requestDataExport("u1");
      expect(result.status).toBe("PENDING");
    });
  });
});

describe("Workspace Settings Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getWorkspaceSettings", () => {
    it("returns workspace with sharing settings", async () => {
      const { getWorkspaceSettings } = await import("@/server/services/workspace-settings.service");
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: "ws1", name: "My Workspace", slug: "my-workspace",
        defaultLanguage: "en", timezone: "UTC",
        sharingSettings: { defaultExpiration: null, requirePw: false, allowEditors: true, notify: true },
      } as any);
      const result = await getWorkspaceSettings("ws1");
      expect(result?.name).toBe("My Workspace");
    });
  });

  describe("updateWorkspaceSettings", () => {
    it("updates workspace fields", async () => {
      const { updateWorkspaceSettings } = await import("@/server/services/workspace-settings.service");
      vi.mocked(prisma.workspace.update).mockResolvedValue({ id: "ws1", name: "New Name" } as any);
      const result = await updateWorkspaceSettings("ws1", { name: "New Name" });
      expect(result.name).toBe("New Name");
    });
  });

  describe("updateSharingSettings", () => {
    it("upserts sharing settings", async () => {
      const { updateSharingSettings } = await import("@/server/services/workspace-settings.service");
      vi.mocked(prisma.wSSharingSettings.upsert).mockResolvedValue({
        id: "wss1", workspaceId: "ws1", requirePw: true,
      } as any);
      const result = await updateSharingSettings("ws1", { requirePw: true });
      expect(result.requirePw).toBe(true);
    });
  });
});

describe("Integrations Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listIntegrations", () => {
    it("returns workspace integrations", async () => {
      const { listIntegrations } = await import("@/server/services/integrations.service");
      vi.mocked(prisma.workspaceIntegration.findMany).mockResolvedValue([
        { id: "int1", provider: "GOOGLE_ANALYTICS", config: { trackingId: "G-XXX" }, isActive: true },
      ] as any);
      const result = await listIntegrations("ws1");
      expect(result).toHaveLength(1);
    });
  });

  describe("addIntegration", () => {
    it("creates integration", async () => {
      const { addIntegration } = await import("@/server/services/integrations.service");
      vi.mocked(prisma.workspaceIntegration.findMany).mockResolvedValue([]);
      vi.mocked(prisma.workspaceIntegration.create).mockResolvedValue({
        id: "int2", provider: "SLACK", config: { webhookUrl: "https://hooks.slack.com/xxx" }, isActive: true,
      } as any);
      const result = await addIntegration("ws1", { provider: "SLACK", config: { webhookUrl: "https://hooks.slack.com/xxx" } }, "PRO");
      expect(result.provider).toBe("SLACK");
    });

    it("throws when integration limit reached", async () => {
      const { addIntegration } = await import("@/server/services/integrations.service");
      vi.mocked(prisma.workspaceIntegration.findMany).mockResolvedValue([
        { id: "i1" }, { id: "i2" },
      ] as any);
      await expect(addIntegration("ws1", { provider: "ZAPIER", config: {} }, "PRO"))
        .rejects.toThrow("INTEGRATION_LIMIT");
    });
  });
});

describe("Notification Preferences", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getNotificationPrefs", () => {
    it("returns all category preferences", async () => {
      const { getNotificationPrefs } = await import("@/server/services/account.service");
      vi.mocked(prisma.notificationPref.findMany).mockResolvedValue([
        { id: "np1", category: "Sites", inApp: true, email: "instant" },
      ] as any);
      const result = await getNotificationPrefs("u1");
      expect(result).toHaveLength(1);
    });
  });

  describe("updateNotificationPref", () => {
    it("upserts preference for category", async () => {
      const { updateNotificationPref } = await import("@/server/services/account.service");
      vi.mocked(prisma.notificationPref.upsert).mockResolvedValue({
        id: "np1", userId: "u1", category: "Team", inApp: false, email: "off",
      } as any);
      const result = await updateNotificationPref("u1", { category: "Team", inApp: false, email: "off" });
      expect(result.inApp).toBe(false);
    });
  });

  describe("AI credits info", () => {
    it("returns AI generation history and credit count", async () => {
      const { getAICreditsInfo } = await import("@/server/services/account.service");
      vi.mocked(prisma.aIGenerationJob.findMany).mockResolvedValue([
        { id: "j1", status: "COMPLETED", businessType: "PORTFOLIO", createdAt: new Date() },
      ] as any);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(2);
      const result = await getAICreditsInfo("ws1", "FREE");
      expect(result.history).toHaveLength(1);
      expect(result.used).toBe(2);
      expect(result.limit).toBe(3);
    });
  });
});
