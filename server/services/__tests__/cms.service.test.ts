/**
 * CMS persistence service (E7). Verifies site-scoped collection upsert (create vs
 * update via id + IDOR guard), the entry cross-site guard (an entry op confirms
 * its collection is in the site), and create-vs-update routing for entries.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const colFindMany = vi.fn();
const colFindFirst = vi.fn();
const colFindUnique = vi.fn();
const colCreate = vi.fn();
const colUpsert = vi.fn();
const colDelete = vi.fn();
const entFindMany = vi.fn();
const entFindFirst = vi.fn();
const entFindUnique = vi.fn();
const entCreate = vi.fn();
const entUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cmsCollection: {
      findMany: (...a: unknown[]) => colFindMany(...a),
      findFirst: (...a: unknown[]) => colFindFirst(...a),
      findUnique: (...a: unknown[]) => colFindUnique(...a),
      create: (...a: unknown[]) => colCreate(...a),
      upsert: (...a: unknown[]) => colUpsert(...a),
      delete: (...a: unknown[]) => colDelete(...a),
    },
    cmsEntry: {
      findMany: (...a: unknown[]) => entFindMany(...a),
      findFirst: (...a: unknown[]) => entFindFirst(...a),
      findUnique: (...a: unknown[]) => entFindUnique(...a),
      create: (...a: unknown[]) => entCreate(...a),
      upsert: (...a: unknown[]) => entUpsert(...a),
    },
  },
}));

import {
  listCollections,
  upsertCollection,
  listEntries,
  upsertEntry,
  resolveDynamicPages,
  generateDynamicPages,
  appendDynamicPagesToPublish,
  findStaleTemplateBindings,
  previewCsvImport,
  importCsvEntries,
  CmsError,
} from "@server/services/cms.service";

beforeEach(() => {
  [colFindMany, colFindFirst, colFindUnique, colCreate, colUpsert, colDelete, entFindMany, entFindFirst, entFindUnique, entCreate, entUpsert].forEach(
    (m) => m.mockReset(),
  );
});

describe("collections", () => {
  it("list flattens _count.entries into entryCount, scoped to the site", async () => {
    colFindMany.mockResolvedValueOnce([{ id: "c1", name: "Posts", _count: { entries: 4 } }]);
    const out = await listCollections("s1");
    expect(out[0]).toMatchObject({ id: "c1", entryCount: 4 });
    expect(colFindMany.mock.calls[0][0].where).toEqual({ siteId: "s1" });
  });

  it("upsert creates when no id", async () => {
    colCreate.mockResolvedValueOnce({ id: "c2" });
    await upsertCollection("s1", { siteId: "s1", name: "Posts", slug: "posts", fields: [] });
    expect(colCreate.mock.calls[0][0].data).toMatchObject({ siteId: "s1", name: "Posts", slug: "posts" });
  });

  it("upsert with id refuses a collection already owned by another site (no write)", async () => {
    colFindUnique.mockResolvedValueOnce({ siteId: "other-site" });
    await expect(
      upsertCollection("s1", { id: "x", siteId: "s1", name: "x", slug: "x", fields: [] }),
    ).rejects.toBeInstanceOf(CmsError);
    expect(colUpsert).not.toHaveBeenCalled();
  });

  it("upsert with id creates-if-missing (engine id → DB id on first sync)", async () => {
    colFindUnique.mockResolvedValueOnce(null);
    colUpsert.mockResolvedValueOnce({ id: "eng-1" });
    await upsertCollection("s1", { id: "eng-1", siteId: "s1", name: "Posts", slug: "posts", fields: [] });
    expect(colUpsert.mock.calls[0][0]).toMatchObject({
      where: { id: "eng-1" },
      create: expect.objectContaining({ id: "eng-1", siteId: "s1" }),
    });
  });
});

describe("entries cross-site guard", () => {
  it("listEntries refuses a collection not in the site", async () => {
    colFindFirst.mockResolvedValueOnce(null);
    await expect(listEntries("s1", "other-col")).rejects.toBeInstanceOf(CmsError);
    expect(entFindMany).not.toHaveBeenCalled();
  });

  it("upsertEntry creates after confirming the collection is in the site", async () => {
    colFindFirst.mockResolvedValueOnce({ id: "c1" }); // assertCollectionInSite
    entCreate.mockResolvedValueOnce({ id: "e1" });
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", data: { title: "Hi" } });
    expect(entCreate.mock.calls[0][0].data).toMatchObject({ collectionId: "c1" });
  });

  it("upsertEntry with id refuses an entry already under another site", async () => {
    colFindFirst.mockResolvedValueOnce({ id: "c1" }); // target collection in site
    entFindUnique.mockResolvedValueOnce({ collection: { siteId: "other-site" } });
    await expect(
      upsertEntry("s1", { id: "e-x", siteId: "s1", collectionId: "c1", data: {} }),
    ).rejects.toBeInstanceOf(CmsError);
    expect(entUpsert).not.toHaveBeenCalled();
  });

  it("upsertEntry strips markup out of string field values before writing (audit S-1 class)", async () => {
    colFindFirst.mockResolvedValueOnce({ id: "c1" });
    entCreate.mockResolvedValueOnce({ id: "e1" });
    await upsertEntry("s1", {
      siteId: "s1",
      collectionId: "c1",
      data: { title: '<script>alert(1)</script>Hi', price: 12, ok: true },
    });
    expect(entCreate.mock.calls[0][0].data.data).toEqual({ title: "Hi", price: 12, ok: true });
  });
});

describe("CSV import (fix-all round, 2026-09-25)", () => {
  const FIELDS = [
    { id: "f1", name: "Name", slug: "name" },
    { id: "f2", name: "Price", slug: "price" },
  ];

  describe("previewCsvImport", () => {
    it("parses headers + sample rows and suggests a mapping by slug/name (case-insensitive)", async () => {
      colFindFirst.mockResolvedValueOnce({ fields: FIELDS });
      const csv = "Name,Price\nMargherita,12\nDiavola,14";
      const out = await previewCsvImport("s1", "c1", csv);
      expect(out.headers).toEqual(["Name", "Price"]);
      expect(out.totalRows).toBe(2);
      expect(out.suggestedMapping).toEqual({ name: "Name", price: "Price" });
      expect(out.sampleRows).toEqual([
        { Name: "Margherita", Price: "12" },
        { Name: "Diavola", Price: "14" },
      ]);
    });

    it("throws NOT_FOUND for a collection outside the site", async () => {
      colFindFirst.mockResolvedValueOnce(null);
      await expect(previewCsvImport("s1", "nope", "a\n1")).rejects.toBeInstanceOf(CmsError);
    });

    it("rejects a file with a header row but no data", async () => {
      colFindFirst.mockResolvedValueOnce({ fields: FIELDS });
      await expect(previewCsvImport("s1", "c1", "Name,Price")).rejects.toThrow(/no data/);
    });

    it("rejects a file over the row cap", async () => {
      colFindFirst.mockResolvedValueOnce({ fields: FIELDS });
      const rows = Array.from({ length: 501 }, (_, i) => `Item ${i}`);
      const csv = ["Name", ...rows].join("\n");
      await expect(previewCsvImport("s1", "c1", csv)).rejects.toThrow(/limit is 500/);
    });
  });

  describe("importCsvEntries", () => {
    it("creates one entry per row through upsertEntry, mapped by the given column mapping", async () => {
      colFindFirst.mockResolvedValue({ id: "c1" });
      entCreate.mockResolvedValue({ id: "e1" });
      const csv = "Name,Price\nMargherita,12\nDiavola,14";
      const out = await importCsvEntries("s1", "c1", csv, { name: "Name", price: "Price" });
      expect(out).toEqual({ imported: 2, total: 2, errors: [] });
      expect(entCreate).toHaveBeenCalledTimes(2);
      expect(entCreate.mock.calls[0][0].data).toMatchObject({ collectionId: "c1", data: { name: "Margherita", price: "12" } });
    });

    it("reports a row with no mapped value as a per-row error without failing the rest", async () => {
      colFindFirst.mockResolvedValue({ id: "c1" });
      entCreate.mockResolvedValue({ id: "e1" });
      const csv = "Name,Price\nMargherita,12\n,";
      const out = await importCsvEntries("s1", "c1", csv, { name: "Name", price: "Price" });
      expect(out.imported).toBe(1);
      expect(out.total).toBe(2);
      expect(out.errors).toEqual([{ row: 2, message: "No mapped column had a value" }]);
    });

    it("skips a mapping whose header the file doesn't have", async () => {
      colFindFirst.mockResolvedValue({ id: "c1" });
      entCreate.mockResolvedValue({ id: "e1" });
      const csv = "Name\nMargherita";
      const out = await importCsvEntries("s1", "c1", csv, { name: "Name", price: "Price (not in file)" });
      expect(out.imported).toBe(1);
      expect(entCreate.mock.calls[0][0].data.data).toEqual({ name: "Margherita" });
    });

    it("throws NOT_FOUND up front for a collection outside the site, before writing anything", async () => {
      colFindFirst.mockResolvedValueOnce(null);
      await expect(importCsvEntries("s1", "nope", "a\n1", {})).rejects.toBeInstanceOf(CmsError);
      expect(entCreate).not.toHaveBeenCalled();
    });
  });
});

describe("resolveDynamicPages", () => {
  it("returns [] for a collection that doesn't generate pages", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: null, pageSeoTitle: null, pageSeoDescription: null });
    await expect(resolveDynamicPages("s1", "c1")).resolves.toEqual([]);
    expect(entFindMany).not.toHaveBeenCalled();
  });

  it("resolves slug (slugified) + pattern SEO per published entry", async () => {
    colFindFirst.mockResolvedValueOnce({
      pageSlugPattern: "/blog/{title}",
      pageSeoTitle: "{title} — Acme Blog",
      pageSeoDescription: "Read about {title}.",
    });
    entFindMany.mockResolvedValueOnce([
      { id: "e1", data: { title: "Hello World" } },
      { id: "e2", data: { title: "Ship It!" } },
    ]);
    const pages = await resolveDynamicPages("s1", "c1");
    expect(pages).toEqual([
      { entryId: "e1", slug: "/blog/hello-world", seoTitle: "Hello World — Acme Blog", seoDescription: "Read about Hello World." },
      { entryId: "e2", slug: "/blog/ship-it", seoTitle: "Ship It! — Acme Blog", seoDescription: "Read about Ship It!." },
    ]);
    // only PUBLISHED entries are turned into pages
    expect(entFindMany.mock.calls[0][0].where).toMatchObject({ collectionId: "c1", status: "PUBLISHED" });
  });

  it("throws NOT_FOUND for a collection outside the site", async () => {
    colFindFirst.mockResolvedValueOnce(null);
    await expect(resolveDynamicPages("s1", "nope")).rejects.toBeInstanceOf(CmsError);
  });
});

describe("generateDynamicPages", () => {
  it("renders one HTML file per published entry, substituting + escaping + injecting SEO at the slug", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/blog/{title}", pageSeoTitle: "{title}", pageSeoDescription: "desc {title}" });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { title: "Hello & World" } }]);
    const out = await generateDynamicPages("s1", "c1", "<html><head></head><body><h1>{title}</h1></body></html>");
    expect(out).toHaveLength(1);
    expect(out[0].path).toBe("blog/hello-world/index.html");
    expect(out[0].content).toContain("<h1>Hello &amp; World</h1>"); // substituted + escaped
    expect(out[0].content).toContain("<title>Hello &amp; World</title>"); // SEO injected into <head>
    expect(out[0].content).toContain('content="desc Hello &amp; World"');
  });

  it("returns [] for a non-page collection", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: null });
    await expect(generateDynamicPages("s1", "c1", "<html></html>")).resolves.toEqual([]);
  });
});

describe("generateDynamicPages — dangerous-scheme sink defence (controller review round 1)", () => {
  const TEMPLATE = '<html><head></head><body><a href="{link}">Go</a></body></html>';

  it("neutralizes a javascript: value substituted into an href — the published HTML carries no javascript: href", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{link}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "javascript:alert(1)" } }]);
    const out = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(out[0].content).not.toContain("javascript:");
    expect(out[0].content).toContain('<a href="">Go</a>');
  });

  it("catches a scheme hidden behind control characters (java\\tscript:)", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{link}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "java\tscript:alert(1)" } }]);
    const out = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(out[0].content).not.toMatch(/href="[^"]*script:/i);
  });

  it("neutralizes vbscript: and a non-image data: URL the same way", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{link}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "vbscript:msgbox(1)" } }]);
    const vb = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(vb[0].content).toContain('href=""');

    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{link}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e2", data: { link: "data:text/html,<script>alert(1)</script>" } }]);
    const data = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(data[0].content).toContain('href=""');
  });

  it("leaves a legitimate https value, and a same-site relative path, untouched", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{n}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "https://example.com/menu", n: "x" } }]);
    const out = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(out[0].content).toContain('href="https://example.com/menu"');
  });

  it("still allows a safe data:image URL (e.g. an inline-encoded image src)", async () => {
    const imgTemplate = '<html><head></head><body><img src="{photo}"></body></html>';
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{n}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { photo: "data:image/png;base64,AAAA", n: "x" } }]);
    const out = await generateDynamicPages("s1", "c1", imgTemplate);
    expect(out[0].content).toContain('src="data:image/png;base64,AAAA"');
  });

  it("end to end: a javascript: value that entered through CSV import never reaches a published href", async () => {
    // importCsvEntries → upsertEntry (write path) → generateDynamicPages (publish-time read + substitution sink).
    colFindFirst.mockResolvedValue({ id: "c1", fields: [{ id: "f1", name: "Link", slug: "link" }] });
    entCreate.mockResolvedValueOnce({ id: "e1" });
    const importResult = await importCsvEntries("s1", "c1", "Link\njavascript:alert(1)", { link: "Link" });
    expect(importResult.imported).toBe(1);
    const storedData = entCreate.mock.calls[0][0].data.data as Record<string, unknown>;
    // sanitizeEntryData (write-time) leaves plain text alone — no tags to strip.
    expect(storedData.link).toBe("javascript:alert(1)");

    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{link}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: storedData }]);
    const pages = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(pages[0].content).not.toContain("javascript:");
  });
});

describe("appendDynamicPagesToPublish", () => {
  it("is a no-op when the site has no page-generating collection", async () => {
    colFindMany.mockResolvedValueOnce([]);
    const pages = [{ path: "index.html", html: "<html></html>" }];
    await expect(appendDynamicPagesToPublish("s1", pages)).resolves.toBe(pages);
  });

  it("appends one generated page per entry, rendered from the matching template", async () => {
    colFindMany.mockResolvedValueOnce([{ id: "c1", pageTemplatePath: "blog/_t/index.html" }]);
    // generateDynamicPages internals:
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/blog/{title}", pageSeoTitle: "{title}", pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { title: "Hello World" } }]);
    const pages = [
      { path: "index.html", html: "<html></html>" },
      { path: "blog/_t/index.html", html: "<html><head></head><body>{title}</body></html>" },
    ];
    const out = await appendDynamicPagesToPublish("s1", pages);
    expect(out).toHaveLength(3); // 2 original + 1 generated
    expect(out[2]).toMatchObject({ path: "blog/hello-world/index.html" });
    expect(out[2].html).toContain("<body>Hello World</body>");
  });

  it("A-17: skips (never throws) and logs when the bound template page is not in this publish", async () => {
    colFindMany.mockResolvedValueOnce([{ id: "c1", pageTemplatePath: "missing.html" }]);
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const pages = [{ path: "index.html", html: "<html></html>" }];
    await expect(appendDynamicPagesToPublish("s1", pages)).resolves.toEqual(pages);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe("generateDynamicPages — A-17 title dedupe + script/style-safe substitution", () => {
  it("removes the template's own <title> and meta description before injecting the generated ones", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/blog/{title}", pageSeoTitle: "{title}", pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { title: "Hello" } }]);
    const template =
      '<html><head><title>Old Title</title><meta name="description" content="old desc"></head><body>{title}</body></html>';
    const out = await generateDynamicPages("s1", "c1", template);
    const titleCount = (out[0].content.match(/<title>/g) ?? []).length;
    expect(titleCount).toBe(1);
    expect(out[0].content).toContain("<title>Hello</title>");
    expect(out[0].content).not.toContain("Old Title");
    expect(out[0].content).not.toContain("old desc");
  });

  it("does not substitute {placeholder}-shaped text inside <script> or <style>", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/blog/{title}", pageSeoTitle: "{title}", pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { title: "Hello" } }]);
    const template =
      "<html><head></head><body><h1>{title}</h1>" +
      "<style>.x { content: '{title}'; }</style>" +
      "<script>const t = '{title}';</script>" +
      "</body></html>";
    const out = await generateDynamicPages("s1", "c1", template);
    expect(out[0].content).toContain("<h1>Hello</h1>"); // substituted outside script/style
    expect(out[0].content).toContain("content: '{title}'"); // untouched inside <style>
    expect(out[0].content).toContain("const t = '{title}'"); // untouched inside <script>
  });
});

describe("findStaleTemplateBindings (A-17)", () => {
  it("reports hasPageGeneratingCollections: false when the site has no page-generating collection", async () => {
    colFindMany.mockResolvedValueOnce([]);
    await expect(findStaleTemplateBindings("s1", [{ slug: "home", isHomePage: true }])).resolves.toEqual({
      hasPageGeneratingCollections: false,
      stale: [],
    });
  });

  it("flags a collection whose template page filename matches no current page", async () => {
    colFindMany.mockResolvedValueOnce([{ id: "c1", name: "Blog", pageTemplatePath: "deleted-page.html" }]);
    const out = await findStaleTemplateBindings("s1", [
      { slug: "home", isHomePage: true },
      { slug: "about", isHomePage: false },
    ]);
    expect(out).toEqual({
      hasPageGeneratingCollections: true,
      stale: [{ collectionId: "c1", collectionName: "Blog", templatePath: "deleted-page.html" }],
    });
  });

  it("does not flag a collection whose template page still exists (slug.html, or index.html for home)", async () => {
    colFindMany.mockResolvedValueOnce([
      { id: "c1", name: "Blog", pageTemplatePath: "about.html" },
      { id: "c2", name: "Landing", pageTemplatePath: "index.html" },
    ]);
    const out = await findStaleTemplateBindings("s1", [
      { slug: "home", isHomePage: true },
      { slug: "about", isHomePage: false },
    ]);
    expect(out).toEqual({ hasPageGeneratingCollections: true, stale: [] });
  });
});
