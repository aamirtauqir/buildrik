/**
 * html/typeMapping — tag ↔ Aquibra element-type resolution.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  getDefaultTagName,
  getDefaultAttributes,
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

/**
 * The form family.
 *
 * The Insert panel offers Email, Password, Number, Date, Time, Color, Checkbox,
 * Radio, Switch, Slider, Upload and Submit. None of them was in TYPE_TO_TAG_MAP,
 * so all twelve fell through to "div" — measured live, they rendered as empty
 * divs on the canvas and published as empty divs too. A visitor could not type
 * into a contact form, let alone submit it.
 */
describe("form field types are real controls", () => {
  const FIELDS: Array<[string, string, string | null]> = [
    ["input", "input", null],
    ["email", "input", "email"],
    ["password", "input", "password"],
    ["number", "input", "number"],
    ["date", "input", "date"],
    ["time", "input", "time"],
    ["color", "input", "color"],
    ["checkbox", "input", "checkbox"],
    ["radio", "input", "radio"],
    ["switch", "input", "checkbox"],
    ["slider", "input", "range"],
    ["upload", "input", "file"],
    ["submit", "button", "submit"],
    ["select", "select", null],
    ["textarea", "textarea", null],
    ["form", "form", null],
  ];

  it.each(FIELDS)("%s renders as <%s>", (type, tag) => {
    expect(getDefaultTagName(type)).toBe(tag);
  });

  it.each(FIELDS)("%s carries the type attribute it needs", (type, _tag, inputType) => {
    const attrs = getDefaultAttributes(type);
    if (inputType === null) expect(attrs).toEqual({});
    else expect(attrs.type).toBe(inputType);
  });

  it("marks a switch as one for assistive tech, since the browser sees a checkbox", () => {
    expect(getDefaultAttributes("switch")).toEqual({ type: "checkbox", role: "switch" });
  });

  it("leaves types that really are divs alone", () => {
    for (const t of ["container", "card", "spacer", "grid"]) {
      expect(getDefaultTagName(t)).toBe("div");
      expect(getDefaultAttributes(t)).toEqual({});
    }
  });
});
