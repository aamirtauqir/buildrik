/**
 * PD-1 Reference: a list copy reads the record a Reference field points at —
 * `{{item.author}}` its name, `{{item.author.name}}` one of its fields. A
 * deleted (or, on export, unpublished) target reads as nothing; before C1 the
 * raw id showed and `{{item.author.name}}` shipped as a literal.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
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

async function setup() {
  const composer = { data: { on: vi.fn(), off: vi.fn() }, markDirty: vi.fn(), emit: vi.fn(), elements: { getElement: () => null } } as unknown as Composer & { cms: unknown };
  const collections = new CollectionManager();
  const bindings = new CMSBindingManager(composer, collections);
  (composer as unknown as { cms: unknown }).cms = { collections, bindings };
  const team = await collections.createCollection("Team", "team", undefined, {
    fields: [{ id: "n", name: "Name", slug: "name", type: "text", order: 0 }, { id: "r", name: "Role", slug: "role", type: "text", order: 1 }],
    displayField: "name",
  });
  const posts = await collections.createCollection("Posts", "posts", undefined, {
    fields: [
      { id: "t", name: "Title", slug: "title", type: "text", order: 0 },
      { id: "a", name: "Author", slug: "author", type: "reference", order: 1, referenceCollection: team.id },
    ],
    displayField: "title",
  });
  const ada = await collections.createContentItem(team.id, { name: "Ada", role: "Chef" }, { status: "published" });
  const bo = await collections.createContentItem(team.id, { name: "Bo", role: "Host" });
  await collections.createContentItem(posts.id, { title: "One", author: ada!.id }, { status: "published" });
  await collections.createContentItem(posts.id, { title: "Two", author: bo!.id }, { status: "published" });
  await collections.createContentItem(posts.id, { title: "Three", author: "gone-id" }, { status: "published" });
  bindings.bindCollection("list", posts.id, { repeat: "children" });
  return new RepeaterRenderer(composer as unknown as Composer);
}

const doc = () =>
  new DOMParser().parseFromString(
    '<div data-buildrick-id="list"><p data-buildrick-id="p">{{item.title}} by {{item.author}} ({{item.author.role}})</p></div>',
    "text/html",
  );

describe("{{item.<reference>…}} in a Collection list", () => {
  it("export: resolves through the reference; a draft or deleted target reads as nothing", async () => {
    const renderer = await setup();
    const d = doc();
    await renderer.expandCollectionLists(d);
    const lines = [...d.querySelectorAll("p")].map((p) => p.textContent).sort();
    expect(lines).toEqual(["One by Ada (Chef)", "Three by  ()", "Two by  ()"]);
  });

  it("canvas: a draft target still previews", async () => {
    const renderer = await setup();
    const d = doc();
    await renderer.expandCollectionLists(d, { canvas: true });
    expect([...d.querySelectorAll("p")].map((p) => p.textContent)).toContain("Two by Bo (Host)");
  });
});
