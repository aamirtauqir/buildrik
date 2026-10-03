/**
 * detectMixedValues — cross-element style diffing for the multi-select
 * "Mixed" badges.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { detectMixedValues, shownStylesAt } from "../detectMixedValues";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";

const el = (styles: Record<string, string>) => ({ getStyles: () => styles });

describe("detectMixedValues", () => {
  it("returns an empty set for a single element", () => {
    expect(detectMixedValues([el({ color: "red" })], ["color"]).size).toBe(0);
  });

  it("returns an empty set when all elements agree on every checked key", () => {
    const result = detectMixedValues(
      [el({ color: "red", width: "10px" }), el({ color: "red", width: "10px" })],
      ["color", "width"]
    );
    expect(result.size).toBe(0);
  });

  it("flags a key whose value differs across elements", () => {
    const result = detectMixedValues(
      [el({ color: "red" }), el({ color: "blue" })],
      ["color"]
    );
    expect(result.has("color")).toBe(true);
  });

  it("treats a missing key on one element as a difference", () => {
    const result = detectMixedValues([el({ color: "red" }), el({})], ["color"]);
    expect(result.has("color")).toBe(true);
  });

  it("only inspects the provided styleKeys", () => {
    const result = detectMixedValues(
      [el({ color: "red", width: "1px" }), el({ color: "red", width: "2px" })],
      ["color"]
    );
    expect(result.has("width")).toBe(false);
    expect(result.size).toBe(0);
  });

  it("detects a difference contributed by a third element", () => {
    const result = detectMixedValues(
      [el({ gap: "4px" }), el({ gap: "4px" }), el({ gap: "8px" })],
      ["gap"]
    );
    expect(result.has("gap")).toBe(true);
  });

  it("reads through the given reader when one is passed", () => {
    const a = { getStyles: () => ({}), shown: { color: "red" } };
    const b = { getStyles: () => ({}), shown: { color: "blue" } };
    expect(detectMixedValues([a, b], ["color"], (e) => e.shown).has("color")).toBe(true);
  });
});

/* Board 22: three headings — an H1 and two H3s — read "Font size · Mixed"
   although none carries a font-size of its own: their TYPE defaults differ.
   Comparing own styles only called them equal. */
describe("shownStylesAt — what each selected element shows at this breakpoint + state", () => {
  beforeAll(installEngineBrowserStubs);
  afterAll(removeEngineBrowserStubs);

  function headings(...tags: string[]) {
    const composer = createTestComposer();
    const root = composer.elements.createPage("Home").root.id;
    const els = tags.map((tagName) => {
      const h = composer.elements.createElement("heading" as never, { tagName, content: tagName } as never);
      composer.elements.addElement(h, root);
      for (const k of Object.keys(h.getStyles())) h.removeStyle(k);
      return h;
    });
    return { composer, els };
  }

  it("type defaults count: an H1 and an H3 with no font-size of their own are Mixed", () => {
    const { composer, els } = headings("h1", "h3", "h3");
    expect(detectMixedValues(els, ["font-size"], shownStylesAt(composer, "desktop", "normal")).has("font-size")).toBe(true);
  });

  it("three H3s agree", () => {
    const { composer, els } = headings("h3", "h3", "h3");
    expect(detectMixedValues(els, ["font-size"], shownStylesAt(composer, "desktop", "normal")).size).toBe(0);
  });

  it("an own value wins over the default, and a Tablet override counts on Tablet only", () => {
    const { composer, els } = headings("h3", "h3");
    composer.styles.setBreakpointStyle(els[1].getId(), "tablet", { "font-size": "18px" });
    expect(detectMixedValues(els, ["font-size"], shownStylesAt(composer, "desktop", "normal")).size).toBe(0);
    expect(detectMixedValues(els, ["font-size"], shownStylesAt(composer, "tablet", "normal")).has("font-size")).toBe(true);
  });
});

