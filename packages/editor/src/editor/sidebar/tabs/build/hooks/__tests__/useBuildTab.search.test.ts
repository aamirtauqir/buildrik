/**
 * useBuildTab — search matching pure-logic tests.
 *
 * Board 138:53: search is FLAT and CROSS-SOURCE. This pins the four element
 * match branches (name, tag, category name, description), the block branch,
 * and hit-key uniqueness, as exercised through the hook's derived
 * searchResults.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuildTab } from "../useBuildTab";
import type { InsertSearchHit } from "../../utils/search";
import type { ComponentDefinition } from "@/shared/types/components";

const labels = (hits: InsertSearchHit[]): string[] => hits.map((h) => h.label);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useBuildTab — searchResults", () => {
  it("is empty for a blank query", () => {
    const { result } = renderHook(() => useBuildTab(null));
    expect(result.current.searchResults).toEqual([]);
    act(() => result.current.setSearchQuery("   "));
    expect(result.current.searchResults).toEqual([]);
  });

  it("matches by element name (case-insensitive)", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("HEADING"));
    expect(labels(result.current.searchResults)).toContain("Heading");
  });

  it("matches by tag — 'cta' hits Button via its tags, not its name/description", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("cta"));
    expect(labels(result.current.searchResults)).toContain("Button");
  });

  it("matches by category name — 'forms' returns that category's elements", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("forms"));
    const formHits = result.current.searchResults.filter(
      (h) => h.group === "ELEMENTS" && h.el.catId === "forms"
    );
    expect(formHits.length).toBeGreaterThan(0);
  });

  it("matches by description — 'bulleted' hits List via its description text", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("bulleted"));
    expect(labels(result.current.searchResults)).toContain("List");
  });

  it("is cross-source — block registry entries appear with group BLOCKS", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("hero"));
    const blockHits = result.current.searchResults.filter((h) => h.group === "BLOCKS");
    expect(blockHits.length).toBeGreaterThan(0);
  });

  it("hit keys are unique across sources", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("e")); // broad query spanning sources
    const keys = result.current.searchResults.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  /* Board 4418:100087 answers "button" from every source. Blocks and built-in
     components carry no tags, so they match on what they insert as well as
     their name: a section that contains a <button> is a "button" hit. */
  it("matches blocks and components by the elements they insert", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("button"));
    const groups = new Set(result.current.searchResults.map((h) => h.group));
    expect(groups.has("ELEMENTS")).toBe(true);
    expect(groups.has("BLOCKS")).toBe(true);
    expect(labels(result.current.searchResults)).toContain("CTA");
  });

  it("includes saved components by name (G2-111)", () => {
    const mine = [{ id: "c1", name: "Menu card" }] as unknown as ComponentDefinition[];
    const { result } = renderHook(() => useBuildTab(null, undefined, mine));
    act(() => result.current.setSearchQuery("menu c"));
    const hit = result.current.searchResults.find((h) => h.group === "SAVED");
    expect(hit?.label).toBe("Menu card");
  });
});
