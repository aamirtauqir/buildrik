/**
 * editorViewMode combo gap tests — parameter interactions the base suite
 * (editorViewMode.test.ts) does not cover: rail escape hatches combined
 * with view mode.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach, vi } from "vitest";

/* ?rail=e3 and ?rail=legacy are DEV-ONLY escape hatches now (IA-14) — a
   production bundle resolves every rail value to the one rail that ships.
   These combos still describe dev behaviour, so they run with the flag on;
   editorViewMode.test.ts owns the production half. */
vi.mock("../runtimeEnv", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  IS_DEV_BUILD: true,
}));

import { getEditorViewMode } from "../editorViewMode";

function setSearch(s: string) {
  window.history.replaceState({}, "", s || "/");
}

afterEach(() => setSearch("/"));

describe("getEditorViewMode — parameter combinations", () => {
  it("?view=readonly&rail=e3 → view mode keeps the requested rail", () => {
    setSearch("?view=readonly&rail=e3");
    expect(getEditorViewMode()).toEqual({
      railMode: "e3",
      fourToolRail: true,
      readOnlyView: true,
    });
  });

  it("?view=readonly&rail=legacy → legacy rail + view mode", () => {
    setSearch("?view=readonly&rail=legacy");
    expect(getEditorViewMode()).toMatchObject({
      railMode: "legacy",
      fourToolRail: false,
      readOnlyView: true,
    });
  });

  it("?rail=legacy&density=fewer → the rail hatch composes; density is ignored (retired)", () => {
    setSearch("?rail=legacy&density=fewer");
    expect(getEditorViewMode()).toEqual({
      railMode: "legacy",
      fourToolRail: false,
      readOnlyView: false,
    });
  });

  it("?view=editor (non-'readonly' value) is NOT view mode", () => {
    setSearch("?view=editor");
    expect(getEditorViewMode()).toMatchObject({ readOnlyView: false });
  });
});
