/**
 * html/formatting — minifyHTML + beautifyHTML.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { minifyHTML, beautifyHTML } from "../formatting";

describe("minifyHTML", () => {
  it("removes comments by default", () => {
    expect(minifyHTML("<div><!-- note -->x</div>")).toBe("<div>x</div>");
  });

  it("keeps comments when removeComments is false", () => {
    const out = minifyHTML("<div><!--n-->x</div>", { removeComments: false });
    expect(out).toContain("<!--n-->");
  });

  it("collapses whitespace and strips gaps between tags", () => {
    expect(minifyHTML("<ul>\n  <li>  a  </li>\n</ul>")).toBe("<ul><li> a </li></ul>");
  });

  it("does not collapse whitespace when disabled", () => {
    const out = minifyHTML("<p>  a  b  </p>", { collapseWhitespace: false });
    expect(out).toBe("<p>  a  b  </p>");
  });

  it("removes optional closing tags when requested", () => {
    const out = minifyHTML("<ul><li>a</li><li>b</li></ul>", { removeOptionalTags: true });
    expect(out).toBe("<ul><li>a<li>b</ul>");
  });

  it("preserves line breaks between tags when preserveLineBreaks is set", () => {
    // collapseWhitespace off so the newlines survive to the preserve pass.
    const out = minifyHTML("<div>\n<span>x</span>\n</div>", {
      collapseWhitespace: false,
      preserveLineBreaks: true,
    });
    expect(out).toContain(">\n<");
  });
});

describe("beautifyHTML", () => {
  it("indents nested elements with the default 2-space indent", () => {
    const out = beautifyHTML("<div><span>hi</span></div>");
    expect(out).toBe("<div>\n  <span>\n    hi\n  </span>\n</div>");
  });

  it("honors a custom indent size", () => {
    const out = beautifyHTML("<div><p>x</p></div>", 4);
    expect(out.split("\n")[1].startsWith("    <p>")).toBe(true);
  });

  it("treats void tags as self-closing (no indent bump)", () => {
    const out = beautifyHTML("<div><br><img src='x'></div>");
    const lines = out.split("\n");
    // <br> and <img> both stay at the same indent level as siblings
    expect(lines[0]).toBe("<div>");
    expect(lines[1].trim()).toBe("<br>");
    expect(lines.at(-1)).toBe("</div>");
  });

  it("emits comments and doctype without crashing", () => {
    const out = beautifyHTML("<!DOCTYPE html><div><!--c--></div>");
    expect(out).toContain("<!--c-->");
    expect(out).toContain("<div>");
  });

  it("never lets indent level go negative on unbalanced close tags", () => {
    const out = beautifyHTML("</div></div><p>x</p>");
    // stray closes clamp level at 0; no leading indent explosion
    expect(out.split("\n").every((l) => !l.startsWith("      "))).toBe(true);
  });
});
