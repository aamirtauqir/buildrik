/**
 * statusLabel — 5-variant + unknown-guard. C4 #26: no Password status;
 * G2-071: no External (it had no creator), and Hidden reads as the v3 board
 * chip, "Hidden from publish".
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
    ["hidden", "Hidden from publish"],
    ["error", "Error"],
  ])("maps %s to %s", (status, expected) => {
    expect(getStatusLabel(status as PageStatus)).toBe(expected);
  });

  it("returns null for unknown status (defensive — never crash UI)", () => {
    expect(getStatusLabel("fnord" as PageStatus)).toBeNull();
  });

  it("has no Password label — C4 #26 removed Password pages", () => {
    expect(getStatusLabel("password" as PageStatus)).toBeNull();
  });

  it("has no External label (G2-071)", () => {
    expect(getStatusLabel("external" as PageStatus)).toBeNull();
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
