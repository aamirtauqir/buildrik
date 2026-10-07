/**
 * C1 field types on the canvas sinks: a multi-select reads "a, b" (it read
 * "a,b" through String(array)), and a list copy shows it the same way.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CMSBindingManager } from "../CMSBindingManager";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import type { Composer } from "@/engine/Composer";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

function setup() {
  const composer = { data: { on: vi.fn(), off: vi.fn() }, markDirty: vi.fn(), emit: vi.fn(), elements: { getElement: () => null } } as unknown as Composer;
  const cms = new CollectionManager();
  return { cms, bindings: new CMSBindingManager(composer, cms) };
}

describe("multi-select through a binding", () => {
  it("reads as a comma-separated list", async () => {
    const { cms, bindings } = setup();
    const c = await cms.createCollection("Dishes", "dishes");
    await cms.addField(c.id, { name: "Tags", slug: "tags", type: "multiselect", order: 0, options: ["Vegan", "Spicy"] });
    const item = await cms.createContentItem(c.id, { tags: ["Vegan", "Spicy"] }, { status: "published" });
    const value = await bindings.resolveBinding({
      binding: { sourceId: `cms:${c.id}`, path: "tags", type: "variable" },
      collectionId: c.id,
      itemId: item!.id,
      fieldSlug: "tags",
      property: "content",
    });
    expect(value).toBe("Vegan, Spicy");
  });
});
