/**
 * Tests for getAllNavigableElements in keyboardHelpers.ts
 * Verifies that the root element is correctly excluded from the Tab cycle (A12).
 */

import { describe, it, expect, vi } from "vitest";
import type { Composer } from "../../../../../engine/Composer";
import type { Element } from "../../../../../engine/elements/Element";
import {
  getAllNavigableElements,
  getNavigationTargets,
  moveElementPosition,
  reorderElement,
} from "../keyboardHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal stub that satisfies Element traversal used by getAllNavigableElements */
interface MockElement {
  getId: () => string;
  getChildren: () => MockElement[];
}

function makeElement(id: string, children: MockElement[] = []): MockElement {
  return {
    getId: () => id,
    getChildren: () => children,
  };
}

function makeComposer(rootId: string | null, elements: { id: string; children?: string[] }[]) {
  // Build a spec map for quick children lookup
  const specMap = new Map<string, string[]>();
  for (const el of elements) {
    specMap.set(el.id, el.children ?? []);
  }

  // Lazily-built element map: each element is created on demand so children
  // are always resolved after all entries are registered.
  const elementMap = new Map<string, MockElement>();

  function getOrCreate(id: string): MockElement {
    if (!elementMap.has(id)) {
      const childIds = specMap.get(id) ?? [];
      // Register a placeholder first to break potential cycles
      elementMap.set(id, makeElement(id, []));
      // Now resolve children (they may in turn call getOrCreate)
      const childEls = childIds.map(getOrCreate);
      elementMap.set(id, makeElement(id, childEls));
    }
    return elementMap.get(id)!;
  }

  // Pre-build all elements
  for (const el of elements) {
    getOrCreate(el.id);
  }

  return {
    elements: {
      getActivePage: vi.fn(() => (rootId ? { root: { id: rootId } } : null)),
      getElement: vi.fn((id: string) => elementMap.get(id) ?? null),
    },
  } as unknown as Composer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getAllNavigableElements", () => {
  describe("without rootId (no filtering)", () => {
    it("returns all elements including the root when rootId is null (default)", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1", "child-2"] },
        { id: "child-1" },
        { id: "child-2" },
      ]);

      const result = getAllNavigableElements(composer);

      expect(result.map((el) => el.getId())).toEqual(["root", "child-1", "child-2"]);
    });

    it("returns all elements when rootId is explicitly null", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1"] },
        { id: "child-1" },
      ]);

      const result = getAllNavigableElements(composer, null);

      expect(result.map((el) => el.getId())).toEqual(["root", "child-1"]);
    });

    it("returns empty array when there is no active page", () => {
      const composer = {
        elements: {
          getActivePage: vi.fn(() => null),
          getElement: vi.fn(),
        },
      } as unknown as Composer;

      const result = getAllNavigableElements(composer, null);

      expect(result).toEqual([]);
    });
  });

  describe("with rootId filtering", () => {
    it("excludes the root element from the returned list", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1", "child-2"] },
        { id: "child-1" },
        { id: "child-2" },
      ]);

      const result = getAllNavigableElements(composer, "root");

      const ids = result.map((el) => el.getId());
      expect(ids).not.toContain("root");
      expect(ids).toEqual(["child-1", "child-2"]);
    });

    it("preserves tree order after filtering out the root", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["section-1", "section-2"] },
        { id: "section-1", children: ["text-1"] },
        { id: "text-1" },
        { id: "section-2" },
      ]);

      const result = getAllNavigableElements(composer, "root");

      expect(result.map((el) => el.getId())).toEqual(["section-1", "text-1", "section-2"]);
    });

    it("returns all elements when rootId does not match any element (no false exclusions)", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1"] },
        { id: "child-1" },
      ]);

      const result = getAllNavigableElements(composer, "nonexistent-id");

      // rootId not found in the list → nothing filtered out
      expect(result.map((el) => el.getId())).toEqual(["root", "child-1"]);
    });

    it("returns empty array when the only element is the root and it is excluded", () => {
      const composer = makeComposer("root", [{ id: "root" }]);

      const result = getAllNavigableElements(composer, "root");

      expect(result).toEqual([]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getNavigationTargets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a navigable Element stub. `parent` and `children` wire the
 * getParent/getChildren methods that getNavigationTargets walks.
 */
function navElement(
  id: string,
  opts: { parent?: Element | null; children?: Element[] } = {}
): Element {
  return {
    getId: () => id,
    getParent: () => opts.parent ?? null,
    getChildren: () => opts.children ?? [],
  } as unknown as Element;
}

describe("getNavigationTargets", () => {
  it("returns prev/next siblings from the parent's child list", () => {
    const a = navElement("a");
    const b = navElement("b");
    const c = navElement("c");
    const parent = navElement("parent", { children: [a, b, c] });
    // Re-wire b so it points at the shared parent
    const bWithParent = navElement("b", { parent });
    // The parent must return the same-id middle node so findIndex matches
    const parentReal = navElement("parent", { children: [a, bWithParent, c] });
    const middle = navElement("b", { parent: parentReal });

    const { prev, next, parent: p, firstChild } = getNavigationTargets(middle);

    expect(prev?.getId()).toBe("a");
    expect(next?.getId()).toBe("c");
    expect(p?.getId()).toBe("parent");
    expect(firstChild).toBeNull();
  });

  it("returns null prev at the first sibling and null next at the last", () => {
    const first = navElement("first");
    const last = navElement("last");
    const parent = navElement("parent", { children: [first, last] });

    const firstNode = navElement("first", { parent });
    const parentForFirst = navElement("parent", { children: [firstNode, last] });
    const firstWired = navElement("first", { parent: parentForFirst });

    const targets = getNavigationTargets(firstWired);
    expect(targets.prev).toBeNull();
    expect(targets.next?.getId()).toBe("last");
  });

  it("returns the firstChild when the element has children", () => {
    const child1 = navElement("child-1");
    const child2 = navElement("child-2");
    const el = navElement("el", { children: [child1, child2] });

    const { firstChild, parent } = getNavigationTargets(el);
    expect(firstChild?.getId()).toBe("child-1");
    // No parent → prev/next both null
    expect(parent).toBeNull();
  });

  it("returns all-null when the element is a detached root (no parent, no children)", () => {
    const orphan = navElement("orphan");
    expect(getNavigationTargets(orphan)).toEqual({
      prev: null,
      next: null,
      parent: null,
      firstChild: null,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// moveElementPosition
// ─────────────────────────────────────────────────────────────────────────────

/** Composer stub whose getElement returns a style-tracking element. */
function makeMoveComposer(styles: Record<string, string>) {
  const setStyle = vi.fn((prop: string, value: string) => {
    styles[prop] = value;
  });
  const element = {
    getStyles: () => styles,
    setStyle,
  } as unknown as Element;
  const beginTransaction = vi.fn();
  const endTransaction = vi.fn();
  const composer = {
    elements: { getElement: vi.fn(() => element) },
    beginTransaction,
    endTransaction,
  } as unknown as Composer;
  return { composer, setStyle, beginTransaction, endTransaction };
}

describe("moveElementPosition", () => {
  it("adjusts top/left for absolute-positioned elements", () => {
    const { composer, setStyle } = makeMoveComposer({
      position: "absolute",
      top: "10px",
      left: "20px",
    });

    moveElementPosition(composer, "el", 5, -3);

    expect(setStyle).toHaveBeenCalledWith("top", "7px"); // 10 + (-3)
    expect(setStyle).toHaveBeenCalledWith("left", "25px"); // 20 + 5
  });

  it("treats fixed like absolute and defaults missing top/left to 0", () => {
    const { composer, setStyle } = makeMoveComposer({ position: "fixed" });

    moveElementPosition(composer, "el", 4, 8);

    expect(setStyle).toHaveBeenCalledWith("top", "8px");
    expect(setStyle).toHaveBeenCalledWith("left", "4px");
  });

  it("uses transform translate for static/relative flow elements", () => {
    const { composer, setStyle } = makeMoveComposer({ position: "static" });

    moveElementPosition(composer, "el", 12, -6);

    expect(setStyle).toHaveBeenCalledWith("transform", "translate(12px, -6px)");
  });

  it("accumulates onto an existing translate and preserves other transforms", () => {
    const { composer, setStyle } = makeMoveComposer({
      // no explicit position → defaults to "static" branch
      transform: "translate(10px, 5px) rotate(45deg)",
    });

    moveElementPosition(composer, "el", 3, 4);

    expect(setStyle).toHaveBeenCalledWith("transform", "translate(13px, 9px) rotate(45deg)");
  });

  it("wraps mutations in a keyboard-move transaction", () => {
    const { composer, beginTransaction, endTransaction } = makeMoveComposer({
      position: "absolute",
    });

    moveElementPosition(composer, "el", 1, 1);

    expect(beginTransaction).toHaveBeenCalledWith("keyboard-move");
    expect(endTransaction).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when the element does not exist", () => {
    const beginTransaction = vi.fn();
    const composer = {
      elements: { getElement: vi.fn(() => null) },
      beginTransaction,
      endTransaction: vi.fn(),
    } as unknown as Composer;

    moveElementPosition(composer, "missing", 5, 5);

    expect(beginTransaction).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// reorderElement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Element with a parent whose children list drives reorder indices.
 *
 * `moveElement` here is not a bare spy: it REPLAYS ElementCRUD.moveElement's
 * same-parent index rule (a slot in the pre-removal list, decremented when it
 * sits after the element) and exposes the resulting order. Asserting the
 * argument alone is what let ⌥↓ ship as a silent no-op — target+1 came back
 * as target and the element never moved. Assert `order()`, not the number.
 */
function makeReorderFixture(selectedId: string, childIds: string[]) {
  let ids = [...childIds];
  const children = () => ids.map((id) => ({ getId: () => id }) as unknown as Element);
  const parent = {
    getId: () => "parent",
    getChildren: children,
  } as unknown as Element;
  const element = {
    getParent: () => parent,
  } as unknown as Element;
  const moveElement = vi.fn((id: string, _parentId: string, index: number) => {
    const oldIndex = ids.indexOf(id);
    if (oldIndex === -1) return false;
    let adjusted = index;
    if (oldIndex > -1 && oldIndex < adjusted) adjusted = Math.max(0, adjusted - 1);
    adjusted = Math.min(Math.max(adjusted, 0), ids.length - 1);
    ids = ids.filter((x) => x !== id);
    ids.splice(adjusted, 0, id);
    return true;
  });
  const composer = {
    elements: { moveElement },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  } as unknown as Composer;
  return { element, composer, moveElement, order: () => ids.join(","), selectedId };
}

describe("reorderElement", () => {
  it("moves up one slot", () => {
    const { element, composer, order } = makeReorderFixture("b", ["a", "b", "c"]);
    reorderElement(element, composer, "b", "up");
    expect(order()).toBe("b,a,c");
  });

  it("moves down one slot", () => {
    const { element, composer, order } = makeReorderFixture("b", ["a", "b", "c"]);
    reorderElement(element, composer, "b", "down");
    expect(order()).toBe("a,c,b");
  });

  it("moves to first", () => {
    const { element, composer, order } = makeReorderFixture("c", ["a", "b", "c"]);
    reorderElement(element, composer, "c", "first");
    expect(order()).toBe("c,a,b");
  });

  it("moves to last — all the way, not one short", () => {
    const { element, composer, order } = makeReorderFixture("a", ["a", "b", "c", "d"]);
    reorderElement(element, composer, "a", "last");
    expect(order()).toBe("b,c,d,a");
  });

  it("moving down from the middle of four lands after exactly one sibling", () => {
    const { element, composer, order } = makeReorderFixture("b", ["a", "b", "c", "d"]);
    reorderElement(element, composer, "b", "down");
    expect(order()).toBe("a,c,b,d");
  });

  it("does nothing when moving up from the first position", () => {
    const { element, composer, moveElement } = makeReorderFixture("a", ["a", "b", "c"]);
    reorderElement(element, composer, "a", "up");
    expect(moveElement).not.toHaveBeenCalled();
  });

  it("does nothing when moving down from the last position", () => {
    const { element, composer, moveElement } = makeReorderFixture("c", ["a", "b", "c"]);
    reorderElement(element, composer, "c", "down");
    expect(moveElement).not.toHaveBeenCalled();
  });

  it("does nothing when the element has no parent", () => {
    const element = { getParent: () => null } as unknown as Element;
    const moveElement = vi.fn();
    const composer = {
      elements: { moveElement },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
    } as unknown as Composer;
    reorderElement(element, composer, "x", "up");
    expect(moveElement).not.toHaveBeenCalled();
  });

  it("does nothing when the selected id is not among siblings", () => {
    const { element, composer, moveElement } = makeReorderFixture("ghost", ["a", "b"]);
    reorderElement(element, composer, "ghost", "up");
    expect(moveElement).not.toHaveBeenCalled();
  });
});
