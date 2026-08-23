/**
 * The inspector's advanced groups open by themselves when they hold a value.
 *
 * They did not, for 43 of the registry's 57 advanced properties. The registry
 * ids are dotted AND camelCase ("size.minWidth", "position.zIndex"); element
 * styles are keyed kebab-case and nothing else — measured on a real page, zero
 * camelCase keys against `border-radius`, `align-items`,
 * `grid-template-columns`. Taking the tail of the dotted path fixed the dot and
 * left the casing, so `styles["minWidth"]` was read from a kebab map and came
 * back undefined every time. Set a min-width, reopen the inspector, and the
 * group holding the value you just set is collapsed.
 *
 * The 14 that did work are the single-word ones — visibility, isolation,
 * contain — spelled the same either way, which is why this looked healthy.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdvancedSettings } from "../useAdvancedSettings";

const MAP = {
  size: ["size.minWidth", "size.maxHeight"],
  position: ["position.zIndex"],
  layout: ["layout.visibility"],
};

const render = (styles: Record<string, string>) =>
  renderHook(() =>
    useAdvancedSettings({ advancedPropsMap: MAP, styles, elementId: "el-1" })
  );

describe("advanced group auto-expand", () => {
  it("opens the group when a camelCase-id property has a kebab-cased value", () => {
    const { result } = render({ "min-width": "240px" });
    expect(result.current.isExpanded("size")).toBe(true);
  });

  it("opens position for z-index, the id the registry spells zIndex", () => {
    const { result } = render({ "z-index": "10" });
    expect(result.current.isExpanded("position")).toBe(true);
  });

  /* The case that always worked, kept so a regression cannot hide behind it. */
  it("still opens on a single-word property", () => {
    const { result } = render({ visibility: "hidden" });
    expect(result.current.isExpanded("layout")).toBe(true);
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

  /* The defect that hid the one above. In the running inspector `styles` is
     `{}` on the first render after a selection — useStyleHandlers fills it in
     an effect that runs later — and `{}` is truthy, so the once-per-element
     guard was spent on the empty pass and every later one returned early. The
     auto-expand could not fire for any property at all. */
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

  /* And it is still once per element: a collapse the user makes has to stick. */
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
