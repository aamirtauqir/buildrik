/**
 * sanitization gap tests — complements sanitization.test.ts (XSS +
 * preservation invariants) with: isSafeUrl / isSafeAttrValue helpers,
 * stripTags / allowedTags options, tag removal helpers, vbscript:,
 * data-attr gating, and the no-DOM (SSR) fallback.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  sanitizeHTML,
  stripAllTags,
  removeTags,
  isSafeUrl,
  isSafeAttrValue,
} from "../sanitization";

describe("isSafeUrl", () => {
  it("allows the standard schemes", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("mailto:info@buildrick.io")).toBe(true);
    expect(isSafeUrl("tel:+923001234567")).toBe(true);
  });

  it("allows fragments, absolute paths, and plain relative URLs", () => {
    expect(isSafeUrl("#section")).toBe(true);
    expect(isSafeUrl("/about")).toBe(true);
    expect(isSafeUrl("images/pic.png")).toBe(true);
  });

  it("blocks javascript:/vbscript: in any casing", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("blocks data:text/html but allows other data: URLs", () => {
    expect(isSafeUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isSafeUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
  });

  it("rejects unknown schemes", () => {
    expect(isSafeUrl("weird:thing")).toBe(false);
  });

  it("honors a custom allowed-scheme set", () => {
    expect(isSafeUrl("ftp://host/file", new Set(["ftp:"]))).toBe(true);
    expect(isSafeUrl("https://example.com", new Set(["ftp:"]))).toBe(false);
  });
});

describe("isSafeAttrValue", () => {
  it("rejects any on* event-handler attribute regardless of value", () => {
    expect(isSafeAttrValue("onclick", "doSomething()", "div")).toBe(false);
    expect(isSafeAttrValue("onerror", "x", "img")).toBe(false);
  });

  it("validates URL attributes through isSafeUrl", () => {
    expect(isSafeAttrValue("href", "https://example.com", "a")).toBe(true);
    expect(isSafeAttrValue("href", "javascript:alert(1)", "a")).toBe(false);
    expect(isSafeAttrValue("src", "data:text/html,x", "img")).toBe(false);
    expect(isSafeAttrValue("action", "/submit", "form")).toBe(true);
  });

  it("blocks CSS-borne vectors (expression, -moz-binding, behavior)", () => {
    expect(isSafeAttrValue("style", "width: expression(alert(1))", "div")).toBe(false);
    expect(isSafeAttrValue("style", "-moz-binding: url(x)", "div")).toBe(false);
    expect(isSafeAttrValue("style", "behavior : url(x.htc)", "div")).toBe(false);
    expect(isSafeAttrValue("style", "color: red", "div")).toBe(true);
  });

  it("accepts ordinary attribute values", () => {
    expect(isSafeAttrValue("class", "bd-card is-active", "div")).toBe(true);
    expect(isSafeAttrValue("placeholder", "Your name", "input")).toBe(true);
  });
});

describe("sanitizeHTML — options", () => {
  it("stripTags: true returns text content only", () => {
    expect(sanitizeHTML("<b>bold</b> text", { stripTags: true })).toBe("bold text");
  });

  it("allowedTags restricts the tag whitelist", () => {
    const out = sanitizeHTML("<b>keep</b><i>drop</i>", { allowedTags: new Set(["b"]) });
    expect(out).toContain("<b>keep</b>");
    expect(out).not.toMatch(/<i>/);
    expect(out).toContain("drop"); // content survives, tag does not
  });

  it("strips vbscript: URLs", () => {
    expect(sanitizeHTML('<a href="vbscript:msgbox(1)">x</a>')).not.toMatch(/vbscript:/i);
  });

  it("keeps aria-* attributes by default, drops them when disabled", () => {
    const html = '<button aria-label="Close">x</button>';
    expect(sanitizeHTML(html)).toMatch(/aria-label="Close"/);
    expect(sanitizeHTML(html, { allowAriaAttrs: false })).not.toMatch(/aria-label/);
  });

  it("keeps the named editor attrs even when generic data-* are disabled", () => {
    const html = '<div data-buildrick-id="e1" data-buildrick-type="text" data-foo="x">t</div>';
    const out = sanitizeHTML(html, { allowDataAttrs: false });
    expect(out).toMatch(/data-buildrick-id="e1"/);
    expect(out).toMatch(/data-buildrick-type="text"/);
    expect(out).not.toMatch(/data-foo/);
  });
});

describe("sanitizeHTML — no-DOM (SSR) fallback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("falls back to a conservative text-only strip when DOMParser is missing", () => {
    vi.stubGlobal("DOMParser", undefined);
    const out = sanitizeHTML('<div onclick="evil()">safe <b>text</b></div>');
    expect(out).not.toMatch(/</);
    expect(out).toContain("safe");
    expect(out).toContain("text");
  });
});

describe("stripAllTags / removeTags", () => {
  it("stripAllTags keeps only text content", () => {
    expect(stripAllTags("<div>a<b>b</b></div>")).toBe("ab");
    expect(stripAllTags("plain")).toBe("plain");
  });

  it("removeTags removes only the listed tags, keeping their content", () => {
    expect(removeTags("<b>x</b><i>y</i>", ["b"])).toBe("x<i>y</i>");
    expect(removeTags('<span class="s">x</span>', ["span"])).toBe("x");
  });

  it("removeTags is case-insensitive", () => {
    expect(removeTags("<B>x</B>", ["b"])).toBe("x");
  });
});
