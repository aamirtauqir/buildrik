// @vitest-environment jsdom
/**
 * B-11 element conditions and C-14 Collection list queries
 * (docs/design-2l9/engine-conditions.md, engine-list-query.md): the shared
 * evaluator, the binding manager's model (history, persistence, copies), and
 * the render — a hidden element is ABSENT from the export, a list respects
 * its filter, sort, skip and Show. Real CollectionManager + CMSBindingManager.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyCmsListQuery, applyRecordPass, decodeCmsCondition, evaluateCmsCondition, opsForFieldType, type CmsCondition } from "@buildrik/shared/schemas/cmsConditions";
import { filterCmsBindings } from "@buildrik/shared/schemas/sites";
import { CMSExportResolver } from "../CMSExportResolver";
import { RepeaterRenderer } from "../RepeaterRenderer";
import { CMSBindingManager } from "../CMSBindingManager";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import type { Composer } from "@/engine/Composer";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

const hidden = (field: string): CmsCondition => ({ match: "all", rules: [{ field, op: "set" }] });

describe("evaluator (shared)", () => {
  it("operators per type, dotted paths, all / any", () => {
    const rec = { title: "Hi", price: 12, open: true, tags: ["a", "b"], hours: { sunday: null, monday: "9–17" }, date: "2026-10-20" };
    expect(evaluateCmsCondition(hidden("hours.monday"), rec)).toBe(true);
    expect(evaluateCmsCondition(hidden("hours.sunday"), rec)).toBe(false);
    expect(evaluateCmsCondition({ match: "all", rules: [{ field: "price", op: "gt", value: "10" }, { field: "open", op: "on" }] }, rec)).toBe(true);
    expect(evaluateCmsCondition({ match: "all", rules: [{ field: "price", op: "gt", value: "20" }, { field: "open", op: "on" }] }, rec)).toBe(false);
    expect(evaluateCmsCondition({ match: "any", rules: [{ field: "price", op: "gt", value: "20" }, { field: "open", op: "on" }] }, rec)).toBe(true);
    expect(evaluateCmsCondition({ match: "all", rules: [{ field: "tags", op: "includes", value: "B" }] }, rec)).toBe(true);
    expect(evaluateCmsCondition({ match: "all", rules: [{ field: "date", op: "before", value: "2026-11-01" }] }, rec)).toBe(true);
    expect(evaluateCmsCondition({ match: "all", rules: [{ field: "title", op: "is", value: "@page.cat" }] }, rec, { cat: "hi" })).toBe(true);
    expect(opsForFieldType("boolean")).toEqual(["on", "off"]);
  });

  it("list query: filter → sort (empties last) → skip → Show", () => {
    const rows = [
      { data: { n: "c", p: 3 } },
      { data: { n: "a", p: 1 } },
      { data: { n: "d" } },
      { data: { n: "b", p: 2 } },
    ];
    const names = (r: Array<{ data: Record<string, unknown> }>) => r.map((x) => x.data.n);
    expect(names(applyCmsListQuery(rows, { sort: [{ field: "p", dir: "asc" }] }))).toEqual(["a", "b", "c", "d"]);
    expect(names(applyCmsListQuery(rows, { sort: [{ field: "p", dir: "desc" }] }))).toEqual(["c", "b", "a", "d"]);
    expect(names(applyCmsListQuery(rows, { filter: hidden("p"), sort: [{ field: "n", dir: "asc" }], skip: 1, limit: 1 }))).toEqual(["b"]);
  });

  it("the save filter keeps well-formed conditions and queries, drops the rest", () => {
    const kept = filterCmsBindings({
      conditions: { h1: hidden("title"), bad: { match: "all", rules: [] } },
      collection: { list: { elementId: "list", collectionId: "c", itemVar: "item", filter: hidden("x"), sort: [{ field: "x", dir: "asc" }], skip: 2 } },
    });
    expect(Object.keys(kept?.conditions ?? {})).toEqual(["h1"]);
    expect(kept?.collection?.list.skip).toBe(2);
    expect(kept?.collection?.list.filter).toEqual(hidden("x"));
  });
});

async function setup(opts: { template?: boolean } = {}) {
  const cms = new CollectionManager();
  const record = vi.fn();
  const elements: Record<string, { isLocked: () => boolean }> = {};
  const composer = {
    data: { on: vi.fn(), off: vi.fn() },
    markDirty: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    history: { record, flushPending: vi.fn(), noteUnrecordedAction: vi.fn() },
    elements: { getElement: (id: string) => elements[id] ?? { isLocked: () => false }, getActivePage: () => undefined, getAllPages: () => [] },
  } as unknown as Composer;
  const bindings = new CMSBindingManager(composer, cms);
  (composer as unknown as { cms: unknown }).cms = { bindings, collections: cms };
  const blog = await cms.createCollection("Blog");
  if (opts.template) await cms.updateCollection(blog.id, { pageTemplatePath: "post.html" } as never);
  const rows: Array<[string, number | null, string | null]> = [
    ["Alpha", 3, "Sun"],
    ["Bravo", 1, null],
    ["Charlie", 2, "Sat"],
  ];
  for (const [name, rank, sunday] of rows) {
    const rec = (await cms.createContentItem(blog.id, { name, rank, sunday }))!;
    await cms.updateContentItem(rec.id, { status: "published" });
  }
  return { composer, bindings, blogId: blog.id, record, elements };
}

const LIST =
  '<div data-buildrick-id="list"><div data-buildrick-id="card"><h3 data-buildrick-id="t">{{item.name}}</h3><p data-buildrick-id="sun">Open Sundays</p></div></div>';

describe("model (CMSBindingManager)", () => {
  it("setCondition is one recorded step, exports with the project, imports back, and a lock refuses it", async () => {
    const { bindings, record, elements } = await setup();
    expect(bindings.setCondition("h1", hidden("sunday"), "Add visibility condition")).toBe(true);
    expect(record).toHaveBeenCalledWith("Add visibility condition");
    expect(bindings.exportConditions()).toEqual({ h1: hidden("sunday") });
    bindings.importConditions({});
    expect(bindings.getCondition("h1")).toBeNull();
    bindings.importConditions({ h1: hidden("sunday") });
    expect(bindings.getCondition("h1")).toEqual(hidden("sunday"));
    elements.h2 = { isLocked: () => true };
    expect(bindings.setCondition("h2", hidden("sunday"), "Add visibility condition")).toBe(false);
    expect(bindings.setCondition("h1", null, "Remove visibility condition")).toBe(true);
    expect(bindings.hasConditions()).toBe(false);
  });

  it("a duplicated tree carries its conditions", async () => {
    const { bindings } = await setup();
    bindings.setCondition("a", hidden("sunday"));
    const node = (id: string, kids: Array<{ getId(): string; getChildren(): never[] }> = []) => ({ getId: () => id, getChildren: () => kids as never[] });
    bindings.copyTree(node("a"), node("b"));
    expect(bindings.getCondition("b")).toEqual(hidden("sunday"));
  });
});

describe("render", () => {
  it("export: a list copy whose condition fails has the element ABSENT", async () => {
    const { composer, bindings, blogId } = await setup();
    bindings.bindCollection("list", blogId, { repeat: "children" });
    expect(bindings.setCondition("sun", hidden("sunday"))).toBe(true);
    expect(bindings.getCondition("sun")).toEqual(hidden("sunday"));
    const html = await new CMSExportResolver(composer).resolve(LIST, { mode: "static" });
    expect(html.match(/data-buildrick-id="card"/g)).toHaveLength(3);
    expect(html.match(/Open Sundays/g)).toHaveLength(2);
    expect(html).not.toContain("data-bk-condition");
  });

  it("canvas: the failing copy keeps the element, marked hidden (ghost)", async () => {
    const { composer, bindings, blogId } = await setup();
    bindings.bindCollection("list", blogId, { repeat: "children" });
    bindings.setCondition("sun", hidden("sunday"));
    const doc = new DOMParser().parseFromString(LIST, "text/html");
    await new RepeaterRenderer(composer).expandCollectionLists(doc, { canvas: true });
    expect(doc.querySelectorAll('[data-bk-condition="hidden"]')).toHaveLength(1);
    expect(doc.querySelectorAll('[data-bk-condition="shown"]')).toHaveLength(2);
  });

  it("export: the list respects its filter, sort, skip and Show", async () => {
    const { composer, bindings, blogId } = await setup();
    bindings.bindCollection("list", blogId, { repeat: "children" });
    expect(bindings.setListQuery("list", { filter: hidden("sunday"), sort: [{ field: "rank", dir: "asc" }], limit: 1 }, "Filter list")).toBe(true);
    let html = await new CMSExportResolver(composer).resolve(LIST, { mode: "static" });
    expect([...html.matchAll(/<h3 data-buildrick-id="t">([^<]*)<\/h3>/g)].map((m) => m[1])).toEqual(["Charlie"]);
    bindings.setListQuery("list", { filter: undefined, limit: undefined, skip: 1 });
    html = await new CMSExportResolver(composer).resolve(LIST, { mode: "static" });
    expect([...html.matchAll(/<h3 data-buildrick-id="t">([^<]*)<\/h3>/g)].map((m) => m[1])).toEqual(["Charlie", "Alpha"]);
  });

  it("template page: the condition is handed to the server per record (data-bk-if); a preview evaluates it", async () => {
    const { composer, bindings } = await setup({ template: true });
    bindings.setCondition("sun", { match: "all", rules: [{ field: "sunday", op: "empty" }] });
    const PAGE = '<main data-buildrick-id="root"><p data-buildrick-id="sun">Closed Sundays</p></main>';
    const published = await new CMSExportResolver(composer).resolve(PAGE, { mode: "static", pageFile: "post.html" });
    const attr = /data-bk-if="([^"]+)"/.exec(published)?.[1];
    expect(decodeCmsCondition(attr ?? "")).toEqual({ match: "all", rules: [{ field: "sunday", op: "empty" }] });
    /* Elsewhere (a page that is not the template), nothing to read — shown as today. */
    const plain = await new CMSExportResolver(composer).resolve(PAGE, { mode: "static", pageFile: "index.html" });
    expect(plain).toContain("Closed Sundays");
    expect(plain).not.toContain("data-bk-if");
  });

  it("B-27: on a published template page an @page filter is deferred to the per-record pass, which the server runs", async () => {
    const { composer, bindings, blogId } = await setup({ template: true });
    bindings.bindCollection("list", blogId, { repeat: "children" });
    bindings.setListQuery("list", { filter: { match: "all", rules: [{ field: "sunday", op: "is", value: "@page.sunday" }] }, excludeCurrent: true });
    const html = await new CMSExportResolver(composer).resolve(LIST, { mode: "static", pageFile: "post.html" });
    expect(html).toContain("data-bk-query=");
    expect(html.match(/data-bk-item=/g)).toHaveLength(3);
    /* The server's pass for Alpha's page (sunday "Sun"): records whose sunday
       is "Sun", Alpha itself excluded → none. */
    const items = (await composer.cms.collections.queryContent({ collectionId: blogId })).items;
    const alpha = items.find((i) => i.data.name === "Alpha")!;
    const doc = new DOMParser().parseFromString(html, "text/html");
    applyRecordPass(doc, alpha.data, alpha.id);
    expect(doc.querySelectorAll('[data-buildrick-id="card"]')).toHaveLength(0);
    expect(doc.body.innerHTML).not.toMatch(/data-bk-(query|item|row)/);
  });

  it("a list copy's own condition that reads @page.* is decided per generated page (data-bk-if + data-bk-if-row)", async () => {
    const { composer, bindings, blogId } = await setup({ template: true });
    bindings.bindCollection("list", blogId, { repeat: "children" });
    bindings.setCondition("sun", { match: "all", rules: [{ field: "sunday", op: "is", value: "@page.sunday" }] });
    const html = await new CMSExportResolver(composer).resolve(LIST, { mode: "static", pageFile: "post.html" });
    expect(html.match(/data-bk-if-row=/g)).toHaveLength(3);
    const items = (await composer.cms.collections.queryContent({ collectionId: blogId })).items;
    const alpha = items.find((i) => i.data.name === "Alpha")!;
    const doc = new DOMParser().parseFromString(html, "text/html");
    applyRecordPass(doc, alpha.data, alpha.id);
    /* Alpha's page (sunday "Sun"): only the copy whose own sunday is "Sun" keeps it. */
    expect(doc.body.innerHTML.match(/Open Sundays/g)).toHaveLength(1);
    expect(doc.body.innerHTML).not.toMatch(/data-bk-if/);
  });

  it("excludeCurrent on the canvas leaves out the template page's preview record", async () => {
    const { composer, bindings, blogId } = await setup({ template: true });
    (composer.elements as unknown as Record<string, unknown>).getActivePage = () => ({ id: "p", name: "Post", slug: "post", root: { id: "root" } });
    (composer.elements as unknown as Record<string, unknown>).getAllPages = () => [{ id: "h", name: "Home", slug: "", isHome: true }, { id: "p", name: "Post", slug: "post" }];
    bindings.bindCollection("list", blogId, { repeat: "children" });
    bindings.setListQuery("list", { excludeCurrent: true });
    const doc = new DOMParser().parseFromString(LIST, "text/html");
    await new RepeaterRenderer(composer).expandCollectionLists(doc, { canvas: true, pageFile: "post.html" });
    expect(doc.querySelectorAll('[data-buildrick-id="card"]')).toHaveLength(2);
  });
});
