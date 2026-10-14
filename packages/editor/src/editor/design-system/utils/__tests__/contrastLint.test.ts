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
import { DEFAULT_TOKENS } from "@/editor/design-system/constants";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/editor/design-system/types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";
import { buildContrastIssues, contrastLintMode, findSurfaceToken, resolveSurface, contrastFails, buildDarkPairIssues, type StyledNode } from "../contrastLint";
import { proposeMissingDarks } from "@/engine/designSystem/scale";

const colors = DEFAULT_TOKENS.filter((t) => t.category === "colors");

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
    const tooPale = v6Token({ id: "color-pale", value: "#DDEEDD", layer: "semantic" });
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

  it("never measures a fill, border or on-primary colour as text on the page", () => {
    const ids = buildContrastIssues(colors, "light").map((i) => i.tokenId);
    for (const id of ["color-on-primary", "color-surface-raised", "color-surface-muted", "color-border-subtle"]) {
      expect(colors.some((t) => t.id === id)).toBe(true);
      expect(ids).not.toContain(id);
    }
  });

  it("matches on value regardless of hex case", () => {
    const surface = findSurfaceToken(colors);
    const bg = resolveSurface(surface, colors, "light");
    const lower = v6Token({ id: "color-copy", value: bg.toLowerCase(), layer: "semantic" });
    expect(contrastFails(lower, [...colors, lower], bg, "light", surface?.id)).toBe(false);
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

  /* The semantic tokens alias primitives, so values resolve against the full
     list; only the surface SEARCH is limited to what is in view. */
  it("finds the surface when only the semantic tokens are in view", () => {
    const surface = findSurfaceToken(semanticOnly);
    expect(surface?.id).toBe("color-surface");
    expect(resolveSurface(surface, colors, "light")).toBe(
      resolveTokenLiteral(colors, "color-background", "light"),
    );
  });

  it("does not report the page colour as failing against itself", () => {
    const surface = findSurfaceToken(semanticOnly);
    const bg = resolveSurface(surface, colors, "light");
    const failing = semanticOnly.filter((t) => contrastFails(t, colors, bg, "light", surface?.id));
    expect(failing.map((t) => t.id)).not.toContain("color-surface");
  });

  it("still prefers color-background when both are present", () => {
    expect(findSurfaceToken(colors)?.id).toBe("color-background");
  });
});

describe("contrast lint — primitives are not measured", () => {
  it("never reports a primitive, which may hold a dark-mode literal", () => {
    const tokens = [
      v6Token({ id: "color-background", value: "#FFFFFF", layer: "semantic" }),
      v6Token({ id: "custom-text-dark", value: "#F9FAFB" }),
    ];
    expect(buildContrastIssues(tokens, "light")).toEqual([]);
  });
});

describe("contrast findings carry the engine's fix hint (B9 / SH-64)", () => {
  it("every contrast issue carries a hint the Issues panel's Fix can act on", () => {
    const tokens = [
      v6Token({ id: "color-background", name: "Background", value: "#FFFFFF", layer: "semantic" }),
      v6Token({ id: "color-faint", name: "Faint", value: "#EEEEEE", layer: "semantic" }),
    ];
    const issues = buildContrastIssues(tokens, "light");
    expect(issues).toHaveLength(1);
    /* DQ-010: the hint names the surface, so the engine's fix searches to AA
       against it instead of shifting lightness a fixed 22%. */
    expect(issues[0]).toMatchObject({ tokenId: "color-faint", autoFixHint: "contrast:#FFFFFF" });
  });
});

/* Moved from ColorTokenList.contrast-surface.test.tsx when the Colours table
   stopped drawing lint state (C1 (ii), board 7315:80955): the finding now
   lives on the Brand checks page, which reads this function via useDSLint.
   The regression it guards is unchanged — contrast used to be measured
   against a hardcoded #0A0A0A, inverting every verdict. */
describe("contrast is checked against the customer's surface, not a hardcoded one", () => {
  const LIGHT_SITE = [
    v6Token({ id: "color-background", name: "Background", value: "#FFFFFF", dark: "#111827", group: "surface" }),
    v6Token({ id: "color-text", name: "Text", value: "#111827", dark: "#F9FAFB", group: "surface" }),
    v6Token({ id: "color-pale", name: "Pale", value: "#F5F5F5", dark: "#F5F5F5", group: "brand" }),
  ];
  const flagged = (tokens: DesignToken[], mode: "light" | "dark") =>
    buildContrastIssues(tokens, mode).map((i) => i.tokenId);

  it("flags the near-white token on a white page, and only that one", () => {
    expect(flagged(LIGHT_SITE, "light")).toEqual(["color-pale"]);
  });

  it("follows the customer into dark mode rather than assuming one surface", () => {
    expect(flagged(LIGHT_SITE, "dark")).toEqual([]);
  });

  it("falls back to white, never to near-black, when the palette has no background token", () => {
    const noSurface = [v6Token({ id: "color-paper", name: "Paper", value: "#F2F2F2", group: "brand", layer: "semantic" })];
    expect(flagged(noSurface, "light")).toEqual(["color-paper"]);
  });
});

describe("buildDarkPairIssues (BRP1-M8: dark text left on a card that turns dark)", () => {
  const FILLED = proposeMissingDarks(DEFAULT_TOKENS).tokens;
  const node = (styles: Record<string, string>, parent: StyledNode | null = null): StyledNode => ({
    getStyles: () => styles,
    getParent: () => parent,
  });

  it("flags raw text inside a card bound to the raised surface once that surface turns dark", () => {
    expect(resolveTokenLiteral(FILLED, "color-surface-raised", "dark")).toBe("#1E293B");
    const card = node({ background: "var(--buildrick-design-color-surface-raised)" });
    const body = node({}, card);
    const p = node({ color: "#666" }, body);
    const issues = buildDarkPairIssues([card, body, p], FILLED);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: "dark-mode-pair", tokenId: "color-surface-raised", severity: "warning" });
    expect(issues[0].message).toContain("#666666");
    expect(issues[0].message).toContain("#1E293B");
  });

  it("flags a token text colour over a raw light fill (light-on-light in dark)", () => {
    const box = node({ "background-color": "#FFFFFF" });
    const h = node({ color: "var(--buildrick-design-color-text)" }, box);
    expect(buildDarkPairIssues([box, h], FILLED).map((i) => i.tokenId)).toEqual(["color-text"]);
  });

  it("flags raw dark text straight on the page root once the page background turns dark", () => {
    const root = node({ "background-color": "var(--buildrick-design-color-page-background)" });
    const h = node({ color: "#333333" }, root);
    expect(buildDarkPairIssues([root, h], FILLED).map((i) => i.tokenId)).toEqual(["color-page-background"]);
  });

  it("stays quiet on raw/raw, token/token, a surface without a dark value, and a pair that already fails in light", () => {
    const raw = node({ background: "#FFFFFF" });
    const tokens = node({ background: "var(--buildrick-design-color-surface-raised)" });
    const noDark = DEFAULT_TOKENS.filter((t) => t.id !== "color-surface-raised").concat(
      FILLED.filter((t) => t.id === "color-surface-raised").map((t) => ({ ...t, modes: { light: t.modes.light } })),
    );
    expect(buildDarkPairIssues([node({ color: "#333" }, raw)], FILLED)).toEqual([]);
    expect(buildDarkPairIssues([node({ color: "var(--buildrick-design-color-text)" }, tokens)], FILLED)).toEqual([]);
    expect(buildDarkPairIssues([node({ color: "#333" }, tokens)], noDark)).toEqual([]);
    expect(buildDarkPairIssues([node({ color: "#EEEEEE" }, tokens)], FILLED)).toEqual([]);
  });
});

/* L4-021 / L4-022: the Brand preview's Light/Dark switch sets the editor's
   global colour mode, and the linter measured in it — a light-only site
   (darkMode "off") gained four dark-mode contrast failures, and Fix › then
   darkened a colour that was failing against the DARK surface. */
describe("contrast is measured in the mode the site ships", () => {
  it("a site with dark mode off is measured in light, whatever the editor's mode", () => {
    expect(contrastLintMode("off", "dark")).toBe("light");
    expect(contrastLintMode(undefined, "dark")).toBe("light");
  });

  it("a site that ships dark mode follows the editor's mode", () => {
    expect(contrastLintMode("auto", "dark")).toBe("dark");
    expect(contrastLintMode("auto", "light")).toBe("light");
  });

  it("a dark-mode finding offers no auto-fix — the fix rewrites the light value", () => {
    const tokens = [
      v6Token({ id: "color-background", name: "Background", value: "#FFFFFF", dark: "#111111", layer: "semantic" }),
      v6Token({ id: "color-ink", name: "Ink", value: "#222222", dark: "#1A1A1A", layer: "semantic" }),
    ];
    const issues = buildContrastIssues(tokens, "dark");
    expect(issues.map((i) => i.tokenId)).toContain("color-ink");
    expect(issues.find((i) => i.tokenId === "color-ink")?.autoFixHint).toBeUndefined();
  });
});
