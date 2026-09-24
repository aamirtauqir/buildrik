/**
 * The design system's DEFAULT font families are loaded when a page uses them.
 * The mono default "Geist Mono" was named by the export and linked from
 * nowhere (2026-09-24) — it was not in the Google catalogue. System stacks are
 * never sent to Google.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "@/editor/design-system/constants";
import { GOOGLE_FONT_CATALOGUE } from "@/shared/constants/googleFonts";
import { googleFontsHeadLinks, siteFontCSS, siteFontsFromTokens } from "../ExportHelpers";

const dsFonts = siteFontsFromTokens(DEFAULT_TOKENS as never);

describe("DS default fonts", () => {
  it("every default font token names a family the export can load", () => {
    const families = [dsFonts.heading, dsFonts.body, dsFonts.mono].filter(Boolean) as string[];
    expect(families).toContain("Geist Mono");
    const catalogue = new Set(GOOGLE_FONT_CATALOGUE.map((f) => f.family));
    for (const family of families) expect(catalogue.has(family)).toBe(true);
  });

  it("a page using the default mono token links Geist Mono", () => {
    const css = siteFontCSS(dsFonts);
    expect(css).toContain("font-family:Geist Mono,monospace");
    expect(googleFontsHeadLinks(css)).toMatch(/family=Geist\+Mono:wght@400;500;600;700/);
  });

  it("…and only when a style actually uses it", () => {
    expect(googleFontsHeadLinks("body{font-family:Inter,sans-serif}")).not.toContain("Geist");
  });

  it("system stacks are left alone — never asked of Google, never rewritten", () => {
    const css = "body{font-family:-apple-system, BlinkMacSystemFont, sans-serif}";
    expect(googleFontsHeadLinks(css)).toBe("");
  });
});
