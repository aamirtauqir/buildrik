/**
 * useSaveStall (DR-T3, D3/D8): dirty for 30 s with no save attempt — read
 * from the change counter, so an open transaction that swallows
 * project:changed still counts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const tracked = vi.hoisted(() => [] as string[]);
vi.mock("@/shared/utils/errorTracking", () => ({ trackEvent: (n: string) => tracked.push(n) }));

import { useSaveStall } from "../useSaveStall";

function fakeComposer() {
  const c = { seq: 0, dirty: false, txn: false };
  return {
    c,
    composer: {
      getChangeSeq: () => c.seq,
      isDirty: () => c.dirty,
      isTransactionActive: () => c.txn,
    } as never,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  tracked.length = 0;
});
afterEach(() => vi.useRealTimers());

describe("useSaveStall", () => {
  it("stalls after 30 s of unsaved changes with no save attempt, and reports once", () => {
    const { c, composer } = fakeComposer();
    const { result } = renderHook(({ status }) => useSaveStall(composer, status), { initialProps: { status: "idle" } });
    c.seq = 3;
    c.dirty = true;
    c.txn = true; // project:changed swallowed by an open gesture
    act(() => void vi.advanceTimersByTime(25_000));
    expect(result.current).toBeNull();
    act(() => void vi.advanceTimersByTime(15_000));
    expect(result.current).toBeGreaterThanOrEqual(30_000);
    act(() => void vi.advanceTimersByTime(30_000));
    expect(tracked).toEqual(["autosave.stalled"]);
  });

  it("a save attempt clears it; a clean document never stalls", () => {
    const { c, composer } = fakeComposer();
    const { result, rerender } = renderHook(({ status }) => useSaveStall(composer, status), { initialProps: { status: "idle" } });
    c.seq = 1;
    c.dirty = true;
    act(() => void vi.advanceTimersByTime(40_000));
    expect(result.current).not.toBeNull();
    rerender({ status: "saving" });
    expect(result.current).toBeNull();

    c.seq = 9; // e.g. a load that bumped the counter
    c.dirty = false;
    rerender({ status: "idle" });
    act(() => void vi.advanceTimersByTime(60_000));
    expect(result.current).toBeNull();
  });
});
