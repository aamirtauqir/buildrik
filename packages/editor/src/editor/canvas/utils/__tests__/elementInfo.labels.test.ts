/**
 * The canvas selection tag's name for a type reads the same as the Inspector
 * header, Layers and breadcrumb (shared/constants/elementTypeLabels). Live on
 * board 4 it still said "Paragraph" over a header reading "Text".
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { getElementNameFromType, getFriendlyName } from "../elementInfo";

describe("canvas selection label", () => {
  it("a paragraph reads Text (board 4)", () => {
    expect(getElementNameFromType("paragraph", "p")).toBe("Text");
    expect(getFriendlyName(document.createElement("p"))).toBe("Text");
  });
});

describe("canvas labels read the one label map (SSOT)", () => {
  it("every type the shared map names reads the same on the canvas", async () => {
    const { ELEMENT_TYPE_LABELS } = await import("@/shared/constants/elementTypeLabels");
    for (const [type, label] of Object.entries(ELEMENT_TYPE_LABELS)) {
      expect(getElementNameFromType(type), type).toBe(label);
    }
  });

  it("a DOM node without a type reads its tag through the same map", () => {
    expect(getFriendlyName(document.createElement("div"))).toBe("Container");
    expect(getFriendlyName(document.createElement("iframe"))).toBe("Embed");
    const typed = document.createElement("div");
    typed.setAttribute("data-buildrick-type", "collection-list");
    expect(getFriendlyName(typed)).toBe("Collection list");
  });
});
