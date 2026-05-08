import { describe, it, expect, beforeEach, vi } from "vitest";
import { ColorMode } from "../ColorMode";
import type { EventEmitter } from "../../EventEmitter";

function makeEvents(): EventEmitter & { emit: ReturnType<typeof vi.fn> } {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as EventEmitter & { emit: ReturnType<typeof vi.fn> };
}

describe("ColorMode", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("defaults to 'system' when no localStorage value", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    expect(cm.get()).toBe("system");
  });

  it("hydrates from localStorage 'buildrik:colorMode' if present", () => {
    localStorage.setItem("buildrik:colorMode", "dark");
    const events = makeEvents();
    const cm = new ColorMode(events);
    expect(cm.get()).toBe("dark");
  });

  it("ignores invalid localStorage value and falls back to 'system'", () => {
    localStorage.setItem("buildrik:colorMode", "neon");
    const events = makeEvents();
    const cm = new ColorMode(events);
    expect(cm.get()).toBe("system");
  });

  it("set() persists to localStorage and emits colorMode:changed", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("dark");
    expect(localStorage.getItem("buildrik:colorMode")).toBe("dark");
    expect(events.emit).toHaveBeenCalledWith("colorMode:changed", { mode: "dark", resolved: "dark" });
  });

  it("resolved() returns 'light' for mode='system' when matchMedia.matches is false", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("system");
    expect(cm.resolved()).toBe("light");
  });

  it("resolved() returns 'dark' for mode='system' when matchMedia.matches is true", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: true,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("system");
    expect(cm.resolved()).toBe("dark");
  });

  it("resolved() returns the explicit mode for non-system modes", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("dark");
    expect(cm.resolved()).toBe("dark");
    cm.set("light");
    expect(cm.resolved()).toBe("light");
  });

  it("matchMedia change in 'system' mode re-emits colorMode:changed with new resolved", () => {
    const listeners: Array<(e: { matches: boolean }) => void> = [];
    let matchesValue = false;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        get matches() { return matchesValue; },
        media: q,
        addEventListener: vi.fn((_evt: string, cb: any) => listeners.push(cb)),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("system");
    events.emit.mockClear();
    matchesValue = true;
    listeners.forEach((cb) => cb({ matches: true }));
    expect(events.emit).toHaveBeenCalledWith(
      "colorMode:changed",
      expect.objectContaining({ mode: "system", resolved: "dark" })
    );
  });
});
