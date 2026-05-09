// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { resolveTokens } from "../resolveTemplateTokens";
import {
  snapshotFromTokens,
  snapshotFromComputedStyle,
  type TokenSnapshot,
} from "../tokenSnapshot";
import type { DesignToken } from "../../../../../design-system/types";

const sampleTokens: DesignToken[] = [
  {
    id: "color-primary",
    name: "Primary",
    value: "#2D6DFF",
    category: "colors",
    cssVar: "--buildrick-design-color-primary",
    type: "color",
    kind: "color",
  },
  {
    id: "color-text",
    name: "Text",
    value: "#0F172A",
    category: "colors",
    cssVar: "--buildrick-design-color-text",
    type: "color",
    kind: "color",
  },
  {
    id: "spacing-md",
    name: "Medium",
    value: "16px",
    category: "spacing",
    cssVar: "--buildrick-design-spacing-md",
    type: "string",
    kind: "spacing",
  },
  {
    id: "radius-sm",
    name: "Small",
    value: "4px",
    category: "effects",
    cssVar: "--buildrick-design-radius-sm",
    type: "string",
    kind: "radius",
  },
];

const snap: TokenSnapshot = snapshotFromTokens(sampleTokens);

describe("snapshotFromTokens", () => {
  it("groups tokens by kind under typed buckets", () => {
    expect(snap.colors.primary).toBe("#2D6DFF");
    expect(snap.colors.text).toBe("#0F172A");
    expect(snap.spacing.md).toBe("16px");
    expect(snap.radius.sm).toBe("4px");
  });

  it("returns empty buckets when input has no matching tokens", () => {
    const empty = snapshotFromTokens([]);
    expect(empty).toEqual({ colors: {}, spacing: {}, typography: {}, radius: {} });
  });

  it("derives kind from category when token.kind missing (legacy compat)", () => {
    const legacy: DesignToken[] = [
      {
        id: "color-legacy",
        name: "Legacy",
        value: "#abcdef",
        category: "colors",
        cssVar: "--buildrick-design-color-legacy",
        type: "color",
        // no `kind` set
      },
    ];
    const s = snapshotFromTokens(legacy);
    expect(s.colors.legacy).toBe("#abcdef");
  });
});

describe("snapshotFromComputedStyle", () => {
  it("reads computed values from :root via getPropertyValue", () => {
    document.documentElement.style.setProperty("--buildrick-design-color-primary", "#FF0000");
    const s = snapshotFromComputedStyle(document.documentElement, sampleTokens);
    expect(s.colors.primary).toBe("#FF0000");
    document.documentElement.style.removeProperty("--buildrick-design-color-primary");
  });

  it("falls back to token.value when computed is empty", () => {
    // No properties set → falls back to in-memory values.
    const s = snapshotFromComputedStyle(document.documentElement, sampleTokens);
    expect(s.colors.primary).toBe("#2D6DFF");
  });
});

describe("resolveTokens", () => {
  it("replaces a single placeholder with the matching token value", () => {
    const html = `<div style="color: {{token.color.primary}}"></div>`;
    const out = resolveTokens(html, snap);
    expect(out).toContain("color: #2D6DFF");
    expect(out).not.toContain("{{token.color.primary}}");
  });

  it("replaces multiple placeholders in one pass", () => {
    const html = `<div style="color: {{token.color.primary}}; padding: {{token.spacing.md}}; border-radius: {{token.radius.sm}}"></div>`;
    const out = resolveTokens(html, snap);
    expect(out).toContain("color: #2D6DFF");
    expect(out).toContain("padding: 16px");
    expect(out).toContain("border-radius: 4px");
  });

  it("accepts kind aliases (color/colors, space/spacing, radius/radii, type/typography/font)", () => {
    const html = `<a style="color: {{token.colors.primary}}; padding: {{token.space.md}}; border-radius: {{token.radii.sm}}">x</a>`;
    const out = resolveTokens(html, snap);
    expect(out).toContain("color: #2D6DFF");
    expect(out).toContain("padding: 16px");
    expect(out).toContain("border-radius: 4px");
  });

  it("leaves unknown placeholders verbatim and reports via onMiss", () => {
    const html = `<div style="color: {{token.color.nonexistent}}; pad: {{token.unknownkind.foo}}"></div>`;
    const onMiss = vi.fn();
    const out = resolveTokens(html, snap, { onMiss });
    expect(out).toContain("{{token.color.nonexistent}}");
    expect(out).toContain("{{token.unknownkind.foo}}");
    expect(onMiss).toHaveBeenCalledWith("color", "nonexistent");
    expect(onMiss).toHaveBeenCalledWith("unknownkind", "foo");
  });

  it("DOMPurify strips <script> tags from resolved output", () => {
    const html = `<div>safe</div><script>alert(1)</script>`;
    const out = resolveTokens(html, snap);
    expect(out).toContain("safe");
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert(1)");
  });

  it("preserves data-buildrick-id attribute through sanitize", () => {
    const html = `<div data-buildrick-id="el-123">child</div>`;
    const out = resolveTokens(html, snap);
    expect(out).toContain('data-buildrick-id="el-123"');
  });

  it("returns a sanitized empty string for empty input", () => {
    expect(resolveTokens("", snap)).toBe("");
  });

  it("does not double-substitute when token value contains a placeholder-like string", () => {
    // Defensive: token values are CSS strings, not template syntax.
    const meta: TokenSnapshot = {
      ...snap,
      colors: { ...snap.colors, weird: "{{token.color.primary}}" },
    };
    const out = resolveTokens(`<i>{{token.color.weird}}</i>`, meta);
    // Single regex pass — value is inserted as-is, no recursive resolve.
    expect(out).toContain("{{token.color.primary}}");
  });
});
