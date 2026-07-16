import { describe, it, expect } from "vitest";
import { suggestContrastFix } from "../contrastFix";
import { calcContrastRatio, hexToHsb } from "../colorUtils";

describe("suggestContrastFix — binary search to WCAG AA (4.5)", () => {
  it("returns null when the pair already meets the default AA target", () => {
    expect(suggestContrastFix("#000000", "#FFFFFF")).toBeNull();
    expect(suggestContrastFix("#767676", "#FFFFFF")).toBeNull(); // ≈4.54 — just over
  });

  it("darkens a failing foreground on a light background until AA passes", () => {
    // #999999 on white ≈ 2.85 — fails AA.
    const fixed = suggestContrastFix("#999999", "#FFFFFF");
    expect(fixed).not.toBeNull();
    expect(calcContrastRatio(fixed!, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    // Light background → the fix must be darker, not lighter.
    expect(hexToHsb(fixed!).b).toBeLessThan(hexToHsb("#999999").b);
  });

  it("lightens a failing foreground on a dark background until AA passes", () => {
    // #666666 on black ≈ 3.66 — fails AA.
    const fixed = suggestContrastFix("#666666", "#000000");
    expect(fixed).not.toBeNull();
    expect(calcContrastRatio(fixed!, "#000000")).toBeGreaterThanOrEqual(4.5);
    expect(hexToHsb(fixed!).b).toBeGreaterThan(hexToHsb("#666666").b);
  });

  it("makes the minimum brightness adjustment (result lands near the target, not at an extreme)", () => {
    const fixed = suggestContrastFix("#999999", "#FFFFFF")!;
    const ratio = calcContrastRatio(fixed, "#FFFFFF");
    // 20 binary-search iterations converge tightly; hex quantization allows
    // slight overshoot but nowhere near the 21:1 extreme of pure black.
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(5.5);
  });

  it("preserves hue and saturation — only brightness moves", () => {
    const before = hexToHsb("#FF9999"); // light red on white fails AA
    const fixed = suggestContrastFix("#FF9999", "#FFFFFF");
    expect(fixed).not.toBeNull();
    const after = hexToHsb(fixed!);
    expect(after.h).toBeCloseTo(before.h, 0);
    expect(after.s).toBeCloseTo(before.s, 1);
  });

  it("honors a custom target ratio", () => {
    // #767676 passes 4.5 but not 7 — with target 7 a fix must be produced.
    const fixed = suggestContrastFix("#767676", "#FFFFFF", 7);
    expect(fixed).not.toBeNull();
    expect(calcContrastRatio(fixed!, "#FFFFFF")).toBeGreaterThanOrEqual(7);
  });

  it("returns null when no brightness adjustment can reach the target", () => {
    // Mid-gray background: even pure white/black tops out around 4:1 —
    // a 21:1 target is unreachable, so the post-search verification bails.
    expect(suggestContrastFix("#888888", "#7F7F7F", 21)).toBeNull();
  });
});
