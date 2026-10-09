/**
 * S-1: the CSS writers are the last check. A rule, element id
 * or class that got past the load boundary (set live, or by a future path)
 * must still not leave the stylesheet, and nothing placed inside a <style> —
 * including the site's own Global CSS — may close it.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, it, expect, vi } from "vitest";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "../ExportEngine";
import type { PageData } from "@/shared/types";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const HOSTILE_SELECTOR = "a{}</style><script>alert(1)</script><style>";
const HOSTILE_QUERY = "(max-width: 767px){}</style><script>alert(2)</script><style>";
const HOSTILE_ID = 'x{}</style><script>alert(3)</script>';

function composer(extra: Record<string, unknown> = {}): Composer {
  const c = new Composer({} as never);
  c.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div",
        children: [{ id: "h", type: "heading", tagName: "h2", content: "Hi", children: [], styles: { color: "red" }, ...extra }],
      },
    }],
  } as never);
  return c;
}

/** Every script a browser would run from this document. */
function scripts(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("script")].map((s) => s.textContent ?? "");
}

describe("style rules set after load", () => {
  function hostile(): Composer {
    const c = composer();
    c.styles.setRule(HOSTILE_SELECTOR, { color: "red" });
    c.styles.setRule(".b", { color: "red" }, { mediaQuery: HOSTILE_QUERY });
    c.styles.setRule('[data-buildrick-id="h"]', { color: "blue" }, { mediaQuery: "(max-width: 767px)" });
    return c;
  }

  it("are not written by the preview document", () => {
    const { combined, css } = hostile().exportHTML();
    expect(css).not.toContain("alert");
    expect(scripts(combined).join()).not.toContain("alert");
    expect(css).toContain('@media (max-width: 767px)');
  });

  it("are not written by the single-file export or the published stylesheet", async () => {
    const c = hostile();
    const single = new ExportEngine(c).generateHTML({ cssStyle: "embedded" });
    expect(single).not.toContain("alert");
    const { files } = await new ExportEngine(c).exportAllPages({ format: "html" });
    expect(files.map((f) => f.content).join("\n")).not.toContain("alert");
  });
});

describe("element ids that reach a writer unchecked", () => {
  it("are left out of the single-file stylesheet", () => {
    const c = composer();
    const el = c.elements.getElement("h");
    if (!el) throw new Error("no element");
    vi.spyOn(el, "getId").mockReturnValue(HOSTILE_ID);
    const css = new ExportEngine(c).generateCSS({ cssStyle: "embedded" });
    expect(css).not.toContain("alert");
  });

  it("are left out of the published base stylesheet", async () => {
    const c = composer();
    const page: PageData = {
      id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container", children: [{ id: HOSTILE_ID, type: "text", content: "x", styles: { color: "red" } }] },
    } as never;
    vi.spyOn(c.elements, "exportPages").mockReturnValue([page]);
    const { files } = await new ExportEngine(c).exportAllPages({ format: "html" });
    const css = files.find((f) => f.name === "styles.css")?.content ?? "";
    expect(css).not.toContain("alert");
  });
});

describe("CSS inside a <style> cannot close it", () => {
  const GLOBAL = "body { color: red }</STYLE><script>alert(4)</script><style>";

  it("Global CSS stays CSS in the single-file export and on every published page", async () => {
    const c = composer();
    c.setProjectSettings({ ...c.getProjectSettings(), customCode: { globalCss: GLOBAL } } as never);
    const single = new ExportEngine(c).generateHTML({ cssStyle: "embedded" });
    expect(scripts(single).join()).not.toContain("alert");
    expect(single).toContain("body { color: red }");
    const { files } = await new ExportEngine(c).exportAllPages({ format: "html" });
    for (const f of files.filter((file) => file.type === "html")) {
      expect(scripts(f.content).join()).not.toContain("alert");
    }
  });

  it("the canvas frame's document keeps the CSS inside its <style>", () => {
    const c = composer();
    const written: string[] = [];
    const doc = { open: () => {}, close: () => {}, write: (s: string) => written.push(s) };
    vi.spyOn(c.viewport, "getDocument").mockReturnValue(doc as never);
    c.viewport.setContent("<p>x</p>", "a{}</style><script>alert(5)</script>");
    expect(scripts(written.join("")).join()).not.toContain("alert");
  });
});

describe("single-file export class attribute", () => {
  it("is escaped like the published writer's", () => {
    const c = composer({ classes: ['x" onmouseover="alert(6)'] });
    const html = new ExportEngine(c).generateHTML({ cssStyle: "embedded" });
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelector("[onmouseover]")).toBeNull();
  });
});
