/**
 * L3-036: the pre-publish "SEO configured" check inspects every emitted
 * title. Findings are warnings (SEO never blocks publish, 2026-10-04 Q8).
 */
import { describe, it, expect } from "vitest";
import { titleFindings } from "../titles";

const p = (id: string, title: string, noIndex = false) => ({ id, name: id, title, noIndex });

describe("titleFindings", () => {
  it("is empty for distinct, sensible titles", () => {
    expect(titleFindings([p("home", "Bella Cucina"), p("about", "About us · Bella Cucina")])).toEqual([]);
  });

  it("flags a page that ships as Untitled", () => {
    expect(titleFindings([p("a", "Untitled")])).toEqual([
      expect.objectContaining({ pageId: "a", kind: "untitled" }),
    ]);
  });

  it("flags an empty title", () => {
    expect(titleFindings([p("a", "  ")])[0]).toMatchObject({ pageId: "a", kind: "empty" });
  });

  it("flags a title over 60 characters as possibly cut off — an approximation", () => {
    const f = titleFindings([p("a", "x".repeat(61))]);
    expect(f[0]).toMatchObject({ pageId: "a", kind: "too-long" });
    expect(f[0].message).toMatch(/may be cut off in search results/);
    expect(titleFindings([p("a", "x".repeat(60))])).toEqual([]);
  });

  it("names both pages that share a title, ignoring case and spacing", () => {
    const f = titleFindings([p("one", "Home"), p("two", "  home "), p("three", "Menu")]);
    expect(f.map((x) => [x.pageId, x.kind])).toEqual([
      ["one", "duplicate"],
      ["two", "duplicate"],
    ]);
    expect(f[0].message).toBe('2 pages share the title "Home": one, two.');
  });

  it("skips pages hidden from search", () => {
    expect(titleFindings([p("one", "Home"), p("two", "Home", true), p("x", "Untitled", true)])).toEqual([]);
  });
});
