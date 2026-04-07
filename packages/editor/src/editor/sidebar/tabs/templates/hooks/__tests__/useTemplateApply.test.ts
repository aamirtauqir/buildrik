import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTemplateApply } from "../useTemplateApply";

// Mock the Composer with minimal interface
function createMockComposer() {
  const listeners = new Map<string, Set<Function>>();
  return {
    elements: {
      getActivePage: vi.fn().mockReturnValue(null),
      getElement: vi.fn().mockReturnValue(null),
    },
    on: vi.fn((event: string, fn: Function) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: Function) => {
      listeners.get(event)?.delete(fn);
    }),
  } as any;
}

describe("useTemplateApply", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    expect(result.current.applyState).toBe("idle");
    expect(result.current.applyError).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it("transitions IDLE → CONFIRMING on requestApply", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    expect(result.current.applyState).toBe("confirming");
    expect(result.current.pendingId.current).toBe("tpl-1");
  });

  it("transitions CONFIRMING → APPLYING on confirmApply", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    expect(result.current.applyState).toBe("applying");
    expect(result.current.progress).toBe(0);
  });

  it("transitions CONFIRMING → IDLE on cancelApply", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.cancelApply());
    expect(result.current.applyState).toBe("idle");
    expect(result.current.pendingId.current).toBeNull();
  });

  it("transitions APPLYING → SUCCESS on completeApply", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    act(() => result.current.completeApply());
    expect(result.current.applyState).toBe("success");
    expect(result.current.progress).toBe(100);
  });

  it("auto-dismisses SUCCESS → IDLE after 2s", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    act(() => result.current.completeApply());
    expect(result.current.applyState).toBe("success");

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.applyState).toBe("idle");
  });

  it("transitions APPLYING → ERROR on failApply", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    act(() => result.current.failApply("Network error"));
    expect(result.current.applyState).toBe("error");
    expect(result.current.applyError).toBe("Network error");
    expect(result.current.canRetry).toBe(true);
  });

  it("transitions ERROR → APPLYING on retryApply", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    act(() => result.current.failApply("Error"));
    act(() => result.current.retryApply());
    expect(result.current.applyState).toBe("applying");
    expect(result.current.applyError).toBeNull();
  });

  // Regression: re-entry guard
  it("rejects requestApply during APPLYING state", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    expect(result.current.applyState).toBe("applying");

    act(() => result.current.requestApply("tpl-2"));
    // Should stay in applying, not switch to confirming
    expect(result.current.applyState).toBe("applying");
    expect(result.current.pendingId.current).toBe("tpl-1");
  });

  // Regression: 15s timeout
  it("auto-fails APPLYING after 15s timeout", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    expect(result.current.applyState).toBe("applying");

    act(() => vi.advanceTimersByTime(15000));
    expect(result.current.applyState).toBe("error");
    expect(result.current.applyError).toContain("timed out");
  });

  it("resets all state on resetApply", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tpl-1"));
    act(() => result.current.confirmApply());
    act(() => result.current.failApply("Error"));
    act(() => result.current.resetApply());
    expect(result.current.applyState).toBe("idle");
    expect(result.current.applyError).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.pendingId.current).toBeNull();
  });

  it("syncs canvas element count with composer events", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useTemplateApply(composer));
    // With null active page, count should be 0
    expect(result.current.canvasElementCount).toBe(0);
    expect(result.current.hasExistingContent).toBe(false);
  });

  it("cleans up composer event listeners on unmount", () => {
    const composer = createMockComposer();
    const { unmount } = renderHook(() => useTemplateApply(composer));
    unmount();
    expect(composer.off).toHaveBeenCalled();
  });
});
