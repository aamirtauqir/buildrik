/**
 * Unification spec §550 — getEditorHref (flag-aware sync helper).
 * Returns /edit/<id> when flag ON; falls back to legacy cross-origin URL when OFF.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEditorHref } from "../unified-flag";

describe("getEditorHref", () => {
  const orig = process.env.NEXT_PUBLIC_EDITOR_URL;
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_EDITOR_URL;
  });
  afterEach(() => {
    if (orig === undefined) delete process.env.NEXT_PUBLIC_EDITOR_URL;
    else process.env.NEXT_PUBLIC_EDITOR_URL = orig;
  });

  it("returns /edit/<id> when unified=true", () => {
    expect(getEditorHref("abc", true)).toBe("/edit/abc");
  });

  it("encodes URL-special characters in unified path", () => {
    expect(getEditorHref("abc def", true)).toBe("/edit/abc%20def");
    expect(getEditorHref("a/b", true)).toBe("/edit/a%2Fb");
    expect(getEditorHref("a?b", true)).toBe("/edit/a%3Fb");
    expect(getEditorHref("a#b", true)).toBe("/edit/a%23b");
  });

  it("falls back to legacy URL when unified=false using NEXT_PUBLIC_EDITOR_URL", () => {
    process.env.NEXT_PUBLIC_EDITOR_URL = "https://editor.example.com";
    expect(getEditorHref("abc", false)).toBe("https://editor.example.com/?siteId=abc");
  });

  it("defaults legacy URL to http://localhost:5050 when env var is unset", () => {
    expect(getEditorHref("abc", false)).toBe("http://localhost:5050/?siteId=abc");
  });

  it("encodes siteId in the legacy query as well", () => {
    expect(getEditorHref("abc def", false)).toMatch(/[?&]siteId=abc%20def$/);
  });
});
