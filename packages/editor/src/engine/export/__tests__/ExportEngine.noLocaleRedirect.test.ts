/**
 * SA-05: the site export no longer redirects visitors to `/<locale>/` pages
 * that the publish pipeline never generates (per-locale publishing is a
 * later release — see LocalizationScreen's own note). `localeAutoRedirect`
 * stays stored (per-locale publish will reuse it), but nothing reads it into
 * the exported HTML any more.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function composerWithLocalization() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
  } as never);
  composer.setProjectSettings({
    ...composer.getProjectSettings(),
    localization: { defaultLocale: "en", enabledLocales: ["en", "fr"], autoRedirect: true },
  } as never);
  return composer;
}

describe("the site export emits no locale-redirect script", () => {
  it("stays out of the single-file export even with autoRedirect on", () => {
    const html = new ExportEngine(composerWithLocalization()).generateHTML();
    expect(html).not.toContain("brk-locale-redirect");
  });

  it("stays out of every published page too", async () => {
    const { files } = await new ExportEngine(composerWithLocalization()).exportAllPages({ format: "html" });
    const page = files.find((f) => f.name === "index.html")?.content ?? "";
    expect(page).not.toContain("brk-locale-redirect");
  });
});
