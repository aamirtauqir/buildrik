/**
 * nesting/typeChecks — category predicates + role/level lookups.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementType } from "../../../types";
import { ElementCategory } from "../types";
import {
  isInteractiveType,
  isVoidType,
  isContainerType,
  isBlockType,
  isInlineType,
  isLandmarkType,
  isHeadingType,
  isSectionType,
  isFormType,
  isMediaType,
  getPrimaryCategory,
  getElementsByCategory,
  getImplicitRole,
  getLandmarkRole,
  getHeadingLevel,
  canHaveChildren,
} from "../typeChecks";

describe("category predicates", () => {
  it("isInteractiveType", () => {
    expect(isInteractiveType("button")).toBe(true);
    expect(isInteractiveType("link")).toBe(true);
    expect(isInteractiveType("container")).toBe(false);
  });

  it("isVoidType", () => {
    expect(isVoidType("image")).toBe(true);
    expect(isVoidType("input")).toBe(true);
    expect(isVoidType("container")).toBe(false);
  });

  it("isContainerType", () => {
    expect(isContainerType("container")).toBe(true);
    expect(isContainerType("section")).toBe(true);
    expect(isContainerType("text")).toBe(false);
  });

  it("isBlockType", () => {
    expect(isBlockType("paragraph")).toBe(true);
    expect(isBlockType("text")).toBe(false);
  });

  it("isInlineType", () => {
    expect(isInlineType("text")).toBe(true);
    expect(isInlineType("container")).toBe(false);
  });

  it("isLandmarkType", () => {
    expect(isLandmarkType("header")).toBe(true);
    expect(isLandmarkType("form")).toBe(true);
    expect(isLandmarkType("container")).toBe(false);
  });

  it("isHeadingType", () => {
    expect(isHeadingType("heading")).toBe(true);
    expect(isHeadingType("text")).toBe(false);
  });

  it("isSectionType", () => {
    expect(isSectionType("section")).toBe(true);
    expect(isSectionType("container")).toBe(false);
  });

  it("isFormType", () => {
    expect(isFormType("form")).toBe(true);
    expect(isFormType("input")).toBe(true);
    expect(isFormType("container")).toBe(false);
  });

  it("isMediaType", () => {
    expect(isMediaType("image")).toBe(true);
    expect(isMediaType("video")).toBe(true);
    expect(isMediaType("container")).toBe(false);
  });

  it("all predicates return false for an unknown type (no throw)", () => {
    const bogus = "totally-unknown" as ElementType;
    expect(isVoidType(bogus)).toBe(false);
    expect(isContainerType(bogus)).toBe(false);
    expect(isHeadingType(bogus)).toBe(false);
  });
});

describe("getPrimaryCategory", () => {
  it("returns the first category in the list", () => {
    expect(getPrimaryCategory("container")).toBe(ElementCategory.CONTAINER);
    expect(getPrimaryCategory("text")).toBe(ElementCategory.TEXT);
  });

  it("returns null for an unknown type", () => {
    expect(getPrimaryCategory("nope" as ElementType)).toBeNull();
  });
});

describe("getElementsByCategory", () => {
  it("lists every type carrying the MEDIA category", () => {
    const media = getElementsByCategory(ElementCategory.MEDIA);
    expect(media).toContain("image");
    expect(media).toContain("video");
    expect(media).not.toContain("container");
  });

  it("lists container types under CONTAINER", () => {
    expect(getElementsByCategory(ElementCategory.CONTAINER)).toContain("container");
  });
});

describe("getImplicitRole / getLandmarkRole", () => {
  it("returns the rule's implicit role", () => {
    expect(getImplicitRole("container")).toBe("generic");
    expect(getImplicitRole("link")).toBe("link");
  });

  it("returns undefined implicit role for an unknown type", () => {
    expect(getImplicitRole("nope" as ElementType)).toBeUndefined();
  });

  it("returns landmark roles only for landmark types", () => {
    expect(getLandmarkRole("header")).toBeDefined();
    expect(getLandmarkRole("container")).toBeUndefined();
  });
});

describe("getHeadingLevel", () => {
  it("returns the explicit level for headings", () => {
    expect(getHeadingLevel({ type: "heading", level: 3 })).toBe(3);
  });

  it("defaults headings to level 2", () => {
    expect(getHeadingLevel({ type: "heading" })).toBe(2);
  });

  it("returns 0 for non-heading elements", () => {
    expect(getHeadingLevel({ type: "text" })).toBe(0);
  });
});

describe("canHaveChildren", () => {
  it("is true for containers, false for void leaves", () => {
    expect(canHaveChildren("container")).toBe(true);
    expect(canHaveChildren("image")).toBe(false);
  });
});
