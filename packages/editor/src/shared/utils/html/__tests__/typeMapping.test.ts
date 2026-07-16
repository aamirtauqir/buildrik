/**
 * html/typeMapping — tag ↔ Aquibra element-type resolution.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  getDefaultTagName,
  getElementTypeFromTag,
  VALID_ELEMENT_TYPES,
  TYPE_TO_TAG_MAP,
} from "../typeMapping";

describe("getDefaultTagName", () => {
  it("maps known types to their default tag", () => {
    expect(getDefaultTagName("heading")).toBe("h2");
    expect(getDefaultTagName("paragraph")).toBe("p");
    expect(getDefaultTagName("link")).toBe("a");
    expect(getDefaultTagName("list")).toBe("ul");
    expect(getDefaultTagName("divider")).toBe("hr");
  });

  it("falls back to div for unknown types", () => {
    expect(getDefaultTagName("does-not-exist")).toBe("div");
  });

  it("every TYPE_TO_TAG_MAP entry round-trips through getDefaultTagName", () => {
    for (const [type, tag] of Object.entries(TYPE_TO_TAG_MAP)) {
      expect(getDefaultTagName(type)).toBe(tag);
    }
  });
});

describe("getElementTypeFromTag", () => {
  it("maps known tags (case-insensitively) to types", () => {
    expect(getElementTypeFromTag("p")).toBe("paragraph");
    expect(getElementTypeFromTag("IMG")).toBe("image");
    expect(getElementTypeFromTag("H3")).toBe("heading");
    expect(getElementTypeFromTag("ul")).toBe("list");
  });

  it("falls back to container for unknown tags", () => {
    expect(getElementTypeFromTag("marquee")).toBe("container");
  });

  it("prefers an explicit valid data-type over the tag mapping", () => {
    expect(getElementTypeFromTag("div", "hero")).toBe("hero");
    expect(getElementTypeFromTag("span", "button")).toBe("button");
  });

  it("ignores an invalid data-type and uses the tag mapping", () => {
    expect(getElementTypeFromTag("p", "not-a-real-type")).toBe("paragraph");
  });

  it("ignores a null data-type", () => {
    expect(getElementTypeFromTag("a", null)).toBe("link");
  });
});

describe("VALID_ELEMENT_TYPES", () => {
  it("contains the core structural types", () => {
    expect(VALID_ELEMENT_TYPES.has("container")).toBe(true);
    expect(VALID_ELEMENT_TYPES.has("hero")).toBe(true);
    expect(VALID_ELEMENT_TYPES.has("not-a-type")).toBe(false);
  });
});
