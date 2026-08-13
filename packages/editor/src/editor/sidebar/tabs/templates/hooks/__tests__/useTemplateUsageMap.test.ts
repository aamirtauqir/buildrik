// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTemplateUsageMap } from "../useTemplateUsageMap";
import { EVENTS } from "../../../../../../shared/constants/events";

type Listener = (payload: unknown) => void;

function makeFakeComposer(initialPages: any[] = []) {
  const listeners = new Map<string, Listener[]>();
  let pages = initialPages;
  return {
    setPages(next: any[]) {
      pages = next;
    },
    on: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      arr.push(cb);
      listeners.set(evt, arr);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      listeners.set(evt, arr.filter((x) => x !== cb));
    }),
    emit: (evt: string, payload?: unknown) => {
      (listeners.get(evt) ?? []).forEach((c) => c(payload));
    },
    elements: {
      getAllPages: () => pages,
    },
  };
}

describe("useTemplateUsageMap", () => {
  it("returns empty when composer is null", () => {
    const { result } = renderHook(() => useTemplateUsageMap(null));
    expect(result.current.has("t1")).toBe(false);
    expect(result.current.get("t1")).toEqual([]);
    expect(result.current.raw.size).toBe(0);
  });

  it("builds map on mount from getAllPages()", () => {
    const composer = makeFakeComposer([
      {
        id: "p1",
        name: "Home",
        meta: { appliedTemplates: [{ templateId: "t1", appliedAt: "2026-05-08T10:00:00Z" }] },
      },
    ]);
    const { result } = renderHook(() => useTemplateUsageMap(composer as any));
    expect(result.current.has("t1")).toBe(true);
    expect(result.current.get("t1")).toHaveLength(1);
    expect(result.current.get("t1")[0].pageName).toBe("Home");
  });

  it("invalidates on TEMPLATE_APPLIED", () => {
    const composer = makeFakeComposer([]);
    const { result } = renderHook(() => useTemplateUsageMap(composer as any));
    expect(result.current.has("t1")).toBe(false);

    composer.setPages([
      {
        id: "p1",
        name: "Home",
        meta: { appliedTemplates: [{ templateId: "t1", appliedAt: "2026-05-08T10:00:00Z" }] },
      },
    ]);
    act(() => {
      composer.emit(EVENTS.TEMPLATE_APPLIED, { templateId: "t1", pageId: "p1" });
    });
    expect(result.current.has("t1")).toBe(true);
  });

  it("invalidates on TEMPLATE_REMOVED", () => {
    const composer = makeFakeComposer([
      {
        id: "p1",
        name: "Home",
        meta: { appliedTemplates: [{ templateId: "t1", appliedAt: "2026-05-08T10:00:00Z" }] },
      },
    ]);
    const { result } = renderHook(() => useTemplateUsageMap(composer as any));
    expect(result.current.has("t1")).toBe(true);

    composer.setPages([{ id: "p1", name: "Home", meta: { appliedTemplates: [] } }]);
    act(() => {
      composer.emit(EVENTS.TEMPLATE_REMOVED, { templateId: "t1", pageId: "p1" });
    });
    expect(result.current.has("t1")).toBe(false);
  });

  /* Asserted a subscription to PAGE_CREATED — a name the engine never emits;
     PROJECT_CHANGED carries "page:created". Fifth test this walk found
     pinning a dead listener. */
  it("invalidates on template events + PROJECT_CHANGED", () => {
    const composer = makeFakeComposer([]);
    renderHook(() => useTemplateUsageMap(composer as any));
    const subscribed = composer.on.mock.calls.map((c) => c[0]);
    expect(subscribed).toContain(EVENTS.TEMPLATE_APPLIED);
    expect(subscribed).toContain(EVENTS.TEMPLATE_REMOVED);
    expect(subscribed).toContain(EVENTS.PROJECT_CHANGED);
  });

  it("unsubscribes all listeners on unmount", () => {
    const composer = makeFakeComposer([]);
    const { unmount } = renderHook(() => useTemplateUsageMap(composer as any));
    unmount();
    const offCalls = composer.off.mock.calls.map((c) => c[0]);
    expect(offCalls).toContain(EVENTS.TEMPLATE_APPLIED);
    expect(offCalls).toContain(EVENTS.TEMPLATE_REMOVED);
    expect(offCalls).toContain(EVENTS.PROJECT_CHANGED);
  });
});
