import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
    account: { deleteMany: vi.fn() },
    session: { findMany: vi.fn(), deleteMany: vi.fn(), delete: vi.fn() },
    loginAttempt: { findMany: vi.fn() },
    workspace: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    workspaceMember: { findFirst: vi.fn(), findMany: vi.fn() },
    wSSharingSettings: { upsert: vi.fn(), findUnique: vi.fn() },
    workspaceIntegration: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    notificationPref: { findMany: vi.fn(), upsert: vi.fn() },
    accountDeletionReq: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    site: { findMany: vi.fn() },
    userPreference: { findUnique: vi.fn() },
    aIGenerationJob: { findMany: vi.fn(), count: vi.fn() },
    aIUsage: { findUnique: vi.fn() },
  },
}));

const createNotificationMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/server/services/notification.trigger", () => ({
  createNotification: (...a: unknown[]) => createNotificationMock(...a),
}));

import { prisma } from "@/lib/prisma";

describe("Account Service", () => {
  beforeEach(() => { vi.clearAllMocks(); createNotificationMock.mockClear(); });

  // A-20: every account-security notification needs a destination so the
  // bell row is clickable — these had none.
  describe("account security notifications carry actionUrl (A-20)", () => {
    it("changePassword", async () => {
      const { changePassword } = await import("@/server/services/account.service");
      const bcrypt = await import("bcryptjs");
      const realHash = await bcrypt.hash("current-password-1", 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", passwordHash: realHash } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      await changePassword("u1", "current-password-1", "new-password-1");
      expect(createNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SECURITY_PASSWORD_CHANGED", actionUrl: "/dashboard/settings/security" }),
      );
    });

    it("setPassword", async () => {
      const { setPassword } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", passwordHash: null } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      await setPassword("u1", "new-password-1");
      expect(createNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SECURITY_PASSWORD_CHANGED", actionUrl: "/dashboard/settings/security" }),
      );
    });

    it("confirm2FA", async () => {
      const { confirm2FA } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ twoFactorSecret: "SECRETSECRETSECRETS" } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      const otplib = await import("otplib");
      vi.spyOn(otplib.authenticator, "verify").mockReturnValue(true);
      await confirm2FA("u1", "123456");
      expect(createNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SECURITY_2FA_CHANGED", actionUrl: "/dashboard/settings/security" }),
      );
    });

    it("disable2FA", async () => {
      const { disable2FA } = await import("@/server/services/account.service");
      const bcrypt = await import("bcryptjs");
      const realHash = await bcrypt.hash("my-password-1", 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", passwordHash: realHash } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      await disable2FA("u1", "my-password-1");
      expect(createNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SECURITY_2FA_CHANGED", actionUrl: "/dashboard/settings/security" }),
      );
    });
  });

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
    /**
     * The previous version of this test asserted that `deleteMany` was called
     * and returned 3. It passed for as long as the feature was completely
     * broken: sessions are JWT-strategy, so deleting rows never invalidated a
     * cookie. The assertion that matters is the sessionVersion bump — that is
     * the thing the jwt callback checks, and therefore the thing that actually
     * ends a session.
     */
    it("bumps sessionVersion, which is what actually ends the sessions", async () => {
      const { revokeAllOtherSessions } = await import("@/server/services/account.service");
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 3 });
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      await revokeAllOtherSessions("u1", "s1");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { sessionVersion: { increment: 1 } },
      });
      // Still exempts the caller's row from the display-list delete.
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u1", id: { not: "s1" } },
      });
    });
  });

  describe("disconnectProvider", () => {
    // W2.5 — must never strand a user with no login method.
    it("blocks disconnecting the only login method (no password, single provider)", async () => {
      const { disconnectProvider } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        passwordHash: null,
        accounts: [{ provider: "google" }],
      } as any);
      await expect(disconnectProvider("u1", "google")).rejects.toThrow("LAST_LOGIN_METHOD");
      expect(prisma.account.deleteMany).not.toHaveBeenCalled();
    });

    it("allows disconnect when a password remains", async () => {
      const { disconnectProvider } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        passwordHash: "hash",
        accounts: [{ provider: "google" }],
      } as any);
      vi.mocked(prisma.account.deleteMany).mockResolvedValue({ count: 1 } as any);
      const r = await disconnectProvider("u1", "google");
      expect(r.ok).toBe(true);
      expect(prisma.account.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", provider: "google" } });
    });

    it("allows disconnect when another provider remains", async () => {
      const { disconnectProvider } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        passwordHash: null,
        accounts: [{ provider: "google" }, { provider: "github" }],
      } as any);
      vi.mocked(prisma.account.deleteMany).mockResolvedValue({ count: 1 } as any);
      const r = await disconnectProvider("u1", "google");
      expect(r.ok).toBe(true);
    });

    it("rejects disconnecting a provider that is not connected", async () => {
      const { disconnectProvider } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        passwordHash: "hash",
        accounts: [{ provider: "github" }],
      } as any);
      await expect(disconnectProvider("u1", "google")).rejects.toThrow("NOT_CONNECTED");
    });
  });

  describe("disable2FA", () => {
    it("requires a TOTP code for OAuth-only users (no password to verify)", async () => {
      const { disable2FA } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "u1", passwordHash: null, twoFactorSecret: "v1:aa:bb:cc", twoFactorEnabled: true,
      } as any);
      // No code passed → must refuse before disabling (was a silent bypass).
      await expect(disable2FA("u1", "")).rejects.toThrow("CODE_REQUIRED");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("rejects a wrong password for password users", async () => {
      const { disable2FA } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "u1", passwordHash: "$2a$10$invalidhashvalue", twoFactorEnabled: true,
      } as any);
      await expect(disable2FA("u1", "wrong-password")).rejects.toThrow("WRONG_PASSWORD");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("enable2FA", () => {
    it("refuses when 2FA is already on and writes nothing (SA-03)", async () => {
      const { enable2FA } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "a@b.c", twoFactorEnabled: true } as never);
      await expect(enable2FA("u1")).rejects.toThrow("TWO_FACTOR_ALREADY_ENABLED");
      expect(prisma.user.update).not.toHaveBeenCalled();
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
      // Eligible: owns no workspace that would strand members or hold a sub.
      vi.mocked(prisma.workspace.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.accountDeletionReq.create).mockResolvedValue({
        id: "del1", userId: "u1", scheduledAt: new Date(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "u1@test.com" } as any);
      const result = await requestAccountDeletion("u1", "Not using anymore");
      expect(result.userId).toBe("u1");
    });
  });

  // The old fire-and-forget exportJob (requestDataExport) had no processor and
  // was replaced by a synchronous getUserDataExport that returns the data inline.
  describe("getUserDataExport", () => {
    it("returns the user's account, workspaces and sites", async () => {
      const { getUserDataExport } = await import("@/server/services/account.service");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "u1", email: "u1@test.com", fullName: "Ali Khan",
      } as any);
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.site.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null as any);
      const result = await getUserDataExport("u1");
      expect(result.account.id).toBe("u1");
      expect(result.exportedAt).toBeTruthy();
      expect(Array.isArray(result.workspaces)).toBe(true);
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
    it("returns the full config for an ADMIN (revealFullConfig=true)", async () => {
      const { listIntegrations } = await import("@/server/services/integrations.service");
      vi.mocked(prisma.workspaceIntegration.findMany).mockResolvedValue([
        { id: "int1", provider: "SLACK", config: { webhookUrl: "https://hooks.slack.com/services/T1/B1/xyz", apiKey: "sk-live-secret" }, isActive: true },
      ] as any);
      const result = await listIntegrations("ws1", true);
      expect(result[0].config).toEqual({ webhookUrl: "https://hooks.slack.com/services/T1/B1/xyz", apiKey: "sk-live-secret" });
    });

    it("redacts secrets and full webhook path for a non-admin (S-10)", async () => {
      const { listIntegrations } = await import("@/server/services/integrations.service");
      vi.mocked(prisma.workspaceIntegration.findMany).mockResolvedValue([
        { id: "int1", provider: "SLACK", config: { webhookUrl: "https://hooks.slack.com/services/T1/B1/xyz", apiKey: "sk-live-secret" }, isActive: true },
      ] as any);
      const result = await listIntegrations("ws1", false);
      expect(result[0].config).not.toHaveProperty("apiKey");
      expect(result[0].config.webhookUrl).toBe("https://hooks.slack.com/…");
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
      // Daily in-editor prompt usage (the enforced limit, now surfaced too).
      vi.mocked(prisma.aIUsage.findUnique).mockResolvedValue({ count: 4 } as any);
      const result = await getAICreditsInfo("ws1", "u1", "FREE");
      expect(result.history).toHaveLength(1);
      expect(result.used).toBe(2);
      expect(result.limit).toBe(3);
      // FREE aiPromptsPerDay = 10; 4 used today.
      expect(result.dailyPromptsUsed).toBe(4);
      expect(result.dailyPromptsLimit).toBe(10);
    });
  });
});
