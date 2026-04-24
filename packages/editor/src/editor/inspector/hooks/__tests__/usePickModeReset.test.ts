import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePickModeReset } from "../usePickModeReset";

function makeComposer() {
  const listeners = new Map<string, (p?: unknown) => void>();
  return {
    on: vi.fn((evt: string, cb: (p?: unknown) => void) => { listeners.set(evt, cb); }),
    off: vi.fn((evt: string) => { listeners.delete(evt); }),
    _fire: (evt: string, p?: unknown) => listeners.get(evt)?.(p),
  } as any;
}

describe("usePickModeReset — canvas → inspector event contract", () => {
  it("subscribes to inspector:pick-result + inspector:pick-cancel on mount", () => {
    const composer = makeComposer();
    const setPickActive = vi.fn();
    renderHook(() => usePickModeReset(composer, setPickActive));
    expect(composer.on).toHaveBeenCalledWith("inspector:pick-result", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("inspector:pick-cancel", expect.any(Function));
  });

  it("clears pickActive when inspector:pick-result fires", () => {
    const composer = makeComposer();
    const setPickActive = vi.fn();
    renderHook(() => usePickModeReset(composer, setPickActive));
    composer._fire("inspector:pick-result", "e1");
    expect(setPickActive).toHaveBeenCalledWith(false);
  });

  it("clears pickActive when inspector:pick-cancel fires", () => {
    const composer = makeComposer();
    const setPickActive = vi.fn();
    renderHook(() => usePickModeReset(composer, setPickActive));
    composer._fire("inspector:pick-cancel");
    expect(setPickActive).toHaveBeenCalledWith(false);
  });

  it("unsubscribes on unmount (no zombie listeners)", () => {
    const composer = makeComposer();
    const setPickActive = vi.fn();
    const { unmount } = renderHook(() => usePickModeReset(composer, setPickActive));
    unmount();
    expect(composer.off).toHaveBeenCalledWith("inspector:pick-result", expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith("inspector:pick-cancel", expect.any(Function));
  });

  it("is a noop when composer is null", () => {
    const setPickActive = vi.fn();
    const { unmount } = renderHook(() => usePickModeReset(null, setPickActive));
    unmount();
    expect(setPickActive).not.toHaveBeenCalled();
  });
});
