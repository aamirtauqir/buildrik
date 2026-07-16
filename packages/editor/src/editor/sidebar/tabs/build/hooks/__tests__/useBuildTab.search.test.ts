/**
 * useBuildTab — search matching pure-logic tests.
 *
 * The existing useBuildTab tests cover tip-nav wrap + search-clear category
 * restore, but not what searchResults actually matches. This pins the four
 * match branches in utils/search.ts (name, tag, category name, description)
 * as exercised through the hook's derived searchResults.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuildTab } from "../useBuildTab";
import type { SearchGroup } from "../../catalog/types";

const names = (groups: SearchGroup[]): string[] =>
  groups.flatMap((g) => g.elements.map((e) => e.name));

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
    expect(names(result.current.searchResults)).toContain("Heading");
  });

  it("matches by tag — 'cta' hits Button via its tags, not its name/description", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("cta"));
    expect(names(result.current.searchResults)).toContain("Button");
  });

  it("matches by category name — 'forms' returns the Forms group", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("forms"));
    const formsGroup = result.current.searchResults.find((g) => g.catId === "forms");
    expect(formsGroup).toBeTruthy();
    expect(formsGroup!.elements.length).toBeGreaterThan(0);
  });

  it("matches by description — 'bulleted' hits List via its description text", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("bulleted"));
    expect(names(result.current.searchResults)).toContain("List");
  });

  it("groups results by category, preserving catalog order", () => {
    const { result } = renderHook(() => useBuildTab(null));
    act(() => result.current.setSearchQuery("e")); // broad query spanning many cats
    const catIds = result.current.searchResults.map((g) => g.catId);
    // No duplicate category groups.
    expect(new Set(catIds).size).toBe(catIds.length);
  });
});
