// @vitest-environment jsdom
import * as React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectTokensApplier } from "../ProjectTokensApplier";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

function fakeComposer(settings: Record<string, unknown>, mode: "light" | "dark" = "light") {
  const handlers = new Map<string, Set<() => void>>();
  return {
    getProjectSettings: () => settings,
    colorMode: { resolved: () => mode },
    on: (e: string, h: () => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
    off: (e: string, h: () => void) => handlers.get(e)?.delete(h),
    emit: (e: string) => handlers.get(e)?.forEach((h) => h()),
  };
}

describe("ProjectTokensApplier (v6)", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete document.documentElement.dataset.theme;
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
  });

  it("writes one style element and always sets data-theme", () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "auto" });
    render(<ProjectTokensApplier composer={c as never} />);
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(document.querySelectorAll("#bk-site-tokens")).toHaveLength(1);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("coalesces 50 rapid changes into one write per frame with the last value", () => {
    const settings: Record<string, unknown> = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" };
    const c = fakeComposer(settings);
    render(<ProjectTokensApplier composer={c as never} />);
    act(() => { vi.advanceTimersToNextFrame(); });
    const style = document.getElementById("bk-site-tokens")!;
    const writes = vi.fn();
    new MutationObserver(writes).observe(style, { childList: true, characterData: true, subtree: true });
    for (let i = 0; i < 50; i++) {
      settings.designTokens = DEFAULT_TOKENS.map((t) =>
        t.id === "color-brand-500" ? { ...t, modes: { light: { value: `#00000${i % 10}` } } } : t);
      c.emit("settings:change");
    }
    act(() => { vi.advanceTimersToNextFrame(); });
    return Promise.resolve().then(() => {
      expect(writes).toHaveBeenCalledTimes(1);
      expect(style.textContent).toContain("#000009");
    });
  });

  it("forces light preview when the site's Dark mode is off", () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" }, "dark");
    render(<ProjectTokensApplier composer={c as never} />);
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("follows the resolved color mode when Dark mode is on", () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "auto" }, "dark");
    render(<ProjectTokensApplier composer={c as never} />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
