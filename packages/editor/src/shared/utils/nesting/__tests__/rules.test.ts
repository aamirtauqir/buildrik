/**
 * Nesting rules tests — table-driven coverage of the ELEMENT_RULES matrix
 * (canHaveChildren / canNestElement) and the STRICT_HTML5_RULES overlay.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementType } from "../../../types";
import { ELEMENT_RULES, STRICT_HTML5_RULES } from "../rules";
import { canNestElement, canNestElementStrict } from "../validator";
import { canHaveChildren } from "../typeChecks";
import { ELEMENT_TYPES } from "../derived";

describe("canHaveChildren — derived from ELEMENT_RULES.allowChildren", () => {
  // Every rule in the registry declares allowChildren explicitly, so the
  // derived set must mirror it 1:1.
  it.each(ELEMENT_TYPES.map((t) => [t, ELEMENT_RULES[t].allowChildren] as const))(
    "%s → %s",
    (type, allow) => {
      expect(canHaveChildren(type)).toBe(allow);
    }
  );

  it("pins the leaf (void) types", () => {
    const leaves = ELEMENT_TYPES.filter((t) => !ELEMENT_RULES[t].allowChildren);
    expect(leaves).toEqual(
      expect.arrayContaining([
        "image",
        "audio",
        "svg",
        "lottie",
        "icon",
        "input",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "switch",
        "upload",
        "progress",
        "countdown",
        "video-embed",
        "map-embed",
        "spacer",
        "divider",
      ])
    );
  });
});

describe("canNestElement — leaf parents reject ALL children", () => {
  const leafParents = ELEMENT_TYPES.filter((t) => !ELEMENT_RULES[t].allowChildren);
  const representativeChildren: ElementType[] = ["text", "container", "image", "button"];

  it.each(leafParents.map((p) => [p] as const))("%s accepts no children", (parent) => {
    for (const child of representativeChildren) {
      expect(canNestElement(child, parent)).toBe(false);
    }
  });
});

describe("canNestElement — forbiddenChildren matrix", () => {
  // Every (parent, forbiddenChild) pair in the registry must be rejected.
  const pairs = ELEMENT_TYPES.flatMap((parent) =>
    (ELEMENT_RULES[parent].forbiddenChildren ?? []).map((child) => [parent, child] as const)
  );

  it.each(pairs.map(([p, c]) => [c, p] as const))("%s cannot nest inside %s", (child, parent) => {
    expect(canNestElement(child, parent)).toBe(false);
  });

  it("form forbids a nested form", () => {
    expect(canNestElement("form", "form")).toBe(false);
  });

  it("header/footer forbid each other and themselves", () => {
    expect(canNestElement("header", "header")).toBe(false);
    expect(canNestElement("footer", "header")).toBe(false);
    expect(canNestElement("header", "footer")).toBe(false);
    expect(canNestElement("footer", "footer")).toBe(false);
  });

  it("heading forbids sections, structure, and form controls", () => {
    for (const child of ["section", "heading", "paragraph", "form", "input", "select", "button"]) {
      expect(canNestElement(child as ElementType, "heading")).toBe(false);
    }
  });

  it("link and button forbid interactive nesting", () => {
    expect(canNestElement("link", "link")).toBe(false);
    expect(canNestElement("button", "link")).toBe(false);
    expect(canNestElement("link", "button")).toBe(false);
    expect(canNestElement("button", "button")).toBe(false);
  });
});

describe("canNestElement — allowedChildren allowlists", () => {
  it("gallery only accepts image/video/container", () => {
    expect(canNestElement("image", "gallery")).toBe(true);
    expect(canNestElement("video", "gallery")).toBe(true);
    expect(canNestElement("container", "gallery")).toBe(true);
    expect(canNestElement("text", "gallery")).toBe(false);
    expect(canNestElement("button", "gallery")).toBe(false);
  });

  it("product-grid only accepts product-card/container", () => {
    expect(canNestElement("product-card", "product-grid")).toBe(true);
    expect(canNestElement("container", "product-grid")).toBe(true);
    expect(canNestElement("card", "product-grid")).toBe(false);
  });
});

describe("canNestElement — category-based defaults", () => {
  it("containers accept the common building blocks", () => {
    for (const child of ["text", "heading", "paragraph", "image", "button", "section", "form"]) {
      expect(canNestElement(child as ElementType, "container")).toBe(true);
    }
  });

  it("sections accept content and containers", () => {
    expect(canNestElement("container", "section")).toBe(true);
    expect(canNestElement("heading", "section")).toBe(true);
  });

  it("text accepts inline content but not blocks it forbids", () => {
    expect(canNestElement("text", "text")).toBe(true);
    expect(canNestElement("section", "text")).toBe(false);
  });

  it("unknown child types are rejected (no categories)", () => {
    expect(canNestElement("bogus" as ElementType, "container")).toBe(false);
  });
});

describe("STRICT_HTML5_RULES — canNestElementStrict overlay", () => {
  // Every (strictParent, forbiddenChild) pair must be rejected in strict mode.
  const pairs = Object.entries(STRICT_HTML5_RULES).flatMap(([parent, rule]) =>
    rule.forbidden.map((child) => [parent, child] as const)
  );

  it.each(pairs.map(([p, c]) => [c, p] as const))(
    "strict: %s cannot nest inside %s",
    (child, parent) => {
      expect(canNestElementStrict(child as ElementType, parent as ElementType)).toBe(false);
    }
  );

  it("strict mode is STRICTER than base for heading > container", () => {
    // Base categories allow container-in-heading (FLOW overlap); the HTML5
    // overlay forbids it. This pins that the overlay actually adds bite.
    expect(canNestElement("container", "heading")).toBe(true);
    expect(canNestElementStrict("container", "heading")).toBe(false);
  });

  it("strict mode still allows valid nesting (text in heading)", () => {
    expect(canNestElementStrict("text", "heading")).toBe(true);
    expect(canNestElementStrict("heading", "container")).toBe(true);
  });
});
