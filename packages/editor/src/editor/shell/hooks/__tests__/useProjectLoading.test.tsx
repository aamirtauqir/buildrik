/**
 * useProjectLoading — board 65:412 (Shell state 12 · Loading).
 *
 * The claim under test is not "a hook returns a boolean", it is: the shell
 * mounts BEFORE the site's pages arrive, so a consumer that only subscribes
 * misses the edge entirely and reports "not loading" for the whole load. Both
 * directions are asserted, and the first test would pass with a
 * subscribe-only implementation only if the getter is read on mount.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectLoading } from "../useProjectLoading";
import { EVENTS } from "../../../../shared/constants/events";
import type { Composer } from "../../../../engine";

/** A composer that really dispatches, so the late-subscriber claim is testable. */
function makeComposer(initial: boolean) {
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  let loading = initial;
  return {
    isProjectLoading: () => loading,
    on: (evt: string, fn: (p: unknown) => void) => {
      if (!handlers.has(evt)) handlers.set(evt, new Set());
      handlers.get(evt)!.add(fn);
    },
    off: (evt: string, fn: (p: unknown) => void) => handlers.get(evt)?.delete(fn),
    setProjectLoading(next: boolean) {
      if (loading === next) return;
      loading = next;
      for (const fn of handlers.get(EVENTS.PROJECT_LOAD_STATE) ?? []) fn({ loading: next });
    },
    listenerCount: () => handlers.get(EVENTS.PROJECT_LOAD_STATE)?.size ?? 0,
  };
}

describe("useProjectLoading", () => {
  it("reports a load that started BEFORE the consumer mounted", () => {
    const composer = makeComposer(true);
    const { result } = renderHook(() =>
      useProjectLoading(composer as unknown as Composer),
    );
    expect(result.current).toBe(true);
  });

  it("goes false when the load settles", () => {
    const composer = makeComposer(true);
    const { result } = renderHook(() =>
      useProjectLoading(composer as unknown as Composer),
    );
    act(() => composer.setProjectLoading(false));
    expect(result.current).toBe(false);
  });

  it("picks up a load that starts after mount", () => {
    const composer = makeComposer(false);
    const { result } = renderHook(() =>
      useProjectLoading(composer as unknown as Composer),
    );
    expect(result.current).toBe(false);
    act(() => composer.setProjectLoading(true));
    expect(result.current).toBe(true);
  });

  it("unsubscribes on unmount", () => {
    const composer = makeComposer(true);
    const { unmount } = renderHook(() =>
      useProjectLoading(composer as unknown as Composer),
    );
    expect(composer.listenerCount()).toBe(1);
    unmount();
    expect(composer.listenerCount()).toBe(0);
  });

  it("no composer → not loading, and does not throw", () => {
    const { result } = renderHook(() => useProjectLoading(null));
    expect(result.current).toBe(false);
  });

  it("a composer swap re-reads the new one's state", () => {
    const first = makeComposer(false);
    const second = makeComposer(true);
    const { result, rerender } = renderHook(
      ({ c }: { c: unknown }) => useProjectLoading(c as Composer),
      { initialProps: { c: first as unknown } },
    );
    expect(result.current).toBe(false);
    rerender({ c: second as unknown });
    expect(result.current).toBe(true);
  });
});

describe("Composer.setProjectLoading", () => {
  /* MediaManager builds a MediaOptimizer in the constructor and that wants a
     2d context jsdom does not implement — the same stub every engine test
     that constructs a real Composer installs. */
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
  beforeAll(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = (() => ({
      drawImage: () => {},
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });
  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("emits only on a real edge", async () => {
    const { Composer } = await import("../../../../engine");
    const composer = new Composer({} as never);
    const seen: boolean[] = [];
    composer.on(EVENTS.PROJECT_LOAD_STATE, (p: { loading: boolean }) => seen.push(p.loading));

    composer.setProjectLoading(true);
    composer.setProjectLoading(true);
    composer.setProjectLoading(false);

    expect(seen).toEqual([true, false]);
    expect(composer.isProjectLoading()).toBe(false);
  });
});

