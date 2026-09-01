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
 * Comparing by value kept the two real warnings and dropped the two impossible
 * ones. Those two real warnings are gone as of 2026-09-02: accent and success
 * were both #22C55E, 2.18 against the page, and are now green-700 #15803D at
 * 4.79. A fresh site opens clean, so the "genuinely fails" case below builds
 * its own failing token instead of leaning on the shipped palette being wrong.
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

  it("still flags a foreground colour that genuinely fails", () => {
    /* Built here rather than taken from DEFAULT_TOKENS: the shipped palette
       passes now, and a test that needs the product to be broken in order to
       prove the rule stops proving it the moment the product is fixed. */
    const tooPale: DesignToken = { ...(colors[0] as DesignToken), id: "color-pale", value: "#DDEEDD" };
    const ids = buildContrastIssues([...colors, tooPale], "light").map((i) => i.tokenId);
    expect(ids).toContain("color-pale");
  });

  it("opens a fresh site with no contrast warnings at all", () => {
    /* Was `toHaveLength(2)` — accent and success, both #22C55E at 2.18. That
       assertion pinned a defect as an invariant: every new site opened on two
       warnings its owner had not caused, and board 164:35's "No issues." was
       unreachable by construction. */
    expect(buildContrastIssues(colors, "light")).toHaveLength(0);
  });

  it("matches on value regardless of hex case", () => {
    const surface = findSurfaceToken(colors);
    const bg = resolveSurface(surface, "light");
    const lower: DesignToken = { ...(colors[0] as DesignToken), id: "color-copy", value: bg.toLowerCase() };
    expect(contrastFails(lower, bg, "light", surface?.id)).toBe(false);
  });
});

/**
 * Beginner mode renders the semantic tokens only. Measured live 2026-08-18:
 * the colour list's chip read "Issues (1)" and the one issue was **Surface**
 * — the page colour — at "1.0:1 → 4.5:1", with a Fix that would have set the
 * page background to #767677. `color-background` is not in the Beginner view,
 * so the surface resolved to the white fallback and the real page colour
 * failed against it at 1.05.
 */
describe("contrast lint — the page colour is findable under its semantic name", () => {
  const semanticOnly = colors.filter((t) => t.group === "semantic");

  it("finds the surface when only the semantic tokens are in view", () => {
    const surface = findSurfaceToken(semanticOnly);
    expect(surface?.id).toBe("color-surface");
    expect(resolveSurface(surface, "light")).toBe(
      colors.find((t) => t.id === "color-background")?.value,
    );
  });

  it("does not report the page colour as failing against itself", () => {
    expect(buildContrastIssues(semanticOnly, "light").map((i) => i.tokenId)).not.toContain("color-surface");
  });

  it("still prefers color-background when both are present", () => {
    expect(findSurfaceToken(colors)?.id).toBe("color-background");
  });
});
