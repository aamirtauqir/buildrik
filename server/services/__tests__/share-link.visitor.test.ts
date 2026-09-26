/**
 * /share/<token> visitor side: token states, the signed unlock cookie, and
 * what draft data leaves the server.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shareLink: { findUnique: vi.fn(), update: vi.fn() },
    site: { findUnique: vi.fn() },
    mediaAsset: { findMany: vi.fn().mockResolvedValue([]) },
    cmsCollection: { findMany: vi.fn().mockResolvedValue([]) },
    cmsEntry: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getShareDraftRows,
  resolveShareLink,
  shareUnlockProof,
} from "@/server/services/share-link.service";

const link = (over: Record<string, unknown> = {}) => ({
  id: "l1",
  isActive: true,
  expiresAt: null,
  passwordHash: null,
  site: { id: "s1", name: "Bella", deletedAt: null },
  ...over,
});

describe("resolveShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  it("open link → open with the site", async () => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(link() as never);
    await expect(resolveShareLink("t", undefined)).resolves.toEqual({
      state: "open",
      linkId: "l1",
      siteId: "s1",
      siteName: "Bella",
    });
  });

  it.each([
    ["missing", null, "unknown"],
    ["revoked", link({ isActive: false }), "revoked"],
    ["expired", link({ expiresAt: new Date(Date.now() - 1000) }), "expired"],
    ["deleted site", link({ site: { id: "s1", name: "Bella", deletedAt: new Date() } }), "revoked"],
    ["expired AND password", link({ expiresAt: new Date(Date.now() - 1000), passwordHash: "$2a$h" }), "expired"],
  ])("%s → unavailable (%s)", async (_label, row, reason) => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(row as never);
    await expect(resolveShareLink("t", undefined)).resolves.toEqual({ state: "unavailable", reason });
  });

  it("an unexpired link with a future expiry is still open", async () => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(
      link({ expiresAt: new Date(Date.now() + 60_000) }) as never,
    );
    await expect(resolveShareLink("t", undefined)).resolves.toMatchObject({ state: "open" });
  });

  it("password link: locked without proof, locked with the old forgeable '1', open with the signed proof", async () => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(link({ passwordHash: "$2a$hash" }) as never);
    await expect(resolveShareLink("t", undefined)).resolves.toEqual({ state: "locked" });
    await expect(resolveShareLink("t", "1")).resolves.toEqual({ state: "locked" });
    await expect(resolveShareLink("t", shareUnlockProof("other-token"))).resolves.toEqual({ state: "locked" });
    await expect(resolveShareLink("t", shareUnlockProof("t"))).resolves.toMatchObject({ state: "open" });
  });
});

describe("getShareDraftRows", () => {
  it("drops hidden pages and never selects publishedPassword", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      name: "Bella",
      publishedUrl: null,
      projectStyles: [],
      projectSettings: {},
      dsSchemaVersion: 2,
      favicon: null,
      metaTitle: "Bella",
      sitePages: [
        { id: "p1", name: "Home", settings: null },
        { id: "p2", name: "Menu", settings: { visibility: "live" } },
        { id: "p3", name: "Secret", settings: { visibility: "hidden" } },
        { id: "p4", name: "Old pw page", settings: { visibility: "password" } },
      ],
    } as never);

    const rows = await getShareDraftRows("s1");

    expect(rows.pages.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(rows.siteColumns).toMatchObject({ name: "Bella", metaTitle: "Bella" });
    const select = vi.mocked(prisma.site.findUnique).mock.calls[0][0].select as Record<string, unknown>;
    expect(select.publishedPassword).toBeUndefined();
  });

  it("carries the site's ADDED fonts, and only those", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", sitePages: [] } as never);
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([
      { filename: "Inter-Var.woff2", url: "https://x.public.blob.vercel-storage.com/Inter-Var.woff2" },
    ] as never);
    const rows = await getShareDraftRows("s1");
    expect(rows.siteFonts).toEqual([
      { filename: "Inter-Var.woff2", url: "https://x.public.blob.vercel-storage.com/Inter-Var.woff2" },
    ]);
    const where = vi.mocked(prisma.mediaAsset.findMany).mock.calls.at(-1)![0]!.where;
    expect(where).toEqual({ siteId: "s1", type: "font", userMetadata: { path: ["siteFont"], equals: true } });
  });

  /* Ldata I1: the draft is rendered from these rows by the editor's own
     projectDataFromRows, which reads `projectCmsBindings` — without it every
     CMS-bound element in a shared draft showed its placeholder copy. */
  it("carries the site's CMS bindings to the draft render", async () => {
    const bindings = { field: { h1: [{ binding: { sourceId: "cms:c", path: "t", type: "variable" }, collectionId: "c", fieldSlug: "t", property: "content" }] } };
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", projectCmsBindings: bindings, sitePages: [] } as never);

    const rows = await getShareDraftRows("s1");

    const select = vi.mocked(prisma.site.findUnique).mock.calls.at(-1)![0].select as Record<string, unknown>;
    expect(select.projectCmsBindings).toBe(true);
    expect(rows.site.projectCmsBindings).toEqual(bindings);
    expect(rows.siteColumns).not.toHaveProperty("projectCmsBindings");
  });

  /* Lv3 #10 (dashboard verify pass 3): the bindings reached the draft render
     but no CMS data did, so the scratch composer could resolve nothing and the
     page showed the element's last-saved text — stale, then an empty <p>. The
     rows now carry the collections the bindings reference and their PUBLISHED
     entries only — an anonymous link holder never sees a draft record. */
  it("carries the referenced collections and only their published entries, scoped to the site", async () => {
    const bindings = {
      field: { t2: [{ binding: { sourceId: "cms:notes", path: "title", type: "variable" }, collectionId: "notes", fieldSlug: "title", property: "content" }] },
      collection: { list1: { elementId: "list1", collectionId: "posts", itemVar: "item" } },
    };
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", projectCmsBindings: bindings, sitePages: [] } as never);
    vi.mocked(prisma.cmsCollection.findMany).mockResolvedValue([
      { id: "notes", name: "Notes", slug: "notes", displayField: "title", fields: [{ id: "title", slug: "title", name: "Title", type: "text" }] },
    ] as never);
    vi.mocked(prisma.cmsEntry.findMany).mockResolvedValue([
      { id: "e1", collectionId: "notes", data: { title: "Tom & Jerry <3" }, updatedAt: new Date("2026-09-26T00:00:00Z") },
    ] as never);

    const rows = await getShareDraftRows("s1");

    const colWhere = vi.mocked(prisma.cmsCollection.findMany).mock.calls.at(-1)![0]!.where;
    expect(colWhere).toEqual({ siteId: "s1", id: { in: ["notes", "posts"] } });
    const entryArgs = vi.mocked(prisma.cmsEntry.findMany).mock.calls.at(-1)![0]!;
    expect(entryArgs.where).toEqual({ collectionId: { in: ["notes"] }, status: "PUBLISHED" });
    expect(entryArgs.orderBy).toEqual({ updatedAt: "desc" });
    expect(rows.cms.collections.map((c) => c.id)).toEqual(["notes"]);
    expect(rows.cms.entries).toEqual([
      { id: "e1", collectionId: "notes", data: { title: "Tom & Jerry <3" }, updatedAt: new Date("2026-09-26T00:00:00Z") },
    ]);
  });

  it("queries no CMS at all for a site without bindings", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", projectCmsBindings: null, sitePages: [] } as never);
    vi.mocked(prisma.cmsCollection.findMany).mockClear();
    const rows = await getShareDraftRows("s1");
    expect(prisma.cmsCollection.findMany).not.toHaveBeenCalled();
    expect(rows.cms).toEqual({ collections: [], entries: [] });
  });
});
