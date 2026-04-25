import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAIScope } from "../hooks/useAIScope";
import { EVENTS } from "../../../../../shared/constants/events";

interface FakeElement {
  getId: () => string;
  getType: () => string;
  getAttribute?: (name: string) => string | undefined;
}

function makeFakeElement(id: string, type: string, name?: string): FakeElement {
  return {
    getId: () => id,
    getType: () => type,
    getAttribute: (n: string) => (n === "aria-label" ? name : undefined),
  };
}

function makeComposer() {
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  const composer = {
    on(evt: string, fn: (...a: unknown[]) => void) {
      if (!handlers.has(evt)) handlers.set(evt, new Set());
      handlers.get(evt)!.add(fn);
      return composer;
    },
    off(evt: string, fn: (...a: unknown[]) => void) {
      handlers.get(evt)?.delete(fn);
      return composer;
    },
    emit(evt: string, ...args: unknown[]) {
      for (const fn of handlers.get(evt) ?? []) fn(...args);
      return composer;
    },
  };
  return composer;
}

describe("useAIScope", () => {
  let composer: ReturnType<typeof makeComposer>;
  beforeEach(() => { composer = makeComposer(); });

  it("starts in idle state with whole-page scope when nothing is selected", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    expect(result.current.status).toBe("idle");
    expect(result.current.scope.kind).toBe("page");
  });

  it("auto-tracks element selection and uses aria-label as label when present", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => {
      composer.emit(EVENTS.ELEMENT_SELECTED, makeFakeElement("el-1", "text", "Hero"));
    });
    expect(result.current.scope.kind).toBe("element");
    if (result.current.scope.kind === "element") {
      expect(result.current.scope.id).toBe("el-1");
      expect(result.current.scope.label).toBe("Hero");
    }
  });

  it("falls back to element type when name attribute missing", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => {
      composer.emit(EVENTS.ELEMENT_SELECTED, makeFakeElement("el-2", "section"));
    });
    if (result.current.scope.kind === "element") {
      expect(result.current.scope.label).toBe("section");
    }
  });

  it("transitions to multi scope from selection:multiple Element[] payload", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => {
      composer.emit(EVENTS.SELECTION_MULTIPLE, [
        makeFakeElement("a", "text"),
        makeFakeElement("b", "text"),
        makeFakeElement("c", "text"),
      ]);
    });
    expect(result.current.scope.kind).toBe("multi");
    if (result.current.scope.kind === "multi") expect(result.current.scope.count).toBe(3);
  });

  it("returns to page scope on element:deselected", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => {
      composer.emit(EVENTS.ELEMENT_SELECTED, makeFakeElement("el-1", "text", "Hero"));
    });
    act(() => {
      composer.emit(EVENTS.ELEMENT_DESELECTED);
    });
    expect(result.current.scope.kind).toBe("page");
  });

  it("locks scope on lock() and ignores selection events while locked", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => {
      composer.emit(EVENTS.ELEMENT_SELECTED, makeFakeElement("el-1", "text", "Hero"));
    });
    act(() => { result.current.lock(); });
    expect(result.current.status).toBe("locked");
    act(() => {
      composer.emit(EVENTS.ELEMENT_SELECTED, makeFakeElement("el-2", "text", "Footer"));
    });
    if (result.current.scope.kind === "element") {
      expect(result.current.scope.id).toBe("el-1");
    }
  });

  it("unlock() resumes auto-tracking", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => {
      composer.emit(EVENTS.ELEMENT_SELECTED, makeFakeElement("el-1", "text", "Hero"));
    });
    act(() => { result.current.lock(); });
    act(() => { result.current.unlock(); });
    expect(result.current.status).toBe("idle");
    act(() => {
      composer.emit(EVENTS.ELEMENT_SELECTED, makeFakeElement("el-2", "text", "Footer"));
    });
    if (result.current.scope.kind === "element") {
      expect(result.current.scope.id).toBe("el-2");
    }
  });
});
