/**
 * REA audit 2026-10-20 #25 (R4 P1-7, P1-8): the CSS a published page carries.
 *
 * - Orphans: an element styled (base, :hover, a breakpoint) and then deleted
 *   kept its StyleEngine rules, and they shipped on every page and in the
 *   ZIP's styles.css — rules that match nothing anywhere on the site.
 * - Whole site per page: Publish inlines CSS into each page (the payload is
 *   pages only, so a shared stylesheet would never reach the deploy), and it
 *   inlined the WHOLE site's CSS — the About page was 18 KB of CSS for
 *   elements on the home page. Each page now carries the shared CSS (reset,
 *   site tokens and fonts, class rules) plus only its own elements' rules.
 *   The ZIP keeps one shared styles.css (pages there can share a cached file),
 *   minus the orphans.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import JSZip from "jszip";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "../ExportEngine";
import { elementSelector } from "@/shared/utils/elementSelector";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});

function site() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        root: { id: "r1", type: "container" as const, tagName: "div", children: [
          { id: "homeTitle", type: "heading" as const, tagName: "h1", content: "Home", styles: { color: "rgb(10, 20, 30)" }, children: [] },
        ] },
      },
      {
        id: "about", name: "About", slug: "about",
        root: { id: "r2", type: "container" as const, tagName: "div", children: [
          { id: "aboutText", type: "paragraph" as const, tagName: "p", content: "About", styles: { color: "rgb(40, 50, 60)" }, children: [] },
        ] },
      },
    ],
  } as never);
  composer.styles.setRule(elementSelector("homeTitle"), { color: "rgb(11, 21, 31)" }, { pseudo: ":hover" });
  composer.styles.setBreakpointStyle("homeTitle", "mobile", { "font-size": "17px" });
  composer.styles.setBreakpointStyle("aboutText", "mobile", { "font-size": "19px" });
  // Styled, then deleted: its rules stay in the StyleEngine.
  composer.styles.setRule(elementSelector("gone"), { outline: "7px dotted rgb(1, 2, 3)" });
  composer.styles.setRule(elementSelector("gone"), { outline: "8px dotted rgb(1, 2, 3)" }, { pseudo: ":hover" });
  // A shared class rule belongs on every page.
  composer.styles.setRule(".brand-note", { "letter-spacing": "3px" });
  return composer;
}

async function publishPages(): Promise<Map<string, string>> {
  const { files } = await new ExportEngine(site()).exportAllPages({
    format: "html", minify: true, rootAbsoluteHrefs: true, inlineStyles: true,
  });
  expect(files.some((f) => f.name === "styles.css")).toBe(false);
  return new Map(files.filter((f) => f.name.endsWith(".html")).map((f) => [f.name, f.content]));
}

describe("published page CSS (#25)", () => {
  it("never ships rules for an element that no longer exists", async () => {
    for (const html of (await publishPages()).values()) expect(html).not.toContain("rgb(1, 2, 3)");
    const { files } = await new ExportEngine(site()).exportAllPages({ format: "html", minify: true });
    expect(files.find((f) => f.name === "styles.css")!.content).not.toContain("rgb(1, 2, 3)");
  });

  it("gives each published page its own elements' rules, inline, and not another page's", async () => {
    const pages = await publishPages();
    const home = pages.get("index.html")!;
    const about = pages.get("about.html")!;
    expect(home).not.toContain('href="styles.css"');
    expect(home).toContain("rgb(10, 20, 30)");
    expect(home).toContain("rgb(11, 21, 31)");
    expect(home).toContain("17px");
    expect(home).not.toContain("rgb(40, 50, 60)");
    expect(home).not.toContain("19px");
    expect(about).toContain("rgb(40, 50, 60)");
    expect(about).toContain("19px");
    expect(about).not.toContain("rgb(10, 20, 30)");
    expect(about).not.toContain("rgb(11, 21, 31)");
    expect(about).not.toContain("17px");
  });

  it("keeps the shared CSS on every page", async () => {
    for (const html of (await publishPages()).values()) {
      expect(html).toContain("box-sizing:border-box");
      expect(html).toContain("letter-spacing");
    }
  });

  it("keeps one shared stylesheet in the ZIP, with every live element's rules", async () => {
    const zip = await JSZip.loadAsync(await (await new ExportEngine(site()).generateZip()).arrayBuffer());
    const css = await zip.file("styles.css")!.async("string");
    expect(css).toContain("rgb(10, 20, 30)");
    expect(css).toContain("rgb(40, 50, 60)");
    expect(css).not.toContain("rgb(1, 2, 3)");
    expect(await zip.file("about.html")!.async("string")).toContain('href="styles.css"');
  });
});
