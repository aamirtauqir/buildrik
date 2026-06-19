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
      update: vi.fn(),
    },
    formBlock: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((fn: any) =>
      fn({
        page: {
          findMany: vi.fn().mockResolvedValue([]),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          upsert: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        },
        site: {
          update: vi.fn().mockResolvedValue({}),
        },
        formBlock: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      })
    ),
  },
}));

vi.mock("@/server/services/email.service", () => ({
  sendSiteTransferredEmail: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import {
  saveProjectFromEditor,
  saveProjectData,
} from "@/server/services/sites.service";

function makeTx() {
  const txPage = {
    findMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  };
  const txSite = {
    update: vi.fn().mockResolvedValue({}),
  };
  const txFormBlock = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  return { txPage, txSite, txFormBlock };
}

describe("saveProjectFromEditor — editor save path (positional args)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves pages and updates lastEditedAt", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const { txPage, txSite, txFormBlock } = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );

    const result = await saveProjectFromEditor("site-1", {
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
      saveProjectFromEditor("nonexistent", {
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

    const { txPage, txSite, txFormBlock } = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );

    const result = await saveProjectFromEditor("site-1", {
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
    });

    expect(result.success).toBe(true);
    expect(txPage.upsert).not.toHaveBeenCalled();
    expect(txPage.update).not.toHaveBeenCalled();
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

    const { txPage, txSite, txFormBlock } = makeTx();
    txPage.findMany.mockResolvedValue([
      { id: "page-1" },
      { id: "page-2" },
      { id: "page-3" },
    ]);
    txPage.deleteMany.mockResolvedValue({ count: 2 });

    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );

    const result = await saveProjectFromEditor("site-1", {
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
    expect(txFormBlock.deleteMany).toHaveBeenCalledWith({
      where: { pageId: { in: ["page-2", "page-3"] } },
    });
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

describe("REGRESSION-1: pages[].meta round-trip persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists pages[].meta on saveProjectFromEditor (codex finding C23)", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const { txPage, txSite, txFormBlock } = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );

    const appliedTemplates = [
      {
        templateId: "lumen-hero",
        version: "2.0",
        appliedAt: "2026-05-07T17:00:00.000Z",
      },
    ];

    await saveProjectFromEditor("site-1", {
      version: "1.0",
      pages: [
        {
          id: "page-1",
          name: "Home",
          slug: "home",
          isHome: true,
          root: { type: "div", children: [] },
          meta: { appliedTemplates },
        },
      ],
      styles: [],
      assets: [],
    });

    // Verify meta passes through to upsert.create
    expect(txPage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "page-1" },
        create: expect.objectContaining({
          meta: { appliedTemplates },
        }),
      })
    );
  });

  it("persists pages[].settings + slugHistory + slugManuallySet", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const { txPage, txSite, txFormBlock } = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );

    await saveProjectFromEditor("site-1", {
      version: "1.0",
      pages: [
        {
          id: "page-1",
          name: "Home",
          slug: "home-v2",
          isHome: true,
          root: { type: "div", children: [] },
          settings: { theme: "dark" },
          slugHistory: [
            { slug: "home", changedAt: "2026-05-01T00:00:00.000Z" },
          ],
          slugManuallySet: true,
        },
      ],
      styles: [],
      assets: [],
    });

    expect(txPage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          settings: { theme: "dark" },
          slugHistory: expect.arrayContaining([
            expect.objectContaining({ slug: "home", changedAt: "2026-05-01T00:00:00.000Z" }),
          ]),
          slugManuallySet: true,
        }),
      })
    );
  });

  it("treats undefined meta as no-op (forward-compat for older clients)", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const { txPage, txSite, txFormBlock } = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );

    await saveProjectFromEditor("site-1", {
      version: "1.0",
      pages: [
        {
          id: "page-1",
          name: "Home",
          slug: "home",
          isHome: true,
          root: { type: "div", children: [] },
          // No meta field — older client.
        },
      ],
      styles: [],
      assets: [],
    });

    // Should not include meta key in create payload (Prisma default = null).
    const upsertCall = (txPage.upsert as any).mock.calls[0][0];
    expect(upsertCall.create.meta).toBeUndefined();
  });
});

describe("saveProjectData — canonical input-object signature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts SaveProjectDataInput shape directly", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const { txPage, txSite, txFormBlock } = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );

    const result = await saveProjectData({
      siteId: "site-1",
      pages: [
        {
          id: "page-1",
          blocks: { type: "div" },
          // Partial update — no name/slug/position.
        },
      ],
    });

    expect(result.success).toBe(true);
    // Partial-snapshot path: uses update, not upsert.
    expect(txPage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "page-1" },
        data: expect.objectContaining({ blocks: { type: "div" } }),
      })
    );
    expect(txPage.upsert).not.toHaveBeenCalled();
  });

  it("throws SITE_NOT_FOUND when site missing", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null);
    await expect(
      saveProjectData({ siteId: "nope", pages: [] })
    ).rejects.toThrow("SITE_NOT_FOUND");
  });
});

describe("saveProjectData — 61-conflict optimistic concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { txPage, txSite, txFormBlock } = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: txPage, site: txSite, formBlock: txFormBlock })
    );
  });

  const loaded = new Date("2026-06-19T10:00:00.000Z");

  it("rejects a behind-copy when expectedLastEditedAt no longer matches", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      lastEditedAt: new Date("2026-06-19T10:05:00.000Z"), // someone else saved later
    } as any);
    await expect(
      saveProjectData({ siteId: "site-1", pages: [] }, loaded.toISOString())
    ).rejects.toThrow(/^SAVE_CONFLICT:/);
  });

  it("saves when expectedLastEditedAt matches the row", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      lastEditedAt: loaded,
    } as any);
    const result = await saveProjectData({ siteId: "site-1", pages: [] }, loaded.toISOString());
    expect(result.success).toBe(true);
  });

  it("skips the check entirely when expectedLastEditedAt is omitted (non-regressive)", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      lastEditedAt: new Date("2026-06-19T10:05:00.000Z"),
    } as any);
    const result = await saveProjectData({ siteId: "site-1", pages: [] });
    expect(result.success).toBe(true);
  });
});
