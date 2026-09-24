// @vitest-environment jsdom
/**
 * useSelectionReadout — the canvas bar's "{Type} · {layer name}" (board
 * 5936:44788 "Section · Hero · 680 × 250"). The name is the one Layers shows:
 * a custom layer name, else a text layer's own copy, else nothing.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Composer } from "@/engine";
import { useSelectionReadout } from "../useSelectionReadout";

const composerWith = (el: { type: string; content?: string; layerName?: string }) =>
  ({
    on: () => {},
    off: () => {},
    isProjectLoading: () => false,
    selection: { getSelectedIds: () => ["e1"] },
    elements: {
      getActivePage: () => ({ id: "p1" }),
      getElement: () => ({
        getType: () => el.type,
        getContent: () => el.content ?? "",
        getCustomData: (k: string) => (k === "layerName" ? el.layerName : undefined),
      }),
    },
  }) as unknown as Composer;

const label = (el: { type: string; content?: string; layerName?: string }) =>
  renderHook(() => useSelectionReadout(composerWith(el), { id: "e1", type: el.type })).result.current.label;

describe("useSelectionReadout — layer name", () => {
  it("a named layer reads Type · name", () => {
    expect(label({ type: "section", layerName: "Hero" })).toBe("Section · Hero");
  });
  it("an unnamed text layer reads its copy, as Layers does", () => {
    expect(label({ type: "heading", content: "Wood-fired <b>pizza</b>" })).toBe("Heading · Wood-fired pizza");
  });
  it("an unnamed container reads its type alone", () => {
    expect(label({ type: "section" })).toBe("Section");
  });
});
