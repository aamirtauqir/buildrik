import { describe, it, expect } from "vitest";
import { computeThumbGeometry } from "./scrollThumbGeometry";

describe("computeThumbGeometry", () => {
  it("returns null when content fits — no scrollbar, no thumb", () => {
    expect(computeThumbGeometry({ scrollTop: 0, scrollHeight: 400, clientHeight: 400 })).toBeNull();
    expect(computeThumbGeometry({ scrollTop: 0, scrollHeight: 300, clientHeight: 400 })).toBeNull();
  });

  it("sizes the thumb proportional to the visible fraction, at rest (scrollTop 0)", () => {
    // 66 rows * 28px = 1848 content in a 400-tall box: visible fraction ~0.216.
    const g = computeThumbGeometry({ scrollTop: 0, scrollHeight: 1848, clientHeight: 400 });
    expect(g).not.toBeNull();
    expect(g!.top).toBe(0);
    expect(g!.height).toBeCloseTo((400 / 1848) * 400, 1);
  });

  it("clamps the thumb to a minimum height on a very long list", () => {
    const g = computeThumbGeometry({ scrollTop: 0, scrollHeight: 20000, clientHeight: 400 });
    expect(g!.height).toBe(24);
  });

  it("moves the thumb to the bottom of the track when scrolled all the way down", () => {
    const scrollHeight = 1000;
    const clientHeight = 400;
    const g = computeThumbGeometry({ scrollTop: scrollHeight - clientHeight, scrollHeight, clientHeight });
    const expectedHeight = (clientHeight / scrollHeight) * clientHeight;
    expect(g!.top).toBeCloseTo(clientHeight - expectedHeight, 1);
  });

  it("places the thumb at the proportional midpoint of the track", () => {
    const scrollHeight = 1200;
    const clientHeight = 400;
    const scrollable = scrollHeight - clientHeight; // 800
    const g = computeThumbGeometry({ scrollTop: scrollable / 2, scrollHeight, clientHeight });
    const height = (clientHeight / scrollHeight) * clientHeight;
    const track = clientHeight - height;
    expect(g!.top).toBeCloseTo(track / 2, 1);
  });
});
