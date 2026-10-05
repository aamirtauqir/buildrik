/**
 * C1 binding lifecycle: a deleted element's bindings go with it (BD-22) and a
 * duplicated element / page carries copies of its bindings (BD-06). Before,
 * bindings lived on in the map (still "Used by", locking the field) and a
 * duplicate showed bound text but was bound to nothing.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CMSBindingManager } from "../CMSBindingManager";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine/Composer";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});
beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

type Node = { getId: () => string; getChildren: () => Node[] };
const node = (id: string, children: Node[] = []): Node => ({ getId: () => id, getChildren: () => children });

function setup(existing: Set<string>) {
  const handlers = new Map<string, Array<(p: unknown) => void>>();
  const composer = {
    data: { on: vi.fn(), off: vi.fn() },
    markDirty: vi.fn(),
    on: (ev: string, fn: (p: unknown) => void) => handlers.set(ev, [...(handlers.get(ev) ?? []), fn]),
    emit: (ev: string, p?: unknown) => handlers.get(ev)?.forEach((fn) => fn(p)),
    elements: { getElement: (id: string) => (existing.has(id) ? { setContent: vi.fn(), setTrait: vi.fn() } : null) },
  } as unknown as Composer;
  const bindings = new CMSBindingManager(composer, new CollectionManager());
  return { composer, bindings };
}

const field = (collectionId = "c1") => ({
  binding: { sourceId: `cms:${collectionId}`, path: "title", type: "variable" as const },
  collectionId,
  fieldSlug: "title",
  property: "content" as const,
});

describe("binding lifecycle", () => {
  it("deleting an element drops its field and list bindings (BD-22)", () => {
    const { composer, bindings } = setup(new Set(["h1", "list"]));
    bindings.import({ h1: [field()] });
    bindings.bindCollection("list", "c1", { repeat: "children" });
    composer.emit(EVENTS.ELEMENT_DELETED, { getId: () => "h1" });
    composer.emit(EVENTS.ELEMENT_DELETED, { getId: () => "list" });
    expect(bindings.getBindings("h1")).toEqual([]);
    expect(bindings.getCollectionBinding("list")).toBeNull();
  });

  it("a deleted page's elements lose their bindings", () => {
    const existing = new Set(["h1", "h2"]);
    const { composer, bindings } = setup(existing);
    bindings.import({ h1: [field()], h2: [field()] });
    existing.delete("h2");
    composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:deleted" });
    expect(Object.keys(bindings.export())).toEqual(["h1"]);
  });

  it("duplicating copies every binding in the tree onto the copy, position by position (BD-06)", () => {
    const { composer, bindings } = setup(new Set());
    bindings.import({ h: [field()] });
    bindings.bindCollection("list", "c1", { repeat: "children", limit: 3 });
    composer.emit(EVENTS.ELEMENT_DUPLICATED, {
      original: node("list", [node("card", [node("h")])]),
      clone: node("list2", [node("card2", [node("h2")])]),
    });
    expect(bindings.getBindings("h2")).toEqual([field()]);
    expect(bindings.getBindings("h2")[0]).not.toBe(bindings.getBindings("h")[0]);
    expect(bindings.getCollectionBinding("list2")).toMatchObject({ elementId: "list2", collectionId: "c1", limit: 3 });
  });
});

describe("bindable types (BD-11)", () => {
  it("a container never takes a field binding, from any door; a heading does", () => {
    const types: Record<string, string> = { box: "container", h: "heading" };
    const composer = {
      data: { on: vi.fn(), off: vi.fn() },
      markDirty: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
      history: undefined,
      elements: { getElement: (id: string) => (types[id] ? { getType: () => types[id], setContent: vi.fn(), setTrait: vi.fn() } : null) },
    } as unknown as Composer;
    const bindings = new CMSBindingManager(composer, new CollectionManager());
    bindings.bindToField("box", "c1", undefined, "title", "content");
    bindings.bindToField("h", "c1", undefined, "title", "content");
    expect(bindings.getBindings("box")).toEqual([]);
    expect(bindings.getBindings("h")).toHaveLength(1);
  });
});
