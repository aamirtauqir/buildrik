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
