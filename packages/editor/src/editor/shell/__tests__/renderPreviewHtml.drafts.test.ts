/**
 * REA #18: Preview shows a collection list's PUBLISHED records only, as the
 * published page does (RepeaterRenderer), while the canvas shows every record.
 * The difference was silent — the draft rows simply were not there. The build
 * now reports how many records the page's lists left out, so Preview can say so.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { Composer } from "@/engine/Composer";
import { insertBlock, getBlockById } from "@/blocks/blockRegistry";
import * as Storage from "@/engine/cms/CollectionStorage";
import { renderPreviewHtml } from "../exportPublishPages";

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
      root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
  } as never);
  return composer;
}

async function menuWith(composer: Composer, records: Array<[string, "draft" | "published"]>) {
  const cms = composer.cms.collections;
  const menu = await cms.createCollection("Menu items");
  await cms.addField(menu.id, { name: "Dish", slug: "dish", type: "text", order: 0 });
  await cms.updateCollection(menu.id, { displayField: "dish" });
  for (const [dish, status] of records) {
    const rec = (await cms.createContentItem(menu.id, { dish }))!;
    if (status === "published") await cms.updateContentItem(rec.id, { status });
  }
  return menu.id;
}

describe("renderPreviewHtml — draft records a list leaves out", () => {
  it("counts the drafts of every list on the page", async () => {
    const composer = project();
    const listId = insertBlock(composer, getBlockById("collection-list")!, "root")!;
    const menuId = await menuWith(composer, [["Margherita", "published"], ["Ada", "draft"], ["Grace", "draft"]]);
    composer.cms.bindings.bindCollectionList(listId, menuId);

    const { html, hiddenDrafts } = await renderPreviewHtml(composer);
    expect(html).toContain("Margherita");
    expect(html).not.toContain("Grace");
    expect(hiddenDrafts).toBe(2);
  });

  it("is zero with no list on the page", async () => {
    const composer = project();
    await menuWith(composer, [["Ada", "draft"]]);
    expect((await renderPreviewHtml(composer)).hiddenDrafts).toBe(0);
  });
});
