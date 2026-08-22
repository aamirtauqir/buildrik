/**
 * ElementOperations + ElementSerialization delegate contracts.
 *
 * Covers wrap/unwrap/replaceWith/insertBefore/insertAfter, the animation and
 * interactions data-bag, data bindings, toJSON/toHTML, and the capability
 * queries (canHaveChildren, isVoid, isLocked, canBeWrapped, ...).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import type { AnimationConfig } from "../../../shared/types/animations";
import type { DataBinding } from "../../../shared/types/data";
import { makeEngine, emitsOf } from "./harness";

function siblings() {
  const { composer, manager } = makeEngine();
  const parent = manager.createElement("container");
  const a = manager.createElement("text");
  const b = manager.createElement("text");
  const c = manager.createElement("text");
  parent.addChild(a);
  parent.addChild(b);
  parent.addChild(c);
  const order = () => parent.getChildren().map((e) => e.getId());
  return { composer, manager, parent, a, b, c, order };
}

describe("ElementOperations.wrap", () => {
  it("wraps a middle child in place — wrapper takes the old index", () => {
    const { composer, manager, parent, a, b, c, order } = siblings();
    composer.emit.mockClear();

    const wrapper = b.wrap("section", { role: "group" });

    expect(order()).toEqual([a.getId(), wrapper.getId(), c.getId()]);
    expect(wrapper.getTagName()).toBe("section");
    expect(wrapper.getAttribute("role")).toBe("group");
    expect(wrapper.getChildren().map((e) => e.getId())).toEqual([b.getId()]);
    expect(b.getParent()?.getId()).toBe(wrapper.getId());
    expect(manager.getElement(wrapper.getId())).toBe(wrapper);
    expect(emitsOf(composer, EVENTS.ELEMENT_WRAPPED)).toHaveLength(1);
  });

  it("wraps a parent-less element — wrapper stays unattached", () => {
    const { manager } = makeEngine();
    const orphan = manager.createElement("text");
    const wrapper = orphan.wrap("div");
    expect(wrapper.getParent()).toBeNull();
    expect(orphan.getParent()?.getId()).toBe(wrapper.getId());
  });
});

describe("ElementOperations.unwrap", () => {
  it("dissolves the element — children take its place in order", () => {
    const { composer, manager, parent, a, c, order } = siblings();
    const box = manager.createElement("container");
    const x = manager.createElement("text");
    const y = manager.createElement("text");
    box.addChild(x);
    box.addChild(y);
    parent.addChild(box, 1); // [a, box, b, c]
    composer.emit.mockClear();

    const released = box.unwrap();

    expect(released.map((e) => e.getId())).toEqual([x.getId(), y.getId()]);
    expect(order().slice(0, 3)).toEqual([a.getId(), x.getId(), y.getId()]);
    expect(order()).toHaveLength(5); // a, x, y, b, c
    expect(order()[4]).toBe(c.getId());
    expect(box.getChildCount()).toBe(0);
    expect(box.getParent()).toBeNull();
    expect(emitsOf(composer, EVENTS.ELEMENT_UNWRAPPED)).toHaveLength(1);
  });

  it("returns [] for a parent-less element", () => {
    const { manager } = makeEngine();
    const orphan = manager.createElement("container");
    orphan.addChild(manager.createElement("text"));
    expect(orphan.unwrap()).toEqual([]);
    expect(orphan.getChildCount()).toBe(1); // untouched
  });
});

describe("ElementOperations.replaceWith / insertBefore / insertAfter", () => {
  it("replaceWith swaps at the same index and emits ELEMENT_REPLACED", () => {
    const { composer, manager, a, b, c, order } = siblings();
    const fresh = manager.createElement("button");
    composer.emit.mockClear();

    b.replaceWith(fresh);

    expect(order()).toEqual([a.getId(), fresh.getId(), c.getId()]);
    expect(b.getParent()).toBeNull();
    const events = emitsOf(composer, EVENTS.ELEMENT_REPLACED);
    expect(events).toHaveLength(1);
    expect(events[0][1]).toMatchObject({ old: b, new: fresh });
  });

  it("replaceWith is a no-op on a parent-less element", () => {
    const { manager } = makeEngine();
    const orphan = manager.createElement("text");
    const fresh = manager.createElement("text");
    orphan.replaceWith(fresh);
    expect(fresh.getParent()).toBeNull();
  });

  it("insertBefore / insertAfter position a sibling around self", () => {
    const { manager, a, b, c, order } = siblings();
    const before = manager.createElement("divider");
    const after = manager.createElement("divider");

    b.insertBefore(before);
    b.insertAfter(after);

    expect(order()).toEqual([
      a.getId(),
      before.getId(),
      b.getId(),
      after.getId(),
      c.getId(),
    ]);
  });

  /* Moving an EXISTING sibling, not a fresh element. moveTo removes before it
     inserts, so an index read before the removal is one too many whenever the
     mover sat earlier in the same parent — the case the fresh-element test
     above can never reach. Z-order (Bring Forward / Send to Back) is nothing
     but this case. */
  it("insertBefore / insertAfter reposition an existing earlier sibling", () => {
    /* Four siblings, not three: with `c` last, "insert at index 3" and "append"
       are the same answer, and the off-by-one hides. */
    const { manager, parent, a, b, c, order } = siblings();
    const d = manager.createElement("text");
    parent.addChild(d);
    c.insertAfter(a);
    expect(order()).toEqual([b.getId(), c.getId(), a.getId(), d.getId()]);
  });

  it("insertBefore repositions an existing earlier sibling", () => {
    const { a, b, c, order } = siblings();
    c.insertBefore(a);
    expect(order()).toEqual([b.getId(), a.getId(), c.getId()]);
  });

  it("insertBefore/insertAfter are no-ops when self has no parent", () => {
    const { manager } = makeEngine();
    const orphan = manager.createElement("text");
    const el = manager.createElement("text");
    orphan.insertBefore(el);
    orphan.insertAfter(el);
    expect(el.getParent()).toBeNull();
  });
});

describe("ElementOperations.duplicate", () => {
  it("delegates to the manager and returns a registered clone", () => {
    const { manager, parent, b } = siblings();
    const clone = b.duplicate();
    expect(clone.getId()).not.toBe(b.getId());
    expect(manager.getElement(clone.getId())).toBe(clone);
    expect(parent.getChildIndex(clone)).toBe(parent.getChildIndex(b) + 1);
  });

  it("throws when the element is no longer registered", () => {
    const { manager, parent, b } = siblings();
    // Deregister: detach first so removeElement's selection walk is trivial.
    parent.removeChild(b);
    manager.removeElement(b.getId());
    expect(() => b.duplicate()).toThrow(/Failed to duplicate/);
  });
});

describe("ElementOperations — animation data-bag", () => {
  const config: AnimationConfig = {
    type: "fadeIn",
    duration: 300,
    delay: 0,
    easing: "ease",
    direction: "normal",
    iterations: 1,
    trigger: "load",
    fillMode: "both",
  };

  it("setAnimation stores the config and writes the bd-anim CSS shorthand", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("container");

    el.setAnimation(config);

    expect(el.getAnimation()).toEqual(config);
    expect(el.getStyle("animation")).toBe("bd-anim-fadeIn 300ms ease 0ms 1 normal both");
  });

  it("iterations -1 renders as infinite; missing fillMode defaults to forwards", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("container");
    const { fillMode: _drop, ...rest } = config;
    el.setAnimation({ ...rest, iterations: -1 });
    expect(el.getStyle("animation")).toBe("bd-anim-fadeIn 300ms ease 0ms infinite normal forwards");
  });

  it("clearAnimation removes both the config and the style", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("container");
    el.setAnimation(config);
    el.clearAnimation();
    expect(el.getAnimation()).toBeNull();
    expect(el.getStyle("animation")).toBeUndefined();
  });

  it("getAnimation is null when never set", () => {
    const { manager } = makeEngine();
    expect(manager.createElement("container").getAnimation()).toBeNull();
  });
});

describe("ElementOperations — interactions data-bag", () => {
  it("set/get/has/clear round-trip through data.interactions", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("button");
    expect(el.getInteractions()).toEqual([]);
    expect(el.hasInteractions()).toBe(false);

    el.setInteractions([{ trigger: "click" }]);
    expect(el.hasInteractions()).toBe(true);
    expect(el.getInteractions()).toEqual([{ trigger: "click" }]);
    expect(el.getData().data?.interactions).toEqual([{ trigger: "click" }]);

    el.clearInteractions();
    expect(el.hasInteractions()).toBe(false);
    expect(el.getData().data?.interactions).toBeUndefined();
  });
});

describe("ElementOperations — data bindings", () => {
  const binding: DataBinding = {
    source: "cms",
    field: "title",
  } as unknown as DataBinding;

  it("initializes bindings from constructor data", () => {
    const { manager } = makeEngine();
    const el = manager.createElement("text", { dataBindings: { content: binding } });
    expect(el.hasDataBindings()).toBe(true);
    expect(el.getDataBinding("content")).toEqual(binding);
  });

  it("setDataBinding stores + emits ELEMENT_BINDING_SET", () => {
    const { composer, manager } = makeEngine();
    const el = manager.createElement("text");
    composer.emit.mockClear();

    el.setDataBinding("content", binding);

    expect(el.getDataBindings()).toEqual({ content: binding });
    const events = emitsOf(composer, EVENTS.ELEMENT_BINDING_SET);
    expect(events).toHaveLength(1);
    expect(events[0][1]).toMatchObject({ property: "content", binding });
  });

  it("removeDataBinding removes + emits; removing a missing binding is silent", () => {
    const { composer, manager } = makeEngine();
    const el = manager.createElement("text");
    el.setDataBinding("content", binding);
    composer.emit.mockClear();

    el.removeDataBinding("content");
    expect(el.hasDataBindings()).toBe(false);
    expect(emitsOf(composer, EVENTS.ELEMENT_BINDING_REMOVED)).toHaveLength(1);

    composer.emit.mockClear();
    el.removeDataBinding("ghost");
    expect(emitsOf(composer, EVENTS.ELEMENT_BINDING_REMOVED)).toHaveLength(0);
  });
});

describe("ElementSerialization.toJSON", () => {
  it("reconstructs children from the LIVE tree, not stale data.children", () => {
    const { manager } = makeEngine();
    const parent = manager.createElement("container");
    const child = manager.createElement("text", { content: "live" });
    parent.addChild(child);

    const json = parent.toJSON();
    expect(json.children).toHaveLength(1);
    expect(json.children![0].id).toBe(child.getId());
    expect(json.children![0].content).toBe("live");
  });

  it("includes dataBindings only when present", () => {
    const { manager } = makeEngine();
    const plain = manager.createElement("text");
    expect(plain.toJSON().dataBindings).toBeUndefined();

    const bound = manager.createElement("text");
    bound.setDataBinding("content", { source: "cms" } as unknown as DataBinding);
    expect(bound.toJSON().dataBindings).toEqual({ content: { source: "cms" } });
  });
});

describe("ElementSerialization.toHTML", () => {
  it("renders self-closing tags without children or closing tag", () => {
    const { manager } = makeEngine();
    const img = manager.createElement("image", { attributes: { src: "a.png" } });
    const html = img.toHTML();
    expect(html).toMatch(/^<img .* \/>$/);
    expect(html).toContain('src="a.png"');
  });

  it("renders content before children, with classes and styles", () => {
    const { manager } = makeEngine();
    const box = manager.createElement("container", {
      classes: ["card"],
      styles: { color: "red" },
      content: "hello",
    });
    box.addChild(manager.createElement("text", { content: "world" }));

    const html = box.toHTML();
    expect(html).toContain('class="card"');
    expect(html).toContain("color: red");
    expect(html).toMatch(/>hello<span[^>]*>world<\/span><\/div>$/);
  });
});

describe("ElementSerialization — capability queries", () => {
  it("canHaveChildren / isLeaf / isContainer / isVoid follow the nesting rules", () => {
    const { manager } = makeEngine();
    const box = manager.createElement("container");
    const img = manager.createElement("image");

    expect(box.canHaveChildren()).toBe(true);
    expect(box.isLeaf()).toBe(false);
    expect(box.isContainer()).toBe(true);
    expect(box.isVoid()).toBe(false);

    expect(img.canHaveChildren()).toBe(false);
    expect(img.isLeaf()).toBe(true);
    expect(img.isContainer()).toBe(false);
    expect(img.isVoid()).toBe(true);
  });

  it("isLocked is true for the locked flag OR component-instance membership", () => {
    const { composer, manager } = makeEngine();
    const plain = manager.createElement("text");
    expect(plain.isLocked()).toBe(false);

    const locked = manager.createElement("text", { locked: true });
    expect(locked.isLocked()).toBe(true);

    composer.components = {
      findInstanceContainingElement: vi.fn((id: string) =>
        id === plain.getId() ? { elementId: plain.getId() } : null
      ),
    };
    expect(plain.isLocked()).toBe(true);
    expect(plain.isComponentInstance()).toBe(true);
  });

  it("isRoot / canBeWrapped / canBeUnwrapped derive from parent + children + lock", () => {
    const { manager } = makeEngine();
    const parent = manager.createElement("container");
    const child = manager.createElement("container");
    const grandchild = manager.createElement("text");
    parent.addChild(child);
    child.addChild(grandchild);

    expect(parent.isRoot()).toBe(true);
    expect(parent.canBeWrapped()).toBe(false); // roots can't be wrapped
    expect(child.canBeWrapped()).toBe(true);
    expect(child.canBeUnwrapped()).toBe(true); // parent + children
    expect(grandchild.canBeUnwrapped()).toBe(false); // no children
    expect(parent.canBeUnwrapped()).toBe(false); // no parent

    child.setLocked(true);
    expect(child.canBeWrapped()).toBe(false);
  });

  it("getElementCategory returns categories for known types, [] for unknown", () => {
    const { manager } = makeEngine();
    const box = manager.createElement("container");
    expect(box.getElementCategory().length).toBeGreaterThan(0);

    const alien = manager.createElement("mystery" as never);
    expect(alien.getElementCategory()).toEqual([]);
  });
});
