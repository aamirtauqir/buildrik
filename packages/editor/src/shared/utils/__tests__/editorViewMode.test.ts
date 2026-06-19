import { describe, it, expect, afterEach } from "vitest";
import { getEditorViewMode } from "../editorViewMode";

function setSearch(s: string) {
  window.history.replaceState({}, "", s || "/");
}

afterEach(() => setSearch("/"));

describe("getEditorViewMode (E3/E4 SSOT)", () => {
  it("defaults to the 11-tab rail + full density", () => {
    setSearch("/");
    expect(getEditorViewMode()).toEqual({ fourToolRail: false, density: "full", clientView: false });
  });

  it("?rail=4 → 4-tool rail, density stays full", () => {
    setSearch("?rail=4");
    expect(getEditorViewMode()).toMatchObject({ fourToolRail: true, density: "full" });
  });

  it("?density=fewer → trimmed inspector, rail stays 11-tab", () => {
    setSearch("?density=fewer");
    expect(getEditorViewMode()).toMatchObject({ fourToolRail: false, density: "fewer" });
  });

  it("?view=client → the full invited-client seed: 4-tool rail AND fewer density", () => {
    setSearch("?view=client");
    expect(getEditorViewMode()).toEqual({ fourToolRail: true, density: "fewer", clientView: true });
  });
});
