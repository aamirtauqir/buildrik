import { describe, it, expect } from "vitest";
import { SECTION_REGISTRY_LIST } from "../registry";

describe("registry — per-section style slicing (Task 5)", () => {
  it("every entry declares a styleKeys array", () => {
    for (const entry of SECTION_REGISTRY_LIST) {
      expect(entry.styleKeys, `entry ${entry.id} missing styleKeys`).toBeDefined();
      expect(Array.isArray(entry.styleKeys)).toBe(true);
    }
  });

  it("Size entry's styleKeys includes width and excludes color", () => {
    const size = SECTION_REGISTRY_LIST.find((e) => e.id === "size");
    expect(size).toBeDefined();
    expect(size!.styleKeys).toContain("width");
    expect(size!.styleKeys).not.toContain("color");
  });

  it("Typography entry's styleKeys includes color and excludes width", () => {
    const typo = SECTION_REGISTRY_LIST.find((e) => e.id === "typography");
    expect(typo).toBeDefined();
    expect(typo!.styleKeys).toContain("color");
    expect(typo!.styleKeys).not.toContain("width");
  });
});
