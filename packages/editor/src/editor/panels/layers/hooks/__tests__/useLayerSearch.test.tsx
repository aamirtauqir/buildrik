/**
 * useLayerSearch — search query state + recursive tree filtering.
 * Matching preserves ancestors; countMatches counts only true matches.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useLayerSearch } from "../useLayerSearch";
import type { LayerItem } from "../../types";

const item = (
  id: string,
  type: string,
  tagName: string,
  children: LayerItem[] = []
): LayerItem => ({ id, type, tagName, depth: 0, children });

// root > [ hero > title, footer ]
const title = item("title-1", "heading", "h1");
const hero = item("hero-1", "section", "section", [title]);
const footer = item("footer-1", "container", "footer");
const tree: LayerItem[] = [item("root-1", "container", "div", [hero, footer])];
const noNames = new Map<string, string>();

describe("useLayerSearch — idle (no query)", () => {
  it("returns the tree unchanged and reports not searching", () => {
    const { result } = renderHook(() => useLayerSearch());
    expect(result.current.isSearching).toBe(false);
    // Empty query short-circuits — same array reference back.
    expect(result.current.filterTree(tree, noNames)).toBe(tree);
    expect(result.current.countMatches(tree, noNames)).toBe(0);
  });

  it("treats whitespace-only queries as idle", () => {
    const { result } = renderHook(() => useLayerSearch());
    act(() => result.current.setSearch("   "));
    expect(result.current.isSearching).toBe(false);
    expect(result.current.filterTree(tree, noNames)).toBe(tree);
  });
});

describe("useLayerSearch — filtering", () => {
  it("keeps matched nodes and their ancestors", () => {
    const { result } = renderHook(() => useLayerSearch());
    act(() => result.current.setSearch("title"));

    const filtered = result.current.filterTree(tree, noNames);
    // root retained (ancestor), hero retained (ancestor), title matched, footer dropped
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("root-1");
    expect(filtered[0].children.map((c) => c.id)).toEqual(["hero-1"]);
    expect(filtered[0].children[0].children.map((c) => c.id)).toEqual(["title-1"]);
  });

  it("matches on type, tagName, and id — not just display name", () => {
    const { result } = renderHook(() => useLayerSearch());

    act(() => result.current.setSearch("footer")); // matches footer's tagName + type label
    expect(result.current.countMatches(tree, noNames)).toBe(1);

    act(() => result.current.setSearch("hero-1")); // matches by id
    expect(result.current.countMatches(tree, noNames)).toBe(1);
  });

  it("matches via a custom display name from the names map", () => {
    const { result } = renderHook(() => useLayerSearch());
    const names = new Map([["title-1", "Big Headline"]]);
    act(() => result.current.setSearch("headline"));
    expect(result.current.countMatches(tree, names)).toBe(1);
  });

  it("counts every matching node across the whole tree", () => {
    const { result } = renderHook(() => useLayerSearch());
    // "container" is the type of both root-1 and footer-1
    act(() => result.current.setSearch("container"));
    expect(result.current.countMatches(tree, noNames)).toBe(2);
  });

  it("isSearching flips true once a non-empty query is set", () => {
    const { result } = renderHook(() => useLayerSearch());
    act(() => result.current.setSearch("x"));
    expect(result.current.isSearching).toBe(true);
  });
});

describe("useLayerSearch — getAncestorIdsForMatches", () => {
  it("collects unique ancestor ids for matched nodes", () => {
    const { result } = renderHook(() => useLayerSearch());
    const ids = result.current.getAncestorIdsForMatches([title], tree);
    expect(ids.sort()).toEqual(["hero-1", "root-1"]);
  });

  it("returns an empty list when the match is a top-level node", () => {
    const { result } = renderHook(() => useLayerSearch());
    const ids = result.current.getAncestorIdsForMatches([tree[0]], tree);
    expect(ids).toEqual([]);
  });
});
