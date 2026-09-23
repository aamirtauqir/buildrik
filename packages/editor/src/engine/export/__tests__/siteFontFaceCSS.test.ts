import { describe, it, expect } from "vitest";
import { siteFontFaceCSS } from "../ExportHelpers";

/**
 * An ADDED site font (Clone 3721:43423 "Fonts round trip", BLOCKERS C4's
 * export half) reaches the published page as an `@font-face` — or the page
 * names a family the visitor's browser has never heard of. The Google
 * families get a `<link>` (`googleFontsHeadLinks`); a file the user uploaded
 * has no Google to fetch it from, so the export declares the face itself,
 * from the file's own url.
 */
const inter = (url = "https://cdn.x/Inter-Var.woff2") => ({
  family: "Inter Var",
  variants: [{ url }],
});

describe("siteFontFaceCSS", () => {
  it("declares one @font-face per custom family the CSS uses", () => {
    const { css } = siteFontFaceCSS(".h{font-family:'Inter Var', sans-serif}", [], [inter()]);
    expect(css).toContain('@font-face{font-family:"Inter Var";');
    expect(css).toContain('src:url("https://cdn.x/Inter-Var.woff2") format("woff2")');
    expect(css).toContain("font-display:swap}");
    expect(css.match(/@font-face/g)).toHaveLength(1);
  });

  it("declares nothing for a family the page never names", () => {
    const { css, skipped } = siteFontFaceCSS(".h{font-family:Georgia,serif}", [], [inter()]);
    expect(css).toBe("");
    expect(skipped).toEqual([]);
  });

  it("finds a family named only by the site's own tokens", () => {
    const { css } = siteFontFaceCSS("", ["Inter Var"], [inter()]);
    expect(css).toContain('font-family:"Inter Var"');
  });

  it("matches the way the picker writes the value — quoted, first in a stack, any case", () => {
    const { css } = siteFontFaceCSS('h1{font-family: "inter var" , Georgia}', [], [inter()]);
    expect(css).toContain('font-family:"Inter Var"');
    // The picker's fallback is not a use of a second family.
    expect(siteFontFaceCSS("p{font-family:Georgia,'Inter Var'}", [], [inter()]).css).toBe("");
  });

  it("names the format from the file's extension", () => {
    const used = "p{font-family:'Inter Var'}";
    const format = (url: string) =>
      siteFontFaceCSS(used, [], [inter(url)]).css.match(/format\("([^"]+)"\)/)?.[1];
    expect(format("https://cdn.x/a.woff2")).toBe("woff2");
    expect(format("https://cdn.x/a.woff")).toBe("woff");
    expect(format("https://cdn.x/a.ttf")).toBe("truetype");
    expect(format("https://cdn.x/a.otf")).toBe("opentype");
    expect(format("https://cdn.x/a.WOFF2?v=2#x")).toBe("woff2");
  });

  it("lets the browser sniff a file whose extension it does not know", () => {
    const { css } = siteFontFaceCSS("p{font-family:'Inter Var'}", [], [inter("https://cdn.x/inter")]);
    expect(css).toContain('src:url("https://cdn.x/inter");');
    expect(css).not.toContain("format(");
  });

  it("skips a font whose only url is a session blob:/data: — it never reached the server", () => {
    const blob = siteFontFaceCSS("p{font-family:'Inter Var'}", [], [inter("blob:http://localhost/1")]);
    expect(blob.css).toBe("");
    expect(blob.skipped).toEqual(["Inter Var"]);
    const data = siteFontFaceCSS("p{font-family:'Inter Var'}", [], [inter("data:font/woff2;base64,AAAA")]);
    expect(data.css).toBe("");
    expect(data.skipped).toEqual(["Inter Var"]);
  });

  it("does not report a session-only font the page never uses", () => {
    const { skipped } = siteFontFaceCSS("p{font-family:Georgia}", [], [inter("blob:http://localhost/1")]);
    expect(skipped).toEqual([]);
  });

  it("uses the first variant url that is on the server", () => {
    const { css, skipped } = siteFontFaceCSS("p{font-family:'Inter Var'}", [], [
      { family: "Inter Var", variants: [{ url: "blob:http://localhost/1" }, { url: "https://cdn.x/a.woff2" }] },
    ]);
    expect(css).toContain("https://cdn.x/a.woff2");
    expect(skipped).toEqual([]);
  });

  it("declares each used family once, in the order the fonts are listed", () => {
    const { css } = siteFontFaceCSS("h1{font-family:'B Sans'} p{font-family:'A Serif'}", [], [
      { family: "A Serif", variants: [{ url: "https://cdn.x/a.ttf" }] },
      { family: "B Sans", variants: [{ url: "https://cdn.x/b.woff" }] },
      { family: "A Serif", variants: [{ url: "https://cdn.x/a-again.ttf" }] },
    ]);
    expect(css.match(/@font-face/g)).toHaveLength(2);
    expect(css.indexOf("A Serif")).toBeLessThan(css.indexOf("B Sans"));
  });

  it("cannot break out of the rule it is written into", () => {
    // The family and the url are user data (a filename, a server path).
    const { css } = siteFontFaceCSS("p{font-family:'Ev\"il'}", [], [
      { family: 'Ev"il', variants: [{ url: 'https://cdn.x/a.woff2")}body{display:none}</style>' }] },
    ]);
    expect(css).toContain('font-family:"Evil";');
    expect(css).not.toContain("display:none}");
    expect(css).not.toContain("</style>");
    expect(css).not.toContain('")}');
  });
});
