/**
 * elementTypeLabels — the one type → label map (Layers, Inspector header and
 * type block, canvas selection label, breadcrumb).
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { elementTypeLabel } from "../elementTypeLabels";

describe("elementTypeLabel", () => {
  it("a paragraph reads Text, as boards 4 and 21 draw it (header, Layers, canvas label)", () => {
    expect(elementTypeLabel("paragraph")).toBe("Text");
    expect(elementTypeLabel("p")).toBe("Text");
    expect(elementTypeLabel("text")).toBe("Text");
  });

  it("keeps the other names", () => {
    expect(elementTypeLabel("heading")).toBe("Heading");
    expect(elementTypeLabel("video-embed")).toBe("Video embed");
    expect(elementTypeLabel("section")).toBe("Section");
  });
});
