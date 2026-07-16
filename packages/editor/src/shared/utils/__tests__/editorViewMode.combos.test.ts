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
  it("?view=client&rail=e3 → client keeps the requested rail, density forced fewer", () => {
    setSearch("?view=client&rail=e3");
    expect(getEditorViewMode()).toEqual({
      railMode: "e3",
      fourToolRail: true,
      density: "fewer",
      clientView: true,
    });
  });

  it("?view=client&rail=legacy → legacy rail + client density", () => {
    setSearch("?view=client&rail=legacy");
    expect(getEditorViewMode()).toMatchObject({
      railMode: "legacy",
      fourToolRail: false,
      density: "fewer",
      clientView: true,
    });
  });

  it("?rail=legacy&density=fewer → both escape hatches compose", () => {
    setSearch("?rail=legacy&density=fewer");
    expect(getEditorViewMode()).toMatchObject({
      railMode: "legacy",
      density: "fewer",
      clientView: false,
    });
  });

  it("?density=full (or any non-'fewer' value) stays full density", () => {
    setSearch("?density=full");
    expect(getEditorViewMode().density).toBe("full");
    setSearch("?density=banana");
    expect(getEditorViewMode().density).toBe("full");
  });

  it("?view=editor (non-'client' value) is NOT client view", () => {
    setSearch("?view=editor");
    expect(getEditorViewMode()).toMatchObject({ clientView: false, density: "full" });
  });
});
