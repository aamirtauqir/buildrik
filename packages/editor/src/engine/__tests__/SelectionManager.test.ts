/**
 * SelectionManager — baseline test coverage (E-020)
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EVENTS } from "../../shared/constants/events";
import { SelectionManager } from "../SelectionManager";
import type { Element } from "../elements/Element";

interface MockElementOptions {
  parent?: MockElement | null;
  children?: MockElement[];
}

class MockElement {
  private parent: MockElement | null;
  private children: MockElement[];

  constructor(public readonly id: string, opts: MockElementOptions = {}) {
    this.parent = opts.parent ?? null;
    this.children = opts.children ?? [];
    this.children.forEach((c) => c.setParent(this));
  }

  setParent(p: MockElement | null): void { this.parent = p; }
  getId(): string { return this.id; }
  getParent(): MockElement | null { return this.parent; }
  getChildren(): MockElement[] { return this.children; }
  getChildAt(i: number): MockElement | null { return this.children[i] ?? null; }
  getChildIndex(child: MockElement): number { return this.children.indexOf(child); }
}

const asElement = (m: MockElement): Element => m as unknown as Element;

interface MockComposer {
  emit: ReturnType<typeof vi.fn>;
  elements: {
    getActivePage: ReturnType<typeof vi.fn>;
    getElement: ReturnType<typeof vi.fn>;
  };
}

function makeMockComposer(): MockComposer {
  return {
    emit: vi.fn(),
    elements: {
      getActivePage: vi.fn(() => null),
      getElement: vi.fn(() => null),
    },
  };
}

describe("SelectionManager", () => {
  let composer: MockComposer;
  let sm: SelectionManager;
  let a: MockElement;
  let b: MockElement;
  let c: MockElement;

  beforeEach(() => {
    composer = makeMockComposer();
    sm = new SelectionManager(composer as never);
    a = new MockElement("a");
    b = new MockElement("b");
    c = new MockElement("c");
  });

  describe("select / clear", () => {
    it("select(element) sets selected + emits ELEMENT_SELECTED", () => {
      sm.select(asElement(a));
      expect(sm.getSelected()?.getId()).toBe("a");
      expect(sm.hasSelection()).toBe(true);
      expect(sm.getCount()).toBe(1);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_SELECTED, asElement(a));
    });

    it("select(element) emits ELEMENT_DESELECTED for previous", () => {
      sm.select(asElement(a));
      composer.emit.mockClear();
      sm.select(asElement(b));
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_SELECTED, asElement(b));
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_DESELECTED, asElement(a));
    });

    it("select(same) is a no-op (no re-emit)", () => {
      sm.select(asElement(a));
      composer.emit.mockClear();
      sm.select(asElement(a));
      expect(composer.emit).not.toHaveBeenCalled();
    });

    it("select(null) clears selected without emitting CLEARED (it's not a clear() call)", () => {
      sm.select(asElement(a));
      composer.emit.mockClear();
      sm.select(null);
      expect(sm.getSelected()).toBeNull();
      expect(sm.hasSelection()).toBe(false);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_SELECTED, null);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_DESELECTED, asElement(a));
    });

    it("clear() emits SELECTION_CLEARED only when there was a selection", () => {
      sm.clear();
      expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.SELECTION_CLEARED);
      sm.select(asElement(a));
      composer.emit.mockClear();
      sm.clear();
      expect(sm.getCount()).toBe(0);
      expect(sm.hasSelection()).toBe(false);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.SELECTION_CLEARED);
    });
  });

  describe("multi-select", () => {
    it("addToSelection promotes to selected when none + emits SELECTION_ADDED", () => {
      sm.addToSelection(asElement(a));
      expect(sm.getSelected()?.getId()).toBe("a");
      expect(sm.getCount()).toBe(1);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.SELECTION_ADDED, asElement(a));
    });

    it("addToSelection on duplicate is a no-op", () => {
      sm.addToSelection(asElement(a));
      composer.emit.mockClear();
      sm.addToSelection(asElement(a));
      expect(composer.emit).not.toHaveBeenCalled();
    });

    it("toggle(element) adds when absent, removes when present", () => {
      sm.toggle(asElement(a));
      expect(sm.isSelected(asElement(a))).toBe(true);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.SELECTION_ADDED, asElement(a));
      composer.emit.mockClear();
      sm.toggle(asElement(a));
      expect(sm.isSelected(asElement(a))).toBe(false);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.SELECTION_REMOVED, asElement(a));
    });

    it("removeFromSelection picks a new primary when removing the selected", () => {
      sm.addToSelection(asElement(a));
      sm.addToSelection(asElement(b));
      expect(sm.getSelected()?.getId()).toBe("a");
      sm.removeFromSelection(asElement(a));
      expect(sm.getCount()).toBe(1);
      expect(sm.getSelected()?.getId()).toBe("b");
    });

    it("isMultiSelect is true when 2+ elements selected", () => {
      sm.addToSelection(asElement(a));
      expect(sm.isMultiSelect()).toBe(false);
      sm.addToSelection(asElement(b));
      expect(sm.isMultiSelect()).toBe(true);
    });

    it("getSelectedIds returns ids of all selected", () => {
      sm.addToSelection(asElement(a));
      sm.addToSelection(asElement(b));
      expect(sm.getSelectedIds().sort()).toEqual(["a", "b"]);
    });

    it("select(x) collapses prior multi-select to a single", () => {
      sm.addToSelection(asElement(a));
      sm.addToSelection(asElement(b));
      sm.select(asElement(c));
      expect(sm.getCount()).toBe(1);
      expect(sm.getSelected()?.getId()).toBe("c");
    });
  });

  describe("traversal", () => {
    it("selectParent moves selection to parent when one exists", () => {
      const parent = new MockElement("p", { children: [a] });
      sm.select(asElement(a));
      sm.selectParent();
      expect(sm.getSelected()?.getId()).toBe("p");
      expect(parent.getId()).toBe("p"); // sanity for the closure
    });

    it("selectParent is a no-op at root (no parent)", () => {
      sm.select(asElement(a));
      composer.emit.mockClear();
      sm.selectParent();
      expect(sm.getSelected()?.getId()).toBe("a");
      expect(composer.emit).not.toHaveBeenCalled();
    });

    it("selectFirstChild moves to first child", () => {
      const parent = new MockElement("p", { children: [a, b] });
      sm.select(asElement(parent));
      sm.selectFirstChild();
      expect(sm.getSelected()?.getId()).toBe("a");
    });

    it("selectNextSibling and selectPrevSibling navigate siblings", () => {
      new MockElement("p", { children: [a, b, c] });
      sm.select(asElement(b));
      sm.selectNextSibling();
      expect(sm.getSelected()?.getId()).toBe("c");
      sm.selectPrevSibling();
      expect(sm.getSelected()?.getId()).toBe("b");
      sm.selectPrevSibling();
      expect(sm.getSelected()?.getId()).toBe("a");
    });

    it("selectNextSibling on last child is a no-op", () => {
      new MockElement("p", { children: [a, b] });
      sm.select(asElement(b));
      sm.selectNextSibling();
      expect(sm.getSelected()?.getId()).toBe("b");
    });
  });

  describe("selectMultiple / selectAll", () => {
    it("selectMultiple([]) is a no-op for empty input", () => {
      sm.selectMultiple([]);
      expect(sm.getCount()).toBe(0);
      expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.SELECTION_MULTIPLE, expect.anything());
    });

    it("selectMultiple sets first as primary + emits MULTIPLE then SELECTED", () => {
      sm.selectMultiple([asElement(a), asElement(b), asElement(c)]);
      expect(sm.getCount()).toBe(3);
      expect(sm.getSelected()?.getId()).toBe("a");
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.SELECTION_MULTIPLE, expect.any(Array));
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_SELECTED, asElement(a));
    });

    it("selectAll picks every non-root descendant via composer.elements", () => {
      const root = new MockElement("root", { children: [a, b] });
      const grand = new MockElement("g", { children: [] });
      a.setParent(root);
      const aWithChild = new MockElement("a", { children: [grand] });
      grand.setParent(aWithChild);
      const newRoot = new MockElement("root2", { children: [aWithChild, b] });
      composer.elements.getActivePage.mockReturnValue({ root: { id: "root2" } });
      composer.elements.getElement.mockReturnValue(newRoot);
      sm.selectAll();
      expect(sm.getCount()).toBe(3);
      expect(sm.getSelectedIds().sort()).toEqual(["a", "b", "g"]);
    });

    it("selectAll bails when no active page", () => {
      composer.elements.getActivePage.mockReturnValue(null);
      sm.selectAll();
      expect(sm.getCount()).toBe(0);
    });
  });

  describe("reselect", () => {
    it("reselect re-emits ELEMENT_SELECTED for current", () => {
      sm.select(asElement(a));
      composer.emit.mockClear();
      sm.reselect();
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_SELECTED, asElement(a));
    });

    it("reselect with no selection is a no-op", () => {
      sm.reselect();
      expect(composer.emit).not.toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("destroy clears selection", () => {
      sm.select(asElement(a));
      sm.destroy();
      expect(sm.hasSelection()).toBe(false);
      expect(sm.getCount()).toBe(0);
    });
  });
});
