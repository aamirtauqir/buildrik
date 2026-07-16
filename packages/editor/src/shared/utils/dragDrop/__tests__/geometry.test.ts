/**
 * dragDrop geometry tests — distance metrics, point/rect operations,
 * grid snapping, axis constraints, event positions, and collision math.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  distance,
  manhattanDistance,
  pointInRect,
  getRectCenter,
  clampToRect,
  snapToGrid,
  applyAxisConstraint,
  domRectToRect,
  getEventPosition,
  getPagePosition,
  rectsOverlap,
  getOverlapArea,
  findMostOverlapping,
} from "../geometry";
import type { Rect } from "../types";

const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
});

describe("distance / manhattanDistance", () => {
  it("computes euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  it("computes manhattan distance", () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    expect(manhattanDistance({ x: 2, y: 2 }, { x: -1, y: 0 })).toBe(5);
  });
});

describe("pointInRect", () => {
  const r = rect(10, 10, 100, 50);

  it("is inclusive on all four edges", () => {
    expect(pointInRect({ x: 10, y: 10 }, r)).toBe(true);
    expect(pointInRect({ x: 110, y: 60 }, r)).toBe(true);
    expect(pointInRect({ x: 50, y: 30 }, r)).toBe(true);
  });

  it("rejects points outside", () => {
    expect(pointInRect({ x: 9.99, y: 30 }, r)).toBe(false);
    expect(pointInRect({ x: 50, y: 60.01 }, r)).toBe(false);
  });
});

describe("getRectCenter / clampToRect / snapToGrid", () => {
  it("returns the midpoint of a rect", () => {
    expect(getRectCenter(rect(0, 0, 100, 50))).toEqual({ x: 50, y: 25 });
  });

  it("clamps points into the bounds", () => {
    const bounds = rect(0, 0, 100, 100);
    expect(clampToRect({ x: -10, y: 50 }, bounds)).toEqual({ x: 0, y: 50 });
    expect(clampToRect({ x: 150, y: 150 }, bounds)).toEqual({ x: 100, y: 100 });
    expect(clampToRect({ x: 50, y: 50 }, bounds)).toEqual({ x: 50, y: 50 });
  });

  it("snaps to the nearest grid intersection", () => {
    expect(snapToGrid({ x: 13, y: 17 }, 10)).toEqual({ x: 10, y: 20 });
    expect(snapToGrid({ x: 15, y: 25 }, 10)).toEqual({ x: 20, y: 30 }); // .5 rounds up
    expect(snapToGrid({ x: 4, y: 4 }, 8)).toEqual({ x: 8, y: 8 });
  });
});

describe("applyAxisConstraint", () => {
  const delta = { x: 5, y: 7 };

  it("zeroes the orthogonal axis", () => {
    expect(applyAxisConstraint(delta, "x")).toEqual({ x: 5, y: 0 });
    expect(applyAxisConstraint(delta, "y")).toEqual({ x: 0, y: 7 });
  });

  it("passes through when unconstrained ('none')", () => {
    expect(applyAxisConstraint(delta, "none")).toEqual(delta);
  });
});

describe("domRectToRect", () => {
  it("maps left/top to x/y", () => {
    const domRect = { left: 5, top: 6, width: 7, height: 8 } as DOMRect;
    expect(domRectToRect(domRect)).toEqual({ x: 5, y: 6, width: 7, height: 8 });
  });
});

describe("getEventPosition / getPagePosition", () => {
  it("reads clientX/Y from mouse events", () => {
    const e = new MouseEvent("mousedown", { clientX: 12, clientY: 34 });
    expect(getEventPosition(e)).toEqual({ x: 12, y: 34 });
  });

  it("reads the first active touch", () => {
    const e = {
      touches: [{ clientX: 1, clientY: 2, pageX: 3, pageY: 4 }],
      changedTouches: [],
    } as unknown as TouchEvent;
    expect(getEventPosition(e)).toEqual({ x: 1, y: 2 });
    expect(getPagePosition(e)).toEqual({ x: 3, y: 4 });
  });

  it("falls back to changedTouches on touchend-style events", () => {
    const e = {
      touches: [],
      changedTouches: [{ clientX: 9, clientY: 8, pageX: 7, pageY: 6 }],
    } as unknown as TouchEvent;
    expect(getEventPosition(e)).toEqual({ x: 9, y: 8 });
    expect(getPagePosition(e)).toEqual({ x: 7, y: 6 });
  });

  it("returns origin for objects with no position info", () => {
    expect(getEventPosition({} as MouseEvent)).toEqual({ x: 0, y: 0 });
    expect(getPagePosition({} as MouseEvent)).toEqual({ x: 0, y: 0 });
  });
});

describe("rectsOverlap / getOverlapArea", () => {
  it("detects overlapping and disjoint rects", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(true);
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(20, 20, 5, 5))).toBe(false);
  });

  it("treats edge-touching rects as overlapping (inclusive bounds)", () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBe(true);
  });

  it("computes intersection area (0 when disjoint)", () => {
    expect(getOverlapArea(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(25);
    expect(getOverlapArea(rect(0, 0, 10, 10), rect(0, 0, 10, 10))).toBe(100);
    expect(getOverlapArea(rect(0, 0, 10, 10), rect(50, 50, 10, 10))).toBe(0);
  });
});

describe("findMostOverlapping", () => {
  const el = (id: string) => {
    const div = document.createElement("div");
    div.id = id;
    return div;
  };

  it("returns the candidate with the largest overlap area", () => {
    const dragRect = rect(0, 0, 10, 10);
    const small = { element: el("small"), rect: rect(8, 8, 10, 10) }; // 4px²
    const big = { element: el("big"), rect: rect(2, 2, 10, 10) }; // 64px²

    expect(findMostOverlapping(dragRect, [small, big])).toBe(big.element);
  });

  it("returns null when nothing overlaps with positive area", () => {
    const dragRect = rect(0, 0, 10, 10);
    const far = { element: el("far"), rect: rect(100, 100, 10, 10) };
    // edge-touch has zero area → still no match
    const touch = { element: el("touch"), rect: rect(10, 0, 10, 10) };

    expect(findMostOverlapping(dragRect, [far, touch])).toBeNull();
  });
});
