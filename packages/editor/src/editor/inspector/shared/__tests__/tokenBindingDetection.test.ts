import { describe, it, expect } from "vitest";
import {
  isTokenVar,
  extractVarName,
  cssVarToTokenId,
} from "../tokenBindingDetection";

describe("isTokenVar", () => {
  it("matches var(--buildrick-design-...)", () => {
    expect(isTokenVar("var(--buildrick-design-color-primary)")).toBe(true);
    expect(isTokenVar("var(--buildrick-design-spacing-md)")).toBe(true);
  });

  it("rejects non-token var() and raw values", () => {
    expect(isTokenVar("#FF0000")).toBe(false);
    expect(isTokenVar("16px")).toBe(false);
    expect(isTokenVar("var(--bk-accent)")).toBe(false);
    expect(isTokenVar("var(--something-else)")).toBe(false);
    expect(isTokenVar("")).toBe(false);
    expect(isTokenVar("var(--buildrick-design-color-primary, #FF0000)")).toBe(false);
  });
});

describe("extractVarName", () => {
  it("returns the CSS variable name from a token var()", () => {
    expect(extractVarName("var(--buildrick-design-color-primary)")).toBe(
      "--buildrick-design-color-primary"
    );
  });

  it("returns null for non-matching strings", () => {
    expect(extractVarName("#FF0000")).toBeNull();
    expect(extractVarName("var(--bk-accent)")).toBeNull();
    expect(extractVarName("")).toBeNull();
    expect(extractVarName("var(--buildrick-design-color-primary, #FF0000)")).toBeNull();
    expect(extractVarName("var(--something-else)")).toBeNull();
  });
});

describe("cssVarToTokenId", () => {
  it("strips the --buildrick-design- prefix to yield the token id", () => {
    expect(cssVarToTokenId("--buildrick-design-color-primary")).toBe("color-primary");
    expect(cssVarToTokenId("--buildrick-design-spacing-md")).toBe("spacing-md");
  });

  it("returns null when the prefix doesn't match", () => {
    expect(cssVarToTokenId("--bd-accent")).toBeNull();
    expect(cssVarToTokenId("color-primary")).toBeNull();
    expect(cssVarToTokenId("")).toBeNull();
  });

  it("round-trips with tokenToCssVar from design-system/types", async () => {
    const { tokenToCssVar } = await import("../../../design-system/types");
    expect(cssVarToTokenId(tokenToCssVar("color-primary"))).toBe("color-primary");
    expect(cssVarToTokenId(tokenToCssVar("radius-sm"))).toBe("radius-sm");
  });
});
