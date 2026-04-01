/**
 * BuildrikSyncProvider tests
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadProject,
  saveProject,
  getSiteIdFromUrl,
  getBuildrikStorageHandlers,
  initBuildrikSync,
} from "../BuildrikSyncProvider";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ result: { data } }),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("loadProject", () => {
  it("assembles ProjectData from sites.get + pages.list responses", async () => {
    const site = { id: "site-1", name: "My Site" };
    const pages = [
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
    ];

    mockFetch
      .mockResolvedValueOnce(jsonResponse(site))
      .mockResolvedValueOnce(jsonResponse(pages));

    const project = await loadProject("site-1");

    expect(project.version).toBe("1.0");
    expect(project.metadata?.name).toBe("My Site");
    expect(project.pages).toHaveLength(2);
    // Sorted by position
    expect(project.pages[0].id).toBe("p1");
    expect(project.pages[0].isHome).toBe(true);
    expect(project.pages[1].id).toBe("p2");

    // Verify fetch calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [sitesCall] = mockFetch.mock.calls[0];
    expect(sitesCall).toContain("/api/trpc/sites.get");
    expect(sitesCall).toContain("site-1");
  });

  it("uses default root when page blocks are null", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "s1", name: "Test" }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "p1",
            name: "Home",
            slug: "/",
            isHomePage: true,
            blocks: null,
            position: 1,
          },
        ])
      );

    const project = await loadProject("s1");
    expect(project.pages[0].root).toEqual({
      id: "root",
      type: "container",
      children: [],
    });
  });

  it("redirects to /auth/login on 401", async () => {
    const originalLocation = window.location;
    const mockLocation = { ...originalLocation, href: "" };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(loadProject("site-1")).rejects.toThrow("AUTH_EXPIRED");
    expect(mockLocation.href).toBe("/auth/login");

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("throws on non-401 API errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    await expect(loadProject("site-1")).rejects.toThrow("API_ERROR_500");
  });
});

describe("saveProject", () => {
  it("POSTs projectData to sites.saveProject with credentials", async () => {
    const projectData = {
      version: "1.0" as const,
      pages: [],
      styles: [],
      assets: [],
      metadata: { name: "Test" },
    };
    const saveResponse = { success: true, savedAt: "2026-04-01T00:00:00Z" };

    mockFetch.mockResolvedValueOnce(jsonResponse(saveResponse));

    const result = await saveProject("site-1", projectData);

    expect(result.success).toBe(true);
    expect(result.savedAt).toBe("2026-04-01T00:00:00Z");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/trpc/sites.saveProject");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(JSON.parse(options.body)).toEqual({
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
    const site = { id: "s1", name: "Test" };
    const pages = [
      { id: "p1", name: "Home", slug: "/", isHomePage: true, blocks: null, position: 1 },
    ];
    mockFetch
      .mockResolvedValueOnce(jsonResponse(site))
      .mockResolvedValueOnce(jsonResponse(pages));

    const handlers = getBuildrikStorageHandlers("s1");
    const data = await handlers.load();
    expect(data?.metadata?.name).toBe("Test");
  });
});

describe("initBuildrikSync", () => {
  it("loads project into composer and sets up auto-save listener", async () => {
    const site = { id: "s1", name: "Sync Test" };
    const pages = [
      { id: "p1", name: "Home", slug: "/", isHomePage: true, blocks: null, position: 1 },
    ];
    mockFetch
      .mockResolvedValueOnce(jsonResponse(site))
      .mockResolvedValueOnce(jsonResponse(pages));

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
