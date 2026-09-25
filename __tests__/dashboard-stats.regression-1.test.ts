// Regression: ISSUE-006 — dashboard "Collaborators" counted the owner, so an
// owner-only workspace showed "1 active" while the Team page showed
// "No team members yet".
// Found by /qa on 2026-06-12
// Report: packages/.gstack/qa-reports/qa-report-buildrik-localhost-2026-06-12.md
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { count: vi.fn(), findMany: vi.fn() },
    workspaceMember: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    invite: { count: vi.fn() },
    siteAnalytics: { aggregate: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Dashboard Service — collaborators stat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.site.count).mockResolvedValue(0);
    vi.mocked(prisma.site.findMany).mockResolvedValue([]);
    vi.mocked(prisma.workspaceMember.count).mockResolvedValue(0);
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([]);
    // S-9: getDashboardStats now resolves siteScopeWhere(userId, workspaceId)
    // first. ADMIN is never site-scoped, so this keeps the stat unrestricted.
    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
      id: "m1",
      role: "ADMIN",
      _count: { sitePermissions: 0 },
    } as never);
    vi.mocked(prisma.invite.count).mockResolvedValue(0);
    vi.mocked(prisma.siteAnalytics.aggregate).mockResolvedValue({
      _sum: { visitors: 0 },
    } as never);
    vi.mocked(prisma.siteAnalytics.findMany).mockResolvedValue([]);
  });

  it("counts only non-OWNER members as collaborators", async () => {
    const { getDashboardStats } = await import(
      "@/server/services/dashboard.service"
    );
    await getDashboardStats("ws1", "u1", "OWNER");

    expect(prisma.workspaceMember.count).toHaveBeenCalledWith({
      where: { workspaceId: "ws1", role: { not: "OWNER" } },
    });
  });
});
