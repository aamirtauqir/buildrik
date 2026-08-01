/**
 * Published sites must not depend on EDITOR CHROME tokens.
 *
 * Two token systems exist and they are deliberately separate domains:
 *   --bk-*              chrome (editor UI), generated from Figma, defined by
 *                       themes/tokens.generated.css, loaded ONLY in the editor
 *   --buildrick-design-* site-builder, the ONLY namespace CSSBundler emits into
 *                       the :root of a customer's published page
 *
 * Blocks under src/blocks/ are customer output. A `var(--bk-*)` in a block's
 * `styles:` resolves fine inside the editor canvas (chrome tokens are on :root
 * there) and resolves to NOTHING on the published site, where the declaration
 * becomes invalid at computed-value time and silently drops. Same failure shape
 * as the --buildrick-surface-2/-3 incident: undefined CSS vars fail silently, so
 * the editor looks correct while the shipped page does not.
 *
 * How it got in: two hex→token codemods (12d0d298, be52e1a8) swept 49 + 33
 * files with chrome tokens and did not exclude blocks/; 82350776 then renamed
 * that layer to --bk-*.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
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

/** Export one element carrying the given styles and return the whole document. */
function exportWithStyles(styles: Record<string, string>): string {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "p",
        name: "P",
        slug: "p",
        root: {
          id: "root",
          type: "container" as const,
          tagName: "div",
          children: [
            { id: "styled", type: "container" as const, tagName: "div", styles, children: [] },
          ],
        },
      },
    ],
  } as never);
  return new ExportEngine(composer).generateHTML();
}

describe("published output never depends on chrome tokens", () => {
  it("a chrome token in element styles reaches the page with no definition behind it", () => {
    const out = exportWithStyles({ background: "var(--bk-bg-card)" });

    // If the exporter ever stops carrying styles at all, this test would pass
    // vacuously. Assert the style really shipped before asserting about tokens.
    expect(out).toContain("var(--bk-bg-card)");
    // ...and nothing in the published document defines it. This is the bug:
    // the declaration is dead on arrival in the customer's browser.
    expect(out).not.toMatch(/--bk-bg-card\s*:/);
  });

  it("emits the site-builder namespace, which is the one blocks may rely on", () => {
    const out = exportWithStyles({ background: "var(--buildrick-design-color-surface)" });
    expect(out).toContain("var(--buildrick-design-color-surface)");
  });
});

/**
 * The source-level guard. The export assertion above proves the mechanism on one
 * synthetic element; this walks the real block sources, which is where the 27
 * references actually live. Kept in the same file so a future token sweep that
 * re-introduces them fails here rather than in a customer's browser.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p) && !p.includes("__tests__")) out.push(p);
  }
  return out;
}

describe("blocks/ source carries no chrome tokens", () => {
  it("no src/blocks file references --bk-*", () => {
    const root = join(__dirname, "..", "..", "..", "blocks");
    const offenders: string[] = [];
    for (const file of walk(root)) {
      const src = readFileSync(file, "utf8");
      const hits = src.match(/var\(--bk-[a-z0-9-]+/g);
      if (hits) offenders.push(`${file.split("/src/")[1]}: ${[...new Set(hits)].join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });
});
