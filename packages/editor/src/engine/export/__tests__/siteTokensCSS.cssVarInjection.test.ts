import { describe, it, expect } from "vitest";
import { siteTokensCSS } from "../ExportHelpers";

/* A token's cssVar is user data: saveProjectData stores designTokens without a
   schema, so any editor can save one. Only `--[a-z0-9-]+` may reach the
   published <style>; anything else could close the rule or the tag. */
describe("siteTokensCSS · cssVar is user data", () => {
  it("drops a cssVar that tries to close the rule and the style tag", () => {
    const css = siteTokensCSS([
      { id: "x", cssVar: "--x:red}</style><script>alert(1)</script><style>:root{--y", value: "1" },
    ]);
    expect(css).not.toContain("<script");
    expect(css).not.toContain("</style");
    expect(css).not.toContain("--x:red}");
  });

  it("keeps a well-formed custom var", () => {
    expect(siteTokensCSS([{ id: "brand", cssVar: "--buildrick-design-brand", value: "#123456" }]))
      .toContain("--buildrick-design-brand:#123456");
  });
});
