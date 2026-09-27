import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  // Build the mock as a local const so $transaction's callback can reference
  // the SAME object the tests will override per-case via vi.mocked(prisma.X).
  const prismaMock: any = {
    site: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    folder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    siteAnalytics: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
    page: {
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    shareLink: {
      updateMany: vi.fn(),
    },
    formBlock: {
      updateMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn(),
    },
  };
  // $transaction has two call shapes:
  //   1. Array of pre-built queries → resolves to array of results
  //   2. Async callback receiving a `tx` client → forwards to inner closure
  //
  // For (2), delegate to the OUTER prisma mock so per-test
  // `vi.mocked(prisma.X.method).mockResolvedValue(...)` calls land where
  // the production code reads them. Without this, tx.site.create has its
  // own inner mock and outer overrides were ignored.
  prismaMock.$transaction = vi.fn((input: any) => {
    if (typeof input === "function") return input(prismaMock);
    return Promise.all(input);
  });
  return { prisma: prismaMock };
});

import { prisma } from "@/lib/prisma";
import { slugifyProjectName } from "@/lib/vercel";
import {
  listSites,
  createSite,
  getSite,
  renameSite,
  duplicateSite,
  archiveSite,
  unarchiveSite,
  deleteSite,
  bulkAction,
} from "@/server/services/sites.service";

describe("Sites Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listSites", () => {
    it("returns paginated sites", async () => {
      // S-9: listSites now resolves siteScopeWhere(userId, workspaceId) first.
      // An ADMIN is never site-scoped, so this keeps the unrestricted list.
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: "m1",
        role: "ADMIN",
        _count: { sitePermissions: 0 },
      } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(2);
      vi.mocked(prisma.site.findMany).mockResolvedValue([
        {
          id: "s1",
          name: "Site 1",
          slug: "site-1",
          status: "PUBLISHED",
          thumbnail: null,
          pages: 5,
          lastEditedAt: new Date(),
          publishedUrl: null,
          createdAt: new Date(),
          createdBy: null,
          template: null,
          folderId: null,
          domains: [],
          analytics: [],
        },
        {
          id: "s2",
          name: "Site 2",
          slug: "site-2",
          status: "DRAFT",
          thumbnail: null,
          pages: 3,
          lastEditedAt: new Date(),
          publishedUrl: null,
          createdAt: new Date(),
          createdBy: null,
          template: null,
          folderId: null,
          domains: [],
          analytics: [],
        },
      ] as any);

      const result = await listSites("ws_123", "u_1", {
        page: 1,
        perPage: 12,
        sort: "lastEdited",
      });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe("createSite", () => {
    it("creates a blank site with auto-generated slug", async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        workspace: { plan: "FREE" },
      } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.site.create).mockResolvedValue({
        id: "new-site",
        name: "My Portfolio",
        slug: "my-portfolio",
        status: "DRAFT",
        pages: 0,
        createdAt: new Date(),
      } as any);

      const site = await createSite("ws_123", "user_1", {
        name: "My Portfolio",
        method: "blank",
      });
      expect(site.name).toBe("My Portfolio");
      expect(site.slug).toBe("my-portfolio");
    });

    it("a blank site's Home stores its own root, not []", async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.site.create).mockResolvedValue({ id: "new-site", name: "X", slug: "x" } as any);
      await createSite("ws_123", "user_1", { name: "X", method: "blank" });
      const blocks = vi.mocked(prisma.page.create).mock.calls.at(-1)![0].data.blocks as { id: string };
      expect(Array.isArray(blocks)).toBe(false);
      expect(blocks.id).not.toBe("root");
    });

    /* C1: a slug whose derived Vercel project another site is pinned to
       (that site renamed its slug after going live) would deploy into that
       site's project and overwrite it. */
    it("skips a slug candidate whose derived Vercel project name is pinned by another site", async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findMany).mockResolvedValue([
        { slug: "renamed-away", vercelProjectName: slugifyProjectName("my-site") },
      ] as any);
      vi.mocked(prisma.site.create).mockResolvedValue({ id: "new-site", name: "My Site", slug: "x" } as any);

      await createSite("ws_123", "user_1", { name: "My Site", method: "blank" });

      expect(vi.mocked(prisma.site.create).mock.calls.at(-1)![0].data.slug).toBe("my-site-2");
    });

    it("throws when site limit reached", async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        workspace: { plan: "FREE" },
      } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(3);

      await expect(
        createSite("ws_123", "user_1", { name: "Too Many", method: "blank" })
      ).rejects.toThrow("SITE_LIMIT");
    });
  });

  describe("getSite", () => {
    it("returns site by id", async () => {
      vi.mocked(prisma.site.findFirst).mockResolvedValue({
        id: "s1",
        name: "My Site",
        slug: "my-site",
        status: "DRAFT",
      } as any);
      const site = await getSite("s1");
      expect(site?.id).toBe("s1");
    });
  });

  /* I3: the encrypted published-site password is reversible (it is pushed to
     Vercel), so it must never reach a client. Every mutation that returns the
     Site row returns it redacted, like getSite. */
  describe("site rows returned to clients are redacted", () => {
    const row = { id: "s1", name: "Renamed", slug: "s", publishedPassword: "v1:ciphertext" };

    it("renameSite", async () => {
      vi.mocked(prisma.site.update).mockResolvedValue(row as any);
      const result = await renameSite("s1", "Renamed");
      expect(result).not.toHaveProperty("publishedPassword");
      expect(result.hasPublishedPassword).toBe(true);
      expect(result.name).toBe("Renamed");
    });

    it("archiveSite and unarchiveSite", async () => {
      vi.mocked(prisma.site.update).mockResolvedValue(row as any);
      expect(await archiveSite("s1")).not.toHaveProperty("publishedPassword");
      expect(await unarchiveSite("s1")).not.toHaveProperty("publishedPassword");
    });

    it("createSite", async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.site.create).mockResolvedValue({ ...row, publishedPassword: null } as any);
      const result = await createSite("ws_123", "user_1", { name: "X", method: "blank" });
      expect(result).not.toHaveProperty("publishedPassword");
      expect(result.hasPublishedPassword).toBe(false);
    });
  });

  describe("renameSite", () => {
    it("updates site name", async () => {
      vi.mocked(prisma.site.update).mockResolvedValue({
        id: "s1",
        name: "New Name",
      } as any);
      const site = await renameSite("s1", "New Name");
      expect(site.name).toBe("New Name");
    });
  });

  describe("archiveSite", () => {
    it("sets status to ARCHIVED", async () => {
      vi.mocked(prisma.site.update).mockResolvedValue({
        id: "s1",
        status: "ARCHIVED",
      } as any);
      const site = await archiveSite("s1");
      expect(site.status).toBe("ARCHIVED");
    });
  });

  describe("unarchiveSite", () => {
    it("sets status to DRAFT", async () => {
      vi.mocked(prisma.site.update).mockResolvedValue({
        id: "s1",
        status: "DRAFT",
      } as any);
      const site = await unarchiveSite("s1");
      expect(site.status).toBe("DRAFT");
    });
  });

  describe("deleteSite", () => {
    it("soft-deletes when name matches using transaction", async () => {
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1",
        name: "My Site",
      } as any);
      const result = await deleteSite("s1", "My Site");
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("throws when name does not match", async () => {
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1",
        name: "My Site",
      } as any);
      await expect(deleteSite("s1", "Wrong Name")).rejects.toThrow();
    });
  });

  describe("bulkAction", () => {
    it("archives multiple sites", async () => {
      vi.mocked(prisma.site.updateMany).mockResolvedValue({ count: 3 });
      const result = await bulkAction("ws_123", {
        action: "archive",
        siteIds: ["s1", "s2", "s3"],
      });
      expect(result.succeeded).toHaveLength(3);
    });
  });

  describe("duplicateSite", () => {
    it("copies all page fields and form blocks (no lossy drop) in one transaction", async () => {
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1", name: "Orig", deletedAt: null, projectStyles: null, projectAssets: null, projectSettings: null,
      } as never);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "PRO" } } as never);
      vi.mocked(prisma.site.count).mockResolvedValue(1);
      vi.mocked(prisma.site.findFirst).mockResolvedValue(null); // slug unique
      vi.mocked(prisma.site.create).mockResolvedValue({ id: "s2", name: "Orig (Copy)" } as never);
      // original pages with the fields that used to be dropped
      vi.mocked(prisma.page.findMany)
        .mockResolvedValueOnce([
          { id: "p1", name: "Home", slug: "home", position: 0, blocks: [], isHomePage: true,
            seoTitle: "t", seoDescription: "d", meta: { a: 1 }, settings: { b: 2 },
            slugHistory: [{ fromSlug: "x", toSlug: "home" }], slugManuallySet: true, translations: { fr: {} } },
        ] as never)
        // re-query of new pages for form-block remap
        .mockResolvedValueOnce([{ id: "np1", slug: "home" }] as never);
      vi.mocked(prisma.formBlock.findMany).mockResolvedValue([
        { id: "f1", siteId: "s1", pageId: "p1", blockId: "blk1", name: "Contact", fields: [],
          submitButtonText: "Send", successMessage: "ok", notifyEmail: null, webhookUrl: null, isActive: true },
      ] as never);
      vi.mocked(prisma.page.createMany).mockResolvedValue({ count: 1 } as never);
      vi.mocked(prisma.formBlock.createMany).mockResolvedValue({ count: 1 } as never);

      const result = await duplicateSite("s1", "ws1", "u1");
      expect(result.id).toBe("s2");

      // page copy carries the previously-dropped fields
      const pageData = vi.mocked(prisma.page.createMany).mock.calls[0][0].data[0];
      expect(pageData.meta).toEqual({ a: 1 });
      expect(pageData.settings).toEqual({ b: 2 });
      expect(pageData.slugHistory).toEqual([{ fromSlug: "x", toSlug: "home" }]);
      expect(pageData.slugManuallySet).toBe(true);
      expect(pageData.translations).toEqual({ fr: {} });

      // form block copied + remapped to the new site/page
      const formData = vi.mocked(prisma.formBlock.createMany).mock.calls[0][0].data[0];
      expect(formData.siteId).toBe("s2");
      expect(formData.pageId).toBe("np1");
      expect(formData.blockId).toBe("blk1");

      // all writes rode a transaction
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    /* X-A1 round 1: a duplicate of a site whose pages share element ids
       (legacy data) is written with unique ids; the id-keyed style rule and
       the form block of a renamed element follow it. */
    it("re-ids colliding pages and carries id-keyed styles + form blocks along", async () => {
      const root = (text: string) => ({ id: "root", type: "container", children: [{ id: "form-1", type: "form", content: text, children: [] }] });
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1", name: "Orig", deletedAt: null, projectAssets: null, projectSettings: null,
        projectStyles: [{ id: "st1", selector: '[data-buildrick-id="form-1"]', properties: { color: "red" } }],
      } as never);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "PRO" } } as never);
      vi.mocked(prisma.site.count).mockResolvedValue(1);
      vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.site.findMany).mockResolvedValue([]);
      vi.mocked(prisma.site.create).mockResolvedValue({ id: "s2", name: "Orig (Copy)" } as never);
      vi.mocked(prisma.site.update).mockResolvedValue({} as never);
      vi.mocked(prisma.page.findMany)
        .mockResolvedValueOnce([
          { id: "p1", name: "Home", slug: "home", position: 0, blocks: root("a"), isHomePage: true },
          { id: "p2", name: "About", slug: "about", position: 1, blocks: root("b"), isHomePage: false },
        ] as never)
        .mockResolvedValueOnce([{ id: "np1", slug: "home" }, { id: "np2", slug: "about" }] as never);
      // As every real writer leaves it: id === blockId === element id, no pageId.
      vi.mocked(prisma.formBlock.findMany).mockResolvedValue([
        { id: "form-1", siteId: "s1", pageId: null, blockId: "form-1", name: "C", fields: [], submitButtonText: "Send",
          successMessage: null, notifyEmail: null, webhookUrl: null, isActive: true },
      ] as never);
      vi.mocked(prisma.page.createMany).mockResolvedValue({ count: 2 } as never);
      vi.mocked(prisma.formBlock.createMany).mockResolvedValue({ count: 1 } as never);

      await duplicateSite("s1", "ws1", "u1");

      const pages = vi.mocked(prisma.page.createMany).mock.calls.at(-1)![0].data as Array<{ blocks: { id: string; children: Array<{ id: string }> } }>;
      expect(pages[0].blocks.id).toBe("root");
      expect(pages[0].blocks.children[0].id).toBe("form-1");
      const aboutForm = pages[1].blocks.children[0].id;
      expect(pages[1].blocks.id).not.toBe("root");
      expect(aboutForm).not.toBe("form-1");
      // COPY, not move: Home's form keeps its row, About's renamed form gets one.
      const form = vi.mocked(prisma.formBlock.createMany).mock.calls.at(-1)![0].data as Array<{ blockId: string; name: string }>;
      expect(form.map((f) => f.blockId)).toEqual(["form-1", aboutForm]);
      expect(form[1].name).toBe("C");
      const styleWrites = [
        vi.mocked(prisma.site.create).mock.calls.at(-1)![0].data.projectStyles,
        ...vi.mocked(prisma.site.update).mock.calls.map((c) => c[0].data.projectStyles),
      ].filter(Boolean) as Array<Array<{ selector: string }>>;
      const finalStyles = styleWrites.at(-1)!;
      expect(finalStyles.map((r) => r.selector)).toEqual([
        '[data-buildrick-id="form-1"]',
        `[data-buildrick-id="${aboutForm}"]`,
      ]);
    });

    /* S-1 class carry-over: the copy wrote original.projectStyles straight
       into the new site with no sanitization. An unsafe rule saved before the
       allowlist sanitizer shipped (or by a path that skipped it) would
       otherwise ride along into every duplicate made from that site. */
    it("sanitizes projectStyles on copy instead of trusting the source row", async () => {
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1", name: "Orig", deletedAt: null,
        projectStyles: [
          { selector: "[data-buildrik-id=a]" },
          { selector: "</style><script>alert(1)</script>" },
        ],
        projectAssets: null, projectSettings: null,
      } as never);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "PRO" } } as never);
      vi.mocked(prisma.site.count).mockResolvedValue(1);
      vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.site.findMany).mockResolvedValue([]);
      vi.mocked(prisma.site.create).mockResolvedValue({ id: "s2", name: "Orig (Copy)" } as never);
      vi.mocked(prisma.page.findMany).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      vi.mocked(prisma.formBlock.findMany).mockResolvedValue([]);

      await duplicateSite("s1", "ws1", "u1");

      const createData = vi.mocked(prisma.site.create).mock.calls[0][0].data;
      expect(createData.projectStyles).toEqual([{ selector: "[data-buildrik-id=a]" }]);
    });
  });

  describe("Folder Service", () => {
    it("listFolders returns folders with site counts, live counts and 30d views", async () => {
      const { listFolders } = await import(
        "@/server/services/folder.service"
      );
      vi.mocked(prisma.folder.findMany).mockResolvedValue([
        {
          id: "f1",
          name: "Projects",
          position: 0,
          workspaceId: "ws_123",
          createdAt: new Date(),
          _count: { sites: 3 },
          sites: [
            { id: "s1", status: "PUBLISHED" },
            { id: "s2", status: "DRAFT" },
            { id: "s3", status: "PUBLISHED" },
          ],
        },
      ] as any);
      vi.mocked(prisma.siteAnalytics.groupBy).mockResolvedValue([
        { siteId: "s1", _sum: { visitors: 800 } },
        { siteId: "s3", _sum: { visitors: 400 } },
      ] as any);
      const folders = await listFolders("ws_123");
      expect(folders).toHaveLength(1);
      expect(folders[0]._count.sites).toBe(3);
      expect(folders[0].liveCount).toBe(2);
      expect(folders[0].views).toBe(1200);
      expect((folders[0] as any).sites).toBeUndefined();
    });

    it("createFolder validates unique name", async () => {
      const { createFolder } = await import(
        "@/server/services/folder.service"
      );
      vi.mocked(prisma.folder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.folder.create).mockResolvedValue({
        id: "f1",
        name: "Projects",
        workspaceId: "ws_123",
        position: 0,
        createdAt: new Date(),
      } as any);
      const folder = await createFolder("ws_123", "Projects");
      expect(folder.name).toBe("Projects");
    });

    it("deleteFolder sets sites to ungrouped", async () => {
      const { deleteFolder } = await import(
        "@/server/services/folder.service"
      );
      vi.mocked(prisma.site.updateMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.folder.delete).mockResolvedValue({ id: "f1" } as any);
      await deleteFolder("f1");
      expect(prisma.site.updateMany).toHaveBeenCalled();
    });
  });
});
