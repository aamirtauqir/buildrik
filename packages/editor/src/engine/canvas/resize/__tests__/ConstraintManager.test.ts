/**
 * ConstraintManager tests — size, parent, and canvas boundary constraints.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyConstraints,
  applyBoundaryConstraints,
  getBoundaryConstraints,
} from "../ConstraintManager";
import type { TransformBounds, SizeConstraints, BoundaryConstraints, Bounds } from "../types";

// Silence dev logging noise (vitest runs with import.meta.env.DEV = true).
vi.mock("@/shared/utils/devLogger", () => ({
  devLog: vi.fn(),
  devWarn: vi.fn(),
  devError: vi.fn(),
}));

const SIZE: SizeConstraints = { minWidth: 10, minHeight: 10, maxWidth: 100, maxHeight: 100 };

describe("applyConstraints", () => {
  it("clamps width and height into [min, max]", () => {
    const r = applyConstraints({ x: 5, y: 6, width: 500, height: 3 }, SIZE);
    expect(r).toEqual({ x: 5, y: 6, width: 100, height: 10 });
  });

  it("leaves in-range dimensions untouched", () => {
    const r = applyConstraints({ x: 0, y: 0, width: 50, height: 60 }, SIZE);
    expect(r.width).toBe(50);
    expect(r.height).toBe(60);
  });

  it("clamps to exact min/max boundary values inclusively", () => {
    const r = applyConstraints({ x: 0, y: 0, width: 10, height: 100 }, SIZE);
    expect(r.width).toBe(10);
    expect(r.height).toBe(100);
  });

  it("preserves x, y and rotation", () => {
    const r = applyConstraints({ x: -7, y: 42, width: 999, height: 1, rotation: 15 }, SIZE);
    expect(r.x).toBe(-7);
    expect(r.y).toBe(42);
    expect(r.rotation).toBe(15);
  });

  it("returns a new object and does not mutate the input", () => {
    const input: TransformBounds = { x: 0, y: 0, width: 500, height: 500 };
    const r = applyConstraints(input, SIZE);
    expect(r).not.toBe(input);
    expect(input.width).toBe(500);
  });
});

describe("applyBoundaryConstraints", () => {
  const CANVAS: Bounds = { x: 0, y: 0, width: 1000, height: 800 };

  function boundary(parentBounds: Bounds | null): BoundaryConstraints {
    return {
      parentBounds,
      parentElementId: parentBounds ? "parent-1" : null,
      parentElement: null,
      canvasBounds: CANVAS,
      offsetInParent: { x: 0, y: 0 },
    };
  }

  describe("no parent (root-level element)", () => {
    it("leaves bounds that fit inside the canvas untouched", () => {
      const r = applyBoundaryConstraints({ x: 10, y: 10, width: 100, height: 100 }, boundary(null));
      expect(r).toEqual({ x: 10, y: 10, width: 100, height: 100 });
    });

    it("clips width at the canvas right edge", () => {
      const r = applyBoundaryConstraints({ x: 900, y: 0, width: 200, height: 100 }, boundary(null));
      expect(r.width).toBe(100);
      expect(r.x).toBe(900);
    });

    it("clips height at the canvas bottom edge", () => {
      const r = applyBoundaryConstraints({ x: 0, y: 750, width: 100, height: 100 }, boundary(null));
      expect(r.height).toBe(50);
      expect(r.y).toBe(750);
    });

    it("shifts x to canvas left edge and shrinks width by the overhang", () => {
      const r = applyBoundaryConstraints({ x: -20, y: 0, width: 100, height: 100 }, boundary(null));
      expect(r.x).toBe(0);
      expect(r.width).toBe(80);
    });

    it("shifts y to canvas top edge and shrinks height by the overhang", () => {
      const r = applyBoundaryConstraints({ x: 0, y: -30, width: 100, height: 100 }, boundary(null));
      expect(r.y).toBe(0);
      expect(r.height).toBe(70);
    });

    it("enforces a 10px floor even when canvas clipping collapses the width", () => {
      // x=995 leaves only 5px of canvas; the final min-clamp wins and the
      // element ends up 10px wide, extending 5px past the canvas edge.
      const r = applyBoundaryConstraints({ x: 995, y: 0, width: 200, height: 50 }, boundary(null));
      expect(r.width).toBe(10);
    });

    it("enforces a 10px floor when left-clipping consumes the whole width", () => {
      const r = applyBoundaryConstraints({ x: -100, y: 0, width: 50, height: 50 }, boundary(null));
      expect(r.x).toBe(0);
      expect(r.width).toBe(10); // 50 - 100 = -50 -> floored to 10
    });
  });

  describe("with parent bounds", () => {
    const PARENT: Bounds = { x: 100, y: 100, width: 300, height: 200 }; // right 400, bottom 300

    it("constrains width to the parent right edge", () => {
      const r = applyBoundaryConstraints(
        { x: 200, y: 150, width: 300, height: 50 },
        boundary(PARENT)
      );
      expect(r.width).toBe(200); // 400 - 200
      expect(r.x).toBe(200);
    });

    it("constrains height to the parent bottom edge", () => {
      const r = applyBoundaryConstraints(
        { x: 150, y: 250, width: 100, height: 200 },
        boundary(PARENT)
      );
      expect(r.height).toBe(50); // 300 - 250
    });

    it("pushes x back to the parent left edge and shrinks width", () => {
      const r = applyBoundaryConstraints(
        { x: 50, y: 150, width: 100, height: 50 },
        boundary(PARENT)
      );
      expect(r.x).toBe(100);
      expect(r.width).toBe(50);
    });

    it("pushes y back to the parent top edge and shrinks height", () => {
      const r = applyBoundaryConstraints(
        { x: 150, y: 60, width: 100, height: 80 },
        boundary(PARENT)
      );
      expect(r.y).toBe(100);
      expect(r.height).toBe(40);
    });

    it("applies a 10px floor to parent width clipping", () => {
      const r = applyBoundaryConstraints(
        { x: 395, y: 150, width: 100, height: 50 },
        boundary(PARENT)
      );
      expect(r.width).toBe(10); // maxAllowed 5 -> floored to 10
    });

    it("clamps a child overflowing on all sides down to exactly the parent box", () => {
      const r = applyBoundaryConstraints(
        { x: 50, y: 50, width: 400, height: 300 },
        boundary(PARENT)
      );
      expect(r).toEqual({ x: 100, y: 100, width: 300, height: 200 });
    });

    it("keeps a fitting child untouched", () => {
      const r = applyBoundaryConstraints(
        { x: 150, y: 150, width: 100, height: 80 },
        boundary(PARENT)
      );
      expect(r).toEqual({ x: 150, y: 150, width: 100, height: 80 });
    });

    it("still enforces the canvas hard limit when parent is larger than canvas", () => {
      const bigParent: Bounds = { x: 0, y: 0, width: 2000, height: 2000 };
      const r = applyBoundaryConstraints(
        { x: 900, y: 0, width: 300, height: 100 },
        boundary(bigParent)
      );
      expect(r.width).toBe(100); // clipped by canvas right (1000), not parent (2000)
    });
  });

  it("does not mutate the input bounds", () => {
    const input: TransformBounds = { x: -20, y: -20, width: 2000, height: 2000 };
    applyBoundaryConstraints(input, {
      parentBounds: null,
      parentElementId: null,
      parentElement: null,
      canvasBounds: CANVAS,
      offsetInParent: { x: 0, y: 0 },
    });
    expect(input).toEqual({ x: -20, y: -20, width: 2000, height: 2000 });
  });
});

describe("getBoundaryConstraints", () => {
  function mockRect(el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) {
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

  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("element directly inside the canvas gets null parentBounds", () => {
    const canvas = document.createElement("div");
    canvas.setAttribute("data-buildrick-canvas", "");
    mockRect(canvas, { left: 0, top: 0, width: 1200, height: 900 });
    const el = document.createElement("div");
    canvas.appendChild(el);
    document.body.appendChild(canvas);

    const r = getBoundaryConstraints(el, { x: 30, y: 40, width: 100, height: 50 });

    expect(r.parentBounds).toBeNull();
    expect(r.parentElementId).toBeNull();
    expect(r.parentElement).toBeNull();
    expect(r.canvasBounds).toEqual({ x: 0, y: 0, width: 1200, height: 900 });
    expect(r.offsetInParent).toEqual({ x: 30, y: 40 });
  });

  it("recognizes the canvas by class name too", () => {
    const canvas = document.createElement("div");
    canvas.className = "buildrick-canvas";
    mockRect(canvas, { left: 0, top: 0, width: 800, height: 600 });
    const el = document.createElement("div");
    canvas.appendChild(el);
    document.body.appendChild(canvas);

    const r = getBoundaryConstraints(el, { x: 5, y: 5, width: 10, height: 10 });
    expect(r.parentBounds).toBeNull();
    expect(r.canvasBounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  it("nested element gets parent bounds relative to the canvas", () => {
    const canvas = document.createElement("div");
    canvas.setAttribute("data-buildrick-canvas", "");
    mockRect(canvas, { left: 10, top: 20, width: 1200, height: 900 });

    const parent = document.createElement("div");
    parent.setAttribute("data-buildrick-id", "p1");
    mockRect(parent, { left: 60, top: 60, width: 600, height: 400 });

    const el = document.createElement("div");
    parent.appendChild(el);
    canvas.appendChild(parent);
    document.body.appendChild(canvas);

    const r = getBoundaryConstraints(el, { x: 80, y: 70, width: 100, height: 50 });

    // parent rect minus canvas offset (10, 20)
    expect(r.parentBounds).toEqual({ x: 50, y: 40, width: 600, height: 400 });
    expect(r.parentElementId).toBe("p1");
    expect(r.parentElement).toBe(parent);
    expect(r.offsetInParent).toEqual({ x: 30, y: 30 });
    expect(r.canvasBounds).toEqual({ x: 0, y: 0, width: 1200, height: 900 });
  });

  it("falls back to 1440x900 canvas bounds when no canvas exists", () => {
    const el = document.createElement("div"); // detached: no parentElement
    const r = getBoundaryConstraints(el, { x: 0, y: 0, width: 10, height: 10 });

    expect(r.canvasBounds).toEqual({ x: 0, y: 0, width: 1440, height: 900 });
    expect(r.parentBounds).toBeNull();
  });

  it("without a canvas, parent bounds use a zero canvas offset", () => {
    const parent = document.createElement("div");
    parent.setAttribute("data-buildrick-id", "p2");
    mockRect(parent, { left: 30, top: 20, width: 500, height: 400 });
    const el = document.createElement("div");
    parent.appendChild(el);
    document.body.appendChild(parent);

    const r = getBoundaryConstraints(el, { x: 100, y: 100, width: 50, height: 50 });

    expect(r.parentBounds).toEqual({ x: 30, y: 20, width: 500, height: 400 });
    expect(r.parentElementId).toBe("p2");
    expect(r.offsetInParent).toEqual({ x: 70, y: 80 });
  });

  it("honors a custom canvas selector", () => {
    const canvas = document.createElement("div");
    canvas.setAttribute("data-my-canvas", "");
    mockRect(canvas, { left: 0, top: 0, width: 640, height: 480 });
    const el = document.createElement("div");
    canvas.appendChild(el);
    document.body.appendChild(canvas);

    const r = getBoundaryConstraints(
      el,
      { x: 0, y: 0, width: 10, height: 10 },
      "[data-my-canvas]"
    );
    expect(r.canvasBounds).toEqual({ x: 0, y: 0, width: 640, height: 480 });
    // NOTE current behavior: the parent-vs-canvas check is hardcoded to the
    // buildrick class/attribute, so with a custom selector the canvas element
    // itself is treated as a regular parent.
    expect(r.parentBounds).not.toBeNull();
    expect(r.parentElement).toBe(canvas);
  });
});
