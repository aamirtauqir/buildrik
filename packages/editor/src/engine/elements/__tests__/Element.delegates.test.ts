/**
 * Element + ElementStyles + ElementChildren delegate contracts.
 *
 * Covers identity/data accessors, attribute/class/style/trait handling
 * (including the component override merge in getStyles and the
 * recordInstanceOverride notification hook), the custom-data bag, child
 * management, traversal, and the selector query engine.
 *
 * ElementOperations + ElementSerialization live in Element.ops.test.ts.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import { makeEngine, emitsOf } from "./harness";

describe("Element identity + data", () => {
  it("exposes id/type/tagName/content and defaults tagName to div", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("container", { tagName: undefined, content: "hi" });
    expect(el.getId()).toMatch(/^el-/);
    expect(el.getType()).toBe("container");
    expect(el.getTagName()).toBe("div");
    expect(el.getContent()).toBe("hi");
  });

  it("getData returns a copy — mutating it does not affect the element", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text");
    const data = el.getData();
    data.content = "hacked";
    expect(el.getContent()).toBe("");
  });

  it("setContent / setTagName / setLocked mutate, emit ELEMENT_UPDATED and mark dirty", () => {
    const { composer, manager } = makeEngine();
    const el = manager.createElement("text");
    composer.emit.mockClear();
    composer.markDirty.mockClear();

    el.setContent("hello");
    el.setTagName("strong");
    el.setLocked(true);

    expect(el.getContent()).toBe("hello");
    expect(el.getTagName()).toBe("strong");
    expect(el.isLocked()).toBe(true);
    expect(emitsOf(composer, EVENTS.ELEMENT_UPDATED)).toHaveLength(3);
    expect(composer.markDirty).toHaveBeenCalledTimes(3);
  });

  it("draggable/droppable/resizable flags read from data", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("container", { resizable: true });
    expect(el.isDraggable()).toBe(true);
    expect(el.isDroppable()).toBe(true);
    expect(el.isResizable()).toBe(true);
    const leaf = manager.createElement("text", { draggable: false });
    expect(leaf.isDraggable()).toBe(false);
    expect(leaf.isResizable()).toBe(false);
  });
});

describe("ElementStyles — attributes", () => {
  it("set/get/remove attribute round-trip", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("image");
    el.setAttribute("src", "a.png");
    expect(el.getAttribute("src")).toBe("a.png");
    el.removeAttribute("src");
    expect(el.getAttribute("src")).toBeUndefined();
  });

  it("getAttributes always injects data-buildrick-id", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text");
    expect(el.getAttributes()["data-buildrick-id"]).toBe(el.getId());
  });

  it("getAttributes serializes interactions into data-buildrick-interactions", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("button");
    expect(el.getAttributes()["data-buildrick-interactions"]).toBeUndefined();

    el.setInteractions([{ trigger: "click", action: "open-link" }]);
    expect(JSON.parse(el.getAttributes()["data-buildrick-interactions"])).toEqual([
      { trigger: "click", action: "open-link" },
    ]);
  });

  it("setAttribute notifies the component manager override hook", () => {
    const { composer, manager } = makeEngine();
    const recordInstanceOverride = vi.fn();
    composer.components = { recordInstanceOverride };
    const el = manager.createElement("image");

    el.setAttribute("src", "a.png");

    expect(recordInstanceOverride).toHaveBeenCalledWith(el.getId(), "attribute", "src", "a.png");
  });
});

describe("ElementStyles — classes", () => {
  it("addClass dedupes; removeClass removes; hasClass reflects", () => {
    const { composer, manager } = makeEngine();
    const el = manager.createElement("text");
    composer.emit.mockClear();

    el.addClass("a");
    el.addClass("a"); // duplicate — no second mutation
    expect(el.getClasses()).toEqual(["a"]);
    expect(emitsOf(composer, EVENTS.ELEMENT_UPDATED)).toHaveLength(1);

    expect(el.hasClass("a")).toBe(true);
    el.removeClass("a");
    expect(el.hasClass("a")).toBe(false);
  });

  it("getClasses returns a copy; setClasses replaces wholesale", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text", { classes: ["x"] });
    const copy = el.getClasses();
    copy.push("mutated");
    expect(el.getClasses()).toEqual(["x"]);

    el.setClasses(["a", "b"]);
    expect(el.getClasses()).toEqual(["a", "b"]);
  });
});

describe("ElementStyles — styles + component override merge", () => {
  it("set/get/remove style round-trip; getStyles returns a copy", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text");
    el.setStyle("color", "red");
    expect(el.getStyle("color")).toBe("red");

    const styles = el.getStyles();
    styles.color = "mutated";
    expect(el.getStyle("color")).toBe("red");

    el.removeStyle("color");
    expect(el.getStyle("color")).toBeUndefined();
  });

  it("setStyles replaces the whole style bag", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text", { styles: { color: "red", margin: "4px" } });
    el.setStyles({ padding: "8px" });
    expect(el.getStyles()).toEqual({ padding: "8px" });
  });

  it("getStyles merges component overrides ON TOP of base styles", () => {
    const { composer, manager } = makeEngine();
    const el = manager.createElement("text", { styles: { color: "red", margin: "4px" } });
    composer.components = {
      getOverridesForElement: vi.fn((id: string): Record<string, string> =>
        id === el.getId() ? { color: "blue" } : {}
      ),
    };

    expect(el.getStyles()).toEqual({ color: "blue", margin: "4px" });
    // getStyle (single property) still reads BASE data, not the merged view.
    expect(el.getStyle("color")).toBe("red");
  });

  it("setStyle notifies the component manager override hook", () => {
    const { composer, manager } = makeEngine();
    const recordInstanceOverride = vi.fn();
    composer.components = { recordInstanceOverride };
    const el = manager.createElement("text");

    el.setStyle("color", "blue");

    expect(recordInstanceOverride).toHaveBeenCalledWith(el.getId(), "style", "color", "blue");
  });
});

describe("ElementStyles — traits", () => {
  it("setTrait creates a text-typed trait, then updates in place", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("heading");

    el.setTrait("level", "h2");
    expect(el.getTrait("level")).toEqual({ name: "level", type: "text", value: "h2" });

    el.setTrait("level", "h1");
    expect(el.getTraits()).toHaveLength(1);
    expect(el.getTrait("level")?.value).toBe("h1");
  });

  it("getTraits returns a copy and getTrait misses return undefined", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("heading");
    expect(el.getTrait("ghost")).toBeUndefined();
    el.setTrait("a", "1");
    const traits = el.getTraits();
    traits.pop();
    expect(el.getTraits()).toHaveLength(1);
  });
});

describe("Element custom data bag", () => {
  it("setData/getCustomData round-trip; missing keys are undefined", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text");
    expect(el.getCustomData("k")).toBeUndefined();
    el.setData("k", { nested: true });
    expect(el.getCustomData("k")).toEqual({ nested: true });
  });
});

describe("ElementChildren — child management", () => {
  function family() {
    const { composer, manager } = makeEngine();
    const parent = manager.createElement("container");
    const a = manager.createElement("text");
    const b = manager.createElement("text");
    parent.addChild(a);
    parent.addChild(b);
    return { composer, manager, parent, a, b };
  }

  it("addChild appends, inserts at index, and treats out-of-range as append", () => {
    const { manager, parent, a, b } = family();
    const c = manager.createElement("text");
    parent.addChild(c, 1);
    expect(parent.getChildren().map((e) => e.getId())).toEqual([a.getId(), c.getId(), b.getId()]);

    const d = manager.createElement("text");
    parent.addChild(d, 99);
    expect(parent.getChildAt(3)?.getId()).toBe(d.getId());
    expect(d.getParent()?.getId()).toBe(parent.getId());
  });

  it("removeChild detaches and nulls the parent; unknown child is a no-op", () => {
    const { manager, parent, a, b } = family();
    parent.removeChild(a);
    expect(a.getParent()).toBeNull();
    expect(parent.getChildCount()).toBe(1);

    const stranger = manager.createElement("text");
    parent.removeChild(stranger);
    expect(parent.getChildCount()).toBe(1);
    expect(parent.getChildAt(0)?.getId()).toBe(b.getId());
  });

  it("getChildIndex / getChildAt handle misses", () => {
    const { manager, parent, a } = family();
    expect(parent.getChildIndex(a)).toBe(0);
    expect(parent.getChildIndex(manager.createElement("text"))).toBe(-1);
    expect(parent.getChildAt(99)).toBeUndefined();
  });

  it("getChildren returns a copy of the live list", () => {
    const { parent } = family();
    const copy = parent.getChildren();
    copy.pop();
    expect(parent.getChildCount()).toBe(2);
  });
});

describe("ElementChildren — traversal", () => {
  function lineage() {
    const { composer, manager } = makeEngine();
    const root = manager.createElement("container");
    const mid = manager.createElement("container");
    const leaf = manager.createElement("text");
    const sibling = manager.createElement("text");
    root.addChild(mid);
    root.addChild(sibling);
    mid.addChild(leaf);
    return { composer, manager, root, mid, leaf, sibling };
  }

  it("getSiblings excludes self; [] when parent-less", () => {
    const { root, mid, sibling } = lineage();
    expect(mid.getSiblings().map((e) => e.getId())).toEqual([sibling.getId()]);
    expect(root.getSiblings()).toEqual([]);
  });

  it("getPath walks root → self", () => {
    const { root, mid, leaf } = lineage();
    expect(leaf.getPath()).toEqual([root.getId(), mid.getId(), leaf.getId()]);
  });

  it("isDescendantOf is true for any ancestor, false otherwise", () => {
    const { root, mid, leaf, sibling } = lineage();
    expect(leaf.isDescendantOf(mid)).toBe(true);
    expect(leaf.isDescendantOf(root)).toBe(true);
    expect(leaf.isDescendantOf(sibling)).toBe(false);
    expect(root.isDescendantOf(leaf)).toBe(false);
  });

  it("getAncestors walks self → root; getDescendants is depth-first", () => {
    const { root, mid, leaf, sibling } = lineage();
    expect(leaf.getAncestors().map((e) => e.getId())).toEqual([mid.getId(), root.getId()]);
    expect(root.getDescendants().map((e) => e.getId())).toEqual([
      mid.getId(),
      leaf.getId(),
      sibling.getId(),
    ]);
  });

  it("moveTo reparents at an index and emits ELEMENT_MOVED", () => {
    const { composer, root, mid, leaf, sibling } = lineage();
    composer.emit.mockClear();

    leaf.moveTo(root, 1);

    expect(leaf.getParent()?.getId()).toBe(root.getId());
    expect(root.getChildren().map((e) => e.getId())).toEqual([
      mid.getId(),
      leaf.getId(),
      sibling.getId(),
    ]);
    expect(mid.getChildCount()).toBe(0);
    expect(emitsOf(composer, EVENTS.ELEMENT_MOVED)).toHaveLength(1);
  });
});

describe("ElementChildren — selector queries", () => {
  function queryTree() {
    const { manager } = makeEngine();
    const root = manager.createElement("container", { classes: ["page"] });
    const cardA = manager.createElement("container", { classes: ["card"] });
    const cardB = manager.createElement("container", { classes: ["card"] });
    const title = manager.createElement("heading", { attributes: { id: "headline" } });
    root.addChild(cardA);
    root.addChild(cardB);
    cardA.addChild(title);
    return { manager, root, cardA, cardB, title };
  }

  it("find('.class') matches self and descendants", () => {
    const { root, cardA, cardB } = queryTree();
    expect(root.find(".card").map((e) => e.getId())).toEqual([cardA.getId(), cardB.getId()]);
    expect(root.find(".page").map((e) => e.getId())).toEqual([root.getId()]);
  });

  it("find('#id') matches element id AND id attribute", () => {
    const { root, title } = queryTree();
    expect(root.find(`#${title.getId()}`)).toHaveLength(1);
    expect(root.find("#headline")[0].getId()).toBe(title.getId());
  });

  it("find('tag') matches by tagName", () => {
    const { root, title } = queryTree();
    expect(root.find("h2").map((e) => e.getId())).toEqual([title.getId()]);
  });

  it("findOne returns the first depth-first match or null", () => {
    const { root, cardA } = queryTree();
    expect(root.findOne(".card")?.getId()).toBe(cardA.getId());
    expect(root.findOne(".ghost")).toBeNull();
  });

  it("query filters by arbitrary predicate", () => {
    const { root, title } = queryTree();
    const headings = root.query((el) => el.getType() === "heading");
    expect(headings.map((e) => e.getId())).toEqual([title.getId()]);
  });
});
