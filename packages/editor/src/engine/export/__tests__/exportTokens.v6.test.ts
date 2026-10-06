// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { emitTokenCss } from "@buildrik/shared/tokens";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import { DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { ExportEngine } from "../ExportEngine";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

async function documents(settings: Record<string, unknown>) {
  const composer = createTestComposer();
  composer.setProjectSettings({ ...composer.getProjectSettings(), ...settings });
  composer.elements.createPage("Home");
  const engine = new ExportEngine(composer);
  const single = engine.generateHTML({ includeResetCSS: true }) + engine.generateCSS();
  const { files } = await engine.exportAllPages({ format: "html" });
  const multi = files.map((f) => f.content).join("\n");
  return { single, multi, preview: composer.exportHTML().combined };
}

describe("export token CSS (v6)", () => {
  it("writes exactly the canvas string for a v5 site with Dark mode off, in all three documents", async () => {
    const settings = { designTokens: DEFAULT_TOKENS_V5, designTokensSchemaVersion: 5, darkMode: "off" as const };
    const canvas = emitTokenCss(mergeProjectTokens(settings.designTokens, 5), { darkMode: "off" });
    for (const [name, doc] of Object.entries(await documents(settings))) {
      expect(doc, name).toContain(canvas.trim());
      expect(doc, name).not.toContain("prefers-color-scheme: dark");
    }
  });

  it("ships the dark blocks when the site's Dark mode is auto", async () => {
    const settings = { designTokens: DEFAULT_TOKENS_V5, designTokensSchemaVersion: 5, darkMode: "auto" as const };
    const canvas = emitTokenCss(mergeProjectTokens(settings.designTokens, 5), { darkMode: "auto" });
    expect(canvas).toContain("prefers-color-scheme: dark");
    for (const [name, doc] of Object.entries(await documents(settings))) {
      expect(doc, name).toContain(canvas.trim());
      expect(doc, name).toContain(':root[data-theme="dark"]');
    }
  });
});
