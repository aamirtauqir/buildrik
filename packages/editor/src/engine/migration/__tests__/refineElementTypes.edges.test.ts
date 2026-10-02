/**
 * Q2 edges — refineElementTypes upgrades only on PROOF. The markup that is
 * almost-but-not-quite a block's must stay exactly as stored.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementData } from "@/shared/types";
import { refineElementTypes } from "../refineElementTypes";

const el = (over: Partial<ElementData>): ElementData => ({ id: "x", type: "container", ...over });

describe("refineElementTypes — near misses stay as stored", () => {
  it("a <label> around a text input is a label, not a control", () => {
    const tree = el({
      tagName: "label",
      children: [el({ id: "i", type: "input", tagName: "input", attributes: { type: "text" } })],
    });
    refineElementTypes(tree);
    expect(tree.type).toBe("label");
  });

  it("reads the input type case-insensitively (RADIO → radio)", () => {
    const tree = el({
      tagName: "LABEL",
      children: [el({ id: "i", type: "input", tagName: "INPUT", attributes: { type: "RADIO" } })],
    });
    refineElementTypes(tree);
    expect(tree.type).toBe("radio");
  });

  it("a .lottie-container without data-lottie-src, and .tabs without a tablist, stay containers", () => {
    const lottie = el({ tagName: "div", classes: ["lottie-container"] });
    const tabs = el({ tagName: "div", classes: ["tabs"], children: [el({ id: "c", tagName: "div" })] });
    refineElementTypes(lottie);
    refineElementTypes(tabs);
    expect(lottie.type).toBe("container");
    expect(tabs.type).toBe("container");
  });

  it("a `label`-typed element on a non-label tag is left alone", () => {
    const span = el({ type: "label", tagName: "span" });
    refineElementTypes(span);
    expect(span.type).toBe("label");
  });

  it("class proof also reads the raw `class` attribute", () => {
    const embed = el({ tagName: "div", attributes: { class: "foo buildrick-map-embed" } });
    refineElementTypes(embed);
    expect(embed.type).toBe("map-embed");
  });
});
