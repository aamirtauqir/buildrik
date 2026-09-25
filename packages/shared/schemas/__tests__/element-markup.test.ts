/**
 * S-1: the one URL-scheme check both the server sanitizer and the editor use.
 * A browser strips tabs/newlines inside a scheme and C0 controls/spaces before
 * it, so "java\tscript:" and "\x01javascript:" run as javascript:.
 */
import { describe, it, expect } from "vitest";
import { isDangerousUrl, srcsetUrls } from "../element-markup";

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
