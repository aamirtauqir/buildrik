/**
 * G3-078: an element bound to "the record on this page" (no record) exports
 * as the publish worker's {fieldSlug} token on its collection's template page
 * — the worker fills it once per published record — and as the first
 * published record's value on any other page.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("../../cms/CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("../../cms/__tests__/inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }), putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  vi.stubGlobal("fetch", vi.fn());
});

const page = (id: string, slug: string, extra: Record<string, unknown> = {}) => ({
  id, name: id, slug, ...extra,
  root: { id: `r-${id}`, type: "container" as const, tagName: "div",
    children: [
      { id: `t-${id}`, type: "heading" as const, tagName: "h1", content: "Placeholder", children: [] },
      { id: `i-${id}`, type: "image" as const, tagName: "img", attributes: { src: "placeholder.jpg" }, children: [] },
    ] },
});

describe("ExportEngine — page-record bindings", () => {
  it("writes {field} on the template page and the first record's value elsewhere", async () => {
    const composer = new Composer({} as never);
    composer.importProject({ pages: [page("home", "", { isHome: true }), page("item", "menu-item")] } as never);
    const cms = composer.cms.collections;
    await cms.initialize();
    const col = await cms.createCollection("Menu items");
    await cms.addField(col.id, { name: "Name", slug: "name", type: "text", order: 0 });
    await cms.addField(col.id, { name: "Photo", slug: "photo", type: "image", order: 1 });
    const rec = await cms.createContentItem(col.id, { name: "Margherita", photo: "m.jpg" });
    await cms.updateContentItem(rec!.id, { status: "published" });
    await cms.updateCollection(col.id, { pageSlugPattern: "/menu/{name}", pageTemplatePath: "menu-item.html" });
    for (const p of ["home", "item"]) {
      composer.cms.bindings.bindToField(`t-${p}`, col.id, undefined, "name", "content");
      composer.cms.bindings.bindToField(`i-${p}`, col.id, undefined, "photo", "src");
    }

    const { files } = await new ExportEngine(composer).exportAllPages({ format: "html" });
    const html = (n: string) => files.find((f) => f.name === n)!.content;
    expect(html("menu-item.html")).toMatch(/<h1[^>]*>\{name\}<\/h1>/);
    expect(html("menu-item.html")).toContain('src="{photo}"');
    expect(html("index.html")).toMatch(/<h1[^>]*>Margherita<\/h1>/);
    expect(html("index.html")).toContain('src="m.jpg"');
  });
});
