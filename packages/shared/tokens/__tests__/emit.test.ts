import { describe, it, expect, vi } from "vitest";
import { emitTokenCss } from "../emit";
import { LEGACY_SEED } from "../legacySeed";
import type { DesignToken } from "../../schemas/design-tokens";

const t = (over: Partial<DesignToken> & Pick<DesignToken, "id" | "modes" | "layer">): DesignToken => ({
  name: over.id, kind: "color", category: "colors", cssVar: `--buildrick-design-${over.id}`, type: "color", ...over,
});
const tokens: DesignToken[] = [
  t({ id: "blue-600", layer: "primitive", modes: { light: { value: "#1A56DB" } } }),
  t({ id: "blue-400", layer: "primitive", modes: { light: { value: "#76A9FA" } } }),
  t({ id: "color-primary", layer: "semantic", modes: { light: { alias: "blue-600" }, dark: { alias: "blue-400" } },
      legacyNames: ["--buildrick-design-color-action"] }),
];

describe("emitTokenCss", () => {
  it("emits primitives as literals and semantic tokens as var() aliases", () => {
    const css = emitTokenCss(tokens, { darkMode: "off" });
    expect(css).toContain("--buildrick-design-blue-600:#1A56DB");
    expect(css).toContain("--buildrick-design-color-primary:var(--buildrick-design-blue-600)");
  });

  it("emits legacy names as aliases of their token", () => {
    expect(emitTokenCss(tokens, { darkMode: "off" })).toContain(
      "--buildrick-design-color-action:var(--buildrick-design-color-primary)");
  });

  it("emits no dark blocks when Dark mode is off", () => {
    const css = emitTokenCss(tokens, { darkMode: "off" });
    expect(css).not.toContain("prefers-color-scheme");
    expect(css).not.toContain("data-theme");
  });

  it("emits media-query and data-theme dark blocks when Dark mode is auto", () => {
    const css = emitTokenCss(tokens, { darkMode: "auto" });
    expect(css).toContain('@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--buildrick-design-color-primary:var(--buildrick-design-blue-400)}}');
    expect(css).toContain(':root[data-theme="dark"]{--buildrick-design-color-primary:var(--buildrick-design-blue-400)}');
  });

  it("emits the legacy backstop for seed vars no token defines", () => {
    const missing = LEGACY_SEED.find((s) => s.cssVar === "--buildrick-design-btn-padding-x") ?? LEGACY_SEED[LEGACY_SEED.length - 1];
    expect(emitTokenCss(tokens, { darkMode: "off" })).toContain(`${missing.cssVar}:`);
  });

  it("strips ; { } < from values and skips an invalid token without throwing", () => {
    const onSkip = vi.fn();
    const evil = t({ id: "evil", layer: "primitive", modes: { light: { value: "red;}</style><script>" } } });
    const css = emitTokenCss([...tokens, evil], { darkMode: "off", onSkip });
    expect(css).not.toMatch(/<\/style>|<script/);
    expect(css).toContain("--buildrick-design-evil:red/style>script>");
    const empty = t({ id: "empty", layer: "primitive", modes: { light: { value: "  " } } });
    expect(() => emitTokenCss([empty], { darkMode: "off", onSkip })).not.toThrow();
    expect(onSkip).toHaveBeenCalledWith("empty", expect.any(String));
  });

  it("strips control characters like the v5 escapeCssValue", () => {
    const ctl = t({ id: "ctl", layer: "primitive", modes: { light: { value: "re\u0000d\n\u007f" } } });
    expect(emitTokenCss([ctl], { darkMode: "off" })).toContain("--buildrick-design-ctl:red;");
  });

  it("never emits a var twice (token wins over backstop)", () => {
    const css = emitTokenCss(tokens, { darkMode: "off" });
    expect(css.match(/--buildrick-design-color-primary:/g)).toHaveLength(1);
  });
});
