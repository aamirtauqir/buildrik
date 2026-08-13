/**
 * useVersionHistory tests — VersionTimelineManager wrapper: load, event
 * refresh, and delegation of CRUD/compare operations.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVersionHistory } from "../useVersionHistory";
import { EVENTS } from "../../constants/events";
import type { Composer } from "../../../engine";
import type { NamedVersion } from "../../types/versions";

type Handler = (payload?: unknown) => void;

const v = (id: string, name: string) => ({ id, name }) as NamedVersion;

function createMockComposer(versions: NamedVersion[] = []) {
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
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
    versions: {
      isAvailable: vi.fn(() => true),
      getVersions: vi.fn(() => versions),
      createVersion: vi.fn().mockResolvedValue(undefined),
      restoreVersion: vi.fn().mockResolvedValue(undefined),
      deleteVersion: vi.fn().mockResolvedValue(undefined),
      compareVersions: vi.fn().mockResolvedValue({ added: [], removed: [], modified: [] }),
      updateVersion: vi.fn().mockResolvedValue(undefined),
    },
  };
}

const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

describe("useVersionHistory", () => {
  it("null composer → empty, unavailable, not loading", () => {
    const { result } = renderHook(() => useVersionHistory(null));
    expect(result.current.versions).toEqual([]);
    expect(result.current.isAvailable).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("seeds versions on mount and reports availability", () => {
    const composer = createMockComposer([v("v1", "Launch")]);
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));

    expect(result.current.versions).toEqual([v("v1", "Launch")]);
    expect(result.current.isAvailable).toBe(true);
  });

  /* The manager reads storage with an await; the synchronous seed returns []
     until that resolves. Clearing isLoading on the seed is what made the panel
     render its empty state to users who had versions. */
  it("stays loading until the manager reports its storage read finished", () => {
    const composer = createMockComposer([]);
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));

    expect(result.current.isLoading).toBe(true);

    composer.versions.getVersions.mockReturnValue([v("v2", "Redesign")]);
    act(() => composer.emit(EVENTS.VERSION_LIST_UPDATED));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.versions).toEqual([v("v2", "Redesign")]);
  });

  it("does not sit loading forever when versions are unavailable", () => {
    const composer = createMockComposer([]);
    composer.versions.isAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));

    expect(result.current.isLoading).toBe(false);
  });

  it("reloads on VERSION_LIST_UPDATED", () => {
    const composer = createMockComposer([]);
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));
    expect(result.current.versions).toEqual([]);

    composer.versions.getVersions.mockReturnValue([v("v2", "Redesign")]);
    act(() => composer.emit(EVENTS.VERSION_LIST_UPDATED));
    expect(result.current.versions).toEqual([v("v2", "Redesign")]);
  });

  it("delegates create/restore/delete to the manager", async () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));

    await act(() => result.current.createVersion("Pre-launch", "before publish"));
    expect(composer.versions.createVersion).toHaveBeenCalledWith("Pre-launch", "before publish");

    await act(() => result.current.restoreVersion("v9"));
    expect(composer.versions.restoreVersion).toHaveBeenCalledWith("v9");

    await act(() => result.current.deleteVersion("v9"));
    expect(composer.versions.deleteVersion).toHaveBeenCalledWith("v9");
  });

  it("getVersion looks up from the loaded list", () => {
    const composer = createMockComposer([v("a", "A"), v("b", "B")]);
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));

    expect(result.current.getVersion("b")).toEqual(v("b", "B"));
    expect(result.current.getVersion("zzz")).toBeUndefined();
  });

  it("compareVersions returns the manager's diff (null without composer)", async () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));

    const diff = await result.current.compareVersions("a", "b");
    expect(composer.versions.compareVersions).toHaveBeenCalledWith("a", "b");
    expect(diff).toEqual({ added: [], removed: [], modified: [] });

    const { result: nullResult } = renderHook(() => useVersionHistory(null));
    await expect(nullResult.current.compareVersions("a", "b")).resolves.toBeNull();
  });

  it("updateAiSummary patches the version's aiSummary", async () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useVersionHistory(asComposer(composer)));

    await act(() => result.current.updateAiSummary("v1", "Rebuilt the hero section"));
    expect(composer.versions.updateVersion).toHaveBeenCalledWith("v1", {
      aiSummary: "Rebuilt the hero section",
    });
  });

  it("unsubscribes VERSION_LIST_UPDATED on unmount", () => {
    const composer = createMockComposer();
    const { unmount } = renderHook(() => useVersionHistory(asComposer(composer)));
    expect(composer.listenerCount(EVENTS.VERSION_LIST_UPDATED)).toBe(1);
    unmount();
    expect(composer.listenerCount(EVENTS.VERSION_LIST_UPDATED)).toBe(0);
  });
});
