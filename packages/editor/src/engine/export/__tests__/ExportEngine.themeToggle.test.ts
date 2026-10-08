import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function site(darkMode: "auto" | "off", withToggle: boolean) {
  const c = new Composer({} as never);
  const children = withToggle
    ? [{ id: "tt", type: "button", tagName: "button", attributes: { "data-bk-theme-toggle": "true" }, children: [] }]
    : [];
  c.importProject({ pages: [{ id: "p", name: "Home", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children } }] } as never);
  c.setProjectSettings({ ...c.getProjectSettings(), designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode });
  return c;
}

const head = (html: string) => html.slice(0, html.indexOf("</head>"));
const body = (html: string) => html.slice(html.indexOf("<body>"));

describe("theme toggle in export and publish (spec D12, test 22)", () => {
  it("Auto: boot script first in head, runtime in body, icon-swap CSS, on single file and every published page", async () => {
    const single = new ExportEngine(site("auto", true)).generateHTML();
    const { files } = await new ExportEngine(site("auto", true)).exportAllPages({ format: "html" });
    const published = files.find((f) => f.name === "index.html")!.content;
    for (const html of [single, published]) {
      expect(html).toContain('data-bk-theme-toggle="true"');
      const h = head(html);
      expect(h).toContain("data-buildrick-theme-boot");
      expect(h.indexOf("data-buildrick-theme-boot")).toBeLessThan(h.indexOf("<style") === -1 ? Infinity : h.indexOf("<style"));
      expect(body(html)).toContain("data-buildrick-theme-toggle-runtime");
    }
    const css = files.find((f) => f.name.endsWith(".css"))?.content ?? published;
    expect(css + single).toContain(':root[data-theme="dark"] [data-bk-theme-toggle] [data-bk-tt="dark"]{background-color:var(--buildrick-design-color-primary)');
  });

  it("Off: every toggle hidden on publish; no boot script, no runtime", () => {
    const html = new ExportEngine(site("off", true)).generateHTML();
    expect(html).toContain("[data-bk-theme-toggle]{display:none!important}");
    expect(html).not.toContain("data-buildrick-theme-boot");
    expect(html).not.toContain("data-buildrick-theme-toggle-runtime");
  });

  it("a site with no toggle is byte-for-byte what it was", () => {
    const html = new ExportEngine(site("auto", false)).generateHTML();
    expect(html).not.toContain("data-bk-theme-toggle");
    expect(html).not.toContain("data-buildrick-theme");
  });
});
