import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorModeIconCycle } from "../ColorModeIconCycle";
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
    dsLinter: { lint: vi.fn(() => []) },
  };
}

describe("ColorModeIconCycle (Topbar icon-cycle)", () => {
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

  it("renderTrigger slot receives onClick, ariaLabel and icon children", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(
      <ColorModeIconCycle
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
    // Icon SVG passed through children slot.
    expect(span.querySelector("svg")).toBeTruthy();
  });

  it("click cycles light → dark", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(
      <ColorModeIconCycle
        composer={composer as any}
        renderTrigger={({ onClick, ariaLabel, children }) => (
          <span role="button" data-testid="custom" onClick={onClick} aria-label={ariaLabel}>
            {children}
          </span>
        )}
      />
    );
    const span = container.querySelector('[data-testid="custom"]')!;
    fireEvent.click(span);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("dark");
  });

  it("click cycles dark → light", () => {
    const composer = makeFakeComposer("dark");
    const { container } = render(
      <ColorModeIconCycle
        composer={composer as any}
        renderTrigger={({ onClick, ariaLabel, children }) => (
          <span role="button" data-testid="custom" onClick={onClick} aria-label={ariaLabel}>
            {children}
          </span>
        )}
      />
    );
    const span = container.querySelector('[data-testid="custom"]')!;
    fireEvent.click(span);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("light");
  });

  it("cycle never enters system mode (spec D1)", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(
      <ColorModeIconCycle
        composer={composer as any}
        renderTrigger={({ onClick, ariaLabel, children }) => (
          <span role="button" data-testid="custom" onClick={onClick} aria-label={ariaLabel}>
            {children}
          </span>
        )}
      />
    );
    const span = container.querySelector('[data-testid="custom"]')!;
    fireEvent.click(span);
    fireEvent.click(span);
    fireEvent.click(span);
    fireEvent.click(span);
    const calls = (composer.colorMode.set as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(4);
    for (const call of calls) {
      expect(["light", "dark"]).toContain(call[0]);
    }
  });

  it("when composer auto-detects system on first load, first click lands on light", () => {
    const composer = makeFakeComposer("system");
    const { container } = render(
      <ColorModeIconCycle
        composer={composer as any}
        renderTrigger={({ onClick, ariaLabel, children }) => (
          <span role="button" data-testid="custom" onClick={onClick} aria-label={ariaLabel}>
            {children}
          </span>
        )}
      />
    );
    const span = container.querySelector('[data-testid="custom"]')!;
    fireEvent.click(span);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("light");
  });

  it("unsubscribes on unmount (via useColorMode)", () => {
    const composer = makeFakeComposer();
    const { unmount } = render(
      <ColorModeIconCycle
        composer={composer as any}
        renderTrigger={({ onClick, ariaLabel, children }) => (
          <span onClick={onClick} aria-label={ariaLabel}>{children}</span>
        )}
      />
    );
    unmount();
    expect(composer.off).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });
});
