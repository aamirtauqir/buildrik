/**
 * BuildrikSyncProvider tests
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock must use inline functions (no external refs) to avoid hoisting issues
const mocks = {
  sitesGetQuery: vi.fn(),
  pagesListQuery: vi.fn(),
  saveProjectMutate: vi.fn(),
  siteDetailSettingsGetQuery: vi.fn().mockResolvedValue(null),
  siteDetailSettingsUpdateMutate: vi.fn().mockResolvedValue({ success: true }),
  mediaListAssetsQuery: vi.fn(),
  mediaListFoldersQuery: vi.fn(),
};

vi.mock("../api-client", () => ({
  createBuildrikApiClient: () => ({
    sites: {
      get: { query: (...args: any[]) => mocks.sitesGetQuery(...args) },
      saveProject: { mutate: (...args: any[]) => mocks.saveProjectMutate(...args) },
    },
    pages: {
      list: { query: (...args: any[]) => mocks.pagesListQuery(...args) },
    },
    siteDetail: {
      settings: {
        get: { query: (...args: any[]) => mocks.siteDetailSettingsGetQuery(...args) },
        update: { mutate: (...args: any[]) => mocks.siteDetailSettingsUpdateMutate(...args) },
      },
    },
    media: {
      listAssets: { query: (...args: any[]) => mocks.mediaListAssetsQuery(...args) },
      listFolders: { query: (...args: any[]) => mocks.mediaListFoldersQuery(...args) },
    },
  }),
}));

import {
  loadProject,
  saveProject,
  loadServerMedia,
  getSiteIdFromUrl,
  getBuildrikStorageHandlers,
  getEditorPlanTier,
  initBuildrikSync,
  setBaselineLastEditedAt,
  SaveConflictError,
  ProjectNotLoadedError,
  SAVE_CONFLICT_EVENT,
} from "../BuildrikSyncProvider";

/* saveProject refuses a site whose project never loaded — the guard that stops
   a failed load from overwriting the stored pages with the fallback. Save
   tests have to satisfy the same precondition the editor does. */
async function loadedSite(id: string) {
  mocks.sitesGetQuery.mockResolvedValue({ id, name: "T" });
  mocks.pagesListQuery.mockResolvedValue([]);
  await loadProject(id);
}

beforeEach(() => {
  mocks.sitesGetQuery.mockReset();
  mocks.pagesListQuery.mockReset();
  mocks.saveProjectMutate.mockReset();
});

describe("loadProject", () => {
  it("assembles ProjectData from sites.get + pages.list responses", async () => {
    mocks.sitesGetQuery.mockResolvedValue({ id: "site-1", name: "My Site" });
    mocks.pagesListQuery.mockResolvedValue([
      {
        id: "p2",
        name: "About",
        slug: "about",
        isHomePage: false,
        blocks: { id: "root-2", type: "container", children: [] },
        position: 2,
      },
      {
        id: "p1",
        name: "Home",
        slug: "/",
        isHomePage: true,
        blocks: { id: "root-1", type: "container", children: [] },
        position: 1,
      },
    ]);

    const project = await loadProject("site-1");

    expect(project.version).toBe("1.0");
    expect(project.metadata?.name).toBe("My Site");
    expect(project.pages).toHaveLength(2);
    // Sorted by position
    expect(project.pages[0].id).toBe("p1");
    expect(project.pages[0].isHome).toBe(true);
    expect(project.pages[1].id).toBe("p2");

    expect(mocks.sitesGetQuery).toHaveBeenCalledWith({ id: "site-1" });
    expect(mocks.pagesListQuery).toHaveBeenCalledWith({ siteId: "site-1" });
  });

  it("uses default root when page blocks are null", async () => {
    mocks.sitesGetQuery.mockResolvedValue({ id: "s1", name: "Test" });
    mocks.pagesListQuery.mockResolvedValue([
      {
        id: "p1",
        name: "Home",
        slug: "/",
        isHomePage: true,
        blocks: null,
        position: 1,
      },
    ]);

    const project = await loadProject("s1");
    expect(project.pages[0].root).toEqual({
      id: "root",
      type: "container",
      children: [],
    });
  });

  it("throws when sites.get fails", async () => {
    mocks.sitesGetQuery.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(loadProject("bad-id")).rejects.toThrow("NOT_FOUND");
  });
});

describe("saveProject", () => {
  it("refuses a site whose project never loaded, before any request goes out", async () => {
    /* The wipe this prevents, reproduced on a scratch site: block the load
       once, insert one element, and the 2-page site came back as a single
       "Page 1" — `saveProjectData` treats a full snapshot as authoritative and
       deletes the pages the payload omits. `projectHasContent` cannot catch it;
       the fallback project has a child, so it counts as content. */
    await expect(
      saveProject("never-loaded", {
        version: "1.0" as const, pages: [], styles: [], assets: [], metadata: { name: "X" },
      }),
    ).rejects.toBeInstanceOf(ProjectNotLoadedError);
    expect(mocks.saveProjectMutate).not.toHaveBeenCalled();
  });

  it("calls sites.saveProject.mutate with siteId and projectData", async () => {
    await loadedSite("site-1");
    const projectData = {
      version: "1.0" as const,
      pages: [],
      styles: [],
      assets: [],
      metadata: { name: "Test" },
    };
    const saveResponse = { success: true, savedAt: new Date("2026-04-01") };
    mocks.saveProjectMutate.mockResolvedValue(saveResponse);

    const result = await saveProject("site-1", projectData);

    expect(result.success).toBe(true);
    expect(mocks.saveProjectMutate).toHaveBeenCalledWith({
      siteId: "site-1",
      projectData,
      // 61-conflict: the optimistic-concurrency token rides along (null until a
      // project has been loaded/saved in this session).
      expectedLastEditedAt: null,
    });
  });
});

describe("getSiteIdFromUrl", () => {
  it("extracts siteId from query params", () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?siteId=abc-123" },
      writable: true,
    });

    expect(getSiteIdFromUrl()).toBe("abc-123");

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("returns null if no siteId", () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
    });

    expect(getSiteIdFromUrl()).toBeNull();

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });
});

describe("getBuildrikStorageHandlers", () => {
  it("returns load/save handlers bound to siteId", async () => {
    mocks.sitesGetQuery.mockResolvedValue({ id: "s1", name: "Test" });
    mocks.pagesListQuery.mockResolvedValue([
      { id: "p1", name: "Home", slug: "/", isHomePage: true, blocks: null, position: 1 },
    ]);

    const handlers = getBuildrikStorageHandlers("s1");
    const data = await handlers.load();
    expect(data?.metadata?.name).toBe("Test");
  });
});

describe("initBuildrikSync", () => {
  it("loads project into composer and sets up auto-save listener", async () => {
    mocks.sitesGetQuery.mockResolvedValue({ id: "s1", name: "Sync Test" });
    mocks.pagesListQuery.mockResolvedValue([
      { id: "p1", name: "Home", slug: "/", isHomePage: true, blocks: null, position: 1 },
    ]);

    const mockComposer = {
      importProject: vi.fn(),
      exportProject: vi.fn().mockReturnValue({ version: "1.0", pages: [], styles: [], assets: [] }),
      on: vi.fn(),
      emit: vi.fn(),
    };

    await initBuildrikSync(mockComposer, "s1");

    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
    expect(mockComposer.importProject.mock.calls[0][0].metadata?.name).toBe("Sync Test");
    expect(mockComposer.on).toHaveBeenCalledWith("project:changed", expect.any(Function));
  });
});

describe("getSiteIdFromUrl — /edit/<id> path variants", () => {
  it("extracts the id from the unified-editor /edit/<id> path", () => {
    window.history.replaceState({}, "", "/edit/abc-123");
    expect(getSiteIdFromUrl()).toBe("abc-123");
  });

  it("decodes a percent-encoded path id", () => {
    window.history.replaceState({}, "", "/edit/site%20one");
    expect(getSiteIdFromUrl()).toBe("site one");
  });

  it("stops the id at / ? and # boundaries", () => {
    window.history.replaceState({}, "", "/edit/abc/extra?x=1#frag");
    expect(getSiteIdFromUrl()).toBe("abc");
  });

  it("prefers the /edit/ path over a conflicting ?siteId=", () => {
    window.history.replaceState({}, "", "/edit/path-wins?siteId=query-loses");
    expect(getSiteIdFromUrl()).toBe("path-wins");
  });

  it("is ANCHORED: a nested /app/edit/<id> path does NOT match (unlike ReviewService.currentSiteId)", () => {
    window.history.replaceState({}, "", "/app/edit/nested-1");
    expect(getSiteIdFromUrl()).toBeNull();
  });

  it("returns null outside the editor", () => {
    window.history.replaceState({}, "", "/dashboard");
    expect(getSiteIdFromUrl()).toBeNull();
  });
});

describe("plan-tier mapping (dashboard plan → editor tier)", () => {
  const loadWithPlan = async (plan: unknown) => {
    mocks.sitesGetQuery.mockResolvedValue({ id: "s1", name: "T" });
    mocks.pagesListQuery.mockResolvedValue([]);
    mocks.siteDetailSettingsGetQuery.mockResolvedValueOnce(plan === undefined ? null : { plan });
    await loadProject("s1");
  };

  it("maps PRO → pro", async () => {
    await loadWithPlan("PRO");
    expect(getEditorPlanTier()).toBe("pro");
  });

  it("maps BUSINESS → enterprise", async () => {
    await loadWithPlan("BUSINESS");
    expect(getEditorPlanTier()).toBe("enterprise");
  });

  it("maps FREE → starter", async () => {
    await loadWithPlan("FREE");
    expect(getEditorPlanTier()).toBe("starter");
  });

  it("defaults to starter when settings are unavailable (auth fail / offline)", async () => {
    // First force a non-starter tier so the fallback is observable.
    await loadWithPlan("PRO");
    await loadWithPlan(undefined); // settings.get resolved null
    expect(getEditorPlanTier()).toBe("starter");
  });

  it("defaults to starter for an unknown plan value", async () => {
    await loadWithPlan("ULTIMATE");
    expect(getEditorPlanTier()).toBe("starter");
  });
});

describe("save-conflict parsing (61-conflict)", () => {
  const PROJECT = {
    version: "1.0" as const,
    pages: [],
    styles: [],
    assets: [],
    metadata: { name: "X" },
  };

  beforeEach(async () => {
    await loadedSite("s1");
    setBaselineLastEditedAt(null);
    mocks.siteDetailSettingsUpdateMutate.mockClear();
  });

  it("translates a SAVE_CONFLICT:<iso> rejection into a typed SaveConflictError carrying the server token", async () => {
    mocks.saveProjectMutate.mockRejectedValue(
      new Error("SAVE_CONFLICT:2026-07-01T10:00:00.000Z")
    );

    await expect(saveProject("s1", PROJECT)).rejects.toThrow(SaveConflictError);
    await expect(saveProject("s1", PROJECT)).rejects.toMatchObject({
      name: "SaveConflictError",
      serverLastEditedAt: "2026-07-01T10:00:00.000Z",
    });
  });

  it("dispatches the buildrik:save-conflict window event so BOTH manual save + autosave surface the dialog", async () => {
    mocks.saveProjectMutate.mockRejectedValue(
      new Error("SAVE_CONFLICT:2026-07-01T10:00:00.000Z")
    );
    const heard: string[] = [];
    const listener = (e: Event) =>
      heard.push((e as CustomEvent<{ serverLastEditedAt: string }>).detail.serverLastEditedAt);
    window.addEventListener(SAVE_CONFLICT_EVENT, listener);

    await expect(saveProject("s1", PROJECT)).rejects.toThrow("SAVE_CONFLICT");
    expect(heard).toEqual(["2026-07-01T10:00:00.000Z"]);

    window.removeEventListener(SAVE_CONFLICT_EVENT, listener);
  });

  it("rethrows a NON-conflict failure untranslated (generic save-failed path)", async () => {
    mocks.saveProjectMutate.mockRejectedValue(new Error("INTERNAL_SERVER_ERROR"));
    const listener = vi.fn();
    window.addEventListener(SAVE_CONFLICT_EVENT, listener);

    await expect(saveProject("s1", PROJECT)).rejects.toThrow("INTERNAL_SERVER_ERROR");
    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(SAVE_CONFLICT_EVENT, listener);
  });

  it("sends the load-time lastEditedAt as expectedLastEditedAt, then advances the baseline after a save", async () => {
    mocks.sitesGetQuery.mockResolvedValue({
      id: "s1",
      name: "T",
      lastEditedAt: "2026-06-30T12:00:00.000Z",
    });
    mocks.pagesListQuery.mockResolvedValue([]);
    await loadProject("s1");

    mocks.saveProjectMutate.mockResolvedValue({
      success: true,
      savedAt: new Date("2026-07-02T00:00:00.000Z"),
    });
    await saveProject("s1", PROJECT);
    expect(mocks.saveProjectMutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ expectedLastEditedAt: "2026-06-30T12:00:00.000Z" })
    );

    // Baseline advanced to the server's savedAt — the editor's own next save
    // must not be flagged as a conflict.
    await saveProject("s1", PROJECT);
    expect(mocks.saveProjectMutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ expectedLastEditedAt: "2026-07-02T00:00:00.000Z" })
    );
  });

  it("setBaselineLastEditedAt forces the token (the 'Overwrite' escape hatch)", async () => {
    setBaselineLastEditedAt("2026-07-05T09:00:00.000Z");
    mocks.saveProjectMutate.mockResolvedValue({ success: true, savedAt: new Date() });

    await saveProject("s1", PROJECT);
    expect(mocks.saveProjectMutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ expectedLastEditedAt: "2026-07-05T09:00:00.000Z" })
    );
  });
});

describe("saveProject dual-save routing (P0.2b)", () => {
  beforeEach(async () => {
    await loadedSite("s1");
    setBaselineLastEditedAt(null);
    mocks.saveProjectMutate.mockResolvedValue({ success: true, savedAt: new Date() });
    mocks.siteDetailSettingsUpdateMutate.mockClear().mockResolvedValue({ success: true });
  });

  it("routes Site-column fields to siteDetail.settings.update alongside the project save", async () => {
    await saveProject("s1", {
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
      settings: {
        seo: { metaTitle: "My Title", metaDescription: "Desc" },
        customCode: { headScripts: "<script>h()</script>", bodyScripts: "", globalCss: "" },
      },
    } as any);

    expect(mocks.siteDetailSettingsUpdateMutate).toHaveBeenCalledWith({
      id: "s1",
      metaTitle: "My Title",
      metaDescription: "Desc",
      headCode: "<script>h()</script>",
      bodyCode: "",
    });
    expect(mocks.saveProjectMutate).toHaveBeenCalledTimes(1);
  });

  it("skips the settings call entirely when no mirrored fields are present", async () => {
    await saveProject("s1", {
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
      metadata: { name: "No settings" },
    } as any);

    expect(mocks.siteDetailSettingsUpdateMutate).not.toHaveBeenCalled();
    expect(mocks.saveProjectMutate).toHaveBeenCalledTimes(1);
  });
});

describe("loadServerMedia (Phase B3 — additive hydration)", () => {
  beforeEach(() => {
    mocks.mediaListAssetsQuery.mockReset();
    mocks.mediaListFoldersQuery.mockReset();
  });

  it("pulls a 200-capped working set of assets + folders for the site", async () => {
    const asset = {
      id: "a1", url: "https://cdn/a.png", bytes: 10, type: "image", mimeType: "image/png",
      filename: "a.png", altText: null, folderId: null, createdAt: "2026-07-01", updatedAt: "2026-07-01",
    };
    const folder = { id: "f1", name: "Brand", parentId: null, createdAt: "2026-07-01", updatedAt: "2026-07-01" };
    mocks.mediaListAssetsQuery.mockResolvedValue({ items: [asset], nextCursor: null });
    mocks.mediaListFoldersQuery.mockResolvedValue([folder]);

    const result = await loadServerMedia("s1");

    expect(mocks.mediaListAssetsQuery).toHaveBeenCalledWith({ siteId: "s1", limit: 200 });
    expect(mocks.mediaListFoldersQuery).toHaveBeenCalledWith({ siteId: "s1" });
    expect(result).toEqual({ assets: [asset], folders: [folder] });
  });

  it("returns null on any RPC failure (offline/unauthenticated) — caller falls back to engine state", async () => {
    mocks.mediaListAssetsQuery.mockRejectedValue(new Error("UNAUTHORIZED"));
    mocks.mediaListFoldersQuery.mockResolvedValue([]);
    await expect(loadServerMedia("s1")).resolves.toBeNull();
  });
});

describe("loadProject styles filtering (legacy token entries)", () => {
  it("keeps only rules with a non-empty selector, dropping legacy design-token rows", async () => {
    const validRule = { id: "r1", selector: ".hero", properties: { color: "#000" } };
    mocks.sitesGetQuery.mockResolvedValue({
      id: "s1",
      name: "T",
      projectStyles: [
        validRule,
        { id: "tok-1", kind: "token", cssVar: "--brand" }, // legacy token row — no selector
        { id: "r2", selector: "" }, // empty selector
        null, // corrupt row
      ],
    });
    mocks.pagesListQuery.mockResolvedValue([]);

    const project = await loadProject("s1");
    expect(project.styles).toEqual([validRule]);
  });
});
