/**
 * G3-079 end to end on the real Composer: insert the Collection list block,
 * bind it to a collection, and the published page carries one card per
 * published record — while a page without a Collection list exports exactly
 * as it did before binding anything.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "@/engine/export/ExportEngine";
import { insertBlock, getBlockById } from "@/blocks/blockRegistry";
import * as Storage from "@/engine/cms/CollectionStorage";

vi.mock("@/engine/cms/CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("@/engine/cms/__tests__/inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});
beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

function project() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div",
        children: [{ id: "a1", type: "paragraph" as const, tagName: "p", content: "hi", children: [] }] } }],
  } as never);
  return composer;
}

const pageHtml = async (composer: Composer) =>
  (await new ExportEngine(composer).exportAllPages({ format: "html" })).files.find((f) => f.name === "index.html")?.content ?? "";

describe("Collection list — insert, bind, publish", () => {
  it("ships one card per published record, named by the collection's display field", async () => {
    const composer = project();
    const listId = insertBlock(composer, getBlockById("collection-list")!, "root")!;
    expect(composer.elements.getElement(listId)?.getType()).toBe("collection-list");

    const cms = composer.cms.collections;
    const menu = await cms.createCollection("Menu items");
    await cms.addField(menu.id, { name: "Dish", slug: "dish", type: "text", order: 0 });
    await cms.updateCollection(menu.id, { displayField: "dish" });
    for (const dish of ["Margherita", "Diavola"]) {
      const rec = (await cms.createContentItem(menu.id, { dish }))!;
      await cms.updateContentItem(rec.id, { status: "published" });
    }
    composer.cms.bindings.bindCollectionList(listId, menu.id);

    const html = await pageHtml(composer);
    expect(html).toContain("Margherita");
    expect(html).toContain("Diavola");
    expect(html).not.toContain("{{item.");
  });

  it("a page without a Collection list exports the same with or without a collection in the project", async () => {
    const before = await pageHtml(project());
    const composer = project();
    await composer.cms.collections.createCollection("Menu items");
    expect(await pageHtml(composer)).toBe(before);
  });
});
