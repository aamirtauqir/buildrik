/**
 * Layout SSOT guard tests — invariants for Week 1.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import * as layout from "../layout";

describe("layout.ts SSOT", () => {
  it("exports 11 named dimension constants", () => {
    const expected = [
      "RAIL_W", "SIDEBAR_W", "SIDEBAR_WIDE", "INSPECTOR_W",
      "TOPBAR_H", "HEADER_H", "TOOLBAR_H", "FOOTER_H",
      "ROW_SM", "ROW_MD", "ROW_LG",
    ];
    for (const key of expected) {
      expect(layout).toHaveProperty(key);
      expect(typeof (layout as Record<string, unknown>)[key]).toBe("number");
    }
  });

  it("canonical values match DESIGN.md §Layout", () => {
    expect(layout.RAIL_W).toBe(60);
    expect(layout.SIDEBAR_W).toBe(240);
    expect(layout.SIDEBAR_WIDE).toBe(320);
    expect(layout.INSPECTOR_W).toBe(320);
    expect(layout.TOPBAR_H).toBe(56);
    expect(layout.HEADER_H).toBe(44);
    expect(layout.TOOLBAR_H).toBe(36);
    expect(layout.FOOTER_H).toBe(40);
    expect(layout.ROW_SM).toBe(28);
    expect(layout.ROW_MD).toBe(32);
    expect(layout.ROW_LG).toBe(48);
  });

  it("does NOT export the deprecated LAYOUT object", () => {
    expect("LAYOUT" in layout).toBe(false);
  });
});
