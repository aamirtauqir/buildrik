import { describe, it, expect, vi } from "vitest";
import { emitTokenCss } from "@buildrik/shared/tokens";
import * as sharedTokens from "@buildrik/shared/tokens";

vi.mock("@buildrik/shared/tokens", async (importOriginal) => {
  const real = await importOriginal<typeof import("@buildrik/shared/tokens")>();
  return { ...real, migrateTokensToV6: vi.fn(real.migrateTokensToV6) };
});
import { DEFAULT_TOKENS_V5 } from "../defaultTokens";
import { mergeProjectTokens, tokensForEmit } from "../projectTokens";

const rowsWith = (over: Record<string, string>) =>
  DEFAULT_TOKENS_V5.map((t) => (t.id in over ? { ...t, value: over[t.id] } : t));
const oddRow = { id: "My Token", name: "My Token", value: "#00FF00", category: "colors", cssVar: "--buildrick-design-my-token", type: "color" };
const css = (settings: Parameters<typeof tokensForEmit>[0]) => emitTokenCss(tokensForEmit(settings), { darkMode: "off" });

describe("tokensForEmit", () => {
  it("one invalid saved row never reverts the site to the default brand (D17)", () => {
    const out = css({
      designTokens: [...rowsWith({ "color-primary": "#FF0000", "color-text": "#123456" }), oddRow],
      designTokensSchemaVersion: 5,
    });
    expect(out).toContain("--buildrick-design-color-primary:#FF0000");
    expect(out).toContain("--buildrick-design-color-text:#123456");
    expect(out).toContain("--buildrick-design-my-token:#00FF00");
    expect(out).not.toContain("--buildrick-design-color-primary:#1A56DB");
  });

  it("hostile unvalidated rows stay inert", () => {
    const out = css({
      designTokens: [{ ...oddRow, id: "x y", cssVar: "--x:red}</style><script>", value: "red;}</style>" }],
      designTokensSchemaVersion: 5,
    });
    expect(out).not.toMatch(/<\/style>|<script/);
    expect(out).toContain("--buildrick-design-btn-height-md:40px");
  });

  it("a saved row whose cssVar is not the seed's still feeds the seed's name (valid path)", () => {
    const row = DEFAULT_TOKENS_V5.find((t) => t.cssVar === "--bd-radius-sm");
    const out = css({ designTokens: [{ ...row, value: "3px" }], designTokensSchemaVersion: 5 });
    expect(out).toContain("--buildrick-design-radius-sm:3px");
    expect(out).toContain("--bd-radius-sm:var(--buildrick-design-radius-sm)");
    expect(out).not.toContain("--buildrick-design-radius-sm:4px");
  });

  it("the same feeding holds on the unvalidated path", () => {
    const row = { id: "btn-radius", name: "R", value: "3px", category: "spacing", cssVar: "--legacy-btn-radius", type: "size" };
    const out = css({ designTokens: [row], designTokensSchemaVersion: 5 });
    expect(out).toContain("--buildrick-design-btn-radius:3px");
    expect(out).toContain("--legacy-btn-radius:var(--buildrick-design-btn-radius)");
  });

  it("non-array designTokens count as no tokens, and never throw", () => {
    for (const bad of ["x", {}, null, 5]) {
      expect(() => tokensForEmit({ designTokens: bad })).not.toThrow();
      expect(() => mergeProjectTokens(bad as never)).not.toThrow();
      expect(css({ designTokens: bad })).toContain("--buildrick-design-btn-height-md:40px");
    }
  });

  describe("kill switch off (I3): a pre-v6 site is never migrated in memory", () => {
    const v5 = { designTokens: rowsWith({ "color-primary": "#FF0000" }), designTokensSchemaVersion: 5 };

    it("emits the v5-equivalent overlay and never calls the migration", () => {
      const migrate = vi.mocked(sharedTokens.migrateTokensToV6);
      migrate.mockClear();
      const off = emitTokenCss(tokensForEmit(v5, { migrate: false }), { darkMode: "off" });
      expect(migrate).not.toHaveBeenCalled();
      expect(off).toContain("--buildrick-design-color-primary:#FF0000");
      expect(off).not.toContain("--buildrick-design-color-primary:var(");
      const on = emitTokenCss(tokensForEmit(v5), { darkMode: "off" });
      expect(migrate).toHaveBeenCalled();
      expect(on).toContain("--buildrick-design-color-primary:var(--buildrick-design-custom-color-primary)");
    });

    it("an already-v6 site emits the same either way", () => {
      const v6 = { designTokens: mergeProjectTokens(v5.designTokens, 5), designTokensSchemaVersion: 6 };
      expect(emitTokenCss(tokensForEmit(v6, { migrate: false }), { darkMode: "off" }))
        .toBe(emitTokenCss(tokensForEmit(v6), { darkMode: "off" }));
    });
  });
});
