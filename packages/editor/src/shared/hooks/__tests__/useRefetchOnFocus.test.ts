// @vitest-environment jsdom
/**
 * useRefetchOnFocus — focus/visibility refetch with throttle (F3/F5).
 */
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRefetchOnFocus } from "../useRefetchOnFocus";

describe("useRefetchOnFocus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs on window focus and throttles repeats inside the interval", () => {
    const fn = vi.fn();
    renderHook(() => useRefetchOnFocus(fn, 30_000));
    window.dispatchEvent(new Event("focus"));
    expect(fn).toHaveBeenCalledTimes(1);
    // rapid re-focus inside the window is a no-op
    window.dispatchEvent(new Event("focus"));
    expect(fn).toHaveBeenCalledTimes(1);
    // past the interval it runs again
    vi.setSystemTime(31_000);
    window.dispatchEvent(new Event("focus"));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("runs on visibilitychange only when the tab becomes visible", () => {
    const fn = vi.fn();
    renderHook(() => useRefetchOnFocus(fn, 30_000));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(fn).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("removes listeners on unmount", () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() => useRefetchOnFocus(fn, 30_000));
    unmount();
    window.dispatchEvent(new Event("focus"));
    expect(fn).not.toHaveBeenCalled();
  });
});
