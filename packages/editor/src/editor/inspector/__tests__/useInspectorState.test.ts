import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useInspectorState } from "../hooks/useInspectorState";

// S3.9: inspector flattened to one column — tab state was drained; the hook
// now owns pseudo-state selection only.
describe("useInspectorState — pseudo-state", () => {
  it("defaults to the normal pseudo-state", () => {
    const { result } = renderHook(() => useInspectorState({ id: "el-1", type: "heading" }));
    expect(result.current.currentPseudoState).toBe("normal");
  });

  it("setCurrentPseudoState updates the pseudo-state", () => {
    const element = { id: "el-1", type: "container" };
    const { result } = renderHook(() => useInspectorState(element));
    act(() => result.current.setCurrentPseudoState("hover"));
    expect(result.current.currentPseudoState).toBe("hover");
  });

  it("resets pseudo-state to normal when the selected element changes", () => {
    const { result, rerender } = renderHook(
      ({ el }) => useInspectorState(el),
      { initialProps: { el: { id: "el-1", type: "container" } } }
    );
    act(() => result.current.setCurrentPseudoState("focus"));
    expect(result.current.currentPseudoState).toBe("focus");
    rerender({ el: { id: "el-2", type: "container" } });
    expect(result.current.currentPseudoState).toBe("normal");
  });
});
