/**
 * Approved-vs-current compare (§3), fed by REAL ExportEngine output.
 *
 * The five change kinds are asserted against HTML that a Composer + ExportEngine
 * actually produced from mutated page data — never a hand-authored payload. A
 * hand-built fixture proves nothing about what the editor exports (the Stripe
 * webhook lesson): if the strip's real class/id shape drifted from what this
 * comparator keys on, a hand-fixture would still pass while production reads as
 * one giant "everything changed".
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "@/engine/export/ExportEngine";
import { compareApprovedToCurrent, type ComparePage } from "../approvedCompare";

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

/** A page whose root holds N sections, each a stable-id container. */
function pageData(sections: { id: string; heading: string; style?: Record<string, string> }[]) {
  return {
    id: "page-1",
    name: "Home",
    slug: "home",
    root: {
      id: "root",
      type: "container" as const,
      tagName: "div",
      classes: ["buildrick-page-root"],
      children: sections.map((s) => ({
        id: s.id,
        type: "container" as const,
        tagName: "section",
        styles: s.style ?? {},
        children: [
          { id: `${s.id}-h`, type: "text" as const, tagName: "h2", content: s.heading, children: [] },
        ],
      })),
    },
  };
}

function exportOf(sections: Parameters<typeof pageData>[0]): string {
  const composer = new Composer({} as never);
  composer.importProject({ pages: [pageData(sections)] } as never);
  return new ExportEngine(composer).generateHTML();
}

function page(html: string): ComparePage[] {
  return [{ path: "home", html }];
}

const BASE = [
  { id: "hero", heading: "Welcome to Acme" },
  { id: "features", heading: "What we do" },
  { id: "contact", heading: "Get in touch" },
];

describe("compareApprovedToCurrent (§3)", () => {
  it("reports no snapshot as a state, not an error", () => {
    const result = compareApprovedToCurrent(null, page(exportOf(BASE)));
    expect(result.hasApprovedSnapshot).toBe(false);
    expect(result.changes).toHaveLength(0);
  });

  it("finds nothing when approved and current are identical", () => {
    const html = exportOf(BASE);
    const result = compareApprovedToCurrent(page(html), page(html));
    expect(result.changes).toHaveLength(0);
  });

  it("detects a content change on a surviving strip", () => {
    const approved = exportOf(BASE);
    const current = exportOf([
      { id: "hero", heading: "Welcome to Acme Corp" }, // text changed
      { id: "features", heading: "What we do" },
      { id: "contact", heading: "Get in touch" },
    ]);
    const result = compareApprovedToCurrent(page(approved), page(current));
    const content = result.changes.filter((c) => c.kind === "content");
    expect(content).toHaveLength(1);
    expect(content[0].key).toBe("buildrick-hero");
    expect(content[0].detail).toMatch(/text/i);
  });

  it("detects a style change on a surviving strip", () => {
    const approved = exportOf(BASE);
    const current = exportOf([
      { id: "hero", heading: "Welcome to Acme", style: { background: "#406ED6" } },
      { id: "features", heading: "What we do" },
      { id: "contact", heading: "Get in touch" },
    ]);
    const result = compareApprovedToCurrent(page(approved), page(current));
    const style = result.changes.filter((c) => c.kind === "style");
    expect(style).toHaveLength(1);
    expect(style[0].key).toBe("buildrick-hero");
  });

  it("detects an added strip as one change, not a cascade", () => {
    const approved = exportOf(BASE);
    const current = exportOf([
      { id: "hero", heading: "Welcome to Acme" },
      { id: "banner", heading: "Now hiring" }, // inserted
      { id: "features", heading: "What we do" },
      { id: "contact", heading: "Get in touch" },
    ]);
    const result = compareApprovedToCurrent(page(approved), page(current));
    expect(result.counts.added).toBe(1);
    expect(result.changes.find((c) => c.kind === "added")?.key).toBe("buildrick-banner");
    // The strips that merely shifted down must NOT read as content/style churn.
    expect(result.counts.content).toBe(0);
    expect(result.counts.style).toBe(0);
  });

  it("detects a removed strip", () => {
    const approved = exportOf(BASE);
    const current = exportOf([
      { id: "hero", heading: "Welcome to Acme" },
      { id: "contact", heading: "Get in touch" },
    ]);
    const result = compareApprovedToCurrent(page(approved), page(current));
    expect(result.counts.removed).toBe(1);
    expect(result.changes.find((c) => c.kind === "removed")?.key).toBe("buildrick-features");
  });

  it("detects a moved strip", () => {
    const approved = exportOf(BASE);
    const current = exportOf([
      { id: "contact", heading: "Get in touch" }, // moved to top
      { id: "hero", heading: "Welcome to Acme" },
      { id: "features", heading: "What we do" },
    ]);
    const result = compareApprovedToCurrent(page(approved), page(current));
    expect(result.counts.moved).toBeGreaterThanOrEqual(1);
    expect(result.changes.some((c) => c.kind === "moved" && c.key === "buildrick-contact")).toBe(true);
  });
});
