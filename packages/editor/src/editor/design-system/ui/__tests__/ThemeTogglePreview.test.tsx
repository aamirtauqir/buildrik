// @vitest-environment jsdom
import * as React from "react";
import { render, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { ThemeTogglePreview } from "../ThemeTogglePreview";

/* BRP1-M12 canvas-dark (8228:233404) / canvas-light (8228:233132): on an Auto
   site the theme-toggle block flips the CANVAS between the site's light and
   dark looks — a preview (L4-021): never saved, never in ⌘Z, no colour-mode
   write. */
function fake(darkMode: "off" | "auto") {
  const handlers = new Map<string, Set<() => void>>();
  const c = {
    settings: { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode } as Record<string, unknown>,
    getProjectSettings: () => c.settings,
    setProjectSettings: vi.fn(),
    colorMode: { set: vi.fn() },
    history: { push: vi.fn() },
    designSystem: {
      preview: null as unknown,
      setPreview: (p: unknown) => {
        c.designSystem.preview = p;
        c.emit("brand:preview-changed");
      },
    },
    on: (e: string, h: () => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
    off: (e: string, h: () => void) => handlers.get(e)?.delete(h),
    emit: (e: string) => handlers.get(e)?.forEach((h) => h()),
  };
  return c;
}

const TOGGLE =
  '<div data-bk-theme-toggle="true" role="group"><button data-bk-tt="light"><span>Light</span></button><button data-bk-tt="dark">Dark</button></div>';

function mountCanvas() {
  document.body.innerHTML = `<div class="buildrick-canvas">${TOGGLE}</div><div class="brand-live">${TOGGLE}</div>`;
}
const seg = (mode: string, where = ".buildrick-canvas") =>
  document.querySelector<HTMLElement>(`${where} [data-bk-tt="${mode}"]`)!;

beforeEach(() => {
  mountCanvas();
  localStorage.clear();
});

describe("ThemeTogglePreview (BRP1-M12)", () => {
  it("on an Auto site, the canvas toggle's Dark previews the saved brand dark; Light puts it back; nothing is saved", () => {
    const c = fake("auto");
    const before = JSON.stringify(c.settings);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<ThemeTogglePreview composer={c as never} />);
    act(() => { fireEvent.click(seg("dark")); });
    expect(c.designSystem.preview).toMatchObject({ theme: "dark", darkMode: "auto", source: "canvas" });
    expect((c.designSystem.preview as { tokens: unknown[] }).tokens.length).toBeGreaterThan(0);
    act(() => { fireEvent.click(seg("light").querySelector("span")!); });
    expect(c.designSystem.preview).toBeNull();
    expect(JSON.stringify(c.settings)).toBe(before);
    expect(c.setProjectSettings).not.toHaveBeenCalled();
    expect(c.colorMode.set).not.toHaveBeenCalled();
    expect(c.history.push).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("on an Off site the canvas stays light (the toggle is dimmed)", () => {
    const c = fake("off");
    render(<ThemeTogglePreview composer={c as never} />);
    act(() => { fireEvent.click(seg("dark")); });
    expect(c.designSystem.preview).toBeNull();
  });

  it("a toggle outside the canvas (Brand's live preview) does nothing", () => {
    const c = fake("auto");
    render(<ThemeTogglePreview composer={c as never} />);
    act(() => { fireEvent.click(seg("dark", ".brand-live")); });
    expect(c.designSystem.preview).toBeNull();
  });

  it("turning Dark mode Off mid-preview drops the canvas to light; unmount clears", () => {
    const c = fake("auto");
    const view = render(<ThemeTogglePreview composer={c as never} />);
    act(() => { fireEvent.click(seg("dark")); });
    act(() => { c.settings = { ...c.settings, darkMode: "off" }; c.emit("settings:change"); });
    expect(c.designSystem.preview).toBeNull();
    act(() => { c.settings = { ...c.settings, darkMode: "auto" }; c.emit("settings:change"); });
    act(() => { fireEvent.click(seg("dark")); });
    expect(c.designSystem.preview).toMatchObject({ theme: "dark" });
    view.unmount();
    expect(c.designSystem.preview).toBeNull();
  });

  it("never clears another flow's preview", () => {
    const c = fake("auto");
    render(<ThemeTogglePreview composer={c as never} />);
    const other = { tokens: [], darkMode: "auto" };
    act(() => { c.designSystem.setPreview(other); });
    act(() => { fireEvent.click(seg("light")); });
    expect(c.designSystem.preview).toBe(other);
  });
});
