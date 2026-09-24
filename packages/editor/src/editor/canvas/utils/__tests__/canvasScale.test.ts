/**
 * canvasScale — overlays inside the zoomed frame divide screen deltas by it.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { canvasScale } from "../canvasScale";

const el = (layout: number, painted: number) =>
  ({ offsetWidth: layout, getBoundingClientRect: () => ({ width: painted }) }) as unknown as Element;

describe("canvasScale", () => {
  it("is painted / layout width (61% fit)", () => {
    expect(canvasScale(el(1024, 624.64))).toBeCloseTo(0.61);
  });
  it("is 1 at 100% and for a missing or unlaid-out canvas", () => {
    expect(canvasScale(el(1024, 1024))).toBe(1);
    expect(canvasScale(null)).toBe(1);
    expect(canvasScale(el(0, 0))).toBe(1);
  });
});
