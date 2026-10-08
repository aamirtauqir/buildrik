import { describe, it, expect, vi } from "vitest";
import { emitTokenCss } from "../emit";
import { LEGACY_SEED } from "../legacySeed";
import type { DesignToken, TokenRef } from "@buildrik/shared/schemas/design-tokens";

const t = (over: Partial<DesignToken> & Pick<DesignToken, "id" | "modes" | "layer">): DesignToken => ({
  name: over.id, kind: "color", category: "colors", cssVar: `--buildrick-design-${over.id}`, type: "color", ...over,
});
const semantic = (id: string, light: TokenRef): DesignToken => ({ id, name: id, kind: "color", layer: "semantic", modes: { light }, category: "colors", cssVar: `--buildrick-design-${id}`, type: "color" });
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

  describe("an alias is emitted only when its target is (I2)", () => {
    it("skips an alias whose target was skipped, and the legacy backstop defines the var", () => {
      const onSkip = vi.fn();
      const list = [
        t({ id: "custom-color-accent", layer: "primitive", modes: { light: { value: "{}" } } }),
        t({ id: "color-accent", layer: "semantic", modes: { light: { alias: "custom-color-accent" } } }),
      ];
      const css = emitTokenCss(list, { darkMode: "off", onSkip });
      expect(css).not.toContain("var(--buildrick-design-custom-color-accent)");
      expect(css).toContain("--buildrick-design-color-accent:#15803D");
      expect(onSkip).toHaveBeenCalledWith("color-accent", expect.stringContaining("alias"));
    });
    it("follows an alias chain: a skipped root drops every alias above it", () => {
      const list = [
        t({ id: "p", layer: "primitive", modes: { light: { value: "  " } } }),
        t({ id: "a", layer: "semantic", modes: { light: { alias: "p" } } }),
        t({ id: "b", layer: "semantic", modes: { light: { alias: "a" } } }),
      ];
      const css = emitTokenCss(list, { darkMode: "off" });
      expect(css).not.toContain("--buildrick-design-a:");
      expect(css).not.toContain("--buildrick-design-b:");
    });
    it("skips a dark alias whose target was skipped", () => {
      const onSkip = vi.fn();
      const list = [
        ...tokens.slice(0, 1),
        t({ id: "blue-400", layer: "primitive", modes: { light: { value: ";" } } }),
        tokens[2],
      ];
      const css = emitTokenCss(list, { darkMode: "auto", onSkip });
      expect(css).not.toContain("var(--buildrick-design-blue-400)");
      expect(onSkip).toHaveBeenCalledWith("color-primary", "unresolvable dark value");
    });
  });

  it("strips control characters like the v5 escapeCssValue", () => {
    const ctl = t({ id: "ctl", layer: "primitive", modes: { light: { value: "re\u0000d\n\u007f" } } });
    expect(emitTokenCss([ctl], { darkMode: "off" })).toContain("--buildrick-design-ctl:red;");
  });

  it("never emits a var twice (token wins over backstop)", () => {
    const css = emitTokenCss(tokens, { darkMode: "off" });
    expect(css.match(/--buildrick-design-color-primary:/g)).toHaveLength(1);
  });

  describe("custom-property names are user data", () => {
    const bad = "--x:red}</style><script>";
    const emitWith = (over: Partial<DesignToken>) => {
      const onSkip = vi.fn();
      const css = emitTokenCss(
        [...tokens, t({ id: "evil", layer: "primitive", modes: { light: { value: "#000" } }, ...over })],
        { darkMode: "auto", onSkip },
      );
      return { css, onSkip };
    };

    it("skips a token whose cssVar is not a plain custom-property name", () => {
      const { css, onSkip } = emitWith({ cssVar: bad });
      expect(css).not.toMatch(/<\/style>|<script/);
      expect(css).not.toContain("--x:");
      expect(onSkip).toHaveBeenCalledWith("evil", expect.any(String));
    });

    it("skips a token with a bad legacy name", () => {
      const { css, onSkip } = emitWith({ legacyNames: [bad] });
      expect(css).not.toMatch(/<\/style>|<script/);
      expect(onSkip).toHaveBeenCalledWith("evil", expect.any(String));
    });

    it("skips a token aliasing a token whose cssVar is bad", () => {
      const evil = t({ id: "evil", layer: "primitive", cssVar: bad, modes: { light: { value: "#000" } } });
      const onSkip = vi.fn();
      const css = emitTokenCss(
        [evil, t({ id: "pointer", layer: "semantic", modes: { light: { alias: "evil" }, dark: { alias: "evil" } } })],
        { darkMode: "auto", onSkip },
      );
      expect(css).not.toMatch(/<\/style>|<script|--x:/);
      expect(onSkip).toHaveBeenCalledWith("pointer", expect.any(String));
    });
  });

  it("emits a replaced token as var() of its replacement, with no dark block of its own", () => {
    const css = emitTokenCss(
      [
        { ...semantic("color-new", { value: "#1A56DB" }), modes: { light: { value: "#1A56DB" }, dark: { value: "#60A5FA" } } },
        { ...semantic("color-old", { value: "#000000" }), modes: { light: { value: "#000000" }, dark: { value: "#FFFFFF" } }, replacedBy: "color-new" },
      ],
      { darkMode: "auto" },
    );
    expect(css).toContain("--buildrick-design-color-old:var(--buildrick-design-color-new)");
    expect(css).not.toMatch(/--buildrick-design-color-old:#FFFFFF/);
    expect(css).not.toContain("--buildrick-design-color-old:#000000");
  });
});
