/**
 * useOnlineStatus — reads navigator.onLine and follows online / offline.
 *
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOnlineStatus } from "../useOnlineStatus";

afterEach(() => vi.restoreAllMocks());

describe("useOnlineStatus", () => {
  it("starts from navigator.onLine and follows the offline / online events", () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
    onLine.mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
    onLine.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });
});
