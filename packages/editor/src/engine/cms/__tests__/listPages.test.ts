/**
 * B-30 (engine-list-query.md §Pages / §When empty; 2L9 B5-D78, D80, D81):
 * a split list renders page k of its Show-sized pages and fills its pager;
 * the "No items" block is never repeated and shows only when nothing is
 * left; "Hide list" drops an empty list; the server's per-page pass decides
 * the same for a deferred list.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { RepeaterRenderer } from "../RepeaterRenderer";
import type { CMSCollectionBinding } from "../CMSBindingManager";
import type { Composer } from "@/engine/Composer";
import type { CMSContentItem, CMSQueryOptions, CMSQueryResult } from "@/shared/types/cms";
import { paginatedFileName, paginatedPath } from "@/engine/export/pageFiles";
import { pageCount } from "../listPages";
import { applyRecordPass, CMS_LIST_QUERY_ATTR, CMS_LIST_ITEM_ATTR, encodeCmsJson } from "@buildrik/shared/schemas/cmsConditions";

const now = "2026-01-01T00:00:00.000Z";
const item = (id: string, name: string): CMSContentItem => ({ id, collectionId: "blog", data: { name }, status: "published", createdAt: now, updatedAt: now });
const ITEMS = Array.from({ length: 7 }, (_, i) => item(`r${i + 1}`, `Post ${i + 1}`));

function renderer(b: CMSCollectionBinding, items: CMSContentItem[] = ITEMS) {
  const queryContent = vi.fn(async (q: CMSQueryOptions): Promise<CMSQueryResult> => ({ items: q.limit ? items.slice(0, q.limit) : items, total: items.length, hasMore: false }));
  const composer = {
    cms: { bindings: { getCollectionBinding: (id: string) => (id === b.elementId ? b : null), getAllCollectionBindings: () => [b] }, collections: { queryContent } },
  } as unknown as Composer;
  return new RepeaterRenderer(composer);
}

const binding = (o: Partial<CMSCollectionBinding> = {}): CMSCollectionBinding =>
  ({ elementId: "list", collectionId: "blog", itemVar: "item", status: "published", repeat: "children", ...o });

const page = () =>
  new DOMParser().parseFromString(
    '<main><div data-buildrick-id="list"><div data-buildrick-id="card"><h3>{{item.name}}</h3></div><div data-buildrick-id="empty" data-bk-empty="true"><p>No items yet.</p></div></div>' +
      '<nav data-buildrick-id="pager" data-bk-pager="list"><a data-bk-pager-part="prev">Previous</a><span data-bk-pager-part="label">Page 1 of 1</span><a data-bk-pager-part="next">Next</a></nav></main>',
    "text/html",
  );
const titles = (doc: Document) => [...doc.querySelectorAll('[data-buildrick-id="list"] h3')].map((h) => h.textContent);
const part = (doc: Document, name: string) => doc.querySelector(`[data-bk-pager-part="${name}"]`)!;

describe("B-30 Pages", () => {
  it("file names and paths for page k", () => {
    expect(paginatedFileName("index.html", 2)).toBe("page/2.html");
    expect(paginatedFileName("blog.html", 3)).toBe("blog/page/3.html");
    expect(paginatedPath("index.html", 1)).toBe("/");
    expect(paginatedPath("blog.html", 2)).toBe("/blog/page/2");
    expect(pageCount(7, 3)).toBe(3);
    expect(pageCount(0, 3)).toBe(1);
  });

  it("export: page 2 of a split list shows records 4–6, the pager links both ways, the slot goes", async () => {
    const counts = new Map<string, number>();
    const doc = page();
    await renderer(binding({ pages: "split", limit: 3 })).expandCollectionLists(doc, { listPage: 2, pageHref: (k) => `/p${k}`, pageCounts: counts });
    expect(titles(doc)).toEqual(["Post 4", "Post 5", "Post 6"]);
    expect(counts.get("list")).toBe(3);
    expect(part(doc, "label").textContent).toBe("Page 2 of 3");
    expect(part(doc, "prev").getAttribute("href")).toBe("/p1");
    expect(part(doc, "next").getAttribute("href")).toBe("/p3");
    expect(doc.querySelector("[data-bk-empty]")).toBeNull();
  });

  it("page 1 has no Previous link (aria-disabled); the last page no Next", async () => {
    const first = page();
    await renderer(binding({ pages: "split", limit: 3 })).expandCollectionLists(first, { pageHref: (k) => `/p${k}` });
    expect(part(first, "prev").hasAttribute("href")).toBe(false);
    expect(part(first, "prev").getAttribute("aria-disabled")).toBe("true");
    const last = page();
    await renderer(binding({ pages: "split", limit: 3 })).expandCollectionLists(last, { listPage: 3, pageHref: (k) => `/p${k}` });
    expect(titles(last)).toEqual(["Post 7"]);
    expect(part(last, "next").hasAttribute("href")).toBe(false);
  });

  it("a list that is not split drops a leftover pager from the export", async () => {
    const doc = page();
    await renderer(binding({ limit: 3 })).expandCollectionLists(doc);
    expect(titles(doc)).toEqual(["Post 1", "Post 2", "Post 3"]);
    expect(doc.querySelector("[data-bk-pager]")).toBeNull();
  });
});

describe("B-30 When empty", () => {
  it("export with records: the No items block is never a copy and is removed", async () => {
    const doc = page();
    await renderer(binding()).expandCollectionLists(doc);
    expect(titles(doc)).toHaveLength(7);
    expect(doc.body.innerHTML).not.toContain("No items yet.");
  });

  it("export with none: the No items block stays (marker stripped); Hide list removes the list and its pager", async () => {
    const shown = page();
    await renderer(binding(), []).expandCollectionLists(shown);
    expect(shown.body.textContent).toContain("No items yet.");
    expect(shown.querySelector("[data-bk-empty]")).toBeNull();
    const hidden = page();
    await renderer(binding({ whenEmpty: "hide", pages: "split", limit: 3 }), []).expandCollectionLists(hidden);
    expect(hidden.querySelector('[data-buildrick-id="list"]')).toBeNull();
    expect(hidden.querySelector("[data-bk-pager]")).toBeNull();
  });

  it("canvas: with records the slot is hidden; with none it shows and the template hides", async () => {
    const full = page();
    await renderer(binding()).expandCollectionLists(full, { canvas: true });
    expect((full.querySelector('[data-buildrick-id="empty"]') as HTMLElement).style.display).toBe("none");
    const empty = page();
    await renderer(binding(), []).expandCollectionLists(empty, { canvas: true });
    expect((empty.querySelector('[data-buildrick-id="empty"]') as HTMLElement).style.display).toBe("");
    expect((empty.querySelector('[data-buildrick-id="card"]') as HTMLElement).style.display).toBe("none");
  });

  it("server pass on a deferred list: no record left → the slot stays, or the list goes on Hide list", () => {
    const html = (q: object) =>
      new DOMParser().parseFromString(
        `<div id="l" ${CMS_LIST_QUERY_ATTR}="${encodeCmsJson(q)}"><div ${CMS_LIST_ITEM_ATTR}="r1">A</div><div data-bk-empty="true">None</div></div>`,
        "text/html",
      );
    const rule = { filter: { match: "all", rules: [{ field: "x", op: "set" }] } };
    const slot = html(rule);
    applyRecordPass(slot, {});
    expect(slot.body.textContent).toBe("None");
    const gone = html({ ...rule, whenEmpty: "hide" });
    applyRecordPass(gone, {});
    expect(gone.querySelector("#l")).toBeNull();
    const kept = html({});
    applyRecordPass(kept, {});
    expect(kept.body.textContent).toBe("A");
  });
});
