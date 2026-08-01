/**
 * usePublishOutcomeFlash.test.ts — the 2s outcome flash (T5 verify: "✓ Published
 * appears 2s then ready"). The job state is durable; the bar's celebration is
 * not, and the difference is the whole point of the hook.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PUBLISH_FLASH_MS, usePublishOutcomeFlash } from "../usePublishOutcomeFlash";

describe("usePublishOutcomeFlash", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("idle and in-flight states never flash", () => {
    const { result, rerender } = renderHook(({ s }) => usePublishOutcomeFlash(s), {
      initialProps: { s: "idle" },
    });
    expect(result.current).toBeNull();
    rerender({ s: "publishing" });
    expect(result.current).toBeNull();
  });

  it("published flashes, then clears after the flash window", () => {
    const { result, rerender } = renderHook(({ s }) => usePublishOutcomeFlash(s), {
      initialProps: { s: "publishing" },
    });
    rerender({ s: "published" });
    expect(result.current).toBe("published");

    act(() => vi.advanceTimersByTime(PUBLISH_FLASH_MS - 1));
    expect(result.current).toBe("published");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();
  });

  it("the job staying published does not re-arm the flash", () => {
    const { result, rerender } = renderHook(({ s }) => usePublishOutcomeFlash(s), {
      initialProps: { s: "published" },
    });
    act(() => vi.advanceTimersByTime(PUBLISH_FLASH_MS));
    expect(result.current).toBeNull();

    // The deployment is still live, so the hook keeps being called with
    // "published" — that must not bring the celebration back.
    rerender({ s: "published" });
    expect(result.current).toBeNull();
  });

  it("failure flashes on its own, and a later success replaces it", () => {
    const { result, rerender } = renderHook(({ s }) => usePublishOutcomeFlash(s), {
      initialProps: { s: "publishing" },
    });
    rerender({ s: "failed" });
    expect(result.current).toBe("failed");

    // Retry: the new result must read as new, not as the tail of the old one.
    rerender({ s: "publishing" });
    rerender({ s: "published" });
    expect(result.current).toBe("published");
    act(() => vi.advanceTimersByTime(PUBLISH_FLASH_MS));
    expect(result.current).toBeNull();
  });

  it("unmounting mid-flash leaves no timer behind", () => {
    const { result, rerender, unmount } = renderHook(({ s }) => usePublishOutcomeFlash(s), {
      initialProps: { s: "publishing" },
    });
    rerender({ s: "published" });
    expect(result.current).toBe("published");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
