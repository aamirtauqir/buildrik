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

  it("x4: stores text as typed — no entity encoding, stable across saves, escaped once at the page sink", async () => {
    // `&` round-trips exactly; a literal `<`/`>` does not — stripMarkup's
    // fail-closed backstop removes any leftover angle bracket from the
    // converged result (see stripMarkup's doc comment), since a fixed point
    // that still contains one cannot be told apart from unparsed markup.
    const typed = { title: "Tom & Jerry 3", quote: 'Say "hi"  bye', literal: "AT&amp;T" };
    colFindFirst.mockResolvedValue({ id: "c1" });
    entCreate.mockResolvedValue({ id: "e1" });
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", data: { title: "Tom & Jerry <3", quote: 'Say "hi" > bye', literal: "AT&amp;T" } });
    const first = entCreate.mock.calls[0][0].data.data as Record<string, unknown>;
    expect(first).toEqual(typed);
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", data: first }); // a second save of what came back
    expect(entCreate.mock.calls[1][0].data.data).toEqual(typed);
    colFindFirst.mockReset();

    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/x", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: first }]);
    const page = await generateDynamicPages("s1", "c1", "<html><head></head><body><h1>{title}</h1></body></html>");
    expect(page[0].content).toContain("<h1>Tom &amp; Jerry 3</h1>");
  });

  it("x4: stored text never re-forms markup when a tag is cut out of the middle of one", async () => {
    colFindFirst.mockResolvedValueOnce({ id: "c1" });
    entCreate.mockResolvedValueOnce({ id: "e1" });
    const nested = "<<img src=x onerror=alert(1)>img src=x onerror=alert(1)>";
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", data: { title: nested } });
    const stored = (entCreate.mock.calls[0][0].data.data as { title: string }).title;
    expect(stored).not.toMatch(/<img/i);
  });

  it("stripMarkup has no fixed pass limit — a payload nested past any small cap still loses its markup", async () => {
    // A fixed N-pass cap fails OPEN: build a payload that still has live
    // markup after N passes by re-wrapping the tag N times over.
    let payload = "<img src=x onerror=alert(1)>";
    for (let i = 0; i < 10; i++) payload = payload.replace(/</g, "<<i>");
    colFindFirst.mockResolvedValueOnce({ id: "c1" });
    entCreate.mockResolvedValueOnce({ id: "e1" });
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", data: { title: payload } });
    const stored = (entCreate.mock.calls[0][0].data.data as { title: string }).title;
    expect(stored).not.toMatch(/<img/i);
  });
});

describe("CSV import", () => {
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

    it("rejects a file over the column cap", async () => {
      colFindFirst.mockResolvedValueOnce({ fields: FIELDS });
      const headers = Array.from({ length: 101 }, (_, i) => `Col${i}`).join(",");
      const csv = `${headers}\n${Array.from({ length: 101 }, () => "x").join(",")}`;
      await expect(previewCsvImport("s1", "c1", csv)).rejects.toThrow(/limit is 100/);
    });

    it("rejects a file with a cell over the per-cell length cap", async () => {
      colFindFirst.mockResolvedValueOnce({ fields: FIELDS });
      const csv = `Name,Price\n${"a".repeat(5001)},12`;
      await expect(previewCsvImport("s1", "c1", csv)).rejects.toThrow(/longer than 5000 characters/);
    });

    it("rejects a file whose HEADER cell is over the per-cell length cap, not only data cells", async () => {
      colFindFirst.mockResolvedValueOnce({ fields: FIELDS });
      const csv = `${"a".repeat(5001)},Price\nMargherita,12`;
      await expect(previewCsvImport("s1", "c1", csv)).rejects.toThrow(/longer than 5000 characters/);
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

describe("generateDynamicPages — dangerous-scheme sink defence", () => {
  const TEMPLATE = '<html><head></head><body><a href="{link}">Go</a></body></html>';

  it("neutralizes a javascript: value substituted into an href — the published HTML carries no javascript: href", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{link}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "javascript:alert(1)" } }]);
    const out = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(out[0].content).not.toContain("javascript:");
    expect(out[0].content).toContain("<a>Go</a>"); // the attribute is removed, the link text kept
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
    expect(vb[0].content).toContain("<a>Go</a>");

    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{link}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e2", data: { link: "data:text/html,<script>alert(1)</script>" } }]);
    const data = await generateDynamicPages("s1", "c1", TEMPLATE);
    expect(data[0].content).toContain("<a>Go</a>");
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

describe("generateDynamicPages — the four live bypass shapes of the earlier regex detector", () => {
  it("bypass 1 — unquoted href attribute", async () => {
    const template = '<html><head></head><body><a href={link}>Go</a></body></html>';
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{n}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "javascript:alert(1)", n: "x" } }]);
    const out = await generateDynamicPages("s1", "c1", template);
    expect(out[0].content).not.toMatch(/javascript:/i);
  });

  it("bypass 2 — a dangerous URL in a later (non-first) srcset candidate", async () => {
    const template = '<html><head></head><body><img srcset="{safe} 1x, {unsafe} 2x"></body></html>';
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{n}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { safe: "/safe.jpg", unsafe: "javascript:alert(1)", n: "x" } }]);
    const out = await generateDynamicPages("s1", "c1", template);
    expect(out[0].content).not.toMatch(/javascript:/i);
    expect(out[0].content).toContain("/safe.jpg"); // the safe candidate survives — the whole attribute isn't blanked
  });

  it("bypass 3 — style attribute background: url() with a dangerous scheme", async () => {
    const template = '<html><head></head><body><div style="background:url({link})">x</div></body></html>';
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{n}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "javascript:alert(1)", n: "x" } }]);
    const out = await generateDynamicPages("s1", "c1", template);
    expect(out[0].content).not.toMatch(/javascript:/i);
  });

  it("bypass 4 — uppercase HREF attribute name", async () => {
    const template = '<html><head></head><body><a HREF="{link}">Go</a></body></html>';
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{n}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { link: "javascript:alert(1)", n: "x" } }]);
    const out = await generateDynamicPages("s1", "c1", template);
    expect(out[0].content).not.toMatch(/javascript:/i);
  });
});

describe("generateDynamicPages — legitimate template markup survives the parser-based sink", () => {
  // No literal "stock/seeded template" fixture set exists in this repo for
  // CMS dynamic pages (checked: packages/editor/src/templates/ holds
  // SaveTemplate.tsx, not page markup). This is representative of what
  // ExportEngine actually emits for a real page (verified against
  // ExportEngine.ts: DOCTYPE + <html lang>, every attribute quoted, `<style>`
  // for embedded CSS) — ranging over the element kinds a CMS template page
  // plausibly contains: nav links, an image with srcset, a form with
  // formaction, an SVG icon (`<use xlink:href>`), an external link with
  // target/rel, an inline style with url(), and an entity in text content.
  // `<title>`/meta-description are deliberately left out of the fixture —
  // `stripExistingSeoTags` + the SEO-tag injection this function already
  // does to those two (A17, tested elsewhere) would make a byte-equality
  // assertion about THIS test's subject — the sanitizer — fight an unrelated
  // transform, so asserted per-element below instead.
  const CLEAN_TEMPLATE =
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>.hero{color:red}</style></head>' +
    '<body class="page"><header><nav><a href="/about">About</a><a href="https://x.com/site" target="_blank" rel="noopener">X</a></nav></header>' +
    '<main><section class="hero"><h1>{title}</h1><img src="/hero.jpg" srcset="/hero.jpg 1x, /hero@2x.jpg 2x" alt="Hero" loading="lazy">' +
    '<svg class="icon"><use xlink:href="#arrow"></use></svg>' +
    '<form action="/subscribe"><input type="email" name="email" required=""><button formaction="/subscribe/alt" type="submit">Go</button></form>' +
    '<div style="background:url(/bg.jpg);color:#111">content</div></section></main>' +
    "<footer>&copy; 2026</footer></body></html>";

  it("clean, non-dangerous data leaves every real-world element/attribute shape untouched", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/p/{title}", pageSeoTitle: null, pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { title: "Welcome" } }]);
    const html = (await generateDynamicPages("s1", "c1", CLEAN_TEMPLATE))[0].content;

    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<style>.hero{color:red}</style>");
    expect(html).toContain('<h1>Welcome</h1>'); // {title} substituted
    expect(html).toContain('<a href="/about">About</a>');
    expect(html).toContain('<a href="https://x.com/site" target="_blank" rel="noopener">X</a>');
    expect(html).toContain('<img src="/hero.jpg" srcset="/hero.jpg 1x, /hero@2x.jpg 2x" alt="Hero" loading="lazy">');
    expect(html).toContain('<use xlink:href="#arrow">'); // SVG icon survives (a hook-immune tag/attr in a naive allow-list)
    expect(html).toContain('<form action="/subscribe">');
    expect(html).toContain('<input type="email" name="email" required="">');
    expect(html).toContain('formaction="/subscribe/alt"'); // formaction survives on a real <input>/<button>, not just named-and-checked
    expect(html).toContain('style="background:url(/bg.jpg);color:#111"'); // a SAFE style url() is untouched
    // x4: a clean page is not re-serialized at all — the only
    // differences from the template are the substitution and the SEO title.
    expect(html).toBe(CLEAN_TEMPLATE.replace("{title}", "Welcome").replace("</head>", "<title></title></head>"));
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

  /* A literal "</head>" inside global CSS (a content value or comment) is not
     escaped by escapeStyleText (only "</style" is) — it reaches this HTML
     verbatim, before the real closing tag. Injection must land at the real
     </head>, not inside the <style> block. */
  it("injects SEO tags before the REAL </head>, not one embedded in template CSS", async () => {
    colFindFirst.mockResolvedValueOnce({ pageSlugPattern: "/blog/{title}", pageSeoTitle: "{title}", pageSeoDescription: null });
    entFindMany.mockResolvedValueOnce([{ id: "e1", data: { title: "Hello" } }]);
    const template =
      '<html><head><style>.x::before{content:"</head>"}</style></head>' +
      "<body><h1>{title}</h1></body></html>";
    const out = await generateDynamicPages("s1", "c1", template);
    const styleEnd = out[0].content.indexOf("</style>") + "</style>".length;
    const bodyStart = out[0].content.indexOf("<body>");
    expect(out[0].content.slice(styleEnd, bodyStart)).toContain("<title>Hello</title>");
    expect(out[0].content.slice(0, styleEnd)).not.toContain("<title>Hello</title>");
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
