import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    invite: { findMany: vi.fn(), create: vi.fn(), createMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    workspace: { findUnique: vi.fn() },
    site: { count: vi.fn() },
    activityLog: { findMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/server/services/email.service", () => ({
  sendTeamInviteEmail: vi.fn(),
}));

import { prisma } from "@/lib/prisma";

describe("Team Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getTeamStats", () => {
    it("returns total, active, and pending counts", async () => {
      const { getTeamStats } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(4);
      vi.mocked(prisma.invite.count).mockResolvedValue(2);
      const stats = await getTeamStats("ws1");
      expect(stats.total).toBe(5);
      expect(stats.active).toBe(4);
      expect(stats.pending).toBe(2);
    });
  });

  describe("listMembers", () => {
    it("returns paginated members with user data", async () => {
      const { listMembers } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(3);
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
        { id: "m1", userId: "u1", role: "OWNER", status: "ACTIVE", lastActiveAt: new Date(), joinedAt: new Date(), user: { fullName: "Ali Khan", email: "ali@test.com", avatar: null }, sitePermissions: [] },
        { id: "m2", userId: "u2", role: "EDITOR", status: "ACTIVE", lastActiveAt: null, joinedAt: new Date(), user: { fullName: "Sara Ahmed", email: "sara@test.com", avatar: null }, sitePermissions: [] },
      ] as any);
      vi.mocked(prisma.site.count).mockResolvedValue(5);
      const result = await listMembers("ws1", { page: 1, perPage: 20 });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].fullName).toBe("Ali Khan");
      expect(result.total).toBe(3);
    });
  });

  describe("inviteMembers", () => {
    it("creates invites for multiple emails", async () => {
      const { inviteMembers } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1);
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([]);
      vi.mocked(prisma.invite.findMany).mockResolvedValue([]);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ id: "ws1", name: "Test WS" } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", fullName: "Inviter" } as any);
      vi.mocked(prisma.invite.create)
        .mockResolvedValueOnce({ id: "inv1", email: "bob@test.com", status: "PENDING", token: "t1" } as any)
        .mockResolvedValueOnce({ id: "inv2", email: "carol@test.com", status: "PENDING", token: "t2" } as any);
      const result = await inviteMembers("ws1", "u1", {
        emails: ["bob@test.com", "carol@test.com"],
        role: "EDITOR",
      }, "PRO");
      expect(result.sent).toBe(2);
      expect(result.skipped).toBe(0);
    });

    it("skips already-member emails", async () => {
      const { inviteMembers } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1);
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
        { user: { email: "bob@test.com" } },
      ] as any);
      vi.mocked(prisma.invite.findMany).mockResolvedValue([]);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ id: "ws1", name: "Test WS" } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", fullName: "Inviter" } as any);
      vi.mocked(prisma.invite.create).mockResolvedValue({ id: "inv1", token: "t1" } as any);
      const result = await inviteMembers("ws1", "u1", {
        emails: ["bob@test.com", "carol@test.com"],
        role: "EDITOR",
      }, "PRO");
      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  describe("changeRole", () => {
    it("updates member role, scoped to workspaceId", async () => {
      const { changeRole } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: "m1", role: "EDITOR", userId: "u2", workspaceId: "ws1",
      } as any);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(2);
      vi.mocked(prisma.workspaceMember.updateMany).mockResolvedValue({ count: 1 });
      await changeRole("m1", "ws1", "ADMIN", "u1");
      expect(prisma.workspaceMember.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "m1", workspaceId: "ws1" } })
      );
    });

    it("prevents changing owner role", async () => {
      const { changeRole } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: "m1", role: "OWNER", userId: "u1", workspaceId: "ws1",
      } as any);
      await expect(changeRole("m1", "ws1", "EDITOR", "u2")).rejects.toThrow("CANNOT_CHANGE_OWNER");
    });

    it("prevents demoting last admin", async () => {
      const { changeRole } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: "m1", role: "ADMIN", userId: "u2", workspaceId: "ws1",
      } as any);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1);
      await expect(changeRole("m1", "ws1", "EDITOR", "u1")).rejects.toThrow("LAST_ADMIN");
    });
  });

  describe("revokeMember", () => {
    it("sets member status to SUSPENDED, scoped to workspaceId", async () => {
      const { revokeMember } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: "m1", role: "EDITOR", workspaceId: "ws1",
      } as any);
      vi.mocked(prisma.workspaceMember.updateMany).mockResolvedValue({ count: 1 });
      await revokeMember("m1", "ws1");
      expect(prisma.workspaceMember.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "m1", workspaceId: "ws1" } })
      );
    });
  });

  describe("deleteMember", () => {
    it("removes member from workspace, scoped to workspaceId", async () => {
      const { deleteMember } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: "m1", role: "EDITOR", workspaceId: "ws1",
      } as any);
      vi.mocked(prisma.workspaceMember.deleteMany).mockResolvedValue({ count: 1 });
      await deleteMember("m1", "ws1");
      expect(prisma.workspaceMember.deleteMany).toHaveBeenCalledWith({ where: { id: "m1", workspaceId: "ws1" } });
    });

    it("prevents deleting owner", async () => {
      const { deleteMember } = await import("@/server/services/team.service");
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: "m1", role: "OWNER", workspaceId: "ws1",
      } as any);
      await expect(deleteMember("m1", "ws1")).rejects.toThrow("CANNOT_DELETE_OWNER");
    });
  });

  describe("listPendingInvites", () => {
    it("returns pending invites", async () => {
      const { listPendingInvites } = await import("@/server/services/team.service");
      vi.mocked(prisma.invite.findMany).mockResolvedValue([
        { id: "inv1", email: "bob@test.com", role: "EDITOR", status: "PENDING", createdAt: new Date(), expiresAt: new Date() },
      ] as any);
      const result = await listPendingInvites("ws1");
      expect(result).toHaveLength(1);
    });
  });

  describe("revokeInvite", () => {
    it("deletes invite, scoped to workspaceId", async () => {
      const { revokeInvite } = await import("@/server/services/team.service");
      vi.mocked(prisma.invite.deleteMany).mockResolvedValue({ count: 1 });
      await revokeInvite("inv1", "ws1");
      expect(prisma.invite.deleteMany).toHaveBeenCalledWith({ where: { id: "inv1", workspaceId: "ws1" } });
    });
  });

  describe("getTeamActivity", () => {
    it("returns recent team activity", async () => {
      const { getTeamActivity } = await import("@/server/services/team.service");
      vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
        { id: "a1", action: "MEMBER_INVITED", description: "Invited bob@test.com", createdAt: new Date() },
      ] as any);
      const result = await getTeamActivity("ws1");
      expect(result).toHaveLength(1);
    });
  });
});
