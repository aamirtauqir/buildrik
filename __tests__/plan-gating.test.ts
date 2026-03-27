import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSiteFindUnique = vi.fn();
const mockSiteUpdate = vi.fn();
const mockWorkspaceFindUnique = vi.fn();
const mockWorkspaceMemberFindFirst = vi.fn();
const mockShareLinkCount = vi.fn();
const mockShareLinkCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: mockSiteFindUnique, update: mockSiteUpdate },
    workspace: { findUnique: mockWorkspaceFindUnique },
    workspaceMember: { findFirst: mockWorkspaceMemberFindFirst },
    shareLink: { count: mockShareLinkCount, create: mockShareLinkCreate },
  },
}));

describe("Custom code plan gate", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("FREE plan + headCode in settings.update → throws CUSTOM_CODE_NOT_AVAILABLE", async () => {
    mockSiteFindUnique.mockResolvedValue({
      slug: "my-site",
      workspace: { plan: "FREE" },
    });

    const { updateSiteSettings } = await import("@/server/services/site-settings.service");
    await expect(
      updateSiteSettings("s1", { headCode: "<script>test</script>" })
    ).rejects.toThrow("CUSTOM_CODE_NOT_AVAILABLE");
  });

  it("PRO plan + headCode → should succeed (no throw)", async () => {
    mockSiteFindUnique.mockResolvedValue({
      slug: "my-site",
      workspace: { plan: "PRO" },
    });
    mockSiteUpdate.mockResolvedValue({ id: "s1", headCode: "<script>test</script>" });

    const { updateSiteSettings } = await import("@/server/services/site-settings.service");
    await expect(
      updateSiteSettings("s1", { headCode: "<script>test</script>" })
    ).resolves.toBeDefined();
  });

  it("headCode not provided → no plan check runs (even on FREE)", async () => {
    mockSiteUpdate.mockResolvedValue({ id: "s1", name: "My Site" });

    const { updateSiteSettings } = await import("@/server/services/site-settings.service");
    await expect(
      updateSiteSettings("s1", { name: "My Site" })
    ).resolves.toBeDefined();
    expect(mockSiteFindUnique).not.toHaveBeenCalled();
  });
});

describe("Share link allowEditors gate", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("allowEditors=false, member role=EDITOR → throws EDITORS_CANNOT_CREATE_LINKS", async () => {
    mockSiteFindUnique.mockResolvedValue({ workspaceId: "ws1" });
    mockWorkspaceMemberFindFirst.mockResolvedValue({
      role: "EDITOR",
      workspace: { plan: "PRO", sharingSettings: { allowEditors: false } },
    });
    mockShareLinkCount.mockResolvedValue(0);

    const { createShareLink } = await import("@/server/services/share-link.service");
    await expect(
      createShareLink("s1", { name: "Test" }, "user1")
    ).rejects.toThrow("EDITORS_CANNOT_CREATE_LINKS");
  });

  it("allowEditors=true, member role=EDITOR → does NOT throw", async () => {
    mockSiteFindUnique.mockResolvedValue({ workspaceId: "ws1" });
    mockWorkspaceMemberFindFirst.mockResolvedValue({
      role: "EDITOR",
      workspace: { plan: "PRO", sharingSettings: { allowEditors: true } },
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
    mockWorkspaceMemberFindFirst.mockResolvedValue({
      role: "ADMIN",
      workspace: { plan: "PRO", sharingSettings: { allowEditors: false } },
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

  it("userId provided but user is not an active member → throws NOT_WORKSPACE_MEMBER", async () => {
    mockSiteFindUnique.mockResolvedValue({ workspaceId: "ws1" });
    mockWorkspaceMemberFindFirst.mockResolvedValue(null);

    const { createShareLink } = await import("@/server/services/share-link.service");
    await expect(
      createShareLink("s1", { name: "Test" }, "user1")
    ).rejects.toThrow("NOT_WORKSPACE_MEMBER");
  });
});
