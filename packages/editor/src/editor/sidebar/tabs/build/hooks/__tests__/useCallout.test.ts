import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCallout } from "../useCallout";
import { STORAGE_KEYS } from "../../../../../../shared/constants/storageKeys";

describe("useCallout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("visibility", () => {
    it("hides for new user (no picks, no flag) and sets silent flag", () => {
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN)).toBe("1");
    });

    it("shows for returning user with picks + no flag", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading", "button"]));
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(true);
    });

    it("hides for user with picks + already-seen flag", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      localStorage.setItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN, "1");
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });

    it("hides when picks is empty array", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify([]));
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });

    it("treats corrupted JSON as no picks (graceful)", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, "not-valid-json{{");
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });

    it("treats non-array JSON as no picks", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify({ foo: "bar" }));
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });
  });

  describe("auto-dismiss", () => {
    it("dismisses after 8s and clears obsolete storage", () => {
      vi.useFakeTimers();
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      localStorage.setItem(STORAGE_KEYS.BUILD_FTUE_SEEN, "true");

      const { result } = renderHook(() => useCallout(8000));
      expect(result.current.visible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(8000);
      });

      expect(result.current.visible).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_PICKS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_FTUE_SEEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN)).toBe("1");
    });
  });

  describe("manual dismiss", () => {
    it("dismiss() hides immediately and cleans storage", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      const { result } = renderHook(() => useCallout());

      expect(result.current.visible).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.visible).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN)).toBe("1");
    });

    it("is idempotent — double dismiss does not throw", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      const { result } = renderHook(() => useCallout());

      act(() => {
        result.current.dismiss();
        result.current.dismiss();
      });

      expect(result.current.visible).toBe(false);
    });
  });

  describe("storage errors", () => {
    it("proceeds when localStorage.setItem throws QuotaExceededError", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      const setSpy = vi.spyOn(Storage.prototype, "setItem");
      setSpy.mockImplementation((key: string, val: string) => {
        if (key === STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) {
          throw new DOMException("Quota", "QuotaExceededError");
        }
        // fall through to real implementation for other keys
        setSpy.mockRestore();
        localStorage.setItem(key, val);
        setSpy.mockImplementation((k: string, v: string) => {
          if (k === STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) {
            throw new DOMException("Quota", "QuotaExceededError");
          }
          localStorage.setItem(k, v);
        });
      });

      const { result } = renderHook(() => useCallout());
      expect(() => act(() => result.current.dismiss())).not.toThrow();
      expect(result.current.visible).toBe(false);
    });
  });
});
