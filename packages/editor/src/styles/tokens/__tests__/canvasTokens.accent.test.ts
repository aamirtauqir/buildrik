/**
 * Regression: the canvas overlays must paint the CURRENT accent.
 *
 * `canvasTokens.colors.primary.default` resolves through `var(--bk-accent)` and
 * moved with the 2026-07-30 migration to `#1A56DB`. The alpha steps beside it
 * cannot use a CSS variable — `alpha30` is handed to `ctx.fillStyle` in
 * RulersOverlay — so they are literal rgba, and they stayed on the retired
 * cobalt `rgb(45, 109, 255)`. The canvas drew its selection outline in one blue
 * and the grid, guides and glows around it in another; measured live before
 * this test existed. Sibling of defaultStyles.accent.test.ts.
 */
import { describe, it, expect } from "vitest";
import { canvasTokens } from "../canvas.tokens";

/** #1A56DB — keep in step with --bk-accent in themes/tokens.generated.css. */
const ACCENT_RGB = "26, 86, 219";
const RETIRED_RGB = /45,\s*109,\s*255|64,\s*110,\s*214/;

function walk(node: unknown, path: string, out: string[]): void {
  if (typeof node === "string") {
    if (RETIRED_RGB.test(node)) out.push(`${path} = ${node}`);
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, out);
  }
}

describe("canvas tokens carry the current accent", () => {
  it("has no retired accent rgb anywhere in the token tree", () => {
    const offenders: string[] = [];
    walk(canvasTokens, "", offenders);
    expect(offenders).toEqual([]);
  });

  it("every alpha step of the accent ramp uses the accent rgb", () => {
    const ramp = canvasTokens.colors.primary as Record<string, string>;
    const alphas = Object.entries(ramp).filter(([, v]) => v.startsWith("rgba("));
    expect(alphas.length).toBeGreaterThan(0);
    for (const [step, value] of alphas) {
      expect(`${step}: ${value}`).toContain(ACCENT_RGB);
    }
  });

  it("keeps the ramp anchored on the token, not a literal", () => {
    expect(canvasTokens.colors.primary.default).toBe("var(--bk-accent)");
  });
});
