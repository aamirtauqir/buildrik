/**
 * HitTester tests — handle, rotation, and border hit testing.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { hitTestHandles, hitTestRotation, hitTestBorder, hitTest } from "../HitTester";
import type { SelectionBox } from "../../../../shared/types/canvas";
import type { HandlePosition } from "../types";

// Box at (100,100) 200x100 with 8 handles at the standard positions.
function makeSelectionBox(overrides: Partial<SelectionBox> = {}): SelectionBox {
  return {
    elementId: "el-1",
    bounds: { x: 100, y: 100, width: 200, height: 100 },
    handles: [
      { position: "nw", x: 100, y: 100, cursor: "nwse-resize" },
      { position: "n", x: 200, y: 100, cursor: "ns-resize" },
      { position: "ne", x: 300, y: 100, cursor: "nesw-resize" },
      { position: "e", x: 300, y: 150, cursor: "ew-resize" },
      { position: "se", x: 300, y: 200, cursor: "nwse-resize" },
      { position: "s", x: 200, y: 200, cursor: "ns-resize" },
      { position: "sw", x: 100, y: 200, cursor: "nesw-resize" },
      { position: "w", x: 100, y: 150, cursor: "ew-resize" },
    ],
    rotationHandle: { x: 200, y: 70, angle: 0 },
    color: "#2D6DFF",
    isMultiSelect: false,
    isLocked: false,
    ...overrides,
  };
}

describe("hitTestHandles", () => {
  const box = makeSelectionBox();

  it("returns the handle position at each handle center", () => {
    const expectations: Array<[HandlePosition, number, number]> = [
      ["nw", 100, 100],
      ["n", 200, 100],
      ["ne", 300, 100],
      ["e", 300, 150],
      ["se", 300, 200],
      ["s", 200, 200],
      ["sw", 100, 200],
      ["w", 100, 150],
    ];
    for (const [pos, x, y] of expectations) {
      expect(hitTestHandles(box, x, y)).toBe(pos);
    }
  });

  it("hits within the default 14px hit area (half = 7 each side)", () => {
    expect(hitTestHandles(box, 106.9, 100)).toBe("nw");
    expect(hitTestHandles(box, 100, 93.1)).toBe("nw");
  });

  it("boundary is inclusive at exactly halfArea", () => {
    expect(hitTestHandles(box, 107, 107)).toBe("nw");
    expect(hitTestHandles(box, 93, 93)).toBe("nw");
  });

  it("misses just outside the hit area", () => {
    expect(hitTestHandles(box, 107.1, 100)).toBeNull();
    expect(hitTestHandles(box, 100, 92.9)).toBeNull();
  });

  it("returns null far from any handle", () => {
    expect(hitTestHandles(box, 200, 150)).toBeNull(); // box center
    expect(hitTestHandles(box, 0, 0)).toBeNull();
  });

  it("respects a custom hit area", () => {
    expect(hitTestHandles(box, 106, 100, 4)).toBeNull();
    expect(hitTestHandles(box, 101.9, 100, 4)).toBe("nw");
  });

  it("returns the first matching handle when hit areas overlap", () => {
    const tiny = makeSelectionBox({
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      handles: [
        { position: "nw", x: 0, y: 0, cursor: "nwse-resize" },
        { position: "n", x: 5, y: 0, cursor: "ns-resize" },
      ],
    });
    // (3,0) is within 7px of both nw (dx 3) and n (dx 2); array order wins.
    expect(hitTestHandles(tiny, 3, 0)).toBe("nw");
  });

  it("returns null when the box has no handles", () => {
    expect(hitTestHandles(makeSelectionBox({ handles: [] }), 100, 100)).toBeNull();
  });
});

describe("hitTestRotation", () => {
  const box = makeSelectionBox();

  it("hits at the rotation handle center", () => {
    expect(hitTestRotation(box, 200, 70)).toBe(true);
  });

  it("hits within the inclusive hit area", () => {
    expect(hitTestRotation(box, 207, 77)).toBe(true);
    expect(hitTestRotation(box, 193, 63)).toBe(true);
  });

  it("misses outside the hit area", () => {
    expect(hitTestRotation(box, 207.1, 70)).toBe(false);
    expect(hitTestRotation(box, 200, 62.9)).toBe(false);
  });

  it("returns false when there is no rotation handle", () => {
    expect(hitTestRotation(makeSelectionBox({ rotationHandle: undefined }), 200, 70)).toBe(false);
  });

  it("respects a custom hit area", () => {
    expect(hitTestRotation(box, 205, 70, 4)).toBe(false);
    expect(hitTestRotation(box, 201, 70, 4)).toBe(true);
  });
});

describe("hitTestBorder", () => {
  // bounds x100 y100 w200 h100; default border width 6.
  const box = makeSelectionBox();

  it("detects the four edges", () => {
    expect(hitTestBorder(box, 150, 95)).toBe("n"); // top band [94,106]
    expect(hitTestBorder(box, 150, 205)).toBe("s"); // bottom band [194,206]
    expect(hitTestBorder(box, 95, 150)).toBe("w"); // left band [94,106]
    expect(hitTestBorder(box, 305, 150)).toBe("e"); // right band [294,306]
  });

  it("corners take priority over edges", () => {
    expect(hitTestBorder(box, 103, 103)).toBe("nw");
    expect(hitTestBorder(box, 297, 104)).toBe("ne");
    expect(hitTestBorder(box, 104, 196)).toBe("sw");
    expect(hitTestBorder(box, 296, 196)).toBe("se");
  });

  it("band boundaries are inclusive", () => {
    expect(hitTestBorder(box, 150, 94)).toBe("n");
    expect(hitTestBorder(box, 150, 106)).toBe("n");
    expect(hitTestBorder(box, 306, 150)).toBe("e");
  });

  it("returns null inside the box away from borders", () => {
    expect(hitTestBorder(box, 200, 150)).toBeNull();
  });

  it("returns null outside the box", () => {
    expect(hitTestBorder(box, 150, 90)).toBeNull();
    expect(hitTestBorder(box, 400, 150)).toBeNull();
  });

  it("returns null diagonally outside a corner (perpendicular ranges not met)", () => {
    // (98, 98): within top band vertically but x < 100; within left band
    // horizontally but y < 100 — neither edge matches.
    expect(hitTestBorder(box, 98, 98)).toBeNull();
  });

  it("respects a custom border width", () => {
    expect(hitTestBorder(box, 150, 92, 10)).toBe("n");
    expect(hitTestBorder(box, 150, 92, 2)).toBeNull();
  });
});

describe("hitTest (combined)", () => {
  it("rotation handle wins over everything", () => {
    // Place the rotation handle exactly on the nw resize handle.
    const box = makeSelectionBox({ rotationHandle: { x: 100, y: 100, angle: 0 } });
    expect(hitTest(box, 100, 100)).toBe("rotation");
  });

  it("resize handles win over the border", () => {
    const box = makeSelectionBox();
    // (200,100) is the n handle center AND on the top border.
    expect(hitTest(box, 200, 100)).toBe("n");
  });

  it("falls through to the border when no handle is near", () => {
    const box = makeSelectionBox();
    // (150, 95): 50px from nw and n handles, but inside the top border band.
    expect(hitTest(box, 150, 95)).toBe("n");
  });

  it("returns null when nothing is hit", () => {
    const box = makeSelectionBox();
    expect(hitTest(box, 200, 150)).toBeNull();
    expect(hitTest(box, 500, 500)).toBeNull();
  });

  it("passes custom hit areas through", () => {
    const box = makeSelectionBox();
    // With a huge handle hit area the box center hits the n handle
    // (first handle within range wins; nw is at distance >70 on x... nw dx=100 -> no; n dx=0, dy=50 within 60).
    expect(hitTest(box, 200, 150, 120, 6)).toBe("n");
    // With tiny areas the same point hits nothing.
    expect(hitTest(box, 200, 150, 2, 1)).toBeNull();
  });
});
