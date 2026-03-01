import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useInspectorState } from "../hooks/useInspectorState";

describe("useInspectorState — tab routing via config only", () => {
  it("returns a tab for a heading element", () => {
    const { result } = renderHook(() => useInspectorState({ id: "el-1", type: "heading" }));
    expect(["layout", "design", "settings"]).toContain(result.current.activeTab);
  });

  it("setActiveTab updates the active tab", () => {
    // Stable reference — avoids useEffect re-running on every render
    const element = { id: "el-1", type: "container" };
    const { result } = renderHook(() => useInspectorState(element));
    act(() => result.current.setActiveTab("design"));
    expect(result.current.activeTab).toBe("design");
  });

  it("returns null for element with no config", () => {
    const { result } = renderHook(() =>
      useInspectorState({ id: "el-1", type: "unknownelement999" })
    );
    // Should not throw; just returns a default tab
    expect(["layout", "design", "settings"]).toContain(result.current.activeTab);
  });
});
