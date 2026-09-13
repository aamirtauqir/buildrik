/**
 * useSelectionState — per-file use counts for the delete confirms.
 *
 * Clone 3708:20650 prints "Used in 3 site placements" and 3701:20385 prints
 * "hero-dark.jpg (3 uses) and chef-intro.mp4 (1 use) … This affects 4
 * placements." Both numbers are the elements referencing the asset — the
 * same `findByMediaSrc` answer the rail's USED IN and the grid's `used ×3`
 * already read — so `checkInUse` carries the count instead of throwing it
 * away, and the payload joins it to each file by key.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelectionState } from "../useSelectionState";
import type { LibraryItem } from "../../data/mediaTypes";

function makeItem(key: string, name: string, ext: string): LibraryItem {
  return {
    key,
    name,
    displayName: `${name}${ext}`,
    type: "img",
    src: `blob:${key}`,
    size: 1,
    createdAt: "2026-01-01T00:00:00Z",
    mimeType: "image/jpeg",
  };
}

const HERO = makeItem("hero", "hero-dark", ".jpg");
const CHEF = makeItem("chef", "chef-intro", ".mp4");
const TEAM = makeItem("team", "team-photo", ".jpg");

/** Three placements of hero on Home and Menu, one of chef on Home, none of team. */
function fakeComposer() {
  const home = { id: "root-home", getParent: () => null };
  const menu = { id: "root-menu", getParent: () => null };
  const on = (root: { id: string }) => ({ id: `el-${Math.random()}`, getParent: () => root });
  const placements: Record<string, unknown[]> = {
    "blob:hero": [on(home), on(home), on(menu)],
    "blob:chef": [on(home)],
  };
  return {
    elements: {
      findByMediaSrc: (src: string) => placements[src] ?? [],
      getAllPages: () => [
        { name: "Home", root: home },
        { name: "Menu", root: menu },
      ],
    },
    media: {
      getAsset: (key: string) => [HERO, CHEF, TEAM].find((i) => i.key === key) ?? null,
    },
  } as never;
}

describe("checkInUse — placements per asset", () => {
  it("returns the key, the placement count and the distinct pages for each used asset", () => {
    const { result } = renderHook(() => useSelectionState(fakeComposer(), [HERO, CHEF, TEAM], vi.fn()));
    const usages = result.current.checkInUse(["hero", "chef", "team"]);
    expect(usages).toEqual([
      { key: "hero", name: "hero-dark", count: 3, pages: ["Home", "Menu"] },
      { key: "chef", name: "chef-intro", count: 1, pages: ["Home"] },
    ]);
  });
});

describe("requestDelete / requestBulkDelete — the confirm payload", () => {
  it("a single delete names the file by its full display name and carries its count", () => {
    const { result } = renderHook(() => useSelectionState(fakeComposer(), [HERO, CHEF, TEAM], vi.fn()));
    act(() => result.current.requestDelete("hero"));
    expect(result.current.confirmDelete).toEqual({
      keys: ["hero"],
      names: ["hero-dark.jpg"],
      inUseCount: 1,
      inUse: [{ key: "hero", name: "hero-dark", count: 3, pages: ["Home", "Menu"] }],
      isBulk: false,
    });
  });

  it("a bulk delete carries one usage per used file, keyed so the modal can join names to counts", () => {
    const { result } = renderHook(() => useSelectionState(fakeComposer(), [HERO, CHEF, TEAM], vi.fn()));
    act(() => result.current.requestBulkDelete([HERO, TEAM, CHEF]));
    const payload = result.current.confirmDelete!;
    expect(payload.isBulk).toBe(true);
    expect(payload.keys).toEqual(["hero", "team", "chef"]);
    expect(payload.names).toEqual(["hero-dark.jpg", "team-photo.jpg", "chef-intro.mp4"]);
    expect(payload.inUseCount).toBe(2);
    expect(payload.inUse.map((u) => [u.key, u.count])).toEqual([
      ["hero", 3],
      ["chef", 1],
    ]);
  });
});
