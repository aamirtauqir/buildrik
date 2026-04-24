import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInspectorState } from "../useInspectorState";

describe("useInspectorState pseudo reset", () => {
  it("resets pseudoState to 'normal' when element id changes", () => {
    const { result, rerender } = renderHook(
      ({ el }) => useInspectorState(el),
      { initialProps: { el: { id: "el1", type: "box" } } }
    );
    act(() => { result.current.setCurrentPseudoState("hover"); });
    expect(result.current.currentPseudoState).toBe("hover");

    rerender({ el: { id: "el2", type: "box" } });
    expect(result.current.currentPseudoState).toBe("normal");
  });
});
