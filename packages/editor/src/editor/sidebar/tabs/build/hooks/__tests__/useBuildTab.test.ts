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

  // Sections-mode tests removed 2026-04-23 — Sections mode deleted in P1 pass.

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
