import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    page: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((fn: any) =>
      fn({
        page: {
          findMany: vi.fn().mockResolvedValue([]),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          upsert: vi.fn().mockResolvedValue({}),
        },
        site: {
          update: vi.fn().mockResolvedValue({}),
        },
      })
    ),
  },
}));

vi.mock("@/server/services/email.service", () => ({
  sendSiteTransferredEmail: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { saveProjectData } from "@/server/services/sites.service";

describe("saveProjectData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves pages and updates lastEditedAt", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const txPage = {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn(),
      upsert: vi.fn().mockResolvedValue({}),
    };
    const txSite = {
      update: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite })
    );

    const result = await saveProjectData("site-1", {
      version: "1.0",
      pages: [
        {
          id: "page-1",
          name: "Home",
          slug: "home",
          isHome: true,
          root: { type: "div", children: [] },
        },
        {
          id: "page-2",
          name: "About",
          slug: "about",
          isHome: false,
          root: { type: "div", children: [] },
        },
      ],
      styles: [],
      assets: [],
    });

    expect(result.success).toBe(true);
    expect(result.savedAt).toBeInstanceOf(Date);

    expect(txPage.upsert).toHaveBeenCalledTimes(2);
    expect(txPage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "page-1" },
        create: expect.objectContaining({
          id: "page-1",
          siteId: "site-1",
          name: "Home",
          slug: "home",
          position: 0,
          isHomePage: true,
        }),
      })
    );

    expect(txSite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "site-1" },
        data: expect.objectContaining({
          pages: 2,
          lastEditedAt: expect.any(Date),
        }),
      })
    );
  });

  it("throws SITE_NOT_FOUND when site does not exist", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null);

    await expect(
      saveProjectData("nonexistent", {
        version: "1.0",
        pages: [],
        styles: [],
        assets: [],
      })
    ).rejects.toThrow("SITE_NOT_FOUND");
  });

  it("handles empty pages array", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const txPage = {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    };
    const txSite = {
      update: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite })
    );

    const result = await saveProjectData("site-1", {
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
    });

    expect(result.success).toBe(true);
    expect(txPage.upsert).not.toHaveBeenCalled();
    expect(txPage.deleteMany).not.toHaveBeenCalled();
    expect(txSite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pages: 0 }),
      })
    );
  });

  it("deletes pages removed from project data", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const txPage = {
      findMany: vi.fn().mockResolvedValue([
        { id: "page-1" },
        { id: "page-2" },
        { id: "page-3" },
      ]),
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      upsert: vi.fn().mockResolvedValue({}),
    };
    const txSite = {
      update: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite })
    );

    const result = await saveProjectData("site-1", {
      version: "1.0",
      pages: [
        {
          id: "page-1",
          name: "Home",
          slug: "home",
          isHome: true,
          root: { type: "div", children: [] },
        },
      ],
      styles: [],
      assets: [],
    });

    expect(result.success).toBe(true);
    expect(txPage.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["page-2", "page-3"] } },
    });
    expect(txPage.upsert).toHaveBeenCalledTimes(1);
    expect(txSite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pages: 1 }),
      })
    );
  });
});
