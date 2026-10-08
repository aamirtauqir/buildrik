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
    const out = inverseResolveTokens(`<i style="color: #2D6DFF"></i>`, tied);
    expect(out).toContain("{{token.color.primary}}");
    expect(out).not.toContain("{{token.color.accent}}");
  });

  it("prefers longer values over substrings (#2d6dff before #2d)", () => {
    const overlap: TokenSnapshot = {
      ...snap,
      colors: { primary: "#2D6DFF", short: "#2D" },
    };
    const out = inverseResolveTokens(`<i style="color: #2D6DFF"></i>`, overlap);
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

/* L2-001 (Critical): save-as-template ran a blind substring replace over the
   whole document. A "0" radius token landed inside #0a081e, rgba channels and
   element ids; a "4px" spacing token inside "24px"; and the placeholder names
   carried spaces the apply-side regex cannot read, so applying the template
   stripped the page's styling. */
describe("inverseResolveTokens — only whole declaration values, by property", () => {
  const live: TokenSnapshot = {
    colors: { surface: "#0a081e" },
    spacing: { "space-1": "4px" },
    typography: {},
    radius: { "radius-none": "0" },
  };

  it("never rewrites inside a hex colour, an rgba channel or an element id", () => {
    const html =
      `<div data-buildrick-id="el-d2h0ibwr5w" style="background: #10081e; color: rgba(124,109,0,0.5)"></div>`;
    expect(inverseResolveTokens(html, live)).toBe(html);
  });

  it("never rewrites part of a longer value (4px inside 24px)", () => {
    const html = `<div style="gap: 24px"></div>`;
    expect(inverseResolveTokens(html, live)).toBe(html);
  });

  it("rewrites a whole value only for a property of the token's kind", () => {
    const html = `<div style="margin: 0; border-radius: 0; padding: 4px 4px"></div>`;
    const out = inverseResolveTokens(html, live);
    expect(out).toContain("margin: 0;");
    expect(out).toContain("border-radius: {{token.radius.radius-none}}");
    expect(out).toContain("padding: {{token.spacing.space-1}} {{token.spacing.space-1}}");
  });

  it("leaves text content alone", () => {
    const html = `<p style="color: #0a081e">Call 0 4px #0a081e</p>`;
    expect(inverseResolveTokens(html, live)).toContain(">Call 0 4px #0a081e</p>");
  });

  it("skips a token whose name the apply side cannot read", () => {
    const spaced: TokenSnapshot = { ...live, radius: { "radius none": "8px" } };
    const html = `<div style="border-radius: 8px"></div>`;
    expect(inverseResolveTokens(html, spaced)).toBe(html);
  });

  it("round-trips: what is saved resolves back to the original styles", () => {
    const html =
      `<nav data-buildrick-id="el-0a0" style="background-color: #0a081e; padding: 4px; border-radius: 0; gap: 24px">Hi</nav>`;
    const back = resolveTokens(inverseResolveTokens(html, live), live);
    const el = new DOMParser().parseFromString(back, "text/html").querySelector("nav")!;
    expect(el.getAttribute("data-buildrick-id")).toBe("el-0a0");
    expect(el.style.backgroundColor).toBe("rgb(10, 8, 30)");
    expect(el.style.padding).toBe("4px");
    expect(el.style.gap).toBe("24px");
    expect(el.style.borderRadius).toBe("0px");
  });
});
