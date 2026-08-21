// @vitest-environment jsdom
/**
 * CMSExportResolver — what a published page keeps when bindings resolve.
 *
 * Resolution used to be opt-in (`cmsMode`), and nothing opted in: publish and
 * the ZIP export both called exportAllPages without it, so an element bound to
 * a collection shipped the placeholder text sitting in the tree while the
 * canvas beside it showed the real entry. Making "static" the default put this
 * resolver on the path of EVERY export and immediately exposed two things it
 * had never had to survive: a full HTML document, and a composer with no CMS.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { CMSExportResolver } from "../CMSExportResolver";
import type { Composer } from "../../Composer";

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><title>Their Title</title>
<link rel="stylesheet" href="styles.css">
<meta name="description" content="Their description."></head>
<body><h1 data-buildrick-id="h1" data-buildrick-selected="true" data-cms-bound="true">Placeholder</h1></body></html>`;

function composerWith(bindings: unknown): Composer {
  return { cms: { bindings } } as unknown as Composer;
}

const boundTo = (value: string) => ({
  getBindings: (id: string) =>
    id === "h1" ? [{ property: "content", collectionId: "c", fieldId: "title" }] : [],
  resolveBinding: vi.fn().mockResolvedValue(value),
});

describe("static resolution keeps the document it was given", () => {
  it("returns a whole page, not just its body", async () => {
    const html = await new CMSExportResolver(composerWith(boundTo("Real Title"))).resolve(PAGE, {
      mode: "static",
    });
    expect(html).toMatch(/^<!DOCTYPE html>/i);
    expect(html).toContain("<title>Their Title</title>");
    expect(html).toContain('<link rel="stylesheet" href="styles.css">');
    expect(html).toContain('content="Their description."');
    expect(html).toContain('lang="en"');
  });

  it("applies the bound value to the element", async () => {
    const html = await new CMSExportResolver(composerWith(boundTo("Real Title"))).resolve(PAGE, {
      mode: "static",
    });
    expect(html).toContain("Real Title");
    expect(html).not.toContain("Placeholder");
  });

  it("keeps data-buildrick-id — the breakpoint CSS selects on it", async () => {
    const html = await new CMSExportResolver(composerWith(boundTo("X"))).resolve(PAGE, {
      mode: "static",
    });
    expect(html).toContain('data-buildrick-id="h1"');
    // Editor-only state does go.
    expect(html).not.toContain("data-buildrick-selected");
    expect(html).not.toContain("data-cms-bound");
  });

  it("still returns a fragment when given a fragment", async () => {
    const frag = '<div data-buildrick-id="h1">Placeholder</div>';
    const html = await new CMSExportResolver(composerWith(boundTo("Real"))).resolve(frag, {
      mode: "static",
    });
    expect(html).not.toMatch(/<html/i);
    expect(html).toContain("Real");
  });
});

describe("a site with no CMS exports unchanged", () => {
  it("passes the page through when the composer has no cms manager", async () => {
    const resolver = new CMSExportResolver({} as unknown as Composer);
    expect(await resolver.resolve(PAGE, { mode: "static" })).toBe(PAGE);
  });

  it("passes the page through when there are no bindings", async () => {
    const resolver = new CMSExportResolver(composerWith(undefined));
    expect(await resolver.resolve(PAGE, { mode: "static" })).toBe(PAGE);
  });

  it("leaves mode:none alone entirely", async () => {
    const resolver = new CMSExportResolver(composerWith(boundTo("Real")));
    expect(await resolver.resolve(PAGE, { mode: "none" })).toBe(PAGE);
  });
});
