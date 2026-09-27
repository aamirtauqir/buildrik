/**
 * P-2 (P0, 2026-09-27): binding an element's content to a CMS field wiped its
 * text when the collection had no published record — the value resolved to
 * "" and was written over the element, the paragraph collapsed, Static/unbind
 * kept it empty and only two Undos brought it back.
 *
 * Binding must never destroy the element's own content (it is the fallback
 * the canvas preview and the export already fall back to), and bind and
 * unbind are one undo step each.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "../../shared/constants/events";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "./test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

function setup(resolved: string) {
  const c = createTestComposer();
  const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
  const el = c.elements.createElement("text", { content: "Our story" });
  c.elements.addElement(el, page.root.id);
  c.history.flushPending();
  vi.spyOn(c.cms.bindings, "resolveBinding").mockResolvedValue(resolved);
  const id = el.getId();
  const content = () => c.elements.getElement(id)!.getContent();
  return { c, id, content };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe("P-2 — binding to CMS never wipes the element's text", () => {
  it("a field with no published record leaves the text in place; unbind keeps it", async () => {
    const { c, id, content } = setup("");
    c.cms.bindings.bindToField(id, "col-empty", undefined, "title", "content", undefined, "Bind Title");
    await settle();
    expect(c.cms.bindings.getBindings(id)).toHaveLength(1);
    expect(content()).toBe("Our story");

    c.cms.bindings.unbindAll(id, "Unbind Title");
    expect(c.cms.bindings.getBindings(id)).toHaveLength(0);
    expect(content()).toBe("Our story");
  });

  it("a bind with no record is still ONE undo step, and Undo unbinds", async () => {
    const { c, id, content } = setup("");
    const before = c.history.getUndoCount();
    c.cms.bindings.bindToField(id, "col-empty", undefined, "title", "content", undefined, "Bind Title");
    await settle();
    expect(c.history.getUndoCount()).toBe(before + 1);

    const removed = vi.fn();
    c.on(EVENTS.BINDING_REMOVED, removed);
    c.history.undo();
    expect(c.cms.bindings.getBindings(id)).toHaveLength(0);
    expect(content()).toBe("Our story");
    // The Inspector's binding banner listens for this: Undo left it saying
    // "bound" over an unbound element (live, 2026-09-27).
    expect(removed).toHaveBeenCalledWith({ elementId: id });
  });

  it("bind with a record is ONE undo step that restores the element's own text", async () => {
    const { c, id, content } = setup("Margherita");
    const before = c.history.getUndoCount();
    c.cms.bindings.bindToField(id, "col-1", undefined, "title", "content", undefined, "Bind Title");
    await vi.waitFor(() => expect(content()).toBe("Margherita"));
    await settle();
    expect(c.history.getUndoCount()).toBe(before + 1);

    c.history.undo();
    expect(c.cms.bindings.getBindings(id)).toHaveLength(0);
    expect(content()).toBe("Our story");
  });

  it("unbind is ONE undo step; the text the user sees stays", async () => {
    const { c, id, content } = setup("Margherita");
    c.cms.bindings.bindToField(id, "col-1", undefined, "title", "content", undefined, "Bind Title");
    await vi.waitFor(() => expect(content()).toBe("Margherita"));
    await settle();
    const before = c.history.getUndoCount();

    c.cms.bindings.unbindAll(id, "Unbind Title");
    expect(content()).toBe("Margherita");
    expect(c.history.getUndoCount()).toBe(before + 1);

    c.history.undo();
    expect(c.cms.bindings.getBindings(id)).toHaveLength(1);
  });

  it("picking another field replaces the binding in ONE undo step", async () => {
    const { c, id, content } = setup("Margherita");
    c.cms.bindings.bindToField(id, "col-1", undefined, "title", "content", undefined, "Bind Title");
    await vi.waitFor(() => expect(content()).toBe("Margherita"));
    await settle();
    const before = c.history.getUndoCount();

    c.cms.bindings.bindToField(id, "col-2", undefined, "name", "content", undefined, "Bind Name");
    await settle();
    expect(c.cms.bindings.getBindings(id).map((b) => `${b.collectionId}.${b.fieldSlug}`)).toEqual(["col-2.name"]);
    expect(c.history.getUndoCount()).toBe(before + 1);
  });
});
