/**
 * All three heads print the site's language, not the literal "en".
 *
 * `<html lang="en">` was hardcoded in the single-file export, the publish
 * assembler and the preview head — while the SEO block a few lines below each
 * one printed `og:locale` from `seo.language`. So a French site told Facebook
 * it was French and told screen readers (WCAG 3.1.1) it was English. Nothing
 * wrote `seo.language` either; the Localization screen now does, from the
 * default locale it already collects.
 *
 * Walked live: Settings › Localization → French → Save, and the preview head
 * reads `<html lang="fr">`.
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

function site(language?: string) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
  } as never);
  const current = composer.getProjectSettings();
  composer.setProjectSettings({ ...current, seo: { ...current.seo, language } });
  return composer;
}

describe("the document language", () => {
  it("reaches the preview head", () => {
    expect(site("fr").exportHTML().combined).toContain('<html lang="fr">');
  });

  it("reaches the published page", async () => {
    const result = await new ExportEngine(site("fr")).exportAllPages({ format: "html" });
    const home = result.files.find((f) => f.name.endsWith(".html"));
    expect(home?.content).toContain('<html lang="fr">');
  });

  it("reaches the single downloaded file", async () => {
    const out = await new ExportEngine(site("fr")).export();
    expect(String(out.html)).toContain('<html lang="fr">');
  });

  it("agrees with the og:locale printed under it", async () => {
    const out = await new ExportEngine(site("fr")).export();
    expect(String(out.html)).toContain('<meta property="og:locale" content="fr">');
  });

  it("falls back to en when the site says nothing", () => {
    expect(site(undefined).exportHTML().combined).toContain('<html lang="en">');
    expect(site("   ").exportHTML().combined).toContain('<html lang="en">');
  });
});
