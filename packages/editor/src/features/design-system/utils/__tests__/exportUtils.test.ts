import { describe, it, expect } from "vitest";
import { generateCompatibilityShim, buildExport } from "../exportUtils";
import type { DesignToken } from "../../types";

describe("generateCompatibilityShim", () => {
  it("returns empty string at V1 (baseline — no deprecated aliases yet)", () => {
    expect(generateCompatibilityShim(1)).toBe("");
  });

  it("returns empty string for unknown future version", () => {
    expect(generateCompatibilityShim(999)).toBe("");
  });

  it("returns empty string for version 0 (pre-V1)", () => {
    expect(generateCompatibilityShim(0)).toBe("");
  });
});

describe("buildExport CSS includes compatibility shim", () => {
  it("prepends empty shim at V1 (no change for current user projects)", () => {
    const tokens: DesignToken[] = [
      {
        id: "color-primary",
        name: "Primary",
        value: "#2D6DFF",
        category: "colors",
        cssVar: "--buildrick-design-color-primary",
        type: "color",
      },
    ];
    const { content, filename } = buildExport(tokens, "css");
    expect(filename).toBe("design-tokens.css");
    // V1 shim is empty, so content starts with :root
    expect(content.startsWith(":root {")).toBe(true);
    expect(content).toContain("--buildrick-design-color-primary: #2D6DFF;");
  });
});
