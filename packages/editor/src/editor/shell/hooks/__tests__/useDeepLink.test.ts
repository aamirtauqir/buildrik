/**
 * `?el=` opens the editor with that element selected — the consuming half of
 * the Layers menu's "Copy link" (board 1082:4527).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { EVENTS } from "../../../../shared/constants";
import { useDeepLink } from "../useDeepLink";

function fakeComposer({ activePageId = "p1", hasElement = true } = {}) {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  const el = { getId: () => "el-1" };
  return {
    on: (e: string, h: (p?: unknown) => void) => { (handlers.get(e) ?? handlers.set(e, new Set()).get(e))!.add(h); },
    off: (e: string, h: (p?: unknown) => void) => handlers.get(e)?.delete(h),
    emit: (e: string, p?: unknown) => handlers.get(e)?.forEach((h) => h(p)),
    elements: {
      getActivePage: () => ({ id: activePageId }),
      setActivePage: vi.fn(),
      getElement: (id: string) => (hasElement && id === "el-1" ? el : null),
    },
    selection: { select: vi.fn() },
  };
}

const setUrl = (search: string) => {
  window.history.replaceState(null, "", `/edit/site-1${search}`);
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); setUrl(""); });

describe("useDeepLink", () => {
  it("selects the linked element once the project has loaded", () => {
    setUrl("?el=el-1&page=p2");
    const c = fakeComposer();
    renderHook(() => useDeepLink(c as never));
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => vi.advanceTimersByTime(100));
    // Page first — the registry only holds the active page.
    expect(c.elements.setActivePage).toHaveBeenCalledWith("p2");
    expect(c.selection.select).toHaveBeenCalledOnce();
  });

  it("skips the page switch when the link is to the active page", () => {
    setUrl("?el=el-1&page=p1");
    const c = fakeComposer();
    renderHook(() => useDeepLink(c as never));
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => vi.advanceTimersByTime(100));
    expect(c.elements.setActivePage).not.toHaveBeenCalled();
    expect(c.selection.select).toHaveBeenCalledOnce();
  });

  it("the importing:true half of PROJECT_LOADED is not the load", () => {
    // importProject emits twice; the first fires before the tree exists.
    setUrl("?el=el-1");
    const c = fakeComposer();
    renderHook(() => useDeepLink(c as never));
    act(() => c.emit(EVENTS.PROJECT_LOADED, { importing: true }));
    act(() => vi.advanceTimersByTime(100));
    expect(c.selection.select).not.toHaveBeenCalled();
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => vi.advanceTimersByTime(100));
    expect(c.selection.select).toHaveBeenCalledOnce();
  });

  it("a deleted element degrades to nothing, not a crash", () => {
    // The link outlives the element; the editor still opens.
    setUrl("?el=el-1");
    const c = fakeComposer({ hasElement: false });
    renderHook(() => useDeepLink(c as never));
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => vi.advanceTimersByTime(100));
    expect(c.selection.select).not.toHaveBeenCalled();
  });

  it("without ?el= it does nothing at all", () => {
    setUrl("?siteId=x");
    const c = fakeComposer();
    renderHook(() => useDeepLink(c as never));
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => vi.advanceTimersByTime(100));
    expect(c.selection.select).not.toHaveBeenCalled();
  });

  it("fires once — a later reload event does not re-hijack the selection", () => {
    setUrl("?el=el-1");
    const c = fakeComposer();
    renderHook(() => useDeepLink(c as never));
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => vi.advanceTimersByTime(100));
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => vi.advanceTimersByTime(100));
    expect(c.selection.select).toHaveBeenCalledOnce();
  });
});
