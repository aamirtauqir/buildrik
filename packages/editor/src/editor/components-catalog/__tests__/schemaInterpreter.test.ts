import { describe, it, expect } from "vitest";
import { interpretSchema, substitutePlaceholders } from "../schemaInterpreter";
import type { ComponentType } from "../types";

const buttonComponent: ComponentType = {
  id: "button",
  category: "atom",
  name: "Button",
  variants: ["primary"],
  schema: {
    props: {
      label: { type: "string", default: "Click me" },
      disabled: { type: "boolean", default: false },
    },
    structure: {
      type: "element",
      tag: "button",
      attrs: { type: "button" },
      children: [{ type: "text", source: "props.label" }],
    },
  },
  defaultBindings: { primary: {} },
};

const cardComponent: ComponentType = {
  id: "card",
  category: "molecule",
  name: "Card",
  variants: ["elevated"],
  schema: {
    props: { title: { type: "string", default: "Card title" } },
    structure: {
      type: "element",
      tag: "div",
      children: [
        { type: "element", tag: "h3", children: [{ type: "text", source: "props.title" }] },
        { type: "slot", name: "body" },
      ],
    },
  },
  defaultBindings: { elevated: {} },
};

describe("substitutePlaceholders", () => {
  it("replaces {props.X} with resolved value", () => {
    expect(substitutePlaceholders("hi {props.name}", { name: "Tom" })).toBe("hi Tom");
  });

  it("leaves unmatched placeholder verbatim", () => {
    expect(substitutePlaceholders("hi {props.unknown}", {})).toBe("hi {props.unknown}");
  });

  it("renders empty string for null/undefined", () => {
    expect(substitutePlaceholders("[{props.x}]", { x: null })).toBe("[]");
  });

  it("coerces non-string values", () => {
    expect(substitutePlaceholders("count: {props.n}", { n: 42 })).toBe("count: 42");
  });
});

describe("interpretSchema", () => {
  it("substitutes props and collapses text-only children to content", () => {
    const out = interpretSchema(buttonComponent, { variant: "primary", catalogId: "button" });
    expect(out.kind).toBe("element");
    if (out.kind !== "element") return;
    expect(out.tag).toBe("button");
    expect(out.attrs.type).toBe("button");
    expect(out.attrs["data-buildrik-catalog-component"]).toBe("button");
    expect(out.attrs["data-variant"]).toBe("primary");
    expect(out.content).toBe("Click me");
    expect(out.children).toEqual([]);
  });

  it("uses caller-provided prop overrides over schema defaults", () => {
    const out = interpretSchema(buttonComponent, { props: { label: "Save" } });
    if (out.kind !== "element") return;
    expect(out.content).toBe("Save");
  });

  it("preserves nested element structure (no text collapse when mixed)", () => {
    const out = interpretSchema(cardComponent, { variant: "elevated" });
    if (out.kind !== "element") return;
    expect(out.tag).toBe("div");
    expect(out.children).toHaveLength(2);
    const [h3, slot] = out.children;
    expect(h3.kind).toBe("element");
    if (h3.kind === "element") {
      expect(h3.tag).toBe("h3");
      expect(h3.content).toBe("Card title");
    }
    expect(slot.kind).toBe("slot");
    if (slot.kind === "slot") expect(slot.name).toBe("body");
  });

  it("emits placeholder span for icon nodes carrying source path", () => {
    const out = interpretSchema({
      id: "i",
      category: "atom",
      name: "Iconish",
      variants: ["default"],
      schema: {
        props: { name: { type: "string", default: "search" } },
        structure: { type: "icon", source: "props.name" },
      },
      defaultBindings: { default: {} },
    });
    if (out.kind !== "element") return;
    expect(out.tag).toBe("span");
    expect(out.attrs["data-icon-source"]).toBe("search");
  });

  it("classes joined into class attr", () => {
    const out = interpretSchema({
      id: "x",
      category: "atom",
      name: "X",
      variants: ["default"],
      schema: {
        props: {},
        structure: { type: "element", tag: "div", classes: ["a", "b"] },
      },
      defaultBindings: { default: {} },
    });
    if (out.kind !== "element") return;
    expect(out.attrs.class).toBe("a b");
  });
});
