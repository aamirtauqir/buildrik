import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import type { ProjectSettings } from "@/shared/types/project";
import { useSettingsScreen } from "./useSettingsScreen";

// Minimal mock Composer
const makeComposer = (settings: Partial<ProjectSettings> = {}) => {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    getProjectSettings: vi.fn(() => ({ seo: { siteName: "Test Site" }, ...settings })),
    on: vi.fn((event: string, cb: () => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    }),
    off: vi.fn((event: string, cb: () => void) => {
      listeners[event] = (listeners[event] ?? []).filter((fn) => fn !== cb);
    }),
    _emit: (event: string) => listeners[event]?.forEach((fn) => fn()),
  };
};

describe("useSettingsScreen", () => {
  it("loads initial value from composer on mount", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useSettingsScreen(composer as never, (s) => s.seo?.siteName ?? "", "")
    );
    expect(result.current.value).toBe("Test Site");
  });

  it("re-reads the value when SETTINGS_CHANGE fires (a Save the composer adopted)", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useSettingsScreen(composer as never, (s) => s.seo?.siteName ?? "", "")
    );
    composer.getProjectSettings.mockReturnValue({ seo: { siteName: "Renamed" } });
    act(() => composer._emit("settings:change"));
    expect(result.current.value).toBe("Renamed");
  });

  it("returns defaultValue when composer is null", () => {
    const { result } = renderHook(() =>
      useSettingsScreen(null, (s) => s.seo?.siteName ?? "", "fallback")
    );
    expect(result.current.value).toBe("fallback");
  });

  it("cleans up event listeners on unmount", () => {
    const composer = makeComposer();
    const { unmount } = renderHook(() =>
      useSettingsScreen(composer as never, (s) => s.seo?.siteName ?? "", "")
    );
    unmount();
    // React StrictMode runs effects twice in tests — off is called ≥2 times (once per cleanup cycle)
    expect(composer.off).toHaveBeenCalledWith(EVENTS.PROJECT_LOADED, expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith(EVENTS.SETTINGS_CHANGE, expect.any(Function));
  });
});
