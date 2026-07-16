/**
 * parsers/colorFormat — color → CSS string serializers.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  rgbToString,
  hslToString,
  hwbToString,
  labToString,
  lchToString,
  oklchToString,
} from "../colorFormat";

describe("rgbToString", () => {
  it("legacy comma form without alpha", () => {
    expect(rgbToString({ r: 1, g: 2, b: 3 })).toBe("rgb(1, 2, 3)");
  });
  it("legacy rgba form when alpha < 1", () => {
    expect(rgbToString({ r: 1, g: 2, b: 3, a: 0.5 })).toBe("rgba(1, 2, 3, 0.5)");
  });
  it("treats alpha === 1 as opaque", () => {
    expect(rgbToString({ r: 1, g: 2, b: 3, a: 1 })).toBe("rgb(1, 2, 3)");
  });
  it("modern space form", () => {
    expect(rgbToString({ r: 1, g: 2, b: 3 }, true)).toBe("rgb(1 2 3)");
    expect(rgbToString({ r: 1, g: 2, b: 3, a: 0.5 }, true)).toBe("rgb(1 2 3 / 0.5)");
  });
});

describe("hslToString", () => {
  it("legacy + modern with and without alpha", () => {
    expect(hslToString({ h: 200, s: 50, l: 40 })).toBe("hsl(200, 50%, 40%)");
    expect(hslToString({ h: 200, s: 50, l: 40, a: 0.3 })).toBe("hsla(200, 50%, 40%, 0.3)");
    expect(hslToString({ h: 200, s: 50, l: 40 }, true)).toBe("hsl(200 50% 40%)");
    expect(hslToString({ h: 200, s: 50, l: 40, a: 0.3 }, true)).toBe("hsl(200 50% 40% / 0.3)");
  });
});

describe("hwbToString", () => {
  it("emits w/b percentages and alpha when < 1", () => {
    expect(hwbToString({ h: 120, w: 10, b: 20 })).toBe("hwb(120 10% 20%)");
    expect(hwbToString({ h: 120, w: 10, b: 20, a: 0.5 })).toBe("hwb(120 10% 20% / 0.5)");
  });
});

describe("labToString / lchToString", () => {
  it("labToString with and without alpha", () => {
    expect(labToString({ l: 50, a: 10, b: -20 })).toBe("lab(50% 10 -20)");
    expect(labToString({ l: 50, a: 10, b: -20, alpha: 0.4 })).toBe("lab(50% 10 -20 / 0.4)");
  });
  it("lchToString with and without alpha", () => {
    expect(lchToString({ l: 50, c: 30, h: 200 })).toBe("lch(50% 30 200)");
    expect(lchToString({ l: 50, c: 30, h: 200, alpha: 0.4 })).toBe("lch(50% 30 200 / 0.4)");
  });
});

describe("oklchToString", () => {
  it("rounds L to 2dp and C to 3dp", () => {
    expect(oklchToString({ l: 0.62589, c: 0.19876, h: 250 })).toBe("oklch(0.63 0.199 250)");
  });
  it("appends alpha when < 1", () => {
    expect(oklchToString({ l: 0.5, c: 0.1, h: 100, alpha: 0.5 })).toBe("oklch(0.5 0.1 100 / 0.5)");
  });
});
