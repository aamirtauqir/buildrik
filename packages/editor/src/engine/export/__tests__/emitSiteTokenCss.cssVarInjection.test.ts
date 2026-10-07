import { describe, it, expect } from "vitest";
import { emitSiteTokenCss } from "../ExportHelpers";

/* A token's cssVar is user data: an editor can save any designTokens payload.
   Only a plain `--[a-zA-Z0-9_-]+` name may reach the published <style>;
   anything else could close the rule or the tag. Checked with the brand switch
   in both positions, since off emits the v5 overlay and on the v6 migration. */
const crafted = "--x:red}</style><script>alert(1)</script><style>:root{--y";

describe("emitSiteTokenCss · cssVar is user data", () => {
  for (const migrate of [false, true]) {
    it(`drops a cssVar that tries to close the rule and the style tag (switch ${migrate ? "on" : "off"})`, () => {
      const css = emitSiteTokenCss(
        { designTokens: [{ id: "x", name: "x", category: "color", cssVar: crafted, value: "#123456" }], designTokensSchemaVersion: 5 },
        { migrate },
      );
      expect(css).not.toContain("<script");
      expect(css).not.toContain("</style");
      expect(css).not.toContain("--x:red}");
    });
  }

  it("keeps a well-formed custom var", () => {
    const css = emitSiteTokenCss(
      { designTokens: [{ id: "brand", name: "Brand", category: "color", cssVar: "--buildrick-design-brand", value: "#123456" }], designTokensSchemaVersion: 5 },
      { migrate: false },
    );
    expect(css).toContain("--buildrick-design-brand");
    expect(css).toContain("#123456");
  });
});
