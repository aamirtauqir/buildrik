import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const prismaMock: any = {
    site: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    shareLink: {
      updateMany: vi.fn(),
    },
    formBlock: {
      updateMany: vi.fn(),
    },
  };
  prismaMock.$transaction = vi.fn((input: any) => {
    if (typeof input === "function") return input(prismaMock);
    return Promise.all(input);
  });
  return { prisma: prismaMock };
});

vi.mock("@/server/services/publish.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/publish.service")>()),
  unpublishSite: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { unpublishSite } from "@/server/services/publish.service";
import { deleteSite, bulkAction } from "@/server/services/sites.service";

describe("SA-07: site delete takes the deployment down and is logged", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.site.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.shareLink.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.formBlock.updateMany).mockResolvedValue({ count: 0 } as never);
  });

  it("unpublishes a published site before soft-deleting (SA-07)", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "s1",
      name: "A",
      deletedAt: null,
      status: "PUBLISHED",
    } as never);

    await deleteSite("s1", "A");

    expect(unpublishSite).toHaveBeenCalledWith("s1");
  });

  it("does not attempt take-down for a site that isn't published", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "s1",
      name: "A",
      deletedAt: null,
      status: "DRAFT",
    } as never);

    await deleteSite("s1", "A");

    expect(unpublishSite).not.toHaveBeenCalled();
  });

  /* I1: an ARCHIVED site keeps its deployment — archive never took it down —
     so a publishedUrl means it is still live and must come down on delete. */
  it("takes down an ARCHIVED site that still has a publishedUrl", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "s1",
      name: "A",
      deletedAt: null,
      status: "ARCHIVED",
      publishedUrl: "https://a.vercel.app",
    } as never);

    await deleteSite("s1", "A");

    expect(unpublishSite).toHaveBeenCalledWith("s1");
  });

  it("bulk delete takes down an ARCHIVED site that still has a publishedUrl", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([
      { id: "s1", status: "ARCHIVED", publishedUrl: "https://a.vercel.app" },
      { id: "s2", status: "DRAFT", publishedUrl: null },
    ] as never);
    vi.mocked(prisma.site.updateMany).mockResolvedValue({ count: 2 } as never);

    await bulkAction("ws_123", { action: "delete", siteIds: ["s1", "s2"] } as never);

    expect(unpublishSite).toHaveBeenCalledWith("s1");
    expect(unpublishSite).not.toHaveBeenCalledWith("s2");
  });

  it("still soft-deletes when the take-down throws", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "s1",
      name: "A",
      deletedAt: null,
      status: "PUBLISHED",
    } as never);
    vi.mocked(unpublishSite).mockRejectedValue(new Error("vercel down"));

    await expect(deleteSite("s1", "A")).resolves.toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("bulk delete deactivates share links and forms too", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([
      { id: "s1", status: "PUBLISHED" },
      { id: "s2", status: "DRAFT" },
    ] as never);
    vi.mocked(prisma.site.updateMany).mockResolvedValue({ count: 2 } as never);

    const result = await bulkAction("ws_123", {
      action: "delete",
      siteIds: ["s1", "s2"],
    } as never);

    expect(result.succeeded).toHaveLength(2);
    expect(unpublishSite).toHaveBeenCalledWith("s1");
    expect(unpublishSite).not.toHaveBeenCalledWith("s2");
    expect(prisma.shareLink.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ siteId: { in: ["s1", "s2"] } }) }),
    );
    expect(prisma.formBlock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ siteId: { in: ["s1", "s2"] } }) }),
    );
  });

  it("bulk delete still deactivates links/forms even when a take-down throws", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([
      { id: "s1", status: "PUBLISHED" },
    ] as never);
    vi.mocked(prisma.site.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(unpublishSite).mockRejectedValue(new Error("vercel down"));

    const result = await bulkAction("ws_123", {
      action: "delete",
      siteIds: ["s1"],
    } as never);

    expect(result.succeeded).toEqual(["s1"]);
    expect(prisma.shareLink.updateMany).toHaveBeenCalled();
    expect(prisma.formBlock.updateMany).toHaveBeenCalled();
  });
});
