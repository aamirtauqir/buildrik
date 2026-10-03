// @vitest-environment jsdom
/**
 * G3-079 — a Collection list ships one copy of its children per PUBLISHED
 * record (static export, the default for publish and ZIP), and a loop around
 * its children in template export. Real CollectionManager + CMSBindingManager.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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

const PAGE =
  '<div data-buildrick-id="list"><div data-buildrick-id="card"><h3 data-buildrick-id="t">{{item.name}}</h3></div></div>';

async function setup() {
  const cms = new CollectionManager();
  const composer = {
    data: { on: vi.fn(), off: vi.fn() },
    markDirty: vi.fn(),
    emit: vi.fn(),
    elements: { getElement: () => null },
  } as unknown as Composer;
  const bindings = new CMSBindingManager(composer, cms);
  (composer as unknown as { cms: unknown }).cms = { bindings, collections: cms };
  const menu = await cms.createCollection("Menu items");
  for (const [name, status] of [["Margherita", "published"], ["Quattro", "published"], ["Unfinished", "draft"]] as const) {
    const rec = (await cms.createContentItem(menu.id, { name }))!;
    if (status === "published") await cms.updateContentItem(rec.id, { status });
  }
  bindings.bindCollection("list", menu.id, { repeat: "children" });
  return { resolver: new CMSExportResolver(composer), menuId: menu.id };
}

beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

describe("Collection list in export", () => {
  it("static: one card per published record, the template and placeholders gone", async () => {
    const { resolver } = await setup();
    const html = await resolver.resolve(PAGE, { mode: "static" });
    expect(html.match(/data-buildrick-id="card"/g)).toHaveLength(2);
    expect(html).toContain("Margherita");
    expect(html).toContain("Quattro");
    expect(html).not.toContain("Unfinished");
    expect(html).not.toContain("{{item.name}}");
  });

  it("template: the loop wraps the list's children, not the list", async () => {
    const { resolver, menuId } = await setup();
    const html = await resolver.resolve(PAGE, { mode: "template", syntax: "handlebars" });
    expect(html).toContain(`<div data-buildrick-id="list"><!--#each ${menuId} as |item|--><div data-buildrick-id="card">`);
    expect(html).toContain("</div><!--/each--></div>");
  });
});

/* C0.8 / BD-01: a list child bound through the Inspector ("From CMS", no
   pinned record) to the list's own collection reads the CURRENT record of
   each copy. Resolved page-wide it wrote the first record into every copy. */
describe("a list child's binding resolves per copy (current item)", () => {
  const BOUND =
    '<div data-buildrick-id="list"><div data-buildrick-id="card"><h3 data-buildrick-id="t">Margherita</h3></div></div>';

  async function bound() {
    const ctx = await setup();
    const composer = (ctx.resolver as unknown as { composer: Composer }).composer;
    composer.cms.bindings.bindToField("t", ctx.menuId, undefined, "name", "content");
    return { ...ctx, composer };
  }

  it("publish: each copy shows its own record", async () => {
    const { resolver } = await bound();
    const html = await resolver.resolve(BOUND, { mode: "static" });
    const titles = [...html.matchAll(/<h3 data-buildrick-id="t">([^<]*)<\/h3>/g)].map((m) => m[1]);
    expect(titles.sort()).toEqual(["Margherita", "Quattro"]);
    expect(html).not.toContain("data-cms-current-item");
  });

  it("canvas: each copy shows its own record", async () => {
    const { composer } = await bound();
    const doc = new DOMParser().parseFromString(BOUND, "text/html");
    await new RepeaterRenderer(composer).expandCollectionLists(doc, { canvas: true });
    const titles = Array.from(doc.querySelectorAll('[data-buildrick-id="t"]')).map((el) => el.textContent);
    // The canvas shows drafts too.
    expect(titles.sort()).toEqual(["Margherita", "Quattro", "Unfinished"]);
  });

  it("a binding to a pinned record stays that record in every copy", async () => {
    const { resolver, composer, menuId } = await setup().then(async (ctx) => ({
      ...ctx,
      composer: (ctx.resolver as unknown as { composer: Composer }).composer,
    }));
    const pinned = (await composer.cms.collections.queryContent({ collectionId: menuId, status: "published" })).items.find(
      (i) => i.data.name === "Quattro",
    )!;
    composer.cms.bindings.bindToField("t", menuId, pinned.id, "name", "content");
    const html = await resolver.resolve(BOUND, { mode: "static" });
    const titles = [...html.matchAll(/<h3 data-buildrick-id="t">([^<]*)<\/h3>/g)].map((m) => m[1]);
    expect(titles).toEqual(["Quattro", "Quattro"]);
  });
});
