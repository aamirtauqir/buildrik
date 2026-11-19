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
import { elementSelector } from "@/shared/utils/elementSelector";
import type { StyleModel } from "@buildrik/shared/schemas/class-styles";
import { cascade, pageCss, type ElementDescriptor } from "./fixtures/cssCascade";

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

/* REA R4 §CMS list markup: every copy carried its template's
   `data-buildrick-id`. Each copy now has its own id, and the template's
   styles — base, breakpoint and :hover — still reach every copy, in both
   style models. */
describe("Collection list copies — unique ids, same styles", () => {
  async function site(styleModel: StyleModel) {
    const composer = new Composer({} as never);
    composer.styleModel = styleModel;
    composer.importProject({
      pages: [{ id: "p", name: "Home", slug: "", isHome: true,
        root: { id: "root", type: "container" as const, tagName: "div",
          children: [{ id: "list", type: "collection-list" as const, tagName: "div", children: [
            { id: "card", type: "container" as const, tagName: "div", styles: { padding: "4px" }, children: [
              { id: "title", type: "heading" as const, tagName: "h3", content: "{{item.dish}}",
                styles: { color: "rgb(1, 2, 3)" }, children: [] },
            ] },
          ] }] } }],
    } as never);
    composer.styles.setBreakpointStyle("title", "mobile", { "font-size": "12px" });
    composer.styles.setRule(elementSelector("title"), { color: "rgb(9, 9, 9)" }, { pseudo: ":hover" });
    const cms = composer.cms.collections;
    const menu = await cms.createCollection("Menu items");
    await cms.addField(menu.id, { name: "Dish", slug: "dish", type: "text", order: 0 });
    const records: string[] = [];
    for (const dish of ["Margherita", "Diavola"]) {
      const rec = (await cms.createContentItem(menu.id, { dish }))!;
      await cms.updateContentItem(rec.id, { status: "published" });
      records.push(rec.id);
    }
    composer.cms.bindings.bindCollectionList("list", menu.id);
    return { composer, records };
  }

  const elementsOf = (html: string): ElementDescriptor[] =>
    [...html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bdata-buildrick-id="([^"]+)"[^>]*)>/g)].map(([, tag, attrs, id]) => ({
      tag,
      id,
      classes: (/\bclass="([^"]*)"/.exec(attrs)?.[1] ?? "").split(/\s+/).filter(Boolean),
    }));

  for (const styleModel of ["element", "class"] as const) {
    it(`${styleModel} model: two records publish two distinct ids, each copy styled like the template`, async () => {
      const { composer, records } = await site(styleModel);
      const engine = new ExportEngine(composer);
      const published = (await engine.exportAllPages({ format: "html", inlineStyles: true })).files.find((f) => f.name === "index.html")!.content;
      const single = await engine.export({ format: "html" });
      const surfaces = [
        { html: published, css: pageCss(published) },
        { html: single.html!, css: single.css! },
      ];
      for (const { html, css } of surfaces) {
        const titles = elementsOf(html).filter((el) => el.tag === "h3");
        expect(titles.map((t) => t.id).sort()).toEqual(records.map((r) => `title--${r}`).sort());
        const ids = elementsOf(html).map((el) => el.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const title of titles) {
          expect(cascade(css, title, 1280, "normal")).toMatchObject({ color: "rgb(1, 2, 3)" });
          expect(cascade(css, title, 1280, "hover")).toMatchObject({ color: "rgb(9, 9, 9)" });
          expect(cascade(css, title, 500, "normal")).toMatchObject({ color: "rgb(1, 2, 3)", "font-size": "12px" });
        }
        for (const card of elementsOf(html).filter((el) => el.id.startsWith("card--"))) {
          expect(cascade(css, card, 1280, "normal")).toMatchObject({ padding: "4px" });
        }
      }
      composer.destroy();
    });
  }
});
