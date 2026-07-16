/**
 * engine/canvas/resize/SnapManager — grid snapping, edge positions, and the
 * element-snap entry path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { snapToGrid, getEdgePositions, snapToElements } from "../SnapManager";
import type { TransformBounds } from "../types";

const bounds = (x: number, y: number, width: number, height: number): TransformBounds => ({
  x,
  y,
  width,
  height,
});

describe("snapToGrid", () => {
  it("snaps the affected edges for an nw handle", () => {
    expect(snapToGrid(bounds(13, 17, 100, 50), 10, "nw")).toEqual({
      x: 10,
      y: 20,
      width: 103,
      height: 47,
    });
  });

  it("snaps the right/bottom edges for an se handle", () => {
    expect(snapToGrid(bounds(10, 10, 53, 57), 10, "se")).toEqual({
      x: 10,
      y: 10,
      width: 50,
      height: 60,
    });
  });

  it("only touches the horizontal axis for an 'e' handle", () => {
    const r = snapToGrid(bounds(0, 5, 47, 33), 10, "e");
    expect(r.y).toBe(5);
    expect(r.height).toBe(33);
    expect(r.width).toBe(50); // 47 → rounds to 50
  });
});

describe("getEdgePositions", () => {
  it("derives edges + centers from bounds", () => {
    expect(getEdgePositions(bounds(10, 20, 100, 40))).toEqual({
      left: 10,
      right: 110,
      top: 20,
      bottom: 60,
      centerX: 60,
      centerY: 40,
    });
  });
});

describe("snapToElements", () => {
  it("returns unchanged bounds and no snapped edges when nothing else exists", () => {
    const input = bounds(30, 40, 100, 50);
    const { bounds: out, edges } = snapToElements(input, "self", 8);
    expect(out).toEqual(input);
    expect(edges).toEqual({});
  });
});
