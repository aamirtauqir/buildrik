/**
 * useElementFlash tests — flash-class lifecycle on ELEMENT_CREATED /
 * ELEMENT_DUPLICATED with a synchronous rAF stub and fake timers.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useElementFlash } from "../useElementFlash";
import { EVENTS } from "../../constants/events";
import type { Composer } from "../../../engine";

const FLASH_CLASS = "buildrick-element-flash";

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
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
  };
}

const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

function mountCanvasElement(id: string): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", id);
  document.body.appendChild(el);
  return el;
}

describe("useElementFlash", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Run rAF callbacks synchronously so the flash applies inside act().
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("flashes the created element and removes the class after 500ms", () => {
    const composer = createMockComposer();
    const el = mountCanvasElement("el-1");
    renderHook(() => useElementFlash(asComposer(composer)));

    act(() => composer.emit(EVENTS.ELEMENT_CREATED, { id: "el-1" }));
    expect(el.classList.contains(FLASH_CLASS)).toBe(true);

    act(() => vi.advanceTimersByTime(500));
    expect(el.classList.contains(FLASH_CLASS)).toBe(false);
  });

  it("flashes the duplicate via newElement.id, falling back to id", () => {
    const composer = createMockComposer();
    const copy = mountCanvasElement("copy-1");
    const fallback = mountCanvasElement("orig-1");
    renderHook(() => useElementFlash(asComposer(composer)));

    act(() => composer.emit(EVENTS.ELEMENT_DUPLICATED, { newElement: { id: "copy-1" } }));
    expect(copy.classList.contains(FLASH_CLASS)).toBe(true);

    act(() => composer.emit(EVENTS.ELEMENT_DUPLICATED, { id: "orig-1" }));
    expect(fallback.classList.contains(FLASH_CLASS)).toBe(true);
  });

  it("ignores events without an id and elements missing from the DOM", () => {
    const composer = createMockComposer();
    renderHook(() => useElementFlash(asComposer(composer)));

    expect(() => {
      act(() => composer.emit(EVENTS.ELEMENT_CREATED, {}));
      act(() => composer.emit(EVENTS.ELEMENT_CREATED, { id: "not-in-dom" }));
      act(() => composer.emit(EVENTS.ELEMENT_DUPLICATED, {}));
    }).not.toThrow();
  });

  it("unsubscribes both events on unmount", () => {
    const composer = createMockComposer();
    const { unmount } = renderHook(() => useElementFlash(asComposer(composer)));

    expect(composer.listenerCount(EVENTS.ELEMENT_CREATED)).toBe(1);
    expect(composer.listenerCount(EVENTS.ELEMENT_DUPLICATED)).toBe(1);
    unmount();
    expect(composer.listenerCount(EVENTS.ELEMENT_CREATED)).toBe(0);
    expect(composer.listenerCount(EVENTS.ELEMENT_DUPLICATED)).toBe(0);
  });
});
