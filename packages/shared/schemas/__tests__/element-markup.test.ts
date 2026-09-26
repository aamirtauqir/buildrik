/**
 * S-1: the one URL-scheme check both the server sanitizer and the editor use.
 * A browser strips tabs/newlines inside a scheme and C0 controls/spaces before
 * it, so "java\tscript:" and "\x01javascript:" run as javascript:.
 */
import { describe, it, expect } from "vitest";
import {
  escapeStyleText,
  isDangerousUrl,
  isSafeCssDeclaration,
  isSafeCssSelector,
  isSafeElementId,
  isSafeMediaQuery,
  isSafeStyleRuleTarget,
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
