// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { inverseResolveTokens } from "../inverseResolveTokens";
import { resolveTokens } from "../resolveTemplateTokens";
import type { TokenSnapshot } from "../tokenSnapshot";

const snap: TokenSnapshot = {
  colors: {
    primary: "#2D6DFF",
    text: "#0F172A",
  },
  spacing: {
    md: "16px",
    lg: "24px",
  },
  typography: {},
  radius: {
    sm: "4px",
  },
};

describe("inverseResolveTokens", () => {
  it("replaces a single hex color with its placeholder", () => {
    const html = `<div style="color: #2D6DFF"></div>`;
    const out = inverseResolveTokens(html, snap);
    expect(out).toContain("{{token.color.primary}}");
    expect(out).not.toContain("#2D6DFF");
  });

  it("matches hex case-insensitively (lowercase input → same placeholder)", () => {
    const html = `<div style="color: #2d6dff"></div>`;
    const out = inverseResolveTokens(html, snap);
    expect(out).toContain("{{token.color.primary}}");
  });

  it("replaces multiple distinct tokens in one pass", () => {
    const html = `<div style="color: #2D6DFF; padding: 16px; border-radius: 4px"></div>`;
    const out = inverseResolveTokens(html, snap);
    expect(out).toContain("{{token.color.primary}}");
    expect(out).toContain("{{token.spacing.md}}");
    expect(out).toContain("{{token.radius.sm}}");
  });

  it("leaves non-token values verbatim", () => {
    const html = `<div style="color: #ABCDEF; padding: 7px"></div>`;
    const out = inverseResolveTokens(html, snap);
    expect(out).toBe(html);
  });

  it("invokes onSwap for every successful substitution", () => {
    const html = `<div style="color: #2D6DFF; padding: 16px"></div>`;
    const onSwap = vi.fn();
    inverseResolveTokens(html, snap, { onSwap });
    expect(onSwap).toHaveBeenCalledWith("#2D6DFF", "{{token.color.primary}}");
    expect(onSwap).toHaveBeenCalledWith("16px", "{{token.spacing.md}}");
  });

  it("returns input unchanged when the snapshot is empty", () => {
    const html = `<div style="color: #2D6DFF"></div>`;
    const empty: TokenSnapshot = { colors: {}, spacing: {}, typography: {}, radius: {} };
    expect(inverseResolveTokens(html, empty)).toBe(html);
  });

  it("returns input unchanged when html is empty", () => {
    expect(inverseResolveTokens("", snap)).toBe("");
  });

  it("first-write wins on tie (two tokens with same value)", () => {
    const tied: TokenSnapshot = {
      ...snap,
      colors: { primary: "#2D6DFF", accent: "#2D6DFF" },
    };
    const out = inverseResolveTokens(`<i>#2D6DFF</i>`, tied);
    expect(out).toContain("{{token.color.primary}}");
    expect(out).not.toContain("{{token.color.accent}}");
  });

  it("prefers longer values over substrings (#2d6dff before #2d)", () => {
    const overlap: TokenSnapshot = {
      ...snap,
      colors: { primary: "#2D6DFF", short: "#2D" },
    };
    const out = inverseResolveTokens(`<i>#2D6DFF</i>`, overlap);
    expect(out).toContain("{{token.color.primary}}");
    expect(out).not.toContain("{{token.color.short}}");
  });

  it("round-trip: resolve → inverse → resolve produces same end state", () => {
    const original = `<button style="background: #2D6DFF; padding: 16px">x</button>`;
    const inverted = inverseResolveTokens(original, snap);
    expect(inverted).toContain("{{token.color.primary}}");
    expect(inverted).toContain("{{token.spacing.md}}");
    const reResolved = resolveTokens(inverted, snap);
    // DOMPurify may reformat, but the resolved values land in the output.
    expect(reResolved).toContain("#2D6DFF");
    expect(reResolved).toContain("16px");
  });
});
