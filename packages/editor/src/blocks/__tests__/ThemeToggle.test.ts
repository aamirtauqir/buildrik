// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { themeToggleBlockConfig, isThemeToggleOffered } from "../Basic/ThemeToggle";
import { getBlockById, insertBlock } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

interface Node { type?: string; content?: string; attributes?: Record<string, string>; styles?: Record<string, unknown>; children?: Node[] }

describe("theme-toggle block (spec D12)", () => {
  it("is registered and offered only when Dark mode is Auto", () => {
    expect(getBlockById("theme-toggle")).toBe(themeToggleBlockConfig);
    expect(isThemeToggleOffered("auto")).toBe(true);
    expect(isThemeToggleOffered("off")).toBe(false);
  });

  it("inserts a token-bound Light / Dark pair (M12 canvas-light)", () => {
    const c = createTestComposer();
    const page = c.elements.createPage("Home");
    insertBlock(c, themeToggleBlockConfig, page.root.id);
    const root = c.elements.exportPages().find((p) => p.id === page.id)!.root as Node;
    const btn = root.children![root.children!.length - 1];
    expect(btn.attributes?.["data-bk-theme-toggle"]).toBe("true");
    expect(btn.attributes?.["aria-label"]).toBe("Theme");
    expect(btn.attributes?.role).toBe("group");
    // The canvas label and selection readout name it (M12 canvas-light).
    const id = c.elements.getAllElements().find((e) => e.getAttribute("data-bk-theme-toggle") === "true")!.getId();
    expect(c.elements.getElement(id)!.getCustomData("layerName")).toBe("Theme toggle");
    expect(btn.children!.map((ch) => ch.attributes?.["data-bk-tt"])).toEqual(["light", "dark"]);
    expect(btn.children!.map((ch) => ch.content)).toEqual(["Light", "Dark"]);
    for (const ch of btn.children!) {
      const styles = JSON.stringify(ch.styles ?? {});
      expect(styles).toContain("var(--buildrick-design-color-surface-raised)");
      expect(styles).toContain("var(--buildrick-design-color-text-strong)");
      expect(styles).toContain("var(--buildrick-design-color-border-subtle)");
      expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it("exports with its icons swapped by the toggle CSS on an Auto site", async () => {
    const c = createTestComposer();
    const page = c.elements.createPage("Home");
    insertBlock(c, themeToggleBlockConfig, page.root.id);
    c.setProjectSettings({ ...c.getProjectSettings(), darkMode: "auto" });
    const { ExportEngine } = await import("@/engine/export/ExportEngine");
    const html = new ExportEngine(c).generateHTML();
    expect(html).toContain('data-bk-tt="light"');
    expect(html).toContain("data-buildrick-theme-boot");
    expect(html).toContain("data-buildrick-theme-toggle-runtime");
  });
});
