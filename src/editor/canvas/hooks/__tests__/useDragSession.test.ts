import { renderHook, act } from "@testing-library/react";
import { useDragSession } from "../useDragSession";

describe("useDragSession.resetSession", () => {
  it("clears draggingElementId when resetSession is called", () => {
    const { result } = renderHook(() => useDragSession());

    act(() => {
      result.current.setDraggingElementId("el-123");
    });
    expect(result.current.draggingElementId).toBe("el-123");

    act(() => {
      result.current.resetSession();
    });

    expect(result.current.draggingElementId).toBeNull();
  });
});
