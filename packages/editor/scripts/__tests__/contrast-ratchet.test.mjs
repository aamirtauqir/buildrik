/**
 * F6 — the contrast ratchet must catch a SWAP, not just a bigger number.
 *
 * The gate compared `now > baseline` on a count. These tests plant the exact
 * shapes that check could not see, so the fix is watched failing rather than
 * assumed: a gate believed without a negative test is how this repo shipped a
 * red `gate:figma` for five days.
 */
import { describe, it, expect } from "vitest";
import { contrastKey, contrastSet, compareContrast } from "../conformance/lib.mjs";

const pair = (selector, text, color, bg, ratio) => ({ selector, text, color, bg, ratio });

describe("contrast ratchet — set, not count", () => {
  it("keys a failure by element, words and both colours", () => {
    expect(contrastKey(pair(".a", "Save", "#6b7280", "#f3f4f6", 4.39)))
      .toBe(".a | Save | #6b7280 | #f3f4f6");
  });

  it("keys an ICON failure off `label`, which is the field it carries instead of `text`", () => {
    expect(contrastKey({ selector: ".i", label: "Close", color: "#9ca3af", bg: "#fff", ratio: 2.1 }))
      .toBe(".i | Close | #9ca3af | #fff");
  });

  /* THE BUG. One pair fixed, one different pair introduced: the count is
     unchanged, so `now > baseline` was false and the gate passed. */
  it("catches a one-for-one swap that leaves the count identical", () => {
    const base = contrastSet([pair(".old", "Upload", "#6b7280", "#f3f4f6", 4.39)]);
    const now = contrastSet([pair(".new", "Publish", "#9ca3af", "#ffffff", 2.84)]);

    expect(Object.keys(now).length).toBe(Object.keys(base).length); // the count says "no change"

    const { newPairs, fixedPairs } = compareContrast(now, base);
    expect(newPairs).toHaveLength(1);
    expect(newPairs[0].key).toContain("Publish");
    expect(fixedPairs).toHaveLength(1);
    expect(fixedPairs[0]).toContain("Upload");
  });

  /* The second thing a count cannot express: 4.39 -> 2.10 is still one
     failure, so the surface got materially worse and the gate said nothing. */
  it("catches a known pair getting worse without the count moving", () => {
    const key = ".a | Save | #6b7280 | #f3f4f6";
    const { newPairs, worsePairs } = compareContrast({ [key]: 2.1 }, { [key]: 4.39 });
    expect(newPairs).toHaveLength(0);
    expect(worsePairs).toEqual([{ key, was: 4.39, now: 2.1 }]);
  });

  it("does not call an improvement a regression", () => {
    const key = ".a | Save | #6b7280 | #f3f4f6";
    const { newPairs, worsePairs, fixedPairs } = compareContrast({ [key]: 7.2 }, { [key]: 4.39 });
    expect(newPairs).toHaveLength(0);
    expect(worsePairs).toHaveLength(0);
    expect(fixedPairs).toHaveLength(0);
  });

  it("reports a fixed pair as fixed, and finds nothing to fail on", () => {
    const base = contrastSet([pair(".a", "Save", "#6b7280", "#f3f4f6", 4.39)]);
    const { newPairs, worsePairs, fixedPairs } = compareContrast({}, base);
    expect(newPairs).toHaveLength(0);
    expect(worsePairs).toHaveLength(0);
    expect(fixedPairs).toEqual([".a | Save | #6b7280 | #f3f4f6"]);
  });

  it("an empty measurement against an empty baseline is clean, not a pass by omission", () => {
    expect(compareContrast({}, {})).toEqual({ newPairs: [], worsePairs: [], fixedPairs: [] });
  });
});
