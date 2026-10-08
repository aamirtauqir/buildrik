import { describe, it, expect } from "vitest";
import {
  quantizePixels, extractSvgColors, normalizeColorCounts, pickBrandRoles, mapFontFamily, downscaleSize,
} from "../brandColors";

function pixels(spec: Array<[string, number, number?]>): Uint8ClampedArray {
  const out: number[] = [];
  for (const [hex, n, alpha = 255] of spec) {
    const v = parseInt(hex.slice(1), 16);
    for (let i = 0; i < n; i++) out.push((v >> 16) & 255, (v >> 8) & 255, v & 255, alpha);
  }
  return new Uint8ClampedArray(out);
}

describe("quantizePixels (spec test 14: fixed images give fixed palettes)", () => {
  it("counts exact colours, most frequent first, and is deterministic", () => {
    const img = pixels([["#1A56DB", 60], ["#F59E0B", 30], ["#FFFFFF", 10]]);
    const out = quantizePixels(img);
    expect(out.slice(0, 3)).toEqual([
      { hex: "#1A56DB", count: 60 }, { hex: "#F59E0B", count: 30 }, { hex: "#FFFFFF", count: 10 },
    ]);
    expect(quantizePixels(img)).toEqual(out);
  });

  it("ignores transparent pixels", () => {
    expect(quantizePixels(pixels([["#000000", 500, 0], ["#C2410C", 5]]))).toEqual([{ hex: "#C2410C", count: 5 }]);
  });

  it("merges near-identical shades into one colour", () => {
    expect(quantizePixels(pixels([["#1A56DB", 50], ["#1B57DC", 50]]))).toHaveLength(1);
  });
});

describe("extractSvgColors (spec test 28: SVG parsed, never rasterized)", () => {
  it("reads fill, stroke and stop-color from attributes and style", () => {
    const svg = `<svg><path fill="#1A56DB"/><path style="fill:#1a56db;stroke:none"/>
      <circle fill="currentColor"/><stop stop-color="rgb(245,158,11)"/><rect fill="url(#g)"/></svg>`;
    expect(extractSvgColors(svg)).toEqual([{ hex: "#1A56DB", count: 2 }, { hex: "#F59E0B", count: 1 }]);
  });
});

describe("normalizeColorCounts", () => {
  it("parses literals, drops translucent ones, merges equal colours", () => {
    expect(normalizeColorCounts([
      { value: "#1a56db", count: 3 }, { value: "rgb(26, 86, 219)", count: 2 },
      { value: "rgba(0,0,0,.5)", count: 9 }, { value: "#zzz", count: 4 },
    ])).toEqual([{ hex: "#1A56DB", count: 5 }]);
  });
});

describe("pickBrandRoles (no AI — OQ-9)", () => {
  it("primary is the most saturated of the three most frequent brand colours; accent the next distinct hue", () => {
    expect(pickBrandRoles([
      { hex: "#0E7490", count: 60 }, { hex: "#1A56DB", count: 30 }, { hex: "#F59E0B", count: 10 },
      { hex: "#FFFFFF", count: 400 }, { hex: "#111827", count: 200 },
    ])).toEqual({ primary: "#1A56DB", accent: "#0E7490" });
  });

  it("returns null for a monochrome logo", () => {
    expect(pickBrandRoles([{ hex: "#000000", count: 90 }, { hex: "#FFFFFF", count: 300 }, { hex: "#E5E7EB", count: 4 }])).toBeNull();
  });
});

describe("mapFontFamily (OQ-11)", () => {
  it("keeps a catalogue family and replaces any other with its generic's first catalogue family", () => {
    expect(mapFontFamily("lora")).toEqual({ family: "Lora" });
    expect(mapFontFamily("Brand Sans Pro", "sans-serif")).toEqual({ family: "Inter", replaced: "Brand Sans Pro" });
    expect(mapFontFamily("Tiempos Headline", "serif")).toEqual({ family: "Playfair Display", replaced: "Tiempos Headline" });
    expect(mapFontFamily("Berkeley Mono")).toEqual({ family: "Fira Code", replaced: "Berkeley Mono" });
  });
});

describe("downscaleSize (spec test 28: > 4 MP downscaled)", () => {
  it("caps at 4 MP keeping the aspect ratio, leaves small images alone", () => {
    const big = downscaleSize(6000, 4000);
    expect(big.width * big.height).toBeLessThanOrEqual(4_000_000);
    expect(Math.abs(big.width / big.height - 1.5)).toBeLessThan(0.01);
    expect(downscaleSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
