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
});
