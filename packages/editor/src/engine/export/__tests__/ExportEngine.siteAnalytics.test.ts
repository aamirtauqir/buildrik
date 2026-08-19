/**
 * Settings → Analytics takes a GA4 measurement ID and says the settings are
 * "written into the site when you publish". They were written nowhere.
 *
 * The single-file path called `generateAnalyticsScripts(config.analytics)` —
 * EXPORT config, a field the modal never sets and the default config omits, so
 * the call received undefined on every export ever made. The publish path did
 * not look at all. The IDs themselves live in project settings, which is where
 * the screen writes them.
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

function composerWithAnalytics(analytics: Record<string, unknown>) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
  } as never);
  composer.setProjectSettings({ ...composer.getProjectSettings(), analytics } as never);
  return composer;
}

const GA = { googleAnalytics: { enabled: true, measurementId: "G-PROBE123" } };

describe("the site's analytics reach the page", () => {
  it("goes into the single file", () => {
    const html = new ExportEngine(composerWithAnalytics(GA)).generateHTML();
    expect(html).toContain("G-PROBE123");
  });

  it("goes onto every published page", async () => {
    const { files } = await new ExportEngine(composerWithAnalytics(GA)).exportAllPages({ format: "html" });
    expect(files.find((f) => f.name === "index.html")?.content).toContain("G-PROBE123");
  });

  it("respects the screen's enabled toggle", () => {
    const html = new ExportEngine(
      composerWithAnalytics({ googleAnalytics: { enabled: false, measurementId: "G-OFF" } })
    ).generateHTML();
    expect(html).not.toContain("G-OFF");
  });

  it("still lets an explicit export config win", () => {
    const html = new ExportEngine(composerWithAnalytics(GA), {
      analytics: { googleAnalytics: { enabled: true, measurementId: "G-EXPLICIT" } },
    } as never).generateHTML();
    expect(html).toContain("G-EXPLICIT");
    expect(html).not.toContain("G-PROBE123");
  });

  it("emits nothing for a site with no analytics configured", () => {
    const html = new ExportEngine(composerWithAnalytics({})).generateHTML();
    expect(html).not.toContain("googletagmanager");
  });
});
