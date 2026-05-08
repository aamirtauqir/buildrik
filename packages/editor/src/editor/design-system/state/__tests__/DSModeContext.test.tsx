import { render, act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { DSModeProvider, useDSMode, useDSModeOptional } from "../DSModeContext";

const STORAGE_KEY = "buildrik:ds-mode";

function wrap({ children }: { children: React.ReactNode }) {
  return <DSModeProvider>{children}</DSModeProvider>;
}

describe("DSModeContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to 'beginner' when no value is persisted", () => {
    const { result } = renderHook(() => useDSMode(), { wrapper: wrap });
    expect(result.current.mode).toBe("beginner");
    expect(result.current.isBeginner).toBe(true);
    expect(result.current.isPro).toBe(false);
  });

  it("hydrates from localStorage when 'pro' is persisted", () => {
    localStorage.setItem(STORAGE_KEY, "pro");
    const { result } = renderHook(() => useDSMode(), { wrapper: wrap });
    expect(result.current.mode).toBe("pro");
    expect(result.current.isPro).toBe(true);
  });

  it("setMode updates state and writes to localStorage", () => {
    const { result } = renderHook(() => useDSMode(), { wrapper: wrap });

    act(() => {
      result.current.setMode("pro");
    });

    expect(result.current.mode).toBe("pro");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("pro");
  });

  it("toggle flips beginner ⇄ pro and persists", () => {
    const { result } = renderHook(() => useDSMode(), { wrapper: wrap });

    act(() => {
      result.current.toggle();
    });
    expect(result.current.mode).toBe("pro");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("pro");

    act(() => {
      result.current.toggle();
    });
    expect(result.current.mode).toBe("beginner");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("beginner");
  });

  it("initialMode prop overrides persisted value (test-only escape hatch)", () => {
    localStorage.setItem(STORAGE_KEY, "pro");
    const { result } = renderHook(() => useDSMode(), {
      wrapper: ({ children }) => <DSModeProvider initialMode="beginner">{children}</DSModeProvider>,
    });
    expect(result.current.mode).toBe("beginner");
  });

  it("useDSMode throws when used outside provider", () => {
    const Probe = () => {
      useDSMode();
      return null;
    };
    expect(() => render(<Probe />)).toThrow(/useDSMode must be used within DSModeProvider/);
  });

  it("useDSModeOptional returns null outside provider", () => {
    const { result } = renderHook(() => useDSModeOptional());
    expect(result.current).toBeNull();
  });

  it("useDSModeOptional returns context inside provider", () => {
    const { result } = renderHook(() => useDSModeOptional(), { wrapper: wrap });
    expect(result.current).not.toBeNull();
    expect(result.current?.mode).toBe("beginner");
  });

  it("falls back to 'beginner' when localStorage is corrupt or unreadable", () => {
    // Garbage value stored under our key — should not be treated as a valid mode.
    localStorage.setItem(STORAGE_KEY, "not-a-mode");
    const { result } = renderHook(() => useDSMode(), { wrapper: wrap });
    expect(result.current.mode).toBe("beginner");
  });
});
