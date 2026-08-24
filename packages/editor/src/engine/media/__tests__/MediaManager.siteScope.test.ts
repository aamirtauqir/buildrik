/**
 * The media library belongs to ONE site.
 *
 * It did not. `MediaManager` and its IndexedDB store carried no site at all,
 * and `useComposerInit` scoped only `versions` and `components` — so every site
 * opened in the same browser shared one library. Walked live on 2026-08-24
 * against two real sites: the second was created seconds earlier and had never
 * been uploaded to, and its Media drawer listed the first site's
 * `Aalv-renamed.png`.
 *
 * The remedy is deliberately NOT `ComponentStorage`'s projectId index, which
 * buckets pre-existing rows under "default" and never reads them again. A media
 * asset can be local-only — uploaded offline, never mirrored — so hiding
 * unscoped rows would take away media that cannot be recovered. They stay
 * visible; everything written from here on carries a site.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../MediaOptimizer", () => ({
  MediaOptimizer: class {
    async checkFormatSupport() {
      return { webp: true, avif: true, jpeg: true, png: true };
    }
  },
  formatBytes: () => "0 B",
  getCompressionSavings: () => 0,
}));

import { MediaManager } from "../MediaManager";
import type { MediaAsset } from "@/shared/types/media";
import { MEDIA_EVENTS } from "@/shared/constants/media";

const asset = (id: string, siteId?: string): MediaAsset =>
  ({
    id,
    type: "image",
    name: id,
    originalName: `${id}.png`,
    src: `https://cdn.test/${id}.png`,
    mimeType: "image/png",
    size: 10,
    tags: [],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    assetSource: "uploaded",
    ...(siteId ? { siteId } : {}),
  }) as MediaAsset;

/* eslint-disable @typescript-eslint/no-explicit-any */
const folder = (id: string, siteId?: string) => ({
  id,
  name: id,
  parentId: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  ...(siteId ? { siteId } : {}),
});

function makeManager(stored: MediaAsset[], folders: ReturnType<typeof folder>[] = []) {
  const m = new MediaManager();
  const saved: MediaAsset[] = [];
  const savedFolders: any[] = [];
  (m as any).storage.getAllAssets = vi.fn(async () => stored.map((a) => ({ ...a })));
  (m as any).storage.getAllFolders = vi.fn(async () => folders.map((f) => ({ ...f })));
  (m as any).storage.saveFolder = vi.fn(async (f: any) => {
    savedFolders.push(f);
  });
  (m as any).storage.getBlob = vi.fn(async () => null);
  (m as any).storage.saveAsset = vi.fn(async (a: MediaAsset) => {
    saved.push(a);
  });
  (m as any).initialized = true;
  return { m, saved, savedFolders };
}

describe("MediaManager — the library belongs to one site", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hides another site's assets once scoped", async () => {
    const { m } = makeManager([asset("a", "site-A"), asset("b", "site-B")]);
    await m.setProjectId("site-B");
    expect(m.getAssets().map((x) => x.id)).toEqual(["b"]);
  });

  /* The live reproduction: a site that has never been uploaded to must not
     inherit whatever the browser happens to be holding. */
  it("leaves a brand-new site empty rather than showing the last one's library", async () => {
    const { m } = makeManager([asset("a", "site-A")]);
    await m.setProjectId("site-NEW");
    expect(m.getAssets()).toEqual([]);
  });

  /* Rows written before scoping may be local-only. Hiding them would be a loss
     the user cannot undo, so they survive everywhere. */
  it("keeps rows that predate scoping visible", async () => {
    const { m } = makeManager([asset("legacy"), asset("b", "site-B")]);
    await m.setProjectId("site-B");
    expect(m.getAssets().map((x) => x.id).sort()).toEqual(["b", "legacy"]);
  });

  it("shows everything when there is no site at all — the standalone demo", async () => {
    const { m } = makeManager([asset("a", "site-A"), asset("legacy")]);
    await (m as any).loadFromStorage();
    expect(m.getAssets()).toHaveLength(2);
  });

  /* One door to `saveAsset`, so a new upload, an edit and a server import all
     carry the site without six chances to forget. */
  it("stamps the site on every write", async () => {
    const { m, saved } = makeManager([]);
    await m.setProjectId("site-B");
    await (m as any).persist(asset("fresh"));
    expect(saved[0].siteId).toBe("site-B");
  });

  it("adopts a legacy row into the site that edits it", async () => {
    const { m, saved } = makeManager([]);
    await m.setProjectId("site-B");
    await (m as any).persist(asset("legacy"));
    expect(saved[0].siteId).toBe("site-B");
  });

  it("re-reads when the site changes, not only on first scope", async () => {
    const { m } = makeManager([asset("a", "site-A"), asset("b", "site-B")]);
    await m.setProjectId("site-A");
    expect(m.getAssets().map((x) => x.id)).toEqual(["a"]);
    await m.setProjectId("site-B");
    expect(m.getAssets().map((x) => x.id)).toEqual(["b"]);
  });
});

describe("MediaManager — folders belong to one site too", () => {
  beforeEach(() => vi.clearAllMocks());

  /* Scoping assets but not folders does not half-fix the bleed, it moves it:
     site B still lists site A's folders, and dropping an asset into one writes
     across sites. (Codex review.) */
  it("hides another site's folders", async () => {
    const { m } = makeManager([], [folder("brand", "site-A"), folder("icons", "site-B")]);
    await m.setProjectId("site-B");
    expect(m.getAllFolders().map((f) => f.id)).toEqual(["icons"]);
  });

  it("keeps folders that predate scoping visible", async () => {
    const { m } = makeManager([], [folder("legacy"), folder("icons", "site-B")]);
    await m.setProjectId("site-B");
    expect(m.getAllFolders().map((f) => f.id).sort()).toEqual(["icons", "legacy"]);
  });

  it("stamps the site on every folder write", async () => {
    const { m, savedFolders } = makeManager([], []);
    await m.setProjectId("site-B");
    await (m as any).persistFolder(folder("fresh"));
    expect(savedFolders[0].siteId).toBe("site-B");
  });
});

describe("MediaManager — scoping has to be announced", () => {
  beforeEach(() => vi.clearAllMocks());

  /* `useLibraryState` snapshots getAssets() on mount and re-reads on
     INITIALIZED / MEDIA_* / folder events. A silent reload left a drawer that
     had already mounted showing the pre-scope global library for the rest of
     the session — and the live probe missed it by navigating fresh each time,
     which mounts the drawer after scoping. */
  it("emits so an already-mounted panel re-reads", async () => {
    const { m } = makeManager([asset("a", "site-A"), asset("b", "site-B")]);
    const heard: string[] = [];
    m.on(MEDIA_EVENTS.INITIALIZED, () => heard.push("initialized"));
    await m.setProjectId("site-B");
    expect(heard).toEqual(["initialized"]);
  });

  it("says nothing when the site has not actually changed", async () => {
    const { m } = makeManager([]);
    await m.setProjectId("site-B");
    const heard: string[] = [];
    m.on(MEDIA_EVENTS.INITIALIZED, () => heard.push("initialized"));
    await m.setProjectId("site-B");
    expect(heard).toEqual([]);
  });
});

describe("MediaManager — a filtered-out asset still gets its blob URL repaired", () => {
  beforeEach(() => vi.clearAllMocks());

  /* A page in THIS site may still point at an asset that now belongs to
     another — inserted back when the library was global. Skipping it in the
     remap means its blob: URL is never rebuilt, the image breaks, and the
     drawer no longer lists it to recover. (Codex review.) */
  it("rebuilds blob URLs across every row, not just the scoped ones", async () => {
    const leaked = { ...asset("leaked", "site-A"), src: "blob:dead-url" } as MediaAsset;
    const { m } = makeManager([leaked, asset("b", "site-B")]);
    (m as any).storage.getBlob = vi.fn(async () => new Blob(["x"]));
    const remaps: unknown[] = [];
    m.on(MEDIA_EVENTS.LOCAL_URLS_REBUILT, (p) => remaps.push(p));
    await m.setProjectId("site-B");
    expect(m.getAssets().map((x) => x.id)).toEqual(["b"]);
    expect(remaps).toHaveLength(1);
  });
});
