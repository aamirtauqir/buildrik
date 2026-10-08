// @vitest-environment jsdom
import * as React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectTokensApplier } from "../ProjectTokensApplier";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

function fakeComposer(settings: Record<string, unknown>, initialMode: "light" | "dark" = "light") {
  let mode = initialMode;
  const handlers = new Map<string, Set<() => void>>();
  return {
    getProjectSettings: () => settings,
    colorMode: { resolved: () => mode },
    setMode: (m: "light" | "dark") => { mode = m; },
    on: (e: string, h: () => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
    off: (e: string, h: () => void) => handlers.get(e)?.delete(h),
    emit: (e: string) => handlers.get(e)?.forEach((h) => h()),
  };
}

describe("ProjectTokensApplier (v6)", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete document.documentElement.dataset.theme;
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
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

  it("a colorMode:changed event rewrites data-theme for an auto site", () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "auto" });
    render(<ProjectTokensApplier composer={c as never} />);
    expect(document.documentElement.dataset.theme).toBe("light");
    c.setMode("dark");
    c.emit("colorMode:changed");
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("switching darkMode off to auto adds the dark block and follows the mode", () => {
    const settings: Record<string, unknown> = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" };
    const c = fakeComposer(settings, "dark");
    render(<ProjectTokensApplier composer={c as never} />);
    expect(document.getElementById("bk-site-tokens")!.textContent).not.toContain(':root[data-theme="dark"]{');
    expect(document.documentElement.dataset.theme).toBe("light");
    settings.darkMode = "auto";
    c.emit("settings:change");
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(document.getElementById("bk-site-tokens")!.textContent).toContain(':root[data-theme="dark"]{');
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("unmounting with a pending frame cancels the write", () => {
    const settings: Record<string, unknown> = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "auto" };
    const c = fakeComposer(settings);
    const { unmount } = render(<ProjectTokensApplier composer={c as never} />);
    settings.darkMode = "off";
    c.emit("settings:change");
    unmount();
    expect(document.getElementById("bk-site-tokens")).toBeNull();
    act(() => { vi.advanceTimersToNextFrame(); });
    /* A pending frame that still ran would re-create the style after unmount. */
    expect(document.getElementById("bk-site-tokens")).toBeNull();
  });

  it("two mounts leave exactly one style element", () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "auto" });
    render(<ProjectTokensApplier composer={c as never} />);
    render(<ProjectTokensApplier composer={c as never} />);
    expect(document.querySelectorAll("#bk-site-tokens")).toHaveLength(1);
  });

  it("paints the preview first, with its theme, and goes back when it clears", () => {
    const settings = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" };
    const c = { ...fakeComposer(settings), designSystem: { preview: null as null | { tokens: unknown[]; darkMode: "auto"; theme: "dark" } } };
    render(<ProjectTokensApplier composer={c as never} />);
    act(() => { vi.advanceTimersToNextFrame(); });
    const off = document.getElementById("bk-site-tokens")!.textContent;
    expect(off).not.toContain("prefers-color-scheme");

    c.designSystem.preview = { tokens: DEFAULT_TOKENS, darkMode: "auto", theme: "dark" };
    act(() => { c.emit("brand:preview-changed"); vi.advanceTimersToNextFrame(); });
    expect(document.getElementById("bk-site-tokens")!.textContent).toContain(':root[data-theme="dark"]');
    expect(document.documentElement.dataset.theme).toBe("dark");

    c.designSystem.preview = null;
    act(() => { c.emit("brand:preview-changed"); vi.advanceTimersToNextFrame(); });
    expect(document.getElementById("bk-site-tokens")!.textContent).toBe(off);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
