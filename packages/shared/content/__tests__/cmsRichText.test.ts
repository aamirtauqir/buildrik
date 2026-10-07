/**
 * The one rich text sanitizer (security review, 2026-10-04): parser-based,
 * idempotent, allow-list only, and its output is inert even where an
 * attribute value was.
 */
import { describe, expect, it } from "vitest";
import DOMPurify from "isomorphic-dompurify";
import { isSafeCmsRichTextHref, sanitizeCmsRichText } from "../cmsRichText";
import { XSS_PAYLOADS, executionVector } from "./xssVectors";

const clean = (html: string) => sanitizeCmsRichText(DOMPurify, html);
const parse = (html: string) => new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, "text/html").body;

describe("sanitizeCmsRichText", () => {
  it.each(XSS_PAYLOADS)("leaves no execution vector, in text or attribute context: %s", (payload) => {
    const out = clean(payload);
    expect(executionVector(parse(out))).toBeNull();
    expect(executionVector(parse(`<img alt="${out}" src="/a.png">`), { allowImages: true })).toBeNull();
    expect(executionVector(parse(`<p title='${out}'>x</p>`))).toBeNull();
    expect(clean(out)).toBe(out);
  });

  it("keeps the allow-listed formatting; bold/italic as strong/em; safe links only", () => {
    expect(clean('<p>Hi <b>b</b> <i>i</i> <u>u</u> <a href="https://x.test/?a=1&b=2" title="t">ok</a> <a href="mailto:a@b.c">m</a> <a href="/rel">r</a></p>')).toBe(
      "<p>Hi <strong>b</strong> <em>i</em> <u>u</u> <a href=https://x.test/?a%3D1&amp;b%3D2>ok</a> <a href=mailto:a@b.c>m</a> <a href=/rel>r</a></p>",
    );
    expect(clean("<h2>a</h2><ul><li>1</li></ul><blockquote>q</blockquote><code>c</code><h1>no</h1><span>s</span>")).toBe(
      "<h2>a</h2><ul><li>1</li></ul><blockquote>q</blockquote><code>c</code>nos",
    );
  });

  it("an href with a quote and spaces is inert in single-quoted and unquoted attributes", () => {
    const out = clean(`<a href="/x' onmouseover='alert(1) y">l</a>`);
    expect(out).not.toContain("'");
    const single = parse(`<p title='${out}'>x</p>`);
    expect(single.querySelectorAll("*")).toHaveLength(1);
    expect(single.querySelector("p")!.getAttributeNames()).toEqual(["title"]);
    const unquoted = parse(`<p title=${out}>x</p>`);
    expect(executionVector(unquoted)).toBeNull();
    expect(Array.from(unquoted.querySelectorAll("*")).flatMap((e) => e.getAttributeNames()).filter((n) => n.startsWith("on"))).toEqual([]);
  });

  it("text never becomes markup", () => {
    expect(clean("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });

  it("hrefs: http(s)/mailto/relative only, read as a browser reads them", () => {
    for (const bad of ["javascript:x", " JaVaScRiPt:x", "java\tscript:x", "\u0001javascript:x", "data:text/html,x", "vbscript:x", "ja vascript:x"]) {
      expect(isSafeCmsRichTextHref(bad)).toBe(false);
    }
    for (const ok of ["https://a", "http://a", "mailto:a@b", "/a", "a/b", "#x", "//cdn.test/x"]) expect(isSafeCmsRichTextHref(ok)).toBe(true);
  });
});
