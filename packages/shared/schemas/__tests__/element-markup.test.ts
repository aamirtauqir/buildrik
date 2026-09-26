/**
 * S-1: the one URL-scheme check both the server sanitizer and the editor use.
 * A browser strips tabs/newlines inside a scheme and C0 controls/spaces before
 * it, so "java\tscript:" and "\x01javascript:" run as javascript:.
 */
import { describe, it, expect } from "vitest";
import {
  cssValueHasDangerousUrl,
  escapeStyleText,
  isDangerousUrl,
  isAbsoluteHttpUrl,
  absoluteRedirectUrlSchema,
  isSafeCssDeclaration,
  isSafeCssSelector,
  isSafeElementId,
  isSafeMediaQuery,
  isSafeStyleRuleTarget,
  srcsetCandidates,
  srcsetUrls,
} from "../element-markup";

describe("isDangerousUrl", () => {
  it.each([
    "javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\x01javascript:alert(1)",
    "\x00 vbscript:x",
    "VBScript:x",
    "data:text/html,<script>x</script>",
    "da\tta:text/html,x",
    "data:application/xhtml+xml,x",
  ])("refuses %j", (url) => expect(isDangerousUrl(url)).toBe(true));

  it.each(["https://a.b/c", "/x", "#y", "mailto:a@b.c", "tel:1", "blob:https://a/1", "data:image/png;base64,AA", "a b.jpg", ""])(
    "allows %j",
    (url) => expect(isDangerousUrl(url)).toBe(false)
  );
});

describe("srcsetUrls", () => {
  it("cuts only the trailing descriptor", () => {
    expect(srcsetUrls("a.jpg 1x, b.jpg 200w,c.jpg")).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
    expect(srcsetUrls("a.jpg 1x, java\tscript:alert(1) 2x")).toEqual(["a.jpg", "java\tscript:alert(1)"]);
  });

  it("keeps a comma inside a candidate's URL (data: image) — only a comma after the URL ends a candidate", () => {
    expect(srcsetUrls("data:image/png;base64,AAA 1x, /b.png 2x")).toEqual(["data:image/png;base64,AAA", "/b.png"]);
    expect(srcsetUrls("data:image/png;base64,AAA,/b.png 2x")).toEqual(["data:image/png;base64,AAA,/b.png"]);
    expect(srcsetUrls("a.jpg, b.jpg")).toEqual(["a.jpg", "b.jpg"]);
    expect(srcsetUrls("/a.jpg 1x, java\tscript:a,b 2x")).toEqual(["/a.jpg", "java\tscript:a", "b"]);
  });
});

describe("srcsetCandidates", () => {
  it("returns each candidate with its descriptor, trimmed", () => {
    expect(srcsetCandidates(" data:image/png;base64,AAA 1x ,/b.png 2x")).toEqual(["data:image/png;base64,AAA 1x", "/b.png 2x"]);
    expect(srcsetCandidates("a.jpg 1x,")).toEqual(["a.jpg 1x"]);
    expect(srcsetCandidates(" , ")).toEqual([]);
  });
});

describe("isSafeCssDeclaration (S-1 review round 3)", () => {
  it.each([
    ["color", "red}</style><script>alert(1)</script>"],
    ["color", "red</style"],
    ["color", "red; } body { x"],
    ["color", "{"],
    ["color", "{{a}</style>"],
    ["color", "{{a b}}"],
    ["width", "expression(alert(1))"],
    ["behavior", "url(x.htc)"],
    ["color", "behavior: url(x.htc)"],
    ["-moz-binding", "url(x)"],
    ["color", "-moz-binding:url(x)"],
    ["background", "url(javascript:alert(1))"],
    ["background", "url( 'java\tscript:alert(1)' )"],
    ["background-image", 'url("data:text/html,x")'],
    ["color x:y", "red"],
    ["color;", "red"],
    ["", "red"],
  ])("refuses %j: %j", (property, value) => expect(isSafeCssDeclaration(property, value)).toBe(false));

  it("refuses a non-string value", () => expect(isSafeCssDeclaration("color", 5)).toBe(false));

  it.each([
    ["color", "#1A56DB"],
    ["color", "rgba(0, 0, 0, .5)"],
    ["backgroundColor", "var(--buildrick-design-primary)"],
    ["--hide-mobile", "true"],
    ["background-image", "url(https://cdn.example.com/a.png)"],
    ["background-image", 'url("data:image/png;base64,AAAA")'],
    ["background", "linear-gradient(90deg, #fff 0%, rgba(0,0,0,.5) 100%)"],
    ["font-family", '"Inter", sans-serif'],
    ["content", '"\\201C"'],
    ["grid-template-areas", '"a b" "c d"'],
    ["transform", "translate(-50%, -50%) rotate(3deg)"],
    ["background", "{{token.color.primary}}"],
    ["box-shadow", "0 4px 12px {{token.color-shadow}}"],
  ])("allows %j: %j", (property, value) => expect(isSafeCssDeclaration(property, value)).toBe(true));
});

describe("cssValueHasDangerousUrl (x4 fix round 3 — one url() scan)", () => {
  it.each([
    "url(javascript:alert(1))",
    `url("javascript:a')")`,
    "color:red;background:url( 'java\tscript:x' )",
    'url("data:text/html,x")',
    "background:url(/ok.png), URL(vbscript:x)",
  ])("finds a dangerous url() in %j", (value) => expect(cssValueHasDangerousUrl(value)).toBe(true));

  it.each([
    "background:url(/bg.jpg);color:red",
    'background-image:url("data:image/png;base64,AAAA")',
    "color:#1A56DB",
  ])("finds none in %j", (value) => expect(cssValueHasDangerousUrl(value)).toBe(false));
});

const HOSTILE_SELECTOR = "a{}</style><script>alert(1)</script><style>";

describe("isSafeCssSelector (S-1 review round 4)", () => {
  it.each([
    HOSTILE_SELECTOR,
    "a{color:red}",
    "a}",
    "a;b",
    "@import url(x)",
    "a\\3c",
    "<b",
    '[data-buildrick-id="x"]</style>',
    '[data-buildrick-id="x\"]{}"]',
    "[title='x']",
    '[data-buildrick-id="a b"]',
    "a:evil",
    "a::-webkit-scrollbar-thumb:expression",
    ":nth-child(1){}",
    "a,",
    ",a",
    "",
    "   ",
    "a".repeat(2000),
  ])("refuses %j", (selector) => expect(isSafeCssSelector(selector)).toBe(false));

  it("refuses a non-string", () => expect(isSafeCssSelector(5)).toBe(false));

  it.each([
    '[data-buildrick-id="el-mt1euvra-1dxo08g1p58"]',
    '[data-buildrick-id="el-mt7d1x3m-1qg2iv9zjda"]:hover',
    '[data-buildrick-id="el_1"]:focus-visible',
    ".btn-primary",
    ".card:hover .card__title",
    "#hero > .title",
    "ul li + li",
    "h1 ~ p",
    "a:disabled, button:active",
    "*",
    "p::before",
    "li:nth-child(2n+1)",
    "tr:nth-of-type(odd)",
    "input::placeholder",
    "[disabled]",
    "div.a.b#c[data-x=y]:first-child",
  ])("allows %j", (selector) => expect(isSafeCssSelector(selector)).toBe(true));
});

describe("isSafeMediaQuery (S-1 review round 4)", () => {
  it.each([
    "(max-width: 1023px)",
    "(max-width: 767px)",
    "(min-width:768px) and (max-width:1023px)",
    "(min-height: 600px)",
  ])("allows %j", (query) => expect(isSafeMediaQuery(query)).toBe(true));

  it.each([
    "(max-width: 767px){}</style><script>alert(1)</script><style>",
    "screen{a{}}",
    "(max-width: 767px) { a { color: red } } @media (x)",
    "(max-width: expression(1))",
    "",
    5,
  ])("refuses %j", (query) => expect(isSafeMediaQuery(query)).toBe(false));
});

describe("isSafeStyleRuleTarget (S-1 review round 4)", () => {
  it("takes a safe selector with no media query", () => {
    expect(isSafeStyleRuleTarget(".a", undefined)).toBe(true);
    expect(isSafeStyleRuleTarget(".a", null)).toBe(true);
    expect(isSafeStyleRuleTarget(".a", "")).toBe(true);
  });
  it("needs both halves safe", () => {
    expect(isSafeStyleRuleTarget(".a", "(max-width: 767px)")).toBe(true);
    expect(isSafeStyleRuleTarget(".a", "x{}")).toBe(false);
    expect(isSafeStyleRuleTarget(HOSTILE_SELECTOR, "(max-width: 767px)")).toBe(false);
  });
});

describe("isSafeElementId (S-1 review round 4)", () => {
  it.each(["el-mt1euvra-1dxo08g1p58", "root", "hero_1", "A-9"])("allows %j", (id) =>
    expect(isSafeElementId(id)).toBe(true));
  it.each(['x"]{}</style><script>alert(1)</script>', "a b", "a.b", "", 7, null])("refuses %j", (id) =>
    expect(isSafeElementId(id)).toBe(false));
});

describe("escapeStyleText (S-1 review round 4)", () => {
  it("cannot close the surrounding <style>, in any case", () => {
    const out = escapeStyleText("a{}</style><script>x</script></STYLE ><StYlE>");
    expect(out).not.toMatch(/<\/style/i);
    expect(out).toContain("<\\/style>");
    expect(out).toContain("<\\/STYLE >");
  });
  it("leaves ordinary CSS alone", () => {
    const css = ".a > .b { content: \"<>\"; color: red }";
    expect(escapeStyleText(css)).toBe(css);
  });
});

// I2 (form after-submit redirect, controller fix round 1): isDangerousUrl
// above correctly allows relative paths/#anchors/mailto:/tel: — right for
// an href, wrong for a redirect target (NextResponse.redirect needs an
// absolute URL). isAbsoluteHttpUrl / absoluteRedirectUrlSchema are the
// stricter, additive rule for that one call site, composed with (not
// replacing) isDangerousUrl.
describe("isAbsoluteHttpUrl", () => {
  it("accepts absolute http/https URLs only", () => {
    expect(isAbsoluteHttpUrl("https://example.com")).toBe(true);
    expect(isAbsoluteHttpUrl("http://example.com/thanks")).toBe(true);
  });

  it("rejects relative paths, anchors, mailto/tel, and other schemes", () => {
    expect(isAbsoluteHttpUrl("/thanks")).toBe(false);
    expect(isAbsoluteHttpUrl("#section")).toBe(false);
    expect(isAbsoluteHttpUrl("mailto:a@b.com")).toBe(false);
    expect(isAbsoluteHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isAbsoluteHttpUrl("not a url")).toBe(false);
  });
});

describe("absoluteRedirectUrlSchema", () => {
  it("accepts an absolute https URL and an empty string", () => {
    expect(absoluteRedirectUrlSchema.safeParse("https://example.com").success).toBe(true);
    expect(absoluteRedirectUrlSchema.safeParse("").success).toBe(true);
  });

  it("refuses a javascript: URL", () => {
    expect(absoluteRedirectUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("refuses a relative path — NextResponse.redirect needs an absolute URL", () => {
    expect(absoluteRedirectUrlSchema.safeParse("/thanks").success).toBe(false);
  });

  it("stays stricter than the shared isDangerousUrl alone — file: passes THAT but fails here", () => {
    // The shared isDangerousUrl (above) does not flag file: at all; a page
    // redirect to it is still meaningless, so the composed schema still
    // refuses it via isAbsoluteHttpUrl's protocol allowlist.
    expect(isDangerousUrl("file:///etc/passwd")).toBe(false);
    expect(absoluteRedirectUrlSchema.safeParse("file:///etc/passwd").success).toBe(false);
  });
});
