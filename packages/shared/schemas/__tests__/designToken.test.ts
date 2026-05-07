import { describe, it, expect } from "vitest";
import { TokenKindSchema, TokenValueSchema, DesignTokenSchema } from "../designToken";

describe("TokenKindSchema", () => {
  it("accepts all 14 spec kinds", () => {
    const kinds = [
      "color", "type", "spacing",
      "radius", "shadow", "motion",
      "border", "opacity", "zindex",
      "breakpoint", "grid", "sizing",
      "icon", "imagery",
    ];
    for (const k of kinds) {
      expect(TokenKindSchema.safeParse(k).success).toBe(true);
    }
  });

  it("rejects unknown kinds", () => {
    expect(TokenKindSchema.safeParse("foo").success).toBe(false);
  });
});

describe("TokenValueSchema (discriminated union)", () => {
  it("accepts a valid color value", () => {
    expect(TokenValueSchema.safeParse({ kind: "color", value: "#2D6DFF" }).success).toBe(true);
  });

  it("rejects color with empty string value", () => {
    expect(TokenValueSchema.safeParse({ kind: "color", value: "" }).success).toBe(false);
  });

  it("accepts motion value with duration regex", () => {
    expect(TokenValueSchema.safeParse({ kind: "motion", duration: "200ms", easing: "ease-out" }).success).toBe(true);
  });

  it("rejects motion duration without ms/s suffix", () => {
    expect(TokenValueSchema.safeParse({ kind: "motion", duration: "200", easing: "ease-out" }).success).toBe(false);
  });

  it("accepts opacity value in [0,1]", () => {
    expect(TokenValueSchema.safeParse({ kind: "opacity", value: 0.5 }).success).toBe(true);
  });

  it("rejects opacity value > 1", () => {
    expect(TokenValueSchema.safeParse({ kind: "opacity", value: 1.5 }).success).toBe(false);
  });

  it("rejects opacity value < 0", () => {
    expect(TokenValueSchema.safeParse({ kind: "opacity", value: -0.1 }).success).toBe(false);
  });

  it("accepts zindex integer", () => {
    expect(TokenValueSchema.safeParse({ kind: "zindex", value: 100 }).success).toBe(true);
  });

  it("rejects zindex non-integer", () => {
    expect(TokenValueSchema.safeParse({ kind: "zindex", value: 1.5 }).success).toBe(false);
  });

  it("accepts breakpoint with px suffix", () => {
    expect(TokenValueSchema.safeParse({ kind: "breakpoint", value: "768px" }).success).toBe(true);
  });

  it("rejects breakpoint with bare number", () => {
    expect(TokenValueSchema.safeParse({ kind: "breakpoint", value: "768" }).success).toBe(false);
  });

  it("accepts imagery with valid URL", () => {
    expect(TokenValueSchema.safeParse({ kind: "imagery", url: "https://example.com/img.png" }).success).toBe(true);
  });

  it("rejects imagery with non-URL string", () => {
    expect(TokenValueSchema.safeParse({ kind: "imagery", url: "not-a-url" }).success).toBe(false);
  });
});

describe("DesignTokenSchema", () => {
  it("accepts a minimal legacy-shape token (no kind field)", () => {
    const legacy = {
      id: "color-brand-500",
      name: "Brand 500",
      value: "#2D6DFF",
      category: "colors",
      cssVar: "--bd-color-brand-500",
      type: "color",
    };
    expect(DesignTokenSchema.safeParse(legacy).success).toBe(true);
  });

  it("accepts a Phase A.0 token with kind + typedValue", () => {
    const newShape = {
      id: "radius-md",
      name: "Medium radius",
      value: "8px",
      category: "layout",
      cssVar: "--bd-radius-md",
      type: "length",
      kind: "radius",
      friendlyName: "Medium radius",
      typedValue: { kind: "radius", value: "8px" },
    };
    expect(DesignTokenSchema.safeParse(newShape).success).toBe(true);
  });

  it("rejects token with malformed cssVar", () => {
    const bad = {
      id: "x",
      name: "X",
      value: "x",
      category: "colors",
      cssVar: "not-a-css-var",
      type: "color",
    };
    expect(DesignTokenSchema.safeParse(bad).success).toBe(false);
  });
});
