/**
 * B-26 / B-27: generateDynamicPages decides, per generated page and with the
 * shared evaluator the editor runs, what depends on THAT page's record —
 * `data-bk-if` elements and `data-bk-query` lists — and leaves a page that
 * carries neither byte-identical to before.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { encodeCmsCondition, encodeCmsJson } from "@buildrik/shared/schemas/cmsConditions";

const mocks = vi.hoisted(() => ({ colFindFirst: vi.fn(), entFindMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cmsCollection: { findFirst: mocks.colFindFirst },
    cmsEntry: { findMany: mocks.entFindMany },
  },
}));

import { generateDynamicPages } from "@server/services/cms.service";

const COLLECTION = { pageSlugPattern: "/blog/{slug}", pageSeoTitle: null, pageSeoDescription: null, fields: [] };
const ENTRIES = [
  { id: "e1", data: { slug: "a", title: "Alpha", sunday: "10–14", category: "design" } },
  { id: "e2", data: { slug: "b", title: "Bravo", sunday: "", category: "code" } },
];

beforeEach(() => {
  mocks.colFindFirst.mockReset().mockResolvedValue(COLLECTION);
  mocks.entFindMany.mockReset().mockResolvedValue(ENTRIES);
});

const byPath = (pages: Array<{ path: string; content: string }>) => Object.fromEntries(pages.map((p) => [p.path, p.content]));

describe("generateDynamicPages — per-record pass", () => {
  it("a page with no conditions and no list queries is byte-identical to the substitution alone", async () => {
    const template = '<!DOCTYPE html>\n<html lang="en"><head><title>x</title></head><body><h1>{{bk:title}}</h1><img src="/a.png" crossorigin><a href="/x?a=1&b=2">x</a></body></html>';
    const pages = byPath(await generateDynamicPages("s1", "c1", template));
    expect(pages["blog/a/index.html"]).toBe(
      '<!DOCTYPE html>\n<html lang="en"><head><title>x</title></head><body><h1>Alpha</h1><img src="/a.png" crossorigin><a href="/x?a=1&b=2">x</a></body></html>'.replace("<title>x</title>", "<title></title>"),
    );
  });

  it("B-26: a data-bk-if element is absent on the record its condition fails, present (attribute gone) where it holds", async () => {
    const cond = encodeCmsCondition({ match: "all", rules: [{ field: "sunday", op: "set" }] });
    const template = `<!DOCTYPE html>\n<html><head></head><body><h1>{{bk:title}}</h1><p data-bk-if="${cond}">Open Sundays</p></body></html>`;
    const pages = byPath(await generateDynamicPages("s1", "c1", template));
    expect(pages["blog/a/index.html"]).toContain("<p>Open Sundays</p>");
    expect(pages["blog/b/index.html"]).not.toContain("Open Sundays");
    for (const html of Object.values(pages)) expect(html).not.toContain("data-bk-if");
  });

  it("B-27: a list filtered by this page's field and excluding this page's record, per page; Show applies after", async () => {
    const q = encodeCmsJson({ filter: { match: "all", rules: [{ field: "category", op: "is", value: "@page.category" }] }, excludeCurrent: true, limit: 1 });
    const row = (id: string, category: string) => `<li data-bk-item="${id}" data-bk-row="${encodeCmsJson({ category })}">${id}</li>`;
    const template = `<!DOCTYPE html>\n<html><head></head><body><ul data-bk-query="${q}">${row("e1", "design")}${row("e3", "design")}${row("e4", "design")}${row("e2", "code")}</ul></body></html>`;
    const pages = byPath(await generateDynamicPages("s1", "c1", template));
    /* e1's page: design posts other than e1, Show 1 → e3. */
    expect(pages["blog/a/index.html"]).toContain("<ul><li>e3</li></ul>");
    /* e2's page: code posts other than e2 → none. */
    expect(pages["blog/b/index.html"]).toContain("<ul></ul>");
    for (const html of Object.values(pages)) expect(html).not.toMatch(/data-bk-(query|item|row)/);
  });
});
