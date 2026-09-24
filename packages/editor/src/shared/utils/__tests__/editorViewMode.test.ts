import { describe, it, expect, afterEach } from "vitest";
import { getEditorViewMode } from "../editorViewMode";

function setSearch(s: string) {
  window.history.replaceState({}, "", s || "/");
}

afterEach(() => setSearch("/"));

describe("getEditorViewMode", () => {
  it("is the editor by default", () => {
    expect(getEditorViewMode()).toEqual({ readOnlyView: false });
  });

  it("?view=readonly → view mode", () => {
    setSearch("?view=readonly");
    expect(getEditorViewMode()).toEqual({ readOnlyView: true });
  });

  it("?view=editor (non-'readonly' value) is NOT view mode", () => {
    setSearch("?view=editor");
    expect(getEditorViewMode()).toEqual({ readOnlyView: false });
  });

  /* C5 G1-095: the dev-only rail hatches are deleted, not just gated. */
  it("?rail=e3 / ?rail=legacy are not read at all", () => {
    for (const q of ["?rail=e3", "?rail=legacy", "?view=readonly&rail=e3"]) {
      setSearch(q);
      expect(Object.keys(getEditorViewMode())).toEqual(["readOnlyView"]);
    }
  });
});
