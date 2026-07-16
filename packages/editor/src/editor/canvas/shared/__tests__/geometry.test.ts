/**
 * shared/geometry — pure rect/point math.
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import {
  domRectToRect,
  rectToEdges,
  getRectCenter,
  isPointInRect,
  rectsIntersect,
  rectContains,
  getIntersection,
  getBoundingRect,
  expandRect,
  distanceBetween,
  distanceToRect,
  viewportToCanvas,
  canvasToViewport,
  getClosestEdge,
  getRelativePosition,
  clampPointToRect,
} from "../geometry";

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

describe("geometry — conversions", () => {
  it("domRectToRect keeps x/y/width/height", () => {
    const dom = { x: 5, y: 10, width: 100, height: 50 } as DOMRect;
    expect(domRectToRect(dom)).toEqual(rect(5, 10, 100, 50));
  });

  it("rectToEdges computes all four edges", () => {
    expect(rectToEdges(rect(10, 20, 30, 40))).toEqual({
      top: 20,
      right: 40,
      bottom: 60,
      left: 10,
    });
  });

  it("getRectCenter returns the midpoint", () => {
    expect(getRectCenter(rect(0, 0, 100, 50))).toEqual({ x: 50, y: 25 });
  });
});

describe("geometry — hit testing", () => {
  it("isPointInRect is inclusive on all edges", () => {
    const r = rect(0, 0, 10, 10);
    expect(isPointInRect({ x: 0, y: 0 }, r)).toBe(true);
    expect(isPointInRect({ x: 10, y: 10 }, r)).toBe(true);
    expect(isPointInRect({ x: 5, y: 5 }, r)).toBe(true);
    expect(isPointInRect({ x: 10.01, y: 5 }, r)).toBe(false);
    expect(isPointInRect({ x: -0.01, y: 5 }, r)).toBe(false);
  });

  it("rectsIntersect detects overlap and separation", () => {
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(true);
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(20, 0, 10, 10))).toBe(false);
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(0, 20, 10, 10))).toBe(false);
    // Touching edges count as intersecting (uses < not <=)
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBe(true);
  });

  it("rectContains requires full containment", () => {
    const outer = rect(0, 0, 100, 100);
    expect(rectContains(outer, rect(10, 10, 20, 20))).toBe(true);
    expect(rectContains(outer, rect(90, 90, 20, 20))).toBe(false);
    expect(rectContains(outer, rect(0, 0, 100, 100))).toBe(true); // identical
  });
});

describe("geometry — intersections and bounds", () => {
  it("getIntersection returns the overlap rect", () => {
    expect(getIntersection(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toEqual(rect(5, 5, 5, 5));
  });

  it("getIntersection returns null when disjoint or merely touching", () => {
    expect(getIntersection(rect(0, 0, 10, 10), rect(20, 20, 5, 5))).toBeNull();
    // width/height of 0 → <= 0 guard → null
    expect(getIntersection(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBeNull();
  });

  it("getBoundingRect unions rects and returns null for empty input", () => {
    expect(getBoundingRect([])).toBeNull();
    expect(getBoundingRect([rect(0, 0, 10, 10), rect(20, 30, 10, 10)])).toEqual(
      rect(0, 0, 30, 40),
    );
  });

  it("expandRect pads all sides symmetrically", () => {
    expect(expandRect(rect(10, 10, 20, 20), 5)).toEqual(rect(5, 5, 30, 30));
  });
});

describe("geometry — distances", () => {
  it("distanceBetween is euclidean", () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("distanceToRect is 0 inside, edge distance outside", () => {
    const r = rect(0, 0, 10, 10);
    expect(distanceToRect({ x: 5, y: 5 }, r)).toBe(0);
    expect(distanceToRect({ x: 13, y: 14 }, r)).toBe(5); // closest corner (10,10)
    expect(distanceToRect({ x: -3, y: 5 }, r)).toBe(3); // left edge
  });
});

describe("geometry — coordinate transforms", () => {
  const canvasRect = { x: 100, y: 50 } as DOMRect;

  it("viewportToCanvas divides by zoom after removing canvas offset", () => {
    expect(viewportToCanvas({ x: 300, y: 250 }, canvasRect, 2)).toEqual({ x: 100, y: 100 });
  });

  it("canvasToViewport is the inverse of viewportToCanvas", () => {
    const original = { x: 123, y: 45 };
    const round = viewportToCanvas(canvasToViewport(original, canvasRect, 1.5), canvasRect, 1.5);
    expect(round.x).toBeCloseTo(original.x);
    expect(round.y).toBeCloseTo(original.y);
  });
});

describe("geometry — edges and relative positions", () => {
  const r = rect(0, 0, 100, 100);

  it("getClosestEdge picks the nearest edge (tie order: top, bottom, left, right)", () => {
    expect(getClosestEdge({ x: 50, y: 5 }, r)).toBe("top");
    expect(getClosestEdge({ x: 50, y: 95 }, r)).toBe("bottom");
    expect(getClosestEdge({ x: 5, y: 50 }, r)).toBe("left");
    expect(getClosestEdge({ x: 95, y: 50 }, r)).toBe("right");
    // Dead center — all distances equal, top wins by check order
    expect(getClosestEdge({ x: 50, y: 50 }, r)).toBe("top");
  });

  it("getRelativePosition maps rect corners to 0..1", () => {
    expect(getRelativePosition({ x: 0, y: 0 }, r)).toEqual({ x: 0, y: 0 });
    expect(getRelativePosition({ x: 100, y: 100 }, r)).toEqual({ x: 1, y: 1 });
    expect(getRelativePosition({ x: 25, y: 75 }, r)).toEqual({ x: 0.25, y: 0.75 });
  });

  it("clampPointToRect clamps outside points to the boundary", () => {
    expect(clampPointToRect({ x: -10, y: 200 }, r)).toEqual({ x: 0, y: 100 });
    expect(clampPointToRect({ x: 50, y: 50 }, r)).toEqual({ x: 50, y: 50 });
  });
});
