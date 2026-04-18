/**
 * useBuildTab.test.ts — regression guards for the v4 surgical refactor
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuildTab } from "../useBuildTab";

describe("useBuildTab", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("setMode clears search (v4 regression guard)", () => {
    it("clears pending search query when mode changes to sections", () => {
      const { result } = renderHook(() => useBuildTab(null));
      act(() => result.current.setSearchQuery("heading"));
      expect(result.current.searchQuery).toBe("heading");
      act(() => result.current.setMode("sections"));
      expect(result.current.searchQuery).toBe("");
    });

    it("clears pending search query when mode changes to elements", () => {
      const { result } = renderHook(() => useBuildTab(null));
      act(() => result.current.setMode("sections"));
      act(() => result.current.setSearchQuery("hero"));
      act(() => result.current.setMode("elements"));
      expect(result.current.searchQuery).toBe("");
    });

    it("preserves the new mode even when query was active", () => {
      const { result } = renderHook(() => useBuildTab(null));
      act(() => result.current.setSearchQuery("card"));
      act(() => result.current.setMode("sections"));
      expect(result.current.mode).toBe("sections");
    });
  });

  describe("tip nav wrap at boundaries", () => {
    it("tipNext cycles forward and wraps back to 0", () => {
      const { result } = renderHook(() => useBuildTab(null));
      const startIdx = result.current.tipIdx;
      let sawStartAgain = false;
      for (let n = 0; n < 100; n++) {
        act(() => result.current.tipNext());
        expect(result.current.tipIdx).toBeGreaterThanOrEqual(0);
        if (n > 0 && result.current.tipIdx === startIdx) {
          sawStartAgain = true;
        }
      }
      expect(sawStartAgain).toBe(true);
    });

    it("tipPrev from idx 0 wraps to a positive index (not stuck at 0)", () => {
      const { result } = renderHook(() => useBuildTab(null));
      act(() => result.current.tipPrev());
      expect(result.current.tipIdx).toBeGreaterThan(0);
    });
  });
});
