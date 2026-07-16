/**
 * constants/defaultStyles — getDefaultStyles / hasDefaultStyles.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { getDefaultStyles, hasDefaultStyles } from "../defaultStyles";

describe("getDefaultStyles", () => {
  it("prefers a specific tag over the element type", () => {
    const h1 = getDefaultStyles("heading", "h1");
    const h2 = getDefaultStyles("heading", "h2");
    expect(Object.keys(h1).length).toBeGreaterThan(0);
    // h1 and h2 differ (distinct tag entries)
    expect(h1).not.toEqual(h2);
  });

  it("is case-insensitive on the tag name", () => {
    expect(getDefaultStyles("heading", "H1")).toEqual(getDefaultStyles("heading", "h1"));
  });

  it("falls back to the element type when the tag has no entry", () => {
    const byType = getDefaultStyles("button");
    expect(Object.keys(byType).length).toBeGreaterThan(0);
    expect(getDefaultStyles("button", "made-up-tag")).toEqual(byType);
  });

  it("returns an empty object for unknown types", () => {
    expect(getDefaultStyles("totally-unknown")).toEqual({});
  });

  it("returns a fresh copy each call (no shared mutation)", () => {
    const a = getDefaultStyles("button");
    a.__mutated = "x";
    const b = getDefaultStyles("button");
    expect(b.__mutated).toBeUndefined();
  });
});

describe("hasDefaultStyles", () => {
  it("is true when a tag or type entry exists", () => {
    expect(hasDefaultStyles("heading", "h1")).toBe(true);
    expect(hasDefaultStyles("button")).toBe(true);
  });
  it("is false for unknown type + unknown tag", () => {
    expect(hasDefaultStyles("totally-unknown")).toBe(false);
    expect(hasDefaultStyles("totally-unknown", "made-up-tag")).toBe(false);
  });
});
