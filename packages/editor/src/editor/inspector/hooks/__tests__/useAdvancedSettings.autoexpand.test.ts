/**
 * The inspector's advanced groups open by themselves when they hold a value.
 *
 * They did not, and three defects were stacked:
 *
 *  1. The once-per-element guard was spent before the styles existed. `styles`
 *     is `{}` on the first render after a selection — useStyleHandlers fills it
 *     in a later effect — and `{}` is truthy, so the element was marked done,
 *     the scan ran against an empty object, and every later pass returned at
 *     the `has()` check. Nothing could auto-expand at all.
 *  2. The lookup read dotted, camelCase registry ids ("size.minWidth") against
 *     a style map keyed in kebab-case and nothing else. 43 of the registry's 57
 *     advanced ids have a camelCase tail.
 *  3. And the ids came from the wrong place entirely: a prefix over
 *     propertiesRegistry, not from what the section's advanced block draws.
 *     Layout's renders Position / Overflow / Visibility; Typography's renders
 *     font-style, text-indent and vertical-align, which the registry does not
 *     list at all. Sections declare their own set now.
 *
 * The registry test at the bottom is the one that would have caught (3). The
 * hardcoded map above it would not — which is exactly how this survived.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdvancedSettings } from "../useAdvancedSettings";
import { buildAdvancedPropsMapFromRegistry } from "../../sections/registry";

const MAP = {
  size: ["min-width", "max-height"],
  position: ["z-index"],
  layout: ["visibility"],
};

const render = (styles: Record<string, string>, map: Record<string, string[]> = MAP) =>
  renderHook(() => useAdvancedSettings({ advancedPropsMap: map, styles, elementId: "el-1" }));

describe("advanced group auto-expand", () => {
  it("opens the group holding the value", () => {
    const { result } = render({ "min-width": "240px" });
    expect(result.current.isExpanded("size")).toBe(true);
  });

  it("leaves a group closed when none of its advanced props carry a value", () => {
    const { result } = render({ padding: "8px" });
    expect(result.current.isExpanded("size")).toBe(false);
    expect(result.current.isExpanded("position")).toBe(false);
  });

  /* "0" and "none" are the engine's way of saying unset. */
  it("does not treat 0 or none as a value worth opening for", () => {
    const { result } = render({ "min-width": "0", "z-index": "none" });
    expect(result.current.isExpanded("size")).toBe(false);
    expect(result.current.isExpanded("position")).toBe(false);
  });

  it("waits for the styles to arrive instead of spending its one shot on {}", () => {
    const { result, rerender } = renderHook(
      ({ styles }: { styles: Record<string, string> }) =>
        useAdvancedSettings({ advancedPropsMap: MAP, styles, elementId: "el-1" }),
      { initialProps: { styles: {} as Record<string, string> } }
    );
    expect(result.current.isExpanded("size")).toBe(false);

    rerender({ styles: { "min-width": "240px" } });
    expect(result.current.isExpanded("size")).toBe(true);
  });

  it("does not re-expand a group the user collapsed", () => {
    const { result, rerender } = renderHook(
      ({ styles }: { styles: Record<string, string> }) =>
        useAdvancedSettings({ advancedPropsMap: MAP, styles, elementId: "el-1" }),
      { initialProps: { styles: { "min-width": "240px" } as Record<string, string> } }
    );
    expect(result.current.isExpanded("size")).toBe(true);

    act(() => result.current.collapse("size"));
    expect(result.current.isExpanded("size")).toBe(false);

    rerender({ styles: { "min-width": "300px" } });
    expect(result.current.isExpanded("size")).toBe(false);
  });
});

/* Against the REAL map the inspector builds. A hardcoded map cannot see the
   defect that mattered most — the sections and the property list disagreeing —
   because the test supplies both sides itself. */
describe("auto-expand against the registry the inspector actually uses", () => {
  const real = buildAdvancedPropsMapFromRegistry();

  it("every declared advanced property is a kebab CSS name, not a dotted id", () => {
    for (const [group, props] of Object.entries(real)) {
      for (const prop of props) {
        expect(prop, `${group}.${prop}`).not.toContain(".");
        expect(prop, `${group}.${prop}`).not.toMatch(/[a-z][A-Z]/);
      }
    }
  });

  it("opens Typography for font-style — a property the old registry never listed", () => {
    const { result } = render({ "font-style": "italic" }, real);
    expect(result.current.isExpanded("typography")).toBe(true);
  });

  it("opens Layout for z-index and overflow, which its advanced block draws", () => {
    expect(render({ "z-index": "10" }, real).result.current.isExpanded("layout")).toBe(true);
    expect(render({ "overflow-x": "scroll" }, real).result.current.isExpanded("layout")).toBe(true);
  });

  it("opens Background for background-blend-mode", () => {
    const { result } = render({ "background-blend-mode": "multiply" }, real);
    expect(result.current.isExpanded("background")).toBe(true);
  });

  it("opens Size for min-width and Border for outline-width", () => {
    expect(render({ "min-width": "240px" }, real).result.current.isExpanded("size")).toBe(true);
    expect(render({ "outline-width": "2px" }, real).result.current.isExpanded("border")).toBe(true);
  });
});
