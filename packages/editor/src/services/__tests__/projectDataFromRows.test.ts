/**
 * The `/share/<token>` draft preview path end to end, minus the browser:
 * dashboard rows (as `getShareDraftRows` returns them) → projectDataFromRows
 * → renderProjectPages → the publish pages.
 */
import { beforeAll, describe, it, expect, vi } from "vitest";
import { projectDataFromRows } from "../BuildrikSyncProvider";
import { cmsFromRows } from "../cmsSync";
import { renderProjectPages } from "@/editor/shell/exportPublishPages";

/* jsdom has no canvas; MediaOptimizer asks for a 2d context at construction. */
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  // registerLibraryFont decodes the file through FontFace — jsdom has none.
  vi.stubGlobal("FontFace", class {
    constructor(public family: string, public source: string) {}
    load = async () => this;
  });
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { add: () => {}, delete: () => {}, forEach: () => {}, load: () => Promise.resolve([]), ready: Promise.resolve() },
  });
});

const heading = (id: string, content: string) => ({
  id: "root-" + id,
  type: "container",
  children: [{ id, type: "heading", content }],
});

describe("projectDataFromRows → renderProjectPages", () => {
  it("renders every page from the saved rows, in position order, with site columns merged", async () => {
    const project = projectDataFromRows(
      { name: "Bella", publishedUrl: null, projectStyles: [{ id: "tok", kind: "token" }], projectSettings: {}, dsSchemaVersion: 0 },
      [
        { id: "p2", name: "Menu", slug: "menu", isHomePage: false, position: 1, blocks: heading("h2", "Our menu") },
        { id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0, blocks: heading("h1", "Welcome to Bella") },
      ],
      { name: "Bella", metaTitle: "Bella Cucina" },
    );

    expect(project.pagesOrder).toEqual(["p1", "p2"]);
    expect(project.styles).toEqual([]); // token entries are not CSS rules
    expect(project.settings?.seo?.metaTitle).toBe("Bella Cucina");

    const pages = await renderProjectPages(project);
    // Each rendered page names its source page — the /share menu shows NAMES
    // and links pages by SLUG.
    expect(pages.map((p) => [p.path, p.name, p.slug])).toEqual([
      ["index.html", "Home", "home"],
      ["menu.html", "Menu", "menu"],
    ]);
    const byPath = Object.fromEntries(pages.map((p) => [p.path, p.html]));
    expect(byPath["index.html"]).toContain("Welcome to Bella");
    expect(Object.values(byPath).join("\n")).toContain("Our menu");
    // The stylesheet is inlined, as for publish — a srcdoc frame has no styles.css to fetch.
    expect(byPath["index.html"]).not.toContain('href="styles.css"');
  });

  /* The share preview's scratch composer has no media library; the site's
     ADDED fonts come in with the rows, or the page names a family and loads
     nothing (2026-09-24: 'Inter Var' on the scratch-ver draft). */
  it("declares the site's added font the draft uses, from the rows", async () => {
    const url = "https://x.public.blob.vercel-storage.com/Inter-Var-abc.woff2";
    const project = projectDataFromRows(
      { name: "Bella", projectStyles: [], projectSettings: {} },
      [{
        id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0,
        blocks: { id: "r", type: "container", children: [
          { id: "h", type: "heading", content: "Hi", styles: { "font-family": "'Inter Var', sans-serif" } },
        ] },
      }],
      null,
    );
    const [withFont] = await renderProjectPages(project, [{ filename: "Inter-Var.woff2", url }]);
    expect(withFont.html).toContain(`@font-face{font-family:"Inter Var";src:url("${url}")`);

    const [without] = await renderProjectPages(project);
    expect(without.html).not.toMatch(/@font-face/);
  });

  /* Ldata bug B: the Site row carries the editor's CMS bindings
     (`projectCmsBindings`, written by sites.saveProject). The load must hand
     them to Composer.importProject as `cmsBindings`, or every reload unbinds
     every element and the next publish ships the placeholder copy. */
  it("carries the stored CMS bindings into the project it loads", () => {
    const cmsBindings = {
      field: {
        h: [{
          binding: { sourceId: "cms:col-1", path: "title", type: "variable" },
          collectionId: "col-1", fieldSlug: "title", property: "content",
        }],
      },
      collection: { list: { elementId: "list", collectionId: "col-1", itemVar: "item" } },
    };
    const page = { id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0, blocks: heading("h", "{{title}}") };

    expect(projectDataFromRows({ name: "Bella", projectCmsBindings: cmsBindings }, [page], null).cmsBindings)
      .toEqual(cmsBindings);
    // A site saved before the column existed loads with no bindings, not a crash.
    expect(projectDataFromRows({ name: "Bella", projectCmsBindings: null }, [page], null).cmsBindings)
      .toBeUndefined();
  });

  /* Lv3 #10 (dashboard verify pass 3): /share/<token> showed a bound
     element's last-saved text — "Nested", then an empty <p> — because the
     scratch composer had the bindings but no CMS data to resolve them with.
     The rows carry the site's published entries now, and the render resolves
     them through the publish exporter's own CMSExportResolver: text
     semantics (escaped), the first published record for an on-page binding. */
  it("resolves a CMS-bound element from the rows' published entries, as publish does", async () => {
    const cmsBindings = {
      field: {
        h: [{
          binding: { sourceId: "cms:notes", path: "title", type: "variable" },
          collectionId: "notes", fieldSlug: "title", property: "content",
        }],
      },
    };
    const page = { id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0, blocks: heading("h", "Nested") };
    const project = projectDataFromRows({ name: "Bella", projectCmsBindings: cmsBindings }, [page], null);
    const cms = cmsFromRows({
      collections: [{ id: "notes", name: "Notes", slug: "notes", displayField: "title", fields: [{ id: "title", name: "Title", type: "text" }] }],
      entries: [{ id: "e1", collectionId: "notes", data: { title: "Tom & Jerry <3" }, status: "PUBLISHED", updatedAt: "2026-09-26T00:00:00.000Z" }],
    });

    const [resolved] = await renderProjectPages(project, [], cms);
    expect(resolved.html).toContain("Tom &amp; Jerry &lt;3");
    expect(resolved.html).not.toContain("Nested");
  });

  /* A binding whose collection is not in the rows (deleted since) resolves to
     nothing — the snapshot is the whole store, the visitor's own browser CMS
     cache is never read. C0.7 / BD-03: nothing is written as nothing; the
     stored text is the canvas sample, or content since withdrawn. */
  it("writes nothing for a binding the rows cannot resolve, never the stored text", async () => {
    const cmsBindings = {
      field: { h: [{ binding: { sourceId: "cms:gone", path: "title", type: "variable" }, collectionId: "gone", fieldSlug: "title", property: "content" }] },
    };
    const page = { id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0, blocks: heading("h", "Stored") };
    const project = projectDataFromRows({ name: "Bella", projectCmsBindings: cmsBindings }, [page], null);
    const [out] = await renderProjectPages(project, [], cmsFromRows({ collections: [], entries: [] }));
    expect(out.html).not.toContain("Stored");
    expect(out.html).toMatch(/data-buildrick-id="h"[^>]*><\/h2>/);
  });

  /* SA-01 manual check, as a test: a site whose title template (and default
     OG image) only ever reached the project JSON. The editor now reads these
     from the columns alone, so the migration's backfill is what keeps the
     exported <title> as it was — the post-backfill row renders it unchanged. */
  it("exports a JSON-only title template once the backfill has copied it to its column", async () => {
    const page = { id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0, blocks: heading("h", "Hi") };
    const projectSettings = {
      seo: { metaTitleTemplate: "{page_title} — Bella", defaultOgImage: "https://cdn.example.test/og.png" },
    };
    const render = async (columns: Record<string, unknown>) =>
      (await renderProjectPages(projectDataFromRows({ name: "Bella", projectSettings }, [page], columns)))[0].html;

    const before = await render({ name: "Bella", metaTitleTemplate: null, ogImage: null });
    expect(before).toContain("<title>Home</title>");

    const after = await render({
      name: "Bella",
      metaTitleTemplate: "{page_title} — Bella",
      ogImage: "https://cdn.example.test/og.png",
    });
    expect(after).toContain("<title>Home — Bella</title>");
    expect(after).toContain('content="https://cdn.example.test/og.png"');
  });

  /* The /share rows carry Site.name on the site row, not among the columns;
     it is the same column, so it still names the site once the JSON copy of
     seo.siteName is no longer read. */
  it("takes seo.siteName from the site row's name when the columns do not carry it", () => {
    const page = { id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0, blocks: heading("h", "Hi") };
    const rows = { name: "Bella", projectSettings: { seo: { siteName: "Stale JSON name" } } };
    expect(projectDataFromRows(rows, [page], { defaultLocale: "en" }).settings?.seo?.siteName).toBe("Bella");
    expect(projectDataFromRows(rows, [page], null).settings?.seo?.siteName).toBe("Bella");
  });
});
