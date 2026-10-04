/**
 * C1 — the shared validator on the server (DM-09, CMS-07, BD-14, DM-18,
 * DM-13) and the rich-text allow-list (PD-1 / DM-10). Each case failed on the
 * service before C1: it stored whatever the editor sent.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  colFindFirst: vi.fn(), colFindUnique: vi.fn(), colCreate: vi.fn(), colUpdateMany: vi.fn(),
  entFindMany: vi.fn(), entFindUnique: vi.fn(), entCreate: vi.fn(), entUpdateMany: vi.fn(),
  siteUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { update: (...a: unknown[]) => mocks.siteUpdate(...a) },
    cmsCollection: {
      findFirst: (...a: unknown[]) => mocks.colFindFirst(...a),
      findUnique: (...a: unknown[]) => mocks.colFindUnique(...a),
      create: (...a: unknown[]) => mocks.colCreate(...a),
      updateMany: (...a: unknown[]) => mocks.colUpdateMany(...a),
    },
    cmsEntry: {
      findMany: (...a: unknown[]) => mocks.entFindMany(...a),
      findUnique: (...a: unknown[]) => mocks.entFindUnique(...a),
      create: (...a: unknown[]) => mocks.entCreate(...a),
      updateMany: (...a: unknown[]) => mocks.entUpdateMany(...a),
    },
  },
}));

import { upsertCollection, upsertEntry, CmsError } from "@server/services/cms.service";
import { translateCms } from "@server/trpc/routers/__internal__/translateCms";

const field = (slug: string, type: string, extra: Record<string, unknown> = {}) => ({ id: `f-${slug}`, name: slug[0].toUpperCase() + slug.slice(1), slug, type, order: 0, ...extra });
const FIELDS = [field("name", "text", { validation: { required: true } }), field("slug", "slug"), field("price", "number", { validation: { min: 0 } }), field("body", "richtext")];

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.siteUpdate.mockResolvedValue({});
  mocks.colFindFirst.mockResolvedValue({ deletedAt: null, fields: FIELDS, pageSlugPattern: "/menu/{slug}" });
  mocks.entFindUnique.mockResolvedValue(null);
  mocks.entFindMany.mockResolvedValue([]);
  mocks.entCreate.mockImplementation(async ({ data }: { data: unknown }) => data);
});

async function invalid(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(CmsError);
    expect((e as CmsError).code).toBe("INVALID");
    return (e as Error).message;
  }
  throw new Error("expected INVALID");
}

describe("PUBLISHED upserts meet the collection's rules (DM-09)", () => {
  it("refuses a published record missing a required field", async () => {
    const msg = await invalid(upsertEntry("s1", { siteId: "s1", collectionId: "c1", status: "PUBLISHED", data: { slug: "a" } }));
    expect(msg).toMatch(/Name is required/);
    expect(mocks.entCreate).not.toHaveBeenCalled();
  });

  it("refuses a value below the field's min and a non-number in a number field", async () => {
    expect(await invalid(upsertEntry("s1", { siteId: "s1", collectionId: "c1", status: "PUBLISHED", data: { name: "A", slug: "a", price: -1 } }))).toMatch(/at least 0/);
    expect(await invalid(upsertEntry("s1", { siteId: "s1", collectionId: "c1", status: "PUBLISHED", data: { name: "A", slug: "a", price: "abc" } }))).toMatch(/must be a number/);
  });

  it("a draft stays free-form", async () => {
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", status: "DRAFT", data: { price: "abc" } });
    expect(mocks.entCreate).toHaveBeenCalled();
  });

  it("an edit to an already-published record (no status sent) is still checked", async () => {
    mocks.entFindUnique.mockResolvedValue({ deletedAt: null, status: "PUBLISHED", collection: { siteId: "s1" } });
    expect(await invalid(upsertEntry("s1", { id: "e1", siteId: "s1", collectionId: "c1", data: { slug: "a" } }))).toMatch(/Name is required/);
  });

  it("refuses a slug another record holds (CMS-07)", async () => {
    mocks.entFindMany.mockResolvedValue([{ id: "e2", data: { name: "B", slug: "margherita" }, status: "DRAFT" }]);
    const msg = await invalid(upsertEntry("s1", { id: "e1", siteId: "s1", collectionId: "c1", status: "PUBLISHED", data: { name: "A", slug: "margherita" } }));
    expect(msg).toMatch(/already uses the Slug “margherita”/);
  });

  it("refuses a page path that comes out empty, or that another published record has (BD-14)", async () => {
    mocks.colFindFirst.mockResolvedValue({ deletedAt: null, fields: [field("name", "text")], pageSlugPattern: "/menu/{name}" });
    expect(await invalid(upsertEntry("s1", { siteId: "s1", collectionId: "c1", status: "PUBLISHED", data: { name: "!!!" } }))).toMatch(/comes out empty/);
    mocks.entFindMany.mockResolvedValue([{ id: "e2", data: { name: "Pizza Pie" }, status: "PUBLISHED" }]);
    expect(await invalid(upsertEntry("s1", { id: "e1", siteId: "s1", collectionId: "c1", status: "PUBLISHED", data: { name: "pizza  pie" } }))).toMatch(/\/menu\/pizza-pie/);
  });

  it("travels to the client as CMS_INVALID:<reason>", () => {
    expect(() => translateCms(new CmsError("INVALID", "Name is required"))).toThrow(/^CMS_INVALID:Name is required$/);
  });
});

describe("collection schema (DM-13, DM-18)", () => {
  const base = { siteId: "s1", name: "Menu", slug: "menu" };
  it("refuses two fields with one key", async () => {
    expect(await invalid(upsertCollection("s1", { ...base, fields: [field("title", "text"), field("title", "text")] }))).toMatch(/Two fields use the key title/);
  });
  it("refuses a field type the model doesn't have", async () => {
    await invalid(upsertCollection("s1", { ...base, fields: [field("title", "wysiwyg")] }));
  });
  it("refuses a URL pattern that names no field, an unknown field, or isn't a path", async () => {
    const fields = [field("slug", "slug")];
    expect(await invalid(upsertCollection("s1", { ...base, fields, pageSlugPattern: "/menu/all" }))).toMatch(/needs a field/);
    expect(await invalid(upsertCollection("s1", { ...base, fields, pageSlugPattern: "/menu/{title}" }))).toMatch(/title is not a field/);
    expect(await invalid(upsertCollection("s1", { ...base, fields, pageSlugPattern: "/menu//{slug}" }))).toMatch(/empty or dot segment/);
    expect(await invalid(upsertCollection("s1", { ...base, fields, pageSlugPattern: "/menu?x={slug}" }))).toMatch(/letters, numbers/);
  });
  it("accepts a well-formed schema and pattern", async () => {
    mocks.colCreate.mockResolvedValue({ id: "c9" });
    await upsertCollection("s1", { ...base, fields: [field("slug", "slug")], pageSlugPattern: "/menu/{slug}" });
    expect(mocks.colCreate).toHaveBeenCalled();
  });
});

describe("rich text keeps the shared allow-list (PD-1, DM-10)", () => {
  it("keeps <strong>/<a href> in a rich text field and strips scripts, handlers and javascript: links", async () => {
    await upsertEntry("s1", {
      siteId: "s1",
      collectionId: "c1",
      data: {
        body: '<p>Hi <strong>there</strong> <a href="https://x.test">ok</a> <a href="javascript:alert(1)">bad</a><img src=x onerror=alert(1)><script>alert(1)</script></p>',
        name: "<b>plain</b>",
      },
    });
    const stored = mocks.entCreate.mock.calls[0][0].data.data as { body: string; name: string };
    expect(stored.body).toContain("<strong>there</strong>");
    expect(stored.body).toContain('<a href="https://x.test">ok</a>');
    expect(stored.body).not.toMatch(/javascript:|<img|<script|onerror/i);
    expect(stored.name).toBe("plain");
  });
});

describe("unique-constraint answers (DM-07)", () => {
  const base = { siteId: "s1", name: "Blog", slug: "blog", fields: [] };
  it("a slug another live collection holds → CONFLICT SLUG_TAKEN:<its id>, not a raw 500", async () => {
    mocks.colFindUnique.mockResolvedValueOnce(null);
    mocks.colCreate.mockRejectedValueOnce(Object.assign(new Error("Unique constraint failed"), { code: "P2002", meta: { target: ["siteId", "slug"] } }));
    mocks.colFindFirst.mockResolvedValueOnce({ id: "c-server" });
    await expect(upsertCollection("s1", { ...base, id: "c-local" })).rejects.toMatchObject({ code: "CONFLICT", message: "SLUG_TAKEN:c-server" });
  });

  it("a create that raced itself on the id becomes the update of the row it lost to", async () => {
    mocks.colFindUnique
      .mockResolvedValueOnce(null) // first look: not there yet
      .mockResolvedValueOnce({ siteId: "s1", deletedAt: null }) // retry: there now
      .mockResolvedValueOnce({ id: "c1", name: "Blog" }); // returned row
    mocks.colCreate.mockRejectedValueOnce(Object.assign(new Error("Unique constraint failed"), { code: "P2002", meta: { target: ["id"] } }));
    mocks.colUpdateMany.mockResolvedValueOnce({ count: 1 });
    await expect(upsertCollection("s1", { ...base, id: "c1" })).resolves.toMatchObject({ id: "c1" });
    expect(mocks.colUpdateMany).toHaveBeenCalledTimes(1);
  });
});

describe("record pages fill rich text as markup (PD-1)", () => {
  it("a {body} token on the template takes the record's allow-listed markup; a text token stays escaped", async () => {
    const { generateDynamicPages } = await import("@server/services/cms.service");
    mocks.colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{slug}", pageSeoTitle: null, pageSeoDescription: null, fields: FIELDS });
    mocks.entFindMany.mockResolvedValueOnce([{ id: "e1", data: { slug: "a", name: "<b>Tom</b>", body: "<p>Hi <strong>there</strong><script>x</script></p>" } }]);
    const [page] = await generateDynamicPages("s1", "c1", "<html><head></head><body><h1>{name}</h1><div>{body}</div></body></html>");
    expect(page.content).toContain("<div><p>Hi <strong>there</strong></p></div>");
    expect(page.content).toContain("<h1>&lt;b&gt;Tom&lt;/b&gt;</h1>");
  });
});

describe("publish snapshot follows references (PD-1)", () => {
  it("adds the collections a bound collection's Reference fields point at", async () => {
    const { getPublishedCmsForCollections } = await import("@server/services/cms.service");
    const colFindMany = vi.fn()
      .mockResolvedValueOnce([{ id: "posts", fields: [{ slug: "author", type: "reference", referenceCollection: "team" }] }])
      .mockResolvedValueOnce([{ id: "team", fields: [] }]);
    const prismaMod = (await import("@/lib/prisma")) as unknown as { prisma: { cmsCollection: Record<string, unknown> } };
    prismaMod.prisma.cmsCollection.findMany = colFindMany;
    mocks.entFindMany.mockResolvedValue([]);
    const snap = await getPublishedCmsForCollections("s1", ["posts"]);
    expect(snap.collections.map((c) => c.id)).toEqual(["posts", "team"]);
    expect(colFindMany.mock.calls[1][0].where.id).toEqual({ in: ["team"] });
  });
});

describe("findUnboundLists (BD-06)", () => {
  it("names a Collection list bound to nothing or to a deleted collection; null without lists", async () => {
    const { findUnboundLists } = await import("@server/services/cms.service");
    const prismaMod = (await import("@/lib/prisma")) as unknown as { prisma: { cmsCollection: Record<string, unknown> } };
    prismaMod.prisma.cmsCollection.findMany = vi.fn().mockResolvedValue([{ id: "live" }]);
    const page = {
      name: "Home",
      blocks: {
        id: "root",
        children: [
          { id: "a", type: "collection-list" },
          { id: "b", type: "collection-list", data: { layerName: "Team grid" } },
          { id: "c", type: "collection-list" },
        ],
      },
    };
    const raw = { collection: { b: { elementId: "b", collectionId: "gone", itemVar: "item" }, c: { elementId: "c", collectionId: "live", itemVar: "item" } } };
    expect(await findUnboundLists("s1", [page], raw)).toEqual([
      { pageName: "Home", element: "Collection list" },
      { pageName: "Home", element: "Team grid" },
    ]);
    expect(await findUnboundLists("s1", [{ name: "Home", blocks: { id: "r", children: [] } }], raw)).toBeNull();
  });
});
