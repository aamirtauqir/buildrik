import { describe, it, expect } from "vitest";
import { siteFontCSS, RESET_CSS } from "../ExportHelpers";

/**
 * The export named one hardcoded family for every site ever published, so a
 * site whose Brand fonts were changed shipped in the default one — the same
 * silent drop the animation keyframes used to take.
 */
describe("siteFontCSS", () => {
  it("emits the site's own three slots", () => {
    const css = siteFontCSS({ heading: "Georgia", body: "Verdana", mono: "IBM Plex Mono" });
    expect(css).toContain("body{font-family:Verdana,sans-serif}");
    expect(css).toContain("h1,h2,h3,h4,h5,h6{font-family:Georgia,sans-serif}");
    expect(css).toContain("code,pre,kbd,samp{font-family:IBM Plex Mono,monospace}");
  });

  it("carries the site's text colour on body", () => {
    expect(siteFontCSS({ body: "Verdana", text: "#334155" })).toContain(
      "body{font-family:Verdana,sans-serif;color:#334155}"
    );
  });

  it("says nothing about a slot the site does not carry", () => {
    expect(siteFontCSS({ body: "Verdana" })).not.toContain("h1,h2");
    expect(siteFontCSS({})).toBe("");
  });

  it("comes after the reset, so it wins over the reset's one hardcoded family", () => {
    // Guard on the reset still carrying a family at all — if it stops, the
    // ordering below stops mattering and this test should be revisited.
    expect(RESET_CSS).toContain("font-family:");
  });

  it("cannot break out of the rule it is written into", () => {
    expect(siteFontCSS({ body: "Verdana;}body{display:none" })).not.toContain("display:none}");
  });
});
