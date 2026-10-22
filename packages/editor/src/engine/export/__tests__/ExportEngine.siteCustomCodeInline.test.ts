/**
 * REA audit 2026-10-20 #27 (R4 P1-10): inline scripts in the site's custom code.
 *
 * Chat widgets and analytics snippets are inline `<script>`s, and the site's
 * head/body code dropped every one without a word on the published page.
 * Nothing documents that as a product rule — the stripping is the stored-XSS
 * guard (sanitizeHeadCode), and its job is to keep the code out of Buildrick's
 * own surfaces, not out of the customer's site, which an editor can already
 * publish any HTML to.
 *
 * So the export's pages carry an inline script INERT (`type="text/plain"`):
 * that HTML is also what Review, Compare, the /share preview and the version
 * renders show inside the app, where it must never run. Only the step that
 * ships the site — the publish worker and the ZIP (`postProcessPages`) — turns
 * it back into a real script. The single-file export (Preview) still strips.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import JSZip from "jszip";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "../ExportEngine";
import { postProcessPages } from "../publishPostProcess";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});

const BODY =
  '<script>window.__siteBodyMarker = { id: "chat-1" };</script>' +
  '<script src="https://widget.example.com/chat.js" async></script>' +
  '<div onclick="steal()">x</div><iframe src="https://evil.example"></iframe>';
const HEAD = '<script type="application/ld+json">{"@type":"Organization"}</script><script>window.__siteHeadMarker=1</script>';

function site() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
  } as never);
  composer.setProjectSettings({ ...composer.getProjectSettings(), customCode: { headScripts: HEAD, bodyScripts: BODY } } as never);
  return composer;
}

const scriptsWith = (html: string, needle: string) =>
  (html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? []).filter((s) => s.includes(needle));
/** A script tag the browser runs as JavaScript: no type, or a JS type. */
const runs = (script: string) => !/\stype="(?!text\/javascript|module)[^"]*"/.test(script.slice(0, script.indexOf(">")));

async function exportedHome(): Promise<string> {
  const { files } = await new ExportEngine(site()).exportAllPages({ format: "html", minify: true, rootAbsoluteHrefs: true });
  return files.find((f) => f.name === "index.html")!.content;
}

describe("inline scripts in site custom code (#27)", () => {
  it("are carried in the exported page, but inert — that HTML is shown inside the app", async () => {
    const html = await exportedHome();
    const [body] = scriptsWith(html, "__siteBodyMarker");
    const [head] = scriptsWith(html, "__siteHeadMarker");
    expect(body).toBeDefined();
    expect(head).toBeDefined();
    expect(runs(body)).toBe(false);
    expect(runs(head)).toBe(false);
  });

  it("run on the shipped page, in the order they were written", async () => {
    const [page] = postProcessPages([{ path: "index.html", html: await exportedHome() }], { formTarget: null }).pages;
    const [body] = scriptsWith(page.html, "__siteBodyMarker");
    expect(runs(body)).toBe(true);
    expect(body).not.toContain("data-buildrick-custom-code");
    expect(page.html.indexOf("__siteBodyMarker")).toBeLessThan(page.html.indexOf("widget.example.com/chat.js"));
    // A non-JS inline script keeps the type it was written with.
    expect(scriptsWith(page.html, "@type")[0]).toContain('type="application/ld+json"');
    expect(runs(scriptsWith(page.html, "__siteHeadMarker")[0])).toBe(true);
  });

  it("still lose event handlers and iframes", async () => {
    const [page] = postProcessPages([{ path: "index.html", html: await exportedHome() }], { formTarget: null }).pages;
    expect(page.html).not.toContain("steal()");
    expect(page.html).not.toContain("evil.example");
  });

  it("run in the ZIP", async () => {
    const zip = await JSZip.loadAsync(await (await new ExportEngine(site()).generateZip()).arrayBuffer());
    const html = await zip.file("index.html")!.async("string");
    expect(runs(scriptsWith(html, "__siteBodyMarker")[0])).toBe(true);
  });

  it("are still stripped from the single-file export the Preview renders", () => {
    const html = new ExportEngine(site()).generateHTML();
    expect(html).not.toContain("__siteBodyMarker");
    expect(html).not.toContain("__siteHeadMarker");
    expect(html).toContain("widget.example.com/chat.js");
  });
});
