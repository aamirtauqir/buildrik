import { describe, it, expect, afterEach, vi } from "vitest";

/* The rail escape hatches are DEV-ONLY now: three rail hierarchies shipping
   behind a query string is three navigation models, and a customer was one URL
   from the other two. These tests pin BOTH halves — the hatches still work in
   a dev build, and a production bundle ignores them. */
vi.mock("../runtimeEnv", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  IS_DEV_BUILD: true,
}));

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
      readOnlyView: false,
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

  it("?view=readonly → view mode: Figma rail AND fewer density", () => {
    setSearch("?view=readonly");
    expect(getEditorViewMode()).toEqual({
      railMode: "figma",
      fourToolRail: false,
      density: "fewer",
      readOnlyView: true,
    });
  });

  it("unknown ?rail value falls back to the Figma default", () => {
    setSearch("?rail=banana");
    expect(getEditorViewMode()).toMatchObject({ railMode: "figma", fourToolRail: false });
  });
});

describe("the rail escape hatches do not ship", () => {
  /* Re-imported with IS_DEV_BUILD false: a production bundle must resolve every
     ?rail= value to the one rail the product actually ships. */
  it("ignores ?rail=e3 and ?rail=legacy in a production build", async () => {
    vi.resetModules();
    vi.doMock("../runtimeEnv", async (orig) => ({
      ...(await orig<Record<string, unknown>>()),
      IS_DEV_BUILD: false,
    }));
    const { getEditorViewMode: prod } = await import("../editorViewMode");
    for (const q of ["?rail=e3", "?rail=legacy"]) {
      setSearch(q);
      expect(prod()).toMatchObject({ railMode: "figma", fourToolRail: false });
    }
    vi.doUnmock("../runtimeEnv");
    vi.resetModules();
  });
});
