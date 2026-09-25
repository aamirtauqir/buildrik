/**
 * S-1: the one URL-scheme check both the server sanitizer and the editor use.
 * A browser strips tabs/newlines inside a scheme and C0 controls/spaces before
 * it, so "java\tscript:" and "\x01javascript:" run as javascript:.
 */
import { describe, it, expect } from "vitest";
import { isDangerousUrl, isSafeCssDeclaration, srcsetUrls } from "../element-markup";

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
