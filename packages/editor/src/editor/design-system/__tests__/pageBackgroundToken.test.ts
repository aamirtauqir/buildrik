// @vitest-environment jsdom
/**
 * "Page / background" (owner decision 2026-10-02, board 21): the site seed
 * carries a page-background colour token, and a NEW page's root is bound to
 * it so the Page panel's Fill names the token. Its value is the background a
 * page root had before the token existed — transparent — and a page loaded
 * from an existing site is not rebound, so neither the canvas nor the
 * published CSS of an existing site moves.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ExportEngine } from "@/engine/export/ExportEngine";
import { PAGE_BACKGROUND_TOKEN } from "@buildrik/shared/content/elementIds";
import { colourTokenLabel } from "@/editor/inspector/shared/controls/ColorInput";
import { DEFAULT_TOKENS } from "../constants";
import { mergeProjectTokens } from "../state/projectTokens";
import { buildContrastIssues } from "../utils/contrastLint";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const BOUND = `var(${PAGE_BACKGROUND_TOKEN.cssVar})`;

async function publishedHtml(composer: ReturnType<typeof createTestComposer>): Promise<string> {
  const res = await new ExportEngine(composer).exportAllPages({ format: "html", minify: false });
  return res.files.filter((f) => f.name.endsWith(".html") || f.name.endsWith(".css")).map((f) => f.content).join("\n");
}

describe("the seed's page-background token", () => {
  const token = DEFAULT_TOKENS.find((t) => t.id === PAGE_BACKGROUND_TOKEN.id);

  it("is a transparent surface colour on the shared css variable", () => {
    expect(token).toMatchObject({ value: "transparent", category: "colors", group: "surface", cssVar: PAGE_BACKGROUND_TOKEN.cssVar });
    expect(token?.darkValue).toBeUndefined();
  });

  it("reads 'Page / background' in the Inspector", () => {
    expect(colourTokenLabel(PAGE_BACKGROUND_TOKEN.id)).toBe("Page / background");
  });

  it("the canvas baseline declares the same value", () => {
    const css = readFileSync(join(__dirname, "../../../themes/design-system/design.css"), "utf8");
    expect(css).toContain(`${PAGE_BACKGROUND_TOKEN.cssVar}: transparent;`);
  });

  it("reaches a site whose saved tokens predate it, and raises no contrast warning", () => {
    const merged = mergeProjectTokens(DEFAULT_TOKENS.filter((t) => t.id !== PAGE_BACKGROUND_TOKEN.id));
    expect(merged.find((t) => t.id === PAGE_BACKGROUND_TOKEN.id)?.value).toBe("transparent");
    const colours = merged.filter((t) => t.category === "colors");
    expect(buildContrastIssues(colours, "light").map((i) => i.tokenId)).not.toContain(PAGE_BACKGROUND_TOKEN.id);
    expect(buildContrastIssues(colours, "dark").map((i) => i.tokenId)).not.toContain(PAGE_BACKGROUND_TOKEN.id);
  });
});

describe("page roots", () => {
  it("a new page's root is bound to the token", async () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    expect(composer.elements.getElement(page.root.id)?.getStyles()["background-color"]).toBe(BOUND);
    expect(await publishedHtml(composer)).toMatch(/background-color:\s*var\(--buildrick-design-color-page-background\)/);
  });

  it("a page loaded from an existing site is not rebound, and publishes no reference to it", async () => {
    const composer = createTestComposer();
    composer.importProject({
      version: "1.0.0",
      pages: [
        {
          id: "page-old",
          name: "Home",
          slug: "home",
          root: { id: "root-old", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
        },
      ],
      styles: [],
      assets: [],
      metadata: {},
    } as never);
    expect(composer.elements.getElement("root-old")?.getStyles()["background-color"]).toBeUndefined();
    expect(await publishedHtml(composer)).not.toContain(PAGE_BACKGROUND_TOKEN.cssVar);
  });
});
