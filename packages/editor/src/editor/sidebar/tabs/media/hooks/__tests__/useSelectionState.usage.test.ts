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

describe("executeDelete — the Undo toast", () => {
  /* Clone 3708:20446 names the file the way the confirm did — "hero-dark.jpg",
     the full display name — not the engine's stem. */
  it("names a single deleted file by its full display name", async () => {
    const showToast = vi.fn();
    const composer = fakeComposer() as { mediaOps?: unknown };
    composer.mediaOps = {
      deleteWithGrace: vi.fn(async () => ({ name: "hero-dark", usageCount: 0, expiresAt: 0, undo: vi.fn(), commitNow: vi.fn() })),
    };
    const { result } = renderHook(() => useSelectionState(composer as never, [HERO, CHEF, TEAM], showToast));
    act(() => result.current.requestDelete("hero"));
    await act(() => result.current.executeDelete());
    expect(showToast).toHaveBeenCalledWith('Deleted "hero-dark.jpg".', "info", expect.anything());
  });
});

/* Clone 3695:45529 / 3697:20341 — a file's family: the original and its
   saved versions, one of which may be the one APPLIED on the site. */
describe("a file's delete is its family's — versions go with the original, and count for the confirm", () => {
  const TEAM_V2 = { ...makeItem("team-v2", "team-photo-v2", ".webp"), versionOf: "team" };
  const versionsOf = (key: string) => (key === "team" || key === "team-v2" ? [TEAM, TEAM_V2] : []);
  /** The site sits on v2 — the original's src is on no page. */
  function familyComposer() {
    const home = { id: "root-home", getParent: () => null };
    const placements: Record<string, unknown[]> = { "blob:team-v2": [{ id: "el-1", getParent: () => home }] };
    return {
      elements: { findByMediaSrc: (src: string) => placements[src] ?? [], getAllPages: () => [{ name: "Home", root: home }] },
      media: { getAsset: (key: string) => [HERO, TEAM, TEAM_V2].find((i) => i.key === key) ?? null },
      mediaOps: {
        deleteWithGrace: vi.fn(async (id: string) => ({ name: id, usageCount: id === "team-v2" ? 1 : 0, expiresAt: 0, undo: vi.fn(), commitNow: vi.fn() })),
      },
    };
  }

  it("the confirm counts the placements on the applied version under the file's name", () => {
    const { result } = renderHook(() => useSelectionState(familyComposer() as never, [HERO, TEAM], vi.fn(), versionsOf));
    act(() => result.current.requestDelete("team"));
    expect(result.current.confirmDelete).toEqual({
      keys: ["team"],
      names: ["team-photo.jpg"],
      inUseCount: 1,
      inUse: [{ key: "team", name: "team-photo", count: 1, pages: ["Home"] }],
      isBulk: false,
    });
  });

  it("deletes the versions first, then the original, and the toast counts ONE file", async () => {
    const showToast = vi.fn();
    const composer = familyComposer();
    const { result } = renderHook(() => useSelectionState(composer as never, [HERO, TEAM], showToast, versionsOf));
    act(() => result.current.requestDelete("team"));
    await act(() => result.current.executeDelete());
    expect(vi.mocked(composer.mediaOps.deleteWithGrace).mock.calls.map((c) => c[0])).toEqual(["team-v2", "team"]);
    expect(showToast).toHaveBeenCalledWith('Deleted "team-photo.jpg" and cleared it from 1 element.', "info", expect.anything());
  });

  it("a file without versions is its own family — the payload is unchanged", () => {
    const { result } = renderHook(() => useSelectionState(familyComposer() as never, [HERO, TEAM], vi.fn(), versionsOf));
    act(() => result.current.requestDelete("hero"));
    expect(result.current.confirmDelete?.inUse).toEqual([]);
  });
});
