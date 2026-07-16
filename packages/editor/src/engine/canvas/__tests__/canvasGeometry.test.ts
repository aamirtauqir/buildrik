/**
 * canvasGeometry tests — rect utilities and DOM-backed bounds helpers.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getCanvasRect,
  getElementBounds,
  getElementBoundsWithSpacing,
  getAllElementBounds,
  getElementRotation,
  domRectToRect,
  pointInRect,
  getRectCenter,
  getRectEdges,
  rectsOverlap,
  clampToRect,
  distance,
} from "../canvasGeometry";
import type { Rect } from "../canvasGeometry";

function mockRect(
  el: HTMLElement,
  rect: { left: number; top: number; width: number; height: number }
) {
  el.getBoundingClientRect = () =>
    ({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function addCanvas(rect = { left: 100, top: 50, width: 1200, height: 900 }): HTMLElement {
  const canvas = document.createElement("div");
  canvas.setAttribute("data-buildrick-canvas", "");
  mockRect(canvas, rect);
  document.body.appendChild(canvas);
  return canvas;
}

beforeEach(() => {
  document.body.replaceChildren();
});

// ============================================
// Pure rect utilities
// ============================================

describe("domRectToRect", () => {
  it("maps left/top to x/y and copies dimensions", () => {
    const domRect = { left: 5, top: 6, width: 7, height: 8 } as DOMRect;
    expect(domRectToRect(domRect)).toEqual({ x: 5, y: 6, width: 7, height: 8 });
  });
});

describe("pointInRect", () => {
  const rect: Rect = { x: 10, y: 20, width: 30, height: 40 };

  it("returns true for a point strictly inside", () => {
    expect(pointInRect(25, 40, rect)).toBe(true);
  });

  it("is inclusive on all four edges", () => {
    expect(pointInRect(10, 20, rect)).toBe(true); // top-left corner
    expect(pointInRect(40, 60, rect)).toBe(true); // bottom-right corner
    expect(pointInRect(10, 40, rect)).toBe(true); // left edge
    expect(pointInRect(40, 40, rect)).toBe(true); // right edge
  });

  it("returns false just outside each edge", () => {
    expect(pointInRect(9.99, 40, rect)).toBe(false);
    expect(pointInRect(40.01, 40, rect)).toBe(false);
    expect(pointInRect(25, 19.99, rect)).toBe(false);
    expect(pointInRect(25, 60.01, rect)).toBe(false);
  });

  it("handles a zero-size rect as a single inclusive point", () => {
    const pt: Rect = { x: 5, y: 5, width: 0, height: 0 };
    expect(pointInRect(5, 5, pt)).toBe(true);
    expect(pointInRect(5.1, 5, pt)).toBe(false);
  });
});

describe("getRectCenter", () => {
  it("returns the midpoint", () => {
    expect(getRectCenter({ x: 10, y: 20, width: 100, height: 50 })).toEqual({ x: 60, y: 45 });
  });

  it("handles odd dimensions with fractional centers", () => {
    expect(getRectCenter({ x: 0, y: 0, width: 5, height: 3 })).toEqual({ x: 2.5, y: 1.5 });
  });
});

describe("getRectEdges", () => {
  it("returns all six edge/center values", () => {
    expect(getRectEdges({ x: 10, y: 20, width: 100, height: 50 })).toEqual({
      left: 10,
      right: 110,
      top: 20,
      bottom: 70,
      centerX: 60,
      centerY: 45,
    });
  });
});

describe("rectsOverlap", () => {
  const a: Rect = { x: 0, y: 0, width: 10, height: 10 };

  it("detects overlapping rects", () => {
    expect(rectsOverlap(a, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
  });

  it("detects containment", () => {
    expect(rectsOverlap(a, { x: 2, y: 2, width: 3, height: 3 })).toBe(true);
  });

  it("is symmetric", () => {
    const b: Rect = { x: 5, y: 5, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(rectsOverlap(b, a));
  });

  it("returns false for disjoint rects", () => {
    expect(rectsOverlap(a, { x: 11, y: 0, width: 5, height: 5 })).toBe(false);
    expect(rectsOverlap(a, { x: 0, y: 11, width: 5, height: 5 })).toBe(false);
  });

  it("treats exactly-touching edges as overlapping (strict < comparison)", () => {
    expect(rectsOverlap(a, { x: 10, y: 0, width: 5, height: 5 })).toBe(true);
    expect(rectsOverlap(a, { x: 0, y: 10, width: 5, height: 5 })).toBe(true);
  });
});

describe("clampToRect", () => {
  // AUDIT NOTE: this is one of 3 duplicate clamp-to-rect implementations in
  // the codebase — these tests pin the CURRENT behavior of this one:
  // clamps into the inclusive range [x, x+width] / [y, y+height].
  const rect: Rect = { x: 10, y: 20, width: 100, height: 50 };

  it("returns interior points unchanged", () => {
    expect(clampToRect(50, 30, rect)).toEqual({ x: 50, y: 30 });
  });

  it("clamps to the left/top edges", () => {
    expect(clampToRect(0, 0, rect)).toEqual({ x: 10, y: 20 });
  });

  it("clamps to the right/bottom edges (x+width / y+height)", () => {
    expect(clampToRect(500, 500, rect)).toEqual({ x: 110, y: 70 });
  });

  it("clamps each axis independently", () => {
    expect(clampToRect(-5, 30, rect)).toEqual({ x: 10, y: 30 });
    expect(clampToRect(50, 999, rect)).toEqual({ x: 50, y: 70 });
  });

  it("points already on the boundary stay put", () => {
    expect(clampToRect(110, 70, rect)).toEqual({ x: 110, y: 70 });
    expect(clampToRect(10, 20, rect)).toEqual({ x: 10, y: 20 });
  });
});

describe("distance", () => {
  it("computes the 3-4-5 triangle", () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  it("is zero for identical points", () => {
    expect(distance(7, 7, 7, 7)).toBe(0);
  });

  it("handles negative coordinates", () => {
    expect(distance(-1, -1, 2, 3)).toBe(5);
  });

  it("is symmetric", () => {
    expect(distance(1, 2, 8, 9)).toBe(distance(8, 9, 1, 2));
  });
});

// ============================================
// DOM-backed helpers (jsdom + mocked rects)
// ============================================

describe("getCanvasRect", () => {
  it("returns a zero rect when no canvas exists", () => {
    expect(getCanvasRect()).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });

  it("returns the canvas bounding rect when present", () => {
    addCanvas({ left: 100, top: 50, width: 1200, height: 900 });
    const rect = getCanvasRect();
    expect(rect.left).toBe(100);
    expect(rect.top).toBe(50);
    expect(rect.width).toBe(1200);
    expect(rect.height).toBe(900);
  });
});

describe("getElementBounds", () => {
  it("returns null for a null element", () => {
    expect(getElementBounds(null as unknown as HTMLElement)).toBeNull();
  });

  it("returns bounds relative to the canvas origin", () => {
    const canvas = addCanvas({ left: 100, top: 50, width: 1200, height: 900 });
    const el = document.createElement("div");
    mockRect(el, { left: 180, top: 130, width: 60, height: 40 });
    canvas.appendChild(el);

    expect(getElementBounds(el)).toEqual({ x: 80, y: 80, width: 60, height: 40, rotation: 0 });
  });

  it("uses viewport coordinates when no canvas exists (zero-rect fallback)", () => {
    const el = document.createElement("div");
    mockRect(el, { left: 25, top: 35, width: 10, height: 20 });
    document.body.appendChild(el);

    expect(getElementBounds(el)).toEqual({ x: 25, y: 35, width: 10, height: 20, rotation: 0 });
  });

  it("includes rotation parsed from the transform style", () => {
    const canvas = addCanvas();
    const el = document.createElement("div");
    mockRect(el, { left: 100, top: 50, width: 10, height: 10 });
    el.style.transform = "rotate(45deg)";
    canvas.appendChild(el);

    expect(getElementBounds(el)?.rotation).toBe(45);
  });
});

describe("getElementRotation", () => {
  it("returns 0 when there is no transform", () => {
    const el = document.createElement("div");
    expect(getElementRotation(el)).toBe(0);
  });

  it("returns 0 for transform 'none'", () => {
    const el = document.createElement("div");
    el.style.transform = "none";
    expect(getElementRotation(el)).toBe(0);
  });

  it("parses rotate() with positive, negative and fractional degrees", () => {
    const el = document.createElement("div");
    el.style.transform = "rotate(30deg)";
    expect(getElementRotation(el)).toBe(30);
    el.style.transform = "rotate(-45deg)";
    expect(getElementRotation(el)).toBe(-45);
    el.style.transform = "rotate(12.5deg)";
    expect(getElementRotation(el)).toBe(12.5);
  });

  it("parses rotate() when combined with other transforms", () => {
    const el = document.createElement("div");
    el.style.transform = "translate(10px, 20px) rotate(90deg)";
    expect(getElementRotation(el)).toBe(90);
  });

  it("derives rotation from a 2D matrix()", () => {
    const el = document.createElement("div");
    // 90deg rotation matrix: cos=0, sin=1
    el.style.transform = "matrix(0, 1, -1, 0, 0, 0)";
    expect(getElementRotation(el)).toBe(90);
  });

  it("returns 0 for an identity matrix with translation", () => {
    const el = document.createElement("div");
    el.style.transform = "matrix(1, 0, 0, 1, 10, 20)";
    expect(getElementRotation(el)).toBe(0);
  });

  it("derives 180deg from a negated identity matrix", () => {
    const el = document.createElement("div");
    el.style.transform = "matrix(-1, 0, 0, -1, 0, 0)";
    expect(getElementRotation(el)).toBe(180);
  });

  it("returns 0 for transforms with neither matrix nor rotate", () => {
    const el = document.createElement("div");
    el.style.transform = "scale(2)";
    expect(getElementRotation(el)).toBe(0);
  });
});

describe("getElementBoundsWithSpacing", () => {
  it("returns null for a null element", () => {
    expect(getElementBoundsWithSpacing("x", null as unknown as HTMLElement)).toBeNull();
  });

  it("returns bounds, margins and paddings from computed style", () => {
    const canvas = addCanvas({ left: 10, top: 10, width: 1000, height: 800 });
    const el = document.createElement("div");
    mockRect(el, { left: 60, top: 40, width: 200, height: 100 });
    // jsdom expands shorthands unreliably — set longhands directly.
    el.style.marginTop = "5px";
    el.style.marginRight = "6px";
    el.style.marginBottom = "7px";
    el.style.marginLeft = "8px";
    el.style.paddingTop = "1px";
    el.style.paddingRight = "2px";
    el.style.paddingBottom = "3px";
    el.style.paddingLeft = "4px";
    canvas.appendChild(el);

    expect(getElementBoundsWithSpacing("el-42", el)).toEqual({
      elementId: "el-42",
      x: 50,
      y: 30,
      width: 200,
      height: 100,
      margin: { top: 5, right: 6, bottom: 7, left: 8 },
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
    });
  });

  it("defaults unset spacing to 0", () => {
    addCanvas({ left: 0, top: 0, width: 1000, height: 800 });
    const el = document.createElement("div");
    mockRect(el, { left: 0, top: 0, width: 10, height: 10 });
    document.body.appendChild(el);

    const r = getElementBoundsWithSpacing("el-0", el);
    expect(r?.margin).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(r?.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });
});

describe("getAllElementBounds", () => {
  it("collects bounds for all [data-buildrick-id] elements except the excluded id", () => {
    const canvas = addCanvas({ left: 0, top: 0, width: 1000, height: 800 });

    const make = (id: string, left: number) => {
      const el = document.createElement("div");
      el.setAttribute("data-buildrick-id", id);
      mockRect(el, { left, top: 10, width: 50, height: 20 });
      canvas.appendChild(el);
      return el;
    };
    make("a", 0);
    make("b", 100);
    make("c", 200);

    // An element without the attribute must be ignored entirely.
    const plain = document.createElement("div");
    mockRect(plain, { left: 999, top: 999, width: 1, height: 1 });
    canvas.appendChild(plain);

    const bounds = getAllElementBounds("b");
    expect(bounds).toHaveLength(2);
    expect(bounds[0]).toEqual({ x: 0, y: 10, width: 50, height: 20, rotation: 0 });
    expect(bounds[1]).toEqual({ x: 200, y: 10, width: 50, height: 20, rotation: 0 });
  });

  it("returns an empty array when no elements exist", () => {
    expect(getAllElementBounds("anything")).toEqual([]);
  });
});
