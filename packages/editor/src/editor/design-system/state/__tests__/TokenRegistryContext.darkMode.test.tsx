import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { TokenRegistryProvider } from "../TokenRegistryContext";

type Listener = (payload: unknown) => void;

function makeFakeComposer() {
  const listeners = new Map<string, Listener[]>();
  const colorMode = {
    get: vi.fn(() => "dark"),
    set: vi.fn(),
    resolved: vi.fn(() => "dark" as "light" | "dark"),
  };
  const darkResolver = {
    resolve: vi.fn((token: { value: string; darkValue?: string }, mode: "light" | "dark") =>
      mode === "dark" && token.darkValue !== undefined ? token.darkValue : token.value
    ),
    resolveAll: vi.fn(),
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
    emit: vi.fn((evt: string, payload?: unknown) => {
      (listeners.get(evt) ?? []).forEach((c) => c(payload));
    }),
    colorMode,
    darkResolver,
  };
}

describe("TokenRegistryProvider · dark-mode applier", () => {
  let setPropertySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    setPropertySpy = vi.spyOn(document.documentElement.style, "setProperty");
    setPropertySpy.mockClear();
  });

  it("on mount: walks color tokens and applies darkResolver-resolved value when colorMode is 'dark'", () => {
    const composer = makeFakeComposer();
    localStorage.setItem(
      "buildrick-design-tokens-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    render(
      <TokenRegistryProvider projectId="test" composer={composer as any}>
        <div />
      </TokenRegistryProvider>
    );

    expect(composer.darkResolver.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ id: "color-primary", darkValue: "#000" }),
      "dark"
    );
    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-primary", "#000");
  });

  it("on colorMode:changed event: re-walks tokens and re-applies", () => {
    const composer = makeFakeComposer();
    localStorage.setItem(
      "buildrick-design-tokens-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    render(
      <TokenRegistryProvider projectId="test" composer={composer as any}>
        <div />
      </TokenRegistryProvider>
    );
    setPropertySpy.mockClear();

    composer.colorMode.resolved.mockReturnValue("light");
    act(() => {
      composer.emit("colorMode:changed", { mode: "light", resolved: "light" });
    });

    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-primary", "#fff");
  });

  it("when composer prop is omitted: no-op (legacy behavior preserved)", () => {
    localStorage.setItem(
      "buildrick-design-tokens-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    render(
      <TokenRegistryProvider projectId="test">
        <div />
      </TokenRegistryProvider>
    );
    expect(setPropertySpy).not.toHaveBeenCalledWith("--bd-color-primary", "#000");
  });

  it("unsubscribes on unmount", () => {
    const composer = makeFakeComposer();
    const { unmount } = render(
      <TokenRegistryProvider projectId="test" composer={composer as any}>
        <div />
      </TokenRegistryProvider>
    );
    unmount();
    expect(composer.off).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });
});
