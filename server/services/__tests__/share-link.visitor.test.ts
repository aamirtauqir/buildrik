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
import { CMS_COLLECTION_LIMIT_MAX } from "@buildrik/shared/schemas/sites";

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
    const page = { id: "p1", name: "Home", slug: "home", position: 0, isHomePage: true, meta: null, settings: null, blocks: { id: "h1", type: "heading" } };
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", projectCmsBindings: bindings, sitePages: [page] } as never);

    const rows = await getShareDraftRows("s1");

    const select = vi.mocked(prisma.site.findUnique).mock.calls.at(-1)![0].select as Record<string, unknown>;
    expect(select.projectCmsBindings).toBe(true);
    expect(rows.site.projectCmsBindings).toEqual(bindings);
    expect(rows.siteColumns).not.toHaveProperty("projectCmsBindings");
  });

  /* Lv3 #10 (dashboard verify pass 3): the bindings reached the draft render
     but no CMS data did, so the scratch composer could resolve nothing and the
     page showed the element's last-saved text — stale, then an empty <p>. The
     rows now carry what the bindings on the DELIVERED pages read: their
     collections, their PUBLISHED entries only, and only the fields bound
     (review I-2 — the whole entry reached an anonymous visitor, "internal
     notes" and all, including collections bound only on hidden pages). */
  const fieldBinding = (collectionId: string, fieldSlug: string) => [
    { binding: { sourceId: `cms:${collectionId}`, path: fieldSlug, type: "variable" }, collectionId, fieldSlug, property: "content" },
  ];
  const bindings = {
    field: { t2: fieldBinding("notes", "title"), hid: fieldBinding("secret", "title") },
    collection: { list1: { elementId: "list1", collectionId: "posts", itemVar: "post" } },
  };
  const visible = {
    id: "p1", name: "Home", slug: "home", position: 0, isHomePage: true, meta: null, settings: null,
    blocks: {
      id: "root", type: "container", children: [
        { id: "t2", type: "text", content: "x" },
        { id: "list1", type: "container", children: [{ id: "c1", type: "text", content: "{{ post.headline }} by {{post.author}}" }] },
      ],
    },
  };
  const hidden = {
    id: "p2", name: "Drafts", slug: "drafts", position: 1, isHomePage: false, meta: null,
    settings: { visibility: "hidden" }, blocks: { id: "r2", type: "container", children: [{ id: "hid", type: "text" }] },
  };

  it("carries the delivered pages' collections, published entries only, projected to the bound fields", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", projectCmsBindings: bindings, sitePages: [visible, hidden] } as never);
    vi.mocked(prisma.cmsCollection.findMany).mockResolvedValue([
      { id: "notes", name: "Notes", slug: "notes", displayField: "name", fields: [
        { id: "title", slug: "title", name: "Title", type: "text" },
        { id: "name", slug: "name", name: "Name", type: "text" },
        { id: "notes", slug: "internal-notes", name: "Internal notes", type: "text" },
      ] },
      { id: "posts", name: "Posts", slug: "posts", displayField: null, fields: [] },
    ] as never);
    vi.mocked(prisma.cmsEntry.findMany).mockImplementation((async (args: { where: { collectionId: string } }) =>
      args.where.collectionId === "notes"
        ? [{ id: "e1", collectionId: "notes", data: { title: "Tom & Jerry <3", name: "N", "internal-notes": "fire Bob", email: "a@b.c" }, updatedAt: new Date(0) }]
        : [{ id: "e2", collectionId: "posts", data: { headline: "H", author: "A", draftNotes: "x" }, updatedAt: new Date(0) }]) as never);

    const rows = await getShareDraftRows("s1");

    const colWhere = vi.mocked(prisma.cmsCollection.findMany).mock.calls.at(-1)![0]!.where;
    expect(colWhere).toEqual({ siteId: "s1", deletedAt: null, id: { in: ["notes", "posts"] } }); // "secret" (hidden page) absent; tombstones hidden (C0a Tasks 1-3)
    const entryCalls = vi.mocked(prisma.cmsEntry.findMany).mock.calls.map(([a]) => a!);
    expect(entryCalls.map((a) => a.where)).toEqual([
      { collectionId: "notes", status: "PUBLISHED", deletedAt: null },
      { collectionId: "posts", status: "PUBLISHED", deletedAt: null },
    ]);
    expect(entryCalls.every((a) => a.take === CMS_COLLECTION_LIMIT_MAX)).toBe(true);
    expect(entryCalls.every((a) => JSON.stringify(a.orderBy) === JSON.stringify({ updatedAt: "desc" }))).toBe(true);

    const byId = Object.fromEntries(rows.cms.entries.map((e) => [e.id, e.data]));
    expect(byId.e1).toEqual({ title: "Tom & Jerry <3", name: "N" });
    expect(byId.e2).toEqual({ headline: "H", author: "A" });
    const notes = rows.cms.collections.find((c) => c.id === "notes")!;
    expect((notes.fields as Array<{ slug: string }>).map((f) => f.slug)).toEqual(["title", "name"]);
    expect(JSON.stringify(rows.cms)).not.toContain("fire Bob");
  });

  /* L-5: the bindings map itself went out verbatim, so a binding on a HIDDEN
     page still told an anonymous visitor its collection id and field slug.
     Only bindings on the delivered pages' elements ship. */
  it("ships only the bindings on the delivered pages' elements", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", projectCmsBindings: bindings, sitePages: [visible, hidden] } as never);
    vi.mocked(prisma.cmsCollection.findMany).mockResolvedValue([] as never);

    const rows = await getShareDraftRows("s1");

    expect(rows.site.projectCmsBindings).toEqual({ field: { t2: bindings.field.t2 }, collection: bindings.collection });
    expect(JSON.stringify(rows)).not.toContain("secret");
  });

  it("queries no CMS at all for a site without bindings", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", projectCmsBindings: null, sitePages: [] } as never);
    vi.mocked(prisma.cmsCollection.findMany).mockClear();
    const rows = await getShareDraftRows("s1");
    expect(prisma.cmsCollection.findMany).not.toHaveBeenCalled();
    expect(rows.cms).toEqual({ collections: [], entries: [] });
  });
});
