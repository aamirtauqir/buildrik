/**
 * S-1 (review round 4): project-level style rules are written as
 * `${selector} {` inside `@media ${query}` into the preview document, the
 * single-file export's <style> and the published stylesheet, and element ids
 * into `.buildrick-<id>` / `[data-buildrick-id="<id>"]`. The load boundary
 * (importProject → StyleEngine.importStyles, sanitizeElementTreeContent)
 * keeps none that could leave the stylesheet; legitimate ones survive.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, it, expect } from "vitest";
import { Composer } from "../Composer";
import { sanitizeElementTreeContent } from "@/shared/utils/html/sanitization";
import type { ElementData } from "@/shared/types";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const HOSTILE_SELECTOR = "a{}</style><script>alert(1)</script><style>";
const HOSTILE_QUERY = "(max-width: 767px){}</style><script>alert(2)</script><style>";
const HOSTILE_ID = 'x"]{}</style><script>alert(3)</script>';

function load(): Composer {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div",
        children: [
          { id: "h", type: "heading", tagName: "h2", content: "Hi", children: [], styles: { color: "red" } },
          { id: HOSTILE_ID, type: "text", tagName: "p", content: "Kept", children: [], styles: { padding: "2px" } },
        ],
      },
    }],
    styles: [
      { id: "ok", selector: '[data-buildrick-id="h"]', properties: { color: "blue" }, mediaQuery: "(max-width: 767px)" },
      { id: "hover", selector: '[data-buildrick-id="h"]:hover', properties: { color: "green" } },
      { id: "sel", selector: HOSTILE_SELECTOR, properties: { color: "red" } },
      { id: "mq", selector: ".b", properties: { color: "red" }, mediaQuery: HOSTILE_QUERY },
    ],
  } as never);
  return composer;
}

describe("importProject — project style rules", () => {
  it("drops a rule whose selector or media query could leave the stylesheet", () => {
    expect(load().styles.exportStyles().map((s) => s.id)).toEqual(["ok", "hover"]);
  });

  it("leaves no script in the preview document or the single-file export", async () => {
    const composer = load();
    const { combined } = composer.exportHTML();
    expect(combined).not.toMatch(/<script>alert/);
    expect(combined).toContain("(max-width: 767px)");
    expect(combined).toContain(":hover");
    const { ExportEngine } = await import("../export/ExportEngine");
    const single = new ExportEngine(composer).generateHTML({ cssStyle: "embedded" });
    expect(single).not.toMatch(/<script>alert/);
  });
});

describe("sanitizeElementTreeContent — element ids", () => {
  it("gives an unsafe id a fresh one and keeps the node", () => {
    const tree = {
      id: "root", type: "container",
      children: [{ id: HOSTILE_ID, type: "text", content: "Kept" }, { id: "el-ok_1", type: "text" }],
    } as unknown as ElementData;
    sanitizeElementTreeContent(tree);
    const [bad, good] = tree.children as ElementData[];
    expect(bad.id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(bad.content).toBe("Kept");
    expect(good.id).toBe("el-ok_1");
    expect(tree.id).toBe("root");
  });

  it("an imported page carries no unsafe id into any export", async () => {
    const composer = load();
    const { ExportEngine } = await import("../export/ExportEngine");
    const { files } = await new ExportEngine(composer).exportAllPages({ format: "html" });
    const all = files.map((f) => f.content).join("\n") + composer.exportHTML().combined;
    expect(all).not.toMatch(/<script>alert/);
    expect(all).toContain("Kept");
  });
});
