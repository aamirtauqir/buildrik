import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorModeToggle } from "../ColorModeToggle";
import type { ThemeMode } from "../../types";

type Listener = (payload: unknown) => void;

function makeFakeComposer(initialMode: ThemeMode = "system") {
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
    dsLinter: { lint: vi.fn(() => []) },
  };
}

describe("ColorModeToggle", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false, media: q,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
        addListener: vi.fn(), removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders with current mode (system) and aria-label includes next mode", () => {
    const composer = makeFakeComposer("system");
    const { container } = render(<ColorModeToggle composer={composer as any} />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-label")).toContain("System");
    expect(btn.getAttribute("aria-label")).toContain("Light"); // next in cycle
  });

  it("cycles light → dark → system → light on repeated clicks", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(<ColorModeToggle composer={composer as any} />);
    const btn = container.querySelector("button")!;

    fireEvent.click(btn);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("dark");

    fireEvent.click(btn);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("system");

    fireEvent.click(btn);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("light");
  });

  it("subscribes to colorMode:changed and re-renders icon when mode flips externally", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(<ColorModeToggle composer={composer as any} />);
    const btn = container.querySelector("button")!;
    const initialLabel = btn.getAttribute("aria-label");

    // Simulate external set + emit (e.g., another component flipping mode).
    act(() => {
      composer.colorMode.set("dark");
    });

    const updated = container.querySelector("button")!.getAttribute("aria-label");
    expect(updated).not.toBe(initialLabel);
    expect(updated).toContain("Dark");
  });

  it("unsubscribes on unmount", () => {
    const composer = makeFakeComposer();
    const { unmount } = render(<ColorModeToggle composer={composer as any} />);
    unmount();
    expect(composer.off).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });

  it("renderTrigger prop overrides default button", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(
      <ColorModeToggle
        composer={composer as any}
        renderTrigger={({ onClick, ariaLabel, children }) => (
          <span role="button" data-testid="custom" onClick={onClick} aria-label={ariaLabel}>
            {children}
          </span>
        )}
      />
    );
    const span = container.querySelector('[data-testid="custom"]')!;
    expect(span).toBeTruthy();
    expect(span.getAttribute("aria-label")).toContain("Light");
  });
});
