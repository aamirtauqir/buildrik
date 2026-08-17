/**
 * The page colour is not text on the page — under ANY id.
 *
 * Walked live 2026-08-18: a brand-new site opens the Issues panel on "All · 4".
 * Two of those four are the page background compared against itself —
 * `color-slate-50` and `color-surface` are both #F8FAFC, the same value as
 * `color-background`, so they score 1.00 and can never be fixed: changing
 * Slate 50 until it passes against the page is changing what Slate 50 is.
 *
 * `contrastFails` already carried the rule ("never compare it to itself") but
 * enforced it by ID, and the palette ships the same colour under three ids.
 * Comparing by value keeps the two real warnings (accent and success are both
 * #22C55E at 2.18 against the page) and drops the two impossible ones.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "../../constants";
import type { DesignToken } from "../../types";
import { buildContrastIssues, findSurfaceToken, resolveSurface, contrastFails } from "../contrastLint";

const colors = DEFAULT_TOKENS.filter((t) => t.category === "colors") as DesignToken[];

describe("contrast lint — a surface colour is not a foreground colour", () => {
  it("does not flag a token that is the page colour under another id", () => {
    const ids = buildContrastIssues(colors, "light").map((i) => i.tokenId);
    expect(ids).not.toContain("color-slate-50");
    expect(ids).not.toContain("color-surface");
  });

  it("still flags foreground colours that genuinely fail", () => {
    const ids = buildContrastIssues(colors, "light").map((i) => i.tokenId);
    expect(ids).toContain("color-accent");
    expect(ids).toContain("color-success");
  });

  it("leaves a fresh site with only the fixable warnings", () => {
    expect(buildContrastIssues(colors, "light")).toHaveLength(2);
  });

  it("matches on value regardless of hex case", () => {
    const surface = findSurfaceToken(colors);
    const bg = resolveSurface(surface, "light");
    const lower: DesignToken = { ...(colors[0] as DesignToken), id: "color-copy", value: bg.toLowerCase() };
    expect(contrastFails(lower, bg, "light", surface?.id)).toBe(false);
  });
});
