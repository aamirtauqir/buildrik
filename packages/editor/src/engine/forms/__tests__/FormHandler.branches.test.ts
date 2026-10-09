/**
 * FormHandler — remaining branches not covered by FormHandler.test.ts:
 * the element-tree helpers (findFormElement / findFormFields) and no-op
 * state paths.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormHandler, type FormConfig } from "../FormHandler";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";

function config(partial: Partial<FormConfig> = {}): FormConfig {
  return { formId: "contact", action: "store", ...partial };
}

/** Mock Element exposing just what FormHandler touches. */
function makeEl(opts: {
  custom?: Record<string, unknown>;
  children?: unknown[];
  tag?: string;
}): Element {
  const el = {
    getCustomData: (k: string) => opts.custom?.[k],
    getChildren: () => opts.children ?? [],
    getTagName: () => opts.tag,
  };
  return el as unknown as Element;
}

describe("state no-op paths", () => {
  let handler: FormHandler;
  beforeEach(() => {
    handler = new FormHandler({ emit: vi.fn() } as unknown as Composer);
  });

  it("setFieldValue on an unknown form does nothing", () => {
    handler.setFieldValue("ghost", "x", 1);
    expect(handler.getFieldValue("ghost", "x")).toBeUndefined();
  });

  it("getFieldValue on an unknown form is undefined", () => {
    expect(handler.getFieldValue("ghost", "x")).toBeUndefined();
  });
});

describe("findFormElement", () => {
  function handlerWith(elements: unknown): FormHandler {
    return new FormHandler({ emit: vi.fn(), elements } as unknown as Composer);
  }

  it("returns null when there is no active page", () => {
    const h = handlerWith({ getActivePage: () => null, getElement: () => null });
    expect(h.findFormElement("contact")).toBeNull();
  });

  it("returns null when the root element can't be resolved", () => {
    const h = handlerWith({
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: () => null,
    });
    expect(h.findFormElement("contact")).toBeNull();
  });

  it("returns null when no element carries the matching formId", () => {
    const root = makeEl({ children: [makeEl({ custom: { formId: "other" } })] });
    const h = handlerWith({
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: () => root,
    });
    expect(h.findFormElement("contact")).toBeNull();
  });

  it("finds the element whose custom formId matches (depth-first)", () => {
    const match = makeEl({ custom: { formId: "contact" } });
    const root = makeEl({
      custom: { formId: "root-form" },
      children: [makeEl({ children: [match] })],
    });
    const h = handlerWith({
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: () => root,
    });
    expect(h.findFormElement("contact")).toBe(match);
  });
});

describe("findFormFields", () => {
  it("collects input/textarea/select descendants, skipping others", () => {
    const handler = new FormHandler({ emit: vi.fn() } as unknown as Composer);
    const tree = makeEl({
      tag: "form",
      children: [
        makeEl({ tag: "input" }),
        makeEl({
          tag: "div",
          children: [makeEl({ tag: "textarea" }), makeEl({ tag: "span" })],
        }),
        makeEl({ tag: "SELECT" }), // case-insensitive
      ],
    });

    const fields = handler.findFormFields(tree);
    expect(fields.map((f) => f.getTagName()?.toLowerCase())).toEqual([
      "input",
      "textarea",
      "select",
    ]);
  });
});
