/**
 * resizeMath pure-function tests
 * Concrete numeric fixtures, exact output assertions.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import {
  calculateBoundsFromHandle,
  applyAspectRatio,
  applyCenterResize,
  calculateRotation,
  scaleBounds,
} from "../resizeMath";
import type { TransformBounds, SizeConstraints, HandlePosition } from "../types";

const START: TransformBounds = { x: 100, y: 200, width: 300, height: 150, rotation: 30 };

const LOOSE: SizeConstraints = {
  minWidth: 10,
  minHeight: 10,
  maxWidth: 10000,
  maxHeight: 10000,
};

describe("calculateBoundsFromHandle", () => {
  describe("edge handles", () => {
    it("e: grows width by +deltaX, ignores deltaY, keeps x/y", () => {
      const r = calculateBoundsFromHandle("e", START, 50, 999, LOOSE);
      expect(r).toEqual({ x: 100, y: 200, width: 350, height: 150, rotation: 30 });
    });

    it("e: negative deltaX shrinks width", () => {
      const r = calculateBoundsFromHandle("e", START, -40, 0, LOOSE);
      expect(r.width).toBe(260);
      expect(r.x).toBe(100);
    });

    it("e: clamps to minWidth without moving x", () => {
      const r = calculateBoundsFromHandle("e", START, -500, 0, LOOSE);
      expect(r.width).toBe(10);
      expect(r.x).toBe(100);
    });

    it("e: clamps to maxWidth", () => {
      const r = calculateBoundsFromHandle("e", START, 200, 0, { ...LOOSE, maxWidth: 400 });
      expect(r.width).toBe(400);
    });

    it("w: dragging left grows width and shifts x, right edge stays fixed", () => {
      const r = calculateBoundsFromHandle("w", START, -50, 0, LOOSE);
      expect(r).toEqual({ x: 50, y: 200, width: 350, height: 150, rotation: 30 });
      expect(r.x + r.width).toBe(START.x + START.width); // right edge anchored at 400
    });

    it("w: dragging right shrinks width, right edge stays fixed", () => {
      const r = calculateBoundsFromHandle("w", START, 50, 0, LOOSE);
      expect(r.x).toBe(150);
      expect(r.width).toBe(250);
      expect(r.x + r.width).toBe(400);
    });

    it("w: min-width clamp anchors the right edge", () => {
      const r = calculateBoundsFromHandle("w", START, 500, 0, LOOSE);
      expect(r.width).toBe(10);
      expect(r.x).toBe(390);
      expect(r.x + r.width).toBe(400);
    });

    it("s: grows height by +deltaY, ignores deltaX", () => {
      const r = calculateBoundsFromHandle("s", START, 999, 30, LOOSE);
      expect(r).toEqual({ x: 100, y: 200, width: 300, height: 180, rotation: 30 });
    });

    it("s: clamps to minHeight", () => {
      const r = calculateBoundsFromHandle("s", START, 0, -500, LOOSE);
      expect(r.height).toBe(10);
      expect(r.y).toBe(200);
    });

    it("n: dragging up grows height and shifts y, bottom edge stays fixed", () => {
      const r = calculateBoundsFromHandle("n", START, 0, -20, LOOSE);
      expect(r.y).toBe(180);
      expect(r.height).toBe(170);
      expect(r.y + r.height).toBe(START.y + START.height); // bottom anchored at 350
    });

    it("n: min-height clamp anchors the bottom edge", () => {
      const r = calculateBoundsFromHandle("n", START, 0, 300, LOOSE);
      expect(r.height).toBe(10);
      expect(r.y).toBe(340);
      expect(r.y + r.height).toBe(350);
    });

    it("n: clamps to maxHeight and shifts y accordingly", () => {
      const r = calculateBoundsFromHandle("n", START, 0, -500, { ...LOOSE, maxHeight: 200 });
      expect(r.height).toBe(200);
      expect(r.y).toBe(150);
    });
  });

  describe("corner handles", () => {
    it("se: grows both dimensions, x/y fixed", () => {
      const r = calculateBoundsFromHandle("se", START, 50, 30, LOOSE);
      expect(r).toEqual({ x: 100, y: 200, width: 350, height: 180, rotation: 30 });
    });

    it("se: negative deltas shrink both dimensions", () => {
      const r = calculateBoundsFromHandle("se", START, -100, -50, LOOSE);
      expect(r.width).toBe(200);
      expect(r.height).toBe(100);
      expect(r.x).toBe(100);
      expect(r.y).toBe(200);
    });

    it("sw: width grows leftward (x shifts), height grows downward", () => {
      const r = calculateBoundsFromHandle("sw", START, -50, 30, LOOSE);
      expect(r).toEqual({ x: 50, y: 200, width: 350, height: 180, rotation: 30 });
    });

    it("ne: width grows rightward (x fixed), height grows upward (y shifts)", () => {
      const r = calculateBoundsFromHandle("ne", START, 50, -30, LOOSE);
      expect(r).toEqual({ x: 100, y: 170, width: 350, height: 180, rotation: 30 });
    });

    it("nw: both dimensions grow with x and y shifting", () => {
      const r = calculateBoundsFromHandle("nw", START, -50, -30, LOOSE);
      expect(r).toEqual({ x: 50, y: 170, width: 350, height: 180, rotation: 30 });
    });

    it("nw: min clamps anchor the opposite (bottom-right) corner", () => {
      const r = calculateBoundsFromHandle("nw", START, 1000, 1000, LOOSE);
      expect(r.width).toBe(10);
      expect(r.height).toBe(10);
      expect(r.x + r.width).toBe(400);
      expect(r.y + r.height).toBe(350);
    });
  });

  it("does not mutate startBounds", () => {
    const start = { ...START };
    calculateBoundsFromHandle("nw", start, -50, -30, LOOSE);
    expect(start).toEqual(START);
  });

  it("zero deltas return the start bounds unchanged for every handle", () => {
    const handles: HandlePosition[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
    for (const h of handles) {
      expect(calculateBoundsFromHandle(h, START, 0, 0, LOOSE)).toEqual(START);
    }
  });
});

describe("applyAspectRatio", () => {
  // 2:1 aspect ratio element
  const AR_START: TransformBounds = { x: 0, y: 0, width: 200, height: 100 };

  it("e: derives height from width", () => {
    const r = applyAspectRatio({ x: 0, y: 0, width: 300, height: 100 }, "e", 2, AR_START);
    expect(r).toEqual({ x: 0, y: 0, width: 300, height: 150 });
  });

  it("w: derives height from width and re-anchors x to the right edge", () => {
    const r = applyAspectRatio({ x: -100, y: 0, width: 300, height: 100 }, "w", 2, AR_START);
    expect(r).toEqual({ x: -100, y: 0, width: 300, height: 150 });
  });

  it("s: derives width from height", () => {
    const r = applyAspectRatio({ x: 0, y: 0, width: 200, height: 150 }, "s", 2, AR_START);
    expect(r).toEqual({ x: 0, y: 0, width: 300, height: 150 });
  });

  it("n: derives width from height and re-anchors y to the bottom edge", () => {
    const r = applyAspectRatio({ x: 0, y: -50, width: 200, height: 150 }, "n", 2, AR_START);
    expect(r).toEqual({ x: 0, y: -50, width: 300, height: 150 });
  });

  it("corner: width dominant (widthDelta > heightDelta) drives height", () => {
    const r = applyAspectRatio({ x: 0, y: 0, width: 300, height: 120 }, "se", 2, AR_START);
    expect(r).toEqual({ x: 0, y: 0, width: 300, height: 150 });
  });

  it("corner: height dominant drives width", () => {
    const r = applyAspectRatio({ x: 0, y: 0, width: 220, height: 200 }, "se", 2, AR_START);
    expect(r).toEqual({ x: 0, y: 0, width: 400, height: 200 });
  });

  it("corner: equal deltas prefer width (>= comparison)", () => {
    const r = applyAspectRatio({ x: 0, y: 0, width: 300, height: 200 }, "se", 2, AR_START);
    expect(r.width).toBe(300);
    expect(r.height).toBe(150);
  });

  it("nw corner: re-anchors both x (right edge) and y (bottom edge)", () => {
    const r = applyAspectRatio({ x: -100, y: -100, width: 300, height: 200 }, "nw", 2, AR_START);
    // width wins (100 >= 100) -> height = 150; x = 0+200-300; y = 0+100-150
    expect(r).toEqual({ x: -100, y: -50, width: 300, height: 150 });
  });

  it("non-square ratio: 0.5 (portrait) on e handle", () => {
    const start: TransformBounds = { x: 0, y: 0, width: 100, height: 200 };
    const r = applyAspectRatio({ x: 0, y: 0, width: 150, height: 200 }, "e", 0.5, start);
    expect(r.height).toBe(300);
  });

  it("does not mutate the input bounds", () => {
    const bounds = { x: 0, y: 0, width: 300, height: 100 };
    applyAspectRatio(bounds, "e", 2, AR_START);
    expect(bounds).toEqual({ x: 0, y: 0, width: 300, height: 100 });
  });
});

describe("applyCenterResize", () => {
  const CENTER = { x: 200, y: 150 };
  const BOUNDS: TransformBounds = { x: 0, y: 0, width: 100, height: 60 };

  it("e: recenters x only", () => {
    const r = applyCenterResize(BOUNDS, CENTER, "e");
    expect(r).toEqual({ x: 150, y: 0, width: 100, height: 60 });
  });

  it("w: recenters x only", () => {
    const r = applyCenterResize(BOUNDS, CENTER, "w");
    expect(r).toEqual({ x: 150, y: 0, width: 100, height: 60 });
  });

  it("n: recenters y only", () => {
    const r = applyCenterResize(BOUNDS, CENTER, "n");
    expect(r).toEqual({ x: 0, y: 120, width: 100, height: 60 });
  });

  it("s: recenters y only", () => {
    const r = applyCenterResize(BOUNDS, CENTER, "s");
    expect(r).toEqual({ x: 0, y: 120, width: 100, height: 60 });
  });

  it("corner handles recenter both axes", () => {
    for (const h of ["se", "sw", "ne", "nw"] as const) {
      expect(applyCenterResize(BOUNDS, CENTER, h)).toEqual({
        x: 150,
        y: 120,
        width: 100,
        height: 60,
      });
    }
  });

  it("does not mutate input", () => {
    applyCenterResize(BOUNDS, CENTER, "se");
    expect(BOUNDS).toEqual({ x: 0, y: 0, width: 100, height: 60 });
  });
});

describe("calculateRotation", () => {
  const CENTER = { x: 0, y: 0 };
  const EAST = { x: 100, y: 0 }; // 0 degrees

  it("no mouse movement returns startRotation", () => {
    expect(calculateRotation(CENTER, EAST, EAST, 45, false, [])).toBe(45);
  });

  it("90 degree clockwise sweep adds 90", () => {
    // mouse moves from east (0deg) to south (+90deg in screen coords)
    expect(calculateRotation(CENTER, EAST, { x: 0, y: 100 }, 0, false, [])).toBe(90);
  });

  it("adds delta to a non-zero startRotation", () => {
    expect(calculateRotation(CENTER, EAST, { x: 0, y: 100 }, 45, false, [])).toBe(135);
  });

  it("normalizes negative results into 0-360", () => {
    // east -> north is -90deg; 0 + (-90) -> 270
    expect(calculateRotation(CENTER, EAST, { x: 0, y: -100 }, 0, false, [])).toBe(270);
  });

  it("normalizes rotations over 360", () => {
    expect(calculateRotation(CENTER, EAST, { x: 0, y: 100 }, 350, false, [])).toBe(80);
  });

  describe("shift snapping (15 degree grid)", () => {
    it("snaps 100 to 105", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 100, true, [])).toBe(105);
    });

    it("snaps 97 down to 90", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 97, true, [])).toBe(90);
    });

    it("re-normalizes a 360 snap back to 0", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 356, true, [])).toBe(0);
    });

    it("takes precedence over snapAngles", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 100, true, [98])).toBe(105);
    });
  });

  describe("snapAngles", () => {
    it("snaps within default threshold (5)", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 92, false, [90])).toBe(90);
    });

    it("does not snap at exactly the threshold (strict <)", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 95, false, [90])).toBe(95);
    });

    it("does not snap outside threshold", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 92, false, [45])).toBe(92);
    });

    it("snaps across the 0/360 wraparound", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 358, false, [0])).toBe(0);
    });

    it("normalizes negative snap angles", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 268, false, [-90])).toBe(270);
    });

    it("respects a custom threshold", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 80, false, [90], 15)).toBe(90);
    });

    it("uses the first matching snap angle", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 92, false, [94, 90])).toBe(94);
    });

    it("empty snapAngles leaves rotation untouched", () => {
      expect(calculateRotation(CENTER, EAST, EAST, 92, false, [])).toBe(92);
    });
  });

  it("handles off-center pivot points", () => {
    const center = { x: 50, y: 50 };
    const r = calculateRotation(center, { x: 150, y: 50 }, { x: 50, y: 150 }, 0, false, []);
    expect(r).toBe(90);
  });
});

describe("scaleBounds", () => {
  const PRIMARY_START: TransformBounds = { x: 100, y: 100, width: 200, height: 100 };

  it("scales size and relative offset by the primary scale factors", () => {
    const primaryNew: TransformBounds = { x: 100, y: 100, width: 400, height: 300 }; // 2x, 3x
    const secondary: TransformBounds = { x: 150, y: 120, width: 50, height: 40, rotation: 15 };

    const r = scaleBounds(secondary, PRIMARY_START, primaryNew);
    expect(r).toEqual({ x: 200, y: 160, width: 100, height: 120, rotation: 15 });
  });

  it("follows the primary when it also moves", () => {
    const primaryNew: TransformBounds = { x: 50, y: 80, width: 100, height: 50 }; // 0.5x both
    const secondary: TransformBounds = { x: 150, y: 120, width: 50, height: 40 };

    const r = scaleBounds(secondary, PRIMARY_START, primaryNew);
    expect(r).toEqual({ x: 75, y: 90, width: 25, height: 20, rotation: undefined });
  });

  it("identity scale returns the same geometry", () => {
    const secondary: TransformBounds = { x: 150, y: 120, width: 50, height: 40, rotation: 5 };
    const r = scaleBounds(secondary, PRIMARY_START, { ...PRIMARY_START });
    expect(r).toEqual(secondary);
  });

  it("preserves rotation (does not scale it)", () => {
    const primaryNew: TransformBounds = { x: 100, y: 100, width: 600, height: 400 };
    const secondary: TransformBounds = { x: 100, y: 100, width: 10, height: 10, rotation: 33 };
    expect(scaleBounds(secondary, PRIMARY_START, primaryNew).rotation).toBe(33);
  });
});
