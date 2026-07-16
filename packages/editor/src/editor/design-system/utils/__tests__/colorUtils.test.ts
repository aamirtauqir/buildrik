import { describe, it, expect } from "vitest";
import {
  expandShorthand,
  isValidHex,
  hexToRgb,
  hexToHsb,
  hsbToHex,
  relativeLuminance,
  calcContrastRatio,
  calcWcagLevel,
  wcagTooltip,
} from "../colorUtils";
import type { WcagLevel } from "../../types";

describe("expandShorthand", () => {
  it("expands #rgb to #rrggbb", () => {
    expect(expandShorthand("#abc")).toBe("#aabbcc");
  });

  it("expands #rgba to #rrggbbaa", () => {
    expect(expandShorthand("#abcd")).toBe("#aabbccdd");
  });

  it("leaves 6-digit hex untouched", () => {
    expect(expandShorthand("#2D6DFF")).toBe("#2D6DFF");
  });

  it("prefixes # when a bare 6-digit value is given", () => {
    expect(expandShorthand("2D6DFF")).toBe("#2D6DFF");
  });

  it("expands bare 3-digit shorthand without #", () => {
    expect(expandShorthand("abc")).toBe("#aabbcc");
  });
});

describe("isValidHex", () => {
  it.each(["#fff", "#ffff", "#ffffff", "#ffffffff", "#2D6DFF", "#AbCdEf"])(
    "accepts %s",
    (hex) => {
      expect(isValidHex(hex)).toBe(true);
    }
  );

  it.each(["fff", "#ggg", "#12345", "#1234567", "", "#", "not-a-color"])(
    "rejects %s",
    (hex) => {
      expect(isValidHex(hex)).toBe(false);
    }
  );
});

describe("hexToRgb", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("parses shorthand hex", () => {
    expect(hexToRgb("#0f0")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("parses 8-digit hex with alpha channel", () => {
    const rgb = hexToRgb("#0000FF80");
    expect(rgb).not.toBeNull();
    expect(rgb!.r).toBe(0);
    expect(rgb!.g).toBe(0);
    expect(rgb!.b).toBe(255);
    expect(rgb!.a).toBeCloseTo(128 / 255, 5);
  });

  it("returns null on invalid input", () => {
    expect(hexToRgb("zz")).toBeNull();
    expect(hexToRgb("#12345")).toBeNull();
  });
});

describe("hexToHsb / hsbToHex", () => {
  it("converts primaries to expected hue anchors", () => {
    expect(hexToHsb("#FF0000")).toMatchObject({ h: 0, s: 1, b: 1 });
    expect(hexToHsb("#00FF00")).toMatchObject({ h: 120, s: 1, b: 1 });
    expect(hexToHsb("#0000FF")).toMatchObject({ h: 240, s: 1, b: 1 });
  });

  it("white is zero-saturation full-brightness; black is zero-brightness", () => {
    expect(hexToHsb("#FFFFFF")).toMatchObject({ h: 0, s: 0, b: 1 });
    expect(hexToHsb("#000000")).toMatchObject({ h: 0, s: 0, b: 0 });
  });

  it("falls back to black HSB for invalid input", () => {
    expect(hexToHsb("nope")).toEqual({ h: 0, s: 0, b: 0, a: 1 });
  });

  it("round-trips primaries, white and black exactly", () => {
    for (const hex of ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "#000000"]) {
      expect(hsbToHex(hexToHsb(hex))).toBe(hex);
    }
  });

  it("round-trips the cobalt accent within 1 unit per channel (hue rounding)", () => {
    const orig = hexToRgb("#2D6DFF")!;
    const round = hexToRgb(hsbToHex(hexToHsb("#2D6DFF")))!;
    expect(Math.abs(round.r - orig.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(round.g - orig.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(round.b - orig.b)).toBeLessThanOrEqual(1);
  });

  it("appends alpha hex pair when alpha < 1", () => {
    expect(hsbToHex({ h: 0, s: 1, b: 1, a: 0.5 })).toBe("#FF000080");
  });

  it("omits alpha hex pair when alpha = 1", () => {
    expect(hsbToHex({ h: 0, s: 1, b: 1, a: 1 })).toBe("#FF0000");
  });
});

describe("relativeLuminance", () => {
  it("white is 1, black is 0", () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
    expect(relativeLuminance(0, 0, 0)).toBe(0);
  });

  it("green dominates the weighting (0.7152 > 0.2126 > 0.0722)", () => {
    const g = relativeLuminance(0, 255, 0);
    const r = relativeLuminance(255, 0, 0);
    const b = relativeLuminance(0, 0, 255);
    expect(g).toBeGreaterThan(r);
    expect(r).toBeGreaterThan(b);
  });
});

describe("calcContrastRatio", () => {
  it("black on white is 21:1 (the WCAG maximum)", () => {
    expect(calcContrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("is symmetric — order of fg/bg doesn't matter", () => {
    expect(calcContrastRatio("#FFFFFF", "#000000")).toBeCloseTo(
      calcContrastRatio("#000000", "#FFFFFF"),
      10
    );
  });

  it("identical colors have ratio 1", () => {
    expect(calcContrastRatio("#2D6DFF", "#2D6DFF")).toBe(1);
  });

  it("returns 1 when either color is invalid", () => {
    expect(calcContrastRatio("junk", "#FFFFFF")).toBe(1);
    expect(calcContrastRatio("#FFFFFF", "junk")).toBe(1);
  });
});

describe("calcWcagLevel", () => {
  it("black on white → aaa (≥7)", () => {
    expect(calcWcagLevel("#000000", "#FFFFFF")).toBe("aaa");
  });

  it("#767676 on white → aa (≈4.54, ≥4.5 but <7)", () => {
    expect(calcWcagLevel("#767676", "#FFFFFF")).toBe("aa");
  });

  it("#8A8A8A on white → aa-large (≥3 but <4.5)", () => {
    expect(calcWcagLevel("#8A8A8A", "#FFFFFF")).toBe("aa-large");
  });

  it("#999999 on white → fail (<3)", () => {
    expect(calcWcagLevel("#999999", "#FFFFFF")).toBe("fail");
  });

  it("translucent background (alpha < 0.8) → na", () => {
    expect(calcWcagLevel("#000000", "#FFFFFF66")).toBe("na");
  });

  it("near-opaque background (alpha ≥ 0.8) is still measured", () => {
    // 0xEE = 238/255 ≈ 0.93 alpha — above the 0.8 cutoff.
    expect(calcWcagLevel("#000000", "#FFFFFFEE")).toBe("aaa");
  });
});

describe("wcagTooltip", () => {
  it("returns a distinct non-empty string per level", () => {
    const levels: WcagLevel[] = ["aaa", "aa", "aa-large", "fail", "na"];
    const texts = levels.map(wcagTooltip);
    texts.forEach((t) => expect(t.length).toBeGreaterThan(0));
    expect(new Set(texts).size).toBe(levels.length);
  });

  it("mentions the ratio thresholds in the pass levels", () => {
    expect(wcagTooltip("aaa")).toContain("7:1");
    expect(wcagTooltip("aa")).toContain("4.5:1");
    expect(wcagTooltip("aa-large")).toContain("3:1");
  });
});
