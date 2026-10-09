import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { ProjectTokensApplier } from "../ProjectTokensApplier";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { DEFAULT_TOKENS, DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { emitSiteTokenCss } from "@/engine/export/ExportHelpers";
import type { DesignToken } from "@/engine/designSystem/types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

/**
 * A site's brand lives in `projectSettings.designTokens`. The merge that turns
 * it into CSS variables ran inside the Brand panel, so a machine with no
 * localStorage cache drew the DEFAULT brand — measured: body font Palatino in
 * the project, `--buildrick-design-font-body` reading "Inter" on the canvas
 * until the panel was opened.
 */
function stubComposer(tokens: DesignToken[]) {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    composer: {
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: (e: string, cb: () => void) => {
        handlers[e] = (handlers[e] ?? []).filter((h) => h !== cb);
      },
      getProjectSettings: () => ({ designTokens: tokens }),
      colorMode: { resolved: () => "light" as const },
    } as unknown as Composer,
    fire: (e: string) => (handlers[e] ?? []).forEach((h) => h()),
    listenerCount: (e: string) => (handlers[e] ?? []).length,
  };
}

const css = () => document.getElementById("bk-site-tokens")?.textContent ?? "";

beforeEach(() => {
  document.head.innerHTML = "";
  delete document.documentElement.dataset.theme;
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
});

describe("ProjectTokensApplier", () => {
  it("writes exactly the export's token block, even when one saved row is invalid (D17)", () => {
    const rows = DEFAULT_TOKENS_V5.map((t) => (t.id === "color-primary" ? { ...t, value: "#FF0000" } : t));
    const bad = { id: "My Token", name: "My Token", value: "#00FF00", category: "colors", cssVar: "--buildrick-design-my-token", type: "color" };
    const settings = { designTokens: [...rows, bad], designTokensSchemaVersion: 5, darkMode: "off" };
    const { composer } = stubComposer([]);
    composer.getProjectSettings = () => settings as never;
    render(<ProjectTokensApplier composer={composer} />);
    expect(css()).toBe(emitSiteTokenCss(settings));
    expect(css()).toContain("--buildrick-design-color-primary:#FF0000");
    expect(css()).toContain("--buildrick-design-my-token:#00FF00");
  });

  it("puts the site's own tokens on the page without the Brand panel", () => {
    const { composer } = stubComposer([
      v6Token({ id: "font-body", value: "Palatino", category: "typography", type: "font-family", layer: "semantic" }),
    ]);
    render(<ProjectTokensApplier composer={composer} />);
    expect(css()).toMatch(/--buildrick-design-font-body:\s*Palatino/);
  });

  it("re-applies when the project loads after mount", () => {
    let tokens: DesignToken[] = [];
    const handlers: Record<string, Array<() => void>> = {};
    const composer = {
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: () => {},
      getProjectSettings: () => ({ designTokens: tokens }),
      colorMode: { resolved: () => "light" as const },
    } as unknown as Composer;

    render(<ProjectTokensApplier composer={composer} />);
    expect(css()).not.toContain("#B91C1C");

    tokens = [
      v6Token({ id: "color-action", value: "#B91C1C", layer: "semantic" }),
    ];
    handlers[EVENTS.PROJECT_LOADED].forEach((h) => h());
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(css()).toMatch(/--buildrick-design-color-action:\s*#B91C1C/i);
  });

  it("data-theme is the preview's theme, else light — never the designer's saved colour mode (L4-021)", () => {
    const composer = {
      on: () => {}, off: () => {},
      getProjectSettings: () => ({ darkMode: "auto", designTokens: [] }),
      colorMode: { resolved: () => "dark" as const },
      designSystem: { preview: null as unknown },
    } as unknown as Composer & { designSystem: { preview: unknown } };
    const view = render(<ProjectTokensApplier composer={composer} />);
    expect(document.documentElement.dataset.theme).toBe("light");
    view.unmount();
    composer.designSystem.preview = { tokens: [], darkMode: "auto", theme: "dark" };
    render(<ProjectTokensApplier composer={composer} />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("a dark preview paints the canvas frame with the page background, as the export paints the body (BRP1-M12)", () => {
    const frameRule = ".buildrick-canvas[data-buildrick-canvas]{background-color:var(--buildrick-design-color-page-background)}";
    const page = (dark?: string) => v6Token({ id: "color-page-background", value: "transparent", layer: "semantic", ...(dark ? { dark } : {}) });
    const composer = {
      on: () => {}, off: () => {},
      getProjectSettings: () => ({ darkMode: "auto", designTokens: [] }),
      designSystem: { preview: null as unknown },
    } as unknown as Composer & { designSystem: { preview: unknown } };
    composer.designSystem.preview = { tokens: [page("#0F172A")], darkMode: "auto", theme: "dark", source: "canvas" };
    let view = render(<ProjectTokensApplier composer={composer} />);
    expect(css()).toContain(`:root[data-theme="dark"] ${frameRule}`);
    view.unmount();
    /* light: the card stays white under a transparent page */
    composer.designSystem.preview = { tokens: [page("#0F172A")], darkMode: "auto" };
    view = render(<ProjectTokensApplier composer={composer} />);
    expect(css()).not.toContain(frameRule);
    view.unmount();
    /* no dark page colour: the white card is kept rather than the grey behind it */
    composer.designSystem.preview = { tokens: [page()], darkMode: "auto", theme: "dark" };
    render(<ProjectTokensApplier composer={composer} />);
    expect(css()).not.toContain(frameRule);
  });

  it("never writes per-variable inline styles on <html>", () => {
    const { composer } = stubComposer([]);
    render(<ProjectTokensApplier composer={composer} />);
    expect(document.documentElement.getAttribute("style")).toBeNull();
  });

  it("unsubscribes on unmount", () => {
    const { composer, listenerCount } = stubComposer([]);
    const { unmount } = render(<ProjectTokensApplier composer={composer} />);
    expect(listenerCount(EVENTS.PROJECT_LOADED)).toBe(1);
    unmount();
    expect(listenerCount(EVENTS.PROJECT_LOADED)).toBe(0);
  });

  it("removes its <style> and data-theme on unmount (M6)", () => {
    const { composer } = stubComposer([]);
    const { unmount } = render(<ProjectTokensApplier composer={composer} />);
    expect(document.getElementById("bk-site-tokens")).not.toBeNull();
    expect(document.documentElement.dataset.theme).toBe("light");
    unmount();
    expect(document.getElementById("bk-site-tokens")).toBeNull();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("follows the brand switch: off paints a v5 site from its saved literals, like the export (I3)", () => {
    const rows = DEFAULT_TOKENS_V5.map((t) => (t.id === "color-primary" ? { ...t, value: "#FF0000" } : t));
    const settings = { designTokens: rows, designTokensSchemaVersion: 5, darkMode: "off" };
    const { composer } = stubComposer([]);
    composer.getProjectSettings = () => settings as never;
    Object.assign(composer, { designSystem: { brandTokensV2: false } });
    render(<ProjectTokensApplier composer={composer} />);
    expect(css()).toBe(emitSiteTokenCss(settings, { migrate: false }));
    expect(css()).toContain("--buildrick-design-color-primary:#FF0000");
  });

  it("is mounted where every project sees it, not inside the panel", () => {
    const shell = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../../shell/StudioPanels.tsx"),
      "utf8"
    );
    expect(shell).toContain("<ProjectTokensApplier composer={composer} />");
  });
});

describe("mergeProjectTokens", () => {
  it("keeps the seed for slots the site never changed", () => {
    /* The site saved one edit: color-action and the primitive the edit gave it. */
    const saved = setTokenLiteral(DEFAULT_TOKENS, "color-action", "light", "#B91C1C").filter(
      (t) => t.id === "color-action" || t.id === "custom-color-action",
    );
    const merged = mergeProjectTokens(saved);
    expect(resolveTokenLiteral(merged, "color-action", "light")).toBe("#B91C1C");
    expect(resolveTokenLiteral(merged, "font-body", "light")).toBe("Inter");
  });
});
