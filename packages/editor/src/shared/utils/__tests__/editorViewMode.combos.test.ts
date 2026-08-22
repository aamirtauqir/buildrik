/**
 * editorViewMode combo gap tests — parameter interactions the base suite
 * (editorViewMode.test.ts) does not cover: rail escape hatches combined
 * with the invited-client seed and explicit density.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { getEditorViewMode } from "../editorViewMode";

function setSearch(s: string) {
  window.history.replaceState({}, "", s || "/");
}

afterEach(() => setSearch("/"));

describe("getEditorViewMode — parameter combinations", () => {
  it("?view=readonly&rail=e3 → view mode keeps the requested rail, density forced fewer", () => {
    setSearch("?view=readonly&rail=e3");
    expect(getEditorViewMode()).toEqual({
      railMode: "e3",
      fourToolRail: true,
      density: "fewer",
      readOnlyView: true,
    });
  });

  it("?view=readonly&rail=legacy → legacy rail + view-mode density", () => {
    setSearch("?view=readonly&rail=legacy");
    expect(getEditorViewMode()).toMatchObject({
      railMode: "legacy",
      fourToolRail: false,
      density: "fewer",
      readOnlyView: true,
    });
  });

  it("?rail=legacy&density=fewer → both escape hatches compose", () => {
    setSearch("?rail=legacy&density=fewer");
    expect(getEditorViewMode()).toMatchObject({
      railMode: "legacy",
      density: "fewer",
      readOnlyView: false,
    });
  });

  it("?density=full (or any non-'fewer' value) stays full density", () => {
    setSearch("?density=full");
    expect(getEditorViewMode().density).toBe("full");
    setSearch("?density=banana");
    expect(getEditorViewMode().density).toBe("full");
  });

  it("?view=editor (non-'readonly' value) is NOT view mode", () => {
    setSearch("?view=editor");
    expect(getEditorViewMode()).toMatchObject({ readOnlyView: false, density: "full" });
  });
});
