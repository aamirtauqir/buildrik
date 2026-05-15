import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useColorMode } from "../useColorMode";
import type { ThemeMode } from "../../types";

type Listener = (payload: unknown) => void;

function makeFakeComposer(initialMode: ThemeMode = "light") {
  let mode: ThemeMode = initialMode;
  const listeners = new Map<string, Listener[]>();
  const colorMode = {
    get: vi.fn(() => mode),
    set: vi.fn((next: ThemeMode) => {
      mode = next;
      (listeners.get("colorMode:changed") ?? []).forEach((cb) =>
        cb({ mode: next, resolved: next === "system" ? "light" : next })
      );
    }),
    resolved: vi.fn(() => (mode === "system" ? "light" : mode) as "light" | "dark"),
  };
  return {
    on: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      arr.push(cb);
      listeners.set(evt, arr);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      listeners.set(evt, arr.filter((x) => x !== cb));
    }),
    colorMode,
  };
}

describe("useColorMode", () => {
  it("returns initial mode from composer.colorMode.get()", () => {
    const composer = makeFakeComposer("dark");
    const { result } = renderHook(() => useColorMode(composer as any));
    expect(result.current).toBe("dark");
  });

  it("subscribes to colorMode:changed on mount", () => {
    const composer = makeFakeComposer("light");
    renderHook(() => useColorMode(composer as any));
    expect(composer.on).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });

  it("updates returned value when composer.colorMode.set fires the event", () => {
    const composer = makeFakeComposer("light");
    const { result } = renderHook(() => useColorMode(composer as any));
    expect(result.current).toBe("light");
    act(() => {
      composer.colorMode.set("dark");
    });
    expect(result.current).toBe("dark");
  });

  it("unsubscribes on unmount", () => {
    const composer = makeFakeComposer("light");
    const { unmount } = renderHook(() => useColorMode(composer as any));
    unmount();
    expect(composer.off).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });
});
