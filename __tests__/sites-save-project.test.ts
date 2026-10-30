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
          findFirst: vi.fn().mockResolvedValue(null),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          upsert: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        },
        site: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn(),
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
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import { BRAND_FORMAT_CONFLICT } from "@buildrik/shared/schemas/design-tokens";
import v5seed from "@/packages/shared/tokens/__tests__/__fixtures__/seed-only.json";

function makeTx() {
  const txPage = {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  };
  const txSite = {
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    findUnique: vi.fn(),
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
    expect(txSite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "site-1", deletedAt: null }),
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
    expect(txSite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pages: 0 }),
      })
    );
  });

  it("guards the trash with the save's base stamp (restore race, A-21)", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "site-1", name: "Test Site" } as never);
    const { txPage, txSite, txFormBlock } = makeTx();
    txPage.findMany.mockResolvedValueOnce([{ id: "page-1" }, { id: "page-2" }]).mockResolvedValueOnce([]);
    vi.mocked(prisma.$transaction).mockImplementation(((fn: (tx: unknown) => unknown) => fn({ page: txPage, site: txSite, formBlock: txFormBlock })) as never);

    await saveProjectFromEditor("site-1", {
      version: "1.0",
      pages: [{ id: "page-1", name: "Home", slug: "home", isHome: true, root: { type: "div", children: [] } }],
      styles: [],
      assets: [],
    }, "2026-10-31T10:00:00.000Z", "user-1");

    const base = new Date("2026-10-31T10:00:00.000Z");
    expect(txPage.findMany.mock.calls[1][0].where).toEqual({
      id: { in: ["page-2"] },
      siteId: "site-1",
      deletedAt: null,
      OR: [{ restoredAt: null }, { restoredAt: { lte: base } }],
    });
    expect(txPage.update).not.toHaveBeenCalled(); // page-2 was restored after the base
  });

  it("moves pages removed from project data to the trash (A-21)", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "Test Site",
    } as any);

    const { txPage, txSite, txFormBlock } = makeTx();
    // 1st read: the site's live pages; 2nd: the ones to trash, with slugs.
    txPage.findMany
      .mockResolvedValueOnce([{ id: "page-1" }, { id: "page-2" }, { id: "page-3" }])
      .mockResolvedValueOnce([{ id: "page-2", slug: "about" }, { id: "page-3", slug: "work" }]);

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
    }, undefined, "user-1");

    expect(result.success).toBe(true);
    // Live pages only, so a trashed page is not trashed again on every save.
    expect(txPage.findMany.mock.calls[0][0]).toEqual({ where: { siteId: "site-1", deletedAt: null }, select: { id: true } });
    // No base stamp sent → no restore-race guard on the read.
    expect(txPage.findMany.mock.calls[1][0].where).toEqual({ id: { in: ["page-2", "page-3"] }, siteId: "site-1", deletedAt: null });
    expect(txPage.deleteMany).not.toHaveBeenCalled();
    expect(txFormBlock.deleteMany).not.toHaveBeenCalled();
    expect(txPage.update).toHaveBeenCalledWith({
      where: { id: "page-2" },
      data: { deletedAt: expect.any(Date), deletedById: "user-1", trashedSlug: "about", slug: "about~deleted~page-2" },
    });
    expect(txPage.update).toHaveBeenCalledWith({
      where: { id: "page-3" },
      data: { deletedAt: expect.any(Date), deletedById: "user-1", trashedSlug: "work", slug: "work~deleted~page-3" },
    });
    // The page the editor sends is live: a trashed one coming back leaves the trash.
    expect(txPage.upsert.mock.calls[0][0].update).toMatchObject({ deletedAt: null, deletedById: null, trashedSlug: null });
    expect(txPage.upsert).toHaveBeenCalledTimes(1);
    expect(txSite.updateMany).toHaveBeenCalledWith(
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

describe("saveProjectData — 61-conflict optimistic concurrency (A-2 CAS)", () => {
  let tx: ReturnType<typeof makeTx>;
  beforeEach(() => {
    vi.clearAllMocks();
    tx = makeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) =>
      fn({ page: tx.txPage, site: tx.txSite, formBlock: tx.txFormBlock })
    );
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ deletedAt: null } as never);
  });

  const loaded = new Date("2026-06-19T10:00:00.000Z");

  it("rejects a behind-copy when the CAS update matches no row", async () => {
    const newer = new Date("2026-06-19T10:05:00.000Z"); // someone else saved later
    tx.txSite.updateMany.mockResolvedValue({ count: 0 });
    tx.txSite.findUnique.mockResolvedValue({ lastEditedAt: newer, deletedAt: null });
    await expect(
      saveProjectData(
        { siteId: "site-1", pages: [{ id: "p1", blocks: [], name: "Home", slug: "home", position: 0 }] },
        loaded.toISOString(),
      )
    ).rejects.toThrow(`SAVE_CONFLICT:${newer.toISOString()}`);
    // The CAS runs FIRST, so a losing save writes no page at all.
    expect(tx.txPage.upsert).not.toHaveBeenCalled();
    expect(tx.txPage.deleteMany).not.toHaveBeenCalled();
  });

  it("puts expectedLastEditedAt in the UPDATE's WHERE, not in a read before it", async () => {
    const result = await saveProjectData({ siteId: "site-1", pages: [] }, loaded.toISOString());
    expect(result.success).toBe(true);
    expect(tx.txSite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "site-1", deletedAt: null, lastEditedAt: loaded },
      })
    );
  });

  it("skips the check entirely when expectedLastEditedAt is omitted (non-regressive)", async () => {
    const result = await saveProjectData({ siteId: "site-1", pages: [] });
    expect(result.success).toBe(true);
    expect(tx.txSite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "site-1", deletedAt: null } })
    );
  });

  it("reports SITE_NOT_FOUND when the site is deleted between the read and the CAS", async () => {
    tx.txSite.updateMany.mockResolvedValue({ count: 0 });
    tx.txSite.findUnique.mockResolvedValue({ lastEditedAt: loaded, deletedAt: new Date() });
    await expect(
      saveProjectData({ siteId: "site-1", pages: [] }, loaded.toISOString())
    ).rejects.toThrow("SITE_NOT_FOUND");
  });
});

describe("saveProjectData — a stale brand-format tab (Brand Part 1 follow-up)", () => {
  const stored = new Date("2026-10-01T09:00:00.000Z");
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      deletedAt: null,
      lastEditedAt: stored,
      workspaceId: "ws-1",
      dsSchemaVersion: 1,
      tokensMigrationHold: false,
      projectSettings: { designTokens: migrateTokensToV6(v5seed), designTokensSchemaVersion: 6 },
    } as never);
  });

  it("refuses with the brand-format reason ahead of the ordinary SAVE_CONFLICT:<iso> tail", async () => {
    const save = saveProjectData(
      { siteId: "site-1", pages: [], settings: { designTokens: v5seed, designTokensSchemaVersion: 5 } },
      stored.toISOString(),
    );
    await expect(save).rejects.toThrow(`${BRAND_FORMAT_CONFLICT} SAVE_CONFLICT:${stored.toISOString()}`);
  });

  it("an older bundle's /SAVE_CONFLICT:(.+)$/ read still yields the bare ISO token", async () => {
    const err = await saveProjectData(
      { siteId: "site-1", pages: [], settings: { designTokens: v5seed, designTokensSchemaVersion: 5 } },
      stored.toISOString(),
    ).catch((e: Error) => e);
    expect(/SAVE_CONFLICT:(.+)$/.exec((err as Error).message)?.[1]).toBe(stored.toISOString());
  });
});
