/**
 * S-1 (review round 3): element style values are written into the published
 * page's <style>. A stored value reading `red}</style><script>…` left the rule
 * and then the element, running script for every visitor. Such declarations
 * never reach a stylesheet; legitimate ones do.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, it, expect } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";
import { stylesToCSS } from "../ExportHelpers";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const BREAKOUT = "red}</style><script>alert(1)</script>";

function composerWithHostileStyles(): Composer {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div",
        children: [{
          id: "h", type: "heading", tagName: "h2", content: "Hi", children: [],
          styles: { color: BREAKOUT, padding: "4px", background: "linear-gradient(90deg, #fff 0%, rgba(0,0,0,.5) 100%)" },
          breakpointStyles: { tablet: { color: `blue}</style><script>alert(2)</script>`, margin: "8px" } },
        }],
      },
    }],
  } as never);
  return composer;
}

describe("style declarations that would leave the stylesheet", () => {
  it("stylesToCSS writes only safe declarations", () => {
    const css = stylesToCSS({ color: BREAKOUT, backgroundColor: "var(--x)", "x y": "1" }, true);
    expect(css).toBe("background-color: var(--x);");
  });

  it("never reach a published page; the safe ones do", async () => {
    const composer = composerWithHostileStyles();
    const { files } = await new ExportEngine(composer).exportAllPages({ format: "html" });
    const all = files.map((f) => f.content).join("\n");
    expect(all).not.toMatch(/<script>alert/);
    expect(all).not.toContain("</style><script");
    expect(all).toContain("padding: 4px");
    expect(all).toContain("linear-gradient(90deg, #fff 0%, rgba(0,0,0,.5) 100%)");
  });

  it("never reach the single-file export either", () => {
    const { combined } = composerWithHostileStyles().exportHTML();
    expect(combined).not.toMatch(/<script>alert/);
  });
});
