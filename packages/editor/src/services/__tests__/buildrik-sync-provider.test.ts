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
};

vi.mock("@buildrik/shared", () => ({
  createBuildrikApiClient: () => ({
    sites: {
      get: { query: (...args: any[]) => mocks.sitesGetQuery(...args) },
      saveProject: { mutate: (...args: any[]) => mocks.saveProjectMutate(...args) },
    },
    pages: {
      list: { query: (...args: any[]) => mocks.pagesListQuery(...args) },
    },
  }),
}));

import {
  loadProject,
  saveProject,
  getSiteIdFromUrl,
  getBuildrikStorageHandlers,
  initBuildrikSync,
} from "../BuildrikSyncProvider";

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
  it("calls sites.saveProject.mutate with siteId and projectData", async () => {
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
    };

    await initBuildrikSync(mockComposer, "s1");

    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
    expect(mockComposer.importProject.mock.calls[0][0].metadata?.name).toBe("Sync Test");
    expect(mockComposer.on).toHaveBeenCalledWith("project:changed", expect.any(Function));
  });
});
