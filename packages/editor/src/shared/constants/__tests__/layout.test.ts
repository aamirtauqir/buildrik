/**
 * Layout SSOT guard tests — invariants for Week 1.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import * as layout from "../layout";

describe("layout.ts SSOT", () => {
  /* Two survivors. TOPBAR_H / HEADER_H / FOOTER_H / ROW_SM / ROW_MD re-declared
     `--bk-size-*` tokens and had no consumer but this test — deleted 2026-09-02
     (duplicates sweep). A constant nothing reads guards nothing. */
  it("exports 2 named dimension constants", () => {
    const expected = ["TOOLBAR_H", "ROW_LG"];
    for (const key of expected) {
      expect(layout).toHaveProperty(key);
      expect(typeof (layout as Record<string, unknown>)[key]).toBe("number");
    }
  });

  it("canonical values match DESIGN.md §Layout", () => {
    expect(layout.TOOLBAR_H).toBe(36);
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
