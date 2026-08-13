/**
 * The Link inspector writes an internal page link as `href="#page:<pageId>"`
 * (LinkSection:187) and nothing else in the package has ever read that scheme.
 * Exported verbatim it is a fragment for an id that does not exist, so every
 * internal link on a published site did nothing — which is a broken published
 * site, not a broken editor, and therefore invisible from inside the editor.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { ExportEngine } from "../ExportEngine";

const link = (href: string) => ({
  id: "a1",
  type: "link",
  tagName: "a",
  content: "Go",
  children: [],
  attributes: { href },
});

const pages = [
  {
    id: "p1",
    name: "Home",
    slug: "home",
    isHome: true,
    root: { id: "r1", type: "container", tagName: "div", children: [link("#page:p2")] },
  },
  {
    id: "p2",
    name: "Pricing",
    slug: "pricing",
    isHome: false,
    root: { id: "r2", type: "container", tagName: "div", children: [link("#page:p1")] },
  },
];

function makeComposer(pageSet: unknown[]) {
  return {
    elements: { exportPages: vi.fn().mockReturnValue(pageSet) },
    styles: {
      generateResponsiveCSS: vi.fn().mockReturnValue(""),
      generateCSS: vi.fn().mockReturnValue(""),
    },
    getProjectSettings: vi.fn().mockReturnValue(undefined),
  } as unknown as ConstructorParameters<typeof ExportEngine>[0];
}

async function exportFiles(pageSet: unknown[]) {
  const { files } = await new ExportEngine(makeComposer(pageSet)).exportAllPages({
    format: "html",
  });
  return new Map(files.map((f) => [f.name, f.content]));
}

describe("ExportEngine — internal page links", () => {
  it("resolves #page:<id> to the file that page is written to", async () => {
    const out = await exportFiles(pages);

    expect(out.get("index.html")).toContain('href="pricing.html"');
    expect(out.get("pricing.html")).toContain('href="index.html"');
  });

  it("never ships the raw scheme", async () => {
    const out = await exportFiles(pages);

    for (const html of out.values()) expect(html).not.toContain("#page:");
  });

  it("falls back to home for a page that no longer exists", async () => {
    const out = await exportFiles([
      {
        ...pages[0],
        root: { id: "r1", type: "container", tagName: "div", children: [link("#page:deleted")] },
      },
    ]);

    expect(out.get("index.html")).toContain('href="index.html"');
  });

  it("leaves external, mailto and anchor hrefs alone", async () => {
    const out = await exportFiles([
      {
        ...pages[0],
        root: {
          id: "r1",
          type: "container",
          tagName: "div",
          children: [link("https://example.com"), link("mailto:a@b.c"), link("#section")],
        },
      },
    ]);

    const html = out.get("index.html") ?? "";
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="mailto:a@b.c"');
    expect(html).toContain('href="#section"');
  });
});
