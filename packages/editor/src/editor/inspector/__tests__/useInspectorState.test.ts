import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useInspectorState } from "../hooks/useInspectorState";

// Phase 6 restructure renamed the tab ids from CSS-category
// (layout/appearance/effects) to concept (style/element/effects).
const VALID_TABS = ["style", "element", "effects"];

describe("useInspectorState — tab routing via config only", () => {
  it("returns a tab for a heading element", () => {
    const { result } = renderHook(() => useInspectorState({ id: "el-1", type: "heading" }));
    expect(VALID_TABS).toContain(result.current.activeTab);
  });

  it("setActiveTab updates the active tab", () => {
    // Stable reference — avoids useEffect re-running on every render
    const element = { id: "el-1", type: "container" };
    const { result } = renderHook(() => useInspectorState(element));
    act(() => result.current.setActiveTab("element"));
    expect(result.current.activeTab).toBe("element");
  });

  it("returns a default tab for element with no config", () => {
    const { result } = renderHook(() =>
      useInspectorState({ id: "el-1", type: "unknownelement999" })
    );
    // Should not throw; falls back to style tab via container profile.
    expect(VALID_TABS).toContain(result.current.activeTab);
  });
});
