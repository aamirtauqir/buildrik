import { describe, it, expect, afterEach } from "vitest";
import { getEditorViewMode } from "../editorViewMode";

function setSearch(s: string) {
  window.history.replaceState({}, "", s || "/");
}

afterEach(() => setSearch("/"));

describe("getEditorViewMode (E3/E4 SSOT)", () => {
  it("defaults to the 4-tool rail + full density (E3 promoted)", () => {
    setSearch("/");
    expect(getEditorViewMode()).toEqual({ fourToolRail: true, density: "full", clientView: false });
  });

  it("?rail=legacy → the old 11-tab rail (escape hatch), full density", () => {
    setSearch("?rail=legacy");
    expect(getEditorViewMode()).toMatchObject({ fourToolRail: false, density: "full" });
  });

  it("?density=fewer → trimmed inspector, rail stays 4-tool", () => {
    setSearch("?density=fewer");
    expect(getEditorViewMode()).toMatchObject({ fourToolRail: true, density: "fewer" });
  });

  it("?view=client → the invited-client seed: 4-tool rail AND fewer density", () => {
    setSearch("?view=client");
    expect(getEditorViewMode()).toEqual({ fourToolRail: true, density: "fewer", clientView: true });
  });
});
