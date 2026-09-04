/**
 * CMSBindingManager tests — element↔field bindings (resolution + application)
 * and collection/repeater bindings (registry, events, persistence).
 *
 * Uses the real CollectionManager over the in-memory storage mock so
 * resolveBinding exercises genuine query semantics; the Composer is a
 * duck-typed stub exposing only what BaseBindingManager + CMSBindingManager
 * touch (data.on/off, markDirty, emit, elements.getElement).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CMSBindingManager } from "../CMSBindingManager";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine/Composer";
import type { CMSContentItem } from "@/shared/types/cms";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

type MockedStorage = typeof Storage & { __reset: () => void };

interface ElementStub {
  setContent: ReturnType<typeof vi.fn>;
  setTrait: ReturnType<typeof vi.fn>;
}

function makeElementStub(): ElementStub {
  return { setContent: vi.fn(), setTrait: vi.fn() };
}

function makeComposer(elements: Record<string, ElementStub> = {}) {
  const emit = vi.fn();
  const markDirty = vi.fn();
  const dataOff = vi.fn();
  const composer = {
    data: { on: vi.fn(), off: dataOff },
    markDirty,
    emit,
    elements: { getElement: (id: string) => elements[id] ?? null },
  } as unknown as Composer;
  return { composer, emit, markDirty, dataOff };
}

function makeItem(overrides: Partial<CMSContentItem> = {}): CMSContentItem {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "item-1",
    collectionId: "col-1",
    data: {},
    status: "draft",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function setupWithContent() {
  const cms = new CollectionManager();
  const collection = await cms.createCollection("Posts");
  const item = (await cms.createContentItem(collection.id, {
    title: "Hello World",
    image: "https://x/a.jpg",
    views: 42,
    empty: null,
  }))!;
  return { cms, collection, item };
}

beforeEach(() => {
  (Storage as MockedStorage).__reset();
});

describe("CMSBindingManager — field bindings", () => {
  it("bindToField stores a binding with the cms source/path shape and applies content", async () => {
    const { cms, collection, item } = await setupWithContent();
    const el = makeElementStub();
    const { composer } = makeComposer({ "el-1": el });
    const manager = new CMSBindingManager(composer, cms);

    manager.bindToField("el-1", collection.id, item.id, "title", "content", "fallback!");

    const bindings = manager.getBindings("el-1");
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({
      binding: {
        sourceId: `cms:${collection.id}`,
        path: `${item.id}.title`,
        type: "variable",
      },
      collectionId: collection.id,
      itemId: item.id,
      fieldSlug: "title",
      property: "content",
      fallback: "fallback!",
    });

    await vi.waitFor(() => expect(el.setContent).toHaveBeenCalledWith("Hello World"));
    expect(el.setTrait).not.toHaveBeenCalled();
  });

  it("builds a context path when no itemId is given", async () => {
    const { cms, collection } = await setupWithContent();
    const { composer } = makeComposer();
    const manager = new CMSBindingManager(composer, cms);

    manager.bindToField("el-1", collection.id, undefined, "title", "content");
    expect(manager.getBindings("el-1")[0].binding.path).toBe("title");
  });

  it("applies src/href/alt/title properties via setTrait", async () => {
    const { cms, collection, item } = await setupWithContent();
    const el = makeElementStub();
    const { composer } = makeComposer({ "el-img": el });
    const manager = new CMSBindingManager(composer, cms);

    manager.bindToField("el-img", collection.id, item.id, "image", "src");
    await vi.waitFor(() => expect(el.setTrait).toHaveBeenCalledWith("src", "https://x/a.jpg"));

    // Unknown properties also fall through to setTrait.
    manager.bindToField("el-img", collection.id, item.id, "title", "data-label");
    await vi.waitFor(() =>
      expect(el.setTrait).toHaveBeenCalledWith("data-label", "Hello World")
    );
    expect(el.setContent).not.toHaveBeenCalled();
  });

  it("silently skips application when the element does not exist", async () => {
    const { cms, collection, item } = await setupWithContent();
    const { composer } = makeComposer({});
    const manager = new CMSBindingManager(composer, cms);

    expect(() =>
      manager.bindToField("ghost", collection.id, item.id, "title", "content")
    ).not.toThrow();
    expect(manager.getBindings("ghost")).toHaveLength(1);
  });

  it("de-dupes on property+collection+field: re-binding replaces instead of appending", async () => {
    const { cms, collection, item } = await setupWithContent();
    const { composer } = makeComposer();
    const manager = new CMSBindingManager(composer, cms);

    manager.bindToField("el-1", collection.id, item.id, "title", "content");
    manager.bindToField("el-1", collection.id, item.id, "title", "content", "changed");
    expect(manager.getBindings("el-1")).toHaveLength(1);
    expect(manager.getBindings("el-1")[0].fallback).toBe("changed");

    // A different property is a different key.
    manager.bindToField("el-1", collection.id, item.id, "title", "alt");
    expect(manager.getBindings("el-1")).toHaveLength(2);
  });

  describe("resolveBinding", () => {
    it("resolves the field value of an explicit item", async () => {
      const { cms, collection, item } = await setupWithContent();
      const manager = new CMSBindingManager(makeComposer().composer, cms);

      await expect(
        manager.resolveBinding({
          binding: { sourceId: `cms:${collection.id}`, path: `${item.id}.views`, type: "variable" },
          collectionId: collection.id,
          itemId: item.id,
          fieldSlug: "views",
          property: "content",
        })
      ).resolves.toBe("42");
    });

    it.each([
      ["no itemId", undefined],
      ["context itemId", "context"],
    ])("falls back for %s", async (_label, itemId) => {
      const { cms, collection } = await setupWithContent();
      const manager = new CMSBindingManager(makeComposer().composer, cms);

      await expect(
        manager.resolveBinding({
          binding: { sourceId: `cms:${collection.id}`, path: "title", type: "variable" },
          collectionId: collection.id,
          itemId,
          fieldSlug: "title",
          property: "content",
          fallback: "FB",
        })
      ).resolves.toBe("FB");
    });

    it("falls back for unknown items and null field values, defaulting to empty string", async () => {
      const { cms, collection, item } = await setupWithContent();
      const manager = new CMSBindingManager(makeComposer().composer, cms);

      await expect(
        manager.resolveBinding({
          binding: { sourceId: `cms:${collection.id}`, path: "missing.title", type: "variable" },
          collectionId: collection.id,
          itemId: "missing",
          fieldSlug: "title",
          property: "content",
          fallback: "FB",
        })
      ).resolves.toBe("FB");

      await expect(
        manager.resolveBinding({
          binding: { sourceId: `cms:${collection.id}`, path: `${item.id}.empty`, type: "variable" },
          collectionId: collection.id,
          itemId: item.id,
          fieldSlug: "empty",
          property: "content",
        })
      ).resolves.toBe("");
    });
  });

  describe("resolveBindingWithContext", () => {
    it("reads the field straight off the context item", async () => {
      const { cms } = await setupWithContent();
      const manager = new CMSBindingManager(makeComposer().composer, cms);
      const contextItem = makeItem({ data: { name: "Ctx" } });

      await expect(
        manager.resolveBindingWithContext(
          {
            binding: { sourceId: "cms:c", path: "name", type: "variable" },
            collectionId: "c",
            fieldSlug: "name",
            property: "content",
          },
          contextItem
        )
      ).resolves.toBe("Ctx");
    });

    it("uses the fallback (or empty string) for absent fields", async () => {
      const { cms } = await setupWithContent();
      const manager = new CMSBindingManager(makeComposer().composer, cms);
      const contextItem = makeItem({ data: {} });
      const base = {
        binding: { sourceId: "cms:c", path: "name", type: "variable" as const },
        collectionId: "c",
        fieldSlug: "name",
        property: "content",
      };

      await expect(
        manager.resolveBindingWithContext({ ...base, fallback: "FB" }, contextItem)
      ).resolves.toBe("FB");
      await expect(manager.resolveBindingWithContext(base, contextItem)).resolves.toBe("");
    });
  });

  it("re-applies bindings when CMS content changes", async () => {
    const { cms, collection, item } = await setupWithContent();
    const el = makeElementStub();
    const { composer } = makeComposer({ "el-1": el });
    const manager = new CMSBindingManager(composer, cms);

    manager.bindToField("el-1", collection.id, item.id, "title", "content");
    await vi.waitFor(() => expect(el.setContent).toHaveBeenCalledWith("Hello World"));

    await cms.updateContentItem(item.id, { data: { ...item.data, title: "Updated" } });
    await vi.waitFor(() => expect(el.setContent).toHaveBeenCalledWith("Updated"));
  });
});

describe("CMSBindingManager — collection (repeater) bindings", () => {
  async function setupManager() {
    const cms = new CollectionManager();
    const { composer, emit, markDirty, dataOff } = makeComposer();
    return { manager: new CMSBindingManager(composer, cms), emit, markDirty, dataOff };
  }

  it("bindCollection stores defaults and notifies the composer", async () => {
    const { manager, emit, markDirty } = await setupManager();

    manager.bindCollection("rep-1", "col-9");

    expect(manager.hasCollectionBinding("rep-1")).toBe(true);
    expect(manager.getCollectionBinding("rep-1")).toEqual({
      elementId: "rep-1",
      collectionId: "col-9",
      itemVar: "item",
      indexVar: "index",
      limit: undefined,
      status: "published",
    });
    expect(markDirty).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(EVENTS.CMS_COLLECTION_BOUND, {
      elementId: "rep-1",
      collectionId: "col-9",
    });
  });

  it("bindCollection honors explicit options", async () => {
    const { manager } = await setupManager();
    manager.bindCollection("rep-1", "col-9", {
      itemVar: "product",
      indexVar: "i",
      limit: 6,
      status: "all",
    });
    expect(manager.getCollectionBinding("rep-1")).toMatchObject({
      itemVar: "product",
      indexVar: "i",
      limit: 6,
      status: "all",
    });
  });

  it("unbindCollection removes the binding and emits; unbinding a stranger is a no-op", async () => {
    const { manager, emit, markDirty } = await setupManager();
    manager.bindCollection("rep-1", "col-9");
    emit.mockClear();
    markDirty.mockClear();

    manager.unbindCollection("rep-1");
    expect(manager.hasCollectionBinding("rep-1")).toBe(false);
    expect(manager.getCollectionBinding("rep-1")).toBeNull();
    expect(emit).toHaveBeenCalledWith(EVENTS.CMS_COLLECTION_UNBOUND, { elementId: "rep-1" });

    emit.mockClear();
    markDirty.mockClear();
    manager.unbindCollection("rep-1");
    expect(emit).not.toHaveBeenCalled();
    expect(markDirty).not.toHaveBeenCalled();
  });

  it("lists all collection bindings", async () => {
    const { manager } = await setupManager();
    manager.bindCollection("rep-1", "col-a");
    manager.bindCollection("rep-2", "col-b");
    expect(manager.getAllCollectionBindings().map((b) => b.elementId)).toEqual([
      "rep-1",
      "rep-2",
    ]);
  });

  it("round-trips collection bindings through export/import", async () => {
    const { manager } = await setupManager();
    manager.bindCollection("rep-1", "col-a", { limit: 3 });
    manager.bindCollection("rep-2", "col-b");

    const exported = manager.exportCollectionBindings();
    expect(Object.keys(exported)).toEqual(["rep-1", "rep-2"]);

    const { manager: fresh } = await setupManager();
    fresh.importCollectionBindings(exported);
    expect(fresh.getCollectionBinding("rep-1")).toEqual(exported["rep-1"]);
    expect(fresh.getAllCollectionBindings()).toHaveLength(2);

    // Import replaces, not merges.
    fresh.importCollectionBindings({});
    expect(fresh.getAllCollectionBindings()).toHaveLength(0);
  });

  it("destroy clears collection bindings and unsubscribes from data sources", async () => {
    const { manager, dataOff } = await setupManager();
    manager.bindCollection("rep-1", "col-a");

    manager.destroy();
    expect(manager.getAllCollectionBindings()).toHaveLength(0);
    expect(dataOff).toHaveBeenCalledWith("source:updated", expect.any(Function));
  });
});

describe("CMSBindingManager — a binding tells history it happened outside it", () => {
  /* Bindings live in this manager's map and ProjectData has no field for
     them, so they cannot join the snapshot. Undo enabled itself after a
     binding and undid an unrelated earlier edit (walked 2026-09-03). The
     binding announces itself so Undo stops offering until the next recorded
     action, and a refusal can name it. */
  it("announces bind and unbind as unrecorded actions", async () => {
    const { cms, collection, item } = await setupWithContent();
    const { composer } = makeComposer({ "el-1": makeElementStub() });
    const noteUnrecordedAction = vi.fn();
    Object.assign(composer, { history: { noteUnrecordedAction } });
    const manager = new CMSBindingManager(composer, cms);

    manager.bindToField("el-1", collection.id, item.id, "title", "content");
    expect(noteUnrecordedAction).toHaveBeenCalledWith("binding a field to content");

    manager.unbindAll("el-1");
    expect(noteUnrecordedAction).toHaveBeenCalledWith("unbinding a field");
  });
});
