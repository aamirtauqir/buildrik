/**
 * useInspectorSections — per-element-type expand/collapse state with
 * localStorage persistence, default seeding from the element profile, and the
 * expandAll / collapseAll / toggleSection controls.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInspectorSections } from "../useInspectorSections";
import { getProfileFor } from "../../config/elementProfiles";

const PREFS_KEY = "buildrick-inspector-sections-v2";

function readStored(): string[] {
  return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "[]");
}

function mount(type = "container") {
  return renderHook(() =>
    useInspectorSections({ selectedElement: { id: "e1", type }, composer: null })
  );
}

beforeEach(() => localStorage.clear());

describe("useInspectorSections — default seeding", () => {
  it("seeds the first two style-tab sections for the selected type", () => {
    const expected = getProfileFor("container")
      .style.order.slice(0, 2)
      .map((id) => `container:${id}`);
    const { result } = mount("container");
    expect([...result.current.expandedSections].sort()).toEqual([...expected].sort());
    expect(result.current.expandedCount).toBe(expected.length);
  });
});

describe("useInspectorSections — toggleSection", () => {
  it("adds then removes a key and persists each write", () => {
    const { result } = mount("container");
    act(() => result.current.toggleSection("container", "border"));
    expect(result.current.expandedSections.has("container:border")).toBe(true);
    expect(readStored()).toContain("container:border");

    act(() => result.current.toggleSection("container", "border"));
    expect(result.current.expandedSections.has("container:border")).toBe(false);
    expect(readStored()).not.toContain("container:border");
  });
});

describe("useInspectorSections — expandAll / collapseAll", () => {
  it("expandAll opens every section in the current element's profile and persists", () => {
    const { result } = mount("container");
    act(() => result.current.expandAll());
    const profile = getProfileFor("container");
    const anyEffectsSection = profile.effects.order[0];
    expect(result.current.expandedSections.has(`container:${anyEffectsSection}`)).toBe(true);
    expect(readStored()).toContain(`container:${anyEffectsSection}`);
  });

  it("collapseAll clears every current-type key and persists the empty scope", () => {
    const { result } = mount("container");
    act(() => result.current.expandAll());
    act(() => result.current.collapseAll());
    const stillOpen = [...result.current.expandedSections].filter((k) =>
      k.startsWith("container:")
    );
    expect(stillOpen).toEqual([]);
    expect(readStored().filter((k) => k.startsWith("container:"))).toEqual([]);
  });
});
