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

describe("ColorModeToggle (2-pill seg)", () => {
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

  it("renders a role=tablist container with aria-label 'Color mode'", () => {
    const composer = makeFakeComposer("light");
    const { getByRole } = render(<ColorModeToggle composer={composer as any} />);
    const tablist = getByRole("tablist");
    expect(tablist.getAttribute("aria-label")).toBe("Color mode");
  });

  it("renders exactly 2 tabs with role=tab", () => {
    const composer = makeFakeComposer("light");
    const { getAllByRole } = render(<ColorModeToggle composer={composer as any} />);
    const tabs = getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent).toBe("Light");
    expect(tabs[1].textContent).toBe("Dark");
  });

  it("when resolved=light, Light tab has aria-selected=true and Dark is false", () => {
    const composer = makeFakeComposer("light");
    const { getAllByRole } = render(<ColorModeToggle composer={composer as any} />);
    const [lightTab, darkTab] = getAllByRole("tab");
    expect(lightTab.getAttribute("aria-selected")).toBe("true");
    expect(darkTab.getAttribute("aria-selected")).toBe("false");
  });

  it("when resolved=dark, Dark tab has aria-selected=true and Light is false", () => {
    const composer = makeFakeComposer("dark");
    const { getAllByRole } = render(<ColorModeToggle composer={composer as any} />);
    const [lightTab, darkTab] = getAllByRole("tab");
    expect(lightTab.getAttribute("aria-selected")).toBe("false");
    expect(darkTab.getAttribute("aria-selected")).toBe("true");
  });

  it("when stored mode=system, resolved() decides which pill is active", () => {
    const composer = makeFakeComposer("system");
    // resolved() defaults to "light" when system since matchMedia is mocked false
    const { getAllByRole } = render(<ColorModeToggle composer={composer as any} />);
    const [lightTab, darkTab] = getAllByRole("tab");
    expect(lightTab.getAttribute("aria-selected")).toBe("true");
    expect(darkTab.getAttribute("aria-selected")).toBe("false");
  });

  it("click [Light] calls composer.colorMode.set('light')", () => {
    const composer = makeFakeComposer("dark");
    const { getAllByRole } = render(<ColorModeToggle composer={composer as any} />);
    const [lightTab] = getAllByRole("tab");
    fireEvent.click(lightTab);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("light");
  });

  it("click [Dark] calls composer.colorMode.set('dark')", () => {
    const composer = makeFakeComposer("light");
    const { getAllByRole } = render(<ColorModeToggle composer={composer as any} />);
    const [, darkTab] = getAllByRole("tab");
    fireEvent.click(darkTab);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("dark");
  });

  it("after colorMode:changed external emit, active pill swaps to new resolved mode", () => {
    const composer = makeFakeComposer("light");
    const { getAllByRole } = render(<ColorModeToggle composer={composer as any} />);
    let [lightTab, darkTab] = getAllByRole("tab");
    expect(lightTab.getAttribute("aria-selected")).toBe("true");
    expect(darkTab.getAttribute("aria-selected")).toBe("false");

    // Simulate external set + emit (e.g., another component flipping mode).
    act(() => {
      composer.colorMode.set("dark");
    });

    [lightTab, darkTab] = getAllByRole("tab");
    expect(lightTab.getAttribute("aria-selected")).toBe("false");
    expect(darkTab.getAttribute("aria-selected")).toBe("true");
  });

  it("unsubscribes on unmount", () => {
    const composer = makeFakeComposer();
    const { unmount } = render(<ColorModeToggle composer={composer as any} />);
    unmount();
    expect(composer.off).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });

  it("renderTrigger prop (legacy Topbar slot) bypasses seg and renders icon-cycle button", () => {
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
    // No tablist should render when renderTrigger is provided.
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    // Click cycles light → dark (legacy behavior).
    fireEvent.click(span);
    expect(composer.colorMode.set).toHaveBeenLastCalledWith("dark");
  });

  it("renderTrigger cycle never enters system mode (spec D1)", () => {
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
    // Click 4 times to verify the cycle never lands on system.
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
});
