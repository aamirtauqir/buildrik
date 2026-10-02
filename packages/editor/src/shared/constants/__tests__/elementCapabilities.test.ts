/**
 * Element capabilities — the one table that says what each type is
 * (Inspector v4 §1.1). Compile time already forces a row per ElementType;
 * these pin the rows the boards decide.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { VALID_ELEMENT_TYPES } from "@/shared/utils/html/typeMapping";
import {
  BINDABLE_TYPES,
  ELEMENT_CAPABILITIES,
  LINKABLE_TYPES,
  capabilitiesFor,
} from "../elementCapabilities";

describe("element capabilities", () => {
  it("has a row for every element type the engine knows", () => {
    for (const type of VALID_ELEMENT_TYPES) expect(ELEMENT_CAPABILITIES, type).toHaveProperty(type);
  });

  it("a stored type the union does not know reads as a container", () => {
    expect(capabilitiesFor("marquee")).toMatchObject({ typeBlock: null, layout: true, typography: "inside" });
  });

  it("text types open Typography and carry their own type block (boards 1, 4)", () => {
    expect(capabilitiesFor("heading")).toMatchObject({ typeBlock: "heading", typography: "open", cmsBindable: true, link: false });
    expect(capabilitiesFor("paragraph").typeBlock).toBe("text");
  });

  it("button, input and checkbox keep their text styling in a closed Text inside (owner answer 1)", () => {
    for (const type of ["button", "input", "checkbox"]) expect(capabilitiesFor(type).typography, type).toBe("inside");
  });

  it("a checkbox is a Choice, not a Container (Q2, board 15)", () => {
    expect(capabilitiesFor("checkbox").typeBlock).toBe("choice");
    expect(capabilitiesFor("switch").typeBlock).toBe("choice");
  });

  it("a Section is linkable and never CMS-bound (board 18)", () => {
    expect(LINKABLE_TYPES.has("section")).toBe(true);
    expect(BINDABLE_TYPES.has("section")).toBe(false);
  });

  it("Form and Collection list carry their own Behaviour sections, no Link, no CMS (boards 19, 20)", () => {
    expect(capabilitiesFor("form")).toMatchObject({ behaviourSections: ["form-fields", "form-settings"], link: false, cmsBindable: false });
    expect(capabilitiesFor("collection-list")).toMatchObject({ behaviourSections: ["collection"], link: false, cmsBindable: false });
  });

  it("the CMS-bindable list is exactly the six types the canvas menu offered", () => {
    expect([...BINDABLE_TYPES].sort()).toEqual(["button", "heading", "image", "link", "paragraph", "text"]);
  });

  it("a structural child gets the minimal panel: no Link, no CMS (R-4)", () => {
    expect(capabilitiesFor("list-item").isStructuralChild).toBe(true);
    expect(LINKABLE_TYPES.has("list-item")).toBe(false);
  });
});
