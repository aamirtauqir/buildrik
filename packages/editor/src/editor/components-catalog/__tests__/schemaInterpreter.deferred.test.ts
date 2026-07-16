/**
 * KNOWN pin: bare `{variant}` / `{size}` / `{disabled}` placeholders are
 * DEFERRED (unsupported in v1 — no catalog node uses them). The interpreter
 * only resolves the `{props.KEY}` shape; bare placeholders pass through
 * VERBATIM everywhere (attribute values, text sources, path resolution).
 * The only variant surface today is the `data-variant` attr stamped on the
 * root element from InterpretOptions.variant.
 */
import { describe, it, expect } from "vitest";
import {
  interpretSchema,
  substitutePlaceholders,
  resolvePath,
} from "../schemaInterpreter";
import type { ComponentType } from "../types";

function makeComponent(overrides: Partial<ComponentType> = {}): ComponentType {
  return {
    id: "pill",
    category: "atom",
    name: "Pill",
    variants: ["primary"],
    schema: {
      props: {},
      structure: { type: "element", tag: "div" },
    },
    defaultBindings: { primary: {} },
    ...overrides,
  };
}

describe("substitutePlaceholders — deferred {variant}/{size}/{disabled} (pinned verbatim)", () => {
  it("leaves {variant} verbatim even when a 'variant' key exists in the resolved map", () => {
    expect(substitutePlaceholders("btn btn--{variant}", { variant: "primary" })).toBe(
      "btn btn--{variant}",
    );
  });

  it("leaves {size} verbatim", () => {
    expect(substitutePlaceholders("pad-{size}", { size: "lg" })).toBe("pad-{size}");
  });

  it("leaves {disabled} verbatim", () => {
    expect(substitutePlaceholders("is-{disabled}", { disabled: true })).toBe("is-{disabled}");
  });

  it("resolves the {props.X} shape in the same string while bare tokens stay", () => {
    expect(
      substitutePlaceholders("{props.label} {variant} {size}", {
        label: "Save",
        variant: "primary",
        size: "lg",
      }),
    ).toBe("Save {variant} {size}");
  });
});

describe("resolvePath — deferred bare paths (pinned verbatim)", () => {
  it("returns 'variant' verbatim (only props.<key> paths resolve)", () => {
    expect(resolvePath("variant", { variant: "primary" })).toBe("variant");
  });

  it("returns 'size' verbatim", () => {
    expect(resolvePath("size", { size: "lg" })).toBe("size");
  });

  it("still resolves a prop literally named 'variant' via the props. prefix", () => {
    expect(resolvePath("props.variant", { variant: "primary" })).toBe("primary");
  });
});

describe("interpretSchema — deferred placeholders in the tree (pinned verbatim)", () => {
  it("attribute values keep bare {variant}/{size} verbatim; data-variant attr is the only variant surface", () => {
    const out = interpretSchema(
      makeComponent({
        schema: {
          props: {},
          structure: {
            type: "element",
            tag: "div",
            attrs: { "data-look": "v-{variant} s-{size}" },
          },
        },
      }),
      { variant: "primary" },
    );

    expect(out.kind).toBe("element");
    if (out.kind !== "element") return;
    expect(out.attrs["data-look"]).toBe("v-{variant} s-{size}");
    expect(out.attrs["data-variant"]).toBe("primary");
  });

  it("text nodes with a bare 'variant' source render the source string verbatim", () => {
    const out = interpretSchema(
      makeComponent({
        schema: {
          props: {},
          structure: {
            type: "element",
            tag: "span",
            children: [{ type: "text", source: "variant" }],
          },
        },
      }),
      { variant: "primary" },
    );

    if (out.kind !== "element") return;
    expect(out.content).toBe("variant");
  });

  it("text nodes with a '{variant}' source render verbatim (kept visible, not blanked)", () => {
    const out = interpretSchema(
      makeComponent({
        schema: {
          props: {},
          structure: {
            type: "element",
            tag: "span",
            children: [{ type: "text", source: "{variant}" }],
          },
        },
      }),
      { variant: "primary" },
    );

    if (out.kind !== "element") return;
    expect(out.content).toBe("{variant}");
  });

  it("a prop literally named 'variant' resolves through {props.variant} in attrs", () => {
    const out = interpretSchema(
      makeComponent({
        schema: {
          props: { variant: { type: "string", default: "ghost" } },
          structure: {
            type: "element",
            tag: "div",
            attrs: { "data-cls": "btn--{props.variant}" },
          },
        },
      }),
    );

    if (out.kind !== "element") return;
    expect(out.attrs["data-cls"]).toBe("btn--ghost");
  });
});
