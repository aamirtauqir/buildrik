/**
 * useInspectorSections — per-element-type expand/collapse state with
 * localStorage persistence, default seeding from the element profile, and the
 * expandAll / collapseAll / toggleSection controls.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { SECTION_REGISTRY } from "../../sections/registry";
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


/** Only the Style-tab keys — Settings / Effects open by default. */
function styleKeys(set: Set<string>): string[] {
  return [...set].filter((k) => (SECTION_REGISTRY[k.split(":")[1] as keyof typeof SECTION_REGISTRY]?.tab ?? "style") === "style");
}

describe("useInspectorSections — default seeding", () => {
  /* The profile boards open exactly the sections that carry a value and count
     them in the footer ("4 of 13 sections apply"). */
  it("opens the sections the element actually styles", () => {
    const { result } = mount("container", { padding: "24px", "background-color": "#fff" });
    expect(styleKeys(result.current.expandedSections).sort()).toEqual(
      ["container:background", "container:spacing"].sort()
    );
  });

  /* Boards 4428:141642 / 142686: Settings and Effects open expanded. */
  it("opens every Settings and Effects section by default", () => {
    const { result } = mount("container");
    const nonStyle = [...result.current.expandedSections].filter((k) => !styleKeys(new Set([k])).length);
    expect(nonStyle.length).toBeGreaterThan(0);
    for (const k of nonStyle) expect(SECTION_REGISTRY[k.split(":")[1] as keyof typeof SECTION_REGISTRY].tab).not.toBe("style");
  });

  /* ...except what those boards draw shut: ADVANCED on Settings, BLUR and
     MORE EFFECTS on Effects (4428:142686). */
  it("leaves ADVANCED, BLUR and MORE EFFECTS collapsed", () => {
    const { result } = mount("container");
    expect(result.current.expandedSections.has("container:opacity")).toBe(true);
    expect(result.current.expandedSections.has("container:blur")).toBe(false);
    expect(result.current.expandedSections.has("container:effects")).toBe(false);
    expect(result.current.expandedSections.has("container:element-properties")).toBe(false);
  });

  /* Nothing set means nothing applies, and the footer says "0 of N sections
     apply". Opening a section anyway used to stick: the type was marked
     seeded on the render before its styles arrived, so the real ones never
     opened anything. */
  it("an element with nothing set opens nothing, and can still seed later", () => {
    const { result, rerender } = renderHook(
      ({ styles }: { styles: Record<string, string> }) =>
        useInspectorSections({
          selectedElement: { id: "e1", type: "container" },
          composer: null,
          styles,
        }),
      { initialProps: { styles: {} as Record<string, string> } }
    );
    expect(styleKeys(result.current.expandedSections)).toEqual([]);

    rerender({ styles: { padding: "24px" } });
    expect(styleKeys(result.current.expandedSections)).toEqual(["container:spacing"]);
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
