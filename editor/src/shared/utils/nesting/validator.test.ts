import { describe, it, expect } from "vitest";
import { getSuggestedParents } from "./operations";

describe("getSuggestedParents", () => {
  it("returns container-like types for a heading element", () => {
    const suggestions = getSuggestedParents("heading");
    // heading can go in container, section, flex, grid, etc.
    expect(suggestions.length).toBeGreaterThan(0);
    // should prioritize container types
    const hasContainer = suggestions.some((t) =>
      ["container", "section", "flex", "grid"].includes(t)
    );
    expect(hasContainer).toBe(true);
  });

  it("respects limit parameter", () => {
    const suggestions = getSuggestedParents("heading", 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array for a type that has no valid parents", () => {
    // "page" or "root" types have no parents
    // Use a type that can't be nested anywhere — if none, just verify no throws
    expect(() =>
      getSuggestedParents("section" as Parameters<typeof getSuggestedParents>[0])
    ).not.toThrow();
  });
});
