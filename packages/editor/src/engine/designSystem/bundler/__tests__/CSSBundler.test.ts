import { describe, it, expect } from "vitest";
import { CSSBundler } from "../CSSBundler";
import type { DesignToken } from "../../types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

const tokens: DesignToken[] = [
  v6Token({
    id: "color-primary", name: "Primary", value: "#3B82F6",
    cssVar: "--buildrick-design-color-primary", dark: "#60A5FA",
  }),
  v6Token({
    id: "color-text", name: "Text", value: "#334155",
    cssVar: "--buildrick-design-color-text",
    // no dark mode
  }),
  v6Token({
    id: "spacing-md", name: "Spacing MD", value: "16px",
    kind: "spacing", category: "spacing", cssVar: "--buildrick-design-spacing-md",
    type: "length",
  }),
];

describe("CSSBundler.bundle", () => {
  const bundler = new CSSBundler();

  it("emits the :root block with every token's light value", () => {
    const css = bundler.bundle(tokens);
    expect(css).toContain(":root{");
    expect(css).toContain("--buildrick-design-color-primary:#3B82F6");
    expect(css).toContain("--buildrick-design-color-text:#334155");
    expect(css).toContain("--buildrick-design-spacing-md:16px");
  });

  it("default strategy 'media' ships only the media-query dark block", () => {
    const css = bundler.bundle(tokens);
    expect(css).toContain("@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){--buildrick-design-color-primary:#60A5FA}}");
    expect(css).not.toContain(":root[data-theme");
    expect(css).not.toMatch(/dark[^}]*color-text/s);
  });

  it("strategy 'data-attr' ships only the :root[data-theme=dark] block", () => {
    const css = bundler.bundle(tokens, { darkStrategy: "data-attr" });
    expect(css).toContain(':root[data-theme="dark"]{--buildrick-design-color-primary:#60A5FA}');
    expect(css).not.toContain("@media");
  });

  it("strategy 'off' skips the dark blocks entirely", () => {
    const css = bundler.bundle(tokens, { darkStrategy: "off" });
    expect(css).not.toContain("@media");
    expect(css).not.toContain("data-theme");
    expect(css).not.toContain("#60A5FA");
  });

  it("no token with a dark mode: no dark block even by default", () => {
    expect(bundler.bundle(tokens.filter((t) => t.id !== "color-primary"))).not.toContain("@media");
  });

  it("strips characters that could leave a declaration (defensive)", () => {
    const css = bundler.bundle([
      v6Token({ id: "x", name: "X", value: "#fff} body { background: url('evil')", cssVar: "--bd-x" }),
    ]);
    expect(css).not.toMatch(/body \{/);
  });

  it("empty token list: still emits a :root block (no error)", () => {
    expect(bundler.bundle([])).toContain(":root{");
  });
});
