import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

/**
 * The AI-generated-site export path, end to end through a REAL Composer.
 *
 * `ExportEngine.formats.test.ts` covers the same fix against a hand-built
 * composer mock. That is not enough on its own: the mock's `getData()` was
 * written by hand, and an earlier version of it dropped `contentFormat`
 * entirely — the fix was correct and the mock made it look broken. The inverse
 * is the danger here. If the real load path mapped fields one by one instead of
 * carrying the whole object, `contentFormat` would be silently dropped between
 * the database and the exporter, every unit test would still pass, and AI sites
 * would still publish as visible angle brackets.
 *
 * So this walks the actual chain: a page in the exact shape
 * `ai-generate/[jobId]/route.ts` writes to `Page.blocks` → `importProject` →
 * `buildElementTree` → `new Element(data)` → `elementToHTML`.
 */

// A real Composer builds a MediaManager, which builds a MediaOptimizer, which
// needs a 2D canvas context. jsdom returns null for getContext, so the
// constructor throws. Stub the minimum it touches — this is why the sibling
// suites hand-build a composer mock instead. The point of THIS file is to avoid
// that mock, so stub the environment rather than the object under test.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {},
    clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];

  // MediaManager.init() also opens IndexedDB, which jsdom does not implement.
  // It runs async from the Composer constructor, so without this the tests pass
  // while the file reports unhandled "indexedDB is not defined" errors. A green
  // run that prints errors is the thing this whole session kept finding; do not
  // ship one. `open()` returning a request nobody resolves is enough — the
  // export path never touches media.
  (globalThis as { indexedDB?: unknown }).indexedDB = {
    open: () => ({ onsuccess: null, onerror: null, onupgradeneeded: null, result: null }),
  };
});

/** Mirrors the block shape the AI worker persists (route.ts:44-53). */
function aiPageData(html: string) {
  return {
    id: "page-1",
    name: "Home",
    slug: "home",
    root: {
      id: "root",
      type: "container" as const,
      tagName: "div",
      classes: ["buildrick-page-root"],
      children: [
        {
          id: "ai-hero-0",
          type: "container" as const,
          tagName: "section",
          classes: ["ai-section-hero"],
          contentFormat: "html" as const,
          content: html,
          children: [],
        },
      ],
    },
  };
}

function exportFrom(html: string): string {
  const composer = new Composer({} as never);
  composer.importProject({ pages: [aiPageData(html)] } as never);
  return new ExportEngine(composer).generateHTML();
}

describe("AI-generated content survives the real load path", () => {
  it("carries contentFormat from stored page data through to the exporter", () => {
    const out = exportFrom("<h1>Acme</h1><p>We build things.</p>");

    expect(out).toContain("<h1>Acme</h1>");
    expect(out).toContain("<p>We build things.</p>");
    // The failure this whole fix exists for: markup published as text.
    expect(out).not.toContain("&lt;h1&gt;");
  });

  it("still sanitizes on the real path, not just through the mock", () => {
    const out = exportFrom('<p>safe</p><script>alert(1)</script><img src=x onerror="alert(2)">');

    expect(out).toContain("<p>safe</p>");
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("onerror");
  });

  it("leaves ordinary text content escaped when contentFormat is absent", () => {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [
        {
          id: "p", name: "P", slug: "p",
          root: {
            id: "root", type: "container" as const, tagName: "div",
            children: [{ id: "t", type: "text" as const, content: "<b>typed</b>", children: [] }],
          },
        },
      ],
    } as never);

    const out = new ExportEngine(composer).generateHTML();
    expect(out).toContain("&lt;b&gt;typed&lt;/b&gt;");
    expect(out).not.toContain("<b>typed</b>");
  });
});
