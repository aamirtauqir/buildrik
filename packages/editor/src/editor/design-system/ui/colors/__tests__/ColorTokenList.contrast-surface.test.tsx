/**
 * Contrast is measured against the CUSTOMER's page, not a hardcoded surface.
 *
 * Regression for a fully inverted a11y lint. `ColorTokenList` used to check
 * every colour token against a hardcoded `#0A0A0A`, commented "editor canvas
 * dark surface" — from before the 2026-04-18 theme unification made the editor
 * light, and irrelevant regardless, because these tokens are the customer's
 * site colours.
 *
 * Measured, the inversion was total:
 *   #FFFFFF vs #0A0A0A -> 19.80 aaa   (white on white, reported as perfect)
 *   #111827 vs #0A0A0A ->  1.12 fail  (17.74 on a real page, reported broken)
 *
 * These assert the direction, not the pixel: a near-white token on a white
 * page must be reported failing, and a near-black one must not.
 *
 * @license BSD-3-Clause
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, within, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { DesignToken, TokenDiff } from "../../../types";
import { ColorTokenList } from "../ColorTokenList";

/** A customer palette with a light page and one unreadable token on it. */
const LIGHT_SITE: DesignToken[] = [
  { id: "color-background", name: "Background", value: "#FFFFFF", darkValue: "#111827",
    category: "colors", type: "color", kind: "color", group: "surface" } as DesignToken,
  { id: "color-text", name: "Text", value: "#111827", darkValue: "#F9FAFB",
    category: "colors", type: "color", kind: "color", group: "surface" } as DesignToken,
  { id: "color-pale", name: "Pale", value: "#F5F5F5", darkValue: "#F5F5F5",
    category: "colors", type: "color", kind: "color", group: "brand" } as DesignToken,
];

const baseProps = {
  pendingDiff: {} as Record<string, TokenDiff>,
  onColorChange: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  canUndo: () => false,
  canRedo: () => false,
  onAddToken: vi.fn(),
};

function renderList(tokens: DesignToken[], extra: Record<string, unknown> = {}) {
  return render(<ColorTokenList tokens={tokens} {...baseProps} {...extra} />);
}

describe("ColorTokenList — contrast is checked against the customer's surface", () => {
  /** Click the Issues filter and report WHICH tokens survive it.
   *  Counting is not identifying: against the old hardcoded #0A0A0A this
   *  palette also produced exactly one issue — the wrong one. A count-only
   *  assertion passed with the bug in place, which is how this helper exists. */
  function flaggedTokens(extra: Record<string, unknown> = {}, tokens = LIGHT_SITE): string[] {
    // Scoped to this render's container: a test that renders twice (light vs
    // dark) would otherwise match the previous tree through `screen`.
    const { container } = renderList(tokens, extra);
    const issues = within(container).queryByRole("button", { name: /^Issues/ });
    if (issues) fireEvent.click(issues);
    return tokens
      .map((t) => t.name)
      .filter((name) => (container.textContent ?? "").includes(name));
  }

  it("flags the near-white token on a white page, and only that one", () => {
    // #F5F5F5 on #FFFFFF is 1.09. Against the old #0A0A0A it was 18.16 (aaa)
    // and this token was invisible to the lint.
    expect(flaggedTokens()).toEqual(["Pale"]);
  });

  it("does NOT flag near-black body text on a white page", () => {
    // #111827 vs the old #0A0A0A was 1.12 — reported broken while being the
    // most readable colour in the palette.
    expect(flaggedTokens()).not.toContain("Text");
  });

  it("never flags the page colour against itself", () => {
    // Every surface is 1:1 with itself. The old hardcoded background hid this
    // by accident; resolving the real one would surface it as a false finding.
    expect(flaggedTokens()).not.toContain("Background");
  });

  it("follows the customer into dark mode rather than assuming one surface", () => {
    const composer = {
      colorMode: { resolved: () => "dark" as const },
      on: vi.fn(),
      off: vi.fn(),
    } as never;
    // Dark page (#111827): every token's own dark value clears it, so the
    // light-page finding disappears. Identical verdicts across modes would
    // mean the surface was assumed rather than read.
    expect(flaggedTokens()).toEqual(["Pale"]);
    expect(flaggedTokens({ composer })).toEqual([]);
  });

  it("falls back to white, never to near-black, when the palette has no background token", () => {
    // Near-white on white: 1.17, a failure. On the old near-black fallback the
    // same token scored ~15 and the finding vanished — which is the thing this
    // guards. (It used to use #FFFFFF itself; a token whose value IS the page
    // colour is no longer a contrast finding, so the fixture moved one shade
    // off white and still separates the two fallbacks.)
    const noSurface: DesignToken[] = [
      { id: "color-paper", name: "Paper", value: "#F2F2F2",
        category: "colors", type: "color", kind: "color", group: "brand" } as DesignToken,
    ];
    expect(flaggedTokens({}, noSurface)).toEqual(["Paper"]);
  });
});
