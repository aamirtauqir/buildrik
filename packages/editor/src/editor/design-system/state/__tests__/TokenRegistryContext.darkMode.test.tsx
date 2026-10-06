import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { TokenRegistryProvider } from "../TokenRegistryContext";
import { ProjectTokensApplier } from "@/editor/design-system/ui/ProjectTokensApplier";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

type Listener = (payload: unknown) => void;

function makeFakeComposer(darkMode: "off" | "auto") {
  const listeners = new Map<string, Listener[]>();
  return {
    on: vi.fn((evt: string, cb: Listener) => {
      listeners.set(evt, [...(listeners.get(evt) ?? []), cb]);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      listeners.set(evt, (listeners.get(evt) ?? []).filter((x) => x !== cb));
    }),
    emit: (evt: string) => (listeners.get(evt) ?? []).forEach((c) => c(undefined)),
    getProjectSettings: () => ({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode }),
    colorMode: { resolved: () => "dark" as const },
    designSystem: { readOnly: false, setTokens: vi.fn(() => false) },
  };
}

describe("site Dark mode off, editor in dark (D8)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("style");
    delete document.documentElement.dataset.theme;
  });

  it("leaves no inline colour override on <html> and previews light", () => {
    const composer = makeFakeComposer("off");
    render(
      <TokenRegistryProvider composer={composer as never}>
        <ProjectTokensApplier composer={composer as never} />
      </TokenRegistryProvider>
    );
    const inline = () =>
      document.documentElement.style.getPropertyValue("--buildrick-design-color-primary");
    expect(inline()).toBe("");
    expect(document.documentElement.dataset.theme).toBe("light");
    act(() => composer.emit("colorMode:changed"));
    expect(inline()).toBe("");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
