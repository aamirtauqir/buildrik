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

function mount(type = "container", styles: Record<string, string> = {}) {
  return renderHook(() =>
    useInspectorSections({ selectedElement: { id: "e1", type }, composer: null, styles })
  );
}

beforeEach(() => localStorage.clear());

describe("useInspectorSections — default seeding", () => {
  /* The profile boards open exactly the sections that carry a value and count
     them in the footer ("4 of 13 sections apply"). */
  it("opens the sections the element actually styles", () => {
    const { result } = mount("container", { padding: "24px", "background-color": "#fff" });
    expect([...result.current.expandedSections].sort()).toEqual(
      ["container:background", "container:spacing"].sort()
    );
  });

  it("an element with nothing set still opens its first section", () => {
    const expected = `container:${getProfileFor("container").order[0]}`;
    const { result } = mount("container");
    expect([...result.current.expandedSections]).toEqual([expected]);
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
    const lastSection = getProfileFor("container").order.at(-1) as string;
    expect(result.current.expandedSections.has(`container:${lastSection}`)).toBe(true);
    expect(readStored()).toContain(`container:${lastSection}`);
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
