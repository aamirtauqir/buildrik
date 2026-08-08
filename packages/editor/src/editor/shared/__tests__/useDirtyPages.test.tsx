/**
 * useDirtyPages — the per-page unsaved-edit signal both the tab bar (435:2368)
 * and the Pages tree (140:21 / 1171:4729) draw a dot from.
 *
 * The tracking used to live inside PageTabBar, so the tree could not read it
 * and the tree's dot was deferred as "no per-page unsaved-state source". There
 * was one; it just was not shared. These tests pin the contract so the next
 * surface that needs it does not re-invent a second copy.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDirtyPages } from "../useDirtyPages";
import { EVENTS } from "@/shared/constants";
import type { Composer } from "@/engine";

/** Minimal composer: a real event registry + a settable active page. */
function makeComposer(activePageId: string | null = "p1") {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  let active = activePageId;
  const composer = {
    on: (ev: string, fn: (p?: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn),
    emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
    elements: { getActivePage: () => (active ? { id: active } : null) },
    setActive: (id: string | null) => {
      active = id;
    },
  };
  return composer as unknown as Composer & { emit(ev: string): void; setActive(id: string | null): void };
}

describe("useDirtyPages", () => {
  it("starts clean", () => {
    const { result } = renderHook(() => useDirtyPages(makeComposer()));
    expect(result.current.size).toBe(0);
  });

  it("an element edit marks the ACTIVE page dirty", () => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.ELEMENT_UPDATED));
    expect(result.current.has("p1")).toBe(true);
    expect(result.current.size).toBe(1);
  });

  it("editing on a second page marks that one too, not instead", () => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.ELEMENT_UPDATED));
    act(() => {
      composer.setActive("p2");
      composer.emit(EVENTS.ELEMENT_DELETED);
    });
    expect(result.current.has("p1")).toBe(true);
    expect(result.current.has("p2")).toBe(true);
  });

  it("a project save clears every page", () => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.ELEMENT_UPDATED));
    act(() => composer.emit(EVENTS.PROJECT_SAVED));
    expect(result.current.size).toBe(0);
  });

  it("edits with no active page are ignored, not crashed on", () => {
    const composer = makeComposer(null);
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.ELEMENT_UPDATED));
    expect(result.current.size).toBe(0);
  });

  it("unsubscribes on unmount — a late event cannot set state on a dead hook", () => {
    const composer = makeComposer("p1");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => useDirtyPages(composer));
    unmount();
    act(() => composer.emit(EVENTS.ELEMENT_UPDATED));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("null composer is inert", () => {
    const { result } = renderHook(() => useDirtyPages(null));
    expect(result.current.size).toBe(0);
  });
});
