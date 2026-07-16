import { describe, it, expect } from "vitest";
import {
  generateCompatibilityShim,
  buildExport,
  generateColorTokenId,
  generateColorCssVar,
} from "../exportUtils";
import type { DesignToken } from "../../types";

const tok = (id: string, value: string, extra: Partial<DesignToken> = {}): DesignToken => ({
  id,
  name: id,
  value,
  category: "colors",
  cssVar: `--buildrick-design-${id}`,
  type: "color",
  ...extra,
});

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

describe("buildExport — CSS category grouping", () => {
  const tokens: DesignToken[] = [
    tok("color-primary", "#2D6DFF"),
    tok("font-size-base", "16px", { category: "typography", type: "font-size" }),
    tok("space-4", "16px", { category: "spacing", type: "length" }),
    tok("radius-md", "8px", { category: "layout", type: "length" }),
    tok("theme-mode", "light", { category: "theme", type: "select" }),
  ];

  it("groups vars under Colors / Typography / Spacing / Other comment banners", () => {
    const { content } = buildExport(tokens, "css");
    expect(content).toContain("/* === Brand & Surface Colors === */");
    expect(content).toContain("/* === Typography === */");
    expect(content).toContain("/* === Spacing === */");
    expect(content).toContain("/* === Other === */");
    // Layout token lands in Other.
    expect(content.indexOf("--buildrick-design-radius-md")).toBeGreaterThan(
      content.indexOf("/* === Other === */")
    );
  });

  it("excludes category='theme' tokens from the CSS export entirely", () => {
    const { content } = buildExport(tokens, "css");
    expect(content).not.toContain("--buildrick-design-theme-mode");
  });

  it("omits a group banner when that category has no tokens", () => {
    const { content } = buildExport([tok("color-only", "#111111")], "css");
    expect(content).toContain("/* === Brand & Surface Colors === */");
    expect(content).not.toContain("/* === Typography === */");
    expect(content).not.toContain("/* === Spacing === */");
    expect(content).not.toContain("/* === Other === */");
  });
});

describe("buildExport — JSON format", () => {
  it("serializes the full token array losslessly (darkValue included)", () => {
    const tokens = [tok("color-primary", "#2D6DFF", { darkValue: "#0A1F4D" })];
    const { content, filename } = buildExport(tokens, "json");
    expect(filename).toBe("design-tokens.json");
    const parsed = JSON.parse(content) as DesignToken[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("color-primary");
    expect(parsed[0].darkValue).toBe("#0A1F4D");
  });
});

describe("buildExport — Tailwind format", () => {
  it("emits a tailwind.config.js module with color tokens keyed by kebab-cased name", () => {
    const tokens = [
      tok("color-primary", "#2D6DFF", { name: "Brand Primary" }),
      tok("space-4", "16px", { category: "spacing", type: "length" }),
    ];
    const { content, filename } = buildExport(tokens, "tailwind");
    expect(filename).toBe("tailwind.config.js");
    expect(content).toContain("module.exports");
    expect(content).toContain('"brand-primary": "#2D6DFF"');
    // Non-color tokens are not represented in the Tailwind color map.
    expect(content).not.toContain("16px");
  });

  it("drops dark variants — Tailwind config has no per-token dark model (surfaced by ExportSection warning)", () => {
    const tokens = [tok("color-primary", "#2D6DFF", { darkValue: "#0A1F4D" })];
    const { content } = buildExport(tokens, "tailwind");
    expect(content).toContain("#2D6DFF");
    expect(content).not.toContain("#0A1F4D");
  });
});

describe("generateColorTokenId / generateColorCssVar", () => {
  it("lowercases and hyphenates names into color-* ids", () => {
    expect(generateColorTokenId("Brand Blue")).toBe("color-brand-blue");
    expect(generateColorTokenId("CTA")).toBe("color-cta");
  });

  it("collapses runs of whitespace into a single hyphen", () => {
    expect(generateColorTokenId("Brand   Blue")).toBe("color-brand-blue");
  });

  it("derives the matching --buildrick-design-color-* CSS var (renamed-vars contract)", () => {
    expect(generateColorCssVar("Brand Blue")).toBe("--buildrick-design-color-brand-blue");
    // id and cssVar must stay in lockstep — the compat shim's 2-major-version
    // alias retention assumes cssVar is always derivable from the token id.
    expect(generateColorCssVar("Brand Blue")).toBe(
      `--buildrick-design-${generateColorTokenId("Brand Blue")}`
    );
  });
});
