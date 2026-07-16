/**
 * dragDrop positioning — index resolution + drop-position geometry.
 * Pure math: calculateFinalIndex, wouldMoveChangePosition,
 * calculateInsertionIndex, calculateDropPosition{,2D,4D},
 * getContainerScrollOffset, isHorizontalLayout.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { Element } from "../../../../engine/elements/Element";
import type { Rect } from "../types";
import {
  calculateFinalIndex,
  wouldMoveChangePosition,
  calculateInsertionIndex,
  calculateDropPosition,
  calculateDropPosition2D,
  calculateDropPosition4D,
  getContainerScrollOffset,
  isHorizontalLayout,
} from "../positioning";

// Minimal Element stand-in exposing only what positioning.ts calls.
class MockEl {
  private parent: MockEl | null = null;
  private children: MockEl[] = [];
  constructor(public id: string) {}
  setParent(p: MockEl | null): void {
    this.parent = p;
  }
  setChildren(c: MockEl[]): void {
    this.children = c;
    c.forEach((child) => child.setParent(this));
  }
  getId(): string {
    return this.id;
  }
  getParent(): MockEl | null {
    return this.parent;
  }
  getChildren(): MockEl[] {
    return this.children;
  }
  getChildIndex(child: MockEl): number {
    return this.children.indexOf(child);
  }
}
const asEl = (m: MockEl): Element => m as unknown as Element;

const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
});

describe("calculateFinalIndex", () => {
  it("returns resolvedIndex unchanged when moving across parents", () => {
    const oldParent = new MockEl("old");
    const src = new MockEl("src");
    oldParent.setChildren([src]);
    const newParent = new MockEl("new");
    expect(calculateFinalIndex(asEl(src), asEl(newParent), 3)).toBe(3);
  });

  it("returns resolvedIndex when the source has no parent", () => {
    const src = new MockEl("src");
    const newParent = new MockEl("new");
    expect(calculateFinalIndex(asEl(src), asEl(newParent), 2)).toBe(2);
  });

  it("returns resolvedIndex when source is not found among parent children (-1)", () => {
    const parent = new MockEl("p");
    const src = new MockEl("src");
    // src claims parent but parent doesn't list it → getChildIndex === -1
    src.setParent(parent);
    parent.setChildren([new MockEl("other")]);
    expect(calculateFinalIndex(asEl(src), asEl(parent), 4)).toBe(4);
  });

  it("returns undefined (append) when resolvedIndex is undefined and same parent", () => {
    const parent = new MockEl("p");
    const src = new MockEl("src");
    parent.setChildren([new MockEl("a"), src]);
    expect(calculateFinalIndex(asEl(src), asEl(parent), undefined)).toBeUndefined();
  });

  it("returns the same index when target equals current position", () => {
    const parent = new MockEl("p");
    const a = new MockEl("a");
    const src = new MockEl("src");
    parent.setChildren([a, src]); // src at index 1
    expect(calculateFinalIndex(asEl(src), asEl(parent), 1)).toBe(1);
  });

  it("adjusts index down by 1 when moving forward (removal shifts)", () => {
    const parent = new MockEl("p");
    const src = new MockEl("src");
    const b = new MockEl("b");
    const c = new MockEl("c");
    parent.setChildren([src, b, c]); // src at index 0
    // moving forward to index 2 → 1 after self-removal
    expect(calculateFinalIndex(asEl(src), asEl(parent), 2)).toBe(1);
  });

  it("leaves index unchanged when moving backward", () => {
    const parent = new MockEl("p");
    const a = new MockEl("a");
    const b = new MockEl("b");
    const src = new MockEl("src");
    parent.setChildren([a, b, src]); // src at index 2
    expect(calculateFinalIndex(asEl(src), asEl(parent), 0)).toBe(0);
  });
});

describe("wouldMoveChangePosition", () => {
  it("is true when moving to a different parent", () => {
    const oldParent = new MockEl("old");
    const src = new MockEl("src");
    oldParent.setChildren([src]);
    const newParent = new MockEl("new");
    expect(wouldMoveChangePosition(asEl(src), asEl(newParent), 0)).toBe(true);
  });

  it("is true when source has no parent", () => {
    const src = new MockEl("src");
    const newParent = new MockEl("new");
    expect(wouldMoveChangePosition(asEl(src), asEl(newParent), 0)).toBe(true);
  });

  it("append (undefined) is a no-op only when already last child", () => {
    const parent = new MockEl("p");
    const a = new MockEl("a");
    const src = new MockEl("src");
    parent.setChildren([a, src]); // src is last (index 1), childCount 2
    expect(wouldMoveChangePosition(asEl(src), asEl(parent), undefined)).toBe(false);
  });

  it("append (undefined) is a change when not currently last", () => {
    const parent = new MockEl("p");
    const src = new MockEl("src");
    const b = new MockEl("b");
    parent.setChildren([src, b]); // src at index 0, not last
    expect(wouldMoveChangePosition(asEl(src), asEl(parent), undefined)).toBe(true);
  });

  it("is false when final index equals current index", () => {
    const parent = new MockEl("p");
    const a = new MockEl("a");
    const src = new MockEl("src");
    parent.setChildren([a, src]); // src index 1
    expect(wouldMoveChangePosition(asEl(src), asEl(parent), 1)).toBe(false);
  });

  it("is true when final index differs from current index", () => {
    const parent = new MockEl("p");
    const a = new MockEl("a");
    const src = new MockEl("src");
    parent.setChildren([a, src]); // src index 1
    expect(wouldMoveChangePosition(asEl(src), asEl(parent), 0)).toBe(true);
  });
});

describe("calculateInsertionIndex", () => {
  it("before → siblingIndex", () => {
    expect(calculateInsertionIndex("before", 3, 10)).toBe(3);
  });
  it("after → siblingIndex + 1", () => {
    expect(calculateInsertionIndex("after", 3, 10)).toBe(4);
  });
  it("first → 0", () => {
    expect(calculateInsertionIndex("first", 3, 10)).toBe(0);
  });
  it("last → undefined (append)", () => {
    expect(calculateInsertionIndex("last", 3, 10)).toBeUndefined();
  });
  it("inside → undefined (append)", () => {
    expect(calculateInsertionIndex("inside", 3, 10)).toBeUndefined();
  });
});

describe("calculateDropPosition (vertical)", () => {
  const r = rect(0, 100, 200, 100); // top=100, height=100 → edge=25

  it("returns before near the top edge", () => {
    expect(calculateDropPosition(110, r)).toBe("before"); // relY=10 < 25
  });

  it("returns after near the bottom edge", () => {
    expect(calculateDropPosition(190, r)).toBe("after"); // relY=90 > 75
  });

  it("returns inside in the middle when allowed", () => {
    expect(calculateDropPosition(150, r)).toBe("inside"); // relY=50
  });

  it("returns after in the middle when inside is disallowed", () => {
    expect(calculateDropPosition(150, r, false)).toBe("after");
  });

  it("honors scrollOffset when computing the relative Y", () => {
    // mouseY 60 + scroll 50 = 110 → relY 10 → before
    expect(calculateDropPosition(60, r, true, 0.25, 50)).toBe("before");
  });

  it("uses DOMRect.top branch when a top field is present", () => {
    const domish = { top: 100, height: 100, y: 999 } as unknown as DOMRect;
    expect(calculateDropPosition(110, domish)).toBe("before");
  });
});

describe("calculateDropPosition2D (horizontal)", () => {
  const r = rect(50, 0, 100, 40); // left=50, width=100 → edge=25

  it("before near the left edge", () => {
    expect(calculateDropPosition2D(60, 0, r, true)).toBe("before"); // relX=10
  });

  it("after near the right edge", () => {
    expect(calculateDropPosition2D(140, 0, r, true)).toBe("after"); // relX=90
  });

  it("inside in the horizontal middle", () => {
    expect(calculateDropPosition2D(100, 0, r, true)).toBe("inside"); // relX=50
  });

  it("delegates to vertical calculation when not horizontal", () => {
    const vr = rect(0, 100, 200, 100);
    expect(calculateDropPosition2D(0, 110, vr, false)).toBe("before");
  });

  it("applies x scrollOffset in horizontal mode", () => {
    expect(calculateDropPosition2D(50, 0, r, true, 0.25, { x: 10, y: 0 })).toBe("before");
  });
});

describe("calculateDropPosition4D", () => {
  const r = rect(0, 0, 100, 100); // edgeX=25, edgeY=25

  it("top edge wins first", () => {
    expect(calculateDropPosition4D({ x: 50, y: 10 }, r)).toEqual({
      position: "before",
      edge: "top",
    });
  });

  it("bottom edge", () => {
    expect(calculateDropPosition4D({ x: 50, y: 90 }, r)).toEqual({
      position: "after",
      edge: "bottom",
    });
  });

  it("left edge", () => {
    expect(calculateDropPosition4D({ x: 10, y: 50 }, r)).toEqual({
      position: "before",
      edge: "left",
    });
  });

  it("right edge", () => {
    expect(calculateDropPosition4D({ x: 90, y: 50 }, r)).toEqual({
      position: "after",
      edge: "right",
    });
  });

  it("center when in the interior", () => {
    expect(calculateDropPosition4D({ x: 50, y: 50 }, r)).toEqual({
      position: "inside",
      edge: "center",
    });
  });

  it("applies scrollOffset before edge detection", () => {
    expect(calculateDropPosition4D({ x: 50, y: 5 }, r, 0.25, { x: 0, y: 5 })).toEqual({
      position: "before",
      edge: "top",
    });
  });
});

describe("getContainerScrollOffset", () => {
  it("returns zero offset for null", () => {
    expect(getContainerScrollOffset(null)).toEqual({ x: 0, y: 0 });
  });

  it("reads scrollLeft / scrollTop from an element", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollLeft", { value: 12, configurable: true });
    Object.defineProperty(el, "scrollTop", { value: 34, configurable: true });
    expect(getContainerScrollOffset(el)).toEqual({ x: 12, y: 34 });
  });
});

describe("isHorizontalLayout", () => {
  it("is true for flex row", () => {
    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.flexDirection = "row";
    expect(isHorizontalLayout(el)).toBe(true);
  });

  it("is false for flex column", () => {
    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.flexDirection = "column";
    expect(isHorizontalLayout(el)).toBe(false);
  });

  it("is false for a plain block element", () => {
    const el = document.createElement("div");
    el.style.display = "block";
    expect(isHorizontalLayout(el)).toBe(false);
  });
});
