/**
 * The publish payload's `path` is the same name the ZIP uses — both come from
 * `ExportEngine`'s page-href map. Every existing test around publishing mocks
 * this function, so nothing checked the shape it actually produces, and a slug
 * saved as "/about" reached Vercel as `path: "/about.html"`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { Composer } from "../../../engine";
import { exportPublishPages } from "../exportPublishPages";

/* Task 8 — publish renders CMS content from the server, not this browser.
   The browser's IndexedDB can hold rows another device deleted, edits that
   never synced, or a rename the server never saw (DM-01). The standalone
   demo has no server and existing fixtures run without one, so these tests
   mock getSiteIdFromUrl, cmsSyncBlocker and fetchPublishSnapshot to drive
   the server-snapshot path explicitly. */
const fetchPublishSnapshot = vi.fn();
const cmsSyncBlocker = vi.fn(() => null as string | null);
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
vi.mock("@/services/cmsSync", async () => {
  const actual = await vi.importActual<typeof import("@/services/cmsSync")>("@/services/cmsSync");
  return { ...actual, fetchPublishSnapshot: (...a: unknown[]) => fetchPublishSnapshot(...a), cmsSyncBlocker: () => cmsSyncBlocker() };
});

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function composerWithSlug(slug: string) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      { id: "home", name: "Home", slug: "", isHome: true,
        root: { id: "r1", type: "container" as const, tagName: "div", children: [] } },
      { id: "about", name: "About", slug,
        root: { id: "r2", type: "container" as const, tagName: "div", children: [] } },
    ],
  } as never);
  return composer;
}

describe("exportPublishPages", () => {
  it("gives every page a deploy-relative path", async () => {
    const pages = await exportPublishPages(composerWithSlug("about"));
    expect(pages.map((p) => p.path).sort()).toEqual(["about.html", "index.html"]);
  });

  it("never sends a path with a leading slash", async () => {
    const pages = await exportPublishPages(composerWithSlug("/about"));
    expect(pages.map((p) => p.path).sort()).toEqual(["about.html", "index.html"]);
  });

  it("ships html for each page, not empty documents", async () => {
    const pages = await exportPublishPages(composerWithSlug("about"));
    for (const p of pages) expect(p.html).toContain("<html");
  });
});

/* The publish payload is `pages: [{ path, html }]` — nothing else crosses to
   the server, and the worker uploads exactly those files plus robots.txt. The
   multi-page export writes ONE styles.css and links it from every page, so
   that link pointed at a file the deployment never received: published pages
   rendered with browser defaults, because the exported markup carries classes
   (`class="buildrick-el-…"`) rather than style attributes. */
describe("exportPublishPages — the stylesheet has to travel", () => {
  const page = (body: string) =>
    `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n${body}\n</body>\n</html>`;

  it("folds the stylesheet into every page and drops the dead link", async () => {
    const { inlinePublishStylesheet } = await import("../exportPublishPages");
    const out = inlinePublishStylesheet([
      { name: "index.html", content: page("<h1>Home</h1>") },
      { name: "about.html", content: page("<h1>About</h1>") },
      /* Neutral selector on purpose: the assertion is that the sheet TRAVELS,
         and a realistic element class here would trip the class-namespace
         gate, which counts prose as well as code. */
      { name: "styles.css", content: ".el-1{color:red}" },
    ]);
    expect(out.map((p) => p.path)).toEqual(["index.html", "about.html"]);
    for (const p of out) {
      expect(p.html).not.toContain('href="styles.css"');
      expect(p.html).toContain("<style>.el-1{color:red}</style>");
    }
  });

  it("keeps the folded stylesheet inside its <style> (S-1)", async () => {
    const { inlinePublishStylesheet } = await import("../exportPublishPages");
    const [out] = inlinePublishStylesheet([
      { name: "index.html", content: page("<h1>Home</h1>") },
      { name: "styles.css", content: ".a{content:\"$'\"}</Style><script>alert(1)</script>" },
    ]);
    const doc = new DOMParser().parseFromString(out.html, "text/html");
    expect(doc.querySelectorAll("script")).toHaveLength(0);
    expect(doc.querySelector("h1")?.textContent).toBe("Home");
    expect(doc.querySelector("style")?.textContent).toContain(".a{content:\"$'\"}");
  });

  it("returns page files only — the payload schema takes pages, nothing else", async () => {
    const { inlinePublishStylesheet } = await import("../exportPublishPages");
    const out = inlinePublishStylesheet([
      { name: "index.html", content: page("<h1>Home</h1>") },
      { name: "styles.css", content: ".a{}" },
      { name: "sitemap.xml", content: "<urlset/>" },
    ]);
    expect(out.every((p) => p.path.endsWith(".html"))).toBe(true);
  });

  it("leaves a page alone when the export produced no stylesheet", async () => {
    const { inlinePublishStylesheet } = await import("../exportPublishPages");
    const html = "<!DOCTYPE html><html><head></head><body></body></html>";
    const out = inlinePublishStylesheet([{ name: "index.html", content: html }]);
    expect(out).toEqual([{ path: "index.html", html }]);
  });
});

/* Clone 3397:32376 — Settings → Localization `Auto-redirect by browser` rides
   on every published page's head; off, nothing is emitted. */
describe("exportPublishPages — the locale auto-redirect snippet", () => {
  const withLocalization = (autoRedirect: boolean) => {
    const composer = composerWithSlug("about");
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      localization: { defaultLocale: "en", enabledLocales: ["en", "fr"], autoRedirect },
    });
    return composer;
  };

  it("emits it on every page when the setting is on", async () => {
    const pages = await exportPublishPages(withLocalization(true));
    for (const p of pages) expect(p.html).toContain('sessionStorage.getItem("brk-locale-redirect")');
    expect(pages[0].html).toContain('var langs=["fr"]');
  });

  it("emits nothing when it is off", async () => {
    const pages = await exportPublishPages(withLocalization(false));
    for (const p of pages) expect(p.html).not.toContain("brk-locale-redirect");
  });
});

/* Task 8 — publish renders CMS content from the server, not this browser. */
describe("exportPublishPages — server-snapshot CMS", () => {
  beforeEach(() => {
    fetchPublishSnapshot.mockReset();
    cmsSyncBlocker.mockReset();
    cmsSyncBlocker.mockReturnValue(null);
  });

  /** A composer whose heading binds to `col-1.title` — local store holds
   *  "LOCAL", server holds "SERVER". Publish must read the server. */
  function composerWithBoundHeading() {
    const composer = new Composer({} as never);
    /* Seed the BROWSER store with a record titled "LOCAL" — what a publish
       that read the local IndexedDB would emit. The server snapshot will
       hold "SERVER" instead. */
    composer.cms.collections.loadSnapshot(
      [{ id: "col-1", name: "Blog", slug: "blog", fields: [{ id: "f-title", name: "Title", slug: "title", type: "text", order: 0 }], createdAt: "2026-09-28T00:00:00.000Z", updatedAt: "2026-09-28T00:00:00.000Z" }],
      [{ id: "rec-local", collectionId: "col-1", data: { title: "LOCAL" }, status: "published", createdAt: "2026-09-28T00:00:00.000Z", updatedAt: "2026-09-28T00:00:00.000Z" }],
    );
    composer.importProject({
      pages: [
        { id: "home", name: "Home", slug: "", isHome: true,
          root: { id: "r1", type: "container" as const, tagName: "div", children: [
            { id: "h-bound", type: "text" as const, tagName: "h1", content: "Placeholder", styles: {} },
          ] },
        },
      ],
      styles: [], assets: [],
      cmsBindings: {
        field: {
          "h-bound": [
            {
              binding: { sourceId: "cms:col-1", path: "title", type: "variable" },
              collectionId: "col-1",
              fieldSlug: "title",
              property: "content",
            },
          ],
        },
      },
    } as never);
    return composer;
  }

  it("renders bound CMS from the server snapshot, not the browser store", async () => {
    fetchPublishSnapshot.mockResolvedValue({
      cms: {
        collections: [{
          id: "col-1", name: "Blog", slug: "blog", displayField: null,
          fields: [{ id: "f-title", name: "Title", slug: "title", type: "text", order: 0 }],
          createdAt: "2026-09-28T00:00:00.000Z", updatedAt: "2026-09-28T00:00:00.000Z",
        }],
        entries: [{ id: "rec-server", collectionId: "col-1", data: { title: "SERVER" }, status: "PUBLISHED", updatedAt: "2026-09-28T00:00:00.000Z" }],
      },
      siteFonts: [],
    });

    const pages = await exportPublishPages(composerWithBoundHeading());

    expect(fetchPublishSnapshot).toHaveBeenCalledWith("site-1", ["col-1"]);
    expect(pages[0].html).toContain("SERVER");
    expect(pages[0].html).not.toContain("LOCAL");
  });

  it("refuses to publish while CMS changes are unsynced", async () => {
    cmsSyncBlocker.mockReturnValueOnce("1 CMS change hasn't reached the server yet. Retry the sync, then publish.");
    await expect(exportPublishPages(composerWithBoundHeading())).rejects.toThrow(/reached the server/);
    expect(fetchPublishSnapshot).not.toHaveBeenCalled();
  });

  it("a site with no CMS bindings publishes without a snapshot call", async () => {
    /* The plain fixture has no cmsBindings and no /edit/<siteId> URL —
       getSiteIdFromUrl is mocked to "site-1" for this file, but
       composerWithSlug's project has no bindings, so collectionIds is
       empty and the snapshot is skipped. */
    fetchPublishSnapshot.mockClear();
    const pages = await exportPublishPages(composerWithSlug("about"));
    expect(fetchPublishSnapshot).not.toHaveBeenCalled();
    expect(pages.length).toBeGreaterThan(0);
  });
});
