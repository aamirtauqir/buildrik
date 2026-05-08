import { describe, it, expect } from "vitest";
import { CSSBundler } from "../CSSBundler";
import type { DesignToken } from "../../types";

const tokens: DesignToken[] = [
  {
    id: "color-primary", name: "Primary", value: "#3B82F6",
    category: "colors", cssVar: "--buildrick-design-color-primary",
    type: "color", kind: "color", darkValue: "#60A5FA",
  },
  {
    id: "color-text", name: "Text", value: "#334155",
    category: "colors", cssVar: "--buildrick-design-color-text",
    type: "color", kind: "color",
    // no darkValue
  },
  {
    id: "spacing-md", name: "Spacing MD", value: "16px",
    category: "spacing", cssVar: "--buildrick-design-spacing-md",
    type: "length",
  },
];

describe("CSSBundler.bundle", () => {
  it("emits :root block with all tokens' light values", () => {
    const bundler = new CSSBundler();
    const css = bundler.bundle(tokens);
    expect(css).toContain(":root {");
    expect(css).toContain("--buildrick-design-color-primary: #3B82F6;");
    expect(css).toContain("--buildrick-design-color-text: #334155;");
    expect(css).toContain("--buildrick-design-spacing-md: 16px;");
  });

  it("default strategy 'media' emits dark block for color tokens with darkValue", () => {
    const bundler = new CSSBundler();
    const css = bundler.bundle(tokens);
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("--buildrick-design-color-primary: #60A5FA;");
    // text token has no darkValue → not in dark block
    expect(css).not.toMatch(/dark[^}]*color-text/s);
    // spacing token is non-color → not in dark block
    expect(css).not.toMatch(/dark[^}]*spacing/s);
  });

  it("strategy 'data-attr' emits :root[data-theme=dark] block instead of @media", () => {
    const bundler = new CSSBundler();
    const css = bundler.bundle(tokens, { darkStrategy: "data-attr" });
    expect(css).toContain(`:root[data-theme="dark"] {`);
    expect(css).toContain("--buildrick-design-color-primary: #60A5FA;");
    expect(css).not.toContain("@media");
  });

  it("strategy 'off' skips dark block entirely", () => {
    const bundler = new CSSBundler();
    const css = bundler.bundle(tokens, { darkStrategy: "off" });
    expect(css).not.toContain("@media");
    expect(css).not.toContain("data-theme");
    expect(css).not.toContain("#60A5FA");
  });

  it("no color tokens with darkValue: no dark block emitted even with default strategy", () => {
    const lightOnlyTokens = tokens.filter((t) => t.id !== "color-primary");
    const bundler = new CSSBundler();
    const css = bundler.bundle(lightOnlyTokens);
    expect(css).not.toContain("@media");
  });

  it("pretty: false emits single-line bundle", () => {
    const bundler = new CSSBundler();
    const css = bundler.bundle(tokens, { pretty: false });
    expect(css.split("\n").length).toBe(1);
    expect(css).toContain(":root {");
    expect(css).toContain("--buildrick-design-color-primary: #3B82F6;");
  });

  it("escapes control chars from token values (defensive)", () => {
    const dangerous: DesignToken[] = [
      {
        id: "x", name: "X", value: "#fff} body { background: url('evil')",
        category: "colors", cssVar: "--bd-x", type: "color",
      },
    ];
    const bundler = new CSSBundler();
    const css = bundler.bundle(dangerous);
    // Curly braces stripped.
    expect(css).not.toMatch(/body \{/);
  });

  it("empty token list: emits empty :root block (no error)", () => {
    const bundler = new CSSBundler();
    const css = bundler.bundle([]);
    expect(css).toContain(":root {");
    expect(css).toContain("}");
  });
});
