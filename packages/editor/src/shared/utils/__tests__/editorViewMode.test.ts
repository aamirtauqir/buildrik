import { describe, it, expect, afterEach } from "vitest";
import { getEditorViewMode } from "../editorViewMode";

function setSearch(s: string) {
  window.history.replaceState({}, "", s || "/");
}

afterEach(() => setSearch("/"));

describe("getEditorViewMode (F1/E3/E4 SSOT)", () => {
  it("defaults to the Figma-contract rail + full density (F1 supersedes E3)", () => {
    setSearch("/");
    expect(getEditorViewMode()).toEqual({
      railMode: "figma",
      fourToolRail: false,
      density: "full",
      clientView: false,
    });
  });

  it("?rail=e3 → the 4-tool E3 rail escape hatch (fourToolRail derived true)", () => {
    setSearch("?rail=e3");
    expect(getEditorViewMode()).toMatchObject({ railMode: "e3", fourToolRail: true, density: "full" });
  });

  it("?rail=legacy → the old 11-tab rail (deepest escape hatch), full density", () => {
    setSearch("?rail=legacy");
    expect(getEditorViewMode()).toMatchObject({ railMode: "legacy", fourToolRail: false, density: "full" });
  });

  it("?density=fewer → trimmed inspector, rail stays Figma", () => {
    setSearch("?density=fewer");
    expect(getEditorViewMode()).toMatchObject({ railMode: "figma", fourToolRail: false, density: "fewer" });
  });

  it("?view=client → the invited-client seed: Figma rail AND fewer density", () => {
    setSearch("?view=client");
    expect(getEditorViewMode()).toEqual({
      railMode: "figma",
      fourToolRail: false,
      density: "fewer",
      clientView: true,
    });
  });

  it("unknown ?rail value falls back to the Figma default", () => {
    setSearch("?rail=banana");
    expect(getEditorViewMode()).toMatchObject({ railMode: "figma", fourToolRail: false });
  });
});
