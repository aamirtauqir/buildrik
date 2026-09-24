/**
 * useTemplateSelection — preview id and replace confirm. The drawer-era
 * pills, tags, pagination and detail id are gone with the drawer (#24).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTemplateSelection } from "../useTemplateSelection";

describe("useTemplateSelection", () => {
  it("starts with nothing previewed and no confirm", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    expect(result.current.previewId).toBeNull();
    expect(result.current.showReplace).toBe(false);
  });

  it("Escape closes the replace confirm", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setShowReplace(true));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.showReplace).toBe(false);
  });

  it("leaves the confirm alone while an apply is running", () => {
    const { result } = renderHook(() => useTemplateSelection(true));
    act(() => result.current.setShowReplace(true));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.showReplace).toBe(true);
  });
});
