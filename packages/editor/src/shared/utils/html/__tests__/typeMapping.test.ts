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
import { ELEMENT_RULES } from "../../nesting/rules";

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

  /* Q2: it was a hand-kept copy ten members behind the union, so a block
     marked `data-buildrick-type="video-embed"` was typed from its tag. */
  it("accepts every ElementType the engine has rules for", () => {
    const missing = Object.keys(ELEMENT_RULES).filter((t) => !VALID_ELEMENT_TYPES.has(t));
    expect(missing).toEqual([]);
  });

  it.each(["video-embed", "map-embed", "checkbox", "radio", "switch", "label", "stack", "tabs", "accordion"])(
    "honours a %s marker on a div",
    (type) => {
      expect(getElementTypeFromTag("div", type)).toBe(type);
    }
  );
});

describe("structural tags keep a real type", () => {
  it("types <li> as a list item and <label> as a label, not a container", () => {
    expect(getElementTypeFromTag("li")).toBe("list-item");
    expect(getElementTypeFromTag("label")).toBe("label");
    expect(getDefaultTagName("list-item")).toBe("li");
    expect(getDefaultTagName("label")).toBe("label");
  });

  it("new wrapper types render as the div they always were", () => {
    for (const t of ["stack", "tabs", "lottie", "video-embed", "map-embed", "social"]) {
      expect(getDefaultTagName(t)).toBe("div");
    }
  });
});

/**
 * The catalog's Checkbox, Radio and Switch are <label> wrappers typed as the
 * control they wrap. The control's attributes belong on its <input>; on the
 * label they would be published as `<label type="checkbox" role="switch">`.
 */
describe("getDefaultAttributes only applies to the type's own tag", () => {
  it.each(["checkbox", "radio", "switch"])("gives a %s <label> wrapper nothing", (type) => {
    expect(getDefaultAttributes(type, "label")).toEqual({});
  });

  it("still fills them in on the control itself, and when no tag is given", () => {
    expect(getDefaultAttributes("checkbox", "input")).toEqual({ type: "checkbox" });
    expect(getDefaultAttributes("switch", "INPUT")).toEqual({ type: "checkbox", role: "switch" });
    expect(getDefaultAttributes("email")).toEqual({ type: "email" });
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
    // `slider` is the Carousel, a container of slides — not the range input.
    for (const t of ["container", "card", "spacer", "grid", "slider"]) {
      expect(getDefaultTagName(t)).toBe("div");
      expect(getDefaultAttributes(t)).toEqual({});
    }
  });
});
