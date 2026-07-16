// @vitest-environment jsdom
/**
 * useServerStorageQuota.test.tsx — server quota fetch lifecycle, event-driven
 * refetch policy (MEDIA_DELETED + UPLOAD_COMPLETE only, NOT MEDIA_ADDED per
 * [P2A]), and the generation-counter stale-response guard.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MEDIA_EVENTS } from "@/shared/constants/media";

// A single controllable query mock shared across the (module-cached) client.
const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock("@/services/api-client", () => ({
  createBuildrikApiClient: () => ({
    media: { checkStorageQuota: { query: queryMock } },
  }),
}));

import { useServerStorageQuota } from "../useServerStorageQuota";

interface FakeMedia {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: (event: string) => void;
  listeners: Map<string, Set<() => void>>;
}

function makeComposer(): { media: FakeMedia } {
  const listeners = new Map<string, Set<() => void>>();
  const media: FakeMedia = {
    listeners,
    on: vi.fn((event: string, cb: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: () => void) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: (event: string) => listeners.get(event)?.forEach((cb) => cb()),
  };
  return { media };
}

const OK_QUOTA = {
  ok: true,
  usedBytes: 1_000,
  totalBytes: 5_000,
  tier: "FREE" as const,
  warningAt80Percent: false,
};

beforeEach(() => {
  queryMock.mockReset();
});

describe("useServerStorageQuota — fetch lifecycle", () => {
  it("commits quota + isAvailable on a successful first fetch", async () => {
    queryMock.mockResolvedValue(OK_QUOTA);
    const composer = makeComposer();
    const { result } = renderHook(() => useServerStorageQuota(composer as never));

    // First render is pre-resolution: loading, no quota yet.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.quota).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.quota).toEqual(OK_QUOTA);
    expect(result.current.isAvailable).toBe(true);
  });

  it("starts loading with no quota and not-available before the first fetch resolves", async () => {
    // Hold the fetch open so we observe the pre-resolution state deterministically.
    let resolveIt: (v: unknown) => void = () => {};
    queryMock.mockReturnValue(
      new Promise((r) => {
        resolveIt = r;
      }),
    );
    const composer = makeComposer();
    const { result } = renderHook(() => useServerStorageQuota(composer as never));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.quota).toBeNull();
    // isAvailable gates the caller's local-IndexedDB fallback — false until a
    // successful server fetch ever lands.
    expect(result.current.isAvailable).toBe(false);

    // Settle the promise so nothing dangles into teardown.
    await act(async () => {
      resolveIt(OK_QUOTA);
    });
  });
});

describe("useServerStorageQuota — refetch policy", () => {
  it("subscribes to MEDIA_DELETED and UPLOAD_COMPLETE but NOT MEDIA_ADDED", async () => {
    queryMock.mockResolvedValue(OK_QUOTA);
    const composer = makeComposer();
    renderHook(() => useServerStorageQuota(composer as never));
    await waitFor(() => expect(queryMock).toHaveBeenCalled());

    const subscribed = composer.media.on.mock.calls.map((c) => c[0]);
    expect(subscribed).toContain(MEDIA_EVENTS.MEDIA_DELETED);
    expect(subscribed).toContain(MEDIA_EVENTS.UPLOAD_COMPLETE);
    // MEDIA_ADDED is intentionally not subscribed — it would double-fire with
    // UPLOAD_COMPLETE and race two responses into the same setQuota.
    expect(subscribed).not.toContain(MEDIA_EVENTS.MEDIA_ADDED);
  });

  it("re-runs the query when a subscribed media event fires", async () => {
    queryMock.mockResolvedValue(OK_QUOTA);
    const composer = makeComposer();
    renderHook(() => useServerStorageQuota(composer as never));
    await waitFor(() => expect(queryMock).toHaveBeenCalledTimes(1));

    act(() => composer.media.emit(MEDIA_EVENTS.MEDIA_DELETED));
    await waitFor(() => expect(queryMock).toHaveBeenCalledTimes(2));
  });

  it("refetch() manually re-runs the query", async () => {
    queryMock.mockResolvedValue(OK_QUOTA);
    const composer = makeComposer();
    const { result } = renderHook(() => useServerStorageQuota(composer as never));
    await waitFor(() => expect(queryMock).toHaveBeenCalledTimes(1));

    // Fully await the refetch — leaving it un-awaited leaks async into the
    // next test and corrupts the shared query mock's call count.
    await act(async () => {
      await result.current.refetch();
    });
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("unsubscribes both listeners on unmount", () => {
    queryMock.mockResolvedValue(OK_QUOTA);
    const composer = makeComposer();
    const { unmount } = renderHook(() => useServerStorageQuota(composer as never));
    // The mount effect calls query synchronously before its first await.
    expect(queryMock).toHaveBeenCalledTimes(1);

    unmount();
    const off = composer.media.off.mock.calls.map((c) => c[0]);
    expect(off).toContain(MEDIA_EVENTS.MEDIA_DELETED);
    expect(off).toContain(MEDIA_EVENTS.UPLOAD_COMPLETE);
  });
});

describe("useServerStorageQuota — stale-response guard (generation counter)", () => {
  it("drops an older in-flight response that resolves after a newer one", async () => {
    // Hand out controllable deferreds so we can resolve out of order.
    const deferreds: Array<{ resolve: (v: unknown) => void }> = [];
    queryMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          deferreds.push({ resolve });
        }),
    );

    const composer = makeComposer();
    const { result } = renderHook(() => useServerStorageQuota(composer as never));

    // gen 1 in flight (mount fetch, synchronous). Trigger gen 2 via refetch.
    // NB: void the refetch promise — it never resolves here, so returning it
    // from the act callback would make act() await it forever.
    expect(deferreds).toHaveLength(1);
    act(() => {
      void result.current.refetch();
    });
    expect(deferreds).toHaveLength(2);

    const fresh = { ...OK_QUOTA, usedBytes: 2222 };
    const stale = { ...OK_QUOTA, usedBytes: 9999 };

    // Newer (gen 2) resolves first — commits.
    await act(async () => {
      deferreds[1].resolve(fresh);
    });
    await waitFor(() => expect(result.current.quota).toEqual(fresh));

    // Older (gen 1) resolves late — must be dropped, not overwrite fresh.
    await act(async () => {
      deferreds[0].resolve(stale);
    });
    expect(result.current.quota).toEqual(fresh);
  });
});
