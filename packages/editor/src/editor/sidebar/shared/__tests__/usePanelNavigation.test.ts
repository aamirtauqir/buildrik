/**
 * usePanelNavigation.test.ts — drill-in navigation stack + persistence.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelNavigation, type NavigationScreen } from "../usePanelNavigation";

const screens: NavigationScreen[] = [
  { id: "home", title: "Build" },
  { id: "elements", title: "Elements", parentId: "home" },
  { id: "templates", title: "Templates", parentId: "home" },
  { id: "buttons", title: "Buttons", parentId: "elements" },
];

const STORAGE_KEY = "buildrick-nav-test-panel";

function setup(opts: Partial<Parameters<typeof usePanelNavigation>[0]> = {}) {
  return renderHook(() =>
    usePanelNavigation({ storageKey: "test-panel", screens, ...opts })
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("usePanelNavigation — initial screen", () => {
  it("starts at the parentless home screen by default", () => {
    const { result } = setup();
    expect(result.current.currentScreen).toBe("home");
    expect(result.current.canGoBack).toBe(false);
  });

  it("respects defaultScreen when provided", () => {
    const { result } = setup({ defaultScreen: "elements" });
    expect(result.current.currentScreen).toBe("elements");
  });

  it("restores a persisted screen from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentScreen: "templates" }));
    const { result } = setup();
    expect(result.current.currentScreen).toBe("templates");
  });

  it("ignores a persisted screen that no longer exists", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentScreen: "deleted-screen" }));
    const { result } = setup();
    expect(result.current.currentScreen).toBe("home");
  });

  it("ignores corrupt persisted JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    const { result } = setup();
    expect(result.current.currentScreen).toBe("home");
  });
});

describe("usePanelNavigation — navigation", () => {
  it("navigateTo moves to a known screen and fires onNavigate", () => {
    const onNavigate = vi.fn();
    const { result } = setup({ onNavigate });
    act(() => result.current.navigateTo("elements"));
    expect(result.current.currentScreen).toBe("elements");
    expect(result.current.canGoBack).toBe(true);
    expect(onNavigate).toHaveBeenCalledWith("elements");
  });

  it("navigateTo with an unknown id is a no-op", () => {
    const onNavigate = vi.fn();
    const { result } = setup({ onNavigate });
    act(() => result.current.navigateTo("nope"));
    expect(result.current.currentScreen).toBe("home");
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("goBack pops to the parent screen", () => {
    const { result } = setup();
    act(() => result.current.navigateTo("buttons"));
    act(() => result.current.goBack());
    expect(result.current.currentScreen).toBe("elements");
    act(() => result.current.goBack());
    expect(result.current.currentScreen).toBe("home");
  });

  it("goBack at root is a no-op", () => {
    const onNavigate = vi.fn();
    const { result } = setup({ onNavigate });
    act(() => result.current.goBack());
    expect(result.current.currentScreen).toBe("home");
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("goHome jumps straight to the root from a deep screen", () => {
    const { result } = setup();
    act(() => result.current.navigateTo("buttons"));
    act(() => result.current.goHome());
    expect(result.current.currentScreen).toBe("home");
  });

  it("exposes current and parent screen configs", () => {
    const { result } = setup();
    act(() => result.current.navigateTo("buttons"));
    expect(result.current.currentScreenConfig?.title).toBe("Buttons");
    expect(result.current.parentScreenConfig?.id).toBe("elements");
  });
});

describe("usePanelNavigation — breadcrumb", () => {
  it("builds the full ancestor path root-first", () => {
    const { result } = setup();
    act(() => result.current.navigateTo("buttons"));
    expect(result.current.breadcrumb).toEqual(["Build", "Elements", "Buttons"]);
  });

  it("is just the root title at home", () => {
    const { result } = setup();
    expect(result.current.breadcrumb).toEqual(["Build"]);
  });
});

describe("usePanelNavigation — persistence", () => {
  it("persists the current screen to localStorage on change", () => {
    const { result } = setup();
    act(() => result.current.navigateTo("templates"));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      currentScreen: "templates",
    });
  });

  it("round-trips across unmount/remount", () => {
    const first = setup();
    act(() => first.result.current.navigateTo("elements"));
    first.unmount();

    const second = setup();
    expect(second.result.current.currentScreen).toBe("elements");
  });
});
