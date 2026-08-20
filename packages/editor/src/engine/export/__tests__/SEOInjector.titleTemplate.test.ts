/**
 * The site title template is applied by the code, not just stored by it.
 *
 * `sites.metaTitleTemplate` has a Prisma column, a dashboard row that shows it
 * with a `{page_title} | {site_name}` placeholder, and a pre-publish check that
 * grades it ("SEO configured" — pass when set, warning when not). Nothing ever
 * substituted it: a site that set "Acme — {page_title}" published pages titled
 * "Home". It also had no field anywhere that could set it, so that check was
 * permanently a warning.
 *
 * Walked live: with the template set, Preview and the export modal's seeded
 * Title field both read "Home | Acme Co"; with it cleared, both read "Home".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";
import { resolvePageTitle } from "../SEOInjector";
import type { PageData, SiteSEO } from "@/shared/types/project";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const SEO: SiteSEO = { siteName: "Acme Co", metaTitleTemplate: "{page_title} | {site_name}" };
const page = { id: "p", name: "Home", slug: "", isHome: true } as unknown as PageData;

/* Read through resolvePageTitle — the template helper stays private to the
   injector so there is one entry point for "what is this page called". */
const pricing = { id: "q", name: "Pricing", slug: "pricing" } as unknown as PageData;

describe("the title template", () => {
  it("substitutes both tokens", () => {
    expect(resolvePageTitle(pricing, undefined, undefined, SEO)).toBe("Pricing | Acme Co");
  });

  it("is a no-op without a template", () => {
    expect(resolvePageTitle(pricing, undefined, undefined, { siteName: "Acme Co" })).toBe("Pricing");
  });

  it("ignores a template with no {page_title} — every page would ship one title", () => {
    expect(resolvePageTitle(pricing, undefined, undefined, { metaTitleTemplate: "Acme Co" }))
      .toBe("Pricing");
  });

  it("leaves {site_name} empty rather than printing the token", () => {
    expect(
      resolvePageTitle(pricing, undefined, undefined, { metaTitleTemplate: "{page_title} — {site_name}" })
    ).toBe("Pricing —");
  });
});

describe("the three heads agree", () => {
  function site() {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [{ id: "p", name: "Home", slug: "", isHome: true,
        root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
    } as never);
    const current = composer.getProjectSettings();
    composer.setProjectSettings({ ...current, seo: { ...current.seo, ...SEO } });
    return composer;
  }

  it("resolvePageTitle applies it", () => {
    expect(resolvePageTitle(page, undefined, undefined, SEO)).toBe("Home | Acme Co");
  });

  it("the publish assembler applies it", async () => {
    const result = await new ExportEngine(site()).exportAllPages({ format: "html" });
    const home = result.files.find((f) => f.name.endsWith(".html"));
    expect(home?.content).toContain("<title>Home | Acme Co</title>");
  });

  it("the preview head applies it", () => {
    expect(site().exportHTML().combined).toContain("<title>Home | Acme Co</title>");
  });

  it("a title the user typed into the export modal stays literal", async () => {
    const engine = new ExportEngine(site(), { pageTitle: "Whatever I typed" } as never);
    const result = await engine.export();
    expect(String(result.html)).toContain("<title>Whatever I typed</title>");
  });
});
