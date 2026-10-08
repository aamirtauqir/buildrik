import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../Composer";
import { EVENTS } from "@/shared/constants/events";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { setTokenLiteral, resolveTokenLiteral } from "@buildrik/shared/tokens";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function fresh(settings: Record<string, unknown> = {}): Composer {
  const c = new Composer({} as never);
  c.importProject({ pages: [{ id: "p", name: "P", slug: "", root: { id: "root", type: "container", tagName: "div", children: [] } }] } as never);
  c.setProjectSettings({ ...c.getProjectSettings(), ...settings });
  c.history.flushPending();
  return c;
}

describe("designSystem.setDarkMode", () => {
  it("writes designTokens even when none were saved (the server drops a darkMode without them)", () => {
    const c = fresh();
    expect(c.getProjectSettings().designTokens).toBeUndefined();
    expect(c.designSystem.setDarkMode("auto", "Turn on dark mode")).toBe(true);
    const s = c.getProjectSettings();
    expect(s.darkMode).toBe("auto");
    expect(Array.isArray(s.designTokens) && s.designTokens.length).toBeGreaterThan(0);
    expect(s.designTokensSchemaVersion).toBe(6);
  });

  it("tokens + Dark mode are ONE undo step", () => {
    const c = fresh({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" });
    const next = setTokenLiteral(DEFAULT_TOKENS, "color-secondary", "dark", "#111111");
    expect(c.designSystem.setDarkMode("auto", "Turn on dark mode", next)).toBe(true);
    c.history.flushPending();
    expect(c.getProjectSettings().darkMode).toBe("auto");
    c.history.undo();
    expect(c.getProjectSettings().darkMode).toBe("off");
    expect(resolveTokenLiteral(c.getProjectSettings().designTokens ?? [], "color-secondary", "dark")).toBe(
      resolveTokenLiteral(DEFAULT_TOKENS, "color-secondary", "dark"),
    );
  });

  it("writes nothing when read-only", () => {
    const c = fresh({ darkMode: "off" });
    c.designSystem.readOnly = true;
    expect(c.designSystem.setDarkMode("auto", "x")).toBe(false);
    expect(c.getProjectSettings().darkMode).toBe("off");
  });

  it("writes nothing when the token write is refused (invalid set)", () => {
    const c = fresh({ darkMode: "off" });
    const bad = [...DEFAULT_TOKENS, { ...DEFAULT_TOKENS[0] }]; // duplicate id
    expect(c.designSystem.setDarkMode("auto", "x", bad)).toBe(false);
    expect(c.getProjectSettings().darkMode).toBe("off");
  });
});

describe("designSystem preview", () => {
  it("never touches settings or history, and announces itself", () => {
    const c = fresh({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 });
    const before = JSON.stringify(c.getProjectSettings());
    let seen = 0;
    c.on(EVENTS.BRAND_PREVIEW_CHANGED, () => { seen += 1; });
    const canUndoBefore = c.history.canUndo();
    c.designSystem.setPreview({ tokens: DEFAULT_TOKENS, darkMode: "auto", theme: "dark" });
    expect(c.designSystem.preview?.theme).toBe("dark");
    c.designSystem.setPreview(null);
    c.history.flushPending();
    expect(JSON.stringify(c.getProjectSettings())).toBe(before);
    expect(c.history.canUndo()).toBe(canUndoBefore);
    expect(seen).toBe(2);
  });
});
