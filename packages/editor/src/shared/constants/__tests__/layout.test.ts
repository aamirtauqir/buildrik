/**
 * Layout SSOT guard tests — invariants for Week 1.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import * as layout from "../layout";

describe("layout.ts SSOT", () => {
  it("exports 7 named dimension constants", () => {
    const expected = [
      "TOPBAR_H", "HEADER_H", "TOOLBAR_H", "FOOTER_H",
      "ROW_SM", "ROW_MD", "ROW_LG",
    ];
    for (const key of expected) {
      expect(layout).toHaveProperty(key);
      expect(typeof (layout as Record<string, unknown>)[key]).toBe("number");
    }
  });

  it("canonical values match DESIGN.md §Layout", () => {
    expect(layout.TOPBAR_H).toBe(56);
    expect(layout.HEADER_H).toBe(44);
    expect(layout.TOOLBAR_H).toBe(36);
    expect(layout.FOOTER_H).toBe(32);
    expect(layout.ROW_SM).toBe(28);
    expect(layout.ROW_MD).toBe(32);
    expect(layout.ROW_LG).toBe(48);
  });

  it("does NOT export the deprecated LAYOUT object", () => {
    expect("LAYOUT" in layout).toBe(false);
  });

  /* The three horizontal widths left on 2026-08-31. Two had no consumer but
     this test; the third (SIDEBAR_WIDE) was a second 320 that the shipping
     drawer read INSTEAD of the generated token, which made
     `gate:tokens-generated` guard a value nothing rendered. Widths now live in
     tokens only — see tabsConfig.width.test.ts for the replacement lock. */
  it("does NOT re-export chrome widths that belong to the tokens", () => {
    for (const gone of ["RAIL_W", "SIDEBAR_WIDE", "INSPECTOR_W"]) {
      expect(gone in layout, `${gone} is back — use var(--bk-size-*)`).toBe(false);
    }
  });
});
