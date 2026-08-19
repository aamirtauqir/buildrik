/**
 * A page marked Hidden published like any other.
 *
 * Page settings → Advanced offers Live / Hidden / Password and tells the user
 * to "Share this password with visitors who need access". Nothing outside that
 * panel ever read `settings.visibility` — not the exporter, not the publish
 * payload, not the sitemap. One page in the production database is already
 * marked hidden.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";
import { exportPublishPages } from "../../../editor/shell/exportPublishPages";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function siteWith(secretVisibility: string | undefined, homeVisibility?: string) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      { id: "home", name: "Home", slug: "", isHome: true,
        settings: homeVisibility ? { visibility: homeVisibility } : undefined,
        root: { id: "r1", type: "container" as const, tagName: "div", children: [] } },
      { id: "secret", name: "Secret", slug: "secret",
        settings: secretVisibility ? { visibility: secretVisibility } : undefined,
        root: { id: "r2", type: "container" as const, tagName: "div", children: [] } },
    ],
  } as never);
  return composer;
}

const names = async (composer: Composer) =>
  (await new ExportEngine(composer).exportAllPages({ format: "html" })).files.map((f) => f.name);

describe("a page the user hid is not published", () => {
  it("leaves a hidden page out", async () => {
    expect(await names(siteWith("hidden"))).not.toContain("secret.html");
  });

  it("leaves a password page out rather than publishing it unprotected", async () => {
    // Static hosting cannot ask for a password. Failing closed is the lesser
    // mistake: the page the user believes is protected does not go public.
    expect(await names(siteWith("password"))).not.toContain("secret.html");
  });

  it("publishes a page that says nothing about visibility, and one marked live", async () => {
    expect(await names(siteWith(undefined))).toContain("secret.html");
    expect(await names(siteWith("live"))).toContain("secret.html");
  });

  it("keeps the publish payload in step with the export", async () => {
    const paths = (await exportPublishPages(siteWith("hidden"))).map((p) => p.path);
    expect(paths).toEqual(["index.html"]);
  });

  it("still deploys something when every page is non-live", async () => {
    // A deploy with no index.html is broken, which helps nobody.
    const files = await names(siteWith("hidden", "hidden"));
    expect(files).toContain("index.html");
    expect(files).not.toContain("secret.html");
  });
});
