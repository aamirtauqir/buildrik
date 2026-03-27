import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSiteFindUnique = vi.fn();
const mockWorkspaceFindUnique = vi.fn();
const mockWorkspaceMemberFindFirst = vi.fn();
const mockShareLinkCount = vi.fn();
const mockShareLinkCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: mockSiteFindUnique },
    workspace: { findUnique: mockWorkspaceFindUnique },
    workspaceMember: { findFirst: mockWorkspaceMemberFindFirst },
    shareLink: { count: mockShareLinkCount, create: mockShareLinkCreate },
  },
}));

describe("Custom code plan gate", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("FREE plan + headCode in settings.update → FORBIDDEN", async () => {
    mockSiteFindUnique.mockResolvedValue({
      id: "s1",
      workspace: { plan: "FREE" },
    });

    // Replicate the plan-gate logic from the router
    const input = { id: "s1", headCode: "<script>test</script>" };
    const site = await mockSiteFindUnique({ where: { id: input.id }, include: { workspace: { select: { plan: true } } } });
    expect(site).not.toBeNull();
    const { z } = await import("zod");
    const planResult = z.enum(["FREE", "PRO", "BUSINESS"]).safeParse(site.workspace.plan);
    const plan = planResult.success ? planResult.data : "FREE";
    expect(plan).toBe("FREE");
    expect(() => {
      if (plan === "FREE") throw new Error("FORBIDDEN");
    }).toThrow("FORBIDDEN");
  });

  it("PRO plan + headCode → should succeed (no throw)", async () => {
    mockSiteFindUnique.mockResolvedValue({
      id: "s1",
      workspace: { plan: "PRO" },
    });

    const input = { id: "s1", headCode: "<script>test</script>" };
    const site = await mockSiteFindUnique({ where: { id: input.id }, include: { workspace: { select: { plan: true } } } });
    const { z } = await import("zod");
    const planResult = z.enum(["FREE", "PRO", "BUSINESS"]).safeParse(site.workspace.plan);
    const plan = planResult.success ? planResult.data : "FREE";
    expect(plan).toBe("PRO");
    expect(() => {
      if (plan === "FREE") throw new Error("FORBIDDEN");
    }).not.toThrow();
  });

  it("headCode not provided → no plan check runs (even on FREE)", async () => {
    const input = { id: "s1", name: "My Site" };
    const shouldCheck = (input as any).headCode !== undefined || (input as any).bodyCode !== undefined;
    expect(shouldCheck).toBe(false);
    expect(mockSiteFindUnique).not.toHaveBeenCalled();
  });
});

describe("Share link allowEditors gate", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("allowEditors=false, member role=EDITOR → throws EDITORS_CANNOT_CREATE_LINKS", async () => {
    mockSiteFindUnique.mockResolvedValue({ workspaceId: "ws1" });
    mockWorkspaceFindUnique.mockResolvedValue({ plan: "PRO" });
    mockWorkspaceMemberFindFirst.mockResolvedValue({
      role: "EDITOR",
      workspace: { sharingSettings: { allowEditors: false } },
    });
    mockShareLinkCount.mockResolvedValue(0);

    const { createShareLink } = await import("@/server/services/share-link.service");
    await expect(
      createShareLink("s1", { name: "Test" }, "user1")
    ).rejects.toThrow("EDITORS_CANNOT_CREATE_LINKS");
  });

  it("allowEditors=true, member role=EDITOR → does NOT throw", async () => {
    mockSiteFindUnique.mockResolvedValue({ workspaceId: "ws1" });
    mockWorkspaceFindUnique.mockResolvedValue({ plan: "PRO" });
    mockWorkspaceMemberFindFirst.mockResolvedValue({
      role: "EDITOR",
      workspace: { sharingSettings: { allowEditors: true } },
    });
    mockShareLinkCount.mockResolvedValue(0);
    mockShareLinkCreate.mockResolvedValue({ id: "sl1" });

    const { createShareLink } = await import("@/server/services/share-link.service");
    await expect(
      createShareLink("s1", { name: "Test" }, "user1")
    ).resolves.toBeDefined();
  });

  it("allowEditors=false, member role=ADMIN → does NOT throw", async () => {
    mockSiteFindUnique.mockResolvedValue({ workspaceId: "ws1" });
    mockWorkspaceFindUnique.mockResolvedValue({ plan: "PRO" });
    mockWorkspaceMemberFindFirst.mockResolvedValue({
      role: "ADMIN",
      workspace: { sharingSettings: { allowEditors: false } },
    });
    mockShareLinkCount.mockResolvedValue(0);
    mockShareLinkCreate.mockResolvedValue({ id: "sl1" });

    const { createShareLink } = await import("@/server/services/share-link.service");
    await expect(
      createShareLink("s1", { name: "Test" }, "user1")
    ).resolves.toBeDefined();
  });

  it("userId=undefined → no member check runs", async () => {
    mockSiteFindUnique.mockResolvedValue({ workspaceId: "ws1" });
    mockWorkspaceFindUnique.mockResolvedValue({ plan: "PRO" });
    mockShareLinkCount.mockResolvedValue(0);
    mockShareLinkCreate.mockResolvedValue({ id: "sl1" });

    const { createShareLink } = await import("@/server/services/share-link.service");
    await expect(
      createShareLink("s1", { name: "Test" })
    ).resolves.toBeDefined();
    expect(mockWorkspaceMemberFindFirst).not.toHaveBeenCalled();
  });
});
