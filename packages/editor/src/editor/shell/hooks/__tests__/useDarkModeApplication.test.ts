import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDarkModeApplication } from "../useDarkModeApplication";

type EventHandler = (...args: unknown[]) => void;
const handlers: Record<string, EventHandler[]> = {};

const makeMockComposer = () => ({
  on: vi.fn((event: string, h: EventHandler) => {
    if (!handlers[event]) handlers[event] = [];
    handlers[event].push(h);
  }),
  off: vi.fn((event: string, h: EventHandler) => {
    if (handlers[event]) handlers[event] = handlers[event].filter((x) => x !== h);
  }),
  emit: vi.fn((event: string, ...args: unknown[]) => {
    (handlers[event] ?? []).forEach((h) => h(...args));
  }),
  colorMode: {
    get: vi.fn(() => "light"),
    resolved: vi.fn(() => "light"),
  },
  darkResolver: {
    resolve: vi.fn((t: { value: string }) => t.value),
  },
  exportProject: vi.fn(() => ({ settings: { designTokens: [] } })),
});

beforeEach(() => {
  Object.keys(handlers).forEach((k) => delete handlers[k]);
  document.documentElement.removeAttribute("style");
});

describe("useDarkModeApplication", () => {
  it("subscribes to colorMode:changed on mount", () => {
    const composer = makeMockComposer();
    renderHook(() => useDarkModeApplication(composer as never));
    expect(composer.on).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });

  it("writes CSS vars on :root when colorMode flips to dark", () => {
    const composer = makeMockComposer();
    composer.exportProject.mockReturnValue({
      settings: {
        designTokens: [
          { id: "primary", name: "Primary", value: "#fff", category: "colors", cssVar: "--bd-primary", type: "color", darkValue: "#000" },
        ],
      },
    });
    composer.darkResolver.resolve.mockImplementation((t: { value: string; darkValue?: string }, mode: string) =>
      mode === "dark" && t.darkValue !== undefined ? t.darkValue : t.value
    );
    composer.colorMode.resolved.mockReturnValue("dark");

    renderHook(() => useDarkModeApplication(composer as never));
    composer.emit("colorMode:changed", { mode: "dark", resolved: "dark" });

    expect(document.documentElement.style.getPropertyValue("--bd-primary")).toBe("#000");
  });

  it("ignores non-color tokens (passthrough)", () => {
    const composer = makeMockComposer();
    composer.exportProject.mockReturnValue({
      settings: {
        designTokens: [
          { id: "space-md", name: "Medium", value: "16px", category: "spacing", cssVar: "--bd-space-md", type: "length" },
        ],
      },
    });
    composer.colorMode.resolved.mockReturnValue("dark");

    renderHook(() => useDarkModeApplication(composer as never));
    composer.emit("colorMode:changed", { mode: "dark", resolved: "dark" });

    expect(composer.darkResolver.resolve).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--bd-space-md")).toBe("");
  });
});
