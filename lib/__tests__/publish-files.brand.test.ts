/**
 * A Brand-heavy page through the WHOLE publish chain, without publishing:
 * the editor's publish export (`exportPublishPages`, the payload the Publish
 * button sends) → the worker's own page passes (`wireSliders`,
 * `wireWidgetRuntimes`) → `buildDeployFiles`, the file set Vercel would get.
 *
 * Final Brand QA (2026-10-09) checked dark Auto, the theme toggle and token CSS
 * on the single-file export only; nothing proved the deployed page carries the
 * same thing. The worker only injects, so every line the export wrote must
 * reach the deployed file, and the token CSS must be the same bytes the
 * single-file export (and the canvas) use.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { buildDeployFiles, type DeployInputs } from "@lib/publish-files";
import { wireSliders } from "@lib/publish-sliders";
import { wireWidgetRuntimes } from "@lib/publish-widgets";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "@/engine/export/ExportEngine";
import { emitSiteTokenCss } from "@/engine/export/ExportHelpers";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { exportPublishPages } from "@/editor/shell/exportPublishPages";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {},
    clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

/** A custom semantic colour with its own dark value (what Dark Auto fills). */
const BRAND_X = {
  id: "color-brand-x",
  name: "Brand X",
  kind: "color",
  layer: "semantic",
  modes: { light: { value: "#C2410C" }, dark: { value: "#F17953" } },
  category: "colors",
  cssVar: "--buildrick-design-color-brand-x",
  type: "color",
  group: "brand",
};

function brandSite(darkMode: "auto" | "off") {
  const c = new Composer({} as never);
  const children = [
    { id: "h", type: "heading", tagName: "h1", content: "Bella", styles: { color: "var(--buildrick-design-color-brand-x)" }, children: [] },
    {
      id: "cta",
      type: "button",
      tagName: "button",
      content: "Book",
      styles: { "background-color": "var(--buildrick-design-color-primary)", color: "var(--buildrick-design-color-on-primary)" },
      children: [],
    },
    { id: "p", type: "paragraph", tagName: "p", content: "Body", styles: { color: "var(--buildrick-design-color-text)" }, children: [] },
    {
      id: "tt",
      type: "button",
      tagName: "button",
      attributes: { "data-bk-theme-toggle": "true" },
      children: [
        { id: "tt-l", type: "text", tagName: "span", content: "Light", attributes: { "data-bk-tt": "light" }, children: [] },
        { id: "tt-d", type: "text", tagName: "span", content: "Dark", attributes: { "data-bk-tt": "dark" }, children: [] },
      ],
    },
  ];
  c.importProject({
    pages: [
      { id: "home", name: "Home", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children } },
      { id: "about", name: "About", slug: "about", root: { id: "root2", type: "container", tagName: "div", children: [] } },
    ],
  } as never);
  c.setProjectSettings({
    ...c.getProjectSettings(),
    designTokens: [...DEFAULT_TOKENS, BRAND_X],
    designTokensSchemaVersion: 6,
    darkMode,
  } as never);
  return c;
}

const inputs = (pages: DeployInputs["pages"]): DeployInputs => ({
  siteId: "site-brand",
  pages,
  origin: "https://brand.example",
  icons: { favicon: null, touchIcon: null, ogImage: null },
  canonicalUrl: null,
  allowIndexing: true,
  robotsTxt: null,
  appScripts: "",
  showBadge: true,
  redirects: [],
  domains: [],
  headers: { cspPolicy: null, hstsMaxAge: null, xFrameOptions: null, referrerPolicy: null, permissionsPolicy: null },
  now: "2026-10-09T00:00:00.000Z",
});

/** What the worker route does to the editor's pages before buildDeployFiles. */
async function deploy(c: Composer) {
  const exported = await exportPublishPages(c);
  const worked = exported.map((p) => ({ ...p, html: wireWidgetRuntimes(wireSliders(p.html)) }));
  return { exported, files: buildDeployFiles(inputs(worked)) };
}

const head = (html: string) => html.slice(0, html.indexOf("</head>"));
const body = (html: string) => html.slice(html.indexOf("<body"));
const file = (files: { file: string; data: string }[], name: string) => files.find((f) => f.file === name)?.data ?? "";

describe("publish file builder = export, for a Brand-heavy page", () => {
  it("Dark Auto: the deployed page carries the export's token CSS, boot script and toggle runtime", async () => {
    const c = brandSite("auto");
    const { exported, files } = await deploy(c);
    const single = new ExportEngine(brandSite("auto")).generateHTML();
    const tokenCss = emitSiteTokenCss(c.getProjectSettings() as never, { migrate: true, hasThemeToggle: true });

    expect(files.map((f) => f.file)).toEqual(["index.html", "about.html", "robots.txt", "sitemap.xml"]);
    const deployed = file(files, "index.html");
    expect(deployed).toContain('data-bk-theme-toggle="true"');
    expect(deployed).toContain("var(--buildrick-design-color-brand-x)");

    // Same token bytes as the single-file export and the emitter itself.
    expect(tokenCss).toContain("prefers-color-scheme: dark");
    expect(tokenCss).toContain("--buildrick-design-color-brand-x:#F17953");
    expect(tokenCss).toContain(':root[data-theme="dark"] [data-bk-theme-toggle] [data-bk-tt="dark"]');
    expect(single).toContain(tokenCss);
    expect(deployed).toContain(tokenCss);

    // Boot script in <head>, ahead of the inlined sheet (no flash); runtime in body.
    const h = head(deployed);
    expect(h).toContain("data-buildrick-theme-boot");
    expect(h.indexOf("data-buildrick-theme-boot")).toBeLessThan(h.indexOf("<style"));
    expect(body(deployed)).toContain("data-buildrick-theme-toggle-runtime");
    expect(deployed).not.toContain("[data-bk-theme-toggle]{display:none!important}");

    // The worker only injects: every line the export wrote reaches the deployed page.
    const page = exported.find((p) => p.path === "index.html")!.html;
    const missing = page.split("\n").map((l) => l.trim()).filter((l) => l && !deployed.includes(l));
    expect(missing).toEqual([]);
    // …and nothing the export never wrote about Brand appears.
    expect(deployed.match(/data-buildrick-theme-boot/g)).toHaveLength(1);
    expect(deployed.match(/data-buildrick-theme-toggle-runtime/g)).toHaveLength(1);

    // The page without a toggle still ships the dark tokens (the sheet is site-wide).
    expect(file(files, "about.html")).toContain(tokenCss);
  });

  it("Off: the deployed page hides the toggle and ships no boot script, runtime or dark block", async () => {
    const c = brandSite("off");
    const { exported, files } = await deploy(c);
    const deployed = file(files, "index.html");
    const tokenCss = emitSiteTokenCss(c.getProjectSettings() as never, { migrate: true, hasThemeToggle: true });

    expect(tokenCss).toContain("[data-bk-theme-toggle]{display:none!important}");
    expect(deployed).toContain(tokenCss);
    expect(deployed).not.toContain("prefers-color-scheme: dark");
    expect(deployed).not.toContain("data-buildrick-theme-boot");
    expect(deployed).not.toContain("data-buildrick-theme-toggle-runtime");
    const page = exported.find((p) => p.path === "index.html")!.html;
    expect(page.split("\n").map((l) => l.trim()).filter((l) => l && !deployed.includes(l))).toEqual([]);
  });
});
