/**
 * useCanvasSync — RAF-coalesced event sync.
 *
 * Locks the Codex editor audit P2 #10 fix: 12 subscribed composer events
 * collapse to one `elements.toHTML()` call per animation frame. The
 * imperative `syncFromComposer` returned from the hook stays synchronous
 * for keyboard callers (useCanvasKeyboard cut/paste/delete need an
 * immediate refresh).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasSync } from "../useCanvasSync";

function makeFakeComposer() {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  const toHTML = vi.fn(() => "<div>fake</div>");
  return {
    isReady: () => true,
    on(event: string, h: (p?: unknown) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(h);
    },
    off(event: string, h: (p?: unknown) => void) {
      listeners.get(event)?.delete(h);
    },
    emit(event: string) {
      listeners.get(event)?.forEach((h) => h());
    },
    elements: { toHTML },
    _toHTML: toHTML,
  };
}

describe("useCanvasSync — RAF coalescing", () => {
  let rafQueue: Array<() => void> = [];
  let rafId = 0;

  beforeEach(() => {
    rafQueue = [];
    rafId = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      rafId += 1;
      const id = rafId;
      rafQueue.push(() => cb());
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      rafQueue = [];
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushRaf() {
    const q = rafQueue;
    rafQueue = [];
    q.forEach((cb) => cb());
  }

  it("initial mount syncs immediately (no RAF) when composer is ready", () => {
    const composer = makeFakeComposer();
    renderHook(() => useCanvasSync({ composer: composer as never }));
    expect(composer._toHTML).toHaveBeenCalledTimes(1);
  });

  it("100 project:changed events collapse to one toHTML call per frame", () => {
    const composer = makeFakeComposer();
    renderHook(() => useCanvasSync({ composer: composer as never }));
    composer._toHTML.mockClear();

    act(() => {
      for (let i = 0; i < 100; i++) {
        composer.emit("project:changed");
      }
    });

    // Nothing yet — all 100 events deduped behind one pending RAF.
    expect(composer._toHTML).toHaveBeenCalledTimes(0);

    act(() => flushRaf());
    expect(composer._toHTML).toHaveBeenCalledTimes(1);
  });

  it("imperative syncFromComposer fires synchronously, bypasses RAF", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() =>
      useCanvasSync({ composer: composer as never }),
    );
    composer._toHTML.mockClear();

    act(() => result.current.syncFromComposer());

    expect(composer._toHTML).toHaveBeenCalledTimes(1);
    expect(rafQueue.length).toBe(0);
  });

  it("events across separate frames each get one sync", () => {
    const composer = makeFakeComposer();
    renderHook(() => useCanvasSync({ composer: composer as never }));
    composer._toHTML.mockClear();

    act(() => {
      // Two emits in the same frame collapse to one toHTML.
      composer.emit("project:changed");
      composer.emit("project:changed");
    });
    act(() => flushRaf());
    expect(composer._toHTML).toHaveBeenCalledTimes(1);

    act(() => {
      composer.emit("project:changed");
      composer.emit("project:changed");
    });
    act(() => flushRaf());
    expect(composer._toHTML).toHaveBeenCalledTimes(2);
  });

  it("unmount cancels pending RAF — no stale sync after teardown", () => {
    const composer = makeFakeComposer();
    const { unmount } = renderHook(() =>
      useCanvasSync({ composer: composer as never }),
    );
    composer._toHTML.mockClear();

    act(() => composer.emit("project:changed"));
    expect(rafQueue.length).toBe(1);

    unmount();
    act(() => flushRaf());
    expect(composer._toHTML).toHaveBeenCalledTimes(0);
  });
});
