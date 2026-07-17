/**
 * ElementManager / ElementCRUD — behavior contracts not covered elsewhere.
 *
 * Existing coverage: group/ungroup happy paths (engine/__tests__/group-elements),
 * preview API (ElementManager.preview.test.ts), page CRUD (manager/__tests__/
 * PageManager.test.ts). This suite covers the CRUD sub-manager itself:
 * createElement droppable rules, removeElement root-guard + selection reassign,
 * moveElement index clamping, duplicate/serialize/paste fresh-ID cloning, and
 * the group/ungroup refusal branches.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import type { Element } from "../Element";
import { makeEngine, emitsOf } from "./harness";

describe("ElementManager.createElement", () => {
  it("container types are droppable, leaf types are not", () => {
    const { manager } = makeEngine();
    expect(manager.createElement("container").isDroppable()).toBe(true);
    expect(manager.createElement("section").isDroppable()).toBe(true);
    expect(manager.createElement("grid").isDroppable()).toBe(true);
    expect(manager.createElement("text").isDroppable()).toBe(false);
    expect(manager.createElement("image").isDroppable()).toBe(false);
  });

  it("assigns the default tag for the type", () => {
    const { manager } = makeEngine();
    expect(manager.createElement("container").getTagName()).toBe("div");
    expect(manager.createElement("heading").getTagName()).toBe("h2");
    expect(manager.createElement("paragraph").getTagName()).toBe("p");
    expect(manager.createElement("text").getTagName()).toBe("span");
    expect(manager.createElement("image").getTagName()).toBe("img");
  });

  it("is draggable by default and options override the defaults", () => {
    const { manager } = makeEngine();
    expect(manager.createElement("container").isDraggable()).toBe(true);

    const el = manager.createElement("container", {
      tagName: "section",
      droppable: false,
      attributes: { role: "region" },
      styles: { color: "red" },
    });
    expect(el.getTagName()).toBe("section");
    expect(el.isDroppable()).toBe(false);
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getStyle("color")).toBe("red");
  });

  it("registers the element, emits ELEMENT_CREATED and marks dirty", () => {
    const { composer, manager } = makeEngine();
    const el = manager.createElement("container");
    expect(manager.getElement(el.getId())).toBe(el);
    expect(manager.getAllElements()).toContain(el);
    expect(emitsOf(composer, EVENTS.ELEMENT_CREATED)).toHaveLength(1);
    expect(composer.markDirty).toHaveBeenCalled();
  });
});

describe("ElementManager.addElement", () => {
  it("returns false when the parent is not registered", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text");
    expect(manager.addElement(el, "ghost-parent")).toBe(false);
  });

  it("appends without an index and inserts at an explicit index", () => {
    const { manager } = makeEngine();
    const parent = manager.createElement("container");
    const a = manager.createElement("text");
    const b = manager.createElement("text");
    const c = manager.createElement("text");

    manager.addElement(a, parent.getId());
    manager.addElement(b, parent.getId());
    manager.addElement(c, parent.getId(), 1);

    expect(parent.getChildren().map((e) => e.getId())).toEqual([
      a.getId(),
      c.getId(),
      b.getId(),
    ]);
    expect(c.getParent()?.getId()).toBe(parent.getId());
  });
});

describe("ElementManager.removeElement", () => {
  it("returns false for an unknown id", () => {
    const { manager } = makeEngine();
    expect(manager.removeElement("nope")).toBe(false);
  });

  it("blocks deleting the ACTIVE page root and emits ERROR", () => {
    const { composer, manager } = makeEngine();
    const page = manager.createPage("Home");

    expect(manager.removeElement(page.root.id)).toBe(false);
    expect(manager.getElement(page.root.id)).toBeDefined();

    const errors = emitsOf(composer, EVENTS.ERROR);
    expect(errors).toHaveLength(1);
    expect(errors[0][1]).toEqual({
      type: "invalid_operation",
      message: "Cannot delete page root element",
    });
  });

  // Pinned current behavior: the guard only checks the ACTIVE page's root, so
  // the root of any other page is deletable through removeElement (deletePage
  // is the intended path for whole pages).
  it("allows deleting a NON-active page's root (guard covers active page only)", () => {
    const { manager } = makeEngine();
    manager.createPage("Home"); // becomes active
    const other = manager.createPage("About");
    expect(manager.removeElement(other.root.id)).toBe(true);
    expect(manager.getElement(other.root.id)).toBeUndefined();
  });

  it.todo(
    "BUG? removeElement should arguably guard EVERY page root, not just the active page's — deleting another page's root strands that page with a dangling root reference"
  );

  it("removes the element and its whole subtree from the registry", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const parent = manager.createElement("container");
    const child = manager.createElement("container");
    const grandchild = manager.createElement("text");
    manager.addElement(parent, page.root.id);
    manager.addElement(child, parent.getId());
    manager.addElement(grandchild, child.getId());

    expect(manager.removeElement(parent.getId())).toBe(true);

    expect(manager.getElement(parent.getId())).toBeUndefined();
    expect(manager.getElement(child.getId())).toBeUndefined();
    expect(manager.getElement(grandchild.getId())).toBeUndefined();
    const root = manager.getElement(page.root.id)!;
    expect(root.getChildren()).toHaveLength(0);
  });

  it("reassigns selection to the parent when the selected element is deleted", () => {
    const { composer, manager } = makeEngine();
    const page = manager.createPage("Home");
    const child = manager.createElement("text");
    manager.addElement(child, page.root.id);

    composer.selection.getSelected.mockReturnValue(child);
    manager.removeElement(child.getId());

    expect(composer.selection.select).toHaveBeenCalledTimes(1);
    const selected = composer.selection.select.mock.calls[0][0] as Element;
    expect(selected.getId()).toBe(page.root.id);
    expect(composer.selection.clear).not.toHaveBeenCalled();
  });

  it("reassigns selection when a DESCENDANT of the deleted element was selected", () => {
    const { composer, manager } = makeEngine();
    const page = manager.createPage("Home");
    const parent = manager.createElement("container");
    const child = manager.createElement("text");
    manager.addElement(parent, page.root.id);
    manager.addElement(child, parent.getId());

    composer.selection.getSelected.mockReturnValue(child);
    manager.removeElement(parent.getId());

    const selected = composer.selection.select.mock.calls[0][0] as Element;
    expect(selected.getId()).toBe(page.root.id);
  });

  it("clears selection when the deleted selected element has no parent", () => {
    const { composer, manager } = makeEngine();
    const orphan = manager.createElement("container");

    composer.selection.getSelected.mockReturnValue(orphan);
    manager.removeElement(orphan.getId());

    expect(composer.selection.clear).toHaveBeenCalledTimes(1);
    expect(composer.selection.select).not.toHaveBeenCalled();
  });

  it("drops deleted elements from a multi-selection", () => {
    const { composer, manager } = makeEngine();
    const page = manager.createPage("Home");
    const a = manager.createElement("text");
    const b = manager.createElement("text");
    manager.addElement(a, page.root.id);
    manager.addElement(b, page.root.id);

    composer.selection.getAllSelected.mockReturnValue([a, b]);
    manager.removeElement(a.getId());

    // Only `a` (the deleted one) leaves the multi-selection.
    const removed = composer.selection.removeFromSelection.mock.calls.map(
      (c) => (c[0] as Element).getId()
    );
    expect(removed).toContain(a.getId());
    expect(removed).not.toContain(b.getId());
  });

  it("emits ELEMENT_DELETED for the removed element", () => {
    const { composer, manager } = makeEngine();
    const page = manager.createPage("Home");
    const el = manager.createElement("text");
    manager.addElement(el, page.root.id);
    composer.emit.mockClear();

    manager.removeElement(el.getId());
    const deletes = emitsOf(composer, EVENTS.ELEMENT_DELETED);
    expect(deletes).toHaveLength(1);
    expect((deletes[0][1] as Element).getId()).toBe(el.getId());
  });
});

describe("ElementManager.moveElement", () => {
  function tree() {
    const { composer, manager } = makeEngine();
    const page = manager.createPage("Home");
    const a = manager.createElement("text");
    const b = manager.createElement("text");
    const c = manager.createElement("text");
    manager.addElement(a, page.root.id);
    manager.addElement(b, page.root.id);
    manager.addElement(c, page.root.id);
    const root = manager.getElement(page.root.id)!;
    const order = () => root.getChildren().map((e) => e.getId());
    return { composer, manager, root, a, b, c, order };
  }

  it("returns false when element or new parent is missing", () => {
    const { manager, a } = tree();
    expect(manager.moveElement("ghost", a.getId())).toBe(false);
    expect(manager.moveElement(a.getId(), "ghost")).toBe(false);
  });

  it("clamps an index beyond the child count to the end", () => {
    const { manager, root, a, b, c } = tree();
    const box = manager.createElement("container");
    manager.addElement(box, root.getId(), 0);

    expect(manager.moveElement(a.getId(), box.getId(), 99)).toBe(true);
    expect(box.getChildren().map((e) => e.getId())).toEqual([a.getId()]);
    expect(root.getChildren().map((e) => e.getId())).toEqual([
      box.getId(),
      b.getId(),
      c.getId(),
    ]);
  });

  it("clamps a negative index to 0", () => {
    const { manager, order, a, b, c } = tree();
    expect(manager.moveElement(c.getId(), a.getParent()!.getId(), -5)).toBe(true);
    expect(order()).toEqual([c.getId(), a.getId(), b.getId()]);
  });

  it("adjusts the index on a same-parent FORWARD move (removal shifts positions)", () => {
    const { order, manager, root, a, b, c } = tree();
    // Drop `a` after `b` (raw index 2). After removing `a`, that is index 1.
    manager.moveElement(a.getId(), root.getId(), 2);
    expect(order()).toEqual([b.getId(), a.getId(), c.getId()]);
  });

  it("does NOT adjust the index on a same-parent BACKWARD move", () => {
    const { order, manager, root, a, b, c } = tree();
    manager.moveElement(c.getId(), root.getId(), 0);
    expect(order()).toEqual([c.getId(), a.getId(), b.getId()]);
  });

  it("emits ELEMENT_MOVED with the adjusted index", () => {
    const { composer, manager, root, a } = tree();
    composer.emit.mockClear();
    manager.moveElement(a.getId(), root.getId(), 2);

    const moved = emitsOf(composer, EVENTS.ELEMENT_MOVED);
    expect(moved).toHaveLength(1);
    expect((moved[0][1] as { index: number }).index).toBe(1);
  });

  // moveElement refuses to move an element into its own descendant — that would
  // create a parent cycle (a.parent === b while b.parent === a) and make
  // traversals like getPath() loop forever.
  it("refuses to move an element into its own descendant (no parent cycle)", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const a = manager.createElement("container");
    const b = manager.createElement("container");
    manager.addElement(a, page.root.id);
    manager.addElement(b, a.getId());

    expect(manager.moveElement(a.getId(), b.getId())).toBe(false);
    // The tree is unchanged: a stays under the page root, b stays under a.
    expect(a.getParent()?.getId()).toBe(page.root.id);
    expect(b.getParent()?.getId()).toBe(a.getId());
  });

  it("refuses to move an element into itself", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const box = manager.createElement("container");
    manager.addElement(box, page.root.id);

    expect(manager.moveElement(box.getId(), box.getId())).toBe(false);
    expect(box.getParent()?.getId()).toBe(page.root.id);
  });
});

describe("ElementManager.duplicateElement / serializeElement / pasteElement", () => {
  function seeded() {
    const { composer, manager } = makeEngine();
    const page = manager.createPage("Home");
    const card = manager.createElement("container", { classes: ["card"] });
    const title = manager.createElement("heading", { content: "Hi" });
    const body = manager.createElement("paragraph", { content: "Body" });
    manager.addElement(card, page.root.id);
    manager.addElement(title, card.getId());
    manager.addElement(body, card.getId());
    const root = manager.getElement(page.root.id)!;
    return { composer, manager, root, card, title, body };
  }

  it("duplicateElement returns null for an unknown id", () => {
    const { manager } = makeEngine();
    expect(manager.duplicateElement("ghost")).toBeNull();
  });

  it("duplicateElement deep-clones with fresh IDs at every level", () => {
    const { manager, card, title, body } = seeded();
    const clone = manager.duplicateElement(card.getId())!;

    expect(clone.getId()).not.toBe(card.getId());
    const cloneChildIds = clone.getChildren().map((e) => e.getId());
    expect(cloneChildIds).not.toContain(title.getId());
    expect(cloneChildIds).not.toContain(body.getId());

    // Structure and content match the original.
    expect(clone.getChildren().map((e) => e.getType())).toEqual(["heading", "paragraph"]);
    expect(clone.getChildren()[0].getContent()).toBe("Hi");
    expect(clone.hasClass("card")).toBe(true);
  });

  it("duplicateElement registers the clone tree and inserts it right after the original", () => {
    const { composer, manager, root, card } = seeded();
    const clone = manager.duplicateElement(card.getId())!;

    expect(manager.getElement(clone.getId())).toBe(clone);
    clone.getChildren().forEach((c) => {
      expect(manager.getElement(c.getId())).toBe(c);
    });
    expect(root.getChildren().map((e) => e.getId())).toEqual([card.getId(), clone.getId()]);
    expect(emitsOf(composer, EVENTS.ELEMENT_DUPLICATED)).toHaveLength(1);
  });

  it("serializeElement returns fresh-ID clipboard data, null for unknown", () => {
    const { manager, card, title } = seeded();
    expect(manager.serializeElement("ghost")).toBeNull();

    const data = manager.serializeElement(card.getId())!;
    expect(data.id).not.toBe(card.getId());
    expect(data.children).toHaveLength(2);
    expect(data.children![0].id).not.toBe(title.getId());
    expect(data.children![0].content).toBe("Hi");
  });

  it("pasteElement builds + registers the tree at the target index and emits CLIPBOARD_PASTE", () => {
    const { composer, manager, root, card } = seeded();
    const data = manager.serializeElement(card.getId())!;
    composer.emit.mockClear();

    const pasted = manager.pasteElement(data, root, 0)!;

    expect(pasted).not.toBeNull();
    expect(root.getChildren()[0].getId()).toBe(pasted.getId());
    expect(manager.getElement(pasted.getId())).toBe(pasted);
    pasted.getChildren().forEach((c) => expect(manager.getElement(c.getId())).toBe(c));
    expect(emitsOf(composer, EVENTS.CLIPBOARD_PASTE)).toHaveLength(1);
  });
});

describe("ElementManager.groupElements refusal branches", () => {
  it("returns null when the ids resolve to fewer than 2 elements", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const a = manager.createElement("text");
    manager.addElement(a, page.root.id);
    expect(manager.groupElements([a.getId(), "ghost"])).toBeNull();
  });

  it("returns null when the elements have different parents", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const box = manager.createElement("container");
    const a = manager.createElement("text");
    const b = manager.createElement("text");
    manager.addElement(box, page.root.id);
    manager.addElement(a, page.root.id);
    manager.addElement(b, box.getId());
    expect(manager.groupElements([a.getId(), b.getId()])).toBeNull();
  });

  it("returns null when a parent-less element (page root) is included", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const a = manager.createElement("text");
    manager.addElement(a, page.root.id);
    expect(manager.groupElements([page.root.id, a.getId()])).toBeNull();
  });

  it("groups in DOCUMENT order even when ids are passed reversed", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const a = manager.createElement("heading");
    const b = manager.createElement("paragraph");
    manager.addElement(a, page.root.id);
    manager.addElement(b, page.root.id);

    const group = manager.groupElements([b.getId(), a.getId()])!;
    expect(group.getChildren().map((e) => e.getId())).toEqual([a.getId(), b.getId()]);
  });
});

describe("ElementManager.ungroupElement refusal branches", () => {
  it("returns false for an unknown id", () => {
    const { manager } = makeEngine();
    expect(manager.ungroupElement("ghost")).toBe(false);
  });

  it("returns false for a parent-less element (page root)", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    expect(manager.ungroupElement(page.root.id)).toBe(false);
  });

  it("returns false for an empty container", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const empty = manager.createElement("container");
    manager.addElement(empty, page.root.id);
    expect(manager.ungroupElement(empty.getId())).toBe(false);
    expect(manager.getElement(empty.getId())).toBeDefined();
  });
});

describe("ElementManager.findByMediaSrc", () => {
  it("returns [] for an empty src", () => {
    const { manager } = makeEngine();
    expect(manager.findByMediaSrc("")).toEqual([]);
  });

  it("matches by src attribute and by background-image, excluding others", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const img = manager.createElement("image", { attributes: { src: "https://x/pic.png" } });
    const hero = manager.createElement("container", {
      styles: { "background-image": 'url("https://x/pic.png")' },
    });
    const other = manager.createElement("image", { attributes: { src: "https://x/other.png" } });
    manager.addElement(img, page.root.id);
    manager.addElement(hero, page.root.id);
    manager.addElement(other, page.root.id);

    const hits = manager.findByMediaSrc("https://x/pic.png").map((e) => e.getId());
    expect(hits).toContain(img.getId());
    expect(hits).toContain(hero.getId());
    expect(hits).not.toContain(other.getId());
  });
});

describe("ElementManager.clear / destroy", () => {
  it("clear() empties pages and the element registry", () => {
    const { manager } = makeEngine();
    manager.createPage("Home");
    manager.createElement("text");
    manager.clear();
    expect(manager.getAllPages()).toEqual([]);
    expect(manager.getAllElements()).toEqual([]);
    expect(manager.getActivePage()).toBeUndefined();
  });

  it("destroy() clears everything too", () => {
    const { manager } = makeEngine();
    manager.createPage("Home");
    manager.destroy();
    expect(manager.getAllPages()).toEqual([]);
    expect(manager.getAllElements()).toEqual([]);
  });
});
