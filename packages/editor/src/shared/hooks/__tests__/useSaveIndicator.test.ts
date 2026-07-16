/**
 * useSaveIndicator tests — save lifecycle status driven by composer events
 * plus the retry path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSaveIndicator } from "../useSaveIndicator";
import { EVENTS } from "../../constants/events";
import type { Composer } from "../../../engine";

type Handler = (payload?: unknown) => void;

function createMockComposer() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    on: vi.fn((event: string, cb: Handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: Handler) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: (event: string, payload?: unknown) => {
      listeners.get(event)?.forEach((cb) => cb(payload));
    },
    saveProject: vi.fn().mockResolvedValue(undefined),
  };
}

const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

describe("useSaveIndicator", () => {
  it("starts as 'saved' with no lastSaved timestamp", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useSaveIndicator(asComposer(composer)));
    expect(result.current.status).toBe("saved");
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("PROJECT_SAVING → 'saving', PROJECT_SAVED → 'saved' + lastSaved", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useSaveIndicator(asComposer(composer)));

    act(() => composer.emit(EVENTS.PROJECT_SAVING));
    expect(result.current.status).toBe("saving");

    act(() => composer.emit(EVENTS.PROJECT_SAVED));
    expect(result.current.status).toBe("saved");
    expect(result.current.lastSaved).toBeInstanceOf(Date);
  });

  it("COLLAB_SYNC_ERROR → 'error' and isError", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useSaveIndicator(asComposer(composer)));

    act(() => composer.emit(EVENTS.COLLAB_SYNC_ERROR));
    expect(result.current.status).toBe("error");
    expect(result.current.isError).toBe(true);
  });

  it("NETWORK_OFFLINE → 'offline'; NETWORK_ONLINE restores 'saved'", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useSaveIndicator(asComposer(composer)));

    act(() => composer.emit(EVENTS.NETWORK_OFFLINE));
    expect(result.current.status).toBe("offline");
    expect(result.current.isError).toBe(true);

    act(() => composer.emit(EVENTS.NETWORK_ONLINE));
    expect(result.current.status).toBe("saved");
  });

  it("online recovery only applies when currently offline", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useSaveIndicator(asComposer(composer)));

    act(() => composer.emit(EVENTS.COLLAB_SYNC_ERROR));
    act(() => composer.emit(EVENTS.NETWORK_ONLINE));
    expect(result.current.status).toBe("error"); // error is NOT cleared by online
  });

  it("retry re-saves only from the error state", async () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useSaveIndicator(asComposer(composer)));

    // Not in error → no-op.
    act(() => result.current.retry());
    expect(composer.saveProject).not.toHaveBeenCalled();

    act(() => composer.emit(EVENTS.COLLAB_SYNC_ERROR));
    act(() => result.current.retry());
    expect(composer.saveProject).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saving");
  });

  it("retry returns to 'error' when the save rejects", async () => {
    const composer = createMockComposer();
    composer.saveProject.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useSaveIndicator(asComposer(composer)));

    act(() => composer.emit(EVENTS.COLLAB_SYNC_ERROR));
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("unsubscribes composer + window listeners on unmount", () => {
    const composer = createMockComposer();
    const { unmount } = renderHook(() => useSaveIndicator(asComposer(composer)));
    unmount();
    expect(composer.off).toHaveBeenCalledWith(EVENTS.PROJECT_SAVING, expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith(EVENTS.PROJECT_SAVED, expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith(EVENTS.COLLAB_SYNC_ERROR, expect.any(Function));
  });
});
