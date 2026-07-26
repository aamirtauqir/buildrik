import { render, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/ui";

type Listener = (payload: unknown) => void;

function makeFakeComposer(initialResolved: "light" | "dark" = "light") {
  let resolved: "light" | "dark" = initialResolved;
  const settings: Record<string, unknown> = {
    designTokens: [],
    designTokensSchemaVersion: 2,
  };
  const handlers = new Map<string, Set<Listener>>();
  const colorMode = {
    get: vi.fn(() => resolved),
    set: vi.fn((next: "light" | "dark") => {
      resolved = next;
      (handlers.get("colorMode:changed") ?? new Set()).forEach((cb) =>
        cb({ mode: next, resolved: next }),
      );
    }),
    resolved: vi.fn(() => resolved),
  };
  return {
    getProjectSettings: () => settings,
    setProjectSettings: (next: Record<string, unknown>) => Object.assign(settings, next),
    on: vi.fn((evt: string, cb: Listener) => {
      if (!handlers.has(evt)) handlers.set(evt, new Set());
      handlers.get(evt)!.add(cb);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      handlers.get(evt)?.delete(cb);
    }),
    colorMode,
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
    settings,
    _handlers: handlers,
  };
}

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId="dark-preview-test">
        <StylePresetRegistryProvider projectId="dark-preview-test">
          {ui}
        </StylePresetRegistryProvider>
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
  if (!(document as Document & { fonts?: unknown }).fonts) {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { load: () => Promise.resolve([]) },
    });
  }
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

describe("DesignSystemTab dark preview chrome (T10)", () => {
  test("initial light mode: wrapper has data-ds-preview='light'", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    const wrapper = container.querySelector("[data-ds-preview]");
    expect(wrapper).toBeTruthy();
    expect(wrapper!.getAttribute("data-ds-preview")).toBe("light");
  });

  test("initial dark mode: wrapper has data-ds-preview='dark'", () => {
    const composer = makeFakeComposer("dark");
    const { container } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    const wrapper = container.querySelector("[data-ds-preview]");
    expect(wrapper).toBeTruthy();
    expect(wrapper!.getAttribute("data-ds-preview")).toBe("dark");
  });

  test("colorMode:changed light→dark: attribute flips", () => {
    const composer = makeFakeComposer("light");
    const { container } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    const wrapper = container.querySelector("[data-ds-preview]")!;
    expect(wrapper.getAttribute("data-ds-preview")).toBe("light");

    act(() => {
      composer.colorMode.set("dark");
    });

    expect(wrapper.getAttribute("data-ds-preview")).toBe("dark");
  });

  test("unsubscribes on unmount", () => {
    const composer = makeFakeComposer("light");
    const { unmount } = render(
      wrap(<DesignSystemTab composer={composer as never} />),
    );
    unmount();
    expect(composer.off).toHaveBeenCalledWith(
      "colorMode:changed",
      expect.any(Function),
    );
  });
});
