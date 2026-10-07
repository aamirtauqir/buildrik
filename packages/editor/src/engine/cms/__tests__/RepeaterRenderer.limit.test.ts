/**
 * BD-08: a Collection list showing "All" (no limit) stopped at 50 —
 * queryContent's own default page size.
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

it("an unlimited list renders every published record, past 50", async () => {
  const composer = { data: { on: vi.fn(), off: vi.fn() }, markDirty: vi.fn(), emit: vi.fn(), elements: { getElement: () => null } } as unknown as Composer;
  const collections = new CollectionManager();
  const bindings = new CMSBindingManager(composer, collections);
  (composer as unknown as { cms: unknown }).cms = { collections, bindings };
  const c = await collections.createCollection("Posts", "posts", undefined, { fields: [{ id: "t", name: "Title", slug: "title", type: "text", order: 0 }] });
  for (let i = 0; i < 60; i++) await collections.createContentItem(c.id, { title: `P${i}` }, { status: "published" });
  bindings.bindCollection("list", c.id, { repeat: "children" });
  const doc = new DOMParser().parseFromString('<div data-buildrick-id="list"><p data-buildrick-id="p">{{item.title}}</p></div>', "text/html");
  await new RepeaterRenderer(composer).expandCollectionLists(doc);
  expect(doc.querySelectorAll("p")).toHaveLength(60);
});
