/**
 * statusLabel — 7-variant + unknown-guard.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { getStatusLabel } from "../statusLabel";
import type { PageStatus } from "../../types";

describe("getStatusLabel", () => {
  it.each([
    ["live", "Live"],
    ["draft", "Draft"],
    ["scheduled", "Scheduled"],
    ["hidden", "Hidden"],
    ["password", "Password"],
    ["external", "External"],
    ["error", "Error"],
  ])("maps %s to %s", (status, expected) => {
    expect(getStatusLabel(status as PageStatus)).toBe(expected);
  });

  it("returns null for unknown status (defensive — never crash UI)", () => {
    expect(getStatusLabel("fnord" as PageStatus)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(getStatusLabel(undefined)).toBeNull();
  });

  it("IRON RULE regression: scheduled does NOT silently fall through to Live", () => {
    // Pre-existing bug: PageCommandPalette.tsx had a switch lacking case 'scheduled',
    // so scheduled pages rendered as 'Live'. Centralizing the map here prevents that
    // class of bug at the type level — scheduled is in PageStatus union, missing it
    // would tsc-error.
    expect(getStatusLabel("scheduled")).toBe("Scheduled");
    expect(getStatusLabel("scheduled")).not.toBe("Live");
  });
});
