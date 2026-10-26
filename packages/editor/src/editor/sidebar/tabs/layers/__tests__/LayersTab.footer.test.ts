/**
 * The Layers count band — design-2l9 boards 147:75914, 152:78614, 147:77189,
 * 147:79328. Re-baseline: Layers footer (was "N layers" / "N selected of M").
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { layersFooterText } from "../LayersTab";

const s = (total: number, selected: number, matches: number | null = null, hiddenIn: string | null = null) => ({
  total, selected, matches, hiddenIn,
});

describe("layersFooterText", () => {
  it("counts layers and the selection, zero included", () => {
    expect(layersFooterText(s(8, 1), "", false)).toBe("8 layers · 1 selected");
    expect(layersFooterText(s(4, 0), "", false)).toBe("4 layers · 0 selected");
    expect(layersFooterText(s(1, 0), "", false)).toBe("1 layer · 0 selected");
  });

  it("names the folded branch the one selected row sits in", () => {
    expect(layersFooterText(s(8, 1, null, "Hero"), "", false)).toBe("8 layers · 1 selected inside Hero");
  });

  it("a search reports its matches against the whole tree", () => {
    expect(layersFooterText(s(5000, 0, 12), "card", false)).toBe("5,000 layers · 12 matches");
    expect(layersFooterText(s(5000, 0, 1), "card", false)).toBe("5,000 layers · 1 match");
    expect(layersFooterText(s(5000, 0, 0), "zz", false)).toBe("5,000 layers · No matches");
  });

  it("adds the selected layer's state — locked, locked by an ancestor, dimmed", () => {
    expect(layersFooterText({ ...s(8, 1), selectionState: "Locked by Hero" }, "", false)).toBe("8 layers · 1 selected · Locked by Hero");
    expect(layersFooterText({ ...s(8, 1), selectionState: "Dimmed" }, "", false)).toBe("8 layers · 1 selected · Dimmed");
  });

  it("selection mode keeps its short count", () => {
    expect(layersFooterText(s(8, 3), "", true)).toBe("3 selected");
  });
});
