/**
 * A site's fonts have to survive the export.
 *
 * The Brand panel offers a display / body / mono slot per site. The export
 * named ONE family for every site ever published (`RESET_CSS`, from a module
 * constant), so a site whose heading font was changed shipped in the default
 * one — silently, the same shape as the animation keyframes that used to be
 * dropped from exported pages.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {},
    clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = {
    open: () => ({ onsuccess: null, onerror: null, onupgradeneeded: null, result: null }),
  };
});

function exportCSSWithFonts(tokens: Array<{ id: string; value: string }>): string {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "p",
        name: "P",
        slug: "p",
        root: { id: "root", type: "container" as const, tagName: "div", children: [] },
      },
    ],
  } as never);
  composer.setProjectSettings({
    ...composer.getProjectSettings(),
    designTokens: tokens.map((t) => ({
      ...t,
      name: t.id,
      cssVar: `--buildrick-design-${t.id}`,
      category: "typography" as const,
      type: "string",
    })),
  } as never);
  return new ExportEngine(composer).generateCSS();
}

describe("the published page carries the site's own fonts", () => {
  it("emits the site's three slots", () => {
    const css = exportCSSWithFonts([
      { id: "font-heading", value: "Georgia" },
      { id: "font-body", value: "Verdana" },
      { id: "font-mono", value: "IBM Plex Mono" },
    ]);
    expect(css).toContain("h1,h2,h3,h4,h5,h6{font-family:Georgia,sans-serif}");
    expect(css).toContain("body{font-family:Verdana,sans-serif}");
    expect(css).toContain("code,pre,kbd,samp{font-family:IBM Plex Mono,monospace}");
  });

  it("puts them after the reset, whose body rule they have to beat", () => {
    const css = exportCSSWithFonts([{ id: "font-body", value: "Verdana" }]);
    const reset = css.indexOf("-webkit-font-smoothing");
    const site = css.indexOf("body{font-family:Verdana");
    expect(reset).toBeGreaterThanOrEqual(0);
    expect(site).toBeGreaterThan(reset);
  });

  it("carries the site's text colour, which the export named nowhere", () => {
    const css = exportCSSWithFonts([
      { id: "font-body", value: "Verdana" },
      { id: "color-text", value: "#334155" },
    ]);
    expect(css).toContain("color:#334155");
  });

  it("says nothing when the site carries no font tokens", () => {
    const css = exportCSSWithFonts([]);
    expect(css).not.toContain("h1,h2,h3,h4,h5,h6{font-family");
  });
});
